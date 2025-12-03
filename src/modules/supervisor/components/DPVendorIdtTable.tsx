import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Save } from "lucide-react";
import { ExcelTable } from "@/components/ExcelTable";

interface DPVendorIdtData {
  activityId: string;
  activities: string;
  plot: string;
  vendor: string;
  idtDate: string;
  actualDate: string;
  status: string;
  yesterdayValue: string;
  todayValue: string;
}

interface DPVendorIdtTableProps {
  data: DPVendorIdtData[];
  setData: (data: DPVendorIdtData[]) => void;
  onSave: () => void;
  yesterday: string;
  today: string;
  isLocked?: boolean;
}

export function DPVendorIdtTable({ data, setData, onSave, yesterday, today, isLocked = false }: DPVendorIdtTableProps) {
  // Define columns
  const columns = [
    "Activity_ID",
    "Activities",
    "Plot",
    "Vendor",
    "IDT Date",
    "Actual Date",
    "Status",
    yesterday,
    today
  ];
  
  // Convert array of objects to array of arrays
  const tableData = data.map(row => [
    row.activityId || '',
    row.activities || '',
    row.plot || '',
    row.vendor || '',
    row.idtDate || '',
    row.actualDate || '',
    row.status || '',
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
      vendor: row[3] || '',
      idtDate: row[4] || '',
      actualDate: row[5] || '',
      status: row[6] || '',
      yesterdayValue: row[7] || '',
      todayValue: row[8] || ''
    }));
    setData(updatedData);
  };

  return (
    <div className="space-y-4">
      <div className="bg-muted p-4 rounded-lg">
        <p className="font-medium">DP Vendor IDT Table</p>
        {isLocked && (
          <div className="mt-2 p-2 bg-yellow-100 border border-yellow-400 text-yellow-800 rounded">
            This entry has been submitted and is locked for 2 days. Values remain visible but cannot be edited.
          </div>
        )}
      </div>
      
      <ExcelTable
        title="DP Vendor IDT Table"
        columns={columns}
        data={tableData}
        onDataChange={handleDataChange}
        onSave={onSave}
        isReadOnly={isLocked}
      />
    </div>
  );
}
