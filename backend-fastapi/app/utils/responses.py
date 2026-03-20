# app/utils/responses.py

def serialize_user(row: dict) -> dict:
    """Standard user response shape used across auth, sso, super_admin."""
    return {
        "ObjectId": row.get("user_id"),
        "Name": row.get("name"),
        "Email": row.get("email"),
        "Role": row.get("role")
    }

def success_response(message: str, **kwargs) -> dict:
    return {"message": message, "success": True, **kwargs}

def error_response(message: str, status_code: int = 400) -> dict:
    return {"message": message, "success": False, "error_code": status_code}
