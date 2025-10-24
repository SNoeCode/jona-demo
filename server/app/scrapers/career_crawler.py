# import time
# import uuid
# import traceback
# import json
# from datetime import datetime

# from selenium.webdriver.common.by import By
# from selenium.webdriver.support.ui import WebDriverWait
# from selenium.webdriver.support import expected_conditions as EC
# from selenium.common.exceptions import InvalidSessionIdException, TimeoutException
# from app.scrapers.selenium_browser import configure_driver
# from app.utils.common import TECH_KEYWORDS, LOCATION, PAGES_PER_KEYWORD, MAX_DAYS
# from app.db.connect_database import get_db_connection
# from app.db.cleanup import cleanup
# from app.utils.write_jobs import write_jobs_csv
# from app.utils.skills_engine import (
#     load_all_skills,
#     extract_flat_skills,
#     extract_skills_by_category
# )

# SKILLS = load_all_skills()


# def insert_job_to_db(job: dict):
#     """Insert job with proper error handling"""
#     try:
#         conn = get_db_connection()
#         cur = conn.cursor()
        
#         print(f"➡️ Inserting: {job['title'][:50]} | {job.get('company', 'N/A')}")
        
#         cur.execute("""
#             INSERT INTO jobs (
#                 id, title, company, job_location, job_state, salary, site,
#                 date, applied, saved, url, job_description, search_term,
#                 category, priority, status, inserted_at, last_verified,
#                 skills, skills_by_category, user_id
#             ) VALUES (
#                 %s, %s, %s, %s, %s, %s, %s,
#                 %s, %s, %s, %s, %s, %s,
#                 %s, %s, %s, %s, %s,
#                 %s, %s, %s
#             )
#             ON CONFLICT (url) DO NOTHING
#             RETURNING id
#         """, (
#             str(uuid.uuid4()),
#             job["title"],
#             job.get("company", "N/A"),
#             job.get("job_location", LOCATION),
#             job.get("job_state", LOCATION.lower()),
#             job.get("salary", "N/A"),
#             job["site"],
#             job["date"],
#             job.get("applied", False),
#             job.get("saved", False),
#             job["url"],
#             job.get("job_description", ""),
#             job.get("search_term", ""),
#             job.get("category"),
#             job.get("priority", 0),
#             job.get("status", "new"),
#             datetime.utcnow(),
#             job.get("last_verified"),
#             json.dumps(job.get("skills", [])),
#             json.dumps(job.get("skills_by_category", {})),
#             job.get("user_id")
#         ))
        
#         result = cur.fetchone()
#         conn.commit()
        
#         if result:
#             print(f"✅ Inserted job ID: {result[0]}")
#             return True
#         else:
#             print(f"⚠️ Duplicate job (skipped)")
#             return False
            
#     except Exception as e:
#         print(f"❌ DB insert error: {e}")
#         traceback.print_exc()
#         return False
#     finally:
#         cur.close()
#         conn.close()


# def crawl_career_builder(location=LOCATION, pages=PAGES_PER_KEYWORD, days=MAX_DAYS):
#     """
#     Crawl CareerBuilder for job listings with description extraction
#     """
#     base_url = "https://www.careerbuilder.com"
#     driver = None
#     jobs = []
#     seen_urls = set()
#     inserted_count = 0

#     try:
#         # Initialize driver
#         driver = configure_driver()
#         if not driver:
#             print("❌ Failed to initialize WebDriver")
#             return jobs

#         for keyword in TECH_KEYWORDS:
#             print(f"\n🔍 Crawling '{keyword}' in '{location}'")
            
#             for page in range(1, pages + 1):
#                 url = f"{base_url}/jobs?keywords={'+'.join(keyword.split())}&location={location}&page_number={page}"

#                 # Check if driver is still alive
#                 if not driver or not hasattr(driver, 'session_id') or not driver.session_id:
#                     print("💥 Restarting WebDriver session...")
#                     try:
#                         if driver:
#                             driver.quit()
#                     except:
#                         pass
#                     driver = configure_driver()
#                     if not driver:
#                         print("❌ Failed to restart driver, skipping...")
#                         continue

#                 try:
#                     driver.get(url)
#                     time.sleep(3)
                    
#                     # Wait for job cards to load with multiple selectors
#                     try:
#                         WebDriverWait(driver, 10).until(
#                             EC.presence_of_element_located((
#                                 By.CSS_SELECTOR, 
#                                 "li.data-results-content-parent, .job-listing-item, [data-testid='job-card']"
#                             ))
#                         )
#                     except TimeoutException:
#                         print(f"⚠️ Timeout waiting for job cards on page {page}")
#                         continue
                
#                 except Exception as e:
#                     print(f"⚠️ Error loading search page {page} for '{keyword}': {e}")
#                     continue

#                 # Find all job cards with multiple selectors
#                 cards = []
#                 card_selectors = [
#                     "li.data-results-content-parent",
#                     ".job-listing-item",
#                     "[data-testid='job-card']",
#                     ".data-results-content"
#                 ]
                
#                 for selector in card_selectors:
#                     try:
#                         cards = driver.find_elements(By.CSS_SELECTOR, selector)
#                         if cards:
#                             print(f"📄 Found {len(cards)} job cards on page {page} using: {selector}")
#                             break
#                     except:
#                         continue
                
#                 if not cards:
#                     print(f"⚠️ No job cards found on page {page}")
#                     continue

#                 for idx, card in enumerate(cards):
#                     try:
#                         # Verify driver is still alive
#                         if not driver or not hasattr(driver, 'session_id') or not driver.session_id:
#                             raise InvalidSessionIdException("Dead session during card loop")

#                         # Extract job details from card
#                         title_selectors = [
#                             ".data-results-title",
#                             "h2.job-title",
#                             "[data-testid='job-title']"
#                         ]
#                         title = ""
#                         for sel in title_selectors:
#                             try:
#                                 title = card.find_element(By.CSS_SELECTOR, sel).text.strip()
#                                 if title:
#                                     break
#                             except:
#                                 continue
                        
#                         if not title:
#                             continue

#                         # Extract company and location
#                         spans = card.find_elements(By.CSS_SELECTOR, ".data-details span, .job-details span")
#                         company = spans[0].text.strip() if spans else "N/A"
#                         job_location = spans[1].text.strip() if len(spans) > 1 else location
#                         job_state = job_location.lower()
                        
#                         # Get job URL
#                         link_selectors = [
#                             "a.job-listing-item",
#                             "a[data-testid='job-link']",
#                             "h2 a",
#                             "a.data-results-title"
#                         ]
#                         href = ""
#                         for sel in link_selectors:
#                             try:
#                                 href = card.find_element(By.CSS_SELECTOR, sel).get_attribute("href") or ""
#                                 if href:
#                                     break
#                             except:
#                                 continue
                        
#                         if not href or href in seen_urls:
#                             continue
                        
#                         seen_urls.add(href)
#                         job_url = href if href.startswith("http") else base_url + href

#                         # ✅ CRITICAL: Visit job page to get FULL DESCRIPTION
#                         description = ""
#                         try:
#                             current_url = driver.current_url
#                             driver.get(job_url)
#                             time.sleep(2)
                            
#                             # Wait for description with multiple selectors
#                             desc_selectors = [
#                                 "#jdp_description",
#                                 ".jdp_description",
#                                 "[data-testid='job-description']",
#                                 ".job-description-content",
#                                 "#job-description"
#                             ]
                            
#                             for sel in desc_selectors:
#                                 try:
#                                     desc_element = WebDriverWait(driver, 8).until(
#                                         EC.presence_of_element_located((By.CSS_SELECTOR, sel))
#                                     )
#                                     description = desc_element.text.strip()
#                                     if description:
#                                         print(f"✅ Extracted description ({len(description)} chars) using: {sel}")
#                                         break
#                                 except:
#                                     continue
                            
#                             if not description:
#                                 print(f"⚠️ No description found for: {title}")
                            
#                             # Go back to search results
#                             driver.get(current_url)
#                             time.sleep(2)
#                             driver.refresh()
#                             time.sleep(3)


#                         except Exception as e:
#                             print(f"⚠️ Error extracting description: {e}")
#                             description = ""

#                         # Extract skills from description
#                         flat_skills = extract_flat_skills(description, SKILLS["flat"]) if description else []
#                         categorized_skills = extract_skills_by_category(description, SKILLS["matrix"]) if description else {}

#                         # Create job object
#                         job = {
#                             "id": str(uuid.uuid4()),
#                             "title": title,
#                             "company": company,
#                             "job_location": job_location,
#                             "job_state": job_state,
#                             "date": datetime.today().date(),
#                             "site": "CareerBuilder",
#                             "job_description": description,
#                             "salary": "N/A",
#                             "url": job_url,
#                             "applied": False,
#                             "saved": False,
#                             "search_term": keyword,
#                             "skills": flat_skills,
#                             "skills_by_category": categorized_skills,
#                             "priority": 0,
#                             "status": "new",
#                             "category": None,
#                             "inserted_at": datetime.utcnow(),
#                             "last_verified": None,
#                             "user_id": None
#                         }

#                         # Insert to database
#                         if insert_job_to_db(job):
#                             inserted_count += 1
                        
#                         jobs.append(job)

#                     except InvalidSessionIdException:
#                         print("💥 Rebuilding driver mid-loop...")
#                         try:
#                             if driver:
#                                 driver.quit()
#                         except:
#                             pass
#                         driver = configure_driver()
#                         break
                    
#                     except Exception as e:
#                         print(f"❌ Error parsing job {idx}: {e}")
#                         traceback.print_exc()
#                         continue

#     except Exception as e:
#         print(f"❌ Critical error in crawler: {e}")
#         traceback.print_exc()
    
#     finally:
#         # Clean up driver
#         try:
#             if driver:
#                 driver.quit()
#         except:
#             pass

#         # Save results and cleanup
#         if jobs:
#             write_jobs_csv(jobs, folder_name="job_data", label="careerbuilder")
        
#         cleanup(days)
#         print(f"\n✅ CareerBuilder: {len(jobs)} jobs found, {inserted_count} inserted to DB")

#     return jobs


# if __name__ == "__main__":
#     # For testing
#     jobs = crawl_career_builder()
#     print(f"Collected {len(jobs)} jobs")
import time
import uuid
import traceback
from datetime import datetime

from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import InvalidSessionIdException
from app.scrapers.selenium_browser import configure_driver
from app.utils.common import TECH_KEYWORDS, LOCATION, PAGES_PER_KEYWORD, MAX_DAYS
from app.db.sync_jobs import insert_job_to_db
from app.db.cleanup import cleanup
from app.utils.write_jobs import write_jobs_csv
from app.utils.skills_engine import (
    load_all_skills,
    extract_flat_skills,
    extract_skills_by_category
)

SKILLS = load_all_skills()


def crawl_career_builder(location=LOCATION, pages=PAGES_PER_KEYWORD, days=MAX_DAYS):
    """
    Crawl CareerBuilder for job listings
    
    Args:
        location: Location to search (default from config)
        pages: Number of pages per keyword (default from config)
        days: Days to keep jobs (default from config)
    
    Returns:
        List of job dictionaries
    """
    base_url = "https://www.careerbuilder.com/jobs"
    driver = None
    jobs = []
    seen_urls = set()

    try:
        # Initialize driver
        driver = configure_driver()
        if not driver:
            print("❌ Failed to initialize WebDriver")
            return jobs

        for keyword in TECH_KEYWORDS:
            print(f"\n🔍 Crawling '{keyword}' in '{location}'")
            
            for page in range(1, pages + 1):
                url = f"{base_url}/?keywords={'+'.join(keyword.split())}&location={location}&page_number={page}"

                # Check if driver is still alive
                if not driver or not hasattr(driver, 'session_id') or not driver.session_id:
                    print("💥 Restarting WebDriver session...")
                    try:
                        if driver:
                            driver.quit()
                    except:
                        pass
                    driver = configure_driver()
                    if not driver:
                        print("❌ Failed to restart driver, skipping...")
                        continue

                try:
                    driver.get(url)
                    time.sleep(2)
                    
                    # Wait for job cards to load
                    WebDriverWait(driver, 10).until(
                        EC.presence_of_element_located((By.CSS_SELECTOR, "li.data-results-content-parent"))
                    )
                
                except Exception as e:
                    print(f"⚠️ Error loading search page {page} for '{keyword}': {e}")
                    continue

                # Find all job cards
                try:
                    cards = driver.find_elements(By.CSS_SELECTOR, "li.data-results-content-parent")
                except:
                    cards = []
                
                print(f"📄 Found {len(cards)} job cards on page {page}")

                for card in cards:
                    try:
                        # Verify driver is still alive
                        if not driver or not hasattr(driver, 'session_id') or not driver.session_id:
                            raise InvalidSessionIdException("Dead session during card loop")

                        # Extract job details
                        title = card.find_element(By.CSS_SELECTOR, ".data-results-title").text.strip()
                        spans = card.find_elements(By.CSS_SELECTOR, ".data-details span")
                        company = spans[0].text.strip() if spans else "N/A"
                        job_location = spans[1].text.strip() if len(spans) > 1 else location
                        job_state = job_location.lower()
                        
                        # Get job URL
                        href = card.find_element(By.CSS_SELECTOR, "a.job-listing-item").get_attribute("href") or ""
                        
                        if not href or href in seen_urls:
                            continue
                        
                        seen_urls.add(href)
                        job_url = href if href.startswith("http") else base_url + href

                        # Create job object
                        job = {
                            "id": str(uuid.uuid4()),
                            "title": title,
                            "company": company,
                            "job_location": job_location,
                            "job_state": job_state,
                            "date": datetime.today().date(),
                            "site": "CareerBuilder",
                            "job_description": "",
                            "salary": "N/A",
                            "url": job_url,
                            "applied": False,
                            "search_term": keyword,
                            "skills": [],
                            "skills_by_category": {},
                            "priority": 0,
                            "status": "new",
                            "category": None,
                            "inserted_at": datetime.utcnow(),
                            "last_verified": None,
                            "user_id": None
                        }

                        # Insert to database
                        insert_job_to_db(job)
                        jobs.append(job)

                    except InvalidSessionIdException:
                        print("💥 Rebuilding driver mid-loop...")
                        try:
                            if driver:
                                driver.quit()
                        except:
                            pass
                        driver = configure_driver()
                        break
                    
                    except Exception as e:
                        print(f"❌ Error parsing job: {e}")
                        if hasattr(e, '__traceback__'):
                            traceback.print_exc()
                        continue

    except Exception as e:
        print(f"❌ Critical error in crawler: {e}")
        traceback.print_exc()
    
    finally:
        # Clean up driver
        try:
            if driver:
                driver.quit()
        except:
            pass

        # Save results and cleanup
        if jobs:
            write_jobs_csv(jobs, folder_name="job_data", label="careerbuilder")
        
        cleanup(days)
        print(f"\n✅ CareerBuilder crawler collected {len(jobs)} jobs.")

    return jobs


if __name__ == "__main__":
    # For testing
    jobs = crawl_career_builder()
    print(f"Collected {len(jobs)} jobs")
 