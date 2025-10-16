from fastapi import FastAPI
from fastapi.responses import RedirectResponse
from fastapi.middleware.cors import CORSMiddleware
# from app.routers import matching, applications, skills
from app.utils.skills_engine import load_all_skills
import logging
import os
from dotenv import load_dotenv
from typing import Any
from fastapi import FastAPI, Query, HTTPException, Header, File, UploadFile, Request, APIRouter
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from openai import OpenAI
from typing import List
import os, json

from app.db.connect_database import supabase
from app.utils.skills_engine import (
    load_all_skills,
    extract_skills,
    extract_flat_skills,
    extract_skills_by_category
)

# router = APIRouter()
from app.routers.scraper_router import master_scrapers_router
# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)
# DEFAULT_AUTH = os.getenv("DEFAULT_AUTH_TOKEN")

# Initialize FastAPI app
app = FastAPI(
    title="Job Scraper & Matching API",
    description="API for job scraping, skill matching, and application management",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global skills loading
logger.info("Loading skills data...")
try:
    SKILLS = load_all_skills()
    logger.info(f"Skills loaded successfully: {len(SKILLS.get('combined_flat', []))} total skills")
except Exception as e:
    logger.error(f"Failed to load skills: {e}")
    SKILLS = {"flat": [], "combined_flat": [], "matrix": {}}

# Make skills available globally
app.state.skills = SKILLS
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from openai import OpenAI
from typing import List
import os, json

from app.db.connect_database import supabase
from app.utils.skills_engine import (
    load_all_skills,
    extract_skills,
    extract_flat_skills,
    extract_skills_by_category
)

router = APIRouter()
SKILLS = load_all_skills()

# 🚀 Request Models
class ResumeMatchRequest(BaseModel):
    resume_text: str

class CompareResumeRequest(BaseModel):
    resume_text: str
    job_description: str

class ResumeInput(BaseModel):
    resume_text: str

class JobDesc(BaseModel):
    text: str

class SendResumeRequest(BaseModel):
    resume_text: str
    job_ids: List[str]
    user_id: str
    user_email: str
    resume_id: str
class PromptResult(BaseModel):
    id: str
    title: str
    company: str
    match_score: float
    matched_skills: list[str]
    missing_skills: list[str]

# 🧠 Extract skills from text
@app.post("/flat-skills/extract")
def flat_skill_extract(payload: JobDesc):
    flat = extract_flat_skills(payload.text, SKILLS["flat"])
    categorized = extract_skills_by_category(payload.text, SKILLS["matrix"])
    return {
        "flat_skills": flat,
        "skills_by_category": categorized
    }

# ⚖️ Compare resume to one job
@app.post("/compare-resume")
def compare_resume(payload: CompareResumeRequest):
    resume_skills = extract_skills(payload.resume_text, SKILLS["combined_flat"])
    job_skills = extract_skills(payload.job_description, SKILLS["combined_flat"])

    matched = sorted(set(resume_skills) & set(job_skills))
    missing = sorted(set(job_skills) - set(resume_skills))
    score = round(100 * len(matched) / max(len(job_skills), 1))

    return {
        "matchScore": score,
        "matchedSkills": matched,
        "missingSkills": missing
    }

# 🔍 Compare resume to all jobs with extracted job skills
@app.post("/match-top-jobs")
def match_top_jobs(payload: ResumeMatchRequest):
    resume_skills = extract_skills(payload.resume_text, SKILLS["combined_flat"])
    jobs_response = supabase.table("jobs").select("id", "title", "company", "job_description").execute()
    jobs = jobs_response.data or []

    scored_jobs = []
    for job in jobs:
        job_text = job.get("job_description", "")
        job_skills = extract_skills(job_text, SKILLS["combined_flat"])

        overlap = set(resume_skills) & set(job_skills)
        missing = sorted(set(job_skills) - set(resume_skills))
        score = len(overlap)

        scored_jobs.append({
            "id": job["id"],
            "title": job["title"],
            "company": job["company"],
            "match_score": score,
            "matched_skills": sorted(overlap),
            "missing_skills": missing,
            "job_skills": sorted(job_skills),
            "resume_skills": sorted(resume_skills),
            "job_description": job_text
        })

    return sorted(scored_jobs, key=lambda x: x["match_score"], reverse=True)[:10]

SKILLS = load_all_skills()

# 🚀 Request Models
class ResumeMatchRequest(BaseModel):
    resume_text: str

class CompareResumeRequest(BaseModel):
    resume_text: str
    job_description: str

class ResumeInput(BaseModel):
    resume_text: str

class JobDesc(BaseModel):
    text: str

class SendResumeRequest(BaseModel):
    resume_text: str
    job_ids: List[str]
    user_id: str
    user_email: str
    resume_id: str
class PromptResult(BaseModel):
    id: str
    title: str
    company: str
    match_score: float
    matched_skills: list[str]
    missing_skills: list[str]

# 🧠 Extract skills from text
@app.post("/flat-skills/extract")
def flat_skill_extract(payload: JobDesc):
    flat = extract_flat_skills(payload.text, SKILLS["flat"])
    categorized = extract_skills_by_category(payload.text, SKILLS["matrix"])
    return {
        "flat_skills": flat,
        "skills_by_category": categorized
    }

# ⚖️ Compare resume to one job
@app.post("/compare-resume")
def compare_resume(payload: CompareResumeRequest):
    resume_skills = extract_skills(payload.resume_text, SKILLS["combined_flat"])
    job_skills = extract_skills(payload.job_description, SKILLS["combined_flat"])

    matched = sorted(set(resume_skills) & set(job_skills))
    missing = sorted(set(job_skills) - set(resume_skills))
    score = round(100 * len(matched) / max(len(job_skills), 1))

    return {
        "matchScore": score,
        "matchedSkills": matched,
        "missingSkills": missing
    }

# 🔍 Compare resume to all jobs with extracted job skills
@app.post("/match-top-jobs")
def match_top_jobs(payload: ResumeMatchRequest):
    resume_skills = extract_skills(payload.resume_text, SKILLS["combined_flat"])
    jobs_response = supabase.table("jobs").select("id", "title", "company", "job_description").execute()
    jobs = jobs_response.data or []

    scored_jobs = []
    for job in jobs:
        job_text = job.get("job_description", "")
        job_skills = extract_skills(job_text, SKILLS["combined_flat"])

        overlap = set(resume_skills) & set(job_skills)
        missing = sorted(set(job_skills) - set(resume_skills))
        score = len(overlap)

        scored_jobs.append({
            "id": job["id"],
            "title": job["title"],
            "company": job["company"],
            "match_score": score,
            "matched_skills": sorted(overlap),
            "missing_skills": missing,
            "job_skills": sorted(job_skills),
            "resume_skills": sorted(resume_skills),
            "job_description": job_text
        })

    return sorted(scored_jobs, key=lambda x: x["match_score"], reverse=True)[:10]

# Include routers
app.include_router(master_scrapers_router.router, prefix="/api/scrapers", tags=["scrapers"])
# app.include_router(matching.router, prefix="/api/matching", tags=["matching"])
# app.include_router(applications.router, prefix="/api/applications", tags=["applications"])
# app.include_router(skills.router, prefix="/api/skills", tags=["skills"])
@app.get("/", include_in_schema=False)
def redirect_to_docs():
    """Redirect root to API documentation"""
    return RedirectResponse(url="/docs")

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "skills_loaded": {
            "flat": len(SKILLS.get("flat", [])),
            "combined": len(SKILLS.get("combined_flat", [])),
            "matrix_categories": len(SKILLS.get("matrix", {}))
        },
        "environment": "development" if os.getenv("DEBUG") else "production"
    }

@app.get("/info")
async def app_info():
    """Application information"""
    return {
        "message": "Job Scraper & Matching API",
        "version": "1.0.0",
        "skills_loaded": {
            "flat": len(SKILLS.get("flat", [])),
            "combined": len(SKILLS.get("combined_flat", [])),
            "matrix_categories": len(SKILLS.get("matrix", {}))
        }
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )




















# from pydantic import BaseModel
# from typing import List, Dict, Optional
# from fastapi import FastAPI, Query,Depends, HTTPException, Header, File, UploadFile, Request, APIRouter
# from datetime import datetime
# import os
# import logging

# from pydantic import BaseModel
# from typing import List, Dict
# from fastapi import FastAPI, Query,HTTPException, Header, File, UploadFile,Request, APIRouter
# from datetime import datetime
# import os
# from jose import jwt, JWTError
# from app.utils.skills_engine import (
#     load_all_skills,
#     extract_flat_skills,
#     extract_skills,
#     extract_skills_by_category
# )
# from sentence_transformers import SentenceTransformer
# from app.scrapers.tek_systems import scrape_teksystems
# from app.scrapers.indeed_crawler import get_jobs_from_crawl4ai
# from app.scrapers.dice_scraper import scrape_dice
# from app.scrapers.career_crawler import crawl_career_builder 
# from app.scrapers.zip_crawler import scrape_zip_and_insert
# from app.db.connect_database import supabase
# from app.scrapers.indeed_scraper import scrape_indeed
# import uuid
# from app.db.cleanup import cleanup
# from app.utils.scan_for_duplicates import scan_for_duplicates
# from app.utils.write_jobs import write_jobs_csv
# from app.db.sync_jobs import sync_job_data_folder_to_supabase
# from app.config.config_utils import get_output_folder
# # from app.scraper.career_builder_scraper import scrape_career_builder
# from app.routes.scrapers import router as scrapers_router
# from app.routes.match import router as matching_router
# from app.routes.resume import router as resume_router
# # from app.prompts_ai.prompt_test import router as prompt_test_router 
# from dotenv import load_dotenv
# from openai import OpenAI
# import json
# load_dotenv()
# app = FastAPI()

# router = APIRouter()
# app.include_router(scrapers_router)
# app.include_router(matching_router, prefix="/match")
# # app.include_router(prompt_test_router)

# app.include_router(resume_router)


# # Optional: Start job sync scheduler
# # from app.utils.scheduler import start_scheduler
# # start_scheduler()

# # CORS setup
# from fastapi.middleware.cors import CORSMiddleware

# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=[
#         "http://localhost:3000",  # Next.js dev server
#         "http://127.0.0.1:3000",
#         "https://localhost:3000",
#         "https://127.0.0.1:3000",
#         "*"  # Remove this in production and specify exact origins
#     ],
#     allow_credentials=True,
#     allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
#     allow_headers=[
#         "Authorization",
#         "Content-Type", 
#         "Accept",
#         "Origin",
#         "X-Requested-With",
#         "Access-Control-Request-Method",
#         "Access-Control-Request-Headers"
#     ],
#     expose_headers=["*"]
# )
# SKILLS = load_all_skills()

# def get_current_user_id(authorization: str = Header(...)) -> str:
#     token = authorization.replace("Bearer ", "")
#     secret = os.environ["SUPABASE_JWT_SECRET"]
#     try:
#         payload = jwt.decode(token, secret, algorithms=["HS256"])
#         return payload["sub"]
#     except JWTError:
#         raise HTTPException(status_code=401, detail="Invalid auth token")

# # Models
# class JobDesc(BaseModel):
#     text: str

# class CompareResumeRequest(BaseModel):
#     resume_text: str
#     job_description: str

# class ResumeMatchRequest(BaseModel):
#     resume_text: str

# # Skill extraction from job desc
# @app.post("/flat-skills/extract")
# def flat_skill_extract(payload: JobDesc):
#     flat = extract_flat_skills(payload.text, SKILLS["flat"])
#     categorized = extract_skills_by_category(payload.text, SKILLS["matrix"])
#     return {
#         "flat_skills": flat,
#         "skills_by_category": categorized
#     }

# # Compare resume to one job
# @app.post("/compare-resume", summary="Compare resume to a job description")
# def compare_resume(payload: CompareResumeRequest):
#     resume_skills = extract_skills(payload.resume_text, SKILLS["combined_flat"])
#     job_skills = extract_skills(payload.job_description, SKILLS["combined_flat"])

#     matched = sorted(set(resume_skills) & set(job_skills))
#     missing = sorted(set(job_skills) - set(resume_skills))
#     score = round(100 * len(matched) / max(len(job_skills), 1))

#     return {
#         "matchScore": score,
#         "matchedSkills": matched,
#         "missingSkills": missing
#     }
# class ScraperRequest(BaseModel):
#     location: str = "remote"
#     days: int = 15
#     keywords: Optional[List[str]] = []
#     sites: Optional[List[str]] = []
#     priority: str = "medium"
#     debug: bool = False
#     user_id: Optional[str] = None
#     admin_user_id: Optional[str] = None
#     admin_email: Optional[str] = None

# class ScraperResponse(BaseModel):
#     success: bool
#     scraper_name: str
#     jobs_found: int = 0
#     jobs_count: int = 0  # Alias for jobs_found
#     jobs_saved: int = 0
#     status: str
#     message: str
#     duration_seconds: Optional[float] = None
#     error: Optional[str] = None
#     log_id: Optional[str] = None

# class ScraperStatus(BaseModel):
#     status: str
#     available_scrapers: List[str]
#     running_scrapers: int = 0
#     last_updated: datetime

# # Global state for tracking running scrapers
# running_scrapers: Dict[str, Dict[str, Any]] = {}

# logger = logging.getLogger(__name__)

# # Utility functions
# def create_scraper_response(
#     scraper_name: str,
#     jobs_count: int,
#     success: bool = True,
#     error: str = None,
#     duration: float = None
# ) -> ScraperResponse:
#     return ScraperResponse(
#         success=success,
#         scraper_name=scraper_name,
#         jobs_found=jobs_count,
#         jobs_count=jobs_count,
#         jobs_saved=jobs_count if success else 0,
#         status="completed" if success else "failed",
#         message=f"Found {jobs_count} jobs from {scraper_name}" if success else f"Failed to scrape {scraper_name}",
#         error=error,
#         duration_seconds=duration
#     )

# async def log_scraping_activity(
#     scraper_name: str,
#     config: ScraperRequest,
#     result: ScraperResponse,
#     user_id: str = None
# ):
#     """Log scraping activity to Supabase"""
#     try:
#         supabaseScraper = supabase()
#         if supabase:
#             log_data = {
#                 "scraper_type": scraper_name,
#                 "status": result.status,
#                 "jobs_found": result.jobs_found,
#                 "jobs_saved": result.jobs_saved,
#                 "location": config.location,
#                 "keywords_used": config.keywords,
#                 "sites_scraped": [scraper_name],
#                 "started_at": datetime.utcnow().isoformat(),
#                 "completed_at": datetime.utcnow().isoformat(),
#                 "duration_seconds": result.duration_seconds,
#                 "error_message": result.error,
#                 "user_id": user_id or config.user_id,
#                 "admin_initiated": bool(config.admin_user_id),
#                 "admin_user_id": config.admin_user_id
#             }
            
#             response = supabase.table("scraping_logs").insert(log_data).execute()
#             if response.data:
#                 result.log_id = response.data[0].get("id")
                
#     except Exception as e:
#         logger.error(f"Failed to log scraping activity: {e}")

# # Individual scraper endpoints
# @app.post("/careerbuilder", response_model=ScraperResponse, summary="Scrape CareerBuilder")
# async def run_careerbuilder(
#     config: ScraperRequest,
#     authorization: str = Header(None)
# ) -> ScraperResponse:
#     start_time = datetime.now()
#     user_id = None
    
#     try:
#         # Validate auth if provided
#         if authorization:
#             user_id = get_current_user_id(authorization)
            
#         logger.info(f"Starting CareerBuilder scraper for location: {config.location}")
        
#         # Run scraper
#         career_builder_jobs = crawl_career_builder(config.location) or []
        
#         # Write to CSV
#         if career_builder_jobs:
#             write_jobs_csv(career_builder_jobs, scraper="careerbuilder_crawler")
        
#         duration = (datetime.now() - start_time).total_seconds()
#         result = create_scraper_response("careerbuilder", len(career_builder_jobs), True, None, duration)
        
#         # Log activity
#         await log_scraping_activity("careerbuilder", config, result, user_id)
        
#         return result
        
#     except Exception as e:
#         logger.error(f"CareerBuilder scraper error: {e}")
#         duration = (datetime.now() - start_time).total_seconds()
#         result = create_scraper_response("careerbuilder", 0, False, str(e), duration)
#         await log_scraping_activity("careerbuilder", config, result, user_id)
#         return result

# @app.post("/careerbuilder", response_model=ScraperResponse, summary="Scrape Indeed")
# async def run_indeed(
#     config: ScraperRequest,
#     authorization: str = Header(None)
# ) -> ScraperResponse:
#     start_time = datetime.now()
#     user_id = None
    
#     try:
#         if authorization:
#             user_id = get_current_user_id(authorization)
            
#         logger.info(f"Starting Indeed scraper for location: {config.location}")
        
#         # Prepare keywords for Indeed scraper
#         keywords = " OR ".join(config.keywords) if config.keywords else "software engineer"
        
#         indeed_jobs = scrape_indeed(
#             location=config.location,
#             job_title=keywords,
#             days_back=config.days
#         ) or []
        
#         if indeed_jobs:
#             write_jobs_csv(indeed_jobs, scraper="indeed")
        
#         duration = (datetime.now() - start_time).total_seconds()
#         result = create_scraper_response("indeed", len(indeed_jobs), True, None, duration)
        
#         await log_scraping_activity("indeed", config, result, user_id)
#         return result
        
#     except Exception as e:
#         logger.error(f"Indeed scraper error: {e}")
#         duration = (datetime.now() - start_time).total_seconds()
#         result = create_scraper_response("indeed", 0, False, str(e), duration)
#         await log_scraping_activity("indeed", config, result, user_id)
#         return result
# # Compare resume to all jobs
# @app.post("/match-top-jobs")
# def match_top_jobs(payload: ResumeMatchRequest):
#     resume_skills = extract_skills(payload.resume_text, SKILLS["combined_flat"])
#     jobs_response = supabase.table("jobs").select("id", "title", "company", "skills", "job_description").execute()
#     jobs = jobs_response.data or []

#     scored_jobs = []
#     for job in jobs:
#         job_skills = job.get("skills") or []
#         overlap = set(resume_skills) & set(job_skills)
#         score = len(overlap)
#         scored_jobs.append({
#             "id": job["id"],
#             "title": job["title"],
#             "company": job["company"],
#             "match_score": score,
#             "matched_skills": sorted(overlap)
#         })

#     top_matches = sorted(scored_jobs, key=lambda x: x["match_score"], reverse=True)[:10]
#     return top_matches
# # @app.get("/indeed", summary="Scrape and crawl Indeed")
# # def run_indeed(location: str = Query("remote"), days: int = Query(15), debug: bool = Query(False)) -> Dict:
# #     indeed = scrape_indeed(location, days)
# #     indeed_scraper = scrape_indeed(location, days)
    
# #     folder = get_output_folder()
# #     write_jobs_csv(indeed, folder_name=folder, label="indeed_scrape")
# #     write_jobs_csv(crawl_indeed, folder_name=folder, label="indeed_crawl")
# #     return {
# #         "indeed_scrape": len(indeed),
# #         "indeed_crawl": len(crawl_indeed),
# #         "status": "indeed complete"
# #     }
# # # Scrape endpoints
# @app.get("/indeed", summary="Scrape and crawl Indeed")
# def run_indeed(location: str = Query("remote"), days: int = Query(15), debug: bool = Query(False)) -> Dict:
#     indeed_scraper = scrape_indeed(location, days)
#     indeed_crawler =  get_jobs_from_crawl4ai(location, days)
#     folder = get_output_folder()
#     write_jobs_csv(indeed_scraper, scraper="indeed_scraper")
#     write_jobs_csv(indeed_crawler, scraper="indeed_crawler")

#     return {
#         "indeed_scraper": len(indeed_scraper),
#         "indeed_crawler": len(indeed_crawler),

#         "status": "indeed complete"
#     }
# # @app.get("/careerbuilder", summary="Scrape and crawl CareerBuilder")
# # def run_careerbuilder(location: str = Query("remote"), days: int = Query(15), debug: bool = Query(False)) -> Dict:
# #     career_builder = scrape_career_builder(location)
# #     career_builder_crawler = crawl_career_builder(location)

# #     write_jobs_csv(career_builder, scraper="career_builder_scraper")
# #     write_jobs_csv(career_builder_crawler, scraper="career_builder_crawler")

# #     return {
# #         "career_builder_scraper": len(career_builder),
# #         "career_builder_crawler": len(career_builder_crawler),

# #         "status": "careerbuilder complete"
# #     }
# @app.get("/careerbuilder", summary="Scrape and crawl CareerBuilder")
# def run_careerbuilder(location: str = Query("remote"), days: int = Query(15), debug: bool = Query(False)) -> Dict:
#     # career_builder = scrape_career_builder(location) or []
#     career_builder_crawler = crawl_career_builder(location) or []

#     # write_jobs_csv(career_builder, scraper="career_builder_scraper")
#     write_jobs_csv(career_builder_crawler, scraper="career_builder_crawler")

#     return {
#         # "career_builder_scraper": len(career_builder),
#         "career_builder_crawler": len(career_builder_crawler),

#         "status": "careerbuilder complete"
#     }
# @app.get("/dice", summary="Scrape Dice")
# def run_dice(location: str = Query("remote"), days: int = Query(15)) -> Dict:
#     dice_jobs = scrape_dice(location, days)
#     write_jobs_csv(dice_jobs, scraper="dice_scraper")
#     return {
#         "dice_scraper": len(dice_jobs),
#         "status": "Dice complete"
#     }

# @app.get("/zip", summary="Scrape ZipRecruiter and insert to DB")
# def run_zip(location: str = Query("remote"), days: int = Query(15)) -> Dict:
#     zip_jobs = scrape_zip_and_insert(location, days)  # returns a list of job dicts
#     return {
#         "zip_scraper": len(zip_jobs),
#         "status": "ZipRecruiter inserted to DB"
#     }

# @app.get("/teksystems", summary="Scrape TekSystems jobs")
# def run_teksystems(location: str = Query("remote"), days: int = Query(15)) -> Dict:
#     teksystems_jobs = scrape_teksystems(location=location, days=days)
    
#     # Enrich scraped jobs with skill extraction
#     for job in teksystems_jobs:
#         text = f"{job.get('title', '')} {job.get('job_description', '')}"
#         job["flat_skills"] = extract_flat_skills(text, SKILLS["flat"])
#         job["skills_by_category"] = extract_skills_by_category(text, SKILLS["matrix"])
#         job["skills"] = job["flat_skills"]

#     write_jobs_csv(teksystems_jobs, scraper="teksystems_scraper")
#     return {
#         "teksystems_scraper": len(teksystems_jobs),
#         "status": "TekSystems complete"
#     }

# @app.get("/all", summary="Run scrapers, enrich skills, cleanup, and Supabase sync")
# def run_all(
#     location: str = Query("remote"),
#     days: int = Query(15),
#     debug: bool = Query(False),
#     secret: str = Query(...)
# ) -> Dict:
#     if secret != os.getenv("SCRAPER_SECRET_TOKEN"):
#         raise HTTPException(status_code=401, detail="Unauthorized: Invalid token")

#     # Scrape and crawl
#     # indeed_scraper = scrape_indeed(location, days)
#     indeed_crawler =  get_jobs_from_crawl4ai(location, days)
#     # career_builder_scraper = scrape_career_builder(location)
#     career_builder_crawler = crawl_career_builder(location)
#     dice_scraper = scrape_dice(location, days)
#     zip_jobs = scrape_zip_and_insert(location, days)
#     teksystems_jobs = scrape_teksystems(location=location, days=days)  # ✅ Add TekSystems

#     # Combine for enrichment
#     all_jobs = [
#         # indeed_scraper, 
#         indeed_crawler,
#         # career_builder_scraper, 
#         career_builder_crawler,
#         dice_scraper, zip_jobs, teksystems_jobs  # ✅ Include TekSystems
#     ]

#     for job_list in all_jobs:
#         for job in job_list:
#             text = f"{job.get('title', '')} {job.get('job_description', '')}"
#             job["flat_skills"] = extract_flat_skills(text, SKILLS["flat"])
#             job["skills_by_category"] = extract_skills_by_category(text, SKILLS["matrix"])
#             job["skills"] = job["flat_skills"]

#     # Save to CSVs
#     # write_jobs_csv(indeed_scraper, scraper="indeed_scraper")
#     write_jobs_csv(indeed_crawler, scraper="indeed_crawler")
#     # write_jobs_csv(career_builder_scraper, scraper="career_builder_scraper")
#     write_jobs_csv(career_builder_crawler, scraper="career_builder_crawler")
#     write_jobs_csv(dice_scraper, scraper="dice_scraper")
#     write_jobs_csv(zip_jobs, scraper="zip_scraper")
#     write_jobs_csv(teksystems_jobs, scraper="teksystems_scraper")  # ✅ Save TekSystems jobs

#     # Clean & sync
#     cleanup(days)
#     scan_for_duplicates()
#     sync_job_data_folder_to_supabase(folder="server/job_data")

#     return {
#         # "indeed_scraper": len(indeed_scraper),
#         "indeed_crawler": len(indeed_crawler),
#         # "career_builder_scraper": len(career_builder_scraper),
#         "career_builder_crawler": len(career_builder_crawler),
#         "zip_scraper": len(zip_jobs),
#         "teksystems_scraper": len(teksystems_jobs),  # ✅ Add to final status
#         "status": "All jobs scraped, enriched, deduped, and synced to Supabase"
#     }
# # @app.get("/")
# # def read_root():
# #     return {"message": "Hello, FastAPI!"}

# class ResumeInput(BaseModel):
#     resume_text: str

# @app.post("/openai-match-top-jobs")
# def openai_match_top_jobs(payload: ResumeInput):
#     resume = payload.resume_text
#     jobs_response = supabase.table("jobs").select("id", "title", "company", "job_description").execute()
#     jobs = jobs_response.data or []

#     results = []
#     client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

#     for job in jobs:
#         prompt = (
#             f"Compare this resume and job description by matching skill keywords.\n\n"
#             f"Resume:\n{resume}\n\nJob Description:\n{job['job_description']}\n\n"
#             f"Return valid JSON like: {{'matchScore': %, 'matchedSkills': [...], 'missingSkills': [...]}}"
#         )
#         try:
#             response = client.chat.completions.create(
#                 model="gpt-3.5-turbo",
#                 messages=[{"role": "user", "content": prompt}],
#                 temperature=0.2
#             )
#             output = response.choices[0].message.content or "{}"
#             parsed = json.loads(output)
#             results.append({
#                 "id": job["id"],
#                 "title": job["title"],
#                 "company": job["company"],
#                 "match_score": parsed.get("matchScore", 0),
#                 "matched_skills": parsed.get("matchedSkills", []),
#                 "missing_skills": parsed.get("missingSkills", [])
#             })
#         except Exception as e:
#             results.append({
#                 "id": job["id"],
#                 "title": job["title"],
#                 "company": job["company"],
#                 "match_score": 0,
#                 "matched_skills": [],
#                 "missing_skills": [],
#                 "error": str(e)
#             })

#     return sorted(results, key=lambda x: x["match_score"], reverse=True)[:10]


# @app.post("/job-action")
# def job_action_get_user_id(authorization: str = Header(...)) -> str:
#     token = authorization.replace("Bearer ", "")
#     secret = os.environ["SUPABASE_JWT_SECRET"]
#     try:
#         payload = jwt.decode(token, secret, algorithms=["HS256"])
#         return payload["sub"]
#     except JWTError:
#         raise HTTPException(status_code=401, detail="Invalid auth token")
    
# @app.get("/")
# def read_root():
#     return {
#         "message": "Hello, FastAPI!",
#         "skills_loaded": {
#             "flat": len(SKILLS["flat"]),
#             "combined": len(SKILLS["combined_flat"]),
#             "matrix_categories": len(SKILLS["matrix"])
#         }
#     }

# @app.get("/health")
# def health():
#     return {"status": "ok"}
# class SendResumeRequest(BaseModel):
#     resume_text: str
#     job_ids: List[str]
#     user_id: str
#     user_email: str
#     resume_id: str
# logging.basicConfig(level=logging.INFO)
# logger = logging.getLogger(__name__)

# # @app.post("/send-resume-to-job")
# # def send_resume(payload: SendResumeRequest):
# #     # 🔍 Fetch job data
# #     jobs_response = supabase.table("jobs") \
# #         .select("id", "title", "company", "email") \
# #         .in_("id", payload.job_ids).execute()

# #     jobs = jobs_response.data or []
# #     submitted_jobs = []

# #     for job in jobs:
# #         job_id = job["id"]
# #         title = job["title"]
# #         company = job["company"]

# #         print(f"\n📤 Sending resume to {company} for job '{title}' (ID: {job_id})")
# #         print(f"📝 Resume Preview: {payload.resume_text[:200]}...")

# #         insert_payload = {
# #             "resume_id": payload.resume_id, 
# #             "resume_text": payload.resume_text[:3000],
# #             "job_id": job_id,
# #             "job_title": title,
# #             "company": company,
# #             "user_id": payload.user_id,
# #             "user_email": payload.user_email,
# #             "submitted_at": datetime.utcnow().isoformat()
# #         }
# #         print("🔍 Insert payload:", insert_payload)

# #         supabase.table("applications").insert(insert_payload).execute()
# #         submitted_jobs.append(title)

# #     return {
# #         "status": "Resume submitted to selected jobs",
# #         "submitted_to": submitted_jobs,
# #         "job_ids": payload.job_ids,
# #         "resume_length": len(payload.resume_text),
# #         "timestamp": datetime.utcnow().isoformat()
# #     }


# class ResumeSubmission(BaseModel):
#     resume_text: str
#     job_id: str
#     job_title: str
#     company: str
#     user_email: str

# @app.post("/send-resume-to-job")
# def send_resume(payload: ResumeSubmission, user_id: str = Depends(get_current_user_id)):
#     """Submit resume to job with improved error handling"""
#     try:
#         logger.info(f"📤 Sending resume to {payload.company} for job '{payload.job_title}' (ID: {payload.job_id})")
        
#         # Validate payload
#         if not payload.resume_text or not payload.job_id:
#             raise HTTPException(status_code=400, detail="Resume text and job ID are required")
        
#         # Generate unique resume ID
#         resume_id = str(uuid.uuid4())
        
#         # Prepare insert payload with all required fields
#         insert_payload = {
#             'resume_id': resume_id,
#             'resume_text': payload.resume_text,
#             'job_id': payload.job_id,
#             'job_title': payload.job_title,
#             'company': payload.company,
#             'user_id': user_id,
#             'user_email': payload.user_email,
#             'submitted_at': datetime.utcnow().isoformat(),
#             'status': 'submitted',  # Add status field
#             'created_at': datetime.utcnow().isoformat(),
#             'updated_at': datetime.utcnow().isoformat()
#         }
        
#         logger.info(f"🔍 Insert payload: {insert_payload}")
        
#         # Insert into database with better error handling
#         try:
#             result = supabase.table("applications").insert(insert_payload).execute()
#             logger.info(f"✅ Application inserted successfully: {result.data}")
#         except Exception as db_error:
#             logger.error(f"❌ Database insert failed: {db_error}")
            
#             # Try to provide more specific error information
#             error_message = str(db_error)
#             if "row-level security" in error_message.lower():
#                 raise HTTPException(
#                     status_code=403, 
#                     detail="Database security policy violation. Please ensure you're properly authenticated."
#                 )
#             elif "violates not-null constraint" in error_message.lower():
#                 raise HTTPException(
#                     status_code=400,
#                     detail="Missing required fields in application data"
#                 )
#             else:
#                 raise HTTPException(
#                     status_code=500,
#                     detail=f"Database operation failed: {error_message}"
#                 )
        
#         # Log successful submission
#         try:
#             log_data = {
#                 "action": "resume_submitted",
#                 "user_id": user_id,
#                 "details": {
#                     "resume_id": resume_id,
#                     "job_id": payload.job_id,
#                     "job_title": payload.job_title,
#                     "company": payload.company,
#                     "resume_length": len(payload.resume_text)
#                 },
#                 "timestamp": datetime.utcnow().isoformat()
#             }
#             supabase.table("admin_logs").insert(log_data).execute()
#         except Exception as log_error:
#             logger.warning(f"Failed to log action: {log_error}")
#             # Don't fail the request if logging fails
        
#         return {
#             "status": "success",
#             "message": f"Resume successfully submitted to {payload.company}",
#             "resume_id": resume_id,
#             "job_id": payload.job_id,
#             "submitted_at": insert_payload['submitted_at']
#         }
        
#     except HTTPException:
#         raise  # Re-raise HTTP exceptions
#     except Exception as e:
#         logger.error(f"❌ Unexpected error in send_resume: {e}")
#         logger.error(f"Error type: {type(e)}")
#         import traceback
#         logger.error(f"Traceback: {traceback.format_exc()}")
#         raise HTTPException(
#             status_code=500,
#             detail=f"Internal server error: {str(e)}"
#         )
























































































