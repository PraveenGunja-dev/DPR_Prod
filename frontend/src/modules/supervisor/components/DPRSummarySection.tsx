import React, { useState, useEffect, useMemo } from 'react';
import { StyledExcelTable } from "@/components/StyledExcelTable";
import { P6Activity, P6Resource } from "@/services/p6ActivityService";
import { ResourceTable } from './ResourceTable';

interface DPRSummarySectionProps {
  p6Activities?: P6Activity[];
  dpQtyData?: any[];
  dpBlockData?: any[];
  dpVendorBlockData?: any[];
  dpVendorIdtData?: any[];
  manpowerDetailsData?: any[];
  resourceData?: P6Resource[];
  onExportAll?: () => void;
  onReachEnd?: () => void;
  selectedBlock?: string;
}

// Category definitions for grouping activities
const CATEGORIES = [
  { name: 'PILING', patterns: ['piling', 'stub', 'cap', 'cable hanger', 'robot docking', 'piling work'] },
  { name: 'MMS', patterns: ['mms', 'tracker', 'torque tube', 'module', 'erection', 'installation', 'mounting'] },
  { name: 'IDT', patterns: ['idt', 'foundation', 'inverter', 'transformer'] },
  { name: 'AC_DC', patterns: ['earthing', 'cable', 'dc ', 'ac ', 'laying', 'wiring', 'trenching'] }
];

// Aggregate values from table entries by activity name
const aggregateTableData = (
  p6Activities: P6Activity[],
  dpQtyData: any[],
  dpBlockData: any[],
  dpVendorBlockData: any[]
) => {
  // Create a map of activity data by description/name
  const activityMap = new Map<string, any>();

  // Initialize with P6 activities
  p6Activities.forEach(activity => {
    const id = String(activity.activityObjectId || activity.activityId || '');
    if (id) {
      activityMap.set(id, {
        name: activity.name || '',
        uom: activity.unitOfMeasure || '',
        totalScope: Number(activity.targetQty || 0),
        front: activity.front || '',
        completed: Number(activity.actualQty || activity.percentComplete || 0),
        cumulative: Number(activity.actualQty || 0),
        balance: Number(activity.remainingQty || 0),
        percentStatus: Number(activity.percentComplete || 0),
        remarks: activity.remarks || ''
      });
    }
  });

  // ... rest of the function ...



  // Merge/update with DP Qty data
  dpQtyData.forEach(entry => {
    const id = String(entry.activityObjectId || entry.activityId || '');
    if (id) {
      const existing = activityMap.get(id) || { name: entry.description || '' };
      activityMap.set(id, {
        ...existing,
        totalScope: parseFloat(entry.totalQuantity) || existing.totalScope || 0,
        balance: parseFloat(entry.balance) || existing.balance || 0,
        cumulative: parseFloat(entry.cumulative) || existing.cumulative || 0,
        uom: entry.uom || existing.uom || ''
      });
    }
  });

  // Merge with DP Block data
  dpBlockData.forEach(entry => {
    const name = entry.activities || '';
    if (name) {
      const existing = activityMap.get(name.toLowerCase()) || { name };
      activityMap.set(name.toLowerCase(), {
        ...existing,
        completed: parseFloat(entry.completed) || existing.completed || 0,
        front: parseFloat(entry.front) || existing.front || 0,
        balance: parseFloat(entry.balance) || existing.balance || 0
      });
    }
  });

  // Merge with DP Vendor Block data
  dpVendorBlockData.forEach(entry => {
    if (entry.isCategoryRow) return;
    const name = entry.activities || '';
    if (name) {
      const existing = activityMap.get(name.toLowerCase()) || { name };
      activityMap.set(name.toLowerCase(), {
        ...existing,
        completed: parseFloat(entry.actual) || existing.completed || 0,
        front: parseFloat(entry.front) || existing.front || 0,
        remarks: entry.remarks || existing.remarks || ''
      });
    }
  });

  return activityMap;
};

// Group activities by category
const groupActivitiesByCategory = (activityMap: Map<string, any>) => {
  const grouped: { category: string; activities: any[] }[] = [];
  const usedNames = new Set<string>();

  CATEGORIES.forEach(category => {
    const matchingActivities: any[] = [];

    activityMap.forEach((data, id) => {
      if (usedNames.has(id)) return;
      const lowerName = (data.name || '').toLowerCase();
      if (category.patterns.some(pattern => lowerName.includes(pattern))) {
        matchingActivities.push(data);
        usedNames.add(id);
      }
    });

    if (matchingActivities.length > 0) {
      grouped.push({ category: category.name, activities: matchingActivities });
    }
  });

  // Add remaining to OTHER
  const remaining: any[] = [];
  activityMap.forEach((data, key) => {
    if (!usedNames.has(key)) remaining.push(data);
  });
  if (remaining.length > 0) {
    grouped.push({ category: 'OTHER', activities: remaining });
  }

  return grouped;
};

// Build table rows from grouped data
const buildTableData = (groupedActivities: { category: string; activities: any[] }[]) => {
  const rows: string[][] = [];
  const categoryRowIndices: number[] = [];

  groupedActivities.forEach(group => {
    categoryRowIndices.push(rows.length);
    rows.push([group.category, '', '', '', '', '', '', '', '']);

    group.activities.forEach(activity => {
      const completed = activity.completed || 0;
      const totalScope = activity.totalScope || 0;
      const percentStatus = totalScope > 0 ? Math.round((completed / totalScope) * 100) : 0;
      const status = percentStatus >= 100 ? 'Completed' : (percentStatus > 0 ? 'WIP' : '');

      rows.push([
        activity.name || '',
        activity.uom || '',
        String(totalScope || ''),
        String(activity.front || ''),
        String(completed || ''),
        String(activity.cumulative || ''),
        String(activity.balance || ''),
        `${percentStatus}%`,
        status || activity.remarks || ''
      ]);
    });
  });

  return { rows, categoryRowIndices };
};

export const DPRSummarySection: React.FC<DPRSummarySectionProps> = ({
  p6Activities = [],
  dpQtyData = [],
  dpBlockData = [],
  dpVendorBlockData = [],
  dpVendorIdtData = [],
  manpowerDetailsData = [],
  resourceData = [],
  onExportAll,
  onReachEnd,
  selectedBlock = "ALL"
}) => {
  const [themeMode, setThemeMode] = useState<'light' | 'dark'>('light');
  const [activeTable, setActiveTable] = useState<'main' | 'charging' | 'resources'>('main');

  useEffect(() => {
    const updateTheme = () => {
      const isDark = document.documentElement.classList.contains('dark');
      setThemeMode(isDark ? 'dark' : 'light');
    };
    updateTheme();
    const observer = new MutationObserver(updateTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  // Aggregate and group data dynamically
  const { mainActivityData, rowStyles } = useMemo(() => {
    const filteredP6 = selectedBlock === "ALL" ? p6Activities : p6Activities.filter(a => a.block === selectedBlock);
    const filteredQty = selectedBlock === "ALL" ? dpQtyData : dpQtyData.filter(a => a.block === selectedBlock);
    const filteredBlock = selectedBlock === "ALL" ? dpBlockData : dpBlockData.filter(a => a.block === selectedBlock);
    const filteredVendor = selectedBlock === "ALL" ? dpVendorBlockData : dpVendorBlockData.filter(a => a.block === selectedBlock || (a.isCategoryRow));

    const activityMap = aggregateTableData(filteredP6, filteredQty, filteredBlock, filteredVendor);
    const grouped = groupActivitiesByCategory(activityMap);
    const { rows, categoryRowIndices } = buildTableData(grouped);

    const styles: Record<number, any> = {};
    categoryRowIndices.forEach(index => {
      styles[index] = { isCategoryRow: true };
    });

    return { mainActivityData: rows, rowStyles: styles };
  }, [p6Activities, dpQtyData, dpBlockData, dpVendorBlockData, selectedBlock]);

  const [localResourceData, setLocalResourceData] = useState<any[]>([]);

  // Initialize/Update local resource data when prop changes
  useEffect(() => {
    if (resourceData && resourceData.length > 0) {
      const mappedData = resourceData.map(r => ({
        typeOfMachine: r.name || r.resource_id || "Unknown Resource",
        total: String(r.total_units || r.units || r.total || 0),
        yesterday: "0",
        today: "0",
        remarks: ""
      }));
      setLocalResourceData(mappedData);
    } else {
      setLocalResourceData([]);
    }
  }, [resourceData]);

  const getContainerBgClass = () => themeMode === 'light' ? 'bg-white' : 'bg-gray-900';
  const getTitleBarBgClass = () => themeMode === 'light' ? 'bg-[#DDE4EC]' : 'bg-[#2D2D2D]';
  const getTitleBarTextClass = () => themeMode === 'light' ? 'text-black' : 'text-white';

  return (
    <div className={`w-full p-4 rounded-lg shadow-md ${getContainerBgClass()}`}>
      <div className="mb-4 flex justify-end">
        <select
          value={activeTable}
          onChange={(e) => setActiveTable(e.target.value as 'main' | 'charging' | 'resources')}
          className={`p-2 border rounded ${themeMode === 'light' ? 'bg-white border-gray-300' : 'bg-gray-800 border-gray-600 text-white'}`}
        >
          <option value="main">Main Activity</option>
          <option value="charging">Charging Plan</option>
          <option value="resources">Resources</option>
        </select>
      </div>

      {activeTable === 'main' && (
        <StyledExcelTable
          title="Main Activity"
          columns={["Activity", "UOM", "Scope", "Front", "Completed", "Cumulative", "Balance", "% Status", "Remarks"]}
          data={mainActivityData}
          onDataChange={() => { }}
          onSave={() => { }}
          onSubmit={() => { }}
          columnTypes={{
            "Activity": "text", "UOM": "text", "Scope": "number", "Front": "number",
            "Completed": "number", "Cumulative": "number", "Balance": "number", "% Status": "text", "Remarks": "text"
          }}
          columnWidths={{
            "Activity": 150, "UOM": 60, "Scope": 80, "Front": 70,
            "Completed": 80, "Cumulative": 80, "Balance": 70, "% Status": 70, "Remarks": 100
          }}
          rowStyles={rowStyles}
          isReadOnly={true}
          hideAddRow={true}
          onExportAll={onExportAll} 
          onReachEnd={onReachEnd}
          totalRows={undefined} />
      )}

      {activeTable === 'charging' && (
        <div className="text-center py-8 text-muted-foreground">
          <p>Charging Plan - Coming soon</p>
        </div>
      )}

      {activeTable === 'resources' && (
        <ResourceTable
          data={localResourceData}
          setData={setLocalResourceData}
          onSave={() => { }}
          yesterday={new Date(Date.now() - 86400000).toISOString().split('T')[0]}
          today={new Date().toISOString().split('T')[0]}
          onExportAll={onExportAll}
        />
      )}
    </div>
  );
};