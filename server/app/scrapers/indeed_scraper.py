import time, random, csv, traceback
from datetime import datetime, timedelta
import undetected_chromedriver as uc
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from app.scrapers.selenium_browser import configure_driver

from app.db.connect_database import get_db_connection
from app.db.cleanup import cleanup
from app.utils.common import TECH_KEYWORDS
from app.utils.skills_engine import load_skill_matrix, extract_flat_skills, extract_skills_by_category

LOCATION = "remote"
MAX_DAYS = 5

# Load skills once
SKILL_MATRIX = load_skill_matrix()

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
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        cur.execute("""
            INSERT INTO jobs (
                id, title, company, job_location, job_state, date, site,
                job_description, salary, url, applied, search_term, inserted_at, skills
            ) VALUES (
                gen_random_uuid(), %s, %s, %s, %s, %s, %s,
                %s, %s, %s, %s, %s, NOW(), %s
            )
            ON CONFLICT (url) DO NOTHING;
        """, (
            job["title"], job["company"], job["job_location"], job["job_state"],
            job["date"], job["site"], job["job_description"], job["salary"],
            job["url"], job["applied"], job["search_term"], job.get("flat_skills", [])
        ))
        conn.commit()
    except Exception as e:
        print(f"❌ DB insert error: {e}")
        traceback.print_exc()
    finally:
        cur.close()
        conn.close()

def scrape_indeed(location=LOCATION, days=MAX_DAYS):
    print(f"🌐 Crawl4AI (Indeed) → {location} (last {days} days)")
    base_url = "https://www.indeed.com"
    driver = configure_driver()
    jobs_scraped = []

    try:
        for keyword in TECH_KEYWORDS:
            print(f"\n🔍 Searching for '{keyword}'")
            url = f"{base_url}/jobs?q={'+'.join(keyword.split())}&l={location}&fromage={days}&forceLocation=0"
            driver.get(url)
            time.sleep(random.uniform(2.5, 4.5))

            if "robot check" in driver.page_source.lower() or "access denied" in driver.page_source.lower():
                print("🚫 Bot detected — skipping keyword.")
                continue

            try:
                WebDriverWait(driver, 15).until(
                    EC.presence_of_element_located((By.XPATH, "//table[contains(@class, 'mainContentTable')]"))
                )
            except:
                print("⚠️ Container did not load.")
                continue

            cards = driver.find_elements(By.XPATH, "//table[contains(@class,'mainContentTable')]")
            print(f"📄 Found {len(cards)} job cards")

            for table in cards:
                try:
                    title_el = table.find_element(By.XPATH, ".//h2[contains(@class, 'jobTitle')]/a/span")
                    title = title_el.text.strip()
                    if not is_tech_job(title):
                        continue

                    company_el = table.find_element(By.XPATH, ".//span[@data-testid='company-name']")
                    location_el = table.find_element(By.XPATH, ".//div[@data-testid='text-location']")
                    try:
                        date_el = table.find_element(By.XPATH, ".//span[contains(text(), 'Posted') or contains(text(), 'Just posted')]")
                        date_posted = parse_date(date_el.text.strip())
                    except:
                        date_posted = datetime.today().date()

                    link_el = table.find_element(By.XPATH, ".//a[@data-jk]")
                    job_url = f"{base_url}/viewjob?jk={link_el.get_attribute('data-jk') or ''}"

                    driver.get(job_url)
                    time.sleep(random.uniform(2.5, 4.5))

                    try:
                        desc_el = WebDriverWait(driver, 5).until(
                            EC.presence_of_element_located((By.ID, "jobDescriptionText"))
                        )
                        description = desc_el.text.strip()
                    except:
                        description = "N/A"

                    # 🧠 Skill extraction
                    flat_skills = extract_flat_skills(description, SKILL_MATRIX["flat"])
                    categorized_skills = extract_skills_by_category(description, SKILL_MATRIX["matrix"])

                    job = {
                        "title": title,
                        "company": company_el.text.strip() or "N/A",
                        "job_location": location_el.text.strip() or location,
                        "job_state": location.lower(),
                        "date": date_posted,
                        "site": "Indeed",
                        "job_description": description,
                        "salary": "N/A",
                        "url": job_url,
                        "applied": False,
                        "search_term": keyword,
                        "flat_skills": flat_skills,
                        "skills_by_category": categorized_skills
                    }

                    insert_job_to_db(job)
                    jobs_scraped.append(job)

                except Exception as e:
                    print(f"❌ Error parsing job: {e}")
                    continue

            try:
                next_btn = driver.find_element(By.XPATH, "//a[@aria-label='Next Page']")
                if next_btn.is_enabled():
                    driver.execute_script("arguments[0].click();", next_btn)
                    time.sleep(random.uniform(2.5, 4.5))
                else:
                    break
            except:
                break

    finally:
        driver.quit()

    if jobs_scraped:
        ts = datetime.now().strftime("%Y%m%d_%H%M%S")
        with open(f"crawl4ai_indeed_jobs_{ts}.csv", "w", newline="", encoding="utf-8") as f:
            writer = csv.DictWriter(f, fieldnames=list(jobs_scraped[0].keys()))
            writer.writeheader()
            writer.writerows(jobs_scraped)
        print(f"📁 Saved to crawl4ai_indeed_jobs_{ts}.csv")

    cleanup(days)
    print(f"\n✅ Crawl4AI (Indeed) collected {len(jobs_scraped)} jobs.")
    return jobs_scraped