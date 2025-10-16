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
@router.post("/flat-skills/extract")
def flat_skill_extract(payload: JobDesc):
    flat = extract_flat_skills(payload.text, SKILLS["flat"])
    categorized = extract_skills_by_category(payload.text, SKILLS["matrix"])
    return {
        "flat_skills": flat,
        "skills_by_category": categorized
    }

# ⚖️ Compare resume to one job
@router.post("/compare-resume")
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
@router.post("/match-top-jobs")
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
