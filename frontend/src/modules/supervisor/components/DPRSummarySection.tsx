import React, { useState, useEffect, useMemo } from 'react';
import { StyledExcelTable } from "@/components/StyledExcelTable";
import { P6Activity, P6Resource } from "@/services/p6ActivityService";
import { indianDateFormat } from "@/services/dprService";
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
  universalFilter?: string;
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
  dpVendorBlockData: any[],
  manpowerDetailsData: any[]
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
        remarks: activity.remarks || '',
        mpScope: 0,
        mpActual: 0,
        mpBalance: 0,
        basePlanStart: activity.baselineStartDate,
        basePlanFinish: activity.baselineFinishDate,
        bl1Start: activity.baseline1StartDate,
        bl1Finish: activity.baseline1FinishDate,
        bl2Start: activity.baseline2StartDate,
        bl2Finish: activity.baseline2FinishDate,
        bl3Start: activity.baseline3StartDate,
        bl3Finish: activity.baseline3FinishDate,
        bl4Start: (activity as any).baseline4StartDate,
        bl4Finish: (activity as any).baseline4FinishDate,
        actualStart: activity.actualStartDate,
        actualFinish: activity.actualFinishDate,
        forecastFinish: activity.forecastFinishDate
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
        uom: entry.uom || existing.uom || '',
        basePlanStart: entry.basePlanStart || existing.basePlanStart,
        basePlanFinish: entry.basePlanFinish || existing.basePlanFinish,
        bl1Start: entry.bl1Start || existing.bl1Start,
        bl1Finish: entry.bl1Finish || existing.bl1Finish,
        bl2Start: entry.bl2Start || existing.bl2Start,
        bl2Finish: entry.bl2Finish || existing.bl2Finish,
        bl3Start: entry.bl3Start || existing.bl3Start,
        bl3Finish: entry.bl3Finish || existing.bl3Finish,
        bl4Start: entry.bl4Start || existing.bl4Start,
        bl4Finish: entry.bl4Finish || existing.bl4Finish,
        actualStart: entry.actualStart || existing.actualStart,
        actualFinish: entry.actualFinish || existing.actualFinish,
        forecastFinish: entry.forecastFinish || existing.forecastFinish
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

  // Merge with Manpower Details data
  manpowerDetailsData.forEach(entry => {
    if (entry.isCategoryRow) return;
    const id = String(entry.activityObjectId || entry.activityId || '');
    const name = entry.description || '';

    // Try matching by ID first, then by name
    const existing = (id ? activityMap.get(id) : null) || activityMap.get(name.toLowerCase()) || { name };

    activityMap.set(id || name.toLowerCase(), {
      ...existing,
      uom: entry.uom || existing.uom || '',
      mpScope: parseFloat(entry.budgetedUnits) || 0,
      mpActual: parseFloat(entry.actualUnits) || 0,
      mpBalance: parseFloat(entry.remainingUnits) || 0
    });
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
    rows.push([group.category, '', '', '', '', '', '', '', '', '', '', '', '', '']); // 14 columns

    group.activities.forEach((activity, index) => {
      const completed = activity.cumulative || activity.completed || 0;
      const totalScope = activity.totalScope || 0;
      const percentStatus = totalScope > 0 ? Math.round((completed / totalScope) * 100) : 0;

      const formatDt = (dt: any) => {
        if (!dt) return '';
        const dtStr = String(dt).split('T')[0];
        return indianDateFormat(dtStr) || dtStr;
      };

      const baselineStart = formatDt(activity.bl4Start || activity.bl3Start || activity.bl2Start || activity.bl1Start || activity.basePlanStart);
      const baselineFinish = formatDt(activity.bl4Finish || activity.bl3Finish || activity.bl2Finish || activity.bl1Finish || activity.basePlanFinish);
      const actualStart = formatDt(activity.actualStart);

      const actualFinish = formatDt(activity.actualFinish);
      const forecastDt = formatDt(activity.forecastFinish);
      const forecastCompletionDate = actualFinish ? "Completed" : forecastDt;

      rows.push([
        String(index + 1), // SNo
        activity.name || '',
        activity.uom || '',
        String(totalScope || ''),
        String(completed || ''),
        String(activity.balance || ''),
        `${percentStatus}%`,
        String(activity.mpScope || ''),
        String(activity.mpActual || ''),
        String(activity.mpBalance || ''),
        baselineStart,
        baselineFinish,
        actualStart,
        forecastCompletionDate
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
  selectedBlock = "ALL",
  universalFilter = ""
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
    const filters = (universalFilter || "").trim().toLowerCase().split(/\s+/).filter(f => f);

    const matchesFilter = (item: any) => {
      if (filters.length === 0) return true;
      const id = item.activityId || "";
      
      return filters.every(f => {
        const filterLower = f.toLowerCase();
        
        // Match package segment in ID (e.g. 'CL' in 'ACL1-CL-1000')
        const parts = id.split('-');
        let pkg = "";
        if (parts.length >= 3) {
          pkg = parts[1].trim().toLowerCase();
        } else if (parts.length === 2 && !/^\d+$/.test(parts[0])) {
          pkg = parts[0].trim().toLowerCase();
        }
        
        const idMatch = pkg === filterLower || id.toLowerCase() === filterLower;
        
        return idMatch;
      });
    };

    const filteredP6 = p6Activities.filter(a => {
      const blockMatch = selectedBlock === "ALL" || (a.block === selectedBlock || a.newBlockNom === selectedBlock || a.plot === selectedBlock);
      return blockMatch && matchesFilter(a);
    });

    const filteredQty = dpQtyData.filter(a => {
      const blockMatch = selectedBlock === "ALL" || a.block === selectedBlock;
      return blockMatch && matchesFilter(a);
    });

    const filteredBlock = dpBlockData.filter(a => {
      const blockMatch = selectedBlock === "ALL" || a.block === selectedBlock;
      return blockMatch && matchesFilter(a);
    });

    const filteredVendor = dpVendorBlockData.filter(a => {
      if (a.isCategoryRow) return true;
      const blockMatch = selectedBlock === "ALL" || (a.block === selectedBlock || a.newBlockNom === selectedBlock || a.plot === selectedBlock);
      return blockMatch && matchesFilter(a);
    });

    const activityMap = aggregateTableData(filteredP6, filteredQty, filteredBlock, filteredVendor, manpowerDetailsData);
    const grouped = groupActivitiesByCategory(activityMap);
    const { rows, categoryRowIndices } = buildTableData(grouped);

    const styles: Record<number, any> = {};
    categoryRowIndices.forEach(index => {
      styles[index] = { isCategoryRow: true };
    });

    return { mainActivityData: rows, rowStyles: styles };
  }, [p6Activities, dpQtyData, dpBlockData, dpVendorBlockData, selectedBlock, universalFilter]);

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
          title="Summary of Activities"
          columns={["S.No", "Description", "UOM", "Material Scope", "Material Completed", "Material Balance", "% Comp", "Manpower Scope", "Manpower Completed", "Manpower Balance", "Baseline Start", "Baseline Finish", "Actual Start", "Forecast Completion Date"]}
          data={mainActivityData}
          onDataChange={() => { }}
          onSave={() => { }}
          onSubmit={() => { }}
          columnTypes={{
            "S.No": "text", "Description": "text", "UOM": "text",
            "Material Scope": "number", "Material Completed": "number", "Material Balance": "number", "% Comp": "text",
            "Manpower Scope": "number", "Manpower Completed": "number", "Manpower Balance": "number",
            "Baseline Start": "text", "Baseline Finish": "text", "Actual Start": "text", "Forecast Completion Date": "text"
          }}
          columnWidths={{
            "S.No": 50, "Description": 200, "UOM": 60,
            "Material Scope": 80, "Material Completed": 80, "Material Balance": 80, "% Comp": 70,
            "Manpower Scope": 80, "Manpower Completed": 80, "Manpower Balance": 80,
            "Baseline Start": 100, "Baseline Finish": 100, "Actual Start": 100, "Forecast Completion Date": 120
          }}
          headerStructure={[
            // First header row - main Categories and Spanning Columns
            [
              { label: "S.No", rowSpan: 2, colSpan: 1 },
              { label: "Description", rowSpan: 2, colSpan: 1 },
              { label: "UOM", rowSpan: 2, colSpan: 1 },
              { label: "Material Metrics", colSpan: 4, rowSpan: 1 },
              { label: "Manpower Metrics", colSpan: 3, rowSpan: 1 },
              { label: "Baseline Start", rowSpan: 2, colSpan: 1 },
              { label: "Baseline Finish", rowSpan: 2, colSpan: 1 },
              { label: "Actual Start", rowSpan: 2, colSpan: 1 },
              { label: "Forecast Completion Date", rowSpan: 2, colSpan: 1 }
            ],
            // Second header row - sub headings
            [
              { label: "Material Scope", colSpan: 1, rowSpan: 1 },
              { label: "Material Completed", colSpan: 1, rowSpan: 1 },
              { label: "Material Balance", colSpan: 1, rowSpan: 1 },
              { label: "% Comp", colSpan: 1, rowSpan: 1 },
              { label: "Manpower Scope", colSpan: 1, rowSpan: 1 },
              { label: "Manpower Completed", colSpan: 1, rowSpan: 1 },
              { label: "Manpower Balance", colSpan: 1, rowSpan: 1 }
            ]
          ]}
          rowStyles={rowStyles}
          isReadOnly={true}
          hideAddRow={true}
          onExportAll={onExportAll}
          onReachEnd={onReachEnd}
          totalRows={undefined}
          disableAutoHeaderColors={true} />
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