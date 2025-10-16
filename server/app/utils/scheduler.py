import logging
from apscheduler.schedulers.background import BackgroundScheduler

from app.scraper.indeed_scraper import scrape_indeed
from app.scraper.indeed_crawler import get_jobs_from_crawl4ai
from app.scraper.career_scraper import scrape_careerbuilder
from app.scraper.career_crawler import get_jobs_from_careerbuilder
from app.utils.write_jobs import write_jobs_csv
from app.config.config_utils import get_output_folder

# Setup logging to both file and console
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
    handlers=[
        logging.FileHandler("scheduler.log", mode="a"),
        logging.StreamHandler()
    ]
)

def scheduled_job():
    logging.info("⏰ Scheduled job started")

    location = "remote"
    days = 15

    try:
        indeed = scrape_indeed(location, days)
        indeed_crawl = get_jobs_from_crawl4ai(location, days)
        cb = scrape_careerbuilder(location)
        cb_crawl = get_jobs_from_careerbuilder(location, days)

        folder = get_output_folder()
        write_jobs_csv(indeed, folder_name=folder, label="indeed_scrape")
        write_jobs_csv(indeed_crawl, folder_name=folder, label="indeed_crawl")
        write_jobs_csv(cb, folder_name=folder, label="career_scrape")
        write_jobs_csv(cb_crawl, folder_name=folder, label="career_crawl")

        logging.info("✅ Job scraping completed successfully.")

    except Exception as e:
        logging.exception("🔥 Error in scheduled job")

def start_scheduler():
    logging.info("🧠 Starting APScheduler...")
    scheduled_job()  # Run immediately on start
    scheduler = BackgroundScheduler()
    scheduler.add_job(scheduled_job, 'interval', hours=12)  # Change to seconds=15 for quick tests
    scheduler.start()

if __name__ == "__main__":
    start_scheduler()