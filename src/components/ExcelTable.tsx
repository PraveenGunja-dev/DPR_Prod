import { useState, useEffect } from "react";
import { ExcelSheet } from "@/components/ExcelSheet";

interface ExcelTableProps {
  title: string;
  columns: string[];
  data: any[];
  onDataChange: (newData: any[]) => void;
  onSave?: () => void;
  onSubmit?: () => void;
  isReadOnly?: boolean;
}

export const ExcelTable = ({ 
  title, 
  columns, 
  data, 
  onDataChange,
  onSave,
  onSubmit,
  isReadOnly = false
}: ExcelTableProps) => {
  // Convert data to the format expected by ExcelSheet
  const rows = data.map(row => 
    row.map((cell: any) => ({
      value: cell || "",
      readOnly: isReadOnly || false
    }))
  );

  // Handle data changes from ExcelSheet
  const handleSave = (newData: any[][]) => {
    onDataChange(newData);
    if (onSave) {
      onSave();
    }
  };

  return (
    <ExcelSheet
      title={title}
      columns={columns}
      rows={rows}
      onSave={handleSave}
      onSubmit={onSubmit}
      isReadOnly={isReadOnly}
      showSubmitButton={!!onSubmit}
    />
  );
};