import React from "react";
import { Button } from "@/components/ui/button";
import { StyledExcelTable } from "@/components/StyledExcelTable"; // Changed from ExcelTable to StyledExcelTable
import { AlertCircle, Plus } from "lucide-react";

interface Issue {
  id: string;
  description: string;
  startDate: string;
  finishedDate: string | null;
  delayedDays: number;
  status: "Open" | "In Progress" | "Resolved" | "Closed";
  priority: "Low" | "Medium" | "High" | "Critical";
  actionRequired: string;
  remarks: string;
  attachment: File | null;
  attachmentName: string | null;
  projectName?: string;
}

interface IssuesTableProps {
  issues: Issue[];
  onAddIssue: () => void;
}

export function IssuesTable({ issues, onAddIssue }: IssuesTableProps) {
  const formatDate = (dateString: string | null | undefined): string => {
    if (!dateString) return "Not set";
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  };

  if (issues.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <AlertCircle className="mx-auto h-12 w-12 opacity-50" />
        <h3 className="mt-2 text-lg font-medium">No issues reported</h3>
        <p className="mt-1">Get started by adding a new issue.</p>
        <div className="mt-4">
          <Button onClick={onAddIssue}>
            <Plus className="w-4 h-4 mr-2" />
            Add Your First Issue Log
          </Button>
        </div>
      </div>
    );
  }

  // Define columns - memoized to prevent infinite renders in StyledExcelTable
  const columns = React.useMemo(() => [
    "Project Name",
    "Description",
    "Priority",
    "Start Date",
    "Finished Date",
    "Delayed Days",
    "Status",
    "Action Required",
    "Remarks",
    "Attachment"
  ], []);

  // Convert issues to table data - memoized
  const tableData = React.useMemo(() => issues.map(issue => [
    issue.projectName || "N/A",
    issue.description,
    issue.priority,
    formatDate(issue.startDate),
    formatDate(issue.finishedDate),
    String(issue.delayedDays),
    issue.status,
    issue.actionRequired,
    issue.remarks,
    issue.attachmentName || "No attachment"
  ]), [issues]);

  const handleDataChange = React.useCallback(() => { }, []);

  return (
    <StyledExcelTable
      title="Issue Logs"
      columns={columns}
      data={tableData}
      onDataChange={handleDataChange} // Read-only table
      isReadOnly={true} onSave={undefined} onSubmit={undefined} onExportAll={undefined} totalRows={undefined}    />
  );
}