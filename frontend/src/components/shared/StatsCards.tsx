import React from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface StatCard {
  title: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

interface StatsCardsProps {
  stats: StatCard[];
}

export const StatsCards: React.FC<StatsCardsProps> = ({ stats }) => {
  return (
    <motion.div 
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {stats.map((stat, index) => (
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
            {stat.trend && (
              <div className="mt-2 flex items-center">
                <Badge variant={stat.trend.isPositive ? "default" : "destructive"}>
                  {stat.trend.isPositive ? "+" : ""}
                  {stat.trend.value}%
                </Badge>
                <span className="ml-2 text-xs text-muted-foreground">from last month</span>
              </div>
            )}
          </Card>
        </motion.div>
      ))}
    </motion.div>
  );
};