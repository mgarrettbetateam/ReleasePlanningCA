/**
 * ExportService
 * 
 * Handles data export functionality for tables and reports.
 * Supports multiple export formats including CSV and PDF.
 * 
 * Features:
 * 1. CSV export with proper escaping and formatting
 * 2. PDF export with HTML-based rendering
 * 3. Configurable styling and layout options
 * 4. Error handling and fallback mechanisms
 * 
 * @author Release Planner Team
 * @version 1.0.0
 */

class ExportService {
    constructor() {
        // Default export configuration
        this.defaultConfig = {
            csv: {
                delimiter: ",",
                charset: "utf-8",
                escapeQuotes: true
            },
            pdf: {
                pageSize: "A4",
                orientation: "landscape",
                margin: "15mm",
                fontSize: "10px"
            }
        };
    }

    /**
     * Generate filename with timestamp
     * @param {string} baseName - Base name for the file
     * @param {string} extension - File extension (without dot)
     * @returns {string} Generated filename with timestamp
     */
    generateFileName(baseName = "table-export", extension = "csv") {
        const DATE_FORMAT_LENGTH = 10;
        const timestamp = new Date().toISOString().slice(0, DATE_FORMAT_LENGTH);
        return `${baseName}-${timestamp}.${extension}`;
    }

    /**
     * Export table data in the specified format
     * @param {string} format - Export format ("csv" or "pdf")
     * @param {Array} tableData - Array of table data objects
     * @param {Array} tableHeaders - Array of header configuration objects
     * @param {Object} options - Export options
     */
    exportTableData(format, tableData, tableHeaders, options = {}) {
        const baseName = options.fileName || "table-export";
        const fileName = this.generateFileName(baseName, format);

        if (format === "csv") {
            this.downloadAsCSV(fileName, tableData, tableHeaders, options);
        } else if (format === "pdf") {
            this.exportAsPDF(fileName, tableData, tableHeaders, options);
        } else {
            throw new Error(`Unsupported export format: ${format}`);
        }
    }

    /**
     * Download table data as CSV file
     * @param {string} fileName - Name for the downloaded file
     * @param {Array} tableData - Array of table data objects
     * @param {Array} tableHeaders - Array of header configuration objects
     * @param {Object} options - CSV export options
     */
    downloadAsCSV(fileName, tableData, tableHeaders, options = {}) {
        try {
            const csvContent = this.convertTableToCSV(tableData, tableHeaders, options);
            this.downloadFile(csvContent, fileName, "text/csv;charset=utf-8;");
        } catch (error) {
            console.error("Failed to download CSV:", error);
            // Silently handle error - could add user notification here
        }
    }

    /**
     * Convert table data to CSV format
     * @param {Array} tableData - Array of table data objects
     * @param {Array} tableHeaders - Array of header configuration objects
     * @param {Object} options - CSV formatting options
     * @returns {string} CSV formatted string
     */
    convertTableToCSV(tableData, tableHeaders, options = {}) {
        const config = { ...this.defaultConfig.csv, ...options };
        
        // Create header row
        const headers = tableHeaders.map(header => header.text);
        const csvHeaders = headers.join(config.delimiter);
        
        // Create data rows
        const csvRows = tableData.map(item => {
            return tableHeaders.map(header => {
                let value = item[header.value];
                
                // Handle special cases for CA columns
                if (header.value === "caNumber" || header.value === "caState") {
                    value = value || ""; // Use empty string if no value
                }
                
                // Convert to string and handle null/undefined
                const stringValue = String(value || "");
                
                // Escape quotes if enabled
                if (config.escapeQuotes) {
                    return `"${stringValue.replace(/"/g, '""')}"`;
                }
                
                return stringValue;
            }).join(config.delimiter);
        });
        
        return [csvHeaders, ...csvRows].join("\n");
    }

    /**
     * Export table as PDF
     * @param {string} fileName - Name for the downloaded file
     * @param {Array} tableData - Array of table data objects
     * @param {Array} tableHeaders - Array of header configuration objects
     * @param {Object} options - PDF export options
     */
    exportAsPDF(fileName, tableData, tableHeaders, options = {}) {
        try {
            const htmlContent = this.createTablePDFHTML(tableData, tableHeaders, fileName, options);
            this.downloadPDFContent(htmlContent, fileName);
        } catch (error) {
            console.error("Failed to export PDF:", error);
            // Fallback to browser print
            window.print();
        }
    }

    /**
     * Create PDF HTML content for table
     * @param {Array} tableData - Array of table data objects
     * @param {Array} tableHeaders - Array of header configuration objects
     * @param {string} title - Document title
     * @param {Object} options - PDF styling options
     * @returns {string} HTML content for PDF
     */
    createTablePDFHTML(tableData, tableHeaders, title, options = {}) {
        const config = { ...this.defaultConfig.pdf, ...options };
        
        // Create table headers
        const headers = tableHeaders.map(header => `<th>${this.escapeHtml(header.text)}</th>`).join("");
        
        // Create table rows
        const rows = tableData.map(item => {
            const cells = tableHeaders.map(header => {
                let value = item[header.value] || "";
                
                // Handle special cases for CA columns
                if (header.value === "caNumber" || header.value === "caState") {
                    value = value || "";
                }
                
                return `<td>${this.escapeHtml(String(value))}</td>`;
            }).join("");
            return `<tr>${cells}</tr>`;
        }).join("");

        const documentTitle = options.documentTitle || "Data Table Export";
        const currentDate = new Date().toLocaleDateString();
        
        return `
            <!DOCTYPE html>
            <html>
            <head>
                <title>${this.escapeHtml(title)}</title>
                <meta charset="utf-8">
                <style>
                    @page { 
                        size: ${config.pageSize} ${config.orientation}; 
                        margin: ${config.margin}; 
                    }
                    body { 
                        font-family: Arial, sans-serif; 
                        margin: 0; 
                        font-size: ${config.fontSize};
                    }
                    .header { 
                        text-align: center; 
                        margin-bottom: 20px; 
                    }
                    .header h2 {
                        margin: 0 0 10px 0;
                        color: #333;
                    }
                    .header p {
                        margin: 5px 0;
                        color: #666;
                        font-size: 12px;
                    }
                    table { 
                        width: 100%; 
                        border-collapse: collapse; 
                        font-size: ${config.fontSize};
                    }
                    th, td { 
                        border: 1px solid #ddd; 
                        padding: 6px; 
                        text-align: left; 
                        word-wrap: break-word;
                    }
                    th { 
                        background-color: #f2f2f2; 
                        font-weight: bold; 
                        font-size: 11px;
                    }
                    tr:nth-child(even) { 
                        background-color: #f9f9f9; 
                    }
                    .footer {
                        margin-top: 20px;
                        text-align: center;
                        font-size: 10px;
                        color: #888;
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <h2>${this.escapeHtml(documentTitle)}</h2>
                    <p>Generated on ${currentDate}</p>
                    <p>Total Items: ${tableData.length}</p>
                </div>
                <table>
                    <thead>
                        <tr>${headers}</tr>
                    </thead>
                    <tbody>
                        ${rows}
                    </tbody>
                </table>
                <div class="footer">
                    <p>This document was automatically generated by Release Planning System</p>
                </div>
            </body>
            </html>
        `;
    }

    /**
     * Download PDF content using browser print or fallback
     * @param {string} htmlContent - HTML content for PDF
     * @param {string} fileName - Name for the file
     */
    downloadPDFContent(htmlContent, fileName) {
        try {
            // Try to open in new window and trigger print
            const printWindow = window.open("", "_blank");
            if (printWindow) {
                printWindow.document.write(htmlContent);
                printWindow.document.close();
                
                // Wait for content to load before printing
                const PRINT_DELAY = 500;
                setTimeout(() => {
                    printWindow.print();
                }, PRINT_DELAY);
            } else {
                // Popup blocked, fallback to HTML download
                this.downloadHTMLFallback(htmlContent, fileName);
            }
        } catch (error) {
            console.error("Failed to open print window:", error);
            this.downloadHTMLFallback(htmlContent, fileName);
        }
    }

    /**
     * Fallback method to download HTML content as file
     * @param {string} htmlContent - HTML content
     * @param {string} fileName - Base filename
     */
    downloadHTMLFallback(htmlContent, fileName) {
        try {
            const htmlFileName = fileName.replace(/\.[^/.]+$/, ".html");
            this.downloadFile(htmlContent, htmlFileName, "text/html");
        } catch (error) {
            console.error("Failed to download HTML fallback:", error);
        }
    }

    /**
     * Generic file download method
     * @param {string} content - File content
     * @param {string} fileName - Name for the downloaded file
     * @param {string} mimeType - MIME type for the file
     */
    downloadFile(content, fileName, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        
        try {
            const link = document.createElement("a");
            link.href = url;
            link.download = fileName;
            link.style.display = "none";
            
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } finally {
            // Clean up the object URL
            URL.revokeObjectURL(url);
        }
    }

    /**
     * Escape HTML special characters
     * @param {string} text - Text to escape
     * @returns {string} Escaped text
     */
    escapeHtml(text) {
        if (typeof text !== "string") {
            return String(text || "");
        }
        
        return text
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");
    }

    /**
     * Get supported export formats
     * @returns {Array<string>} Array of supported format names
     */
    getSupportedFormats() {
        return ["csv", "pdf"];
    }

    /**
     * Validate export parameters
     * @param {string} format - Export format
     * @param {Array} tableData - Table data array
     * @param {Array} tableHeaders - Table headers array
     * @returns {Object} Validation result
     */
    validateExportParams(format, tableData, tableHeaders) {
        const errors = [];
        
        if (!this.getSupportedFormats().includes(format)) {
            errors.push(`Unsupported format: ${format}`);
        }
        
        if (!Array.isArray(tableData)) {
            errors.push("Table data must be an array");
        }
        
        if (!Array.isArray(tableHeaders)) {
            errors.push("Table headers must be an array");
        }
        
        if (tableHeaders.length === 0) {
            errors.push("At least one header is required");
        }
        
        return {
            isValid: errors.length === 0,
            errors
        };
    }

    /**
     * Get export statistics
     * @param {Array} tableData - Table data
     * @param {Array} tableHeaders - Table headers
     * @returns {Object} Export statistics
     */
    getExportStats(tableData, tableHeaders) {
        return {
            totalRows: tableData.length,
            totalColumns: tableHeaders.length,
            estimatedSize: {
                csv: this.estimateCSVSize(tableData, tableHeaders),
                pdf: "Variable (depends on content)"
            },
            supportedFormats: this.getSupportedFormats()
        };
    }

    /**
     * Estimate CSV file size
     * @param {Array} tableData - Table data
     * @param {Array} tableHeaders - Table headers
     * @returns {string} Estimated size
     */
    estimateCSVSize(tableData, tableHeaders) {
        if (tableData.length === 0) return "0 KB";
        
        // Constants for size calculations
        const OVERHEAD_MULTIPLIER = 1.2; // 20% overhead for CSV formatting
        const BYTES_PER_KB = 1024;
        const BYTES_PER_MB = BYTES_PER_KB * BYTES_PER_KB;
        
        // Rough estimation based on average row content
        const headerSize = tableHeaders.reduce((sum, h) => sum + h.text.length, 0);
        const avgRowSize = tableData.length > 0 ? 
            Object.values(tableData[0]).reduce((sum, val) => sum + String(val || "").length, 0) : 0;
        
        const totalSize = (headerSize + (avgRowSize * tableData.length)) * OVERHEAD_MULTIPLIER;
        
        if (totalSize < BYTES_PER_KB) return `${Math.round(totalSize)} B`;
        if (totalSize < BYTES_PER_MB) return `${Math.round(totalSize / BYTES_PER_KB)} KB`;
        return `${Math.round(totalSize / BYTES_PER_MB)} MB`;
    }
}

// Create and export singleton instance
const exportService = new ExportService();

export default exportService;
