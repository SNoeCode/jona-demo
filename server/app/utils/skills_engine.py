import re
import json
from typing import Optional, List, Dict
from app.supabase.supabase_client import supabase
import os

def load_flat_skills(filepath: Optional[str] = None) -> List[str]:
    """Load flat skills list from JSON file"""
    if filepath is None:
        base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        filepath = os.path.join(base_dir, "skills.json")
    
    filepath = os.path.abspath(filepath)
    if not os.path.exists(filepath):
        raise FileNotFoundError(f"Skills file not found at: {filepath}")
    
    with open(filepath, "r", encoding="utf-8") as f:
        data = json.load(f)
        return [s.lower().strip() for s in data.get("skills", [])]

def load_skill_matrix() -> List[Dict]:
    """Load categorized skills from Supabase"""
    response = supabase.table("skill_categories").select("*").execute()
    return response.data or []

def extract_skills(description: str, skills: List[str]) -> List[str]:
    """Extract skills from description (basic matching)"""
    lowered = (description or "").lower()
    matched = {
        skill for skill in skills
        if isinstance(skill, str) and skill.lower() in lowered
    }
    return sorted(matched)

def extract_skills_by_category(description: str, skill_matrix: List[Dict]) -> Dict[str, List[str]]:
    """Extract skills organized by category"""
    matches = {}
    lowered = (description or "").lower()
    
    for section in skill_matrix:
        found = [s for s in section.get("skills", []) if s.lower() in lowered]
        if found:
            matches[section["category"]] = found
    
    return matches

def extract_flat_skills(description: str, skill_list: List[str]) -> List[str]:
    """Extract skills using word boundary matching (more accurate)"""
    if not description:
        return []
    
    lowered = description.lower()
    found = set()
    
    for skill in skill_list:
        # Use word boundaries to avoid partial matches
        pattern = r"\b" + re.escape(skill.lower()) + r"\b"
        if re.search(pattern, lowered):
            found.add(skill)
    
    return sorted(found)

def load_all_skills(frontend_skills: Optional[List[str]] = None):
    """Load all skill data structures"""
    flat = load_flat_skills()
    matrix = load_skill_matrix()
    frontend_skills = frontend_skills or []
    combined = sorted(set(flat + frontend_skills))
    
    return {
        "flat": flat,
        "matrix": matrix,
        "combined_flat": combined
    }