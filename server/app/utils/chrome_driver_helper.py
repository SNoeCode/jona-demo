# app/utils/chrome_driver_helper.py
"""
Universal Chrome/ChromeDriver helper for stable scraping on Windows
Handles common issues: crashes, hangs, memory leaks
"""

from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.common.exceptions import WebDriverException
from webdriver_manager.chrome import ChromeDriverManager
import logging
import os
import subprocess
import psutil

logger = logging.getLogger(__name__)


def kill_zombie_chrome_processes():
    """Kill any zombie Chrome/ChromeDriver processes"""
    killed = 0
    for proc in psutil.process_iter(['pid', 'name']):
        try:
            name = proc.info['name'].lower()
            if 'chrome' in name or 'chromedriver' in name:
                # Don't kill if it's the main Chrome browser user is actively using
                if 'type=utility' in ' '.join(proc.cmdline()):
                    continue
                    
                proc.kill()
                killed += 1
                logger.info(f"Killed zombie process: {proc.info['name']} (PID: {proc.info['pid']})")
        except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
            pass
    
    if killed > 0:
        logger.info(f"Cleaned up {killed} zombie Chrome processes")
    
    return killed


def create_stable_chrome_driver(headless: bool = True, timeout: int = 30):
    """
    Create a Chrome driver with maximum stability for Windows
    
    Args:
        headless: Run in headless mode
        timeout: Page load timeout in seconds
    
    Returns:
        WebDriver instance
    """
    # Clean up any existing zombie processes first
    try:
        kill_zombie_chrome_processes()
    except Exception as e:
        logger.warning(f"Could not clean zombie processes: {e}")
    
    chrome_options = Options()
    
    # === CRITICAL STABILITY OPTIONS FOR WINDOWS ===
    
    # Headless mode
    if headless:
        chrome_options.add_argument("--headless=new")  # Use new headless mode
    
    # Disable GPU (common crash cause on Windows)
    chrome_options.add_argument("--disable-gpu")
    chrome_options.add_argument("--disable-software-rasterizer")
    
    # Sandbox and shared memory (Windows stability)
    chrome_options.add_argument("--no-sandbox")
    chrome_options.add_argument("--disable-dev-shm-usage")
    
    # Disable unnecessary features
    chrome_options.add_argument("--disable-extensions")
    chrome_options.add_argument("--disable-plugins")
    chrome_options.add_argument("--disable-images")  # Faster, less memory
    chrome_options.add_argument("--blink-settings=imagesEnabled=false")
    
    # Memory management
    chrome_options.add_argument("--disable-dev-tools")
    chrome_options.add_argument("--disable-browser-side-navigation")
    chrome_options.add_argument("--disable-infobars")
    chrome_options.add_argument("--disable-notifications")
    chrome_options.add_argument("--disable-popup-blocking")
    
    # Window size (helps with rendering)
    chrome_options.add_argument("--window-size=1920,1080")
    chrome_options.add_argument("--start-maximized")
    
    # User agent (avoid detection)
    chrome_options.add_argument(
        "user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/120.0.0.0 Safari/537.36"
    )
    
    # Disable automation flags
    chrome_options.add_experimental_option("excludeSwitches", ["enable-automation"])
    chrome_options.add_experimental_option("useAutomationExtension", False)
    chrome_options.add_argument("--disable-blink-features=AutomationControlled")
    
    # Logging (reduce noise)
    chrome_options.add_argument("--log-level=3")
    chrome_options.add_argument("--silent")
    chrome_options.add_experimental_option("excludeSwitches", ["enable-logging"])
    
    # Page load strategy (normal is most stable)
    chrome_options.page_load_strategy = 'normal'
    
    # Disable crash reporting
    chrome_options.add_argument("--disable-crash-reporter")
    chrome_options.add_argument("--disable-in-process-stack-traces")
    
    # Prefs to disable features
    prefs = {
        "profile.default_content_setting_values.notifications": 2,
        "profile.default_content_setting_values.media_stream": 2,
        "profile.managed_default_content_settings.images": 2,  # Disable images
    }
    chrome_options.add_experimental_option("prefs", prefs)
    
    try:
        # Install/get ChromeDriver
        logger.info("Installing/locating ChromeDriver...")
        driver_path = ChromeDriverManager().install()
        logger.info(f"ChromeDriver located at: {driver_path}")
        
        # Create service with reduced logging
        service = Service(
            driver_path,
            log_path=os.devnull,  # Suppress logs
        )
        
        # Create driver
        logger.info("Creating Chrome WebDriver...")
        driver = webdriver.Chrome(service=service, options=chrome_options)
        
        # Set timeouts
        driver.set_page_load_timeout(timeout)
        driver.set_script_timeout(timeout)
        driver.implicitly_wait(10)
        
        logger.info("✅ Chrome WebDriver created successfully")
        return driver
        
    except Exception as e:
        logger.error(f"Failed to create Chrome driver: {e}")
        raise


def safe_quit_driver(driver):
    """Safely quit driver and clean up processes"""
    if driver is None:
        return
    
    try:
        # Try normal quit first
        driver.quit()
        logger.info("Driver quit normally")
    except Exception as e:
        logger.warning(f"Error during driver.quit(): {e}")
        
        try:
            # Force kill the process
            if hasattr(driver, 'service') and hasattr(driver.service, 'process'):
                driver.service.process.kill()
                logger.info("Force killed driver process")
        except Exception as e2:
            logger.warning(f"Could not force kill driver: {e2}")
    
    # Clean up any remaining zombie processes
    try:
        kill_zombie_chrome_processes()
    except Exception as e:
        logger.warning(f"Could not clean zombie processes after quit: {e}")


class StableChromeDriver:
    """Context manager for stable Chrome driver usage"""
    
    def __init__(self, headless: bool = True, timeout: int = 30):
        self.headless = headless
        self.timeout = timeout
        self.driver = None
    
    def __enter__(self):
        self.driver = create_stable_chrome_driver(self.headless, self.timeout)
        return self.driver
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        safe_quit_driver(self.driver)
        return False  # Don't suppress exceptions


# Usage example:
"""
from app.utils.chrome_driver_helper import StableChromeDriver

# Using context manager (recommended)
with StableChromeDriver(headless=True) as driver:
    driver.get("https://example.com")
    # ... do scraping ...
    # driver automatically cleaned up

# Or manual usage:
from app.utils.chrome_driver_helper import create_stable_chrome_driver, safe_quit_driver

driver = None
try:
    driver = create_stable_chrome_driver()
    driver.get("https://example.com")
    # ... do scraping ...
finally:
    safe_quit_driver(driver)
"""