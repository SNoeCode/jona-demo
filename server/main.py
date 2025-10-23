from fastapi import FastAPI, APIRouter, Query, HTTPException, Header, File, UploadFile, Request
from fastapi.responses import RedirectResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Any
import os
import logging
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="Job Scraper & Matching API",
    description="API for job scraping, skill matching, and application management",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# ===========================
# CORS Middleware - MUST BE FIRST
# ===========================
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# ===========================
# Custom Middleware for OPTIONS
# ===========================
@app.middleware("http")
async def add_cors_headers(request: Request, call_next):
    if request.method == "OPTIONS":
        return JSONResponse(
            content={"status": "ok"},
            headers={
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "*",
                "Access-Control-Allow-Headers": "*",
                "Access-Control-Max-Age": "3600",
            }
        )
    response = await call_next(request)
    return response

# ===========================
# Global Skill Loading
# ===========================
from app.utils.skills_engine import (
    load_all_skills,
    extract_skills,
    extract_flat_skills,
    extract_skills_by_category
)

logger.info("Loading skills data...")
try:
    SKILLS = load_all_skills()
    logger.info(f"Skills loaded successfully: {len(SKILLS.get('combined_flat', []))} total skills")
except Exception as e:
    logger.error(f"Failed to load skills: {e}")
    SKILLS = {"flat": [], "combined_flat": [], "matrix": {}}

app.state.skills = SKILLS

# ===========================
# Request Models
# ===========================
class ResumeMatchRequest(BaseModel):
    resume_text: str

class CompareResumeRequest(BaseModel):
    resume_text: str
    job_description: str

class JobDesc(BaseModel):
    text: str

# ===========================
# Skill Matching Endpoints
# ===========================
@app.post("/flat-skills/extract")
def flat_skill_extract(payload: JobDesc):
    flat = extract_flat_skills(payload.text, SKILLS["flat"])
    categorized = extract_skills_by_category(payload.text, SKILLS["matrix"])
    return {
        "flat_skills": flat,
        "skills_by_category": categorized
    }

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

@app.post("/match-top-jobs")
def match_top_jobs(payload: ResumeMatchRequest):
    from app.db.connect_database import supabase
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

# ===========================
# Import Scraper Routers
# ===========================
from app.routers.scraper_router.tek_systems_route import router as teksystems_router
from app.routers.scraper_router.dice_route import router as dice_router
from app.routers.scraper_router.indeed_route import router as indeed_router
from app.routers.scraper_router.zip_route import router as zip_router
from app.routers.scraper_router.career_crawler_route import router as career_crawler_router
from app.routers.scraper_router.monster_route import router as monster_router
from app.routers.scraper_router.monster_playwright_route import router as monster_playwright_router
from app.routers.scraper_router.zip_playwright_route import router as zip_playwright_router
from app.routers.scraper_router.snagajob_playwright_route import router as snagajob_playwright_router

# ===========================
# Import Health Router
# ===========================
try:
    from app.routers.health_router import router as health_router
    logger.info("Health router imported successfully")
except ImportError as e:
    logger.error(f"Failed to import health_router: {e}")
    # Create a fallback health router if import fails
    health_router = APIRouter()
    
    @health_router.get("/health")
    async def health_check():
        return {
            "status": "healthy",
            "skills_loaded": {
                "flat": len(SKILLS.get("flat", [])),
                "combined": len(SKILLS.get("combined_flat", [])),
                "matrix_categories": len(SKILLS.get("matrix", {}))
            }
        }
    
    @health_router.get("/info")
    async def app_info():
        return {
            "message": "Job Scraper & Matching API",
            "version": "1.0.0",
            "docs": "/docs"
        }

scraper_router = APIRouter()
scraper_router.include_router(teksystems_router, prefix="/teksystems", tags=["teksystems"])
scraper_router.include_router(dice_router, prefix="/dice", tags=["dice"])
scraper_router.include_router(indeed_router, prefix="/indeed", tags=["indeed"])
scraper_router.include_router(zip_router, prefix="/zip", tags=["zip"])
scraper_router.include_router(career_crawler_router, prefix="/careerbuilder", tags=["careerbuilder"])
scraper_router.include_router(monster_router, prefix="/monster", tags=["monster"])
scraper_router.include_router(monster_playwright_router, prefix="/monster-playwright", tags=["monster-playwright"])
scraper_router.include_router(zip_playwright_router, prefix="/zip-playwright", tags=["zip-playwright"])
scraper_router.include_router(snagajob_playwright_router, prefix="/snag-playwright", tags=["snag-playwright"])


app.include_router(scraper_router, prefix="/api/scrapers")
app.include_router(health_router, prefix="/api", tags=["health"])


@app.get("/", include_in_schema=False)
def redirect_to_docs():
    return RedirectResponse(url="/docs")

@app.get("/api/health")
async def health_check_main():
    return {
        "status": "healthy",
        "skills_loaded": {
            "flat": len(SKILLS.get("flat", [])),
            "combined": len(SKILLS.get("combined_flat", [])),
            "matrix_categories": len(SKILLS.get("matrix", {}))
        },
        "environment": "development" if os.getenv("DEBUG") else "production"
    }

@app.get("/api/info")
async def app_info_main():
    return {
        "message": "Job Scraper & Matching API",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/api/health",
        "scrapers": "/api/scrapers",
        "skills_loaded": {
            "flat": len(SKILLS.get("flat", [])),
            "combined": len(SKILLS.get("combined_flat", [])),
            "matrix_categories": len(SKILLS.get("matrix", {}))
        }
    }

@app.on_event("startup")
async def startup_event():
    print("🚀 Job Scraper & Matching API is starting up...")
    print("📚 API Documentation available at: http://127.0.0.1:8000/docs")
    print("🏥 Health check available at: http://127.0.0.1:8000/api/health")
    print(f"🧠 Skills loaded: {len(SKILLS.get('combined_flat', []))} total skills")

@app.on_event("shutdown")
async def shutdown_event():
    print("👋 Job Scraper & Matching API is shutting down...")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
