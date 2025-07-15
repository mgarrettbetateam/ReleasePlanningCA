<!-- Release Planning Widget - Self-contained with prominent filter dropdowns -->
 
<template>
    <div class="enhanced-parts-planner">
        <!-- Filter Flyout Panel -->
        <v-navigation-drawer
            v-model="showFilterFlyout"
            temporary
            left
            width="400"
            class="filter-flyout-panel"
            app
        >
            <div class="flyout-header">
                <v-icon left color="primary">mdi-filter-variant</v-icon>
                <span class="flyout-title">Filters</span>
                <v-spacer />
                <v-chip 
                    color="primary" 
                    x-small
                    outlined
                    class="filter-chip"
                >
                    {{ activeFilterCount }} Active
                </v-chip>
            </div>

            <v-divider />

            <div class="flyout-content-scrollable">
                <!-- Filter Controls Grid -->
                <div class="filter-section">
                    <div class="section-label">
                        <v-icon small color="primary" class="mr-2">mdi-tune</v-icon>
                        Data Filters
                    </div>
                    
                    <div 
                        v-for="filter in filterConfig"
                        :key="filter.key"
                        class="filter-item-vertical"
                    >
                        <label class="filter-label-vertical">
                            <v-icon small class="mr-1">{{ filter.icon }}</v-icon>
                            {{ filter.label }}
                        </label>
                        <v-select
                            :value="filterValues[filter.key]"
                            :items="filter.options"
                            :placeholder="filter.placeholder"
                            dense
                            outlined
                            hide-details
                            clearable
                            class="filter-select-vertical mb-3"
                            @change="handleFilterChange({ key: filter.key, value: $event, allFilters: { ...filterValues, [filter.key]: $event } })"
                        />
                    </div>
                </div>

                <v-divider class="my-4" />

                <!-- Data Type Switcher -->
                <div class="filter-section">
                    <div class="section-label">
                        <v-icon small color="primary" class="mr-2">mdi-database</v-icon>
                        Data Type
                    </div>
                    
                    <v-chip-group 
                        v-model="currentDataType" 
                        mandatory 
                        column
                        class="data-type-switcher-vertical"
                    >
                        <v-chip
                            v-for="dataType in getAvailableDataTypes()"
                            :key="dataType"
                            :value="dataType"
                            small
                            block
                            class="mb-2"
                            @click="switchDataType(dataType)"
                        >
                            <v-icon small left>mdi-table</v-icon>
                            {{ dataType.toUpperCase() }}
                        </v-chip>
                    </v-chip-group>
                </div>

                <v-divider class="my-4" />

                <!-- Release Stats -->
                <div v-if="releaseStats" class="filter-section">
                    <div class="section-label">
                        <v-icon small color="primary" class="mr-2">mdi-chart-bar</v-icon>
                        Release Stats
                    </div>
                    
                    <div class="stats-vertical-layout">
                        <div 
                            v-for="stat in releaseStatsArray"
                            :key="stat.key"
                            class="stat-item-vertical"
                            :class="{ 
                                'stat-active': selectedStatFilter === stat.key,
                                'stat-disabled': stat.count === 0,
                                'stat-overdue': stat.key === 'overdue'
                            }"
                            @click="stat.count > 0 ? filterByReleaseStatus(stat.key) : null"
                        >
                            <div class="stat-content">
                                <span class="stat-number-vertical">{{ stat.count }}</span>
                                <span class="stat-label-vertical">{{ stat.label }}</span>
                            </div>
                            <v-icon 
                                v-if="selectedStatFilter === stat.key"
                                small 
                                color="primary"
                                class="stat-check"
                            >
                                mdi-check
                            </v-icon>
                        </div>
                        
                        <!-- Clear filter -->
                        <v-btn
                            v-if="selectedStatFilter !== 'all'"
                            outlined
                            small
                            color="primary"
                            block
                            class="mt-3"
                            @click="filterByReleaseStatus('all')"
                        >
                            <v-icon small left>mdi-filter-off</v-icon>
                            Clear Filter
                        </v-btn>
                    </div>
                </div>

                <!-- Scroll indicator at bottom -->
                <div class="scroll-indicator">
                    <v-icon small color="grey">mdi-chevron-down</v-icon>
                    <span class="scroll-text">Scroll for more options</span>
                </div>
            </div>
        </v-navigation-drawer>

        <!-- Header with Title and Discrete Filter Button -->
        <v-card-title class="planner-header">
            <v-icon left color="primary">mdi-clipboard-list</v-icon>
            {{ widgetTitle }}
            <v-spacer />
            
            <!-- Discrete Filter Button in Header -->
            <v-btn
                small
                outlined
                color="white"
                class="filter-flyout-trigger-header mr-3"
                @click="showFilterFlyout = !showFilterFlyout"
            >
                <v-icon small left>{{ showFilterFlyout ? 'mdi-close' : 'mdi-filter-variant' }}</v-icon>
                {{ showFilterFlyout ? 'Close' : 'Filters' }}
            </v-btn>
            
            <v-chip 
                :color="apiEnvironmentChip.color" 
                small
                outlined
            >
                <v-icon small left>{{ apiEnvironmentChip.icon }}</v-icon>
                {{ apiEnvironmentChip.text }}
            </v-chip>
        </v-card-title>

        <!-- Full Width Vertical Layout: Chart Above Table -->
        <div class="content-section-vertical">
            <!-- Chart - Full Width Above -->
            <v-card class="chart-card mb-4" elevation="4">
                <v-card-title class="chart-header pa-3">
                    <v-icon left color="primary">mdi-chart-line</v-icon>
                    <span class="text-h6">Release Timeline</span>
                    <v-spacer />
                    <!-- Legend inline in header -->
                    <div class="legend-inline">
                        <v-chip 
                            small 
                            :color="showTargetLine ? 'primary' : 'grey'"
                            class="mr-1"
                            @click="toggleTargetLine"
                        >
                            <v-icon small left>{{ showTargetLine ? 'mdi-eye' : 'mdi-eye-off' }}</v-icon>
                            Target
                        </v-chip>
                        <v-chip 
                            small 
                            :color="showActualLine ? 'success' : 'grey'"
                            @click="toggleActualLine"
                        >
                            <v-icon small left>{{ showActualLine ? 'mdi-eye' : 'mdi-eye-off' }}</v-icon>
                            Actual
                        </v-chip>
                    </div>
                </v-card-title>
                
                <v-card-text class="pa-2">
                    <div style="height: 400px; width: 100%;">
                        <ReleaseChart
                            v-if="chartData.labels?.length > 0"
                            ref="lineChart"
                            :chart-data="chartData"
                            :chart-options="dynamicChartOptions"
                            style="height: 100%; width: 100%;"
                        />
                        <div v-else class="no-chart-data d-flex flex-column align-center justify-center" style="height: 100%;">
                            <v-icon size="64" color="grey lighten-2">mdi-chart-line-variant</v-icon>
                            <h4 class="mt-4">No Chart Data</h4>
                            <p class="text-center mt-2">Use the filter panel to select data</p>
                            <v-btn
                                color="primary"
                                outlined
                                small
                                class="mt-3"
                                @click="showFilterFlyout = true"
                            >
                                <v-icon small left>mdi-filter-variant</v-icon>
                                Open Filters
                            </v-btn>
                        </div>
                    </div>
                </v-card-text>
            </v-card>
            
            <!-- Table - Full Width Below -->
            <v-card class="table-card">
                <v-card-title class="table-header pa-3">
                    <v-icon left>mdi-table</v-icon>
                    <span class="text-h6">{{ currentDataType.toUpperCase() }} Data</span>
                    <v-spacer />
                    <v-chip small color="success" outlined class="mr-2">
                        {{ filteredTableData.length }} Items
                    </v-chip>
                    <!-- Export menu -->
                    <v-menu v-if="filteredTableData.length > 0" bottom left>
                        <template #activator="{ on, attrs }">
                            <v-btn icon small v-bind="attrs" v-on="on">
                                <v-icon>mdi-download</v-icon>
                            </v-btn>
                        </template>
                        <v-list>
                            <v-list-item @click="exportTableData('pdf')">
                                <v-list-item-icon><v-icon>mdi-file-pdf-box</v-icon></v-list-item-icon>
                                <v-list-item-title>Export as PDF</v-list-item-title>
                            </v-list-item>
                            <v-list-item @click="exportTableData('csv')">
                                <v-list-item-icon><v-icon>mdi-file-delimited</v-icon></v-list-item-icon>
                                <v-list-item-title>Export as CSV</v-list-item-title>
                            </v-list-item>
                        </v-list>
                    </v-menu>
                </v-card-title>
                
                <v-card-text class="pa-0">
                    <div style="height: 500px; overflow-y: auto;">
                        <v-data-table
                            v-if="filteredTableData.length > 0"
                            :headers="tableHeaders"
                            :items="filteredTableData"
                            :loading="loading"
                            dense
                            :height="500"
                            fixed-header
                            :items-per-page="20"
                            hide-default-footer
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
                        <div v-else class="no-data-message d-flex flex-column align-center justify-center" style="height: 100%;">
                            <v-icon size="48" color="grey">mdi-table-off</v-icon>
                            <p class="mt-4">No table data available</p>
                            <p class="caption">Use the filter panel to select data</p>
                            <v-btn
                                color="primary"
                                outlined
                                small
                                class="mt-3"
                                @click="showFilterFlyout = true"
                            >
                                <v-icon small left>mdi-filter-variant</v-icon>
                                Open Filters
                            </v-btn>
                        </div>
                    </div>
                </v-card-text>
            </v-card>
        </div>
    </div>
</template>

<style scoped>
/* Filter Flyout Styles */
.filter-flyout-trigger-header {
  border-color: rgba(255, 255, 255, 0.5) !important;
  color: white !important;
  backdrop-filter: blur(4px);
  background-color: rgba(255, 255, 255, 0.1) !important;
  transition: all 0.2s ease;
}

.filter-flyout-trigger-header:hover {
  background-color: rgba(255, 255, 255, 0.2) !important;
  border-color: rgba(255, 255, 255, 0.8) !important;
  transform: translateY(-1px);
}

.filter-flyout-panel {
  z-index: 1000 !important;
}

.flyout-header {
  display: flex;
  align-items: center;
  padding: 16px 20px;
  background: linear-gradient(135deg, #1976d2 0%, #1565c0 100%);
  color: white;
}

.flyout-title {
  font-size: 18px;
  font-weight: 600;
  letter-spacing: 0.5px;
}

.flyout-content {
  padding: 20px;
  height: calc(100vh - 120px);
  overflow-y: auto;
}

.flyout-content-scrollable {
  padding: 20px;
  height: calc(100vh - 120px);
  overflow-y: auto;
  overflow-x: hidden;
  scroll-behavior: smooth;
  /* Custom scrollbar styling */
  scrollbar-width: thin;
  scrollbar-color: rgba(25, 118, 210, 0.3) transparent;
}

/* Webkit scrollbar styling */
.flyout-content-scrollable::-webkit-scrollbar {
  width: 6px;
}

.flyout-content-scrollable::-webkit-scrollbar-track {
  background: transparent;
}

.flyout-content-scrollable::-webkit-scrollbar-thumb {
  background-color: rgba(25, 118, 210, 0.3);
  border-radius: 3px;
  transition: background-color 0.2s ease;
}

.flyout-content-scrollable::-webkit-scrollbar-thumb:hover {
  background-color: rgba(25, 118, 210, 0.5);
}

.scroll-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px 0 20px 0;
  margin-top: 20px;
  opacity: 0.6;
  border-top: 1px solid #e0e0e0;
}

.scroll-text {
  font-size: 12px;
  color: #666;
  margin-left: 4px;
  font-style: italic;
}

.filter-section {
  margin-bottom: 24px;
}

.section-label {
  font-size: 14px;
  font-weight: 600;
  color: #1976d2;
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.filter-item-vertical {
  margin-bottom: 16px;
}

.filter-label-vertical {
  font-size: 12px;
  font-weight: 600;
  color: #666;
  margin-bottom: 6px;
  display: flex;
  align-items: center;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.filter-select-vertical {
  width: 100%;
}

.data-type-switcher-vertical {
  margin: 0 !important;
}

.stats-vertical-layout {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.stat-item-vertical {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid #e0e0e0;
  background-color: #fafafa;
}

.stat-item-vertical:hover {
  background-color: rgba(25, 118, 210, 0.05);
  border-color: #1976d2;
  transform: translateX(4px);
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.stat-item-vertical.stat-active {
  background-color: rgba(25, 118, 210, 0.1);
  border-color: #1976d2;
  box-shadow: 0 2px 12px rgba(25, 118, 210, 0.2);
}

.stat-item-vertical.stat-disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.stat-item-vertical.stat-disabled:hover {
  transform: none;
  background-color: #fafafa;
  border-color: #e0e0e0;
  box-shadow: none;
}

.stat-item-vertical.stat-overdue {
  border-color: #d32f2f;
  background-color: rgba(211, 47, 47, 0.05);
}

.stat-item-vertical.stat-overdue .stat-number-vertical {
  color: #d32f2f;
}

.stat-content {
  display: flex;
  align-items: center;
  gap: 12px;
}

.stat-number-vertical {
  font-size: 20px;
  font-weight: 700;
  color: #1976d2;
  min-width: 40px;
}

.stat-label-vertical {
  font-size: 14px;
  font-weight: 500;
  color: #333;
}

.stat-check {
  opacity: 0.8;
}

/* Component-specific styles that can't be moved to global CSS */
.chart-content,
.table-content {
  flex: 1;
  display: flex;
  flex-direction: column;
}

/* Vertical Layout Styles */
.content-section-vertical {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-width: 100%;
}

.chart-card {
  width: 100%;
}

.table-card {
  width: 100%;
}

/* Legend and responsive styles */
.legend-inline {
  display: flex;
  gap: 8px;
}

.legend-inline .v-chip {
  cursor: pointer;
  transition: all 0.2s ease;
}

.legend-inline .v-chip:hover {
  transform: scale(1.05);
}

/* Responsive behavior */
@media (max-width: 960px) {
  .flyout-content,
  .flyout-content-scrollable {
    padding: 16px;
  }
  
  .stat-number-vertical {
    font-size: 18px;
  }
  
  .stat-label-vertical {
    font-size: 13px;
  }
  
  .filter-flyout-trigger-header {
    font-size: 12px !important;
  }
  
  .filter-flyout-trigger-header .v-btn__content {
    font-size: 12px !important;
  }
  
  .scroll-indicator {
    padding: 12px 0 16px 0;
  }
  
  .scroll-text {
    font-size: 11px;
  }
}

@media (max-width: 600px) {
  .legend-inline {
    flex-direction: column;
    gap: 4px;
  }
  
  .legend-inline .v-chip {
    align-self: flex-start;
  }
  
  .flyout-content,
  .flyout-content-scrollable {
    padding: 12px;
  }
  
  .stat-item-vertical {
    padding: 10px 12px;
  }
  
  .stat-number-vertical {
    font-size: 16px;
  }
  
  .stat-label-vertical {
    font-size: 12px;
  }
  
  .filter-flyout-trigger-header {
    font-size: 11px !important;
    padding: 4px 8px !important;
  }
  
  .filter-flyout-trigger-header .v-btn__content {
    font-size: 11px !important;
  }
  
  .scroll-indicator {
    padding: 10px 0 12px 0;
  }
  
  .scroll-text {
    font-size: 10px;
  }
}

/* Hide scroll indicator when content fits */
@media (min-height: 800px) {
  .scroll-indicator {
    display: none;
  }
}
</style>

<script>
/* eslint-disable no-console */
import ReleaseChart from "@/components/charts/ReleaseChart.vue";
import ChangeActionCell from "@/components/release-planning/ChangeActionCell.vue";
import dataService from "@/data/DataServiceBase.js";
import filterService from "@/services/FilterService.js";
import chartDataService from "@/services/ChartDataService.js";
import dataTransformationService from "@/services/DataTransformationService.js";
import exportService from "@/services/ExportService.js";
import { USE_MOCK_DATA } from "@/assets/config/app-data.json";
import { getApiBaseUrl, API_CONFIG } from "@/config/ApiConfig.js";

export default {
    name: "EnhancedPartsPlannerWidget",
    components: {
        ReleaseChart,
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
            // Filter flyout state
            showFilterFlyout: false,
            
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
                    { text: "Actual Complete Date", value: "actualCompleteDate", sortable: true, icon: "mdi-calendar-check" }
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
            const config = filterService.createFilterConfig({
                programs: this.programs,
                phases: this.phases,
                organizations: this.organizations,
                filterValues: this.filterValues
            });
            return config;
        },

        // Release stats as array for vertical layout
        releaseStatsArray() {
            if (!this.releaseStats) return [];
            
            return [
                { key: "released", label: "Released", count: this.releaseStats.releasedCount },
                { key: "thisWeek", label: "This Week", count: this.releaseStats.thisWeekCount },
                { key: "nextWeek", label: "Next Week", count: this.releaseStats.nextWeekCount },
                { key: "overdue", label: "Overdue", count: this.releaseStats.overdueCount },
                { key: "next30Days", label: "Next 30 Days", count: this.releaseStats.next30DaysCount },
                { key: "all", label: "Total", count: this.releaseStats.totalCount }
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
        },

        // API environment indicator for header chip
        apiEnvironmentChip() {
            const currentUrl = getApiBaseUrl();
            const isProduction = currentUrl === API_CONFIG.production;
            const isOverride = typeof window !== "undefined" && localStorage.getItem("env_override") !== null;
            
            return {
                text: isProduction ? "Prod API" : "Dev API",
                color: isProduction ? "success" : "error",
                icon: isOverride ? "mdi-code-tags" : "mdi-cloud"
            };
        }
    },
    
    // Watch for changes that should trigger chart updates
    watch: {
        // Smart watcher: Only update chart if data count changes, not content edits
        "filteredTableData": {
            handler(newData, oldData) {
                // Only update chart if the data count changed or it's the initial load
                const newLength = newData?.length || 0;
                const oldLength = oldData?.length || 0;
                
                if (newLength !== oldLength || oldLength === 0) {
                    console.log("👀 CHART WATCH: Data count changed", oldLength, "→", newLength);
                    this.$nextTick(() => {
                        this.updateChartFromFiltered();
                    });
                } else {
                    console.log("👀 CHART WATCH: Ignoring content-only changes (same count)");
                }
            },
            deep: false // Don't deep watch - we only care about array length changes
        },
        
        // Watch for filter changes that should trigger chart updates
        "filterValues.program": {
            handler() {
                console.log("👀 CHART WATCH: Program filter changed");
                this.$nextTick(() => {
                    this.updateChartFromFiltered();
                });
            }
        },
        
        "filterValues.phase": {
            handler() {
                console.log("👀 CHART WATCH: Phase filter changed");
                this.$nextTick(() => {
                    this.updateChartFromFiltered();
                });
            }
        },
        
        "filterValues.organization": {
            handler() {
                console.log("👀 CHART WATCH: Organization filter changed");
                this.$nextTick(() => {
                    this.updateChartFromFiltered();
                });
            }
        },
        
        // Watch selectedStatFilter changes
        "selectedStatFilter": {
            handler(newFilter, oldFilter) {
                console.log("👀 CHART WATCH: Stat filter changed from", oldFilter, "to", newFilter);
                this.$nextTick(() => {
                    this.updateChartFromFiltered();
                });
            }
        },
        
        // Watch currentDataType changes
        "currentDataType": {
            handler(newType, oldType) {
                console.log("👀 CHART WATCH: Data type changed from", oldType, "to", newType);
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
            console.log("👁️ Target line toggled:", this.showTargetLine);
            this.updateChartFromFiltered();
        },
        
        toggleActualLine() {
            this.showActualLine = !this.showActualLine;
            console.log("👁️ Actual line toggled:", this.showActualLine);
            this.updateChartFromFiltered();
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