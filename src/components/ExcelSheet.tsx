import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Download, Palette, Maximize, Minimize } from "lucide-react";
import * as XLSX from "xlsx";
import { motion } from "framer-motion";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { toast } from "sonner";

interface CellData {
  value: string;
  readOnly: boolean;
  columnType?: "text" | "number" | "date" | "dropdown";
  options?: string[];
}

interface ExcelSheetProps {
  title: string;
  columns: string[];
  rows: CellData[][];
  onSubmit?: () => void;
  onSave?: (data: any[][]) => void;
  isReadOnly?: boolean;
  showSubmitButton?: boolean;
  submitButtonText?: string;
  yesterdayDate?: string;
  todayDate?: string;
}

export const ExcelSheet = ({ 
  title, 
  columns, 
  rows: initialRows, 
  onSubmit, 
  onSave,
  isReadOnly = false,
  showSubmitButton = false,
  submitButtonText = "Submit Sheet",
  yesterdayDate,
  todayDate
}: ExcelSheetProps) => {
  const [data, setData] = useState<any[][]>([]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // Theme state - using custom themes
  const [theme, setTheme] = useState<
    "modern-excel" | 
    "htThemeAdaniBlue" | 
    "htThemeEmerald" | 
    "htThemeSunset" | 
    "htThemeOcean" | 
    "htThemeDark" | 
    "htThemeMain" | 
    "htThemeHorizon"
  >("modern-excel");

  // Convert initialRows to data format
  useEffect(() => {
    const convertedData = initialRows.map(row => 
      row.map(cell => cell.value)
    );
    setData(convertedData);
  }, [initialRows]);

  const handleCellChange = (rowIndex: number, colIndex: number, value: string) => {
    if (isReadOnly) return;
    
    const newData = [...data];
    newData[rowIndex] = [...newData[rowIndex]];
    newData[rowIndex][colIndex] = value;
    setData(newData);
  };

  const handleSubmit = () => {
    if (onSubmit) {
      onSubmit();
    } else {
      toast.success("Sheet submitted successfully!", {
        description: "Your data has been sent for review.",
      });
    }
  };

  const handleSave = () => {
    if (onSave) {
      onSave(data);
      toast.success("Sheet saved successfully!");
    }
  };

  const handleExport = () => {
    // Create worksheet data
    const ws_data = [];
    
    // Add headers
    const headers = [...columns];
    ws_data.push(headers);
    
    // Add data rows
    data.forEach(row => {
      ws_data.push([...row]);
    });
    
    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(ws_data);
    
    // Enhance the worksheet with formatting
    // Set column widths
    const colWidths = columns.map((col, index) => {
      // Calculate width based on content length
      let maxWidth = col.length;
      data.forEach(row => {
        if (row[index] && row[index].toString().length > maxWidth) {
          maxWidth = row[index].toString().length;
        }
      });
      return { wch: Math.min(Math.max(maxWidth + 2, 10), 50) }; // Min 10, Max 50
    });
    
    // Apply column widths
    ws['!cols'] = colWidths;
    
    // Add metadata to workbook
    wb.Props = {
      Title: title,
      Subject: `${title} - Adani Workflow`,
      Author: "Adani Workflow System",
      CreatedDate: new Date(),
      Company: "Adani Group",
      Category: "Project Management"
    };
    
    // Add worksheet to workbook with a better name
    XLSX.utils.book_append_sheet(wb, ws, title.substring(0, 31)); // Excel sheet names max 31 chars
    
    // Export to Excel file with a more descriptive name
    const fileName = `${title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}_Adani_Workflow.xlsx`;
    XLSX.writeFile(wb, fileName);
    
    toast.success("Excel file exported successfully!", {
      description: `File: ${fileName}`
    });
  };

  // Handle theme change
  const handleThemeChange = (newTheme: 
    "modern-excel" | 
    "htThemeAdaniBlue" | 
    "htThemeEmerald" | 
    "htThemeSunset" | 
    "htThemeOcean" | 
    "htThemeDark" | 
    "htThemeMain" | 
    "htThemeHorizon"
  ) => {
    setTheme(newTheme);
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  // Add row handler
  const handleAddRow = () => {
    if (isReadOnly) return;
    
    const newRow = Array(columns.length).fill("");
    setData([...data, newRow]);
  };

  // Delete row handler
  const handleDeleteRow = (rowIndex: number) => {
    if (isReadOnly) return;
    
    const newData = [...data];
    newData.splice(rowIndex, 1);
    setData(newData);
  };

  return (
    <motion.div 
      className={`excel-container ${isFullscreen ? 'fixed inset-0 z-50 bg-white' : ''}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Excel Toolbar */}
      <motion.div 
        className={`excel-toolbar ${isFullscreen ? 'bg-gray-100' : 'bg-white'}`}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.1, duration: 0.3 }}
      >
        <div className="flex items-center justify-between px-4 py-2 border-b">
          <motion.h2 
            className="text-sm font-semibold text-gray-700"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.3 }}
          >
            {title}
          </motion.h2>
          <motion.div 
            className="flex items-center space-x-2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.3 }}
          >
            {/* Theme Selector */}
            <div className="flex items-center space-x-1">
              <Palette className="w-4 h-4 text-gray-500" />
              <select 
                value={theme}
                onChange={(e) => handleThemeChange(e.target.value as any)}
                className="text-xs border rounded px-1 py-0.5"
                disabled={isReadOnly}
              >
                <option value="modern-excel">Modern Excel</option>
                <option value="htThemeAdaniBlue">Adani Blue</option>
                <option value="htThemeEmerald">Emerald Green</option>
                <option value="htThemeSunset">Sunset Orange</option>
                <option value="htThemeOcean">Ocean Blue</option>
                <option value="htThemeDark">Dark Theme</option>
                <option value="htThemeMain">Main Theme</option>
                <option value="htThemeHorizon">Horizon Theme</option>
              </select>
            </div>
            
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button 
                size="sm" 
                variant="ghost" 
                className="excel-button"
                onClick={handleExport}
              >
                <Download className="w-4 h-4 mr-1" />
                Export
              </Button>
            </motion.div>
            
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button 
                size="sm" 
                variant="ghost" 
                className="excel-button"
                onClick={toggleFullscreen}
              >
                {isFullscreen ? (
                  <>
                    <Minimize className="w-4 h-4 mr-1" />
                    Exit Fullscreen
                  </>
                ) : (
                  <>
                    <Maximize className="w-4 h-4 mr-1" />
                    Fullscreen
                  </>
                )}
              </Button>
            </motion.div>
            
            {showSubmitButton && !isReadOnly && (
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button 
                  size="sm" 
                  onClick={handleSubmit} 
                  className="excel-save-button bg-blue-600 hover:bg-blue-700"
                >
                  {submitButtonText}
                </Button>
              </motion.div>
            )}
          </motion.div>
        </div>
      </motion.div>

      {/* Fullscreen header when in fullscreen mode */}
      {isFullscreen && (
        <div className="p-4 border-b bg-white">
          <h2 className="text-xl font-bold">{title} - Fullscreen View</h2>
          <p className="text-sm text-muted-foreground">{data.length} rows × {columns.length} columns</p>
        </div>
      )}

      {/* Table */}
      <motion.div 
        className={`excel-grid-wrapper ${theme} ${isFullscreen ? 'h-[calc(100vh-140px)]' : 'max-h-[600px]'}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.3 }}
      >
        <div className="overflow-auto border">
          <Table className="border-collapse">
            <TableHeader className="bg-gray-100 sticky top-0 z-10">
              <TableRow className="hover:bg-gray-100">
                <TableHead className="w-12 text-center font-medium text-gray-700 border-r border-b border-gray-300 bg-gray-100">#</TableHead>
                {columns.map((column, index) => (
                  <TableHead 
                    key={index} 
                    className="min-w-[120px] text-left font-medium text-gray-700 border-r border-b border-gray-300 bg-gray-100 px-2 py-1"
                  >
                    {column}
                  </TableHead>
                ))}
                {!isReadOnly && (
                  <TableHead className="w-8 border-b border-gray-300 bg-gray-100"></TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((row, rowIndex) => (
                <TableRow 
                  key={rowIndex} 
                  className={`${rowIndex % 2 === 0 ? "bg-white" : "bg-gray-50"} hover:bg-blue-50`}
                >
                  <TableCell className="w-12 text-center text-gray-500 text-xs border-r border-t border-gray-300">
                    {rowIndex + 1}
                  </TableCell>
                  {columns.map((_, colIndex) => (
                    <TableCell 
                      key={colIndex} 
                      className="p-0 border-r border-t border-gray-300"
                    >
                      <Input
                        value={row[colIndex] || ""}
                        onChange={(e) => handleCellChange(rowIndex, colIndex, e.target.value)}
                        className="border-0 rounded-none focus-visible:ring-0 focus-visible:ring-offset-0 h-8 px-2 py-1 text-xs"
                        readOnly={isReadOnly}
                      />
                    </TableCell>
                  ))}
                  {!isReadOnly && (
                    <TableCell className="w-8 p-0 border-t border-gray-300">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-full rounded-none text-red-500 hover:text-red-700 hover:bg-red-50"
                        onClick={() => handleDeleteRow(rowIndex)}
                      >
                        ×
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </motion.div>

      {/* Add row button */}
      {!isReadOnly && (
        <div className="border-t bg-gray-50 px-4 py-2">
          <Button 
            size="sm" 
            variant="outline" 
            className="h-8"
            onClick={handleAddRow}
          >
            + Add Row
          </Button>
        </div>
      )}

      {/* Status Bar */}
      <motion.div 
        className="excel-status-bar border-t bg-gray-50 px-4 py-1"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.3 }}
      >
        <div className="flex justify-between items-center w-full">
          <div className="text-xs text-gray-600">
            Ready | {data.length} rows × {columns.length} columns
          </div>
          <div className="text-xs text-gray-600">
            Adani Workflow Excel Sheet
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};