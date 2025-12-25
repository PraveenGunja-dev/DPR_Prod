import { useState, useEffect } from "react";
import { StyledExcelTable } from "@/components/StyledExcelTable";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Save } from "lucide-react";
import { StatusChip } from "@/components/StatusChip";
import { fetchManpowerDetailsData } from "@/modules/supervisor/services/mockDataService";

interface ManpowerDetailsData {
  activityId: string;
  slNo: string;
  block: string;
  contractorName: string;
  activity: string;
  section: string;
  yesterdayValue: string;
  todayValue: string;
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
  status?: string; // Add status prop
  useMockData?: boolean; // Flag to use mock data
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
  status = 'draft', // Add status prop with default
  useMockData = false // Flag to use mock data
}: ManpowerDetailsTableProps) {
  // Fetch data from mock API when component mounts or when useMockData changes
  useEffect(() => {
    const fetchData = async () => {
      if (useMockData) {
        try {
          const mockData = await fetchManpowerDetailsData();
          setData(mockData);

          // Calculate total manpower
          const total = mockData.reduce((sum, row) => {
            const todayValue = parseInt(row.todayValue) || 0;
            return sum + todayValue;
          }, 0);
          setTotalManpower(total);
        } catch (error) {
          console.error('Error fetching mock data:', error);
        }
      }
    };

    fetchData();
  }, [setData, setTotalManpower, useMockData, data.length]); // Add data.length to dependencies to trigger reload when data changes

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

  // Convert array of objects to array of arrays
  const tableData = data.map(row => [
    row.activityId,
    row.block,
    row.contractorName,
    row.activity,
    row.section,
    row.yesterdayValue,
    row.todayValue
  ]);

  // Handle data changes from ExcelTable
  const handleDataChange = (newData: any[][]) => {
    // Convert array of arrays back to array of objects
    const updatedData = newData.map(row => ({
      activityId: row[0] || "",
      slNo: "", // Keep for compatibility but not displayed
      block: row[1] || "",
      contractorName: row[2] || "",
      activity: row[3] || "",
      section: row[4] || "",
      yesterdayValue: row[5] || "",
      todayValue: row[6] || ""
    }));
    setData(updatedData);

    // Recalculate total manpower
    const total = updatedData.reduce((sum, row) => {
      const todayValue = parseInt(row.todayValue) || 0;
      return sum + todayValue;
    }, 0);
    setTotalManpower(total);
  };

  return (
    <div className="space-y-4 w-full">
      <div className="bg-muted p-3 rounded-lg border border-gray-200 dark:border-gray-700">
        <h3 className="font-bold text-base mb-1">Manpower Details</h3>
        <div className="flex items-center justify-between mt-1">
          <p className="text-xs">Total Manpower: <span className="font-bold">{totalManpower}</span></p>
          <p className="text-xs">Reporting Date: {today}</p>
        </div>
      </div>
      <StyledExcelTable
        title="Manpower Details Table"
        columns={columns}
        data={tableData}
        onDataChange={handleDataChange}
        onSave={onSave}
        onSubmit={onSubmit}
        isReadOnly={isLocked}
        editableColumns={[today]}
        columnTypes={{
          [yesterday]: "number",
          [today]: "number"
        }}
        columnWidths={columnWidths}
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
      />
    </div>
  );
}