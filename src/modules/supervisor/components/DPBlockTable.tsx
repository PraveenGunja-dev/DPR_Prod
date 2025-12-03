import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Save } from "lucide-react";
import { ExcelTable } from "@/components/ExcelTable";

interface DPBlockData {
  activityId: string;
  activities: string;
  plot: string;
  block: string;
  priority: string;
  contractorName: string;
  scope: string;
  yesterdayValue: string;
  todayValue: string;
}

interface DPBlockTableProps {
  data: DPBlockData[];
  setData: (data: DPBlockData[]) => void;
  onSave: () => void;
  yesterday: string;
  today: string;
  isLocked?: boolean;
}

export function DPBlockTable({ data, setData, onSave, yesterday, today, isLocked = false }: DPBlockTableProps) {
  // Define columns
  const columns = [
    "Activity_ID",
    "Activities",
    "Plot",
    "Block",
    "Priority",
    "Contractor Name",
    "Scope",
    yesterday,
    today
  ];
  
  // Convert array of objects to array of arrays
  const tableData = data.map(row => [
    row.activityId || '',
    row.activities || '',
    row.plot || '',
    row.block || '',
    row.priority || '',
    row.contractorName || '',
    row.scope || '',
    row.yesterdayValue || '',
    row.todayValue || ''
  ]);
  
  // Handle data changes from ExcelTable
  const handleDataChange = (newData: any[][]) => {
    // Convert array of arrays back to array of objects
    const updatedData = newData.map(row => ({
      activityId: row[0] || '',
      activities: row[1] || '',
      plot: row[2] || '',
      block: row[3] || '',
      priority: row[4] || '',
      contractorName: row[5] || '',
      scope: row[6] || '',
      yesterdayValue: row[7] || '',
      todayValue: row[8] || ''
    }));
    setData(updatedData);
  };

  return (
    <div className="space-y-4">
      <div className="bg-muted p-4 rounded-lg">
        <p className="font-medium">DP Block Table</p>
        {isLocked && (
          <div className="mt-2 p-2 bg-yellow-100 border border-yellow-400 text-yellow-800 rounded">
            This entry has been submitted and is locked for 2 days. Values remain visible but cannot be edited.
          </div>
        )}
      </div>
      
      <ExcelTable
        title="DP Block Table"
        columns={columns}
        data={tableData}
        onDataChange={handleDataChange}
        onSave={onSave}
        isReadOnly={isLocked}
      />
    </div>
  );
}
