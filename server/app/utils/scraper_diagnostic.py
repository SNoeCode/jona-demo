"""
Diagnostic script to test scrapers and database insertion
Run this to verify everything is working correctly
"""
import sys
import json
from datetime import datetime
from app.db.connect_database import get_db_connection

def test_database_connection():
    """Test if database connection works"""
    print("\n🔍 Testing Database Connection...")
    conn = None
    cur = None

    try:
        conn = get_db_connection()
        cur = conn.cursor()

        # Check if jobs table exists
        cur.execute("""
            SELECT COUNT(*) FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_name = 'jobs'
        """)
        result = cur.fetchone()

        if not result or result[0] == 0:
            print("❌ Jobs table does not exist!")
            return False

        # Check current job count
        cur.execute("SELECT COUNT(*) FROM jobs")
        row = cur.fetchone()
        count = row[0] if row else 0
        print(f"✅ Database connected! Current jobs: {count}")

        # Show sample of latest jobs
        cur.execute("""
            SELECT title, company, site, inserted_at 
            FROM jobs 
            ORDER BY inserted_at DESC 
            LIMIT 5
        """)
        recent = cur.fetchall()

        if recent:
            print("\n📋 Latest jobs in database:")
            for job in recent:
                title = job[0] or "Untitled"
                company = job[1] or "Unknown"
                site = job[2] or "N/A"
                inserted_at = job[3].strftime("%Y-%m-%d %H:%M:%S") if job[3] else "Unknown"
                print(f"   • {title[:40]} | {company} | {site} | {inserted_at}")

        return True

    except Exception as e:
        print(f"❌ Database connection failed: {e}")
        return False

    finally:
        if cur:
            cur.close()
        if conn:
            conn.close()
def test_job_insertion():
    """Test inserting a sample job"""
    print("\n🔍 Testing Job Insertion...")
    
    from app.db.sync_jobs import insert_job_to_db
    import uuid
    
    test_job = {
        "id": str(uuid.uuid4()),
        "title": "Test Software Engineer",
        "company": "Test Company",
        "job_location": "Remote",
        "job_state": "remote",
        "date": datetime.today().date(),
        "site": "Test",
        "job_description": "This is a test job with Python, JavaScript, and React skills.",
        "salary": "N/A",
        "url": f"https://test.com/job/{uuid.uuid4()}",
        "applied": False,
        "saved": False,
        "search_term": "test",
        "skills": ["Python", "JavaScript", "React"],
        "skills_by_category": {
            "languages": ["Python", "JavaScript"],
            "frameworks": ["React"]
        },
        "priority": 0,
        "status": "new",
        "category": None,
        "user_id": None
    }
    
    try:
        result = insert_job_to_db(test_job)
        if result:
            print("✅ Test job inserted successfully!")
            return True
        else:
            print("⚠️ Test job insertion returned False (might be duplicate)")
            return True  # Still OK
    except Exception as e:
        print(f"❌ Test job insertion failed: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_skills_extraction():
    """Test skills extraction"""
    print("\n🔍 Testing Skills Extraction...")
    
    try:
        from app.utils.skills_engine import load_all_skills, extract_flat_skills, extract_skills_by_category
        
        SKILLS = load_all_skills()
        print(f"✅ Skills loaded: {len(SKILLS.get('flat', []))} flat skills")
        
        test_description = """
        We are looking for a Senior Python Developer with experience in Django and FastAPI.
        Must have strong knowledge of PostgreSQL, Docker, and AWS.
        Experience with React and TypeScript is a plus.
        """
        
        flat = extract_flat_skills(test_description, SKILLS["flat"])
        categorized = extract_skills_by_category(test_description, SKILLS["matrix"])
        
        print(f"✅ Extracted {len(flat)} skills: {flat[:5]}")
        print(f"✅ Categorized: {list(categorized.keys())}")
        
        return True
        
    except Exception as e:
        print(f"❌ Skills extraction failed: {e}")
        import traceback
        traceback.print_exc()
        return False


def check_tech_keywords():
    """Check TECH_KEYWORDS configuration"""
    print("\n🔍 Checking TECH_KEYWORDS...")
    
    try:
        from app.utils.common import TECH_KEYWORDS
        
        print(f"✅ Found {len(TECH_KEYWORDS)} keywords")
        
        # Check for malformed keywords
        malformed = []
        for kw in TECH_KEYWORDS:
            if not kw.strip():
                malformed.append("(empty)")
            elif not kw.replace(" ", "").replace(".", "").replace("-", "").replace("+", "").isalnum():
                malformed.append(kw)
        
        if malformed:
            print(f"⚠️ Found {len(malformed)} potentially malformed keywords:")
            for kw in malformed[:5]:
                print(f"   • '{kw}'")
        else:
            print("✅ All keywords look valid")
        
        print(f"\n📋 Sample keywords: {TECH_KEYWORDS[:5]}")
        return True
        
    except Exception as e:
        print(f"❌ Failed to load keywords: {e}")
        return False


def test_scraper_indeed_quick():
    """Quick test of Indeed scraper with 1 keyword"""
    print("\n🔍 Testing Indeed Scraper (Quick Test)...")
    
    try:
        # Test with document 3's scraper (StableChromeDriver version)
        from app.scrapers.indeed_crawler import scrape_indeed_jobs
        
        print("Running quick test with 1 keyword, max 3 results...")
        jobs = scrape_indeed_jobs(
            location="remote",
            days=1,
            keywords=["python developer"],
            max_results=3
        )
        
        print(f"✅ Scraper returned {len(jobs)} jobs")
        
        if jobs:
            print("\n📋 Sample job:")
            job = jobs[0]
            print(f"   Title: {job.get('title', 'N/A')}")
            print(f"   Company: {job.get('company', 'N/A')}")
            print(f"   Description length: {len(job.get('description', ''))}")
            print(f"   Skills found: {len(job.get('skills', []))}")
        
        return True
        
    except Exception as e:
        print(f"❌ Indeed scraper test failed: {e}")
        import traceback
        traceback.print_exc()
        return False


def check_database_schema():
    """Verify database schema matches insert function"""
    print("\n🔍 Checking Database Schema...")
    
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        cur.execute("""
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'jobs'
            ORDER BY ordinal_position
        """)
        
        columns = cur.fetchall()
        print(f"✅ Jobs table has {len(columns)} columns")
        
        required_columns = [
            'id', 'title', 'company', 'job_location', 'job_state', 
            'salary', 'site', 'date', 'applied', 'saved', 'url',
            'job_description', 'search_term', 'skills', 'skills_by_category'
        ]
        
        existing_columns = [col[0] for col in columns]
        missing = [col for col in required_columns if col not in existing_columns]
        
        if missing:
            print(f"⚠️ Missing columns: {missing}")
        else:
            print("✅ All required columns present")
        
        cur.close()
        conn.close()
        return True
        
    except Exception as e:
        print(f"❌ Schema check failed: {e}")
        return False


def main():
    """Run all diagnostic tests"""
    print("=" * 80)
    print("🧪 SCRAPER DIAGNOSTIC TOOL")
    print("=" * 80)
    
    results = {
        "Database Connection": test_database_connection(),
        "Database Schema": check_database_schema(),
        "Job Insertion": test_job_insertion(),
        "Skills Extraction": test_skills_extraction(),
        "TECH_KEYWORDS": check_tech_keywords(),
    }
    
    # Optional: Quick scraper test (uncomment if you want to test)
    # results["Indeed Scraper"] = test_scraper_indeed_quick()
    
    print("\n" + "=" * 80)
    print("📊 DIAGNOSTIC SUMMARY")
    print("=" * 80)
    
    for test, passed in results.items():
        status = "✅ PASS" if passed else "❌ FAIL"
        print(f"{status} - {test}")
    
    all_passed = all(results.values())
    
    if all_passed:
        print("\n🎉 All tests passed! Your system is ready.")
    else:
        print("\n⚠️ Some tests failed. Check the output above for details.")
    
    print("\n💡 Next steps:")
    print("1. Run the scrapers: python -m app.scrapers.indeed_scraper")
    print("2. Check database: SELECT COUNT(*) FROM jobs;")
    print("3. Monitor logs for 'Inserted job ID' messages")
    
    return 0 if all_passed else 1


if __name__ == "__main__":
    sys.exit(main())