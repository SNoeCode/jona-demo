from pathlib import Path
import os

MODE = os.environ.get("MODE", "prod")

FOLDERS = {
    "dev": {
        "csv_output": "job_data",         
        "log_level": "DEBUG"
    },
    "prod": {
        "csv_output": "job_data",
        "log_level": "INFO"
    }
}

def get_output_folder() -> Path:
    repo_root = Path(__file__).resolve().parents[2] 
    output_path = repo_root / FOLDERS[MODE]["csv_output"]
    output_path.mkdir(parents=True, exist_ok=True)
    return output_path

def get_job_data_folder() -> Path:
    return get_output_folder()


print("📂 job_data folder resolved to:", get_job_data_folder())
