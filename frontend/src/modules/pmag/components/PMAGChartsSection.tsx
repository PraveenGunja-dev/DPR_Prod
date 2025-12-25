import React from "react";
import { ChartsSection } from "@/modules/charts";

interface PMAGChartsSectionProps {
  // Add any specific props if needed
}

export const PMAGChartsSection: React.FC<PMAGChartsSectionProps> = () => {
  return (
    <div className="mb-8">
      <ChartsSection context="PMAG_DASHBOARD" />
    </div>
  );
};