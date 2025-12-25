import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { useAuth } from '@/modules/auth/contexts/AuthContext';
import { getUserProjects, getAssignedProjects } from "./services/projectService";
import { toast } from "sonner";
import { ProjectListing } from "@/components/ProjectListing";
import { DashboardLayout } from "@/components/shared/DashboardLayout";
import { ProjectsHeader, ProjectsEmptyState } from "./components";

const ProjectsPage = () => {
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const projectsPerPage = 4;

  // Filter projects based on search term
  const filteredProjects = useMemo(() => {
    if (!searchTerm) return projects;

    return projects.filter(project =>
      project.Name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.Location?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [projects, searchTerm]);

  // Pagination logic
  const totalPages = Math.ceil(filteredProjects.length / projectsPerPage);
  const startIndex = (currentPage - 1) * projectsPerPage;
  const paginatedProjects = filteredProjects.slice(startIndex, startIndex + projectsPerPage);

  // Reset to first page when search term changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  useEffect(() => {
    // All roles can now access the projects page to view Oracle P6 projects
    console.log("User accessing projects page:", user?.Role);

    const fetchProjects = async () => {
      try {
        setLoading(true);
        setError(null);

        // Log user data for debugging
        console.log("User data in ProjectsPage:", user);
        console.log("User role:", user?.Role);

        // Fetch projects based on user role
        let projectsData: any[] = [];
        if (user?.Role === "supervisor") {
          console.log("Fetching assigned projects for supervisor");
          projectsData = await getAssignedProjects();
        } else {
          console.log("Fetching all projects for", user?.Role);
          projectsData = await getUserProjects();
        }

        console.log("Projects fetched:", projectsData);
        setProjects(projectsData);
      } catch (err) {
        setError("Failed to fetch projects");
        toast.error("Failed to fetch projects");
        console.error("Error fetching projects:", err);
      } finally {
        setLoading(false);
      }
    };

    if (token && user) {
      fetchProjects();
    }
  }, [token, user, navigate]);

  const handleProjectSelect = (project: any) => {
    if (!user) return;

    // Log the navigation for debugging
    console.log("Navigating to dashboard for role:", user.Role);
    console.log("Project data:", project);

    // Navigate based on user role
    switch (user.Role) {
      case "supervisor":
        navigate("/supervisor", {
          state: {
            user,
            projectId: project.ObjectId,
            projectName: project.Name,
            projectDetails: project
          }
        });
        break;

      case "Site PM":
        // For Site PM, we want to go to their dashboard but with project context
        navigate("/sitepm", {
          state: {
            user,
            projectId: project.ObjectId,
            projectName: project.Name,
            projectDetails: project
          }
        });
        break;

      case "PMAG":
        navigate("/pmag", {
          state: {
            user,
            projectId: project.ObjectId,
            projectName: project.Name,
            projectDetails: project
          }
        });
        break;

      default:
        // For any other role, show an error with the actual role
        console.error("Unsupported user role:", user.Role);
        toast.error(`Unsupported user role: ${user.Role}`);
        break;
    }
  };

  if (loading || error) {
    return (
      <DashboardLayout
        userName={user?.Name || "User"}
        userRole={user?.Role}
      >
        <ProjectsEmptyState
          userRole={user?.Role}
          isLoading={loading}
          error={error}
          onRetry={() => window.location.reload()}
        />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      userName={user?.Name || "User"}
      userRole={user?.Role}
    >
      <ProjectsHeader
        userRole={user?.Role}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
      />

      {filteredProjects.length === 0 ? (
        <ProjectsEmptyState
          userRole={user?.Role}
          searchTerm={searchTerm}
        />
      ) : (
        <div className="w-full">
          <ProjectListing
            projects={paginatedProjects.map(project => ({
              name: project.Name,
              planStart: project.PlannedStartDate ? new Date(project.PlannedStartDate).toISOString().split('T')[0] : "N/A",
              planEnd: project.PlannedFinishDate ? new Date(project.PlannedFinishDate).toISOString().split('T')[0] : "N/A",
              actualStart: project.ActualStartDate ? new Date(project.ActualStartDate).toISOString().split('T')[0] : "N/A",
              actualEnd: project.ActualFinishDate ? new Date(project.ActualFinishDate).toISOString().split('T')[0] : "N/A",
              members: project.members || 0
            }))}
            onProjectClick={(clickedProject) => {
              // Find the original project object that matches the clicked project
              const originalProject = filteredProjects.find(p => p.Name === clickedProject.name);
              if (originalProject) {
                handleProjectSelect(originalProject);
              }
            }}
          />

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center mt-8 space-x-2">
              <button
                className="px-4 py-2 border rounded-md"
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                Previous
              </button>

              <span className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </span>

              <button
                className="px-4 py-2 border rounded-md"
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}
    </DashboardLayout>
  );
};

export default ProjectsPage;