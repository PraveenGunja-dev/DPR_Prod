# app/models/auth.py
"""Pydantic models for auth routes."""

from typing import Optional
from pydantic import BaseModel, EmailStr, Field


class LoginRequest(BaseModel):
    email: str
    password: str


class RegisterRequest(BaseModel):
    name: str
    email: str
    password: str = Field(min_length=8)
    role: str


class RefreshTokenRequest(BaseModel):
    refreshToken: str


class LogoutRequest(BaseModel):
    refreshToken: Optional[str] = None


class UserResponse(BaseModel):
    ObjectId: int
    Name: str
    Email: str
    Role: str


class LoginResponse(BaseModel):
    message: str
    accessToken: str
    refreshToken: str
    p6Token: Optional[str] = None
    user: UserResponse
    sessionId: str
    loginStatus: str = "SUCCESS"


class ProfileResponse(BaseModel):
    user: UserResponse
