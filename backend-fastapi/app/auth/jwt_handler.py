# app/auth/jwt_handler.py
"""
JWT token creation and verification.
Replaces jsonwebtoken from the Express backend.
"""

import uuid
from datetime import datetime, timedelta, timezone
from typing import Optional

from jose import JWTError, jwt

from app.config import settings


def create_access_token(
    user_id: int, email: str, role: str, expires_delta: Optional[timedelta] = None
) -> str:
    """Create a short-lived access token (default 15 minutes)."""
    if expires_delta is None:
        expires_delta = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)

    payload = {
        "userId": user_id,
        "email": email,
        "role": role,
        "exp": datetime.now(timezone.utc) + expires_delta,
        "iat": datetime.now(timezone.utc),
    }
    return jwt.encode(payload, settings.JWT_SECRET, algorithm="HS256")


def create_refresh_token(
    user_id: int, email: str, role: str, expires_delta: Optional[timedelta] = None
) -> str:
    """Create a long-lived refresh token (default 7 days)."""
    if expires_delta is None:
        expires_delta = timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)

    payload = {
        "userId": user_id,
        "email": email,
        "role": role,
        "tokenId": str(uuid.uuid4()),
        "exp": datetime.now(timezone.utc) + expires_delta,
        "iat": datetime.now(timezone.utc),
    }
    return jwt.encode(payload, settings.REFRESH_TOKEN_SECRET, algorithm="HS256")


def verify_access_token(token: str) -> dict:
    """
    Verify and decode an access token.
    Raises JWTError on invalid/expired token.
    Returns the decoded payload dict with userId, email, role.
    """
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=["HS256"])
        return payload
    except JWTError:
        raise


def verify_refresh_token(token: str) -> dict:
    """
    Verify and decode a refresh token.
    Raises JWTError on invalid/expired token.
    """
    try:
        payload = jwt.decode(token, settings.REFRESH_TOKEN_SECRET, algorithms=["HS256"])
        return payload
    except JWTError:
        raise


def generate_tokens(user_id: int, email: str, role: str) -> dict:
    """Generate both access and refresh tokens. Matches Express generateTokens()."""
    access_token = create_access_token(user_id, email, role)
    refresh_token = create_refresh_token(user_id, email, role)
    return {"accessToken": access_token, "refreshToken": refresh_token}
