import React from "react";
import { ChartsSection } from "@/modules/charts";

interface PMChartsSectionProps {
  // Add any specific props if needed
}

export const PMChartsSection: React.FC<PMChartsSectionProps> = () => {
  return (
    <div className="mb-8">
      <ChartsSection context="PM_DASHBOARD" />
    </div>
  );
};