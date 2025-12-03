// src/modules/supervisor/DPRDashboard.tsx
import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Navbar } from "@/components/Navbar";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  FileSpreadsheet, 
  Package, 
  User, 
  Save, 
  Send,
  AlertCircle,
  Plus,
  Grid3X3,
  Building,
  Wrench
} from "lucide-react";
import { useAuth } from "@/modules/auth/contexts/AuthContext";
import { getAssignedProjects } from "@/modules/auth/services/projectService";
import { getDraftEntry, saveDraftEntry, submitEntry, getTodayAndYesterday } from "@/modules/auth/services/dprSupervisorService";
import { toast } from "sonner";
import { ExcelTable } from "@/components/ExcelTable";

// Import the new table components
import { DPQtyTable } from "./components/DPQtyTable";
import { DPVendorBlockTable } from "./components/DPVendorBlockTable";
import { ManpowerDetailsTable } from "./components/ManpowerDetailsTable";
import { DPBlockTable } from "./components/DPBlockTable";
import { DPVendorIdtTable } from "./components/DPVendorIdtTable";
import { MmsModuleRfiTable } from "./components/MmsModuleRfiTable";

// Helper function to format date as YYYY-MM-DD
const formatDate = (dateString: string | null | undefined): string => {
  if (!dateString) return "Not set";
  const date = new Date(dateString);
  return date.toISOString().split('T')[0];
};

const DPRDashboard = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, token } = useAuth();
  
  // Extract project data from location state
  const locationState = location.state || {};
  const projectName = locationState.projectName || "Project";
  const projectId = locationState.projectId || null;
  const projectDetails = locationState.projectDetails || null;
  const initialActiveTab = locationState.activeTab || "dp-qty";

  const [activeTab, setActiveTab] = useState(initialActiveTab);
  const [assignedProjects, setAssignedProjects] = useState<any[]>([]);
  
  // DPR Entry state
  const [currentDraftEntry, setCurrentDraftEntry] = useState<any>(null);
  const [entryData, setEntryData] = useState<any>({});
  const { today, yesterday } = getTodayAndYesterday();
  
  // Manpower details state
  const [totalManpower, setTotalManpower] = useState<number>(0);
  
  // DP Qty state
  const [dpQtyData, setDpQtyData] = useState<any[]>([
    { slNo: '', description: '', totalQuantity: '', uom: '', balance: '', basePlanStart: '', basePlanFinish: '', actualStart: '', actualFinish: '', forecastStart: '', forecastFinish: '', remarks: '', cumulative: '' }
  ]);
  
  // DP Vendor Block state
  const [dpVendorBlockData, setDpVendorBlockData] = useState<any[]>([
    { activityId: '', activities: '', plot: '', newBlockNom: '', priority: '', baselinePriority: '', contractorName: '', scope: '', holdDueToWtg: '', front: '', actual: '', completionPercentage: '', remarks: '', yesterdayValue: '', todayValue: '' }
  ]);
  
  // Manpower Details state
  const [manpowerDetailsData, setManpowerDetailsData] = useState<any[]>([
    { activityId: '', slNo: '', block: '', contractorName: '', activity: '', section: '', yesterdayValue: '', todayValue: '' }
  ]);
  
  // DP Block state
  const [dpBlockData, setDpBlockData] = useState<any[]>([
    { /* Add appropriate fields for DP Block */ }
  ]);
  
  // DP Vendor IDT state
  const [dpVendorIdtData, setDpVendorIdtData] = useState<any[]>([
    { /* Add appropriate fields for DP Vendor IDT */ }
  ]);
  
  // MMS & Module RFI state
  const [mmsModuleRfiData, setMmsModuleRfiData] = useState<any[]>([
    { /* Add appropriate fields for MMS & Module RFI */ }
  ]);
  
  // DP Block state (duplicate, will rename)
  // const [dpBlockData, setDpBlockData] = useState<any[]>([
  //   { /* Add appropriate fields for DP Block */ }
  // ]);
  
  // Initialize data based on sheet type
  useEffect(() => {
    if (currentDraftEntry && currentDraftEntry.data_json) {
      const data = typeof currentDraftEntry.data_json === 'string' 
        ? JSON.parse(currentDraftEntry.data_json) 
        : currentDraftEntry.data_json;
      
      switch(activeTab) {
        case 'dp-qty':
          if (data.rows) setDpQtyData(data.rows);
          break;
        case 'dp-vendor-block':
          if (data.rows) setDpVendorBlockData(data.rows);
          if (data.totalManpower) setTotalManpower(data.totalManpower);
          break;
        case 'manpower-details':
          if (data.rows) setManpowerDetailsData(data.rows);
          if (data.totalManpower) setTotalManpower(data.totalManpower);
          break;
        case 'dp-block':
          if (data.rows) setDpBlockData(data.rows);
          break;
        case 'dp-vendor-idt':
          if (data.rows) setDpVendorIdtData(data.rows);
          break;
        case 'mms-module-rfi':
          if (data.rows) setMmsModuleRfiData(data.rows);
          break;
      }
    }
  }, [currentDraftEntry, activeTab]);

  // Fetch assigned projects and load draft entry
  useEffect(() => {
    const fetchData = async () => {
      try {
        const projects = await getAssignedProjects();
        setAssignedProjects(projects);
        
        // Load draft entry for the current project and active tab
        if (projectId && activeTab !== 'issues') {
          const draft = await getDraftEntry(projectId, activeTab);
          setCurrentDraftEntry(draft);
          
          // Parse entry data if exists
          if (draft.data_json && typeof draft.data_json === 'string') {
            setEntryData(JSON.parse(draft.data_json));
          } else if (draft.data_json) {
            setEntryData(draft.data_json);
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error("Failed to load entry data");
      }
    };

    if (token) {
      fetchData();
    }
  }, [token, projectId, activeTab]);

  // Handle entry save
  const handleSaveEntry = async () => {
    if (!currentDraftEntry) return;
    
    try {
      let dataToSave: any = {};
      
      switch(activeTab) {
        case 'dp-qty':
          dataToSave = { 
            staticHeader: {
              projectInfo: 'PLOT - A-06 135 MW - KHAVDA HYBRID SOLAR PHASE 3 (YEAR 2025-26)',
              reportingDate: today,
              progressDate: yesterday
            },
            rows: dpQtyData 
          };
          break;
        case 'dp-vendor-block':
          dataToSave = { rows: dpVendorBlockData };
          break;
        case 'manpower-details':
          dataToSave = { totalManpower, rows: manpowerDetailsData };
          break;
        case 'dp-block':
          dataToSave = { rows: dpBlockData };
          break;
        case 'dp-vendor-idt':
          dataToSave = { rows: dpVendorIdtData };
          break;
        case 'mms-module-rfi':
          dataToSave = { rows: mmsModuleRfiData };
          break;
        default:
          dataToSave = { rows: [] };
      }
      
      await saveDraftEntry(currentDraftEntry.id, dataToSave);
      toast.success("Entry saved successfully!");
    } catch (error) {
      toast.error("Failed to save entry");
    }
  };

  // Handle entry submission
  const handleSubmitEntry = async () => {
    if (!currentDraftEntry) {
      toast.error("No entry to submit");
      return;
    }
    
    // Save current data before submitting
    await handleSaveEntry();
    
    try {
      await submitEntry(currentDraftEntry.id);
      toast.success("Entry submitted to PM successfully!");
    } catch (error) {
      toast.error("Failed to submit entry");
    }
  };

  // Render DP Qty table
  const renderDPQtyTable = () => {
    return (
      <DPQtyTable
        data={dpQtyData}
        setData={setDpQtyData}
        onSave={handleSaveEntry}
        isLocked={currentDraftEntry?.status === 'submitted'}
      />
    );
  };

  // Render DP Vendor Block table
  const renderDPVendorBlockTable = () => {
    return (
      <DPVendorBlockTable
        data={dpVendorBlockData}
        setData={setDpVendorBlockData}
        onSave={handleSaveEntry}
        yesterday={yesterday}
        today={today}
        isLocked={currentDraftEntry?.status === 'submitted'}
      />
    );
  };

  // Render Manpower Details table
  const renderManpowerDetailsTable = () => {
    return (
      <ManpowerDetailsTable
        data={manpowerDetailsData}
        setData={setManpowerDetailsData}
        totalManpower={totalManpower}
        setTotalManpower={setTotalManpower}
        onSave={handleSaveEntry}
        yesterday={yesterday}
        today={today}
        isLocked={currentDraftEntry?.status === 'submitted'}
      />
    );
  };

  // Render DP Block table
  const renderDPBlockTable = () => {
    return (
      <DPBlockTable
        data={dpBlockData}
        setData={setDpBlockData}
        onSave={handleSaveEntry}
        yesterday={yesterday}
        today={today}
        isLocked={currentDraftEntry?.status === 'submitted'}
      />
    );
  };

  // Render DP Vendor IDT table
  const renderDPVendorIdtTable = () => {
    return (
      <DPVendorIdtTable
        data={dpVendorIdtData}
        setData={setDpVendorIdtData}
        onSave={handleSaveEntry}
        yesterday={yesterday}
        today={today}
        isLocked={currentDraftEntry?.status === 'submitted'}
      />
    );
  };

  // Render MMS & Module RFI table
  const renderMmsModuleRfiTable = () => {
    return (
      <MmsModuleRfiTable
        data={mmsModuleRfiData}
        setData={setMmsModuleRfiData}
        onSave={handleSaveEntry}
        yesterday={yesterday}
        today={today}
        isLocked={currentDraftEntry?.status === 'submitted'}
      />
    );
  };

  return (
    <motion.div 
      className="min-h-screen bg-background"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <Navbar 
        userName={user?.Name || "User"} 
        userRole={user?.Role || "supervisor"} 
        projectName={projectName}
      />
      
      <div className="container mx-auto px-4 py-8">
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ 
            type: "spring", 
            stiffness: 100, 
            damping: 15,
            duration: 0.5 
          }}
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <motion.h1 
                className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1, duration: 0.5 }}
              >
                DPR Dashboard - {user?.Name || "Supervisor"}
              </motion.h1>
              <motion.p 
                className="text-muted-foreground"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2, duration: 0.5 }}
              >
                {projectName ? `Project: ${projectName}` : "Project dashboard for supervisor activities"}
              </motion.p>
              {projectDetails && (
                <motion.div 
                  className="mt-2 text-sm text-muted-foreground"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3, duration: 0.5 }}
                >
                  <p>Plan: {formatDate(projectDetails.PlannedStartDate)} to {formatDate(projectDetails.PlannedFinishDate)}</p>
                  <p>Actual: {formatDate(projectDetails.ActualStartDate) || "Not started"} to {formatDate(projectDetails.ActualFinishDate) || "Not completed"}</p>
                </motion.div>
              )}
            </div>
            <motion.div 
              className="flex items-center space-x-4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              <Button onClick={handleSubmitEntry} className="bg-green-600 hover:bg-green-700">
                <Send className="w-4 h-4 mr-2" />
                Submit to PM
              </Button>
              
              <div className="bg-primary/10 px-4 py-2 rounded-lg">
                <div className="flex items-center">
                  <FileSpreadsheet className="w-5 h-5 text-primary mr-2" />
                  <span className="font-medium">DPR Submission</span>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
        >
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-8 mb-8">
              <TabsTrigger value="dp-qty" className="flex items-center justify-center">
                <FileSpreadsheet className="w-4 h-4 mr-2" />
                DP Qty
              </TabsTrigger>
              <TabsTrigger value="dp-block" className="flex items-center justify-center">
                <Grid3X3 className="w-4 h-4 mr-2" />
                DP Block
              </TabsTrigger>
              <TabsTrigger value="dp-vendor-idt" className="flex items-center justify-center">
                <Wrench className="w-4 h-4 mr-2" />
                DP Vendor IDT
              </TabsTrigger>
              <TabsTrigger value="mms-module-rfi" className="flex items-center justify-center">
                <Building className="w-4 h-4 mr-2" />
                MMS & Module RFI
              </TabsTrigger>
              <TabsTrigger value="dp-vendor-block" className="flex items-center justify-center">
                <Package className="w-4 h-4 mr-2" />
                DP Vendor Block
              </TabsTrigger>
              <TabsTrigger value="manpower-details" className="flex items-center justify-center">
                <User className="w-4 h-4 mr-2" />
                Manpower Details
              </TabsTrigger>
              <TabsTrigger value="supervisor-table" className="flex items-center justify-center">
                <User className="w-4 h-4 mr-2" />
                Supervisor Table
              </TabsTrigger>
              <TabsTrigger value="issues" className="flex items-center justify-center">
                <AlertCircle className="w-4 h-4 mr-2" />
                Issues
              </TabsTrigger>
            </TabsList>

            <TabsContent value="dp-qty">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ 
                  type: "spring", 
                  stiffness: 100, 
                  damping: 15,
                  duration: 0.4 
                }}
                className="w-full"
              >
                <Card className="p-6">
                  {renderDPQtyTable()}
                </Card>
              </motion.div>
            </TabsContent>

            <TabsContent value="dp-vendor-block">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ 
                  type: "spring", 
                  stiffness: 100, 
                  damping: 15,
                  duration: 0.4 
                }}
                className="w-full"
              >
                <Card className="p-6">
                  {renderDPVendorBlockTable()}
                </Card>
              </motion.div>
            </TabsContent>

            <TabsContent value="manpower-details">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ 
                  type: "spring", 
                  stiffness: 100, 
                  damping: 15,
                  duration: 0.4 
                }}
                className="w-full"
              >
                <Card className="p-6">
                  {renderManpowerDetailsTable()}
                </Card>
              </motion.div>
            </TabsContent>

            <TabsContent value="dp-block">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ 
                  type: "spring", 
                  stiffness: 100, 
                  damping: 15,
                  duration: 0.4 
                }}
                className="w-full"
              >
                <Card className="p-6">
                  {renderDPBlockTable()}
                </Card>
              </motion.div>
            </TabsContent>

            <TabsContent value="dp-vendor-idt">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ 
                  type: "spring", 
                  stiffness: 100, 
                  damping: 15,
                  duration: 0.4 
                }}
                className="w-full"
              >
                <Card className="p-6">
                  {renderDPVendorIdtTable()}
                </Card>
              </motion.div>
            </TabsContent>

            <TabsContent value="mms-module-rfi">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ 
                  type: "spring", 
                  stiffness: 100, 
                  damping: 15,
                  duration: 0.4 
                }}
                className="w-full"
              >
                <Card className="p-6">
                  {renderMmsModuleRfiTable()}
                </Card>
              </motion.div>
            </TabsContent>

            <TabsContent value="supervisor-table">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ 
                  type: "spring", 
                  stiffness: 100, 
                  damping: 15,
                  duration: 0.4 
                }}
                className="w-full"
              >
                <Card className="p-6">
                  <div className="text-center py-8 text-muted-foreground">
                    <User className="mx-auto h-12 w-12 opacity-50" />
                    <h3 className="mt-2 text-lg font-medium">Supervisor Table</h3>
                    <p className="mt-1">Supervisor entry data will be displayed here.</p>
                  </div>
                </Card>
              </motion.div>
            </TabsContent>

            <TabsContent value="issues">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ 
                  type: "spring", 
                  stiffness: 100, 
                  damping: 15,
                  duration: 0.4 
                }}
                className="w-full"
              >
                <Card className="p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold flex items-center">
                      <AlertCircle className="w-6 h-6 mr-2 text-primary" />
                      Issues Tracking
                    </h2>
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Issue Log
                    </Button>
                  </div>
                  
                  <div className="text-center py-8 text-muted-foreground">
                    <AlertCircle className="mx-auto h-12 w-12 opacity-50" />
                    <h3 className="mt-2 text-lg font-medium">No issues reported</h3>
                    <p className="mt-1">Get started by adding a new issue.</p>
                    <div className="mt-4">
                      <Button>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Your First Issue Log
                      </Button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default DPRDashboard;
