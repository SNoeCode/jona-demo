# app/utils/auth.py

import os
import logging
from typing import Optional

from fastapi import Header, HTTPException
from jose import jwt, JWTError
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
SUPABASE_JWT_SECRET = os.getenv("SUPABASE_JWT_SECRET")
DEFAULT_AUTH = os.getenv("DEFAULT_AUTH_TOKEN", "default-dev-token")
ENVIRONMENT = os.getenv("ENVIRONMENT", "production")

logger = logging.getLogger(__name__)


def extract_token(authorization: Optional[str]) -> str:
    """Extract raw token from Bearer header"""
    if not authorization:
        raise HTTPException(status_code=401, detail="Authorization header required")

    if not authorization.startswith("Bearer "):
        logger.warning("Authorization header missing 'Bearer ' prefix")
        raise HTTPException(status_code=401, detail="Invalid authorization header format")

    return authorization.replace("Bearer ", "")


def decode_jwt_token(token: str, verify_signature: bool = True) -> dict:
    """Decode JWT token with or without signature verification"""
    try:
        if verify_signature:
            if not SUPABASE_JWT_SECRET:
                logger.error("SUPABASE_JWT_SECRET not configured")
                raise HTTPException(status_code=500, detail="JWT secret not configured")
            return jwt.decode(token, SUPABASE_JWT_SECRET, algorithms=["HS256"])
        else:
            return jwt.decode(token, options={"verify_signature": False})
    except JWTError as e:
        logger.warning(f"JWT decode error: {e}")
        raise HTTPException(status_code=401, detail="Invalid auth token")
    except Exception as e:
        logger.error(f"Unexpected JWT decode error: {e}")
        raise HTTPException(status_code=500, detail="Authentication error")


def get_current_user_id(authorization: Optional[str] = Header(None)) -> str:
    """Get current user ID from JWT token or fallback for development"""
    if not authorization and ENVIRONMENT == "development":
        return "default-user-id"

    token = extract_token(authorization)

    if ENVIRONMENT == "development" and token == DEFAULT_AUTH:
        return "default-user-id"

    payload = decode_jwt_token(token)
    user_id = payload.get("sub") or payload.get("user_id")

    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token: missing user ID")

    logger.debug(f"User ID extracted: {user_id}")
    return user_id


def get_user_info_from_token(authorization: str) -> dict:
    """Extract full user info from JWT token"""
    token = extract_token(authorization)
    payload = decode_jwt_token(token)

    user_info = {
        "user_id": payload.get("sub"),
        "email": payload.get("email"),
        "role": payload.get("role"),
        "aud": payload.get("aud"),
        "exp": payload.get("exp"),
        "iat": payload.get("iat")
    }

    logger.debug(f"User info extracted for: {user_info.get('email')}")
    return user_info


def validate_admin_access(authorization: str) -> str:
    """Validate admin access and return user ID"""
    logger.info("Validating admin access")
    user_info = get_user_info_from_token(authorization)

    user_id = user_info["user_id"]
    user_role = user_info.get("role")

    if user_role != "admin":
        logger.warning(f"Non-admin user {user_id} attempted admin access")
        raise HTTPException(status_code=403, detail="Admin access required")

    logger.info(f"Admin access validated for user: {user_id}")
    return user_id


def get_current_user_id_sync() -> str:
    """Synchronous fallback for development/testing"""
    return "default-user-id"
