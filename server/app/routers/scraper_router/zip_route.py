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
from app.utils.write_jobs import write_jobs_csv

from app.scrapers.zip_crawler import scrape_zip_and_insert
SKILLS = load_all_skills()
router = APIRouter()
# Initialize FastAPI app
app = FastAPI()
router = APIRouter()
from fastapi import APIRouter, Query
router = APIRouter()
@router.get("/run")

# @router.get("/zip", summary="Scrape ZipRecruiter and insert to DB")
def run_zip(location: str = Query("remote"), days: int = Query(15)) -> Dict:
    
    zip_jobs = scrape_zip_and_insert(location, days)  # returns a list of job dicts
    write_jobs_csv(zip_jobs, scraper="zip_scraper")
    
    return {
        "zip_scraper": len(zip_jobs),
        "status": "ZipRecruiter inserted to DB"
    }