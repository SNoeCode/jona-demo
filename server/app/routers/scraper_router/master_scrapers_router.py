from fastapi import APIRouter

# Import individual scraper routers
from app.routers.scraper_router.tek_systems_route import router as teksystems_router
from app.routers.scraper_router.dice_route import router as dice_router
from app.routers.scraper_router.indeed_route import router as indeed_router
from app.routers.scraper_router.zip_route import router as zip_router
from app.routers.scraper_router.career_crawler_route import router as career_crawler_router
from app.routers.scraper_router.monster_route import router as monster_router
from app.routers.scraper_router.monster_playwright_route import router as monster_playwright_router
from app.routers.scraper_router.zip_playwright_route import router as zip_playwright_router
from app.routers.scraper_router.snagajob_playwright_route import router as snagajob_playwright_router


router = APIRouter()

# Include each scraper with its own prefix and tag
router.include_router(teksystems_router, prefix="/teksystems", tags=["teksystems"])
router.include_router(dice_router, prefix="/dice", tags=["dice"])
router.include_router(indeed_router, prefix="/indeed", tags=["indeed"])
router.include_router(zip_router, prefix="/zip", tags=["zip"])
router.include_router(career_crawler_router, prefix="/careerbuilder", tags=["careerbuilder"])
router.include_router(monster_router, prefix="/monster", tags=["monster"])
router.include_router(monster_playwright_router, prefix="/monster-playwright", tags=["monster-playwright"])
router.include_router(zip_playwright_router, prefix="/zip-playwright", tags=["zip-playwright"])
router.include_router(snagajob_playwright_router, prefix="/snag-playwright", tags=["snag-playwright"])


# from pydantic import BaseModel
# from typing import List, Dict
# from typing import Any
# from fastapi import FastAPI, Query, HTTPException, Header, File, UploadFile, Request, APIRouter
# from datetime import datetime
# import os
# from jose import jwt, JWTError
# from app.utils.skills_engine import (
#     load_all_skills,
#     extract_flat_skills,
#     extract_skills,
#     extract_skills_by_category
# )
# from app.routers.scrapers.tek_systems_route import scrape_teksystems
# from app.scrapers.indeed_scraper import scrape_indeed
# from app.scrapers.indeed_crawler import get_jobs_from_crawl4ai
# from app.scrapers.dice_scraper import scrape_dice
# # from app.scrapers.career_crawler import crawl_career_builder 
# from app.scrapers.career_crawler import crawl_career_builder

# from app.scrapers.zip_crawler import scrape_zip_and_insert
# from app.db.connect_database import supabase
# from app.db.cleanup import cleanup
# from app.utils.scan_for_duplicates import scan_for_duplicates
# from app.utils.write_jobs import write_jobs_csv
# from app.db.sync_jobs import sync_job_data_folder_to_supabase
# from app.config.config_utils import get_output_folder
# from app.scrapers.career_crawler import crawl_career_builder
# router = APIRouter()
# # Initialize FastAPI app
# app = FastAPI()
# router = APIRouter()
# SKILLS = load_all_skills()
# @app.get("/indeed", summary="Scrape and crawl Indeed")
# def run_indeed(location: str = Query("remote"), days: int = Query(15), debug: bool = Query(False)) -> Dict:
#     indeed_scraper = scrape_indeed(location, days)
#     indeed_crawler = get_jobs_from_crawl4ai(location, days)
#     folder = get_output_folder()
#     write_jobs_csv(indeed_scraper, scraper="indeed_scraper")
#     write_jobs_csv(indeed_crawler, scraper="indeed_crawler")

#     return {
#         "indeed_scraper": len(indeed_scraper),
#         "indeed_crawler": len(indeed_crawler),

#         "status": "indeed complete"
#     }
# @app.get("/careerbuilder", summary="Scrape and crawl CareerBuilder")
# def run_careerbuilder(location: str = Query("remote"), days: int = Query(15), debug: bool = Query(False)) -> Dict:
#     # career_builder = scrape_career_builder(location)
#     career_builder_crawler = crawl_career_builder(location)

#     # write_jobs_csv(career_builder, scraper="career_builder_scraper")
#     write_jobs_csv(career_builder_crawler, scraper="career_builder_crawler")

#     return {
#         # "career_builder_scraper": len(career_builder),
#         "career_builder_crawler": len(career_builder_crawler),

#         "status": "careerbuilder complete"
#     }
# @app.get("/dice", summary="Scrape Dice")
# def run_dice(location: str = Query("remote"), days: int = Query(15)) -> Dict:
#     dice_jobs = scrape_dice(location, days)
#     write_jobs_csv(dice_jobs, scraper="dice_scraper")
#     return {
#         "dice_scraper": len(dice_jobs),
#         "status": "Dice complete"
#     }

# @app.get("/zip", summary="Scrape ZipRecruiter and insert to DB")
# def run_zip(location: str = Query("remote"), days: int = Query(15)) -> Dict:
#     zip_jobs = scrape_zip_and_insert(location, days)  # returns a list of job dicts
#     return {
#         "zip_scraper": len(zip_jobs),
#         "status": "ZipRecruiter inserted to DB"
#     }

# @app.get("/teksystems", summary="Scrape TekSystems jobs")
# def run_teksystems(location: str = Query("remote"), days: int = Query(15)) -> Dict:
#     teksystems_jobs = scrape_teksystems(location=location, days=days)
    
#     # Enrich scraped jobs with skill extraction
#     for job in teksystems_jobs:
#         text = f"{job.get('title', '')} {job.get('job_description', '')}"
#         job["flat_skills"] = extract_flat_skills(text, SKILLS["flat"])
#         job["skills_by_category"] = extract_skills_by_category(text, SKILLS["matrix"])
#         job["skills"] = job["flat_skills"]

#     write_jobs_csv(teksystems_jobs, scraper="teksystems_scraper")
#     return {
#         "teksystems_scraper": len(teksystems_jobs),
#         "status": "TekSystems complete"
#     }

# @app.get("/all", summary="Run scrapers, enrich skills, cleanup, and Supabase sync")
# def run_all(
#     location: str = Query("remote"),
#     days: int = Query(15),
#     debug: bool = Query(False),
#     secret: str = Query(...)
# ) -> Dict:
#     if secret != os.getenv("SCRAPER_SECRET_TOKEN"):
#         raise HTTPException(status_code=401, detail="Unauthorized: Invalid token")

#     # Scrape and crawl
#     indeed_scraper = scrape_indeed(location, days)
#     indeed_crawler = scrape_indeed(location, days)
#     # career_builder_scraper = crawl_career_builder(location)
#     career_builder_crawler = crawl_career_builder(location)
#     dice_scraper = scrape_dice(location, days)
#     zip_jobs = scrape_zip_and_insert(location, days)
#     teksystems_jobs = scrape_teksystems(location=location, days=days)  # ✅ Add TekSystems

#     # Combine for enrichment
#     all_jobs = [
#         indeed_scraper, indeed_crawler,
#         # career_builder_scraper, 
#         career_builder_crawler,
#         dice_scraper, zip_jobs, teksystems_jobs  
#     ]

#     for job_list in all_jobs:
#         for job in job_list:
#             text = f"{job.get('title', '')} {job.get('job_description', '')}"
#             job["flat_skills"] = extract_flat_skills(text, SKILLS["flat"])
#             job["skills_by_category"] = extract_skills_by_category(text, SKILLS["matrix"])
#             job["skills"] = job["flat_skills"]

#     # Save to CSVs
#     write_jobs_csv(indeed_scraper, scraper="indeed_scraper")
#     write_jobs_csv(indeed_crawler, scraper="indeed_crawler")
#     # write_jobs_csv(career_builder_scraper, scraper="career_builder_scraper")
#     write_jobs_csv(career_builder_crawler, scraper="career_builder_crawler")
#     write_jobs_csv(dice_scraper, scraper="dice_scraper")
#     write_jobs_csv(zip_jobs, scraper="zip_scraper")
#     write_jobs_csv(teksystems_jobs, scraper="teksystems_scraper")  # ✅ Save TekSystems jobs

#     # Clean & sync
#     cleanup(days)
#     scan_for_duplicates()
#     sync_job_data_folder_to_supabase(folder="server/job_data")

#     return {
#         "indeed_scraper": len(indeed_scraper),
#         "indeed_crawler": len(indeed_crawler),
#         # "career_builder_scraper": len(career_builder_scraper),
#         "career_builder_crawler": len(career_builder_crawler),
#         "zip_scraper": len(zip_jobs),
#         "teksystems_scraper": len(teksystems_jobs),  # ✅ Add to final status
#         "status": "All jobs scraped, enriched, deduped, and synced to Supabase"
#     }
# # @app.get("/")