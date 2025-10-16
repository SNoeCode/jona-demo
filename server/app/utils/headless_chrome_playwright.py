from playwright.sync_api import sync_playwright
from playwright_stealth import stealth_sync
import os

HEADLESS_PATH = os.getenv("HEADLESS_PATH")
if not HEADLESS_PATH or not os.path.isfile(HEADLESS_PATH):
    raise FileNotFoundError(f"❌ HEADLESS_PATH not found: {HEADLESS_PATH}")

with sync_playwright() as p:
    browser = p.chromium.launch(
        headless=True,
        executable_path=HEADLESS_PATH
    )
    context = browser.new_context()
    page = context.new_page()
    stealth_sync(page)

    page.goto("https://www.monster.com/jobs/search?q=software+engineer&where=remote")
    input("🔐 Complete CAPTCHA and press Enter to continue...")

    print("✅ Page loaded:", page.title())
    browser.close()