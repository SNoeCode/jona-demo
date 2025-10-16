import os
import time
import re
from datetime import datetime
from dotenv import load_dotenv
from firecrawl import FirecrawlApp
from typing import List, Dict
from app.utils.skills_engine import load_all_skills, extract_flat_skills
from app.db.sync_jobs import insert_job_to_db
from app.utils.write_jobs import write_jobs_csv
from app.utils.common import TECH_KEYWORDS, LOCATION, PAGES_PER_KEYWORD, MAX_DAYS
# 🔑 Load env vars
load_dotenv()
FIRECRAWL_API_KEY = os.getenv("FIRECRAWL_API_KEY")
if not FIRECRAWL_API_KEY:
    raise ValueError("Missing FIRECRAWL_API_KEY")

# 🔍 Init Firecrawl
app = FirecrawlApp(api_key=FIRECRAWL_API_KEY)

# 🔍 Search terms
def get_jobs_from_firecrawl(url: str, keyword: str, skills: List[str]) -> List[Dict]:
    result = app.scrape_url(url=url, formats=["markdown"], timeout=60000)
    if not result.markdown:
        print(f"⚠️ No markdown found at: {url}")
        return []

    job_cards = result.markdown.split("\n## ")[1:]
    jobs = []

    for card in job_cards:
        title = card.split("\n")[0].strip() or "Unknown Title"
        preview_text = "\n".join(card.split("\n")[1:]).strip()

        # Extract detail page URL
        url_match = re.search(r"\[.*?\]\((https://.*?)\)", card)
        job_url = url_match.group(1).strip() if url_match else url

        # 🔍 Scrape full job description from detail page
        detail_result = app.scrape_url(url=job_url, formats=["markdown"], timeout=60000)
        full_description = detail_result.markdown.strip() if detail_result and detail_result.markdown else preview_text

        matched_skills = extract_flat_skills(full_description, skills)

        # Parse location if available
        location_match = re.search(r"Location:\s*(.*)", card)
        location = location_match.group(1).strip() if location_match else "Remote"
        job_state = location.split(",")[-1].strip() if "," in location else location

        job = {
            "title": title,
            "company": "ZipRecruiter",
            "job_location": location,
            "job_state": job_state,
            "date": str(datetime.today().date()),
            "site": "ZipRecruiter",
            "job_description": full_description,
            "salary": "N/A",
            "url": job_url,
            "applied": False,
            "saved": False,
            "search_term": keyword,
            "category": None,
            "priority": 0,
            "status": "new",
            "inserted_at": datetime.utcnow(),
            "last_verified": None,
            "skills": matched_skills,
            "skills_by_category": {},
            "user_id": None
        }

        jobs.append(job)

    print(f"📦 Parsed {len(jobs)} enriched jobs for '{keyword}'")
    return jobs

def scrape_zip_and_insert(location: str = "Remote", days: int = 15) -> List[Dict]:
    skills = load_all_skills()["flat"]
    inserted_jobs = []

    for keyword in TECH_KEYWORDS:
        search_term = keyword.replace(" ", "+")
        url = f"https://www.ziprecruiter.com/jobs-search?search={search_term}&location={location}"
        print(f"\n🔍 Crawling: {keyword}")
        try:
            jobs = get_jobs_from_firecrawl(url, keyword, skills)
            for job in jobs:
                insert_job_to_db(job)
                inserted_jobs.append(job)
            time.sleep(2)
        except Exception as e:
            print(f"❌ Error for keyword '{keyword}':", e)
            continue

    print(f"\n✅ Finished. Inserted {len(inserted_jobs)} Zip jobs to Supabase.")
    return inserted_jobs