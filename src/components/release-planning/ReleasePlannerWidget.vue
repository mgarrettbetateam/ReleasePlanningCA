<!-- Release Planning Widget - Self-contained with prominent filter dropdowns -->
 
<template>
    <div class="enhanced-parts-planner">
        <!-- Header with Title (always shown - this is the internal widget header) -->
        <v-card-title class="planner-header">
            <v-icon left color="primary">mdi-clipboard-list</v-icon>
            Release Planning CA Dashboard
            <v-spacer />
            <v-chip 
                color="success" 
                small
                outlined
            >
                <v-icon small left>mdi-cloud</v-icon>
                API Data
            </v-chip>
        </v-card-title>

        <!-- Universal Filter Controls -->
        <UniversalFilterControls
            title="Filter Controls"
            subtitle="Select your criteria to view data"
            :filters="filterConfig"
            :filter-values="filterValues"
            @filter-change="handleFilterChange"
        />

        <!-- Charts and Tables Section -->
        <v-row class="content-section">
            <!-- Line Chart Widget - Full Width -->
            <v-col cols="12">
                <v-card class="chart-card" :loading="loading" elevation="4">
                    <v-card-title class="chart-header">
                        <v-icon left color="primary" size="28">mdi-chart-line</v-icon>
                        <span class="chart-title">CA Completion Timeline</span>
                        <v-spacer />
                        <div class="chart-meta">
                            <v-chip 
                                small 
                                color="primary" 
                                outlined
                                class="mr-2"
                            >
                                <v-icon small left>mdi-chart-bell-curve</v-icon>
                                {{ chartData.datasets?.[0]?.data?.length || 0 }} Points
                            </v-chip>
                            <v-chip 
                                small 
                                color="success" 
                                outlined
                            >
                                <v-icon small left>mdi-calendar-range</v-icon>
                                Live Data
                            </v-chip>
                        </div>
                    </v-card-title>
                    
                    <!-- Custom Chart Legend -->
                    <v-card-subtitle class="chart-legend-section">
                        <div class="legend-container">
                            <div 
                                class="legend-item clickable-legend" 
                                :class="{ 'legend-disabled': !showTargetLine }"
                                @click="toggleTargetLine"
                            >
                                <div class="legend-color-bar target-color" :class="{ 'disabled': !showTargetLine }"></div>
                                <span class="legend-label">Target Completion Timeline</span>
                                <v-icon 
                                    small 
                                    :color="showTargetLine ? 'success' : 'grey'"
                                    class="ml-2"
                                >
                                    {{ showTargetLine ? 'mdi-eye' : 'mdi-eye-off' }}
                                </v-icon>
                            </div>
                            <div 
                                class="legend-item clickable-legend" 
                                :class="{ 'legend-disabled': !showActualLine }"
                                @click="toggleActualLine"
                            >
                                <div class="legend-color-bar actual-color" :class="{ 'disabled': !showActualLine }"></div>
                                <span class="legend-label">Actual Completion Timeline</span>
                                <v-icon 
                                    small 
                                    :color="showActualLine ? 'success' : 'grey'"
                                    class="ml-2"
                                >
                                    {{ showActualLine ? 'mdi-eye' : 'mdi-eye-off' }}
                                </v-icon>
                            </div>
                        </div>
                    </v-card-subtitle>
                    
                    <v-card-text class="chart-content-wrapper">
                        <div class="chart-container">
                            <UniversalChart
                                v-if="chartData.labels && chartData.labels.length > 0"
                                :data="chartData"
                                :options="chartOptions"
                                type="line"
                                :height="360"
                            />
                            <div v-else class="no-chart-data">
                                <div class="no-data-icon">
                                    <v-icon size="64" color="grey lighten-2">mdi-chart-line-variant</v-icon>
                                </div>
                                <h3 class="no-data-title">No Chart Data Available</h3>
                                <p class="no-data-description">
                                    Try adjusting your filter selections to see timeline data
                                </p>
                                <v-btn
                                    color="primary"
                                    outlined
                                    small
                                    @click="refreshData"
                                >
                                    <v-icon small left>mdi-refresh</v-icon>
                                    Refresh Data
                                </v-btn>
                            </div>
                        </div>
                    </v-card-text>
                </v-card>
            </v-col>

            <!-- Release Headliners Section -->
            <v-col cols="12" lg="3">
                <v-card class="headliners-card">
                    <v-card-title class="headliners-header compact-header">
                        <v-icon left color="info" size="20">mdi-star</v-icon>
                        <span class="compact-title">Release Headliners</span>
                        <v-spacer />
                        <div class="headliner-chips">
                            <v-chip 
                                v-if="selectedStatFilter !== 'all'" 
                                x-small 
                                color="primary" 
                                class="mr-1"
                                @click="filterByReleaseStatus('all')"
                            >
                                <v-icon x-small left>mdi-filter-off</v-icon>
                                Clear
                            </v-chip>
                            <v-chip x-small color="info" outlined>
                                {{ filteredTableData.length }} 
                                {{ selectedStatFilter === 'all' ? 'Total' : getFilterDisplayName(selectedStatFilter) }}
                            </v-chip>
                        </div>
                    </v-card-title>
                    
                    <v-card-text class="headliners-content compact-content">
                        <div v-if="releaseStats" class="stats-grid compact-grid">
                            <div 
                                class="stat-item compact-stat" 
                                :class="{ 
                                    'clickable-stat': releaseStats.releasedCount > 0,
                                    'stat-active': selectedStatFilter === 'released',
                                    'stat-disabled': releaseStats.releasedCount === 0
                                }"
                                @click="releaseStats.releasedCount > 0 ? filterByReleaseStatus('released') : null"
                            >
                                <div class="stat-number compact-number">{{ releaseStats.releasedCount }}</div>
                                <div class="stat-label compact-label">Released</div>
                            </div>
                            <div 
                                class="stat-item compact-stat" 
                                :class="{ 
                                    'clickable-stat': releaseStats.thisWeekCount > 0,
                                    'stat-active': selectedStatFilter === 'thisWeek',
                                    'stat-disabled': releaseStats.thisWeekCount === 0
                                }"
                                @click="releaseStats.thisWeekCount > 0 ? filterByReleaseStatus('thisWeek') : null"
                            >
                                <div class="stat-number compact-number">{{ releaseStats.thisWeekCount }}</div>
                                <div class="stat-label compact-label">This Week</div>
                            </div>
                            <div 
                                class="stat-item compact-stat" 
                                :class="{ 
                                    'clickable-stat': releaseStats.nextWeekCount > 0,
                                    'stat-active': selectedStatFilter === 'nextWeek',
                                    'stat-disabled': releaseStats.nextWeekCount === 0
                                }"
                                @click="releaseStats.nextWeekCount > 0 ? filterByReleaseStatus('nextWeek') : null"
                            >
                                <div class="stat-number compact-number">{{ releaseStats.nextWeekCount }}</div>
                                <div class="stat-label compact-label">Next Week</div>
                            </div>
                            <div 
                                class="stat-item compact-stat" 
                                :class="{ 
                                    'clickable-stat': releaseStats.overdueCount > 0,
                                    'stat-active': selectedStatFilter === 'overdue',
                                    'stat-disabled': releaseStats.overdueCount === 0
                                }"
                                @click="releaseStats.overdueCount > 0 ? filterByReleaseStatus('overdue') : null"
                            >
                                <div class="stat-number compact-number">{{ releaseStats.overdueCount }}</div>
                                <div class="stat-label compact-label">Overdue</div>
                            </div>
                            <div 
                                class="stat-item compact-stat" 
                                :class="{ 
                                    'clickable-stat': releaseStats.next30DaysCount > 0,
                                    'stat-active': selectedStatFilter === 'next30Days',
                                    'stat-disabled': releaseStats.next30DaysCount === 0
                                }"
                                @click="releaseStats.next30DaysCount > 0 ? filterByReleaseStatus('next30Days') : null"
                            >
                                <div class="stat-number compact-number">{{ releaseStats.next30DaysCount }}</div>
                                <div class="stat-label compact-label">Next 30 Days</div>
                            </div>
                            <div 
                                class="stat-item compact-stat clickable-stat" 
                                :class="{ 'stat-active': selectedStatFilter === 'all' }"
                                @click="filterByReleaseStatus('all')"
                            >
                                <div class="stat-number compact-number">{{ releaseStats.totalCount }}</div>
                                <div class="stat-label compact-label">Total Parts</div>
                            </div>
                        </div>
                        <div v-else class="no-stats-message">
                            <v-icon color="grey">mdi-chart-bar</v-icon>
                            <p class="caption">No statistics available</p>
                        </div>
                    </v-card-text>
                </v-card>
            </v-col>

            <!-- Parts Table Widget - Takes remaining space -->
            <v-col cols="12" lg="9">
                <v-card class="table-card" :loading="loading">
                    <v-card-title class="table-header">
                        <v-icon left>mdi-table</v-icon>
                        Parts Data Table
                        <v-spacer />
                        <v-chip small color="success" outlined class="mr-2">
                            {{ filteredTableData.length }} Items
                        </v-chip>
                        
                        <!-- Export Button -->
                        <v-menu v-if="filteredTableData.length > 0" bottom left>
                            <template #activator="{ on, attrs }">
                                <v-btn
                                    icon
                                    small
                                    color="primary"
                                    class="export-btn"
                                    title="Export Data"
                                    v-bind="attrs"
                                    v-on="on"
                                >
                                    <v-icon small>mdi-download</v-icon>
                                </v-btn>
                            </template>
                            <v-list>
                                <v-list-item @click="exportTableData('pdf')">
                                    <v-list-item-icon>
                                        <v-icon>mdi-file-pdf-box</v-icon>
                                    </v-list-item-icon>
                                    <v-list-item-title>Export as PDF</v-list-item-title>
                                </v-list-item>
                                <v-list-item @click="exportTableData('csv')">
                                    <v-list-item-icon>
                                        <v-icon>mdi-file-delimited</v-icon>
                                    </v-list-item-icon>
                                    <v-list-item-title>Export as CSV</v-list-item-title>
                                </v-list-item>
                            </v-list>
                        </v-menu>
                    </v-card-title>
                    
                    <v-card-text class="table-content">
                        <v-data-table
                            v-if="filteredTableData.length > 0"
                            :headers="tableHeaders"
                            :items="filteredTableData"
                            :loading="loading"
                            dense
                            :items-per-page="10"
                            :footer-props="{ itemsPerPageOptions: [5, 10, 25, 50] }"
                            item-value="partNo"
                            @click:row="handleRowClick"
                        >
                            <template #body="{ items }">
                                <tbody>
                                    <tr
                                        v-for="(item, index) in items"
                                        :key="item.partNo"
                                        @click="handleRowClick(item)"
                                    >
                                        <td>{{ item.partNo }}</td>
                                        <td>{{ item.rev }}</td>
                                        <td>{{ item.description }}</td>
                                        <td>{{ item.organization }}</td>
                                        <td>{{ item.tgtRelease }}</td>
                                        <td>{{ item.actualRelease }}</td>
                                        <td>{{ item.currentState }}</td>
                                        <td>
                                            <ChangeActionCell
                                                :obj-id="item.physId"
                                                :row-index="index"
                                                field="number"
                                                @ca-number-loaded="onCaNumberLoaded"
                                            />
                                        </td>
                                        <td>
                                            <ChangeActionCell
                                                :obj-id="item.physId"
                                                :row-index="index"
                                                field="state"
                                                @ca-number-loaded="onCaNumberLoaded"
                                            />
                                        </td>
                                    </tr>
                                </tbody>
                            </template>
                        </v-data-table>
                        <div v-else class="no-data-message">
                            <v-icon size="48" color="grey">mdi-table-off</v-icon>
                            <p>No table data available for current filters</p>
                            <p class="caption">Try adjusting your filter selections</p>
                        </div>
                    </v-card-text>
                </v-card>
            </v-col>
        </v-row>
    </div>
</template>

<style scoped>
/* Component-specific styles that can't be moved to global CSS */
.chart-content,
.table-content {
  flex: 1;
  display: flex;
  flex-direction: column;
}
</style>

<script>
/* eslint-disable no-console */
import UniversalChart from "@/components/universal/UniversalChart.vue";
import UniversalFilterControls from "@/components/universal/UniversalFilterControls.vue";
import ChangeActionCell from "@/components/release-planning/ChangeActionCell.vue";
import dataService from "@/data/DataServiceBase.js";
import { USE_MOCK_DATA } from "@/config/ApiConfig.js";

export default {
    name: "EnhancedPartsPlannerWidget",
    components: {
        UniversalChart,
        UniversalFilterControls,
        ChangeActionCell
    },
    props: {
        hideHeader: {
            type: Boolean,
            default: false
        }
    },
    data() {
        return {
            // Filter values - consolidated object for UniversalFilterControls
            filterValues: {
                program: "",
                phase: "",
                organization: "All"
            },
            
            // Filter options - will be loaded dynamically
            programs: [],
            phases: [],
            organizations: [],
            
            // Raw data
            tableData: [],
            
            // Data for chart and filtered display
            chartData: { labels: [], datasets: [] },
            
            // TODO: Replace with actual data for CA's
            // Table headers for Change Actions - no color indicators
            tableHeaders: [
                { text: "Part Number", value: "partNo", sortable: true },
                { text: "Rev", value: "rev", sortable: true },
                { text: "Description", value: "description", sortable: true },
                { text: "Organization", value: "organization", sortable: true },
                { text: "Target Release", value: "tgtRelease", sortable: true },
                { text: "Actual Release", value: "actualRelease", sortable: true },
                { text: "State", value: "currentState", sortable: true },
                { text: "Change Action", value: "caNumber", sortable: true },
                { text: "CA State", value: "caState", sortable: true }
            ],
            
            // Chart configuration - Amazing design with no overlapping
            chartOptions: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    intersect: false,
                    mode: "index"
                },
                layout: {
                    padding: {
                        top: 50,
                        bottom: 40,
                        left: 20,
                        right: 20
                    }
                },
                scales: {
                    x: { 
                        title: { 
                            display: true, 
                            text: "Release Timeline",
                            font: {
                                size: 14,
                                weight: "bold"
                            },
                            color: "#1976d2"
                        },
                        ticks: {
                            maxRotation: 45,
                            minRotation: 0,
                            autoSkip: true,
                            maxTicksLimit: 8,
                            font: {
                                size: 11
                            },
                            color: "#666",
                            padding: 5
                        },
                        grid: {
                            color: "rgba(0,0,0,0.1)",
                            lineWidth: 1
                        },
                        border: {
                            color: "#ddd",
                            width: 2
                        }
                    },
                    y: { 
                        title: { 
                            display: true, 
                            text: "Cumulative Parts Count",
                            font: {
                                size: 14,
                                weight: "bold"
                            },
                            color: "#1976d2"
                        },
                        ticks: {
                            font: {
                                size: 11
                            },
                            color: "#666",
                            padding: 5,
                            callback(value) {
                                return Math.floor(value);
                            }
                        },
                        grid: {
                            color: "rgba(0,0,0,0.1)",
                            lineWidth: 1
                        },
                        border: {
                            color: "#ddd",
                            width: 2
                        },
                        beginAtZero: true
                    }
                },
                plugins: {
                    legend: { 
                        display: false
                    },
                    tooltip: { 
                        mode: "index", 
                        intersect: false,
                        backgroundColor: "rgba(0,0,0,0.8)",
                        titleFont: {
                            size: 14,
                            weight: "bold"
                        },
                        bodyFont: {
                            size: 12
                        },
                        cornerRadius: 8,
                        displayColors: true,
                        callbacks: {
                            title(context) {
                                return "Date: " + context[0].label;
                            },
                            label(context) {
                                return context.dataset.label + ": " + context.parsed.y + " parts";
                            }
                        }
                    }
                },
                elements: {
                    line: {
                        tension: 0.2,
                        borderWidth: 3
                    },
                    point: {
                        radius: 4,
                        hoverRadius: 8,
                        borderWidth: 2,
                        hoverBorderWidth: 3
                    }
                }
            },
            
            // UI state
            loading: false,
            lastUpdated: new Date().toLocaleTimeString(),
            
            // Chart line visibility
            showTargetLine: true,
            showActualLine: true,
            
            // Release headliner filter
            selectedStatFilter: "all"
        };
    },
    
    computed: {
        filterConfig() {
            return [
                {
                    key: "program",
                    label: "Program",
                    icon: "mdi-briefcase",
                    placeholder: "Select Program",
                    options: this.programs,
                    color: "primary"
                },
                {
                    key: "phase",
                    label: "Phase", 
                    icon: "mdi-timeline",
                    placeholder: "Select Phase",
                    options: this.phases,
                    color: "secondary"
                },
                {
                    key: "organization",
                    label: "Organization",
                    icon: "mdi-domain", 
                    placeholder: "Select Organization",
                    options: this.organizations,
                    color: "accent"
                }
            ];
        },
        
        hasActiveFilters() {
            return (this.filterValues.program && this.filterValues.program !== "") ||
                   (this.filterValues.phase && this.filterValues.phase !== "") ||
                   (this.filterValues.organization && this.filterValues.organization !== "All");
        },
        
        activeFilterCount() {
            let count = 0;
            if (this.filterValues.program && this.filterValues.program !== "") count++;
            if (this.filterValues.phase && this.filterValues.phase !== "") count++;
            if (this.filterValues.organization && this.filterValues.organization !== "All") count++;
            return count;
        },

        filteredTableData() {
            let result = [...this.tableData];
            
            // Apply organization filter
            if (this.filterValues.organization !== "All") {
                result = result.filter(r => r.organization === this.filterValues.organization);
            }
            
            // Apply stat filter
            if (this.selectedStatFilter !== "all") {
                result = this.applyStatFilter(result, this.selectedStatFilter);
            }
            
            return result;
        },

        releaseStats() {
            if (!this.filteredTableData || this.filteredTableData.length === 0) {
                return null;
            }
            return this.computeStatsForArray(this.filteredTableData);
        }
    },
    
    async mounted() {
        // Initialize by fetching programs first
        await this.fetchPrograms();
    },
    
    methods: {
        // Handle filter changes from UniversalFilterControls
        handleFilterChange(filterEvent) {
            this.filterValues = { ...filterEvent.allFilters };
            
            // Handle specific filter logic
            if (filterEvent.key === "program") {
                this.onProgramChange();
            } else if (filterEvent.key === "phase") {
                this.handlePhaseChange();
            } else if (filterEvent.key === "organization") {
                this.updateChartFromFiltered();
                this.lastUpdated = new Date().toLocaleTimeString();
            }
        },
        
        /**
         * Export table data in the specified format
         */
        exportTableData(format) {
            const DATE_FORMAT_LENGTH = 10;
            const fileName = `parts-table-${new Date().toISOString().slice(0, DATE_FORMAT_LENGTH)}`;

            if (format === "csv") {
                this.downloadAsCSV(fileName);
            } else if (format === "pdf") {
                this.exportAsPDF(fileName);
            }
        },

        /**
         * Download table data as CSV
         */
        downloadAsCSV(fileName) {
            try {
                const csvContent = this.convertTableToCSV();
                const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
                const url = URL.createObjectURL(blob);
                const link = document.createElement("a");
                link.href = url;
                link.download = `${fileName}.csv`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
            } catch (error) {
                // Silently handle error
            }
        },

        /**
         * Convert table data to CSV format
         */
        convertTableToCSV() {
            const headers = this.tableHeaders.map(header => header.text);
            const csvHeaders = headers.join(",");
            
            const csvRows = this.filteredTableData.map(item => {
                return this.tableHeaders.map(header => {
                    let value = item[header.value];
                    
                    // Handle special cases for CA columns
                    if (header.value === "caNumber" || header.value === "caState") {
                        value = value || ""; // Use empty string if no value
                    }
                    
                    // Escape commas and quotes in CSV
                    return `"${String(value || "").replace(/"/g, '""')}"`;
                }).join(",");
            });
            
            return [csvHeaders, ...csvRows].join("\n");
        },

        /**
         * Export table as PDF
         */
        exportAsPDF(fileName) {
            try {
                const htmlContent = this.createTablePDFHTML(fileName);
                this.downloadPDFContent(htmlContent, fileName);
            } catch (error) {
                window.print();
            }
        },

        /**
         * Create PDF HTML content for table
         */
        createTablePDFHTML(title) {
            const headers = this.tableHeaders.map(header => `<th>${header.text}</th>`).join("");
            const rows = this.filteredTableData.map(item => {
                const cells = this.tableHeaders.map(header => {
                    let value = item[header.value] || "";
                    
                    // Handle special cases for CA columns
                    if (header.value === "caNumber" || header.value === "caState") {
                        value = value || "";
                    }
                    
                    return `<td>${value}</td>`;
                }).join("");
                return `<tr>${cells}</tr>`;
            }).join("");

            return `
                <!DOCTYPE html>
                <html>
                <head>
                    <title>${title}</title>
                    <style>
                        @page { size: A4 landscape; margin: 15mm; }
                        body { font-family: Arial, sans-serif; margin: 0; }
                        .header { text-align: center; margin-bottom: 20px; }
                        table { width: 100%; border-collapse: collapse; font-size: 10px; }
                        th, td { border: 1px solid #ddd; padding: 6px; text-align: left; }
                        th { background-color: #f2f2f2; font-weight: bold; }
                        tr:nth-child(even) { background-color: #f9f9f9; }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <h2>Parts Data Table Export</h2>
                        <p>Generated on ${new Date().toLocaleDateString()}</p>
                        <p>Total Items: ${this.filteredTableData.length}</p>
                    </div>
                    <table>
                        <thead>
                            <tr>${headers}</tr>
                        </thead>
                        <tbody>
                            ${rows}
                        </tbody>
                    </table>
                </body>
                </html>
            `;
        },

        /**
         * Download PDF content
         */
        downloadPDFContent(htmlContent, fileName) {
            try {
                const printWindow = window.open("", "_blank");
                printWindow.document.write(htmlContent);
                printWindow.document.close();
                
                const PRINT_DELAY = 500;
                setTimeout(() => {
                    printWindow.print();
                }, PRINT_DELAY);
            } catch (error) {
                const blob = new Blob([htmlContent], { type: "text/html" });
                const url = URL.createObjectURL(blob);
                const link = document.createElement("a");
                link.href = url;
                link.download = `${fileName}.html`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
            }
        },

        /**
         * Compute statistics for an array of parts.
         */
        computeStatsForArray(partsArray) {
            const currentDate = new Date();
            currentDate.setHours(0, 0, 0, 0);
            const stats = {
                totalCount: partsArray.length,
                releasedCount: 0,
                thisWeekCount: 0,
                nextWeekCount: 0,
                next30DaysCount: 0,
                overdueCount: 0,
                thisWeekPlanned: 0,
                thisWeekReleased: 0,
                nextWeekPlanned: 0,
                nextWeekReleased: 0,
                next30DaysPlanned: 0,
                next30DaysReleased: 0,
                toDatePlanned: 0,
                toDateReleased: 0
            };

            stats.releasedCount = partsArray.filter(p => p.currentState === "RELEASED").length;

            const toDateParts = partsArray.filter(part => {
                const tgt = new Date(part.tgtRelease);
                tgt.setHours(0, 0, 0, 0);
                return tgt.getTime() <= currentDate.getTime();
            });
            stats.toDatePlanned = toDateParts.length;
            stats.toDateReleased = toDateParts.filter(p => p.currentState === "RELEASED").length;

            const [startOfWeek, endOfWeek] = this.getCurrentWeekRange(currentDate);
            const [startNextWeek, endNextWeek] = this.getNextWeekRange(currentDate);

            // This Week
            const thisWeekParts = partsArray.filter(part => {
                const tgt = new Date(part.tgtRelease);
                tgt.setHours(0, 0, 0, 0);
                return tgt.getTime() >= startOfWeek && tgt.getTime() <= endOfWeek;
            });
            stats.thisWeekPlanned = thisWeekParts.length;
            stats.thisWeekReleased = thisWeekParts.filter(p => p.currentState === "RELEASED").length;
            stats.thisWeekCount = thisWeekParts.length;

            // Next Week
            const nextWeekParts = partsArray.filter(part => {
                const tgt = new Date(part.tgtRelease);
                tgt.setHours(0, 0, 0, 0);
                return tgt.getTime() >= startNextWeek && tgt.getTime() <= endNextWeek;
            });
            stats.nextWeekPlanned = nextWeekParts.length;
            stats.nextWeekReleased = nextWeekParts.filter(p => p.currentState === "RELEASED").length;
            stats.nextWeekCount = nextWeekParts.length;

            // Next 30 Days
            const DAYS_IN_30 = 30;
            const nowMs = currentDate.getTime();
            const next30 = new Date(currentDate);
            next30.setDate(next30.getDate() + DAYS_IN_30);
            const next30Ms = next30.getTime();

            const next30Parts = partsArray.filter(part => {
                const tgt = new Date(part.tgtRelease);
                tgt.setHours(0, 0, 0, 0);
                return tgt.getTime() >= nowMs && tgt.getTime() <= next30Ms;
            });
            stats.next30DaysPlanned = next30Parts.length;
            stats.next30DaysReleased = next30Parts.filter(p => p.currentState === "RELEASED").length;
            stats.next30DaysCount = next30Parts.length;

            // Overdue
            stats.overdueCount = partsArray.filter(part => {
                const tgt = new Date(part.tgtRelease);
                tgt.setHours(0, 0, 0, 0);
                return tgt.getTime() < currentDate.getTime() && part.currentState !== "RELEASED";
            }).length;

            return stats;
        },

        getCurrentWeekRange(date) {
            const DAYS_IN_WEEK = 7;
            const now = new Date(date);
            now.setHours(0, 0, 0, 0);
            const dayOfWeek = now.getDay();
            const start = new Date(now);
            start.setDate(now.getDate() - dayOfWeek);
            const end = new Date(start);
            end.setDate(start.getDate() + (DAYS_IN_WEEK - 1));
            return [start.getTime(), end.getTime()];
        },

        getNextWeekRange(date) {
            const DAYS_IN_WEEK = 7;
            const [startOfThisWeek] = this.getCurrentWeekRange(date);
            const startNextWeek = new Date(startOfThisWeek);
            startNextWeek.setDate(startNextWeek.getDate() + DAYS_IN_WEEK);
            const endNextWeek = new Date(startNextWeek);
            endNextWeek.setDate(endNextWeek.getDate() + (DAYS_IN_WEEK - 1));
            return [startNextWeek.getTime(), endNextWeek.getTime()];
        },

        // Exactly match the pattern from DataMethodsReleasePlanner.js
        async fetchPrograms() {
            try {
                const programs = await dataService.fetchPrograms();
                this.programs = programs || [];

                if (this.programs.includes("CX300 Pre-Production Builds")) {
                    this.filterValues.program = "CX300 Pre-Production Builds";
                } else if (this.programs.length > 0) {
                    this.filterValues.program = this.programs[0];
                }

                if (this.filterValues.program) {
                    await this.fetchPhases();
                }
            } catch (err) {
                if (USE_MOCK_DATA) {
                    console.warn("API not available, using mock data for programs. Error:", err.message);
                }
                // Fallback to mock data for template demo
                this.programs = ["CX300 Pre-Production Builds", "Demo Program 1", "Demo Program 2"];
                this.filterValues.program = "CX300 Pre-Production Builds";
                await this.fetchPhases();
            }
        },

        onProgramChange() {
            if (this.filterValues.program) {
                this.fetchPhases();
            }
        },

        async fetchPhases() {
            this.loading = true;
            try {
                const phases = await dataService.fetchPhases(this.filterValues.program);
                this.phases = phases || [];

                if (this.phases.length > 0) {
                    this.filterValues.phase = this.phases[0];
                    await this.fetchData(this.filterValues.phase);
                } else if (USE_MOCK_DATA) {
                    console.warn("No phases retrieved");
                }
            } catch (error) {
                if (USE_MOCK_DATA) {
                    console.warn("API not available, using mock data for phases. Error:", error.message);
                }
                // Fallback to mock data
                this.phases = ["Phase 1", "Phase 2", "Phase 3"];
                this.filterValues.phase = "Phase 1";
                await this.fetchData(this.filterValues.phase);
            } finally {
                this.loading = false;
            }
        },

        async handlePhaseChange() {
            if (!this.filterValues.phase) return;
            this.loading = true;
            await this.fetchData(this.filterValues.phase);
            this.loading = false;
        },

        async fetchData(phase) {
            this.loading = true;
            try {
                console.log("=== FETCHDATA START ===");
                console.log("Phase parameter:", phase);
                
                // TODO: modify the second parameter to fetch data
                // Use the generic fetchItems method - can be configured for different data types
                // Change 'cas' to 'parts' if you want to fetch parts data instead
                const parts = await dataService.fetchItems(phase, "parts");
                
                console.log("=== RAW API RESPONSE ===");
                console.log("Type of parts:", typeof parts);
                console.log("Is Array:", Array.isArray(parts));
                console.log("Parts length:", parts?.length);
                console.log("Raw parts data:", parts);
                
                // Initialize conversion variable
                let convertedParts = null;
                
                // Check if parts is null/undefined
                if (parts === null) {
                    console.log("⚠️  WARNING: parts is null");
                } else if (parts === undefined) {
                    console.log("⚠️  WARNING: parts is undefined");
                } else if (typeof parts === "string") {
                    console.log("⚠️  WARNING: parts is a string:", parts);
                } else if (typeof parts === "object" && !Array.isArray(parts)) {
                    console.log("⚠️  WARNING: parts is an object but not an array");
                    console.log("Object keys:", Object.keys(parts));
                    console.log("Object values:", Object.values(parts));
                    // Check if it has an error property
                    if (parts.error) {
                        console.log("🔴 ERROR in response:", parts.error);
                    }
                    // Check if it has a message property
                    if (parts.message) {
                        console.log("📝 MESSAGE in response:", parts.message);
                    }
                }
                
                if (Array.isArray(parts)) {
                    console.log("✅ Parts is a valid array");
                    if (parts.length > 0) {
                        console.log("=== FIRST ITEM STRUCTURE ===");
                        console.log("First item:", parts[0]);
                        console.log("First item keys:", Object.keys(parts[0]));
                        console.log("First item values:", Object.values(parts[0]));
                    } else {
                        console.log("⚠️  Array is empty");
                    }
                } else {
                    console.log("❌ Parts is NOT an array - cannot process with .map()");
                }
                
                // Try to convert to array if it looks like an array-like object
                if (!Array.isArray(parts) && typeof parts === "object" && parts !== null) {
                    console.log("🔄 Attempting to convert non-array object to array");
                    console.log("Object type:", typeof parts);
                    console.log("Object keys:", Object.keys(parts));
                    console.log("Object values preview:", Object.values(parts).slice(0, 3));
                    
                    if (typeof parts === "object" && parts !== null) {
                        // Check if it's an array-like object (has numeric keys)
                        const keys = Object.keys(parts);
                        const isArrayLike = keys.every(key => !isNaN(key) && parseInt(key) >= 0);
                        
                        if (isArrayLike && keys.length > 0) {
                            console.log("🔄 Attempting to convert array-like object to array");
                            console.log("Object keys (should be numeric):", keys);
                            
                            // Convert to array using Object.values()
                            convertedParts = Object.values(parts);
                            console.log("✅ Converted to array:", convertedParts);
                            console.log("Converted array length:", convertedParts.length);
                        } else if (parts.data && Array.isArray(parts.data)) {
                            // Check if it's wrapped in a 'data' property
                            console.log("🔄 Found data property that is an array");
                            convertedParts = parts.data;
                            console.log("✅ Using parts.data as array:", convertedParts);
                        } else if (parts.items && Array.isArray(parts.items)) {
                            // Check if it's wrapped in an 'items' property
                            console.log("🔄 Found items property that is an array");
                            convertedParts = parts.items;
                            console.log("✅ Using parts.items as array:", convertedParts);
                        } else if (parts.results && Array.isArray(parts.results)) {
                            // Check if it's wrapped in a 'results' property
                            console.log("🔄 Found results property that is an array");
                            convertedParts = parts.results;
                            console.log("✅ Using parts.results as array:", convertedParts);
                        } else if (parts.response && Array.isArray(parts.response)) {
                            // Check if it's wrapped in a 'response' property
                            console.log("🔄 Found response property that is an array");
                            convertedParts = parts.response;
                            console.log("✅ Using parts.response as array:", convertedParts);
                        } else if (parts.list && Array.isArray(parts.list)) {
                            // Check if it's wrapped in a 'list' property
                            console.log("🔄 Found list property that is an array");
                            convertedParts = parts.list;
                            console.log("✅ Using parts.list as array:", convertedParts);
                        } else if (parts.records && Array.isArray(parts.records)) {
                            // Check if it's wrapped in a 'records' property
                            console.log("🔄 Found records property that is an array");
                            convertedParts = parts.records;
                            console.log("✅ Using parts.records as array:", convertedParts);
                        } else if (parts.content && Array.isArray(parts.content)) {
                            // Check if it's wrapped in a 'content' property
                            console.log("🔄 Found content property that is an array");
                            convertedParts = parts.content;
                            console.log("✅ Using parts.content as array:", convertedParts);
                        } else {
                            console.log("❌ Cannot convert to array - not array-like");
                            console.log("Available properties:", Object.keys(parts));
                            
                            // Try to find any property that might be an array
                            const arrayProperties = Object.keys(parts).filter(key => Array.isArray(parts[key]));
                            if (arrayProperties.length > 0) {
                                console.log("🔍 Found array properties:", arrayProperties);
                                console.log("🔄 Using first array property:", arrayProperties[0]);
                                convertedParts = parts[arrayProperties[0]];
                                console.log("✅ Converted using property", arrayProperties[0] + ":", convertedParts);
                            } else {
                                console.log("❌ No array properties found in object");
                            }
                        }
                    }
                    
                    // If we successfully converted, use the converted array
                    if (convertedParts && Array.isArray(convertedParts)) {
                        console.log("🎉 Successfully converted to array, proceeding with conversion");
                        
                        if (convertedParts.length > 0) {
                            console.log("=== FIRST ITEM STRUCTURE (from converted array) ===");
                            console.log("First item:", convertedParts[0]);
                            console.log("First item keys:", Object.keys(convertedParts[0]));
                            console.log("First item values:", Object.values(convertedParts[0]));
                        }
                    }
                }
                
                console.log("=== MAPPING PARTS TO TABLE DATA ===");
                
                // Use converted parts if available, otherwise use original parts
                const finalParts = convertedParts && Array.isArray(convertedParts) ? convertedParts : parts;
                
                console.log("=== CONVERSION RESULT ANALYSIS ===");
                console.log("convertedParts is null/undefined:", convertedParts === null || convertedParts === undefined);
                console.log("convertedParts is array:", Array.isArray(convertedParts));
                console.log("convertedParts length:", convertedParts?.length);
                
                if (Array.isArray(convertedParts)) {
                    if (convertedParts.length === 0) {
                        console.log("🔴 WARNING: convertedParts is an empty array!");
                        console.log("Possible reasons:");
                        console.log("1. The original object had no array properties");
                        console.log("2. The found array property was empty");
                        console.log("3. The conversion logic didn't match the actual structure");
                        console.log("4. The object structure is different than expected");
                        
                        // Re-examine the original object structure
                        if (typeof parts === "object" && parts !== null) {
                            console.log("=== RE-EXAMINING ORIGINAL OBJECT ===");
                            console.log("Original object keys:", Object.keys(parts));
                            console.log("Original object values sample:", Object.values(parts).slice(0, 3));
                            
                            // Check each property to see if any are arrays
                            Object.keys(parts).forEach(key => {
                                const value = parts[key];
                                console.log(`Property '${key}':`, {
                                    type: typeof value,
                                    isArray: Array.isArray(value),
                                    length: Array.isArray(value) ? value.length : "N/A",
                                    sample: Array.isArray(value) ? value.slice(0, 2) : value
                                });
                            });
                        }
                    } else {
                        console.log("✅ convertedParts has", convertedParts.length, "items");
                    }
                } else {
                    console.log("❌ convertedParts is not an array, using original parts");
                }
                
                console.log("Final parts to be used:", finalParts);
                console.log("Final parts length:", Array.isArray(finalParts) ? finalParts.length : "Not an array");
                
                this.tableData = Array.isArray(finalParts)
                    ? finalParts.map((p, index) => {
                        console.log(`--- Processing part ${index + 1} ---`);
                        console.log("Original part object:", p);
                        
                        const mappedItem = {
                            partNo: p.partNumber,
                            rev: p.revision,
                            description: p.description,
                            organization: p.organization || "Unknown",
                            tgtRelease: p.targetReleaseDate,
                            actualRelease: p.actualReleaseDate || "N/A",
                            currentState: p.currentState,
                            physId: p.physId
                        };
                        
                        console.log("Mapped item:", mappedItem);
                        console.log("Field mappings:");
                        console.log("  partNumber -> partNo:", p.partNumber, "->", mappedItem.partNo);
                        console.log("  revision -> rev:", p.revision, "->", mappedItem.rev);
                        console.log("  desciption -> description:", p.description, "->", mappedItem.description);
                        console.log("  organization -> organization:", p.organization, "->", mappedItem.organization);
                        console.log("  targetReleaseDate -> tgtRelease:", p.targetReleaseDate, "->", mappedItem.tgtRelease);
                        console.log("  actualReleaseDate -> actualRelease:", p.actualReleaseDate, "->", mappedItem.actualRelease);
                        console.log("  currentState -> currentState:", p.currentState, "->", mappedItem.currentState);
                        console.log("  physId -> physId:", p.physId, "->", mappedItem.physId);
                        
                        return mappedItem;
                    })
                    : [];
                
                console.log("=== FINAL TABLE DATA ===");
                console.log("Final tableData array length:", this.tableData.length);
                console.log("Final tableData contents:", this.tableData);
                console.log("=== FETCHDATA END ===");

                // Update organizations from the parts data
                const orgSet = new Set(this.tableData.map(r => r.organization));
                this.organizations = ["All", ...orgSet];

                // Update chart data from the filtered table data
                this.updateChartFromFiltered();

            } catch (error) {
                console.error("Error fetching data:", {
                    message: error.message,
                    phase,
                    fullError: error
                });
                
                // Don't use mock data - leave table empty to see real API behavior
                this.tableData = [];
                this.organizations = ["All"];
                this.updateChartFromFiltered();
            } finally {
                this.loading = false;
                this.lastUpdated = new Date().toLocaleTimeString();
            }
        },

        generateMockPartsData() {
            const organizations = ["Engineering", "Manufacturing", "Quality", "Procurement"];
            const states = ["IN_WORK", "RELEASED", "REVIEW", "PENDING"];
            const mockData = [];
            
            const MOCK_PARTS_COUNT = 25;
            const DATE_RANGE_DAYS = 60;
            const DATE_OFFSET_DAYS = 30;
            const ACTUAL_DATE_VARIANCE = 10;
            const ACTUAL_DATE_OFFSET = 5;
            const PART_NUMBER_PAD_LENGTH = 3;
            const MAX_REVISION_NUMBER = 5;
            const ACTUAL_RELEASE_PROBABILITY = 0.3;
            
            for (let i = 1; i <= MOCK_PARTS_COUNT; i++) {
                const baseDate = new Date();
                const randomDays = Math.floor(Math.random() * DATE_RANGE_DAYS) - DATE_OFFSET_DAYS;
                const targetDate = new Date(baseDate);
                targetDate.setDate(baseDate.getDate() + randomDays);
                
                const actualDate = new Date(targetDate);
                actualDate.setDate(targetDate.getDate() + Math.floor(Math.random() * ACTUAL_DATE_VARIANCE) - ACTUAL_DATE_OFFSET);
                
                mockData.push({
                    partNo: `PART-${String(i).padStart(PART_NUMBER_PAD_LENGTH, "0")}`,
                    rev: `R${Math.floor(Math.random() * MAX_REVISION_NUMBER) + 1}`,
                    description: `Demo Part ${i} Description`,
                    organization: organizations[Math.floor(Math.random() * organizations.length)],
                    tgtRelease: targetDate.toISOString().split("T")[0],
                    actualRelease: Math.random() > ACTUAL_RELEASE_PROBABILITY ? actualDate.toISOString().split("T")[0] : "N/A",
                    currentState: states[Math.floor(Math.random() * states.length)],
                    physId: `phys-id-${i}`
                });
            }
            
            return mockData;
        },

        onCaNumberLoaded({ objectId, caNumber, caState, caLink }) {
            const row = this.tableData.find(i => i.physId === objectId);
            if (row) {
                row.caNumber = caNumber;
                row.caState = caState;
                row.caLink = caLink;
            }
        },

        updateChartFromFiltered() {
            const parts = this.filteredTableData;
            if (!parts || parts.length === 0) {
                this.chartData.labels = [];
                this.chartData.datasets = [];
                return;
            }

            const DASH_SIZE = 5;

            const dateStamps = parts.map(part => {
                const d = new Date(part.tgtRelease);
                d.setHours(0, 0, 0, 0);
                return d.getTime();
            });
            const minDate = Math.min(...dateStamps);
            const maxDate = Math.max(...dateStamps);

            const timeLabels = [];
            const MS_PER_SECOND = 1000;
            const MINUTES_PER_HOUR = 60;
            const SECONDS_PER_MINUTE = 60;
            const HOURS_PER_DAY = 24;
            const MS_PER_DAY = HOURS_PER_DAY * MINUTES_PER_HOUR * SECONDS_PER_MINUTE * MS_PER_SECOND;
            for (let day = minDate; day <= maxDate; day += MS_PER_DAY) {
                const d = new Date(day);
                d.setHours(0, 0, 0, 0);
                timeLabels.push(d.toLocaleDateString());
            }

            const targetCumulativeData = [];
            const actualCumulativeData = [];

            timeLabels.forEach(label => {
                const labelDateMs = new Date(label).getTime();
                const tgtCount = parts.filter(part => {
                    const dt = new Date(part.tgtRelease);
                    dt.setHours(0, 0, 0, 0);
                    return dt.getTime() <= labelDateMs;
                }).length;

                const actCount = parts.filter(part => {
                    if (part.actualRelease === "N/A") return false;
                    const dt = new Date(part.actualRelease);
                    dt.setHours(0, 0, 0, 0);
                    return dt.getTime() <= labelDateMs;
                }).length;

                targetCumulativeData.push(tgtCount);
                actualCumulativeData.push(actCount);
            });

            if (targetCumulativeData[targetCumulativeData.length - 1] !== parts.length) {
                targetCumulativeData[targetCumulativeData.length - 1] = parts.length;
            }

            this.chartData.labels = timeLabels;
            this.chartData.datasets = [
                {
                    label: "Target Release Progression",
                    data: targetCumulativeData,
                    borderColor: "#1976d2",
                    backgroundColor: "rgba(25, 118, 210, 0.1)",
                    fill: false,
                    tension: 0.2,
                    borderWidth: 3,
                    pointBackgroundColor: "#1976d2",
                    pointBorderColor: "#ffffff",
                    pointBorderWidth: 2,
                    pointRadius: 4,
                    pointHoverRadius: 8,
                    pointHoverBackgroundColor: "#1976d2",
                    pointHoverBorderColor: "#ffffff",
                    pointHoverBorderWidth: 3,
                    hidden: !this.showTargetLine
                },
                {
                    label: "Actual Release Progression",
                    data: actualCumulativeData.map((val, index) => {
                        const dayMs = new Date(timeLabels[index]).getTime();
                        return dayMs <= Date.now() ? val : null;
                    }),
                    borderColor: "#4caf50",
                    backgroundColor: "rgba(76, 175, 80, 0.1)",
                    fill: false,
                    tension: 0.2,
                    borderWidth: 3,
                    pointBackgroundColor: "#4caf50",
                    pointBorderColor: "#ffffff",
                    pointBorderWidth: 2,
                    pointRadius: 4,
                    pointHoverRadius: 8,
                    pointHoverBackgroundColor: "#4caf50",
                    pointHoverBorderColor: "#ffffff",
                    pointHoverBorderWidth: 3,
                    borderDash: [DASH_SIZE, DASH_SIZE],
                    spanGaps: true,
                    hidden: !this.showActualLine
                }
            ];
        },
        
        async refreshData() {
            // Clear all data and reload from programs
            this.programs = [];
            this.phases = [];
            this.organizations = [];
            this.tableData = [];
            this.chartData = { labels: [], datasets: [] };
            this.filterValues.program = "";
            this.filterValues.phase = "";
            this.filterValues.organization = "All";
            
            await this.fetchPrograms();
        },
        
        resetFilters() {
            this.filterValues.organization = "All";
            this.selectedStatFilter = "all";
            this.updateChartFromFiltered();
            this.lastUpdated = new Date().toLocaleTimeString();
        },
        
        handleRowClick(row) {
            this.$emit("row-click", row);
            // Could also show detail dialog, etc.
        },
        
        toggleTargetLine() {
            this.showTargetLine = !this.showTargetLine;
            this.updateChartVisibility();
        },
        
        toggleActualLine() {
            this.showActualLine = !this.showActualLine;
            this.updateChartVisibility();
        },
        
        updateChartVisibility() {
            if (this.chartData.datasets && this.chartData.datasets.length >= 2) {
                // Update dataset visibility
                this.chartData.datasets[0].hidden = !this.showTargetLine;
                this.chartData.datasets[1].hidden = !this.showActualLine;
                
                // Force chart update by creating new chartData object
                this.chartData = { ...this.chartData };
            }
        },
        
        filterByReleaseStatus(filterType) {
            this.selectedStatFilter = filterType;
            this.updateChartFromFiltered();
            this.lastUpdated = new Date().toLocaleTimeString();
        },
        
        applyStatFilter(partsArray, filterType) {
            const currentDate = new Date();
            currentDate.setHours(0, 0, 0, 0);
            
            switch (filterType) {
                case "released":
                    return partsArray.filter(p => p.currentState === "RELEASED");
                    
                case "thisWeek": {
                    const [startOfWeek, endOfWeek] = this.getCurrentWeekRange(currentDate);
                    return partsArray.filter(part => {
                        const tgt = new Date(part.tgtRelease);
                        tgt.setHours(0, 0, 0, 0);
                        return tgt.getTime() >= startOfWeek && tgt.getTime() <= endOfWeek;
                    });
                }
                
                case "nextWeek": {
                    const [startNextWeek, endNextWeek] = this.getNextWeekRange(currentDate);
                    return partsArray.filter(part => {
                        const tgt = new Date(part.tgtRelease);
                        tgt.setHours(0, 0, 0, 0);
                        return tgt.getTime() >= startNextWeek && tgt.getTime() <= endNextWeek;
                    });
                }
                
                case "overdue":
                    return partsArray.filter(part => {
                        const tgt = new Date(part.tgtRelease);
                        tgt.setHours(0, 0, 0, 0);
                        return tgt.getTime() < currentDate.getTime() && part.currentState !== "RELEASED";
                    });
                    
                case "next30Days": {
                    const DAYS_IN_30 = 30;
                    const nowMs = currentDate.getTime();
                    const next30 = new Date(currentDate);
                    next30.setDate(next30.getDate() + DAYS_IN_30);
                    const next30Ms = next30.getTime();
                    
                    return partsArray.filter(part => {
                        const tgt = new Date(part.tgtRelease);
                        tgt.setHours(0, 0, 0, 0);
                        return tgt.getTime() >= nowMs && tgt.getTime() <= next30Ms;
                    });
                }
                
                case "all":
                default:
                    return partsArray;
            }
        },
        
        getFilterDisplayName(filterType) {
            const displayNames = {
                released: "Released",
                thisWeek: "This Week",
                nextWeek: "Next Week", 
                overdue: "Overdue",
                next30Days: "Next 30 Days",
                all: "Total"
            };
            return displayNames[filterType] || "Total";
        }
    }
};
</script>
