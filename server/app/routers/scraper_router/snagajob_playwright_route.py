from fastapi import APIRouter, Query, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Optional
import time
import logging
import traceback
from app.scrapers.snagajob_playwright import scrape_snag_jobs
from app.utils.write_jobs import write_jobs_csv
from app.utils.scan_for_duplicates import scan_for_duplicates

router = APIRouter()
logger = logging.getLogger(__name__)

# Request model
class SnagajobScraperRequest(BaseModel):
    location: str = "remote"
    keywords: List[str] = []
    debug: bool = False
    priority: str = "medium"
    max_results: int = 100
    headless: bool = True
    skip_captcha: bool = True

# Response model
class SnagajobScraperResponse(BaseModel):
    success: bool
    jobs_found: int
    jobs_saved: int
    duration_seconds: float
    message: str
    status: str
    scraper_name: str = "snagajob"
    error_details: Optional[str] = None

# POST endpoint
@router.post("/run", response_model=SnagajobScraperResponse, summary="Run Snagajob Crawler")
async def run_snagajob_crawler(request: SnagajobScraperRequest) -> Dict:
    start_time = time.time()
    
    logger.info(f"🚀 Snagajob scraper started")
    logger.info(f"   Location: {request.location}")
    logger.info(f"   Keywords: {request.keywords}")
    logger.info(f"   Headless: {request.headless}")
    logger.info(f"   Skip CAPTCHA: {request.skip_captcha}")
    
    try:
        # Validate keywords
        if not request.keywords or len(request.keywords) == 0:
            logger.warning("⚠️ No keywords provided, using defaults")
            keywords = None  # Will use defaults in scraper
        else:
            keywords = request.keywords
            logger.info(f"✅ Using {len(keywords)} keywords")
        
        # Run the scraper
        logger.info("🏃 Starting scraper...")
        jobs = scrape_snag_jobs(
            location=request.location,
            keywords=keywords,
            headless=request.headless,
            skip_captcha=request.skip_captcha
        )
        
        logger.info(f"✅ Scraper completed: {len(jobs)} jobs found")
        
        # Post-processing
        if jobs:
            try:
                logger.info("🔍 Scanning for duplicates...")
                scan_for_duplicates()
                
                logger.info("💾 Writing to CSV...")
                write_jobs_csv(jobs, folder_name="job_data", label="snag_playwright")
                
            except Exception as e:
                logger.error(f"⚠️ Post-processing error: {e}")
                # Continue even if post-processing fails
        
        duration = time.time() - start_time
        total_jobs_found = len(jobs)
        
        logger.info(f"✅ Total duration: {duration:.2f}s")
        
        return {
            "success": True,
            "jobs_found": total_jobs_found,
            "jobs_saved": total_jobs_found,
            "duration_seconds": round(duration, 2),
            "message": f"Successfully scraped {total_jobs_found} jobs from Snagajob in {duration:.1f}s",
            "status": "completed",
            "scraper_name": "snagajob",
            "error_details": None
        }
        
    except Exception as e:
        duration = time.time() - start_time
        error_msg = str(e)
        error_trace = traceback.format_exc()
        
        logger.error(f"❌ Scraper failed: {error_msg}")
        logger.error(f"Traceback:\n{error_trace}")
        
        return {
            "success": False,
            "jobs_found": 0,
            "jobs_saved": 0,
            "duration_seconds": round(duration, 2),
            "message": f"Error scraping Snagajob: {error_msg}",
            "status": "failed",
            "scraper_name": "snagajob",
            "error_details": error_trace if request.debug else error_msg
        }

# GET endpoint
@router.get("/run", response_model=SnagajobScraperResponse, summary="Run Snagajob Crawler (GET)")
async def run_snagajob_crawler_get(
    location: str = Query("remote", description="Job location to search"),
    debug: bool = Query(False, description="Enable debug mode"),
    keywords: str = Query("", description="Comma-separated keywords"),
    max_results: int = Query(100, ge=1, le=500, description="Max results per keyword"),
    headless: bool = Query(True, description="Run browser in headless mode"),
    skip_captcha: bool = Query(True, description="Skip CAPTCHA prompt")
) -> Dict:
    keyword_list = [k.strip() for k in keywords.split(",") if k.strip()] if keywords else []
    
    request = SnagajobScraperRequest(
        location=location,
        keywords=keyword_list,
        debug=debug,
        max_results=max_results,
        headless=headless,
        skip_captcha=skip_captcha
    )
    
    return await run_snagajob_crawler(request)

# Status endpoint
@router.get("/status", summary="Get Snagajob Crawler Status")
async def get_snagajob_status() -> Dict:
    return {
        "scraper": "snagajob",
        "status": "active",
        "version": "2.0",
        "endpoints": {
            "post": "/scrapers/snag-playwright/run",
            "get": "/scrapers/snag-playwright/run?location=remote&headless=true"
        },
        "features": [
            "headless_mode",
            "captcha_skip",
            "multi_keyword_search",
            "skill_extraction",
            "csv_export",
            "duplicate_detection",
            "error_recovery"
        ],
        "defaults": {
            "location": "remote",
            "pages_per_keyword": 2,
            "max_days": 5,
            "headless": True,
            "skip_captcha": True
        }
    }

# Health check
@router.get("/health", summary="Snagajob Scraper Health Check")
async def health_check() -> Dict:
    try:
        # Basic check - can be expanded
        return {
            "status": "healthy",
            "scraper": "snagajob",
            "timestamp": time.time()
        }
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        raise HTTPException(status_code=503, detail="Scraper unhealthy")
