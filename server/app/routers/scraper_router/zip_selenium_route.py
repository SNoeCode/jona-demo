from fastapi import APIRouter, Query
from app.scrapers.zip_selenium import scrape_zip_with_selenium
from app.utils.write_jobs import write_jobs_csv

router = APIRouter()

@router.get("/run", summary="Scrape ZipRecruiter using Selenium")
def run_zip_selenium(location: str = Query("remote"), days: int = Query(15)):
    jobs = scrape_zip_with_selenium(location, days)
    write_jobs_csv(jobs, folder_name="job_data", label="zip_selenium")
    return {
        "zip_scraper": len(jobs),
        "status": "ZipRecruiter Selenium scrape complete"
    }
