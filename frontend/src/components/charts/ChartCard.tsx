// src/components/charts/ChartCard.tsx

import React from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";

interface ChartCardProps {
    title: string;
    description?: string;
    children: React.ReactNode;
    icon?: React.ReactNode;
    isEmpty?: boolean;
}

export const ChartCard: React.FC<ChartCardProps> = ({ title, description, children, icon, isEmpty }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
    >
        <Card className="shadow-sm border-border bg-card h-full hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                    {icon}
                    <div>
                        <CardTitle className="text-base font-medium text-foreground">{title}</CardTitle>
                        {description && (
                            <CardDescription className="text-xs text-muted-foreground">{description}</CardDescription>
                        )}
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                {isEmpty ? (
                    <div className="h-[220px] flex flex-col items-center justify-center text-muted-foreground text-center">
                        <BarChart3 className="w-10 h-10 mb-2 opacity-30" />
                        <p className="text-sm">No data available for the selected criteria</p>
                    </div>
                ) : (
                    children
                )}
            </CardContent>
        </Card>
    </motion.div>
);
