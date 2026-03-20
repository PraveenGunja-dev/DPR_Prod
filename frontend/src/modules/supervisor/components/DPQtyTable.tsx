import { useState, useEffect, memo, useCallback, useMemo, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Save } from "lucide-react";
import { StyledExcelTable } from "@/components/StyledExcelTable";
import { getTodayAndYesterday } from "@/services/dprService";
import { toast } from "sonner";
import { StatusChip } from "@/components/StatusChip";
import { HyperFormula } from "hyperformula";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface DPQtyData {
  yesterdayIsApproved?: boolean;
  activityId?: string;
  block?: string;
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
  weightage: string;
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
  status?: 'draft' | 'submitted_to_pm' | 'approved_by_pm' | 'rejected_by_pm' | 'final_approved' | 'approved_by_pmag' | 'archived';
  projectId?: number; // Add projectId prop for P6 integration
  onExportAll?: () => void;
  totalRows?: number;
  onFullscreenToggle?: (isFullscreen: boolean) => void;
  onReachEnd?: () => void;
  universalFilter?: string;
  selectedBlock?: string;
}

export const DPQtyTable = memo(({ data, setData, onSave, onSubmit, yesterday, today, isLocked = false, status = 'draft', projectId, onExportAll, totalRows, onFullscreenToggle, onReachEnd, universalFilter, selectedBlock = "ALL" }: DPQtyTableProps) => {
  const { today: currentDate, yesterday: previousDate } = getTodayAndYesterday();

  // Filter data based on selected block
  const filteredData = useMemo(() => {
    if (!Array.isArray(data)) return [];
    if (selectedBlock === "ALL") return data;
    return data.filter(d => d.block === selectedBlock);
  }, [data, selectedBlock]);

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
    ACTIVITY_ID: 0,
    BLOCK: 1,
    DESCRIPTION: 2,
    WEIGHTAGE: 3,
    TOTAL_QTY: 4,
    UOM: 5,
    BALANCE: 6,
    BASE_PLAN_START: 7,
    BASE_PLAN_FINISH: 8,
    ACTUAL_START: 9,
    ACTUAL_FINISH: 10,
    FORECAST_START: 11,
    FORECAST_FINISH: 12,
    REMARKS: 13,
    CUMULATIVE: 14,
    YESTERDAY: 15,
    TODAY: 16,
    BASE_CUMULATIVE: 17  // Hidden column
  }), []);

  // Track if sheet has been initialized
  const sheetInitializedRef = useRef(false);
  const dataIdRef = useRef(0);

  // Build sheet data with formulas
  const buildSheetData = useCallback((rowData: DPQtyData[]) => {
    const rows = Array.isArray(rowData) ? rowData : [];
    return rows.map((row, rowIndex) => {
      const rowNum = rowIndex + 1;

      // Cumulative Formula: = Base Cumulative (R) + Yesterday (P) + Today (Q)
      const cumulativeFormula = `=R${rowNum}+P${rowNum}+Q${rowNum}`;
      
      // Balance Formula: = Total Quantity (E) - Cumulative (O)
      const balanceFormula = `=E${rowNum}-O${rowNum}`;

      // Base Cumulative is the cumulative value before Yesterday's and Today's entries
      const initialCumulative = Number(row.cumulative) || 0;
      const initialToday = Number(row.today) || 0;
      const initialYesterday = Number(row.yesterday) || 0;
      const baseCumulative = initialCumulative - initialToday - initialYesterday;

      return [
        row.activityId || "",               // 0 - A
        row.block || "",                    // 1 - B
        row.description,                    // 2 - C
        Number(row.weightage) || 0,         // 3 - D
        Number(row.totalQuantity) || 0,     // 4 - E (Total Quantity)
        row.uom,                            // 5 - F
        balanceFormula,                     // 6 - G (Balance = E - O)
        row.basePlanStart,                  // 7 - H
        row.basePlanFinish,                 // 8 - I
        row.actualStart,                    // 9 - J
        row.actualFinish,                   // 10 - K
        row.forecastStart,                  // 11 - L
        row.forecastFinish,                 // 12 - M
        row.remarks,                        // 13 - N
        cumulativeFormula,                  // 14 - O (Cumulative)
        Number(row.yesterday) || 0,         // 15 - P (Yesterday)
        Number(row.today) || 0,             // 16 - Q (Today)
        baseCumulative                      // 17 - R (Base Cumulative)
      ];
    });
  }, []);

  // Track last data to detect changes from parent vs internal state updates
  const lastProcessedDataRef = useRef<string>("");

  // Initialize HyperFormula with data and read calculated values
  useEffect(() => {
    if (!Array.isArray(filteredData) || filteredData.length === 0) return;

    // Detect if data has changed from an external source (parent)
    // We stringify the critical parts to detect changes without infinite loops from our own setData
    const dataSerialized = JSON.stringify(filteredData.map(d => ({
      id: d.activityId,
      c: d.cumulative,
      t: d.today,
      y: d.yesterday,
      qty: d.totalQuantity
    })));

    // If data hasn't actually changed, skip re-initialization
    if (dataSerialized === lastProcessedDataRef.current && sheetInitializedRef.current) {
      return;
    }

    console.log('[DPQtyTable] Re-initializing HyperFormula sheet due to data change');
    lastProcessedDataRef.current = dataSerialized;

    // Create or update the sheet
    let sheetId = hfInstance.getSheetId(sheetNameRef);

    if (!hfInstance.doesSheetExist(sheetNameRef)) {
      hfInstance.addSheet(sheetNameRef);
      sheetId = hfInstance.getSheetId(sheetNameRef);
    }

    if (sheetId === undefined) return;

    // Build and set sheet data with formulas
    const sheetData = buildSheetData(filteredData);
    hfInstance.setSheetContent(sheetId, sheetData);
    sheetInitializedRef.current = true;

    // Read calculated values and update data if needed
    let needsUpdate = false;
    const updatedData = filteredData.map((row, rowIndex) => {
      const hfBalance = hfInstance.getCellValue({ sheet: sheetId!, row: rowIndex, col: COL.BALANCE });
      const hfCumulative = hfInstance.getCellValue({ sheet: sheetId!, row: rowIndex, col: COL.CUMULATIVE });

      const newBalance = typeof hfBalance === 'number' ? String(hfBalance) :
        (typeof hfBalance === 'string' && !hfBalance.startsWith('#')) ? hfBalance : row.balance;
      const newCumulative = typeof hfCumulative === 'number' ? String(hfCumulative) :
        (typeof hfCumulative === 'string' && !hfCumulative.startsWith('#')) ? hfCumulative : row.cumulative;

      if (newBalance !== row.balance || newCumulative !== row.cumulative) {
        needsUpdate = true;
      }

      return {
        ...filteredData[rowIndex],
        balance: typeof hfBalance === 'number' ? String(hfBalance) : String(hfBalance || ""),
        cumulative: typeof hfCumulative === 'number' ? String(hfCumulative) : String(hfCumulative || "")
      };
    });

    const dataSerializedAfter = JSON.stringify(updatedData.map(d => ({
      id: d.activityId,
      c: d.cumulative,
      t: d.today,
      y: d.yesterday,
      qty: d.totalQuantity
    })));

    if (dataSerialized !== dataSerializedAfter) {
      lastProcessedDataRef.current = dataSerializedAfter;
      // We need to merge updatedData back into the FULL data set if we are filtering
      if (selectedBlock !== "ALL") {
        const fullDataCopy = [...data];
        updatedData.forEach(updatedRow => {
            const idx = fullDataCopy.findIndex(d => d.activityId === updatedRow.activityId);
            if (idx !== -1) fullDataCopy[idx] = updatedRow;
        });
        setData(fullDataCopy);
      } else {
        setData(updatedData);
      }
    }
  }, [filteredData, hfInstance, sheetNameRef, buildSheetData, COL, setData, data, selectedBlock]);

  // Convert data to the format expected by ExcelTable - memoized
  const columns = useMemo(() => [
    "Activity ID",
    "Block",
    "Description",
    "Weightage",
    "Scope",
    "UOM",
    "Balance",
    "Base Plan Start",
    "Base Plan Finish",
    "Actual Start",
    "Actual Finish",
    "Forecast Start",
    "Forecast Finish",
    "Remarks",
    "Cumulative",
    yesterday,
    today
  ], [yesterday, today]);

  // Define column widths for better alignment - memoized
  const columnWidths = useMemo(() => ({
    "Activity ID": 90,
    "Block": 100,
    "Description": 150,
    "Weightage": 80,
    "Scope": 80,
    "UOM": 60,
    "Balance": 70,
    "Base Plan Start": 80,
    "Base Plan Finish": 80,
    "Actual Start": 80,
    "Actual Finish": 80,
    "Forecast Start": 80,
    "Forecast Finish": 80,
    "Remarks": 100,
    "Cumulative": 70,
    [yesterday]: 70,
    [today]: 70
  }), [yesterday, today]);

  // Define which columns are editable by the user - memoized
  const editableColumns = useMemo(() => [
    "Weightage",
    "Scope",
    "UOM",
    "Actual Start",
    "Actual Finish",
    "Remarks",
    yesterday, // Yesterday value is now editable
    today // Today value is editable
  ], [yesterday, today]);

  // Convert array of objects to array of arrays - memoized
  const tableData = useMemo(() => {
    const rows = (Array.isArray(filteredData) ? filteredData : []).map(row => [
      row.activityId || "",
      row.block || "",
      row.description || "",
      row.weightage || "",
      row.totalQuantity || "",
      row.uom || "",
      row.balance || "",
      row.basePlanStart || "",
      row.basePlanFinish || "",
      row.actualStart || "",
      row.actualFinish || "",
      row.forecastStart || "",
      row.forecastFinish || "",
      row.remarks || "",
      row.cumulative || "",
      row.yesterday || "", 
      row.today || "" 
    ]);

    // Add Grand Total Row
    if (rows.length > 0) {
      const totalWeightage = rows.reduce((sum, r) => sum + (Number(r[3]) || 0), 0);
      const totalScope = rows.reduce((sum, r) => sum + (Number(r[4]) || 0), 0);
      const totalBalance = rows.reduce((sum, r) => sum + (Number(r[6]) || 0), 0);
      const totalCumulative = rows.reduce((sum, r) => sum + (Number(r[14]) || 0), 0);
      const totalYesterday = rows.reduce((sum, r) => sum + (Number(r[15]) || 0), 0);
      const totalToday = rows.reduce((sum, r) => sum + (Number(r[16]) || 0), 0);

      rows.push([
        "GRAND TOTAL",
        "", 
        "",
        String(totalWeightage.toFixed(2)),
        String(totalScope.toFixed(2)),
        "", // UOM
        String(totalBalance.toFixed(2)),
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        String(totalCumulative.toFixed(2)),
        String(totalYesterday.toFixed(2)),
        String(totalToday.toFixed(2))
      ]);
    }

    return rows;
  }, [filteredData]);

  // Row styles for the Grand Total row
  const rowStyles = useMemo(() => {
    const styles: Record<number, any> = {};
    const safeData = Array.isArray(data) ? data : [];
    if (safeData.length > 0) {
      styles[safeData.length] = {
        backgroundColor: "#f1f5f9", // slate-100
        color: "#0f172a", // slate-900
        fontWeight: "bold",
        isTotalRow: true
      };
    }
    return styles;
  }, [data]);

  // Dynamically color cells based on approval status
  const cellTextColors = useMemo(() => {
    const colors: Record<number, Record<string, string>> = {};
    const safeData = Array.isArray(filteredData) ? filteredData : [];
    safeData.forEach((row, rowIndex) => {
      if (row.yesterdayIsApproved === false) {
        // Unverified data (from supervisor drafts)
        colors[rowIndex] = {
          [yesterday]: "#ce440d", // Darker orange (orange-700)
          "Cumulative": "#ce440d"
        };
      } else if (row.yesterdayIsApproved === true) {
        // Verified data (from P6 push)
        colors[rowIndex] = {
          [yesterday]: "#16a34a", // Green-600
          "Cumulative": "#16a34a"
        };
      }
    });
    return colors;
  }, [filteredData, yesterday]);

  // Handle data changes from ExcelTable - memoized
  const handleDataChange = useCallback((newData: any[][]) => {
    const sheetId = hfInstance.getSheetId(sheetNameRef);
    if (sheetId === undefined) {
      console.warn('HyperFormula sheet not found, skipping calculation update');
      return;
    }

    // Table data has 15 columns (columnIndex 0-14), mapped as:
    // 0: Act ID, 1: Descr, 2: Scope, 3: UOM, 4: Balance (auto), 
    // 5-6: Base Plan, 7-8: Actual, 9-10: Forecast, 11: Remarks, 
    // 12: Cumulative (auto), 13: Yesterday, 14: Today

    const TABLE_COL = {
      ACTIVITY_ID: 0,
      BLOCK: 1,
      DESCRIPTION: 2,
      WEIGHTAGE: 3,
      TOTAL_QTY: 4,
      UOM: 5,
      BALANCE: 6,
      BASE_PLAN_START: 7,
      BASE_PLAN_FINISH: 8,
      ACTUAL_START: 9,
      ACTUAL_FINISH: 10,
      FORECAST_START: 11,
      FORECAST_FINISH: 12,
      REMARKS: 13,
      CUMULATIVE: 14,
      YESTERDAY: 15,
      TODAY: 16
    };

    // Batch updates to HyperFormula for performance
    hfInstance.batch(() => {
      newData.forEach((row, rowIndex) => {
        const weightage = Number(row[TABLE_COL.WEIGHTAGE]) || 0;
        const totalQty = Number(row[TABLE_COL.TOTAL_QTY]) || 0;
        const todayVal = Number(row[TABLE_COL.TODAY]) || 0;
        const yesterdayVal = Number(row[TABLE_COL.YESTERDAY]) || 0;

        // Update Weightage
        hfInstance.setCellContents(
          { sheet: sheetId, row: rowIndex, col: COL.WEIGHTAGE },
          weightage
        );

        // Update Total Quantity in HyperFormula (affects Balance)
        hfInstance.setCellContents(
          { sheet: sheetId, row: rowIndex, col: COL.TOTAL_QTY },
          totalQty
        );

        // Update Today in HyperFormula (affects Cumulative, which affects Balance)
        hfInstance.setCellContents(
          { sheet: sheetId, row: rowIndex, col: COL.TODAY },
          todayVal
        );

        // Update Yesterday in HyperFormula (affects Cumulative)
        hfInstance.setCellContents(
          { sheet: sheetId, row: rowIndex, col: COL.YESTERDAY },
          yesterdayVal
        );
      });
    });

    // Read back calculated values and update state
    const actualDataRows = newData.slice(0, filteredData.length);

    const updatedData = actualDataRows.map((row, rowIndex) => {
      // Get calculated Balance from HyperFormula
      const hfBalance = hfInstance.getCellValue({ sheet: sheetId, row: rowIndex, col: COL.BALANCE });
      let calculatedBalance = String(row[TABLE_COL.BALANCE] || "");
      if (typeof hfBalance === 'number') {
        calculatedBalance = String(hfBalance);
      } else if (typeof hfBalance === 'string' && !hfBalance.startsWith('#') && !hfBalance.startsWith('=')) {
        calculatedBalance = hfBalance;
      }

      // Get calculated Cumulative from HyperFormula
      const hfCumulative = hfInstance.getCellValue({ sheet: sheetId, row: rowIndex, col: COL.CUMULATIVE });
      let calculatedCumulative = String(row[TABLE_COL.CUMULATIVE] || "");
      if (typeof hfCumulative === 'number') {
        calculatedCumulative = String(hfCumulative);
      } else if (typeof hfCumulative === 'string' && !hfCumulative.startsWith('#') && !hfCumulative.startsWith('=')) {
        calculatedCumulative = hfCumulative;
      }

      return {
        ...filteredData[rowIndex],
        activityId: String(row[TABLE_COL.ACTIVITY_ID] || ""),
        block: String(row[TABLE_COL.BLOCK] || ""),
        description: String(row[TABLE_COL.DESCRIPTION] || ""),
        weightage: String(row[TABLE_COL.WEIGHTAGE] || ""),
        totalQuantity: String(row[TABLE_COL.TOTAL_QTY] || ""),
        uom: String(row[TABLE_COL.UOM] || ""),
        balance: calculatedBalance,
        basePlanStart: String(row[TABLE_COL.BASE_PLAN_START] || ""),
        basePlanFinish: String(row[TABLE_COL.BASE_PLAN_FINISH] || ""),
        actualStart: String(row[TABLE_COL.ACTUAL_START] || ""),
        actualFinish: String(row[TABLE_COL.ACTUAL_FINISH] || ""),
        forecastStart: String(row[TABLE_COL.FORECAST_START] || ""),
        forecastFinish: String(row[TABLE_COL.FORECAST_FINISH] || ""),
        remarks: String(row[TABLE_COL.REMARKS] || ""),
        cumulative: calculatedCumulative,
        yesterday: String(row[TABLE_COL.YESTERDAY] || ""),
        today: String(row[TABLE_COL.TODAY] || "")
      };
    });

    // Update our ref to prevent the useEffect from re-initializing 
    // since this change originated from this table's own logic
    lastProcessedDataRef.current = JSON.stringify(updatedData.map(d => ({
      id: d.activityId,
      c: d.cumulative,
      t: d.today,
      y: d.yesterday,
      qty: d.totalQuantity
    })));
    if (selectedBlock !== "ALL") {
      const fullDataCopy = [...data];
      updatedData.forEach(updatedRow => {
          const idx = fullDataCopy.findIndex(d => d.activityId === updatedRow.activityId);
          if (idx !== -1) fullDataCopy[idx] = updatedRow;
      });
      setData(fullDataCopy);
    } else {
      setData(updatedData);
    }
  }, [setData, data, filteredData, hfInstance, sheetNameRef, COL, selectedBlock]);

  return (
    <div className="space-y-4 w-full">
      <StyledExcelTable
        title="DP Qty Table"
        columns={columns}
        data={tableData}
        totalRows={totalRows}
        onDataChange={handleDataChange}
        onSave={onSave}
        onSubmit={onSubmit}
        isReadOnly={isLocked}
        editableColumns={editableColumns}
        columnTypes={{
          "Block": "text",
          "Description": "text",
          "Weightage": "number",
          "Scope": "number",
          "UOM": "text",
          "Balance": "number",
          "Base Plan Start": "date",
          "Base Plan Finish": "date",
          "Actual Start": "date",
          "Actual Finish": "date",
          "Forecast Start": "date",
          "Forecast Finish": "date",
          "Remarks": "text",
          "Cumulative": "number",
          [yesterday]: "number",
          [today]: "number"
        }}
        columnWidths={columnWidths}
        cellTextColors={cellTextColors}
        columnTextColors={{
          "Actual Start": "#00B050",
          "Actual Finish": "#00B050",
          "Forecast Start": "#0070C0",
          "Forecast Finish": "#0070C0"
        }}
        columnFontWeights={{
          "Actual Start": "bold",
          "Actual Finish": "bold",
          "Forecast Start": "bold",
          "Forecast Finish": "bold"
        }}
        headerStructure={[
          // First header row - main column names
          [
            { label: "Activity ID", colSpan: 1 },
            { label: "Block", colSpan: 1 },
            { label: "Description", colSpan: 1 },
            { label: "Weightage", colSpan: 1 },
            { label: "Scope", colSpan: 1 },
            { label: "UOM", colSpan: 1 },
            { label: "Balance", colSpan: 1 },
            { label: "Base Plan Start", colSpan: 1 },
            { label: "Base Plan Finish", colSpan: 1 },
            { label: "Actual Start", colSpan: 1 },
            { label: "Actual Finish", colSpan: 1 },
            { label: "Forecast Start", colSpan: 1 },
            { label: "Forecast Finish", colSpan: 1 },
            { label: "Remarks", colSpan: 1 },
            { label: "Cumulative", colSpan: 1 },
            { label: yesterday, colSpan: 1 },
            { label: today, colSpan: 1 }
          ]
        ]}
        status={status} // Pass status to StyledExcelTable
        onExportAll={onExportAll}
        onFullscreenToggle={onFullscreenToggle}
        onReachEnd={onReachEnd}
        rowStyles={rowStyles}
        externalGlobalFilter={universalFilter}
        projectId={projectId}
        sheetType="dp_qty"
      />
    </div>
  );
});