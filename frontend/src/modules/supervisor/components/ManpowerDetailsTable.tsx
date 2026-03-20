import React, { useState, useEffect, useMemo } from "react";
import { StyledExcelTable } from "@/components/StyledExcelTable";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Save } from "lucide-react";
import { StatusChip } from "@/components/StatusChip";

interface ManpowerDetailsData {
  activityId: string;
  slNo: string;
  block: string;
  contractorName: string;
  activity: string;
  section: string;
  yesterdayValue: string;
  todayValue: string;
  yesterdayIsApproved?: boolean;
}

interface ManpowerDetailsTableProps {
  data: ManpowerDetailsData[];
  setData: (data: ManpowerDetailsData[]) => void;
  totalManpower: number;
  setTotalManpower: (value: number) => void;
  onSave: () => void;
  onSubmit?: () => void;
  yesterday: string;
  today: string;
  isLocked?: boolean;
  status?: 'draft' | 'submitted_to_pm' | 'approved_by_pm' | 'rejected_by_pm' | 'final_approved' | 'approved_by_pmag' | 'archived';

  onExportAll?: () => void;
  totalRows?: number;
  onFullscreenToggle?: (isFullscreen: boolean) => void;
  onReachEnd?: () => void;
  universalFilter?: string;
  projectId?: number;
  selectedBlock?: string;
}

export function ManpowerDetailsTable({
  data,
  setData,
  totalManpower,
  setTotalManpower,
  onSave,
  onSubmit,
  yesterday,
  today,
  isLocked = false,
  status = 'draft',
  onExportAll,
  totalRows,
  onFullscreenToggle,
  onReachEnd,
  universalFilter,
  projectId,
  selectedBlock = "ALL"
}: ManpowerDetailsTableProps) {


  // Define columns
  const columns = [
    "Activity_ID",
    "Block",
    "Contractor Name",
    "Activity",
    "Section",
    yesterday,
    today
  ];

  const columnWidths = {
    "Activity_ID": 80,
    "Block": 70,
    "Contractor Name": 120,
    "Activity": 120,
    "Section": 80,
    [yesterday]: 70,
    [today]: 70
  };

  // Filter data based on selected block
  const filteredData = useMemo(() => {
    if (!Array.isArray(data)) return [];
    if (selectedBlock === "ALL") return data;
    return data.filter(d => d.block === selectedBlock);
  }, [data, selectedBlock]);

  // Convert array of objects to array of arrays
  const tableData = useMemo(() => {
    return (Array.isArray(filteredData) ? filteredData : []).map(row => [
      row.activityId,
      row.block,
      row.contractorName,
      row.activity,
      row.section,
      row.yesterdayValue,
      row.todayValue
    ]);
  }, [filteredData]);

  // Dynamically color cells based on approval status
  const cellTextColors = useMemo(() => {
    const colors: Record<number, Record<string, string>> = {};
    filteredData.forEach((row, rowIndex) => {
      if (row.yesterdayIsApproved === false) {
        colors[rowIndex] = {
          [yesterday]: "#ce440d" // Darker orange
        };
      } else if (row.yesterdayIsApproved === true) {
        colors[rowIndex] = {
          [yesterday]: "#16a34a" // Green
        };
      }
    });
    return colors;
  }, [filteredData, yesterday]);

  // Handle data changes from ExcelTable
  const handleDataChange = (newData: any[][]) => {
    const actualDataRows = newData.slice(0, filteredData.length);
    const updatedRows = actualDataRows.map((row, index) => ({
      ...filteredData[index],
      activityId: row[0] || "",
      slNo: "", // Keep for compatibility but not displayed
      block: row[1] || "",
      contractorName: row[2] || "",
      activity: row[3] || "",
      section: row[4] || "",
      yesterdayValue: row[5] || "",
      todayValue: row[6] || ""
    }));

    let nextData: ManpowerDetailsData[];
    if (selectedBlock !== "ALL") {
        const fullDataCopy = [...data];
        updatedRows.forEach(updatedRow => {
            const idx = fullDataCopy.findIndex(d => d.activityId === updatedRow.activityId);
            if (idx !== -1) fullDataCopy[idx] = updatedRow;
        });
        nextData = fullDataCopy;
    } else {
        nextData = updatedRows;
    }
    
    setData(nextData);

    // Recalculate total manpower
    const total = nextData.reduce((sum, row) => {
      const todayValue = parseInt(row.todayValue) || 0;
      return sum + todayValue;
    }, 0);
    setTotalManpower(total);
  };

  return (
    <div className="space-y-4 w-full">
      <StyledExcelTable
        title="Manpower Details Table"
        columns={columns}
        data={tableData}
        totalRows={totalRows}
        onDataChange={handleDataChange}
        onSave={onSave}
        onSubmit={onSubmit}
        isReadOnly={isLocked}
        editableColumns={[yesterday, today]}
        columnTypes={{
          [yesterday]: "number",
          [today]: "number"
        }}
        columnWidths={columnWidths}
        cellTextColors={cellTextColors}
        headerStructure={[
          // First header row - main column names
          [
            { label: "Activity_ID", colSpan: 1 },
            { label: "Block", colSpan: 1 },
            { label: "Contractor Name", colSpan: 1 },
            { label: "Activity", colSpan: 1 },
            { label: "Section", colSpan: 1 },
            { label: yesterday, colSpan: 1 },
            { label: today, colSpan: 1 }
          ]
        ]}
        status={status} // Pass status to StyledExcelTable
        onExportAll={onExportAll}
        onFullscreenToggle={onFullscreenToggle}
        onReachEnd={onReachEnd}
        externalGlobalFilter={universalFilter}
        projectId={projectId}
        sheetType="manpower_details"
      />
    </div>
  );
}