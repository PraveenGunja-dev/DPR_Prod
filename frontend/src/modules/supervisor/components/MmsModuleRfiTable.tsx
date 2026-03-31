import { useState, useMemo, useCallback } from "react";
import React from "react";
import { Button } from "@/components/ui/button";
import { Plus, AlertCircle, Trash2 } from "lucide-react";
import { StyledExcelTable } from "@/components/StyledExcelTable";
import { toast } from "sonner";
import { MmsRfiFormModal, MmsRfiFormData } from "./MmsRfiFormModal";
import { indianDateFormat } from "@/services/dprService";


interface MmsModuleRfiData {
  id?: string;
  rfiNo: string;
  subject: string;
  module: string;
  submittedDate: string;
  responseDate: string;
  status: string;
  remarks: string;
  yesterdayValue: string;
  todayValue: string;
}

interface MmsModuleRfiTableProps {
  data: MmsModuleRfiData[];
  setData: (data: MmsModuleRfiData[]) => void;
  onSave?: () => void;
  onSubmit?: () => void;
  yesterday: string;
  today: string;
  isLocked?: boolean;
  status?: string;
  onExportAll?: () => void;
  onFullscreenToggle?: (isFullscreen: boolean) => void;
  universalFilter?: string;
  selectedBlock?: string;
}

export function MmsModuleRfiTable({
  data,
  setData,
  onSave,
  onSubmit,
  yesterday,
  today,
  isLocked = false,
  status = 'draft',
  onExportAll,
  onFullscreenToggle,
  universalFilter,
  selectedBlock
}: MmsModuleRfiTableProps) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const safeData = useMemo(() => Array.isArray(data) ? data : [], [data]);

  // Handle adding a new row via modal
  const handleAddEntry = useCallback((formData: MmsRfiFormData) => {
    const newRow: MmsModuleRfiData = {
      id: `row-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      rfiNo: formData.rfiNo,
      subject: formData.subject,
      module: formData.module,
      submittedDate: formData.submittedDate,
      responseDate: formData.responseDate,
      status: formData.status,
      remarks: formData.remarks,
      yesterdayValue: '',
      todayValue: '',
    };

    setData([...safeData, newRow]);
    setIsAddModalOpen(false);
    toast.success("MMS/RFI entry added!");
  }, [safeData, setData]);

  // Handle deleting a row
  const handleDeleteRow = useCallback((rowIndex: number) => {
    const updated = safeData.filter((_, i) => i !== rowIndex);
    setData(updated);
    toast.success("Entry removed");
  }, [safeData, setData]);

  // Define columns
  const columns = useMemo(() => [
    "RFI No",
    "Subject",
    "Module",
    "Submitted Date",
    "Response Date",
    "Status",
    "Remarks",
    yesterday,
    today
  ], [yesterday, today]);

  // Convert array of objects to array of arrays
  const tableData = useMemo(() => safeData.map(row => [
    row.rfiNo || '',
    row.subject || '',
    row.module || '',
    indianDateFormat(row.submittedDate) || '',
    indianDateFormat(row.responseDate) || '',
    row.status || '',
    row.remarks || '',
    row.yesterdayValue || '',
    row.todayValue || ''
  ]), [safeData]);

  // Handle data changes from ExcelTable (inline edits)
  const handleDataChange = useCallback((newData: any[][]) => {
    const updatedData = newData.map((row, index) => ({
      id: safeData[index]?.id || `row-${Date.now()}-${index}`,
      rfiNo: row[0] || '',
      subject: row[1] || '',
      module: row[2] || '',
      submittedDate: row[3] || '',
      responseDate: row[4] || '',
      status: row[5] || '',
      remarks: row[6] || '',
      yesterdayValue: row[7] || '',
      todayValue: row[8] || ''
    }));
    setData(updatedData);
  }, [safeData, setData]);

  // Empty state
  if (safeData.length === 0 && !isLocked) {
    return (
      <div className="space-y-4 w-full">
        <div className="bg-muted p-3 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-base mb-1">MMS & Module RFI</h3>
              <p className="text-xs">Reporting Date: {today}</p>
            </div>
          </div>
        </div>

        <div className="text-center py-8 text-muted-foreground">
          <AlertCircle className="mx-auto h-12 w-12 opacity-50" />
          <h3 className="mt-2 text-lg font-medium">No MMS / RFI entries</h3>
          <p className="mt-1">Get started by adding a new MMS or RFI entry.</p>
          <div className="mt-4">
            <Button onClick={() => setIsAddModalOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Your First MMS / RFI Entry
            </Button>
          </div>
        </div>

        <MmsRfiFormModal
          open={isAddModalOpen}
          onOpenChange={setIsAddModalOpen}
          onSubmit={handleAddEntry}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4 w-full">
      <div className="bg-muted p-3 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-base mb-1">MMS & Module RFI</h3>
            <p className="text-xs">Reporting Date: {today} | {safeData.length} entries</p>
          </div>
          {!isLocked && (
            <Button
              size="sm"
              onClick={() => setIsAddModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Entry
            </Button>
          )}
        </div>
      </div>

      <StyledExcelTable
        title="MMS & Module RFI Table"
        columns={columns}
        data={tableData}
        onDataChange={handleDataChange}
        onSave={onSave}
        onSubmit={onSubmit}
        isReadOnly={isLocked}
        editableColumns={["RFI No", "Subject", "Module", "Submitted Date", "Response Date", "Status", "Remarks", yesterday, today]}
        disableAutoHeaderColors={true}
        columnTypes={{
          "Submitted Date": "date",
          "Response Date": "date",
          [yesterday]: "number",
          [today]: "number"
        }}
        columnWidths={{
          "RFI No": 60,
          "Subject": 100,
          "Module": 60,
          "Submitted Date": 80,
          "Response Date": 80,
          "Status": 60,
          "Remarks": 100,
          [yesterday]: 60,
          [today]: 60
        }}
        headerStructure={[
          [
            { label: "RFI No", colSpan: 1 },
            { label: "Subject", colSpan: 1 },
            { label: "Module", colSpan: 1 },
            { label: "Submitted Date", colSpan: 1 },
            { label: "Response Date", colSpan: 1 },
            { label: "Status", colSpan: 1 },
            { label: "Remarks", colSpan: 1 },
            { label: yesterday, colSpan: 1 },
            { label: today, colSpan: 1 }
          ]
        ]}
        status={status}
        onExportAll={onExportAll}
        totalRows={undefined}
        onFullscreenToggle={onFullscreenToggle}
        externalGlobalFilter={universalFilter}
      />

      {/* Delete row buttons */}
      {!isLocked && safeData.length > 0 && (
        <div className="flex flex-wrap gap-2 px-2">
          <span className="text-xs text-muted-foreground self-center mr-2">Remove entry:</span>
          {safeData.map((row, idx) => (
            <Button
              key={row.id || idx}
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
              onClick={() => handleDeleteRow(idx)}
            >
              <Trash2 className="w-3 h-3 mr-1" />
              Row {idx + 1} ({row.rfiNo || 'No RFI#'})
            </Button>
          ))}
        </div>
      )}

      <MmsRfiFormModal
        open={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
        onSubmit={handleAddEntry}
      />
    </div>
  );
}