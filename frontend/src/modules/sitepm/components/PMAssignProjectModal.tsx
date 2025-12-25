import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { assignProjectsToMultipleSupervisors } from "@/modules/auth/services/projectService";

interface PMAssignProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  projects: any[];
  supervisors: any[];
  onAssignmentComplete: () => void;
}

export const PMAssignProjectModal: React.FC<PMAssignProjectModalProps> = ({
  isOpen,
  onClose,
  projects,
  supervisors,
  onAssignmentComplete
}) => {
  const [assignForm, setAssignForm] = useState({
    projectIds: [] as string[],  // Changed to array for multiple projects
    supervisorIds: [] as string[]
  });
  const [projectSearchTerm, setProjectSearchTerm] = useState('');
  const [supervisorSearchTerm, setSupervisorSearchTerm] = useState('');

  // Handle assign form change
  const handleAssignFormChange = (field: string, value: string | string[]) => {
    setAssignForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle supervisor selection toggle
  const toggleSupervisorSelection = (supervisorId: string) => {
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
  const toggleProjectSelection = (projectId: string) => {
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

  // Function to handle assignment form reset
  const handleAssignFormReset = () => {
    setAssignForm({
      projectIds: [],
      supervisorIds: []
    });
    // Reset search terms
    setProjectSearchTerm('');
    setSupervisorSearchTerm('');
  };

  const handleAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Assign project to multiple supervisors using the new API endpoint
      await assignProjectsToMultipleSupervisors(
        assignForm.projectIds.map(id => parseInt(id)),
        assignForm.supervisorIds.map(id => parseInt(id))
      );
      
      toast.success("Project assigned to selected users successfully!");
      onClose();
      
      // Reset form and search terms
      handleAssignFormReset();
      
      // Trigger refresh
      onAssignmentComplete();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Project assignment failed');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) {
        onClose();
        handleAssignFormReset();
      }
    }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Assign Projects to Users</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleAssignSubmit} className="space-y-4">
          <div>
            <Label>Projects</Label>
            {/* Search input for projects */}
            <div className="mb-2">
              <Input
                type="text"
                placeholder="Search projects..."
                value={projectSearchTerm}
                onChange={(e) => setProjectSearchTerm(e.target.value)}
                className="mb-2"
              />
            </div>
            <div className="border rounded-md max-h-40 overflow-y-auto">
              {projects.length > 0 ? (
                // Filter projects based on search term
                projects
                  .filter(project => 
                    project.Name.toLowerCase().includes(projectSearchTerm.toLowerCase())
                  )
                  .map((project) => {
                    const value = (project.ObjectId || project.id || '').toString();
                    
                    // Skip items with empty values
                    if (!value) return null;
                    
                    return (
                      <div 
                        key={project.ObjectId || project.id || project.Name} 
                        className={`flex items-center p-2 hover:bg-muted cursor-pointer ${
                          assignForm.projectIds.includes(value) ? 'bg-muted' : ''
                        }`}
                        onClick={() => toggleProjectSelection(value)}
                      >
                        <input
                          type="checkbox"
                          checked={assignForm.projectIds.includes(value)}
                          onChange={() => toggleProjectSelection(value)}
                          className="mr-2 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                        />
                        <div className="font-medium">{project.Name}</div>
                      </div>
                    );
                  })
              ) : (
                <div className="p-4 text-center text-muted-foreground">
                  No projects available
                </div>
              )}
            </div>
            {assignForm.projectIds.length > 0 && (
              <div className="mt-2 text-sm text-muted-foreground">
                Selected {assignForm.projectIds.length} project(s)
              </div>
            )}
          </div>
          <div>
            <Label>Users</Label>
            {/* Search input for supervisors */}
            <div className="mb-2">
              <Input
                type="text"
                placeholder="Search users..."
                value={supervisorSearchTerm}
                onChange={(e) => setSupervisorSearchTerm(e.target.value)}
                className="mb-2"
              />
            </div>
            <div className="border rounded-md max-h-40 overflow-y-auto">
              {supervisors && supervisors.length > 0 ? (
                // Filter supervisors based on search term
                supervisors
                  .filter(supervisor => 
                    supervisor.Name.toLowerCase().includes(supervisorSearchTerm.toLowerCase()) ||
                    supervisor.Email.toLowerCase().includes(supervisorSearchTerm.toLowerCase())
                  )
                  .map((supervisor) => {
                    const value = (supervisor.ObjectId || supervisor.id || '').toString();
                    
                    // Skip items with empty values
                    if (!value) return null;
                    
                    return (
                      <div 
                        key={supervisor.ObjectId || supervisor.id || supervisor.Name} 
                        className={`flex items-center p-2 hover:bg-muted cursor-pointer ${
                          assignForm.supervisorIds.includes(value) ? 'bg-muted' : ''
                        }`}
                        onClick={() => toggleSupervisorSelection(value)}
                      >
                        <input
                          type="checkbox"
                          checked={assignForm.supervisorIds.includes(value)}
                          onChange={() => toggleSupervisorSelection(value)}
                          className="mr-2 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                        />
                        <div>
                          <div className="font-medium">{supervisor.Name}</div>
                          <div className="text-sm text-muted-foreground">{supervisor.Email}</div>
                        </div>
                      </div>
                    );
                  })
              ) : (
                <div className="p-4 text-center text-muted-foreground">
                  No users available
                </div>
              )}
            </div>
            {assignForm.supervisorIds.length > 0 && (
              <div className="mt-2 text-sm text-muted-foreground">
                Selected {assignForm.supervisorIds.length} user(s)
              </div>
            )}
          </div>
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={assignForm.projectIds.length === 0 || assignForm.supervisorIds.length === 0}
            >
              {assignForm.projectIds.length > 0 && assignForm.supervisorIds.length > 0 
                ? `Assign ${assignForm.projectIds.length} Project(s) to ${assignForm.supervisorIds.length} User(s)`
                : 'Assign Projects to Users'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};