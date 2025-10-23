# app/routers/scraper_router/indeed_route.py
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

# Load skills once at module level
SKILLS = load_all_skills()

# Create router
router = APIRouter()


# Request model for POST endpoint
class IndeedScraperRequest(BaseModel):
    location: str = "remote"
    days: int = 15
    keywords: List[str] = []
    debug: bool = False
    priority: str = "medium"
    max_results: int = 100


# Response model
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
        # Run both scrapers
        indeed_scraper_jobs = scrape_indeed(request.location, request.days)
        indeed_crawler_jobs = scrape_indeed_jobs(request.location, request.days)
        
        # Get output folder
        folder = get_output_folder()
        
        # Write results to CSV with correct parameter name
        write_jobs_csv(indeed_scraper_jobs, label="indeed_scraper")
        write_jobs_csv(indeed_crawler_jobs, label="indeed_crawler")
        
        # Calculate totals
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
    # Convert comma-separated keywords to list
    keyword_list = [k.strip() for k in keywords.split(",") if k.strip()] if keywords else []
    
    # Create request object
    request = IndeedScraperRequest(
        location=location,
        days=days,
        keywords=keyword_list,
        debug=debug
    )
    
    # Call the main scraper function
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
