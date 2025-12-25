import React, { useState } from "react";
import { StyledExcelTable } from "./StyledExcelTable";

export const AbbreviationDemo = () => {
  const [demoData, setDemoData] = useState([
    ["ACT-001", "2025-01-15", "2025-02-15", "2025-01-10", "2025-02-20", "2025-01-12", "2025-02-18", "100", "75", "On track"],
    ["ACT-002", "2025-02-01", "2025-03-10", "2025-01-20", "2025-03-15", "2025-01-22", "2025-03-12", "250", "60", "Delayed"],
  ]);

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

  const handleDataChange = (newData: any[][]) => {
    setDemoData(newData);
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Header Abbreviation Demo</h1>
      
      <div className="bg-blue-50 p-4 rounded-lg mb-6">
        <h2 className="text-xl font-semibold mb-2">How It Works</h2>
        <p className="mb-2">
          The StyledExcelTable component now automatically abbreviates common header terms:
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li>"Actual Start" → "A.S"</li>
          <li>"Actual Finish" → "A.F"</li>
          <li>"Base Plan Start" → "B.P.S"</li>
          <li>"Base Plan Finish" → "B.P.F"</li>
          <li>"Forecast Start" → "F.S"</li>
          <li>"Forecast Finish" → "F.F"</li>
          <li>"Total Quantity" → "T.Qty"</li>
          <li>"Completion Percentage" → "% Comp"</li>
          <li>And more...</li>
        </ul>
        <p className="mt-2">
          Tags like (p6), (user), (edit), (auto) are automatically removed.
        </p>
        <p className="mt-2">
          See the <a href="/header-demo" className="text-blue-600 hover:underline">Header Color Demo</a> for colored headers based on column types (including Balance with auto color).
        </p>
      </div>

      <StyledExcelTable
        title="Sample Table with Abbreviated Headers"
        columns={columns}
        data={demoData}
        onDataChange={handleDataChange}
        columnTypes={columnTypes}
        isReadOnly={false}
      />
      
      <div className="mt-6 bg-yellow-50 p-4 rounded-lg">
        <h2 className="text-xl font-semibold mb-2">Note</h2>
        <p>See the <a href="/header-demo" className="text-blue-600 hover:underline">Header Color Demo</a> to see how header background colors are applied based on column types (including Balance with auto color).</p>
      </div>
      
      <div className="mt-6 bg-gray-50 p-4 rounded-lg">
        <h2 className="text-xl font-semibold mb-2">Original vs Abbreviated Headers</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h3 className="font-medium mb-2">Original Headers:</h3>
            <ul className="list-disc pl-5 space-y-1">
              {columns.map((col, i) => (
                <li key={i}>{col}</li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="font-medium mb-2">Abbreviated Headers:</h3>
            <ul className="list-disc pl-5 space-y-1">
              {columns.map((col, i) => (
                <li key={i}>
                  {col
                    .replace(/\s*\(p6\)|\s*\(edit\)|\s*\(user\)|\s*\(auto\)/gi, '')
                    .replace(/Actual Start/gi, 'A.S')
                    .replace(/Actual Finish/gi, 'A.F')
                    .replace(/Base Plan Start/gi, 'B.P.S')
                    .replace(/Base Plan Finish/gi, 'B.P.F')
                    .replace(/Forecast Start/gi, 'F.S')
                    .replace(/Forecast Finish/gi, 'F.F')
                    .replace(/Total Quantity/gi, 'T.Qty')
                    .replace(/Completion Percentage/gi, '% Comp')
                    .trim()}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};