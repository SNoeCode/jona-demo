# from fastapi import APIRouter
# from app.types.scraper import ScraperRequest
# from app.scrapers.career_crawler import crawl_career_builder
# from app.utils.write_jobs import write_jobs_csv
# from pydantic import BaseModel
# from typing import List, Optional
# from time import time

# career_crawler_router = APIRouter()

# class ScraperRequest(BaseModel):
#     location: str
#     days: int
#     keywords: List[str]
#     sites: Optional[List[str]] = []
#     priority: Optional[str] = "medium"
#     admin_user_id: Optional[str]
#     admin_email: Optional[str]
#     debug: Optional[bool] = False

# @career_crawler_router.post("/")
# async def run_careerbuilder_scraper(request: ScraperRequest):
#     start = time()

#     jobs = crawl_career_builder(
#         location=request.location,
#         keywords=request.keywords,
#         days=request.days
#     )

#     duration = round(time() - start, 2)

#     write_jobs_csv(jobs, scraper="career_builder_crawler")

#     return {
#         "success": True,
#         "status": "completed",
#         "career_builder_crawler": len(jobs),
#         "jobs_found": len(jobs),
#         "jobs_saved": len(jobs),
#         "duration_seconds": duration,
#         "message": f"Found {len(jobs)} jobs from CareerBuilder in {duration} seconds"
#     }
from pydantic import BaseModel
from typing import List, Dict
from fastapi import FastAPI, Query, HTTPException, Header, File, UploadFile,Request, APIRouter
from datetime import datetime
import os
from jose import jwt, JWTError
from app.utils.skills_engine import (
    load_all_skills,
    extract_flat_skills,
    extract_skills,
    extract_skills_by_category
)
from app.db.connect_database import supabase
from app.db.cleanup import cleanup
from app.utils.scan_for_duplicates import scan_for_duplicates
from app.utils.write_jobs import write_jobs_csv

from app.scrapers.career_crawler import crawl_career_builder
SKILLS = load_all_skills()
router = APIRouter()
# Initialize FastAPI app
app = FastAPI()
router = APIRouter()
from fastapi import APIRouter, Query
router = APIRouter()
@router.get("/run")

# @router.get("/careerbuilder", summary="Scrape and crawl CareerBuilder")
def run_careerbuilder(location: str = Query("remote"), days: int = Query(15), debug: bool = Query(False)) -> Dict:
    # career_builder = scrape_career_builder(location)
    career_builder_crawler = crawl_career_builder(location)

    # write_jobs_csv(career_builder, scraper="career_builder_scraper")
    write_jobs_csv(crawl_career_builder, scraper="career_builder_crawler")

    return {
        # "career_builder_scraper": len(career_builder),
        "career_builder_crawler": len(crawl_career_builder),

        "status": "careerbuilder complete"
    }