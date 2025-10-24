from pydantic import BaseModel
from typing import List, Dict, Optional
from fastapi import APIRouter, Query, HTTPException
from datetime import datetime
import time
from app.utils.skills_engine import (
    load_all_skills,
    extract_flat_skills,
    extract_skills,
    extract_skills_by_category
)
from app.scrapers.indeed_scraper import scrape_indeed
from app.scrapers.indeed_crawler import scrape_indeed_jobs
from app.utils.write_jobs import write_jobs_csv
from app.config.config_utils import get_output_folder

SKILLS = load_all_skills()

router = APIRouter()
class IndeedScraperRequest(BaseModel):
    location: str = "remote"
    days: int = 15
    keywords: List[str] = []
    debug: bool = False
    priority: str = "medium"
    max_results: int = 100
class IndeedScraperResponse(BaseModel):
    success: bool
    jobs_found: int
    jobs_saved: int
    duration_seconds: float
    message: str
    status: str
    scraper_name: str = "indeed"


@router.post("/run", response_model=IndeedScraperResponse, summary="Run Indeed Scraper")
async def run_indeed_scraper(request: IndeedScraperRequest) -> Dict:
    """
    Run the Indeed scraper with the provided configuration.
    
    This endpoint triggers both the Indeed scraper and crawler,
    saves results to CSV, and returns statistics.
    
    Args:
        request: IndeedScraperRequest with scraper configuration
        
    Returns:
        IndeedScraperResponse with scraping results
    """
    start_time = time.time()
    
    try:
        indeed_scraper_jobs = await scrape_indeed(
            keywords=request.keywords if request.keywords else None,
            location=request.location,
            days=request.days,
            max_results=request.max_results
        )
        
        indeed_crawler_jobs = scrape_indeed_jobs(
            location=request.location,
            days=request.days,
            keywords=request.keywords if request.keywords else None,
            max_results=request.max_results
        )
        
        folder = get_output_folder()
        if not folder.exists():
            folder.mkdir(parents=True, exist_ok=True)
            
        write_jobs_csv(indeed_scraper_jobs, label="indeed_scraper")
        write_jobs_csv(indeed_crawler_jobs, label="indeed_crawler")

        total_jobs_found = len(indeed_scraper_jobs) + len(indeed_crawler_jobs)
        duration = time.time() - start_time
        
        return {
            "success": True,
            "jobs_found": total_jobs_found,
            "jobs_saved": total_jobs_found,
            "duration_seconds": round(duration, 2),
            "message": f"Successfully scraped {total_jobs_found} jobs from Indeed",
            "status": "completed",
            "scraper_name": "indeed"
        }
        
    except Exception as e:
        duration = time.time() - start_time
        return {
            "success": False,
            "jobs_found": 0,
            "jobs_saved": 0,
            "duration_seconds": round(duration, 2),
            "message": f"Error scraping Indeed: {str(e)}",
            "status": "failed",
            "scraper_name": "indeed"
        }


@router.get("/run", response_model=IndeedScraperResponse, summary="Run Indeed Scraper (GET)")
async def run_indeed_scraper_get(
    location: str = Query("remote", description="Job location to search"),
    days: int = Query(15, ge=1, le=30, description="Number of days back to search"),
    debug: bool = Query(False, description="Enable debug mode"),
    keywords: str = Query("", description="Comma-separated keywords")
) -> Dict:
    """
    GET version of the Indeed scraper endpoint.
    Converts query parameters to request model and calls the main scraper.
    """
    keyword_list = [k.strip() for k in keywords.split(",") if k.strip()] if keywords else []
    request = IndeedScraperRequest(
        location=location,
        days=days,
        keywords=keyword_list,
        debug=debug
    )
    
    return await run_indeed_scraper(request)


@router.get("/status", summary="Get Indeed Scraper Status")
async def get_indeed_status() -> Dict:
    """
    Get the status of the Indeed scraper.
    """
    return {
        "scraper": "indeed",
        "status": "active",
        "endpoints": {
            "post": "/scrapers/indeed/run",
            "get": "/scrapers/indeed/run?location=remote&days=15"
        },
        "features": [
            "indeed_scraper",
            "indeed_crawler",
            "csv_export"
        ]
    }