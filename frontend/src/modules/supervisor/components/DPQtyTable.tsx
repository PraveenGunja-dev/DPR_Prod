import { useState, useEffect, memo, useCallback, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Save } from "lucide-react";
import { StyledExcelTable } from "@/components/StyledExcelTable";
import { getTodayAndYesterday } from "@/modules/auth/services/dprSupervisorService";
import { toast } from "sonner";
import { StatusChip } from "@/components/StatusChip";
import { fetchDpQtyData } from "@/modules/supervisor/services/mockDataService";

interface DPQtyData {
  slNo: string;
  description: string;
  totalQuantity: string;
  uom: string;
  basePlanStart: string;
  basePlanFinish: string;
  forecastStart: string;
  forecastFinish: string;
  actualStart: string;
  actualFinish: string;
  remarks: string;
  balance: string;
  cumulative: string;
  yesterday?: string; // Number value, not editable
  today?: string; // Number value, editable
}

interface DPQtyTableProps {
  data: DPQtyData[];
  setData: React.Dispatch<React.SetStateAction<DPQtyData[]>>;
  onSave: () => void;
  onSubmit?: () => void;
  yesterday: string;
  today: string;
  isLocked?: boolean;
  status?: 'draft' | 'submitted_to_pm' | 'approved_by_pm' | 'rejected_by_pm' | 'final_approved';
  projectId?: number; // Add projectId prop for P6 integration
  useMockData?: boolean; // Flag to use mock data
}

export const DPQtyTable = memo(({ data, setData, onSave, onSubmit, yesterday, today, isLocked = false, status = 'draft', projectId, useMockData = false }: DPQtyTableProps) => {
  const { today: currentDate, yesterday: previousDate } = getTodayAndYesterday();

  // Fetch data from Oracle P6 ONLY if data is empty and useMockData is true
  // When useMockData is false, data comes from parent component (DPRDashboard)
  useEffect(() => {
    const fetchData = async () => {
      // Skip if data is already provided by parent
      if (!useMockData && data.length > 0) {
        console.log('DPQtyTable: Using data from parent', data.length, 'rows');
        return;
      }

      if (useMockData) {
        // Fetch from mock API
        try {
          const mockData = await fetchDpQtyData();
          setData(mockData);
        } catch (error) {
          console.error('Error fetching mock data:', error);
        }
      }
      // When useMockData is false, data is provided by parent (DPRDashboard) via P6 activities
    };

    fetchData();
  }, [projectId, useMockData, data.length, setData]); // Added data.length and setData to deps

  // Convert data to the format expected by ExcelTable - memoized
  const columns = useMemo(() => [
    "Description (p6)",
    "Total Quantity (p6 edit)",
    "UOM (p6 edit)",
    "Balance (auto)",
    "Base Plan Start (p6)",
    "Base Plan Finish (p6)",
    "Actual Start (p6 edit)",
    "Actual Finish (p6 edit)",
    "Forecast Start (p6)",
    "Forecast Finish (p6)",
    "Remarks (user)",
    "Cumulative (auto)",
    yesterday,
    today
  ], [yesterday, today]);

  // Define column widths for better alignment - memoized
  const columnWidths = useMemo(() => ({
    "Description (p6)": 150,
    "Total Quantity (p6 edit)": 80,
    "UOM (p6 edit)": 60,
    "Balance (auto)": 70,
    "Base Plan Start (p6)": 80,
    "Base Plan Finish (p6)": 80,
    "Actual Start (p6 edit)": 80,
    "Actual Finish (p6 edit)": 80,
    "Forecast Start (p6)": 80,
    "Forecast Finish (p6)": 80,
    "Remarks (user)": 100,
    "Cumulative (auto)": 70,
    [yesterday]: 70,
    [today]: 70
  }), [yesterday, today]);

  // Define which columns are editable by the user - memoized
  const editableColumns = useMemo(() => [
    "Total Quantity (p6 edit)",
    "UOM (p6 edit)",
    "Actual Start (p6 edit)",
    "Actual Finish (p6 edit)",
    "Remarks (user)",
    today // Today value is editable
  ], [today]);

  // Convert array of objects to array of arrays - memoized
  const tableData = useMemo(() => data.map(row => [
    row.description,
    row.totalQuantity,
    row.uom,
    row.balance,
    row.basePlanStart,
    row.basePlanFinish,
    row.actualStart,
    row.actualFinish,
    row.forecastStart,
    row.forecastFinish,
    row.remarks,
    row.cumulative,
    row.yesterday || "", // Number value for yesterday
    row.today || "" // Number value for today (editable)
  ]), [data]);

  // Handle data changes from ExcelTable - memoized
  const handleDataChange = useCallback((newData: any[][]) => {
    // Convert array of arrays back to array of objects
    const updatedData = newData.map(row => ({
      slNo: "", // Keep for compatibility but not displayed
      description: row[0] || "",
      totalQuantity: row[1] || "",
      uom: row[2] || "",
      balance: row[3] || "",
      basePlanStart: row[4] || "",
      basePlanFinish: row[5] || "",
      actualStart: row[6] || "",
      actualFinish: row[7] || "",
      forecastStart: row[8] || "",
      forecastFinish: row[9] || "",
      remarks: row[10] || "",
      cumulative: row[11] || "",
      yesterday: row[12] || "", // Number value for yesterday (not editable)
      today: row[13] || "" // Number value for today (editable)
    }));
    setData(updatedData);
  }, [setData]);

  return (
    <div className="space-y-4 w-full">
      <div className="bg-muted p-3 rounded-lg border border-gray-200 dark:border-gray-700">
        <h3 className="font-bold text-base mb-1">Project Information</h3>
        <p className="font-medium text-sm">PLOT - A-06 135 MW - KHAVDA HYBRID SOLAR PHASE 3 (YEAR 2025-26)</p>
      </div>

      <StyledExcelTable
        title="DP Qty Table"
        columns={columns}
        data={tableData}
        onDataChange={handleDataChange}
        onSave={onSave}
        onSubmit={onSubmit}
        isReadOnly={isLocked}
        editableColumns={editableColumns}
        columnTypes={{
          "Description (p6)": "text",
          "Total Quantity (p6 edit)": "number",
          "UOM (p6 edit)": "text",
          "Balance (auto)": "number",
          "Base Plan Start (p6)": "date",
          "Base Plan Finish (p6)": "date",
          "Actual Start (p6 edit)": "date",
          "Actual Finish (p6 edit)": "date",
          "Forecast Start (p6)": "date",
          "Forecast Finish (p6)": "date",
          "Remarks (user)": "text",
          "Cumulative (auto)": "number",
          [yesterday]: "number", // Number value, not editable
          [today]: "number" // Number value, editable
        }}
        columnWidths={columnWidths}
        columnTextColors={{
          "Actual Start (p6 edit)": "#00B050",
          "Actual Finish (p6 edit)": "#00B050",
          "Forecast Start (p6)": "#0070C0",
          "Forecast Finish (p6)": "#0070C0"
        }}
        columnFontWeights={{
          "Actual Start (p6 edit)": "bold",
          "Actual Finish (p6 edit)": "bold",
          "Forecast Start (p6)": "bold",
          "Forecast Finish (p6)": "bold"
        }}
        headerStructure={[
          // First header row - main column names
          [
            { label: "Description (p6)", colSpan: 1 },
            { label: "Total Quantity (p6 edit)", colSpan: 1 },
            { label: "UOM (p6 edit)", colSpan: 1 },
            { label: "Balance (auto)", colSpan: 1 },
            { label: "Base Plan Start (p6)", colSpan: 1 },
            { label: "Base Plan Finish (p6)", colSpan: 1 },
            { label: "Actual Start (p6 edit)", colSpan: 1 },
            { label: "Actual Finish (p6 edit)", colSpan: 1 },
            { label: "Forecast Start (p6)", colSpan: 1 },
            { label: "Forecast Finish (p6)", colSpan: 1 },
            { label: "Remarks (user)", colSpan: 1 },
            { label: "Cumulative (auto)", colSpan: 1 },
            { label: yesterday, colSpan: 1 },
            { label: today, colSpan: 1 }
          ]
        ]}
        status={status} // Pass status to StyledExcelTable
      />
    </div>
  );
});