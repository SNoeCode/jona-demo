import time, traceback
import json
import uuid
from datetime import datetime
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from app.db.connect_database import get_db_connection
from app.scrapers.selenium_browser import get_headless_browser
from app.utils.write_jobs import write_jobs_csv
from dotenv import load_dotenv
from app.utils.skills_engine import (
    load_all_skills,
    extract_flat_skills,
    extract_skills,
    extract_skills_by_category
)
load_dotenv()
SKILLS = load_all_skills()
def insert_job_to_db(job):
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        cur.execute("""
            INSERT INTO jobs (
                id, title, company, job_location, job_state, date, site,
                job_description, salary, url, applied, search_term,
                skills, skills_by_category, inserted_at
            ) VALUES (
                gen_random_uuid(), %s, %s, %s, %s, %s, %s,
                %s, %s, %s, %s, %s,
                %s, %s, NOW()
            )
            ON CONFLICT (url) DO NOTHING;
        """, (
            job["title"], job["company"], job["job_location"], job["job_state"],
            job["date"], job["site"], job["job_description"], job["salary"],
            job["url"], job["applied"], job["search_term"],
            json.dumps(job["flat_skills"]),  # save as JSON
            json.dumps(job["skills_by_category"])  # categorized
        ))
        conn.commit()
    except Exception as e:
        print(f"❌ DB insert error: {e}")
        traceback.print_exc()
    finally:
        cur.close()
        conn.close()
        
        
def scrape_dice(location="remote", days=15):
    print(f"\n:globe_with_meridians: Scraping Dice → {location}")
    jobs = []
    driver = get_headless_browser()
    try:
        base_url = "https://www.dice.com/jobs?q=developer&location=Remote"
        driver.get(base_url)
        time.sleep(5)
        # Wait for job cards to be present
        WebDriverWait(driver, 15).until(
            EC.presence_of_all_elements_located((By.CSS_SELECTOR, "a[data-testid='job-search-job-card-link']"))
        )
        job_links = driver.find_elements(By.CSS_SELECTOR, "a[data-testid='job-search-job-card-link']")
        print(f":receipt: Found {len(job_links)} job links")
        for link in job_links:
            try:
                job_url = link.get_attribute("href")
                aria_label = link.get_attribute("aria-label")
                if aria_label is not None:
                    title = aria_label.replace("View Details for", "").strip()
                else:
                    title = "N/A"
                # Open job detail in new tab
                driver.execute_script("window.open(arguments[0]);", job_url)
                driver.switch_to.window(driver.window_handles[-1])
                time.sleep(3)
                try:
                    description = driver.find_element(By.CLASS_NAME, "job-description").text.strip()
                except:
                    description = "N/A"
                try:
                    company = driver.find_element(By.CSS_SELECTOR, "[data-testid='company-name']").text.strip()
                except:
                    company = "N/A"
                try:
                    location_text = driver.find_element(By.CSS_SELECTOR, "[data-testid='job-location']").text.strip()
                except:
                    location_text = "Remote"
                flat_skills = extract_flat_skills(description, SKILLS["flat"])
                categorized_skills = extract_skills(description, SKILLS["matrix"])
                job = {
                    "title": title,
                    "company": company,
                    "job_location": location_text,
                    "job_state": location_text.lower(),
                    "date": datetime.today().date(),
                    "site": "Dice",
                    "job_description": description,
                    "salary": "N/A",
                    "url": job_url,
                    "applied": False,
                    "search_term": "developer",
                    "flat_skills": flat_skills,
                    "skills_by_category": categorized_skills
                }
                insert_job_to_db(job)
                jobs.append(job)
                driver.close()
                driver.switch_to.window(driver.window_handles[0])
            except Exception as e:
                print(":x: Error scraping job:", e)
                traceback.print_exc()
                try: driver.close(); driver.switch_to.window(driver.window_handles[0])
                except: pass
                continue
    finally:
        driver.quit()
    print(f":white_check_mark: Scraped {len(jobs)} jobs from Dice")
    return jobs
if __name__ == "__main__":
    jobs = scrape_dice()
    print(f":dart: Finished scraping. {len(jobs)} jobs returned.")
