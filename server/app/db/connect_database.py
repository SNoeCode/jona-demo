import psycopg2
from dotenv import load_dotenv
import os
import sys
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))
from supabase import create_client

load_dotenv()
DATABASE_URL = os.getenv("SUPABASE_DATABASE")
url = os.getenv("SUPABASE_URL")
key = os.getenv("SUPABASE_ANON_KEY")

if url is None or key is None:
    raise ValueError("SUPABASE_URL and SUPABASE_ANON_KEY environment variables must be set.")

supabase = create_client(url, key)

def get_db_connection():
    conn = psycopg2.connect(DATABASE_URL, connect_timeout=10, sslmode="require")
    return conn

def load_skill_matrix():
    response = supabase.table("skill_categories").select("*").execute()
    return response.data 


def get_jobs_missing_description(site="CareerBuilder", max_rows=50):
    response = supabase.table("jobs") \
        .select("*") \
        .eq("site", site) \
        .in_("job_description", ["", None]) \
        .order("inserted_at", desc=False) \
        .limit(max_rows) \
        .execute()
    return response.data

def update_job_description(job_id, job_description, skills, skills_by_category):
    update_data = {
        "job_description": job_description,
        "skills": skills,
        "skills_by_category": skills_by_category,
        "last_verified": "now()"
    }
    supabase.table("jobs").update(update_data).eq("id", job_id).execute()

def main():
    
    try:
        conn = get_db_connection()
        print("Database connection successful.")
        conn.close()
    except Exception as e:
        print(f"Database connection failed: {e}")

if __name__ == "__main__":
    main()
