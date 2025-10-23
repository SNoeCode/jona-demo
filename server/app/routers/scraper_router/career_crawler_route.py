from fastapi import APIRouter, Query
from pydantic import BaseModel
from typing import List, Dict
import time
from app.scrapers.career_crawler import crawl_career_builder
from app.utils.write_jobs import write_jobs_csv
from app.utils.skills_engine import load_all_skills

SKILLS = load_all_skills()
router = APIRouter()
class CareerBuilderScraperRequest(BaseModel):
    location: str = "remote"
    days: int = 15
    keywords: List[str] = []
    debug: bool = False
    priority: str = "medium"
    max_results: int = 100
class CareerBuilderScraperResponse(BaseModel):
    success: bool
    jobs_found: int
    jobs_saved: int
    duration_seconds: float
    message: str
    status: str
    scraper_name: str = "career_builder"

@router.post("/run", response_model=CareerBuilderScraperResponse, summary="Run CareerBuilder Crawler")
async def run_career_builder_crawler(request: CareerBuilderScraperRequest) -> Dict:
    start_time = time.time()

    try:
        jobs = crawl_career_builder(
            location=request.location, 
            pages=request.max_results, 
            days=request.days
        )
        write_jobs_csv(jobs, folder_name="job_data", label="careerbuilder")

        duration = time.time() - start_time
        total_jobs_found = len(jobs)

        return {
            "success": True,
            "jobs_found": total_jobs_found,
            "jobs_saved": total_jobs_found,
            "duration_seconds": round(duration, 2),
            "message": f"Successfully crawled {total_jobs_found} jobs from CareerBuilder",
            "status": "completed",
            "scraper_name": "career_builder"
        }

    except Exception as e:
        duration = time.time() - start_time
        return {
            "success": False,
            "jobs_found": 0,
            "jobs_saved": 0,
            "duration_seconds": round(duration, 2),
            "message": f"Error crawling CareerBuilder: {str(e)}",
            "status": "failed",
            "scraper_name": "career_builder"
        }

@router.get("/run", response_model=CareerBuilderScraperResponse, summary="Run CareerBuilder Crawler (GET)")
async def run_career_builder_crawler_get(
    location: str = Query("remote", description="Job location to search"),
    days: int = Query(15, ge=1, le=30, description="Number of days back to search"),
    debug: bool = Query(False, description="Enable debug mode"),
    keywords: str = Query("", description="Comma-separated keywords"),
    max_results: int = Query(100, ge=1, le=500, description="Max results per keyword")
) -> Dict:
    keyword_list = [k.strip() for k in keywords.split(",") if k.strip()] if keywords else []

    request = CareerBuilderScraperRequest(
        location=location,
        days=days,
        keywords=keyword_list,
        debug=debug,
        max_results=max_results
    )

    return await run_career_builder_crawler(request)

@router.get("/status", summary="Get CareerBuilder Crawler Status")
async def get_career_builder_status() -> Dict:
    return {
        "scraper": "career_builder",
        "status": "active",
        "endpoints": {
            "post": "/scrapers/career_builder/run",
            "get": "/scrapers/career_builder/run?location=remote&days=15"
        },
        "features": [
            "career_builder_crawler",
            "csv_export"
        ]
    }