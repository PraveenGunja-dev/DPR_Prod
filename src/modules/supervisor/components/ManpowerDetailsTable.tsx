import { ExcelTable } from "@/components/ExcelTable";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Save } from "lucide-react";

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
  yesterday: string;
  today: string;
  isLocked?: boolean;
}

export function ManpowerDetailsTable({ 
  data, 
  setData, 
  totalManpower, 
  setTotalManpower, 
  onSave, 
  yesterday, 
  today,
  isLocked = false
}: ManpowerDetailsTableProps) {
  // Define columns
  const columns = [
    "Activity_ID",
    "Sl No",
    "Block",
    "Contractor Name",
    "Activity",
    "Section",
    yesterday,
    today
  ];
  
  // Convert array of objects to array of arrays
  const tableData = data.map(row => [
    row.activityId,
    row.slNo,
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
      slNo: row[1] || "",
      block: row[2] || "",
      contractorName: row[3] || "",
      activity: row[4] || "",
      section: row[5] || "",
      yesterdayValue: row[6] || "",
      todayValue: row[7] || ""
    }));
    setData(updatedData);
  };

  return (
    <div className="space-y-4">
      {isLocked && (
        <div className="p-2 bg-yellow-100 border border-yellow-400 text-yellow-800 rounded">
          This entry has been submitted and is locked for 2 days. Values remain visible but cannot be edited.
        </div>
      )}
      <div className="flex items-center justify-between">
        <div className="bg-muted p-2 rounded">
          Total Manpower Available at Site: 
          <Input 
            type="number" 
            value={totalManpower} 
            onChange={(e) => setTotalManpower(Number(e.target.value))}
            className="ml-2 w-24 inline-block"
            readOnly={isLocked}
          />
        </div>
        <Button 
          onClick={onSave} 
          className="bg-blue-600 hover:bg-blue-700"
          disabled={isLocked}
        >
          <Save className="w-4 h-4 mr-2" />
          Save Manpower
        </Button>
      </div>
      
      <ExcelTable
        title="Manpower Details Table"
        columns={columns}
        data={tableData}
        onDataChange={handleDataChange}
        onSave={onSave}
        isReadOnly={isLocked}
      />
    </div>
  );
}