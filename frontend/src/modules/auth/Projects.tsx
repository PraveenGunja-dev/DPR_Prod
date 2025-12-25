import { motion } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "./contexts/AuthContext";

const Projects = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  
  // Use authenticated user role if available, otherwise fallback to location state
  const role = user?.Role || (location.state?.role || "User");

  // This component is now just a placeholder for the old dashboard selection
  // The new ProjectsPage component handles the actual project listing

  return (
    <div className="min-h-screen bg-background">
      <Navbar userName={user?.Name || "User"} userRole={role} />

      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Button
            variant="ghost"
            onClick={() => navigate("/projects")}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Projects
          </Button>

          <div className="text-center mb-12">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent"
            >
              Dashboard Selection (Legacy)
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-lg text-muted-foreground"
            >
              This page is deprecated. Please use the Projects page instead.
            </motion.p>
          </div>
        </motion.div>

        <div className="text-center">
          <Button 
            onClick={() => navigate("/projects")}
            className="bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90"
          >
            Go to Projects Page
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Projects;