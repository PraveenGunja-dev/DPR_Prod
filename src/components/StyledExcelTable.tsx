import { useState, useEffect } from "react";
import React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Maximize, Minimize, Save, Search } from "lucide-react";
import { StatusChip } from "./StatusChip";
import "@/index.css";

export const StyledExcelTable = ({
  title,
  columns,
  data,
  onDataChange,
  onSave,
  onSubmit,
  isReadOnly = false,
  hideAddRow = false,
  excludeColumns = [],
  editableColumns = [],
  columnTypes = {},
  columnWidths = {},
  columnTextColors = {}, // New prop for column text colors
  columnFontWeights = {}, // New prop for column font weights
  rowStyles = {}, // New prop for row styles
  headerStructure = [], // New prop for multi-row headers
  status = "draft",
}) => {
  const filteredColumns = columns.filter((c) => !excludeColumns.includes(c));
  const [activeCell, setActiveCell] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [filters, setFilters] = useState({}); // State for column filters
  const [showFilters, setShowFilters] = useState(false); // Toggle filter row visibility

  // Excel Themes
  const excelThemes = {
    light: {
      bg: "#FFFFFF",
      headerBg: "#F3F3F3",
      headerText: "#000",
      text: "#000",
      grid: "#D4D4D4",
      activeBorder: "#217346",
      hoverBg: "#EAF2FB",
      statusBg: "#F4F4F4",
      filterBg: "#E6E6E6",
    },
    dark: {
      bg: "#1E1E1E",
      headerBg: "#2B2B2B",
      headerText: "#E8E8E8",
      text: "#E8E8E8",
      grid: "#3A3A3A",
      activeBorder: "#2EA3F2",
      hoverBg: "#2E3238",
      statusBg: "#252525",
      filterBg: "#333333",
    },
  };

  // Detect system/UI theme
  const [themeMode, setThemeMode] = useState("light");
  const T = themeMode === "dark" ? excelThemes.dark : excelThemes.light;

  useEffect(() => {
    const updateTheme = () => {
      const isDark = document.documentElement.classList.contains("dark");
      setThemeMode(isDark ? "dark" : "light");
    };

    updateTheme();

    const observer = new MutationObserver(updateTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);


  // Filter the data based on active filters
  const filteredData = data.filter(row => {
    return filteredColumns.every(col => {
      const filterValue = filters[col];
      if (!filterValue) return true; // No filter for this column

      const colIndex = columns.indexOf(col);
      const cellValue = row[colIndex]?.toString().toLowerCase() || "";
      return cellValue.includes(filterValue.toLowerCase());
    });
  });

  // Progressive Rendering State
  const [renderCount, setRenderCount] = useState(50);

  // Reset render count when data or filters change
  useEffect(() => {
    setRenderCount(50);
  }, [data, filters]);

  // Incrementally render more rows
  useEffect(() => {
    if (renderCount < filteredData.length) {
      // Use requestAnimationFrame for smoother UI updates
      const animationFrame = requestAnimationFrame(() => {
        setRenderCount(prev => Math.min(prev + 100, filteredData.length));
      });
      return () => cancelAnimationFrame(animationFrame);
    }
  }, [renderCount, filteredData.length]);

  const handleCellChange = (row, col, value) => {
    const cName = columns[col];
    const canEdit = !isReadOnly || editableColumns.includes(cName);
    if (!canEdit) return;

    const updated = [...data];
    updated[row] = [...updated[row]];
    updated[row][col] = value;
    onDataChange(updated);
  };

  const addRow = () => {
    if (isReadOnly) return;
    onDataChange([...data, Array(columns.length).fill("")]);
  };

  const toggleFullscreen = () => setIsFullscreen(!isFullscreen);

  // Handle filter change
  const handleFilterChange = (column, value) => {
    setFilters(prev => ({
      ...prev,
      [column]: value
    }));
  };

  // Clear all filters
  const clearFilters = () => {
    setFilters({});
  };

  // Helper function to clean header labels by removing tags like (p6), (edit), (user), etc.
  // and applying abbreviations for common terms
  const cleanHeaderLabel = (label) => {
    if (typeof label !== 'string') return label;

    // Remove tags first
    let cleanedLabel = label.replace(/\s*\(p6\)|\s*\(edit\)|\s*\(user\)|\s*\(auto\)/gi, '').trim();

    // Apply abbreviations for common terms
    const abbreviations = {
      'Actual Start': 'A.S',
      'Actual Finish': 'A.F',
      'Base Plan Start': 'B.P.S',
      'Base Plan Finish': 'B.P.F',
      'Forecast Start': 'F.S',
      'Forecast Finish': 'F.F',
      'Planned Start': 'P.S',
      'Planned Finish': 'P.F',
      'Baseline Start': 'B.S',
      'Baseline Finish': 'B.F',
      'Total Quantity': 'T.Qty',
      'Completion Percentage': '% Comp',
      'Deviation Plan vs Actual': 'Dev P vs A',
      'Catch Up Plan': 'C.U.Plan',
      'Hold Due to WTG': 'Hold WTG',
      'New Block Nom': 'New Blk',
      'Baseline Priority': 'B.Priority'
    };

    // Apply abbreviations
    Object.keys(abbreviations).forEach(fullTerm => {
      const abbreviation = abbreviations[fullTerm];
      cleanedLabel = cleanedLabel.replace(new RegExp(fullTerm, 'gi'), abbreviation);
    });

    return cleanedLabel;
  };

  // ==========================================
  // EXCEL HEADER STYLE
  // ==========================================
  const excelHeaderStyle = (col, rowIndex = 0) => {
    // Determine header background color based on row index
    let backgroundColor = "#8C9AAF"; // Steel grey for first header row
    if (rowIndex === 1) {
      backgroundColor = "#F6E5D5"; // Peach/off-white for sub-header row
    } else if (rowIndex > 1) {
      backgroundColor = "#8C9AAF"; // Steel grey for additional header rows
    }

    // Apply custom background colors based on column names for DP Qty table
    const colName = typeof col === 'string' ? col : (col.label || '');
    const lowerColName = colName.toLowerCase();
    if (lowerColName.includes("total quantity") || lowerColName.includes("uom") ||
      lowerColName.includes("actual start") || lowerColName.includes("actual finish")) {
      backgroundColor = "#00B050"; // Green for specified columns
    } else if (lowerColName.includes("remarks") || lowerColName.includes("today")) {
      backgroundColor = "#0070C0"; // Blue for Remarks and Today
    } else if (lowerColName.includes("auto") || lowerColName.includes("cumulative") || lowerColName.includes("balance")) {
      backgroundColor = "#FA6868"; // Red for Auto, Cumulative, and Balance
    }

    return {
      backgroundColor,
      color: columnTextColors[col] || T.headerText,
      fontSize: "9px",
      fontWeight: columnFontWeights[col] || "bold",
      padding: "6px 4px",
      textAlign: "center" as const,
      whiteSpace: "nowrap" as const,
      overflow: "hidden" as const,
      textOverflow: "ellipsis" as const,
      height: rowIndex === 1 ? "30px" : "34px", // Sub-header row height: 30px, others: 34px
      minWidth: columnWidths[col] ? `${columnWidths[col]}px` : "100px",
      textTransform: "uppercase" as const,
    };
  };

  // ==========================================
  // EXCEL CELL STYLE
  // ==========================================
  const excelCellStyle = (row, col, colName, type) => {
    const isActive = activeCell?.row === row && activeCell?.col === col;
    const isEvenRow = row % 2 === 0;

    // Get row style if available
    const rowStyle = rowStyles[row] || {};

    // Determine text alignment based on data type and row style
    let textAlign: React.CSSProperties['textAlign'] = "left";
    if (rowStyle.isCategoryRow) {
      textAlign = "left"; // Categories are left-aligned
    } else if (type === "number" || colName.includes("Qty") || colName.includes("Number") || colName.includes("Percentage") || colName.includes("%")) {
      textAlign = "right"; // Numbers and quantity-related columns are right-aligned
    } else if (colName.includes("Status") || colName.includes("Date")) {
      textAlign = "center"; // Status and date columns are center-aligned
    }

    return {
      backgroundColor: rowStyle.backgroundColor || (isEvenRow ? T.bg : themeMode === "dark" ? "#242424" : "#F8FBFF"),
      height: "28px",
      padding: "4px", // Add more padding
      fontSize: "11px",
      justifyContent: "center",
      position: "relative" as const,
      transition: "background 0.1s",
      color: columnTextColors[colName] || rowStyle.color || T.text, // Apply column text color if specified
      textAlign, // Apply text alignment
      fontWeight: rowStyle.isCategoryRow ? "bold" : "normal", // Bold text for category rows
      ...(isActive && {
        outline: `2px solid ${T.activeBorder}`,
        outlineOffset: "-2px",
      }),
      ...(rowStyle.isCategoryRow && {
        backgroundColor: "#808080", // Grey background for category rows
        color: "#FFFFFF", // White text for category rows
      }),
    };
  };

  return (
    <div
      className={`rounded-lg border ${isFullscreen ? "fixed inset-0 z-50" : ""}`}
      style={{
        borderColor: T.grid,
        backgroundColor: T.bg,
      }}
    >
      {/* ======================= HEADER ======================= */}
      {!isFullscreen && (
        <div
          className="flex items-center justify-between p-3 border-b rounded-t-lg"
          style={{ backgroundColor: T.headerBg, borderColor: T.grid }}
        >
          <div className="flex items-center space-x-2">
            <h3
              className="font-semibold text-lg"
              style={{ color: T.headerText }}
            >
              {title}
            </h3>
            <span style={{ color: T.headerText, fontSize: "8px" }}>({filteredData.length} of {data.length} rows)</span>

            {status !== "draft" && <StatusChip status={status} />}
          </div>

          <div className="flex items-center space-x-2">
            {onSave && (
              <Button size="sm" variant="outline" onClick={onSave}>
                <Save className="w-4 h-4 mr-1" />
                Save
              </Button>
            )}

            {!isReadOnly && onSubmit && (
              <Button
                size="sm"
                onClick={() => {
                  if (
                    window.confirm(
                      "Once submitted, editing is not possible. Proceed?"
                    )
                  ) {
                    onSubmit();
                  }
                }}
              >
                Submit
              </Button>
            )}

            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className={showFilters ? "bg-primary/10" : ""}
            >
              <Search className="w-4 h-4 mr-1" />
              Filters
            </Button>

            {showFilters && Object.keys(filters).some(key => filters[key]) && (
              <Button
                size="sm"
                variant="outline"
                onClick={clearFilters}
                className="bg-destructive/10 text-destructive"
              >
                Clear Filters
              </Button>
            )}

            <Button size="sm" variant="outline" onClick={toggleFullscreen}>
              <Maximize className="w-4 h-4 mr-1" />
              Fullscreen
            </Button>
          </div>
        </div>
      )}

      {/* ======================= FULLSCREEN HEADER ======================= */}
      {isFullscreen && (
        <div
          className="flex items-center justify-between p-3 border-b"
          style={{
            backgroundColor: T.headerBg,
            borderColor: T.grid,
          }}
        >
          <div>
            <h2 className="text-xl font-bold" style={{ color: T.headerText }}>
              {title}
            </h2>
            <p style={{ color: T.headerText, fontSize: "8px" }}>
              {filteredData.length} of {data.length} rows × {columns.length} columns
            </p>
          </div>

          <div className="flex space-x-2">
            {onSave && (
              <Button size="sm" variant="outline" onClick={onSave}>
                <Save className="w-4 h-4 mr-1" />
                Save
              </Button>
            )}
            {!isReadOnly && onSubmit && (
              <Button
                size="sm"
                onClick={() => {
                  if (window.confirm("Submit sheet?")) onSubmit();
                }}
              >
                Submit
              </Button>
            )}
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className={showFilters ? "bg-primary/10" : ""}
            >
              <Search className="w-4 h-4 mr-1" />
              Filters
            </Button>

            {showFilters && Object.keys(filters).some(key => filters[key]) && (
              <Button
                size="sm"
                variant="outline"
                onClick={clearFilters}
                className="bg-destructive/10 text-destructive"
              >
                Clear Filters
              </Button>
            )}
            <Button size="sm" variant="outline" onClick={toggleFullscreen}>
              <Minimize className="w-4 h-4 mr-1" />
              Exit
            </Button>
          </div>
        </div>
      )}

      {/* ======================= TABLE ======================= */}
      <div
        className={`overflow-auto ${isFullscreen ? "h-[calc(100vh-120px)]" : "max-h-[600px]"}`}
        style={{
          position: "relative",
        }}
      >
        <table
          className="w-full border-collapse excel-grid"
          style={{
            tableLayout: "fixed",
            border: "2px solid #999999", // Thick solid grey outer borders
            fontSize: "11px",
          }}
        >
          <thead style={{
            position: "sticky",
            top: 0,
            zIndex: 10,
          }}>
            {/* Conditional rendering for header structure */}
            {headerStructure && headerStructure.length > 0 ? (
              <>
                {/* Render multi-row headers if headerStructure is provided */}
                {headerStructure.map((headerRow, rowIndex) => (
                  <tr key={rowIndex}>
                    {headerRow.map((headerCell, cellIndex) => {
                      // Apply special text colors based on header content
                      let textColor = T.headerText;
                      const headerLabel = typeof headerCell === 'string' ? headerCell : headerCell.label;
                      if (headerLabel.includes("Catch Up Plan")) {
                        textColor = "#0000FF"; // Blue for "Catch Up Plan"
                      } else if (headerLabel.includes("% Status")) {
                        textColor = "#008000"; // Green for "% Status"
                      } else if (headerLabel.includes("Deviation Plan vs Actual")) {
                        textColor = "#FF0000"; // Red for "Deviation Plan vs Actual"
                      }

                      return (
                        <th
                          key={cellIndex}
                          style={{
                            ...excelHeaderStyle(headerCell, rowIndex),
                            color: textColor,
                            position: "sticky",
                            top: 0,
                            zIndex: 11,
                            ...(rowIndex === 0 && cellIndex === 0 && {
                              borderLeft: "2px solid #999999", // Thick left border for top-left cell
                              borderTop: "2px solid #999999", // Thick top border for top-left cell
                            }),
                            ...(rowIndex === 0 && cellIndex === headerRow.length - 1 && {
                              borderRight: "2px solid #999999", // Thick right border for top-right cell
                              borderTop: "2px solid #999999", // Thick top border for top-right cell
                            }),
                            ...(rowIndex === headerStructure.length - 1 && cellIndex === 0 && {
                              borderLeft: "2px solid #999999", // Thick left border for bottom-left cell
                              borderBottom: "1px dashed #999999", // Dashed bottom border for bottom-left cell
                            }),
                            ...(rowIndex === headerStructure.length - 1 && cellIndex === headerRow.length - 1 && {
                              borderRight: "2px solid #999999", // Thick right border for bottom-right cell
                              borderBottom: "1px dashed #999999", // Dashed bottom border for bottom-right cell
                            }),
                            ...(rowIndex === 0 && cellIndex > 0 && cellIndex < headerRow.length - 1 && {
                              borderTop: "2px solid #999999", // Thick top border for top middle cells
                            }),
                            ...(rowIndex === headerStructure.length - 1 && cellIndex > 0 && cellIndex < headerRow.length - 1 && {
                              borderBottom: "1px dashed #999999", // Dashed bottom border for bottom middle cells
                              borderTop: "1px dashed #999999", // Dashed top border for bottom middle cells
                            }),
                            ...(cellIndex === 0 && rowIndex > 0 && rowIndex < headerStructure.length - 1 && {
                              borderLeft: "2px solid #999999", // Thick left border for left middle cells
                              borderTop: "1px dashed #999999", // Dashed top border for left middle cells
                              borderBottom: "1px dashed #999999", // Dashed bottom border for left middle cells
                            }),
                            ...(cellIndex === headerRow.length - 1 && rowIndex > 0 && rowIndex < headerStructure.length - 1 && {
                              borderRight: "2px solid #999999", // Thick right border for right middle cells
                              borderTop: "1px dashed #999999", // Dashed top border for right middle cells
                              borderBottom: "1px dashed #999999", // Dashed bottom border for right middle cells
                            }),
                            ...(cellIndex > 0 && cellIndex < headerRow.length - 1 && rowIndex > 0 && rowIndex < headerStructure.length - 1 && {
                              borderTop: "1px dashed #999999",
                              borderRight: "1px dashed #999999",
                              borderBottom: "1px dashed #999999",
                              borderLeft: "1px dashed #999999",
                            }),
                          }}
                          colSpan={headerCell.colSpan || 1}
                        >
                          <span>{cleanHeaderLabel(typeof headerCell === 'string' ? headerCell : headerCell.label)}</span>
                        </th>
                      );
                    })}
                  </tr>
                ))}
                {/* Filter row for multi-row headers */}
                {showFilters && headerStructure && headerStructure.length > 0 && (
                  <tr>
                    {filteredColumns.map((col, i) => (
                      <th
                        key={`filter-multi-${i}`}
                        style={{
                          backgroundColor: T.filterBg,
                          padding: "4px",
                          position: "sticky",
                          top: 0,
                          zIndex: 11,
                          ...(i === 0 && {
                            borderLeft: "2px solid #999999",
                            borderBottom: "1px dashed #999999",
                          }),
                          ...(i === filteredColumns.length - 1 && {
                            borderRight: "2px solid #999999",
                            borderBottom: "1px dashed #999999",
                          }),
                          ...(i > 0 && i < filteredColumns.length - 1 && {
                            borderBottom: "1px dashed #999999",
                            borderLeft: "1px dashed #999999",
                            borderRight: "1px dashed #999999",
                          }),
                        }}
                      >
                        <Input
                          type="text"
                          placeholder={`Filter ${cleanHeaderLabel(col)}`}
                          value={filters[col] || ""}
                          onChange={(e) => handleFilterChange(col, e.target.value)}
                          className="w-full h-6 text-xs px-1 py-0"
                          style={{
                            backgroundColor: themeMode === "dark" ? "#444" : "#FFF",
                            border: "1px solid #999",
                          }}
                        />
                      </th>
                    ))}
                  </tr>
                )}
              </>
            ) : (
              <>
                {/* Render single-row headers if no headerStructure is provided */}
                <tr>
                  {filteredColumns.map((col, i) => {
                    // Apply special text colors based on column name
                    let textColor = T.headerText;
                    if (col.includes("Catch Up Plan")) {
                      textColor = "#0000FF"; // Blue for "Catch Up Plan"
                    } else if (col.includes("% Status")) {
                      textColor = "#008000"; // Green for "% Status"
                    } else if (col.includes("Deviation Plan vs Actual")) {
                      textColor = "#FF0000"; // Red for "Deviation Plan vs Actual"
                    }

                    return (
                      <th
                        key={i}
                        style={{
                          ...excelHeaderStyle(col),
                          color: textColor,
                          position: "sticky",
                          top: 0,
                          zIndex: 11,
                          ...(i === 0 && {
                            borderLeft: "2px solid #999999", // Thick left border for first cell
                            borderTop: "2px solid #999999", // Thick top border for first cell
                            borderBottom: "1px dashed #999999", // Dashed bottom border for first cell
                          }),
                          ...(i === filteredColumns.length - 1 && {
                            borderRight: "2px solid #999999", // Thick right border for last cell
                            borderTop: "2px solid #999999", // Thick top border for last cell
                            borderBottom: "1px dashed #999999", // Dashed bottom border for last cell
                          }),
                          ...(i > 0 && i < filteredColumns.length - 1 && {
                            borderTop: "2px solid #999999", // Thick top border for middle cells
                            borderBottom: "1px dashed #999999", // Dashed bottom border for middle cells
                            borderLeft: "1px dashed #999999", // Dashed left border for middle cells
                            borderRight: "1px dashed #999999", // Dashed right border for middle cells
                          }),
                        }}
                      >
                        <span>{cleanHeaderLabel(col)}</span>
                      </th>
                    );
                  })}
                </tr>
                {/* Filter row for single-row headers */}
                {showFilters && (
                  <tr>
                    {filteredColumns.map((col, i) => (
                      <th
                        key={`filter-${i}`}
                        style={{
                          backgroundColor: T.filterBg,
                          padding: "4px",
                          position: "sticky",
                          top: 0,
                          zIndex: 11,
                          ...(i === 0 && {
                            borderLeft: "2px solid #999999",
                            borderBottom: "1px dashed #999999",
                          }),
                          ...(i === filteredColumns.length - 1 && {
                            borderRight: "2px solid #999999",
                            borderBottom: "1px dashed #999999",
                          }),
                          ...(i > 0 && i < filteredColumns.length - 1 && {
                            borderBottom: "1px dashed #999999",
                            borderLeft: "1px dashed #999999",
                            borderRight: "1px dashed #999999",
                          }),
                        }}
                      >
                        <Input
                          type="text"
                          placeholder={`Filter ${cleanHeaderLabel(col)}`}
                          value={filters[col] || ""}
                          onChange={(e) => handleFilterChange(col, e.target.value)}
                          className="w-full h-6 text-xs px-1 py-0"
                          style={{
                            backgroundColor: themeMode === "dark" ? "#444" : "#FFF",
                            border: "1px solid #999",
                          }}
                        />
                      </th>
                    ))}
                  </tr>
                )}
              </>
            )}
          </thead>

          <tbody>
            {filteredData.slice(0, renderCount).map((row, r) => (
              <tr key={r}>
                {filteredColumns.map((colName, i) => {
                  const col = columns.indexOf(colName);
                  const value = row[col];
                  const type = columnTypes[colName] || "text";

                  // Get row style if available
                  const rowStyle = rowStyles[r] || {};

                  // Determine text alignment based on data type and row style
                  let textAlign: React.CSSProperties['textAlign'] = "left";
                  if (rowStyle.isCategoryRow) {
                    textAlign = "left"; // Categories are left-aligned
                  } else if (type === "number" || colName.includes("Qty") || colName.includes("Number") || colName.includes("Percentage") || colName.includes("%")) {
                    textAlign = "right"; // Numbers and quantity-related columns are right-aligned
                  } else if (colName.includes("Status") || colName.includes("Date")) {
                    textAlign = "center"; // Status and date columns are center-aligned
                  }

                  return (
                    <td
                      key={i}
                      style={
                        type === "date" ?
                          {
                            ...excelCellStyle(r, col, colName, type),
                            position: "relative",
                            // Apply Excel-style borders for data cells
                            ...(r === 0 && i === 0 && {
                              borderLeft: "2px solid #999999", // Thick left border for top-left cell
                              borderTop: "1px dashed #999999", // Dashed top border for top-left cell
                            }),
                            ...(r === 0 && i === filteredColumns.length - 1 && {
                              borderRight: "2px solid #999999", // Thick right border for top-right cell
                              borderTop: "1px dashed #999999", // Dashed top border for top-right cell
                            }),
                            ...(r === data.length - 1 && i === 0 && {
                              borderLeft: "2px solid #999999", // Thick left border for bottom-left cell
                              borderBottom: "2px solid #999999", // Thick bottom border for bottom-left cell
                            }),
                            ...(r === data.length - 1 && i === filteredColumns.length - 1 && {
                              borderRight: "2px solid #999999", // Thick right border for bottom-right cell
                              borderBottom: "2px solid #999999", // Thick bottom border for bottom-right cell
                            }),
                            ...(r === 0 && i > 0 && i < filteredColumns.length - 1 && {
                              borderTop: "1px dashed #999999", // Dashed top border for top middle cells
                              borderBottom: "1px dashed #999999", // Dashed bottom border for top middle cells
                              borderLeft: "1px dashed #999999", // Dashed left border for top middle cells
                              borderRight: "1px dashed #999999", // Dashed right border for top middle cells
                            }),
                            ...(r === data.length - 1 && i > 0 && i < filteredColumns.length - 1 && {
                              borderBottom: "2px solid #999999", // Thick bottom border for bottom middle cells
                              borderTop: "1px dashed #999999", // Dashed top border for bottom middle cells
                              borderLeft: "1px dashed #999999", // Dashed left border for bottom middle cells
                              borderRight: "1px dashed #999999", // Dashed right border for bottom middle cells
                            }),
                            ...(i === 0 && r > 0 && r < data.length - 1 && {
                              borderLeft: "2px solid #999999", // Thick left border for left middle cells
                              borderTop: "1px dashed #999999", // Dashed top border for left middle cells
                              borderBottom: "1px dashed #999999", // Dashed bottom border for left middle cells
                            }),
                            ...(i === filteredColumns.length - 1 && r > 0 && r < data.length - 1 && {
                              borderRight: "2px solid #999999", // Thick right border for right middle cells
                              borderTop: "1px dashed #999999", // Dashed top border for right middle cells
                              borderBottom: "1px dashed #999999", // Dashed bottom border for right middle cells
                            }),
                            ...(r > 0 && r < data.length - 1 && i > 0 && i < filteredColumns.length - 1 && {
                              border: "1px dashed #999999", // Dashed borders for middle cells
                            }),
                          } :
                          {
                            ...excelCellStyle(r, col, colName, type),
                            // Apply Excel-style borders for data cells
                            ...(r === 0 && i === 0 && {
                              borderLeft: "2px solid #999999", // Thick left border for top-left cell
                              borderTop: "1px dashed #999999", // Dashed top border for top-left cell
                            }),
                            ...(r === 0 && i === filteredColumns.length - 1 && {
                              borderRight: "2px solid #999999", // Thick right border for top-right cell
                              borderTop: "1px dashed #999999", // Dashed top border for top-right cell
                            }),
                            ...(r === data.length - 1 && i === 0 && {
                              borderLeft: "2px solid #999999", // Thick left border for bottom-left cell
                              borderBottom: "2px solid #999999", // Thick bottom border for bottom-left cell
                            }),
                            ...(r === data.length - 1 && i === filteredColumns.length - 1 && {
                              borderRight: "2px solid #999999", // Thick right border for bottom-right cell
                              borderBottom: "2px solid #999999", // Thick bottom border for bottom-right cell
                            }),
                            ...(r === 0 && i > 0 && i < filteredColumns.length - 1 && {
                              borderTop: "1px dashed #999999", // Dashed top border for top middle cells
                              borderBottom: "1px dashed #999999", // Dashed bottom border for top middle cells
                              borderLeft: "1px dashed #999999", // Dashed left border for top middle cells
                              borderRight: "1px dashed #999999", // Dashed right border for top middle cells
                            }),
                            ...(r === data.length - 1 && i > 0 && i < filteredColumns.length - 1 && {
                              borderBottom: "2px solid #999999", // Thick bottom border for bottom middle cells
                              borderTop: "1px dashed #999999", // Dashed top border for bottom middle cells
                              borderLeft: "1px dashed #999999", // Dashed left border for bottom middle cells
                              borderRight: "1px dashed #999999", // Dashed right border for bottom middle cells
                            }),
                            ...(i === 0 && r > 0 && r < data.length - 1 && {
                              borderLeft: "2px solid #999999", // Thick left border for left middle cells
                              borderTop: "1px dashed #999999", // Dashed top border for left middle cells
                              borderBottom: "1px dashed #999999", // Dashed bottom border for left middle cells
                            }),
                            ...(i === filteredColumns.length - 1 && r > 0 && r < data.length - 1 && {
                              borderRight: "2px solid #999999", // Thick right border for right middle cells
                              borderTop: "1px dashed #999999", // Dashed top border for right middle cells
                              borderBottom: "1px dashed #999999", // Dashed bottom border for right middle cells
                            }),
                            ...(r > 0 && r < data.length - 1 && i > 0 && i < filteredColumns.length - 1 && {
                              border: "1px dashed #999999", // Dashed borders for middle cells
                            }),
                          }
                      }
                      onClick={() => setActiveCell({ row: r, col })}
                    >
                      <Input
                        type={type}
                        value={value || ""}
                        readOnly={isReadOnly && !editableColumns.includes(colName)}
                        onChange={(e) => {
                          // Prevent negative values for number inputs
                          if (type === "number") {
                            const inputValue = e.target.value;
                            // Allow empty value or positive numbers only
                            if (inputValue === "" || (/^\d*\.?\d*$/.test(inputValue) && parseFloat(inputValue) >= 0)) {
                              handleCellChange(r, col, inputValue);
                            }
                            return;
                          }
                          handleCellChange(r, col, e.target.value);
                        }}
                        className="w-full h-full px-1 border-none focus-visible:ring-0 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]"
                        style={
                          type === "date" ?
                            {
                              background: "transparent",
                              fontSize: "8px",
                              color: columnTextColors[colName] || T.text,
                              fontWeight: columnFontWeights[colName] || "normal",
                              textAlign: "center",
                              padding: "0",
                              margin: "0",
                              border: "none",
                              width: "100%",
                              height: "100%",
                              boxSizing: "border-box",
                              position: "relative",
                              zIndex: "1",
                              cursor: "pointer",
                            } :
                            {
                              background: "transparent",
                              fontSize: "8px",
                              color: columnTextColors[colName] || T.text,
                              fontWeight: columnFontWeights[colName] || "normal",
                              textAlign: "center", // Align text in input to match cell
                            }
                        }
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ======================= STATUS BAR ======================= */}
      {!isFullscreen && (
        <div
          className="flex justify-between px-3 py-1 text-xs border-t"
          style={{
            backgroundColor: T.statusBg,
            borderColor: T.grid,
            color: T.headerText,
          }}
        >
          <div style={{ fontSize: "8px" }}>
            Ready | {filteredData.length} of {data.length} rows × {columns.length} columns
          </div>
          <div style={{ fontSize: "10px" }}>Excel Style Sheet</div>
        </div>
      )}
    </div>
  );
};