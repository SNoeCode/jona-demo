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
        context = await browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
        )
        page = await context.new_page()

        search_url = f"https://www.ziprecruiter.com/jobs/search?search=software+engineer&location={location}&days={days}"
        print(f"🔍 Navigating to: {search_url}")
        await page.goto(search_url, wait_until="networkidle")
        await page.wait_for_timeout(5000)

        # Wait for page to fully load and handle any popups/cookies
        await page.wait_for_timeout(3000)
        
        # Try to dismiss any popups or cookie banners
        try:
            # Look for common popup dismiss buttons
            popup_selectors = [
                "[data-testid='close-button']",
                ".close",
                "[aria-label='Close']",
                "[aria-label='Dismiss']",
                "button[class*='close']",
                "button[class*='dismiss']"
            ]
            for selector in popup_selectors:
                try:
                    popup = await page.query_selector(selector)
                    if popup:
                        await popup.click()
                        print("✅ Dismissed popup")
                        await page.wait_for_timeout(1000)
                        break
                except:
                    continue
        except:
            pass
        
        # Try to find the main search results container first
        results_container = None
        container_selectors = [
            "[data-testid='search-results']",
            ".search-results",
            "[class*='results']",
            "[class*='listings']",
            "main",
            "[role='main']"
        ]
        
        for selector in container_selectors:
            try:
                container = await page.query_selector(selector)
                if container:
                    results_container = container
                    print(f"✅ Found results container: {selector}")
                    break
            except:
                continue
        
        # Now look for job cards within the results container
        job_cards = []
        if results_container:
            # Look for job cards within the container
            selectors_to_try = [
                "[data-testid='job-card']",
                ".job_content",
                "[class*='job-listing']",
                "[class*='job-card']",
                "[class*='listing']",
                "article[class*='job']",
                "[class*='result']",
                "[class*='posting']",
                "div[class*='job']",
                "li[class*='job']"
            ]
            
            for selector in selectors_to_try:
                try:
                    job_cards = await results_container.query_selector_all(selector)
                    if job_cards:
                        print(f"✅ Found {len(job_cards)} job cards with selector: {selector}")
                        break
                except Exception as e:
                    print(f"⚠️ Selector {selector} failed: {e}")
                    continue
        else:
            print("⚠️ No results container found, trying page-wide search...")
            # Fallback to page-wide search
            selectors_to_try = [
                "[data-testid='job-card']",
                ".job_content",
                "[class*='job-listing']",
                "[class*='job-card']",
                "[class*='listing']",
                "article[class*='job']",
                "[class*='result']",
                "[class*='posting']"
            ]
            
            for selector in selectors_to_try:
                try:
                    job_cards = await page.query_selector_all(selector)
                    if job_cards:
                        print(f"✅ Found {len(job_cards)} job cards with selector: {selector}")
                        break
                except Exception as e:
                    print(f"⚠️ Selector {selector} failed: {e}")
                    continue
        
        # If no job cards found, try to find job links directly
        if not job_cards:
            print("🔍 No job cards found, looking for job links directly...")
            
            # Try different patterns for job links
            job_link_patterns = [
                "a[href*='/jobs/']",
                "a[href*='/job/']", 
                "a[href*='job-']",
                "a[href*='career']",
                "a[href*='position']"
            ]
            
            for pattern in job_link_patterns:
                job_links = await page.query_selector_all(pattern)
                if job_links:
                    print(f"✅ Found {len(job_links)} job links with pattern: {pattern}")
                    job_cards = job_links
                    break
            
            # If still no job links, try to find any links in the main content area
            if not job_cards:
                print("🔍 Looking for any links in main content...")
                main_content = await page.query_selector("main, [role='main'], .main, #main")
                if main_content:
                    all_links = await main_content.query_selector_all("a")
                    print(f"🔗 Found {len(all_links)} links in main content")
                    job_cards = all_links
        
        print(f"📋 Found {len(job_cards)} job cards")
        
        # Debug: Take screenshot and print page content
        if len(job_cards) == 0:
            await page.screenshot(path="debug_zip_page.png")
            print("📸 Screenshot saved as debug_zip_page.png")
            
            # Get all links on the page to see what's available
            all_links = await page.query_selector_all("a")
            print(f"🔗 Found {len(all_links)} total links on page")
            
            for i, link in enumerate(all_links[:10]):  # Show first 10 links
                href = await link.get_attribute("href")
                text = await link.inner_text()
                print(f"  Link {i+1}: {href} - '{text[:50]}...'")
            
            # Check if there are any job-related elements
            job_elements = await page.query_selector_all("[class*='job'], [class*='listing'], [class*='result']")
            print(f"🔍 Found {len(job_elements)} job-related elements")
            
            content = await page.content()
            print(f"📄 Page content length: {len(content)}")
            # Print first 1000 chars to see what we got
            print(f"📄 Page content preview: {content[:1000]}")

        # Filter out navigation elements before processing
        valid_job_cards = []
        for card in job_cards:
            try:
                # Get the text content to check if it's a navigation element
                card_text = await card.inner_text()
                card_text_lower = card_text.lower()
                
                # Skip navigation elements
                nav_keywords = ['post a job', 'search jobs', 'employer', 'about', 'contact', 'help', 'login', 'register', 'sign up', 'need to hire', 'job seekers']
                if any(nav in card_text_lower for nav in nav_keywords):
                    print(f"⚠️ Skipping navigation element: {card_text[:50]}...")
                    continue
                
                # Check if it has job-related content
                job_keywords = ['engineer', 'developer', 'programmer', 'software', 'tech', 'remote', 'full-time', 'part-time', 'contract']
                if not any(keyword in card_text_lower for keyword in job_keywords):
                    print(f"⚠️ Skipping non-job element: {card_text[:50]}...")
                    continue
                
                valid_job_cards.append(card)
            except Exception as e:
                print(f"⚠️ Error filtering card: {e}")
                continue
        
        print(f"📋 Filtered to {len(valid_job_cards)} valid job cards")
        
        for card in valid_job_cards:
            try:
                # Try multiple selectors for each element
                title = await card.query_selector("h2, h3, [class*='title'], [class*='job-title']")
                company = await card.query_selector(".t_org_link, [class*='company'], [class*='org']")
                location_el = await card.query_selector(".location, [class*='location']")
                link_el = await card.query_selector("a")

                job_title = await title.inner_text() if title else "N/A"
                company_name = await company.inner_text() if company else "Unknown"
                location_text = await location_el.inner_text() if location_el else location
                link = await link_el.get_attribute("href") if link_el else None
                
                print(f"🔍 Processing job: {job_title} at {company_name}")
                if not link:
                    print("⚠️ No link found, skipping")
                    continue
                
                # Validate URL - skip navigation links
                if not link.startswith('http'):
                    print(f"⚠️ Skipping relative URL: {link}")
                    continue
                
                # Skip navigation and non-job links
                nav_keywords = ['/post-a-job', '/search-jobs', '/employer', '/about', '/contact', '/help', '/login', '/register', '/signup']
                if any(nav in link.lower() for nav in nav_keywords):
                    print(f"⚠️ Skipping navigation link: {link}")
                    continue
                
                # Ensure it's a job posting URL - be more specific
                if not any(job_indicator in link.lower() for job_indicator in ['/jobs/', '/job/', 'job-', 'career', 'position', 'opening']):
                    print(f"⚠️ Skipping non-job link: {link}")
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
