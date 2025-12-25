import React from 'react';
import { motion } from 'framer-motion';
import { Users, FolderPlus, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SuperAdminHeaderProps {
  onCreateUser: () => void;
  onCreateProject: () => void;
}

export const SuperAdminHeader: React.FC<SuperAdminHeaderProps> = ({ 
  onCreateUser,
  onCreateProject
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="mb-8"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <div>
          <motion.h1 
            className="text-3xl md:text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            Super Admin Dashboard
          </motion.h1>
          <motion.p 
            className="text-muted-foreground"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            Full system administration and oversight
          </motion.p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Button onClick={onCreateUser} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Create User
          </Button>
          <Button onClick={onCreateProject} variant="outline" className="flex items-center gap-2">
            <FolderPlus className="w-4 h-4" />
            New Project
          </Button>
        </div>
      </div>
    </motion.div>
  );
};