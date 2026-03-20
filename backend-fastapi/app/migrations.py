# app/migrations.py
"""
Database migrations that run on startup.
Port of the runMigrations() function from Express server.js
"""

import logging

from app.database import get_pool

logger = logging.getLogger("adani-flow.migrations")


async def run_migrations():
    """Run all database migrations on startup. Matches Express server.js runMigrations()."""
    logger.info("Running database migrations...")
    pool = await get_pool()

    async def _exec(sql: str):
        """Execute a migration query, ignoring errors."""
        try:
            await pool.execute(sql)
        except Exception:
            pass  # Non-fatal migration errors

    try:
        # Drop FK constraints to support P6 projects
        await _exec("ALTER TABLE dpr_supervisor_entries DROP CONSTRAINT IF EXISTS dpr_supervisor_entries_project_id_fkey")
        await _exec("ALTER TABLE project_assignments DROP CONSTRAINT IF EXISTS project_assignments_project_id_fkey")

        # Ensure project_id is BIGINT for P6 ObjectIds
        await _exec("ALTER TABLE project_assignments ALTER COLUMN project_id TYPE BIGINT")
        await _exec("ALTER TABLE dpr_supervisor_entries ALTER COLUMN project_id TYPE BIGINT")
        await _exec("ALTER TABLE dpr_sheets ALTER COLUMN project_id TYPE BIGINT")

        # Add sheet_types column
        await _exec("ALTER TABLE project_assignments ADD COLUMN IF NOT EXISTS sheet_types JSONB")

        # Ensure p6_projects columns
        await _exec('ALTER TABLE p6_projects ADD COLUMN IF NOT EXISTS "Description" TEXT')
        await _exec('ALTER TABLE p6_projects ADD COLUMN IF NOT EXISTS "PlannedStartDate" TIMESTAMP WITH TIME ZONE')
        await _exec('ALTER TABLE p6_projects ADD COLUMN IF NOT EXISTS "PlannedFinishDate" TIMESTAMP WITH TIME ZONE')
        await _exec('ALTER TABLE p6_projects ADD COLUMN IF NOT EXISTS "DataDate" TIMESTAMP WITH TIME ZONE')

        # BIGINT conversions for P6 tables
        bigint_queries = [
            'ALTER TABLE p6_projects ALTER COLUMN "ObjectId" TYPE BIGINT',
            'ALTER TABLE p6_activities ALTER COLUMN "ObjectId" TYPE BIGINT',
            'ALTER TABLE p6_activities ALTER COLUMN "ProjectObjectId" TYPE BIGINT',
            'ALTER TABLE p6_activities ALTER COLUMN "WBSObjectId" TYPE BIGINT',
            "ALTER TABLE p6_wbs ALTER COLUMN object_id TYPE BIGINT",
            "ALTER TABLE p6_wbs ALTER COLUMN project_object_id TYPE BIGINT",
            "ALTER TABLE p6_wbs ALTER COLUMN parent_object_id TYPE BIGINT",
            "ALTER TABLE p6_resource_assignments ALTER COLUMN object_id TYPE BIGINT",
            "ALTER TABLE p6_resource_assignments ALTER COLUMN project_object_id TYPE BIGINT",
            "ALTER TABLE p6_resource_assignments ALTER COLUMN activity_object_id TYPE BIGINT",
            "ALTER TABLE p6_resource_assignments ALTER COLUMN resource_object_id TYPE BIGINT",
            'ALTER TABLE p6_activity_codes ALTER COLUMN "ObjectId" TYPE BIGINT',
            'ALTER TABLE p6_activity_code_assignments ALTER COLUMN "ObjectId" TYPE BIGINT',
            'ALTER TABLE p6_activity_code_assignments ALTER COLUMN "ActivityObjectId" TYPE BIGINT',
            'ALTER TABLE p6_activity_code_assignments ALTER COLUMN "ActivityCodeObjectId" TYPE BIGINT',
        ]
        for q in bigint_queries:
            await _exec(q)

        # Audit tracking fields on dpr_supervisor_entries
        await _exec("ALTER TABLE dpr_supervisor_entries ADD COLUMN IF NOT EXISTS submitted_by INTEGER REFERENCES users(user_id)")
        await _exec("ALTER TABLE dpr_supervisor_entries ADD COLUMN IF NOT EXISTS pm_reviewed_at TIMESTAMP")
        await _exec("ALTER TABLE dpr_supervisor_entries ADD COLUMN IF NOT EXISTS pm_reviewed_by INTEGER REFERENCES users(user_id)")
        await _exec("ALTER TABLE dpr_supervisor_entries ADD COLUMN IF NOT EXISTS rejection_reason TEXT")
        await _exec("ALTER TABLE dpr_supervisor_entries ADD COLUMN IF NOT EXISTS pushed_at TIMESTAMP")
        await _exec("ALTER TABLE dpr_supervisor_entries ADD COLUMN IF NOT EXISTS pushed_by INTEGER REFERENCES users(user_id)")

        # Cell comments table
        await _exec("""
            CREATE TABLE IF NOT EXISTS cell_comments (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                sheet_id INTEGER NOT NULL,
                row_index INTEGER NOT NULL,
                column_key VARCHAR(100) NOT NULL,
                parent_comment_id UUID REFERENCES cell_comments(id) ON DELETE CASCADE,
                comment_text TEXT NOT NULL,
                comment_type VARCHAR(20) NOT NULL CHECK (comment_type IN ('REJECTION', 'GENERAL')),
                created_by INTEGER NOT NULL REFERENCES users(user_id),
                role VARCHAR(50) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                is_deleted BOOLEAN DEFAULT FALSE
            )
        """)
        await _exec("CREATE INDEX IF NOT EXISTS idx_cell_comments_cell ON cell_comments(sheet_id, row_index, column_key)")
        await _exec("CREATE INDEX IF NOT EXISTS idx_cell_comments_sheet ON cell_comments(sheet_id)")
        await _exec("CREATE INDEX IF NOT EXISTS idx_cell_comments_parent ON cell_comments(parent_comment_id)")

        # P6 UDF columns and Activity Codes on p6_activities (legacy)
        for col, dtype in [("total_quantity", "DECIMAL(15,4)"), ("uom", "VARCHAR(50)"), ("block_capacity", "DECIMAL(15,4)"), ("phase", "VARCHAR(255)"), ("spv_no", "VARCHAR(100)"), ("scope", "TEXT"), ("hold", "VARCHAR(100)"), ("front", "VARCHAR(255)"), ("priority", "VARCHAR(255)"), ("plot", "VARCHAR(255)"), ("new_block_nom", "VARCHAR(255)")]:
            await _exec(f'ALTER TABLE p6_activities ADD COLUMN IF NOT EXISTS {col} {dtype}')

        # ─── Solar-specific tables (type-specific, snake_case) ───
        await _exec("""
            CREATE TABLE IF NOT EXISTS solar_activities (
                object_id           BIGINT PRIMARY KEY,
                activity_id         VARCHAR(50),
                name                VARCHAR(500),
                status              VARCHAR(50),
                activity_type       VARCHAR(50),
                project_object_id   BIGINT,
                wbs_object_id       BIGINT,
                wbs_name            VARCHAR(255),
                planned_start       TIMESTAMPTZ,
                planned_finish      TIMESTAMPTZ,
                start_date          TIMESTAMPTZ,
                finish_date         TIMESTAMPTZ,
                actual_start        TIMESTAMPTZ,
                actual_finish       TIMESTAMPTZ,
                baseline_start      TIMESTAMPTZ,
                baseline_finish     TIMESTAMPTZ,
                balance             DECIMAL(15,4),
                cumulative          DECIMAL(15,4),
                percent_complete    DECIMAL(5,2),
                physical_percent_complete DECIMAL(5,2),
                planned_duration    DECIMAL(10,1),
                remaining_duration  DECIMAL(10,1),
                actual_duration     DECIMAL(10,1),
                primary_resource    VARCHAR(255),
                total_quantity      DECIMAL(15,4),
                uom                 VARCHAR(50),
                priority            DECIMAL(10,2),
                scope               TEXT,
                weightage           DECIMAL(10,2),
                phase               VARCHAR(100),
                discipline          VARCHAR(100),
                block_capacity      DECIMAL(10,2) DEFAULT 12.5,
                spv_no              VARCHAR(100),
                hold                VARCHAR(100),
                front               VARCHAR(255),
                plot                VARCHAR(255),
                new_block_nom       VARCHAR(255),
                last_sync_at        TIMESTAMPTZ DEFAULT NOW()
            )
        """)
        await _exec("CREATE INDEX IF NOT EXISTS idx_solar_act_project ON solar_activities(project_object_id)")
        await _exec("CREATE INDEX IF NOT EXISTS idx_solar_act_wbs ON solar_activities(wbs_object_id)")

        await _exec("""
            CREATE TABLE IF NOT EXISTS solar_wbs (
                object_id           BIGINT PRIMARY KEY,
                name                VARCHAR(255),
                code                VARCHAR(50),
                parent_object_id    BIGINT,
                project_object_id   BIGINT,
                status              VARCHAR(50)
            )
        """)
        await _exec("CREATE INDEX IF NOT EXISTS idx_solar_wbs_project ON solar_wbs(project_object_id)")

        await _exec("""
            CREATE TABLE IF NOT EXISTS solar_resource_assignments (
                object_id           BIGINT PRIMARY KEY,
                activity_object_id  BIGINT,
                resource_object_id  BIGINT,
                resource_id         VARCHAR(50),
                resource_name       VARCHAR(255),
                resource_type       VARCHAR(50),
                planned_units       DECIMAL(15,2),
                actual_units        DECIMAL(15,2),
                remaining_units     DECIMAL(15,2),
                budget_at_completion_units DECIMAL(15,2),
                project_object_id   BIGINT
            )
        """)
        await _exec("CREATE INDEX IF NOT EXISTS idx_solar_ra_activity ON solar_resource_assignments(activity_object_id)")
        await _exec("CREATE INDEX IF NOT EXISTS idx_solar_ra_project ON solar_resource_assignments(project_object_id)")

        # Issue logs table
        await _exec("""
            CREATE TABLE IF NOT EXISTS issue_logs (
                id SERIAL PRIMARY KEY, project_id INTEGER, entry_id INTEGER,
                sheet_type VARCHAR(50), issue_type VARCHAR(50) NOT NULL DEFAULT 'general',
                title VARCHAR(255) NOT NULL, description TEXT NOT NULL,
                priority VARCHAR(20) NOT NULL DEFAULT 'medium', status VARCHAR(20) NOT NULL DEFAULT 'open',
                created_by INTEGER NOT NULL, assigned_to INTEGER,
                resolved_by INTEGER, resolved_at TIMESTAMP, resolution_notes TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        await _exec("CREATE INDEX IF NOT EXISTS idx_issue_logs_status ON issue_logs(status)")
        await _exec("CREATE INDEX IF NOT EXISTS idx_issue_logs_priority ON issue_logs(priority)")
        await _exec("CREATE INDEX IF NOT EXISTS idx_issue_logs_created_at ON issue_logs(created_at)")

        # Daily progress table
        await _exec("""
            CREATE TABLE IF NOT EXISTS dpr_daily_progress (
                id SERIAL PRIMARY KEY, activity_object_id BIGINT NOT NULL,
                progress_date DATE NOT NULL, today_value DECIMAL(15,4) DEFAULT 0,
                cumulative_value DECIMAL(15,4) DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(activity_object_id, progress_date)
            )
        """)
        await _exec("CREATE INDEX IF NOT EXISTS idx_dpr_daily_progress_date ON dpr_daily_progress(progress_date)")
        await _exec("CREATE INDEX IF NOT EXISTS idx_dpr_daily_progress_activity ON dpr_daily_progress(activity_object_id)")

        # SSO columns
        await _exec("ALTER TABLE users ADD COLUMN IF NOT EXISTS sso_provider VARCHAR(50)")
        await _exec("ALTER TABLE users ADD COLUMN IF NOT EXISTS azure_oid VARCHAR(255)")

        # Update role constraint
        await _exec("ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check")
        await _exec("ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('supervisor', 'Site PM', 'PMAG', 'admin', 'Super Admin', 'pending_approval'))")

        # Make password nullable for SSO
        await _exec("ALTER TABLE users ALTER COLUMN password DROP NOT NULL")

        # Access requests table
        await _exec("""
            CREATE TABLE IF NOT EXISTS access_requests (
                id SERIAL PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
                requested_role VARCHAR(50) NOT NULL, justification TEXT,
                status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
                reviewed_by INTEGER REFERENCES users(user_id) ON DELETE SET NULL, review_notes TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, reviewed_at TIMESTAMP
            )
        """)
        await _exec("CREATE INDEX IF NOT EXISTS idx_access_requests_status ON access_requests(status)")
        await _exec("CREATE INDEX IF NOT EXISTS idx_access_requests_user_id ON access_requests(user_id)")

        logger.info("✓ Migrations completed successfully")

    except Exception as e:
        logger.error(f"Migration error (non-fatal): {e}")
