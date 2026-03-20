import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from '@/modules/auth/contexts/AuthContext';
import { getUserProjects, getAssignedProjects } from "@/services/projectService";
import { toast } from "sonner";
import { ProjectListing } from "@/components/ProjectListing";
import { SummaryModal } from "@/components/SummaryModal";
import { DashboardLayout } from "@/components/shared/DashboardLayout";
import { ProjectsHeader, ProjectsEmptyState } from "./components";
import { ProjectAssignmentModal } from "@/components/shared/ProjectAssignmentModal";
import { CreateUserModal } from "@/components/shared/CreateUserModal";
import { Project } from "@/types";
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination";

const ProjectsPage = () => {
    const navigate = useNavigate();
    const { user, token } = useAuth();
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const projectsPerPage = 10;

    const [showSummaryModal, setShowSummaryModal] = useState(false);
    const [selectedSummaryProject, setSelectedSummaryProject] = useState<Project | null>(null);
    const [showAssignmentModal, setShowAssignmentModal] = useState(false);
    const [selectedAssignProject, setSelectedAssignProject] = useState<Project | null>(null);
    const [showCreateUserModal, setShowCreateUserModal] = useState(false);

    const filteredProjects = useMemo(() => {
        return projects.filter(p => {
            const name = p.name || (p as any).Name || "";
            return name.toLowerCase().includes(searchTerm.toLowerCase());
        });
    }, [projects, searchTerm]);

    // Reset pagination to page 1 whenever search query changes
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);

    const totalPages = Math.ceil(filteredProjects.length / projectsPerPage);
    const startIndex = (currentPage - 1) * projectsPerPage;
    const paginatedProjects = filteredProjects.slice(startIndex, startIndex + projectsPerPage);

    const formatProjectName = (name: string) => {
        if (!name) return "N/A";
        
        // Handle "YYYY.MM.DD - Name" format
        if (name.includes(' - ')) {
            const [datePart, ...rest] = name.split(' - ');
            return `${rest.join(' - ')} : ${datePart}`;
        }
        
        // Handle underscore format e.g. "ASEJo6PL_NAME"
        if (name.includes('_')) {
            const parts = name.split('_');
            const prefix = parts[0];
            const remaining = parts.slice(1).join('_');
            if (prefix && remaining) {
                return `${remaining} : ${prefix}`;
            }
        }
        
        return name;
    };

    const formatDateOnly = (dateStr: any) => {
        if (!dateStr || dateStr === 'N/A') return 'N/A';
        try {
            // Extracts YYYY-MM-DD from ISO or complex strings
            return dateStr.split('T')[0];
        } catch (e) {
            return dateStr;
        }
    };

    const fetchProjects = async () => {
        try {
            setLoading(true);
            const data = (user?.role === "supervisor" || user?.Role === "supervisor") 
                ? await getAssignedProjects() 
                : await getUserProjects();
            setProjects(data);
        } catch (err) {
            setError("Failed to fetch projects");
            toast.error("Failed to fetch projects");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (token && user) fetchProjects();
    }, [token, user]);

    const handleProjectSelect = (project: Project) => {
        const role = user?.role || user?.Role;
        const route = role === "supervisor" ? "/supervisor" : (role === "Site PM" ? "/sitepm" : (role === "PMAG" ? "/pmag" : "/"));
        
        navigate(route, {
            state: {
                projectId: project.id || (project as any).ObjectId,
                projectName: project.name || (project as any).Name,
                projectDetails: project
            }
        });
    };

    return (
        <DashboardLayout userName={user?.name || user?.Name || "User"} userRole={user?.role || user?.Role}>
            <ProjectsHeader userRole={user?.role || user?.Role} searchTerm={searchTerm} onSearchChange={setSearchTerm} onAddUserClick={() => setShowCreateUserModal(true)} />
            
            {loading ? <ProjectsEmptyState isLoading={true} /> : filteredProjects.length === 0 ? <ProjectsEmptyState searchTerm={searchTerm} /> : (
                <div className="w-full">
                    <ProjectListing
                        projects={paginatedProjects.map(p => ({
                            name: formatProjectName(p.name || (p as any).Name),
                            location: p.location || (p as any).Location || '',
                            status: p.status || (p as any).Status || 'Active',
                            startDate: formatDateOnly((p as any).PlannedStartDate || (p as any).planStart || 'N/A'),
                            endDate: formatDateOnly((p as any).PlannedFinishDate || (p as any).planEnd || 'N/A'),
                            sheetTypes: (p as any).sheetTypes || (p as any).SheetTypes || (p as any).sheet_types || [],
                            originalProject: p
                        }))}
                        onProjectClick={(p: any) => handleProjectSelect(p.originalProject)}
                        userRole={user?.role || user?.Role}
                        onSummaryClick={(p: any) => { setSelectedSummaryProject(p.originalProject); setShowSummaryModal(true); }}
                        onAssignClick={(p: any) => { setSelectedAssignProject(p.originalProject); setShowAssignmentModal(true); }}
                    />

                    {totalPages > 1 && (
                        <div className="mt-8 mb-12">
                            <Pagination>
                                <PaginationContent>
                                    <PaginationItem>
                                        <PaginationPrevious 
                                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                            className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                                        />
                                    </PaginationItem>
                                    
                                    {[...Array(totalPages)].map((_, i) => {
                                        const pageNum = i + 1;
                                        // Show first page, last page, and pages around current
                                        if (
                                            pageNum === 1 || 
                                            pageNum === totalPages || 
                                            (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                                        ) {
                                            return (
                                                <PaginationItem key={pageNum}>
                                                    <PaginationLink 
                                                        onClick={() => setCurrentPage(pageNum)}
                                                        isActive={currentPage === pageNum}
                                                        className="cursor-pointer"
                                                    >
                                                        {pageNum}
                                                    </PaginationLink>
                                                </PaginationItem>
                                            );
                                        }
                                        // Add ellipsis
                                        if (pageNum === 2 || pageNum === totalPages - 1) {
                                            return (
                                                <PaginationItem key={pageNum}>
                                                    <span className="px-2">...</span>
                                                </PaginationItem>
                                            );
                                        }
                                        return null;
                                    })}

                                    <PaginationItem>
                                        <PaginationNext 
                                            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                            className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                                        />
                                    </PaginationItem>
                                </PaginationContent>
                            </Pagination>
                            <div className="text-center text-sm text-muted-foreground mt-2">
                                Showing {startIndex + 1} to {Math.min(startIndex + projectsPerPage, filteredProjects.length)} of {filteredProjects.length} projects
                            </div>
                        </div>
                    )}
                </div>
            )}

            <SummaryModal isOpen={showSummaryModal} onClose={() => setShowSummaryModal(false)} 
                projectId={selectedSummaryProject?.id || (selectedSummaryProject as any)?.ObjectId} 
                projectName={selectedSummaryProject?.name || (selectedSummaryProject as any)?.Name || "Project"} />
            
            <ProjectAssignmentModal isOpen={showAssignmentModal} onClose={() => setShowAssignmentModal(false)}
                project={selectedAssignProject} onAssignmentComplete={fetchProjects} userRole={user?.role || user?.Role} />

            <CreateUserModal isOpen={showCreateUserModal} onClose={() => setShowCreateUserModal(false)} onUserCreated={fetchProjects} />
        </DashboardLayout>
    );
};

export default ProjectsPage;