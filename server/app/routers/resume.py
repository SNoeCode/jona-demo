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
from app.scrapers.tek_systems import scrape_teksystems
from app.scrapers.indeed_scraper import scrape_indeed
from app.scrapers.indeed_crawler import crawl_indeed
from app.scrapers.dice_scraper import scrape_dice
from app.scrapers.career_crawler import crawl_career_builder
from app.scrapers.zip_crawler import scrape_zip_and_insert
from app.db.connect_database import supabase
from app.db.cleanup import cleanup
from app.utils.scan_for_duplicates import scan_for_duplicates
from app.utils.write_jobs import write_jobs_csv
from app.db.sync_jobs import sync_job_data_folder_to_supabase
from app.config.config_utils import get_output_folder
# from app.scraper.career_crawler import crawl_career_builder 

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


class ResumeInput(BaseModel):
    resume_text: str

class PromptResult(BaseModel):
    id: str
    title: str
    company: str
    match_score: float
    matched_skills: list[str]
    missing_skills: list[str]

router = APIRouter()
SKILLS = load_all_skills()
class SendResumeRequest(BaseModel):
    resume_text: str
    job_ids: List[str]
    user_id: str
    user_email: str
    resume_id: str

class CompareResumeRequest(BaseModel):
    resume_text: str
    job_description: str

class ResumeMatchRequest(BaseModel):
    resume_text: str
class JobDesc(BaseModel):
    text: str
# Skill extraction from job desc
@router.post("/flat-skills/extract")
def flat_skill_extract(payload: JobDesc):
    flat = extract_flat_skills(payload.text, SKILLS["flat"])
    categorized = extract_skills_by_category(payload.text, SKILLS["matrix"])
    return {
        "flat_skills": flat,
        "skills_by_category": categorized
    }

# Compare resume to one job
@router.post("/compare-resume", summary="Compare resume to a job description")
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

@router.post("/openai-match-top-jobs", response_model=list[PromptResult])
def openai_match_top_jobs(payload: ResumeInput):
    print("Received request to /openai-match-top-jobs with resume_text length:", len(payload.resume_text))
    resume = payload.resume_text
    jobs_response = supabase.table("jobs").select("id", "title", "company", "job_description").execute()
    jobs = jobs_response.data or []

    results = []
    client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

    for job in jobs:
        prompt = (
            f"Compare this resume and job description by matching skill keywords.\n\n"
            f"Resume:\n{resume}\n\nJob Description:\n{job['job_description']}\n\n"
            f"Return valid JSON like: "
            f"{{\"matchScore\": 88, \"matchedSkills\": [\"Python\", \"FastAPI\"], \"missingSkills\": [\"Docker\"]}}"
        )
        try:
            response = client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.2
            )
            output = response.choices[0].message.content or "{}"
            parsed = json.loads(output)

            results.append({
            "id": job["id"],
            "title": job["title"],
            "company": job["company"],
            "match_score": parsed.get("matchScore", 0),
            "matched_skills": parsed.get("matchedSkills", []),
            "missing_skills": parsed.get("missingSkills", [])
        })

        except Exception as e:
            print(f"⚠️ GPT parse failed for job {job['id']} →", str(e))
            results.append({
                "id": job["id"],
                "title": job["title"],
                "company": job["company"],
                "match_score": 0,
                "matched_skills": [],
                "missing_skills": [],
                "error": str(e)
            })

    return sorted(results, key=lambda x: x["match_score"], reverse=True)[:10]
