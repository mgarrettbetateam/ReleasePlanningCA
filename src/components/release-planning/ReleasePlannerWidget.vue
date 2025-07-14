<!-- Release Planning Widget - Self-contained with prominent filter dropdowns -->
 
<template>
    <div class="enhanced-parts-planner">
        <!-- Header with Title (always shown - this is the internal widget header) -->
        <v-card-title class="planner-header">
            <v-icon left color="primary">mdi-clipboard-list</v-icon>
            {{ widgetTitle }}
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
        >
            <!-- Data Type Switcher (move here for dev/testing) -->
            <template #after-filters>
                <div class="data-type-switcher">
                    <v-chip-group v-model="currentDataType" mandatory column>
                        <v-chip
                            v-for="dataType in getAvailableDataTypes()"
                            :key="dataType"
                            :value="dataType"
                            small
                            @click="switchDataType(dataType)"
                        >
                            {{ dataType.toUpperCase() }}
                        </v-chip>
                    </v-chip-group>
                </div>
            </template>
        </UniversalFilterControls>        <!-- Charts and Tables Section -->
        <v-row class="content-section">
            <!-- Line Chart Widget - Full Width -->
            <v-col cols="12">
                <v-card class="chart-card" :loading="loading" elevation="4">
                    <v-card-title class="chart-header">
                        <v-icon left color="primary" size="28">mdi-chart-line</v-icon>
                        <span class="chart-title">Cumulative Release Timeline</span>
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
                    
                    <!-- Move legend here, inside the chart card but below the header -->
                    <div class="legend-container legend-row chart-legend-inside">
                        <div class="legend-item clickable-legend" :class="{ 'legend-disabled': !showTargetLine }">
                            <div class="legend-color-bar" style="background-color: #1976d2;" :style="{ opacity: showTargetLine ? 1 : 0.3 }"></div>
                            <span class="legend-label" :style="{ opacity: showTargetLine ? 1 : 0.5 }" @click="toggleTargetLine">
                                Target Releases
                                <v-btn
                                    icon
                                    x-small
                                    class="legend-eye-btn"
                                    tabindex="-1"
                                    :color="showTargetLine ? 'primary' : 'grey'"
                                    @click.stop="toggleTargetLine"
                                >
                                    <v-icon small>{{ showTargetLine ? 'mdi-eye' : 'mdi-eye-off' }}</v-icon>
                                </v-btn>
                            </span>
                        </div>
                        <div class="legend-item clickable-legend" :class="{ 'legend-disabled': !showActualLine }">
                            <div class="legend-color-bar" style="background-color: #4caf50;" :style="{ opacity: showActualLine ? 1 : 0.3 }"></div>
                            <span class="legend-label" :style="{ opacity: showActualLine ? 1 : 0.5 }" @click="toggleActualLine">
                                Actual Releases
                                <v-btn
                                    icon
                                    x-small
                                    class="legend-eye-btn"
                                    tabindex="-1"
                                    :color="showActualLine ? 'success' : 'grey'"
                                    @click.stop="toggleActualLine"
                                >
                                    <v-icon small>{{ showActualLine ? 'mdi-eye' : 'mdi-eye-off' }}</v-icon>
                                </v-btn>
                            </span>
                        </div>
                    </div>

                    <v-card-text class="chart-content-wrapper">
                        <div class="chart-container">
                            <UniversalChart
                                v-if="chartData.labels && chartData.labels.length > 0"
                                ref="lineChart"
                                :key="`chart-${chartKey}-${filteredTableData.length}`"
                                :data="chartData"
                                :options="dynamicChartOptions"
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

            <!-- Headliners and Table Side by Side -->
            <v-col cols="12" md="3">
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
            <v-col cols="12" md="9">
                <v-card class="table-card" :loading="loading">
                    <v-card-title class="table-header">
                        <v-icon left>mdi-table</v-icon>
                        {{ currentDataType.toUpperCase() }} Data Table
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
                                        :key="item.partNo || item.caNumber || item.crNumber || item.itemNumber || index"
                                        @click="handleRowClick(item)"
                                    >
                                        <td v-for="header in tableHeaders" :key="header.value">
                                            <!-- Use ChangeActionCell component for CA fields (only in parts data) -->
                                            <ChangeActionCell
                                                v-if="header.component === 'ChangeActionCell'"
                                                :obj-id="item.physId"
                                                :row-index="index"
                                                :field="header.componentProps.field"
                                                @ca-number-loaded="onCaNumberLoaded"
                                            />
                                            <!-- Regular cell for all other data -->
                                            <span v-else>{{ item[header.value] || 'N/A' }}</span>
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

/* Ensure all filter dropdowns (program, phase, organization) are visually consistent in size */
.universal-filter-controls .v-select,
.universal-filter-controls .v-input,
.universal-filter-controls .v-select__slot {
  min-width: 320px !important;
  width: auto !important;
  max-width: none !important;
  box-sizing: border-box;
  height: 44px !important;
  min-height: 44px !important;
  line-height: 44px !important;
  white-space: nowrap !important;
}

/* Ensure the input and label inside the dropdown are vertically centered */
.universal-filter-controls .v-input__slot,
.universal-filter-controls .v-select__selections {
  height: 44px !important;
  min-height: 44px !important;
  display: flex;
  align-items: center;
}

/* Optional: Adjust the label and icon for vertical alignment */
.universal-filter-controls .v-label,
.universal-filter-controls .v-icon {
  line-height: 44px !important;
  height: 44px !important;
  display: flex;
  align-items: center;
}

/* Optional: ensure the filter controls are aligned horizontally and spaced evenly */
.universal-filter-controls {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  align-items: center;
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
            organizations: ["All"], // Initialize with default
            
            // Raw data
            tableData: [],
            
            // Data for chart and filtered display
            chartData: { labels: [], datasets: [] },
            
            // Current data type being displayed - determines which header configuration to use
            currentDataType: "parts", // "parts", "cas", "crs", etc.
            
            // Configuration for different data types - easily extensible
            // ⚠️  IMPORTANT: When adding new data types here, you MUST also update 
            // the mapItemToTableData() method in the methods section below (around line 890)
            // to handle the new data type. Field names must match exactly!
            headerConfigurations: {
                parts: [
                    { text: "Part Number", value: "partNo", sortable: true, required: true, icon: "mdi-barcode" },
                    { text: "Rev", value: "rev", sortable: true, icon: "mdi-source-branch" },
                    { text: "Description", value: "description", sortable: true, icon: "mdi-text" },
                    { text: "Organization", value: "organization", sortable: true, icon: "mdi-domain" },
                    { text: "Target Release", value: "tgtRelease", sortable: true, icon: "mdi-calendar-clock" },
                    { text: "Actual Release", value: "actualRelease", sortable: true, icon: "mdi-calendar-check" },
                    { text: "State", value: "currentState", sortable: true, icon: "mdi-flag" },
                    { text: "Change Action", value: "caNumber", sortable: false, component: "ChangeActionCell", componentProps: { field: "number" } },
                    { text: "CA State", value: "caState", sortable: false, component: "ChangeActionCell", componentProps: { field: "state" } }
                ],
                cas: [
                    { text: "CA Number", value: "caNumber", sortable: true, required: true, icon: "mdi-file-document" },
                    { text: "Description", value: "changeSummary", sortable: true, icon: "mdi-text" },
                    { text: "Resp Engr", value: "resEngr", sortable: true, icon: "mdi-account" },
                    { text: "Status", value: "currentState", sortable: true, icon: "mdi-flag" },
                    { text: "Target Complete Date", value: "targetReleaseDate", sortable: true, icon: "mdi-calendar-clock" },
                    { text: "Actual Approved Date", value: "approvedDate", sortable: true, icon: "mdi-calendar-check" },
                    { text: "Actual Complete Date", value: "actualReleaseDate", sortable: true, icon: "mdi-calendar-check" }
                ],
                crs: [
                    { text: "CR Number", value: "crNumber", sortable: true, required: true, icon: "mdi-file-document-outline" },
                    { text: "Description", value: "reasonforChange", sortable: true, icon: "mdi-format-title" },
                    { text: "Resp Engr", value: "owner", sortable: true, icon: "mdi-account" },
                    { text: "Status", value: "currentState", sortable: true, icon: "mdi-flag" },
                    { text: "Target Complete Date", value: "targetReleaseDate", sortable: true, icon: "mdi-calendar-plus" },
                    { text: "Actual Approve Date", value: "actualApproveDate", sortable: true, icon: "mdi-calendar-clock" },
                    { text: "Actual Complete Date", value: "actualReleaseDate", sortable: true, icon: "mdi-calendar-check" }
                ]
            },
            
            /**
             * ⚠️  IMPORTANT: When adding new data types to headerConfigurations above,
             * you MUST also update the mapItemToTableData() method below to handle the new type.
             * The field names returned by mapItemToTableData MUST match the "value" properties 
             * in the corresponding headerConfigurations entry.
             */
            
            // UI state
            loading: false,
            lastUpdated: new Date().toLocaleTimeString(),
            
            // Chart line visibility
            showTargetLine: true,
            showActualLine: true,
            
            // Release headliner filter
            selectedStatFilter: "all",
            
            // Chart refresh key to force chart updates
            chartKey: 0
        };
    },
    
    computed: {
        // Dynamic widget title based on current data type
        widgetTitle() {
            const titles = {
                parts: "Release Planning Parts Dashboard",
                cas: "Release Planning CA Dashboard", 
                crs: "Release Planning CR Dashboard"
            };
            
            return titles[this.currentDataType] || "Release Planning Dashboard";
        },

        // Dynamic table headers based on current data type and available data
        tableHeaders() {
            // Get base configuration for current data type
            const baseConfig = this.headerConfigurations[this.currentDataType] || [];
            
            if (!this.tableData || this.tableData.length === 0) {
                // Return only required headers when no data is available
                return baseConfig.filter(h => h.required);
            }

            // Get available fields from the actual data
            const availableFields = Object.keys(this.tableData[0]);
            
            // Filter headers based on available data fields
            const filteredHeaders = baseConfig.filter(headerConfig => {
                // Always include required headers
                if (headerConfig.required) return true;
                
                // Always include component-based headers (like ChangeActionCell)
                if (headerConfig.component) return true;
                
                // Include if the field exists in the data
                return availableFields.includes(headerConfig.value);
            });

            console.log("=== DYNAMIC HEADERS DEBUG ===");
            console.log("Current data type:", this.currentDataType);
            console.log("Available fields in data:", availableFields);
            console.log("Base config headers:", baseConfig.map(h => h.value));
            console.log("Filtered headers:", filteredHeaders.map(h => h.value));
            console.log("Final header count:", filteredHeaders.length);

            return filteredHeaders;
        },

        filterConfig() {
            return [
                {
                    type: "select",
                    key: "program",
                    label: "Program",
                    icon: "mdi-application",
                    value: this.filterValues.program,
                    options: this.programs,
                    clearable: true,
                    placeholder: "Select Program",
                    color: "primary"
                },
                {
                    type: "select", 
                    key: "phase",
                    label: "Phase",
                    icon: "mdi-timeline",
                    value: this.filterValues.phase,
                    options: this.phases,
                    clearable: true,
                    placeholder: "Select Phase",
                    color: "secondary"
                },
                {
                    type: "select",
                    key: "organization", 
                    label: "Organization",
                    icon: "mdi-domain",
                    value: this.filterValues.organization,
                    options: this.organizations,
                    clearable: false,
                    placeholder: "Select Organization",
                    color: "info"
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

        // Dynamic chart options based on current data type
        dynamicChartOptions() {
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

            const config = dataTypeConfig[this.currentDataType] || dataTypeConfig.parts;

            return {
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
                            text: config.yAxisTitle,
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
                                return "Release Date: " + context[0].label;
                            },
                            label(context) {
                                return `Total Released: ${context.parsed.y} ${config.tooltipLabel}`;
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
            };
        },

        // Filter table data based on current filters and selected stat filter  
        filteredTableData() {
            console.log("🔍 FILTEREDTABLEDATA DEBUG START");
            console.log("tableData length:", this.tableData?.length || 0);
            console.log("filterValues:", this.filterValues);
            console.log("selectedStatFilter:", this.selectedStatFilter);
            
            if (!this.tableData || this.tableData.length === 0) {
                console.log("❌ No tableData available");
                return [];
            }

            let filtered = [...this.tableData];
            console.log("Starting with", filtered.length, "items");

            // Apply filter values (program, phase, organization) - only if they would not eliminate all data
            if (this.filterValues.program && this.filterValues.program !== "") {
                const beforeCount = filtered.length;
                // Check if any items would match this filter before applying it
                const wouldMatch = filtered.some(item => 
                    item.program === this.filterValues.program ||
                    item.organization === this.filterValues.program
                );
                
                if (wouldMatch) {
                    filtered = filtered.filter(item => 
                        item.program === this.filterValues.program ||
                        item.organization === this.filterValues.program
                    );
                    console.log(`Program filter (${this.filterValues.program}): ${beforeCount} -> ${filtered.length}`);
                } else {
                    console.log(`⚠️ Skipping program filter - no items would match: ${this.filterValues.program}`);
                }
            }

            if (this.filterValues.phase && this.filterValues.phase !== "") {
                const beforeCount = filtered.length;
                // Check if any items would match this filter before applying it
                const wouldMatch = filtered.some(item => 
                    item.phase === this.filterValues.phase ||
                    item.currentState === this.filterValues.phase
                );
                
                if (wouldMatch) {
                    filtered = filtered.filter(item => 
                        item.phase === this.filterValues.phase ||
                        item.currentState === this.filterValues.phase
                    );
                    console.log(`Phase filter (${this.filterValues.phase}): ${beforeCount} -> ${filtered.length}`);
                } else {
                    console.log(`⚠️ Skipping phase filter - no items would match: ${this.filterValues.phase}`);
                }
            }

            if (this.filterValues.organization && this.filterValues.organization !== "All") {
                const beforeCount = filtered.length;
                filtered = filtered.filter(item => 
                    item.organization === this.filterValues.organization
                );
                console.log(`Organization filter (${this.filterValues.organization}): ${beforeCount} -> ${filtered.length}`);
            }

            // Apply statistical filter (released, thisWeek, nextWeek, etc.)
            if (this.selectedStatFilter && this.selectedStatFilter !== "all") {
                const beforeCount = filtered.length;
                filtered = this.applyStatFilter(filtered, this.selectedStatFilter);
                console.log(`Stat filter (${this.selectedStatFilter}): ${beforeCount} -> ${filtered.length}`);
            }

            console.log("🔍 FILTEREDTABLEDATA FINAL:", filtered.length, "items");
            if (filtered.length > 0) {
                console.log("Sample filtered item:", filtered[0]);
            }
            console.log("🔍 FILTEREDTABLEDATA DEBUG END");

            return filtered;
        },

        releaseStats() {
            if (!this.filteredTableData || this.filteredTableData.length === 0) {
                return null;
            }
            return this.computeStatsForArray(this.filteredTableData);
        },

        // Dynamic chart legend label based on data type  
        chartLegendLabel() {
            const labels = {
                parts: "Actual Parts Released",
                cas: "Actual CAs Released", 
                crs: "Actual CRs Released"
            };
            
            return labels[this.currentDataType] || "Actual Items Released";
        }
    },
    
    // Watch for changes that should trigger chart updates
    watch: {
        // Watch filtered data changes to automatically update chart
        filteredTableData: {
            handler(newData, oldData) {
                console.log("👀 WATCH: filteredTableData changed");
                console.log("  - Old data length:", oldData?.length || 0);
                console.log("  - New data length:", newData?.length || 0);
                console.log("  - selectedStatFilter:", this.selectedStatFilter);
                
                // Use nextTick to ensure DOM updates are complete
                this.$nextTick(() => {
                    this.updateChartFromFiltered();
                });
            },
            deep: true
        },
        
        // Watch selectedStatFilter changes
        selectedStatFilter: {
            handler(newFilter, oldFilter) {
                console.log("👀 WATCH: selectedStatFilter changed from", oldFilter, "to", newFilter);
                
                // Force chart update when stat filter changes
                this.$nextTick(() => {
                    this.updateChartFromFiltered();
                });
            }
        },
        
        // Watch currentDataType changes
        currentDataType: {
            handler(newType, oldType) {
                console.log(`👀 WATCH: Data type changed from ${oldType} to ${newType}`);
                this.$nextTick(() => {
                    this.updateChartFromFiltered();
                });
            }
        }
    },
    
    async mounted() {
        console.log("🚀 ReleasePlannerWidget mounted - initializing...");
        console.log("📊 Current data type:", this.currentDataType);
        console.log("🏷️  Widget title:", this.widgetTitle);
        console.log(" USE_MOCK_DATA:", USE_MOCK_DATA);
        
        // Initialize by fetching programs first
        await this.fetchPrograms();
    },
    
    methods: {
        /**
         * ⚠️  CRITICAL: DATA TYPE MAPPING FUNCTION
         * 
         * This function transforms raw API response items into the format expected by the table.
         * When you add a new data type to headerConfigurations above (in data section), you MUST 
         * add a corresponding case to this function.
         * 
         * RULES FOR MAINTAINING CONSISTENCY:
         * 1. The returned object keys MUST exactly match the "value" properties in headerConfigurations
         * 2. If headerConfigurations.newType has { value: "fieldName" }, then this function must return { fieldName: someValue }
         * 3. Test thoroughly after adding new data types to ensure table displays correctly
         * 
         * EXAMPLE: If you add a new "issues" data type with header { value: "issueTitle" },
         * then add a case that returns { issueTitle: item.title || item.summary }
         * 
         * 📍 See headerConfigurations in data() section (around line 431) for reference
         */
        mapItemToTableData(item) {
            console.log("🔄 Mapping item for data type:", this.currentDataType, "Item:", item);
            
            switch (this.currentDataType) {
                case "parts":
                    // Maps to headerConfigurations.parts - ensure field names match exactly
                    return {
                        partNo: item.partNumber || item.partNo,                    // matches "partNo" in headerConfigurations.parts
                        rev: item.revision || item.rev,                           // matches "rev" in headerConfigurations.parts  
                        description: item.description,                            // matches "description" in headerConfigurations.parts
                        organization: item.organization || "Unknown",             // matches "organization" in headerConfigurations.parts
                        tgtRelease: item.targetReleaseDate || item.tgtRelease,   // matches "tgtRelease" in headerConfigurations.parts
                        actualRelease: item.actualReleaseDate || item.actualRelease || "N/A", // matches "actualRelease" in headerConfigurations.parts
                        currentState: item.currentState || item.state,           // matches "currentState" in headerConfigurations.parts
                        physId: item.physId || item.id,                          // internal ID for CA lookups
                        // CA fields will be populated by ChangeActionCell component
                        caNumber: "",                                             // matches "caNumber" in headerConfigurations.parts
                        caState: ""                                               // matches "caState" in headerConfigurations.parts
                    };
                    
                case "cas":
                    // Maps to headerConfigurations.cas - ensure field names match exactly
                    return {
                        caNumber: item.caNumber || item.changeActionNumber,      // matches "caNumber" in headerConfigurations.cas
                        changeSummary: item.changeSummary || item.description,   // matches "changeSummary" in headerConfigurations.cas
                        resEngr: item.respEngr || item.responsibleEngineer,      // matches "resEngr" in headerConfigurations.cas
                        currentState: item.currentState || item.status,          // matches "currentState" in headerConfigurations.cas
                        targetReleaseDate: item.targetReleaseDate || item.targetCompleteDate, // matches "targetReleaseDate" in headerConfigurations.cas
                        approvedDate: item.approvedDate,                         // matches "approvedDate" in headerConfigurations.cas
                        actualReleaseDate: item.actualReleaseDate || item.actualCompleteDate, // matches "actualReleaseDate" in headerConfigurations.cas
                        organization: item.organization || "Unknown"             // for filtering purposes
                    };
                    
                case "crs":
                    // Maps to headerConfigurations.crs - ensure field names match exactly
                    return {
                        crNumber: item.crNumber || item.changeRequestNumber,     // matches "crNumber" in headerConfigurations.crs
                        reasonforChange: item.reasonforChange || item.name || item.summary || item.description, // matches "reasonforChange" in headerConfigurations.crs
                        owner: item.owner || item.respEngr || item.responsibleEngineer, // matches "owner" in headerConfigurations.crs
                        currentState: item.currentState || item.status,          // matches "currentState" in headerConfigurations.crs
                        targetReleaseDate: item.targetReleaseDate || item.dueDate, // matches "targetReleaseDate" in headerConfigurations.crs
                        actualApproveDate: item.actualApproveDate || item.approvedDate, // matches "actualApproveDate" in headerConfigurations.crs
                        actualReleaseDate: item.actualReleaseDate || item.completedDate // matches "actualReleaseDate" in headerConfigurations.crs
                    };
                    
                default:
                    console.warn("⚠️  Unknown data type for mapping:", this.currentDataType, "Available types:", Object.keys(this.headerConfigurations));
                    console.warn("⚠️  Add a new case to mapItemToTableData() for this data type!");
                    return item; // Return raw item as fallback
            }
        },

        // Chart legend toggle methods
        toggleTargetLine() {
            this.showTargetLine = !this.showTargetLine;
            this.chartKey += 1;
        },
        
        toggleActualLine() {
            this.showActualLine = !this.showActualLine;
            this.chartKey += 1;
        },
        
        // Handle filter changes from UniversalFilterControls
        handleFilterChange(filterEvent) {
            console.log("🔄 HANDLE FILTER CHANGE:");
            console.log("  - Filter key:", filterEvent.key);
            console.log("  - Filter value:", filterEvent.value);
            console.log("  - All filters:", filterEvent.allFilters);
            console.log("  - Previous filterValues:", JSON.stringify(this.filterValues));
            
            this.filterValues = { ...filterEvent.allFilters };
            
            console.log("  - New filterValues:", JSON.stringify(this.filterValues));
            
            // Handle specific filter logic
            if (filterEvent.key === "program") {
                console.log("🔄 Program changed, fetching phases...");
                this.onProgramChange();
            } else if (filterEvent.key === "phase") {
                console.log("🔄 Phase changed, fetching data...");
                this.handlePhaseChange();
            } else if (filterEvent.key === "organization") {
                console.log("🔄 Organization changed, updating chart...");
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

        // Fetch programs from API
        async fetchPrograms() {
            try {
                const programs = await dataService.fetchPrograms();
                this.programs = programs || [];
                console.log("✅ Programs loaded:", this.programs.length);

                if (this.programs.includes("CX300 Pre-Production Builds")) {
                    this.filterValues.program = "CX300 Pre-Production Builds";
                } else if (this.programs.length > 0) {
                    this.filterValues.program = this.programs[0];
                }

                if (this.filterValues.program) {
                    await this.fetchPhases();
                }
            } catch (err) {
                console.error("Failed to fetch programs:", err.message);
                this.programs = [];
                this.filterValues.program = "";
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
                console.log("✅ Phases loaded:", this.phases.length);

                if (this.phases.length > 0) {
                    this.filterValues.phase = this.phases[0];
                    await this.fetchData(this.filterValues.phase);
                } else {
                    console.warn("No phases returned from API");
                    this.phases = [];
                    this.filterValues.phase = "";
                    this.updateChartFromFiltered();
                }
            } catch (error) {
                console.error("Failed to fetch phases:", error.message);
                this.phases = [];
                this.filterValues.phase = "";
                this.updateChartFromFiltered();
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
                console.log("Current data type:", this.currentDataType);
                console.log("🔥 CRITICAL: About to call fetchItems with itemType:", this.currentDataType);
                console.log("USE_MOCK_DATA flag:", USE_MOCK_DATA);
                
                // Use the generic fetchItems method with the current data type
                const items = await dataService.fetchItems(phase, this.currentDataType);
                
                console.log("=== RAW API RESPONSE ===");
                console.log("Type of items:", typeof items);
                console.log("Is Array:", Array.isArray(items));
                console.log("Items length:", items?.length);
                console.log("Raw items data:", items);
                
                // Use the original simple processing logic that was working
                let finalParts = items;
                
                // Convert to array if needed using the original logic
                if (!Array.isArray(items) && typeof items === "object" && items !== null) {
                    console.log("🔄 Converting non-array response to array using enhanced logic");
                    
                    // Try different common property names based on data type
                    const dataTypeKeys = {
                        parts: ["parts", "data", "items", "results"],
                        cas: ["CAs", "cas", "parts", "data", "items", "results"], // API returns "CAs" (capital)
                        crs: ["CRs", "crs", "parts", "data", "items", "results"] // API likely returns "CRs" (capital)
                    };
                    
                    const keysToTry = dataTypeKeys[this.currentDataType] || dataTypeKeys.parts;
                    console.log("🔍 Trying keys for", this.currentDataType, ":", keysToTry);
                    console.log("🔍 Available keys in response:", Object.keys(items));
                    
                    for (const key of keysToTry) {
                        if (items[key] && Array.isArray(items[key])) {
                            finalParts = items[key];
                            console.log(`✅ Using items.${key} (${finalParts.length} items)`);
                            break;
                        }
                    }
                    
                    if (!Array.isArray(finalParts)) {
                        console.log("❌ Could not find array in response, using empty array");
                        finalParts = [];
                    }
                }
                
                // Use data mapping logic based on the current data type
                this.tableData = Array.isArray(finalParts)
                    ? finalParts.map(item => this.mapItemToTableData(item))
                    : [];
                
                console.log("=== FINAL TABLE DATA ===");
                console.log("Final tableData array length:", this.tableData.length);
                if (this.tableData.length > 0) {
                    console.log("Sample mapped item:", this.tableData[0]);
                    console.log("Sample mapped item keys:", Object.keys(this.tableData[0]));
                } else {
                    console.log("❌ No items in tableData after mapping");
                }
                console.log("=== FETCHDATA END ===");

                // Update organizations from the actual parts data
                const orgSet = new Set(this.tableData.map(r => r.organization).filter(org => org && org !== "Unknown"));
                this.organizations = ["All", ...Array.from(orgSet).sort()];
                console.log("✅ Organizations updated from data:", this.organizations);

                // Update chart data from the filtered table data
                this.updateChartFromFiltered();

            } catch (error) {
                console.error("Error fetching data:", {
                    message: error.message,
                    phase,
                    currentDataType: this.currentDataType,
                    fullError: error
                });
                
                // Clear data when API fails - no fallback data
                console.log("Clearing data due to API failure");
                this.tableData = [];
                this.organizations = ["All"];
                this.updateChartFromFiltered();
            } finally {
                this.loading = false;
                this.lastUpdated = new Date().toLocaleTimeString();
            }
        },

        // Dynamically set the data type based on API response or user selection
        setDataType(dataType) {
            if (this.headerConfigurations[dataType]) {
                this.currentDataType = dataType;
                console.log(`✅ Data type set to: ${dataType}`);
                console.log(`✅ Widget title will automatically update to: ${this.widgetTitle}`);
            } else {
                console.warn(`⚠️  Unknown data type: ${dataType}. Available types:`, Object.keys(this.headerConfigurations));
            }
        },

        // Method to manually switch data types for testing
        switchDataType(newDataType) {
            console.log("🔄 DEBUG: Switching data type from", this.currentDataType, "to", newDataType);
            
            if (this.headerConfigurations[newDataType]) {
                this.setDataType(newDataType);
                
                // Clear existing data to show the change
                this.tableData = [];
                
                // Re-fetch data with the new type
                if (this.filterValues.phase) {
                    console.log("🔄 DEBUG: Re-fetching data for phase:", this.filterValues.phase, "with type:", newDataType);
                    this.fetchData(this.filterValues.phase);
                } else {
                    console.warn("⚠️  DEBUG: No phase selected, cannot fetch data");
                }
            } else {
                console.error("❌ DEBUG: Invalid data type:", newDataType);
            }
        },

        // Get available data types
        getAvailableDataTypes() {
            return Object.keys(this.headerConfigurations);
        },

        /**
         * Refresh data - re-fetch current data with current filters
         */
        refreshData() {
            console.log("🔄 Refreshing data...");
            if (this.filterValues.phase) {
                this.fetchData(this.filterValues.phase);
            } else {
                console.warn("⚠️  No phase selected for refresh");
            }
        },

        /**
         * Filter table data by release status
         */
        filterByReleaseStatus(statusFilter) {
            console.log("🔍 Filtering by release status:", statusFilter);
            console.log("🔍 Previous selectedStatFilter:", this.selectedStatFilter);
            console.log("🔍 Previous filteredTableData length:", this.filteredTableData.length);
            
            this.selectedStatFilter = statusFilter;
            
            // The filteredTableData computed property will automatically update
            // based on the selectedStatFilter value
            
            // Force immediate chart update after filter change
            this.$nextTick(() => {
                console.log("🔍 After filter change - new filteredTableData length:", this.filteredTableData.length);
                this.updateChartFromFiltered();
            });
        },

        /**
         * Handle table row click events
         */
        handleRowClick(item) {
            console.log("🖱️  Row clicked:", item);
            // You can add custom logic here for row selection, detail views, etc.
            // For now, just log the clicked item
        },

        /**
         * Get display name for filter type
         */
        getFilterDisplayName(filterType) {
            const displayNames = {
                all: "Items",
                released: "Released",
                thisWeek: "This Week",
                nextWeek: "Next Week",
                overdue: "Overdue",
                next30Days: "Next 30 Days"
            };
            return displayNames[filterType] || "Items";
        },

        /**
         * Extract and validate date from item based on data type
         */
        extractTargetDate(item) {
            let targetDate = null;
            switch (this.currentDataType) {
                case "parts":
                    targetDate = item.tgtRelease || item.targetReleaseDate;
                    break;
                case "cas":
                    targetDate = item.targetReleaseDate;
                    break;
                case "crs":
                    targetDate = item.dueDate;
                    break;
                default:
                    targetDate = item.tgtRelease || item.targetReleaseDate || item.dueDate;
            }
            return this.validateDate(targetDate);
        },

        /**
         * Extract and validate actual date from item based on data type
         */
        extractActualDate(item) {
            let actualDate = null;
            switch (this.currentDataType) {
                case "parts":
                    actualDate = item.actualRelease || item.actualReleaseDate;
                    break;
                case "cas":
                    actualDate = item.actualReleaseDate;
                    break;
                case "crs":
                    actualDate = item.completedDate;
                    break;
                default:
                    actualDate = item.actualRelease || item.actualReleaseDate || item.completedDate;
            }
            return this.validateDate(actualDate);
        },

        /**
         * Validate and parse date string
         */
        validateDate(dateStr) {
            if (!dateStr || dateStr === "N/A" || dateStr === null || dateStr === "") {
                return null;
            }
            try {
                const dateObj = new Date(dateStr);
                return !isNaN(dateObj.getTime()) ? dateObj : null;
            } catch (error) {
                console.warn("Invalid date format:", dateStr);
                return null;
            }
        },

        /**
         * Simplified chart data building
         */
        buildChartData() {
            const targetDates = [];
            const actualDates = [];
            
            // Process each item to extract dates
            this.filteredTableData.forEach(item => {
                const targetDate = this.extractTargetDate(item);
                const actualDate = this.extractActualDate(item);
                
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

            return { targetDates, actualDates };
        },

        /**
         * Create dataset for chart using unified timeline
         */
        createDataset(dates, label, color, backgroundColor, unifiedTimeline) {
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

            return {
                label,
                data: cumulativeData,
                borderColor: color,
                backgroundColor,
                tension: 0.2,
                fill: false,
                pointRadius: 4,
                pointHoverRadius: 6,
                borderWidth: 3
            };
        },
        /**
         * Update chart data from filtered table data - SIMPLIFIED VERSION
         */
        updateChartFromFiltered() {
            console.log("🔄 Updating chart from filtered data...");
            console.log("🔍 CHART UPDATE DEBUG:");
            console.log("  - filteredTableData length:", this.filteredTableData?.length || 0);
            console.log("  - selectedStatFilter:", this.selectedStatFilter);
            console.log("  - currentDataType:", this.currentDataType);
            
            if (!this.filteredTableData || this.filteredTableData.length === 0) {
                console.log("❌ No filtered data available, setting empty chart");
                this.chartData = { labels: [], datasets: [] };
                this.chartKey += 1;
                return;
            }

            // Use simplified helper methods
            const { targetDates, actualDates } = this.buildChartData();
            
            console.log("📊 Chart Data Collection Summary:");
            console.log("  - Target dates found:", targetDates.length);
            console.log("  - Actual dates found:", actualDates.length);
            
            const SAMPLE_SIZE = 3;
            console.log("  - Sample target dates:", targetDates.slice(0, SAMPLE_SIZE).map(d => ({ date: d.dateString, item: d.item.partNo || d.item.caNumber || d.item.crNumber })));
            console.log("  - Sample actual dates:", actualDates.slice(0, SAMPLE_SIZE).map(d => ({ date: d.dateString, item: d.item.partNo || d.item.caNumber || d.item.crNumber })));

            if (targetDates.length === 0 && actualDates.length === 0) {
                console.log("❌ No valid release dates found in filtered data");
                this.chartData = { labels: [], datasets: [] };
                this.chartKey += 1;
                return;
            }

            // Create combined timeline and datasets
            const allDates = new Set();
            targetDates.forEach(item => allDates.add(item.dateString));
            actualDates.forEach(item => allDates.add(item.dateString));
            const sortedDates = Array.from(allDates).sort((a, b) => new Date(a) - new Date(b));
            
            console.log("📅 Unified timeline:", sortedDates);

            // Get dynamic labels
            const dataTypeLabels = {
                parts: { target: "Target Parts Release", actual: "Actual Parts Released" },
                cas: { target: "Target CAs Release", actual: "Actual CAs Released" },
                crs: { target: "Target CRs Release", actual: "Actual CRs Released" }
            };
            const labels = dataTypeLabels[this.currentDataType] || { target: "Target Items", actual: "Actual Items" };

            // Build datasets using the unified timeline
            const datasets = [];
            
            if (targetDates.length > 0 && this.showTargetLine) {
                const targetDataset = this.createDataset(targetDates, labels.target, "#1976d2", "rgba(25, 118, 210, 0.1)", sortedDates);
                datasets.push(targetDataset);
            }
            
            if (actualDates.length > 0 && this.showActualLine) {
                const actualDataset = this.createDataset(actualDates, labels.actual, "#4caf50", "rgba(76, 175, 80, 0.1)", sortedDates);
                datasets.push(actualDataset);
            }

            // Update chart
            this.chartData = { labels: sortedDates, datasets };
            this.chartKey += 1;

            console.log("✅ Chart data updated:", {
                totalLabels: sortedDates.length,
                datasets: datasets.length,
                chartKey: this.chartKey
            });
        },

        /**
         * Apply statistical filter to data array
         */
        applyStatFilter(dataArray, filterType) {
            const currentDate = new Date();
            currentDate.setHours(0, 0, 0, 0);
            const currentMs = currentDate.getTime();
            
            switch (filterType) {
                case "released":
                    return dataArray.filter(item => item.currentState === "RELEASED");
                    
                case "thisWeek": {
                    const [startOfWeek, endOfWeek] = this.getCurrentWeekRange(currentDate);
                    return dataArray.filter(item => {
                        const tgt = new Date(item.tgtRelease || item.targetReleaseDate);
                        tgt.setHours(0, 0, 0, 0);
                        const tgtMs = tgt.getTime();
                        return tgtMs >= startOfWeek && tgtMs <= endOfWeek;
                    });
                }
                    
                case "nextWeek": {
                    const [startNextWeek, endNextWeek] = this.getNextWeekRange(currentDate);
                    return dataArray.filter(item => {
                        const tgt = new Date(item.tgtRelease || item.targetReleaseDate);
                        tgt.setHours(0, 0, 0, 0);
                        const tgtMs = tgt.getTime();
                        return tgtMs >= startNextWeek && tgtMs <= endNextWeek;
                    });
                }
                    
                case "overdue":
                    return dataArray.filter(item => {
                        const tgt = new Date(item.tgtRelease || item.targetReleaseDate);
                        tgt.setHours(0, 0, 0, 0);
                        return tgt.getTime() < currentMs && item.currentState !== "RELEASED";
                    });
                    
                case "next30Days": {
                    const DAYS_IN_30 = 30;
                    const next30 = new Date(currentDate);
                    next30.setDate(next30.getDate() + DAYS_IN_30);
                    const next30Ms = next30.getTime();
                    
                    return dataArray.filter(item => {
                        const tgt = new Date(item.tgtRelease || item.targetReleaseDate);
                        tgt.setHours(0, 0, 0, 0);
                        const tgtMs = tgt.getTime();
                        return tgtMs >= currentMs && tgtMs <= next30Ms;
                    });
                }
                    
                case "all":
                default:
                    return dataArray;
            }
        },

        /**
         * Handle CA number loaded event from ChangeActionCell component
         */
        onCaNumberLoaded(caData) {
            console.log("📝 CA data loaded:", caData);
            // Find the corresponding row and update the CA data
            const rowIndex = this.tableData.findIndex(row => row.physId === caData.objectId);
            if (rowIndex !== -1) {
                this.$set(this.tableData[rowIndex], "caNumber", caData.caNumber);
                this.$set(this.tableData[rowIndex], "caState", caData.caState);
            }
        }
    }
};
</script>