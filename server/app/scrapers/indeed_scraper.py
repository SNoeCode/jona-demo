import time, random, csv, traceback, json
from datetime import datetime, timedelta
from typing import Optional
import undetected_chromedriver as uc
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from app.scrapers.selenium_browser import configure_driver

from app.db.connect_database import get_db_connection
from app.db.cleanup import cleanup
from app.utils.common import TECH_KEYWORDS
from app.utils.skills_engine import (
    load_all_skills,
    extract_flat_skills,
    extract_skills_by_category
)
import uuid
import logging
import traceback

LOCATION = "remote"
MAX_DAYS = 5

# Load skills once
SKILLS = load_all_skills()
logger = logging.getLogger(__name__)

def parse_date(raw: str):
    raw = raw.lower()
    if "today" in raw or "just posted" in raw:
        return datetime.today().date()
    try:
        days_ago = int(raw.strip().split()[0])
        return datetime.today().date() - timedelta(days=days_ago)
    except:
        return datetime.today().date()

def is_tech_job(title: str) -> bool:
    return any(keyword.lower() in title.lower() for keyword in TECH_KEYWORDS)

def insert_job_to_db(job: dict):
    """Fixed insert function with proper field mapping"""
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        # Print what we're trying to insert
        print(f"➡️ Inserting job: {job['title'][:50]} | {job.get('company', 'N/A')} | {job['date']}")
        
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
            job.get("company", "N/A"),
            job.get("job_location", LOCATION),
            job.get("job_state", LOCATION.lower()),
            job.get("salary", "N/A"),
            job["site"],
            job["date"],
            job.get("applied", False),
            job.get("saved", False),
            job["url"],
            job.get("job_description", ""),
            job.get("search_term", ""),
            job.get("category"),
            job.get("priority", 0),
            job.get("status", "new"),
            datetime.utcnow(),
            job.get("last_verified"),
            json.dumps(job.get("flat_skills") or job.get("skills") or []),
            json.dumps(job.get("skills_by_category") or {}),
            job.get("user_id")
        ))
        
        result = cur.fetchone()
        conn.commit()
        
        if result:
            print(f"✅ Successfully inserted job ID: {result[0]}")
            return True
        else:
            print(f"⚠️ Job already exists (duplicate URL): {job['url']}")
            return False
            
    except Exception as e:
        print(f"❌ DB insert error: {e}")
        traceback.print_exc()
        return False
    finally:
        cur.close()
        conn.close()

def scrape_indeed(location=LOCATION, days=MAX_DAYS):
    print(f"🌐 Indeed Scraper → {location} (last {days} days)")
    base_url = "https://www.indeed.com"
    driver: Optional[uc.Chrome] = configure_driver()
    jobs_scraped = []
    inserted_count = 0

    if driver is None:
        print("❌ Failed to initialize driver")
        return jobs_scraped

    try:
        for keyword in TECH_KEYWORDS:
            keyword = keyword.strip()
            
            # Skip malformed keywords
            if not keyword:
                print(f"⚠️ Skipping empty keyword")
                continue
                
            print(f"\n🔍 Searching for '{keyword}'")
            
            # Build URL with proper encoding
            query = keyword.replace(" ", "+").replace(".", "").replace("-", "")
            url = f"{base_url}/jobs?q={query}&l={location}&fromage={days}"
            
            try:
                driver.get(url)
                time.sleep(random.uniform(3, 5))
            except Exception as e:
                print(f"❌ Failed to load page: {e}")
                continue

            # Check for bot detection
            if "robot check" in driver.page_source.lower() or "access denied" in driver.page_source.lower():
                print("🚫 Bot detected — skipping keyword.")
                continue

            # Wait for job container using MULTIPLE selectors
            container_xpaths = [
                "//div[@id='jobsearch-JapanPage']",
                "//div[@id='mosaic-provider-jobcards']",
                "//main[@id='jobsearch-Main']",
                "//*[@id='jobfeed-content-0']"
            ]

            container_found = False
            for xpath in container_xpaths:
                try:
                    WebDriverWait(driver, 10).until(
                        EC.presence_of_element_located((By.XPATH, xpath))
                    )
                    container_found = True
                    print(f"✅ Container found: {xpath}")
                    break
                except:
                    continue

            if not container_found:
                print("⚠️ Container did not load. Trying CSS selectors...")
                # Try CSS selectors as fallback
                try:
                    WebDriverWait(driver, 5).until(
                        EC.presence_of_element_located((By.CSS_SELECTOR, ".job_seen_beacon, .jobCard"))
                    )
                    container_found = True
                    print("✅ Container found via CSS selector")
                except:
                    print("⚠️ No job container found, skipping keyword")
                    continue

            # Find job cards using multiple strategies
            cards = []
            card_selectors = [
                ".job_seen_beacon",
                ".jobCard",
                "[data-testid='job-card']",
                "div.slider_item",
                "li.css-5lfssm"
            ]

            for selector in card_selectors:
                cards = driver.find_elements(By.CSS_SELECTOR, selector)
                if cards:
                    print(f"📄 Found {len(cards)} job cards using: {selector}")
                    break

            if not cards:
                print("⚠️ No job cards found.")
                continue
           
            for idx, card in enumerate(cards):
                try:
                    # Extract title
                    title = ""
                    title_selectors = [
                        "h2.jobTitle span[title]",
                        "h2.jobTitle a span",
                        ".jobTitle span"
                    ]
                    
                    for sel in title_selectors:
                        try:
                            title_el = card.find_element(By.CSS_SELECTOR, sel)
                            title = title_el.text.strip() or title_el.get_attribute("title")
                            if title:
                                break
                        except:
                            continue
                    
                    if not title or not is_tech_job(title):
                        continue

                    # Extract company
                    company = "N/A"
                    try:
                        company_el = card.find_element(By.CSS_SELECTOR, "[data-testid='company-name'], .companyName")
                        company = company_el.text.strip()
                    except:
                        pass

                    # Extract location
                    job_location = location
                    try:
                        location_el = card.find_element(By.CSS_SELECTOR, "[data-testid='text-location'], .companyLocation")
                        job_location = location_el.text.strip()
                    except:
                        pass

                    # Extract date
                    try:
                        date_el = card.find_element(By.CSS_SELECTOR, "[data-testid='myJobsStateDate'], .date")
                        date_posted = parse_date(date_el.text.strip())
                    except:
                        date_posted = datetime.today().date()

                    # Extract job URL
                    job_url = ""
                    try:
                        link_el = card.find_element(By.CSS_SELECTOR, "a[data-jk], h2.jobTitle a")
                        job_key = link_el.get_attribute("data-jk")

                        if job_key:
                            job_url = f"{base_url}/viewjob?jk={job_key}"
                        else:
                            href = link_el.get_attribute("href")
                            job_id = link_el.get_attribute("data-jk")

                            if not job_id:
                                logger.warning(f"⚠️ Missing job ID — skipping job {idx}")
                                continue

                            job_url = f"https://www.indeed.com/viewjob?jk={job_id}"

                    except Exception as e:
                        logger.warning(f"⚠️ Could not extract URL for job {idx}: {e}")
                        continue

                    # Visit job page to get description
                    description = "N/A"
                    try:
                        driver.get(job_url)
                        time.sleep(random.uniform(2, 4))
                        
                        desc_el = WebDriverWait(driver, 8).until(
                            EC.presence_of_element_located((By.ID, "jobDescriptionText"))
                        )
                        description = desc_el.text.strip()
                    except:
                        # Try alternative description selector
                        try:
                            desc_el = driver.find_element(By.CSS_SELECTOR, ".jobsearch-jobDescriptionText, #jobDescriptionText")
                            description = desc_el.text.strip()
                        except:
                            print(f"⚠️ Could not extract description for: {title}")

                    # Extract skills
                    flat_skills = extract_flat_skills(description, SKILLS["flat"]) if description != "N/A" else []
                    categorized_skills = extract_skills_by_category(description, SKILLS["matrix"]) if description != "N/A" else {}

                    job = {
                        "title": title,
                        "company": company,
                        "job_location": job_location,
                        "job_state": location.lower(),
                        "date": date_posted,
                        "site": "Indeed",
                        "job_description": description,
                        "salary": "N/A",
                        "url": job_url,
                        "applied": False,
                        "saved": False,
                        "search_term": keyword,
                        "flat_skills": flat_skills,
                        "skills": flat_skills,  # Add both for compatibility
                        "skills_by_category": categorized_skills,
                        "priority": 0,
                        "status": "new",
                        "category": None,
                        "user_id": None
                    }

                    # Insert to database
                    if insert_job_to_db(job):
                        inserted_count += 1
                    
                    jobs_scraped.append(job)
                    
                    # Go back to search results
                    driver.back()
                    time.sleep(random.uniform(2, 3))

                except Exception as e:
                    print(f"❌ Error parsing job {idx}: {e}")
                    traceback.print_exc()
                    continue

    except Exception as e:
        print(f"❌ Critical error: {e}")
        traceback.print_exc()
        
    finally:
        if driver is not None:
            driver.quit()

    # Save CSV
    if jobs_scraped:
        ts = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"indeed_jobs_{ts}.csv"
        with open(filename, "w", newline="", encoding="utf-8") as f:
            # Remove skills from CSV (they're in DB)
            csv_jobs = [{k: v for k, v in job.items() if k not in ['flat_skills', 'skills_by_category', 'skills']} 
                        for job in jobs_scraped]
            writer = csv.DictWriter(f, fieldnames=list(csv_jobs[0].keys()))
            writer.writeheader()
            writer.writerows(csv_jobs)
        print(f"📁 Saved to {filename}")

    cleanup(days)
    print(f"\n✅ Indeed scraper: {len(jobs_scraped)} jobs found, {inserted_count} inserted to DB")
    return jobs_scraped
