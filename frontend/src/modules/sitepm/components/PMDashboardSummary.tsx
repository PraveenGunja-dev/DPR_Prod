import React from "react";
import { motion } from "framer-motion";
import { FileText, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface PMDashboardSummaryProps {
  projectName: string;
  projectDetails: any;
  formatDate: (dateString: string | null | undefined) => string;
  submittedEntries: any[];
  loading: boolean;
  onRefresh: () => void;
}

export const PMDashboardSummary: React.FC<PMDashboardSummaryProps> = ({
  projectName,
  projectDetails,
  formatDate,
  submittedEntries,
  loading,
  onRefresh
}) => {
  const statsData = [
    { title: "Total Sheets", value: submittedEntries.length, icon: FileText, trend: { value: 12, isPositive: true } },
    { title: "Reviewed", value: submittedEntries.filter(e => e.status === 'approved_by_pm').length, icon: CheckCircle, trend: { value: 8, isPositive: true } },
    { title: "Pending", value: submittedEntries.filter(e => e.status === 'submitted_to_pm').length, icon: Clock, trend: { value: 3, isPositive: false } },
    { title: "Revisions", value: submittedEntries.filter(e => e.status === 'rejected_by_pm').length, icon: AlertCircle, trend: { value: 2, isPositive: true } },
  ];

  return (
    <div className="mb-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <div>
          <motion.h1 
            className="text-3xl md:text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
           Site PM Dashboard
          </motion.h1>
          <motion.p 
            className="text-muted-foreground"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            {projectName ? `Project: ${projectName}` : "Project dashboard for project management"}
          </motion.p>
          {projectDetails && (
            <motion.div 
              className="mt-2 text-sm text-muted-foreground"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <p>Plan: {formatDate(projectDetails.PlannedStartDate)} to {formatDate(projectDetails.PlannedFinishDate)}</p>
              <p>Actual: {formatDate(projectDetails.ActualStartDate) || "Not started"} to {formatDate(projectDetails.ActualFinishDate) || "Not completed"}</p>
            </motion.div>
          )}
        </div>
        <motion.div 
          className="flex items-center space-x-4"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
        </motion.div>
      </div>

      {/* Stats Cards */}
      <motion.div 
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {statsData.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.1 * index, type: "spring", stiffness: 100 }}
            whileHover={{ y: -5, transition: { duration: 0.2 } }}
          >
            <Card className="p-4 bg-card hover:shadow-md transition-shadow duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                </div>
                <stat.icon className="h-8 w-8 text-muted-foreground" />
              </div>
              <div className="mt-2 flex items-center">
                <Badge variant={stat.trend.isPositive ? "default" : "destructive"}>
                  {stat.trend.isPositive ? "+" : ""}
                  {stat.trend.value}%
                </Badge>
                <span className="ml-2 text-xs text-muted-foreground">from last month</span>
              </div>
            </Card>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
};