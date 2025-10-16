from fastapi import APIRouter, Query
from app.scrapers.monster_playwright import scrape_monster_jobs
from app.utils.common import LOCATION, PAGES_PER_KEYWORD

router = APIRouter()

@router.get("/run", summary="Scrape Monster jobs using Playwright")
def run_monster_playwright(
    location: str = Query(LOCATION),
    pages: int = Query(PAGES_PER_KEYWORD)
):
    jobs = scrape_monster_jobs(location=location, pages=pages)
    return {
        "total_jobs": len(jobs),
        "status": "Monster Playwright scrape complete"
    }