const pool = require('../db');

// Create a new custom sheet
const createCustomSheet = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { projectId, name, description, columns } = req.body;

    // Validate input
    if (!projectId || !name || !columns || !Array.isArray(columns)) {
      return res.status(400).json({ message: 'Project ID, name, and columns are required' });
    }

    // Check if sheet with this name already exists for this project
    const existingSheet = await pool.query(
      'SELECT id FROM custom_sheets WHERE project_id = $1 AND name = $2',
      [projectId, name]
    );

    if (existingSheet.rows.length > 0) {
      return res.status(400).json({ message: 'A sheet with this name already exists for this project' });
    }

    // Begin transaction
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Create the custom sheet
      const sheetResult = await client.query(
        `INSERT INTO custom_sheets (project_id, name, description, created_by)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [projectId, name, description, userId]
      );

      const sheet = sheetResult.rows[0];

      // Create the columns
      for (let i = 0; i < columns.length; i++) {
        const column = columns[i];
        await client.query(
          `INSERT INTO custom_sheet_columns (sheet_id, name, display_name, data_type, is_required, default_value, position)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [sheet.id, column.name, column.displayName, column.dataType || 'text', column.isRequired || false, column.defaultValue || null, i]
        );
      }

      await client.query('COMMIT');

      // Return the created sheet with columns
      const columnsResult = await pool.query(
        'SELECT * FROM custom_sheet_columns WHERE sheet_id = $1 ORDER BY position',
        [sheet.id]
      );

      const sheetWithColumns = {
        ...sheet,
        columns: columnsResult.rows
      };

      res.status(201).json(sheetWithColumns);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error creating custom sheet:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get all custom sheets for a project
const getCustomSheets = async (req, res) => {
  try {
    const { projectId } = req.query;

    if (!projectId) {
      return res.status(400).json({ message: 'Project ID is required' });
    }

    const result = await pool.query(
      `SELECT cs.*, u.name as created_by_name
       FROM custom_sheets cs
       JOIN users u ON cs.created_by = u.user_id
       WHERE cs.project_id = $1 AND cs.is_active = true
       ORDER BY cs.created_at DESC`,
      [projectId]
    );

    // Get columns for each sheet
    const sheetsWithColumns = await Promise.all(result.rows.map(async (sheet) => {
      const columnsResult = await pool.query(
        'SELECT * FROM custom_sheet_columns WHERE sheet_id = $1 ORDER BY position',
        [sheet.id]
      );
      return {
        ...sheet,
        columns: columnsResult.rows
      };
    }));

    res.status(200).json(sheetsWithColumns);
  } catch (error) {
    console.error('Error getting custom sheets:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get a specific custom sheet by ID
const getCustomSheetById = async (req, res) => {
  try {
    const { sheetId } = req.params;

    const result = await pool.query(
      `SELECT cs.*, u.name as created_by_name
       FROM custom_sheets cs
       JOIN users u ON cs.created_by = u.user_id
       WHERE cs.id = $1 AND cs.is_active = true`,
      [sheetId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Custom sheet not found' });
    }

    const sheet = result.rows[0];

    // Get columns for the sheet
    const columnsResult = await pool.query(
      'SELECT * FROM custom_sheet_columns WHERE sheet_id = $1 ORDER BY position',
      [sheet.id]
    );

    const sheetWithColumns = {
      ...sheet,
      columns: columnsResult.rows
    };

    res.status(200).json(sheetWithColumns);
  } catch (error) {
    console.error('Error getting custom sheet:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Update a custom sheet
const updateCustomSheet = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { sheetId } = req.params;
    const { name, description, columns } = req.body;

    // Begin transaction
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Update the custom sheet
      const sheetResult = await client.query(
        `UPDATE custom_sheets 
         SET name = $1, description = $2, updated_at = CURRENT_TIMESTAMP
         WHERE id = $3
         RETURNING *`,
        [name, description, sheetId]
      );

      if (sheetResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ message: 'Custom sheet not found' });
      }

      // If columns are provided, update them
      if (columns && Array.isArray(columns)) {
        // Delete existing columns
        await client.query('DELETE FROM custom_sheet_columns WHERE sheet_id = $1', [sheetId]);

        // Create new columns
        for (let i = 0; i < columns.length; i++) {
          const column = columns[i];
          await client.query(
            `INSERT INTO custom_sheet_columns (sheet_id, name, display_name, data_type, is_required, default_value, position)
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [sheetId, column.name, column.displayName, column.dataType || 'text', column.isRequired || false, column.defaultValue || null, i]
          );
        }
      }

      await client.query('COMMIT');

      // Return the updated sheet with columns
      const columnsResult = await pool.query(
        'SELECT * FROM custom_sheet_columns WHERE sheet_id = $1 ORDER BY position',
        [sheetId]
      );

      const sheetWithColumns = {
        ...sheetResult.rows[0],
        columns: columnsResult.rows
      };

      res.status(200).json(sheetWithColumns);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error updating custom sheet:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Delete a custom sheet
const deleteCustomSheet = async (req, res) => {
  try {
    const { sheetId } = req.params;

    // Soft delete by setting is_active to false
    const result = await pool.query(
      `UPDATE custom_sheets 
       SET is_active = false, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING *`,
      [sheetId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Custom sheet not found' });
    }

    res.status(200).json({ message: 'Custom sheet deleted successfully' });
  } catch (error) {
    console.error('Error deleting custom sheet:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Add a column to an existing custom sheet
const addColumnToSheet = async (req, res) => {
  try {
    const { sheetId } = req.params;
    const { name, displayName, dataType, isRequired, defaultValue } = req.body;

    // Get the current max position for this sheet
    const positionResult = await pool.query(
      'SELECT COALESCE(MAX(position), -1) + 1 as next_position FROM custom_sheet_columns WHERE sheet_id = $1',
      [sheetId]
    );

    const nextPosition = positionResult.rows[0].next_position;

    // Insert the new column
    const result = await pool.query(
      `INSERT INTO custom_sheet_columns (sheet_id, name, display_name, data_type, is_required, default_value, position)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [sheetId, name, displayName, dataType || 'text', isRequired || false, defaultValue || null, nextPosition]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Custom sheet not found' });
    }

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error adding column to sheet:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Remove a column from an existing custom sheet
const removeColumnFromSheet = async (req, res) => {
  try {
    const { sheetId, columnId } = req.params;

    // Delete the column
    const result = await pool.query(
      'DELETE FROM custom_sheet_columns WHERE sheet_id = $1 AND id = $2 RETURNING *',
      [sheetId, columnId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Column not found' });
    }

    res.status(200).json({ message: 'Column removed successfully' });
  } catch (error) {
    console.error('Error removing column from sheet:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get draft entry for a custom sheet
const getCustomSheetDraftEntry = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { sheetId, projectId } = req.query;

    if (!sheetId || !projectId) {
      return res.status(400).json({ message: 'Sheet ID and Project ID are required' });
    }

    // Get today and yesterday dates
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const todayStr = today.toISOString().split('T')[0];
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    // Check if draft already exists for today
    let result = await pool.query(
      `SELECT * FROM custom_sheet_entries 
       WHERE sheet_id = $1 
       AND supervisor_id = $2 
       AND project_id = $3 
       AND entry_date = $4
       AND status = 'draft'`,
      [sheetId, userId, projectId, todayStr]
    );

    if (result.rows.length > 0) {
      return res.status(200).json(result.rows[0]);
    }

    // Check if there's a submitted entry for today (supervisor can view but not edit)
    result = await pool.query(
      `SELECT * FROM custom_sheet_entries 
       WHERE sheet_id = $1 
       AND supervisor_id = $2 
       AND project_id = $3 
       AND entry_date = $4
       AND status IN ('submitted_to_pm', 'approved_by_pm')`,
      [sheetId, userId, projectId, todayStr]
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

    // Get sheet columns to create empty data structure
    const columnsResult = await pool.query(
      'SELECT * FROM custom_sheet_columns WHERE sheet_id = $1 ORDER BY position',
      [sheetId]
    );

    const columns = columnsResult.rows;

    // Create empty data structure with default values
    const emptyRow = {};
    columns.forEach(column => {
      emptyRow[column.name] = column.default_value || '';
    });

    // Create empty data with one row
    const emptyData = {
      rows: [emptyRow]
    };

    // Create new draft entry
    result = await pool.query(
      `INSERT INTO custom_sheet_entries 
       (sheet_id, project_id, supervisor_id, entry_date, previous_date, data_json, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'draft')
       RETURNING *`,
      [sheetId, projectId, userId, todayStr, yesterdayStr, JSON.stringify(emptyData)]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error getting custom sheet draft entry:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Save draft entry data for a custom sheet
const saveCustomSheetDraftEntry = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { entryId, data } = req.body;

    // Verify ownership
    const checkResult = await pool.query(
      'SELECT * FROM custom_sheet_entries WHERE id = $1 AND supervisor_id = $2 AND status = $3',
      [entryId, userId, 'draft']
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ message: 'Draft entry not found or access denied' });
    }

    // Update entry data
    const result = await pool.query(
      `UPDATE custom_sheet_entries 
       SET data_json = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING *`,
      [JSON.stringify(data), entryId]
    );

    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error('Error saving custom sheet draft entry:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Submit entry for a custom sheet (Supervisor → PM)
const submitCustomSheetEntry = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { entryId } = req.body;

    console.log(`Supervisor ${userId} attempting to submit custom sheet entry ${entryId}`);

    // Verify ownership and status
    const checkResult = await pool.query(
      'SELECT * FROM custom_sheet_entries WHERE id = $1 AND supervisor_id = $2 AND status = $3',
      [entryId, userId, 'draft']
    );

    if (checkResult.rows.length === 0) {
      console.log(`Custom sheet entry ${entryId} not found or already submitted`);
      return res.status(404).json({ message: 'Draft entry not found or already submitted' });
    }

    // Update status to submitted_to_pm
    const result = await pool.query(
      `UPDATE custom_sheet_entries 
       SET status = 'submitted_to_pm', submitted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING *`,
      [entryId]
    );

    console.log(`Custom sheet entry ${entryId} submitted successfully. Status: ${result.rows[0].status}`);
    res.status(200).json({ message: 'Entry submitted successfully', entry: result.rows[0] });
  } catch (error) {
    console.error('Error submitting custom sheet entry:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  createCustomSheet,
  getCustomSheets,
  getCustomSheetById,
  updateCustomSheet,
  deleteCustomSheet,
  addColumnToSheet,
  removeColumnFromSheet,
  getCustomSheetDraftEntry,
  saveCustomSheetDraftEntry,
  submitCustomSheetEntry
};