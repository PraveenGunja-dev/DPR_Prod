import { motion } from "framer-motion";
import { Building2, User, LogOut, Users, FolderPlus, BarChart3, UserPlus } from "lucide-react";
import { Button } from "./ui/button";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/modules/auth/contexts/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface NavbarProps {
  userName?: string;
  userRole?: string;
  projectName?: string;
  onAddUser?: () => void;
  onAddProject?: () => void;
  onAssignProject?: () => void;
}

export const Navbar = ({ userName, userRole, projectName, onAddUser, onAddProject, onAssignProject }: NavbarProps) => {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const handleAddUser = () => {
    if (onAddUser) {
      onAddUser();
    } else {
      // Default behavior if no handler is provided
      alert("Add User functionality is not available for this user role");
    }
  };

  const handleAddProject = () => {
    if (onAddProject) {
      onAddProject();
    } else {
      // Default behavior if no handler is provided
      alert("Add Project functionality is not available for this user role");
    }
  };

  const handleAssignProject = () => {
    if (onAssignProject) {
      onAssignProject();
    } else {
      // Default behavior if no handler is provided
      alert("Assign Project functionality is not available for this user role");
    }
  };

  const handleCharts = () => {
    // Navigate to charts page or open charts modal
    alert("Charts functionality will be implemented soon!");
  };

  const handleProjects = () => {
    navigate("/projects");
  };

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="sticky top-0 z-50 w-full border-b border-border glass-effect"
    >
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Adani Workflow
            </span>
          </div>
          {projectName && (
            <div className="hidden md:flex items-center space-x-2 pl-4 border-l border-border">
              <span className="text-sm text-muted-foreground">Project:</span>
              <span className="text-sm font-semibold text-foreground">{projectName}</span>
            </div>
          )}
        </div>

        {userName && (
          <div className="flex items-center space-x-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                    <User className="w-4 h-4 text-white" />
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{userName}</p>
                    <p className="text-xs leading-none text-muted-foreground">{userRole}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  {userRole === "PMAG" && (
                    <>
                      <DropdownMenuItem onClick={handleAddUser}>
                        <Users className="mr-2 h-4 w-4" />
                        <span>Add User</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={handleAddProject}>
                        <FolderPlus className="mr-2 h-4 w-4" />
                        <span>Add Project</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={handleAssignProject}>
                        <UserPlus className="mr-2 h-4 w-4" />
                        <span>Assign Project</span>
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuItem onClick={handleProjects}>
                    <FolderPlus className="mr-2 h-4 w-4" />
                    <span>Projects</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleCharts}>
                    <BarChart3 className="mr-2 h-4 w-4" />
                    <span>Charts</span>
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>
    </motion.nav>
  );
};