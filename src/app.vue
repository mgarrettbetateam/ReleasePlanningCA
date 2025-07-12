<!-- Consolidated App.vue - Using new widget architecture -->
<template>
    <v-app>
        <!-- App Header (conditionally shown) -->
        <v-app-bar v-if="ui.header.visible" color="primary" dark dense>
            <!-- App Icon (conditionally shown) -->
            <v-icon v-if="ui.header.showAppIcon" class="mr-2">
                mdi-clipboard-list
            </v-icon>
            
            <!-- Title (conditionally shown with custom title option) -->
            <v-toolbar-title v-if="ui.header.showTitle">
                {{ ui.header.useCustomTitle ? ui.header.customTitle : 'Widget Development Template' }}
            </v-toolbar-title>
            
            <v-spacer />
            
            <!-- View Mode Toggle -->
            <v-btn-toggle 
                v-if="ui.header.showViewModeToggle"
                v-model="viewModes.current" 
                mandatory 
                class="mr-4"
            >
                <v-btn 
                    v-for="mode in viewModes.available" 
                    :key="mode"
                    :value="mode" 
                    small
                >
                    <v-icon v-if="ui.header.showIcons" small left>
                        {{ mode === 'dashboard' ? 'mdi-view-dashboard' : 'mdi-hammer-wrench' }}
                    </v-icon>
                    {{ mode === 'dashboard' ? 'Dashboard' : 'Dev Area' }}
                </v-btn>
            </v-btn-toggle>
            
            <!-- Widget Toggle Button (only in dashboard mode) -->
            <v-btn
                v-if="ui.header.showWidgetToggleButton && ui.widgetPanel.enabled && isDashboardMode"
                icon
                :color="ui.widgetPanel.visible ? 'accent' : 'white'"
                @click="ui.widgetPanel.visible = !ui.widgetPanel.visible"
            >
                <v-icon>mdi-view-dashboard</v-icon>
            </v-btn>
            
            <!-- Close Button (conditionally shown) -->
            <v-btn
                v-if="ui.header.showCloseButton"
                icon
                @click="handleHeaderClose"
            >
                <v-icon>mdi-close</v-icon>
            </v-btn>
        </v-app-bar>

        <v-main>
            <!-- Widget Toggle Panel (only in dashboard mode) -->
            <v-slide-x-transition v-if="ui.animations.slideTransitions">
                <v-card
                    v-if="shouldShowWidgetPanel"
                    class="widget-panel"
                    :elevation="ui.animations.cardElevations ? 4 : 0"
                >
                    <v-card-title v-if="ui.widgetPanel.showHeader" class="widget-panel-header">
                        <v-icon left>mdi-widgets</v-icon>
                        Available Widgets
                        <v-spacer />
                        <v-btn icon small @click="ui.widgetPanel.visible = false">
                            <v-icon>mdi-close</v-icon>
                        </v-btn>
                    </v-card-title>
                    
                    <v-card-text>
                        <v-row>
                            <v-col
                                v-for="widget in filteredAvailableWidgets"
                                :key="widget.id"
                                cols="12"
                                sm="6"
                                md="4"
                            >
                                <v-card
                                    class="widget-toggle-card"
                                    :class="{ 'widget-active': isWidgetVisible(widget.id) }"
                                    @click="toggleWidget(widget.id)"
                                >
                                    <v-card-text class="text-center">
                                        <v-icon
                                            :color="isWidgetVisible(widget.id) ? 'primary' : 'grey'"
                                            size="32"
                                        >
                                            {{ widget.icon }}
                                        </v-icon>
                                        <div class="widget-title">{{ widget.title }}</div>
                                        <v-chip
                                            v-if="ui.widgetPanel.showStatusChips"
                                            :color="isWidgetVisible(widget.id) ? 'success' : 'default'"
                                            small
                                        >
                                            {{ isWidgetVisible(widget.id) ? 'Visible' : 'Hidden' }}
                                        </v-chip>
                                    </v-card-text>
                                </v-card>
                            </v-col>
                        </v-row>
                    </v-card-text>
                    
                    <v-card-actions v-if="ui.widgetPanel.showControls">
                        <v-btn text color="primary" @click="showAllWidgets">
                            Show All
                        </v-btn>
                        <v-btn
                            text
                            color="primary"
                            @click="hideAllWidgets"
                        >
                            Hide All
                        </v-btn>
                        <v-spacer />
                        <v-btn
                            text
                            color="primary"
                            @click="resetToDefaultLayout"
                        >
                            Reset to Default
                        </v-btn>
                    </v-card-actions>
                </v-card>
            </v-slide-x-transition>
            <!-- Fallback for when slide transitions are disabled -->
            <v-card
                v-if="!ui.animations.slideTransitions && shouldShowWidgetPanel"
                class="widget-panel"
                :elevation="ui.animations.cardElevations ? 4 : 0"
            >
                <v-card-title v-if="ui.widgetPanel.showHeader" class="widget-panel-header">
                    <v-icon left>mdi-widgets</v-icon>
                    Available Widgets
                    <v-spacer />
                    <v-btn v-if="ui.widgetPanel.showHeader" icon small @click="ui.widgetPanel.visible = false">
                        <v-icon>mdi-close</v-icon>
                    </v-btn>
                </v-card-title>
                
                <v-card-text>
                    <v-row v-if="ui.widgetPanel.showControls">
                        <v-col
                            v-for="widget in filteredAvailableWidgets"
                            :key="widget.id"
                            cols="12"
                            sm="6"
                            md="4"
                        >
                            <v-card
                                class="widget-toggle-card"
                                :class="{ 'widget-active': isWidgetVisible(widget.id) }"
                                @click="toggleWidget(widget.id)"
                            >
                                <v-card-text class="text-center">
                                    <v-icon
                                        :color="isWidgetVisible(widget.id) ? 'primary' : 'grey'"
                                        size="32"
                                    >
                                        {{ widget.icon }}
                                    </v-icon>
                                    <div class="widget-title">{{ widget.title }}</div>
                                    <v-chip
                                        v-if="ui.widgetPanel.showStatusChips"
                                        :color="isWidgetVisible(widget.id) ? 'success' : 'default'"
                                        small
                                    >
                                        {{ isWidgetVisible(widget.id) ? 'Visible' : 'Hidden' }}
                                    </v-chip>
                                </v-card-text>
                            </v-card>
                        </v-col>
                    </v-row>
                </v-card-text>
                
                <v-card-actions v-if="ui.widgetPanel.showControls">
                    <v-btn
                        text
                        color="primary"
                        @click="showAllWidgets"
                    >
                        Show All
                    </v-btn>
                    <v-btn text color="primary" @click="hideAllWidgets">
                        Hide All
                    </v-btn>
                    <v-spacer />
                    <v-btn text color="primary" @click="resetToDefaultLayout">
                        Reset to Default
                    </v-btn>
                </v-card-actions>
            </v-card>
            
            <!-- Main Content Area -->
            <div class="dashboard-container">
                <!-- Widget Development Area -->
                <WidgetDevelopmentArea
                    v-if="ui.content.showDevelopmentArea && isDevelopmentMode"
                    :dashboard-config="dashboardConfig"
                    @widget-created="handleWidgetCreated"
                    @error="handleError"
                />
                
                <!-- Standard Dashboard Orchestrator -->
                <DashboardOrchestrator
                    v-if="ui.content.showDashboard && isDashboardMode && dashboardConfig"
                    ref="orchestrator"
                    :widget-config="dashboardConfig"
                    :hide-widget-headers="ui.content.hideWidgetHeaders"
                    @toggle-widget="toggleWidget"
                    @row-click="handleRowClick"
                    @error="handleError"
                />
                
                <!-- Loading State -->
                <div v-else-if="isDashboardMode" class="no-config-message">
                    <v-icon size="64" color="grey">mdi-settings</v-icon>
                    <p>Loading dashboard configuration...</p>
                </div>
            </div>
            
            <!-- Status Bar -->
            <v-footer v-if="ui.statusBar.visible" app height="40" color="grey lighten-4">
                <v-row align="center" no-gutters>
                    <v-col>
                        <span class="caption">{{ getStatusText() }}</span>
                    </v-col>
                    <v-col cols="auto">
                        <v-chip v-if="!loading" small color="success">
                            <v-icon small left>mdi-check-circle</v-icon>
                            Ready
                        </v-chip>
                        <v-chip v-else small color="warning">
                            <v-icon small left>mdi-loading</v-icon>
                            Loading...
                        </v-chip>
                    </v-col>
                </v-row>
            </v-footer>
        </v-main>

        <!-- Error Snackbar -->
        <v-snackbar
            v-if="ui.errors.showSnackbar"
            v-model="error.show"
            color="error"
            :timeout="ui.errors.timeout"
            :top="ui.errors.position === 'top'"
            :bottom="ui.errors.position === 'bottom'"
        >
            {{ error.message }}
            <template #action="{ attrs }">
                <v-btn text v-bind="attrs" @click="error.show = false">
                    Close
                </v-btn>
            </template>
        </v-snackbar>
    </v-app>
</template>

<style scoped>
/* All styles moved to BetaStyles.css */
</style>

<script>
import DashboardOrchestrator from "./components/layouts/DashboardOrchestrator.vue";
import WidgetDevelopmentArea from "./components/dev/WidgetDevelopmentArea.vue";
import WidgetRegistry from "./config/WidgetRegistry.js";

export default {
    name: "App",
    components: {
        DashboardOrchestrator,
        WidgetDevelopmentArea
    },
    data() {
        return {
            // =================================================================
            // SIMPLIFIED UI CONTROL SYSTEM
            // =================================================================
            // Grouped controls for better maintainability and readability
            
            // UI Configuration - grouped by functionality
            ui: {
                // Header configuration
                header: {
                    visible: false,              // Turn on header
                    showTitle: true,
                    showViewModeToggle: true,
                    showWidgetToggleButton: true,
                    showIcons: true,
                    showCloseButton: true,      // Turn on close button
                    showAppIcon: true,          // Turn on app icon
                    customTitle: "Release Planning",  // Custom title text
                    useCustomTitle: true       // Use custom title
                },
                
                // Widget panel configuration
                widgetPanel: {
                    enabled: true,
                    visible: false,              // Turn on widget panel
                    showHeader: true,
                    showControls: true,
                    showStatusChips: true
                },
                
                // Content areas
                content: {
                    showDashboard: true,
                    showDevelopmentArea: true,
                    showReleasePlanning: true,
                    hideWidgetHeaders: false    // Show widget internal headers
                },
                
                // Status bar
                statusBar: {
                    visible: true,              // Turn on status bar
                    showWidgetCount: true,
                    showFilters: true
                },
                
                // Interactions
                animations: {
                    slideTransitions: true,
                    cardElevations: true,
                    hoverEffects: true
                },
                
                // Error handling
                errors: {
                    showSnackbar: true,
                    timeout: 5000,
                    position: "top"
                }
            },
            
            // View modes
            viewModes: {
                current: "dashboard",
                available: ["dashboard", "development"]
            },
            
            // =================================================================
            // MASTER WIDGET CONTROL SYSTEM
            // =================================================================
            // 
            // 🎛️ QUICK START: Set enableAllDisabledWidgets to true to enable everything at once
            // 
            // USAGE EXAMPLES:
            // 1. Enable everything:           masterControls.enableAllDisabledWidgets = true
            // 2. Enable just charts:          masterControls.enableAllChartWidgets = true  
            // 3. Enable just dashboard items: masterControls.enableAllDashboardWidgets = true
            // 4. Enable just forms:           masterControls.enableAllFormWidgets = true
            //
            // You can also call helper methods:
            // - this.enableAllWidgets()      - Enables all disabled widgets
            // - this.enableAllCharts()       - Enables all chart widgets only
            // - this.disableAllWidgets()     - Disables all master controls
            // - this.getMasterControlStatus() - Shows current status for debugging
            
            // Master controls for bulk widget management
            masterControls: {
                enableAllDisabledWidgets: false,    // 🎛️ MASTER SWITCH: Set to true to enable all widgets marked as false below
                enableAllChartWidgets: false,       // 🎛️ CHART MASTER: Set to true to enable all chart-specific widgets
                enableAllFormWidgets: false,        // 🎛️ FORM MASTER: Set to true to enable all form-specific widgets
                enableAllDashboardWidgets: false    // 🎛️ DASHBOARD MASTER: Set to true to enable all additional dashboard widgets
            },
            
            // Widget visibility - simplified structure
            // Note: These individual settings are overridden by masterControls above
            widgetVisibility: {
                // Core widgets that are actually used
                enhancedPartsPlanner: true,      // Always enabled (core functionality)
                
                // Core Release Planning widgets (controlled by enableAllDisabledWidgets or individual master controls)
                releasePlanner: false,           // 📊 Release planning component
                bomViewer: false,                // 🔧 Bill of Materials viewer
                lineChart: false,                // 📈 Line chart widget
                partsTable: false,               // 📋 Parts data table
                
                // Chart widgets (controlled by enableAllChartWidgets or enableAllDisabledWidgets)
                pieChart: false,                 // 🥧 Pie chart
                scatterChart: false,             // 📊 Scatter plot
                barChart: false,                 // 📊 Bar chart
                areaChart: false,                // 📊 Area chart
                doughnutChart: false,            // 🍩 Doughnut chart
                bubbleChart: false,              // 💭 Bubble chart
                heatMap: false,                  // 🌡️ Heat map
                treeMap: false,                  // 🌳 Tree map
                radarChart: false,               // 📡 Radar chart
                gaugeChart: false,               // ⏲️ Gauge chart
                
                // Additional dashboard widgets (controlled by enableAllDashboardWidgets or enableAllDisabledWidgets)
                kpiCard: false,                  // 📊 KPI display card
                progressCard: false,             // 📈 Progress tracking card
                timelineWidget: false,           // ⏰ Timeline component
                calendarWidget: false,           // 📅 Calendar widget
                mapWidget: false,                // 🗺️ Map visualization
                dataGrid: false,                 // 📊 Advanced data grid
                kanbanBoard: false,              // 📋 Kanban board
                notification: false,             // 🔔 Notification widget
                weatherWidget: false,            // 🌤️ Weather display
                clockWidget: false,              // 🕐 Clock widget
                
                // Forms and specialized widgets (controlled by enableAllFormWidgets or enableAllDisabledWidgets)
                partPlanningForm: false,         // 📝 Part planning form
                contactForm: false               // 📞 Contact form
            },
            
            // =================================================================
            // Application State
            // =================================================================
            
            // Core app state
            loading: false,
            error: {
                show: false,
                message: ""
            },
            
            // Widget system
            dashboardConfig: null,
            availableWidgets: []
        };
    },
    computed: {
        // Current view mode
        currentViewMode() {
            return this.viewModes.current;
        },
        
        // Check if dashboard mode is active
        isDashboardMode() {
            return this.viewModes.current === "dashboard";
        },
        
        // Check if development mode is active  
        isDevelopmentMode() {
            return this.viewModes.current === "development";
        },
        
        // Count visible widgets
        visibleWidgetCount() {
            if (!this.dashboardConfig?.widgets) {
                return 0;
            }
            return this.dashboardConfig.widgets.filter(w => w.visible).length;
        },
        
        // Check if widget panel should be shown
        shouldShowWidgetPanel() {
            return this.ui.widgetPanel.enabled && 
                   this.ui.widgetPanel.visible && 
                   this.isDashboardMode;
        },
        
        // Get filtered available widgets based on visibility settings
        filteredAvailableWidgets() {
            return this.availableWidgets.filter(widget => 
                this.isWidgetAllowed(widget.id)
            );
        }
    },
    watch: {
        // Watch for view mode changes
        "viewModes.current"(newMode) {
            // Hide widget panel when switching away from dashboard
            if (newMode !== "dashboard") {
                this.ui.widgetPanel.visible = false;
            }
        },
        
        // Watch dashboard config changes
        dashboardConfig: {
            handler(newConfig) {
                if (process.env.NODE_ENV === "development") {
                    // eslint-disable-next-line no-console
                    console.log("app.vue: dashboardConfig updated", newConfig);
                }
            },
            deep: true
        }
    },
    async mounted() {
        try {
            this.loading = true;
            
            // Initialize dashboard configuration
            this.dashboardConfig = WidgetRegistry.getDefaultDashboard();
            this.availableWidgets = WidgetRegistry.getAvailableWidgets();
            
            // Filter widgets based on visibility settings
            if (this.dashboardConfig && this.dashboardConfig.widgets) {
                this.dashboardConfig.widgets = this.dashboardConfig.widgets.filter(widget => 
                    this.isWidgetAllowed(widget.id)
                );
            }
            
            if (this.availableWidgets) {
                this.availableWidgets = this.availableWidgets.filter(widget => 
                    this.isWidgetAllowed(widget.id)
                );
            }
            
        } catch (error) {
            this.handleError(error);
        } finally {
            this.loading = false;
        }
    },
    methods: {
        getStatusText() {
            switch (this.viewMode) {
                case "development":
                    return this.showDevelopmentModeStatus ? "Widget Development Area - Prototype & Test Widgets" : "";
                case "planning":
                    return this.showPlanningModeStatus ? "Release Planning Active" : "";
                case "dashboard":
                default: {
                    if (!this.showDashboardModeStatus) return "";
                    
                    const parts = [];
                    if (this.showWidgetCountInStatus) {
                        parts.push(`Widgets: ${this.visibleWidgetCount} visible`);
                    }
                    if (this.showFilterSummaryInStatus) {
                        const filters = this.getFilterSummary();
                        parts.push(`Filters: ${filters}`);
                    }
                    return parts.join(" | ");
                }
            }
        },

        handleWidgetCreated(widget) {
            // Handle widget creation from development area
            // Could save to localStorage, send to backend, etc.
            // eslint-disable-next-line no-console
            console.log("Widget created:", widget);
            
            // Optionally add to dashboard config for immediate testing
            if (this.dashboardConfig && this.dashboardConfig.widgets) {
                this.dashboardConfig.widgets.push({
                    id: widget.id,
                    visible: false,
                    ...widget
                });
            }
        },

        toggleEnhancedPlanner() {
            // Legacy method for backwards compatibility
            this.viewMode = this.viewMode === "planning" ? "dashboard" : "planning";
        },

        // Check if a widget should be visible based on boolean controls and master switches
        isWidgetAllowed(widgetId) {
            // Always allow core widgets that are explicitly enabled
            if (this.widgetVisibility[widgetId] === true) {
                return true;
            }
            
            // If widget is not defined, default to false
            if (this.widgetVisibility[widgetId] === undefined) {
                return false;
            }
            
            // Check master controls for bulk enabling
            if (this.masterControls.enableAllDisabledWidgets) {
                return true;
            }
            
            // Define widget categories for targeted master controls
            const chartWidgets = [
                "pieChart", "scatterChart", "barChart", "areaChart", "doughnutChart", 
                "bubbleChart", "heatMap", "treeMap", "radarChart", "gaugeChart", "lineChart"
            ];
            
            const dashboardWidgets = [
                "kpiCard", "progressCard", "timelineWidget", "calendarWidget", 
                "mapWidget", "dataGrid", "kanbanBoard", "notification", "weatherWidget", "clockWidget"
            ];
            
            const formWidgets = [
                "partPlanningForm", "contactForm"
            ];
            
            const coreReleaseWidgets = [
                "releasePlanner", "bomViewer", "partsTable"
            ];
            
            // Check specific master controls
            if (this.masterControls.enableAllChartWidgets && chartWidgets.includes(widgetId)) {
                return true;
            }
            
            if (this.masterControls.enableAllDashboardWidgets && dashboardWidgets.includes(widgetId)) {
                return true;
            }
            
            if (this.masterControls.enableAllFormWidgets && formWidgets.includes(widgetId)) {
                return true;
            }
            
            // For core release widgets, they can be enabled by either the main master switch or the chart/dashboard switches
            if (coreReleaseWidgets.includes(widgetId)) {
                if (this.masterControls.enableAllChartWidgets || this.masterControls.enableAllDashboardWidgets) {
                    return true;
                }
            }
            
            // Return the individual widget setting (will be false for disabled widgets)
            return this.widgetVisibility[widgetId] !== false;
        },

        toggleWidget(widgetId) {
            if (!this.dashboardConfig || !this.dashboardConfig.widgets) {
                return;
            }
            
            // Only allow toggling if widget is allowed by boolean controls
            const widget = this.dashboardConfig.widgets.find(w => w.id === widgetId);
            if (widget && this.isWidgetAllowed(widgetId)) {
                widget.visible = !widget.visible;
            }
        },
        
        isWidgetVisible(widgetId) {
            if (!this.dashboardConfig || !this.dashboardConfig.widgets) {
                return false;
            }
            
            const widget = this.dashboardConfig.widgets.find(w => w.id === widgetId);
            return widget ? widget.visible : false;
        },
        
        showAllWidgets() {
            if (this.dashboardConfig && this.dashboardConfig.widgets) {
                this.dashboardConfig.widgets.forEach(widget => {
                    widget.visible = true;
                });
            }
        },
        
        hideAllWidgets() {
            if (this.dashboardConfig && this.dashboardConfig.widgets) {
                this.dashboardConfig.widgets.forEach(widget => {
                    widget.visible = false;
                });
            }
        },
        
        resetToDefaultLayout() {
            try {
                this.dashboardConfig = WidgetRegistry.getDefaultDashboard();
            } catch (error) {
                this.handleError(error);
            }
        },
        
        getFilterSummary() {
            // Get filter values from orchestrator if available
            const orchestrator = this.$refs.orchestrator;
            if (orchestrator && orchestrator.getCurrentFilters) {
                const filters = orchestrator.getCurrentFilters();
                const parts = [];
                if (filters.program && filters.program !== "All") parts.push(`Program: ${filters.program}`);
                if (filters.phase && filters.phase !== "All") parts.push(`Phase: ${filters.phase}`);
                if (filters.organization && filters.organization !== "All") parts.push(`Org: ${filters.organization}`);
                return parts.length > 0 ? parts.join(", ") : "All";
            }
            return "Loading...";
        },
        
        handleRowClick(data) {
            // Handle row click - placeholder for future functionality
            if (data) {
                this.$emit("row-click", data);
            }
        },
        
        handleError(error) {
            this.errorMessage = error.message || "An error occurred";
            this.errorSnackbar = true;
            console.error("Dashboard error:", error);
        },
        
        // Master control helper methods
        enableAllWidgets() {
            this.masterControls.enableAllDisabledWidgets = true;
        },
        
        disableAllWidgets() {
            this.masterControls.enableAllDisabledWidgets = false;
            this.masterControls.enableAllChartWidgets = false;
            this.masterControls.enableAllDashboardWidgets = false;
            this.masterControls.enableAllFormWidgets = false;
        },
        
        enableAllCharts() {
            this.masterControls.enableAllChartWidgets = true;
        },
        
        enableAllDashboardWidgets() {
            this.masterControls.enableAllDashboardWidgets = true;
        },
        
        enableAllForms() {
            this.masterControls.enableAllFormWidgets = true;
        },
        
        // Get current master control status for debugging
        getMasterControlStatus() {
            return {
                allWidgets: this.masterControls.enableAllDisabledWidgets,
                charts: this.masterControls.enableAllChartWidgets,
                dashboard: this.masterControls.enableAllDashboardWidgets,
                forms: this.masterControls.enableAllFormWidgets,
                visibleCount: this.visibleWidgetCount
            };
        },
        
        handleHeaderClose() {
            // Handle header close button click
            // You can customize this behavior as needed
            this.ui.header.visible = false;
            this.$emit("header-closed");
        }
    }
};
</script>
