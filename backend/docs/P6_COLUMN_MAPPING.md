# P6 to DPR Column Mapping - All Tables

## P6 API Fields Synced to Database

| P6 API Field | Database Column | Description |
|--------------|-----------------|-------------|
| `ObjectId` | `object_id` | Activity unique ID |
| `Id` | `activity_id` | Activity code (e.g., `9712-CC-5960`) |
| `Name` | `name` | Activity description |
| `Status` | `status` | `Not Started`, `In Progress`, `Completed` |
| `PercentComplete` | `percent_complete` | 0.00 - 100.00 |
| `PlannedStartDate` | `planned_start_date` | Plan start date |
| `PlannedFinishDate` | `planned_finish_date` | Plan finish date |
| `ActualStartDate` | `actual_start_date` | Actual start |
| `ActualFinishDate` | `actual_finish_date` | Actual finish |
| `BaselineStartDate` | `baseline_start_date` | Forecast start |
| `BaselineFinishDate` | `baseline_finish_date` | Forecast finish |
| `PlannedNonLaborUnits` | `planned_non_labor_units` | **Total Quantity** |
| `ActualNonLaborUnits` | `actual_non_labor_units` | **Actual Quantity** |
| `RemainingNonLaborUnits` | `remaining_non_labor_units` | Balance |
| `PlannedDuration` | `duration` | Planned duration |

---

## Table 1: DP Qty Table

| # | UI Column | P6 Field | Available |
|---|-----------|----------|-----------|
| 1 | Sl. No | Generated | ✅ Auto |
| 2 | Description | `Name` | ✅ P6 |
| 3 | Total Quantity | `PlannedNonLaborUnits` | ✅ P6 |
| 4 | UOM | - | ❌ Manual |
| 5 | Base Plan Start | `PlannedStartDate` | ✅ P6 |
| 6 | Base Plan Finish | `PlannedFinishDate` | ✅ P6 |
| 7 | Forecast Start | `BaselineStartDate` | ✅ P6 |
| 8 | Forecast Finish | `BaselineFinishDate` | ✅ P6 |
| 9 | Actual Start | `ActualStartDate` | ✅ P6 |
| 10 | Actual Finish | `ActualFinishDate` | ✅ P6 |
| 11 | Remarks | - | ❌ Manual |
| 12 | Balance | `RemainingNonLaborUnits` | ✅ P6 |
| 13 | Cumulative | - | ❌ Manual |
| 14 | Yesterday | - | ❌ Manual |
| 15 | Today | - | ❌ Manual |

---

## Table 2: DP Block Table

| # | UI Column | P6 Field | Available |
|---|-----------|----------|-----------|
| 1 | Activity ID | `Id` | ✅ P6 |
| 2 | Activities | `Name` | ✅ P6 |
| 3 | Block Capacity (MWac) | - | ❌ Manual |
| 4 | Phase | - | ❌ Manual |
| 5 | Block | - | ❌ Manual |
| 6 | SPV Number | - | ❌ Manual |
| 7 | Priority | - | ❌ Manual |
| 8 | Scope | - | ❌ Manual |
| 9 | Hold | - | ❌ Manual |
| 10 | Front | - | ❌ Manual |
| 11 | Completed | `PercentComplete` | ✅ P6 |
| 12 | Balance | `RemainingNonLaborUnits` | ✅ P6 |
| 13 | Baseline Start Date | `PlannedStartDate` | ✅ P6 |
| 14 | Baseline End Date | `PlannedFinishDate` | ✅ P6 |
| 15 | Actual Start Date | `ActualStartDate` | ✅ P6 |
| 16 | Actual Finish Date | `ActualFinishDate` | ✅ P6 |
| 17 | Forecast Start Date | `BaselineStartDate` | ✅ P6 |
| 18 | Forecast Finish Date | `BaselineFinishDate` | ✅ P6 |

---

## Table 3: DP Vendor Block Table

| # | UI Column | P6 Field | Available |
|---|-----------|----------|-----------|
| 1 | Activity ID | `Id` | ✅ P6 |
| 2 | Activities | `Name` | ✅ P6 |
| 3 | Plot | - | ❌ Manual |
| 4 | New Block Nom | - | ❌ Manual |
| 5 | Priority | - | ❌ Manual |
| 6 | Baseline Priority | - | ❌ Manual |
| 7 | Contractor Name | - | ❌ Manual |
| 8 | Scope | - | ❌ Manual |
| 9 | Hold Due To WTG | - | ❌ Manual |
| 10 | Front | - | ❌ Manual |
| 11 | Actual | `ActualNonLaborUnits` | ✅ P6 |
| 12 | Completion % | `PercentComplete` | ✅ P6 |
| 13 | Remarks | - | ❌ Manual |
| 14 | Yesterday Value | - | ❌ Manual |
| 15 | Today Value | - | ❌ Manual |

---

## Table 4: Manpower Details Table

| # | UI Column | P6 Field | Available |
|---|-----------|----------|-----------|
| 1 | Activity ID | `Id` | ✅ P6 |
| 2 | Sl. No | Generated | ✅ Auto |
| 3 | Block | - | ❌ Manual |
| 4 | Contractor Name | - | ❌ Manual |
| 5 | Activity | `Name` | ✅ P6 |
| 6 | Section | - | ❌ Manual |
| 7 | Yesterday Value | - | ❌ Manual |
| 8 | Today Value | - | ❌ Manual |

---

## Table 5: DP Vendor IDT Table

| # | UI Column | P6 Field | Available |
|---|-----------|----------|-----------|
| 1 | Activity ID | `Id` | ✅ P6 |
| 2 | Activities | `Name` | ✅ P6 |
| 3 | Plot | - | ❌ Manual |
| 4 | New Block Nom | - | ❌ Manual |
| 5 | Baseline Priority | - | ❌ Manual |
| 6 | Scope | - | ❌ Manual |
| 7 | Front | - | ❌ Manual |
| 8 | Priority | - | ❌ Manual |
| 9 | Contractor Name | - | ❌ Manual |
| 10 | Remarks | - | ❌ Manual |
| 11 | Actual | `ActualNonLaborUnits` | ✅ P6 |
| 12 | Completion % | `PercentComplete` | ✅ P6 |
| 13 | Yesterday Value | - | ❌ Manual |
| 14 | Today Value | - | ❌ Manual |

---

## Summary

| Table | Total Columns | From P6 | Manual Entry |
|-------|---------------|---------|--------------|
| DP Qty | 15 | 10 | 5 |
| DP Block | 18 | 10 | 8 |
| DP Vendor Block | 15 | 4 | 11 |
| Manpower Details | 8 | 2 | 6 |
| DP Vendor IDT | 14 | 4 | 10 |

---

## Legend
- ✅ P6 = Available from P6 API
- ❌ Manual = Needs manual entry (not in P6 API)
- ✅ Auto = Auto-generated (row number)
