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
from app.scrapers.indeed_scraper import scrape_indeed
from app.scrapers.indeed_crawler import get_jobs_from_crawl4ai
from app.utils.write_jobs import write_jobs_csv
from app.config.config_utils import get_output_folder
SKILLS = load_all_skills()

app = FastAPI()
router = APIRouter()
from fastapi import APIRouter, Query
router = APIRouter()
@router.get("/run")


@router.get("/indeed", summary="Scrape and crawl Indeed")
def run_indeed(location: str = Query("remote"), days: int = Query(15), debug: bool = Query(False)) -> Dict:
    indeed_scraper = scrape_indeed(location, days)
    indeed_crawler = get_jobs_from_crawl4ai(location, days)
    folder = get_output_folder()
    write_jobs_csv(indeed_scraper, scraper="indeed_scraper")
    write_jobs_csv(indeed_crawler, scraper="indeed_crawler")

    return {
        "indeed_scraper": len(indeed_scraper),
        "indeed_crawler": len(indeed_crawler),

        "status": "indeed complete"
    }