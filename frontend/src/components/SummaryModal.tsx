import React, { useState, useEffect } from 'react';
import { X, Table, BarChart3 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { DPRSummarySection } from '@/modules/supervisor/components/DPRSummarySection';
import { SummaryCharts } from '@/components/SummaryCharts';
import { getP6ActivitiesPaginated, P6Activity } from '@/services/p6ActivityService';

interface SummaryModalProps {
    isOpen: boolean;
    onClose: () => void;
    projectId: string | number | null;
    projectName: string;
}

export const SummaryModal: React.FC<SummaryModalProps> = ({
    isOpen,
    onClose,
    projectId,
    projectName
}) => {
    const [p6Activities, setP6Activities] = useState<P6Activity[]>([]);
    const [loading, setLoading] = useState(false);
    const [activeView, setActiveView] = useState<'table' | 'charts'>('table');

    useEffect(() => {
        const loadActivities = async () => {
            if (!isOpen || !projectId) return;

            try {
                setLoading(true);
                // Fetch all activities with a higher limit (500 to get all)
                const response = await getP6ActivitiesPaginated(String(projectId), 1, 5000);
                setP6Activities(response.activities);
            } catch (error) {
                console.error('Failed to fetch P6 activities for summary:', error);
            } finally {
                setLoading(false);
            }
        };

        loadActivities();
    }, [isOpen, projectId]);

    // Reset to table view when modal opens
    useEffect(() => {
        if (isOpen) {
            setActiveView('table');
        }
    }, [isOpen]);

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent
                className="max-w-[75vw] w-[75vw] max-h-[90vh] overflow-y-auto p-0"
                style={{ width: '75vw' }}
            >
                <DialogHeader className="sticky top-0 z-10 bg-background border-b px-6 py-4">
                    <div className="flex items-center justify-between">
                        <DialogTitle className="text-xl font-bold">
                            Project Summary - {projectName}
                        </DialogTitle>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-muted rounded-full transition-colors"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    {/* View Toggle Tabs */}
                    <div className="mt-4">
                        <Tabs value={activeView} onValueChange={(v) => setActiveView(v as 'table' | 'charts')}>
                            <TabsList className="grid w-full max-w-md grid-cols-2">
                                <TabsTrigger value="table" className="flex items-center gap-2">
                                    <Table className="h-4 w-4" />
                                    Summary Table
                                </TabsTrigger>
                                <TabsTrigger value="charts" className="flex items-center gap-2">
                                    <BarChart3 className="h-4 w-4" />
                                    Charts
                                </TabsTrigger>
                            </TabsList>
                        </Tabs>
                    </div>
                </DialogHeader>

                <div className="p-6 overflow-y-auto">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                            <span className="ml-3 text-muted-foreground">Loading summary...</span>
                        </div>
                    ) : activeView === 'table' ? (
                        <DPRSummarySection
                            p6Activities={p6Activities}
                            dpQtyData={[]}
                            dpBlockData={[]}
                            dpVendorBlockData={[]}
                            dpVendorIdtData={[]}
                            manpowerDetailsData={[]}
                        />
                    ) : (
                        <SummaryCharts p6Activities={p6Activities} />
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
};
