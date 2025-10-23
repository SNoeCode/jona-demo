from pathlib import Path
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
import undetected_chromedriver as uc
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import os
from dotenv import load_dotenv
load_dotenv()
CHROME_BINARY_PATH = os.getenv(
    "CHROME_BINARY_PATH",
    "C:/Users/Administrator/Downloads/ChromeHeadless/chrome-win64/chrome.exe"
)
CHROMEDRIVER_PATH = os.getenv(
    "CHROMEDRIVER_PATH",
    "C:/Users/Administrator/Downloads/ChromeHeadless/chromedriver.exe"
)

def get_headless_browser():
    chrome_options = Options()
    # chrome_options.add_argument("--headless=new")
    chrome_options.add_argument("--disable-gpu")
    chrome_options.add_argument("--no-sandbox")
    chrome_options.add_argument("--window-size=1920x1080")
    chrome_options.binary_location = CHROME_BINARY_PATH

    driver_path = Path(CHROMEDRIVER_PATH)

    if not driver_path.is_file():
        raise FileNotFoundError(f"❌ ChromeDriver not found at: {driver_path}")

    service = Service(str(driver_path))
    driver = webdriver.Chrome(service=service, options=chrome_options)
    return driver

def configure_webdriver():
    options = uc.ChromeOptions()
    options.binary_location = CHROME_BINARY_PATH
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    options.add_argument("--disable-blink-features=AutomationControlled")
    options.add_argument("user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64)")

    driver = uc.Chrome(options=options, headless=True)
    driver.execute_cdp_cmd("Page.addScriptToEvaluateOnNewDocument", {
        "source": "Object.defineProperty(navigator, 'webdriver', {get: () => undefined})"
    })
    return driver

def configure_driver():
    try:
        options = uc.ChromeOptions()
        options.binary_location = CHROME_BINARY_PATH
        options.add_argument("--no-sandbox")
        options.add_argument("--disable-dev-shm-usage")
        options.add_argument("--disable-blink-features=AutomationControlled")
        options.add_argument("user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64)")

        driver = uc.Chrome(options=options, headless=True)
        driver.execute_cdp_cmd("Page.addScriptToEvaluateOnNewDocument", {
            "source": "Object.defineProperty(navigator, 'webdriver', {get: () => undefined})"
        })
        return driver
    except Exception as e:
        print(f"❌ Failed to launch undetected Chrome: {e}")
        return None