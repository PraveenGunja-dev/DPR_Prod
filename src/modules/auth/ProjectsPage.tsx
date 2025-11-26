import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Navbar } from "@/components/Navbar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building2, Calendar, MapPin, Users, FileText, Loader2 } from "lucide-react";
import { useAuth } from "./contexts/AuthContext";
import { getUserProjects, getAssignedProjects } from "./services/projectService";
import { toast } from "sonner";

const ProjectsPage = () => {
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch projects based on user role
        let projectsData;
        if (user?.role === "supervisor") {
          projectsData = await getAssignedProjects();
        } else {
          projectsData = await getUserProjects();
        }
        
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
  }, [token, user]);

  const handleProjectSelect = (project: any) => {
    if (!user) return;
    
    if (user.role === "supervisor") {
      navigate("/supervisor", { 
        state: { 
          user,
          projectId: project.id, 
          projectName: project.name,
          projectDetails: project
        } 
      });
    } else if (user.role === "Site PM") {
      navigate("/pm", { 
        state: { 
          user,
          projectId: project.id, 
          projectName: project.name,
          projectDetails: project
        } 
      });
    } else if (user?.role === "PMAG") {
      navigate("/pmrg", { 
        state: { 
          user,
          projectId: project.id, 
          projectName: project.name,
          projectDetails: project
        } 
      });
    }
  };

  if (loading) {
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
        <div className="text-center">
          <p className="text-red-500">Error: {error}</p>
          <Button 
            onClick={() => window.location.reload()} 
            className="mt-4"
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar userName={user?.name || "User"} userRole={user?.role} />

      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Your Projects
          </h1>
          <p className="text-muted-foreground">
            {user?.role === "supervisor" 
              ? "Select a project to manage your daily activities" 
              : "Select a project to view and manage"}
          </p>
        </motion.div>

        {projects.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12"
          >
            <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Projects Found</h3>
            <p className="text-muted-foreground mb-6">
              {user?.role === "supervisor"
                ? "You haven't been assigned to any projects yet."
                : "There are no projects available at the moment."}
            </p>
            {user?.role === "PMAG" && (
              <Button onClick={() => navigate("/pmrg")}>
                Go to PMRG Dashboard
              </Button>
            )}
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project, index) => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card 
                  className="p-6 cursor-pointer hover:shadow-lg transition-all duration-300 border-l-4 border-l-primary"
                  onClick={() => handleProjectSelect(project)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="bg-primary/10 p-3 rounded-lg">
                      <Building2 className="w-6 h-6 text-primary" />
                    </div>
                    <Button variant="ghost" size="sm">
                      View Details
                    </Button>
                  </div>
                  
                  <h3 className="text-xl font-semibold mb-2">{project.name}</h3>
                  
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex items-center">
                      <MapPin className="w-4 h-4 mr-2" />
                      <span>{project.location || "Location not specified"}</span>
                    </div>
                    
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-2" />
                      <span>
                        {project.planStart ? new Date(project.planStart).toLocaleDateString() : "N/A"} - 
                        {project.planEnd ? new Date(project.planEnd).toLocaleDateString() : "N/A"}
                      </span>
                    </div>
                    
                    <div className="flex items-center">
                      <Users className="w-4 h-4 mr-2" />
                      <span className="capitalize">{project.status || "Status unknown"}</span>
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Progress</span>
                      <span className="text-sm font-medium">{project.progress || 0}%</span>
                    </div>
                    <div className="mt-2 w-full bg-secondary rounded-full h-2">
                      <div 
                        className="bg-primary h-2 rounded-full" 
                        style={{ width: `${project.progress || 0}%` }}
                      ></div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectsPage;