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
@router.post("/openai-match-top-jobs", response_model=list[PromptResult])
def openai_match_top_jobs(payload: ResumeInput):
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

