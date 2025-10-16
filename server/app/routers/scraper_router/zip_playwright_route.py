from fastapi import APIRouter, Query
from app.scrapers.zip_playwright import scrape_zip_with_playwright
from app.utils.write_jobs import write_jobs_csv

router = APIRouter()

@router.get("/run", summary="Scrape ZipRecruiter using Playwright")
def run_zip_playwright(location: str = Query("remote"), days: int = Query(15)):
    jobs = scrape_zip_with_playwright(location, days)
    write_jobs_csv(jobs, folder_name="job_data", label="zip_playwright")
    return {
        "zip_scraper": len(jobs),
        "status": "ZipRecruiter Playwright scrape complete"
    }