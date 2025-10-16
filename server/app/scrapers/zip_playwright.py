from playwright.sync_api import sync_playwright
from app.utils.skills_engine import (
    load_all_skills,
    extract_flat_skills,
    extract_skills_by_category
)
from app.db.sync_jobs import insert_job_to_db
from datetime import datetime
import uuid
import os
from app.utils.write_jobs import write_jobs_csv
from dotenv import load_dotenv
load_dotenv()
SKILLS = load_all_skills()
HEADLESS_PATH = os.getenv("HEADLESS_PATH")

def scrape_zip_with_playwright(location="remote", days=15):
    all_jobs = []

    with sync_playwright() as p:
        browser = p.chromium.launch(
            headless=True,
            executable_path=HEADLESS_PATH
        )
        context = browser.new_context()
        page = context.new_page()

        search_url = f"https://www.ziprecruiter.com/jobs/search?search=software+engineer&location={location}&days={days}"
        page.goto(search_url)
        page.wait_for_timeout(3000)

        job_cards = page.query_selector_all("div.job_content")

        for card in job_cards:
            try:
                title = card.query_selector("h2").inner_text().strip()
                company = card.query_selector(".t_org_link").inner_text().strip() if card.query_selector(".t_org_link") else "Unknown"
                location_text = card.query_selector(".location").inner_text().strip() if card.query_selector(".location") else location
                link = card.query_selector("a").get_attribute("href")

                # Open job detail page
                detail_page = context.new_page()
                detail_page.goto(link)
                detail_page.wait_for_timeout(3000)

                description = detail_page.query_selector("div.job_description").inner_text().strip() if detail_page.query_selector("div.job_description") else "Description not available"
                detail_page.close()

                flat_skills = extract_flat_skills(description, SKILLS["flat"])
                skills_by_category = extract_skills_by_category(description, SKILLS["matrix"])

                job = {
                    "id": str(uuid.uuid4()),
                    "title": title,
                    "company": company,
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

            except Exception as e:
                print(f"⚠️ Failed to process Zip job card: {e}")
                continue

        browser.close()
        write_jobs_csv(all_jobs, folder_name="job_data", label="zip_playwright")
        return all_jobs