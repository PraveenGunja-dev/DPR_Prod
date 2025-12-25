import React from 'react';
import { TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, FolderPlus, Settings, FileText, BarChart3 } from 'lucide-react';

interface SuperAdminTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const SuperAdminTabs: React.FC<SuperAdminTabsProps> = ({
  activeTab,
  onTabChange
}) => {
  return (
    <TabsList className="grid w-full grid-cols-7">
      <TabsTrigger
        value="users"
        className="flex items-center gap-2"
        onClick={() => onTabChange("users")}
      >
        <Users className="w-4 h-4" />
        Users
      </TabsTrigger>
      <TabsTrigger
        value="projects"
        className="flex items-center gap-2"
        onClick={() => onTabChange("projects")}
      >
        <FolderPlus className="w-4 h-4" />
        Projects
      </TabsTrigger>
      <TabsTrigger
        value="sheet-entries"
        className="flex items-center gap-2"
        onClick={() => onTabChange("sheet-entries")}
      >
        <FileText className="w-4 h-4" />
        Sheet Entries
      </TabsTrigger>
      <TabsTrigger
        value="roles"
        className="flex items-center gap-2"
        onClick={() => onTabChange("roles")}
      >
        <Settings className="w-4 h-4" />
        Role Management
      </TabsTrigger>
      <TabsTrigger
        value="workflow"
        className="flex items-center gap-2"
        onClick={() => onTabChange("workflow")}
      >
        <FileText className="w-4 h-4" />
        Workflow Overrides
      </TabsTrigger>
      <TabsTrigger
        value="analytics"
        className="flex items-center gap-2"
        onClick={() => onTabChange("analytics")}
      >
        <BarChart3 className="w-4 h-4" />
        Analytics
      </TabsTrigger>
      <TabsTrigger
        value="logs"
        className="flex items-center gap-2"
        onClick={() => onTabChange("logs")}
      >
        <BarChart3 className="w-4 h-4" />
        System Logs
      </TabsTrigger>
    </TabsList>
  );
};