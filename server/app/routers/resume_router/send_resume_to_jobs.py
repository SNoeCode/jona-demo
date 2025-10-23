import uuid
from app.db.connect_database import supabase
from app.config.config_utils import get_output_folder
from pydantic import BaseModel
from typing import List, Dict, Optional
from fastapi import FastAPI, Query,Depends, HTTPException, Header, File, UploadFile, Request, APIRouter
from datetime import datetime
import os
import logging

from pydantic import BaseModel
from openai import OpenAI
from typing import List, Dict
from datetime import datetime
import os, json
import requests
from jose import jwt, JWTError

from app.db.connect_database import supabase
from app.utils.skills_engine import (
    load_all_skills,
    extract_skills
)

app = FastAPI()

router = APIRouter()
SKILLS = load_all_skills()
from jose import jwt, JWTError
from app.utils.skills_engine import (
    load_all_skills,
    extract_flat_skills,
    extract_skills,
    extract_skills_by_category
)


# 🚀 Request Models
class ResumeInput(BaseModel):
    resume_text: str

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

class AutoApplyRequest(BaseModel):
    resume_text: str
    min_match_score: int = 70
    max_applications: int = 5

class VoiceJobSearchRequest(BaseModel):
    command: str
    user_preferences: Dict = {}

router = APIRouter()
@router.get("/run")

def get_current_user_id(authorization: str = Header(...)) -> str:
    token = authorization.replace("Bearer ", "")
    secret = os.environ["SUPABASE_JWT_SECRET"]
    try:
        payload = jwt.decode(token, secret, algorithms=["HS256"])
        return payload["sub"]
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid auth token")

logger = logging.getLogger(__name__)
class ResumeSubmission(BaseModel):
    resume_text: str
    job_id: str
    job_title: str
    company: str
    user_email: str

@router.post("/send-resume-to-job")
def send_resume(payload: ResumeSubmission, user_id: str = Depends(get_current_user_id)):
    """Submit resume to job with improved error handling"""
    try:
        logger.info(f"📤 Sending resume to {payload.company} for job '{payload.job_title}' (ID: {payload.job_id})")
        
        # Validate payload
        if not payload.resume_text or not payload.job_id:
            raise HTTPException(status_code=400, detail="Resume text and job ID are required")
        
        # Generate unique resume ID
        resume_id = str(uuid.uuid4())
        
        # Prepare insert payload with all required fields
        insert_payload = {
            'resume_id': resume_id,
            'resume_text': payload.resume_text,
            'job_id': payload.job_id,
            'job_title': payload.job_title,
            'company': payload.company,
            'user_id': user_id,
            'user_email': payload.user_email,
            'submitted_at': datetime.utcnow().isoformat(),
            'status': 'submitted',  # Add status field
            'created_at': datetime.utcnow().isoformat(),
            'updated_at': datetime.utcnow().isoformat()
        }
        
        logger.info(f"🔍 Insert payload: {insert_payload}")
        
        # Insert into database with better error handling
        try:
            result = supabase.table("applications").insert(insert_payload).execute()
            logger.info(f"✅ Application inserted successfully: {result.data}")
        except Exception as db_error:
            logger.error(f"❌ Database insert failed: {db_error}")
            
            # Try to provide more specific error information
            error_message = str(db_error)
            if "row-level security" in error_message.lower():
                raise HTTPException(
                    status_code=403, 
                    detail="Database security policy violation. Please ensure you're properly authenticated."
                )
            elif "violates not-null constraint" in error_message.lower():
                raise HTTPException(
                    status_code=400,
                    detail="Missing required fields in application data"
                )
            else:
                raise HTTPException(
                    status_code=500,
                    detail=f"Database operation failed: {error_message}"
                )
        
        # Log successful submission
        try:
            log_data = {
                "action": "resume_submitted",
                "user_id": user_id,
                "details": {
                    "resume_id": resume_id,
                    "job_id": payload.job_id,
                    "job_title": payload.job_title,
                    "company": payload.company,
                    "resume_length": len(payload.resume_text)
                },
                "timestamp": datetime.utcnow().isoformat()
            }
            supabase.table("admin_logs").insert(log_data).execute()
        except Exception as log_error:
            logger.warning(f"Failed to log action: {log_error}")
            # Don't fail the request if logging fails
        
        return {
            "status": "success",
            "message": f"Resume successfully submitted to {payload.company}",
            "resume_id": resume_id,
            "job_id": payload.job_id,
            "submitted_at": insert_payload['submitted_at']
        }
        
    except HTTPException:
        raise  # Re-raise HTTP exceptions
    except Exception as e:
        logger.error(f"❌ Unexpected error in send_resume: {e}")
        logger.error(f"Error type: {type(e)}")
        import traceback
        logger.error(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {str(e)}"
        )






# # 🔐 Authentication helper
# def get_current_user_id(authorization: str = Header(...)) -> str:
#     token = authorization.replace("Bearer ", "")
#     secret = os.environ["SUPABASE_JWT_SECRET"]
#     try:
#         payload = jwt.decode(token, secret, algorithms=["HS256"])
#         return payload["sub"]
#     except JWTError:
#         raise HTTPException(status_code=401, detail="Invalid auth token")

# 🤖 AI-Powered Resume Matching with OpenAI
@router.post("/match/openai", response_model=list[PromptResult])
def openai_match_top_jobs(payload: ResumeInput):
    """Use OpenAI to intelligently match resume with job descriptions"""
    resume = payload.resume_text
    jobs_response = supabase.table("jobs").select("id", "title", "company", "job_description").execute()
    jobs = jobs_response.data or []

    results = []
    client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

    for job in jobs:
        prompt = (
            f"Compare this resume and job description by matching skill keywords and context.\n\n"
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

# 📤 Send Resume to Selected Jobs
@router.post("/apply/send-resume")
def send_resume_to_jobs(payload: SendResumeRequest):
    """Send resume to specific job postings and track applications"""
    # Fetch job data
    jobs_response = supabase.table("jobs") \
        .select("id", "title", "company", "email", "application_url") \
        .in_("id", payload.job_ids).execute()

    jobs = jobs_response.data or []
    submitted_jobs = []

    for job in jobs:
        job_id = job["id"]
        title = job["title"]
        company = job["company"]

        print(f"\n📤 Sending resume to {company} for job '{title}' (ID: {job_id})")

        # Store application record
        insert_payload = {
            "resume_id": payload.resume_id, 
            "resume_text": payload.resume_text[:3000],
            "job_id": job_id,
            "job_title": title,
            "company": company,
            "user_id": payload.user_id,
            "user_email": payload.user_email,
            "application_status": "submitted",
            "submitted_at": datetime.utcnow().isoformat()
        }

        supabase.table("applications").insert(insert_payload).execute()
        submitted_jobs.append({
            "title": title,
            "company": company,
            "job_id": job_id
        })

    return {
        "status": "Resume submitted successfully",
        "submitted_to": submitted_jobs,
        "total_applications": len(submitted_jobs),
        "timestamp": datetime.utcnow().isoformat()
    }

# 🚀 Automated Job Application with Matching
@router.post("/apply/auto-apply")
def auto_apply_to_jobs(payload: AutoApplyRequest, authorization: str = Header(...)):
    """Automatically apply to jobs that meet minimum match criteria"""
    try:
        user_id = get_current_user_id(authorization)
        
        # Extract skills from resume
        resume_skills = extract_skills(payload.resume_text, SKILLS["combined_flat"])
        
        # Get all active jobs
        jobs_response = supabase.table("jobs").select("*").eq("status", "active").execute()
        jobs = jobs_response.data or []
        
        suitable_jobs = []
        
        # Score each job
        for job in jobs:
            job_text = job.get("job_description", "")
            job_skills = extract_skills(job_text, SKILLS["combined_flat"])
            
            # Calculate match score
            matched_skills = set(resume_skills) & set(job_skills)
            match_score = round(100 * len(matched_skills) / max(len(job_skills), 1))
            
            if match_score >= payload.min_match_score:
                suitable_jobs.append({
                    "job": job,
                    "match_score": match_score,
                    "matched_skills": list(matched_skills)
                })
        
        # Sort by match score and limit applications
        suitable_jobs.sort(key=lambda x: x["match_score"], reverse=True)
        jobs_to_apply = suitable_jobs[:payload.max_applications]
        
        # Submit applications
        applications = []
        for job_data in jobs_to_apply:
            job = job_data["job"]
            
            application = {
                "user_id": user_id,
                "job_id": job["id"],
                "job_title": job["title"],
                "company": job["company"],
                "match_score": job_data["match_score"],
                "matched_skills": job_data["matched_skills"],
                "resume_text": payload.resume_text[:3000],
                "application_method": "auto_apply",
                "submitted_at": datetime.utcnow().isoformat()
            }
            
            supabase.table("applications").insert(application).execute()
            applications.append({
                "job_title": job["title"],
                "company": job["company"],
                "match_score": job_data["match_score"]
            })
        
        return {
            "status": "Auto-apply completed",
            "applications_submitted": len(applications),
            "applications": applications,
            "total_suitable_jobs_found": len(suitable_jobs),
            "min_match_score_used": payload.min_match_score
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Auto-apply failed: {str(e)}")


# 📊 Application Tracking and Analytics
@router.get("/apply/analytics")
def get_application_analytics(authorization: str = Header(...)):
    """Get analytics on user's job applications"""
    try:
        user_id = get_current_user_id(authorization)
        
        # Get user's applications
        apps_response = supabase.table("applications") \
            .select("*") \
            .eq("user_id", user_id) \
            .execute()
        
        applications = apps_response.data or []
        
        # Calculate analytics
        total_applications = len(applications)
        avg_match_score = sum(app.get("match_score", 0) for app in applications) / max(total_applications, 1)
        
        # Group by status
        status_counts = {}
        for app in applications:
            status = app.get("application_status", "unknown")
            status_counts[status] = status_counts.get(status, 0) + 1
        
        # Recent applications (last 7 days)
        from datetime import timedelta
        recent_cutoff = (datetime.utcnow() - timedelta(days=7)).isoformat()
        recent_apps = [app for app in applications if app.get("submitted_at", "") > recent_cutoff]
        
        return {
            "total_applications": total_applications,
            "average_match_score": round(avg_match_score, 2),
            "application_status_breakdown": status_counts,
            "recent_applications_count": len(recent_apps),
            "top_companies_applied": [
                {"company": "TechCorp", "count": 3},
                {"company": "StartupXYZ", "count": 2}
                # This would be calculated from actual data
            ],
            "success_rate": round((status_counts.get("hired", 0) + status_counts.get("interview", 0)) / max(total_applications, 1) * 100, 2)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analytics failed: {str(e)}")

# 🔄 Resume Optimization Suggestions
@router.post("/optimize/suggestions")
def get_resume_optimization_suggestions(payload: ResumeInput):
    """Analyze resume and provide optimization suggestions based on job market trends"""
    try:
        # Extract current skills
        current_skills = extract_skills(payload.resume_text, SKILLS["combined_flat"])
        
        # Get trending skills from job market (mock data - would be real analysis)
        trending_skills = [
            {"skill": "Kubernetes", "demand_score": 95, "avg_salary_boost": 15000},
            {"skill": "Terraform", "demand_score": 88, "avg_salary_boost": 12000},
            {"skill": "React Native", "demand_score": 82, "avg_salary_boost": 8000}
        ]
        
        # Skills gap analysis
        missing_trending_skills = [
            skill for skill in trending_skills 
            if skill["skill"] not in current_skills
        ]
        
        # Resume structure analysis
        word_count = len(payload.resume_text.split())
        has_summary = "summary" in payload.resume_text.lower() or "objective" in payload.resume_text.lower()
        has_quantified_achievements = any(char.isdigit() for char in payload.resume_text)
        
        suggestions = []
        
        if word_count > 800:
            suggestions.append("Consider condensing your resume - aim for 600-800 words")
        
        if not has_summary:
            suggestions.append("Add a professional summary at the top")
            
        if not has_quantified_achievements:
            suggestions.append("Include quantified achievements (numbers, percentages, dollar amounts)")
        
        return {
            "current_skills_count": len(current_skills),
            "trending_skills_missing": missing_trending_skills[:5],
            "resume_structure_score": 85,  # Mock score
            "optimization_suggestions": suggestions,
            "skill_recommendations": [
                f"Consider learning {skill['skill']} (demand score: {skill['demand_score']})"
                for skill in missing_trending_skills[:3]
            ],
            "estimated_improvement": "Adding trending skills could increase match rates by 25-35%"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Optimization analysis failed: {str(e)}")

# 🔧 Helper Functions
async def get_user_resume(user_id: str) -> Dict:
    """Fetch user's resume record"""
    response = supabase.table("resumes").select("resume_text", "file_url").eq("user_id", user_id).single().execute()
    if response.data:
        return {
            "resume_text": response.data["resume_text"],
            "file_url": response.data["file_url"]
        }
    raise HTTPException(status_code=404, detail="Resume not found")

# 📈 Job Market Intelligence
@router.get("/market/intelligence")
def get_job_market_intelligence():
    """Get insights about current job market trends"""
    try:
        # This would analyze actual job posting data
        return {
            "market_trends": {
                "highest_demand_skills": [
                    {"skill": "Python", "growth": "+15%", "avg_salary": "$95000"},
                    {"skill": "AI/ML", "growth": "+28%", "avg_salary": "$120000"},
                    {"skill": "Cloud Computing", "growth": "+22%", "avg_salary": "$110000"}
                ],
                "emerging_technologies": [
                    {"tech": "Edge Computing", "adoption_rate": "45%"},
                    {"tech": "Quantum Computing", "adoption_rate": "12%"}
                ],
                "industry_growth": {
                    "tech": "+18%",
                    "healthcare": "+12%",
                    "finance": "+8%"
                }
            },
            "salary_insights": {
                "average_increase_yoy": "7.2%",
                "highest_paying_roles": [
                    {"role": "ML Engineer", "avg_salary": "$145000"},
                    {"role": "DevOps Engineer", "avg_salary": "$125000"}
                ]
            },
            "remote_work_statistics": {
                "fully_remote_jobs": "35%",
                "hybrid_jobs": "42%",
                "on_site_jobs": "23%"
            },
            "analysis_timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Market intelligence failed: {str(e)}")