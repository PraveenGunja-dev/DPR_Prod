import React from "react";
import { StyledExcelTable } from "./StyledExcelTable";

export const TestAbbreviation = () => {
  // Sample data for testing
  const columns = [
    "Activity ID (p6)",
    "Actual Start (user)",
    "Actual Finish (user)",
    "Base Plan Start (p6)",
    "Base Plan Finish (p6)",
    "Forecast Start (p6)",
    "Forecast Finish (p6)",
    "Total Quantity (p6 edit)",
    "Completion Percentage (auto)",
    "Remarks (user)"
  ];

  const data = [
    ["ACT-001", "2025-01-15", "2025-02-15", "2025-01-10", "2025-02-20", "2025-01-12", "2025-02-18", "100", "75", "On track"],
    ["ACT-002", "2025-02-01", "2025-03-10", "2025-01-20", "2025-03-15", "2025-01-22", "2025-03-12", "250", "60", "Delayed"],
  ];

  const columnTypes = {
    "Activity ID (p6)": "text",
    "Actual Start (user)": "date",
    "Actual Finish (user)": "date",
    "Base Plan Start (p6)": "date",
    "Base Plan Finish (p6)": "date",
    "Forecast Start (p6)": "date",
    "Forecast Finish (p6)": "date",
    "Total Quantity (p6 edit)": "number",
    "Completion Percentage (auto)": "number",
    "Remarks (user)": "text"
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Test Abbreviation Functionality</h1>
      <StyledExcelTable
        title="Test Table with Abbreviated Headers"
        columns={columns}
        data={data}
        onDataChange={() => {}}
        columnTypes={columnTypes}
        isReadOnly={true}
      />
    </div>
  );
};