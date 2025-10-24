from playwright.async_api import async_playwright, Page, TimeoutError as PlaywrightTimeout
from typing import List, Dict, Optional
import asyncio
import logging
import json
import uuid
from datetime import datetime
from urllib.parse import quote_plus
import traceback
from datetime import datetime, timedelta

from app.db.connect_database import get_db_connection
from app.utils.common import TECH_KEYWORDS
from app.utils.skills_engine import (
    load_all_skills,
    extract_flat_skills,
    extract_skills_by_category
)

LOCATION = "remote"
MAX_DAYS = 5

logger = logging.getLogger(__name__)


def parse_date(raw: str):
    """Parse date string to datetime object"""
    raw = raw.lower()
    if "today" in raw or "just posted" in raw:
        return datetime.today().date()
    try:
        days_ago = int(raw.strip().split()[0])
        return datetime.today().date() - timedelta(days=days_ago)
    except:
        return datetime.today().date()


def is_tech_job(title: str) -> bool:
    """Check if job title contains tech keywords"""
    return any(keyword.lower() in title.lower() for keyword in TECH_KEYWORDS)


def insert_job_to_db(job: dict) -> bool:
    """Insert job with proper field mapping"""
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        logger.info(f"➡️ Inserting: {job['title'][:50]} | {job.get('company', 'N/A')}")
        
        cur.execute("""
            INSERT INTO jobs (
                id, title, company, job_location, job_state, salary, site,
                date, applied, saved, url, job_description, search_term,
                category, priority, status, inserted_at, last_verified,
                skills, skills_by_category, user_id
            ) VALUES (
                %s, %s, %s, %s, %s, %s, %s,
                %s, %s, %s, %s, %s, %s,
                %s, %s, %s, %s, %s,
                %s, %s, %s
            )
            ON CONFLICT (url) DO NOTHING
            RETURNING id
        """, (
            str(uuid.uuid4()),
            job["title"],
            job.get("company", "Unknown"),
            job.get("location", "Remote"),
            job.get("location", "remote").lower(),
            "N/A",
            "Indeed",
            datetime.today().date(),
            False,
            False,
            job["link"],
            job.get("description", ""),
            job.get("search_term", ""),
            None,
            0,
            "new",
            datetime.utcnow(),
            None,
            json.dumps(job.get("skills", [])),
            json.dumps(job.get("skills_by_category", {})),
            None
        ))
        
        result = cur.fetchone()
        conn.commit()
        
        if result:
            logger.info(f"✅ Inserted job ID: {result[0]}")
            return True
        else:
            logger.info(f"⚠️ Duplicate job (skipped): {job['link']}")
            return False
            
    except Exception as e:
        logger.error(f"❌ DB insert error: {e}")
        traceback.print_exc()
        return False
    finally:
        if 'cur' in locals():
            cur.close()
        if 'conn' in locals():
            conn.close()


async def scrape_indeed(keywords=None, location=LOCATION, days=MAX_DAYS, max_results=100):
    """
    Main scraping function using Playwright Async API
    
    Args:
        keywords: List of search keywords
        location: Job location
        days: Number of days back to search
        max_results: Maximum number of results to return
        
    Returns:
        List of job dictionaries
    """
    logger.info("🚀 Starting Indeed scraper with ASYNC API")
    
    if keywords is None:
        keywords = ["software developer", "python developer"]

    all_jobs = []
    inserted_count = 0

    try:
        skills_data = load_all_skills()
        logger.info("✅ Loaded skills data")
    except Exception as e:
        logger.error(f"❌ Error loading skills: {e}")
        skills_data = {"flat": [], "matrix": {}}

    async with async_playwright() as p:
        logger.info("✅ Playwright async context created")
        
        browser = await p.chromium.launch(
            headless=True,
            args=['--no-sandbox', '--disable-setuid-sandbox']
        )
        logger.info("✅ Browser launched")
        
        context = await browser.new_context(
            user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            viewport={'width': 1920, 'height': 1080}
        )
        logger.info("✅ Browser context created")
        
        page = await context.new_page()
        logger.info("✅ New page created")
        
        try:
            for keyword in keywords:
                if len(all_jobs) >= max_results:
                    break

                logger.info(f"🔍 Searching Indeed for '{keyword}' in '{location}'")

                try:
                    jobs = await scrape_indeed_keyword(
                        page, 
                        keyword, 
                        location, 
                        days, 
                        max_results - len(all_jobs), 
                        skills_data
                    )

                    for job in jobs:
                        job["search_term"] = keyword
                        if insert_job_to_db(job):
                            inserted_count += 1
                    
                    all_jobs.extend(jobs)
                    logger.info(f"✅ Found {len(jobs)} jobs for '{keyword}' (Total: {len(all_jobs)}, Inserted: {inserted_count})")

                    if keyword != keywords[-1]:
                        await asyncio.sleep(2)

                except Exception as e:
                    logger.error(f"❌ Error scraping '{keyword}': {e}")
                    traceback.print_exc()
        finally:
            await context.close()
            await browser.close()
            logger.info("✅ Browser closed")
    
    unique_jobs = []
    seen = set()

    for job in all_jobs:
        key = (job.get("title", ""), job.get("company", ""))
        if key not in seen:
            seen.add(key)
            unique_jobs.append(job)

    logger.info(f"📊 Total unique jobs: {len(unique_jobs)}, Inserted to DB: {inserted_count}")
    return unique_jobs[:max_results]


async def scrape_indeed_keyword(
    page: Page, 
    keyword: str, 
    location: str, 
    days: int, 
    max_jobs: int, 
    skills_data: dict
) -> List[Dict]:
    """Scrape Indeed for a single keyword with Playwright Async API"""
    jobs = []
    base_url = "https://www.indeed.com/jobs"
    url = f"{base_url}?q={quote_plus(keyword)}&l={quote_plus(location)}&fromage={days}"
    
    logger.info(f"📄 Loading: {url}")
    
    try:
        await page.goto(url, wait_until="domcontentloaded", timeout=30000)
        
        try:
            await page.wait_for_selector(
                ".job_seen_beacon, .jobCard, [data-testid='job-card']", 
                timeout=15000
            )
        except PlaywrightTimeout:
            logger.warning(f"⚠️ Job listings didn't load for '{keyword}'")
            return []
        
        await asyncio.sleep(2)
        
        selectors = [
            ".job_seen_beacon",
            ".jobCard",
            "[data-testid='job-card']",
            ".slider_item",
            ".tapItem",
            "li.css-5lfssm"
        ]
        
        job_cards = []
        for selector in selectors:
            job_cards = await page.locator(selector).all()
            if job_cards:
                logger.info(f"✅ Found {len(job_cards)} jobs using selector: {selector}")
                break
        
        if not job_cards:
            logger.warning(f"⚠️ No job cards found for '{keyword}'")
            return []
 
        job_data_list = []
        for idx, card in enumerate(job_cards[:max_jobs]):
            try:
                job_info = await extract_job_card_info(card, idx, base_url)
                if job_info:
                    job_data_list.append(job_info)
                    logger.info(f"📝 Job {idx + 1}: {job_info['title'][:40]} at {job_info['company'][:30]}")
            except Exception as e:
                logger.warning(f"❌ Error extracting job card {idx}: {e}")
                continue
        
        for idx, job_info in enumerate(job_data_list):
            try:
                logger.info(f"🔍 Fetching description {idx + 1}/{len(job_data_list)}: {job_info['title'][:40]}")
                description = await fetch_job_description(page, job_info['link'])

                if description and len(description) > 100: 
                    job_info['description'] = description
                    job_info['skills'] = extract_flat_skills(description, skills_data.get("flat", []))
                    job_info['skills_by_category'] = extract_skills_by_category(description, skills_data.get("matrix", {}))
                    logger.info(f"✅ Extracted {len(job_info['skills'])} skills from {len(description)} chars")
                else:
                    logger.warning(f"⚠️ Invalid/empty description for {job_info['title'][:40]}")
                    job_info['description'] = ""
                    job_info['skills'] = []
                    job_info['skills_by_category'] = {}
                
                jobs.append(job_info)
                await asyncio.sleep(1.5)
                
            except Exception as e:
                logger.warning(f"❌ Error fetching description for job {idx}: {e}")
                job_info['description'] = ""
                job_info['skills'] = []
                job_info['skills_by_category'] = {}
                jobs.append(job_info)
                continue
        
    except Exception as e:
        logger.error(f"❌ Error in scrape_indeed_keyword: {e}")
        traceback.print_exc()
    
    return jobs


async def extract_job_card_info(card, idx: int, base_url: str) -> Optional[Dict[str, str]]:
    """Extract basic info from job card (without navigating away)"""
    try:
        title = ""
        title_selectors = [
            "h2.jobTitle span[title]",
            "h2.jobTitle a span",
            ".jobTitle span",
            "[data-testid='job-title']"
        ]
        
        for selector in title_selectors:
            try:
                element = card.locator(selector).first
                count = await element.count()
                if count > 0:
                    title = await element.get_attribute("title") or await element.inner_text()
                    if title:
                        break
            except:
                continue
        
        if not title:
            return None
        
        company = ""
        company_selectors = [
            "[data-testid='company-name']",
            ".companyName",
            "span.companyName"
        ]
        
        for selector in company_selectors:
            try:
                element = card.locator(selector).first
                count = await element.count()
                if count > 0:
                    company = await element.inner_text()
                    if company:
                        break
            except:
                continue
        
        location = ""
        location_selectors = [
            "[data-testid='text-location']",
            ".companyLocation",
            ".location"
        ]
        
        for selector in location_selectors:
            try:
                element = card.locator(selector).first
                count = await element.count()
                if count > 0:
                    location = await element.inner_text()
                    if location:
                        break
            except:
                continue

        link = ""
        try:
            link_element = card.locator("a[data-jk], h2.jobTitle a").first
            count = await link_element.count()
            if count > 0:
                job_key = await link_element.get_attribute('data-jk')
                if job_key:
                    link = f"{base_url}/viewjob?jk={job_key}"
                else:
                    href = await link_element.get_attribute("href")
                    link = href if href and href.startswith('http') else base_url + (href or "")
        except:
            logger.warning(f"⚠️ Could not extract link for job {idx}")
            return None

        return {
            "title": title.strip(),
            "company": company.strip() or "Unknown",
            "location": location.strip() or "Remote",
            "link": link,
            "source": "Indeed"
        }
        
    except Exception as e:
        logger.warning(f"Could not extract job card {idx}: {e}")
        return None


async def fetch_job_description(page: Page, job_url: str, max_retries: int = 3) -> str:
    """Fetch full job description from job detail page with retry logic"""
    
    for attempt in range(max_retries):
        try:
            await page.goto(job_url, wait_until="domcontentloaded", timeout=20000)
            await asyncio.sleep(2) 
            
            description_selectors = [
                "#jobDescriptionText",
                ".jobsearch-jobDescriptionText",
                "[id*='jobDesc']",
                ".job-description",
                "[class*='description']"
            ]
            
            description = ""
            
            for selector in description_selectors:
                try:

                    await page.wait_for_selector(selector, timeout=10000)
                
                    element = page.locator(selector).first
                    count = await element.count()
                    
                    if count > 0:
                        description = await element.inner_text()
                        description = description.strip()
                        
                        if description and len(description) > 100:
                            logger.info(f"✅ Extracted description ({len(description)} chars) using {selector}")
                            return description
                        
                except PlaywrightTimeout:
                    continue
                except Exception as e:
                    logger.debug(f"Selector {selector} failed: {e}")
                    continue
        
            if attempt < max_retries - 1:
                logger.warning(f"⚠️ No description found, retry {attempt + 1}/{max_retries}")
                await asyncio.sleep(2)
            else:
                logger.warning(f"⚠️ Could not find description after {max_retries} attempts for {job_url}")
                return ""
                
        except Exception as e:
            if attempt < max_retries - 1:
                logger.warning(f"⚠️ Error fetching description (attempt {attempt + 1}): {e}")
                await asyncio.sleep(2)
            else:
                logger.warning(f"⚠️ Could not fetch description from {job_url}: {e}")
                return ""
    
    return ""

def scrape_indeed_sync(*args, **kwargs):
    """
    Synchronous wrapper - runs the async function in a new event loop
    Use this if you need to call from non-async code
    """
    return asyncio.run(scrape_indeed(*args, **kwargs))
    