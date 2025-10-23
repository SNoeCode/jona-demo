from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException, NoSuchElementException
from typing import List, Dict, Optional
import time
import logging
import json
import uuid
from datetime import datetime
from selenium.webdriver.remote.webelement import WebElement
from urllib.parse import quote_plus

from app.db.connect_database import get_db_connection
import traceback

logger = logging.getLogger(__name__)

def insert_job_to_db(job: dict):
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
        cur.close()
        conn.close()

def scrape_indeed_jobs(location: str = "remote", days: int = 15, keywords: Optional[List[str]] = None, max_results: int = 100) -> List[Dict[str, str]]:
    """Scrape Indeed jobs with stable Chrome driver"""
    from app.utils.chrome_driver_helper import StableChromeDriver
    from app.utils.skills_engine import load_all_skills, extract_flat_skills, extract_skills_by_category

    if keywords is None:
        keywords = ["software developer", "python developer"]

    all_jobs = []
    inserted_count = 0
    SKILLS = load_all_skills()

    with StableChromeDriver(headless=True, timeout=30) as driver:
        for keyword in keywords:
            if len(all_jobs) >= max_results:
                break

            logger.info(f"🔍 Searching Indeed for '{keyword}' in '{location}'")

            try:
                jobs = scrape_indeed_keyword(driver, keyword, location, days, max_results - len(all_jobs), SKILLS)
                
                # Insert jobs to database
                for job in jobs:
                    job["search_term"] = keyword
                    if insert_job_to_db(job):
                        inserted_count += 1
                
                all_jobs.extend(jobs)
                logger.info(f"✅ Found {len(jobs)} jobs for '{keyword}' (Total: {len(all_jobs)}, Inserted: {inserted_count})")

                if keyword != keywords[-1]:
                    time.sleep(2)

            except Exception as e:
                logger.error(f"❌ Error scraping '{keyword}': {e}")
                traceback.print_exc()
    
    # Remove duplicates
    unique_jobs = []
    seen = set()

    for job in all_jobs:
        key = (job.get("title", ""), job.get("company", ""))
        if key not in seen:
            seen.add(key)
            unique_jobs.append(job)

    logger.info(f"📊 Total unique jobs: {len(unique_jobs)}, Inserted to DB: {inserted_count}")
    return unique_jobs[:max_results]

def scrape_indeed_keyword(driver, keyword: str, location: str, days: int, max_jobs: int, skills_data) -> List[Dict]:
    """Scrape Indeed for a single keyword with description extraction"""
    jobs = []
    
    try:
        base_url = "https://www.indeed.com/jobs"
        url = f"{base_url}?q={quote_plus(keyword)}&l={quote_plus(location)}&fromage={days}"
        logger.info(f"Loading: {url}")
        
        if not safe_load_page(driver, url):
            logger.warning(f"⚠️ Primary URL failed for '{keyword}'")
            return []
        
        # Wait for job listings
        try:
            WebDriverWait(driver, 15).until(
                EC.presence_of_element_located((By.CSS_SELECTOR, ".job_seen_beacon, .jobCard, [data-testid='job-card']"))
            )
        except TimeoutException:
            logger.warning(f"⚠️ Job listings didn't load for '{keyword}'")
            return []
        
        time.sleep(2)
        
        # Find job cards
        job_cards = []
        selectors = [
            ".job_seen_beacon",
            ".jobCard",
            "[data-testid='job-card']",
            ".slider_item",
            ".tapItem",
            "li.css-5lfssm"
        ]
        
        for selector in selectors:
            job_cards = driver.find_elements(By.CSS_SELECTOR, selector)
            if job_cards:
                logger.info(f"✅ Found {len(job_cards)} jobs using selector: {selector}")
                break
        
        if not job_cards:
            logger.warning(f"⚠️ No job cards found for '{keyword}'")
            return []
        
        for idx, card in enumerate(job_cards[:max_jobs]):
            try:
                job_data = extract_indeed_job_data(card, idx, driver, base_url, skills_data)
                if job_data:
                    jobs.append(job_data)
                    logger.info(f"✅ Extracted job {idx + 1}: {job_data['title']} at {job_data['company']}")
            except Exception as e:
                logger.warning(f"❌ Error extracting job {idx}: {e}")
                traceback.print_exc()
                continue
        
    except Exception as e:
        logger.error(f"Error in scrape_indeed_keyword: {e}")
        traceback.print_exc()
    
    return jobs

def safe_load_page(driver, url: str, max_retries: int = 3) -> bool:
    """Safely load a page with retries"""
    container_selectors = [
        "main#jobsearch-Main",
        "#jobsearch-JapanPage",
        "#mosaic-provider-jobcards",
        "#jobfeed-content-0"
    ]

    for attempt in range(max_retries):
        try:
            driver.get(url)
            WebDriverWait(driver, 10).until(
                EC.presence_of_element_located((By.TAG_NAME, "body"))
            )
            for selector in container_selectors:
                try:
                    driver.find_element(By.CSS_SELECTOR, selector)
                    logger.info(f"✅ Container found: {selector}")
                    return True
                except NoSuchElementException:
                    continue

            logger.warning(f"⚠️ No valid container found on attempt {attempt + 1}")
            if attempt < max_retries - 1:
                time.sleep(2)

        except TimeoutException:
            logger.warning(f"Timeout loading page (attempt {attempt + 1}/{max_retries})")
            if attempt < max_retries - 1:
                time.sleep(2)
        except Exception as e:
            logger.error(f"Error loading page (attempt {attempt + 1}): {e}")
            if attempt < max_retries - 1:
                time.sleep(2)

    return False

def extract_indeed_job_data(card: WebElement, idx: int, driver, base_url: str, skills_data) -> Optional[Dict[str, str]]:
    """Extract data from a single Indeed job card INCLUDING DESCRIPTION"""
    try:
        # Extract title
        title_selectors = [
            "h2.jobTitle span[title]",
            "h2.jobTitle a span",
            ".jobTitle span",
            "[data-testid='job-title']"
        ]
        title = ""
        for selector in title_selectors:
            try:
                element = card.find_element(By.CSS_SELECTOR, selector)
                title = element.text or element.get_attribute("title")
                if title:
                    break
            except NoSuchElementException:
                continue
        
        if not title:
            return None
        
        # Extract company
        company_selectors = [
            "[data-testid='company-name']",
            ".companyName",
            "span.companyName"
        ]
        company = ""
        for selector in company_selectors:
            try:
                company = card.find_element(By.CSS_SELECTOR, selector).text
                if company:
                    break
            except NoSuchElementException:
                continue
        
        # Extract location
        location_selectors = [
            "[data-testid='text-location']",
            ".companyLocation",
            ".location"
        ]
        location = ""
        for selector in location_selectors:
            try:
                location = card.find_element(By.CSS_SELECTOR, selector).text
                if location:
                    break
            except NoSuchElementException:
                continue
        
        # Extract link
        link = ""
        try:
            link_element = card.find_element(By.CSS_SELECTOR, "a[data-jk], h2.jobTitle a")
            job_key = link_element.get_attribute('data-jk')
            if job_key:
                link = f"{base_url}/viewjob?jk={job_key}"
            else:
                href = link_element.get_attribute("href")
                link = href if href and href.startswith('http') else base_url + (href or "")
        except NoSuchElementException:
            logger.warning(f"⚠️ Could not extract link for job {idx}")
            return None

        # ✅ CRITICAL: Visit job page to get FULL DESCRIPTION
        description = ""
        try:
            current_url = driver.current_url
            driver.get(link)
            time.sleep(2)
            
            # Wait for description to load
            desc_element = WebDriverWait(driver, 10).until(
                EC.presence_of_element_located((By.ID, "jobDescriptionText"))
            )
            description = desc_element.text.strip()
            
            logger.info(f"✅ Extracted description ({len(description)} chars)")
            
            # Go back to search results
            driver.get(current_url)
            time.sleep(2)
            
        except Exception as e:
            logger.warning(f"⚠️ Could not extract full description: {e}")
            # Try snippet as fallback
            try:
                desc_element = card.find_element(By.CSS_SELECTOR, ".job-snippet, .description")
                description = desc_element.text
            except:
                description = ""

        # Extract skills from description
        from app.utils.skills_engine import extract_flat_skills, extract_skills_by_category
        
        flat_skills = extract_flat_skills(description, skills_data["flat"]) if description else []
        categorized_skills = extract_skills_by_category(description, skills_data["matrix"]) if description else {}

        job_data = {
            "title": title.strip(),
            "company": company.strip() or "Unknown",
            "location": location.strip() or "Remote",
            "link": link,
            "description": description.strip(),
            "source": "Indeed",
            "skills": flat_skills,
            "skills_by_category": categorized_skills
        }  
        
        return job_data
        
    except Exception as e:
        logger.warning(f"Could not extract job {idx}: {e}")
        traceback.print_exc()
        return None

