import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface SheetType {
  value: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface TabbedEntriesProps {
  sheetTypes: SheetType[];
  activeTab: string;
  onTabChange: (value: string) => void;
  loading: boolean;
  onRefresh: () => void;
  totalEntries: number;
  pendingEntries: number;
  children: React.ReactNode;
}

export const TabbedEntries: React.FC<TabbedEntriesProps> = ({
  sheetTypes,
  activeTab,
  onTabChange,
  loading,
  onRefresh,
  totalEntries,
  pendingEntries,
  children
}) => {
  // Filter entries by sheet type - ONLY SHOW SUBMITTED ENTRIES
  const getEntriesBySheetType = (sheetType: string, entries: any[]) => {
    return entries.filter(entry => 
      entry.sheet_type === sheetType && 
      entry.status === 'submitted_to_pm'  // Only show submitted entries
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="mb-8"
      whileHover={{ y: -2 }}
    >
      <Card className="p-6 shadow-md hover:shadow-lg transition-shadow duration-300 rounded-xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-bold">Submitted Sheets - Review Queue</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Viewing all submissions from all projects
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <motion.div
              whileTap={{ scale: 0.95 }}
              whileHover={{ scale: 1.05 }}
            >
              <Button 
                size="sm" 
                variant="outline"
                onClick={onRefresh}
                disabled={loading}
                className="transition-all duration-200 px-3 py-1 h-8"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </motion.div>
            <Badge variant="secondary">{pendingEntries} Pending</Badge>
            <Badge variant="outline">{totalEntries} Total</Badge>
          </div>
        </div>
        
        {loading ? (
          <motion.div 
            className="text-center py-8 text-muted-foreground"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div 
              className="flex justify-center"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            >
              <RefreshCw className="h-12 w-12 opacity-50" />
            </motion.div>
            <p className="mt-2">Loading submitted sheets...</p>
          </motion.div>
        ) : (
          <Tabs value={activeTab} onValueChange={onTabChange} className="w-full">
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-6 mb-6 gap-0">
                {sheetTypes.map((sheet, index) => {
                  const Icon = sheet.icon;
                  return (
                    <motion.div
                      key={sheet.value}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05, duration: 0.2 }}
                    >
                      <TabsTrigger 
                        value={sheet.value} 
                        className="flex items-center justify-center w-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground py-2 px-1 border border-transparent data-[state=active]:border-primary data-[state=active]:shadow"
                      >
                        <Icon className="w-4 h-4 mr-2" />
                        <span className="hidden sm:inline">{sheet.label}</span>
                        <span className="sm:hidden">{sheet.label.split(' ')[0]}</span>
                      </TabsTrigger>
                    </motion.div>
                  );
                })}
              </TabsList>
            </motion.div>

            <AnimatePresence mode="wait">
              {sheetTypes.map((sheet) => (
                sheet.value === activeTab && (
                  <TabsContent key={sheet.value} value={sheet.value}>
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ 
                        duration: 0.3,
                        delay: 0.1
                      }}
                      className="w-full"
                      key={activeTab}
                      exit={{ opacity: 0, y: -20 }}
                    >
                      {children}
                    </motion.div>
                  </TabsContent>
                )
              ))}
            </AnimatePresence>
          </Tabs>
        )}
      </Card>
    </motion.div>
  );
};