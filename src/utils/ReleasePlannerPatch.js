/**
 * Performance Patch for ReleasePlannerWidget
 * Reduces excessive watchers and console logging
 */

// Import performance utilities
import { debounce, throttle } from "./PerformanceOptimizer.js";

// Constants to avoid magic numbers
const FILTER_DATA_DEBOUNCE = 200;
const FILTER_THROTTLE = 300;
const STAT_FILTER_DEBOUNCE = 150;
const DATA_TYPE_THROTTLE = 500;
const HEADER_DEBOUNCE = 300;
const DRAG_SETUP_THROTTLE = 200;

// Optimized watcher configurations
export const OPTIMIZED_WATCHERS = {
    // Debounced data watcher - only trigger on significant changes
    optimizedFilteredData: {
        handler: debounce(function(newData, oldData) {
            const newLength = newData?.length || 0;
            const oldLength = oldData?.length || 0;
            
            // Only trigger updates if data count changed significantly
            if (Math.abs(newLength - oldLength) > 0) {
                this.$nextTick(() => {
                    this.updateChartFromFiltered();
                    this.setupTableDragListeners();
                });
            }
        }, FILTER_DATA_DEBOUNCE),
        deep: false
    },
    
    // Throttled filter watchers
    optimizedProgramFilter: {
        handler: throttle(function() {
            this.$nextTick(() => {
                this.updateChartFromFiltered();
            });
        }, FILTER_THROTTLE)
    },
    
    optimizedPhaseFilter: {
        handler: throttle(function() {
            this.$nextTick(() => {
                this.updateChartFromFiltered();
            });
        }, FILTER_THROTTLE)
    },
    
    optimizedOrganizationFilter: {
        handler: throttle(function() {
            this.$nextTick(() => {
                this.updateChartFromFiltered();
            });
        }, FILTER_THROTTLE)
    },
    
    // Debounced stat filter
    optimizedStatFilter: {
        handler: debounce(function() {
            this.$nextTick(() => {
                this.updateChartFromFiltered();
            });
        }, STAT_FILTER_DEBOUNCE)
    },
    
    // Throttled data type changes
    optimizedDataType: {
        handler: throttle(function() {
            this.changeActionRefreshKey++;
            this.$nextTick(() => {
                this.updateChartFromFiltered();
                this.setupTableDragListeners();
            });
        }, DATA_TYPE_THROTTLE)
    },
    
    // Debounced header changes
    optimizedTableHeaders: {
        handler: debounce(function() {
            this.$nextTick(() => {
                this.setupTableDragListeners();
            });
        }, HEADER_DEBOUNCE)
    }
};

// Performance-optimized event listener setup
export function setupOptimizedDragListeners(component) {
    // Clear existing listeners first
    document.querySelectorAll(".draggable-table-row").forEach(row => {
        row.removeAttribute("draggable");
        row.style.cursor = "";
        row.classList.remove("draggable-table-row");
        row.title = "";
    });
    
    // Throttled setup to prevent excessive DOM manipulation
    const throttledSetup = throttle(() => {
        const tableElement = document.querySelector(".v-data-table tbody");
        if (!tableElement) return;
        
        const rows = Array.from(tableElement.querySelectorAll("tr"));
        
        // Batch DOM operations for better performance
        requestAnimationFrame(() => {
            rows.forEach((row, index) => {
                const item = component.filteredTableData[index];
                if (item) {
                    row.setAttribute("draggable", "true");
                    row.style.cursor = "grab";
                    row.classList.add("draggable-table-row");
                    row.title = `Drag: ${item.itemNumber || item.number || "N/A"}`;
                    
                    // Use more efficient event handling
                    row.ondragstart = event => component.handleRowDragStart(item, event);
                    row.ondragend = event => component.handleRowDragEnd(event);
                }
            });
        });
    }, 200);
    
    // Call the throttled setup
    throttledSetup();
}

// Optimized chart update function
export function optimizedUpdateChart(component) {
    // Debounce chart updates to prevent excessive re-renders
    const debouncedUpdate = debounce(() => {
        if (component.$refs.lineChart && component.$refs.lineChart.chart) {
            // Use efficient chart update methods
            const chart = component.$refs.lineChart.chart;
            chart.data = component.chartData;
            chart.update("none"); // Skip animations for better performance
        }
    }, 100);
    
    debouncedUpdate();
}

// Memory-efficient console replacement for development
export const devConsole = {
    chart: {
        log: (message, ...args) => {
            if (process.env.NODE_ENV === "development") {
                // Only log chart updates if explicitly enabled
                if (window.DEBUG_CHART_UPDATES) {
                    console.log(`📊 ${message}`, ...args);
                }
            }
        }
    },
    
    table: {
        log: (message, ...args) => {
            if (process.env.NODE_ENV === "development") {
                // Only log table updates if explicitly enabled
                if (window.DEBUG_TABLE_UPDATES) {
                    console.log(`📋 ${message}`, ...args);
                }
            }
        }
    },
    
    performance: {
        time: label => {
            if (process.env.NODE_ENV === "development" && window.DEBUG_PERFORMANCE) {
                console.time(label);
            }
        },
        
        timeEnd: label => {
            if (process.env.NODE_ENV === "development" && window.DEBUG_PERFORMANCE) {
                console.timeEnd(label);
            }
        }
    }
};

// Performance monitoring commands for console
if (process.env.NODE_ENV === "development") {
    window.debugReleasePlanner = {
        enableChartDebug: () => { window.DEBUG_CHART_UPDATES = true; },
        disableChartDebug: () => { window.DEBUG_CHART_UPDATES = false; },
        enableTableDebug: () => { window.DEBUG_TABLE_UPDATES = true; },
        disableTableDebug: () => { window.DEBUG_TABLE_UPDATES = false; },
        enablePerformanceDebug: () => { window.DEBUG_PERFORMANCE = true; },
        disablePerformanceDebug: () => { window.DEBUG_PERFORMANCE = false; },
        
        status: () => {
            console.log("🔍 ReleasePlanner Debug Status:", {
                chartDebug: !!window.DEBUG_CHART_UPDATES,
                tableDebug: !!window.DEBUG_TABLE_UPDATES,
                performanceDebug: !!window.DEBUG_PERFORMANCE
            });
        }
    };
}

export default {
    OPTIMIZED_WATCHERS,
    setupOptimizedDragListeners,
    optimizedUpdateChart,
    devConsole
};
