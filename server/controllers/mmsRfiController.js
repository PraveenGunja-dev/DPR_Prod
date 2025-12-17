const pool = require('../db');

// Add a dynamic column to MMS & RFI sheets for a project
const addDynamicColumn = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { projectId, columnName, displayName, dataType, isRequired, defaultValue } = req.body;

    // Validate input
    if (!projectId || !columnName || !displayName) {
      return res.status(400).json({ message: 'Project ID, column name, and display name are required' });
    }

    // Check if column with this name already exists for this project
    const existingColumn = await pool.query(
      'SELECT id FROM mms_rfi_dynamic_columns WHERE project_id = $1 AND column_name = $2',
      [projectId, columnName]
    );

    if (existingColumn.rows.length > 0) {
      return res.status(400).json({ message: 'A column with this name already exists for this project' });
    }

    // Get the current max position for this project
    const positionResult = await pool.query(
      'SELECT COALESCE(MAX(position), -1) + 1 as next_position FROM mms_rfi_dynamic_columns WHERE project_id = $1',
      [projectId]
    );

    const nextPosition = positionResult.rows[0].next_position;

    // Insert the new column
    const result = await pool.query(
      `INSERT INTO mms_rfi_dynamic_columns 
       (project_id, column_name, display_name, data_type, is_required, default_value, position, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [projectId, columnName, displayName, dataType || 'text', isRequired || false, defaultValue || null, nextPosition, userId]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error adding dynamic column:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get all dynamic columns for a project's MMS & RFI sheets
const getDynamicColumns = async (req, res) => {
  try {
    const { projectId } = req.query;

    if (!projectId) {
      return res.status(400).json({ message: 'Project ID is required' });
    }

    const result = await pool.query(
      `SELECT * FROM mms_rfi_dynamic_columns 
       WHERE project_id = $1 AND is_active = true
       ORDER BY position`,
      [projectId]
    );

    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error getting dynamic columns:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Update a dynamic column
const updateDynamicColumn = async (req, res) => {
  try {
    const { columnId } = req.params;
    const { displayName, dataType, isRequired, defaultValue } = req.body;

    const result = await pool.query(
      `UPDATE mms_rfi_dynamic_columns 
       SET display_name = $1, data_type = $2, is_required = $3, default_value = $4, updated_at = CURRENT_TIMESTAMP
       WHERE id = $5
       RETURNING *`,
      [displayName, dataType || 'text', isRequired || false, defaultValue || null, columnId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Column not found' });
    }

    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error('Error updating dynamic column:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Delete a dynamic column (soft delete)
const deleteDynamicColumn = async (req, res) => {
  try {
    const { columnId } = req.params;

    // Soft delete by setting is_active to false
    const result = await pool.query(
      `UPDATE mms_rfi_dynamic_columns 
       SET is_active = false, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING *`,
      [columnId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Column not found' });
    }

    res.status(200).json({ message: 'Column deleted successfully' });
  } catch (error) {
    console.error('Error deleting dynamic column:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get draft entry for MMS & RFI sheet
const getMmsRfiDraftEntry = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { projectId } = req.query;

    if (!projectId) {
      return res.status(400).json({ message: 'Project ID is required' });
    }

    // Get today and yesterday dates
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const todayStr = today.toISOString().split('T')[0];
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    // Check if draft already exists for today
    let result = await pool.query(
      `SELECT * FROM mms_rfi_entries 
       WHERE supervisor_id = $1 
       AND project_id = $2 
       AND entry_date = $3
       AND status = 'draft'`,
      [userId, projectId, todayStr]
    );

    if (result.rows.length > 0) {
      return res.status(200).json(result.rows[0]);
    }

    // Check if there's a rejected entry for today (supervisor can edit)
    result = await pool.query(
      `SELECT * FROM mms_rfi_entries 
       WHERE supervisor_id = $1 
       AND project_id = $2 
       AND entry_date = $3
       AND status = 'rejected_by_pm'`,
      [userId, projectId, todayStr]
    );

    if (result.rows.length > 0) {
      // Return rejected entry as editable
      const rejectedEntry = {
        ...result.rows[0],
        isReadOnly: false,
        status: 'rejected_by_pm'
      };
      return res.status(200).json(rejectedEntry);
    }

    // Check if there's a submitted entry for today (supervisor can view but not edit)
    result = await pool.query(
      `SELECT * FROM mms_rfi_entries 
       WHERE supervisor_id = $1 
       AND project_id = $2 
       AND entry_date = $3
       AND status IN ('submitted_to_pm', 'approved_by_pm')`,
      [userId, projectId, todayStr]
    );

    if (result.rows.length > 0) {
      // Return submitted entry with read-only flag
      const submittedEntry = {
        ...result.rows[0],
        isReadOnly: true,
        readOnlyMessage: 'This entry has been submitted and cannot be edited.'
      };
      return res.status(200).json(submittedEntry);
    }

    // Get dynamic columns for this project to create empty data structure
    const columnsResult = await pool.query(
      'SELECT * FROM mms_rfi_dynamic_columns WHERE project_id = $1 AND is_active = true ORDER BY position',
      [projectId]
    );

    const columns = columnsResult.rows;

    // Create empty data structure with default values
    const emptyRow = {};
    
    // Add default columns
    emptyRow['rfiNo'] = '';
    emptyRow['subject'] = '';
    emptyRow['module'] = '';
    emptyRow['submittedDate'] = '';
    emptyRow['responseDate'] = '';
    emptyRow['status'] = '';
    emptyRow['remarks'] = '';
    
    // Add dynamic columns with default values
    columns.forEach(column => {
      emptyRow[column.column_name] = column.default_value || '';
    });

    // Create empty data with one row
    const emptyData = {
      rows: [emptyRow]
    };

    // Create new draft entry
    result = await pool.query(
      `INSERT INTO mms_rfi_entries 
       (project_id, supervisor_id, entry_date, previous_date, data_json, status)
       VALUES ($1, $2, $3, $4, $5, 'draft')
       RETURNING *`,
      [projectId, userId, todayStr, yesterdayStr, JSON.stringify(emptyData)]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error getting MMS & RFI draft entry:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Save draft entry data for MMS & RFI sheet
const saveMmsRfiDraftEntry = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { entryId, data } = req.body;

    // Verify ownership
    // Allow saving of both draft and rejected entries
    const checkResult = await pool.query(
      'SELECT * FROM mms_rfi_entries WHERE id = $1 AND supervisor_id = $2 AND status IN ($3, $4)',
      [entryId, userId, 'draft', 'rejected_by_pm']
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ message: 'Entry not found, access denied, or invalid status for saving' });
    }

    // Update entry data
    const result = await pool.query(
      `UPDATE mms_rfi_entries 
       SET data_json = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING *`,
      [JSON.stringify(data), entryId]
    );

    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error('Error saving MMS & RFI draft entry:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Submit entry for MMS & RFI sheet (Supervisor → PM)
const submitMmsRfiEntry = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { entryId } = req.body;

    console.log(`Supervisor ${userId} attempting to submit MMS & RFI entry ${entryId}`);

    // Verify ownership and status
    // Allow submission of both draft and rejected entries
    const checkResult = await pool.query(
      'SELECT * FROM mms_rfi_entries WHERE id = $1 AND supervisor_id = $2 AND status IN ($3, $4)',
      [entryId, userId, 'draft', 'rejected_by_pm']
    );

    if (checkResult.rows.length === 0) {
      console.log(`MMS & RFI entry ${entryId} not found or already submitted`);
      return res.status(404).json({ message: 'Entry not found, access denied, or invalid status for submission' });
    }

    // Update status to submitted_to_pm
    const result = await pool.query(
      `UPDATE mms_rfi_entries 
       SET status = 'submitted_to_pm', submitted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING *`,
      [entryId]
    );

    console.log(`MMS & RFI entry ${entryId} submitted successfully. Status: ${result.rows[0].status}`);
    res.status(200).json({ message: 'Entry submitted successfully', entry: result.rows[0] });
  } catch (error) {
    console.error('Error submitting MMS & RFI entry:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  addDynamicColumn,
  getDynamicColumns,
  updateDynamicColumn,
  deleteDynamicColumn,
  getMmsRfiDraftEntry,
  saveMmsRfiDraftEntry,
  submitMmsRfiEntry
};