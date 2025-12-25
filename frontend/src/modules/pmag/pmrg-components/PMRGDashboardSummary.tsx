import React from 'react';
import { Card } from '@/components/ui/card';
import { StatsCards } from '@/components/shared/StatsCards';

interface PMRGDashboardSummaryProps {
  statsData: Array<{
    title: string;
    value: number;
    icon: React.ComponentType<{ className?: string }>;
    trend: { value: number; isPositive: boolean };
  }>;
}

export const PMRGDashboardSummary: React.FC<PMRGDashboardSummaryProps> = ({ statsData }) => {
  return (
    <Card className="p-6 mb-8">
      <h3 className="text-xl font-bold mb-4">Project Overview</h3>
      <StatsCards statsData={statsData} />
    </Card>
  );
};