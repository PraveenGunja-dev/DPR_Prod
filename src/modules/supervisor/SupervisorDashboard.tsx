import { motion } from "framer-motion";
import { useLocation, useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { FileSpreadsheet, Package, DollarSign, CheckCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { ExcelSheet } from "@/components/ExcelSheet";
import { getAssignedProjects } from "@/modules/auth/services/projectService";
import { useAuth } from "@/modules/auth/contexts/AuthContext";
import { toast } from "sonner";

// Function to format date as YYYY-MM-DD
const formatDate = (dateString: string | null | undefined): string => {
  if (!dateString) return "Not set";
  const date = new Date(dateString);
  return date.toISOString().split('T')[0];
};

const SupervisorDashboard = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { token } = useAuth();
  const { user, projectName, projectId, projectDetails } = location.state || { 
    user: { name: "Supervisor User", role: "supervisor" },
    projectName: "Project", 
    projectId: null,
    projectDetails: null
  };

  const [activeTab, setActiveTab] = useState("daily-input");
  const [assignedProjects, setAssignedProjects] = useState<any[]>([]);

  // Fetch assigned projects
  useEffect(() => {
    const fetchAssignedProjects = async () => {
      try {
        const projects = await getAssignedProjects();
        setAssignedProjects(projects);
      } catch (error) {
        toast.error("Failed to fetch assigned projects");
      }
    };

    if (token) {
      fetchAssignedProjects();
    }
  }, [token]);

  // Daily Input Sheet Data
  const dailyInputColumns = [
    "Date",
    "Shift",
    "Activity Code",
    "Activity Description",
    "Resource Type",
    "Quantity Used",
    "Unit",
    "Progress %",
    "Remarks",
  ];

  const dailyInputRows = [
    [
      { value: "2024-01-15", readOnly: true },
      { value: "Morning", readOnly: true },
      { value: "ACT-001", readOnly: true },
      { value: "Concrete Foundation Work", readOnly: true },
      { value: "", readOnly: false, columnType: "text" as const },
      { value: "", readOnly: false, columnType: "number" as const },
      { value: "", readOnly: false, columnType: "text" as const },
      { value: "", readOnly: false, columnType: "number" as const },
      { value: "", readOnly: false, columnType: "text" as const },
    ],
    [
      { value: "2024-01-15", readOnly: true },
      { value: "Evening", readOnly: true },
      { value: "ACT-002", readOnly: true },
      { value: "Steel Reinforcement", readOnly: true },
      { value: "", readOnly: false, columnType: "text" as const },
      { value: "", readOnly: false, columnType: "number" as const },
      { value: "", readOnly: false, columnType: "text" as const },
      { value: "", readOnly: false, columnType: "number" as const },
      { value: "", readOnly: false, columnType: "text" as const },
    ],
  ];

  // Material Tracking Sheet Data
  const materialColumns = [
    "Date",
    "Material Name",
    "Supplier",
    "Invoice Number",
    "Quantity Received",
    "Unit",
    "Unit Price",
    "Total Cost",
    "Remarks",
  ];

  const materialRows = [
    [
      { value: "2024-01-15", readOnly: true },
      { value: "", readOnly: false, columnType: "text" as const },
      { value: "", readOnly: false, columnType: "text" as const },
      { value: "", readOnly: false, columnType: "text" as const },
      { value: "", readOnly: false, columnType: "number" as const },
      { value: "", readOnly: false, columnType: "text" as const },
      { value: "", readOnly: false, columnType: "number" as const },
      { value: "", readOnly: true },
      { value: "", readOnly: false, columnType: "text" as const },
    ],
  ];

  // Cost Tracking Sheet Data
  const costColumns = [
    "Date",
    "Expense Category",
    "Description",
    "Amount",
    "Payment Method",
    "Vendor",
    "Remarks",
  ];

  const costRows = [
    [
      { value: "2024-01-15", readOnly: true },
      { value: "", readOnly: false, columnType: "text" as const },
      { value: "", readOnly: false, columnType: "text" as const },
      { value: "", readOnly: false, columnType: "number" as const },
      { value: "", readOnly: false, columnType: "text" as const },
      { value: "", readOnly: false, columnType: "text" as const },
      { value: "", readOnly: false, columnType: "text" as const },
    ],
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar 
        userName={user.name} 
        userRole={user.role} 
        projectName={projectName}
        onAddUser={() => alert("Add User functionality is only available for PMAG users")}
        onAddProject={() => alert("Add Project functionality is only available for PMAG users")}
      />

      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Supervisor Dashboard
              </h1>
              <p className="text-muted-foreground">
                {projectName ? `Project: ${projectName}` : "Project dashboard for supervisor activities"}
              </p>
              {projectDetails && (
                <div className="mt-2 text-sm text-muted-foreground">
                  <p>Plan: {formatDate(projectDetails.planStart)} to {formatDate(projectDetails.planEnd)}</p>
                  <p>Actual: {formatDate(projectDetails.actualStart) || "Not started"} to {formatDate(projectDetails.actualEnd) || "Not completed"}</p>
                </div>
              )}
            </div>
            <div className="flex items-center space-x-4">
              <div className="bg-primary/10 px-4 py-2 rounded-lg">
                <div className="flex items-center">
                  <FileSpreadsheet className="w-5 h-5 text-primary mr-2" />
                  <span className="font-medium">Sheet Submission</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="daily-input" className="flex items-center justify-center">
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              Daily Input Sheet
            </TabsTrigger>
            <TabsTrigger value="material" className="flex items-center justify-center">
              <Package className="w-4 h-4 mr-2" />
              Material Tracking
            </TabsTrigger>
            <TabsTrigger value="cost" className="flex items-center justify-center">
              <DollarSign className="w-4 h-4 mr-2" />
              Cost Tracking
            </TabsTrigger>
          </TabsList>

          <TabsContent value="daily-input">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="p-6">
                <h2 className="text-2xl font-bold mb-6 flex items-center">
                  <FileSpreadsheet className="w-6 h-6 mr-2 text-primary" />
                  Daily Input Sheet
                </h2>
                <ExcelSheet
                  title="Daily Input Sheet"
                  columns={dailyInputColumns}
                  rows={dailyInputRows}
                  onSubmit={() => toast.success("Daily input sheet submitted successfully!")}
                />
              </Card>
            </motion.div>
          </TabsContent>

          <TabsContent value="material">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="p-6">
                <h2 className="text-2xl font-bold mb-6 flex items-center">
                  <Package className="w-6 h-6 mr-2 text-primary" />
                  Material Tracking Sheet
                </h2>
                <ExcelSheet
                  title="Material Tracking Sheet"
                  columns={materialColumns}
                  rows={materialRows}
                  onSubmit={() => toast.success("Material tracking sheet submitted successfully!")}
                />
              </Card>
            </motion.div>
          </TabsContent>

          <TabsContent value="cost">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="p-6">
                <h2 className="text-2xl font-bold mb-6 flex items-center">
                  <DollarSign className="w-6 h-6 mr-2 text-primary" />
                  Cost Tracking Sheet
                </h2>
                <ExcelSheet
                  title="Cost Tracking Sheet"
                  columns={costColumns}
                  rows={costRows}
                  onSubmit={() => toast.success("Cost tracking sheet submitted successfully!")}
                />
              </Card>
            </motion.div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default SupervisorDashboard;