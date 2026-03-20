# app/utils/validators.py
import re

EMAIL_REGEX = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]+$")

def validate_email(email: str) -> bool:
    """Validate email format."""
    if not email:
        return False
    return bool(EMAIL_REGEX.match(email))

def validate_password(password: str) -> bool:
    """Validate Adani password policy (at least 15 chars)."""
    return len(password) >= 15
