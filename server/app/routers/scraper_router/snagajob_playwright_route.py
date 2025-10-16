from fastapi import APIRouter, Query
from app.scrapers.snagajob_playwright import scrape_snag_jobs
from app.utils.write_jobs import write_jobs_csv
from app.utils.scan_for_duplicates import scan_for_duplicates       
router = APIRouter()

@router.get("/run", summary="Scrape Snagajob using Playwright")
def run_snag_playwright(location: str = Query("remote")):
    jobs = scrape_snag_jobs(location=location)
    scan_for_duplicates()

    write_jobs_csv(jobs, folder_name="job_data", label="snag_playwright")
    return {
        "snag_scraper": len(jobs),
        "status": "Snagajob Playwright scrape complete"
    }