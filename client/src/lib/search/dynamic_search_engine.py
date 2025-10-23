# app/utils/dynamic_search_engine.py
"""
Dynamic Search Engine - Replaces hardcoded TECH_KEYWORDS
Bandaid solution that works for ANY job type
"""

import os
import json
import asyncio
from typing import List, Dict
from datetime import datetime

def simple_keyword_generator(user_search: str) -> List[str]:
    """Generate keywords without AI as fallback"""
    base_terms = user_search.lower().split()
    
    job_mappings = {
        "dental": ["dental hygienist", "dental assistant", "dentist", "oral health"],
        "nurse": ["nurse", "nursing", "RN", "registered nurse", "healthcare"],
        "developer": ["developer", "programmer", "software engineer", "coding"],
        "react": ["react developer", "frontend developer", "javascript developer"],
        "python": ["python developer", "backend developer", "software engineer"],
        "lawn": ["landscaping", "lawn care", "groundskeeper", "maintenance"],
        "marketing": ["marketing", "digital marketing", "marketing manager", "brand"],
        "electrician": ["electrician", "electrical", "maintenance", "technician"]
    }
    
    # Find matching keywords
    keywords = []
    for term in base_terms:
        for key, values in job_mappings.items():
            if key in term:
                keywords.extend(values)
                break
    
    # If no matches found, use the original search
    if not keywords:
        keywords = [user_search, *base_terms]
    
    # Remove duplicates and return
    return list(set(keywords))

def get_dynamic_keywords(user_search: str = None) -> List[str]: # type: ignore
    """
    DROP-IN REPLACEMENT for TECH_KEYWORDS
    
    Usage:
    # OLD: for keyword in TECH_KEYWORDS:
    # NEW: for keyword in get_dynamic_keywords():
    """
    
    if not user_search:
        user_search = os.getenv("USER_SEARCH", "software developer")
    
    print(f"🔍 Generating keywords for: '{user_search}'")
    keywords = simple_keyword_generator(user_search)
    print(f"📝 Generated keywords: {keywords}")
    
    return keywords

# AI-powered version (use when Anthropic API is available)
try:
    import anthropic
    
    class AISearchEngine:
        def __init__(self):
            api_key = os.getenv("ANTHROPIC_API_KEY")
            if not api_key:
                raise ValueError("ANTHROPIC_API_KEY not found")
            self.client = anthropic.Anthropic(api_key=api_key)
        
        async def generate_keywords(self, user_search: str) -> List[str]:
            """AI-powered keyword generation"""
            
            prompt = f"""
            Generate 5-8 job search keywords for: "{user_search}"
            
            Return only a JSON array of strings, no explanation:
            ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"]
            
            Examples:
            "dental hygienist" -> ["dental hygienist", "dental assistant", "oral health", "dentist", "dental care"]
            "react developer" -> ["react developer", "frontend developer", "javascript developer", "web developer", "UI developer"]
            "lawn care" -> ["landscaping", "lawn care", "groundskeeper", "maintenance", "landscape technician"]
            """
            
            try:
                message = self.client.messages.create(
                    model="claude-3-sonnet-20240229",
                    max_tokens=200,
                    messages=[{"role": "user", "content": prompt}]
                )
                
                response = message.content[0].text.strip()
                if response.startswith("```"):
                    response = response.replace("```json", "").replace("```", "").strip()
                
                keywords = json.loads(response)
                return keywords if isinstance(keywords, list) else [user_search]
                
            except Exception as e:
                print(f"⚠️ AI failed, using fallback: {e}")
                return simple_keyword_generator(user_search)
    
    # Try to use AI version
    async def get_ai_keywords(user_search: str = None) -> List[str]:
        if not user_search:
            user_search = os.getenv("USER_SEARCH", "software developer")
        
        try:
            engine = AISearchEngine()
            keywords = await engine.generate_keywords(user_search)
            print(f"🤖 AI generated keywords for '{user_search}': {keywords}")
            return keywords
        except Exception as e:
            print(f"⚠️ AI unavailable, using simple keywords: {e}")
            return get_dynamic_keywords(user_search)

except ImportError:
    print("ℹ️ Anthropic not available, using simple keyword generation")
    
    async def get_ai_keywords(user_search: str = None) -> List[str]:
        return get_dynamic_keywords(user_search)

# Main function to replace TECH_KEYWORDS
def replace_tech_keywords() -> List[str]:
    """Synchronous version for easy integration"""
    return get_dynamic_keywords()

async def replace_tech_keywords_async() -> List[str]:
    """Async version with AI support"""
    return await get_ai_keywords()

# Demo function
def demo():
    """Test the dynamic search"""
    test_searches = ["dental hygienist", "react developer", "lawn care", "marketing manager"]
    
    print("🚀 DYNAMIC SEARCH DEMO")
    print("=" * 50)
    
    for search in test_searches:
        print(f"\n🔍 Search: '{search}'")
        keywords = simple_keyword_generator(search)
        print(f"📝 Keywords: {keywords}")
    
    print("\n✅ Dynamic search working!")

if __name__ == "__main__":
    demo()

