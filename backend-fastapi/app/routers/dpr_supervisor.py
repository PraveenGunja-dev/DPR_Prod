# app/routers/dpr_supervisor.py
"""
DPR Supervisor router – complete DPR workflow.
Direct port of Express routes/dprSupervisor.js + controllers/dprSupervisorController.js
"""

import json
import logging
from datetime import datetime, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException

from app.auth.dependencies import get_current_user
from app.database import get_db, PoolWrapper
from app.services.cache_service import cache
from app.utils.system_logger import create_system_log

from typing import Optional, Any, List
from app.routers.notifications import create_notification

logger = logging.getLogger("adani-flow.dpr_supervisor")

router = APIRouter(prefix="/api/dpr-supervisor", tags=["DPR Supervisor"])


def _get_today_and_yesterday():
    today = datetime.now()
    yesterday = today - timedelta(days=1)
    return today.strftime("%Y-%m-%d"), yesterday.strftime("%Y-%m-%d")


def _get_empty_data(sheet_type: str, today: str, yesterday: str) -> dict:
    """Return empty initial data structure based on sheet type."""
    if sheet_type == "dp_qty":
        return {
            "staticHeader": {
                "projectInfo": "PLOT - A-06 135 MW - KHAVDA HYBRID SOLAR PHASE 3 (YEAR 2025-26)",
                "reportingDate": today,
                "progressDate": yesterday,
            },
            "rows": [{"slNo": "", "description": "", "totalQuantity": "", "uom": "", "basePlanStart": "", "basePlanFinish": "", "forecastStart": "", "forecastFinish": "", "blockCapacity": "", "phase": "", "block": "", "spvNumber": "", "actualStart": "", "actualFinish": "", "remarks": "", "priority": "", "balance": "", "cumulative": ""}],
        }
    elif sheet_type == "dp_vendor_block":
        return {"rows": [{"activityId": "", "activities": "", "plot": "", "newBlockNom": "", "priority": "", "baselinePriority": "", "contractorName": "", "scope": "", "holdDueToWtg": "", "front": "", "actual": "", "completionPercentage": "", "remarks": "", "yesterdayValue": "", "todayValue": ""}]}
    elif sheet_type == "manpower_details":
        return {"totalManpower": 0, "rows": [{"activityId": "", "slNo": "", "block": "", "contractorName": "", "activity": "", "section": "", "yesterdayValue": "", "todayValue": ""}]}
    elif sheet_type == "dp_block":
        return {"rows": [{"slNo": "", "description": "", "totalQuantity": "", "uom": "", "basePlanStart": "", "basePlanFinish": "", "forecastStart": "", "forecastFinish": "", "blockCapacity": "", "phase": "", "block": "", "spvNumber": "", "actualStart": "", "actualFinish": "", "remarks": "", "priority": "", "balance": "", "cumulative": ""}]}
    elif sheet_type == "dp_vendor_idt":
        return {"rows": [{"activityId": "", "activities": "", "plot": "", "vendor": "", "idtDate": "", "actualDate": "", "status": "", "yesterdayValue": "", "todayValue": ""}]}
    elif sheet_type == "mms_module_rfi":
        return {"rows": [{"rfiNo": "", "subject": "", "module": "", "submittedDate": "", "responseDate": "", "status": "", "remarks": "", "yesterdayValue": "", "todayValue": ""}]}
    return {"rows": [{}]}


@router.get("/draft")
async def get_draft_entry(
    projectId: int,
    sheetType: str,
    date: Optional[str] = None,
    pool: PoolWrapper = Depends(get_db),
    current_user: dict[str, Any] = Depends(get_current_user),
):
    """Get or create a draft entry for a supervisor."""
    user_id = current_user["userId"]
    user_role = current_user["role"]

    if user_role != "supervisor":
        raise HTTPException(403, detail={"message": "Only supervisors can create draft entries"})

    # Verify project assignment
    assignment = await pool.fetchrow(
        "SELECT sheet_types FROM project_assignments WHERE user_id = $1 AND project_id = $2",
        user_id, projectId,
    )
    if not assignment:
        raise HTTPException(403, detail={"message": "Access denied to this project"})

    permitted = assignment["sheet_types"]
    if permitted:
        try:
            sheets = json.loads(permitted) if isinstance(permitted, str) else permitted
            if sheets and sheetType not in sheets:
                raise HTTPException(403, detail={"message": f"Access denied. You do not have permission for the sheet: {sheetType}"})
        except (json.JSONDecodeError, TypeError):
            pass

    today_str, yesterday_str = _get_today_and_yesterday()
    target_date = date or today_str

    # Validate date within 7 days
    if date:
        from datetime import date as dt_date
        req = datetime.strptime(date, "%Y-%m-%d").date()
        now = datetime.now().date()
        if abs((now - req).days) > 7:
            raise HTTPException(400, detail={"message": "Can only access dates within the last 7 days."})
        target_yesterday = (req - timedelta(days=1)).isoformat()
    else:
        target_yesterday = yesterday_str

    # Check for rejected entry first (for today)
    if not date or date == today_str:
        row = await pool.fetchrow("""
            SELECT * FROM dpr_supervisor_entries
            WHERE supervisor_id = $1 AND project_id = $2 AND sheet_type = $3 AND status = 'rejected_by_pm'
            ORDER BY updated_at DESC LIMIT 1
        """, user_id, projectId, sheetType)
        if row:
            entry: dict[str, Any] = dict(row)
            entry["isRejected"] = True
            entry["rejectionMessage"] = "This entry was rejected by PM. Please review and resubmit."
            entry["rejectionReason"] = entry.get("rejection_reason")
            return entry

    # Check existing draft
    row = await pool.fetchrow("""
        SELECT * FROM dpr_supervisor_entries
        WHERE supervisor_id = $1 AND project_id = $2 AND sheet_type = $3 AND entry_date = $4 AND status = 'draft'
    """, user_id, projectId, sheetType, target_date)
    if row:
        entry = dict(row)
        db_date = entry["entry_date"].strftime("%Y-%m-%d") if entry.get("entry_date") else None
        if db_date and db_date < today_str:
            entry["isPastEdit"] = True
            entry["readOnlyMessage"] = "This is an edit for a past date. A reason is required upon submission."
        return entry

    # Check submitted/approved entries
    row = await pool.fetchrow("""
        SELECT * FROM dpr_supervisor_entries
        WHERE supervisor_id = $1 AND project_id = $2 AND sheet_type = $3 AND entry_date = $4
          AND status IN ('submitted_to_pm', 'approved_by_pm', 'final_approved')
    """, user_id, projectId, sheetType, target_date)
    if row:
        entry: dict[str, Any] = dict(row)
        if entry["status"] == "submitted_to_pm":
            entry["isLocked"] = True
            entry["message"] = "This entry has been submitted and cannot be edited."
        elif entry["status"] == "approved_by_pm":
            entry["pastEntry"] = True
            entry["message"] = "This is an approved past entry. Any edits require a reason and will revert to Pending Review."
        return entry

    # Create new draft
    empty_data = _get_empty_data(sheetType, target_date, target_yesterday)
    row = await pool.fetchrow("""
        INSERT INTO dpr_supervisor_entries (supervisor_id, project_id, sheet_type, entry_date, previous_date, data_json, status)
        VALUES ($1, $2, $3, $4, $5, $6, 'draft') RETURNING *
    """, user_id, projectId, sheetType, target_date, target_yesterday, json.dumps(empty_data))

    entry = dict(row)
    db_date = entry["entry_date"].strftime("%Y-%m-%d") if entry.get("entry_date") else None
    if db_date and db_date < today_str:
        entry["isPastEdit"] = True
        entry["readOnlyMessage"] = "This is an edit for a past date. A reason is required upon submission."

    return entry


@router.post("/save-draft")
async def save_draft_entry(
    body: dict[str, Any],
    pool: PoolWrapper = Depends(get_db),
    current_user: dict[str, Any] = Depends(get_current_user),
):
    entry_id = body.get("entryId")
    data = body.get("data")

    check = await pool.fetchrow(
        "SELECT * FROM dpr_supervisor_entries WHERE id = $1 AND supervisor_id = $2 AND status IN ('draft', 'rejected_by_pm', 'approved_by_pm', 'final_approved')",
        entry_id, current_user["userId"],
    )
    if not check:
        raise HTTPException(404, detail={"message": "Entry not found, access denied, or invalid status for saving"})

    row = await pool.fetchrow(
        "UPDATE dpr_supervisor_entries SET data_json = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *",
        json.dumps(data), entry_id,
    )
    return dict(row)


@router.post("/submit")
async def submit_entry(
    body: dict[str, Any],
    pool: PoolWrapper = Depends(get_db),
    current_user: dict[str, Any] = Depends(get_current_user),
):
    entry_id = body.get("entryId")
    edit_reason = body.get("editReason")
    user_id = current_user["userId"]

    check = await pool.fetchrow(
        "SELECT * FROM dpr_supervisor_entries WHERE id = $1 AND supervisor_id = $2 AND status IN ('draft', 'rejected_by_pm', 'approved_by_pm', 'final_approved')",
        entry_id, user_id,
    )
    if not check:
        raise HTTPException(404, detail={"message": "Entry not found, access denied, or invalid status for submission"})

    today_str, _ = _get_today_and_yesterday()
    db_date = check["entry_date"].strftime("%Y-%m-%d") if check.get("entry_date") else None
    is_past = (check["status"] in ("approved_by_pm", "final_approved")) or (db_date and db_date < today_str)
    reason_text = f"PAST EDIT REASON: {edit_reason}" if is_past and edit_reason else (edit_reason or None)

    row = await pool.fetchrow("""
        UPDATE dpr_supervisor_entries SET status = 'submitted_to_pm', submitted_at = CURRENT_TIMESTAMP,
        submitted_by = $2, updated_at = CURRENT_TIMESTAMP, rejection_reason = COALESCE($3::text, rejection_reason)
        WHERE id = $1 RETURNING *
    """, entry_id, user_id, reason_text)

    # Notify Site PM(s)
    try:
        pms = await pool.fetch("SELECT user_id FROM users WHERE role = 'Site PM'")
        for pm in pms:
            await create_notification(
                pool, pm["user_id"], 
                "New DPR Submission", 
                f"Supervisor {current_user['name']} submitted {check['sheet_type']} for {db_date}",
                "info", check["project_id"], entry_id, check["sheet_type"]
            )
    except Exception as e:
        logger.error(f"Failed to send submission notification: {e}")

    # EMAIL NOTIFICATION TO SITE PMS & SUPER ADMIN (Optional but useful for oversight)
    try:
        from app.services.email_service import send_dpr_status_email
        from app.config import settings
        pms = await pool.fetch("SELECT name, email FROM users WHERE role = 'Site PM'")
        proj = await pool.fetchval('SELECT "Name" FROM p6_projects WHERE "ObjectId" = $1', check["project_id"])
        
        # Notify Super Admin
        if settings.SUPER_ADMIN_EMAIL:
            await send_dpr_status_email(
                settings.SUPER_ADMIN_EMAIL, "Super Admin", check["sheet_type"], "Submitted to PM",
                proj or "Project", check["entry_date"].isoformat(), f"By Supervisor: {current_user['name']}"
            )
            
        # Notify Site PMs via email as well
        for pm in pms:
            if pm["email"]:
                await send_dpr_status_email(
                    pm["email"], pm["name"], check["sheet_type"], "New Submission (Pending PM Review)",
                    proj or "Project", check["entry_date"].isoformat(), f"Submitted by {current_user['name']}"
                )
    except Exception as ee:
        logger.error(f"Submission email notification failed: {ee}")

    return {"message": "Entry submitted successfully", "entry": dict(row)}


@router.get("/pm/entries")
async def get_entries_for_pm_review(
    projectId: Optional[int] = None,
    pool: PoolWrapper = Depends(get_db),
    current_user: dict[str, Any] = Depends(get_current_user),
):
    if current_user["role"] != "Site PM":
        raise HTTPException(403, detail={"message": "Access denied"})

    cache_key = f"pm_entries_{current_user['role']}_{projectId or 'all'}"
    cached = await cache.get(cache_key)
    if cached:
        return cached

    valid_pid = projectId and str(projectId) not in ("null", "undefined")

    if valid_pid:
        rows = await pool.fetch("""
            SELECT dse.*, u.name as supervisor_name, u.email as supervisor_email
            FROM dpr_supervisor_entries dse JOIN users u ON dse.supervisor_id = u.user_id
            WHERE dse.project_id = $1 AND dse.status IN ('submitted_to_pm', 'approved_by_pm', 'rejected_by_pm')
            ORDER BY dse.submitted_at DESC
        """, projectId)
    else:
        rows = await pool.fetch("""
            SELECT dse.*, u.name as supervisor_name, u.email as supervisor_email
            FROM dpr_supervisor_entries dse JOIN users u ON dse.supervisor_id = u.user_id
            WHERE dse.status IN ('submitted_to_pm', 'approved_by_pm', 'rejected_by_pm')
            ORDER BY dse.submitted_at DESC
        """)

    result = [dict(r) for r in rows]
    await cache.set(cache_key, result, 120)
    return result


@router.post("/pm/approve")
async def approve_entry_by_pm(
    body: dict[str, Any],
    pool: PoolWrapper = Depends(get_db),
    current_user: dict[str, Any] = Depends(get_current_user),
):
    if current_user["role"] != "Site PM":
        raise HTTPException(403, detail={"message": "Only PM can approve entries"})

    entry_id = body.get("entryId")
    row = await pool.fetchrow("""
        UPDATE dpr_supervisor_entries SET status = 'approved_by_pm', pm_reviewed_at = CURRENT_TIMESTAMP,
        pm_reviewed_by = $2, updated_at = CURRENT_TIMESTAMP
        WHERE id = $1 AND status = 'submitted_to_pm' RETURNING *
    """, entry_id, current_user["userId"])

    if not row:
        raise HTTPException(404, detail={"message": "Entry not found or invalid status"})
    await cache.flush_all()
    # Notify Supervisor and PMAG
    try:
        entry = dict(row)
        # Notify Supervisor
        await create_notification(
            pool, entry["supervisor_id"], 
            "DPR Approved by PM", 
            f"Your {entry['sheet_type']} for {entry['entry_date']} has been approved by PM.",
            "success", entry["project_id"], entry_id, entry["sheet_type"]
        )
        # Notify PMAG
        pmags = await pool.fetch("SELECT user_id, email, name FROM users WHERE role = 'PMAG'")
        for pmag in pmags:
            await create_notification(
                pool, pmag["user_id"], 
                "New PM-Approved DPR", 
                f"PM approved {entry['sheet_type']} for {entry['entry_date']}. Pending your final review.",
                "info", entry["project_id"], entry_id, entry["sheet_type"]
            )
            
        # EMAIL NOTIFICATION
        try:
            from app.services.email_service import send_dpr_status_email
            # Fetch supervisor info and project name
            sup = await pool.fetchrow("SELECT name, email FROM users WHERE user_id = $1", entry["supervisor_id"])
            proj = await pool.fetchval('SELECT "Name" FROM p6_projects WHERE "ObjectId" = $1', entry["project_id"])
            if sup and sup["email"]:
                await send_dpr_status_email(
                    sup["email"], sup["name"], entry["sheet_type"], "Approved by PM", 
                    proj or "Project", entry["entry_date"].isoformat(), None
                )
        except Exception as ee:
            logger.error(f"Email notification failed: {ee}")
            
        # Notify Super Admin
        try:
            from app.config import settings
            if settings.SUPER_ADMIN_EMAIL:
                from app.services.email_service import send_dpr_status_email
                proj = await pool.fetchval('SELECT "Name" FROM p6_projects WHERE "ObjectId" = $1', entry["project_id"])
                await send_dpr_status_email(
                    settings.SUPER_ADMIN_EMAIL, "Super Admin", entry["sheet_type"], "Approved by PM",
                    proj or "Project", entry["entry_date"].isoformat(), f"Reviewer: {current_user['name']}"
                )
        except Exception as ee:
            logger.error(f"Super Admin email notification failed: {ee}")
    except Exception as e:
        logger.error(f"Failed to send PM approval notification: {e}")

    return {"message": "Entry approved successfully", "entry": dict(row)}


@router.put("/pm/update")
async def update_entry_by_pm(
    body: dict[str, Any],
    pool: PoolWrapper = Depends(get_db),
    current_user: dict[str, Any] = Depends(get_current_user),
):
    if current_user["role"] != "Site PM":
        raise HTTPException(403, detail={"message": "Only Site PM can update entries"})

    entry_id = body.get("entryId")
    data = body.get("data")

    check = await pool.fetchrow(
        "SELECT * FROM dpr_supervisor_entries WHERE id = $1 AND status IN ('submitted_to_pm', 'rejected_by_pm')",
        entry_id,
    )
    if not check:
        raise HTTPException(404, detail={"message": "Entry not found or cannot be edited"})

    row = await pool.fetchrow(
        "UPDATE dpr_supervisor_entries SET data_json = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *",
        json.dumps(data), entry_id,
    )
    await cache.flush_all()
    return {"message": "Entry updated successfully", "entry": dict(row)}


@router.post("/pm/reject")
async def reject_entry_by_pm(
    body: dict[str, Any],
    pool: PoolWrapper = Depends(get_db),
    current_user: dict[str, Any] = Depends(get_current_user),
):
    if current_user["role"] != "Site PM":
        raise HTTPException(403, detail={"message": "Only PM can reject entries"})

    entry_id = body.get("entryId")
    rejection_reason = body.get("rejectionReason")

    # Check for cell rejection comments
    try:
        comments_count = await pool.fetchval(
            "SELECT COUNT(*) FROM cell_comments WHERE sheet_id = $1 AND comment_type = 'REJECTION' AND is_deleted = FALSE",
            entry_id,
        )
        if comments_count == 0:
            raise HTTPException(400, detail={"message": "Please add rejection comments on specific cells before rejecting the sheet", "requiresComments": True})
    except Exception:
        pass

    row = await pool.fetchrow("""
        UPDATE dpr_supervisor_entries SET status = 'rejected_by_pm', rejection_reason = $2,
        pm_reviewed_at = CURRENT_TIMESTAMP, pm_reviewed_by = $3, updated_at = CURRENT_TIMESTAMP
        WHERE id = $1 AND status = 'submitted_to_pm' RETURNING *
    """, entry_id, rejection_reason, current_user["userId"])

    if not row:
        raise HTTPException(404, detail={"message": "Entry not found or invalid status"})

    await cache.flush_all()
    entry = dict(row)
    await create_system_log(
        "SHEET_REJECTED", current_user["userId"],
        f"Entry: {entry_id}, Project: {entry['project_id']}, Type: {entry['sheet_type']}",
        f"Entry {entry_id} ({entry['sheet_type']}) rejected by PM. Reason: {rejection_reason or 'No reason'}",
    )

        # Notify Supervisor
        await create_notification(
            pool, entry["supervisor_id"], 
            "DPR Rejected", 
            f"Your {entry['sheet_type']} for {entry['entry_date']} was rejected. Reason: {rejection_reason}",
            "error", entry["project_id"], entry_id, entry["sheet_type"]
        )
        
        # EMAIL NOTIFICATION
        try:
            from app.services.email_service import send_dpr_status_email
            sup = await pool.fetchrow("SELECT name, email FROM users WHERE user_id = $1", entry["supervisor_id"])
            proj = await pool.fetchval('SELECT "Name" FROM p6_projects WHERE "ObjectId" = $1', entry["project_id"])
            if sup and sup["email"]:
                await send_dpr_status_email(
                    sup["email"], sup["name"], entry["sheet_type"], "Rejected by PM", 
                    proj or "Project", entry["entry_date"].isoformat(), rejection_reason
                )
        except Exception as ee:
            logger.error(f"Email notification failed: {ee}")
            
        # Notify Super Admin
        try:
            from app.config import settings
            if settings.SUPER_ADMIN_EMAIL:
                from app.services.email_service import send_dpr_status_email
                proj = await pool.fetchval('SELECT "Name" FROM p6_projects WHERE "ObjectId" = $1', entry["project_id"])
                await send_dpr_status_email(
                    settings.SUPER_ADMIN_EMAIL, "Super Admin", entry["sheet_type"], "Rejected by PM",
                    proj or "Project", entry["entry_date"].isoformat(), f"Reason: {rejection_reason}"
                )
        except Exception as ee:
            logger.error(f"Super Admin email notification failed: {ee}")
    except Exception as e:
        logger.error(f"Failed to send rejection notification: {e}")

    return {"message": "Entry rejected and sent back to Supervisor", "entry": entry}


@router.get("/entry/{entry_id}")
async def get_entry_by_id(
    entry_id: int,
    pool: PoolWrapper = Depends(get_db),
    current_user: dict[str, Any] = Depends(get_current_user),
):
    row = await pool.fetchrow("""
        SELECT dse.*, u.name as supervisor_name
        FROM dpr_supervisor_entries dse JOIN users u ON dse.supervisor_id = u.user_id
        WHERE dse.id = $1
    """, entry_id)

    if not row:
        raise HTTPException(404, detail={"message": "Entry not found"})

    if current_user["role"] == "supervisor" and row["supervisor_id"] != current_user["userId"]:
        raise HTTPException(403, detail={"message": "Access denied"})

    return dict(row)


@router.get("/pmag/entries")
async def get_entries_for_pmag_review(
    projectId: Optional[int] = None,
    pool: PoolWrapper = Depends(get_db),
    current_user: dict[str, Any] = Depends(get_current_user),
):
    if current_user["role"] != "PMAG":
        raise HTTPException(403, detail={"message": "Access denied"})

    cache_key = f"pmag_entries_{current_user['role']}_{projectId or 'all'}"
    cached = await cache.get(cache_key)
    if cached:
        return cached

    valid_pid = projectId and str(projectId) not in ("null", "undefined")

    if valid_pid:
        rows = await pool.fetch("""
            SELECT dse.*, u.name as supervisor_name, u.email as supervisor_email
            FROM dpr_supervisor_entries dse JOIN users u ON dse.supervisor_id = u.user_id
            WHERE dse.project_id = $1 AND dse.status = 'approved_by_pm'
            ORDER BY dse.updated_at DESC
        """, projectId)
    else:
        rows = await pool.fetch("""
            SELECT dse.*, u.name as supervisor_name, u.email as supervisor_email
            FROM dpr_supervisor_entries dse JOIN users u ON dse.supervisor_id = u.user_id
            WHERE dse.status = 'approved_by_pm' ORDER BY dse.updated_at DESC
        """)

    result = [dict(r) for r in rows]
    await cache.set(cache_key, result, 120)
    return result


@router.get("/pmag-history")
async def get_entries_history_for_pmag(
    projectId: Optional[int] = None,
    days: Optional[int] = None,
    pool: PoolWrapper = Depends(get_db),
    current_user: dict[str, Any] = Depends(get_current_user),
):
    if current_user["role"] != "PMAG":
        raise HTTPException(403, detail={"message": "Access denied"})

    params = []
    conditions = ["dse.status IN ('approved_by_pm', 'final_approved')"]
    idx = 1

    if projectId:
        conditions.append(f"dse.project_id = ${idx}")
        params.append(projectId)
        idx += 1
    if days:
        conditions.append(f"dse.updated_at >= NOW() - INTERVAL '{int(days)} days'")

    where = " AND ".join(conditions)
    rows = await pool.fetch(f"""
        SELECT dse.*, u.name as supervisor_name, u.email as supervisor_email
        FROM dpr_supervisor_entries dse JOIN users u ON dse.supervisor_id = u.user_id
        WHERE {where} ORDER BY dse.updated_at DESC
    """, *params)

    return [dict(r) for r in rows]


@router.get("/pmag-archived")
async def get_archived_entries_for_pmag(
    projectId: Optional[int] = None,
    pool: PoolWrapper = Depends(get_db),
    current_user: dict[str, Any] = Depends(get_current_user),
):
    if current_user["role"] != "PMAG":
        raise HTTPException(403, detail={"message": "Access denied"})

    if projectId:
        rows = await pool.fetch("""
            SELECT dse.*, u.name as supervisor_name, u.email as supervisor_email
            FROM dpr_supervisor_entries dse JOIN users u ON dse.supervisor_id = u.user_id
            WHERE dse.project_id = $1 AND dse.status = 'final_approved'
              AND dse.updated_at < CURRENT_TIMESTAMP - INTERVAL '2 days'
            ORDER BY dse.updated_at DESC
        """, projectId)
    else:
        rows = await pool.fetch("""
            SELECT dse.*, u.name as supervisor_name, u.email as supervisor_email
            FROM dpr_supervisor_entries dse JOIN users u ON dse.supervisor_id = u.user_id
            WHERE dse.status = 'final_approved' AND dse.updated_at < CURRENT_TIMESTAMP - INTERVAL '2 days'
            ORDER BY dse.updated_at DESC
        """)

    return [dict(r) for r in rows]


@router.post("/pmag/approve")
async def approve_entry_by_pmag(
    body: dict[str, Any],
    pool: PoolWrapper = Depends(get_db),
    current_user: dict[str, Any] = Depends(get_current_user),
):
    if current_user["role"] != "PMAG":
        raise HTTPException(403, detail={"message": "Only PMAG can approve entries"})

    entry_id = body.get("entryId")
    row = await pool.fetchrow("""
        UPDATE dpr_supervisor_entries SET status = 'final_approved', pm_reviewed_at = CURRENT_TIMESTAMP,
        pm_reviewed_by = $2, updated_at = CURRENT_TIMESTAMP
        WHERE id = $1 AND status = 'approved_by_pm' RETURNING *
    """, entry_id, current_user["userId"])

    if not row:
        raise HTTPException(404, detail={"message": "Entry not found or invalid status"})
    await cache.flush_all()
    # Notify Supervisor and PM(s)
    try:
        entry = dict(row)
        # Notify Supervisor
        await create_notification(
            pool, entry["supervisor_id"], 
            "DPR Final Approved", 
            f"Your {entry['sheet_type']} for {entry['entry_date']} has received final approval from PMAG.",
            "success", entry["project_id"], entry_id, entry["sheet_type"]
        )
        # Notify Site PM(s)
        pms = await pool.fetch("SELECT user_id, name, email FROM users WHERE role = 'Site PM'")
        for pm in pms:
            await create_notification(
                pool, pm["user_id"], 
                "DPR Final Approved", 
                f"PMAG has given final approval to {entry['sheet_type']} for {entry['entry_date']}.",
                "success", entry["project_id"], entry_id, entry["sheet_type"]
            )
            
        # EMAIL NOTIFICATION
        try:
            from app.services.email_service import send_dpr_status_email
            sup = await pool.fetchrow("SELECT name, email FROM users WHERE user_id = $1", entry["supervisor_id"])
            proj = await pool.fetchval('SELECT "Name" FROM p6_projects WHERE "ObjectId" = $1', entry["project_id"])
            if sup and sup["email"]:
                await send_dpr_status_email(
                    sup["email"], sup["name"], entry["sheet_type"], "Final Approved", 
                    proj or "Project", entry["entry_date"].isoformat(), None
                )
            for pm in pms:
                if pm["email"]:
                    await send_dpr_status_email(
                        pm["email"], pm["name"], entry["sheet_type"], "Final Approved (by PMAG)", 
                        proj or "Project", entry["entry_date"].isoformat(), None
                    )
        except Exception as ee:
            logger.error(f"Email notification failed: {ee}")
            
        # Notify Super Admin
        try:
            from app.config import settings
            if settings.SUPER_ADMIN_EMAIL:
                from app.services.email_service import send_dpr_status_email
                proj = await pool.fetchval('SELECT "Name" FROM p6_projects WHERE "ObjectId" = $1', entry["project_id"])
                await send_dpr_status_email(
                    settings.SUPER_ADMIN_EMAIL, "Super Admin", entry["sheet_type"], "Final Approved by PMAG",
                    proj or "Project", entry["entry_date"].isoformat(), f"Reviewer: {current_user['name']}"
                )
        except Exception as ee:
            logger.error(f"Super Admin email notification failed: {ee}")
    except Exception as e:
        logger.error(f"Failed to send PMAG approval notification: {e}")

    return {"message": "Entry approved by PMAG successfully", "entry": dict(row)}


@router.post("/pmag-push-to-p6")
async def push_to_p6(
    body: dict[str, Any],
    pool: PoolWrapper = Depends(get_db),
    current_user: dict[str, Any] = Depends(get_current_user),
):
    if current_user["role"] != "PMAG":
        raise HTTPException(403, detail={"message": "Access denied"})

    entry_id = body.get("entryId")
    row = await pool.fetchrow("""
        UPDATE dpr_supervisor_entries SET status = 'final_approved', pushed_at = CURRENT_TIMESTAMP,
        pushed_by = $2, updated_at = CURRENT_TIMESTAMP
        WHERE id = $1 AND status = 'approved_by_pm' RETURNING *
    """, entry_id, current_user["userId"])

    if not row:
        raise HTTPException(404, detail={"message": "Entry not found or invalid status"})
    await cache.flush_all()
    return {"message": "Entry pushed to P6 successfully", "entry": dict(row)}


@router.post("/pmag-reject")
async def reject_entry_by_pmag(
    body: dict[str, Any],
    pool: PoolWrapper = Depends(get_db),
    current_user: dict[str, Any] = Depends(get_current_user),
):
    if current_user["role"] != "PMAG":
        raise HTTPException(403, detail={"message": "Only PMAG can reject entries"})

    entry_id = body.get("entryId")
    rejection_reason = body.get("rejectionReason")

    row = await pool.fetchrow("""
        UPDATE dpr_supervisor_entries SET status = 'submitted_to_pm', rejection_reason = $2,
        updated_at = CURRENT_TIMESTAMP WHERE id = $1 AND status = 'approved_by_pm' RETURNING *
    """, entry_id, rejection_reason)

    if not row:
        raise HTTPException(404, detail={"message": "Entry not found or invalid status"})

    await cache.flush_all()
    return {"message": "Entry rejected and sent back to PM", "entry": dict(row)}
