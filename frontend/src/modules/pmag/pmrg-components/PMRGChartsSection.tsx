import React from 'react';
import { Card } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

interface PMRGChartsSectionProps {
  projectChartData: any[];
  progressData: any[];
}

export const PMRGChartsSection: React.FC<PMRGChartsSectionProps> = ({ projectChartData, progressData }) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      {/* Project Progress */}
      <div className="transition-all duration-300">
        <Card className="p-6 h-full shadow-md hover:shadow-lg transition-shadow duration-300 rounded-xl">
          <h3 className="text-xl font-bold mb-4">Project Progress Overview</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={projectChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="progress" fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Progress Trend */}
      <div className="transition-all duration-300">
        <Card className="p-6 h-full shadow-md hover:shadow-lg transition-shadow duration-300 rounded-xl">
          <h3 className="text-xl font-bold mb-4">Progress Trend</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={progressData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Area type="monotone" dataKey="progress" stroke="hsl(var(--primary))" fill="hsl(var(--primary) / 0.2)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
};