import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/modules/auth/contexts/AuthContext";
import { useNotification } from "@/modules/auth/contexts/NotificationContext";
import { Button } from "@/components/ui/button";
import { AlertCircle, FileSpreadsheet, Package, User, Save, Send, Plus, Grid3X3, Building, Wrench } from "lucide-react";
import { getAssignedProjects, getUserProjects } from "@/modules/auth/services/projectService";
import { getDraftEntry, saveDraftEntry, submitEntry, getTodayAndYesterday } from "@/modules/auth/services/dprSupervisorService";
import { toast } from "sonner";
import { Navbar } from "@/components/Navbar";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  DPQtyTable,
  DPVendorBlockTable,
  ManpowerDetailsTable,
  DPBlockTable,
  DPVendorIdtTable,
  MmsModuleRfiTable,
  MmsModuleRfiTableWithDynamicColumns,
  IssueFormModal,
  IssuesTable,
  DPRSummarySection // Import from supervisor components instead of main components
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
  // Note: We use currentProjectId state instead of this static value
  const projectIdFromLocation = locationState.projectId || null;
  const projectDetails = locationState.projectDetails || null;
  const openAddIssueModal = locationState.openAddIssueModal || false;
  const initialActiveTab = locationState.activeTab || "summary";
  
  const [activeTab, setActiveTab] = useState(initialActiveTab);
  const [assignedProjects, setAssignedProjects] = useState<any[]>([]);
  const [currentDraftEntry, setCurrentDraftEntry] = useState<any>(null);
  const [isAddIssueModalOpen, setIsAddIssueModalOpen] = useState(false);
  const [issues, setIssues] = useState<Issue[]>([]);
  const { today, yesterday } = getTodayAndYesterday();
  
  // State for reactive project ID
  const [currentProjectId, setCurrentProjectId] = useState(projectIdFromLocation);
  
  // Flag to use mock data (for development/testing)
  const useMockData = true; // Set to false to use real API
  
  // Effect to update state when location changes
  useEffect(() => {
    const locationState = location.state || {};
    const newActiveTab = locationState.activeTab || "summary";
    const newProjectId = locationState.projectId || null;
    
    // Always update the state when location changes, regardless of current values
    // This ensures that even if the values are the same, we still process the new location state
    setActiveTab(newActiveTab);
    setCurrentProjectId(newProjectId);
  }, [location]);
  
  // DP Qty state
  const [dpQtyData, setDpQtyData] = useState([
    { 
      slNo: '', 
      description: '', 
      totalQuantity: '', 
      uom: '', 
      basePlanStart: '', 
      basePlanFinish: '', 
      forecastStart: '', 
      forecastFinish: '', 
      actualStart: '', 
      actualFinish: '', 
      remarks: '', 
      balance: '', 
      cumulative: '',
      yesterday: '', // Number value, not editable
      today: '' // Number value, editable
    }
  ]);
  
  // DP Vendor Block state
  interface DPVendorBlockData {
    activityId: string;
    activities: string;
    plot: string;
    newBlockNom: string;
    priority: string;
    baselinePriority: string;
    contractorName: string;
    scope: string;
    holdDueToWtg: string;
    front: string;
    actual: string;
    completionPercentage: string;
    remarks: string;
    yesterdayValue: string;
    todayValue: string;
    category?: string;
    isCategoryRow?: boolean;
  }
  
  const [dpVendorBlockData, setDpVendorBlockData] = useState<DPVendorBlockData[]>([
    { activityId: '', activities: '', plot: '', newBlockNom: '', priority: '', baselinePriority: '', contractorName: '', scope: '', holdDueToWtg: '', front: '', actual: '', completionPercentage: '', remarks: '', yesterdayValue: '', todayValue: '' }
  ]);
  
  // Manpower Details state
  const [manpowerDetailsData, setManpowerDetailsData] = useState([
    { activityId: '', slNo: '', block: '', contractorName: '', activity: '', section: '', yesterdayValue: '', todayValue: '' }
  ]);
  const [totalManpower, setTotalManpower] = useState(0);
  
  // DP Block state
  interface DPBlockData {
    activityId: string;
    activities: string;
    plot: string;
    newBlockNom: string;
    baselinePriority: string;
    scope: string;
    holdDueToWtg: string;
    front: string;
    actual: string;
    completionPercentage: string;
    balance: string;
    baselineStart: string;
    baselineFinish: string;
    actualStart: string;
    actualFinish: string;
    forecastStart: string;
    forecastFinish: string;
    yesterdayValue?: string; // Optional
    todayValue?: string; // Optional
  }
  
  const [dpBlockData, setDpBlockData] = useState<DPBlockData[]>([
    { 
      activityId: '', 
      activities: '', 
      plot: '', 
      newBlockNom: '',
      baselinePriority: '',
      scope: '',
      holdDueToWtg: '',
      front: '',
      actual: '',
      completionPercentage: '',
      balance: '',
      baselineStart: '',
      baselineFinish: '',
      actualStart: '',
      actualFinish: '',
      forecastStart: '',
      forecastFinish: '',
      yesterdayValue: undefined, // Number value, not editable (optional)
      todayValue: undefined // Number value, editable (optional)
    }
  ]);
  
  // DP Vendor IDT state
  interface DPVendorIdtData {
    activityId: string;
    activities: string;
    plot: string;
    newBlockNom: string;
    baselinePriority: string;
    scope: string;
    front: string;
    priority: string;
    contractorName: string;
    remarks: string;
    actual: string;
    completionPercentage: string;
    yesterdayValue?: string; // Optional
    todayValue?: string; // Optional
    category?: string;
    isCategoryRow?: boolean;
  }
  
  const [dpVendorIdtData, setDpVendorIdtData] = useState<DPVendorIdtData[]>([
    { 
      activityId: '', 
      activities: '', 
      plot: '', 
      newBlockNom: '',
      baselinePriority: '',
      scope: '',
      front: '',
      priority: '',
      contractorName: '',
      remarks: '',
      actual: '',
      completionPercentage: '',
      yesterdayValue: undefined, // Number value, not editable (optional)
      todayValue: undefined // Number value, editable (optional)
    }
  ]);
  
  // MMS & Module RFI state
  const [mmsModuleRfiData, setMmsModuleRfiData] = useState([
    { rfiNo: '', subject: '', module: '', submittedDate: '', responseDate: '', status: '', remarks: '', yesterdayValue: '', todayValue: '' }
  ]);

  // Track if entry is read-only (submitted)
  const [isEntryReadOnly, setIsEntryReadOnly] = useState(false);

  // Initialize data based on sheet type
  useEffect(() => {
    if (currentDraftEntry && currentDraftEntry.data_json) {
      const data = typeof currentDraftEntry.data_json === 'string' 
        ? JSON.parse(currentDraftEntry.data_json) 
        : currentDraftEntry.data_json;
      
      // Check if entry is read-only (submitted or approved)
      const isReadOnly = currentDraftEntry.isReadOnly || 
                        currentDraftEntry.status === 'submitted_to_pm' || 
                        currentDraftEntry.status === 'approved_by_pm';
      setIsEntryReadOnly(isReadOnly);
      
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
    } else {
      setIsEntryReadOnly(false);
    }
  }, [currentDraftEntry, activeTab]);

  // Fetch data when token, projectId, or activeTab changes
  useEffect(() => {
    const fetchData = async () => {
      try {
        const projects = await getAssignedProjects();
        setAssignedProjects(projects);
        
        // Load draft entry for the current project and active tab
        // Skip loading for 'issues', 'supervisor_table', and 'summary' tabs
        if (currentProjectId && activeTab !== 'issues' && activeTab !== 'supervisor_table' && activeTab !== 'summary') {
          console.log('Loading draft entry for projectId:', currentProjectId, 'activeTab:', activeTab);
          const draft = await getDraftEntry(currentProjectId, activeTab);
          console.log('Draft entry loaded:', draft);
          setCurrentDraftEntry(draft);
        } else {
          console.log('Not loading draft - projectId:', currentProjectId, 'activeTab:', activeTab);
          if (activeTab === 'issues' || activeTab === 'supervisor_table' || activeTab === 'summary') {
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
  }, [token, currentProjectId, activeTab]);

  // Handle entry save
  const handleSaveEntry = async () => {
    if (!currentDraftEntry) return;
    
    // Don't allow saving if entry is read-only (submitted)
    if (isEntryReadOnly || currentDraftEntry.status !== 'draft') {
      toast.error("Cannot save: This entry has been submitted and is read-only");
      return;
    }
    
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
    console.log('currentProjectId:', currentProjectId);
    
    if (!currentDraftEntry) {
      toast.error("No entry to submit. Please ensure you have selected a project and sheet type.");
      console.error('No currentDraftEntry found');
      return;
    }
    
    // Don't allow submission if entry is read-only (already submitted)
    if (isEntryReadOnly || currentDraftEntry.status !== 'draft') {
      toast.error("Cannot submit: This entry has already been submitted");
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
        const newDraft = await getDraftEntry(currentProjectId, activeTab);
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
    // Determine the status based on currentDraftEntry
    const entryStatus = currentDraftEntry?.status || 'draft';
    
    switch(activeTab) {
      case 'summary':
        return <DPRSummarySection />;
      case 'dp_qty':
        return (
          <DPQtyTable 
            data={dpQtyData} 
            setData={setDpQtyData} 
            onSave={isEntryReadOnly ? undefined : handleSaveEntry}
            onSubmit={isEntryReadOnly ? undefined : handleSubmitEntry}
            yesterday={yesterday}
            today={today}
            isLocked={isEntryReadOnly}
            status={entryStatus}
            useMockData={useMockData}
          />
        );
      case 'dp_vendor_block':
        return (
          <DPVendorBlockTable 
            data={dpVendorBlockData} 
            setData={setDpVendorBlockData} 
            onSave={isEntryReadOnly ? undefined : handleSaveEntry}
            onSubmit={isEntryReadOnly ? undefined : handleSubmitEntry}
            yesterday={yesterday}
            today={today}
            isLocked={isEntryReadOnly}
            status={entryStatus}
            useMockData={useMockData}
          />
        );
      case 'manpower_details':
        return (
          <ManpowerDetailsTable 
            data={manpowerDetailsData} 
            setData={setManpowerDetailsData} 
            totalManpower={totalManpower}
            setTotalManpower={setTotalManpower}
            onSave={isEntryReadOnly ? undefined : handleSaveEntry}
            onSubmit={isEntryReadOnly ? undefined : handleSubmitEntry}
            yesterday={yesterday}
            today={today}
            isLocked={isEntryReadOnly}
            status={entryStatus}
            useMockData={useMockData}
          />
        );
      case 'dp_block':
        return (
          <DPBlockTable 
            data={dpBlockData} 
            setData={setDpBlockData} 
            onSave={isEntryReadOnly ? undefined : handleSaveEntry}
            onSubmit={isEntryReadOnly ? undefined : handleSubmitEntry}
            yesterday={yesterday}
            today={today}
            isLocked={isEntryReadOnly}
            status={entryStatus}
            useMockData={useMockData}
          />
        );
      case 'dp_vendor_idt':
        return (
          <DPVendorIdtTable 
            data={dpVendorIdtData} 
            setData={setDpVendorIdtData} 
            onSave={isEntryReadOnly ? undefined : handleSaveEntry}
            onSubmit={isEntryReadOnly ? undefined : handleSubmitEntry}
            yesterday={yesterday}
            today={today}
            isLocked={isEntryReadOnly}
            status={entryStatus}
            useMockData={useMockData}
          />
        );
      case 'mms_module_rfi':
        // Use the new dynamic columns component if we have a project ID and user ID
        if (currentProjectId && user?.ObjectId) {
          return (
            <MmsModuleRfiTableWithDynamicColumns 
              projectId={currentProjectId}
              userId={user.ObjectId}
              yesterday={yesterday}
              today={today}
              isLocked={isEntryReadOnly}
              status={entryStatus}
            />
          );
        }
        // Fallback to the original component
        return (
          <MmsModuleRfiTable 
            data={mmsModuleRfiData} 
            setData={setMmsModuleRfiData} 
            onSave={isEntryReadOnly ? undefined : handleSaveEntry}
            onSubmit={isEntryReadOnly ? undefined : handleSubmitEntry}
            yesterday={yesterday}
            today={today}
            isLocked={isEntryReadOnly}
            status={entryStatus}
            useMockData={useMockData}
          />
        );
      case 'supervisor_table':
        return (
          <div className="text-center py-8 text-muted-foreground">
            <Package className="w-16 h-16 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Supervisor Table</h3>
            <p>Supervisor-specific data and controls will be shown here.</p>
          </div>
        );
      case 'issues':
        return (
          <>
            <IssueFormModal 
              open={isAddIssueModalOpen} 
              onOpenChange={setIsAddIssueModalOpen} 
              onSubmit={handleSubmitIssue}
            />
            <IssuesTable issues={issues} onAddIssue={() => setIsAddIssueModalOpen(true)} />
          </>
        );
      default:
        return (
          <div className="text-center py-8 text-muted-foreground">
            <AlertCircle className="w-16 h-16 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Sheet Not Found</h3>
            <p>The requested sheet could not be found.</p>
          </div>
        );
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
      />

      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 sm:mb-8"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">Daily Progress Report</h1>
              <p className="text-muted-foreground mt-1">{projectName}</p>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate("/projects")}
                className="flex items-center"
              >
                <FileSpreadsheet className="w-4 h-4 mr-2" />
                Change Project
              </Button>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="border-0 shadow-sm p-4">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="flex flex-wrap w-full gap-1 p-1 rounded-lg">
                <TabsTrigger value="summary" className="flex-1 min-w-[100px] text-xs sm:text-sm data-[state=active]:bg-background">
                  <span className="hidden xs:inline">Summary</span>
                  <span className="xs:hidden">Summary</span>
                </TabsTrigger>
                <TabsTrigger value="dp_qty" className="flex-1 min-w-[100px] text-xs sm:text-sm data-[state=active]:bg-background">
                  <span className="hidden xs:inline">DP Qty</span>
                  <span className="xs:hidden">DP Qty</span>
                </TabsTrigger>
                <TabsTrigger value="dp_block" className="flex-1 min-w-[100px] text-xs sm:text-sm data-[state=active]:bg-background">
                  <span className="hidden xs:inline">DP Block</span>
                  <span className="xs:hidden">DP Block</span>
                </TabsTrigger>
                <TabsTrigger value="dp_vendor_idt" className="flex-1 min-w-[100px] text-xs sm:text-sm data-[state=active]:bg-background">
                  <span className="hidden xs:inline">DP Vendor IDT</span>
                  <span className="xs:hidden">Vender IDT</span>
                </TabsTrigger>
                <TabsTrigger value="dp_vendor_block" className="flex-1 min-w-[100px] text-xs sm:text-sm data-[state=active]:bg-background">
                  <span className="hidden xs:inline">DP Vendor Block</span>
                  <span className="xs:hidden">DP Vendor Block</span>
                </TabsTrigger>
                <TabsTrigger value="manpower_details" className="flex-1 min-w-[100px] text-xs sm:text-sm data-[state=active]:bg-background">
                  <span className="hidden xs:inline">Manpower</span>
                  <span className="xs:hidden">Manpower</span>
                </TabsTrigger>
                <TabsTrigger value="mms_module_rfi" className="flex-1 min-w-[100px] text-xs sm:text-sm data-[state=active]:bg-background">
                  <span className="hidden xs:inline">MMS RFI</span>
                  <span className="xs:hidden">MMS & RFI</span>
                </TabsTrigger>
                <TabsTrigger value="issues" className="flex-1 min-w-[100px] text-xs sm:text-sm data-[state=active]:bg-background">
                  <span className="hidden xs:inline">Issues</span>
                  <span className="xs:hidden">Issue</span>
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="summary" className="mt-0 border-0 p-0 pt-4">
                {renderActiveTable()}
              </TabsContent>
              <TabsContent value="dp_qty" className="mt-0 border-0 p-0 pt-4">
                {renderActiveTable()}
              </TabsContent>
              <TabsContent value="dp_block" className="mt-0 border-0 p-0 pt-4">
                {renderActiveTable()}
              </TabsContent>
              <TabsContent value="dp_vendor_idt" className="mt-0 border-0 p-0 pt-4">
                {renderActiveTable()}
              </TabsContent>
              <TabsContent value="dp_vendor_block" className="mt-0 border-0 p-0 pt-4">
                {renderActiveTable()}
              </TabsContent>
              <TabsContent value="manpower_details" className="mt-0 border-0 p-0 pt-4">
                {renderActiveTable()}
              </TabsContent>
              <TabsContent value="mms_module_rfi" className="mt-0 border-0 p-0 pt-4">
                {renderActiveTable()}
              </TabsContent>
              <TabsContent value="issues" className="mt-0 border-0 p-0 pt-4">
                {renderActiveTable()}
              </TabsContent>
            </Tabs>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default SupervisorDashboard;