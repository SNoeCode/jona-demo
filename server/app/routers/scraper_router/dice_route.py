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

from app.scrapers.dice_scraper import scrape_dice
from app.db.connect_database import supabase
from app.utils.write_jobs import write_jobs_csv
SKILLS = load_all_skills()
router = APIRouter()
# Initialize FastAPI app
app = FastAPI()
router = APIRouter()
from fastapi import APIRouter, Query
router = APIRouter()
@router.get("/run")

# @router.get("/dice", summary="Scrape Dice")
def run_dice(location: str = Query("remote"), days: int = Query(15)) -> Dict:
    dice_jobs = scrape_dice(location, days)
    write_jobs_csv(dice_jobs, scraper="dice_scraper")
    return {
        "dice_scraper": len(dice_jobs),
        "status": "Dice complete"
    }

