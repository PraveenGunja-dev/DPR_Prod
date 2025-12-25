import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/modules/auth/contexts/AuthContext";
import { useNotification } from "@/modules/auth/contexts/NotificationContext";
import { toast } from "sonner";
import { DashboardLayout } from "@/components/shared/DashboardLayout";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  PMAGDashboardSummary,
  PMAGSheetEntries,
  PMAGChartsSection,
  PMAGUserManagementModals,
  PMAGSuccessModal
} from "./components";
import { SnapshotFilterModal } from "@/modules/superadmin/components/SnapshotFilterModal";
import { fetchData, fetchApprovedEntries, fetchHistoryEntries, fetchArchivedEntries, finalApproveEntry, rejectEntry } from "./services";

const PMAGDashboard = () => {
  const location = useLocation();
  const { user } = useAuth();
  const { addNotification } = useNotification();

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
  const [approvedEntries, setApprovedEntries] = useState<any[]>([]);
  const [historyEntries, setHistoryEntries] = useState<any[]>([]);
  const [historyFilter, setHistoryFilter] = useState<number | null>(7); // Default to 7 days
  const [archivedEntries, setArchivedEntries] = useState<any[]>([]);
  const [selectedArchivedEntry, setSelectedArchivedEntry] = useState<any>(null);
  const [showArchivedModal, setShowArchivedModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showArchivedListModal, setShowArchivedListModal] = useState(false);
  const [loadingEntries, setLoadingEntries] = useState(false);
  const [projectForm, setProjectForm] = useState({
    Name: "",
    Location: "",
    Status: "planning",
    PercentComplete: 0,
    PlannedStartDate: "",
    PlannedFinishDate: ""
  });
  const [registerForm, setRegisterForm] = useState({
    Name: "",
    Email: "",
    password: "",
    Role: "Site PM" as "Site PM" | "PMAG", // PMAG can only create Site PMs and other PMAG users
    assignProject: false,
    ProjectId: "" as string | number
  });
  const [assignForm, setAssignForm] = useState({
    projectIds: [] as string[],  // Changed to array for multiple projects
    supervisorIds: [] as string[]
  });
  const [loading, setLoading] = useState(false);
  const [registerLoading, setRegisterLoading] = useState(false);
  const [assignLoading, setAssignLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [registeredUser, setRegisteredUser] = useState({
    email: '',
    password: '',
    role: '',
    projectId: null as string | null
  });
  const [projectSearchTerm, setProjectSearchTerm] = useState('');
  const [supervisorSearchTerm, setSupervisorSearchTerm] = useState('');
  const [expandedEntries, setExpandedEntries] = useState<Record<number, boolean>>({});
  const [showSnapshotFilter, setShowSnapshotFilter] = useState(false);

  // Fetch projects and supervisors
  const loadInitialData = async () => {
    try {
      const data = await fetchData();
      setProjects(data.projects);
      setSupervisors(data.supervisors);

      // Fetch approved entries for PMAG review
      await loadApprovedEntries();
    } catch (error) {
      console.error("Failed to fetch data:", error);
      toast.error("Failed to fetch data");
    }
  };

  // Fetch approved entries from PM
  const loadApprovedEntries = async () => {
    try {
      setLoadingEntries(true);
      const entries = await fetchApprovedEntries();
      setApprovedEntries(entries);
    } catch (error) {
      console.error('Error fetching approved entries:', error);
      toast.error("Failed to load approved sheets");
    } finally {
      setLoadingEntries(false);
    }
  };

  // Fetch history entries with date filter
  const loadHistoryEntries = async (days?: number | null) => {
    try {
      setLoadingEntries(true);
      const entries = await fetchHistoryEntries(days);
      setHistoryEntries(entries || []);
    } catch (error) {
      console.error('Error fetching history entries:', error);
      toast.error("Failed to load history");
    } finally {
      setLoadingEntries(false);
    }
  };

  // Fetch archived entries
  const loadArchivedEntries = async () => {
    try {
      setLoadingEntries(true);
      const entries = await fetchArchivedEntries();
      setArchivedEntries(entries || []);
    } catch (error) {
      console.error('Error fetching archived entries:', error);
      toast.error("Failed to load archived sheets");
    } finally {
      setLoadingEntries(false);
    }
  };

  // Handle final approve entry
  const handleFinalApprove = async (entryId: number) => {
    try {
      await finalApproveEntry(entryId);

      // Find the entry that was approved to get details for notification
      const entry = approvedEntries.find(e => e.id === entryId);
      if (entry) {
        // Add notification for successful final approval
        addNotification({
          title: "Sheet Final Approved",
          message: `The ${entry.sheet_type.replace(/_/g, ' ')} sheet has been final approved and archived.`,
          type: "success",
          userId: user?.ObjectId,
          projectId: entry.project_id,
          entryId: entry.id,
          sheetType: entry.sheet_type
        });
      }

      // Refresh entries
      await loadApprovedEntries();
    } catch (error) {
      console.error(`Failed to final approve entry ${entryId}:`, error);
    }
  };

  // Handle reject entry
  const handleReject = async (entryId: number) => {
    try {
      await rejectEntry(entryId);

      // Find the entry that was rejected to get details for notification
      const entry = approvedEntries.find(e => e.id === entryId);
      if (entry) {
        // Add notification for rejection
        addNotification({
          title: "Sheet Rejected to PM",
          message: `The ${entry.sheet_type.replace(/_/g, ' ')} sheet has been rejected and sent back to PM for revision.`,
          type: "warning",
          userId: user?.ObjectId,
          projectId: entry.project_id,
          entryId: entry.id,
          sheetType: entry.sheet_type
        });
      }

      // Refresh entries
      await loadApprovedEntries();
    } catch (error) {
      console.error(`Failed to reject entry ${entryId}:`, error);
    }
  };

  // Handle register form change
  const handleRegisterFormChange = (field: string, value: string | boolean) => {
    setRegisterForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle assign form change
  const handleAssignFormChange = (field: string, value: string | string[]) => {
    setAssignForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle project form change
  const handleProjectFormChange = (field: string, value: string | number) => {
    setProjectForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle supervisor selection toggle
  const handleToggleSupervisorSelection = (supervisorId: string) => {
    setAssignForm(prev => {
      const currentIds = [...prev.supervisorIds];
      const index = currentIds.indexOf(supervisorId);

      if (index >= 0) {
        // Remove if already selected
        currentIds.splice(index, 1);
      } else {
        // Add if not selected
        currentIds.push(supervisorId);
      }

      return {
        ...prev,
        supervisorIds: currentIds
      };
    });
  };

  // Handle project selection toggle
  const handleToggleProjectSelection = (projectId: string) => {
    setAssignForm(prev => {
      const currentIds = [...prev.projectIds];
      const index = currentIds.indexOf(projectId);

      if (index >= 0) {
        // Remove if already selected
        currentIds.splice(index, 1);
      } else {
        // Add if not selected
        currentIds.push(projectId);
      }

      return {
        ...prev,
        projectIds: currentIds
      };
    });
  };

  // Handle create user
  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    setShowCreateUserModal(false);
    setShowRegisterModal(true);
  };

  // Handle create project
  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // In a real implementation, we would call a service function here
      // For now, we'll just show a success message
      toast.success("Project created successfully!");
      setShowCreateProjectModal(false);

      // Reset form
      setProjectForm({
        Name: "",
        Location: "",
        Status: "planning",
        PercentComplete: 0,
        PlannedStartDate: "",
        PlannedFinishDate: ""
      });
    } catch (error) {
      console.error('Project creation error:', error);
      toast.error('Project creation failed');
    } finally {
      setLoading(false);
    }
  };

  // Handle register user
  const handleRegisterUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegisterLoading(true);

    try {
      // In a real implementation, we would call a service function here
      // For now, we'll just show a success message
      toast.success("User registered successfully!");
      setShowRegisterModal(false);
      setShowSuccessModal(true);

      // Set registered user details
      setRegisteredUser({
        email: registerForm.Email,
        password: registerForm.password,
        role: registerForm.Role,
        projectId: registerForm.assignProject ? registerForm.ProjectId.toString() : null
      });

      // Reset form
      setRegisterForm({
        Name: "",
        Email: "",
        password: "",
        Role: "Site PM",
        assignProject: false,
        ProjectId: ""
      });
    } catch (error) {
      console.error('User registration error:', error);
      toast.error('User registration failed');
    } finally {
      setRegisterLoading(false);
    }
  };

  // Handle assign projects
  const handleAssignProjects = async (e: React.FormEvent) => {
    e.preventDefault();
    setAssignLoading(true);

    try {
      // In a real implementation, we would call a service function here
      // For now, we'll just show a success message
      toast.success("Projects assigned successfully!");
      setShowAssignProjectModal(false);

      // Reset form
      setAssignForm({
        projectIds: [],
        supervisorIds: []
      });
      setProjectSearchTerm('');
      setSupervisorSearchTerm('');
    } catch (error) {
      console.error('Project assignment error:', error);
      toast.error('Project assignment failed');
    } finally {
      setAssignLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  return (
    <DashboardLayout
      userName={user?.Name || "User"}
      userRole={user?.Role || "PMAG"}
      projectName={projectName}
      onAddUser={() => setShowCreateUserModal(true)}
      onCreateProject={() => setShowCreateProjectModal(true)}
      onAssignProject={() => setShowAssignProjectModal(true)}
    >
      <PMAGDashboardSummary
        projectName={projectName}
        approvedEntries={approvedEntries}
        historyEntries={historyEntries}
        archivedEntries={archivedEntries}
        onShowHistory={async () => {
          await loadHistoryEntries(historyFilter);
          setShowHistoryModal(true);
        }}
        onShowArchived={async () => {
          await loadArchivedEntries();
          setShowArchivedListModal(true);
        }}
        onShowSnapshotFilter={() => setShowSnapshotFilter(true)}
      />

      <PMAGSheetEntries
        approvedEntries={approvedEntries}
        loadingEntries={loadingEntries}
        onRefresh={loadApprovedEntries}
        onFinalApprove={handleFinalApprove}
        onReject={handleReject}
        expandedEntries={expandedEntries}
        setExpandedEntries={setExpandedEntries}
        onPushToP6={(entry) => {
          toast.info(`Push to P6 functionality for entry #${entry.id} coming soon`);
        }}
      />

      <PMAGChartsSection />

      <PMAGUserManagementModals
        showCreateUserModal={showCreateUserModal}
        setShowCreateUserModal={setShowCreateUserModal}
        showCreateProjectModal={showCreateProjectModal}
        setShowCreateProjectModal={setShowCreateProjectModal}
        showRegisterModal={showRegisterModal}
        setShowRegisterModal={setShowRegisterModal}
        showAssignProjectModal={showAssignProjectModal}
        setShowAssignProjectModal={setShowAssignProjectModal}
        projects={projects}
        supervisors={supervisors}
        registerForm={registerForm}
        setRegisterForm={setRegisterForm}
        assignForm={assignForm}
        setAssignForm={setAssignForm}
        projectForm={projectForm}
        setProjectForm={setProjectForm}
        registerLoading={registerLoading}
        assignLoading={assignLoading}
        loading={loading}
        projectSearchTerm={projectSearchTerm}
        setProjectSearchTerm={setProjectSearchTerm}
        supervisorSearchTerm={supervisorSearchTerm}
        setSupervisorSearchTerm={setSupervisorSearchTerm}
        onCreateUser={handleCreateUser}
        onCreateProject={handleCreateProject}
        onRegisterUser={handleRegisterUser}
        onAssignProjects={handleAssignProjects}
        onRegisterFormChange={handleRegisterFormChange}
        onAssignFormChange={handleAssignFormChange}
        onProjectFormChange={handleProjectFormChange}
        onToggleSupervisorSelection={handleToggleSupervisorSelection}
        onToggleProjectSelection={handleToggleProjectSelection}
      />

      <PMAGSuccessModal
        showSuccessModal={showSuccessModal}
        setShowSuccessModal={setShowSuccessModal}
        registeredUser={registeredUser}
        projects={projects}
      />

      {/* History Modal */}
      <Dialog open={showHistoryModal} onOpenChange={setShowHistoryModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>History</DialogTitle>
          </DialogHeader>
          <div className="mb-4 flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <label htmlFor="history-filter" className="text-sm font-medium">Show entries from:</label>
              <select
                id="history-filter"
                value={historyFilter?.toString() || "all"}
                onChange={(e) => {
                  const days = e.target.value === "all" ? null : parseInt(e.target.value);
                  setHistoryFilter(days);
                  loadHistoryEntries(days);
                }}
                className="border rounded px-3 py-1 text-sm"
              >
                <option value="all">All time</option>
                <option value="1">Last 24 hours</option>
                <option value="7">Last 7 days</option>
                <option value="30">Last 30 days</option>
              </select>
            </div>
            <button
              onClick={() => loadHistoryEntries(historyFilter)}
              className="px-3 py-1 text-sm border rounded hover:bg-gray-100"
            >
              Refresh
            </button>
          </div>
          <div className="space-y-4">
            {historyEntries.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No history entries found</p>
              </div>
            ) : (
              historyEntries.map((entry: any) => (
                <div key={entry.id} className="border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <h3 className="font-semibold text-lg mb-1">Entry #{entry.id}</h3>
                      <div className="space-y-1 text-sm">
                        <p><span className="font-medium">Sheet:</span> {entry.sheet_type?.replace(/_/g, ' ')}</p>
                        <p><span className="font-medium">Project:</span> {entry.project_name || 'N/A'}</p>
                      </div>
                    </div>
                    <div>
                      <div className="space-y-1 text-sm">
                        <p><span className="font-medium">Submitted by:</span> {entry.supervisor_name || 'Supervisor'}</p>
                        <p><span className="font-medium">Status:</span> {entry.status?.replace(/_/g, ' ')}</p>
                      </div>
                    </div>
                    <div className="flex flex-col justify-center md:items-end">
                      <button
                        onClick={() => {
                          setSelectedArchivedEntry(entry);
                          setShowHistoryModal(false);
                          setShowArchivedModal(true);
                        }}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="flex justify-end pt-4">
            <button
              onClick={() => setShowHistoryModal(false)}
              className="px-4 py-2 border rounded hover:bg-gray-100"
            >
              Close
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Archived List Modal */}
      <Dialog open={showArchivedListModal} onOpenChange={setShowArchivedListModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Archived Entries</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {archivedEntries.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No archived entries found</p>
              </div>
            ) : (
              archivedEntries.map((entry: any) => (
                <div key={entry.id} className="border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <h3 className="font-semibold text-lg mb-1">Entry #{entry.id}</h3>
                      <div className="space-y-1 text-sm">
                        <p><span className="font-medium">Sheet:</span> {entry.sheet_type?.replace(/_/g, ' ')}</p>
                        <p><span className="font-medium">Project:</span> {entry.project_name || 'N/A'}</p>
                      </div>
                    </div>
                    <div>
                      <div className="space-y-1 text-sm">
                        <p><span className="font-medium">Submitted by:</span> {entry.supervisor_name || 'Supervisor'}</p>
                        <p><span className="font-medium">Status:</span> Final Approved</p>
                      </div>
                    </div>
                    <div className="flex flex-col justify-center md:items-end">
                      <button
                        onClick={() => {
                          setSelectedArchivedEntry(entry);
                          setShowArchivedListModal(false);
                          setShowArchivedModal(true);
                        }}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="flex justify-end pt-4">
            <button
              onClick={() => setShowArchivedListModal(false)}
              className="px-4 py-2 border rounded hover:bg-gray-100"
            >
              Close
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Archived Entry Detail Modal */}
      <Dialog open={showArchivedModal} onOpenChange={setShowArchivedModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Sheet Details</DialogTitle>
          </DialogHeader>
          {selectedArchivedEntry && (
            <div className="space-y-6">
              {/* Entry Header */}
              <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 pb-3 border-b bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                <div className="flex flex-col mb-3 md:mb-0">
                  <span className="font-semibold text-lg">Entry #{selectedArchivedEntry.id}</span>
                  <span className="text-sm text-muted-foreground">
                    Submitted by: {selectedArchivedEntry.supervisor_name || 'Supervisor'}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Date: {new Date(selectedArchivedEntry.updated_at || selectedArchivedEntry.created_at).toLocaleString()}
                  </span>
                  <span className="text-xs font-medium text-primary mt-1">
                    Project ID: {selectedArchivedEntry.project_id} | Sheet Type: {selectedArchivedEntry.sheet_type?.replace(/_/g, ' ')}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="px-3 py-1 bg-green-500 text-white rounded text-xs font-medium">
                    {selectedArchivedEntry.status?.replace(/_/g, ' ') || 'Final Approved'}
                  </span>
                </div>
              </div>

              {/* Sheet Data */}
              {(() => {
                const entryData = typeof selectedArchivedEntry.data_json === 'string'
                  ? JSON.parse(selectedArchivedEntry.data_json)
                  : selectedArchivedEntry.data_json;

                return (
                  <>
                    {/* Static Header */}
                    {entryData?.staticHeader && (
                      <div className="bg-blue-50 dark:bg-blue-900/30 p-3 rounded mb-4 border border-blue-100">
                        <p className="text-sm"><strong>Project:</strong> {entryData.staticHeader.projectInfo}</p>
                        <p className="text-sm"><strong>Reporting Date:</strong> {entryData.staticHeader.reportingDate}</p>
                        <p className="text-sm"><strong>Progress Date:</strong> {entryData.staticHeader.progressDate}</p>
                      </div>
                    )}

                    {/* Data Table */}
                    {entryData?.rows && entryData.rows.length > 0 && (
                      <div className="mb-4 overflow-x-auto">
                        <table className="w-full border-collapse">
                          <thead>
                            <tr className="bg-gray-100 dark:bg-gray-700">
                              {Object.keys(entryData.rows[0]).map((key) => (
                                <th key={key} className="border border-gray-300 dark:border-gray-600 p-2 text-left text-xs font-semibold">
                                  {key.replace(/([A-Z])/g, ' $1').trim().toUpperCase()}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {entryData.rows.map((row: any, rowIndex: number) => (
                              <tr key={rowIndex} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                                {Object.values(row).map((value: any, colIndex: number) => (
                                  <td key={`${rowIndex}-${colIndex}`} className="border border-gray-300 dark:border-gray-600 p-2 text-sm">
                                    {value || '-'}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {/* Total Manpower (if applicable) */}
                    {entryData?.totalManpower !== undefined && (
                      <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/30 rounded border border-green-200">
                        <p className="text-sm font-semibold">Total Manpower: {entryData.totalManpower}</p>
                      </div>
                    )}
                  </>
                );
              })()}

              {/* Action Buttons */}
              <div className="flex justify-end space-x-2 pt-4 border-t">
                <button
                  onClick={() => setShowArchivedModal(false)}
                  className="px-4 py-2 border rounded hover:bg-gray-100"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Snapshot Filter Modal */}
      <SnapshotFilterModal
        isOpen={showSnapshotFilter}
        onClose={() => setShowSnapshotFilter(false)}
        projects={projects}
      />
    </DashboardLayout>
  );
};

export default PMAGDashboard;