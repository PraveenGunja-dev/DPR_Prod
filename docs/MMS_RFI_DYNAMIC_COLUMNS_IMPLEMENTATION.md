# MMS & RFI Dynamic Columns Implementation

This document describes the implementation of dynamic columns functionality for the existing MMS & RFI sheets in the Adani Flow system.

## Overview

The implementation adds the ability for supervisors to dynamically add custom columns to the MMS & RFI sheets on a per-project basis. This allows for flexible data collection without requiring code changes.

## Components Implemented

### 1. Database Schema

Created `server/database/mms_rfi_dynamic_columns_schema.sql` with two new tables:

- `mms_rfi_dynamic_columns`: Stores dynamic column definitions for each project
- `mms_rfi_entries`: Stores the actual data entries with dynamic columns

### 2. Backend API

Created new backend components:

- `server/controllers/mmsRfiController.js`: Controller with endpoints for:
  - Adding dynamic columns
  - Retrieving dynamic columns
  - Updating dynamic columns
  - Deleting dynamic columns
  - Managing MMS & RFI sheet entries (draft, save, submit)

- `server/routes/mmsRfi.js`: Routes for the new endpoints

- Updated `server/server.js` to register the new routes

### 3. Frontend Service

Created `src/modules/auth/services/mmsRfiService.ts` with functions for:

- Managing dynamic columns (add, get, update, delete)
- Managing sheet entries (get draft, save, submit)

Updated `src/modules/auth/contexts/AuthContext.tsx` to include the new service in token management.

### 4. Frontend Component

Created `src/modules/supervisor/components/MmsModuleRfiTableWithDynamicColumns.tsx`:

- Extends the existing MMS & RFI functionality with dynamic columns
- Provides UI for managing dynamic columns
- Integrates with the StyledExcelTable component for data entry
- Handles saving and submitting entries with dynamic columns

### 5. Integration

Updated `src/modules/supervisor/SupervisorDashboard.tsx` to use the new component when:
- A project ID is available
- A user ID is available

Fallback to the original component when these are not available.

### 6. Database Initialization

Updated `server/init-database.js` to include the new schema during database initialization.

## API Endpoints

### Dynamic Columns Management

- `POST /api/mms-rfi/dynamic-columns` - Add a new dynamic column
- `GET /api/mms-rfi/dynamic-columns` - Get all dynamic columns for a project
- `PUT /api/mms-rfi/dynamic-columns/:columnId` - Update a dynamic column
- `DELETE /api/mms-rfi/dynamic-columns/:columnId` - Delete a dynamic column

### MMS & RFI Entries

- `GET /api/mms-rfi/entries/draft` - Get or create a draft entry
- `POST /api/mms-rfi/entries/save-draft` - Save a draft entry
- `POST /api/mms-rfi/entries/submit` - Submit an entry to PM

## Features

1. **Dynamic Column Management**:
   - Add new columns with custom names, display names, data types (text, number, date, boolean)
   - Set default values for new columns
   - Mark columns as required
   - Remove existing columns

2. **Data Persistence**:
   - All dynamic column definitions are stored per project
   - Entry data is stored with full JSON structure including dynamic columns
   - Proper status management (draft, submitted_to_pm, etc.)

3. **User Interface**:
   - Manage Columns dialog for adding/removing dynamic columns
   - Visual display of active dynamic columns
   - Integration with existing StyledExcelTable component
   - Proper data type handling in the table (dates, numbers, text)

4. **Security**:
   - All endpoints protected with authentication
   - Proper ownership verification for entries
   - Column management restricted to project owners

## Usage

1. Navigate to the MMS & RFI tab in the Supervisor Dashboard
2. Click "Manage Columns" to add new dynamic columns
3. Fill in column details (name, display name, data type, etc.)
4. The table will automatically update to include the new columns
5. Enter data in the table as usual
6. Save or submit the entry as needed

## Data Structure

### Dynamic Column Definition

```json
{
  "id": 1,
  "project_id": 1,
  "column_name": "priority",
  "display_name": "Priority",
  "data_type": "text",
  "is_required": false,
  "default_value": null,
  "position": 0,
  "created_by": 1,
  "created_at": "2025-12-13T10:00:00Z",
  "updated_at": "2025-12-13T10:00:00Z",
  "is_active": true
}
```

### Entry Data

```json
{
  "id": 1,
  "project_id": 1,
  "supervisor_id": 1,
  "entry_date": "2025-12-13",
  "previous_date": "2025-12-12",
  "data_json": {
    "rows": [
      {
        "rfiNo": "RFI-001",
        "subject": "Foundation work",
        "module": "Module A",
        "submittedDate": "2025-12-10",
        "responseDate": "2025-12-12",
        "status": "Approved",
        "remarks": "Good progress",
        "yesterdayValue": "5",
        "todayValue": "7",
        "priority": "High",  // Dynamic column
        "assignedTo": "John Doe"  // Another dynamic column
      }
    ]
  },
  "status": "draft",
  "submitted_at": null,
  "updated_at": "2025-12-13T10:00:00Z",
  "created_at": "2025-12-13T09:00:00Z"
}
```

## Future Enhancements

1. Column reordering functionality
2. Column editing after creation
3. Data validation rules for dynamic columns
4. Export functionality including dynamic columns
5. Bulk operations for column management