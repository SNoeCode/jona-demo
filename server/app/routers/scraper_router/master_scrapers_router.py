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
