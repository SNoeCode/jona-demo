import re
import json
from typing import Optional, List, Dict
from app.supabase.supabase_client import supabase
import os

def load_flat_skills(filepath: Optional[str] = None) -> List[str]:
    if filepath is None:
        base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        filepath = os.path.join(base_dir, "skills.json")  # Fixed: Added quotes
    
    filepath = os.path.abspath(filepath)
    if not os.path.exists(filepath):
        raise FileNotFoundError(f"Skills file not found at: {filepath}")  # Fixed: Proper f-string
    
    with open(filepath, "r", encoding="utf-8") as f:  # Fixed: Added quotes
        data = json.load(f)
        return [s.lower().strip() for s in data.get("skills", [])]  # Fixed: Added quotes

def load_skill_matrix() -> List[Dict]:
    response = supabase.table("skill_categories").select("*").execute()  # Fixed: Added quotes
    return response.data or []

def extract_skills(description: str, skills: List[str]) -> List[str]:
    lowered = (description or "").lower()  # Fixed: Added quotes for empty string
    matched = {
        skill for skill in skills
        if isinstance(skill, str) and skill.lower() in lowered
    }
    return sorted(matched)

def extract_skills_by_category(description: str, skill_matrix: List[Dict]) -> Dict[str, List[str]]:
    matches = {}
    lowered = (description or "").lower()  # Fixed: Added quotes for empty string
    
    for section in skill_matrix:
        found = [s for s in section.get("skills", []) if s.lower() in lowered]  # Fixed: Added quotes
        if found:
            matches[section["category"]] = found  # Fixed: Added quotes
    return matches

def extract_flat_skills(description: str, skill_list: List[str]) -> List[str]:
    if not description:  # Added validation
        return []
    
    lowered = description.lower()
    found = {
        skill for skill in skill_list
        if re.search(r"\b" + re.escape(skill) + r"\b", lowered)  # Fixed: Proper regex escaping
    }
    return sorted(found)

def load_all_skills(frontend_skills: Optional[List[str]] = None):
    flat = load_flat_skills()
    matrix = load_skill_matrix()
    frontend_skills = frontend_skills or []
    combined = sorted(set(flat + frontend_skills))
    
    return {
        "flat": flat,  # Fixed: Added quotes
        "matrix": matrix,  # Fixed: Added quotes
        "combined_flat": combined  # Fixed: Added quotes
    }
