# app/utils/system_logger.py
"""
System audit logger.
Replaces server/utils/systemLogger.js
"""

import logging

from app.database import get_pool

logger = logging.getLogger("adani-flow.system_logger")


async def create_system_log(
    action_type: str,
    performed_by: int | None,
    target_entity: str,
    remarks: str | None = None,
):
    """Log an action to the system_logs table."""
    try:
        pool = await get_pool()
        await pool.execute(
            """INSERT INTO system_logs (action_type, performed_by, target_entity, remarks)
               VALUES ($1, $2, $3, $4)""",
            action_type,
            performed_by,
            target_entity,
            remarks,
        )
    except Exception as e:
        logger.error(f"Error creating system log: {e}")
        # Don't throw – logging failures shouldn't break the main operation
