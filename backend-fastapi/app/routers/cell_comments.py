# app/routers/cell_comments.py
"""
Cell comments router.
Direct port of Express routes/cellComments.js + controllers/cellCommentsController.js
"""

import logging
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException

from app.auth.dependencies import get_current_user
from app.database import get_db, PoolWrapper

from typing import Optional, Any

logger = logging.getLogger("adani-flow.cell_comments")

router = APIRouter(prefix="/api/cell-comments", tags=["Cell Comments"])


@router.post("", status_code=201)
async def add_comment(
    body: dict[str, Any],
    pool: PoolWrapper = Depends(get_db),
    current_user: dict[str, Any] = Depends(get_current_user),
):
    """Add a cell-level comment."""
    sheet_id = body.get("sheetId")
    row_index = body.get("rowIndex")
    column_key = body.get("columnKey")
    comment_text = body.get("commentText")
    comment_type = body.get("commentType", "GENERAL")

    if not all([sheet_id is not None, row_index is not None, column_key, comment_text]):
        raise HTTPException(400, detail={"message": "sheetId, rowIndex, columnKey, commentText are required"})

    if comment_type not in ("REJECTION", "GENERAL"):
        raise HTTPException(400, detail={"message": "commentType must be REJECTION or GENERAL"})

    row = await pool.fetchrow("""
        INSERT INTO cell_comments (sheet_id, row_index, column_key, comment_text, comment_type, created_by, role)
        VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *
    """, sheet_id, row_index, column_key, comment_text, comment_type, current_user["userId"], current_user["role"])

    return {"success": True, "comment": dict(row)}


@router.get("/cell")
async def get_cell_comments(
    sheetId: int,
    rowIndex: int,
    columnKey: str,
    pool: PoolWrapper = Depends(get_db),
    current_user: dict[str, Any] = Depends(get_current_user),
):
    """Get comments for a specific cell."""
    rows = await pool.fetch("""
        SELECT cc.*, u.name as user_name, u.email as user_email
        FROM cell_comments cc
        JOIN users u ON cc.created_by = u.user_id
        WHERE cc.sheet_id = $1 AND cc.row_index = $2 AND cc.column_key = $3
          AND cc.is_deleted = FALSE AND cc.parent_comment_id IS NULL
        ORDER BY cc.created_at ASC
    """, sheetId, rowIndex, columnKey)

    comments = []
    for r in rows:
        comment = dict(r)
        replies = await pool.fetch("""
            SELECT cc.*, u.name as user_name, u.email as user_email
            FROM cell_comments cc
            JOIN users u ON cc.created_by = u.user_id
            WHERE cc.parent_comment_id = $1 AND cc.is_deleted = FALSE
            ORDER BY cc.created_at ASC
        """, r["id"])
        comment["replies"] = [dict(rr) for rr in replies]
        comments.append(comment)

    return {"success": True, "comments": comments}


@router.get("/sheet/{sheet_id}")
async def get_sheet_comments(
    sheet_id: int,
    pool: PoolWrapper = Depends(get_db),
    current_user: dict[str, Any] = Depends(get_current_user),
):
    """Get all comments for a sheet."""
    rows = await pool.fetch("""
        SELECT cc.*, u.name as user_name, u.email as user_email
        FROM cell_comments cc
        JOIN users u ON cc.created_by = u.user_id
        WHERE cc.sheet_id = $1 AND cc.is_deleted = FALSE
        ORDER BY cc.created_at ASC
    """, sheet_id)

    return {"success": True, "comments": [dict(r) for r in rows]}


@router.post("/reply", status_code=201)
async def reply_to_comment(
    body: dict[str, Any],
    pool: PoolWrapper = Depends(get_db),
    current_user: dict[str, Any] = Depends(get_current_user),
):
    """Reply to an existing comment."""
    parent_id = body.get("parentCommentId")
    comment_text = body.get("commentText")

    if not parent_id or not comment_text:
        raise HTTPException(400, detail={"message": "parentCommentId and commentText are required"})

    parent = await pool.fetchrow("SELECT * FROM cell_comments WHERE id = $1", parent_id)
    if not parent:
        raise HTTPException(404, detail={"message": "Parent comment not found"})

    row = await pool.fetchrow("""
        INSERT INTO cell_comments (sheet_id, row_index, column_key, comment_text, comment_type, created_by, role, parent_comment_id)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *
    """,
        parent["sheet_id"], parent["row_index"], parent["column_key"],
        comment_text, "GENERAL", current_user["userId"], current_user["role"], parent_id,
    )

    return {"success": True, "comment": dict(row)}


@router.delete("/{comment_id}")
async def delete_comment(
    comment_id: str,
    pool: PoolWrapper = Depends(get_db),
    current_user: dict[str, Any] = Depends(get_current_user),
):
    """Soft-delete a comment."""
    row = await pool.fetchrow(
        "UPDATE cell_comments SET is_deleted = TRUE WHERE id = $1 AND created_by = $2 RETURNING *",
        comment_id, current_user["userId"],
    )
    if not row:
        if current_user["role"] in ("Site PM", "PMAG", "Super Admin"):
            row = await pool.fetchrow(
                "UPDATE cell_comments SET is_deleted = TRUE WHERE id = $1 RETURNING *", comment_id
            )
        if not row:
            raise HTTPException(404, detail={"message": "Comment not found or access denied"})

    return {"success": True, "message": "Comment deleted"}
