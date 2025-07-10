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
        />

        <!-- Debug: Data Type Switcher (remove in production) -->
        <v-card class="ma-2" outlined>
            <v-card-subtitle class="pb-2">
                <v-icon small left>mdi-bug</v-icon>
                Debug: Data Type Configuration
            </v-card-subtitle>
            <v-card-text class="py-2">
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
                <div class="caption mt-2">
                    <strong>Current:</strong> {{ currentDataType }} | 
                    <strong>Headers:</strong> {{ tableHeaders.length }} | 
                    <strong>Data:</strong> {{ tableData.length }} items |
                    <strong>Phase:</strong> {{ filterValues.phase || 'None' }}
                </div>
            </v-card-text>
        </v-card>

        <!-- Charts and Tables Section -->
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
                    
                    <v-card-text class="chart-content-wrapper">
                        <div class="legend-container legend-row" style="margin-bottom: 0.5rem;">
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
                        <div class="chart-container">
                            <UniversalChart
                                v-if="chartData.labels && chartData.labels.length > 0"
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
            
            // Current data type being displayed - determines which header configuration to use
            currentDataType: "parts", // "parts", "cas", "crs", etc.
            
            // Configuration for different data types - easily extensible
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
                    // { text: "Rev", value: "revision", sortable: true, icon: "mdi-source-branch" },
                    { text: "Description", value: "changeSummary", sortable: true, icon: "mdi-text" },
                    { text: "Resp Engr", value: "name", sortable: true, icon: "mdi-account" },
                   // { text: "Organization", value: "organization", sortable: true, icon: "mdi-domain" },
                    { text: "Status", value: "currentState", sortable: true, icon: "mdi-flag" },
                    { text: "Target Complete Date", value: "targetReleaseDate", sortable: true, icon: "mdi-calendar-clock" },
                    { text: "Actual Approved Date", value: "approvedDate", sortable: true, icon: "mdi-calendar-check" },
                    { text: "Actual Complete Date", value: "actualReleaseDate", sortable: true, icon: "mdi-calendar-check" }
                ],
                crs: [
                    { text: "CR Number", value: "crNumber", sortable: true, required: true, icon: "mdi-file-document-outline" },
                    { text: "Title", value: "title", sortable: true, icon: "mdi-format-title" },
                    { text: "Status", value: "status", sortable: true, icon: "mdi-flag" },
                    { text: "Priority", value: "priority", sortable: true, icon: "mdi-alert" },
                    { text: "Requester", value: "requester", sortable: true, icon: "mdi-account" },
                    { text: "Created Date", value: "createdDate", sortable: true, icon: "mdi-calendar-plus" },
                    { text: "Due Date", value: "dueDate", sortable: true, icon: "mdi-calendar-clock" },
                    { text: "Completed Date", value: "completedDate", sortable: true, icon: "mdi-calendar-check" }
                ]
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
        // Dynamic widget title based on current data type
        widgetTitle() {
            const titles = {
                parts: "Release Planning Parts Dashboard",
                cas: "Release Planning CA Dashboard", 
                crs: "Change Request Dashboard"
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
    
    async mounted() {
        // Initialize by fetching programs first
        await this.fetchPrograms();
    },
    
    methods: {
        // Chart legend toggle methods
        toggleTargetLine() {
            this.showTargetLine = !this.showTargetLine;
            console.log("Target line visibility toggled:", this.showTargetLine);
            this.updateChartFromFiltered(); // Regenerate chart with new visibility
        },

        toggleActualLine() {
            this.showActualLine = !this.showActualLine;
            console.log("Actual line visibility toggled:", this.showActualLine);
            this.updateChartFromFiltered(); // Regenerate chart with new visibility
        },

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
                    // Fallback to mock data for template demo
                    this.programs = ["CX300 Pre-Production Builds", "Demo Program 1", "Demo Program 2"];
                    this.filterValues.program = "CX300 Pre-Production Builds";
                    await this.fetchPhases();
                } else {
                    console.error("Failed to fetch programs:", err.message);
                    // Leave empty when API fails and mock data is disabled
                    this.programs = [];
                    this.filterValues.program = "";
                }
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
                console.error("Failed to fetch phases:", error.message);
                if (USE_MOCK_DATA) {
                    console.warn("API not available, using mock data for phases. Error:", error.message);
                    // Fallback to mock data
                    this.phases = ["Phase 1", "Phase 2", "Phase 3"];
                    this.filterValues.phase = "Phase 1";
                    await this.fetchData(this.filterValues.phase);
                } else {
                    console.error("Failed to fetch phases:", error.message);
                    // Leave empty when API fails and mock data is disabled
                    this.phases = [];
                    this.filterValues.phase = "";
                    // Initialize empty chart data
                    this.updateChartFromFiltered();
                }
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

                // Update organizations from the parts data
                const orgSet = new Set(this.tableData.map(r => r.organization).filter(org => org));
                this.organizations = ["All", ...orgSet];

                // Update chart data from the filtered table data
                this.updateChartFromFiltered();

            } catch (error) {
                console.error("Error fetching data:", {
                    message: error.message,
                    phase,
                    currentDataType: this.currentDataType,
                    USE_MOCK_DATA,
                    fullError: error
                });
                
                // Check if this is the specific "Array index out of range" error
                if (error.message && error.message.includes("Array index out of range")) {
                    console.warn("API backend error - likely issue with phase name format:", phase);
                    console.warn("This might be caused by special characters in the phase name");
                    
                    // Try with a simplified phase name if the original contains special characters
                    if (phase && (phase.includes("(") || phase.includes(".") || phase.includes(" "))) {
                        console.log("Attempting to fetch data with simplified phase name...");
                        try {
                            // Create a simplified version of the phase name
                            const simplifiedPhase = phase
                                .replace(/\([^)]*\)/g, "") // Remove parentheses and their contents
                                .replace(/\./g, "") // Remove periods
                                .replace(/\s+/g, " ") // Normalize spaces
                                .trim();
                            
                            console.log("Trying simplified phase name:", simplifiedPhase);
                            
                            if (simplifiedPhase && simplifiedPhase !== phase) {
                                const items = await dataService.fetchItems(simplifiedPhase, this.currentDataType);
                                
                                // Process the response same as before
                                let finalParts = items;
                                
                                if (!Array.isArray(items) && typeof items === "object" && items !== null) {
                                    console.log("🔄 Converting non-array response to array using enhanced logic (retry)");
                                    
                                    // Try different common property names based on data type
                                    const dataTypeKeys = {
                                        parts: ["parts", "data", "items", "results"],
                                        cas: ["CAs", "cas", "parts", "data", "items", "results"], // API returns "CAs" (capital)
                                        crs: ["CRs", "crs", "parts", "data", "items", "results"] // API likely returns "CRs" (capital)
                                    };
                                    
                                    const keysToTry = dataTypeKeys[this.currentDataType] || dataTypeKeys.parts;
                                    console.log("🔍 Retry: Trying keys for", this.currentDataType, ":", keysToTry);
                                    console.log("🔍 Retry: Available keys in response:", Object.keys(items));
                                    
                                    for (const key of keysToTry) {
                                        if (items[key] && Array.isArray(items[key])) {
                                            finalParts = items[key];
                                            console.log(`✅ Retry: Using items.${key} (${finalParts.length} items)`);
                                            break;
                                        }
                                    }
                                    
                                    if (!Array.isArray(finalParts)) {
                                        console.log("❌ Retry: Could not find array in response, using empty array");
                                        finalParts = [];
                                    }
                                }
                                
                                this.tableData = Array.isArray(finalParts)
                                    ? finalParts.map(item => this.mapItemToTableData(item))
                                    : [];
                                
                                console.log("✅ Successfully fetched data with simplified phase name");
                                
                                // Update organizations and chart
                                const orgSet = new Set(this.tableData.map(r => r.organization).filter(org => org));
                                this.organizations = ["All", ...orgSet];
                                this.updateChartFromFiltered();
                                
                                return; // Exit the function successfully
                            }
                        } catch (retryError) {
                            console.error("Retry with simplified phase name also failed:", retryError);
                        }
                    }
                }
                
                // Check if this is an API error with null response
                if (error.message && error.message.includes("API Error") && error.message.includes("null")) {
                    console.warn("🚨 API returned null error - this usually indicates backend API issues");
                    console.warn("Phase name:", phase);
                    console.warn("Data type:", this.currentDataType);
                    console.warn("This might be due to:");
                    console.warn("  1. Invalid phase name format");
                    console.warn("  2. Missing data for the requested phase");
                    console.warn("  3. Backend API database connectivity issues");
                    console.warn("  4. Backend API application errors");
                }
                
                // Leave table empty when API fails - no mock data unless enabled
                console.log("Setting empty data due to API failure");
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
            this.selectedStatFilter = statusFilter;
            
            // The filteredTableData computed property will automatically update
            // based on the selectedStatFilter value
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
         * Update chart data from filtered table data
         */
        updateChartFromFiltered() {
            console.log("🔄 Updating chart from filtered data...");
            
            if (!this.filteredTableData || this.filteredTableData.length === 0) {
                this.chartData = { labels: [], datasets: [] };
                return;
            }

            // Collect release dates for both target and actual
            const targetDates = [];
            const actualDates = [];
            
            this.filteredTableData.forEach(item => {
                // Target release dates
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
                
                if (targetDate && targetDate !== "N/A" && targetDate !== null && targetDate !== "") {
                    try {
                        const dateObj = new Date(targetDate);
                        if (!isNaN(dateObj.getTime())) {
                            targetDates.push({
                                date: dateObj,
                                dateString: dateObj.toLocaleDateString(),
                                item
                            });
                        }
                    } catch (error) {
                        console.warn("Invalid target date format:", targetDate);
                    }
                }

                // Actual release dates
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
                
                // Only count items that are actually released/completed
                if (actualDate && actualDate !== "N/A" && actualDate !== null && actualDate !== "") {
                    try {
                        const dateObj = new Date(actualDate);
                        if (!isNaN(dateObj.getTime())) {
                            actualDates.push({
                                date: dateObj,
                                dateString: dateObj.toLocaleDateString(),
                                item
                            });
                        }
                    } catch (error) {
                        console.warn("Invalid actual date format:", actualDate);
                    }
                }
            });

            if (targetDates.length === 0 && actualDates.length === 0) {
                console.log("No valid release dates found");
                this.chartData = { labels: [], datasets: [] };
                return;
            }

            // Create a unified timeline covering all dates from both target and actual
            const allDates = new Set();
            
            // Add all target dates
            targetDates.forEach(item => allDates.add(item.dateString));
            // Add all actual dates  
            actualDates.forEach(item => allDates.add(item.dateString));
            
            // Sort all dates chronologically
            const sortedDates = Array.from(allDates).sort((a, b) => new Date(a) - new Date(b));
            
            console.log("📅 Unified timeline:", sortedDates);

            // Create cumulative datasets using the unified timeline
            const createUnifiedCumulativeDataset = (dates, label, color, backgroundColor) => {
                // Group releases by date
                const dateGroups = new Map();
                dates.forEach(release => {
                    const dateStr = release.dateString;
                    if (!dateGroups.has(dateStr)) {
                        dateGroups.set(dateStr, 0);
                    }
                    dateGroups.set(dateStr, dateGroups.get(dateStr) + 1);
                });

                // Create cumulative data for the unified timeline
                const cumulativeData = [];
                let runningTotal = 0;

                sortedDates.forEach(dateStr => {
                    // Add any releases that occurred on this date
                    if (dateGroups.has(dateStr)) {
                        runningTotal += dateGroups.get(dateStr);
                    }
                    cumulativeData.push(runningTotal);
                });

                console.log(`📊 ${label} cumulative data:`, cumulativeData);

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
            };

            // Determine the appropriate labels based on data type
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
            
            const labels = dataTypeLabels[this.currentDataType] || {
                target: "Target Items",
                actual: "Actual Items"
            };

            // Create datasets using the unified timeline
            const datasets = [];
            
            if (targetDates.length > 0 && this.showTargetLine) {
                const targetDataset = createUnifiedCumulativeDataset(
                    targetDates, 
                    labels.target, 
                    "#1976d2", // Blue for target
                    "rgba(25, 118, 210, 0.1)"
                );
                datasets.push(targetDataset);
            }
            
            if (actualDates.length > 0 && this.showActualLine) {
                const actualDataset = createUnifiedCumulativeDataset(
                    actualDates, 
                    labels.actual, 
                    "#4caf50", // Green for actual
                    "rgba(76, 175, 80, 0.1)"
                );
                datasets.push(actualDataset);
            }

            this.chartData = {
                labels: sortedDates,
                datasets
            };

            console.log("✅ Chart data updated (unified timeline):", {
                targetDataPoints: targetDates.length,
                actualDataPoints: actualDates.length,
                totalLabels: sortedDates.length,
                datasets: datasets.length,
                datasetLabels: datasets.map(d => d.label),
                firstDate: sortedDates[0],
                lastDate: sortedDates[sortedDates.length - 1]
            });
        },

        /**
         * Map API response item to table data format based on current data type
         */
        mapItemToTableData(item) {
            console.log("🔄 Mapping item for data type:", this.currentDataType, "Item:", item);
            
            switch (this.currentDataType) {
                case "parts":
                    return {
                        partNo: item.partNumber || item.partNo,
                        rev: item.revision || item.rev,
                        description: item.description,
                        organization: item.organization || "Unknown",
                        tgtRelease: item.targetReleaseDate || item.tgtRelease,
                        actualRelease: item.actualReleaseDate || item.actualRelease || "N/A",
                        currentState: item.currentState || item.state,
                        physId: item.physId || item.id,
                        // CA fields will be populated by ChangeActionCell component
                        caNumber: "",
                        caState: ""
                    };
                    
                case "cas":
                    return {
                        caNumber: item.caNumber || item.changeActionNumber,
                        changeSummary: item.changeSummary || item.description,
                        name: item.name || item.responsibleEngineer,
                        currentState: item.currentState || item.status,
                        targetReleaseDate: item.targetReleaseDate || item.targetCompleteDate,
                        approvedDate: item.approvedDate,
                        actualReleaseDate: item.actualReleaseDate || item.actualCompleteDate,
                        organization: item.organization || "Unknown"
                    };
                    
                case "crs":
                    return {
                        crNumber: item.crNumber || item.changeRequestNumber,
                        title: item.title || item.summary,
                        status: item.status,
                        priority: item.priority,
                        requester: item.requester,
                        createdDate: item.createdDate,
                        dueDate: item.dueDate,
                        completedDate: item.completedDate,
                        organization: item.organization || "Unknown"
                    };
                    
                default:
                    console.warn("⚠️  Unknown data type for mapping:", this.currentDataType);
                    return item;
            }
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
