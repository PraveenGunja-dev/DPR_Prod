import React from 'react';
import { Calendar, ChevronRight, FileText, MapPin, UserPlus, RefreshCw } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface Project {
  id?: string | number;
  name: string;
  location?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  sheetTypes?: string[];
  projectType?: string;
  originalProject?: any;
}

interface ProjectListingProps {
  projects: Project[];
  onProjectClick?: (project: any) => void;
  userRole?: string;
  onSummaryClick?: (project: any) => void;
  onAssignClick?: (project: any) => void;
  onSyncClick?: (project: any) => void;
}

// Helper to get status badge color
const getStatusColor = (status?: string) => {
  switch (status?.toLowerCase()) {
    case 'active':
      return 'bg-green-500/20 text-green-400 border-green-500/30';
    case 'completed':
      return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    case 'planned':
    case 'planning':
      return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    case 'on hold':
    case 'hold':
      return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
    default:
      return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  }
};

export const ProjectListing: React.FC<ProjectListingProps> = ({ projects, onProjectClick, userRole, onSummaryClick, onAssignClick, onSyncClick }) => {
  // Check if the user role should see the Summary button
  const showSummaryButton = userRole === 'Site PM' || userRole === 'PMAG';
  // Check if the user role should see the Assign button
  const showAssignButton = userRole === 'Site PM' || userRole === 'PMAG';
  const showSyncButton = userRole === 'supervisor' || userRole === 'Site PM' || userRole === 'PMAG';

  const formatSheetType = (sheetId: string) => {
    const sheetMap: Record<string, string> = {
      'dp_qty': 'DP Qty',
      'manpower_details': 'Manpower',
      'dp_vendor_block': 'Vendor Block',
      'dp_block': 'DP Block',
      'dp_vendor_idt': 'Vendor IDT',
    };
    return sheetMap[sheetId] || sheetId;
  };

  const getProjectTypeColor = (type?: string) => {
    switch (type?.toLowerCase()) {
      case 'solar': return 'bg-orange-500/10 text-orange-600 border-orange-200 dark:border-orange-900/50';
      case 'wind': return 'bg-cyan-500/10 text-cyan-600 border-cyan-200 dark:border-cyan-900/50';
      case 'pss': return 'bg-purple-500/10 text-purple-600 border-purple-200 dark:border-purple-900/50';
      default: return 'bg-slate-500/10 text-slate-600 border-slate-200 dark:border-slate-900/50';
    }
  };

  return (
    <div className="py-4 sm:py-6">
      <div className="space-y-3">
        {projects.map((project, index) => (
          <Card
            key={index}
            className="rounded-xl border border-border bg-card text-card-foreground shadow-sm hover:shadow-lg transition-all duration-300 p-4 cursor-pointer hover:border-primary/50 group"
            onClick={() => onProjectClick && onProjectClick(project)}
          >
            <div className="flex items-center gap-4 sm:gap-6">
              {/* Logo */}
              <div className="flex-shrink-0 w-16 sm:w-20 h-8 sm:h-10 flex items-center justify-center">
                <img
                  src={`${import.meta.env.BASE_URL}logo.png`}
                  alt="Logo"
                  className="h-6 sm:h-8 w-auto object-contain"
                />
              </div>

              {/* Project name and location - takes remaining space */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-base sm:text-lg font-bold text-foreground truncate group-hover:text-primary transition-colors" title={project.name}>
                    {project.name}
                  </h3>
                  {project.id && (
                    <span className="flex-shrink-0 px-1.5 py-0.5 text-[10px] sm:text-[11px] font-mono bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 rounded border border-slate-200 dark:border-slate-700">
                      ID: {project.id}
                    </span>
                  )}
                </div>
                {project.location && (
                  <div className="flex items-center gap-1 mt-0.5">
                    <MapPin size={10} className="text-muted-foreground flex-shrink-0 sm:size-[12px]" />
                    <span className="text-[10px] sm:text-xs text-muted-foreground truncate">{project.location}</span>
                  </div>
                )}

                {/* Project Tags: Type and Sheet Access */}
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  {/* Project Type Badge */}
                  {project.projectType && (
                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md border uppercase tracking-tighter ${getProjectTypeColor(project.projectType)}`}>
                      {project.projectType}
                    </span>
                  )}

                  {/* Sheet Access Badges */}
                  {userRole?.toLowerCase() === 'supervisor' && project.sheetTypes && project.sheetTypes.length > 0 && (
                    <>
                      {project.sheetTypes.map((sheet, idx) => (
                        <span key={idx} className="px-2 py-0.5 text-[10px] bg-blue-100/50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 rounded-full border border-blue-200 dark:border-blue-800 w-fit">
                          {formatSheetType(sheet)}
                        </span>
                      ))}
                    </>
                  )}
                  {userRole?.toLowerCase() === 'supervisor' && (!project.sheetTypes || project.sheetTypes.length === 0) && (
                    <span className="px-2 py-0.5 text-[10px] bg-emerald-100/50 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 rounded-full border border-emerald-200 dark:border-emerald-800 w-fit">
                      All Sheets Access
                    </span>
                  )}
                </div>
              </div>

              {/* Status Badge */}
              <div className="flex-shrink-0">
                <span className={`px-2 sm:px-3 py-1 sm:py-1.5 text-[10px] sm:text-xs font-semibold rounded-full border uppercase tracking-wide ${getStatusColor(project.status)}`}>
                  {project.status || 'Active'}
                </span>
              </div>

              {/* Start Date (Desktop Only) */}
              <div className="hidden lg:flex items-center gap-2 flex-shrink-0 min-w-[140px]">
                <Calendar className="text-green-500 flex-shrink-0" size={16} />
                <div className="flex flex-col">
                  <span className="text-[10px] text-muted-foreground uppercase font-medium">Start</span>
                  <span className="text-sm text-foreground font-medium">
                    {project.startDate || 'N/A'}
                  </span>
                </div>
              </div>

              {/* End Date (Desktop Only) */}
              <div className="hidden lg:flex items-center gap-2 flex-shrink-0 min-w-[140px]">
                <Calendar className="text-red-500 flex-shrink-0" size={16} />
                <div className="flex flex-col">
                  <span className="text-[10px] text-muted-foreground uppercase font-medium">End</span>
                  <span className="text-sm text-foreground font-medium">
                    {project.endDate || 'N/A'}
                  </span>
                </div>
              </div>

              {/* Assign button - Only for Site PM and PMAG, Hidden on mobile top row */}
              {showAssignButton && onAssignClick && (
                <div className="hidden sm:block flex-shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2 text-secondary border-secondary/30 hover:bg-secondary/10"
                    onClick={(e) => {
                      e.stopPropagation();
                      onAssignClick(project);
                    }}
                  >
                    <UserPlus size={16} />
                    <span>Assign</span>
                  </Button>
                </div>
              )}
              
              {/* Sync button - Mostly for Supervisors as requested */}
              {showSyncButton && onSyncClick && (
                <div className="hidden sm:block flex-shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2 text-blue-600 border-blue-600/30 hover:bg-blue-600/10"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSyncClick(project);
                    }}
                  >
                    <RefreshCw size={16} />
                    <span>Sync</span>
                  </Button>
                </div>
              )}

              {/* Summary button - Only for Site PM and PMAG, Hidden on mobile top row */}
              {showSummaryButton && onSummaryClick && (
                <div className="hidden sm:block flex-shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2 text-primary border-primary/30 hover:bg-primary/10"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSummaryClick(project);
                    }}
                  >
                    <FileText size={16} />
                    <span>Summary</span>
                  </Button>
                </div>
              )}

              {/* Arrow button - Navigate to dashboard */}
              <div
                className="flex-shrink-0 cursor-pointer"
                onClick={() => onProjectClick && onProjectClick(project)}
              >
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center hover:bg-primary/20 transition-all">
                  <ChevronRight className="text-primary w-[18px] h-[18px] sm:w-[20px] sm:h-[20px]" />
                </div>
              </div>
            </div>

            {/* Mobile row for dates and action buttons */}
            <div className="sm:hidden mt-3 pt-3 border-t border-border flex flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <Calendar className="text-green-500 flex-shrink-0" size={14} />
                <span className="text-xs text-muted-foreground">Start: {project.startDate || 'N/A'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="text-red-500 flex-shrink-0" size={14} />
                <span className="text-xs text-muted-foreground">End: {project.endDate || 'N/A'}</span>
              </div>
              {showAssignButton && onAssignClick && (
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-1 text-xs text-secondary border-secondary/30 hover:bg-secondary/10"
                  onClick={(e) => {
                    e.stopPropagation();
                    onAssignClick(project);
                  }}
                >
                  <UserPlus size={14} />
                  Assign
                </Button>
              )}
              {showSummaryButton && onSummaryClick && (
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-1 text-xs text-primary border-primary/30 hover:bg-primary/10"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSummaryClick(project);
                  }}
                >
                  <FileText size={14} />
                  Summary
                </Button>
              )}
              {showSyncButton && onSyncClick && (
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-1 text-xs text-blue-600 border-blue-600/30 hover:bg-blue-600/10"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSyncClick(project);
                  }}
                >
                  <RefreshCw size={14} />
                  Sync
                </Button>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};