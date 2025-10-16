import json
import traceback
import csv
from pathlib import Path
from app.db.connect_database import get_db_connection
import uuid
from datetime import datetime

def sync_job_data_folder_to_supabase(folder="server/job_data"):
    csv_files = Path(folder).glob("*.csv")
    total, inserted = 0, 0

    for file in csv_files:
        with open(file, newline="", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                total += 1
                job = {
                    "title": row["title"],
                    "company": row["company"],
                    "job_location": row["job_location"],
                    "job_state": row["job_state"],
                    "date": row["date"],
                    "site": row["site"],
                    "job_description": row["job_description"],
                    "salary": row["salary"],
                    "url": row["url"],
                    "applied": row.get("applied", "False") in ("True", "true", True),
                    "saved": row.get("saved", "False") in ("True", "true", True),
                    "search_term": row.get("search_term", ""),
                    "category": row.get("category"),
                    "priority": row.get("priority"),
                    "status": row.get("status"),
                    "inserted_at": row.get("inserted_at"),
                    "last_verified": row.get("last_verified"),
                    "skills": json.loads(row.get("skills", "[]")),
                    "skills_by_category": json.loads(row.get("skills_by_category", "{}")),
                    "user_id": None
                }
                insert_job_to_db(job)
                inserted += 1

    print(f"🗂️ Synced {inserted} of {total} job rows to Supabase.")

def insert_job_to_db(job: dict):
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("""
            INSERT INTO jobs (
                id, title, company, job_location, job_state, salary, site,
                date, applied, saved, url, job_description, search_term,
                category, priority, status, inserted_at, last_verified,
                skills, skills_by_category, user_id
            ) VALUES (
                %s, %s, %s, %s, %s, %s, %s,
                %s, %s, %s, %s, %s, %s,
                %s, %s, %s, %s, %s,
                %s, %s, %s
            )
            ON CONFLICT (url) DO NOTHING
        """, (
            str(uuid.uuid4()),
            job["title"],
            job.get("company"),
            job.get("job_location"),
            job.get("job_state"),
            job.get("salary", "N/A"),
            job["site"],
            job["date"],
            job.get("applied", False),
            job.get("saved", False),
            job["url"],
            job.get("job_description", ""),
            job.get("search_term"),
            job.get("category"),
            job.get("priority"),
            job.get("status"),
            job.get("inserted_at") or datetime.utcnow(),
            job.get("last_verified"),
            json.dumps(job.get("skills") or []),
            json.dumps(job.get("skills_by_category") or {}),
            job.get("user_id") or None
        ))
        print("➡️ Inserting job:", job["title"][:50], job["date"])
        conn.commit()
    except Exception as e:
        print("❌ DB insert error:", e)
        traceback.print_exc()
    finally:
        cur.close()
        conn.close()


def insert_resume_comparison(data: dict):
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("""
            INSERT INTO resume_comparisons (
                id, user_id, job_id, resume_text,
                matched_skills, missing_skills, match_score, compared_at
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        """, (
            str(uuid.uuid4()),
            data["user_id"],
            data.get("job_id"),
            data["resume_text"],
            json.dumps(data["matched_skills"]),
            json.dumps(data["missing_skills"]),
            data["match_score"],
            datetime.utcnow()
        ))
        conn.commit()
    except Exception as e:
        print("❌ Failed to insert resume comparison:", e)
        traceback.print_exc()
    finally:
        cur.close()
        conn.close()