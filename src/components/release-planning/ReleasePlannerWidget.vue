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
                        <div class="chart-container" style="position: relative; height: 360px; width: 100%;">
                            <!-- Debug info -->
                            <div v-if="chartData" style="font-size: 12px; color: #666; margin-bottom: 10px;">
                                🐛 Debug: Labels: {{ chartData.labels?.length || 0 }}, Datasets: {{ chartData.datasets?.length || 0 }}
                            </div>
                            <ReleaseChart
                                v-if="chartData.labels && chartData.labels.length > 0"
                                ref="lineChart"
                                :chart-data="chartData"
                                :chart-options="dynamicChartOptions"
                                style="height: 360px; width: 100%;"
                            />
                            <div v-if="!chartData.labels || chartData.labels.length === 0" class="no-chart-data">
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
import ReleaseChart from "@/components/charts/ReleaseChart.vue";
import UniversalFilterControls from "@/components/universal/UniversalFilterControls.vue";
import ChangeActionCell from "@/components/release-planning/ChangeActionCell.vue";
import dataService from "@/data/DataServiceBase.js";
import filterService from "@/services/FilterService.js";
import chartDataService from "@/services/ChartDataService.js";
import dataTransformationService from "@/services/DataTransformationService.js";
import exportService from "@/services/ExportService.js";
import { USE_MOCK_DATA } from "@/assets/config/app-data.json";

export default {
    name: "EnhancedPartsPlannerWidget",
    components: {
        ReleaseChart,
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
        // Dynamic widget title based on current data type using DataTransformationService
        widgetTitle() {
            return dataTransformationService.getDataTypeTitle(this.currentDataType);
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

        // Filter configuration using FilterService
        filterConfig() {
            return filterService.createFilterConfig({
                programs: this.programs,
                phases: this.phases,
                organizations: this.organizations,
                filterValues: this.filterValues
            });
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

        // Dynamic chart options using ChartDataService
        dynamicChartOptions() {
            return chartDataService.createChartOptions(this.currentDataType);
        },

        // Filter table data using FilterService
        filteredTableData() {
            return filterService.applyAllFilters(
                this.tableData,
                this.filterValues,
                this.selectedStatFilter
            );
        },

        // Release statistics using FilterService
        releaseStats() {
            return filterService.computeStatistics(this.filteredTableData);
        },

        // Dynamic chart legend label using ChartDataService
        chartLegendLabel() {
            return chartDataService.getChartLegendLabel(this.currentDataType);
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
        /**
         * Map raw API item to standardized table data format using DataTransformationService
         * 
         * This method delegates to DataTransformationService for consistent data transformation
         * across different data types (parts, cas, crs).
         */
        mapItemToTableData(item) {
            return dataTransformationService.mapItemToTableData(item, this.currentDataType);
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
         * Export table data in the specified format using ExportService
         */
        exportTableData(format) {
            const options = {
                fileName: `${this.currentDataType}-table`,
                documentTitle: `${this.widgetTitle} Export`
            };
            
            exportService.exportTableData(
                format, 
                this.filteredTableData, 
                this.tableHeaders, 
                options
            );
        },

        // ===== EXPORT LOGIC MOVED TO ExportService =====
        // The following export methods have been moved to ExportService:
        // - downloadAsCSV() -> exportService.downloadAsCSV()
        // - convertTableToCSV() -> exportService.convertTableToCSV()
        // - exportAsPDF() -> exportService.exportAsPDF()
        // - createTablePDFHTML() -> exportService.createTablePDFHTML()
        // - downloadPDFContent() -> exportService.downloadPDFContent()

        // ===== FILTERING LOGIC MOVED TO FilterService =====
        // The following methods have been moved to FilterService:
        // - computeStatsForArray() -> filterService.computeStatistics()
        // - getCurrentWeekRange() -> filterService.getCurrentWeekRange()
        // - getNextWeekRange() -> filterService.getNextWeekRange()
        // - applyStatFilter() -> filterService.applyStatisticalFilter()

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
                
                // Use DataTransformationService to process API response and transform data
                this.tableData = dataTransformationService.transformApiResponseToTableData(items, this.currentDataType);
                
                console.log("=== FINAL TABLE DATA ===");
                console.log("Final tableData array length:", this.tableData.length);
                if (this.tableData.length > 0) {
                    console.log("Sample mapped item:", this.tableData[0]);
                    console.log("Sample mapped item keys:", Object.keys(this.tableData[0]));
                } else {
                    console.log("❌ No items in tableData after mapping");
                }
                console.log("=== FETCHDATA END ===");

                // Update organizations from the actual parts data using DataTransformationService
                this.organizations = dataTransformationService.extractOrganizations(this.tableData);
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

        // Dynamically set the data type using DataTransformationService validation
        setDataType(dataType) {
            const validation = dataTransformationService.validateDataType(dataType);
            if (validation.isValid) {
                this.currentDataType = dataType;
                console.log(`✅ Data type set to: ${dataType}`);
                console.log(`✅ Widget title will automatically update to: ${this.widgetTitle}`);
            } else {
                console.warn(validation.message);
            }
        },

        // Method to manually switch data types for testing using DataTransformationService
        switchDataType(newDataType) {
            console.log("🔄 DEBUG: Switching data type from", this.currentDataType, "to", newDataType);
            
            const validation = dataTransformationService.validateDataType(newDataType);
            if (validation.isValid) {
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
                console.error("❌ DEBUG:", validation.message);
            }
        },

        // Get available data types using DataTransformationService
        getAvailableDataTypes() {
            return dataTransformationService.getAvailableDataTypes();
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
         * Get display name for filter type using FilterService
         */
        getFilterDisplayName(filterType) {
            return filterService.getFilterDisplayName(filterType);
        },

        /**
         * Extract and validate date from item using ChartDataService
         */
        extractTargetDate(item) {
            return chartDataService.extractTargetDate(item, this.currentDataType);
        },

        /**
         * Extract and validate actual date from item using ChartDataService
         */
        extractActualDate(item) {
            return chartDataService.extractActualDate(item, this.currentDataType);
        },

        /**
         * Validate and parse date string using ChartDataService
         */
        validateDate(dateStr) {
            return chartDataService.validateDate(dateStr);
        },

        /**
         * Build chart data using ChartDataService
         */
        buildChartData() {
            return chartDataService.buildChartData(this.filteredTableData, this.currentDataType);
        },

        /**
         * Create dataset for chart using ChartDataService
         */
        createDataset(dates, label, colorType, unifiedTimeline) {
            return chartDataService.createDataset(dates, label, colorType, unifiedTimeline);
        },
        /**
         * Update chart data from filtered table data using ChartDataService
         */
        updateChartFromFiltered() {
            console.log("🔄 Updating chart from filtered data using ChartDataService...");
            
            // Use ChartDataService to create complete chart data
            this.chartData = chartDataService.createChartData(
                this.filteredTableData,
                this.currentDataType,
                {
                    showTargetLine: this.showTargetLine,
                    showActualLine: this.showActualLine
                }
            );

            // Force chart update
            this.chartKey += 1;

            console.log("✅ Chart updated with ChartDataService:", {
                totalLabels: this.chartData.labels?.length || 0,
                datasets: this.chartData.datasets?.length || 0,
                chartKey: this.chartKey
            });
        },

        // ===== CHART PROCESSING LOGIC MOVED TO ChartDataService =====
        // The following chart processing logic has been moved to ChartDataService:
        // - Date extraction and validation (extractTargetDate, extractActualDate, validateDate)
        // - Chart data building (buildChartData)
        // - Dataset creation (createDataset) 
        // - Chart options configuration (dynamicChartOptions)
        // - Chart legend labels (chartLegendLabel)
        // - Unified timeline creation and chart data processing

        /**
         * Handle CA number loaded event from ChangeActionCell component using DataTransformationService
         */
        onCaNumberLoaded(caData) {
            console.log("📝 CA data loaded:", caData);
            // Find the corresponding row and update the CA data using DataTransformationService
            const rowIndex = this.tableData.findIndex(row => row.physId === caData.objectId);
            if (rowIndex !== -1) {
                const updatedItem = dataTransformationService.updateCaData(this.tableData[rowIndex], caData);
                this.$set(this.tableData, rowIndex, updatedItem);
            }
        }
    }
};
</script>