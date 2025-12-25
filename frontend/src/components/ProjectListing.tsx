import React from 'react';
import { Calendar, TrendingUp, Users, ChevronRight } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface Project {
  name: string;
  planStart: string;
  planEnd: string;
  actualStart: string;
  actualEnd: string;
  members: number;
}

interface ProjectListingProps {
  projects: Project[];
  onProjectClick?: (project: any) => void;
}

export const ProjectListing: React.FC<ProjectListingProps> = ({ projects, onProjectClick }) => {
  return (
    <div className="py-4 sm:py-6 md:py-8">
      <div className="space-y-3 sm:space-y-4 md:space-y-5">
        {projects.map((project, index) => (
          <Card
            key={index}
            className="flex flex-col sm:flex-row items-start sm:items-center rounded-xl border border-border bg-card text-card-foreground shadow-sm hover:shadow-md transition-all duration-300 p-3 sm:p-4 cursor-pointer hover:border-primary w-full"
            onClick={() => onProjectClick && onProjectClick(project)}
          >
            {/* Top row - Icon and Project name */}
            <div className="flex items-center w-full sm:w-auto mb-2 sm:mb-0">
              {/* Icon */}
              <div className="flex-shrink-0 mr-3 sm:mr-4">
                <div className="w-8 h-8 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-lg flex items-center justify-center">
                  <img
                    src="/logo.png"
                    alt="Adani Logo"
                    className="h-4 sm:h-5 md:h-6 w-auto"
                  />
                </div>
              </div>

              {/* Project name */}
              <h3 className="text-sm sm:text-base md:text-xl font-bold text-foreground truncate flex-grow sm:flex-grow-0 sm:mr-4">
                {project.name}
              </h3>
            </div>

            {/* Middle - Dates (stacked on mobile) */}
            <div className="flex flex-col sm:flex-row flex-grow gap-1 sm:gap-4 md:gap-6 w-full sm:w-auto mb-2 sm:mb-0 pl-11 sm:pl-0">
              <div className="flex items-center">
                <Calendar className="text-[#22A04B] mr-1 sm:mr-2 flex-shrink-0" size={12} />
                <span className="text-xs sm:text-sm text-muted-foreground whitespace-nowrap">
                  <span className="hidden md:inline">PLAN: </span>{project.planStart} → {project.planEnd}
                </span>
              </div>

              <div className="flex items-center">
                <TrendingUp className="text-blue-500 mr-1 sm:mr-2 flex-shrink-0" size={12} />
                <span className="text-xs sm:text-sm text-muted-foreground whitespace-nowrap">
                  <span className="hidden md:inline">ACTUAL: </span>{project.actualStart} → {project.actualEnd}
                </span>
              </div>
            </div>

            {/* Right side - Members and arrow */}
            <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto pl-11 sm:pl-0 sm:space-x-4 flex-shrink-0">
              <div className="flex items-center text-xs sm:text-sm text-muted-foreground">
                <Users className="mr-1 flex-shrink-0" size={14} />
                <span className="whitespace-nowrap">{project.members} <span className="hidden sm:inline">members</span></span>
              </div>

              <button
                className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-background border border-border shadow-sm hover:bg-muted transition-all duration-200 flex items-center justify-center ml-2 sm:ml-0"
                onClick={(e) => {
                  e.stopPropagation();
                }}
              >
                <ChevronRight className="text-primary" size={16} />
              </button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};