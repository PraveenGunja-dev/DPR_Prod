-- Migration: Create cell_comments table for cell-level commenting feature
-- Run this migration to enable Excel-style cell commenting for PM rejection workflow

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

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
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_cell_comments_cell ON cell_comments(sheet_id, row_index, column_key);
CREATE INDEX IF NOT EXISTS idx_cell_comments_sheet ON cell_comments(sheet_id);
CREATE INDEX IF NOT EXISTS idx_cell_comments_parent ON cell_comments(parent_comment_id);
CREATE INDEX IF NOT EXISTS idx_cell_comments_deleted ON cell_comments(is_deleted);

-- Comment: This table stores cell-level comments for the DPR/MIS workflow
-- sheet_id: References dpr_supervisor_entries.id
-- row_index: 0-based index of the row in the data table
-- column_key: The key/name of the column (e.g., "description", "quantity")
-- parent_comment_id: For threaded replies, references the parent comment
-- comment_type: REJECTION for PM rejection comments, GENERAL for other comments
-- created_by: User who created the comment
-- role: Role of the user (Site PM, supervisor, etc.)
-- is_deleted: Soft delete flag for audit trail
