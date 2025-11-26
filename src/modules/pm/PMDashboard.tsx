import { motion } from "framer-motion";
import { useLocation, useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { StatsCard } from "@/components/StatsCard";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, CheckCircle, Clock, AlertCircle, Eye, Edit, Check } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";

// Function to format date as YYYY-MM-DD
const formatDate = (dateString: string | null | undefined): string => {
  if (!dateString) return "Not set";
  const date = new Date(dateString);
  return date.toISOString().split('T')[0];
};

const PMDashboard = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, projectName, projectId, projectDetails } = location.state || { 
    user: { name: "PM User", role: "Site PM" },
    projectName: "Project", 
    projectId: null,
    projectDetails: null
  };

  const statsData = [
    { title: "Total Sheets", value: 156, icon: FileText, trend: { value: 12, isPositive: true } },
    { title: "Reviewed", value: 142, icon: CheckCircle, trend: { value: 8, isPositive: true } },
    { title: "Pending", value: 14, icon: Clock, trend: { value: 3, isPositive: false } },
    { title: "Revisions", value: 8, icon: AlertCircle, trend: { value: 2, isPositive: true } },
  ];

  const weeklyData = [
    { week: "Week 1", sheets: 32 },
    { week: "Week 2", sheets: 45 },
    { week: "Week 3", sheets: 38 },
    { week: "Week 4", sheets: 41 },
  ];

  const categoryData = [
    { name: "Labor", value: 35 },
    { name: "Materials", value: 28 },
    { name: "Equipment", value: 22 },
    { name: "Others", value: 15 },
  ];

  const COLORS = ["hsl(var(--primary))", "hsl(var(--secondary))", "hsl(var(--accent))", "hsl(var(--muted))"];

  const reviewQueue = [
    { id: "SH-2024-156", supervisor: "John Doe", time: "2 hours ago", status: "pending" },
    { id: "SH-2024-155", supervisor: "Jane Smith", time: "4 hours ago", status: "pending" },
    { id: "SH-2024-154", supervisor: "Mike Johnson", time: "1 day ago", status: "under-review" },
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
                PM Dashboard
              </h1>
              <p className="text-muted-foreground">
                {projectName ? `Project: ${projectName}` : "Project dashboard for project management"}
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
                  <FileText className="w-5 h-5 text-primary mr-2" />
                  <span className="font-medium">Validation Dashboard</span>
                </div>
              </div>
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
              transition={{ delay: 0.1 * index }}
            >
              <StatsCard {...stat} />
            </motion.div>
          ))}
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Weekly Sheet Submissions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="p-6">
              <h3 className="text-xl font-bold mb-4">Weekly Sheet Submissions</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weeklyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="week" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="sheets" fill="hsl(var(--primary))" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </motion.div>

          {/* Resource Allocation */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="p-6">
              <h3 className="text-xl font-bold mb-4">Resource Allocation</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </motion.div>
        </div>

        {/* Review Queue */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold">Review Queue</h3>
              <Button variant="outline" size="sm">
                View All
              </Button>
            </div>
            <div className="space-y-4">
              {reviewQueue.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex items-center space-x-4">
                    <div className="flex flex-col">
                      <span className="font-medium">{item.id}</span>
                      <span className="text-sm text-muted-foreground">by {item.supervisor}</span>
                    </div>
                    <Badge variant={item.status === "pending" ? "secondary" : "default"}>
                      {item.status === "pending" ? "Pending" : "Under Review"}
                    </Badge>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-muted-foreground">{item.time}</span>
                    <Button size="sm" variant="ghost">
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="ghost">
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="ghost" className="text-green-500 hover:text-green-600 hover:bg-green-50">
                      <Check className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default PMDashboard;