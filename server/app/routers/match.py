# from fastapi import APIRouter, HTTPException
# from pydantic import BaseModel
# from openai import OpenAI
# from typing import List
# import os, json

# from app.db.connect_database import supabase
# from app.utils.skills_engine import (
#     load_all_skills,
#     extract_skills,
#     extract_flat_skills,
#     extract_skills_by_category
# )

# router = APIRouter()
# SKILLS = load_all_skills()

# # 🚀 Request Models
# class ResumeMatchRequest(BaseModel):
#     resume_text: str

# class CompareResumeRequest(BaseModel):
#     resume_text: str
#     job_description: str

# class ResumeInput(BaseModel):
#     resume_text: str

# class JobDesc(BaseModel):
#     text: str

# class SendResumeRequest(BaseModel):
#     resume_text: str
#     job_ids: List[str]
#     user_id: str
#     user_email: str
#     resume_id: str
# class PromptResult(BaseModel):
#     id: str
#     title: str
#     company: str
#     match_score: float
#     matched_skills: list[str]
#     missing_skills: list[str]

# # 🧠 Extract skills from text
# @router.post("/flat-skills/extract")
# def flat_skill_extract(payload: JobDesc):
#     flat = extract_flat_skills(payload.text, SKILLS["flat"])
#     categorized = extract_skills_by_category(payload.text, SKILLS["matrix"])
#     return {
#         "flat_skills": flat,
#         "skills_by_category": categorized
#     }

# # ⚖️ Compare resume to one job
# @router.post("/compare-resume")
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

# # 🔍 Compare resume to all jobs with extracted job skills
# @router.post("/match-top-jobs")
# def match_top_jobs(payload: ResumeMatchRequest):
#     resume_skills = extract_skills(payload.resume_text, SKILLS["combined_flat"])
#     jobs_response = supabase.table("jobs").select("id", "title", "company", "job_description").execute()
#     jobs = jobs_response.data or []

#     scored_jobs = []
#     for job in jobs:
#         job_text = job.get("job_description", "")
#         job_skills = extract_skills(job_text, SKILLS["combined_flat"])

#         overlap = set(resume_skills) & set(job_skills)
#         missing = sorted(set(job_skills) - set(resume_skills))
#         score = len(overlap)

#         scored_jobs.append({
#             "id": job["id"],
#             "title": job["title"],
#             "company": job["company"],
#             "match_score": score,
#             "matched_skills": sorted(overlap),
#             "missing_skills": missing,
#             "job_skills": sorted(job_skills),
#             "resume_skills": sorted(resume_skills),
#             "job_description": job_text
#         })

#     return sorted(scored_jobs, key=lambda x: x["match_score"], reverse=True)[:10]

# # 🤖 GPT-powered comparison
# @router.post("/openai-match-top-jobs", response_model=list[PromptResult])
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
#             f"Return valid JSON like: "
#             f"{{\"matchScore\": 88, \"matchedSkills\": [\"Python\", \"FastAPI\"], \"missingSkills\": [\"Docker\"]}}"
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
#             "id": job["id"],
#             "title": job["title"],
#             "company": job["company"],
#             "match_score": parsed.get("matchScore", 0),
#             "matched_skills": parsed.get("matchedSkills", []),
#             "missing_skills": parsed.get("missingSkills", [])
#         })

#         except Exception as e:
#             print(f"⚠️ GPT parse failed for job {job['id']} →", str(e))
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


# from fastapi import APIRouter
# from pydantic import BaseModel
# from openai import OpenAI
# import os, json

# from app.db.connect_database import supabase
# from app.utils.skills_engine import extract_skills, load_all_skills

# router = APIRouter()
# SKILLS = load_all_skills()

# # 🔹 Request schemas
# class ResumeMatchRequest(BaseModel):
#     resume_text: str

# class CompareResumeRequest(BaseModel):
#     resume_text: str
#     job_description: str

# class ResumeInput(BaseModel):
#     resume_text: str

# # 🧮 Native skill matcher
# @router.post("/match-top-jobs", summary="Match resume using native keyword engine")
# def match_top_jobs(payload: ResumeMatchRequest):
#     resume_skills = extract_skills(payload.resume_text, SKILLS["combined_flat"])
#     jobs_response = supabase.table("jobs").select(
#         "id", "title", "company", "skills", "job_description"
#     ).execute()
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

#     return sorted(scored_jobs, key=lambda x: x["match_score"], reverse=True)[:10]

# # ⚖️ Compare resume against one job
# @router.post("/compare-resume", summary="Compare resume to a job description")
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

# # 🤖 GPT matcher
# @router.post("/openai-match-top-jobs", summary="Match resume using OpenAI GPT")
# def openai_match_top_jobs(payload: ResumeInput):
#     resume = payload.resume_text
#     jobs_response = supabase.table("jobs").select(
#         "id", "title", "company", "job_description"
#     ).execute()
#     jobs = jobs_response.data or []

#     results = []
#     client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

#     for job in jobs:
#         prompt = (
#             f"Compare this resume and job description by matching skill keywords.\n\n"
#             f"Resume:\n{resume}\n\nJob Description:\n{job['job_description']}\n\n"
#             f"Return valid JSON like: "
#             f"{{\"matchScore\": 85, \"matchedSkills\": [\"Python\"], \"missingSkills\": [\"Docker\"]}}"
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
#             print(f"⚠️ GPT failed for job {job['id']}: {str(e)}")
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


# from pydantic import BaseModel
# from typing import List, Dict
# from fastapi import FastAPI, Query, HTTPException, Header, File, UploadFile,Request, APIRouter
# from datetime import datetime
# import os
# from jose import jwt, JWTError
# from app.utils.skills_engine import (
#     load_all_skills,
#     extract_flat_skills,
#     extract_skills,
#     extract_skills_by_category
# )
# from app.scraper.tek_systems import scrape_teksystems
# from app.scraper.indeed_scraper import scrape_indeed
# from app.scraper.indeed_crawler import crawl_indeed
# from app.scraper.dice_scraper import scrape_dice
# from app.scraper.career_builder_crawler import crawl_career_builder 
# from app.scraper.zip_crawler import scrape_zip_and_insert
# from app.db.connect_database import supabase
# from app.db.cleanup import cleanup
# from app.utils.scan_for_duplicates import scan_for_duplicates
# from app.utils.write_jobs import write_jobs_csv
# from app.db.sync_jobs import sync_job_data_folder_to_supabase
# from app.config.config_utils import get_output_folder
# from app.scraper.career_builder_scraper import scrape_career_builder
# from openai import OpenAI
# import json
# router = APIRouter()

# SKILLS = load_all_skills()
# class JobDesc(BaseModel):
#     text: str

# class CompareResumeRequest(BaseModel):
#     resume_text: str
#     job_description: str

# class ResumeMatchRequest(BaseModel):
#     resume_text: str

# # Compare resume to all jobs
# @router.post("/compare-resume", summary="Compare resume to a job description")
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

# # Compare resume to all jobs
# @router.post("/match-top-jobs")
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
# @router.post("/openai-match-top-jobs", summary="Match resume using OpenAI GPT")
# def openai_match_top_jobs(payload: ResumeInput):
#     resume = payload.resume_text
#     jobs_response = supabase.table("jobs").select(
#         "id", "title", "company", "job_description"
#     ).execute()
#     jobs = jobs_response.data or []

#     results = []
#     client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

#     for job in jobs:
#         prompt = (
#             f"Compare this resume and job description by matching skill keywords.\n\n"
#             f"Resume:\n{resume}\n\nJob Description:\n{job['job_description']}\n\n"
#             f"Return valid JSON like: "
#             f"{{\"matchScore\": 85, \"matchedSkills\": [\"Python\", \"API\"], \"missingSkills\": [\"Docker\"]}}"
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
#             print(f"⚠️ GPT failed for job {job['id']}: {str(e)}")
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

