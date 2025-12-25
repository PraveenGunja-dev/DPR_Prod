import { useState, useEffect } from "react";
import { StyledExcelTable } from "@/components/StyledExcelTable";
import { StatusChip } from "@/components/StatusChip";
import { fetchDpVendorIdtData } from "@/modules/supervisor/services/mockDataService";

interface DPVendorIdtData {
  // From P6 API
  activityId: string;
  activities: string;
  plot: string;
  newBlockNom: string;
  baselinePriority: string;
  scope: string;
  front: string;
  
  // User-editable fields
  priority: string;
  contractorName: string;
  remarks: string;
  
  // Calculated fields
  actual: string;
  completionPercentage: string;
  
  // Date values
  yesterdayValue?: string; // Number value, not editable
  todayValue?: string; // Number value, editable
  
  // Category row fields
  category?: string;
  isCategoryRow?: boolean;
}

interface DPVendorIdtTableProps {
  data: DPVendorIdtData[];
  setData: (data: DPVendorIdtData[]) => void;
  onSave: () => void;
  onSubmit?: () => void;
  yesterday: string;
  today: string;
  isLocked?: boolean;
  status?: string; // Add status prop
  useMockData?: boolean; // Flag to use mock data
}

export function DPVendorIdtTable({ 
  data, 
  setData, 
  onSave, 
  onSubmit, 
  yesterday, 
  today, 
  isLocked = false,
  status = 'draft', // Add status prop with default
  useMockData = false // Flag to use mock data
}: DPVendorIdtTableProps) {
  // Fetch data from mock API when component mounts or when useMockData changes
  useEffect(() => {
    const fetchData = async () => {
      if (useMockData) {
        try {
          const mockData = await fetchDpVendorIdtData();
          setData(mockData);
        } catch (error) {
          console.error('Error fetching mock data:', error);
        }
      }
    };

    fetchData();
  }, [setData, useMockData, data.length]); // Add data.length to dependencies to trigger reload when data changes
  
  // Define columns
  const columns = [
    "Activity_ID(p6)",
    "Activities(p6)",
    "Plot(p6)",
    "New Block Nom(p6)",
    "Priority(user)",
    "Baseline Priority(p6)",
    "Contractor Name(user)",
    "Scope(p6)edit",
    "Front(p6)edit",
    "Actual(calc)",
    "% Completion(calc)",
    "Remarks(user)",
    yesterday, // Number value, not editable
    today // Number value, editable
  ];
  
  // Convert array of objects to array of arrays
  const tableData = data.map(row => {
    if (row.isCategoryRow) {
      // Category row - only show category in first column, rest empty
      return [
        row.category || '',
        '', '', '', '', '', '', '', '', '', '', '',
        '', ''
      ];
    } else {
      // Activity row - show all data
      return [
        row.activityId || '',
        row.activities || '',
        row.plot || '',
        row.newBlockNom || '',
        row.priority || '',
        row.baselinePriority || '',
        row.contractorName || '',
        row.scope || '',
        row.front || '',
        row.actual || '',
        row.completionPercentage || '',
        row.remarks || '',
        row.yesterdayValue || '', // Number value for yesterday
        row.todayValue || '' // Number value for today (editable)
      ];
    }
  });
  
  // Create row styles for category rows
  const rowStyles: Record<number, any> = {};
  data.forEach((row, index) => {
    if (row.isCategoryRow) {
      rowStyles[index] = {
        backgroundColor: '#49415B',
        color: '#fffff',
        fontWeight: 'bold'
      };
    }
  });

  // Handle data changes from ExcelTable
  const handleDataChange = (newData: any[][]) => {
    // Convert array of arrays back to array of objects
    const updatedData = newData.map((row, index) => {
      const originalRow = data[index];
      
      if (originalRow?.isCategoryRow) {
        // Category row - preserve category data
        return {
          ...originalRow,
          category: row[0] || ''
        };
      } else {
        // Activity row - update all fields
        return {
          activityId: row[0] || '',
          activities: row[1] || '',
          plot: row[2] || '',
          newBlockNom: row[3] || '',
          priority: row[4] || '',
          baselinePriority: row[5] || '',
          contractorName: row[6] || '',
          scope: row[7] || '',
          front: row[8] || '',
          actual: row[9] || '',
          completionPercentage: row[10] || '',
          remarks: row[11] || '',
          yesterdayValue: row[12] || '', // Number value for yesterday (not editable)
          todayValue: row[13] || '' // Number value for today (editable)
        };
      }
    });
    setData(updatedData);
  };

  // Define which columns are editable
  const editableColumns = [
    "Priority(user)",
    "Contractor Name(user)",
    "Scope(p6)edit",
    "Front(p6)edit",
    "Remarks(user)",
    today // Number value, editable
  ];

  // Define column types
  const columnTypes: Record<string, 'text' | 'number' | 'date'> = {
    "Activity_ID(p6)": "text",
    "Activities(p6)": "text",
    "Plot(p6)": "text",
    "New Block Nom(p6)": "text",
    "Priority(user)": "text",
    "Baseline Priority(p6)": "text",
    "Contractor Name(user)": "text",
    "Scope(p6)edit": "number",
    "Front(p6)edit": "number",
    "Actual(calc)": "number",
    "% Completion(calc)": "number",
    "Remarks(user)": "text",
    [yesterday]: "number", // Number value, not editable
    [today]: "number" // Number value, editable
  };

  // Define column widths for better alignment
  const columnWidths = {
    "Activity_ID(p6)": 40,
    "Activities(p6)": 120,
    "Plot(p6)": 60,
    "New Block Nom(p6)": 80,
    "Priority(user)": 60,
    "Baseline Priority(p6)": 80,
    "Contractor Name(user)": 80,
    "Scope(p6)edit": 60,
    "Front(p6)edit": 60,
    "Actual(calc)": 60,
    "% Completion(calc)": 60,
    "Remarks(user)": 100,
    [yesterday]: 60,
    [today]: 60
  };

  return (
    <div className="space-y-2 w-full">
      <StyledExcelTable
        title="DP Vendor IDT Table"
        columns={columns}
        data={tableData}
        onDataChange={handleDataChange}
        onSave={onSave}
        onSubmit={onSubmit}
        isReadOnly={isLocked}
        editableColumns={editableColumns}
        columnTypes={columnTypes}
        columnWidths={columnWidths}
        columnTextColors={{
          "% Completion(calc)": "#74DB4B"
        }}
        columnFontWeights={{
          "% Completion(calc)": "bold"
        }}
        rowStyles={rowStyles}
        headerStructure={[
          // First header row - main column names
          [
            { label: "Activity_ID(p6)", colSpan: 1 },
            { label: "Activities(p6)", colSpan: 1 },
            { label: "Plot(p6)", colSpan: 1 },
            { label: "New Block Nom(p6)", colSpan: 1 },
            { label: "Priority(user)", colSpan: 1 },
            { label: "Baseline Priority(p6)", colSpan: 1 },
            { label: "Contractor Name(user)", colSpan: 1 },
            { label: "Scope(p6)edit", colSpan: 1 },
            { label: "Front(p6)edit", colSpan: 1 },
            { label: "Actual(calc)", colSpan: 1 },
            { label: "% Completion(calc)", colSpan: 1 },
            { label: "Remarks(user)", colSpan: 1 },
            { label: yesterday, colSpan: 1 },
            { label: today, colSpan: 1 }
          ]
        ]}
        status={status} // Pass status to StyledExcelTable
      />
    </div>
  );
}