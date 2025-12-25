import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Maximize, Minimize, Save } from "lucide-react";
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
  status = "draft",
}) => {
  const filteredColumns = columns.filter((c) => !excludeColumns.includes(c));
  const [activeCell, setActiveCell] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

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

  // Get column width based on column name and table type
  const getColumnWidth = (colName) => {
    // Check if custom width is provided
    if (columnWidths[colName]) {
      return columnWidths[colName];
    }

    // Special handling for DP Vendor IDT table
    const isDpVendorIdt = title && title.toLowerCase().includes('dp') && title.toLowerCase().includes('vendor') && title.toLowerCase().includes('idt');
    
    if (isDpVendorIdt) {
      // Specific widths for DP Vendor IDT table
      const lowerColName = colName.toLowerCase();
      
      // Wider columns
      if (lowerColName.includes('activity') && lowerColName.includes('id')) {
        return 180; // Increased for Activity ID
      }
      if (lowerColName.includes('activities') || lowerColName.includes('description') || lowerColName.includes('desc')) {
        return 200;
      }
      
      // Narrower columns
      if (lowerColName.includes('plot')) {
        return 80;  // Decreased for Plot
      }
      if (lowerColName.includes('priority')) {
        return 70;  // Decreased for Priority
      }
      if (lowerColName.includes('scope')) {
        return 70;  // Decreased for Scope
      }
      if (lowerColName.includes('front')) {
        return 70;  // Decreased for Front
      }
      
      // Standard columns
      if (lowerColName.includes('uom') || lowerColName.includes('unit')) {
        return 70;
      }
      if (lowerColName.includes('qty') || lowerColName.includes('quantity') || lowerColName.includes('balance') || lowerColName.includes('deviation')) {
        return 90;
      }
      if (lowerColName.includes('status') || lowerColName.includes('remarks') || lowerColName.includes('remark')) {
        return 120;
      }
      if (lowerColName.includes('sl') || lowerColName.includes('no') || lowerColName.includes('id')) {
        return 60;
      }
    }

    // Default widths based on column content type (reduced sizes)
    const lowerColName = colName.toLowerCase();
    
    if (lowerColName.includes('description') || lowerColName.includes('desc') || lowerColName.includes('activity')) {
      return 150; // Reduced from 200
    }
    if (lowerColName.includes('uom') || lowerColName.includes('unit')) {
      return 70;  // Reduced from 90
    }
    if (lowerColName.includes('qty') || lowerColName.includes('quantity') || lowerColName.includes('balance') || lowerColName.includes('deviation')) {
      return 90;  // Reduced from 110
    }
    if (lowerColName.includes('status') || lowerColName.includes('remarks') || lowerColName.includes('remark')) {
      return 120; // Reduced from 160
    }
    if (lowerColName.includes('sl') || lowerColName.includes('no') || lowerColName.includes('id')) {
      return 60;  // Reduced from 80
    }
    
    // Default width - reduced from 120
    return 100;
  };

  // Calculate total table width
  const getTotalTableWidth = () => {
    return filteredColumns.reduce((total, col) => total + getColumnWidth(col), 0);
  };

  // ==========================================
  // EXCEL HEADER STYLE
  // ==========================================
  const excelHeaderStyle = (col) => ({
    backgroundColor: T.headerBg,
    color: T.headerText,
    border: `1px solid ${T.grid}`,
    fontSize: "8px", // Reduced from 12px
    fontWeight: "500" as const,
    padding: "3px 4px", // Reduced padding
    textAlign: "center" as const,
    whiteSpace: "nowrap" as const,
    overflow: "hidden" as const,
    textOverflow: "ellipsis" as const,
    height: "28px", // Reduced from 32px
    width: `${getColumnWidth(col)}px`,
    verticalAlign: "middle" as const,
  });

  // ==========================================
  // EXCEL CELL STYLE
  // ==========================================
  const excelCellStyle = (row, colIndex) => {
    const isActive = activeCell?.row === row && activeCell?.col === colIndex;
    const isEvenRow = row % 2 === 0;
    const colName = filteredColumns[colIndex];

    return {
      border: `1px solid ${T.grid}`,
      backgroundColor: isEvenRow ? T.bg : themeMode === "dark" ? "#242424" : "#F8FBFF",
      height: "26px", // Reduced from 30px
      padding: "0",
      position: "relative" as const,
      transition: "background 0.1s",
      width: `${getColumnWidth(colName)}px`,
      verticalAlign: "middle" as const,
      ...(isActive && {
        outline: `2px solid ${T.activeBorder}`,
        outlineOffset: "-2px",
      }),
    };
  };

  // ==========================================
  // EXCEL INPUT STYLE
  // ==========================================
  const excelInputStyle = {
    width: "100%",
    height: "100%",
    padding: "3px 4px", // Reduced padding
    border: "none",
    outline: "none",
    fontSize: "8px", // Reduced from 11px
    background: "transparent",
    color: T.text,
    fontFamily: "'Adani', 'Calibri', 'Arial', sans-serif",
    boxSizing: "border-box" as const,
    verticalAlign: "middle" as const,
  };

  return (
    <div
      className={`border ${isFullscreen ? "fixed inset-0 z-50" : ""}`}
      style={{
        borderColor: T.grid,
        backgroundColor: T.bg,
      }}
    >
      {/* ======================= HEADER ======================= */}
      {!isFullscreen && (
        <div
          className="flex items-center justify-between p-3 border-b"
          style={{ backgroundColor: T.headerBg, borderColor: T.grid }}
        >
          <div className="flex items-center space-x-2">
            <h3
              className="font-semibold text-lg"
              style={{ color: T.headerText }}
            >
              {title}
            </h3>
            <span style={{ color: T.headerText, fontSize: "12px" }}>({data.length} rows)</span>

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
            <p style={{ color: T.headerText, fontSize: "12px" }}>
              {data.length} rows × {columns.length} columns
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
            <Button size="sm" variant="outline" onClick={toggleFullscreen}>
              <Minimize className="w-4 h-4 mr-1" />
              Exit
            </Button>
          </div>
        </div>
      )}

      {/* ======================= TABLE ======================= */}
      <div
        className={`overflow-auto ${
          isFullscreen ? "h-[calc(100vh-120px)]" : "max-h-[600px]"
        }`}
      >
        <table
          className="border-collapse excel-grid w-full"
          style={{ 
            tableLayout: "fixed"
          }}
        >
          <colgroup>
            {filteredColumns.map((col, i) => (
              <col key={i} style={{ width: `${getColumnWidth(col)}px` }} />
            ))}
          </colgroup>
          <thead>
            <tr>
              {filteredColumns.map((col, i) => (
                <th key={i} style={excelHeaderStyle(col)}>
                  {col}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {data.map((row, r) => (
              <tr key={r}>
                {filteredColumns.map((colName, i) => {
                  const col = columns.indexOf(colName);
                  const value = row[col];
                  const type = columnTypes[colName] || "text";

                  return (
                    <td
                      key={i}
                      style={excelCellStyle(r, i)}
                      onClick={() => setActiveCell({ row: r, col: i })}
                    >
                      {isReadOnly || !editableColumns.includes(colName) ? (
                        <div
                          style={{
                            ...excelInputStyle,
                            padding: "3px 4px",
                            lineHeight: "20px",
                            fontSize: "8px",
                          }}
                        >
                          {value}
                        </div>
                      ) : (
                        <input
                          type={type}
                          value={value || ""}
                          readOnly={isReadOnly && !editableColumns.includes(colName)}
                          onChange={(e) =>
                            handleCellChange(r, col, e.target.value)
                          }
                          style={{...excelInputStyle, fontSize: "8px"}}
                        />
                      )}
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
          <div style={{ fontSize: "10px" }}>
            Ready | {data.length} rows × {columns.length} columns
          </div>
          <div style={{ fontSize: "10px" }}>Excel Style Sheet</div>
        </div>
      )}

      {/* ======================= ADD ROW ======================= */}
      {!hideAddRow && !isReadOnly && (
        <div
          className="p-2 border-t"
          style={{ backgroundColor: T.bg, borderColor: T.grid }}
        >
          <Button size="sm" variant="outline" onClick={addRow}>
            + Add Row
          </Button>
        </div>
      )}
    </div>
  );
};