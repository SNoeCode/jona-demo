from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import undetected_chromedriver as uc
import time
from datetime import datetime, timedelta
import traceback
import random
import logging
from selenium.webdriver import ActionChains
from app.utils.skills_engine import load_all_skills, extract_flat_skills, extract_skills_by_category
from app.db.sync_jobs import insert_job_to_db
from app.utils.write_jobs import write_jobs_csv

# Set up logging
logger = logging.getLogger(__name__)

TECH_KEYWORDS = [
    "software engineer", 
    # "front-end developer", "backend developer", "full-stack developer",
    # "data analyst", "python developer", "react developer", "typescript developer",
    # "devops engineer", "cloud engineer", "qa engineer", "product designer",
    # "ui ux designer", "mobile developer", "android developer", "ios developer",
    # "machine learning engineer", "ai engineer", "data scientist", "security engineer"
]

LOCATION = "remote"
PAGES_PER_KEYWORD = 2
MAX_DAYS = 5
SKILLS = load_all_skills()

# def configure_driver(headless=True):
#     """Configure Chrome driver with headless option"""
#     try:
#         options = uc.ChromeOptions()
#         options.add_argument("--no-sandbox")
#         options.add_argument("--disable-dev-shm-usage")
#         options.add_argument("--disable-blink-features=AutomationControlled")
#         options.add_argument("--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36")
        
#         if headless:
#             options.add_argument("--headless=new")
#             options.add_argument("--disable-gpu")
#             options.add_argument("--window-size=1920,1080")
#             logger.info("✅ Configuring driver in HEADLESS mode")
#         else:
#             logger.info("✅ Configuring driver in VISIBLE mode")
        
#         # Create driver WITHOUT executing CDP command immediately
#         driver = uc.Chrome(options=options, headless=headless, use_subprocess=True)
        
#         # Add a small delay to ensure browser is fully initialized
#         time.sleep(1)
        
#         # Only execute CDP command if NOT in headless mode or if window is still open
#         try:
#             if not headless:
#                 driver.execute_cdp_cmd("Page.addScriptToEvaluateOnNewDocument", {
#                     "source": "Object.defineProperty(navigator, 'webdriver', {get: () => undefined})"
#                 })
#         except Exception as cdp_error:
#             # Log but don't fail - this is not critical
#             logger.warning(f"⚠️ Could not execute CDP command (non-critical): {cdp_error}")
        
#         logger.info("✅ Driver configured successfully")
#         return driver
        
#     except Exception as e:
#         logger.error(f"❌ Failed to configure driver: {e}")
#         logger.error(traceback.format_exc())
#         raise
def configure_driver(headless=True):
    """Configure Chrome driver with headless option"""
    try:
        options = uc.ChromeOptions()
        options.add_argument("--no-sandbox")
        options.add_argument("--disable-dev-shm-usage")
        options.add_argument("--disable-blink-features=AutomationControlled")
        options.add_argument("--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36")
        
        if headless:
            options.add_argument("--headless=new")
            options.add_argument("--disable-gpu")
            options.add_argument("--window-size=1920,1080")
            logger.info("✅ Configuring driver in HEADLESS mode")
        else:
            logger.info("✅ Configuring driver in VISIBLE mode")
        
        driver = uc.Chrome(options=options, headless=headless, use_subprocess=True)
        time.sleep(1)  # Wait for browser to initialize
        
        # Skip CDP command - it causes window to close in headless mode
        logger.info("✅ Driver configured successfully")
        return driver
        
    except Exception as e:
        logger.error(f"❌ Failed to configure driver: {e}")
        logger.error(traceback.format_exc())
        raise
def scrape_snag_jobs(location=LOCATION, keywords=None, headless=True, skip_captcha=True):
    """
    Scrape Snagajob with headless mode support
    
    Args:
        location: Job location to search
        keywords: List of search keywords
        headless: Run browser in headless mode
        skip_captcha: Skip CAPTCHA waiting (for automated runs)
    """
    driver = None
    all_jobs = []
    
    try:
        logger.info(f"🚀 Starting Snagajob scraper (headless={headless}, location={location})")
        
        # Use provided keywords or defaults
        search_keywords = keywords if keywords else TECH_KEYWORDS
        logger.info(f"📝 Using keywords: {search_keywords}")
        
        driver = configure_driver(headless=headless)
        if not driver:
            raise Exception("Driver failed to initialize")

        actions = ActionChains(driver)
        cutoff_date = datetime.today().date() - timedelta(days=MAX_DAYS)
        
        logger.info(f"📅 Will filter jobs from: {cutoff_date}")

        # Only prompt for CAPTCHA if not skipping and not headless
        if not skip_captcha and not headless:
            print("🔐 Solve CAPTCHA if needed, then press Enter to continue...")
            input("⏸️ Waiting for CAPTCHA resolution...")

        for keyword in search_keywords:
            try:
                logger.info(f"\n{'='*50}")
                logger.info(f"🔍 Searching for: '{keyword}'")
                logger.info(f"{'='*50}")
                
                for page_num in range(1, PAGES_PER_KEYWORD + 1):
                    try:
                        jobs_on_page = scrape_page(
                            driver=driver,
                            keyword=keyword,
                            page_num=page_num,
                            location=location,
                            actions=actions,
                            cutoff_date=cutoff_date
                        )
                        all_jobs.extend(jobs_on_page)
                        logger.info(f"✅ Page {page_num}: Found {len(jobs_on_page)} jobs")
                        
                    except Exception as e:
                        logger.error(f"❌ Error on page {page_num} for '{keyword}': {e}")
                        logger.error(traceback.format_exc())
                        continue
                        
            except Exception as e:
                logger.error(f"❌ Error processing keyword '{keyword}': {e}")
                logger.error(traceback.format_exc())
                continue

    except Exception as e:
        logger.error(f"❌ Critical error in scrape_snag_jobs: {e}")
        logger.error(traceback.format_exc())
        raise
        
    finally:
        if driver:
            try:
                driver.quit()
                logger.info("🛑 Driver closed successfully")
            except Exception as e:
                logger.error(f"⚠️ Error closing driver: {e}")

    # Save results
    if all_jobs:
        try:
            
            write_jobs_csv(all_jobs, folder_name="job_data", label="snag_selenium")
            logger.info(f"💾 Saved {len(all_jobs)} jobs to CSV")
        except Exception as e:
            logger.error(f"⚠️ Failed to write CSV: {e}")

    logger.info(f"\n{'='*50}")
    logger.info(f"📊 FINAL RESULTS: {len(all_jobs)} jobs scraped")
    logger.info(f"{'='*50}\n")
    
    return all_jobs


def scrape_page(driver, keyword, page_num, location, actions, cutoff_date):
    """Scrape a single page of job results"""
    jobs = []
    
    search_url = f"https://www.snagajob.com/search?q={'+'.join(keyword.split())}&w={location}&radius=20&page={page_num}"
    logger.info(f"\n🌐 Loading: {search_url}")
    
    driver.get(search_url)
    time.sleep(random.uniform(3.0, 4.5))

    # Wait for page to load
    try:
        WebDriverWait(driver, 15).until(
            EC.presence_of_element_located((By.TAG_NAME, "body"))
        )
        time.sleep(2)
        logger.info("✅ Page loaded successfully")
    except Exception as e:
        logger.error(f"❌ Page failed to load: {e}")
        raise
    
    # Find job cards
    job_cards = find_job_cards(driver)
    
    if not job_cards:
        logger.warning(f"⚠️ No job cards found on page {page_num}")
        return jobs
    
    logger.info(f"🎯 Found {len(job_cards)} job cards")

    # Process each job card
    for i, card in enumerate(job_cards):
        try:
            logger.info(f"\n👀 Processing job {i+1}/{len(job_cards)}")
            job = extract_job_details(driver, card, actions, keyword, cutoff_date)
            
            if job:
                jobs.append(job)
                logger.info(f"✅ Saved: '{job['title']}' at {job['company']}")
                logger.info(f"   Skills: {', '.join(job['skills'][:5])}")
            else:
                logger.info(f"⏭️ Skipped job {i+1}")
                
        except Exception as e:
            logger.error(f"⚠️ Failed to extract job {i+1}: {e}")
            continue
    
    return jobs


def find_job_cards(driver):
    """Find job cards using multiple selector strategies"""
    logger.info("🔍 Searching for job cards...")
    
    # Try to find results container
    possible_containers = [
        "div[class*='search']",
        "div.search-results",
        "div.job-results",
        "main",
        "div[role='main']"
    ]
    
    results_container = None
    for container_sel in possible_containers:
        try:
            container = driver.find_element(By.CSS_SELECTOR, container_sel)
            results_container = container
            logger.info(f"✅ Found container: {container_sel}")
            break
        except:
            continue
    
    # Try multiple job card selectors
    job_card_selectors = [
        "button[data-test='job-card']",
        "div[data-test='job-card']",
        "button[class*='job-card']",
        "div[class*='job-card']",
        "[class*='JobCard']",
        "article"
    ]
    
    job_cards = []
    for selector in job_card_selectors:
        try:
            if results_container:
                cards = results_container.find_elements(By.CSS_SELECTOR, selector)
            else:
                cards = driver.find_elements(By.CSS_SELECTOR, selector)
            
            if len(cards) > 1:
                job_cards = cards
                logger.info(f"✅ Using selector: '{selector}' ({len(cards)} cards)")
                return job_cards
        except:
            continue
    
    # Fallback: Find via Apply buttons
    if len(job_cards) <= 1:
        logger.info("🔄 Trying Apply Now button fallback...")
        try:
            apply_buttons = driver.find_elements(By.XPATH, "//button[contains(text(), 'Apply Now')]")
            logger.info(f"Found {len(apply_buttons)} Apply Now buttons")
            
            job_cards = []
            for btn in apply_buttons:
                try:
                    parent = btn
                    for _ in range(5):
                        parent = parent.find_element(By.XPATH, "..")
                        try:
                            parent.find_element(By.XPATH, ".//*[contains(@class, 'job') or contains(@class, 'title')]")
                            job_cards.append(parent)
                            break
                        except:
                            continue
                except:
                    continue
                    
            job_cards = list(set(job_cards))
            logger.info(f"✅ Found {len(job_cards)} cards via Apply buttons")
            
        except Exception as e:
            logger.error(f"❌ Apply button fallback failed: {e}")
    
    return job_cards


def extract_job_details(driver, card, actions, keyword, cutoff_date):
    """Extract details from a single job card"""
    try:
        # Scroll and hover
        driver.execute_script(
            "arguments[0].scrollIntoView({ behavior: 'smooth', block: 'center' });",
            card
        )
        time.sleep(random.uniform(0.8, 1.5))
        
        actions.move_to_element(card).pause(random.uniform(0.5, 1.2)).perform()
        time.sleep(random.uniform(0.3, 0.8))
        
        # Click card
        try:
            card.click()
        except:
            driver.execute_script("arguments[0].click();", card)
        time.sleep(random.uniform(1.5, 2.5))
        
        # Wait for details drawer
        try:
            drawer = WebDriverWait(driver, 15).until(
                EC.presence_of_element_located((By.CSS_SELECTOR, 
                    "mat-drawer job-details, job-details, div.job-details, [class*='job-detail']"))
            )
            time.sleep(random.uniform(1.5, 3.0))
        except Exception as e:
            logger.warning(f"⚠️ Drawer didn't load: {e}")
            return None
        
        description = drawer.text
        job_url = driver.current_url
        
        # Extract job details with fallbacks
        title = safe_find_text(drawer, "h2, h3, .job-title, h1, [class*='title']", "Unknown")
        company = safe_find_text(drawer, ".company-name, .job-company, [class*='company']", "Unknown")
        
        try:
            location_el = drawer.find_element(By.XPATH, "//div[contains(text(),'Location')]")
            location_text = location_el.text.split("Location")[-1].strip()
        except:
            location_text = "Remote"
        
        job_state = location_text.split(",")[-1].strip() if "," in location_text else "N/A"
        
        try:
            salary_el = drawer.find_element(By.XPATH, "//div[contains(text(),'Verified Pay') or contains(text(),'Pay')]")
            salary = salary_el.text.split("Verified Pay")[-1].split("Pay")[-1].strip()
        except:
            salary = "N/A"
        
        # Extract skills
        flat_skills = extract_flat_skills(description, SKILLS["flat"])
        categorized_skills = extract_skills_by_category(description, SKILLS["matrix"])
        
        job = {
            "title": title,
            "company": company,
            "job_location": location_text,
            "job_state": job_state,
            "date": datetime.today().date(),
            "site": "Snagajob",
            "job_description": description,
            "salary": salary,
            "url": job_url,
            "applied": False,
            "saved": False,
            "search_term": keyword,
            "category": None,
            "priority": None,
            "status": None,
            "inserted_at": datetime.utcnow().isoformat(),
            "last_verified": None,
            "skills": flat_skills,
            "skills_by_category": categorized_skills,
            "user_id": None
        }
        
        if job["date"] >= cutoff_date:
            insert_job_to_db(job)
            return job
        else:
            logger.info(f"⏳ Job too old: {title}")
            return None
            
    except Exception as e:
        logger.error(f"❌ Failed to extract job details: {e}")
        logger.error(traceback.format_exc())
        return None


def safe_find_text(element, selector, default="Unknown"):
    """Safely find text with fallback"""
    try:
        return element.find_element(By.CSS_SELECTOR, selector).text
    except:
        return default
    
    
    
    
    
    
    
    
# from selenium.webdriver.common.by import By
# from selenium.webdriver.support.ui import WebDriverWait
# from selenium.webdriver.support import expected_conditions as EC
# import undetected_chromedriver as uc
# import time
# import uuid
# from datetime import datetime, timedelta
# import json
# import traceback
# import random
# from selenium.webdriver import ActionChains
# import random
# from selenium.webdriver import ActionChains
# from app.utils.skills_engine import load_all_skills, extract_flat_skills, extract_skills_by_category
# from app.db.sync_jobs import insert_job_to_db
# from app.utils.write_jobs import write_jobs_csv

# TECH_KEYWORDS = [
#     "software engineer", "front-end developer", "backend developer", "full-stack developer",
#     "data analyst", "python developer", "react developer", "typescript developer",
#     "devops engineer", "cloud engineer", "qa engineer", "product designer",
#     "ui ux designer", "mobile developer", "android developer", "ios developer",
#     "machine learning engineer", "ai engineer", "data scientist", "security engineer"
# ]

# LOCATION = "remote"
# PAGES_PER_KEYWORD = 2
# MAX_DAYS = 5
# TECH_KEYWORDS = TECH_KEYWORDS
# SKILLS = load_all_skills()

# def configure_driver():
#     options = uc.ChromeOptions()
#     options.add_argument("--no-sandbox")
#     options.add_argument("--disable-dev-shm-usage")
#     options.add_argument("--disable-blink-features=AutomationControlled")
#     options.add_argument("user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64)")
#     driver = uc.Chrome(options=options, headless=False)
#     driver.execute_cdp_cmd("Page.addScriptToEvaluateOnNewDocument", {
#         "source": "Object.defineProperty(navigator, 'webdriver', {get: () => undefined})"
#     })
#     return driver

# def scrape_snag_jobs(location=LOCATION, keywords=TECH_KEYWORDS):
#     driver = configure_driver()
#     if not driver:
#         print("❌ Driver failed to launch")
#         return []

#     actions = ActionChains(driver)
#     all_jobs = []
#     cutoff_date = datetime.today().date() - timedelta(days=MAX_DAYS)

#     print("🔐 Solve CAPTCHA if needed, then press Enter to continue...")
#     input("⏸️ Waiting for CAPTCHA resolution...")

#     try:
#         for keyword in TECH_KEYWORDS:
#             for page_num in range(1, PAGES_PER_KEYWORD + 1):
#                 search_url = f"https://www.snagajob.com/search?q={'+'.join(keyword.split())}&w={LOCATION}&radius=20&page={page_num}"
#                 print(f"\n🧠 Searching '{keyword}' — page {page_num}")
#                 driver.get(search_url)
#                 time.sleep(random.uniform(3.0, 4.5))

#                 try:
#                     # Wait for page to load completely
#                     WebDriverWait(driver, 15).until(
#                         EC.presence_of_element_located((By.TAG_NAME, "body"))
#                     )
#                     time.sleep(2)
                    
#                     # DIAGNOSTIC: Print out HTML structure to find correct selector
#                     print("\n🔍 DIAGNOSTIC MODE - Looking for job card containers...")
                    
#                     # Try to find the main results container first
#                     possible_containers = [
#                         "div.search-results",
#                         "div.job-results",
#                         "div[class*='results']",
#                         "div[class*='search']",
#                         "main",
#                         "div[role='main']"
#                     ]
                    
#                     results_container = None
#                     for container_sel in possible_containers:
#                         try:
#                             container = driver.find_element(By.CSS_SELECTOR, container_sel)
#                             print(f"✅ Found container: {container_sel}")
#                             results_container = container
#                             break
#                         except:
#                             continue
                    
#                     # Now try multiple job card selectors
#                     job_card_selectors = [
#                         "button[data-test='job-card']",
#                         "div[data-test='job-card']",
#                         "a[data-test='job-card']",
#                         "button[class*='job-card']",
#                         "div[class*='job-card']",
#                         "a[class*='job-card']",
#                         "app-job-card",
#                         "[class*='JobCard']",
#                         "div.outline-none",
#                         "article",
#                         "li[class*='job']",
#                         "div[class*='listing']"
#                     ]
                    
#                     job_cards = []
#                     used_selector = None
                    
#                     for selector in job_card_selectors:
#                         try:
#                             if results_container:
#                                 cards = results_container.find_elements(By.CSS_SELECTOR, selector)
#                             else:
#                                 cards = driver.find_elements(By.CSS_SELECTOR, selector)
                            
#                             if len(cards) > 1:
#                                 job_cards = cards
#                                 used_selector = selector
#                                 print(f"✅ Using selector '{selector}' - Found {len(cards)} cards")
#                                 break
#                             elif len(cards) == 1:
#                                 print(f"⚠️ Selector '{selector}' only found 1 card (might be selected card)")
#                         except Exception as e:
#                             continue
                    
#                     # If still only 1 card, try getting all clickable elements with job info
#                     if len(job_cards) <= 1:
#                         print("🔄 Trying alternative approach - looking for clickable elements with 'Apply Now'...")
#                         try:
#                             # Look for all elements that contain "Apply Now" button
#                             apply_buttons = driver.find_elements(By.XPATH, "//button[contains(text(), 'Apply Now')]")
#                             print(f"Found {len(apply_buttons)} 'Apply Now' buttons")
                            
#                             # Get parent containers of apply buttons
#                             job_cards = []
#                             for btn in apply_buttons:
#                                 # Go up several levels to find the job card container
#                                 try:
#                                     parent = btn
#                                     for _ in range(5):  # Try going up 5 levels
#                                         parent = parent.find_element(By.XPATH, "..")
#                                         # Check if this parent has a job title
#                                         try:
#                                             parent.find_element(By.XPATH, ".//*[contains(@class, 'job') or contains(@class, 'title')]")
#                                             job_cards.append(parent)
#                                             break
#                                         except:
#                                             continue
#                                 except:
#                                     continue
                            
#                             job_cards = list(set(job_cards))  # Remove duplicates
#                             print(f"✅ Found {len(job_cards)} unique job cards via Apply buttons")
#                             used_selector = "Apply Now button parent method"
#                         except Exception as e:
#                             print(f"❌ Apply button method failed: {e}")
                    
#                     if not job_cards or len(job_cards) == 0:
#                         print(f"❌ No job cards found with any selector")
                        
#                         # Final diagnostic - dump first 500 chars of page source
#                         print("\n📋 Page source preview:")
#                         print(driver.page_source[:500])
#                         continue
                    
#                     print(f"\n🧪 Found {len(job_cards)} job cards using: {used_selector}")

#                     for i, card in enumerate(job_cards):
#                         try:
#                             print(f"\n👀 Reviewing job {i+1} of {len(job_cards)}")

#                             # Smooth scroll and hover
#                             driver.execute_script("""
#                                 const element = arguments[0];
#                                 element.scrollIntoView({ behavior: 'smooth', block: 'center' });
#                             """, card)
#                             time.sleep(random.uniform(0.8, 1.5))

#                             actions.move_to_element(card).pause(random.uniform(0.5, 1.2)).perform()
#                             time.sleep(random.uniform(0.3, 0.8))

#                             # Click with fallback
#                             try:
#                                 card.click()
#                             except:
#                                 driver.execute_script("arguments[0].click();", card)
#                             time.sleep(random.uniform(1.5, 2.5))

#                             # Wait for job-details drawer
#                             try:
#                                 drawer = WebDriverWait(driver, 15).until(
#                                     EC.presence_of_element_located((By.CSS_SELECTOR, "mat-drawer job-details, job-details, div.job-details, [class*='job-detail']"))
#                                 )
#                                 time.sleep(random.uniform(1.5, 3.0))
#                             except:
#                                 print(f"⚠️ Drawer didn't load for job {i+1}, skipping...")
#                                 continue

#                             description = drawer.text
#                             job_url = driver.current_url

#                             # Extract details
#                             try:
#                                 title = drawer.find_element(By.CSS_SELECTOR, "h2, h3, .job-title, h1, [class*='title']").text
#                             except:
#                                 title = "Unknown"

#                             try:
#                                 company = drawer.find_element(By.CSS_SELECTOR, ".company-name, .job-company, [class*='company']").text
#                             except:
#                                 company = "Unknown"

#                             try:
#                                 location_el = drawer.find_element(By.XPATH, "//div[contains(text(),'Location')]")
#                                 location_text = location_el.text.split("Location")[-1].strip()
#                             except:
#                                 location_text = LOCATION

#                             job_state = location_text.split(",")[-1].strip() if "," in location_text else "N/A"

#                             try:
#                                 salary_el = drawer.find_element(By.XPATH, "//div[contains(text(),'Verified Pay') or contains(text(),'Pay')]")
#                                 salary = salary_el.text.split("Verified Pay")[-1].split("Pay")[-1].strip()
#                             except:
#                                 salary = "N/A"

#                             flat_skills = extract_flat_skills(description, SKILLS["flat"])
#                             categorized_skills = extract_skills_by_category(description, SKILLS["matrix"])

#                             job = {
#                                 "title": title,
#                                 "company": company,
#                                 "job_location": location_text,
#                                 "job_state": job_state,
#                                 "date": datetime.today().date(),
#                                 "site": "Snagajob",
#                                 "job_description": description,
#                                 "salary": salary,
#                                 "url": job_url,
#                                 "applied": False,
#                                 "saved": False,
#                                 "search_term": keyword,
#                                 "category": None,
#                                 "priority": None,
#                                 "status": None,
#                                 "inserted_at": datetime.utcnow().isoformat(),
#                                 "last_verified": None,
#                                 "skills": flat_skills,
#                                 "skills_by_category": categorized_skills,
#                                 "user_id": None
#                             }

#                             if job["date"] >= cutoff_date:
#                                 insert_job_to_db(job)
#                                 all_jobs.append(job)
#                                 print(f"✅ Saved '{title}' to Supabase. Skills: {', '.join(flat_skills[:3])}")
#                             else:
#                                 print(f"⏳ Skipped old job: {title}")

#                         except Exception as e:
#                             print(f"⚠️ Failed to extract job {i+1}: {e}")
#                             traceback.print_exc()
#                             continue

#                 except Exception as e:
#                     print(f"❌ Failed to load job cards for '{keyword}' page {page_num}: {e}")
#                     traceback.print_exc()

#     finally:
#         driver.quit()

#     if all_jobs:
#         write_jobs_csv(all_jobs, folder_name="job_data", label="snag_selenium")

#     print(f"\n📊 Total jobs saved: {len(all_jobs)}")
#     print("🛠️ All done! You crushed it, Shanna.")

#     return all_jobs


# from selenium.webdriver.common.by import By
# from selenium.webdriver.support.ui import WebDriverWait
# from selenium.webdriver.support import expected_conditions as EC
# import undetected_chromedriver as uc
# import time
# import uuid
# from datetime import datetime, timedelta
# import json
# import traceback
# import random
# from selenium.webdriver import ActionChains
# import random
# from selenium.webdriver import ActionChains
# from app.utils.skills_engine import load_all_skills, extract_flat_skills, extract_skills_by_category
# from app.db.sync_jobs import insert_job_to_db
# from app.utils.write_jobs import write_jobs_csv

# TECH_KEYWORDS = [
#     "software engineer", "front-end developer", "backend developer", "full-stack developer",
#     "data analyst", "python developer", "react developer", "typescript developer",
#     "devops engineer", "cloud engineer", "qa engineer", "product designer",
#     "ui ux designer", "mobile developer", "android developer", "ios developer",
#     "machine learning engineer", "ai engineer", "data scientist", "security engineer"
# ]

# LOCATION = "remote"
# PAGES_PER_KEYWORD = 2
# MAX_DAYS = 5
# TECH_KEYWORDS = TECH_KEYWORDS
# SKILLS = load_all_skills()

# def configure_driver():
#     options = uc.ChromeOptions()
#     options.add_argument("--no-sandbox")
#     options.add_argument("--disable-dev-shm-usage")
#     options.add_argument("--disable-blink-features=AutomationControlled")
#     options.add_argument("user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64)")
#     driver = uc.Chrome(options=options, headless=False)
#     driver.execute_cdp_cmd("Page.addScriptToEvaluateOnNewDocument", {
#         "source": "Object.defineProperty(navigator, 'webdriver', {get: () => undefined})"
#     })
#     return driver

# def scrape_snag_jobs(location=LOCATION, keywords=TECH_KEYWORDS):
#     driver = configure_driver()
#     if not driver:
#         print("❌ Driver failed to launch")
#         return []

#     actions = ActionChains(driver)
#     all_jobs = []
#     cutoff_date = datetime.today().date() - timedelta(days=MAX_DAYS)

#     print("🔐 Solve CAPTCHA if needed, then press Enter to continue...")
#     input("⏸️ Waiting for CAPTCHA resolution...")

#     try:
#         for keyword in TECH_KEYWORDS:
#             for page_num in range(1, PAGES_PER_KEYWORD + 1):
#                 search_url = f"https://www.snagajob.com/search?q={'+'.join(keyword.split())}&w={LOCATION}&radius=20&page={page_num}"
#                 print(f"\n🧠 Searching '{keyword}' — page {page_num}")
#                 driver.get(search_url)
#                 time.sleep(random.uniform(3.0, 4.5))

#                 try:
#                     # Wait for page to load completely
#                     WebDriverWait(driver, 15).until(
#                         EC.presence_of_element_located((By.TAG_NAME, "body"))
#                     )
#                     time.sleep(2)
                    
#                     # DIAGNOSTIC: Print out HTML structure to find correct selector
#                     print("\n🔍 DIAGNOSTIC MODE - Looking for job card containers...")
                    
#                     # Try to find the main results container first
#                     possible_containers = [
#                         "div.search-results",
#                         "div.job-results",
#                         "div[class*='results']",
#                         "div[class*='search']",
#                         "main",
#                         "div[role='main']"
#                     ]
                    
#                     results_container = None
#                     for container_sel in possible_containers:
#                         try:
#                             container = driver.find_element(By.CSS_SELECTOR, container_sel)
#                             print(f"✅ Found container: {container_sel}")
#                             results_container = container
#                             break
#                         except:
#                             continue
                    
#                     # Now try multiple job card selectors
#                     job_card_selectors = [
#                         "button[data-test='job-card']",
#                         "div[data-test='job-card']",
#                         "a[data-test='job-card']",
#                         "button[class*='job-card']",
#                         "div[class*='job-card']",
#                         "a[class*='job-card']",
#                         "app-job-card",
#                         "[class*='JobCard']",
#                         "div.outline-none",
#                         "article",
#                         "li[class*='job']",
#                         "div[class*='listing']"
#                     ]
                    
#                     job_cards = []
#                     used_selector = None
                    
#                     for selector in job_card_selectors:
#                         try:
#                             if results_container:
#                                 cards = results_container.find_elements(By.CSS_SELECTOR, selector)
#                             else:
#                                 cards = driver.find_elements(By.CSS_SELECTOR, selector)
                            
#                             if len(cards) > 1:
#                                 job_cards = cards
#                                 used_selector = selector
#                                 print(f"✅ Using selector '{selector}' - Found {len(cards)} cards")
#                                 break
#                             elif len(cards) == 1:
#                                 print(f"⚠️ Selector '{selector}' only found 1 card (might be selected card)")
#                         except Exception as e:
#                             continue
                    
#                     # If still only 1 card, try getting all clickable elements with job info
#                     if len(job_cards) <= 1:
#                         print("🔄 Trying alternative approach - looking for clickable elements with 'Apply Now'...")
#                         try:
#                             # Look for all elements that contain "Apply Now" button
#                             apply_buttons = driver.find_elements(By.XPATH, "//button[contains(text(), 'Apply Now')]")
#                             print(f"Found {len(apply_buttons)} 'Apply Now' buttons")
                            
#                             # Get parent containers of apply buttons
#                             job_cards = []
#                             for btn in apply_buttons:
#                                 # Go up several levels to find the job card container
#                                 try:
#                                     parent = btn
#                                     for _ in range(5):  # Try going up 5 levels
#                                         parent = parent.find_element(By.XPATH, "..")
#                                         # Check if this parent has a job title
#                                         try:
#                                             parent.find_element(By.XPATH, ".//*[contains(@class, 'job') or contains(@class, 'title')]")
#                                             job_cards.append(parent)
#                                             break
#                                         except:
#                                             continue
#                                 except:
#                                     continue
                            
#                             job_cards = list(set(job_cards))  # Remove duplicates
#                             print(f"✅ Found {len(job_cards)} unique job cards via Apply buttons")
#                             used_selector = "Apply Now button parent method"
#                         except Exception as e:
#                             print(f"❌ Apply button method failed: {e}")
                    
#                     if not job_cards or len(job_cards) == 0:
#                         print(f"❌ No job cards found with any selector")
                        
#                         # Final diagnostic - dump first 500 chars of page source
#                         print("\n📋 Page source preview:")
#                         print(driver.page_source[:500])
#                         continue
                    
#                     print(f"\n🧪 Found {len(job_cards)} job cards using: {used_selector}")

#                     for i, card in enumerate(job_cards):
#                         try:
#                             print(f"\n👀 Reviewing job {i+1} of {len(job_cards)}")

#                             # Smooth scroll and hover
#                             driver.execute_script("""
#                                 const element = arguments[0];
#                                 element.scrollIntoView({ behavior: 'smooth', block: 'center' });
#                             """, card)
#                             time.sleep(random.uniform(0.8, 1.5))

#                             actions.move_to_element(card).pause(random.uniform(0.5, 1.2)).perform()
#                             time.sleep(random.uniform(0.3, 0.8))

#                             # Click with fallback
#                             try:
#                                 card.click()
#                             except:
#                                 driver.execute_script("arguments[0].click();", card)
#                             time.sleep(random.uniform(1.5, 2.5))

#                             # Wait for job-details drawer
#                             try:
#                                 drawer = WebDriverWait(driver, 15).until(
#                                     EC.presence_of_element_located((By.CSS_SELECTOR, "mat-drawer job-details, job-details, div.job-details, [class*='job-detail']"))
#                                 )
#                                 time.sleep(random.uniform(1.5, 3.0))
#                             except:
#                                 print(f"⚠️ Drawer didn't load for job {i+1}, skipping...")
#                                 continue

#                             description = drawer.text
#                             job_url = driver.current_url

#                             # Extract details
#                             try:
#                                 title = drawer.find_element(By.CSS_SELECTOR, "h2, h3, .job-title, h1, [class*='title']").text
#                             except:
#                                 title = "Unknown"

#                             try:
#                                 company = drawer.find_element(By.CSS_SELECTOR, ".company-name, .job-company, [class*='company']").text
#                             except:
#                                 company = "Unknown"

#                             try:
#                                 location_el = drawer.find_element(By.XPATH, "//div[contains(text(),'Location')]")
#                                 location_text = location_el.text.split("Location")[-1].strip()
#                             except:
#                                 location_text = LOCATION

#                             job_state = location_text.split(",")[-1].strip() if "," in location_text else "N/A"

#                             try:
#                                 salary_el = drawer.find_element(By.XPATH, "//div[contains(text(),'Verified Pay') or contains(text(),'Pay')]")
#                                 salary = salary_el.text.split("Verified Pay")[-1].split("Pay")[-1].strip()
#                             except:
#                                 salary = "N/A"

#                             flat_skills = extract_flat_skills(description, SKILLS["flat"])
#                             categorized_skills = extract_skills_by_category(description, SKILLS["matrix"])

#                             job = {
#                                 "title": title,
#                                 "company": company,
#                                 "job_location": location_text,
#                                 "job_state": job_state,
#                                 "date": datetime.today().date(),
#                                 "site": "Snagajob",
#                                 "job_description": description,
#                                 "salary": salary,
#                                 "url": job_url,
#                                 "applied": False,
#                                 "saved": False,
#                                 "search_term": keyword,
#                                 "category": None,
#                                 "priority": None,
#                                 "status": None,
#                                 "inserted_at": datetime.utcnow().isoformat(),
#                                 "last_verified": None,
#                                 "skills": flat_skills,
#                                 "skills_by_category": categorized_skills,
#                                 "user_id": None
#                             }

#                             if job["date"] >= cutoff_date:
#                                 insert_job_to_db(job)
#                                 all_jobs.append(job)
#                                 print(f"✅ Saved '{title}' to Supabase. Skills: {', '.join(flat_skills[:3])}")
#                             else:
#                                 print(f"⏳ Skipped old job: {title}")

#                         except Exception as e:
#                             print(f"⚠️ Failed to extract job {i+1}: {e}")
#                             traceback.print_exc()
#                             continue

#                 except Exception as e:
#                     print(f"❌ Failed to load job cards for '{keyword}' page {page_num}: {e}")
#                     traceback.print_exc()

#     finally:
#         driver.quit()

#     if all_jobs:
#         write_jobs_csv(all_jobs, folder_name="job_data", label="snag_selenium")

#     print(f"\n📊 Total jobs saved: {len(all_jobs)}")
#     print("🛠️ All done! You crushed it, Shanna.")

#     return all_jobs

# from selenium.webdriver.common.by import By
# from selenium.webdriver.support.ui import WebDriverWait
# from selenium.webdriver.support import expected_conditions as EC
# import undetected_chromedriver as uc
# import time
# import uuid
# from datetime import datetime, timedelta
# import json
# import traceback
# import random
# from selenium.webdriver import ActionChains
# import random
# from selenium.webdriver import ActionChains
# from app.utils.skills_engine import load_all_skills, extract_flat_skills, extract_skills_by_category
# from app.db.sync_jobs import insert_job_to_db
# from app.utils.write_jobs import write_jobs_csv

# TECH_KEYWORDS = [
#     "software engineer", "front-end developer", "backend developer", "full-stack developer",
#     "data analyst", "python developer", "react developer", "typescript developer",
#     "devops engineer", "cloud engineer", "qa engineer", "product designer",
#     "ui ux designer", "mobile developer", "android developer", "ios developer",
#     "machine learning engineer", "ai engineer", "data scientist", "security engineer"
# ]

# LOCATION = "remote"
# PAGES_PER_KEYWORD = 2
# MAX_DAYS = 5
# TECH_KEYWORDS = TECH_KEYWORDS
# SKILLS = load_all_skills()

# def configure_driver():
#     options = uc.ChromeOptions()
#     options.add_argument("--no-sandbox")
#     options.add_argument("--disable-dev-shm-usage")
#     options.add_argument("--disable-blink-features=AutomationControlled")
#     options.add_argument("user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64)")
#     driver = uc.Chrome(options=options, headless=False)
#     driver.execute_cdp_cmd("Page.addScriptToEvaluateOnNewDocument", {
#         "source": "Object.defineProperty(navigator, 'webdriver', {get: () => undefined})"
#     })
#     return driver

# def scrape_snag_jobs(location=LOCATION, keywords=TECH_KEYWORDS):
#     driver = configure_driver()
#     if not driver:
#         print("❌ Driver failed to launch")
#         return []

#     actions = ActionChains(driver)
#     all_jobs = []
#     cutoff_date = datetime.today().date() - timedelta(days=MAX_DAYS)

#     print("🔐 Solve CAPTCHA if needed, then press Enter to continue...")
#     input("⏸️ Waiting for CAPTCHA resolution...")

#     try:
#         for keyword in TECH_KEYWORDS:
#             for page_num in range(1, PAGES_PER_KEYWORD + 1):
#                 search_url = f"https://www.snagajob.com/search?q={'+'.join(keyword.split())}&w={LOCATION}&radius=20&page={page_num}"
#                 print(f"\n🧠 Searching '{keyword}' — page {page_num}")
#                 driver.get(search_url)
#                 time.sleep(random.uniform(2.0, 3.5))

#                 try:
#                     # Try multiple possible selectors for job cards
#                     selectors = [
#                         "app-job-card",
#                         "div[data-testid='job-card']",
#                         "div.job-card",
#                         "article.job-listing",
#                         "div.outline-none.ng-star-inserted"
#                     ]
                    
#                     job_cards = []
#                     for selector in selectors:
#                         try:
#                             WebDriverWait(driver, 10).until(
#                                 EC.presence_of_all_elements_located((By.CSS_SELECTOR, selector))
#                             )
#                             job_cards = driver.find_elements(By.CSS_SELECTOR, selector)
#                             if len(job_cards) > 1:
#                                 print(f"✅ Using selector: {selector}")
#                                 break
#                         except:
#                             continue
                    
#                     if not job_cards:
#                         print(f"❌ No job cards found with any selector")
#                         continue
                    
#                     print(f"🧪 Found {len(job_cards)} job cards")

#                     for i, card in enumerate(job_cards):
#                         try:
#                             print(f"👀 Reviewing job {i+1} of {len(job_cards)}")

#                             # Smooth scroll and hover
#                             driver.execute_script("""
#                                 const element = arguments[0];
#                                 element.scrollIntoView({ behavior: 'smooth', block: 'center' });
#                             """, card)
#                             time.sleep(random.uniform(0.8, 1.5))

#                             actions.move_to_element(card).pause(random.uniform(0.5, 1.2)).perform()
#                             time.sleep(random.uniform(0.3, 0.8))

#                             # Click with fallback
#                             try:
#                                 card.click()
#                             except:
#                                 driver.execute_script("arguments[0].click();", card)
#                             time.sleep(random.uniform(1.2, 2.5))

#                             # Wait for job-details drawer with longer timeout
#                             try:
#                                 drawer = WebDriverWait(driver, 15).until(
#                                     EC.presence_of_element_located((By.CSS_SELECTOR, "mat-drawer job-details, job-details, div.job-details"))
#                                 )
#                                 time.sleep(random.uniform(1.5, 3.0))
#                             except:
#                                 print(f"⚠️ Drawer didn't load for job {i+1}, skipping...")
#                                 continue

#                             description = drawer.text
#                             job_url = driver.current_url

#                             # Extract details
#                             try:
#                                 title = drawer.find_element(By.CSS_SELECTOR, "h2, h3, .job-title, h1").text
#                             except:
#                                 title = "Unknown"

#                             try:
#                                 company = drawer.find_element(By.CSS_SELECTOR, ".company-name, .job-company, p").text
#                             except:
#                                 company = "Unknown"

#                             try:
#                                 location_el = drawer.find_element(By.XPATH, "//div[contains(text(),'Location')]")
#                                 location_text = location_el.text.split("Location")[-1].strip()
#                             except:
#                                 location_text = LOCATION

#                             job_state = location_text.split(",")[-1].strip() if "," in location_text else "N/A"

#                             try:
#                                 salary_el = drawer.find_element(By.XPATH, "//div[contains(text(),'Verified Pay')]")
#                                 salary = salary_el.text.split("Verified Pay")[-1].strip()
#                             except:
#                                 salary = "N/A"

#                             flat_skills = extract_flat_skills(description, SKILLS["flat"])
#                             categorized_skills = extract_skills_by_category(description, SKILLS["matrix"])

#                             job = {
#                                 "title": title,
#                                 "company": company,
#                                 "job_location": location_text,
#                                 "job_state": job_state,
#                                 "date": datetime.today().date(),
#                                 "site": "Snagajob",
#                                 "job_description": description,
#                                 "salary": salary,
#                                 "url": job_url,
#                                 "applied": False,
#                                 "saved": False,
#                                 "search_term": keyword,
#                                 "category": None,
#                                 "priority": None,
#                                 "status": None,
#                                 "inserted_at": datetime.utcnow().isoformat(),
#                                 "last_verified": None,
#                                 "skills": flat_skills,
#                                 "skills_by_category": categorized_skills,
#                                 "user_id": None
#                             }

#                             if job["date"] >= cutoff_date:
#                                 insert_job_to_db(job)
#                                 all_jobs.append(job)
#                                 print(f"✅ Saved '{title}' to Supabase. Skills: {', '.join(flat_skills[:3])}")
#                             else:
#                                 print(f"⏳ Skipped old job: {title}")

#                         except Exception as e:
#                             print(f"⚠️ Failed to extract job {i+1}: {e}")
#                             traceback.print_exc()
#                             continue

#                 except Exception as e:
#                     print(f"❌ Failed to load job cards for '{keyword}' page {page_num}: {e}")
#                     traceback.print_exc()

#     finally:
#         driver.quit()

#     if all_jobs:
#         write_jobs_csv(all_jobs, folder_name="job_data", label="snag_selenium")

#     print(f"\n📊 Total jobs saved: {len(all_jobs)}")
#     print("🛠️ All done! You crushed it, Shanna.")

#     return all_jobs


# from selenium.webdriver.common.by import By
# from selenium.webdriver.support.ui import WebDriverWait
# from selenium.webdriver.support import expected_conditions as EC
# import undetected_chromedriver as uc
# import time
# import uuid
# from datetime import datetime, timedelta
# import json
# import traceback
# import random
# from selenium.webdriver import ActionChains
# import random
# from selenium.webdriver import ActionChains
# from app.utils.skills_engine import load_all_skills, extract_flat_skills, extract_skills_by_category
# from app.db.sync_jobs import insert_job_to_db
# from app.utils.write_jobs import write_jobs_csv

# TECH_KEYWORDS = [
#     "software engineer", "front-end developer", "backend developer", "full-stack developer",
#     "data analyst", "python developer", "react developer", "typescript developer",
#     "devops engineer", "cloud engineer", "qa engineer", "product designer",
#     "ui ux designer", "mobile developer", "android developer", "ios developer",
#     "machine learning engineer", "ai engineer", "data scientist", "security engineer"
# ]

# LOCATION = "remote"
# PAGES_PER_KEYWORD = 2
# MAX_DAYS = 5
# TECH_KEYWORDS = TECH_KEYWORDS
# SKILLS = load_all_skills()
# def configure_driver():
#     options = uc.ChromeOptions()
#     options.add_argument("--no-sandbox")
#     options.add_argument("--disable-dev-shm-usage")
#     options.add_argument("--disable-blink-features=AutomationControlled")
#     options.add_argument("user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64)")
#     driver = uc.Chrome(options=options, headless=False)
#     driver.execute_cdp_cmd("Page.addScriptToEvaluateOnNewDocument", {
#         "source": "Object.defineProperty(navigator, 'webdriver', {get: () => undefined})"
#     })
#     return driver
# def scrape_snag_jobs(location=LOCATION, keywords=TECH_KEYWORDS):

#     driver = configure_driver()
#     if not driver:
#         print("❌ Driver failed to launch")
#         return []

#     actions = ActionChains(driver)
#     all_jobs = []
#     cutoff_date = datetime.today().date() - timedelta(days=MAX_DAYS)

#     print("🔐 Solve CAPTCHA if needed, then press Enter to continue...")
#     input("⏸️ Waiting for CAPTCHA resolution...")

#     try:
#         for keyword in TECH_KEYWORDS:
#             for page_num in range(1, PAGES_PER_KEYWORD + 1):
#                 search_url = f"https://www.snagajob.com/search?q={'+'.join(keyword.split())}&w={LOCATION}&radius=20&page={page_num}"
#                 print(f"\n🧠 Searching '{keyword}' — page {page_num}")
#                 driver.get(search_url)
#                 time.sleep(random.uniform(2.0, 3.5))  # Simulate page load pause

#                 try:
#                     WebDriverWait(driver, 15).until(
#                         EC.presence_of_all_elements_located((By.CSS_SELECTOR, "div.outline-none.ng-star-inserted"))
#                     )
#                     job_cards = driver.find_elements(By.CSS_SELECTOR, "div.outline-none.ng-star-inserted")
#                     print(f"🧪 Found {len(job_cards)} job cards")

#                     for i, card in enumerate(job_cards):
#                         try:
#                             print(f"👀 Reviewing job {i+1} of {len(job_cards)}")

#                             # Smooth scroll and hover
#                             driver.execute_script("""
#                                 const element = arguments[0];
#                                 element.scrollIntoView({ behavior: 'smooth', block: 'center' });
#                             """, card)
#                             time.sleep(random.uniform(0.8, 1.5))

#                             actions.move_to_element(card).pause(random.uniform(0.5, 1.2)).perform()
#                             time.sleep(random.uniform(0.3, 0.8))

#                             # Click with fallback
#                             try:
#                                 card.click()
#                             except:
#                                 driver.execute_script("arguments[0].click();", card)
#                             time.sleep(random.uniform(1.2, 2.5))

#                             # Wait for job-details drawer
#                             drawer = WebDriverWait(driver, 10).until(
#                                 EC.presence_of_element_located((By.CSS_SELECTOR, "mat-drawer job-details"))
#                             )
#                             time.sleep(random.uniform(1.5, 3.0))  # Simulate reading time

#                             description = drawer.text
#                             job_url = driver.current_url

#                             # Extract details
#                             try:
#                                 title = drawer.find_element(By.CSS_SELECTOR, "h2, h3, .job-title").text
#                             except:
#                                 title = "Unknown"

#                             try:
#                                 company = drawer.find_element(By.CSS_SELECTOR, ".company-name, .job-company, p").text
#                             except:
#                                 company = "Unknown"

#                             try:
#                                 location_el = drawer.find_element(By.XPATH, "//div[contains(text(),'Location')]")
#                                 location_text = location_el.text.split("Location")[-1].strip()
#                             except:
#                                 location_text = LOCATION

#                             job_state = location_text.split(",")[-1].strip() if "," in location_text else "N/A"

#                             try:
#                                 salary_el = drawer.find_element(By.XPATH, "//div[contains(text(),'Verified Pay')]")
#                                 salary = salary_el.text.split("Verified Pay")[-1].strip()
#                             except:
#                                 salary = "N/A"

#                             flat_skills = extract_flat_skills(description, SKILLS["flat"])
#                             categorized_skills = extract_skills_by_category(description, SKILLS["matrix"])

#                             job = {
#                                 "title": title,
#                                 "company": company,
#                                 "job_location": location_text,
#                                 "job_state": job_state,
#                                 "date": datetime.today().date(),
#                                 "site": "Snagajob",
#                                 "job_description": description,
#                                 "salary": salary,
#                                 "url": job_url,
#                                 "applied": False,
#                                 "saved": False,
#                                 "search_term": keyword,
#                                 "category": None,
#                                 "priority": None,
#                                 "status": None,
#                                 "inserted_at": datetime.utcnow().isoformat(),
#                                 "last_verified": None,
#                                 "skills": flat_skills,
#                                 "skills_by_category": categorized_skills,
#                                 "user_id": None
#                             }

#                             if job["date"] >= cutoff_date:
#                                 insert_job_to_db(job)
#                                 all_jobs.append(job)
#                                 print(f"✅ Saved '{title}' to Supabase. Skills: {', '.join(flat_skills[:3])}")
#                             else:
#                                 print(f"⏳ Skipped old job: {title}")

#                         except Exception as e:
#                             print(f"⚠️ Failed to extract job {i+1}: {e}")
#                             traceback.print_exc()
#                             continue

#                 except Exception as e:
#                     print(f"❌ Failed to load job cards for '{keyword}' page {page_num}: {e}")
#                     traceback.print_exc()

#     finally:
#         driver.quit()

#     if all_jobs:
#         write_jobs_csv(all_jobs, folder_name="job_data", label="snag_selenium")

#     print(f"\n📊 Total jobs saved: {len(all_jobs)}")
#     print("🛠️ All done! You crushed it, Shanna.")

#     return all_jobs

# from selenium.webdriver.common.by import By
# from selenium.webdriver.support.ui import WebDriverWait
# from selenium.webdriver.support import expected_conditions as EC
# import undetected_chromedriver as uc
# import time

# def configure_driver():
#     options = uc.ChromeOptions()
#     options.add_argument("--no-sandbox")
#     options.add_argument("--disable-dev-shm-usage")
#     options.add_argument("--disable-blink-features=AutomationControlled")
#     options.add_argument("user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64)")
#     driver = uc.Chrome(options=options, headless=False)
#     driver.execute_cdp_cmd("Page.addScriptToEvaluateOnNewDocument", {
#         "source": "Object.defineProperty(navigator, 'webdriver', {get: () => undefined})"
#     })
#     return driver

# def scrape_snag_jobs(location="remote", keyword="web developer"):
#     driver = configure_driver()
#     if not driver:
#         print("❌ Driver failed to launch")
#         return []

#     search_url = f"https://www.snagajob.com/search?q={'+'.join(keyword.split())}&w={location}&radius=20"
#     print(f"🔍 Navigating to: {search_url}")
#     driver.get(search_url)

#     input("🔐 Solve CAPTCHA if needed, then press Enter to continue...")

#     jobs = []
#     try:
#         WebDriverWait(driver, 15).until(
#             EC.presence_of_all_elements_located((By.CSS_SELECTOR, "job-card"))
#         )
#         job_cards = driver.find_elements(By.CSS_SELECTOR, "job-card")
#         print(f"🧪 Found {len(job_cards)} job cards")

#         for i in range(min(5, len(job_cards))):
#             try:
#                 card_selector = f"#job-{i+1}"
#                 card = driver.find_element(By.CSS_SELECTOR, card_selector)
#                 driver.execute_script("arguments[0].scrollIntoView(true);", card)
#                 card.click()
#                 time.sleep(2)

#                 drawer = WebDriverWait(driver, 10).until(
#                     EC.presence_of_element_located((By.CSS_SELECTOR, "mat-drawer div"))
#                 )

#                 # Extract job details from drawer
#                 title = drawer.find_element(By.CSS_SELECTOR, "h2, h3, .job-title").text
#                 company = drawer.find_element(By.CSS_SELECTOR, ".company-name, .job-company, p").text
#                 description = drawer.text
#                 location_text = location

#                 jobs.append({
#                     "title": title,
#                     "company": company,
#                     "location": location_text,
#                     "description": description
#                 })

#                 print(f"📌 {title} at {company}")

#             except Exception as e:
#                 print(f"⚠️ Failed to extract job {i+1}: {e}")
#                 continue

#     except Exception as e:
#         print(f"❌ Failed to load job cards: {e}")

#     driver.quit()
#     return jobs

# from playwright.sync_api import sync_playwright

# from posthog import page
# from app.utils.skills_engine import (
#     load_all_skills,
#     extract_flat_skills,
#     extract_skills_by_category
# )
# from app.db.sync_jobs import insert_job_to_db
# from app.utils.write_jobs import write_jobs_csv
# from app.utils.common import TECH_KEYWORDS
# from datetime import datetime
# import uuid
# import os
# from dotenv import load_dotenv
# from playwright.sync_api import sync_playwright
# print("📁 Current working directory:", os.getcwd(), flush=True)
# HEADLESS_PATH = os.getenv("HEADLESS_PATH")

# def scrape_snag_jobs(location="remote", keywords=["web developer"]):
#     print("🚀 scrape_snag_jobs() was called", flush=True)

#     if not HEADLESS_PATH or not os.path.isfile(HEADLESS_PATH):
#         raise FileNotFoundError(f"❌ HEADLESS_PATH not found: {HEADLESS_PATH}")

#     with sync_playwright() as p:
#         try:
#             # browser = p.chromium.launch(
#             #     headless=False,  # ✅ Show browser window
#             #     executable_path=HEADLESS_PATH
#             # )
#             browser = p.chromium.launch(headless=False)
#             context = browser.new_context()

#             # ✅ Manual stealth patches
#             context.add_init_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})")
#             context.add_init_script("Object.defineProperty(navigator, 'plugins', {get: () => [1, 2, 3]})")
#             context.add_init_script("Object.defineProperty(navigator, 'languages', {get: () => ['en-US', 'en']})")
#             context = browser.new_context()
#             context.add_init_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})")
#             context.add_init_script("Object.defineProperty(navigator, 'plugins', {get: () => [1, 2, 3]})")
#             context.add_init_script("Object.defineProperty(navigator, 'languages', {get: () => ['en-US', 'en']})")
#             page = context.new_page()

#             for keyword in keywords:
#                 print(f"\n🔍 Crawling '{keyword}' in '{location}'", flush=True)

#                 search_url = f"https://www.snagajob.com/search?q={'+'.join(keyword.split())}&w={location}&radius=20"
#                 page.goto(search_url)

#                 # ✅ Pause for manual CAPTCHA
#                 input("🔐 If there's a CAPTCHA or bot challenge, complete it in the browser and press Enter to continue...")

#                 page.wait_for_timeout(3000)
#                 print("🧪 Page title:", page.title(), flush=True)
#                 html = page.content()
#                 with open("snagajob_debug.html", "w", encoding="utf-8") as f:
#                     f.write(html)
#                 print("📄 HTML snapshot saved", flush=True)


#                 job_cards = page.query_selector_all("div.outline-none.ng-star-inserted")
#                 print(f"🧪 Found {len(job_cards)} job cards", flush=True)

#                 if job_cards:
#                     job_cards[0].click()
#                     page.wait_for_timeout(2000)

#                     detail = page.query_selector("mat-drawer div")
#                     if detail:
#                         print("🧾 Drawer content:\n", detail.inner_text()[:500], flush=True)
#                     else:
#                         print("⚠️ Drawer not found", flush=True)

#             browser.close()
#         except Exception as e:
#             print(f"❌ Playwright error: {e}", flush=True)

#     return []

# load_dotenv()
# SKILLS = load_all_skills()
# HEADLESS_PATH = os.getenv("HEADLESS_PATH")
# print("🚀 scrape_snag_jobs() was called")
# def scrape_snag_jobs(location="remote", keywords=TECH_KEYWORDS):
#     all_jobs = []

#     if not HEADLESS_PATH or not os.path.isfile(HEADLESS_PATH):
#         raise FileNotFoundError(f"❌ HEADLESS_PATH not found: {HEADLESS_PATH}")

#     with sync_playwright() as p:
#         browser = p.chromium.launch(
#             headless=True,
#             executable_path=HEADLESS_PATH
#         )
#         context = browser.new_context()
#         page = context.new_page()
#         stealth_sync(page)  # ✅ Apply stealth tweaks

#         for keyword in keywords:
#             print(f"\n🔍 Crawling '{keyword}' in '{location}'")

#             search_url = f"https://www.snagajob.com/search?q={'+'.join(keyword.split())}&w={location}&radius=20"
#             page.goto(search_url)
#             print("🧪 Page loaded:", page.title())
#             print("🧪 HTML snapshot:\n", page.content()[:1000])  # Just the first 1000 chars
#             page.wait_for_timeout(3000)

#             job_cards = page.query_selector_all("div.outline-none.ng-star-inserted")

#             print(f"🧪 Found {len(job_cards)} job cards for '{keyword}'")

#             for card in job_cards:
#                 try:
#                     page.evaluate("el => el.click()", card)
#                     page.wait_for_timeout(2000)

#                     detail = page.query_selector("#main-content search-page mat-drawer-container mat-drawer > div")
#                     if not detail:
#                         print("⚠️ No detail drawer found")
#                         continue

#                     title = detail.query_selector("h1").inner_text().strip() if detail.query_selector("h1") else "Unknown"
#                     company = detail.query_selector(".company-name").inner_text().strip() if detail.query_selector(".company-name") else "Unknown"
#                     location_text = location
#                     description = detail.inner_text().strip()

#                     flat_skills = extract_flat_skills(description, SKILLS["flat"])
#                     skills_by_category = extract_skills_by_category(description, SKILLS["matrix"])

#                     job = {
#                         "id": str(uuid.uuid4()),
#                         "title": title,
#                         "company": company,
#                         "job_location": location_text,
#                         "job_state": location,
#                         "salary": "N/A",
#                         "site": "Snagajob",
#                         "date": datetime.utcnow().date().isoformat(),
#                         "applied": False,
#                         "saved": False,
#                         "url": page.url,
#                         "job_description": description,
#                         "search_term": keyword,
#                         "category": None,
#                         "priority": None,
#                         "status": "new",
#                         "inserted_at": datetime.utcnow(),
#                         "last_verified": None,
#                         "skills": flat_skills,
#                         "skills_by_category": skills_by_category,
#                         "user_id": None
#                     }

#                     insert_job_to_db(job)
#                     all_jobs.append(job)

#                 except Exception as e:
#                     print(f"⚠️ Failed to process job card: {e}")
#                     continue

#         browser.close()
#         write_jobs_csv(all_jobs, folder_name="job_data", label="snagajob_playwright")
#         return all_jobs


# from playwright.sync_api import sync_playwright
# from playwright_stealth import stealth_sync
# import os

# HEADLESS_PATH = os.getenv("HEADLESS_PATH")

# def scrape_snag_jobs(location="remote", keywords=["web developer"]):
#     print("🚀 scrape_snag_jobs() was called", flush=True)

#     if not HEADLESS_PATH or not os.path.isfile(HEADLESS_PATH):
#         raise FileNotFoundError(f"❌ HEADLESS_PATH not found: {HEADLESS_PATH}")

#     with sync_playwright() as p:
#         try:
#             browser = p.chromium.launch(
#                 headless=True,
#                 executable_path=HEADLESS_PATH
#             )
#             context = browser.new_context()
#             page = context.new_page()
#             stealth_sync(page)

#             for keyword in keywords:
#                 print(f"\n🔍 Crawling '{keyword}' in '{location}'", flush=True)

#                 search_url = f"https://www.snagajob.com/search?q={'+'.join(keyword.split())}&w={location}&radius=20"
#                 page.goto(search_url)
#                 page.wait_for_timeout(3000)

#                 print("🧪 Page title:", page.title(), flush=True)

#                 job_cards = page.query_selector_all("div.outline-none.ng-star-inserted")
#                 print(f"🧪 Found {len(job_cards)} job cards", flush=True)

#                 if job_cards:
#                     job_cards[0].click()
#                     page.wait_for_timeout(2000)

#                     detail = page.query_selector("mat-drawer div")
#                     if detail:
#                         print("🧾 Drawer content:\n", detail.inner_text()[:500], flush=True)
#                     else:
#                         print("⚠️ Drawer not found", flush=True)

#             browser.close()
#         except Exception as e:
#             print(f"❌ Playwright error: {e}", flush=True)

#     return []