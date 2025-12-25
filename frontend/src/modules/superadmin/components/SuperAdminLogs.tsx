import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, RefreshCw, Download } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface SystemLog {
  id: number;
  action_type: string;
  performed_by_name: string;
  target_entity: string;
  remarks: string;
  timestamp: string;
}

interface SuperAdminLogsProps {
  systemLogs: SystemLog[];
  logsLoading: boolean;
  logsError: string;
  searchTerm: string;
  timeFilter: string;
  actionFilter: string;
  onSearchChange: (term: string) => void;
  onTimeFilterChange: (filter: string) => void;
  onActionFilterChange: (filter: string) => void;
  onExportExcel: () => void;
  onExportPDF: () => void;
  onRefresh: () => void;
}

export const SuperAdminLogs: React.FC<SuperAdminLogsProps> = ({ 
  systemLogs,
  logsLoading,
  logsError,
  searchTerm,
  timeFilter,
  actionFilter,
  onSearchChange,
  onTimeFilterChange,
  onActionFilterChange,
  onExportExcel,
  onExportPDF,
  onRefresh
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>System Logs</CardTitle>
        <CardDescription>View system activity and audit trails</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-2 w-full">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search logs..."
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-8"
              />
            </div>
            
            <Select value={timeFilter} onValueChange={onTimeFilterChange}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Time Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="10min">Last 10 Minutes</SelectItem>
                <SelectItem value="1hr">Last 1 Hour</SelectItem>
                <SelectItem value="24hr">Last 24 Hours</SelectItem>
                <SelectItem value="7days">Last 7 Days</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={actionFilter} onValueChange={onActionFilterChange}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Action Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                <SelectItem value="submission">Submissions</SelectItem>
                <SelectItem value="approval">Approvals</SelectItem>
                <SelectItem value="rejection">Rejections</SelectItem>
                <SelectItem value="pushed">Pushed/Forwarded</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="flex items-center gap-2"
              onClick={onExportExcel}
            >
              <Download className="w-4 h-4" />
              Excel
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="flex items-center gap-2"
              onClick={onExportPDF}
            >
              <Download className="w-4 h-4" />
              PDF
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="flex items-center gap-2"
              onClick={onRefresh}
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </Button>
          </div>
        </div>
        
        {logsLoading ? (
          <div className="flex justify-center items-center h-32">
            <RefreshCw className="w-6 h-6 animate-spin" />
            <span className="ml-2">Loading logs...</span>
          </div>
        ) : logsError ? (
          <div className="flex justify-center items-center h-32 text-red-500">
            <span>Error: {logsError}</span>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Performed By</TableHead>
                  <TableHead>Action Type</TableHead>
                  <TableHead>Target Entity</TableHead>
                  <TableHead>Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {systemLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-gray-500 py-8">
                      No logs found
                    </TableCell>
                  </TableRow>
                ) : (
                  systemLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-mono text-sm">
                        {new Date(log.timestamp).toLocaleString()}
                      </TableCell>
                      <TableCell>{log.performed_by_name || 'System'}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {log.action_type || 'Unknown'}
                        </Badge>
                      </TableCell>
                      <TableCell>{log.target_entity || 'N/A'}</TableCell>
                      <TableCell>{log.remarks || 'N/A'}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};