
import time, traceback
from datetime import datetime
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from app.db.connect_database import get_db_connection
from app.utils.skills_engine import load_all_skills, extract_flat_skills,extract_skills
from app.scrapers.selenium_browser import get_headless_browser
from dotenv import load_dotenv
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
            job["flat_skills"], job["skills_by_category"]
        ))
        conn.commit()
    except Exception as e:
        print(f":x: DB insert error: {e}")
        traceback.print_exc()
    finally:
        cur.close()
        conn.close()
def scrape_teksystems(location="remote", days=15):
    print(f"\n:globe_with_meridians: Scraping TekSystems → {location}")
    jobs_scraped = []
    driver = get_headless_browser()
    try:
        base_url = "https://careers.teksystems.com/us/en/search-results"
        search_url = f"{base_url}?keywords=developer&location={location}"
        driver.get(search_url)
        time.sleep(3)
        # :repeat: Wait for job cards — fallback to generic container div if class fails
        try:
            WebDriverWait(driver, 10).until(
                EC.presence_of_element_located((By.CLASS_NAME, "ph-job-card"))
            )
            job_cards = driver.find_elements(By.CLASS_NAME, "ph-job-card")
        except Exception:
            print(":warning: Default selector failed, trying fallback selector...")
            try:
                WebDriverWait(driver, 10).until(
                    EC.presence_of_element_located((By.CLASS_NAME, "job-description"))
                )
                job_cards = driver.find_elements(By.CLASS_NAME, "job-description")
                for card in job_cards:
                    print(":package: Raw card text:", card.text)
            except Exception:
                print(":no_entry_sign: No job cards found using fallback selector. Exiting scrape.")
                driver.quit()
                return []
        print(f":receipt: Found {len(job_cards)} job cards")
        for card in job_cards:
            try:
                title = card.find_element(By.CLASS_NAME, "ph-job-card-title").text.strip()
                company = "TekSystems"
                location_text = card.find_element(By.CLASS_NAME, "ph-job-card-location").text.strip()
                job_state = location_text.lower()
                job_url = card.find_element(By.CLASS_NAME, "ph-job-card-title").get_attribute("href")
                # Open job in detail view
                driver.execute_script("window.open(arguments[0]);", job_url)
                driver.switch_to.window(driver.window_handles[-1])
                time.sleep(3)
                try:
                    WebDriverWait(driver, 10).until(
                        EC.presence_of_element_located((By.CLASS_NAME, "description__text"))
                    )
                    description = driver.find_element(By.CLASS_NAME, "description__text").text.strip()
                except:
                    description = "N/A"
                flat_skills = extract_flat_skills(description, SKILLS["flat"])
                categorized_skills = extract_skills(description, SKILLS["matrix"])
                job = {
                    "title": title,
                    "company": company,
                    "job_location": location_text,
                    "job_state": job_state,
                    "date": datetime.today().date(),
                    "site": "TekSystems",
                    "job_description": description,
                    "salary": "N/A",
                    "url": job_url,
                    "applied": False,
                    "search_term": "developer",
                    "flat_skills": flat_skills,
                    "skills_by_category": categorized_skills
                }
                insert_job_to_db(job)
                jobs_scraped.append(job)
                driver.close()
                driver.switch_to.window(driver.window_handles[0])
            except Exception as e:
                print(":x: Error scraping job:", e)
                traceback.print_exc()
                try:
                    driver.close()
                    driver.switch_to.window(driver.window_handles[0])
                except:
                    pass
                continue
    finally:
        driver.quit()

    print(f"✅ Scraped {len(jobs_scraped)} jobs from TekSystems")
    return jobs_scraped

# Corrected the entry point name
if __name__ == "__main__":
    jobs = scrape_teksystems()
    print(f"🎯 Finished scraping. {len(jobs)} jobs returned.")

