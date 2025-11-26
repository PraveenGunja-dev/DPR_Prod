import { motion } from "framer-motion";
import { useLocation } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { StatsCard } from "@/components/StatsCard";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileCheck, TrendingUp, Users, Award, Activity, Plus, FolderPlus, UserPlus, X } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Area, AreaChart } from "recharts";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/modules/auth/contexts/AuthContext";
import { registerUser } from "@/modules/auth/services/authService";
import { createProject, assignProjectToSupervisor, getUserProjects } from "@/modules/auth/services/projectService";
import { getAllSupervisors } from "@/modules/auth/services/authService";
import { toast } from "sonner";

// Function to format date as YYYY-MM-DD
const formatDate = (dateString: string | null | undefined): string => {
  if (!dateString) return "Not set";
  const date = new Date(dateString);
  return date.toISOString().split('T')[0];
};

const PMRGDashboard = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const { projectName, projectId } = location.state || { 
    projectName: "Project", 
    projectId: null 
  };

  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [showCreateProjectModal, setShowCreateProjectModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showAssignProjectModal, setShowAssignProjectModal] = useState(false);
  const [projects, setProjects] = useState<any[]>([]);
  const [supervisors, setSupervisors] = useState<any[]>([]);
  const [projectForm, setProjectForm] = useState({
    name: "",
    location: "",
    status: "planning",
    progress: 0,
    planStart: "",
    planEnd: ""
  });
  const [registerForm, setRegisterForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "supervisor" as "supervisor" | "Site PM" | "PMAG"
  });
  const [assignForm, setAssignForm] = useState({
    projectId: "",
    supervisorId: ""
  });
  const [loading, setLoading] = useState(false);
  const [registerLoading, setRegisterLoading] = useState(false);
  const [assignLoading, setAssignLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [registeredUser, setRegisteredUser] = useState({
    email: '',
    password: '',
    role: ''
  });

  // Fetch projects and supervisors
  const fetchData = async () => {
    try {
      // Fetch projects
      const projectsData = await getUserProjects();
      setProjects(projectsData);
      
      // Fetch supervisors from API
      console.log("About to fetch supervisors...");
      const supervisorsData = await getAllSupervisors();
      console.log("Supervisors fetched:", supervisorsData); // Debug log
      setSupervisors(supervisorsData);
    } catch (error) {
      console.error("Failed to fetch data:", error); // Debug log
      toast.error("Failed to fetch data");
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateUser = () => {
    setShowRegisterModal(true);
  };

  const handleCreateProject = () => {
    setShowCreateProjectModal(true);
  };

  const handleAssignProject = () => {
    console.log("Supervisors available for assignment:", supervisors); // Debug log
    console.log("Number of supervisors:", supervisors.length); // Debug log
    setShowAssignProjectModal(true);
  };

  const handleProjectFormChange = (field: string, value: string | number) => {
    setProjectForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleRegisterFormChange = (field: string, value: string) => {
    setRegisterForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAssignFormChange = (field: string, value: string) => {
    setAssignForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleProjectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const projectData = {
        name: projectForm.name,
        location: projectForm.location,
        status: projectForm.status,
        progress: projectForm.progress,
        planStart: projectForm.planStart,
        planEnd: projectForm.planEnd,
        actualStart: null,
        actualEnd: null
      };
      
      await createProject(projectData);
      
      toast.success("Project created successfully!");
      setShowCreateProjectModal(false);
      
      // Reset form
      setProjectForm({
        name: "",
        location: "",
        status: "planning",
        progress: 0,
        planStart: "",
        planEnd: ""
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Project creation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegisterLoading(true);
    
    try {
      const userData = {
        name: registerForm.name,
        email: registerForm.email,
        password: registerForm.password,
        role: registerForm.role
      };
      
      await registerUser(userData);
      
      // Show success modal with user details
      setRegisteredUser({
        email: registerForm.email,
        password: registerForm.password,
        role: registerForm.role
      });
      setShowSuccessModal(true);
      setShowRegisterModal(false);
      
      // Reset form
      setRegisterForm({
        name: "",
        email: "",
        password: "",
        role: "supervisor"
      });
      
      // Refresh supervisors list to include the newly created supervisor
      if (registerForm.role === "supervisor") {
        const supervisorsData = await getAllSupervisors();
        setSupervisors(supervisorsData);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setRegisterLoading(false);
    }
  };

  const handleAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAssignLoading(true);
    
    try {
      // Call the API to assign the project to the supervisor
      const projectId = parseInt(assignForm.projectId);
      const supervisorId = parseInt(assignForm.supervisorId);
      
      if (isNaN(projectId) || isNaN(supervisorId)) {
        throw new Error("Invalid project or supervisor ID");
      }
      
      await assignProjectToSupervisor(projectId, supervisorId);
      
      toast.success("Project assigned to supervisor successfully!");
      setShowAssignProjectModal(false);
      
      // Reset form
      setAssignForm({
        projectId: "",
        supervisorId: ""
      });
    } catch (error) {
      toast.error("Failed to assign project: " + (error instanceof Error ? error.message : "Unknown error"));
    } finally {
      setAssignLoading(false);
    }
  };

  const statsData = [
    { title: "Total Projects", value: 24, change: 12, icon: FolderPlus },
    { title: "Active Projects", value: 18, change: 5, icon: Activity },
    { title: "Completed", value: 6, change: 2, icon: FileCheck },
    { title: "Team Members", value: 42, change: 8, icon: Users },
  ];

  const approvalData = [
    { month: "Jan", approvals: 45 },
    { month: "Feb", approvals: 52 },
    { month: "Mar", approvals: 48 },
    { month: "Apr", approvals: 61 },
    { month: "May", approvals: 55 },
    { month: "Jun", approvals: 67 },
  ];

  const phaseData = [
    { name: "Planning", value: 25 },
    { name: "Execution", value: 45 },
    { name: "Monitoring", value: 12 },
    { name: "Closing", value: 8 },
  ];

  const COLORS = ["hsl(var(--primary))", "hsl(var(--secondary))", "hsl(var(--accent))", "hsl(var(--muted))"];

  const recentApprovals = [
    { id: "AP-2024-001", project: "Mundra Port", type: "Budget Approval", status: "approved", date: "2024-01-15" },
    { id: "AP-2024-002", project: "Ahmedabad Metro", type: "Design Change", status: "approved", date: "2024-01-14" },
    { id: "AP-2024-003", project: "Chennai Coastal", type: "Resource Allocation", status: "pending", date: "2024-01-14" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar 
        userName={user?.name || "Admin User"} 
        userRole={user?.role || "PMAG"} 
        projectName={projectName}
        onAddUser={handleCreateUser}
        onAddProject={handleCreateProject}
        onAssignProject={handleAssignProject}
      />

      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-muted-foreground">
                {projectName ? `Project: ${projectName}` : "Project dashboard for PMRG activities"}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statsData.map((stat, index) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <StatsCard {...stat} />
            </motion.div>
          ))}
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="p-6">
              <h3 className="text-xl font-semibold mb-4">Monthly Approvals</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={approvalData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="approvals" fill="hsl(var(--primary))" />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="p-6">
              <h3 className="text-xl font-semibold mb-4">Project Phases</h3>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={phaseData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Area type="monotone" dataKey="value" stroke="hsl(var(--primary))" fill="hsl(var(--primary)/0.2)" />
                </AreaChart>
              </ResponsiveContainer>
            </Card>
          </motion.div>
        </div>

        {/* Recent Approvals and Project Status */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold">Recent Approvals</h3>
                <Button variant="outline" size="sm">View All</Button>
              </div>
              <div className="space-y-4">
                {recentApprovals.map((approval) => (
                  <div key={approval.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{approval.id}</p>
                      <p className="text-sm text-muted-foreground">{approval.project} - {approval.type}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={approval.status === "approved" ? "default" : "secondary"}>
                        {approval.status}
                      </Badge>
                      <span className="text-sm text-muted-foreground">{approval.date}</span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold">Project Status</h3>
                <Button variant="outline" size="sm">View All</Button>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Planning</span>
                  <span className="font-medium">25%</span>
                </div>
                <div className="w-full bg-secondary rounded-full h-2">
                  <div className="bg-primary h-2 rounded-full" style={{ width: "25%" }}></div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Execution</span>
                  <span className="font-medium">45%</span>
                </div>
                <div className="w-full bg-secondary rounded-full h-2">
                  <div className="bg-primary h-2 rounded-full" style={{ width: "45%" }}></div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Monitoring</span>
                  <span className="font-medium">12%</span>
                </div>
                <div className="w-full bg-secondary rounded-full h-2">
                  <div className="bg-primary h-2 rounded-full" style={{ width: "12%" }}></div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Closing</span>
                  <span className="font-medium">8%</span>
                </div>
                <div className="w-full bg-secondary rounded-full h-2">
                  <div className="bg-primary h-2 rounded-full" style={{ width: "8%" }}></div>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>
      </div>

      {/* Create User Modal */}
      <Dialog open={showRegisterModal} onOpenChange={setShowRegisterModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create New User</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleRegisterSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={registerForm.name}
                onChange={(e) => handleRegisterFormChange("name", e.target.value)}
                placeholder="Enter full name"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={registerForm.email}
                onChange={(e) => handleRegisterFormChange("email", e.target.value)}
                placeholder="Enter email"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={registerForm.password}
                onChange={(e) => handleRegisterFormChange("password", e.target.value)}
                placeholder="Enter password"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select
                value={registerForm.role}
                onValueChange={(value) => handleRegisterFormChange("role", value as any)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="supervisor">Supervisor</SelectItem>
                  <SelectItem value="Site PM">Site PM</SelectItem>
                  <SelectItem value="PMAG">PMAG</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <Button
              type="submit"
              disabled={registerLoading}
              className="w-full"
            >
              {registerLoading ? 'Creating Account...' : 'Register User'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Success Modal */}
      <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-green-500">User Created Successfully!</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="mb-4">The following user has been successfully registered:</p>
            <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
              <p><strong>Email:</strong> {registeredUser.email}</p>
              <p><strong>Password:</strong> {registeredUser.password}</p>
              <p><strong>Role:</strong> {registeredUser.role}</p>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              Please share these credentials with the user. They can now log in to the system.
            </p>
          </div>
          <Button onClick={() => setShowSuccessModal(false)} className="w-full">
            Continue
          </Button>
        </DialogContent>
      </Dialog>

      {/* Create Project Modal */}
      <Dialog open={showCreateProjectModal} onOpenChange={setShowCreateProjectModal}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Project</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleProjectSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="projectName">Project Name</Label>
              <Input
                id="projectName"
                value={projectForm.name}
                onChange={(e) => handleProjectFormChange("name", e.target.value)}
                placeholder="Enter project name"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={projectForm.location}
                onChange={(e) => handleProjectFormChange("location", e.target.value)}
                placeholder="Enter project location"
                required
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="planStart">Plan Start Date</Label>
                <Input
                  id="planStart"
                  type="date"
                  value={projectForm.planStart}
                  onChange={(e) => handleProjectFormChange("planStart", e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="planEnd">Plan End Date</Label>
                <Input
                  id="planEnd"
                  type="date"
                  value={projectForm.planEnd}
                  onChange={(e) => handleProjectFormChange("planEnd", e.target.value)}
                  required
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={projectForm.status}
                onValueChange={(value) => handleProjectFormChange("status", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="planning">Planning</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="on-hold">On Hold</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <Button
              type="submit"
              disabled={loading}
              className="w-full"
            >
              {loading ? 'Creating Project...' : 'Create Project'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Assign Project Modal */}
      <Dialog open={showAssignProjectModal} onOpenChange={setShowAssignProjectModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Assign Project to Supervisor</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAssignSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="projectId">Project</Label>
              <Select
                value={assignForm.projectId}
                onValueChange={(value) => handleAssignFormChange("projectId", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select project" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id.toString()}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="supervisorId">Supervisor</Label>
              <Select
                value={assignForm.supervisorId}
                onValueChange={(value) => handleAssignFormChange("supervisorId", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select supervisor" />
                </SelectTrigger>
                <SelectContent>
                  {supervisors.map((supervisor) => (
                    <SelectItem key={supervisor.user_id} value={supervisor.user_id.toString()}>
                      {supervisor.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <Button
              type="submit"
              disabled={assignLoading}
              className="w-full"
            >
              {assignLoading ? 'Assigning...' : 'Assign Project'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PMRGDashboard;