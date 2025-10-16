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
from app.utils.write_jobs import write_jobs_csv
from app.scrapers.monster_scraper import scrape_monster_jobs
SKILLS = load_all_skills()
router = APIRouter()

app = FastAPI()
router = APIRouter()
from fastapi import APIRouter, Query
router = APIRouter()
@router.get("/run")

def run_monster_scraper(
    location: str = Query("remote"),
    pages: int = Query(1)
):
    jobs = scrape_monster_jobs(location=location, pages=pages)
    return {
        "total_jobs": len(jobs),
        "jobs": jobs[:10],  # limit preview
        "status": "Monster scrape complete"
    }
