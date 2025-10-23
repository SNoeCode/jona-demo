from playwright.sync_api import sync_playwright
from app.utils.extraction_descriptions import extract_job_description
from app.db.sync_jobs import insert_job_to_db
from app.utils.write_jobs import write_jobs_csv
from app.utils.common import LOCATION, PAGES_PER_KEYWORD, TECH_KEYWORDS
from app.utils.skills_engine import (
    load_all_skills,
    extract_flat_skills,
    extract_skills_by_category
)
from datetime import datetime
import uuid
import time
import os
from urllib.parse import quote_plus

HEADLESS_PATH = os.getenv("HEADLESS_PATH")
SKILLS = load_all_skills()

def scrape_monster_jobs(location=LOCATION, pages=PAGES_PER_KEYWORD):
    all_jobs = []

    with sync_playwright() as p:
        browser = p.chromium.launch(
            headless=False,  # Headless must be False to manually solve CAPTCHA
            executable_path=HEADLESS_PATH
        )
        # Create an interactive context to solve the CAPTCHA and then persist its storage state
        context = browser.new_context()
        page = context.new_page()

        # Trigger CAPTCHA manually and wait for user to complete it
        page.goto(f"https://www.monster.com/jobs/search?q=software+engineer&where={location}")
        input("🔐 Complete CAPTCHA in browser and press Enter to continue...")

        # Save the solved session so it can be reused in subsequent contexts
        context.storage_state(path="monster_state.json")
        context.close()

        # Recreate a new context that loads the saved authenticated state
        context = browser.new_context(storage_state="monster_state.json")
        page = context.new_page()

        for keyword in TECH_KEYWORDS:
            print(f"\n🔍 Crawling '{keyword}' in '{location}'")

            for page_num in range(1, pages + 1):
                search_url = f"https://www.monster.com/jobs/search?q={quote_plus(keyword)}&where={location}&page={page_num}&so=m.u.sh"
                page.goto(search_url)
                page.wait_for_timeout(3000)

                job_cards = page.query_selector_all("#JobCardGrid article button")
                print(f"🧾 Found {len(job_cards)} job cards on page {page_num}")

                for card in job_cards:
                    try:
                        card.click()
                        page.wait_for_selector("#job-view-header", timeout=5000)
                        time.sleep(1)  # Let the panel render

                        title = page.query_selector("#job-view-header > div")
                        title_text = title.inner_text().strip() if title else "Unknown"

                        company = page.query_selector(".about-styles__AboutCompanyContainerOuter-sc-dc2bd39b-0")
                        company_text = company.inner_text().strip() if company else "Unknown"

                        location_block = page.query_selector(".numbers-and-facts-styles__NumbersAndFactsContainerOuter-sc-e3beecf5-0")
                        location_text = location_block.inner_text().strip() if location_block else location

                        job_description_block = page.query_selector(".description-styles__DescriptionContainerOuter-sc-6e39f119-0")
                        job_description = job_description_block.inner_text().strip() if job_description_block else "No description found"

                        flat_skills = extract_flat_skills(job_description, SKILLS["flat"])
                        skills_by_category = extract_skills_by_category(job_description, SKILLS["matrix"])

                        job = {
                            "id": str(uuid.uuid4()),
                            "title": title_text,
                            "company": company_text,
                            "job_location": location_text,
                            "job_state": location,
                            "salary": "N/A",
                            "site": "Monster",
                            "date": datetime.utcnow().date().isoformat(),
                            "applied": False,
                            "saved": False,
                            "url": page.url,
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

        browser.close()
        write_jobs_csv(all_jobs, label="monster_playwright")
        return all_jobs

# from playwright.sync_api import sync_playwright
# from app.utils.extraction_descriptions import extract_job_description
# from app.db.sync_jobs import insert_job_to_db
# from app.utils.write_jobs import write_jobs_csv
# from app.utils.common import LOCATION, PAGES_PER_KEYWORD, TECH_KEYWORDS
# from app.utils.skills_engine import (
#     load_all_skills,
#     extract_flat_skills,
#     extract_skills_by_category
# )
# from datetime import datetime
# import uuid
# import time
# import os

# HEADLESS_PATH = os.getenv("HEADLESS_PATH")
# SKILLS = load_all_skills()

# def scrape_monster_jobs(location=LOCATION, pages=PAGES_PER_KEYWORD):
#     all_jobs = []

#     with sync_playwright() as p:
#         browser = p.chromium.launch(
#             headless=True,
#             executable_path=HEADLESS_PATH
#         )
#         context = browser.new_context()
#         page = context.new_page()

#         # Trigger CAPTCHA manually
#         page.goto(f"https://www.monster.com/jobs/search?q=software+engineer&where={location}")
#         input("🔐 Complete CAPTCHA and press Enter to continue...")

#         for keyword in TECH_KEYWORDS:
#             print(f"\n🔍 Crawling '{keyword}' in '{location}'")

#             for page_num in range(1, pages + 1):
#                 search_url = f"https://www.monster.com/jobs/search?q={'+'.join(keyword.split())}&where={location}&page={page_num}"
#                 page.goto(search_url)
#                 page.wait_for_timeout(3000)
#                 job_cards = page.query_selector_all("#JobCardGrid article button")
#                 # job_cards = page.query_selector_all("li.data-results-content-parent")

#                 for card in job_cards:
#                     try:
#                         title = card.query_selector("h2, h3, a").inner_text().strip()
#                         company = card.query_selector(".company").inner_text().strip() if card.query_selector(".company") else "Unknown"
#                         location_text = card.query_selector(".location").inner_text().strip() if card.query_selector(".location") else "Unknown"
#                         link = card.query_selector("a").get_attribute("href")

#                         # Open job detail page
#                         detail_page = context.new_page()
#                         detail_page.goto(link)
#                         detail_page.wait_for_timeout(3000)

#                         job_description = extract_job_description(detail_page, link)
#                         detail_page.close()

#                         flat_skills = extract_flat_skills(job_description, SKILLS["flat"])
#                         skills_by_category = extract_skills_by_category(job_description, SKILLS["matrix"])

#                         job = {
#                             "id": str(uuid.uuid4()),
#                             "title": title,
#                             "company": company,
#                             "job_location": location_text,
#                             "job_state": location,
#                             "salary": "N/A",
#                             "site": "Monster",
#                             "date": datetime.utcnow().date().isoformat(),
#                             "applied": False,
#                             "saved": False,
#                             "url": link,
#                             "job_description": job_description,
#                             "search_term": keyword,
#                             "category": None,
#                             "priority": None,
#                             "status": "new",
#                             "inserted_at": datetime.utcnow(),
#                             "last_verified": None,
#                             "skills": flat_skills,
#                             "skills_by_category": skills_by_category,
#                             "user_id": None
#                         }

#                         insert_job_to_db(job)
#                         all_jobs.append(job)

#                     except Exception as e:
#                         print(f"⚠️ Failed to process job card: {e}")
#                         continue

#         browser.close()
#         write_jobs_csv(all_jobs, label="monster_playwright")
#         return all_jobs