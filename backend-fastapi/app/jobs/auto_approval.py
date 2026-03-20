# app/jobs/auto_approval.py
"""
Automatic approval background job.
Direct port of Express jobs/automaticApprovalJob.js
"""

import logging
from datetime import datetime

from app.database import get_pool
from app.utils.system_logger import create_system_log

logger = logging.getLogger("adani-flow.auto_approval")


async def run_auto_approval():
    """
    Auto-approve DPR sheets and supervisor entries that have been pending > 2 days.
    Runs on a schedule (every hour).
    """
    logger.info(f"[AutoApproval] Running auto-approval job at {datetime.now().isoformat()}")

    try:
        pool = await get_pool()

        # Auto-approve dpr_supervisor_entries pending for > 2 days
        result = await pool.fetch("""
            UPDATE dpr_supervisor_entries
            SET status = 'final_approved', updated_at = CURRENT_TIMESTAMP
            WHERE status = 'submitted_to_pm'
              AND submitted_at < CURRENT_TIMESTAMP - INTERVAL '2 days'
            RETURNING id, project_id, sheet_type
        """)

        if result:
            for row in result:
                logger.info(f"[AutoApproval] Auto-approved entry {row['id']} (Project: {row['project_id']}, Type: {row['sheet_type']})")
                await create_system_log(
                    "AUTO_APPROVED",
                    None,
                    f"Entry: {row['id']}, Project: {row['project_id']}, Type: {row['sheet_type']}",
                    "Automatically approved after 2+ days pending",
                )

        # Also auto-approve approved_by_pm entries waiting for PMAG push > 2 days
        result2 = await pool.fetch("""
            UPDATE dpr_supervisor_entries
            SET status = 'final_approved', updated_at = CURRENT_TIMESTAMP
            WHERE status = 'approved_by_pm'
              AND pm_reviewed_at < CURRENT_TIMESTAMP - INTERVAL '2 days'
            RETURNING id, project_id, sheet_type
        """)

        if result2:
            for row in result2:
                logger.info(f"[AutoApproval] Auto-finalized entry {row['id']}")
                await create_system_log(
                    "AUTO_FINALIZED",
                    None,
                    f"Entry: {row['id']}, Project: {row['project_id']}, Type: {row['sheet_type']}",
                    "Automatically finalized after 2+ days waiting for PMAG push",
                )

        total = len(result) + len(result2)
        logger.info(f"[AutoApproval] Job completed. {total} entries processed.")

    except Exception as e:
        logger.error(f"[AutoApproval] Error in auto-approval job: {e}")
