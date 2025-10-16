from pathlib import Path
from datetime import datetime
import csv
from app.config.config_utils import get_output_folder

def write_jobs_csv(jobs: list, folder_name: str = None, label: str = "jobs"):
    if not jobs:
        print("⚠️ No jobs to write.")
        return

    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    filename = f"{timestamp}_{label}.csv"

    # Use custom folder if provided, else default
    target_folder = Path(folder_name) if folder_name else Path(get_output_folder())
    target_folder.mkdir(parents=True, exist_ok=True)

    filepath = target_folder / filename
    with open(filepath, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=list(jobs[0].keys()))
        writer.writeheader()
        writer.writerows(jobs)

    print(f"📁 CSV saved to {filepath}")