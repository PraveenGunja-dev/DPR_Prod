import { useState, useEffect, useCallback, useMemo } from "react";
import React from "react";
import { Button } from "@/components/ui/button";
import { Plus, AlertCircle, Trash2 } from "lucide-react";
import { StyledExcelTable } from "@/components/StyledExcelTable";
import {
  getDraftEntry,
  saveDraftEntry,
  submitEntry
} from "@/services/dprService";
import { toast } from "sonner";
import { MmsRfiFormModal, MmsRfiFormData } from "./MmsRfiFormModal";

interface MmsModuleRfiRow {
  id: string;
  rfiNo: string;
  subject: string;
  module: string;
  submittedDate: string;
  responseDate: string;
  status: string;
  remarks: string;
  yesterdayValue: string;
  todayValue: string;
  [key: string]: string; // For dynamic columns
}

interface MmsModuleRfiTableWithDynamicColumnsProps {
  projectId: number;
  userId: number;
  yesterday: string;
  today: string;
  isLocked?: boolean;
  status?: string;
  onExportAll?: () => void;
  universalFilter?: string;
  selectedBlock?: string;
}

export function MmsModuleRfiTableWithDynamicColumns({
  projectId,
  userId,
  yesterday,
  today,
  isLocked = false,
  status = 'draft',
  onExportAll,
  universalFilter,
  selectedBlock
}: MmsModuleRfiTableWithDynamicColumnsProps) {
  const [rows, setRows] = useState<MmsModuleRfiRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [entryId, setEntryId] = useState<number | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Load entry data
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const draftEntry = await getDraftEntry(projectId, 'mms_module_rfi');

        if (draftEntry) {
          setEntryId(draftEntry.id);

          // Parse data_json if string
          let dataJson = draftEntry.data_json;
          if (typeof dataJson === 'string') {
            try {
              dataJson = JSON.parse(dataJson);
            } catch {
              dataJson = { rows: [] };
            }
          }

          // Extract rows
          const savedRows = dataJson?.rows || [];
          // Ensure each row has an id
          const rowsWithIds = savedRows.map((row: any, index: number) => ({
            id: row.id || `row-${Date.now()}-${index}`,
            rfiNo: row.rfiNo || '',
            subject: row.subject || '',
            module: row.module || '',
            submittedDate: row.submittedDate || '',
            responseDate: row.responseDate || '',
            status: row.status || '',
            remarks: row.remarks || '',
            yesterdayValue: row.yesterdayValue || '',
            todayValue: row.todayValue || '',
          }));

          setRows(rowsWithIds);
        }

        setError(null);
      } catch (err) {
        console.error('Error loading MMS/RFI data:', err);
        setError('Failed to load data');
      } finally {
        setIsLoading(false);
      }
    };

    if (projectId) {
      loadData();
    }
  }, [projectId]);

  // Handle adding a new row via modal
  const handleAddEntry = useCallback((formData: MmsRfiFormData) => {
    const newRow: MmsModuleRfiRow = {
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

    setRows(prev => [...prev, newRow]);
    setIsAddModalOpen(false);
    toast.success("MMS/RFI entry added successfully!");
  }, []);

  // Handle deleting a row
  const handleDeleteRow = useCallback((rowIndex: number) => {
    setRows(prev => prev.filter((_, i) => i !== rowIndex));
    toast.success("Entry removed");
  }, []);

  // Handle save
  const handleSaveEntry = useCallback(async () => {
    if (!entryId) {
      toast.error("No draft entry found. Please try refreshing.");
      return;
    }

    try {
      const dataToSave = {
        rows: rows.map(({ id, ...rest }) => ({ ...rest, id }))
      };
      await saveDraftEntry(entryId, dataToSave);
      toast.success(`Saved ${rows.length} MMS/RFI entries successfully!`);
      setError(null);
    } catch (err) {
      console.error('Error saving MMS/RFI entry:', err);
      toast.error("Failed to save MMS/RFI data");
    }
  }, [entryId, rows]);

  // Handle submit
  const handleSubmitEntry = useCallback(async () => {
    if (!entryId) {
      toast.error("No draft entry found. Please try refreshing.");
      return;
    }

    try {
      // Save first, then submit
      const dataToSave = {
        rows: rows.map(({ id, ...rest }) => ({ ...rest, id }))
      };
      await saveDraftEntry(entryId, dataToSave);
      await submitEntry(entryId);
      toast.success("MMS/RFI data submitted for review!");
      setError(null);
    } catch (err) {
      console.error('Error submitting MMS/RFI entry:', err);
      toast.error("Failed to submit MMS/RFI data");
    }
  }, [entryId, rows]);

  // Handle data changes from inline editing in StyledExcelTable
  const handleDataChange = useCallback((newData: any[][]) => {
    setRows(prev => {
      return newData.map((rowArr, index) => {
        const existingRow = prev[index];
        return {
          id: existingRow?.id || `row-${Date.now()}-${index}`,
          rfiNo: rowArr[0] || '',
          subject: rowArr[1] || '',
          module: rowArr[2] || '',
          submittedDate: rowArr[3] || '',
          responseDate: rowArr[4] || '',
          status: rowArr[5] || '',
          remarks: rowArr[6] || '',
          yesterdayValue: rowArr[7] || '',
          todayValue: rowArr[8] || '',
        };
      });
    });
  }, []);

  // Columns definition
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

  // Convert rows to table data (array of arrays)
  const tableData = useMemo(() =>
    rows.map(row => [
      row.rfiNo,
      row.subject,
      row.module,
      row.submittedDate,
      row.responseDate,
      row.status,
      row.remarks,
      row.yesterdayValue,
      row.todayValue
    ]), [rows]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3"></div>
        <span className="text-muted-foreground">Loading MMS & RFI data...</span>
      </div>
    );
  }

  if (error && rows.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <AlertCircle className="mx-auto h-12 w-12 opacity-50 text-red-400" />
        <h3 className="mt-2 text-lg font-medium text-red-600">Error loading data</h3>
        <p className="mt-1">{error}</p>
      </div>
    );
  }

  // Empty state - similar to Issues tab
  if (rows.length === 0 && !isLocked) {
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
            <p className="text-xs">Reporting Date: {today} | {rows.length} entries</p>
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
        onSave={isLocked ? undefined : handleSaveEntry}
        onSubmit={isLocked ? undefined : handleSubmitEntry}
        isReadOnly={isLocked}
        editableColumns={["RFI No", "Subject", "Module", "Submitted Date", "Response Date", "Status", "Remarks", yesterday, today]}
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
        externalGlobalFilter={universalFilter}
      />

      {/* Delete row buttons - render below the table when not locked */}
      {!isLocked && rows.length > 0 && (
        <div className="flex flex-wrap gap-2 px-2">
          <span className="text-xs text-muted-foreground self-center mr-2">Remove entry:</span>
          {rows.map((row, idx) => (
            <Button
              key={row.id}
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