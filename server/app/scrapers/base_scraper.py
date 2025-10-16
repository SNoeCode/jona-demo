import os
import sys
import json
import logging
from typing import List, Dict, Optional
from datetime import datetime
from supabase import create_client, Client
from app.scrapers.tek_systems import scrape_teksystems
from app.scrapers.indeed_crawler import crawl_indeed
from app.scrapers.dice_scraper import scrape_dice
from app.scrapers.career_crawler import crawl_career_builder 
from app.scrapers.zip_crawler import scrape_zip_and_insert
from app.db.connect_database import supabase
from app.utils.skills_engine import (
    load_all_skills,
    extract_flat_skills,
    extract_skills,
    extract_skills_by_category
)
from app.db.cleanup import cleanup
from app.utils.scan_for_duplicates import scan_for_duplicates
from app.utils.write_jobs import write_jobs_csv
from app.db.sync_jobs import sync_job_data_folder_to_supabase
from app.config.config_utils import get_output_folder

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)
SKILLS = load_all_skills()

class BaseScraper:
    def __init__(self, scraper_name: str, log_id: str = None):
        self.scraper_name = scraper_name
        self.log_id = log_id
        self.jobs_found = 0
        self.jobs_saved = 0
        self.start_time = datetime.now()
        
        # Initialize Supabase client
        supabase_url = os.getenv("SUPABASE_URL") or os.getenv("NEXT_PUBLIC_SUPABASE_URL")
        supabase_key = os.getenv("SUPABASE_SERVICE_KEY") or os.getenv("SUPABASE_SERVICE_ROLE_KEY")
        
        if not supabase_url or not supabase_key:
            logger.error("Missing Supabase credentials")
            raise ValueError("Supabase URL and Service Key are required")
            
        self.supabase: Client = create_client(supabase_url, supabase_key)
        logger.info(f"Initialized {scraper_name} scraper with log_id: {log_id}")

    def log_progress(self, message: str, jobs_found: int = None, jobs_saved: int = None):
        """Log progress message and update counts"""
        if jobs_found is not None:
            self.jobs_found = jobs_found
        if jobs_saved is not None:
            self.jobs_saved = jobs_saved
            
        # Print to stdout for the Node.js process to capture
        print(f"[{datetime.now().isoformat()}] {message}")
        if jobs_found is not None:
            print(f"Found {self.jobs_found} jobs")
        if jobs_saved is not None:
            print(f"Saved {self.jobs_saved} jobs")
        
        # Update database if log_id is provided
        if self.log_id:
            self.update_log_progress()

    def update_log_progress(self):
        """Update scraping log in database"""
        try:
            self.supabase.table("scraping_logs").update({
                "jobs_found": self.jobs_found,
                "jobs_saved": self.jobs_saved,
                "last_updated": datetime.now().isoformat()
            }).eq("id", self.log_id).execute()
        except Exception as e:
            logger.warning(f"Failed to update log progress: {e}")

    def save_jobs_to_db(self, jobs: List[Dict], batch_size: int = 100) -> int:
        """Save jobs to database in batches"""
        saved_count = 0
        
        for i in range(0, len(jobs), batch_size):
            batch = jobs[i:i + batch_size]
            try:
                # Prepare jobs for insertion
                prepared_jobs = []
                for job in batch:
                    prepared_job = self.prepare_job_for_db(job)
                    if prepared_job:
                        prepared_jobs.append(prepared_job)
                
                if prepared_jobs:
                    # Insert batch
                    result = self.supabase.table("jobs").upsert(
                        prepared_jobs, 
                        on_conflict="url"  # Avoid duplicates based on URL
                    ).execute()
                    
                    batch_saved = len(result.data) if result.data else len(prepared_jobs)
                    saved_count += batch_saved
                    self.log_progress(f"Saved batch of {batch_saved} jobs", jobs_saved=saved_count)
                    
            except Exception as e:
                logger.error(f"Failed to save job batch: {e}")
                continue
        
        return saved_count

    def prepare_job_for_db(self, job: Dict) -> Optional[Dict]:
        """Prepare job data for database insertion"""
        try:
            # Standard job fields that should exist in your database
            prepared_job = {
                "title": job.get("title", "").strip(),
                "company": job.get("company", "").strip(),
                "location": job.get("location", "").strip(),
                "job_description": job.get("job_description", "").strip(),
                "url": job.get("url", "").strip(),
                "source": self.scraper_name,
                "posted_date": job.get("posted_date"),
                "salary": job.get("salary"),
                "job_type": job.get("job_type"),
                "remote": job.get("remote", False),
                "skills": job.get("skills", []),
                "flat_skills": job.get("flat_skills", []),
                "skills_by_category": job.get("skills_by_category", {}),
                "scraped_at": datetime.now().isoformat(),
                "scraping_log_id": self.log_id
            }
            
            # Validate required fields
            if not prepared_job["title"] or not prepared_job["url"]:
                logger.warning("Skipping job with missing title or URL")
                return None
                
            # Clean and validate URL
            if not prepared_job["url"].startswith(("http://", "https://")):
                logger.warning(f"Invalid URL format: {prepared_job['url']}")
                return None
                
            return prepared_job
            
        except Exception as e:
            logger.error(f"Error preparing job for database: {e}")
            return None

    def finalize_scraping(self, success: bool = True, error_message: str = None):
        """Finalize the scraping process and update log"""
        end_time = datetime.now()
        duration = (end_time - self.start_time).total_seconds()
        
        status = "completed" if success else "failed"
        
        # Print final status
        if success:
            print(f"Scraping completed successfully!")
            print(f"Found {self.jobs_found} jobs")
            print(f"Saved {self.jobs_saved} jobs")
            print(f"Duration: {duration:.1f} seconds")
        else:
            print(f"Scraping failed: {error_message}")
        
        # Update database log
        if self.log_id:
            try:
                self.supabase.table("scraping_logs").update({
                    "status": status,
                    "jobs_found": self.jobs_found,
                    "jobs_saved": self.jobs_saved,
                    "completed_at": end_time.isoformat(),
                    "duration_seconds": int(duration),
                    "error_message": error_message
                }).eq("id", self.log_id).execute()
            except Exception as e:
                logger.error(f"Failed to update final log status: {e}")

    def extract_skills(self, text: str, skills_data: Dict = None) -> Dict:
        """Extract skills from job text"""
        # This should integrate with your existing skills engine
        # For now, return empty structure
        return {
            "flat_skills": [],
            "skills_by_category": {}
        }

# Example usage for Indeed scraper
def main():
    """Main function for scraper execution"""
    if len(sys.argv) < 4:
        print("Usage: python scraper.py <location> <days> <log_id> [keywords] [priority]")
        sys.exit(1)
    
    location = sys.argv[1]
    days = int(sys.argv[2])
    log_id = sys.argv[3]
    keywords = sys.argv[4].split(",") if len(sys.argv) > 4 and sys.argv[4] else []
    priority = sys.argv[5] if len(sys.argv) > 5 else "medium"
    
    # Initialize scraper
    scraper = BaseScraper("indeed", log_id)
    
    try:
        scraper.log_progress(f"Starting Indeed scraper - Location: {location}, Days: {days}")
        
        # Your scraping logic would go here
        # This is where you'd integrate with your existing scraper functions
        # Example:
        # jobs = scrape_indeed_jobs(location, days, keywords)
        # scraper.jobs_found = len(jobs)
        # saved_count = scraper.save_jobs_to_db(jobs)
        # scraper.jobs_saved = saved_count
         # Scrape and crawl
        # indeed_scraper = scrape_indeed(location, days)
        indeed_crawler = crawl_indeed(location, days)
        # career_builder_scraper = scrape_career_builder(location)
        career_builder_crawler = crawl_career_builder(location)
        dice_scraper = scrape_dice(location, days)
        zip_jobs = scrape_zip_and_insert(location, days)
        teksystems_jobs = scrape_teksystems(location=location, days=days)  # ✅ Add TekSystems

        # Combine for enrichment
        all_jobs = [
            # indeed_scraper, indeed_crawler,
            # career_builder_scraper, career_builder_crawler,
            dice_scraper, zip_jobs, teksystems_jobs  # ✅ Include TekSystems
        ]

        for job_list in all_jobs:
            for job in job_list:
                text = f"{job.get('title', '')} {job.get('job_description', '')}"
                job["flat_skills"] = extract_flat_skills(text, SKILLS["flat"])
                job["skills_by_category"] = extract_skills_by_category(text, SKILLS["matrix"])
                job["skills"] = job["flat_skills"]

        # Save to CSVs
        # write_jobs_csv(indeed_scraper, scraper="indeed_scraper")
        write_jobs_csv(indeed_crawler, scraper="indeed_crawler")
        # write_jobs_csv(career_builder_scraper, scraper="career_builder_scraper")
        write_jobs_csv(career_builder_crawler, scraper="career_builder_crawler")
        write_jobs_csv(dice_scraper, scraper="dice_scraper")
        write_jobs_csv(zip_jobs, scraper="zip_scraper")
        write_jobs_csv(teksystems_jobs, scraper="teksystems_scraper")  # ✅ Save TekSystems jobs

        # Clean & sync
        cleanup(days)
        scan_for_duplicates()
        sync_job_data_folder_to_supabase(folder="server/job_data")

        return {
            # "indeed_scraper": len(indeed_scraper),
            "indeed_crawler": len(indeed_crawler),
            # "career_builder_scraper": len(career_builder_scraper),
            "career_builder_crawler": len(career_builder_crawler),
            "zip_scraper": len(zip_jobs),
            "teksystems_scraper": len(teksystems_jobs),  # ✅ Add to final status
            "status": "All jobs scraped, enriched, deduped, and synced to Supabase"
        }
        scraper.finalize_scraping(success=True)
        
    except Exception as e:
        logger.error(f"Scraper failed: {e}")
        scraper.finalize_scraping(success=False, error_message=str(e))
        sys.exit(1)

if __name__ == "__main__":
    main()