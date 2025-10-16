from selenium.webdriver.common.by import By
from selenium.common.exceptions import NoSuchElementException
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from app.utils.extraction_descriptions import extract_job_description
from app.db.sync_jobs import insert_job_to_db
from app.utils.write_jobs import write_jobs_csv
from app.utils.common import LOCATION, PAGES_PER_KEYWORD, TECH_KEYWORDS
from app.scrapers.selenium_browser import configure_driver
from app.utils.skills_engine import (
    load_all_skills,
    extract_flat_skills,
    extract_skills_by_category
)
from datetime import datetime
import uuid
import time

SKILLS = load_all_skills()

def scrape_monster_jobs(location=LOCATION, pages=PAGES_PER_KEYWORD):
    base_url = "https://www.monster.com"
    all_jobs = []
    driver = configure_driver()

    # Trigger verification once
    driver.get(f"{base_url}/jobs/search?q=software+engineer&where={location}")
    input("🔐 Complete Monster verification and press Enter to continue...")

    for keyword in TECH_KEYWORDS:
        print(f"\n🔍 Crawling '{keyword}' in '{location}'")

        for page in range(1, pages + 1):
            url = f"{base_url}/jobs/search?q={'+'.join(keyword.split())}&where={location}&page={page}"

            try:
                driver.get(url)
                time.sleep(2)
                WebDriverWait(driver, 10).until(
                    EC.presence_of_element_located((By.CSS_SELECTOR, "section.search-results-tab-style__SearchResultsTabContent-sc-8adc8bee-6.bHOwhc"))
                )
            except Exception as e:
                print(f"⚠️ Error loading page {page} for '{keyword}': {e}")
                continue

            try:
                container = driver.find_element(By.XPATH, '//*[@id="__next"]/div[2]/main/div[3]/nav/section[1]/div/div/div')
                job_cards = container.find_elements(By.XPATH, ".//li[contains(@class, 'data-results-content-parent')]")
                

                for card in job_cards:
                    try:
                        # Title fallback
                        try:
                            title_elem = card.find_element(By.XPATH, ".//*[contains(@class, 'title')]")
                            title = title_elem.text.strip()
                        except Exception:
                            try:
                                title_elem = card.find_element(By.CSS_SELECTOR, "h2, h3, a")
                                title = title_elem.text.strip()
                            except Exception:
                                title = "Unknown"

                        company = card.find_element(By.CLASS_NAME, "company").text if card.find_elements(By.CLASS_NAME, "company") else "Unknown"
                        location_text = card.find_element(By.CLASS_NAME, "location").text if card.find_elements(By.CLASS_NAME, "location") else "Unknown"

                        # Click into job detail
                        try:
                            link = card.find_element(By.TAG_NAME, "a")
                            driver.execute_script("arguments[0].click();", link)
                            time.sleep(2)

                            if len(driver.window_handles) > 1:
                                driver.switch_to.window(driver.window_handles[-1])

                            job_description = extract_job_description(driver, driver.current_url)

                            if len(driver.window_handles) > 1:
                                driver.close()
                                driver.switch_to.window(driver.window_handles[0])

                        except Exception as e:
                            print(f"⚠️ Failed to open job detail page: {e}")
                            job_description = "Description not available"

                        flat_skills = extract_flat_skills(job_description, SKILLS["flat"])
                        skills_by_category = extract_skills_by_category(job_description, SKILLS["matrix"])

                        job = {
                            "id": str(uuid.uuid4()),
                            "title": title,
                            "company": company,
                            "job_location": location_text,
                            "job_state": location,
                            "salary": "N/A",
                            "site": "Monster",
                            "date": datetime.utcnow().date().isoformat(),
                            "applied": False,
                            "saved": False,
                            "url": driver.current_url,
                            "job_description": job_description,
                            "search_term": keyword,
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

                    except Exception as e:
                        print(f"⚠️ Failed to process job card: {e}")
                        continue

            except NoSuchElementException:
                print(f"⚠️ No job container found on page {page}")
                continue

    driver.quit()
    write_jobs_csv(all_jobs, label="monster_scraper")
    return all_jobs