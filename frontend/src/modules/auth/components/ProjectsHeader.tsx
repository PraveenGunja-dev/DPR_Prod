import React from 'react';
import { motion } from 'framer-motion';
import { FileText } from 'lucide-react';

interface ProjectsHeaderProps {
  userRole?: string;
  searchTerm: string;
  onSearchChange: (term: string) => void;
}

export const ProjectsHeader: React.FC<ProjectsHeaderProps> = ({ 
  userRole, 
  searchTerm, 
  onSearchChange 
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-8"
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Your Projects
          </h1>
          <p className="text-muted-foreground">
            {userRole === "supervisor" 
              ? "Select a project to manage your daily activities" 
              : "Select a project to view and manage"}
          </p>
        </div>
      </div>
      
      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <input
            type="text"
            placeholder="Search projects..."
            className="pl-10 w-full p-2 border rounded-md"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
      </div>
    </motion.div>
  );
};