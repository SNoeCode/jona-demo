@echo off
echo Testing FastAPI Health...
curl http://127.0.0.1:8000/api/health
echo.
echo.
echo Testing FastAPI Info...
curl http://127.0.0.1:8000/api/info
echo.
echo.
echo Testing Scraper Status...
curl http://127.0.0.1:8000/api/scrapers/snag-playwright/status
