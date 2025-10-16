from datetime import datetime
import requests
from app.db.connect_database import get_db_connection

def remove_duplicate_urls():
    """Keep only the newest inserted_at for each URL."""
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            cur.execute("""
                DELETE FROM jobs a
                USING (
                    SELECT url, MAX(inserted_at) AS latest
                    FROM jobs
                    GROUP BY url
                    HAVING COUNT(*) > 1
                ) dups
                WHERE a.url = dups.url
                  AND a.inserted_at < dups.latest;
            """)
        conn.commit()

def purge_older_than(days: int = 15):
    """Archive jobs with user data; delete unreferenced old jobs."""
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            # Archive jobs that are referenced
            cur.execute("""
                UPDATE jobs
                SET archived_at = NOW()
                WHERE date < CURRENT_DATE - INTERVAL '%s days'
                  AND id IN (SELECT job_id FROM user_job_status)
                  AND archived_at IS NULL;
            """, (days,))

            cur.execute("""
                DELETE FROM jobs
                WHERE date < CURRENT_DATE - INTERVAL '%s days'
                  AND archived_at IS NULL
                  AND id NOT IN (SELECT job_id FROM user_job_status);
            """, (days,))
        conn.commit()

def is_job_expired(url: str) -> bool:
    try:
        response = requests.get(url, timeout=10)
        html = response.text.lower()
        expired_keywords = [
            "this job has expired on indeed",
            "not accepting applications",
            "position has been filled",
            "no longer accepting applications",
            "we're sorry"
        ]
        return any(kw in html for kw in expired_keywords)
    except Exception as e:
        print(f"⚠️ Could not verify {url}: {e}")
        return True

def validate_jobs(batch_size: int = 100):
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT id, url FROM jobs
                WHERE last_verified IS NULL OR last_verified < NOW() - INTERVAL '7 days'
                LIMIT %s;
            """, (batch_size,))
            jobs = cur.fetchall()

            for job_id, url in jobs:
                if is_job_expired(url):
                    cur.execute("""
                        SELECT 1 FROM user_job_status WHERE job_id = %s LIMIT 1;
                    """, (job_id,))
                    if cur.fetchone():
                        cur.execute("""
                            UPDATE jobs SET archived_at = %s WHERE id = %s AND archived_at IS NULL;
                        """, (datetime.utcnow(), job_id))
                        print(f"📦 Archived expired job: {url}")
                    else:
                        cur.execute("DELETE FROM jobs WHERE id = %s", (job_id,))
                        print(f"🗑️ Deleted expired job: {url}")
                else:
                    cur.execute("UPDATE jobs SET last_verified = %s WHERE id = %s",
                                (datetime.utcnow(), job_id))
        conn.commit()

def cleanup(days: int = 15, validate_batch: int = 100):
    print("🧼 Running job cleanup...")
    remove_duplicate_urls()
    purge_older_than(days)
    validate_jobs(validate_batch)
    print("✅ Cleanup complete")