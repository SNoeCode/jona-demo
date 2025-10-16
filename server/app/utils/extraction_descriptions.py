import time
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from webdriver_manager.chrome import ChromeDriverManager
from supabase import create_client
import os
from dotenv import load_dotenv
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager

load_dotenv()

# Supabase setup
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

# Description scraper
def extract_job_description(driver, job_url):
    selectors = [
        "#jdp_description",
        "div.jdp-description-details",
        ".job-description",
        "[data-testid='job-description']",
        ".job-posting-description",
        ".description",
        ".job-summary",
        ".job-details"
    ]

    try:
        driver.get(job_url)
        time.sleep(3)

        for selector in selectors:
            try:
                WebDriverWait(driver, 5).until(
                    EC.presence_of_element_located((By.CSS_SELECTOR, selector))
                )
                desc_elem = driver.find_element(By.CSS_SELECTOR, selector)
                description = desc_elem.text.strip()
                if description:
                    print(f"✅ Found description with selector: {selector}")
                    return description
            except Exception:
                continue

        print("⚠️ No description found")
        return "Description not available"

    except Exception as e:
        print(f"❌ Failed to extract description: {e}")
        return "Description extraction failed"

# Main repair loop
def repair_missing_descriptions():
    jobs = supabase.table("jobs").select("id", "url").eq("job_description", "Description not available").execute().data
    print(f"🔍 Found {len(jobs)} jobs needing description repair")

    options = webdriver.ChromeOptions()
    options.add_argument("--headless")

    service = Service(ChromeDriverManager().install())
    driver = webdriver.Chrome(service=service, options=options)

    for job in jobs:
        job_id = job["id"]
        job_url = job["url"]
        print(f"\n🔧 Processing job: {job_id}")

        description = extract_job_description(driver, job_url)

        supabase.table("jobs").update({ "job_description": description }).eq("id", job_id).execute()
        print(f"📦 Updated job {job_id} with new description")

    driver.quit()
    print("✅ All jobs processed")

if __name__ == "__main__":
    repair_missing_descriptions()