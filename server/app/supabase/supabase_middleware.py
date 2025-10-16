from fastapi import Depends, HTTPException, Header
from supabase import create_client
import os
import jwt 
from dotenv import load_dotenv
load_dotenv()
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

async def get_current_user_id(authorization: str = Header(...)) -> str:
    token = authorization.replace("Bearer ", "")
    try:
        decoded = jwt.decode(token, options={"verify_signature": False})  # or verify with your secret
        return decoded["sub"]  # or decoded["user_id"] depending on token shape
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")