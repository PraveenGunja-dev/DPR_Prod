# app/routers/sso.py
"""
SSO router – Azure AD login and access request management.
Direct port of Express routes/sso.js
"""

import logging
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Request

from app.auth.dependencies import get_current_user
from app.auth.jwt_handler import generate_tokens
from app.auth.password import hash_password
from app.config import settings
from app.database import get_db, PoolWrapper

from typing import Optional, Any

logger = logging.getLogger("adani-flow.sso")

router = APIRouter(prefix="/api/sso", tags=["SSO"])


@router.post("/azure-login")
async def azure_login(
    body: dict[str, Any],
    pool: PoolWrapper = Depends(get_db),
):
    """Azure AD SSO login/register."""
    access_token = body.get("accessToken")
    if not access_token:
        raise HTTPException(400, detail={"message": "Azure access token is required"})

    # Verify Azure token
    try:
        import httpx
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                "https://graph.microsoft.com/v1.0/me",
                headers={"Authorization": f"Bearer {access_token}"},
            )
            resp.raise_for_status()
            azure_user = resp.json()
    except Exception as e:
        raise HTTPException(401, detail={"message": f"Invalid Azure token: {e}"})

    email = azure_user.get("mail") or azure_user.get("userPrincipalName", "").lower()
    name = azure_user.get("displayName") or azure_user.get("givenName", "User")
    oid = azure_user.get("id")

    if not email:
        raise HTTPException(400, detail={"message": "No email found in Azure AD profile"})

    # Check if user already exists
    row = await pool.fetchrow("SELECT * FROM users WHERE email = $1", email)

    if row:
        if not row.get("is_active", True):
            raise HTTPException(401, detail={"message": "Your account is inactive. Contact admin."})

        # Update SSO fields
        await pool.execute(
            "UPDATE users SET sso_provider = 'azure_ad', azure_oid = $1 WHERE user_id = $2",
            oid, row["user_id"],
        )

        tokens = generate_tokens(row["user_id"], row["email"], row["role"])
        return {
            "message": "SSO login successful",
            "accessToken": tokens["accessToken"],
            "refreshToken": tokens["refreshToken"],
            "user": {
                "ObjectId": row["user_id"],
                "Name": row["name"],
                "Email": row["email"],
                "Role": row["role"],
            },
        }
    else:
        # Create new user with pending_approval role
        try:
            new_user = await pool.fetchrow(
                "INSERT INTO users (name, email, role, sso_provider, azure_oid) VALUES ($1, $2, 'pending_approval', 'azure_ad', $3) RETURNING *",
                name, email, oid,
            )
        except Exception:
            raise HTTPException(400, detail={"message": "Email already exists"})

        return {
            "message": "SSO registration successful. Your account requires admin approval.",
            "requiresApproval": True,
            "user": {
                "ObjectId": new_user["user_id"],
                "Name": new_user["name"],
                "Email": new_user["email"],
                "Role": new_user["role"],
            },
        }


@router.post("/request-access")
async def request_access(
    body: dict[str, Any],
    pool: PoolWrapper = Depends(get_db),
):
    """Request access to the platform."""
    user_id = body.get("userId")
    requested_role = body.get("requestedRole")
    justification = body.get("justification")

    if not user_id or not requested_role:
        raise HTTPException(400, detail={"message": "userId and requestedRole are required"})

    # Check existing pending request
    existing = await pool.fetchrow(
        "SELECT * FROM access_requests WHERE user_id = $1 AND status = 'pending'", user_id
    )
    if existing:
        raise HTTPException(400, detail={"message": "You already have a pending access request"})

    row = await pool.fetchrow("""
        INSERT INTO access_requests (user_id, requested_role, justification) VALUES ($1, $2, $3) RETURNING *
    """, user_id, requested_role, justification)

    # Send email to admin
    try:
        from app.services.email_service import send_access_request_email
        user = await pool.fetchrow("SELECT name, email FROM users WHERE user_id = $1", user_id)
        admin_email = settings.SUPER_ADMIN_EMAIL
        if admin_email and user:
            await send_access_request_email(admin_email, user["name"], user["email"], requested_role, justification)
    except Exception as e:
        logger.error(f"Failed to send access request email: {e}")

    return {"success": True, "message": "Access request submitted", "request": dict(row)}


@router.get("/access-requests")
async def get_access_requests(
    status: Optional[str] = None,
    pool: PoolWrapper = Depends(get_db),
    current_user: dict[str, Any] = Depends(get_current_user),
):
    """Get access requests (Super Admin only)."""
    if current_user["role"] != "Super Admin":
        raise HTTPException(403, detail={"message": "Super Admin privileges required"})

    if status:
        rows = await pool.fetch("""
            SELECT ar.*, u.name as user_name, u.email as user_email
            FROM access_requests ar JOIN users u ON ar.user_id = u.user_id
            WHERE ar.status = $1 ORDER BY ar.created_at DESC
        """, status)
    else:
        rows = await pool.fetch("""
            SELECT ar.*, u.name as user_name, u.email as user_email
            FROM access_requests ar JOIN users u ON ar.user_id = u.user_id
            ORDER BY ar.created_at DESC
        """)

    return [dict(r) for r in rows]


@router.get("/access-requests/count")
async def get_pending_count(
    pool: PoolWrapper = Depends(get_db),
    current_user: dict[str, Any] = Depends(get_current_user),
):
    if current_user["role"] != "Super Admin":
        raise HTTPException(403, detail={"message": "Super Admin privileges required"})

    count = await pool.fetchval("SELECT COUNT(*) FROM access_requests WHERE status = 'pending'")
    return {"count": count}


@router.put("/access-requests/{request_id}")
async def update_access_request(
    request_id: int,
    body: dict[str, Any],
    pool: PoolWrapper = Depends(get_db),
    current_user: dict[str, Any] = Depends(get_current_user),
):
    """Approve or reject access request (Super Admin only)."""
    if current_user["role"] != "Super Admin":
        raise HTTPException(403, detail={"message": "Super Admin privileges required"})

    action = body.get("action")
    role = body.get("role")
    notes = body.get("notes")

    if action not in ("approve", "reject"):
        raise HTTPException(400, detail={"message": "action must be 'approve' or 'reject'"})

    req = await pool.fetchrow("SELECT * FROM access_requests WHERE id = $1 AND status = 'pending'", request_id)
    if not req:
        raise HTTPException(404, detail={"message": "Request not found or already processed"})

    if action == "approve":
        assigned_role = role or req["requested_role"]
        await pool.execute(
            "UPDATE users SET role = $1, is_active = TRUE WHERE user_id = $2",
            assigned_role, req["user_id"],
        )
        await pool.execute("""
            UPDATE access_requests SET status = 'approved', reviewed_by = $1, review_notes = $2, reviewed_at = CURRENT_TIMESTAMP
            WHERE id = $3
        """, current_user["userId"], notes, request_id)

        user = await pool.fetchrow("SELECT name, email FROM users WHERE user_id = $1", req["user_id"])
        try:
            from app.services.email_service import send_access_approved_email
            if user:
                await send_access_approved_email(user["email"], user["name"], assigned_role)
        except Exception as e:
            logger.error(f"Failed to send approval email: {e}")

        return {"success": True, "message": f"Request approved with role: {assigned_role}"}
    else:
        await pool.execute("""
            UPDATE access_requests SET status = 'rejected', reviewed_by = $1, review_notes = $2, reviewed_at = CURRENT_TIMESTAMP
            WHERE id = $3
        """, current_user["userId"], notes, request_id)

        user = await pool.fetchrow("SELECT name, email FROM users WHERE user_id = $1", req["user_id"])
        try:
            from app.services.email_service import send_access_rejected_email
            if user:
                await send_access_rejected_email(user["email"], user["name"], notes)
        except Exception as e:
            logger.error(f"Failed to send rejection email: {e}")

        return {"success": True, "message": "Request rejected"}
