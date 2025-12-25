import React from 'react';
import { motion } from 'framer-motion';
import { FileText, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface ProjectsEmptyStateProps {
  userRole?: string;
  searchTerm?: string;
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
}

export const ProjectsEmptyState: React.FC<ProjectsEmptyStateProps> = ({ 
  userRole, 
  searchTerm, 
  isLoading, 
  error, 
  onRetry 
}) => {
  const navigate = useNavigate();
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading projects...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">Error Loading Projects</h3>
          <p className="text-muted-foreground mb-6">
            {error}
          </p>
          <Button 
            onClick={onRetry} 
            className="mr-2"
          >
            Retry
          </Button>
          <Button 
            variant="outline"
            onClick={() => navigate("/")}
          >
            Go Home
          </Button>
        </div>
      </div>
    );
  }
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center py-12"
    >
      <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
      <h3 className="text-xl font-semibold mb-2">No Projects Found</h3>
      <p className="text-muted-foreground mb-6">
        {searchTerm 
          ? `No projects match your search for "${searchTerm}"` 
          : userRole === "supervisor"
            ? "You haven't been assigned to any projects yet."
            : userRole === "Super Admin"
              ? "As a Super Admin, please use the Super Admin Dashboard to manage projects."
              : "There are no projects available at the moment."}
      </p>
      {userRole === "Super Admin" && (
        <Button onClick={() => navigate("/superadmin", { state: { activeTab: "projects" } })}>
          Go to Super Admin Dashboard
        </Button>
      )}
    </motion.div>
  );
};