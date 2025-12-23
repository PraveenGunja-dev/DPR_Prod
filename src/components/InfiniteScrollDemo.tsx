import { useState, useEffect } from "react";
import { InfiniteScrollTable } from "./InfiniteScrollTable";

export const InfiniteScrollDemo = () => {
  // Sample columns
  const columns = [
    "Sl No",
    "Description",
    "Total Quantity",
    "UOM",
    "Base Plan Start",
    "Base Plan Finish",
    "Forecast Start",
    "Forecast Finish",
    "Block Capacity",
    "Phase",
    "Block",
    "SPV Number",
    "Actual Start",
    "Actual Finish",
    "Remarks",
    "Priority",
    "Balance",
    "Cumulative"
  ];

  // Generate sample data
  const generateSampleData = (count: number) => {
    return Array.from({ length: count }, (_, i) => [
      (i + 1).toString(),
      `Activity ${i + 1}`,
      (Math.floor(Math.random() * 100) + 1).toString(),
      "Days",
      `2024-${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}`,
      `2024-${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}`,
      `2024-${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}`,
      `2024-${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}`,
      (Math.floor(Math.random() * 100) + 1).toString(),
      `Phase ${Math.floor(Math.random() * 5) + 1}`,
      `Block ${Math.floor(Math.random() * 10) + 1}`,
      `SPV-${Math.floor(Math.random() * 1000)}`,
      `2024-${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}`,
      "",
      `Remark ${i + 1}`,
      `Priority ${Math.floor(Math.random() * 3) + 1}`,
      (Math.floor(Math.random() * 50) + 1).toString(),
      (Math.floor(Math.random() * 100) + 1).toString()
    ]);
  };

  const [data, setData] = useState<any[][]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Simulate loading large dataset
  useEffect(() => {
    setLoading(true);
    // Simulate API delay
    setTimeout(() => {
      const sampleData = generateSampleData(1000); // 1000 rows of data
      setData(sampleData);
      setLoading(false);
    }, 1000);
  }, []);

  if (loading) {
    return <div>Loading large dataset...</div>;
  }

  return (
    <div style={{ padding: '20px' }}>
      <h1>Infinite Scroll Table Demo</h1>
      <p>This table demonstrates infinite scrolling with 1000 rows of data.</p>
      
      <InfiniteScrollTable
        title="Large Dataset Table"
        columns={columns}
        data={data}
        batchSize={50} // Load 50 rows at a time
        columnTypes={{
          "Total Quantity": "number",
          "Block Capacity": "number",
          "Balance": "number",
          "Cumulative": "number"
        }}
        columnWidths={{
          "Description": 200,
          "Total Quantity": 100,
          "UOM": 80,
          "Base Plan Start": 120,
          "Base Plan Finish": 120,
          "Remarks": 150
        }}
        onDataChange={(updatedData) => {
          console.log("Data updated:", updatedData.length, "rows");
          setData(updatedData);
        }}
        onSave={() => {
          console.log("Save clicked");
        }}
        onSubmit={() => {
          console.log("Submit clicked");
        }}
      />
    </div>
  );
};