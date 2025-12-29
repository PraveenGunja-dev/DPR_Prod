import { useState, useEffect, memo, useCallback, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Save } from "lucide-react";
import { StyledExcelTable } from "@/components/StyledExcelTable";
import { getTodayAndYesterday } from "@/modules/auth/services/dprSupervisorService";
import { toast } from "sonner";
import { StatusChip } from "@/components/StatusChip";
import { fetchDpQtyData } from "@/modules/supervisor/services/mockDataService";
import { HyperFormula } from "hyperformula";

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

  // HyperFormula Integration
  // HyperFormula Integration
  const hfInstance = useMemo(() => {
    return HyperFormula.buildEmpty({
      licenseKey: 'gpl-v3',
    });
  }, []);

  const sheetNameRef = useMemo(() => 'Sheet1', []);

  // Column Indices (0-based) to match tableData
  // Added BASE_CUMULATIVE at index 14 to store the original cumulative value
  const COL = useMemo(() => ({
    DESCRIPTION: 0,
    TOTAL_QTY: 1,
    UOM: 2,
    BALANCE: 3,
    BASE_PLAN_START: 4,
    BASE_PLAN_FINISH: 5,
    ACTUAL_START: 6,
    ACTUAL_FINISH: 7,
    FORECAST_START: 8,
    FORECAST_FINISH: 9,
    REMARKS: 10,
    CUMULATIVE: 11,
    YESTERDAY: 12,
    TODAY: 13,
    BASE_CUMULATIVE: 14  // Hidden column to store original cumulative (before today's entry)
  }), []);

  // Initialize HyperFormula with data
  useEffect(() => {
    if (data.length === 0) return;

    if (!hfInstance.doesSheetExist(sheetNameRef)) {
      hfInstance.addSheet(sheetNameRef);
      const sheetId = hfInstance.getSheetId(sheetNameRef);
      if (sheetId === undefined) return;

      const sheetData = data.map((row, rowIndex) => {
        const rowNum = rowIndex + 1;

        // Cumulative Formula: = Base Cumulative (O) + Today (N)
        // Where O is column 14 (BASE_CUMULATIVE) and N is column 13 (TODAY)
        const cumulativeFormula = `=O${rowNum} + N${rowNum}`;

        // Balance Formula: = Total Quantity (B) - Cumulative (L)
        const balanceFormula = `=B${rowNum} - L${rowNum}`;

        // Base Cumulative is the initial cumulative value from data (before today's entry)
        // If today already has a value, we need to subtract it to get the base
        const initialCumulative = Number(row.cumulative) || 0;
        const initialToday = Number(row.today) || 0;
        // Base = Current Cumulative - Today (to get cumulative up to yesterday)
        const baseCumulative = initialCumulative - initialToday;

        return [
          row.description,                    // 0 - A
          Number(row.totalQuantity) || 0,     // 1 - B (Total Quantity)
          row.uom,                            // 2 - C
          balanceFormula,                     // 3 - D (Balance = B - L)
          row.basePlanStart,                  // 4 - E
          row.basePlanFinish,                 // 5 - F
          row.actualStart,                    // 6 - G
          row.actualFinish,                   // 7 - H
          row.forecastStart,                  // 8 - I
          row.forecastFinish,                 // 9 - J
          row.remarks,                        // 10 - K
          cumulativeFormula,                  // 11 - L (Cumulative = O + N)
          Number(row.yesterday) || 0,         // 12 - M (Yesterday)
          Number(row.today) || 0,             // 13 - N (Today - editable)
          baseCumulative                      // 14 - O (Base Cumulative - hidden, stores original)
        ];
      });

      hfInstance.setSheetContent(sheetId, sheetData);
    }
  }, [data.length, hfInstance, sheetNameRef]);

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
    const sheetId = hfInstance.getSheetId(sheetNameRef);
    if (sheetId === undefined) return;

    // Batch updates to HyperFormula for performance
    hfInstance.batch(() => {
      newData.forEach((row, rowIndex) => {
        const totalQty = Number(row[COL.TOTAL_QTY]) || 0;
        const todayVal = Number(row[COL.TODAY]) || 0;

        // Update Total Quantity (affects Balance)
        hfInstance.setCellContents(
          { sheet: sheetId, row: rowIndex, col: COL.TOTAL_QTY },
          totalQty
        );

        // Update Today (affects Cumulative, which affects Balance)
        hfInstance.setCellContents(
          { sheet: sheetId, row: rowIndex, col: COL.TODAY },
          todayVal
        );
      });
    });

    // Read back calculated values and update state
    const updatedData = newData.map((row, rowIndex) => {
      // Get calculated Balance from HyperFormula
      let calculatedBalance = row[COL.BALANCE];
      const hfBalance = hfInstance.getCellValue({ sheet: sheetId, row: rowIndex, col: COL.BALANCE });
      if (typeof hfBalance === 'number' || (typeof hfBalance === 'string' && !hfBalance.startsWith('#'))) {
        calculatedBalance = String(hfBalance);
      } else if (hfBalance && typeof hfBalance === 'object' && 'type' in hfBalance) {
        calculatedBalance = "#ERROR";
      }

      // Get calculated Cumulative from HyperFormula
      let calculatedCumulative = row[COL.CUMULATIVE];
      const hfCumulative = hfInstance.getCellValue({ sheet: sheetId, row: rowIndex, col: COL.CUMULATIVE });
      if (typeof hfCumulative === 'number' || (typeof hfCumulative === 'string' && !hfCumulative.startsWith('#'))) {
        calculatedCumulative = String(hfCumulative);
      } else if (hfCumulative && typeof hfCumulative === 'object' && 'type' in hfCumulative) {
        calculatedCumulative = "#ERROR";
      }

      return {
        slNo: "",
        description: row[0] || "",
        totalQuantity: String(row[COL.TOTAL_QTY] || ""),
        uom: row[2] || "",
        balance: String(calculatedBalance || ""),
        basePlanStart: row[4] || "",
        basePlanFinish: row[5] || "",
        actualStart: row[6] || "",
        actualFinish: row[7] || "",
        forecastStart: row[8] || "",
        forecastFinish: row[9] || "",
        remarks: row[10] || "",
        cumulative: String(calculatedCumulative || ""),
        yesterday: row[12] || "",
        today: String(row[COL.TODAY] || "")
      };
    });

    setData(updatedData);
  }, [setData, hfInstance, sheetNameRef, COL]);

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