import asyncio
import os
import uuid
from datetime import datetime
from dotenv import load_dotenv
from playwright.async_api import async_playwright
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

async def scrape_zip_with_playwright(location="remote", days=15):
    all_jobs = []

    async with async_playwright() as p:
        browser = await p.chromium.launch(
            headless=True,
            executable_path=HEADLESS_PATH
        )
        context = await browser.new_context()
        page = await context.new_page()

        search_url = f"https://www.ziprecruiter.com/jobs/search?search=software+engineer&location={location}&days={days}"
        await page.goto(search_url)
        await page.wait_for_timeout(3000)

        job_cards = await page.query_selector_all("div.job_content")

        for card in job_cards:
            try:
                title = await card.query_selector("h2")
                company = await card.query_selector(".t_org_link")
                location_el = await card.query_selector(".location")
                link_el = await card.query_selector("a")

                job_title = await title.inner_text() if title else "N/A"
                company_name = await company.inner_text() if company else "Unknown"
                location_text = await location_el.inner_text() if location_el else location
                link = await link_el.get_attribute("href") if link_el else None
                if not link:
                    continue

                # Open job detail page
                detail_page = await context.new_page()
                await detail_page.goto(link)
                await detail_page.wait_for_timeout(3000)

                description_el = await detail_page.query_selector("div.job_description")
                description = await description_el.inner_text() if description_el else "Description not available"
                await detail_page.close()

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

            except Exception as e:
                print(f"⚠️ Failed to process Zip job card: {e}")
                continue

        await browser.close()
        write_jobs_csv(all_jobs, folder_name="job_data", label="zip_playwright")
        return all_jobs

# Run it
if __name__ == "__main__":
    asyncio.run(scrape_zip_with_playwright())
