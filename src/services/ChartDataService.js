/**
 * Chart Data Service - Centralized chart data processing logic for Release Planning components
 * 
 * This service extracts all chart data processing logic from ReleasePlannerWidget to:
 * - Handle date extraction and validation from different data types
 * - Build chart data structures (labels, datasets)
 * - Create Chart.js compatible datasets
 * - Manage unified timelines for multiple data series
 * - Process chart options and configurations
 */

/* eslint-disable no-console */

export class ChartDataService {
    constructor() {
        // Chart color scheme constants
        this.CHART_COLORS = {
            target: {
                border: "#1976d2",
                background: "rgba(25, 118, 210, 0.1)"
            },
            actual: {
                border: "#4caf50", 
                background: "rgba(76, 175, 80, 0.1)"
            }
        };

        // Chart style constants
        this.CHART_STYLES = {
            tension: 0.2,
            pointRadius: 4,
            pointHoverRadius: 6,
            borderWidth: 3
        };
    }

    /**
     * Extract target date from item based on data type
     * @param {Object} item - Data item
     * @param {string} dataType - Current data type (parts, cas, crs)
     * @returns {Date|null} Validated target date or null
     */
    extractTargetDate(item, dataType = "parts") {
        let targetDate = null;
        
        switch (dataType) {
            case "parts":
                targetDate = item.tgtRelease || item.targetReleaseDate;
                break;
            case "cas":
                targetDate = item.targetReleaseDate;
                break;
            case "crs":
                targetDate = item.targetReleaseDate || item.dueDate;
                break;
            default:
                targetDate = item.tgtRelease || item.targetReleaseDate || item.dueDate;
        }
        
        return this.validateDate(targetDate);
    }

    /**
     * Extract actual date from item based on data type
     * @param {Object} item - Data item
     * @param {string} dataType - Current data type (parts, cas, crs)
     * @returns {Date|null} Validated actual date or null
     */
    extractActualDate(item, dataType = "parts") {
        let actualDate = null;
        
        switch (dataType) {
            case "parts":
                actualDate = item.actualRelease || item.actualReleaseDate;
                break;
            case "cas":
                actualDate = item.actualReleaseDate;
                break;
            case "crs":
                actualDate = item.actualCompleteDate || item.actualReleaseDate || item.completedDate;
                // Debug logging for CRS
                if (dataType === "crs") {
                    console.log("🔍 CRS Actual Date Debug:", {
                        itemName: item.crNumber || item.name,
                        actualCompleteDate: item.actualCompleteDate,
                        actualReleaseDate: item.actualReleaseDate,
                        completedDate: item.completedDate,
                        resolvedDate: actualDate
                    });
                }
                break;
            default:
                actualDate = item.actualRelease || item.actualReleaseDate || item.actualCompleteDate || item.completedDate;
        }
        
        return this.validateDate(actualDate);
    }

    /**
     * Validate and parse date string
     * @param {string|Date} dateStr - Date string or Date object to validate
     * @returns {Date|null} Valid date object or null
     */
    validateDate(dateStr) {
        if (!dateStr || dateStr === "N/A" || dateStr === null || dateStr === "") {
            return null;
        }
        
        try {
            const dateObj = new Date(dateStr);
            return !isNaN(dateObj.getTime()) ? dateObj : null;
        } catch (error) {
            console.warn("ChartDataService: Invalid date format:", dateStr);
            return null;
        }
    }

    /**
     * Build chart data from filtered table data
     * @param {Array} filteredData - Filtered table data
     * @param {string} dataType - Current data type
     * @returns {Object} Object with targetDates and actualDates arrays
     */
    buildChartData(filteredData, dataType = "parts") {
        console.log("📊 ChartDataService: Building chart data for", dataType);
        console.log("  - Input data length:", filteredData?.length || 0);

        if (!filteredData || filteredData.length === 0) {
            return { targetDates: [], actualDates: [] };
        }

        const targetDates = [];
        const actualDates = [];
        
        // Process each item to extract dates
        filteredData.forEach(item => {
            const targetDate = this.extractTargetDate(item, dataType);
            const actualDate = this.extractActualDate(item, dataType);
            
            if (targetDate) {
                targetDates.push({
                    date: targetDate,
                    dateString: targetDate.toLocaleDateString(),
                    item
                });
            }
            
            if (actualDate) {
                actualDates.push({
                    date: actualDate,
                    dateString: actualDate.toLocaleDateString(),
                    item
                });
            }
        });

        console.log("  - Target dates found:", targetDates.length);
        console.log("  - Actual dates found:", actualDates.length);

        return { targetDates, actualDates };
    }

    /**
     * Create a unified timeline from multiple date arrays
     * @param {Array} targetDates - Array of target date objects
     * @param {Array} actualDates - Array of actual date objects
     * @returns {Array} Sorted array of unique date strings
     */
    createUnifiedTimeline(targetDates, actualDates) {
        const allDates = new Set();
        
        targetDates.forEach(item => allDates.add(item.dateString));
        actualDates.forEach(item => allDates.add(item.dateString));
        
        const sortedDates = Array.from(allDates).sort((a, b) => new Date(a) - new Date(b));
        
        console.log("📅 ChartDataService: Created unified timeline with", sortedDates.length, "dates");
        return sortedDates;
    }

    /**
     * Create Chart.js dataset for cumulative data
     * @param {Array} dates - Array of date objects with dateString property
     * @param {string} label - Dataset label
     * @param {string} colorType - Color type ('target' or 'actual')
     * @param {Array} unifiedTimeline - Unified timeline array
     * @returns {Object} Chart.js dataset object
     */
    createDataset(dates, label, colorType = "target", unifiedTimeline) {
        // Group releases by date
        const dateGroups = new Map();
        dates.forEach(release => {
            const dateStr = release.dateString;
            dateGroups.set(dateStr, (dateGroups.get(dateStr) || 0) + 1);
        });

        // Create cumulative data using the unified timeline
        const cumulativeData = [];
        let runningTotal = 0;
        unifiedTimeline.forEach(dateStr => {
            if (dateGroups.has(dateStr)) {
                runningTotal += dateGroups.get(dateStr);
            }
            cumulativeData.push(runningTotal);
        });

        const colors = this.CHART_COLORS[colorType] || this.CHART_COLORS.target;

        return {
            label,
            data: cumulativeData,
            borderColor: colors.border,
            backgroundColor: colors.background,
            tension: this.CHART_STYLES.tension,
            fill: false,
            pointRadius: this.CHART_STYLES.pointRadius,
            pointHoverRadius: this.CHART_STYLES.pointHoverRadius,
            borderWidth: this.CHART_STYLES.borderWidth
        };
    }

    /**
     * Get dynamic labels for chart datasets based on data type
     * @param {string} dataType - Current data type (parts, cas, crs)
     * @returns {Object} Object with target and actual labels
     */
    getDataTypeLabels(dataType) {
        const dataTypeLabels = {
            parts: { 
                target: "Target Parts Release", 
                actual: "Actual Parts Released" 
            },
            cas: { 
                target: "Target CAs Release", 
                actual: "Actual CAs Released" 
            },
            crs: { 
                target: "Target CRs Release", 
                actual: "Actual CRs Released" 
            }
        };
        
        return dataTypeLabels[dataType] || { 
            target: "Target Items", 
            actual: "Actual Items" 
        };
    }

    /**
     * Create complete chart data structure for Chart.js
     * @param {Array} filteredData - Filtered table data
     * @param {string} dataType - Current data type
     * @param {Object} options - Chart options
     * @param {boolean} options.showTargetLine - Show target line
     * @param {boolean} options.showActualLine - Show actual line
     * @returns {Object} Complete Chart.js data structure with labels and datasets
     */
    createChartData(filteredData, dataType = "parts", options = {}) {
        const { showTargetLine = true, showActualLine = true } = options;
        
        console.log("🔄 ChartDataService: Creating chart data");
        console.log("  - Data type:", dataType);
        console.log("  - Show target line:", showTargetLine);
        console.log("  - Show actual line:", showActualLine);
        console.log("  - Filtered data length:", filteredData?.length || 0);
        
        if (!filteredData || filteredData.length === 0) {
            console.log("❌ ChartDataService: No filtered data available");
            return { labels: [], datasets: [] };
        }

        // Build chart data using helper methods
        const { targetDates, actualDates } = this.buildChartData(filteredData, dataType);
        
        if (targetDates.length === 0 && actualDates.length === 0) {
            console.log("❌ ChartDataService: No valid release dates found");
            return { labels: [], datasets: [] };
        }

        // Create unified timeline and get labels
        const sortedDates = this.createUnifiedTimeline(targetDates, actualDates);
        const labels = this.getDataTypeLabels(dataType);

        // Build datasets based on visibility options
        const datasets = [];
        
        if (targetDates.length > 0 && showTargetLine) {
            const targetDataset = this.createDataset(
                targetDates, 
                labels.target, 
                "target", 
                sortedDates
            );
            datasets.push(targetDataset);
        }
        
        if (actualDates.length > 0 && showActualLine) {
            const actualDataset = this.createDataset(
                actualDates, 
                labels.actual, 
                "actual", 
                sortedDates
            );
            datasets.push(actualDataset);
        }

        const chartData = { labels: sortedDates, datasets };
        
        const SAMPLE_SIZE = 5;
        console.log("✅ ChartDataService: Chart data created", {
            totalLabels: sortedDates.length,
            datasets: datasets.length,
            sampleLabels: sortedDates.slice(0, SAMPLE_SIZE)
        });

        return chartData;
    }

    /**
     * Get chart legend label based on data type
     * @param {string} dataType - Current data type
     * @returns {string} Chart legend label
     */
    getChartLegendLabel(dataType) {
        const labels = {
            parts: "Actual Parts Released",
            cas: "Actual CAs Released", 
            crs: "Actual CRs Released"
        };
        
        return labels[dataType] || "Actual Items Released";
    }

    /**
     * Create chart options configuration for Chart.js v2
     * @param {string} dataType - Current data type
     * @returns {Object} Chart.js options configuration
     */
    createChartOptions(dataType = "parts") {
        const dataTypeConfig = {
            parts: {
                yAxisTitle: "Cumulative Parts Count",
                tooltipLabel: "total parts"
            },
            cas: {
                yAxisTitle: "Cumulative CAs Count", 
                tooltipLabel: "total CAs"
            },
            crs: {
                yAxisTitle: "Cumulative CRs Count",
                tooltipLabel: "total CRs" 
            }
        };

        const config = dataTypeConfig[dataType] || dataTypeConfig.parts;

        return {
            responsive: true,
            maintainAspectRatio: false,
            layout: {
                padding: {
                    top: 20,
                    bottom: 20,
                    left: 10,
                    right: 10
                }
            },
            scales: {
                xAxes: [{ 
                    display: true,
                    scaleLabel: { 
                        display: true, 
                        labelString: "Release Timeline",
                        fontSize: 14,
                        fontStyle: "bold",
                        fontColor: "#1976d2"
                    },
                    ticks: {
                        maxRotation: 45,
                        minRotation: 0,
                        autoSkip: true,
                        maxTicksLimit: 8,
                        fontSize: 11,
                        fontColor: "#666",
                        padding: 5
                    },
                    gridLines: {
                        color: "rgba(0,0,0,0.1)",
                        lineWidth: 1
                    }
                }],
                yAxes: [{ 
                    display: true,
                    scaleLabel: { 
                        display: true, 
                        labelString: config.yAxisTitle,
                        fontSize: 14,
                        fontStyle: "bold",
                        fontColor: "#1976d2"
                    },
                    ticks: {
                        fontSize: 11,
                        fontColor: "#666",
                        padding: 5,
                        beginAtZero: true,
                        callback(value) {
                            return Math.floor(value);
                        }
                    },
                    gridLines: {
                        color: "rgba(0,0,0,0.1)",
                        lineWidth: 1
                    }
                }]
            },
            legend: { 
                display: false
            },
            tooltips: { 
                mode: "index", 
                intersect: false,
                backgroundColor: "rgba(0,0,0,0.8)",
                titleFontSize: 14,
                titleFontStyle: "bold",
                bodyFontSize: 12,
                cornerRadius: 8,
                displayColors: true,
                callbacks: {
                    title(tooltipItem) {
                        return "Release Date: " + tooltipItem[0].xLabel;
                    },
                    label(tooltipItem) {
                        return `Total Released: ${tooltipItem.yLabel} ${config.tooltipLabel}`;
                    }
                }
            },
            elements: {
                line: {
                    tension: this.CHART_STYLES.tension,
                    borderWidth: this.CHART_STYLES.borderWidth
                },
                point: {
                    radius: this.CHART_STYLES.pointRadius,
                    hoverRadius: this.CHART_STYLES.pointHoverRadius,
                    borderWidth: 2,
                    hoverBorderWidth: 3
                }
            }
        };
    }
}

// Export singleton instance
export const chartDataService = new ChartDataService();
export default chartDataService;
