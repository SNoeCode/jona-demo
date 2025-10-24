import os
import time
import uuid
from datetime import datetime
from dotenv import load_dotenv
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException, NoSuchElementException
from app.utils.skills_engine import (
    load_all_skills,
    extract_flat_skills,
    extract_skills_by_category
)
from app.db.sync_jobs import insert_job_to_db
from app.utils.write_jobs import write_jobs_csv

load_dotenv()
SKILLS = load_all_skills()
HEADLESS_PATH = os.getenv("HEADLESS_PATH")

def scrape_zip_with_selenium(location="remote", days=15):
    all_jobs = []
    
    # Setup Chrome options
    chrome_options = Options()
    chrome_options.add_argument("--headless")
    chrome_options.add_argument("--no-sandbox")
    chrome_options.add_argument("--disable-dev-shm-usage")
    chrome_options.add_argument("--disable-gpu")
    chrome_options.add_argument("--window-size=1920,1080")
    chrome_options.add_argument("--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36")
    
    if HEADLESS_PATH:
        chrome_options.binary_location = HEADLESS_PATH
    
    driver = None
    try:
        driver = webdriver.Chrome(options=chrome_options)
        wait = WebDriverWait(driver, 10)
        
        search_url = f"https://www.ziprecruiter.com/jobs/search?search=software+engineer&location={location}&days={days}"
        print(f"🔍 Navigating to: {search_url}")
        driver.get(search_url)
        time.sleep(5)
        
        # Try multiple selectors for job cards
        job_cards = []
        selectors_to_try = [
            "[data-testid='job-card']",
            ".job_content",
            "[class*='job-listing']",
            "[class*='job-card']",
            "[class*='listing']",
            "article[class*='job']",
            "[class*='result']",
            "[class*='posting']"
        ]
        
        for selector in selectors_to_try:
            try:
                job_cards = driver.find_elements(By.CSS_SELECTOR, selector)
                if job_cards:
                    print(f"✅ Found {len(job_cards)} job cards with selector: {selector}")
                    break
            except Exception as e:
                print(f"⚠️ Selector {selector} failed: {e}")
                continue
        
        # If no job cards found, try to find job links directly
        if not job_cards:
            print("🔍 No job cards found, looking for job links directly...")
            job_link_patterns = [
                "a[href*='/jobs/']",
                "a[href*='/job/']", 
                "a[href*='job-']",
                "a[href*='career']",
                "a[href*='position']"
            ]
            
            for pattern in job_link_patterns:
                try:
                    job_links = driver.find_elements(By.CSS_SELECTOR, pattern)
                    if job_links:
                        print(f"✅ Found {len(job_links)} job links with pattern: {pattern}")
                        job_cards = job_links
                        break
                except Exception as e:
                    print(f"⚠️ Pattern {pattern} failed: {e}")
                    continue
        
        if not job_cards:
            print("❌ No job cards found with any selector")
            # Take screenshot for debugging
            driver.save_screenshot("debug_zip_selenium.png")
            print("📸 Screenshot saved as debug_zip_selenium.png")
            return all_jobs
        
        for i, card in enumerate(job_cards):
            try:
                print(f"🔍 Processing job card {i+1}/{len(job_cards)}")
                
                # Try multiple selectors for title
                title = None
                title_selectors = ["h2", "h3", "[class*='title']", "[class*='job-title']"]
                for selector in title_selectors:
                    try:
                        title = card.find_element(By.CSS_SELECTOR, selector)
                        break
                    except NoSuchElementException:
                        continue
                
                # Try multiple selectors for company
                company = None
                company_selectors = [".t_org_link", "[class*='company']", "[class*='org']"]
                for selector in company_selectors:
                    try:
                        company = card.find_element(By.CSS_SELECTOR, selector)
                        break
                    except NoSuchElementException:
                        continue
                
                # Try multiple selectors for location
                location_el = None
                location_selectors = [".location", "[class*='location']"]
                for selector in location_selectors:
                    try:
                        location_el = card.find_element(By.CSS_SELECTOR, selector)
                        break
                    except NoSuchElementException:
                        continue
                
                # Get link
                link_el = card.find_element(By.TAG_NAME, "a")
                link = link_el.get_attribute("href") if link_el else None
                
                job_title = title.text if title else "N/A"
                company_name = company.text if company else "Unknown"
                location_text = location_el.text if location_el else location
                
                print(f"📝 Job: {job_title} at {company_name}")
                
                if not link:
                    print("⚠️ No link found, skipping")
                    continue
                
                # Validate URL - skip navigation links
                if not link.startswith('http') or any(nav in link.lower() for nav in ['/post-a-job', '/search-jobs', '/employer', '/about', '/contact', '/help']):
                    print(f"⚠️ Skipping navigation link: {link}")
                    continue
                
                # Ensure it's a job posting URL
                if '/jobs/' not in link and 'job' not in link.lower():
                    print(f"⚠️ Skipping non-job link: {link}")
                    continue
                
                # Navigate to job detail page
                driver.execute_script("window.open('');")
                driver.switch_to.window(driver.window_handles[1])
                driver.get(link)
                time.sleep(3)
                
                # Get job description
                description = "Description not available"
                desc_selectors = ["div.job_description", "[class*='description']", "[class*='content']"]
                for selector in desc_selectors:
                    try:
                        desc_el = driver.find_element(By.CSS_SELECTOR, selector)
                        description = desc_el.text
                        break
                    except NoSuchElementException:
                        continue
                
                # Close detail page and switch back
                driver.close()
                driver.switch_to.window(driver.window_handles[0])
                
                # Extract skills
                flat_skills = extract_flat_skills(description, SKILLS["flat"])
                skills_by_category = extract_skills_by_category(description, SKILLS["matrix"])
                
                job = {
                    "id": str(uuid.uuid4()),
                    "title": job_title,
                    "company": company_name,
                    "job_location": location_text,
                    "job_state": location,
                    "salary": "N/A",
                    "site": "ZipRecruiter",
                    "date": datetime.utcnow().date().isoformat(),
                    "applied": False,
                    "saved": False,
                    "url": link,
                    "job_description": description,
                    "search_term": "software engineer",
                    "category": None,
                    "priority": None,
                    "status": "new",
                    "inserted_at": datetime.utcnow(),
                    "last_verified": None,
                    "skills": flat_skills,
                    "skills_by_category": skills_by_category,
                    "user_id": None
                }
                
                insert_job_to_db(job)
                all_jobs.append(job)
                print(f"✅ Added job: {job_title}")
                
            except Exception as e:
                print(f"⚠️ Failed to process job card {i+1}: {e}")
                continue
        
        print(f"✅ Selenium scraper completed. Found {len(all_jobs)} jobs")
        return all_jobs
        
    except Exception as e:
        print(f"❌ Selenium scraper error: {e}")
        return all_jobs
    finally:
        if driver:
            driver.quit()

# Run it
if __name__ == "__main__":
    scrape_zip_with_selenium()
