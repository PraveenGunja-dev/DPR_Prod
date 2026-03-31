# app/auth/password.py
"""
Password hashing and verification using bcrypt directly.
Replaces the passlib dependency because passlib is incompatible with bcrypt >= 4.0.0
"""

import bcrypt

def hash_password(password: str) -> str:
    """Hash a password using bcrypt (compatible with Express bcryptjs hashes)."""
    pwd_bytes = password.encode('utf-8')
    salt = bcrypt.gensalt(rounds=12)
    hashed = bcrypt.hashpw(pwd_bytes, salt)
    return hashed.decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against a bcrypt hash."""
    try:
        pwd_bytes = plain_password.encode('utf-8')
        hash_bytes = hashed_password.strip().encode('utf-8')
        return bcrypt.checkpw(pwd_bytes, hash_bytes)
    except Exception as e:
        import logging
        logging.getLogger("adani-flow.auth").error(f"Error in verify_password: {e}")
        return False
