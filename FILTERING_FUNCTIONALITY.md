# Filtering Functionality in DPR Dashboard

## Overview

The DPR dashboard tables now include filtering capabilities to help users navigate and analyze large datasets more efficiently. This feature addresses the requirement to "include a filter function to allow users to control and narrow displayed data, especially as incoming data volume exceeds sample size."

## How to Use Filtering

### 1. Accessing Filters

- Each table in the supervisor dashboard now has a "Filters" button in the header toolbar
- Click this button to reveal filter input fields below the column headers
- The filter row will appear with an input field for each column

### 2. Applying Filters

- Type text into any column's filter input to filter that column
- Filters are applied in real-time as you type
- Multiple column filters can be used simultaneously
- Only rows that match ALL active filters will be displayed

### 3. Managing Filters

- Click "Clear Filters" to reset all filter inputs (appears when any filter has a value)
- Click "Filters" again to hide the filter row when not in use
- Filter counts in the header show both filtered results and total rows

### 4. Viewing Results

- The table dynamically updates to show only matching rows
- Row counts in the header and status bar show both filtered and total counts
- Example: "5 of 25 rows × 10 columns" means 5 rows match your filters out of 25 total rows

## Benefits

1. **Efficient Data Navigation**: Quickly find specific records in large datasets
2. **Multi-Column Filtering**: Filter by multiple criteria simultaneously
3. **Real-Time Feedback**: See filtered results immediately as filters are typed
4. **Easy Reset**: One-click clearing of all filters
5. **Visual Indicators**: Clear display of filtered vs. total row counts

## Technical Implementation

The filtering functionality was added to the `StyledExcelTable` component, which is used by all table components in the supervisor dashboard:

- DP Qty Table
- Manpower Details Table
- DP Block Table
- DP Vendor IDT Table
- MMS & Module RFI Table

This means all tables automatically inherit the filtering capability without requiring individual modifications.