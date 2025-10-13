<!-- Dashboard Orchestrator - Central widget management and layout -->
<template>
    <div class="dashboard-orchestrator">
        
        <!-- Widget Grid -->
        <div class="widget-grid" :class="gridLayoutClass">
            
            <div
                v-for="widget in visibleWidgets"
                :key="widget.id"
                class="widget-container"
                :style="getWidgetStyle(widget)"
            >
                <v-card class="widget-card" :loading="loading">
                    <!-- Widget Header (conditionally shown) -->
                    <v-card-title v-if="!widget.props?.hideHeader" class="widget-header">
                        <v-icon left :color="widget.color || 'primary'">
                            {{ widget.icon }}
                        </v-icon>
                        {{ widget.title }}
                        
                        <v-spacer />
                        
                        <v-btn
                            icon
                            small
                            color="grey"
                            @click="toggleWidget(widget.id)"
                        >
                            <v-icon small>mdi-close</v-icon>
                        </v-btn>
                    </v-card-title>
                    
                    <!-- Widget Content -->
                    <v-card-text class="widget-content">
                        <!-- Actual Component Rendering -->
                        <component
                            :is="widget.component"
                            v-if="widget.component"
                            v-bind="getWidgetProps(widget)"
                            :loading="loading"
                            @row-click="handleRowClick"
                        >
                            <template v-for="(_, slot) of $scopedSlots" #[slot]="scope">
                                <div :key="slot">
                                    <slot :name="slot" v-bind="scope"></slot>
                                </div>
                            </template>
                        </component>
                        
                        <!-- Fallback if component is missing -->
                        <div v-else class="component-error">
                            <v-icon color="warning">mdi-alert</v-icon>
                            <span>Component "{{ widget.component }}" not found</span>
                        </div>
                    </v-card-text>
                </v-card>
            </div>
        </div>
        
        <!-- Empty State -->
        <div v-if="visibleWidgets.length === 0" class="empty-state">
            <v-icon large color="grey">mdi-view-dashboard-outline</v-icon>
            <h3>No widgets visible</h3>
            <p>Add widgets to see your dashboard</p>
        </div>
    </div>
</template>

<style scoped>
/* All styles moved to BetaStyles.css */
</style>

<script>
import { WIDGET_DEFINITIONS } from "@/config/WidgetRegistry.js";
import UniversalDataService from "@/services/UniversalDataService.js";
import UniversalChart from "@/components/universal/UniversalChart.vue";
import UniversalTable from "@/components/universal/UniversalTable.vue";
import UniversalForm from "@/components/universal/UniversalForm.vue";
import PartPlanner from "@/components/part-planning/PartPlanner.vue";
import BomViewer from "@/components/bom/BomViewer.vue";
import ReleasePlannerWidget from "@/components/release-planning/ReleasePlannerWidget.vue";

// Constants
const MILLISECONDS_PER_DAY = 86400000; // 24 * 60 * 60 * 1000

export default {
    name: "DashboardOrchestrator",
    components: {
        UniversalChart,
        UniversalTable,
        UniversalForm,
        PartPlanner,
        BomViewer,
        ReleasePlannerWidget
    },
    props: {
        widgetConfig: { 
            type: [Array, Object], 
            required: true 
        }
    },
    data() {
        return {
            filterValues: {
                program: "All",
                phase: "All", 
                ataChapterGroup: "All",
                engSystemGroup: "All"
            },
            widgetData: {}, // Store data for each widget separately
            filterOptions: {
                program: [
                    { text: "All", value: "All" },
                    { text: "CX300 Pre-Production Builds", value: "CX300 Pre-Production Builds" },
                    { text: "Demo Program 1", value: "Demo Program 1" },
                    { text: "Demo Program 2", value: "Demo Program 2" }
                ],
                phase: [
                    { text: "All", value: "All" },
                    { text: "Phase 1", value: "Phase 1" },
                    { text: "Phase 2", value: "Phase 2" },
                    { text: "Phase 3", value: "Phase 3" }
                ],
                ataChapterGroup: [
                    { text: "All", value: "All" },
                    { text: "Structures", value: "Structures" },
                    { text: "Interiors", value: "Interiors" },
                    { text: "Propulsion", value: "Propulsion" }
                ],
                engSystemGroup: [
                    { text: "All", value: "All" },
                    { text: "Electrical", value: "Electrical" },
                    { text: "Hydraulics", value: "Hydraulics" },
                    { text: "Avionics", value: "Avionics" }
                ]
            },
            loading: false,
            unsubscribeCallbacks: []
        };
    },
    computed: {
        activeFilters() {
            // Always show program, phase, chapter, and system filters for the main dashboard
            return ["program", "phase", "ataChapterGroup", "engSystemGroup"];
        },
        
        visibleWidgets() {
            // Handle both array and object with widgets property
            const widgets = Array.isArray(this.widgetConfig) 
                ? this.widgetConfig 
                : (this.widgetConfig?.widgets || []);
                
            const result = widgets
                .filter(widget => widget.visible)
                .map(widget => {
                    const definition = WIDGET_DEFINITIONS[widget.id];
                    if (!definition) {
                        // eslint-disable-next-line no-console
                        console.warn(`Widget definition not found for ID: ${widget.id}`);
                        return null;
                    }
                    const merged = {
                        ...definition,
                        id: widget.id,
                        visible: widget.visible,
                        ...widget
                    };
                    return merged;
                })
                .filter(widget => widget !== null);
                
            return result;
        },
        
        gridLayoutClass() {
            return "grid-layout-responsive";
        }
    },
    watch: {
        dataType: {
            handler() {
                this.resetFilters();
                this.refreshAllData();
            },
            immediate: true
        },
        
        widgetConfig: {
            handler() {
                this.refreshAllData();
            },
            deep: true
        }
    },
    async mounted() {
        await this.initializeFilters();
        await this.refreshAllData();
        this.setupDataSubscriptions();
    },
    
    beforeDestroy() {
        // Clean up subscriptions
        this.unsubscribeCallbacks.forEach(unsubscribe => {
            try {
                unsubscribe();
            } catch (error) {
                console.error("Error unsubscribing:", error);
            }
        });
    },
    
    methods: {
        async handleFilterChange(filterName, value) {
            this.filterValues[filterName] = value;
            await this.refreshData();
        },
        
        async refreshAllData() {
            this.loading = true;
            try {
                await this.refreshData();
                await this.loadFilterOptions();
            } finally {
                this.loading = false;
            }
        },
        
        async refreshData() {
            try {
                // Get all unique data sources from visible widgets
                const dataSourcesNeeded = new Set();
                this.visibleWidgets.forEach(widget => {
                    if (widget.dataSource) {
                        dataSourcesNeeded.add(widget.dataSource);
                    }
                });

                // Build filter parameters with current selections
                const filterParams = {
                    ...this.filterValues,
                    // Ensure we pass the selected values, not "All"
                    program: this.filterValues.program === "All" ? undefined : this.filterValues.program,
                    phase: this.filterValues.phase === "All" ? undefined : this.filterValues.phase,
                    ataChapterGroup: this.filterValues.ataChapterGroup === "All" ? undefined : this.filterValues.ataChapterGroup,
                    engSystemGroup: this.filterValues.engSystemGroup === "All" ? undefined : this.filterValues.engSystemGroup
                };

                // Fetch data for each unique data source
                const dataPromises = Array.from(dataSourcesNeeded).map(async dataSource => {
                    try {
                        const data = await UniversalDataService.fetchData(
                            dataSource,
                            filterParams,
                            { forceRefresh: false }
                        );
                        return { dataSource, data };
                    } catch (error) {
                        console.error(`Error fetching data for ${dataSource}:`, error);
                        return { dataSource, data: null };
                    }
                });

                const results = await Promise.all(dataPromises);
                
                // Store data for each widget by its ID
                this.widgetData = {};
                this.visibleWidgets.forEach(widget => {
                    const result = results.find(r => r.dataSource === widget.dataSource);
                    if (result && result.data) {
                        this.widgetData[widget.id] = this.transformDataForWidget(widget, result.data);
                    } else {
                        // Provide fallback data structure
                        this.widgetData[widget.id] = {
                            chart: { labels: [], datasets: [] },
                            table: [],
                            raw: [],
                            metadata: {}
                        };
                    }
                });
                
            } catch (error) {
                console.error("Error refreshing data:", error);
                this.$emit("error", error);
            }
        },
        
        async loadFilterOptions() {
            try {
                // Load filter options from parts data (primary data source)
                const data = await UniversalDataService.fetchData(
                    "parts", // Always use parts as the primary data source for filter options
                    { phase: this.filterValues.phase }
                );

                if (data.raw && Array.isArray(data.raw)) {
                    const uniqueChapters = [...new Set(
                        data.raw
                            .map(item => item.ataChapterGroup || item.chapterGroup || item.ataChapter)
                            .filter(group => group && group !== "")
                    )];

                    if (uniqueChapters.length > 0) {
                        this.filterOptions.ataChapterGroup = [
                            { text: "All", value: "All" },
                            ...uniqueChapters.sort().map(group => ({ text: group, value: group }))
                        ];
                    }

                    const uniqueSystems = [...new Set(
                        data.raw
                            .map(item => item.engSystemGroup || item.engineeringSystemGroup || item.systemGroup)
                            .filter(group => group && group !== "")
                    )];

                    if (uniqueSystems.length > 0) {
                        this.filterOptions.engSystemGroup = [
                            { text: "All", value: "All" },
                            ...uniqueSystems.sort().map(group => ({ text: group, value: group }))
                        ];
                    }
                }

            } catch (error) {
                console.error("Error loading filter options:", error);
                // Keep default filter options on error
            }
        },
        
        async initializeFilters() {
            // Set default values for filters - show all data by default
            this.filterValues = {
                program: "All",
                phase: "All", 
                ataChapterGroup: "All",
                engSystemGroup: "All"
            };
            
            // Load any dynamic filter options if needed
            await this.loadFilterOptions();
        },
        
        resetFilters() {
            this.filterValues = {
                program: "All",
                phase: "All",
                ataChapterGroup: "All",
                engSystemGroup: "All"
            };
        },
        
        setupDataSubscriptions() {
            // Subscribe to data changes for real-time updates for each unique data source
            const dataSourcesNeeded = new Set();
            this.visibleWidgets.forEach(widget => {
                if (widget.dataSource) {
                    dataSourcesNeeded.add(widget.dataSource);
                }
            });

            dataSourcesNeeded.forEach(dataSource => {
                const unsubscribe = UniversalDataService.subscribe(
                    dataSource,
                    this.filterValues,
                    data => {
                        // Update data for widgets that use this data source
                        this.visibleWidgets.forEach(widget => {
                            if (widget.dataSource === dataSource) {
                                this.widgetData[widget.id] = this.transformDataForWidget(widget, data);
                            }
                        });
                    }
                );
                
                this.unsubscribeCallbacks.push(unsubscribe);
            });
        },
        
        transformDataForWidget(widget, data) {
            const result = {
                chart: data.chart || { labels: [], datasets: [] },
                table: data.table || [],
                raw: data.raw,
                metadata: data.metadata
            };
            
            // Apply current filters to table data if needed for widgets that support filtering
            if (result.table && Array.isArray(result.table) && widget.filters && widget.filters.length > 0) {
                result.table = this.applyFiltersToTable(result.table);
            }
            
            // Special handling for scatter charts - create scatter-specific data
            if (widget.component === "UniversalChart" && widget.props && widget.props.type === "scatter") {
                result.chart = this.createScatterChartData(data.raw || []);
            }
            
            return result;
        },

        createScatterChartData(rawData) {
            if (!rawData || !Array.isArray(rawData)) {
                return { labels: [], datasets: [] };
            }

            // Create scatter plot data using quantity (x) vs days until release (y)
            const scatterData = rawData.map(part => {
                const targetDate = part.tgtRelease || part.targetReleaseDate || part.tgt_release;
                const quantity = part.quantity || 0;
                
                let daysUntilRelease = 0;
                if (targetDate) {
                    const target = new Date(targetDate);
                    const now = new Date();
                    // Calculate days until release
                    daysUntilRelease = Math.ceil((target - now) / MILLISECONDS_PER_DAY);
                }
                
                return {
                    x: quantity,
                    y: daysUntilRelease,
                    label: part.partNo || part.partNumber || part.title || part.name || "Unknown Part",
                    status: part.status || part.currentState || "Unknown",
                    organization: part.organization || "Unknown"
                };
            }).filter(point => point.x > 0); // Only include parts with positive quantity

            // Group by status for different colored datasets
            const statusGroups = {};
            scatterData.forEach(point => {
                const status = point.status;
                if (!statusGroups[status]) {
                    statusGroups[status] = [];
                }
                statusGroups[status].push(point);
            });

            // Create datasets for each status
            const colors = [
                { bg: "rgba(75, 192, 192, 0.6)", border: "rgba(75, 192, 192, 1)" },
                { bg: "rgba(255, 99, 132, 0.6)", border: "rgba(255, 99, 132, 1)" },
                { bg: "rgba(255, 205, 86, 0.6)", border: "rgba(255, 205, 86, 1)" },
                { bg: "rgba(153, 102, 255, 0.6)", border: "rgba(153, 102, 255, 1)" },
                { bg: "rgba(255, 159, 64, 0.6)", border: "rgba(255, 159, 64, 1)" }
            ];

            const datasets = Object.entries(statusGroups).map(([status, points], index) => ({
                label: status,
                data: points,
                backgroundColor: colors[index % colors.length].bg,
                borderColor: colors[index % colors.length].border,
                pointRadius: 5,
                pointHoverRadius: 8
            }));

            return {
                datasets
            };
        },
        
        applyFiltersToTable(tableData) {
            if (!tableData || !Array.isArray(tableData)) return [];
            
            return tableData.filter(row => {
                // Program filter
                if (this.filterValues.program && this.filterValues.program !== "All") {
                    const rowProgram = row.program || row.selectedProgram;
                    if (rowProgram !== this.filterValues.program) return false;
                }
                
                // Phase filter  
                if (this.filterValues.phase && this.filterValues.phase !== "All") {
                    const rowPhase = row.phase || row.selectedPhase;
                    if (rowPhase !== this.filterValues.phase) return false;
                }
                
                // ATA Chapter filter
                if (this.filterValues.ataChapterGroup && this.filterValues.ataChapterGroup !== "All") {
                    const rowChapter = row.ataChapterGroup || row.chapterGroup || row.ataChapter;
                    if (rowChapter !== this.filterValues.ataChapterGroup) return false;
                }

                // Engineering System filter
                if (this.filterValues.engSystemGroup && this.filterValues.engSystemGroup !== "All") {
                    const rowSystem = row.engSystemGroup || row.engineeringSystemGroup || row.systemGroup;
                    if (rowSystem !== this.filterValues.engSystemGroup) return false;
                }
                
                return true;
            });
        },
        
        getFilterOptions(filterName) {
            return this.filterOptions[filterName] || [];
        },
        
        formatFilterLabel(filterName) {
            return filterName.charAt(0).toUpperCase() + filterName.slice(1);
        },
        
        getWidgetProps(widget) {
            const baseProps = { ...widget.props };
            const widgetData = this.widgetData[widget.id] || { 
                chart: { labels: [], datasets: [] }, 
                table: [], 
                raw: [], 
                metadata: {} 
            };
            
            // Add data based on widget component type
            if (widget.component === "UniversalChart") {
                baseProps.data = widgetData.chart;
                baseProps.options = { ...widget.options };
            } else if (widget.component === "UniversalTable") {
                baseProps.items = widgetData.table;
                baseProps.headers = widget.headers || [];
            }
            
            return baseProps;
        },
        
        getWidgetStyle(widget) {
            const layout = widget.layout || {};
            const style = {};
            
            if (layout.minHeight) {
                style.minHeight = `${layout.minHeight}px`;
            }
            
            if (layout.flex) {
                style.flex = layout.flex;
            }
            
            return style;
        },
        
        toggleWidget(widgetId) {
            this.$emit("toggle-widget", widgetId);
        },
        
        handleRowClick(row) {
            this.$emit("row-click", row);
        },
        
        /**
         * Get current filter values (for parent component access)
         */
        getCurrentFilters() {
            return { ...this.filterValues };
        }
    }
};
</script>
