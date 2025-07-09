<!-- Parts Planner Widget - Complete planning interface with dropdowns, chart, and table -->
<template>
    <div class="parts-planner-widget">
        <v-card class="parts-planner-card" elevation="2">
            <!-- Header -->
            <v-card-title class="parts-planner-header">
                <v-icon left color="primary">mdi-chart-timeline-variant</v-icon>
                <span>Parts Release Planner</span>
                <v-spacer />
                <v-chip
                    :color="loading ? 'orange' : 'green'"
                    small
                    text-color="white"
                >
                    <v-icon small left>
                        {{ loading ? 'mdi-loading' : 'mdi-check-circle' }}
                    </v-icon>
                    {{ loading ? 'Loading...' : `${filteredParts.length} Parts` }}
                </v-chip>
            </v-card-title>

            <!-- Control Panel -->
            <v-card-text class="control-panel">
                <v-row dense>
                    <!-- Program Selector -->
                    <v-col cols="12" md="4">
                        <v-select
                            v-model="selectedProgram"
                            :items="programs"
                            label="Program"
                            outlined
                            dense
                            prepend-inner-icon="mdi-folder-multiple"
                            @change="onProgramChange"
                        />
                    </v-col>

                    <!-- Phase Selector -->
                    <v-col cols="12" md="4">
                        <v-select
                            v-model="selectedPhase"
                            :items="phases"
                            label="Phase"
                            outlined
                            dense
                            prepend-inner-icon="mdi-timeline"
                            @change="onPhaseChange"
                        />
                    </v-col>

                    <!-- Organization Filter -->
                    <v-col cols="12" md="4">
                        <v-select
                            v-model="selectedOrganization"
                            :items="organizations"
                            label="Organization"
                            outlined
                            dense
                            prepend-inner-icon="mdi-account-group"
                            @change="updateFilteredData"
                        />
                    </v-col>
                </v-row>

                <!-- Action Buttons -->
                <v-row dense>
                    <v-col cols="auto">
                        <v-btn
                            color="primary"
                            small
                            outlined
                            :loading="loading"
                            @click="refreshData"
                        >
                            <v-icon small left>mdi-refresh</v-icon>
                            Refresh Data
                        </v-btn>
                    </v-col>
                    <v-col cols="auto">
                        <v-btn
                            color="success"
                            small
                            outlined
                            @click="exportData"
                        >
                            <v-icon small left>mdi-download</v-icon>
                            Export
                        </v-btn>
                    </v-col>
                    <v-spacer />
                    <v-col cols="auto">
                        <v-btn-toggle v-model="viewMode" mandatory dense>
                            <v-btn small value="chart">
                                <v-icon small>mdi-chart-line</v-icon>
                            </v-btn>
                            <v-btn small value="table">
                                <v-icon small>mdi-table</v-icon>
                            </v-btn>
                            <v-btn small value="both">
                                <v-icon small>mdi-view-dashboard</v-icon>
                            </v-btn>
                        </v-btn-toggle>
                    </v-col>
                </v-row>
            </v-card-text>

            <!-- Content Area -->
            <v-card-text class="content-area">
                <!-- Chart Section -->
                <div v-if="viewMode === 'chart' || viewMode === 'both'" class="chart-section">
                    <h3 class="section-title">
                        <v-icon left>mdi-chart-line</v-icon>
                        Release Progress Timeline
                    </h3>
                    <div class="chart-container">
                        <UniversalChart
                            v-if="hasChartData"
                            type="line"
                            :data="chartData"
                            :options="chartOptions"
                            :height="300"
                            :loading="loading"
                        />
                        <div v-else class="no-data-message">
                            <v-icon large color="grey">mdi-chart-line</v-icon>
                            <p>No chart data available for current selection</p>
                        </div>
                    </div>
                </div>

                <v-divider v-if="viewMode === 'both'" class="my-4" />

                <!-- Table Section -->
                <div v-if="viewMode === 'table' || viewMode === 'both'" class="table-section">
                    <h3 class="section-title">
                        <v-icon left>mdi-table</v-icon>
                        Parts Data Table
                    </h3>
                    <div class="table-container">
                        <UniversalTable
                            :items="filteredParts"
                            :headers="tableHeaders"
                            :loading="loading"
                            searchable
                            filterable
                            :items-per-page="15"
                            @row-click="handleRowClick"
                        />
                    </div>
                </div>
            </v-card-text>

            <!-- Footer Stats -->
            <v-card-actions class="footer-stats">
                <v-row dense align="center">
                    <v-col>
                        <v-chip small color="blue" text-color="white">
                            Total: {{ allStats.totalCount }}
                        </v-chip>
                        <v-chip small color="green" text-color="white" class="ml-2">
                            Released: {{ allStats.releasedCount }}
                        </v-chip>
                        <v-chip small color="orange" text-color="white" class="ml-2">
                            In Progress: {{ allStats.totalCount - allStats.releasedCount }}
                        </v-chip>
                    </v-col>
                    <v-spacer />
                    <v-col cols="auto">
                        <span class="caption">
                            Last Updated: {{ lastUpdated }}
                        </span>
                    </v-col>
                </v-row>
            </v-card-actions>
        </v-card>
    </div>
</template>

<style scoped>
/* All styles moved to BetaStyles.css */
</style>

<script>
/* eslint-disable no-console */

import UniversalChart from "@/components/universal/UniversalChart.vue";
import UniversalTable from "@/components/universal/UniversalTable.vue";
import ApiService from "@/services/ApiService.js";

export default {
    name: "PartsPlannerWidget",
    components: {
        UniversalChart,
        UniversalTable
    },
    props: {
        // Allow external control of the widget
        initialProgram: {
            type: String,
            default: "CX300 Pre-Production Builds"
        },
        initialPhase: {
            type: String,
            default: "Phase 1"
        },
        apiMode: {
            type: Boolean,
            default: false
        }
    },
    data() {
        return {
            // Loading state
            loading: false,
            
            // Filter selections
            selectedProgram: this.initialProgram,
            selectedPhase: this.initialPhase,
            selectedOrganization: "All",
            
            // Filter options
            programs: [
                "CX300 Pre-Production Builds",
                "Demo Program 1", 
                "Demo Program 2"
            ],
            phases: [
                "Phase 1",
                "Phase 2", 
                "Phase 3"
            ],
            organizations: ["All"],
            
            // Data
            allPartsData: [],
            filteredParts: [],
            
            // UI state
            viewMode: "both",
            lastUpdated: new Date().toLocaleTimeString(),
            
            // Table configuration
            tableHeaders: [
                { text: "Part Number", value: "partNumber", sortable: true },
                { text: "Title", value: "title", sortable: true },
                { text: "Status", value: "status", sortable: true },
                { text: "Organization", value: "organization", sortable: true },
                { text: "Target Release", value: "tgtRelease", type: "date", sortable: true },
                { text: "Actual Release", value: "actualRelease", type: "date", sortable: true }
            ],
            
            // TODO: update for CA data
            // Chart configuration
            chartOptions: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: "Release Progress Over Time"
                    },
                    legend: {
                        position: "bottom"
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: "Number of Parts"
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: "Release Date"
                        }
                    }
                }
            }
        };
    },
    computed: {
        allStats() {
            const total = this.allPartsData.length;
            const released = this.allPartsData.filter(p => 
                p.status === "Released" || p.currentState === "RELEASED"
            ).length;
            
            return {
                totalCount: total,
                releasedCount: released
            };
        },
        
        hasChartData() {
            return this.chartData && 
                   this.chartData.labels && 
                   this.chartData.labels.length > 0;
        },
        
        chartData() {
            if (!this.filteredParts || this.filteredParts.length === 0) {
                return { labels: [], datasets: [] };
            }
            
            // Group by date for line chart
            const dateMap = new Map();
            this.filteredParts.forEach(part => {
                const targetDate = part.tgtRelease || part.targetReleaseDate;
                const actualDate = part.actualRelease || part.actualReleaseDate;
                
                if (!targetDate) return;
                
                const date = new Date(targetDate).toLocaleDateString();
                if (!dateMap.has(date)) {
                    dateMap.set(date, { target: 0, actual: 0 });
                }
                dateMap.get(date).target++;
                
                if (actualDate && actualDate !== "N/A" && actualDate !== null) {
                    dateMap.get(date).actual++;
                }
            });
            
            const sortedDates = Array.from(dateMap.keys()).sort();
            return {
                labels: sortedDates,
                datasets: [
                    {
                        label: "Target Releases",
                        data: sortedDates.map(date => dateMap.get(date).target),
                        borderColor: "rgba(75, 192, 192, 1)",
                        backgroundColor: "rgba(75, 192, 192, 0.2)",
                        tension: 0.1
                    },
                    {
                        label: "Actual Releases", 
                        data: sortedDates.map(date => dateMap.get(date).actual),
                        borderColor: "rgba(255, 99, 132, 1)",
                        backgroundColor: "rgba(255, 99, 132, 0.2)",
                        tension: 0.1
                    }
                ]
            };
        }
    },
    async mounted() {
        await this.loadInitialData();
    },
    methods: {
        async loadInitialData() {
            this.loading = true;
            try {
                await this.fetchPartsData();
                this.updateFilteredData();
            } finally {
                this.loading = false;
            }
        },
        
        async fetchPartsData() {
            try {
                let partsData;
                
                if (this.apiMode) {
                    // Use real API
                    partsData = await ApiService.fetchParts(this.selectedPhase);
                } else {
                    // Use local sample data
                    const sampleData = await import("@/assets/config/app-data.json");
                    partsData = sampleData.default.parts || [];
                }
                
                this.allPartsData = Array.isArray(partsData) ? partsData : [];
                
                // Extract unique organizations
                const uniqueOrgs = [...new Set(
                    this.allPartsData
                        .map(item => item.organization || item.org)
                        .filter(org => org && org !== "")
                )];
                
                this.organizations = ["All", ...uniqueOrgs.sort()];
                
            } catch (error) {
                console.error("Error fetching parts data:", error);
                this.allPartsData = [];
            }
        },
        
        updateFilteredData() {
            let filtered = [...this.allPartsData];
            
            // Apply organization filter
            if (this.selectedOrganization && this.selectedOrganization !== "All") {
                filtered = filtered.filter(part => 
                    (part.organization || part.org) === this.selectedOrganization
                );
            }
            
            this.filteredParts = filtered;
            this.lastUpdated = new Date().toLocaleTimeString();
        },
        
        async onProgramChange() {
            // In real implementation, this might trigger a new API call
            console.log("Program changed to:", this.selectedProgram);
            this.updateFilteredData();
        },
        
        async onPhaseChange() {
            this.loading = true;
            try {
                await this.fetchPartsData();
                this.updateFilteredData();
            } finally {
                this.loading = false;
            }
        },
        
        async refreshData() {
            this.loading = true;
            try {
                await this.fetchPartsData();
                this.updateFilteredData();
            } finally {
                this.loading = false;
            }
        },
        
        exportData() {
            // Simple CSV export
            const headers = this.tableHeaders.map(h => h.text).join(",");
            const rows = this.filteredParts.map(part => 
                this.tableHeaders.map(h => part[h.value] || "").join(",")
            );
            
            const csv = [headers, ...rows].join("\n");
            const blob = new Blob([csv], { type: "text/csv" });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement("a");
            a.href = url;
            a.download = `parts-data-${this.selectedPhase}.csv`;
            a.click();
            
            URL.revokeObjectURL(url);
        },
        
        handleRowClick(row) {
            this.$emit("row-click", row);
            console.log("Row clicked:", row);
        }
    }
};
</script>
