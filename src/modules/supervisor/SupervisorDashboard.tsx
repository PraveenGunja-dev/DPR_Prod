import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Navbar } from "@/components/Navbar";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { AlertCircle, FileSpreadsheet, Package, User, Save, Send, Plus, Grid3X3, Building, Wrench } from "lucide-react";
import { useAuth } from "@/modules/auth/contexts/AuthContext";
import { getAssignedProjects } from "@/modules/auth/services/projectService";
import { getDraftEntry, saveDraftEntry, submitEntry, getTodayAndYesterday } from "@/modules/auth/services/dprSupervisorService";
import { toast } from "sonner";
import { 
  DPQtyTable,
  DPVendorBlockTable,
  ManpowerDetailsTable,
  DPBlockTable,
  DPVendorIdtTable,
  MmsModuleRfiTable,
  IssueFormModal,
  IssuesTable
} from "./components";

// Define the Issue interface
interface Issue {
  id: string;
  description: string;
  startDate: string;
  finishedDate: string | null;
  delayedDays: number;
  status: "Open" | "In Progress" | "Resolved";
  actionRequired: string;
  remarks: string;
  attachment: File | null;
  attachmentName: string | null;
}

const SupervisorDashboard = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, token } = useAuth();
  
  // Extract project data from location state
  const locationState = location.state || {};
  const projectName = locationState.projectName || "Project";
  const projectId = locationState.projectId || null;
  const projectDetails = locationState.projectDetails || null;
  const openAddIssueModal = locationState.openAddIssueModal || false;
  const initialActiveTab = locationState.activeTab || "issues";

  const [activeTab, setActiveTab] = useState(initialActiveTab);
  const [assignedProjects, setAssignedProjects] = useState<any[]>([]);
  const [currentDraftEntry, setCurrentDraftEntry] = useState<any>(null);
  const [isAddIssueModalOpen, setIsAddIssueModalOpen] = useState(false);
  const [issues, setIssues] = useState<Issue[]>([]);
  const { today, yesterday } = getTodayAndYesterday();
  
  // DP Qty state
  const [dpQtyData, setDpQtyData] = useState([
    { slNo: '', description: '', totalQuantity: '', uom: '', balance: '', basePlanStart: '', basePlanFinish: '', actualStart: '', actualFinish: '', forecastStart: '', forecastFinish: '', remarks: '', cumulative: '' }
  ]);
  
  // DP Vendor Block state
  const [dpVendorBlockData, setDpVendorBlockData] = useState([
    { activityId: '', activities: '', plot: '', newBlockNom: '', priority: '', baselinePriority: '', contractorName: '', scope: '', holdDueToWtg: '', front: '', actual: '', completionPercentage: '', remarks: '', yesterdayValue: '', todayValue: '' }
  ]);
  
  // Manpower Details state
  const [manpowerDetailsData, setManpowerDetailsData] = useState([
    { activityId: '', slNo: '', block: '', contractorName: '', activity: '', section: '', yesterdayValue: '', todayValue: '' }
  ]);
  const [totalManpower, setTotalManpower] = useState(0);
  
  // DP Block state
  const [dpBlockData, setDpBlockData] = useState([
    { activityId: '', activities: '', plot: '', block: '', priority: '', contractorName: '', scope: '', yesterdayValue: '', todayValue: '' }
  ]);
  
  // DP Vendor IDT state
  const [dpVendorIdtData, setDpVendorIdtData] = useState([
    { activityId: '', activities: '', plot: '', vendor: '', idtDate: '', actualDate: '', status: '', yesterdayValue: '', todayValue: '' }
  ]);
  
  // MMS & Module RFI state
  const [mmsModuleRfiData, setMmsModuleRfiData] = useState([
    { rfiNo: '', subject: '', module: '', submittedDate: '', responseDate: '', status: '', remarks: '', yesterdayValue: '', todayValue: '' }
  ]);

  // Initialize data based on sheet type
  useEffect(() => {
    if (currentDraftEntry && currentDraftEntry.data_json) {
      const data = typeof currentDraftEntry.data_json === 'string' 
        ? JSON.parse(currentDraftEntry.data_json) 
        : currentDraftEntry.data_json;
      
      switch(activeTab) {
        case 'dp_qty':
          if (data.rows) setDpQtyData(data.rows);
          break;
        case 'dp_vendor_block':
          if (data.rows) setDpVendorBlockData(data.rows);
          if (data.totalManpower) setTotalManpower(data.totalManpower);
          break;
        case 'manpower_details':
          if (data.rows) setManpowerDetailsData(data.rows);
          if (data.totalManpower) setTotalManpower(data.totalManpower);
          break;
        case 'dp_block':
          if (data.rows) setDpBlockData(data.rows);
          break;
        case 'dp_vendor_idt':
          if (data.rows) setDpVendorIdtData(data.rows);
          break;
        case 'mms_module_rfi':
          if (data.rows) setMmsModuleRfiData(data.rows);
          break;
      }
    }
  }, [currentDraftEntry, activeTab]);

  // Fetch data when token, projectId, or activeTab changes
  useEffect(() => {
    const fetchData = async () => {
      try {
        const projects = await getAssignedProjects();
        setAssignedProjects(projects);
        
        // Load draft entry for the current project and active tab
        // Skip loading for 'issues' and 'supervisor_table' tabs
        if (projectId && activeTab !== 'issues' && activeTab !== 'supervisor_table') {
          console.log('Loading draft entry for projectId:', projectId, 'activeTab:', activeTab);
          const draft = await getDraftEntry(projectId, activeTab);
          console.log('Draft entry loaded:', draft);
          setCurrentDraftEntry(draft);
        } else {
          console.log('Not loading draft - projectId:', projectId, 'activeTab:', activeTab);
          if (activeTab === 'issues' || activeTab === 'supervisor_table') {
            setCurrentDraftEntry(null);
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error("Failed to load data");
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
        case 'dp_qty':
          dataToSave = { 
            staticHeader: {
              projectInfo: 'PLOT - A-06 135 MW - KHAVDA HYBRID SOLAR PHASE 3 (YEAR 2025-26)',
              reportingDate: today,
              progressDate: yesterday
            },
            rows: dpQtyData 
          };
          break;
        case 'dp_vendor_block':
          dataToSave = { rows: dpVendorBlockData };
          break;
        case 'manpower_details':
          dataToSave = { totalManpower, rows: manpowerDetailsData };
          break;
        case 'dp_block':
          dataToSave = { rows: dpBlockData };
          break;
        case 'dp_vendor_idt':
          dataToSave = { rows: dpVendorIdtData };
          break;
        case 'mms_module_rfi':
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
    console.log('handleSubmitEntry called');
    console.log('currentDraftEntry:', currentDraftEntry);
    console.log('activeTab:', activeTab);
    console.log('projectId:', projectId);
    
    if (!currentDraftEntry) {
      toast.error("No entry to submit. Please ensure you have selected a project and sheet type.");
      console.error('No currentDraftEntry found');
      return;
    }
    
    // Save current data before submitting
    await handleSaveEntry();
    
    try {
      console.log('Submitting entry:', currentDraftEntry.id);
      await submitEntry(currentDraftEntry.id);
      toast.success("Entry submitted to PM successfully!");
      
      // Reload the draft entry to get a fresh one for this sheet type
      // This creates a new draft after submission
      try {
        const newDraft = await getDraftEntry(projectId, activeTab);
        setCurrentDraftEntry(newDraft);
        console.log('Loaded new draft entry after submission:', newDraft);
      } catch (error) {
        console.error('Error loading new draft after submission:', error);
      }
      
      toast.info("Entry submitted. A new draft has been created for this sheet.");
    } catch (error) {
      console.error('Submit error:', error);
      toast.error("Failed to submit entry");
    }
  };

  // Open the add issue modal when navigated with openAddIssueModal flag
  useEffect(() => {
    if (openAddIssueModal) {
      setActiveTab("issues"); // Switch to issues tab
      setIsAddIssueModalOpen(true);
      // Clear the state to prevent reopening on refresh
      navigate(location.pathname, { replace: true, state: { ...locationState, openAddIssueModal: false } });
    }
  }, [openAddIssueModal, navigate, location.pathname, locationState]);

  // Handle form submission
  const handleSubmitIssue = (formData: any) => {
    // Calculate delayed days
    const calculateDelayedDays = (startDate: string, finishedDate: string | null): number => {
      if (!finishedDate) return 0;
      const start = new Date(startDate);
      const finish = new Date(finishedDate);
      const diffTime = Math.abs(finish.getTime() - start.getTime());
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    };
    
    const delayedDays = calculateDelayedDays(formData.startDate, formData.finishedDate || null);
    
    const issue: Issue = {
      id: Math.random().toString(36).substr(2, 9),
      description: formData.description,
      startDate: formData.startDate,
      finishedDate: formData.finishedDate || null,
      delayedDays,
      status: formData.status,
      actionRequired: formData.actionRequired,
      remarks: formData.remarks,
      attachment: formData.attachment,
      attachmentName: formData.attachment ? formData.attachment.name : null,
    };
    
    setIssues([...issues, issue]);
    setIsAddIssueModalOpen(false);
    toast.success("Issue created successfully!");
  };

  // Render table components based on active tab
  const renderActiveTable = () => {
    switch(activeTab) {
      case 'dp_qty':
        return (
          <DPQtyTable 
            data={dpQtyData} 
            setData={setDpQtyData} 
            onSave={handleSaveEntry} 
          />
        );
      case 'dp_vendor_block':
        return (
          <DPVendorBlockTable 
            data={dpVendorBlockData} 
            setData={setDpVendorBlockData} 
            onSave={handleSaveEntry} 
            yesterday={yesterday}
            today={today}
          />
        );
      case 'manpower_details':
        return (
          <ManpowerDetailsTable 
            data={manpowerDetailsData} 
            setData={setManpowerDetailsData} 
            totalManpower={totalManpower}
            setTotalManpower={setTotalManpower}
            onSave={handleSaveEntry} 
            yesterday={yesterday}
            today={today}
          />
        );
      case 'dp_block':
        return (
          <DPBlockTable 
            data={dpBlockData} 
            setData={setDpBlockData} 
            onSave={handleSaveEntry} 
            yesterday={yesterday}
            today={today}
          />
        );
      case 'dp_vendor_idt':
        return (
          <DPVendorIdtTable 
            data={dpVendorIdtData} 
            setData={setDpVendorIdtData} 
            onSave={handleSaveEntry} 
            yesterday={yesterday}
            today={today}
          />
        );
      case 'mms_module_rfi':
        return (
          <MmsModuleRfiTable 
            data={mmsModuleRfiData} 
            setData={setMmsModuleRfiData} 
            onSave={handleSaveEntry} 
            yesterday={yesterday}
            today={today}
          />
        );
      case 'supervisor_table':
        return (
          <div className="text-center py-8 text-muted-foreground">
            <User className="mx-auto h-12 w-12 opacity-50" />
            <h3 className="mt-2 text-lg font-medium">Supervisor Table</h3>
            <p className="mt-1">Supervisor entry data will be displayed here.</p>
          </div>
        );
      case 'issues':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold flex items-center">
                <AlertCircle className="w-6 h-6 mr-2 text-primary" />
                Issues Tracking
              </h2>
              <Button onClick={() => setIsAddIssueModalOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Issue Log
              </Button>
            </div>
            <IssuesTable issues={issues} onAddIssue={() => setIsAddIssueModalOpen(true)} />
          </div>
        );
      default:
        return null;
    }
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
        onAddUser={() => alert("Add User functionality is only available for PMAG users")}
        onAddProject={() => alert("Add Project functionality is only available for PMAG users")}
        onAssignProject={() => alert("Assign Project functionality is only available for PMAG users")}
        onAddIssue={() => setIsAddIssueModalOpen(true)}
      />
      
      <IssueFormModal 
        open={isAddIssueModalOpen} 
        onOpenChange={setIsAddIssueModalOpen} 
        onSubmit={handleSubmitIssue} 
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
                Welcome, {user?.Name || "Supervisor"}
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
              {activeTab !== 'issues' && activeTab !== 'supervisor_table' && (
                <>
                  <Button 
                    onClick={handleSaveEntry} 
                    variant="outline"
                    disabled={!currentDraftEntry}
                    className="border-blue-600 text-blue-600 hover:bg-blue-50"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Save Draft
                  </Button>
                  <Button 
                    onClick={handleSubmitEntry} 
                    disabled={!currentDraftEntry}
                    className="bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Submit to PM
                  </Button>
                </>
              )}
              
              <Button onClick={() => setIsAddIssueModalOpen(true)} className="bg-orange-500 hover:bg-orange-600">
                <AlertCircle className="w-4 h-4 mr-2" />
                Add Issue Log
              </Button>
              
              <div className="bg-primary/10 px-4 py-2 rounded-lg">
                <div className="flex items-center">
                  <FileSpreadsheet className="w-5 h-5 text-primary mr-2" />
                  <span className="font-medium">Sheet Submission</span>
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
            <TabsList className="grid w-full grid-cols-9 mb-8">
              <TabsTrigger value="dp_qty" className="flex items-center justify-center">
                <FileSpreadsheet className="w-4 h-4 mr-2" />
                DP Qty
              </TabsTrigger>
              <TabsTrigger value="dp_block" className="flex items-center justify-center">
                <Grid3X3 className="w-4 h-4 mr-2" />
                DP Block
              </TabsTrigger>
              <TabsTrigger value="dp_vendor_idt" className="flex items-center justify-center">
                <Wrench className="w-4 h-4 mr-2" />
                DP Vendor IDT
              </TabsTrigger>
              <TabsTrigger value="mms_module_rfi" className="flex items-center justify-center">
                <Building className="w-4 h-4 mr-2" />
                MMS & Module RFI
              </TabsTrigger>
              <TabsTrigger value="dp_vendor_block" className="flex items-center justify-center">
                <Package className="w-4 h-4 mr-2" />
                DP Vendor Block
              </TabsTrigger>
              <TabsTrigger value="manpower_details" className="flex items-center justify-center">
                <User className="w-4 h-4 mr-2" />
                Manpower Details
              </TabsTrigger>
              <TabsTrigger value="supervisor_table" className="flex items-center justify-center">
                <User className="w-4 h-4 mr-2" />
                Supervisor Table
              </TabsTrigger>
              <TabsTrigger value="issues" className="flex items-center justify-center">
                <AlertCircle className="w-4 h-4 mr-2" />
                Issues ({issues.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab}>
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
                  {renderActiveTable()}
                </Card>
              </motion.div>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </motion.div>
  );
};

// Function to format date as YYYY-MM-DD
const formatDate = (dateString: string | null | undefined): string => {
  if (!dateString) return "Not set";
  const date = new Date(dateString);
  return date.toISOString().split('T')[0];
};

export default SupervisorDashboard;