from pathlib import Path
import sys
sys.path.append(str(Path(__file__).resolve().parents[2]))
from app.db.connect_database import supabase
from app.utils.skills_engine import load_all_skills, extract_flat_skills

SKILLS = load_all_skills()

def patch_missing_skills():
    jobs_response = supabase.table("jobs").select("id", "title", "job_description", "skills").execute()
    jobs = jobs_response.data or []

    patched_count = 0
    for job in jobs:
        current_skills = job.get("skills")
        if not current_skills or len(current_skills) == 0:
            text = f"{job.get('title', '')} {job.get('job_description', '')}"
            flat = extract_flat_skills(text, SKILLS["flat"])
            print(f"⚙️ Patch {job['id']}: {len(flat)} skills → {flat}")

          
            response = supabase.table("jobs").update({ "skills": flat }).eq("id", job["id"]).execute()

        
            print(f"🔎 Supabase update for {job['id']}: {response}")
            patched_count += 1

    print(f"\n✅ Total jobs patched: {patched_count}")

if __name__ == "__main__":
    patch_missing_skills()