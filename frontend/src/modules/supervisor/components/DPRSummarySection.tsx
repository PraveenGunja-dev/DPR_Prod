import React, { useState, useEffect, useMemo, useCallback } from 'react';
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

// ============================================================================
// SOLAR SUMMARY — Fixed Category-to-Activity Mapping (CC activities only)
// ============================================================================
// Activity names below are the "clean" names after stripping block prefix
// e.g. "Block-01 - Piling - MMS (Marking, Auguring & Concreting)" -> "Piling - MMS (Marking, Auguring & Concreting)"

interface CategoryDef {
  name: string;
  activities: string[];  // normalized lowercase substrings to match
}

const SOLAR_SUMMARY_CATEGORIES: CategoryDef[] = [
  {
    name: 'PILING',
    activities: [
      'piling - mms (marking, auguring & concreting)',
      'pile capping',
      'piling - lt cable hanger system',
      'piling - inverters',
      'piling - robotic docking system',
      'array earthing',
    ],
  },
  {
    name: 'MMS & MODULE',
    activities: [
      'mms erection - torque tube/rafter',
      'mms erection - transmission shaft/bracing',
      'mms erection - purlin',
      'mms  - rfi completion',
      'module installation',
      'module - rfi completion',
    ],
  },
  {
    name: 'ROBOTIC WORKS',
    activities: [
      'robotic structure - docking station installation',
      'robotic structure - reverse station installation',
      'robotic structure - bridges installation',
      'robot installation',
    ],
  },
  {
    name: 'IDT',
    activities: [
      'idt foundation up to rail',
      'ht & lt station - slab',
      'ht lt station - slab',
      'ht & lt station - shed installation',
      'ht & lt station - sheeting installation',
      'nifps foundation',
      'bot foundation',
      'aux transformer foundation',
    ],
  },
  {
    name: 'AC / DC',
    activities: [
      'dc cable laying',
      'module interconnection & mc4 termination',
      'voc testing',
      'lt cable laying',
      'ht cable laying',
      'fo cable laying',
      'ht panel erection',
      'lt panel erection',
      'idt erection',
      'inverter installation',
      'scada & sacu installation',
      'aux transformer - installation',
    ],
  },
  {
    name: 'TESTING',
    activities: [
      'idt filtration',
      'idt testing',
      'ht panel testing',
      'lt panel testing',
    ],
  },
  {
    name: 'COMMISSIONING & COD',
    activities: [
      'cea compliance & approval',
      'first time charging',
      'trial operation',
      'trial run certificate',
      'cod',
    ],
  },
];

// ============================================================================
// Helper: strip block prefix from activity name
// Handles "Block-01 - ", "Blk 02 - ", "Plot-03 - ", etc.
// ============================================================================
const stripBlockPrefix = (name: string): string => {
  if (!name) return '';
  // Match prefix like "Block-01 - ", "Blk 02 - ", "Plot-03 - " case-insensitive
  return name.replace(/^(Block|Blk|Plot)\s*[- ]?\s*\w+\s*-\s*/i, '').trim();
};

// ============================================================================
// Helper: check if an item matches the selected block
// ============================================================================
const matchesBlock = (item: any, selectedBlock: string): boolean => {
  if (!selectedBlock || selectedBlock === 'ALL') return true;
  const itemBlock = String(item.block || item.newBlockNom || item.plot || '').toLowerCase().trim();
  const targetBlock = selectedBlock.toLowerCase().trim();
  return itemBlock === targetBlock;
};

// ============================================================================
// Helper: check if an activity is a CC activity (case-insensitive)
// ============================================================================
const isCCActivity = (activity: P6Activity): boolean => {
  const id = (activity.activityId || '').toUpperCase();
  const name = (activity.name || '').toUpperCase();
  return id.includes('CC') || name.includes('CC');
};

// ============================================================================
// Helper: format date in Indian format
// ============================================================================
const formatDt = (dt: any): string => {
  if (!dt) return '';
  const dtStr = String(dt).split('T')[0];
  return indianDateFormat(dtStr) || dtStr;
};

// ============================================================================
// Group and aggregate CC activities by category
// ============================================================================
interface AggregatedActivity {
  name: string;
  uom: string;
  totalScope: number;
  completed: number;
  balance: number;
  percentStatus: number;
  mpScope: number;
  mpActual: number;
  mpBalance: number;
  basePlanStart: string;
  basePlanFinish: string;
  actualStart: string;
  actualFinish: string;
  forecastFinish: string;
}

const aggregateAndGroupCCActivities = (
  p6Activities: P6Activity[],
  dpQtyData: any[],
  manpowerDetailsData: any[],
  selectedBlock: string,
  universalFilter: string,
): { rows: string[][]; categoryRowIndices: number[] } => {
  // Step 1: Pre-aggregate DP Qty Data (filtered by block)
  const dpQtyAggMap = new Map<string, { scope: number; comp: number; bal: number }>();
  dpQtyData.forEach(entry => {
    if (entry.isCategoryRow || !matchesBlock(entry, selectedBlock)) return;
    const cleanName = stripBlockPrefix(entry.description || entry.name || '');
    if (!cleanName) return;
    const key = cleanName.toLowerCase();
    const existing = dpQtyAggMap.get(key) || { scope: 0, comp: 0, bal: 0 };
    dpQtyAggMap.set(key, {
      scope: existing.scope + parseFloat(entry.totalQuantity || '0'),
      comp: existing.comp + parseFloat(entry.cumulative || '0'),
      bal: existing.bal + parseFloat(entry.balance || '0')
    });
  });

  // Step 2: Pre-aggregate Manpower Data (filtered by block)
  const mpAggMap = new Map<string, { scope: number; comp: number; bal: number }>();
  manpowerDetailsData.forEach(entry => {
    if (entry.isCategoryRow || !matchesBlock(entry, selectedBlock)) return;
    const cleanName = stripBlockPrefix(entry.description || '');
    if (!cleanName) return;
    const key = cleanName.toLowerCase();
    const existing = mpAggMap.get(key) || { scope: 0, comp: 0, bal: 0 };
    mpAggMap.set(key, {
      scope: existing.scope + parseFloat(entry.budgetedUnits || '0'),
      comp: existing.comp + parseFloat(entry.actualUnits || '0'),
      bal: existing.bal + parseFloat(entry.remainingUnits || '0')
    });
  });

  // Step 3: Filter P6 master list by CC and Block
  const filteredP6 = p6Activities.filter(a => isCCActivity(a) && matchesBlock(a, selectedBlock));
  
  // Apply universal filter (on clean name or activityId)
  const filters = (universalFilter || '').trim().toLowerCase().split(/\s+/).filter(f => f);
  const finalFilteredP6 = filters.length === 0
    ? filteredP6
    : filteredP6.filter(a => {
        const id = (a.activityId || '').toLowerCase();
        const name = (a.name || '').toLowerCase();
        return filters.every(f => id.includes(f) || name.includes(f));
      });

  // Step 4: Final Aggregation — Grouping by Unique Clean Name
  const activityAggMap = new Map<string, AggregatedActivity>();

  finalFilteredP6.forEach(activity => {
    const cleanName = stripBlockPrefix(activity.name || '');
    if (!cleanName) return;
    const key = cleanName.toLowerCase();
    const existing = activityAggMap.get(key);

    const bl4Start = (activity as any).baseline4StartDate;
    const bl4Finish = (activity as any).baseline4FinishDate;
    const baseStart = bl4Start || activity.baseline3StartDate || activity.baseline2StartDate || activity.baseline1StartDate || activity.baselineStartDate;
    const baseFinish = bl4Finish || activity.baseline3FinishDate || activity.baseline2FinishDate || activity.baseline1FinishDate || activity.baselineFinishDate;
    const actStart = activity.actualStartDate || '';
    const actFinish = activity.actualFinishDate || '';
    const fcstFinish = activity.forecastFinishDate || '';

    if (existing) {
      // Update dates only
      if (baseStart && (!existing.basePlanStart || baseStart < existing.basePlanStart)) existing.basePlanStart = baseStart;
      if (baseFinish && (!existing.basePlanFinish || baseFinish > existing.basePlanFinish)) existing.basePlanFinish = baseFinish;
      if (actStart && (!existing.actualStart || actStart < existing.actualStart)) existing.actualStart = actStart;
      if (actFinish && (!existing.actualFinish || actFinish > existing.actualFinish)) existing.actualFinish = actFinish;
      if (fcstFinish && (!existing.forecastFinish || fcstFinish > existing.forecastFinish)) existing.forecastFinish = fcstFinish;

      // FALLBACK: If no entry existed in the sheet map, we continue summing from P6
      if (!dpQtyAggMap.has(key)) {
        existing.totalScope += parseFloat(String(activity.targetQty || 0));
        existing.completed += parseFloat(String(activity.actualQty || 0));
        existing.balance += parseFloat(String(activity.remainingQty || 0));
      }
    } else {
      // First time seeing this Clean Name
      const dpStats = dpQtyAggMap.get(key);
      const mpStats = mpAggMap.get(key);

      activityAggMap.set(key, {
        name: cleanName,
        uom: activity.unitOfMeasure || '',
        totalScope: dpStats ? dpStats.scope : parseFloat(String(activity.targetQty || 0)),
        completed: dpStats ? dpStats.comp : parseFloat(String(activity.actualQty || 0)),
        balance: dpStats ? dpStats.bal : parseFloat(String(activity.remainingQty || 0)),
        percentStatus: 0,
        mpScope: mpStats ? mpStats.scope : 0,
        mpActual: mpStats ? mpStats.comp : 0,
        mpBalance: mpStats ? mpStats.bal : 0,
        basePlanStart: baseStart || '',
        basePlanFinish: baseFinish || '',
        actualStart: actStart || '',
        actualFinish: actFinish || '',
        forecastFinish: fcstFinish || '',
      });
    }
  });

  // Step 5: Recalculate percent for aggregated values
  activityAggMap.forEach(agg => {
    agg.percentStatus = agg.totalScope > 0
      ? Math.round((agg.completed / agg.totalScope) * 100)
      : 0;
  });

  // Step 6: Build Rows by Category
  const rows: string[][] = [];
  const categoryRowIndices: number[] = [];
  const usedKeys = new Set<string>();

  SOLAR_SUMMARY_CATEGORIES.forEach(category => {
    const matchedActivities: AggregatedActivity[] = [];
    category.activities.forEach(pattern => {
      const patternLower = pattern.toLowerCase().trim();
      activityAggMap.forEach((agg, key) => {
        if (usedKeys.has(key)) return;
        if (key.includes(patternLower) || patternLower.includes(key)) {
          matchedActivities.push(agg);
          usedKeys.add(key);
        }
      });
    });

    if (matchedActivities.length > 0) {
      // Calculate category-level sums and date ranges
      const catScope = matchedActivities.reduce((acc, a) => acc + a.totalScope, 0);
      const catComp = matchedActivities.reduce((acc, a) => acc + a.completed, 0);
      const catBal = matchedActivities.reduce((acc, a) => acc + a.balance, 0);
      const catMPTotal = matchedActivities.reduce((acc, a) => acc + a.mpScope, 0);
      const catMPActual = matchedActivities.reduce((acc, a) => acc + a.mpActual, 0);
      const catMPBal = matchedActivities.reduce((acc, a) => acc + a.mpBalance, 0);
      const catPercent = catScope > 0 ? Math.round((catComp / catScope) * 100) : 0;

      const catBaseStart = matchedActivities.map(a => a.basePlanStart).filter(Boolean).sort()[0] || '';
      const catBaseFinish = matchedActivities.map(a => a.basePlanFinish).filter(Boolean).sort().reverse()[0] || '';
      const catActStart = matchedActivities.map(a => a.actualStart).filter(Boolean).sort()[0] || '';
      const catActFinish = matchedActivities.map(a => a.actualFinish).filter(Boolean).sort().reverse()[0] || '';
      const catFcstFinish = matchedActivities.map(a => a.forecastFinish).filter(Boolean).sort().reverse()[0] || '';
      
      const catForecastCompletion = (catActFinish && catComp >= catScope) ? 'Completed' : (formatDt(catFcstFinish) || '-');

      // Category Row
      categoryRowIndices.push(rows.length);
      rows.push([
        '', 
        category.name, 
        '', 
        String(catScope ?? '0'), 
        String(catComp ?? '0'), 
        String(catBal ?? '0'), 
        `${catPercent}%`, 
        String(catMPTotal ?? '0'), 
        String(catMPActual ?? '0'), 
        String(catMPBal ?? '0'), 
        formatDt(catBaseStart) || '-', 
        formatDt(catBaseFinish) || '-', 
        formatDt(catActStart) || '-', 
        catForecastCompletion
      ]);

      matchedActivities.forEach((agg, idx) => {
        const baselineStart = formatDt(agg.basePlanStart);
        const baselineFinish = formatDt(agg.basePlanFinish);
        const actualStart = formatDt(agg.actualStart);
        const actualFinish = formatDt(agg.actualFinish);
        const forecastDt = formatDt(agg.forecastFinish);
        const forecastCompletionDate = actualFinish ? 'Completed' : (forecastDt || '-');

        rows.push([
          String(idx + 1),
          agg.name,
          agg.uom,
          String(agg.totalScope ?? '0'),
          String(agg.completed ?? '0'),
          String(agg.balance ?? '0'),
          `${agg.percentStatus}%`,
          String(agg.mpScope ?? '0'),
          String(agg.mpActual ?? '0'),
          String(agg.mpBalance ?? '0'),
          baselineStart || '-',
          baselineFinish || '-',
          actualStart || '-',
          forecastCompletionDate,
        ]);
      });
    }
  });

  // Step 7: "OTHER" Section
  const remainingActivities: AggregatedActivity[] = [];
  activityAggMap.forEach((agg, key) => {
    if (!usedKeys.has(key)) remainingActivities.push(agg);
  });

  if (remainingActivities.length > 0) {
    const catScope = remainingActivities.reduce((acc, a) => acc + a.totalScope, 0);
    const catComp = remainingActivities.reduce((acc, a) => acc + a.completed, 0);
    const catBal = remainingActivities.reduce((acc, a) => acc + a.balance, 0);
    const catMPTotal = remainingActivities.reduce((acc, a) => acc + a.mpScope, 0);
    const catMPActual = remainingActivities.reduce((acc, a) => acc + a.mpActual, 0);
    const catMPBal = remainingActivities.reduce((acc, a) => acc + a.mpBalance, 0);
    const catPercent = catScope > 0 ? Math.round((catComp / catScope) * 100) : 0;

    const catBaseStart = remainingActivities.map(a => a.basePlanStart).filter(Boolean).sort()[0] || '';
    const catBaseFinish = remainingActivities.map(a => a.basePlanFinish).filter(Boolean).sort().reverse()[0] || '';
    const catActStart = remainingActivities.map(a => a.actualStart).filter(Boolean).sort()[0] || '';
    const catActFinish = remainingActivities.map(a => a.actualFinish).filter(Boolean).sort().reverse()[0] || '';
    const catFcstFinish = remainingActivities.map(a => a.forecastFinish).filter(Boolean).sort().reverse()[0] || '';
    
    const catForecastCompletion = (catActFinish && catComp >= catScope) ? 'Completed' : (formatDt(catFcstFinish) || '-');

    categoryRowIndices.push(rows.length);
    rows.push([
      '', 
      'OTHER', 
      '', 
      String(catScope ?? '0'), 
      String(catComp ?? '0'), 
      String(catBal ?? '0'), 
      `${catPercent}%`, 
      String(catMPTotal ?? '0'), 
      String(catMPActual ?? '0'), 
      String(catMPBal ?? '0'), 
      formatDt(catBaseStart) || '-', 
      formatDt(catBaseFinish) || '-', 
      formatDt(catActStart) || '-', 
      catForecastCompletion
    ]);

    remainingActivities.forEach((agg, idx) => {
      const baselineStart = formatDt(agg.basePlanStart);
      const baselineFinish = formatDt(agg.basePlanFinish);
      const actualStart = formatDt(agg.actualStart);
      const actualFinish = formatDt(agg.actualFinish);
      const forecastDt = formatDt(agg.forecastFinish);
      const forecastCompletionDate = actualFinish ? 'Completed' : (forecastDt || '-');

      rows.push([
        String(idx + 1),
        agg.name,
        agg.uom,
        String(agg.totalScope ?? '0'),
        String(agg.completed ?? '0'),
        String(agg.balance ?? '0'),
        `${agg.percentStatus}%`,
        String(agg.mpScope ?? '0'),
        String(agg.mpActual ?? '0'),
        String(agg.mpBalance ?? '0'),
        baselineStart || '-',
        baselineFinish || '-',
        actualStart || '-',
        forecastCompletionDate,
      ]);
    });
  }

  return { rows, categoryRowIndices };
};

// ============================================================================
// COMPONENT
// ============================================================================

const EMPTY_ARRAY: any[] = [];

export const DPRSummarySection: React.FC<DPRSummarySectionProps> = ({
  p6Activities = EMPTY_ARRAY,
  dpQtyData = EMPTY_ARRAY,
  dpBlockData = EMPTY_ARRAY,
  dpVendorBlockData = EMPTY_ARRAY,
  dpVendorIdtData = EMPTY_ARRAY,
  manpowerDetailsData = EMPTY_ARRAY,
  resourceData = EMPTY_ARRAY,
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

  // Aggregate and group CC activities
  const { mainActivityData, rowStyles } = useMemo(() => {
    const { rows, categoryRowIndices } = aggregateAndGroupCCActivities(
      p6Activities,
      dpQtyData,
      manpowerDetailsData,
      selectedBlock,
      universalFilter,
    );

    const styles: Record<number, any> = {};
    categoryRowIndices.forEach(index => {
      styles[index] = { 
        isCategoryRow: true,
        backgroundColor: '#FADFAD', // Matching Vendor Block/IDT orange theme
        fontWeight: 'bold',
        color: '#0f172a', 
        fontSize: '13px'
      };
    });

    return { mainActivityData: rows, rowStyles: styles };
  }, [p6Activities, dpQtyData, manpowerDetailsData, selectedBlock, universalFilter]);

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

  // Column definitions
  const columns = useMemo(() => [
    "S.No", "Description", "UOM",
    "Material Scope", "Material Completed", "Material Balance", "% Comp",
    "Manpower Scope", "Manpower Completed", "Manpower Balance",
    "Baseline Start", "Baseline Finish", "Actual Start", "Forecast Completion Date"
  ], []);

  const columnTypes = useMemo(() => ({
    "S.No": "text", "Description": "text", "UOM": "text",
    "Material Scope": "number", "Material Completed": "number", "Material Balance": "number", "% Comp": "text",
    "Manpower Scope": "number", "Manpower Completed": "number", "Manpower Balance": "number",
    "Baseline Start": "text", "Baseline Finish": "text", "Actual Start": "text", "Forecast Completion Date": "text"
  }), []);

  const columnWidths = useMemo(() => ({
    "S.No": 50, "Description": 280, "UOM": 60,
    "Material Scope": 80, "Material Completed": 95, "Material Balance": 80, "% Comp": 70,
    "Manpower Scope": 80, "Manpower Completed": 95, "Manpower Balance": 80,
    "Baseline Start": 100, "Baseline Finish": 100, "Actual Start": 100, "Forecast Completion Date": 120
  }), []);

  const headerStructure = useMemo(() => [
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
    [
      { label: "Material Scope", colSpan: 1, rowSpan: 1 },
      { label: "Material Completed", colSpan: 1, rowSpan: 1 },
      { label: "Material Balance", colSpan: 1, rowSpan: 1 },
      { label: "% Comp", colSpan: 1, rowSpan: 1 },
      { label: "Manpower Scope", colSpan: 1, rowSpan: 1 },
      { label: "Manpower Completed", colSpan: 1, rowSpan: 1 },
      { label: "Manpower Balance", colSpan: 1, rowSpan: 1 }
    ]
  ], []);

  const commonNoOp = useCallback(() => { }, []);

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
        mainActivityData.length > 0 ? (
          <StyledExcelTable
            title="Solar Summary — CC Activities"
            columns={columns}
            data={mainActivityData}
            onDataChange={commonNoOp}
            onSave={commonNoOp}
            onSubmit={commonNoOp}
            columnTypes={columnTypes}
            columnWidths={columnWidths}
            headerStructure={headerStructure}
            rowStyles={rowStyles}
            isReadOnly={true}
            hideAddRow={true}
            onExportAll={onExportAll}
            onReachEnd={onReachEnd}
            totalRows={undefined}
            disableAutoHeaderColors={true} />
        ) : (
          <div className="text-center py-20 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
            <p className="text-gray-500 font-medium">No matching CC activities found for this project/block.</p>
            <p className="text-gray-400 text-sm mt-1">Please verify if the activities are correctly coded as "CC".</p>
          </div>
        )
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