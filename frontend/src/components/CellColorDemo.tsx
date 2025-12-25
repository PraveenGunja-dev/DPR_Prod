import React from "react";
import { StyledExcelTable } from "./StyledExcelTable";

export const CellColorDemo = () => {
  // Sample data for testing
  const columns = [
    "Sl.No (p6)",
    "Description (p6)",
    "Total Quantity (p6 edit)",
    "UOM (p6 edit)",
    "Balance (auto)",
    "Base Plan Start (p6)",
    "Base Plan Finish (p6)",
    "Actual Start (p6 edit)",
    "Actual Finish (p6 edit)",
    "Forecast Start (p6)",
    "Forecast Finish (p6)",
    "Remarks (user)",
    "Cumulative (auto)",
    "Yesterday",
    "Today"
  ];

  const data = [
    ["1", "Excavation Work", "1000", "CuM", "200", "2025-01-01", "2025-01-31", "2025-01-02", "2025-01-25", "2025-01-02", "2025-01-26", "Completed as planned", "800", "0", "50"],
    ["2", "Foundation Work", "500", "CuM", "100", "2025-02-01", "2025-02-28", "2025-02-02", "", "2025-02-02", "", "In progress", "400", "0", "20"],
  ];

  const columnTypes = {
    "Sl.No (p6)": "text",
    "Description (p6)": "text",
    "Total Quantity (p6 edit)": "number",
    "UOM (p6 edit)": "text",
    "Balance (auto)": "number",
    "Base Plan Start (p6)": "date",
    "Base Plan Finish (p6)": "date",
    "Actual Start (p6 edit)": "date",
    "Actual Finish (p6 edit)": "date",
    "Forecast Start (p6)": "date",
    "Forecast Finish (p6)": "date",
    "Remarks (user)": "text",
    "Cumulative (auto)": "number",
    "Yesterday": "number",
    "Today": "number"
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Cell Background Color Demo</h1>
      
      <div className="bg-blue-50 p-4 rounded-lg mb-6">
        <h2 className="text-xl font-semibold mb-2">Note</h2>
        <p>Cell background colors have been removed as per your request. Please see the <a href="/header-demo" className="text-blue-600 hover:underline">Header Color Demo</a> for header background colors (including Balance with auto color).</p>
      </div>

      <StyledExcelTable
        title="DP Qty Table with Default Cell Colors"
        columns={columns}
        data={data}
        onDataChange={() => {}}
        columnTypes={columnTypes}
        isReadOnly={true}
      />
      
      <div className="mt-6 bg-yellow-50 p-4 rounded-lg">
        <h2 className="text-xl font-semibold mb-2">Note</h2>
        <p>See the <a href="/header-demo" className="text-blue-600 hover:underline">Header Color Demo</a> to see how header background colors are applied based on column types (including Balance with auto color).</p>
      </div>
    </div>
  );
};