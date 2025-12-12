<!-- Release Planning Widget - Self-contained with prominent filter dropdowns -->
 
<template>
    <div class="enhanced-parts-planner" :class="{ 'kiosk-mode': isKioskMode }">
        <!-- Kiosk Mode Filter Badge Bar -->
        <v-card
            v-if="isKioskMode"
            class="kiosk-filter-badge-bar elevation-2 mb-3"
            color="blue-grey darken-4"
            dark
        >
            <v-card-text class="py-2 px-4">
                <div class="d-flex align-center justify-space-between">
                    <div class="d-flex align-center flex-wrap">
                        <v-chip
                            v-for="(filter, index) in activeFilterLabels"
                            :key="index"
                            small
                            color="blue darken-1"
                            class="mr-2 mb-1 mt-1 filter-badge"
                            dark
                        >
                            <v-icon small left>{{ filter.icon }}</v-icon>
                            <span class="font-weight-medium">{{ filter.text }}</span>
                        </v-chip>
                        <v-chip
                            v-if="activeFilterLabels.length === 0"
                            small
                            color="grey darken-1"
                            class="mr-2"
                            dark
                        >
                            <v-icon small left>mdi-filter-off</v-icon>
                            <span>No Filters Applied</span>
                        </v-chip>
                    </div>
                    <div class="d-flex align-center">
                        <v-chip
                            small
                            color="green darken-1"
                            dark
                            class="ml-2"
                        >
                            <v-icon small left>mdi-monitor-dashboard</v-icon>
                            <span class="font-weight-bold">KIOSK MODE</span>
                        </v-chip>
                        <v-chip
                            small
                            color="teal darken-1"
                            dark
                            class="ml-2 refresh-indicator"
                        >
                            <v-icon small left>mdi-refresh</v-icon>
                            <span class="font-weight-medium">
                                {{ kioskRefreshCountdown || '60s' }}
                            </span>
                        </v-chip>
                        <v-tooltip bottom>
                            <template #activator="{ on, attrs }">
                                <v-icon 
                                    small 
                                    class="ml-2" 
                                    color="white"
                                    v-bind="attrs"
                                    v-on="on"
                                >
                                    mdi-information
                                </v-icon>
                            </template>
                            <div style="max-width: 300px;">
                                <strong>Kiosk Mode Active</strong><br/>
                                • Auto-rotates pages every 10s<br/>
                                • Auto-refreshes data every 60s<br/>
                                • Shows 15 rows per page<br/>
                                • 30% chart, 70% table<br/>
                                • Copy URL to use on another display
                            </div>
                        </v-tooltip>
                        <v-btn
                            small
                            icon
                            color="white"
                            class="ml-2"
                            title="Exit Kiosk Mode"
                            @click="toggleKioskMode"
                        >
                            <v-icon small>mdi-close-circle</v-icon>
                        </v-btn>
                    </div>
                </div>
            </v-card-text>
        </v-card>

        <!-- Inline Filter Bar - Positioned ABOVE the header (Hidden in Kiosk Mode) -->
        <v-card
            v-if="!isKioskMode"
            ref="inlineFilterBar"
            class="inline-filter-bar elevation-3 mb-0"
        >
            <v-card-text class="px-4 py-3">
                <div class="filter-inline-row">
                    <v-select
                        v-model="objectType"
                        :items="objectTypeOptions"
                        item-text="text"
                        item-value="value"
                        label="Object Type"
                        prepend-inner-icon="mdi-table"
                        class="filter-inline-input object-type-dropdown"
                        :style="{ width: getDropdownWidth(objectTypeOptions.find(opt => opt.value === objectType)?.text, 'Object Type') }"
                        dense
                        outlined
                        hide-details
                    />
                    <v-select
                        v-for="filter in filterConfig"
                        :key="filter.key"
                        :value="filterValues[filter.key]"
                        :items="filter.options"
                        :placeholder="filter.placeholder"
                        :label="filter.label"
                        :prepend-inner-icon="filter.icon"
                        class="filter-inline-input"
                        :style="{ width: getDropdownWidth(filterValues[filter.key], filter.label) }"
                        dense
                        outlined
                        hide-details
                        clearable
                        :disabled="getFilterDisabledState(filter.key)"
                        :append-icon="filter.key === 'phase' && getFilterDisabledState('phase') ? 'mdi-lock-outline' : undefined"
                        @change="handleFilterChange({ key: filter.key, value: $event, allFilters: { ...filterValues, [filter.key]: $event } })"
                    />
                    <template v-if="currentDataType === 'parts'">
                        <v-select
                            v-model="filterValues.makeBuyFilter"
                            :items="makeBuyOptions"
                            label="Make / Buy"
                            prepend-inner-icon="mdi-factory"
                            class="filter-inline-input"
                            :style="{ width: getDropdownWidth(filterValues.makeBuyFilter, 'Make / Buy') }"
                            dense
                            outlined
                            hide-details
                            :disabled="makeBuyOptions.length <= 1"
                        />
                        <v-select
                            v-model="filterValues.partTypeFilter"
                            :items="partTypeDisplayOptions"
                            item-text="text"
                            item-value="value"
                            label="Part Type"
                            prepend-inner-icon="mdi-cog"
                            class="filter-inline-input"
                            :style="{ width: getDropdownWidth(partTypeDisplayOptions.find(opt => opt.value === filterValues.partTypeFilter)?.text || filterValues.partTypeFilter, 'Part Type') }"
                            dense
                            outlined
                            hide-details
                            :disabled="partTypeOptions.length <= 1"
                        />
                    </template>
                    
                    <!-- Chart Visibility Controls -->
                    <div class="chart-controls ml-4 d-flex align-center">
                        <v-divider vertical class="mr-3" />
                        <span class="text-caption text--secondary mr-2">Charts:</span>
                        <v-btn-toggle
                            multiple
                            dense
                            class="chart-toggle-group"
                        >
                            <v-btn
                                small
                                :value="chartVisibility.releaseChart"
                                :color="chartVisibility.releaseChart ? 'primary' : 'grey'"
                                :outlined="!chartVisibility.releaseChart"
                                @click="chartVisibility.releaseChart = !chartVisibility.releaseChart"
                            >
                                <v-icon small left>mdi-chart-line</v-icon>
                                Release Chart
                            </v-btn>
                            <v-btn
                                small
                                :value="chartVisibility.lateReleaseChart"
                                :color="chartVisibility.lateReleaseChart ? 'orange' : 'grey'"
                                :outlined="!chartVisibility.lateReleaseChart"
                                :dark="chartVisibility.lateReleaseChart"
                                @click="chartVisibility.lateReleaseChart = !chartVisibility.lateReleaseChart"
                            >
                                <v-icon small left>mdi-chart-bar</v-icon>
                                Critical Release
                            </v-btn>
                        </v-btn-toggle>
                    </div>
                    
                    <!-- Settings Gear Icon -->
                    <v-btn
                        icon
                        small
                        color="grey darken-1"
                        class="ml-2"
                        @click="settingsDialog = true"
                    >
                        <v-icon>mdi-cog</v-icon>
                    </v-btn>
                </div>
            </v-card-text>
        </v-card>

        <!-- Header with Title - Positioned BELOW the filter bar (Hidden in Kiosk Mode) -->
        <v-card-title v-if="!isKioskMode" class="planner-header">
            <v-icon left color="primary">mdi-clipboard-list</v-icon>
            {{ widgetTitle }}
            
            <!-- Show selected data type prominently in header -->
            <v-chip 
                v-if="currentDataType"
                color="primary"
                small
                class="ml-3 selected-data-type-header-chip"
                style="font-weight: 600;"
            >
                <v-icon small left>mdi-check-circle</v-icon>
                {{ currentDataType.toUpperCase() }}
            </v-chip>
            
            <v-spacer />
            
            <!-- Clear Cache Button with Safety Measures -->
            <v-btn
                small
                text
                color="grey darken-1"
                class="mr-4"
                :loading="clearingCache"
                :disabled="clearingCache"
                @click="confirmClearCache"
            >
                <v-icon small left>mdi-refresh</v-icon>
                Clear Cache
            </v-btn>
            
            <!-- Dancing Banana Background Preloading Indicator -->
            <v-tooltip v-if="backgroundPreloadingCA" bottom>
                <template #activator="{ on, attrs }">
                    <v-chip 
                        small
                        color="warning"
                        class="mr-2 dancing-banana-chip"
                        v-bind="attrs"
                        v-on="on"
                    >
                        <span class="dancing-banana-character mr-1"></span>
                        <span class="font-weight-medium">
                            {{ preloadingProgress.total > 0 ? 
                                `Loading CA: ${preloadingProgress.current}/${preloadingProgress.total}` : 
                                "Preloading CA Data..." }}
                        </span>
                    </v-chip>
                </template>
                <div style="max-width: 280px; text-align: center;">
                    <strong>🍌 Background CA Data Gathering</strong><br/>
                    <span class="text-caption">
                        Loading Change Action data in the background to make your exports lightning fast! 
                        This won't slow down the UI and will cache data for all table rows.
                    </span>
                    <br/><br/>
                    <v-chip x-small color="success" outlined>
                        <v-icon x-small left>mdi-speedometer</v-icon>
                        Export Optimization Active
                    </v-chip>
                </div>
            </v-tooltip>
            
            <v-chip 
                :color="apiEnvironmentChip.color" 
                small
                outlined
            >
                <v-icon small left>{{ apiEnvironmentChip.icon }}</v-icon>
                {{ apiEnvironmentChip.text }}
            </v-chip>

            <!-- Kiosk Mode Toggle -->
            <v-btn
                small
                :color="isKioskMode ? 'green' : 'grey'"
                class="ml-3"
                @click="toggleKioskMode"
            >
                <v-icon small left>{{ isKioskMode ? 'mdi-monitor-dashboard' : 'mdi-monitor' }}</v-icon>
                {{ isKioskMode ? 'Kiosk Mode' : 'Enable Kiosk' }}
            </v-btn>
        </v-card-title>

        <v-alert
            v-if="!isKioskMode && showDataErrors && dataSourceStatus.hasError"
            type="error"
            outlined
            dense
            icon="mdi-alert-circle"
            class="mx-4 mt-2"
        >
            {{ dataSourceStatus.message }}
        </v-alert>

        <v-dialog
            v-model="loading"
            persistent
            width="420"
            content-class="loading-dashboard-dialog"
            overlay-opacity="0.35"
            eager
        >
            <v-card class="loading-dashboard-card elevation-16 py-6 px-6">
                <div class="loading-card-header d-flex align-center justify-space-between">
                    <div class="d-flex align-center">
                        <v-icon color="white" size="36" class="mr-3">mdi-view-dashboard</v-icon>
                        <div>
                            <h3 class="loading-title mb-1">{{ loadingDialog.headline }}</h3>
                            <p class="loading-detail mb-0">{{ loadingDialog.detail }}</p>
                        </div>
                    </div>
                    <v-icon color="white" size="24" class="loading-sync-icon">mdi-sync</v-icon>
                </div>

                <div class="loading-progress-block mt-6">
                    <div class="d-flex align-center justify-space-between mb-2">
                        <span class="loading-progress-percentage">{{ loadingPercentDisplay }}</span>
                        <span class="loading-progress-stage">{{ loadingDialog.progressLabel }}</span>
                    </div>
                    <v-progress-linear
                        :value="loadingDialog.percent"
                        color="white"
                        background-color="rgba(255, 255, 255, 0.35)"
                        height="12"
                        rounded
                    />
                </div>

                <div class="loading-status-block mt-8">
                    <div class="loading-status-row d-flex align-center mb-3">
                        <v-icon small color="white" class="mr-3">mdi-layers-triple</v-icon>
                        <span class="loading-status-text">{{ loadingPhaseDisplay }}</span>
                    </div>
                    <div class="loading-status-row d-flex align-center">
                        <v-icon small color="white" class="mr-3">mdi-database-import</v-icon>
                        <span class="loading-status-text">{{ loadingStatusDisplay }}</span>
                    </div>
                </div>
            </v-card>
        </v-dialog>

        <!-- Layout: Chart and Stats Side by Side -->
        <div class="content-wrapper">
            <!-- Chart and Stats Row - Clean Horizontal Layout -->
            <div class="chart-stats-row">
                <!-- Chart Container - Takes most of the space -->
                <v-card v-if="chartVisibility.releaseChart" class="chart-card" elevation="2">
                    <v-card-title v-if="!isKioskMode" class="pa-2" style="border-bottom: 1px solid #e0e0e0;">
                        <v-icon left color="primary" size="20">mdi-chart-line</v-icon>
                        <span class="text-subtitle-1 font-weight-medium">Release Timeline</span>
                        <v-spacer />
                        <!-- Legend inline in header -->
                        <div class="d-flex align-center">
                            <!-- Focus 30 Button -->
                            <v-btn
                                small
                                :color="chartFocusActive ? 'orange darken-2' : 'orange darken-1'"
                                dark
                                class="mr-2"
                                :outlined="!chartFocusActive"
                                :title="chartFocusActive ? 'Exit focus mode - show full timeline' : 'Zoom chart to ±30 days from today'"
                                @click="focusOn30Days"
                            >
                                <v-icon small left>{{ chartFocusActive ? 'mdi-arrow-expand' : 'mdi-calendar-range' }}</v-icon>
                                {{ chartFocusActive ? 'Reset' : 'Focus 30' }}
                            </v-btn>
                            
                            <v-chip 
                                small 
                                :color="showTargetLine ? 'primary' : 'grey'"
                                class="legend-chip"
                                @click="toggleTargetLine"
                            >
                                <v-icon small left>{{ showTargetLine ? 'mdi-eye' : 'mdi-eye-off' }}</v-icon>
                                Target
                            </v-chip>
                            <v-chip 
                                small 
                                :color="showActualLine ? 'success' : 'grey'"
                                class="legend-chip"
                                @click="toggleActualLine"
                            >
                                <v-icon small left>{{ showActualLine ? 'mdi-eye' : 'mdi-eye-off' }}</v-icon>
                                Actual
                            </v-chip>
                            <v-chip 
                                v-if="showCriticalControls"
                                small 
                                :color="showCriticalLine ? 'error' : 'grey'"
                                class="legend-chip"
                                @click="toggleCriticalLine"
                            >
                                <v-icon small left>{{ showCriticalLine ? 'mdi-eye' : 'mdi-eye-off' }}</v-icon>
                                Critical
                            </v-chip>
                        </div>
                    </v-card-title>
                    
                    <v-card-text class="pa-2" :class="isKioskMode ? 'kiosk-chart-content' : ''">
                        <!-- Reduce chart height by 25% -->
                        <div style="height: 285px; width: 100%; display: flex; flex-direction: column;">
                            <ReleaseChart
                                v-if="chartData.labels?.length > 0"
                                ref="lineChart"
                                :chart-data="focusedChartData"
                                :chart-options="dynamicChartOptions"
                                :extra-plugins="todayLinePlugins"
                                style="flex: 1; width: 100%;"
                            />
                            <div v-else class="no-chart-data d-flex flex-column align-center justify-center" style="flex: 1;">
                                <v-icon size="64" color="grey lighten-2">mdi-chart-line-variant</v-icon>
                                <h4 class="mt-4">No Chart Data</h4>
                                <p class="text-center mt-2">Use the filters above to select data</p>
                                <v-btn
                                    color="primary"
                                    outlined
                                    small
                                    class="mt-3"
                                    @click="scrollToFilters"
                                >
                                    <v-icon small left>mdi-filter-variant</v-icon>
                                    Adjust Filters
                                </v-btn>
                            </div>
                        </div>
                    </v-card-text>
                </v-card>
                
                <!-- Bar Chart Container - Late Release Distribution (Parts Data Only) -->
                <v-card v-if="currentDataType === 'parts' && chartVisibility.lateReleaseChart" class="chart-card late-release-chart-card" elevation="2">
                    <v-card-title class="pa-2" style="border-bottom: 1px solid #e0e0e0;">
                        <v-icon left color="orange" size="20">mdi-chart-bar</v-icon>
                        <span class="text-subtitle-1 font-weight-medium">
                            Critical Release - Actual Release
                            <v-chip v-if="isLateReleaseChartZoomed" x-small color="orange" class="ml-2">
                                Zoomed: {{ zoomedTimeBucket }}
                            </v-chip>
                        </span>
                        <v-spacer />
                        <!-- Reset Selection Button -->
                        <v-btn
                            small
                            outlined
                            color="grey"
                            class="ml-2"
                            :title="isLateReleaseChartZoomed ? 'Reset zoom and clear filter' : 'Clear chart selection'"
                            :loading="chartInteractionLoading"
                            @click="resetLateReleaseChart()"
                        >
                            <v-icon small left>{{ isLateReleaseChartZoomed ? 'mdi-magnify-minus' : 'mdi-filter-remove-outline' }}</v-icon>
                            {{ isLateReleaseChartZoomed ? 'Reset Zoom' : 'Clear Selection' }}
                        </v-btn>
                    </v-card-title>
                    <v-card-text class="pa-2">
                        <!-- Loading Overlay -->
                        <v-overlay :value="chartInteractionLoading" absolute>
                            <v-progress-circular
                                indeterminate
                                size="64"
                                color="primary"
                            />
                        </v-overlay>
                        
                        <!-- Under Construction Overlay -->
                        <div class="under-construction-overlay">
                            <v-chip
                                color="warning"
                                text-color="white"
                                class="under-construction-chip"
                            >
                                <v-icon small left>mdi-hammer-wrench</v-icon>
                                Under Construction
                            </v-chip>
                        </div>
                        
                        <!-- Reduce chart height by 25% -->
                        <div style="height: 285px; width: 100%; position: relative;">
                            <!-- Direct Chart.js v4 canvas - following candle bar pattern -->
                            <canvas 
                                ref="lateReleaseChartCanvas"
                                style="width: 100%; height: 100%; display: block;"
                            ></canvas>
                        </div>
                    </v-card-text>
                </v-card>
                
                <!-- Release Stats Container - Compact Width -->
                <v-card class="stats-card" elevation="2">
                    <v-card-title class="pa-2" style="border-bottom: 1px solid #e0e0e0;">
                        <v-icon left color="primary" size="20">mdi-chart-bar</v-icon>
                        <span class="text-subtitle-1 font-weight-medium">Release Stats</span>
                        <v-spacer />
                        <!-- Sleek Clear Filter Icon -->
                        <v-btn
                            v-if="selectedStatFilter !== 'all'"
                            icon
                            x-small
                            color="primary"
                            class="clear-filter-icon"
                            title="Clear Filter"
                            @click="filterByReleaseStatus('all')"
                        >
                            <v-icon size="18">mdi-filter-off</v-icon>
                        </v-btn>
                    </v-card-title>
                    
                    <v-card-text class="pa-1" style="height: auto; overflow-y: visible;">
                        <div v-if="releaseStats" class="d-flex flex-column" style="gap: 2px; padding: 4px;">
                            <v-card
                                v-for="stat in releaseStatsArray"
                                :key="stat.key"
                                class="stat-item-compact py-1 px-2 d-flex align-center justify-space-between"
                                :class="{ 
                                    'primary--border': selectedStatFilter === stat.key,
                                    'v-card--disabled': stat.count === 0,
                                    'error--border': stat.key === 'criticallyOverdue',
                                    'warning--border': stat.key === 'overdue'
                                }"
                                :style="{ 
                                    borderColor: selectedStatFilter === stat.key ? '#1976d2' : 
                                        stat.key === 'criticallyOverdue' ? '#d32f2f' : 
                                        stat.key === 'overdue' ? '#ff9800' : '#e0e0e0',
                                    backgroundColor: selectedStatFilter === stat.key ? 'rgba(25, 118, 210, 0.1)' : 
                                        stat.key === 'criticallyOverdue' ? 'rgba(211, 47, 47, 0.05)' : 
                                        stat.key === 'overdue' ? 'rgba(255, 152, 0, 0.05)' : '#fafafa',
                                    minHeight: '48px'
                                }"
                                outlined
                                @click="stat.count > 0 ? filterByReleaseStatus(stat.key) : null"
                            >
                                <div class="d-flex flex-column justify-center" style="flex: 1;">
                                    <span 
                                        class="text-body-2 font-weight-bold primary--text"
                                        :class="{ 
                                            'error--text': stat.key === 'criticallyOverdue',
                                            'orange--text': stat.key === 'overdue'
                                        }"
                                        style="line-height: 1.2;"
                                    >
                                        {{ stat.displayText || stat.count }}
                                    </span>
                                    <span class="text-caption font-weight-medium" style="line-height: 1.1; margin-top: 2px;">{{ stat.label }}</span>
                                </div>
                                <v-icon 
                                    v-if="selectedStatFilter === stat.key"
                                    small 
                                    color="primary"
                                    class="opacity-80"
                                >
                                    mdi-check
                                </v-icon>
                            </v-card>
                        </div>
                        <div v-else class="d-flex flex-column align-center justify-center" style="height: 100%;">
                            <v-icon size="48" color="grey lighten-2">mdi-chart-bar</v-icon>
                            <p class="text-center mt-2 caption">No stats available</p>
                        </div>
                    </v-card-text>
                </v-card>
            </div>
            
            <!-- Table - Maximized Space Usage -->
            <v-card class="table-card" elevation="2">
                <v-card-title class="table-header pa-2">
                    <v-icon left size="20">mdi-table</v-icon>
                    <span class="text-subtitle-1 font-weight-medium">{{ currentDataType ? currentDataType.toUpperCase() + ' Data' : 'Data Table' }}</span>
                    
                    <!-- Enhanced data type indicator in table header -->
                    <v-chip 
                        v-if="currentDataType"
                        color="primary"
                        small
                        class="ml-3 table-data-type-chip"
                    >
                        <v-icon small left>mdi-check-circle</v-icon>
                        {{ currentDataType.toUpperCase() }}
                    </v-chip>
                    
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
                
                <v-card-text class="pa-0 position-relative table-content-wrapper">
                    <!-- Loading Overlay for Better Visibility -->
                    <!-- Show getting started message when no data type is selected -->
                    <div v-if="!currentDataType" class="getting-started-message d-flex flex-column align-center justify-center" style="min-height: 300px; padding: 40px;">
                        <v-icon size="64" color="primary" class="mb-4">mdi-format-list-checks</v-icon>
                        <h3 class="text-h5 font-weight-light primary--text mb-2">Welcome to Release Planner</h3>
                        <p class="text-body-1 grey--text text--darken-2 mb-4 text-center">
                            Select a data type from the filters above to get started
                        </p>
                        <v-btn
                            color="primary"
                            large
                            outlined
                            @click="scrollToFilters"
                        >
                            <v-icon left>mdi-filter-variant</v-icon>
                            Choose Filters
                        </v-btn>
                    </div>
                    
                    <!-- Show data table when data type is selected and data is available -->
                    <v-data-table
                        v-else-if="currentDataType && filteredTableData.length > 0"
                        :headers="tableHeaders"
                        :items="isKioskMode ? kioskPagedData : filteredTableData"
                        :loading="loading"
                        :dense="isMobile"
                        :height="dynamicTableHeight"
                        :fixed-header="true"
                        :items-per-page="currentItemsPerPage"
                        :hide-default-footer="isKioskMode"
                        :footer-props="{
                            'items-per-page-options': [5, 10, 15, 20, 50, 100],
                            'show-current-page': true,
                            'show-first-last-page': true
                        }"
                        :mobile-breakpoint="0"
                        :item-class="getRowClass"
                        item-value="partNo"
                        class="pa-0 draggable-table"
                        @click:row="handleRowClick"
                    >
                        <!-- Custom header template with tooltips -->
                        <template #header="{ header }">
                            <span class="font-weight-medium">
                                <v-icon v-if="header && header.icon" small class="mr-1">{{ header.icon }}</v-icon>
                                {{ header ? header.text : '' }}
                                <v-tooltip v-if="header && header.tooltip" bottom max-width="300">
                                    <template #activator="{ on, attrs }">
                                        <v-icon small class="ml-1" color="grey" v-bind="attrs" v-on="on">
                                            mdi-help-circle-outline
                                        </v-icon>
                                    </template>
                                    <span>{{ header.tooltip }}</span>
                                </v-tooltip>
                            </span>
                        </template>
                        
                        <!-- Custom cell rendering using item slots for specific columns -->
                        <template v-for="header in tableHeaders.filter(h => h.component)" #[`item.${header.value}`]="{ item, index }">
                            <!-- Use ChangeActionCell component for CA/CR fields -->
                            <ChangeActionCell
                                v-if="header.component === 'ChangeActionCell'"
                                :key="`ca-${header.value}-${item.uniqueId || item.physId || item.objId || index}-${changeActionRefreshKey}`"
                                :obj-id="item.physId || item.objId"
                                :unique-id="item.uniqueId || item.physId || item.objId || `row_${index}`"
                                :row-index="index"
                                :field="header.componentProps.field"
                                :item-type="header.componentProps.itemType || 'ca'"
                                :item-number="currentDataType === 'parts' ? '' : getItemNumberForCell(header, item)"
                                :item-state="currentDataType === 'parts' ? '' : getItemStateForCell(header, item)"
                                :phys-id="currentDataType === 'parts' ? '' : (item.physId || item.objId)"
                                :filter-context="filterValues"
                                :current-data-type="currentDataType"
                                @ca-number-loaded="onCaNumberLoaded"
                                @cr-number-loaded="onCrNumberLoaded"
                            />
                            <!-- Use StatusCommentDisplay component for status comment fields -->
                            <!-- Only used for CAs/CRs, not for parts -->
                            <StatusCommentDisplay
                                v-else-if="header.component === 'StatusCommentDisplay'"
                                :key="`comment-${header.value}-${index}`"
                                :value="getStatusCommentValue(header, item)"
                                :object-id="item.physId || item.objId || item.id"
                                :item-type="header.componentProps.itemType"
                                :can-edit="getCanEditValue(header, item)"
                                @comment-updated="handleCommentUpdate"
                                @show-message="showSnackbar"
                            />
                        </template>

                        <!-- Custom template for Part Number / Rev - make it a hyperlink for PARTS data type -->
                        <template v-if="currentDataType === 'parts'" #item.partNoWithRev="{ item }">
                            <a 
                                :href="`https://3dspace-prod.beta.team/3dspace/common/emxTree.jsp?objectId=${item.physId || item.objId}&DefaultCategory=betaProductNavigatorPortalCmd`"
                                target="_blank"
                                rel="noopener noreferrer"
                                class="part-number-link"
                                :title="`Open ${item.partNoWithRev} in 3DSpace`"
                            >
                                {{ item.partNoWithRev }}
                                <v-icon x-small class="ml-1" color="primary">mdi-open-in-new</v-icon>
                            </a>
                        </template>

                        <!-- Custom template for Description with tooltip -->
                        <template #item.description="{ item }">
                            <v-tooltip bottom>
                                <template #activator="{ on, attrs }">
                                    <div
                                        v-bind="attrs"
                                        class="text-truncate"
                                        style="max-width: 350px;"
                                        v-on="on"
                                    >
                                        {{ item.description }}
                                    </div>
                                </template>
                                <span>{{ item.description }}</span>
                            </v-tooltip>
                        </template>

                        <!-- Custom template for Change Description with tooltip -->
                        <template #item.changeDescription="{ item }">
                            <v-tooltip bottom>
                                <template #activator="{ on, attrs }">
                                    <div
                                        v-bind="attrs"
                                        class="text-truncate"
                                        style="max-width: 350px;"
                                        v-on="on"
                                    >
                                        {{ item.changeDescription }}
                                    </div>
                                </template>
                                <span>{{ item.changeDescription }}</span>
                            </v-tooltip>
                        </template>

                        <!-- Custom template for System Group Short with full value tooltip -->
                        <template v-if="currentDataType === 'parts'" #item.engSystemGroupShort="{ item }">
                            <v-tooltip bottom>
                                <template #activator="{ on, attrs }">
                                    <span
                                        v-bind="attrs"
                                        v-on="on"
                                    >
                                        {{ item.engSystemGroupShort }}
                                    </span>
                                </template>
                                <span>{{ item.engSystemGroup }}</span>
                            </v-tooltip>
                        </template>
                    </v-data-table>

                    <!-- Kiosk Mode Page Indicator Bar -->
                    <v-card
                        v-if="isKioskMode && filteredTableData.length > 0"
                        class="kiosk-page-indicator elevation-2 mt-2"
                        color="blue-grey darken-3"
                        dark
                    >
                        <v-card-text class="py-2 px-4">
                            <div class="d-flex align-center justify-space-between">
                                <div class="d-flex align-center">
                                    <v-icon small class="mr-2">mdi-file-document-multiple</v-icon>
                                    <span class="font-weight-medium">
                                        Showing {{ ((kioskCurrentPage - 1) * kioskRowsPerPage) + 1 }} - 
                                        {{ Math.min(kioskCurrentPage * kioskRowsPerPage, filteredTableData.length) }} 
                                        of {{ filteredTableData.length }} items
                                    </span>
                                    <span v-if="kioskLastRefreshTime" class="ml-4 caption grey--text text--lighten-1">
                                        <v-icon x-small class="mr-1">mdi-clock-outline</v-icon>
                                        Updated {{ kioskLastRefreshDisplay }}
                                    </span>
                                </div>
                                <div class="d-flex align-center">
                                    <span class="mr-3 caption">Page {{ kioskCurrentPage }} of {{ kioskTotalPages }}</span>
                                    <div class="d-flex align-center">
                                        <v-chip
                                            v-for="page in kioskPageIndicators"
                                            :key="page"
                                            x-small
                                            :color="page === kioskCurrentPage ? 'blue' : 'grey darken-1'"
                                            class="mx-1 page-dot"
                                            :class="{ 'active-page': page === kioskCurrentPage }"
                                        >
                                            {{ page }}
                                        </v-chip>
                                    </div>
                                </div>
                            </div>
                        </v-card-text>
                    </v-card>
                    
                    <!-- Show no data message when data type is selected but no data is available (and not loading or clearing cache) -->
                    <div v-if="currentDataType && filteredTableData.length === 0 && !loading && !clearingCache" class="no-data-message d-flex flex-column align-center justify-center" style="min-height: 300px; padding: 40px;">
                        <!-- Different messages based on whether phase is selected -->
                        <template v-if="!filterValues.phase || filterValues.phase === ''">
                            <v-icon size="48" color="info">mdi-map-marker-question</v-icon>
                            <p class="mt-4 text-h6">Select a Phase to View Data</p>
                            <p class="caption">Choose a program and phase from the filters to load {{ currentDataType.toUpperCase() }} data</p>
                            <v-btn
                                color="primary"
                                outlined
                                small
                                class="mt-3"
                                @click="scrollToFilters"
                            >
                                <v-icon left small>mdi-filter-variant</v-icon>
                                Adjust Filters
                            </v-btn>
                        </template>
                        <template v-else>
                            <v-icon size="48" color="grey">mdi-table-off</v-icon>
                            <p class="mt-4 text-h6">No {{ currentDataType.toUpperCase() }} data available</p>
                            <p class="caption">No data found for the selected phase "{{ filterValues.phase }}"</p>
                            <v-btn
                                color="primary"
                                outlined
                                small
                                class="mt-3"
                                @click="scrollToFilters"
                            >
                                <v-icon left small>mdi-filter-variant</v-icon>
                                Try Different Phase
                            </v-btn>
                        </template>
                    </div>
                </v-card-text>
            </v-card>
        </div>
        
        <!-- Clear Cache Confirmation Dialog -->
        <v-dialog v-model="showClearCacheDialog" max-width="500" persistent>
            <v-card>
                <v-card-title class="headline">
                    <v-icon left color="warning">mdi-alert-circle</v-icon>
                    Clear Cache Confirmation
                </v-card-title>
                
                <v-card-text>
                    <p class="text-body-1 mb-3">
                        Are you sure you want to clear all cached data? This will:
                    </p>
                    <ul class="text-body-2 mb-3">
                        <li>Clear all API response cache</li>
                        <li>Clear session storage data</li>
                        <li>Clear local storage (except user preferences)</li>
                        <li>Force refresh data from the server</li>
                    </ul>
                    <v-alert type="info" dense class="mt-3">
                        <small>This action cannot be undone and may cause a brief loading delay while data is re-fetched.</small>
                    </v-alert>
                </v-card-text>
                
                <v-card-actions>
                    <v-spacer />
                    <v-btn
                        text
                        @click="showClearCacheDialog = false"
                    >
                        Cancel
                    </v-btn>
                    <v-btn
                        color="warning"
                        :loading="clearingCache"
                        :disabled="clearingCache"
                        @click="clearCacheAndRefresh"
                    >
                        <v-icon left>mdi-refresh</v-icon>
                        Clear Cache
                    </v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>

        <!-- Settings Dialog -->
        <v-dialog v-model="settingsDialog" max-width="600" persistent>
            <v-card>
                <v-card-title class="primary white--text">
                    <v-icon left color="white">mdi-cog</v-icon>
                    Set Default Program
                </v-card-title>
                
                <v-card-text class="pt-4">
                    <p class="mb-4">
                        Set a default program that will be automatically selected when the widget loads.
                    </p>
                    
                    <v-select
                        v-model="defaultProgram"
                        :items="programsWithAll"
                        label="Default Program"
                        prepend-inner-icon="mdi-briefcase"
                        outlined
                        dense
                        hint="Leave as 'All' to show all programs by default"
                        persistent-hint
                    />
                </v-card-text>
                
                <v-card-actions>
                    <v-btn
                        text
                        @click="resetDefaultProgram"
                    >
                        <v-icon left>mdi-restore</v-icon>
                        RESET TO ALL
                    </v-btn>
                    <v-spacer />
                    <v-btn
                        text
                        @click="cancelSettings"
                    >
                        CANCEL
                    </v-btn>
                    <v-btn
                        color="primary"
                        @click="saveDefaultProgram"
                    >
                        <v-icon left>mdi-content-save</v-icon>
                        SAVE DEFAULT
                    </v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>

        <!-- Version Number Display -->
        <div class="version-display">
            <v-chip
                small
                color="success"
                outlined
                class="version-chip"
            >
                <v-icon small left>mdi-check-circle</v-icon>
                Ready
            </v-chip>
            <v-chip
                small
                color="primary"
                class="version-number-chip"
            >
                v{{ appVersion }}
            </v-chip>
        </div>

    </div>
</template>

<style scoped>
/* Clean Layout Structure */
.content-wrapper {
  padding: 24px 24px 8px 24px; /* Reduced bottom padding from 24px to 8px */
  width: 100%;
  max-width: 100vw; /* DON'T EXCEED VIEWPORT */
  overflow-x: auto; /* ALLOW HORIZONTAL SCROLL IF NEEDED */
  overflow-y: visible;
  box-sizing: border-box; /* INCLUDE PADDING IN WIDTH */
}

.chart-stats-row {
  display: grid;
  gap: 16px;
  margin-bottom: 12px;
  align-items: stretch;
}

/* Dynamic grid based on chart visibility */
.chart-stats-row {
  grid-template-columns: 1fr 1fr 200px; /* Default: both charts + stats */
}

/* Only release chart visible (late chart hidden) */
.chart-stats-row:not(:has(.late-release-chart-card)) {
  grid-template-columns: 1fr 200px;
}

/* Only late release chart visible (main chart hidden) - for parts data */
.chart-stats-row:not(:has(.chart-card:first-child)) .late-release-chart-card {
  grid-column: 1;
}

.chart-card {
  border-radius: 8px;
  min-width: 350px;
  display: flex;
  flex-direction: column;
  min-height: 380px; /* Ensure consistent minimum height */
}

.chart-card .v-card__text {
  flex: 1; /* Fill remaining space to match stats card height */
  display: flex;
  flex-direction: column;
  min-height: 320px; /* Ensure chart content area has consistent height */
}

.stats-card {
  width: 200px;
  flex-shrink: 0; /* DON'T COMPRESS */
  border-radius: 8px;
  display: flex;
  flex-direction: column;
}

/* Responsive layout for smaller screens */
@media (max-width: 1200px) {
  .chart-stats-row {
    grid-template-columns: 1fr;
  }
  
  .stats-card {
    display: none;
  }
}

@media (max-width: 768px) {
  .chart-stats-row {
    grid-template-columns: 1fr;
  }
  
  .stats-card {
    width: 100%;
  }
}

.table-card {
  border-radius: 8px;
  width: 100%; /* FILL CONTENT WRAPPER */
  max-width: 100%; /* DON'T EXCEED CONTENT WRAPPER */
  overflow: visible; /* Let inner wrapper handle overflow */
  display: flex;
  flex-direction: column;
  /* Removed fixed max-height to allow dynamic sizing */
}

/* Prevent v-card-text from adding extra height */
.table-content-wrapper {
  display: flex !important;
  flex-direction: column !important;
  min-height: 0 !important;
  height: auto !important;
  overflow: visible !important;
}

/* Position relative for loading overlay */
.position-relative {
  position: relative;
}

.loading-dashboard-dialog {
    backdrop-filter: blur(1px);
}

.loading-dashboard-card {
    background: linear-gradient(135deg, #2a7fde, #52a5ff);
    border-radius: 16px;
    color: white;
    box-shadow: 0 18px 48px rgba(42, 127, 222, 0.4);
}

.loading-card-header {
    gap: 12px;
}

.loading-title {
    font-size: 1.2rem;
    font-weight: 700;
    letter-spacing: 0.3px;
}

.loading-detail {
    font-size: 0.95rem;
    opacity: 0.85;
    letter-spacing: 0.2px;
}

.loading-sync-icon {
    animation: loadingSyncRotation 1.2s linear infinite;
}

.loading-progress-block {
    padding: 0 4px;
}

.loading-progress-percentage {
    font-size: 1.25rem;
    font-weight: 700;
}

.loading-progress-stage {
    font-size: 0.85rem;
    opacity: 0.85;
    text-transform: uppercase;
    letter-spacing: 0.12rem;
}

.loading-status-block {
    background-color: rgba(255, 255, 255, 0.12);
    border-radius: 12px;
    padding: 16px 20px;
}

.loading-status-row {
    gap: 12px;
}

.loading-status-text {
    font-size: 0.9rem;
    letter-spacing: 0.25px;
}

@keyframes loadingSyncRotation {
    from {
        transform: rotate(0deg);
    }
    to {
        transform: rotate(-360deg);
    }
}

/* Kiosk Mode Filter Badge Bar Styles */
.kiosk-filter-badge-bar {
    border-radius: 8px !important;
    position: sticky;
    top: 0;
    z-index: 10;
}

.kiosk-filter-badge-bar .v-card__text {
    min-height: 50px;
}

.filter-badge {
    font-size: 0.875rem !important;
    height: 28px !important;
    letter-spacing: 0.3px;
}

.filter-badge .v-chip__content {
    font-weight: 500;
}

/* Kiosk Mode Page Indicator Styles */
.kiosk-page-indicator {
    border-radius: 6px !important;
    position: sticky;
    bottom: 0;
    z-index: 9;
}

.kiosk-page-indicator .v-card__text {
    min-height: 40px;
}

.page-dot {
    min-width: 28px !important;
    height: 22px !important;
    font-size: 0.75rem !important;
    font-weight: 600;
    transition: all 0.3s ease;
}

.page-dot.active-page {
    transform: scale(1.2);
    box-shadow: 0 0 8px rgba(33, 150, 243, 0.6);
}

/* Kiosk Mode Refresh Animation */
@keyframes refreshPulse {
    0%, 100% {
        opacity: 1;
        transform: scale(1);
    }
    50% {
        opacity: 0.7;
        transform: scale(1.05);
    }
}

.refresh-indicator {
    animation: refreshPulse 2s ease-in-out infinite;
}

/* Kiosk Mode Layout Optimizations */
.kiosk-layout {
    margin: 0 !important;
    padding: 4px !important;
}

.kiosk-chart-row {
    margin-left: 0 !important;
    margin-bottom: 4px !important;
    gap: 0 !important;
}

.kiosk-chart-content {
    padding: 4px !important;
}

/* Kiosk mode - increase font sizes for visibility */
.enhanced-parts-planner.kiosk-mode .v-data-table {
    font-size: 1.1rem !important;
}

.enhanced-parts-planner.kiosk-mode .v-data-table th {
    font-size: 1.15rem !important;
    font-weight: 700 !important;
}

.enhanced-parts-planner.kiosk-mode .v-data-table td {
    font-size: 1.05rem !important;
    padding: 12px 16px !important;
}

/* Custom text colors for Release Stats */
.orange--text {
  color: #ff9800 !important;
}

/* Custom stat item interactions that can't be replicated with Vuetify */
.stat-item-vertical {
  transition: all 0.2s ease;
  cursor: pointer;
}

.stat-item-vertical:hover {
  transform: translateX(4px);
}

.stat-item-vertical.stat-disabled {
  cursor: not-allowed;
}

.stat-item-vertical.stat-disabled:hover {
  transform: none;
}

/* Legend chip interactions */
.legend-chip {
  cursor: pointer;
  transition: all 0.2s ease;
}

.legend-chip:hover {
  transform: scale(1.05);
}

/* Large Chart Container Styles */
.chart-container-large {
  border-radius: 8px !important;
  overflow: hidden !important;
  margin: 8px;
  padding: 12px;
}

.chart-container-large .chart-header {
  background-color: rgba(25, 118, 210, 0.05);
  border-bottom: 1px solid #e0e0e0;
  margin: -12px -12px 12px -12px;
  padding: 16px;
}

/* Stats Container Styles */
.stats-container {
  background-color: #fafafa;
  border-radius: 8px !important;
  overflow: hidden !important;
}

.stats-container .stats-header {
  background-color: rgba(25, 118, 210, 0.05);
  border-bottom: 1px solid #e0e0e0;
}

/* Stats card styling within sidebar */
.stats-container .stat-item-compact {
  margin-bottom: 4px !important;
  transition: all 0.2s ease !important;
  min-height: 44px !important;
}

.stats-container .stat-item-compact:hover {
  transform: translateX(2px) !important;
  box-shadow: 0 2px 8px rgba(25, 118, 210, 0.1) !important;
}

/* Data Type Selection Enhancements */
.selected-data-type-alert {
  border-left: 4px solid #4caf50 !important;
  background-color: rgba(76, 175, 80, 0.1) !important;
  animation: selectedPulse 2s ease-in-out;
}

.selected-data-type-header-chip {
  animation: headerChipGlow 3s ease-in-out infinite;
  box-shadow: 0 2px 8px rgba(25, 118, 210, 0.3) !important;
}

.data-type-chip {
  transition: all 0.3s ease !important;
  border: 2px solid transparent !important;
}

.data-type-chip.selected-chip {
  background-color: #1976d2 !important;
  color: white !important;
  border: 2px solid #1565c0 !important;
  box-shadow: 0 4px 12px rgba(25, 118, 210, 0.4) !important;
  transform: scale(1.02);
  font-weight: 600 !important;
}

.data-type-chip:not(.selected-chip):hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1) !important;
}

@keyframes selectedPulse {
  0% { 
    box-shadow: 0 0 0 0 rgba(76, 175, 80, 0.7);
  }
  70% { 
    box-shadow: 0 0 0 10px rgba(76, 175, 80, 0);
  }
  100% { 
    box-shadow: 0 0 0 0 rgba(76, 175, 80, 0);
  }
}

@keyframes headerChipGlow {
  0%, 100% { 
    box-shadow: 0 2px 8px rgba(25, 118, 210, 0.3);
  }
  50% { 
    box-shadow: 0 2px 16px rgba(25, 118, 210, 0.6);
  }
}

.table-data-type-chip {
  font-weight: 600 !important;
  box-shadow: 0 2px 6px rgba(25, 118, 210, 0.3) !important;
}

/* Responsive font adjustments not available in Vuetify */
@media (max-width: 600px) {
  .legend-chip-container {
    flex-direction: column !important;
    gap: 4px !important;
  }
  
  .legend-chip-container .v-chip {
    align-self: flex-start !important;
  }
}

/* Hide scroll indicator when content fits */
@media (min-height: 800px) {
  .scroll-indicator {
    display: none;
  }
}

/* Drag and Drop Styles */
/* Table alignment fixes for custom body slot */
.draggable-table >>> tbody td {
  vertical-align: middle !important;
  padding: 8px 16px !important;
  border-bottom: 1px solid rgba(0, 0, 0, 0.12) !important;
}

.draggable-table >>> thead th,
.draggable-table >>> tbody td {
  width: auto !important;
  text-align: left !important;
}

/* Table should size based on content, not wrapper */
.draggable-table >>> table {
    width: 100% !important; /* FILL WRAPPER WIDTH */
    table-layout: auto !important; /* AUTO - columns shrink to widest content */
    /* NO min-width - let columns size naturally based on content */
}

/* Enable horizontal scrolling when table content exceeds wrapper width */
.draggable-table >>> .v-data-table__wrapper {
    overflow-x: auto !important; /* AUTO - only show when needed */
    overflow-y: auto !important;
    max-width: 100vw !important; /* VIEWPORT WIDTH - not parent container */
    width: 100% !important;
}

/* Ensure draggable-table container doesn't expand beyond window */
.draggable-table {
    max-width: 100vw !important; /* VIEWPORT WIDTH */
    overflow: visible; /* Let wrapper handle overflow */
}

/* Prevent text wrapping in cells - rely on scrollbar */
.draggable-table >>> td,
.draggable-table >>> th {
    white-space: nowrap !important;
}

.draggable-table >>> .v-data-table {
  height: 100%;
  display: flex;
  flex-direction: column;
}

/* Ensure footer is always visible and positioned below scrollable area */
.draggable-table >>> .v-data-footer {
  flex-shrink: 0 !important;
  border-top: thin solid rgba(0, 0, 0, 0.12);
  position: relative;
  z-index: 2; /* Above the wrapper */
  background-color: white; /* Ensure it's opaque */
  margin-top: 0 !important;
  min-height: 59px !important; /* Ensure footer has minimum height */
}

/* Draggable row styles */
.draggable-table-row {
  cursor: grab;
  transition: all 0.2s ease;
}

.draggable-table-row:active {
  cursor: grabbing;
}

.draggable-table-row.dragging {
  opacity: 0.7;
  transform: rotate(2deg);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1000;
}

.draggable-table-row:hover {
  background-color: rgba(25, 118, 210, 0.04);
  transform: translateY(-1px);
}

/* Drag feedback indicator */
.draggable-table-row[draggable="true"]::before {
  content: "⋮⋮";
  position: absolute;
  left: 8px;
  color: #bbb;
  font-size: 12px;
  line-height: 1;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.draggable-table-row:hover[draggable="true"]::before {
  opacity: 0.6;
}

/* Enhanced drag feedback */
.draggable-table-row[draggable="true"] {
  cursor: grab;
  transition: background-color 0.2s ease, transform 0.1s ease;
}

.draggable-table-row[draggable="true"]:hover {
  background-color: rgba(25, 118, 210, 0.08) !important;
}

.draggable-table-row[draggable="true"].dragging {
  opacity: 0.7;
  transform: scale(0.98);
  cursor: grabbing;
}

/* Drag handle icon styling */
.draggable-table-row[draggable="true"]:hover .drag-handle {
  opacity: 1;
}

/* Row highlighting for overdue items */
.draggable-table >>> .critically-overdue-row {
    background-color: rgba(211, 47, 47, 0.05) !important;
}

.draggable-table >>> .overdue-row {
    background-color: rgba(255, 152, 0, 0.05) !important;
}

.draggable-table >>> .critically-overdue-row td {
    background-color: rgba(211, 47, 47, 0.05) !important;
}

.draggable-table >>> .overdue-row td {
    background-color: rgba(255, 152, 0, 0.05) !important;
}

/* Simple Filter Summary Styling */
.filter-summary-card {
  border-left: 3px solid #1976d2 !important;
  background-color: #f8f9fa !important;
}

.filter-label {
  font-size: 13px;
  font-weight: 500;
  color: rgba(0, 0, 0, 0.6);
}

.filter-value {
  font-size: 13px;
  font-weight: 600;
  color: rgba(0, 0, 0, 0.87);
}

/* Header filter styles for blue header bar */
/* Mobile responsive */
@media (max-width: 600px) {
  .filter-summary-card .d-flex {
    flex-direction: column !important;
    align-items: flex-start !important;
    gap: 8px !important;
  }
}

/* Part Number Link Styles */
.part-number-link {
  color: #1976d2 !important;
  text-decoration: none !important;
  font-weight: 500 !important;
  display: inline-flex !important;
  align-items: center !important;
  transition: all 0.2s ease !important;
  border-radius: 4px !important;
  padding: 2px 4px !important;
  white-space: nowrap !important;
}

.part-number-link:hover {
  color: #1565c0 !important;
  background-color: rgba(25, 118, 210, 0.08) !important;
  text-decoration: underline !important;
  transform: translateY(-1px) !important;
  box-shadow: 0 2px 4px rgba(25, 118, 210, 0.2) !important;
}

.part-number-link:focus {
  outline: 2px solid rgba(25, 118, 210, 0.5) !important;
  outline-offset: 2px !important;
}

.part-number-link:active {
  transform: translateY(0) !important;
  box-shadow: 0 1px 2px rgba(25, 118, 210, 0.2) !important;
}

/* Truncated cell styling */
.text-truncate {
  overflow: hidden !important;
  text-overflow: ellipsis !important;
  white-space: nowrap !important;
}

/* ALL COLUMN WIDTH RULES REMOVED - LET TABLE-LAYOUT AUTO SIZE NATURALLY */
/* Columns will shrink/grow based on their content */

/* Disabled Filter Styling */
.v-select.v-input--is-disabled .v-input__slot {
  background-color: rgba(0, 0, 0, 0.02) !important;
  opacity: 0.6 !important;
}

.v-select.v-input--is-disabled .v-input__slot::before {
  border-style: dashed !important;
  border-color: rgba(0, 0, 0, 0.2) !important;
}

/* Version Display Positioning */
.version-display {
  position: fixed;
  bottom: 8px;
  right: 16px;
  z-index: 999;
  display: flex;
  align-items: center;
  gap: 8px;
  pointer-events: none;
}

.version-chip, .version-number-chip {
  pointer-events: auto;
  font-size: 0.75rem;
  height: 24px;
}

.version-chip {
  background-color: rgba(76, 175, 80, 0.1) !important;
  border-color: #4caf50 !important;
}

.version-number-chip {
  font-weight: 600;
  box-shadow: 0 2px 4px rgba(25, 118, 210, 0.2);
}

.v-select.v-input--is-disabled .v-select__selection {
  color: rgba(0, 0, 0, 0.4) !important;
}

/* Professional UI Improvements */
.enhanced-parts-planner {
  font-family: 'Roboto', sans-serif;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

/* Ensure main container fills viewport without scrolling */
.enhanced-parts-planner > * {
  flex-shrink: 0;
}

/* Simple, clean card styling */
.v-card {
  border-radius: 8px !important;
}

/* Inline Filter Bar Styling - Matching Release Status Dashboard */
.inline-filter-bar {
    background: linear-gradient(90deg, #e3f2fd 0%, #f5f5f5 35%, #fafafa 65%, #ffffff 100%);
    border-radius: 4px !important;
    margin-bottom: 0 !important;
}

.inline-filter-bar .v-card__text {
    padding: 12px 16px !important;
}

.filter-inline-row {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
}

.filter-inline-input {
    min-width: 180px;
}

.object-type-dropdown {
    min-width: 180px;
}

/* Show full text in dropdown selections without truncation */
.filter-inline-input >>> .v-select__selection,
.object-type-dropdown >>> .v-select__selection {
    max-width: 100% !important;
    text-overflow: clip !important;
}

.filter-inline-input >>> .v-select__selections,
.object-type-dropdown >>> .v-select__selections {
    flex-wrap: nowrap !important;
}

@media (max-width: 1600px) {
    .filter-bar-top {
        overflow-x: auto;
    }
}

/* Clean table styling */
.data-table-container {
  margin-top: 20px;
  border-radius: 8px;
  width: 100%;
}

/* Ensure v-card-text allows footer to show */
.data-table-container .v-card-text {
  overflow: visible !important;
  width: 100%;
}

/* DO NOT add overflow to v-card-text - let the table wrapper handle it */
.v-card-text.pa-0.position-relative {
  overflow: visible !important; /* Let the table wrapper handle scrolling */
  width: 100%;
}

/* Ensure data table itself is responsive */
.draggable-table >>> .v-data-table {
  width: 100%;
}

/* Ensure footer follows table width */
.draggable-table >>> .v-data-footer {
  width: 100% !important; /* Make footer match table width */
  box-sizing: border-box; /* Include padding in width calculation */
}

/* Stats hover effect */
.stat-item-compact {
  transition: all 0.2s ease;
}

.stat-item-compact:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;
}

/* Clear Filter Icon Styles */
.clear-filter-icon {
  opacity: 0.7;
  transition: all 0.2s ease;
}

.clear-filter-icon:hover {
  opacity: 1;
  transform: scale(1.1);
  background-color: rgba(25, 118, 210, 0.1) !important;
}

/* Dancing Banana Animation */
.dancing-banana-chip {
  animation: bananaChipPulse 2s ease-in-out infinite;
}

.dancing-banana {
  display: inline-block;
  animation: bananaDance 1.5s ease-in-out infinite;
  font-size: 1.1em;
}



@keyframes ridiculousBananaDance {
  0%, 100% { 
    transform: translateX(0px) translateY(0px);
  }
  25% { 
    transform: translateX(-2px) translateY(-1px);
  }
  50% { 
    transform: translateX(2px) translateY(0px);
  }
  75% { 
    transform: translateX(-1px) translateY(-1px);
  }
}





@keyframes lookLeftRight {
  0%, 100% { 
    transform: translateX(0px);
  }
  25% { 
    transform: translateX(-1px);
  }
  50% { 
    transform: translateX(1px);
  }
  75% { 
    transform: translateX(-0.5px);
  }
}

@keyframes bananaDance {
  0%, 100% { 
    transform: rotate(-5deg) translateY(0px); 
  }
  25% { 
    transform: rotate(5deg) translateY(-2px); 
  }
  50% { 
    transform: rotate(-3deg) translateY(-1px); 
  }
  75% { 
    transform: rotate(3deg) translateY(-3px); 
  }
}

@keyframes bananaChipPulse {
  0%, 100% { 
    background-color: #ff9800 !important; 
    box-shadow: 0 2px 4px rgba(255, 152, 0, 0.3);
  }
  50% { 
    background-color: #ffb74d !important; 
    box-shadow: 0 4px 12px rgba(255, 152, 0, 0.5);
  }
}

/* Under Construction Overlay for Bar Chart */
.under-construction-overlay {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 5;
  pointer-events: none;
}

.under-construction-chip {
  opacity: 0.85;
  font-weight: 600;
  font-size: 0.9rem !important;
  padding: 8px 16px !important;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2) !important;
}
</style>

<style>
/* Global styles for viewport fitting (unscoped) */
html, body {
  overflow: hidden; /* Restore overflow hidden for page */
  height: 100vh;
  max-height: 100vh;
}

#app {
  height: 100vh;
  max-height: 100vh;
  overflow: hidden; /* Restore overflow hidden for app */
}

/* Ensure widget wrapper fills viewport */
/* No custom dropdown overrides - using Vuetify defaults */
</style>

<script>
/* eslint-disable no-console */
import versionData from "@/static/version.json";
import ReleaseChart from "@/components/charts/ReleaseChart.vue";
import ChangeActionCell from "@/components/release-planning/ChangeActionCell.vue";
import StatusCommentDisplay from "@/components/common/StatusCommentDisplay.vue";
import dataService from "@/data/DataServiceBase.js";
import filterService from "@/services/FilterService.js";
import chartDataService from "@/services/ChartDataService.js";
import dataTransformationService from "@/services/DataTransformationService.js";
import exportService from "@/services/ExportService.js";
import ApiService from "@/services/ApiService.js";
import UniversalDataService from "@/services/UniversalDataService.js";
import { USE_MOCK_DATA } from "@/config/ApiConfig.js";
import { getApiBaseUrl, API_CONFIG } from "@/config/ApiConfig.js";
import { ResponsiveMixin } from "@/utils/ResponsiveUtils.js";
import { useDragAndDrop } from "@/composables/useDragAndDrop.js";
import Chart from "chart.js";

// Custom Chart.js plugin for alternating background bars
// eslint-disable-next-line no-unused-vars
const alternatingBackgroundPlugin = {
    id: "alternatingBackground",
    beforeDraw: chart => {
        const { ctx, chartArea: { left, right, top, bottom }, scales: { x } } = chart;
        
        ctx.save();
        const barWidth = (right - left) / x.ticks.length;
        
        x.ticks.forEach((tick, index) => {
            if (index % 2 === 1) { // Every other bar
                const barLeft = left + (index * barWidth);
                
                ctx.fillStyle = "rgba(0, 0, 0, 0.03)"; // Very subtle gray
                ctx.fillRect(barLeft, top, barWidth, bottom - top);
            }
        });
        
        ctx.restore();
    }
};

const FOCUS_SCROLL_DELAY = 50;
const LOADING_PROGRESS_DEFAULT_STEP = 1;
const LOADING_PROGRESS_DEFAULT_INTERVAL = 120;
const LOADING_PROGRESS_COMPLETE_STEP = 3;
const LOADING_PROGRESS_COMPLETE_INTERVAL = 45;

/* eslint-disable no-console */
export default {
    name: "EnhancedPartsPlannerWidget",
    components: {
        ReleaseChart,
        ChangeActionCell,
        StatusCommentDisplay
    },
    mixins: [ResponsiveMixin],
    props: {
        hideHeader: {
            type: Boolean,
            default: false
        }
    },
    data() {
        // Initialize drag and drop composable
        const dragDropComposable = useDragAndDrop();
        
        return {
            // Drag and drop functionality
            dragDrop: dragDropComposable,

            // Debouncing for filter changes
            filterChangeTimeout: null,
            filterDebounceDelay: 1000, // 1000ms delay before triggering API calls
            urlSyncTimeout: null,
            urlSyncDelay: 400,
            isApplyingQuery: false,
            
            // Loading state for chart interactions
            chartInteractionLoading: false,
            
            // Zoom state for late release chart
            originalLateReleaseChartData: null,
            isLateReleaseChartZoomed: false,
            zoomedTimeBucket: null,
            
            // Late release chart data (was computed, now data for zoom support)
            lateReleaseChartData: null,
            
            // Filter values - consolidated object for UniversalFilterControls
            filterValues: {
                program: "",
                phase: "",
                ataChapterGroup: "All",
                engSystemGroup: "All",
                makeBuyFilter: "All", // Only used for PARTS data type
                partTypeFilter: "All" // Only used for PARTS data type
            },
            
            // Filter options - will be loaded dynamically
            programs: [],
            phases: [],
            ataChapterGroups: ["All"], // Initialize with default for new filter
            engSystemGroups: ["All"], // Initialize with default for new filter
            makeBuyOptions: ["All"], // Initialize with default - only for PARTS
            partTypeOptions: ["All"], // Initialize with default - only for PARTS
            
            // Raw data
            tableData: [],
            
            // Data for chart and filtered display
            chartData: { labels: [], datasets: [] },
            
            // Current data type being displayed - determines which header configuration to use
            currentDataType: "parts",
            
            // Configuration for different data types - easily extensible
            // ⚠️  IMPORTANT: When adding new data types here, you MUST also update 
            // the mapItemToTableData() method in the methods section below (around line 890)
            // to handle the new data type. Field names must match exactly!
            headerConfigurations: {
                parts: [
                    { text: "Part Number / Rev", value: "partNoWithRev", sortable: true, required: true, icon: "mdi-barcode", width: "auto", minWidth: "240px" },
                    { text: "Description", value: "description", sortable: true, icon: "mdi-text", truncate: true, width: "auto", minWidth: "350px" },
                    { text: "Make / Buy", value: "makeBuy", sortable: true, icon: "mdi-factory" },
                    // { text: "Chapter Group", value: "ataChapterGroup", sortable: true, icon: "mdi-book-open-page-variant" },
                    { text: "System Group", value: "engSystemGroupShort", sortable: true, icon: "mdi-cog-outline", truncate: true, fullValueField: "engSystemGroup" },
                    { text: "Owner", value: "owner", sortable: true, icon: "mdi-account" },
                    { text: "Target Release", value: "tgtRelease", sortable: true, icon: "mdi-calendar-clock", tooltip: "Target release date from engineering schedule. Calculated from project milestones and design completion targets." },
                    { text: "Actual Release", value: "actualRelease", sortable: true, icon: "mdi-calendar-check", tooltip: "Actual release date when part was completed and released. Updated when release process is finalized." },
                    { text: "Critical Release", value: "criticalRelease", sortable: true, icon: "mdi-calendar-alert", tooltip: "Critical release deadline for program deliverables. Based on customer requirements and program constraints." },
                    { text: "State", value: "currentStateMasked", sortable: true, icon: "mdi-flag" },
                    { text: "Change Action", value: "caNumber", sortable: false, icon: "mdi-file-document-edit", component: "ChangeActionCell", componentProps: { field: "number" } },
                    { text: "Resp Engr", value: "caRespEngr", sortable: true, icon: "mdi-account-hard-hat" },
                    { text: "Status Comments", value: "statusComment", sortable: false, icon: "mdi-comment-text" }
                ],
                cas: [
                    { text: "CA Number", value: "caNumber", sortable: true, required: true, icon: "mdi-file-document", component: "ChangeActionCell", componentProps: { field: "number", itemType: "ca" } },
                    { text: "Description", value: "changeDescription", sortable: true, icon: "mdi-text", truncate: true },
                    { text: "Resp Engr", value: "resEngr", sortable: true, icon: "mdi-account" },
                    { text: "Status", value: "currentStateMasked", sortable: true, icon: "mdi-flag" },
                    { text: "Target Complete", value: "targetReleaseDate", sortable: true, icon: "mdi-calendar-clock", tooltip: "Target completion date for change action. Based on engineering schedule and project timelines." },
                    { text: "Actual Approved", value: "approvedDate", sortable: true, icon: "mdi-calendar-check", tooltip: "Date when change action was approved by stakeholders." },
                    { text: "Actual Complete", value: "actualReleaseDate", sortable: true, icon: "mdi-calendar-check", tooltip: "Actual completion date when change action was finalized and closed." },
                    { text: "Status Comments", value: "statusComment", sortable: false, icon: "mdi-comment-text", component: "StatusCommentDisplay", componentProps: { itemType: "cas", canEdit: true } }
                ],
                crs: [
                    { text: "CR Number", value: "crNumber", sortable: true, required: true, icon: "mdi-file-document-outline", component: "ChangeActionCell", componentProps: { field: "number", itemType: "cr" } },
                    { text: "Description", value: "changeDescription", sortable: true, icon: "mdi-format-title", truncate: true },
                    { text: "Resp Engr", value: "owner", sortable: true, icon: "mdi-account" },
                    { text: "Status", value: "currentStateMasked", sortable: true, icon: "mdi-flag" },
                    { text: "Target Complete", value: "targetReleaseDate", sortable: true, icon: "mdi-calendar-plus", tooltip: "Target completion date for change request. Based on requirements analysis and development timeline." },
                    { text: "Actual Complete", value: "actualCompleteDate", sortable: true, icon: "mdi-calendar-check", tooltip: "Actual completion date when change request was implemented and delivered." },
                    { text: "Status Comments", value: "statusComment", sortable: false, icon: "mdi-comment-text", component: "StatusCommentDisplay", componentProps: { itemType: "crs", canEdit: true } }
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
            loadingDialog: {
                headline: "Loading Dashboard Data",
                detail: "Preparing UI: Chart • Table",
                status: "Fetching API data…",
                progressLabel: "Initializing",
                percent: 0,
                phasesCompleted: 0,
                totalPhases: 0
            },
            loadingProgressTimer: null,
            loadingProgressTarget: 0,
            
            // Chart visibility controls
            chartVisibility: {
                releaseChart: true,
                lateReleaseChart: false
            },
            
            // Bar chart legend visibility controls
            showUnreleasedBar: true,
            showReleasedBar: true,
            showNoCriticalBar: true,
            
            // Force chart reactivity
            lateReleaseChartKey: 0,
            
            // Cache parts data to prevent CA data loading from affecting late release chart
            cachedPartsData: null,
            
            // Independent chart data that doesn't react to other changes
            lateReleaseChartDataCache: {
                labels: ["On-Time", "1 wks", "2 wks", "3 wks", ">4 wks", "No Critical"],
                datasets: [
                    {
                        label: "Unreleased: Today's Date - Critical Date >4wks",
                        data: [0, 0, 0, 0, 0, 0],
                        backgroundColor: "rgba(244, 67, 54, 0.8)",
                        borderColor: "#d32f2f",
                        borderWidth: 1
                    },
                    {
                        label: "Released: Actual - Critical Date >4wks",
                        data: [0, 0, 0, 0, 0, 0],
                        backgroundColor: "rgba(255, 152, 0, 0.8)",
                        borderColor: "#f57c00",
                        borderWidth: 1
                    },
                    {
                        label: "Parts with Deliverable for, but no Critical Date",
                        data: [0, 0, 0, 0, 0, 0],
                        backgroundColor: "rgba(158, 158, 158, 0.8)",
                        borderColor: "#757575",
                        borderWidth: 1
                    }
                ]
            },
            loadingProgressStep: LOADING_PROGRESS_DEFAULT_STEP,
            loadingProgressInterval: LOADING_PROGRESS_DEFAULT_INTERVAL,
            lastUpdated: new Date().toLocaleTimeString(),
            dataSourceStatus: {
                hasError: false,
                message: ""
            },
            showDataErrors: false,
            
            // Environment change detection
            environmentChangeKey: 0, // Force reactivity updates when environment changes
            
            // Chart line visibility
            showTargetLine: true,
            showActualLine: true,
            showCriticalLine: true,
            
            // Chart focus state
            chartFocusActive: false,
            chartFocusStartDate: null,
            chartFocusEndDate: null,
            
            // Release headliner filter
            selectedStatFilter: "all",
            
            // Chart refresh key to force chart updates
            chartKey: 0,
            
            // Change Action refresh key to force CA link updates when filters change
            changeActionRefreshKey: 0,
            
            // Chart.js instance for late release bar chart
            lateReleaseChart: null,
            
            // Cache clearing state
            clearingCache: false,
            showClearCacheDialog: false,
            
            // Background CA preloading state
            backgroundPreloadingCA: false,
            preloadingProgress: {
                current: 0,
                total: 0,
                phase: "initializing"
            },
            
            // Settings dialog
            settingsDialog: false,
            defaultProgram: "All",
            
            // Dynamic table height
            dynamicTableHeight: 550,
            
            // Kiosk mode - simple defaults
            kioskCurrentPage: 1,
            kioskPageRotationTimer: null,
            kioskPageDelay: 10000, // Fixed: 10 seconds per page
            kioskRowsPerPage: 15, // Fixed: 15 rows per page
            kioskResizeTimeout: null,
            kioskModeActive: false, // Track kiosk mode state
            
            // Kiosk mode auto-refresh
            kioskRefreshTimer: null,
            kioskRefreshInterval: 60000, // Fixed: 60 seconds refresh
            kioskLastRefreshTime: null,
            kioskNextRefreshTime: null,
            kioskCountdownUpdateTimer: null,
            
            // Chart click functionality
            selectedTimeBucket: null, // Store selected time bucket for filtering
            selectedDatasetType: null // Store selected dataset type for filtering
        };
    },
    
    computed: {
        // App version from version.json (single source of truth)
        appVersion() {
            return versionData.stable.replace("v", ""); // Remove 'v' prefix if present
        },

        // Filter chart data based on focus date range
        focusedChartData() {
            if (!this.chartFocusActive || !this.chartFocusStartDate || !this.chartFocusEndDate) {
                return this.chartData;
            }

            // Filter labels and datasets to only show data within focus range
            const startMs = new Date(this.chartFocusStartDate.getFullYear(), this.chartFocusStartDate.getMonth(), this.chartFocusStartDate.getDate()).getTime();
            const endMs = new Date(this.chartFocusEndDate.getFullYear(), this.chartFocusEndDate.getMonth(), this.chartFocusEndDate.getDate()).getTime();

            const filteredLabels = [];
            const filteredIndices = [];

            // Find labels within the date range
            this.chartData.labels.forEach((label, index) => {
                const labelDate = new Date(label);
                if (!isNaN(labelDate)) {
                    const labelMs = new Date(labelDate.getFullYear(), labelDate.getMonth(), labelDate.getDate()).getTime();
                    if (labelMs >= startMs && labelMs <= endMs) {
                        filteredLabels.push(label);
                        filteredIndices.push(index);
                    }
                }
            });

            // Filter each dataset to match the filtered labels
            const filteredDatasets = this.chartData.datasets.map(dataset => ({
                ...dataset,
                data: filteredIndices.map(i => dataset.data[i])
            }));

            console.log(`📊 Focused chart data: ${filteredLabels.length} labels from ${this.chartData.labels.length} total`);

            return {
                labels: filteredLabels,
                datasets: filteredDatasets
            };
        },

        // Detect kiosk mode from URL parameter or internal state
        isKioskMode() {
            if (typeof window === "undefined") return false;
            const params = new URLSearchParams(window.location.search);
            const urlKioskMode = params.get("mode") === "kiosk" || params.get("display") === "kiosk";
            console.log("🔍 isKioskMode computed:", { urlKioskMode, kioskModeActive: this.kioskModeActive, result: urlKioskMode || this.kioskModeActive });
            return urlKioskMode || this.kioskModeActive;
        },

        // Get active filter labels for display in kiosk mode
        activeFilterLabels() {
            const labels = [];
            
            if (this.filterValues.program) {
                labels.push({ icon: "mdi-briefcase", text: this.filterValues.program });
            }
            
            if (this.filterValues.phase) {
                labels.push({ icon: "mdi-calendar-range", text: this.filterValues.phase });
            }
            
            if (this.filterValues.ataChapterGroup && this.filterValues.ataChapterGroup !== "All") {
                labels.push({ icon: "mdi-book-open-page-variant", text: `ATA: ${this.filterValues.ataChapterGroup}` });
            }
            
            if (this.filterValues.engSystemGroup && this.filterValues.engSystemGroup !== "All") {
                labels.push({ icon: "mdi-cog-outline", text: `ENG: ${this.filterValues.engSystemGroup}` });
            }
            
            if (this.currentDataType === "parts") {
                if (this.filterValues.makeBuyFilter && this.filterValues.makeBuyFilter !== "All") {
                    labels.push({ icon: "mdi-factory", text: this.filterValues.makeBuyFilter });
                }
                
                if (this.filterValues.partTypeFilter && this.filterValues.partTypeFilter !== "All") {
                    labels.push({ icon: "mdi-cog", text: this.filterValues.partTypeFilter });
                }
            }
            
            if (this.selectedStatFilter && this.selectedStatFilter !== "all") {
                labels.push({ icon: "mdi-flag", text: `Status: ${this.selectedStatFilter}` });
            }
            
            return labels;
        },

        // Kiosk mode pagination computed properties
        kioskTotalPages() {
            if (!this.isKioskMode || !this.filteredTableData) return 1;
            return Math.ceil(this.filteredTableData.length / this.kioskRowsPerPage);
        },

        kioskPagedData() {
            if (!this.isKioskMode) return this.filteredTableData;
            
            const start = (this.kioskCurrentPage - 1) * this.kioskRowsPerPage;
            const end = start + this.kioskRowsPerPage;
            return this.filteredTableData.slice(start, end);
        },

        kioskPageIndicators() {
            const indicators = [];
            for (let i = 1; i <= this.kioskTotalPages; i++) {
                indicators.push(i);
            }
            return indicators;
        },

        // Get items per page based on mode and screen size
        currentItemsPerPage() {
            if (this.isKioskMode) {
                return this.kioskRowsPerPage;
            }
            
            // Default items per page - simple and consistent
            const DEFAULT_ITEMS_PER_PAGE = 15;
            return DEFAULT_ITEMS_PER_PAGE;
        },

        // Kiosk mode refresh countdown display
        kioskRefreshCountdown() {
            if (!this.isKioskMode || !this.kioskNextRefreshTime) return null;
            
            const now = Date.now();
            const remaining = Math.max(0, this.kioskNextRefreshTime - now);
            const seconds = Math.ceil(remaining / 1000);
            
            if (seconds > 60) {
                const minutes = Math.floor(seconds / 60);
                return `${minutes}m`;
            }
            return `${seconds}s`;
        },

        kioskLastRefreshDisplay() {
            if (!this.kioskLastRefreshTime) return "Never";
            
            const now = Date.now();
            const elapsed = now - this.kioskLastRefreshTime;
            const seconds = Math.floor(elapsed / 1000);
            
            if (seconds < 60) return `${seconds}s ago`;
            const minutes = Math.floor(seconds / 60);
            if (minutes < 60) return `${minutes}m ago`;
            const hours = Math.floor(minutes / 60);
            return `${hours}h ago`;
        },

        objectTypeOptions() {
            return this.getAvailableDataTypes().map(type => ({
                text: type.toUpperCase(),
                value: type
            }));
        },

        objectType: {
            get() {
                return this.currentDataType || "parts";
            },
            set(objectType) {
                if (objectType && objectType !== this.currentDataType) {
                    this.switchDataType(objectType);
                }
            }
        },

        // Part Type display mapping - convert internal values to user-friendly names
        partTypeDisplayOptions() {
            const partTypeMap = {
                "A": "Assy Item",
                "A-BetaAssembly": "Assy Item",
                "C": "Config Item",
                "C-ConfigurationModule": "Config Item",
                "P": "Part Item",
                "P-BetaPart": "Part Item",
                "R": "Reqmt Item",
                "R-ReferenceDocument": "Reqmt Item",
                "V": "Vendor Item",
                "V-VendorItem": "Vendor Item",
                "Unassigned": "Unassigned"
            };

            return this.partTypeOptions.map(value => {
                if (value === "All") {
                    return { text: "All", value: "All" };
                }
                
                // Extract the suffix after the last period (e.g., "A-BetaAssembly" from "emxFramework.Range.BT_BETAExt.BT_PartType.A-BetaAssembly")
                let shortValue = value;
                if (value.includes(".")) {
                    const parts = value.split(".");
                    shortValue = parts[parts.length - 1];
                }
                
                return {
                    text: partTypeMap[shortValue] || shortValue,
                    value
                };
            });
        },

        // Dynamic widget title based on current data type using DataTransformationService
        widgetTitle() {
            if (!this.currentDataType) {
                return "Release Planner - Select Data Type";
            }
            return dataTransformationService.getDataTypeTitle(this.currentDataType);
        },

        loadingPercentDisplay() {
            const percent = Math.round(this.loadingDialog.percent || 0);
            const clamped = Math.min(100, Math.max(0, percent));
            return `${clamped}%`;
        },

        loadingPhaseDisplay() {
            const completed = Math.max(0, Math.round(this.loadingDialog.phasesCompleted || 0));
            const total = Math.max(0, Math.round(this.loadingDialog.totalPhases || 0));
            if (total > 0) {
                const safeCompleted = Math.min(completed, total);
                return `${safeCompleted}/${total} phases completed`;
            }
            return "Preparing workflow steps…";
        },

        loadingStatusDisplay() {
            if (this.loadingDialog.status) {
                return this.loadingDialog.status;
            }
            const typeLabel = this.currentDataType ? `${this.currentDataType} ` : "dashboard ";
            return `Fetching ${typeLabel}data…`;
        },

        // Dynamic table headers based on current data type and available data
        tableHeaders() {
            // Return empty array if no data type is selected
            if (!this.currentDataType) {
                return [];
            }
            
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
            
            // Debug StatusCommentDisplay headers specifically
            const statusCommentHeaders = filteredHeaders.filter(h => h.component === "StatusCommentDisplay");
            console.log("🔍 StatusCommentDisplay headers found:", statusCommentHeaders);
            
            // Debug for CA data type specifically
            if (this.currentDataType === "cas") {
                console.log("🔍 CAS headers debug:", {
                    currentDataType: this.currentDataType,
                    baseConfig,
                    filteredHeaders,
                    statusCommentHeaders
                });
            }

            // Enhance tooltips for date columns with date range information
            return filteredHeaders.map(header => {
                if (header.value === "tgtRelease") {
                    return {
                        ...header,
                        tooltip: header.tooltip ? `${header.tooltip}\n\n${this.targetReleaseDateRange}` : `Target Release Date\n\n${this.targetReleaseDateRange}`
                    };
                } else if (header.value === "actualRelease") {
                    return {
                        ...header,
                        tooltip: header.tooltip ? `${header.tooltip}\n\n${this.actualReleaseDateRange}` : `Actual Release Date\n\n${this.actualReleaseDateRange}`
                    };
                } else if (header.value === "criticalRelease") {
                    return {
                        ...header,
                        tooltip: header.tooltip ? `${header.tooltip}\n\n${this.criticalReleaseDateRange}` : `Critical Release Date\n\n${this.criticalReleaseDateRange}`
                    };
                }
                return header;
            });
        },

        // Filter configuration using FilterService
        filterConfig() {
            const config = filterService.createFilterConfig({
                programs: this.programs,
                phases: this.phases,
                ataChapterGroups: this.ataChapterGroups,
                engSystemGroups: this.engSystemGroups,
                filterValues: this.filterValues
            });
            return config;
        },

        // Release stats as array for vertical layout
        releaseStatsArray() {
            if (!this.releaseStats) return [];
            
            // Only return the new array (see below)
            return [
                {
                    key: "released",
                    label: "Total Released",
                    count: this.releaseStats.releasedCount,
                    total: this.releaseStats.totalCount,
                    displayText: `${this.releaseStats.releasedCount} of ${this.releaseStats.totalCount}`,
                    icon: "mdi-check-circle",
                    class: "success",
                    color: "#4caf50",
                    border: "2px solid rgba(76, 175, 80, 0.3)",
                    background: "rgba(76, 175, 80, 0.05)"
                },
                {
                    key: "thisWeek",
                    label: "This Week",
                    count: this.releaseStats.thisWeekCount,
                    total: this.releaseStats.thisWeekTotal,
                    displayText: `${this.releaseStats.thisWeekCount} of ${this.releaseStats.thisWeekTotal}`,
                    icon: "mdi-calendar-week",
                    class: "primary",
                    color: "#2196f3",
                    border: "2px solid rgba(33, 150, 243, 0.3)",
                    background: "rgba(33, 150, 243, 0.05)"
                },
                {
                    key: "nextWeek",
                    label: "Next Week",
                    count: this.releaseStats.nextWeekCount,
                    total: this.releaseStats.nextWeekTotal,
                    displayText: `${this.releaseStats.nextWeekCount} of ${this.releaseStats.nextWeekTotal}`,
                    icon: "mdi-calendar-arrow-right",
                    class: "info",
                    color: "#00bcd4",
                    border: "2px solid rgba(0, 188, 212, 0.3)",
                    background: "rgba(0, 188, 212, 0.05)"
                },
                {
                    key: "next30Days",
                    label: "Next 30 Days",
                    count: this.releaseStats.next30DaysCount,
                    total: this.releaseStats.next30DaysTotal,
                    displayText: `${this.releaseStats.next30DaysCount} of ${this.releaseStats.next30DaysTotal}`,
                    icon: "mdi-calendar-month",
                    class: "secondary",
                    color: "#9c27b0",
                    border: "2px solid rgba(156, 39, 176, 0.3)",
                    background: "rgba(156, 39, 176, 0.05)"
                },
                {
                    key: "criticallyOverdue",
                    label: "Critically Overdue",
                    count: this.releaseStats.criticallyOverdueCount,
                    icon: "mdi-alert-circle",
                    class: "error",
                    color: "#d32f2f",
                    border: "2px solid rgba(211, 47, 47, 0.3)",
                    background: "rgba(211, 47, 47, 0.05)"
                },
                {
                    key: "overdue",
                    label: "Overdue",
                    count: this.releaseStats.overdueCount,
                    icon: "mdi-clock-alert-outline",
                    class: "warning",
                    color: "#ff9800",
                    border: "2px solid rgba(255, 152, 0, 0.3)",
                    background: "rgba(255, 152, 0, 0.05)"
                },
                {
                    key: "unreleased",
                    label: "All Unreleased",
                    count: this.releaseStats.totalCount - this.releaseStats.releasedCount,
                    icon: "mdi-package-variant",
                    class: "grey",
                    color: "#757575",
                    border: "2px solid rgba(117, 117, 117, 0.3)",
                    background: "rgba(117, 117, 117, 0.05)"
                }
            ];
        },

        // Base filtered data BEFORE chart click filtering - used by bar chart
        // This ensures the bar chart always shows counts from dropdown filters only
        baseFilteredData() {
            console.log("🔵 baseFilteredData: Computing...", {
                currentDataType: this.currentDataType,
                tableDataLength: this.tableData?.length || 0,
                filterValues: this.filterValues,
                selectedStatFilter: this.selectedStatFilter
            });
            
            if (!this.currentDataType) {
                console.log("🔵 baseFilteredData: No currentDataType, returning empty");
                return [];
            }
            
            const result = filterService.applyAllFilters(
                this.tableData,
                this.filterValues,
                this.selectedStatFilter
            );
            
            console.log("🔵 baseFilteredData: Result:", {
                resultLength: result?.length || 0,
                sampleItems: result?.slice(0, 2).map(item => item.partNoWithRev) || []
            });
            
            return result;
        },

        // Filter table data using FilterService
        filteredTableData() {
            // Return empty array if no data type is selected
            if (!this.currentDataType) {
                console.log("🔍 filteredTableData: No currentDataType, returning empty array");
                return [];
            }
            
            // Start with base filtered data (from dropdown filters)
            let filtered = this.baseFilteredData;
            
            console.log("🔍 filteredTableData: After filterService:", {
                originalTableData: this.tableData?.length || 0,
                afterFilterService: filtered.length,
                selectedTimeBucket: this.selectedTimeBucket,
                selectedDatasetType: this.selectedDatasetType
            });
            
            // Apply chart click filtering if a time bucket is selected
            if (this.selectedTimeBucket && this.selectedDatasetType && this.currentDataType === "parts") {
                console.log("🎯 Applying chart click filter:", {
                    timeBucket: this.selectedTimeBucket,
                    datasetType: this.selectedDatasetType,
                    originalCount: filtered.length
                });
                
                filtered = this.filterByTimeBucket(filtered, this.selectedTimeBucket, this.selectedDatasetType);
                
                console.log("📊 Chart filtered results:", {
                    filteredCount: filtered.length,
                    timeBucket: this.selectedTimeBucket
                });
            }
            
            console.log("🔍 filteredTableData: FINAL RESULT:", {
                finalCount: filtered.length,
                sampleItems: filtered.slice(0, 2).map(item => ({
                    partNo: item.partNoWithRev,
                    phase: item.phase,
                    criticalRelease: item.criticalRelease
                }))
            });
            
            return filtered;
        },

        // Release statistics using FilterService
        releaseStats() {
            return filterService.computeStatistics(this.filteredTableData, this.tableData);
        },

        // Dynamic chart legend label using ChartDataService
        chartLegendLabel() {
            return chartDataService.getChartLegendLabel(this.currentDataType);
        },

        // Parts data for late release chart (isolated from CA data loading)
        partsDataForChart() {
            if (this.currentDataType === "parts" && this.baseFilteredData && this.baseFilteredData.length > 0) {
                return this.baseFilteredData;
            }
            return [];
        },
        
        // Late release bar chart data - only computes when chart is visible and on parts data
        generateLateReleaseChartData() {
            console.log("📊 BAR CHART DEBUG: lateReleaseChartData() called!", {
                chartVisible: true,
                dataType: this.currentDataType,
                baseFilteredDataLength: this.baseFilteredData?.length || 0,
                filteredTableDataLength: this.filteredTableData?.length || 0,
                selectedTimeBucket: this.selectedTimeBucket,
                selectedDatasetType: this.selectedDatasetType,
                showUnreleased: this.showUnreleasedBar,
                showReleased: this.showReleasedBar,
                showNoCritical: this.showNoCriticalBar
            });
            
            // IMPORTANT: Check baseFilteredData (not filteredTableData) because filteredTableData
            // shrinks when a chart bar is clicked for filtering
            const hasData = this.baseFilteredData && this.baseFilteredData.length > 0;
            
            console.log("📊 BAR CHART DEBUG: Checking conditions:", {
                chartVisible: true,
                isPartsType: this.currentDataType === "parts",
                hasData,
                willReturnEmpty: this.currentDataType !== "parts" || !hasData
            });
            
            // Compute whenever we have parts data (visibility is template-only, not computation gate)
            // This ensures bar chart is ready without needing visibility toggle
            if (this.currentDataType !== "parts" || !hasData) {
                console.log("⚠️ BAR CHART: Returning empty chart data due to conditions not met");
                return {
                    labels: ["On-Time", "1 wks", "2 wks", "3 wks", ">4 wks", "No Critical"],
                    datasets: [
                        {
                            label: "Unreleased: Today's Date - Critical Date >4wks",
                            data: [0, 0, 0, 0, 0, 0],
                            backgroundColor: "rgba(244, 67, 54, 0.8)",
                            borderColor: "#d32f2f",
                            borderWidth: 1
                        },
                        {
                            label: "Released: Actual - Critical Date >4wks", 
                            data: [0, 0, 0, 0, 0, 0],
                            backgroundColor: "rgba(255, 152, 0, 0.8)",
                            borderColor: "#f57c00",
                            borderWidth: 1
                        },
                        {
                            label: "Parts with Deliverable for, but no Critical Date",
                            data: [0, 0, 0, 0, 0, 0],
                            backgroundColor: "rgba(158, 158, 158, 0.8)",
                            borderColor: "#757575", 
                            borderWidth: 1
                        }
                    ]
                };
            }
            
            console.log("✅ BAR CHART: Proceeding with chart data calculation");

            // IMPORTANT: Use baseFilteredData (before chart click filtering) so bar chart stays stable
            // This ensures clicking a bar doesn't cause the bar chart to recalculate and lose data
            const dataToUse = this.baseFilteredData;
            
            console.log("🔄 Computing late release chart with", dataToUse.length, "parts (using baseFilteredData)");
            console.log("📈 First few parts:", dataToUse.slice(0, 3));
            
            const buckets = ["On-Time", "1 wks", "2 wks", "3 wks", ">4 wks", "No Critical"];
            const today = new Date();
            console.log("📅 Today's date:", today.toDateString());
            const MS_PER_DAY = 1000 * 60 * 60 * 24;
            const DAYS_PER_WEEK = 7;
            
            // Initialize data structure
            const data = {};
            buckets.forEach(bucket => {
                data[bucket] = {
                    unreleased: 0,
                    released: 0,
                    noDeliverable: 0
                };
            });
            
            dataToUse.forEach(item => {
                const criticalDate = item.criticalRelease || item.criticalReleaseDate || item["Critical Release"];
                const actualDate = item.actualRelease || item.actualReleaseDate || item["Actual Release"];
                
                // Check for parts with Phase but no Critical Date (N/A values)
                if (!criticalDate || criticalDate === "N/A" || criticalDate === "" || criticalDate === null) {
                    data["No Critical"].noDeliverable++;
                    console.log("📊 NO CRITICAL DATE found for item:", {
                        criticalDate,
                        actualDate,
                        owner: item.owner || item.Owner
                    });
                    return;
                }

                const critical = new Date(criticalDate);
                const isReleased = !!(actualDate && actualDate.toString().trim() !== "" && actualDate.toString().toUpperCase() !== "N/A");
                
                let diffDays;
                if (isReleased) {
                    const actual = new Date(actualDate);
                    diffDays = Math.ceil((actual - critical) / MS_PER_DAY);
                } else {
                    diffDays = Math.ceil((today - critical) / MS_PER_DAY);
                }

                let bucket;
                if (diffDays <= 0) {
                    bucket = "On-Time";
                } else if (diffDays <= DAYS_PER_WEEK) {
                    bucket = "1 wks";
                } else if (diffDays <= DAYS_PER_WEEK * 2) {
                    bucket = "2 wks";
                } else if (diffDays <= DAYS_PER_WEEK * 3) {
                    bucket = "3 wks";
                } else {
                    bucket = ">4 wks";
                }

                if (isReleased) {
                    data[bucket].released++;
                    console.log("✅ RELEASED item in bucket", bucket, "- Critical:", criticalDate, "Actual:", actualDate);
                } else {
                    data[bucket].unreleased++;
                    console.log("⏰ UNRELEASED item in bucket", bucket, "- Critical:", criticalDate, "No actual date");
                }
            });

            const unreleasedData = buckets.map(bucket => data[bucket].unreleased);
            const releasedData = buckets.map(bucket => data[bucket].released);
            const noCriticalData = buckets.map(bucket => data[bucket].noDeliverable);
            
            console.log("📊 FINAL BAR DATA:", {
                unreleased: unreleasedData,
                released: releasedData,
                noCritical: noCriticalData,
                bucketCounts: buckets.map(bucket => ({ 
                    bucket, 
                    unreleased: data[bucket].unreleased, 
                    released: data[bucket].released, 
                    noCritical: data[bucket].noDeliverable 
                }))
            });
            
            const allDatasets = [
                {
                    label: "Unreleased: Today's Date – Critical Date >X wks",
                    data: unreleasedData,
                    backgroundColor: [
                        "#81C784", // On-Time (light green)
                        "#FFB74D", // 1 wks (light orange)
                        "#FF8A65", // 2 wks (light deep orange)
                        "#EF5350", // 3 wks (light red)
                        "#E57373", // >4 wks (light dark red)
                        "#BDBDBD"  // No Critical (light gray)
                    ],
                    borderColor: [
                        "#4CAF50", "#FF9800", "#FF7043", "#F44336", "#D32F2F", "#757575"
                    ],
                    borderWidth: 1,
                    hidden: !this.showUnreleasedBar
                },
                {
                    label: "Released: Actual – Critical Date >X wks",
                    data: releasedData,
                    backgroundColor: [
                        "#388E3C", // On-Time (dark green)
                        "#F57C00", // 1 wks (dark orange)
                        "#E64A19", // 2 wks (dark deep orange)
                        "#C62828", // 3 wks (dark red)
                        "#B71C1C", // >4 wks (dark dark red)
                        "#757575"  // No Critical (dark gray)
                    ],
                    borderColor: [
                        "#4CAF50", "#FF9800", "#FF7043", "#F44336", "#D32F2F", "#757575"
                    ],
                    borderWidth: 1,
                    hidden: !this.showReleasedBar
                },
                {
                    label: "Parts with Phase, but no Critical Date", 
                    data: noCriticalData,
                    backgroundColor: "#9E9E9E", // Single gray color for non-stacked
                    borderColor: "#757575",
                    borderWidth: 1,
                    hidden: !this.showNoCriticalBar
                }
            ];

            return {
                labels: buckets,
                datasets: allDatasets
            };
        },

        // Bar chart options - Enhanced Late Material Release Burner Chart
        lateReleaseChartOptions() {
            console.log("🎨 Building enhanced late release chart options");
            return {
                responsive: true,
                maintainAspectRatio: false,
                legend: {
                    display: false
                },
                plugins: {
                    legend: {
                        display: false // Hide legend since we show it in title bar
                    },
                    title: {
                        display: false
                    }
                },
                scales: {
                    xAxes: [{
                        stacked: true,
                        gridLines: {
                            display: false
                        },
                        ticks: {
                            maxRotation: 45,
                            minRotation: 0
                        },
                        scaleLabel: {
                            display: true,
                            labelString: "Time Buckets"
                        }
                    }],
                    yAxes: [{
                        stacked: true,
                        gridLines: {
                            color: "#e0e0e0"
                        },
                        ticks: {
                            beginAtZero: true
                        },
                        scaleLabel: {
                            display: true,
                            labelString: "Number of Parts"
                        }
                    }]
                },
                tooltips: {
                    mode: "index",
                    intersect: false,
                    backgroundColor: "rgba(0, 0, 0, 0.8)",
                    titleFontColor: "#ffffff",
                    bodyFontColor: "#ffffff",
                    borderColor: "#666666",
                    borderWidth: 1,
                    cornerRadius: 6,
                    displayColors: true,
                    filter: function(tooltipItem, data) {
                        const dataset = data.datasets[tooltipItem.datasetIndex];
                        const xLabel = tooltipItem.xLabel;
                        const value = tooltipItem.yLabel;
                        
                        // Hide the grey "No Critical" dataset from tooltips on the first 5 bars
                        if (dataset.label === "Parts with Phase, but no Critical Date" && 
                            xLabel !== "No Critical") {
                            return false;
                        }
                        
                        // On "No Critical" bar, only show datasets with non-zero values
                        if (xLabel === "No Critical" && value === 0) {
                            return false;
                        }
                        
                        return true;
                    },
                    callbacks: {
                        title: function(tooltipItem, data) {
                            const label = tooltipItem[0].label;
                            if (label === "No Critical") {
                                return "Parts with Phase, No Critical Date";
                            }
                            return "Time Bucket: " + label;
                        },
                        label: function(tooltipItem, data) {
                            const datasetLabel = data.datasets[tooltipItem.datasetIndex].label;
                            const value = tooltipItem.yLabel;
                            return datasetLabel + ": " + value + " parts";
                        }
                    }
                },
                onClick: (event, elements) => {
                    this.handleChartBarClick(event, elements);
                }
            };
        },

        // API environment indicator for header chip
        apiEnvironmentChip() {
            // Force reactivity by including environmentChangeKey
            // eslint-disable-next-line no-unused-vars
            const changeKey = this.environmentChangeKey;
            
            const currentUrl = getApiBaseUrl();
            const isProduction = currentUrl === API_CONFIG.production;
            const isOverride = typeof window !== "undefined" && localStorage.getItem("env_override") !== null;
            
            return {
                text: isProduction ? "Prod API" : "Dev API",
                color: isProduction ? "success" : "error",
                icon: isOverride ? "mdi-code-tags" : "mdi-cloud"
            };
        },

        // Show critical release controls only for Parts data type
        showCriticalControls() {
            return this.currentDataType === "parts";
        },
        
        // Programs list with "All" option for settings dialog
        programsWithAll() {
            return ["All", ...this.programs];
        },

        // Dynamic chart options with current date line
        dynamicChartOptions() {
            // Get base chart options from ChartDataService (Chart.js v2 config)
            const options = chartDataService.createChartOptions(this.currentDataType);
            
            // Apply focus date range if active
            if (this.chartFocusActive && this.chartFocusStartDate && this.chartFocusEndDate) {
                // For category scale in Chart.js v2, we filter data instead of using min/max
                // The filtering happens in focusedChartData computed property
                console.log(`📊 Chart options with focus range: ${this.chartFocusStartDate.toLocaleDateString()} to ${this.chartFocusEndDate.toLocaleDateString()}`);
            }
            
            return options;
        },
        
        // Provide Chart.js v2 plugin(s) to draw a vertical dashed line at today's date
        todayLinePlugins() {
            // Use FilterService's currentDate for consistency
            const today = new Date(filterService.currentDate);
            const DASH_LEN = 6;
            const GAP_LEN = 4;
            const LABEL_VERTICAL_GAP = 8;
            const LABEL_PADDING_X = 8;
            const LABEL_PADDING_Y = 4;
            const LABEL_BORDER_RADIUS = 6;
            const LABEL_MIN_TOP = 6;
            const DEFAULT_TEXT_ASCENT = 9;
            const DEFAULT_TEXT_DESCENT = 3;
            const HOVER_THRESHOLD = 8;
            const TOOLTIP_Y_OFFSET = 26; // distance above chart area top
            const todayAlternatives = [
                today.toLocaleDateString(),
                today.toLocaleDateString("en-US"),
                today.toLocaleDateString("en-US", { month: "numeric", day: "numeric", year: "numeric" }),
                `${today.getMonth() + 1}/${today.getDate()}/${today.getFullYear()}`
            ];

            const plugin = {
                id: "todayLineV2",
                afterDraw(chart) {
                    console.log("🎯 Today line plugin: afterDraw called");
                    const ctx = chart.ctx || (chart.chart && chart.chart.ctx);
                    const chartArea = chart.chartArea || (chart.chart && chart.chart.chartArea);
                    const xScale = chart.scales && (chart.scales["x-axis-0"] || chart.scales.x || chart.scales["xAxis0"]);
                    console.log("🎯 Today line plugin: ctx=", !!ctx, "chartArea=", !!chartArea, "xScale=", !!xScale);
                    if (!ctx || !chartArea || !xScale) return;

                    const labels = (chart.config && chart.config.data && chart.config.data.labels) || chart.data?.labels || [];
                    console.log("🎯 Today line plugin: labels count=", labels.length);
                    console.log("🎯 Today line plugin: first few labels=", labels.slice(0, 5));
                    if (!labels || labels.length === 0) return;

                    let todayIndex = -1;
                    
                    console.log("🎯 Today line plugin: Looking for today's date:", todayAlternatives);
                    
                    // First try exact match
                    for (const f of todayAlternatives) {
                        const idx = labels.indexOf(f);
                        if (idx >= 0) { 
                            todayIndex = idx;
                            console.log("🎯 Today line plugin: Found exact match at index", idx, "for format:", f);
                            break; 
                        }
                    }
                    
                    console.log("🎯 Today line plugin: After exact match, todayIndex=", todayIndex);
                    
                    // If no exact match, try parsing labels as dates and find the closest
                    if (todayIndex < 0) {
                        console.log("🎯 Today line plugin: No exact match, trying date parsing...");
                        const todayMs = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
                        let closest = { idx: -1, diff: Infinity };
                        labels.forEach((lbl, i) => {
                            const d = new Date(lbl);
                            if (!isNaN(d)) {
                                const dm = Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
                                const diff = Math.abs(dm - todayMs);
                                if (diff < closest.diff) closest = { idx: i, diff };
                            }
                        });
                        // Only use closest if it's actually today (diff === 0)
                        if (closest.idx >= 0 && closest.diff === 0) {
                            todayIndex = closest.idx;
                            console.log("🎯 Today line plugin: Found by date parsing at index", closest.idx);
                        } else {
                            console.log("🎯 Today line plugin: Closest date had diff=", closest.diff, "at index", closest.idx);
                        }
                    }
                    
                    console.log("🎯 Today line plugin: After date parsing, todayIndex=", todayIndex);
                    
                    // If still not found, try to find closest surrounding dates for interpolation
                    if (todayIndex < 0) {
                        console.log("🎯 Today line plugin: Attempting interpolation...");
                        // Find the index where today would fit in the sorted labels
                        let insertIndex = -1;
                        for (let i = 0; i < labels.length - 1; i++) {
                            const currentDate = new Date(labels[i]);
                            const nextDate = new Date(labels[i + 1]);
                            if (isNaN(currentDate) || isNaN(nextDate)) continue;
                            
                            if (today >= currentDate && today <= nextDate) {
                                insertIndex = i;
                                console.log("🎯 Today line plugin: Found interpolation spot between", labels[i], "and", labels[i + 1]);
                                break;
                            }
                        }
                        
                        // If today is between two labels, interpolate using actual chart scale
                        if (insertIndex >= 0) {
                            // xScale is already validated at the top of afterDraw function - reuse it
                            const beforeDate = new Date(labels[insertIndex]);
                            const afterDate = new Date(labels[insertIndex + 1]);
                            const beforeMs = beforeDate.getTime();
                            const afterMs = afterDate.getTime();
                            const todayMs = today.getTime();
                            
                            // Get pixel positions for the surrounding labels
                            const beforeX = xScale.getPixelForValue(insertIndex);
                            const afterX = xScale.getPixelForValue(insertIndex + 1);
                            
                            // Interpolate between them based on date
                            const ratio = (todayMs - beforeMs) / (afterMs - beforeMs);
                            const x = beforeX + (ratio * (afterX - beforeX));
                            
                            console.log("🎯 Today line plugin: Drawing interpolated line at x=", x);
                            
                            // Draw the line at calculated position
                            chart._todayX = x;
                            chart._todayDateText = today.toLocaleDateString();

                            ctx.save();
                            ctx.setLineDash([DASH_LEN, GAP_LEN]);
                            ctx.strokeStyle = "rgba(66, 66, 66, 0.9)";
                            ctx.lineWidth = 2;
                            ctx.beginPath();
                            ctx.moveTo(x, chartArea.top);
                            ctx.lineTo(x, chartArea.bottom);
                            ctx.stroke();
                            console.log("🎯 Today line plugin: Line drawn from", chartArea.top, "to", chartArea.bottom);

                            // Draw label
                            ctx.setLineDash([]);
                            ctx.font = "bold 12px sans-serif";
                            const labelText = "Today";
                            const textMetrics = ctx.measureText(labelText);
                            const textWidth = textMetrics.width || 0;
                            const ascent = textMetrics.actualBoundingBoxAscent || DEFAULT_TEXT_ASCENT;
                            const descent = textMetrics.actualBoundingBoxDescent || DEFAULT_TEXT_DESCENT;
                            const textHeight = ascent + descent;
                            const labelWidth = textWidth + LABEL_PADDING_X * 2;
                            const labelHeight = Math.max(textHeight + LABEL_PADDING_Y * 2, ascent + LABEL_PADDING_Y * 2);

                            const halfLabelWidth = labelWidth / 2;
                            const labelCenterX = x;
                            const labelLeft = labelCenterX - halfLabelWidth;
                            const labelRight = labelCenterX + halfLabelWidth;
                            let labelBottom = chartArea.top - LABEL_VERTICAL_GAP;
                            let labelTop = labelBottom - labelHeight;
                            if (labelTop < LABEL_MIN_TOP) {
                                labelTop = LABEL_MIN_TOP;
                                labelBottom = labelTop + labelHeight;
                            }

                            const radius = Math.min(LABEL_BORDER_RADIUS, labelHeight / 2, labelWidth / 2);
                            ctx.beginPath();
                            ctx.moveTo(labelLeft + radius, labelTop);
                            ctx.lineTo(labelRight - radius, labelTop);
                            ctx.quadraticCurveTo(labelRight, labelTop, labelRight, labelTop + radius);
                            ctx.lineTo(labelRight, labelBottom - radius);
                            ctx.quadraticCurveTo(labelRight, labelBottom, labelRight - radius, labelBottom);
                            ctx.lineTo(labelLeft + radius, labelBottom);
                            ctx.quadraticCurveTo(labelLeft, labelBottom, labelLeft, labelBottom - radius);
                            ctx.lineTo(labelLeft, labelTop + radius);
                            ctx.quadraticCurveTo(labelLeft, labelTop, labelLeft + radius, labelTop);
                            ctx.closePath();
                            ctx.fillStyle = "rgba(66, 66, 66, 0.92)";
                            ctx.fill();

                            ctx.fillStyle = "#fff";
                            ctx.textAlign = "center";
                            ctx.textBaseline = "middle";
                            const textY = labelTop + labelHeight / 2;
                            ctx.fillText(labelText, labelCenterX, textY);
                            ctx.restore();
                            return; // We're done with interpolated position
                        }
                        
                        // If we can't interpolate, don't draw the line
                        return;
                    }

                    // Original code for when todayIndex was found - exact match
                    // Reuse the xScale that was already validated at the top of afterDraw
                    const x = (typeof xScale.getPixelForTick === "function")
                        ? xScale.getPixelForTick(todayIndex)
                        : (typeof xScale.getPixelForValue === "function")
                            ? xScale.getPixelForValue(null, todayIndex)
                            : null;
                    if (x === null || x === undefined) {
                        console.log("🎯 Today line plugin: Could not get x position for index", todayIndex);
                        return;
                    }
                    
                    console.log("🎯 Today line plugin: Drawing line at x=", x, "for todayIndex=", todayIndex);

                    // Store for hover logic
                    chart._todayX = x;
                    chart._todayDateText = new Date().toLocaleDateString();

                    ctx.save();
                    ctx.setLineDash([DASH_LEN, GAP_LEN]);
                    ctx.strokeStyle = "rgba(66, 66, 66, 0.9)";
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.moveTo(x, chartArea.top);
                    ctx.lineTo(x, chartArea.bottom);
                    ctx.stroke();

                    // Label to the right of the line (inside chart area)
                    ctx.setLineDash([]);
                    ctx.font = "bold 12px sans-serif";
                    const labelText = "Today";
                    const textMetrics = ctx.measureText(labelText);
                    const textWidth = textMetrics.width || 0;
                    const ascent = textMetrics.actualBoundingBoxAscent || DEFAULT_TEXT_ASCENT;
                    const descent = textMetrics.actualBoundingBoxDescent || DEFAULT_TEXT_DESCENT;
                    const textHeight = ascent + descent;
                    const labelWidth = textWidth + LABEL_PADDING_X * 2;
                    const labelHeight = Math.max(textHeight + LABEL_PADDING_Y * 2, ascent + LABEL_PADDING_Y * 2);

                    const halfLabelWidth = labelWidth / 2;
                    const labelCenterX = x;
                    const labelLeft = labelCenterX - halfLabelWidth;
                    const labelRight = labelCenterX + halfLabelWidth;
                    let labelBottom = chartArea.top - LABEL_VERTICAL_GAP;
                    let labelTop = labelBottom - labelHeight;
                    if (labelTop < LABEL_MIN_TOP) {
                        labelTop = LABEL_MIN_TOP;
                        labelBottom = labelTop + labelHeight;
                    }

                    const radius = Math.min(LABEL_BORDER_RADIUS, labelHeight / 2, labelWidth / 2);
                    ctx.beginPath();
                    ctx.moveTo(labelLeft + radius, labelTop);
                    ctx.lineTo(labelRight - radius, labelTop);
                    ctx.quadraticCurveTo(labelRight, labelTop, labelRight, labelTop + radius);
                    ctx.lineTo(labelRight, labelBottom - radius);
                    ctx.quadraticCurveTo(labelRight, labelBottom, labelRight - radius, labelBottom);
                    ctx.lineTo(labelLeft + radius, labelBottom);
                    ctx.quadraticCurveTo(labelLeft, labelBottom, labelLeft, labelBottom - radius);
                    ctx.lineTo(labelLeft, labelTop + radius);
                    ctx.quadraticCurveTo(labelLeft, labelTop, labelLeft + radius, labelTop);
                    ctx.closePath();
                    ctx.fillStyle = "rgba(66, 66, 66, 0.92)";
                    ctx.fill();

                    ctx.fillStyle = "#fff";
                    ctx.textAlign = "center";
                    ctx.textBaseline = "middle";
                    const textY = labelTop + labelHeight / 2;
                    ctx.fillText(labelText, labelCenterX, textY);
                    ctx.restore();
                },
                afterEvent(chart, evt) {
                    const canvas = (chart.chart && chart.chart.canvas) || chart.canvas;
                    const parent = canvas && canvas.parentNode;
                    const chartArea = chart.chartArea || (chart.chart && chart.chart.chartArea);
                    const x = chart._todayX;
                    if (!canvas || !parent || !chartArea || x === undefined) return;

                    // Ensure tooltip element
                    let tip = chart._todayTipEl;
                    if (!tip) {
                        tip = document.createElement("div");
                        tip.style.position = "absolute";
                        tip.style.pointerEvents = "none";
                        tip.style.background = "rgba(33, 33, 33, 0.9)";
                        tip.style.color = "#fff";
                        tip.style.padding = "4px 8px";
                        tip.style.borderRadius = "4px";
                        tip.style.font = "12px sans-serif";
                        tip.style.whiteSpace = "nowrap";
                        tip.style.zIndex = "10";
                        tip.style.display = "none";
                        parent.appendChild(tip);
                        chart._todayTipEl = tip;
                    }

                    const type = evt && evt.type;
                    const ex = evt && (evt.x !== null && evt.x !== undefined ? evt.x : (evt.native && evt.native.layerX));
                    const ey = evt && (evt.y !== null && evt.y !== undefined ? evt.y : (evt.native && evt.native.layerY));

                    const hide = () => { if (tip) tip.style.display = "none"; };

                    if (type === "mouseout") { hide(); return; }
                    if (ex === null || ex === undefined || ey === null || ey === undefined) { hide(); return; }

                    const withinX = Math.abs(ex - x) <= HOVER_THRESHOLD;
                    const withinY = ey >= chartArea.top && ey <= chartArea.bottom;
                    if (!(withinX && withinY)) { hide(); return; }

                    // Position tooltip above the chart area at the line x
                    const canvasRect = canvas.getBoundingClientRect();
                    const parentRect = parent.getBoundingClientRect();
                    const left = x + (canvasRect.left - parentRect.left);
                    const top = chartArea.top + (canvasRect.top - parentRect.top) - TOOLTIP_Y_OFFSET;

                    tip.textContent = `Today: ${chart._todayDateText || new Date().toLocaleDateString()}`;
                    tip.style.left = `${Math.round(left)}px`;
                    tip.style.top = `${Math.round(top)}px`;
                    tip.style.display = "block";
                }
            };

            return [plugin];
        }
    },

    watch: {
        // Watch for chart key changes to trigger re-initialization
        lateReleaseChartKey(newKey, oldKey) {
            console.log("🔑 ====== LATE RELEASE CHART KEY CHANGED ======");
            console.log("🔑 Key changed from", oldKey, "to", newKey);
            console.log("🔑 isZoomed:", this.isLateReleaseChartZoomed);
            console.log("🔑 chartData exists:", !!this.lateReleaseChartData);
            console.log("🔑 chart instance exists:", !!this.lateReleaseChart);
            this.$nextTick(() => {
                console.log("🔑 In $nextTick, calling initializeLateReleaseChart");
                this.initializeLateReleaseChart();
            });
        },

        isKioskMode: {
            handler(isKiosk) {
                if (isKiosk) {
                    this.resetKioskPagination();
                    this.$nextTick(() => {
                        this.startKioskPageRotation();
                        this.startKioskAutoRefresh();
                    });
                } else {
                    this.stopKioskPageRotation();
                    this.stopKioskAutoRefresh();
                }
            },
            immediate: true
        },

        // Smart watcher: Only update chart if data count changes, not content edits
        filteredTableData: {
            handler(newData, oldData) {
                // Only update chart if the data count changed or it's the initial load
                const newLength = newData?.length || 0;
                const oldLength = oldData?.length || 0;
                
                console.log("👀 WATCH filteredTableData: Handler called", {
                    oldLength,
                    newLength,
                    selectedTimeBucket: this.selectedTimeBucket,
                    selectedDatasetType: this.selectedDatasetType,
                    baseFilteredDataLength: this.baseFilteredData?.length || 0
                });
                
                if (newLength !== oldLength || oldLength === 0) {
                    console.log("👀 CHART WATCH: Data count changed", oldLength, "→", newLength);
                    this.$nextTick(() => {
                        console.log("👀 CHART WATCH: In $nextTick, about to update charts");
                        this.updateChartFromFiltered();
                        // Force update for late release chart reactivity
                        // BUT only if we're NOT filtering by chart click (to prevent circular updates)
                        if (this.currentDataType === "parts") {
                            console.log("👀 CHART WATCH: Incrementing lateReleaseChartKey to ensure initial render");
                            this.lateReleaseChartKey++;
                        }
                    });
                    
                    // Reset kiosk pagination when data changes
                    if (this.isKioskMode) {
                        this.resetKioskPagination();
                    }
                } else {
                    console.log("👀 CHART WATCH: Ignoring content-only changes (same count)");
                }
                
                // Set up drag listeners for table rows whenever data changes
                this.setupTableDragListeners();
            },
            deep: false // Don't deep watch - we only care about array length changes
        },
        
        // Debug watcher for tableData to track CA-00000268
        tableData: {
            handler(newData) {
                if (newData && Array.isArray(newData)) {
                    console.log("🔍 Table data updated:", {
                        dataType: this.currentDataType,
                        itemCount: newData.length,
                        hasCA00000268: newData.some(item => 
                            item.name === "CA-00000268" || 
                            item.caNumber === "CA-00000268"
                        )
                    });
                    
                    // Find and log CA-00000268 specifically
                    const ca268 = newData.find(item => 
                        item.name === "CA-00000268" || 
                        item.caNumber === "CA-00000268"
                    );
                    
                    if (ca268) {
                        console.log("🔍 Found CA-00000268 in table data:", {
                            item: ca268,
                            statusComment: ca268.statusComment,
                            caStatusComment: ca268.caStatusComment,
                            name: ca268.name,
                            caNumber: ca268.caNumber,
                            allKeys: Object.keys(ca268)
                        });
                    } else {
                        console.log("🔍 CA-00000268 NOT found in table data. Available items:", 
                            newData.map(item => ({ 
                                name: item.name, 
                                caNumber: item.caNumber, 
                                id: item.id 
                            }))
                        );
                    }
                }
            },
            deep: true,
            immediate: true
        },
        
        // Watch for filter changes that should trigger chart updates
        "filterValues.program": {
            handler() {
                console.log("👀 CHART WATCH: Program filter changed");
                this.changeActionRefreshKey++; // Refresh Change Action links
                this.$nextTick(() => {
                    this.updateChartFromFiltered();
                });
            }
        },
        
        "filterValues.phase": {
            handler() {
                console.log("👀 CHART WATCH: Phase filter changed");
                this.changeActionRefreshKey++; // Refresh Change Action links
                this.$nextTick(() => {
                    this.updateChartFromFiltered();
                });
            }
        },
        
        "filterValues.ataChapterGroup": {
            handler() {
                console.log("👀 CHART WATCH: ATA Chapter filter changed");
                this.changeActionRefreshKey++;
                this.$nextTick(() => {
                    this.updateChartFromFiltered();
                });
            }
        },

        "filterValues.engSystemGroup": {
            handler() {
                console.log("👀 CHART WATCH: Engineering System filter changed");
                this.changeActionRefreshKey++;
                this.$nextTick(() => {
                    this.updateChartFromFiltered();
                });
            }
        },

        "filterValues.makeBuyFilter": {
            handler(newValue, oldValue) {
                if (newValue === oldValue) {
                    return;
                }
                console.log("👀 CHART WATCH: Make/Buy filter changed from", oldValue, "to", newValue);
                if (this.currentDataType === "parts") {
                    this.handlePartsFilterChange();
                }
            }
        },

        "filterValues.partTypeFilter": {
            handler(newValue, oldValue) {
                if (newValue === oldValue) {
                    return;
                }
                console.log("👀 CHART WATCH: Part Type filter changed from", oldValue, "to", newValue);
                if (this.currentDataType === "parts") {
                    this.handlePartsFilterChange();
                }
            }
        },

        "filterValues": {
            handler() {
                this.scheduleUrlSync();
            },
            deep: true
        },
        
        // Watch selectedStatFilter changes
        selectedStatFilter: {
            handler(newFilter, oldFilter) {
                console.log("👀 CHART WATCH: Stat filter changed from", oldFilter, "to", newFilter);
                this.$nextTick(() => {
                    this.updateChartFromFiltered();
                });
                this.scheduleUrlSync();
            }
        },
        
        // Watch currentDataType changes
        currentDataType: {
            handler(newType, oldType) {
                console.log("👀 CHART WATCH: Data type changed from", oldType, "to", newType);
                this.changeActionRefreshKey++; // Refresh Change Action links
                this.$nextTick(() => {
                    this.updateChartFromFiltered();
                    // Re-setup drag listeners when data type changes
                    this.setupTableDragListeners();
                    // Force chart reactivity
                    this.lateReleaseChartKey++;
                });
                this.scheduleUrlSync();
            }
        },
        

        
        // Watch tableHeaders changes to re-setup drag listeners
        tableHeaders: {
            handler() {
                console.log("👀 TABLE WATCH: Headers changed, re-setting up drag listeners");
                this.$nextTick(() => {
                    this.setupTableDragListeners();
                });
            }
        },

        // Force chart refresh when bar chart legend toggles change
        showUnreleasedBar: {
            handler() {
                this.lateReleaseChartKey++;
            }
        },
        showReleasedBar: {
            handler() {
                this.lateReleaseChartKey++;
            }
        },
        showNoCriticalBar: {
            handler() {
                this.lateReleaseChartKey++;
            }
        },

        // Watch baseFilteredData to refresh bar chart when dropdown filters change
        baseFilteredData: {
            handler(newData) {
                // Always regenerate when filters change (computed property handles reactivity)
                if (newData && this.currentDataType === "parts") {
                    console.log("👀 baseFilteredData changed - refreshing bar chart");
                    
                    // Only regenerate chart data if NOT zoomed
                    if (!this.isLateReleaseChartZoomed) {
                        console.log("📄 Generating new chart data from computed property...");
                        this.lateReleaseChartData = this.generateLateReleaseChartData;
                        console.log("✅ Chart data generated:", {
                            labels: this.lateReleaseChartData?.labels,
                            datasetCount: this.lateReleaseChartData?.datasets?.length
                        });
                    }
                    
                    // Increment key in nextTick to ensure data is set first
                    this.$nextTick(() => {
                        console.log("🔑 Incrementing lateReleaseChartKey to trigger render");
                        this.lateReleaseChartKey++;
                    });
                }
            },
            deep: false
        },

        targetReleaseDateRange() {
            const dates = this.filteredTableData.map(item => item["tgtRelease"]);
            return this.calculateDateRange(dates);
        },

        actualReleaseDateRange() {
            const dates = this.filteredTableData.map(item => item["actualRelease"]);
            return this.calculateDateRange(dates);
        },

        criticalReleaseDateRange() {
            const dates = this.filteredTableData.map(item => item["criticalRelease"]);
            return this.calculateDateRange(dates);
        }
    },
    
    async mounted() {
        console.log("🚀 ReleasePlannerWidget mounted - initializing...");
        console.log("📊 Current data type:", this.currentDataType);
        console.log("🏷️  Widget title:", this.widgetTitle);
        console.log("🖥️ Kiosk mode:", this.isKioskMode);
        console.log("🔧 USE_MOCK_DATA:", USE_MOCK_DATA);
        
        // Initialize Late Material Release Burner chart enhancements
        console.log("🎨 Loading Late Material Release Burner chart with enhanced visuals");
        
        // Load default program from localStorage
        const savedDefaultProgram = localStorage.getItem("defaultProgram");
        if (savedDefaultProgram) {
            this.defaultProgram = savedDefaultProgram;
            console.log("📌 Loaded default program from settings:", savedDefaultProgram);
        }
        
        // Check URL for kiosk mode on mount
        if (typeof window !== "undefined") {
            const params = new URLSearchParams(window.location.search);
            const isKiosk = params.get("mode") === "kiosk";
            
            if (isKiosk) {
                this.kioskModeActive = true;
                console.log("🖥️ Kiosk mode detected from URL - preserving all parameters");
            } else {
                // Only clear URL parameters when NOT in kiosk mode
                // This allows kiosk URLs with filters to work when shared
                if (window.location.search) {
                    const basePath = window.location.pathname;
                    const hash = window.location.hash || "";
                    window.history.replaceState({}, "", `${basePath}${hash}`);
                    console.log("🧹 Cleared URL parameters on page load (not in kiosk mode)");
                }
            }
        }
        
        // Initialize responsive dimensions
        this.initializeResponsiveDimensions();
        
        // Initialize by fetching programs first
        await this.fetchPrograms();

        // Only apply filters from URL if in kiosk mode, otherwise start fresh
        if (this.isKioskMode) {
            await this.applyFiltersFromQuery();
        }
        
        // Start kiosk mode page rotation if enabled
        if (this.isKioskMode) {
            this.$nextTick(() => {
                this.startKioskPageRotation();
                this.startKioskAutoRefresh();
                this.kioskLastRefreshTime = Date.now(); // Set initial refresh time
                
                // Recalculate dimensions for kiosk mode
                this.onResponsiveResize({});
            });
        }
        
        // Add window resize listener for all modes
        if (typeof window !== "undefined") {
            window.addEventListener("resize", this.handleWindowResize);
        }
        
        // Setup drag listeners after initial render
        this.setupTableDragListeners();
        
        // Listen for environment changes from Konami code
        this.setupEnvironmentChangeListener();
    },
    
    beforeDestroy() {
        // Clean up any pending filter change timeouts to prevent memory leaks
        if (this.filterChangeTimeout) {
            clearTimeout(this.filterChangeTimeout);
        }
        if (this.urlSyncTimeout) {
            clearTimeout(this.urlSyncTimeout);
        }
        this.clearLoadingProgressTimer();
        this.stopKioskPageRotation();
        this.stopKioskAutoRefresh();
        
        // Remove window resize listener
        if (typeof window !== "undefined") {
            window.removeEventListener("resize", this.handleWindowResize);
        }
    },
    
    methods: {
        // Handle chart bar click for filtering table data
        async handleChartBarClick(event, elements) {
            this.chartInteractionLoading = true;
            
            try {
                console.log("🖱️ ====== CHART BAR CLICK START ======");
                console.log("🖱️ Chart bar clicked!", { event, elements });
            console.log("🖱️ Current state BEFORE click:", {
                selectedTimeBucket: this.selectedTimeBucket,
                selectedDatasetType: this.selectedDatasetType,
                isZoomed: this.isLateReleaseChartZoomed,
                zoomedBucket: this.zoomedTimeBucket
            });
            
            if (elements && elements.length > 0) {
                const element = elements[0];
                const datasetIndex = element._datasetIndex;
                const index = element._index;
                
                // Get the time bucket label
                const timeBucket = this.lateReleaseChartData.labels[index];
                
                // Get the dataset type
                const dataset = this.lateReleaseChartData.datasets[datasetIndex];
                const datasetType = dataset.label;
                
                console.log("📊 Chart click details:", {
                    timeBucket,
                    datasetType,
                    datasetIndex,
                    index
                });
                
                // If clicking the same bar, toggle off (zoom out AND clear filter)
                if (this.selectedTimeBucket === timeBucket && 
                    this.selectedDatasetType === datasetType &&
                    this.isLateReleaseChartZoomed) {
                    console.log("🔄 TOGGLING OFF - same bar clicked, resetting zoom and filter");
                    
                    // Clear both zoom and filter state
                    this.selectedTimeBucket = null;
                    this.selectedDatasetType = null;
                    this.isLateReleaseChartZoomed = false;
                    this.zoomedTimeBucket = null;
                    
                    // Restore original chart data
                    if (this.originalLateReleaseChartData) {
                        this.lateReleaseChartData = this.originalLateReleaseChartData;
                        this.originalLateReleaseChartData = null;
                        
                        // Reinitialize chart with full data
                        if (this.lateReleaseChart) {
                            this.lateReleaseChart.destroy();
                            this.lateReleaseChart = null;
                        }
                        this.initializeLateReleaseChart();
                    }
                } else {
                    // New bar clicked - zoom in AND filter
                    console.log("🔍 ZOOMING IN and FILTERING to:", timeBucket, datasetType);
                    
                    // Store original chart data on first zoom
                    if (!this.isLateReleaseChartZoomed) {
                        // Ensure we have full data before storing
                        if (!this.lateReleaseChartData) {
                            this.lateReleaseChartData = this.generateLateReleaseChartData;
                        }
                        // Manual shallow clone to avoid circular reference from Chart.js
                        this.originalLateReleaseChartData = {
                            labels: [...this.lateReleaseChartData.labels],
                            datasets: this.lateReleaseChartData.datasets.map(ds => ({
                                label: ds.label,
                                data: [...ds.data],
                                backgroundColor: Array.isArray(ds.backgroundColor) ? [...ds.backgroundColor] : ds.backgroundColor,
                                borderColor: Array.isArray(ds.borderColor) ? [...ds.borderColor] : ds.borderColor,
                                borderWidth: ds.borderWidth,
                                hidden: ds.hidden
                            }))
                        };
                        console.log("💾 Stored original chart data", this.originalLateReleaseChartData.labels);
                    }
                    
                    // Set zoom state
                    this.isLateReleaseChartZoomed = true;
                    this.zoomedTimeBucket = timeBucket;
                    
                    // Set filter state (for table filtering)
                    this.selectedTimeBucket = timeBucket;
                    this.selectedDatasetType = "BOTH";
                    
                    // Create zoomed chart data with only the clicked bucket
                    const bucketIndex = this.lateReleaseChartData.labels.indexOf(timeBucket);
                    
                    console.log("🔍 Creating zoomed data:", {
                        timeBucket,
                        bucketIndex,
                        originalLabels: this.lateReleaseChartData.labels,
                        originalDatasets: this.lateReleaseChartData.datasets.map(ds => ({
                            label: ds.label,
                            data: ds.data,
                            hidden: ds.hidden
                        }))
                    });
                    
                    const zoomedData = {
                        labels: [timeBucket],
                        datasets: this.lateReleaseChartData.datasets.map(ds => ({
                            ...ds,
                            data: [ds.data[bucketIndex]],
                            hidden: false // Ensure all datasets are visible when zoomed
                        }))
                    };
                    
                    console.log("🔍 Zoomed data created:", {
                        labels: zoomedData.labels,
                        datasets: zoomedData.datasets.map(ds => ({
                            label: ds.label,
                            data: ds.data,
                            hidden: ds.hidden
                        }))
                    });
                    
                    this.lateReleaseChartData = zoomedData;
                    
                    // ALWAYS use key increment for reliable chart recreation
                    console.log("🔄 Force re-initializing chart with key increment");
                    this.$nextTick(() => {
                        this.lateReleaseChartKey++;
                    });
                    
                    console.log("✅ Zoomed to bucket:", timeBucket);
                }
            }
            
            await this.$nextTick();
            
            console.log("🖱️ Current state AFTER click:", {
                selectedTimeBucket: this.selectedTimeBucket,
                selectedDatasetType: this.selectedDatasetType,
                isZoomed: this.isLateReleaseChartZoomed,
                zoomedBucket: this.zoomedTimeBucket,
                baseFilteredDataLength: this.baseFilteredData?.length || 0,
                filteredTableDataLength: this.filteredTableData?.length || 0
            });
            console.log("🖱️ ====== CHART BAR CLICK END ======");
            
            // CA data is already cached from initial load - no preload needed
            } finally {
                // Small delay to show spinner briefly
                setTimeout(() => {
                    this.chartInteractionLoading = false;
                }, 300);
            }
        },

        // Filter data by selected time bucket from chart click
        filterByTimeBucket(data, timeBucket, datasetType) {
            console.log("🔍 filterByTimeBucket called with:", {
                dataCount: data.length,
                timeBucket,
                datasetType
            });

            // Special handling for "No Critical" bucket
            if (timeBucket === "No Critical" || datasetType.toLowerCase().includes("parts with deliverable")) {
                console.log("🎯 Handling No Critical bucket");
                
                const noCriticalResults = data.filter(item => {
                    // For "No Critical", we want parts that have a phase but no critical release date
                    const hasPhase = item.phase && item.phase.trim() !== "";
                    const hasCriticalDate = item.criticalRelease && item.criticalRelease.trim() !== "" && item.criticalRelease !== "N/A";
                    const result = hasPhase && !hasCriticalDate;
                    
                    if (hasPhase) {
                        console.log(result ? "✅" : "❌", "No Critical check:", {
                            partNo: item.partNoWithRev,
                            phase: item.phase,
                            criticalRelease: item.criticalRelease,
                            hasCriticalDate,
                            result
                        });
                    }
                    
                    return result;
                });
                
                console.log("📊 No Critical filtering results:", {
                    originalCount: data.length,
                    filteredCount: noCriticalResults.length,
                    sampleResults: noCriticalResults.slice(0, 3).map(item => ({
                        partNo: item.partNoWithRev,
                        phase: item.phase,
                        criticalRelease: item.criticalRelease
                    }))
                });
                
                return noCriticalResults;
            }

            // Handle time-based buckets (On-Time, 1 wks, 2 wks, etc.)
            // Use SAME logic as chart creation for bucket boundaries
            console.log("⏰ Handling time-based bucket:", timeBucket);

            const DAYS_PER_WEEK = 7;

            // Filter by both dataset type and time bucket
            const timeFilteredResults = data.filter(item => {
                // First, must have a critical date for time-based filtering
                const criticalDate = item.criticalRelease;
                
                // DEBUG: Log first few items to see actual data structure
                if (data.indexOf(item) < 5) {
                    console.log("🔍 DEBUG - Item structure:", {
                        index: data.indexOf(item),
                        partNo: item.partNoWithRev,
                        criticalRelease: item.criticalRelease,
                        actualRelease: item.actualRelease,
                        criticalFields: Object.keys(item).filter(k => k.toLowerCase().includes("critical")),
                        releaseFields: Object.keys(item).filter(k => k.toLowerCase().includes("release"))
                    });
                }
                
                if (!criticalDate || criticalDate.trim() === "" || criticalDate === "N/A") {
                    return false; // No critical date means it can't be in a time bucket
                }

                // Check dataset type (released vs unreleased)
                const isReleased = !!(item.actualRelease && item.actualRelease.trim() !== "" && item.actualRelease.toUpperCase() !== "N/A");
                let matchesDatasetType = false;
                
                if (datasetType === "BOTH") {
                    matchesDatasetType = true; // Accept all items
                } else if (datasetType.toLowerCase().includes("unreleased")) {
                    matchesDatasetType = !isReleased;
                } else if (datasetType.toLowerCase().includes("released")) {
                    matchesDatasetType = isReleased;
                } else {
                    // If dataset type is unclear, accept both
                    matchesDatasetType = true;
                }
                
                if (!matchesDatasetType) {
                    return false;
                }

                // Calculate days late for this item - SAME as chart logic
                try {
                    const critical = new Date(criticalDate);
                    const compareDate = isReleased ? new Date(item.actualRelease) : new Date();
                    
                    const timeDiff = compareDate - critical;
                    const daysDiff = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));

                    // Match the time bucket using SAME logic as chart creation
                    let matches = false;
                    
                    if (timeBucket === "On-Time") {
                        // On-time or early (not late)
                        matches = daysDiff <= 0;
                    } else if (daysDiff <= 0) {
                        // Item is not late, skip other buckets
                        return false;
                    } else {
                        // Item is late - use absolute days for bucket matching
                        const diffDays = Math.abs(daysDiff);
                        
                        // DEBUG: Log calculation for first few late items
                        if (data.indexOf(item) < 5 && daysDiff > 0) {
                            console.log("🔍 DEBUG - Late item calculation:", {
                                partNo: item.partNoWithRev,
                                daysDiff,
                                diffDays,
                                timeBucket,
                                bucketCheck: {
                                    "1wks": diffDays <= DAYS_PER_WEEK,
                                    "2wks": diffDays > DAYS_PER_WEEK && diffDays <= DAYS_PER_WEEK * 2,
                                    "3wks": diffDays > DAYS_PER_WEEK * 2 && diffDays <= DAYS_PER_WEEK * 3,
                                    ">4wks": diffDays > DAYS_PER_WEEK * 3
                                }
                            });
                        }
                        
                        if (timeBucket === "1 wks") {
                            matches = diffDays <= DAYS_PER_WEEK;
                        } else if (timeBucket === "2 wks") {
                            matches = diffDays > DAYS_PER_WEEK && diffDays <= DAYS_PER_WEEK * 2;
                        } else if (timeBucket === "3 wks") {
                            matches = diffDays > DAYS_PER_WEEK * 2 && diffDays <= DAYS_PER_WEEK * 3;
                        } else if (timeBucket.includes(">4")) {
                            matches = diffDays > DAYS_PER_WEEK * 3;
                        }
                    }

                    if (matches) {
                        console.log("✅ Time bucket match:", {
                            partNo: item.partNoWithRev,
                            daysDiff,
                            diffDays: Math.abs(daysDiff),
                            timeBucket,
                            isReleased
                        });
                    }

                    return matches;
                } catch (error) {
                    console.error("❌ Date calculation error:", {
                        partNo: item.partNoWithRev,
                        criticalDate,
                        actualRelease: item.actualRelease,
                        error: error.message
                    });
                    return false;
                }
            });

            console.log("📊 Time bucket filtering results:", {
                originalCount: data.length,
                filteredCount: timeFilteredResults.length,
                timeBucket,
                datasetType
            });

            return timeFilteredResults;
        },

        // Initialize Late Release Chart using Chart.js directly
        initializeLateReleaseChart() {
            console.log("🎨 ====== INITIALIZE LATE RELEASE CHART START ======");
            console.log("🎨 Current state:", {
                hasChartData: !!this.lateReleaseChartData,
                isZoomed: this.isLateReleaseChartZoomed,
                zoomedBucket: this.zoomedTimeBucket,
                chartKey: this.lateReleaseChartKey,
                hasExistingChart: !!this.lateReleaseChart
            });
            
            // Defensive check: Skip initialization if no data available yet
            if (!this.baseFilteredData || this.baseFilteredData.length === 0) {
                console.warn("⚠️ No data available yet, skipping chart initialization");
                return;
            }
            
            try {
                console.log("📊 initializeLateReleaseChart called");
                
                // Get canvas element
                const canvas = this.$refs.lateReleaseChartCanvas;
                if (!canvas) {
                    console.error("❌ Canvas element not found - ref 'lateReleaseChartCanvas' not accessible");
                    return;
                }

                // Wait for DOM to settle
                this.$nextTick(() => {
                    try {
                        // Validate OR GENERATE chart data to avoid early aborts
                        if (!this.lateReleaseChartData || !this.lateReleaseChartData.datasets) {
                            console.warn("⚠️ lateReleaseChartData not ready, generating now...");
                            this.lateReleaseChartData = this.generateLateReleaseChartData;

                            if (!this.lateReleaseChartData || !this.lateReleaseChartData.datasets) {
                                console.error("❌ Still no chart data after generation, aborting initialization");
                                return;
                            }
                        }

                        // Destroy existing chart if present
                        if (this.lateReleaseChart) {
                            console.log("🔄 Destroying existing chart instance");
                            this.lateReleaseChart.destroy();
                            this.lateReleaseChart = null;
                        }

                        // Set explicit canvas dimensions
                        canvas.width = 800;
                        canvas.height = 400;

                        // Get 2D context
                        const ctx = canvas.getContext("2d");
                        if (!ctx) {
                            console.error("❌ Failed to get 2D context from canvas");
                            return;
                        }

                        // Ensure we have chart data
                        if (!this.lateReleaseChartData) {
                            this.lateReleaseChartData = this.generateLateReleaseChartData;
                        }
                        
                        console.log("✅ Canvas ready, creating Chart.js instance with data:", {
                            labels: this.lateReleaseChartData.labels,
                            datasetCount: this.lateReleaseChartData.datasets.length,
                            firstDataset: this.lateReleaseChartData.datasets[0]?.label,
                            firstDatasetData: this.lateReleaseChartData.datasets[0]?.data,
                            isZoomed: this.isLateReleaseChartZoomed
                        });

                        // Create Chart.js instance with our data and options
                        this.lateReleaseChart = new Chart(ctx, {
                            type: "bar",
                            data: this.lateReleaseChartData,
                            options: this.lateReleaseChartOptions
                        });

                        console.log("✅ Chart initialized successfully");
                    } catch (innerError) {
                        console.error("❌ Error in Chart.js initialization:", innerError);
                    }
                });
            } catch (error) {
                console.error("❌ Error initializing late release chart:", error);
            }
        },

        // Reset any selection/zoom on late release chart
        async resetLateReleaseChart() {
            this.chartInteractionLoading = true;
            
            try {
                console.log("🔄 Resetting late release chart selection and zoom...");
                
                // Clear filter selection
                this.selectedTimeBucket = null;
                this.selectedDatasetType = null;
                
                // Clear zoom state and restore original data
                if (this.isLateReleaseChartZoomed && this.originalLateReleaseChartData) {
                    console.log("🔍 Restoring original chart data from zoom");
                    this.lateReleaseChartData = this.originalLateReleaseChartData;
                    this.originalLateReleaseChartData = null;
                }
                
                this.isLateReleaseChartZoomed = false;
                this.zoomedTimeBucket = null;
                
                // Wait for Vue to update
                await this.$nextTick();
                
                // Update existing chart instead of destroying/recreating
                if (this.lateReleaseChart) {
                    console.log("🔄 Updating chart with full data");
                    this.lateReleaseChart.data = this.lateReleaseChartData;
                    this.lateReleaseChart.update();
                    console.log("✅ Chart updated with full data");
                } else {
                    console.log("⚠️ No existing chart found! Force re-initializing...");
                    // Force chart recreation by incrementing key
                    this.$nextTick(() => {
                        this.lateReleaseChartKey++;
                    });
                }
                
                console.log("✅ Chart zoom and selection reset complete");
            } catch (e) {
                console.error("❌ Error resetting late release chart:", e);
            } finally {
                // Small delay to show spinner
                setTimeout(() => {
                    this.chartInteractionLoading = false;
                }, 300);
            }
        },

        // Calculate dynamic width for dropdown based on selected value
        getDropdownWidth(value, label) {
            if (!value && !label) return "140px"; // Default minimum width
            
            // Calculate approximate width based on text length
            const text = value || label || "";
            // Average character width ~7px + icon (20px) + padding (24px) + chevron (20px)
            const charWidth = 7;
            const baseWidth = 64; // icon + padding + chevron
            const calculatedWidth = (text.length * charWidth) + baseWidth;
            
            // Ensure minimum width of 140px with minimal breathing room
            const finalWidth = Math.max(140, calculatedWidth + 8);
            
            return `${finalWidth}px`;
        },

        calculateDateRange(dateArray) {
            if (!dateArray || dateArray.length === 0) {
                return "No dates available";
            }
            
            const validDates = dateArray.filter(date => {
                return date && date !== "N/A" && date !== "" && !isNaN(new Date(date).getTime());
            });
            
            if (validDates.length === 0) {
                return "No valid dates";
            }
            
            const dates = validDates.map(date => new Date(date)).sort((a, b) => a - b);
            const minDate = dates[0];
            const maxDate = dates[dates.length - 1];
            
            const formatDate = date => {
                return date.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric"
                });
            };
            
            if (minDate.getTime() === maxDate.getTime()) {
                return `Date: ${formatDate(minDate)}`;
            } else {
                return `Range: ${formatDate(minDate)} → ${formatDate(maxDate)}`;
            }
        },
        
        // Kiosk Mode Pagination Methods
        startKioskPageRotation() {
            if (!this.isKioskMode) return;
            
            this.stopKioskPageRotation();
            
            // Simple defaults: 10 seconds per page, 15 rows per page
            this.kioskPageDelay = 10000;
            this.kioskRowsPerPage = 15;
            
            // Start rotation timer
            this.kioskPageRotationTimer = setInterval(() => {
                this.rotateToNextPage();
            }, this.kioskPageDelay);
            
            console.log("🖥️ Kiosk page rotation: 10s per page, 15 rows");
        },

        stopKioskPageRotation() {
            if (this.kioskPageRotationTimer) {
                clearInterval(this.kioskPageRotationTimer);
                this.kioskPageRotationTimer = null;
            }
        },

        rotateToNextPage() {
            if (!this.isKioskMode || this.kioskTotalPages <= 1) return;
            
            if (this.kioskCurrentPage >= this.kioskTotalPages) {
                this.kioskCurrentPage = 1;
            } else {
                this.kioskCurrentPage++;
            }
            
            console.log(`🖥️ Rotated to page ${this.kioskCurrentPage} of ${this.kioskTotalPages}`);
        },

        resetKioskPagination() {
            this.kioskCurrentPage = 1;
        },

        handleWindowResize() {
            // Debounce resize events for all modes
            if (this.kioskResizeTimeout) {
                clearTimeout(this.kioskResizeTimeout);
            }
            
            this.kioskResizeTimeout = setTimeout(() => {
                this.onResponsiveResize({});
            }, 250);
        },

        async toggleKioskMode() {
            console.log("🔘 toggleKioskMode called");
            
            if (typeof window === "undefined") {
                console.log("⚠️ Window is undefined");
                return;
            }
            
            const params = new URLSearchParams(window.location.search);
            
            // Store current state before modifying
            const wasKioskMode = this.isKioskMode;
            console.log("📊 Current state - wasKioskMode:", wasKioskMode, "kioskModeActive:", this.kioskModeActive);
            
            if (wasKioskMode) {
                // Exit kiosk mode
                console.log("🚪 Attempting to exit kiosk mode...");
                params.delete("mode");
                params.delete("display"); // Also remove alternate parameter
                this.kioskModeActive = false;
                
                // Stop all kiosk timers
                this.stopKioskPageRotation();
                this.stopKioskAutoRefresh();
                
                console.log("✅ Exited kiosk mode - kioskModeActive:", this.kioskModeActive);
            } else {
                // Enter kiosk mode
                console.log("🖥️ Attempting to enter kiosk mode...");
                params.set("mode", "kiosk");
                this.kioskModeActive = true;
                
                console.log("✅ Entered kiosk mode - kioskModeActive:", this.kioskModeActive);
            }
            
            // Update URL without reload
            const basePath = window.location.pathname;
            const hash = window.location.hash || "";
            const queryString = params.toString();
            const newUrl = queryString ? `${basePath}?${queryString}${hash}` : `${basePath}${hash}`;
            
            console.log("🔗 Updating URL to:", newUrl);
            window.history.pushState({}, "", newUrl);
            
            // Wait for URL change to propagate
            await this.$nextTick();
            
            // Handle mode transitions after URL update
            if (!wasKioskMode && this.isKioskMode) {
                // Entering kiosk mode - start features on next tick
                console.log("▶️ Starting kiosk features...");
                await this.$nextTick();
                this.startKioskPageRotation();
                this.startKioskAutoRefresh();
                this.onResponsiveResize({});
            } else if (wasKioskMode && !this.isKioskMode) {
                // Exiting kiosk mode - resize for normal mode
                console.log("⏹️ Exited - resizing for normal mode...");
                await this.$nextTick();
                this.onResponsiveResize({});
            }
            
            // Trigger reactivity
            console.log("🔄 Forcing component update - new isKioskMode:", this.isKioskMode);
            this.$forceUpdate();
        },

        // Kiosk Mode Auto-Refresh Methods
        startKioskAutoRefresh() {
            if (!this.isKioskMode) return;
            
            this.stopKioskAutoRefresh();
            
            // Simple default: 60 seconds auto-refresh
            this.kioskRefreshInterval = 60000;
            
            // Set next refresh time
            this.kioskNextRefreshTime = Date.now() + this.kioskRefreshInterval;
            
            // Start refresh timer
            this.kioskRefreshTimer = setInterval(() => {
                this.refreshKioskData();
            }, this.kioskRefreshInterval);
            
            // Start countdown update timer (updates every second for display)
            this.kioskCountdownUpdateTimer = setInterval(() => {
                // Force reactivity update for countdown display
                this.$forceUpdate();
            }, 1000);
            
            console.log("🔄 Kiosk auto-refresh: every 60 seconds");
        },

        stopKioskAutoRefresh() {
            if (this.kioskRefreshTimer) {
                clearInterval(this.kioskRefreshTimer);
                this.kioskRefreshTimer = null;
                this.kioskNextRefreshTime = null;
            }
            if (this.kioskCountdownUpdateTimer) {
                clearInterval(this.kioskCountdownUpdateTimer);
                this.kioskCountdownUpdateTimer = null;
            }
        },

        async refreshKioskData() {
            console.log("🔄 Kiosk auto-refresh triggered");
            
            try {
                // Store current page to restore after refresh
                const currentPage = this.kioskCurrentPage;
                
                // Update last refresh time
                this.kioskLastRefreshTime = Date.now();
                
                // Calculate next refresh time
                this.kioskNextRefreshTime = Date.now() + this.kioskRefreshInterval;
                
                // Reload data based on current filters
                if (this.filterValues.phase) {
                    await this.fetchData(this.filterValues.phase); // Refresh data for current phase
                }
                
                // Restore current page if still valid
                this.$nextTick(() => {
                    if (currentPage <= this.kioskTotalPages) {
                        this.kioskCurrentPage = currentPage;
                    } else {
                        this.kioskCurrentPage = 1;
                    }
                });
                
                console.log("✅ Kiosk data refreshed successfully");
            } catch (error) {
                console.error("❌ Kiosk refresh failed:", error);
            }
        },

        clearLoadingProgressTimer() {
            if (this.loadingProgressTimer) {
                clearInterval(this.loadingProgressTimer);
                this.loadingProgressTimer = null;
            }
        },

        setLoadingProgressTarget(target, options = {}) {
            if (typeof window === "undefined") {
                return;
            }

            const {
                immediate = false,
                step,
                interval
            } = options;

            const clampedTarget = Math.min(100, Math.max(0, Number(target) || 0));

            this.loadingProgressTarget = clampedTarget;
            this.loadingProgressStep = typeof step === "number" && step > 0 ? step : (this.loadingProgressStep || LOADING_PROGRESS_DEFAULT_STEP);
            this.loadingProgressInterval = typeof interval === "number" && interval > 0 ? interval : (this.loadingProgressInterval || LOADING_PROGRESS_DEFAULT_INTERVAL);

            if (!this.loadingDialog) {
                return;
            }

            if (immediate) {
                this.clearLoadingProgressTimer();
                this.loadingDialog = {
                    ...this.loadingDialog,
                    percent: clampedTarget
                };
                return;
            }

            this.clearLoadingProgressTimer();

            this.loadingProgressTimer = window.setInterval(() => {
                if (!this.loadingDialog) {
                    this.clearLoadingProgressTimer();
                    return;
                }

                const currentPercent = Number(this.loadingDialog.percent) || 0;

                if (currentPercent >= this.loadingProgressTarget) {
                    if (this.loadingProgressTarget >= 100) {
                        this.clearLoadingProgressTimer();
                    }
                    return;
                }

                const nextPercent = Math.min(
                    this.loadingProgressTarget,
                    currentPercent + this.loadingProgressStep
                );

                this.loadingDialog = {
                    ...this.loadingDialog,
                    percent: nextPercent
                };

                if (nextPercent >= this.loadingProgressTarget && this.loadingProgressTarget >= 100) {
                    this.clearLoadingProgressTimer();
                }
            }, this.loadingProgressInterval);
        },

        setLoadingDialog(payload = {}) {
            const {
                headline = "Loading Dashboard Data",
                detail = "Preparing UI: Chart • Table",
                status = "Fetching API data…",
                progressLabel = "Initializing",
                percent = 0,
                phasesCompleted = 0,
                totalPhases = 0,
                targetPercent,
                progressStep,
                progressInterval,
                immediatePercent = false
            } = payload;

            const basePercent = Math.min(100, Math.max(0, Number(percent) || 0));
            const effectiveTarget = typeof targetPercent === "number" ? targetPercent : basePercent;

            this.loadingDialog = {
                headline,
                detail,
                status,
                progressLabel,
                percent: immediatePercent ? Math.min(100, Math.max(0, Number(effectiveTarget) || 0)) : basePercent,
                phasesCompleted,
                totalPhases
            };

            if (typeof effectiveTarget === "number") {
                this.setLoadingProgressTarget(effectiveTarget, {
                    step: progressStep,
                    interval: progressInterval,
                    immediate: immediatePercent
                });
            }
        },

        updateLoadingDialog(updates = {}) {
            if (!this.loadingDialog) {
                return;
            }

            const {
                percent,
                targetPercent,
                progressStep,
                progressInterval,
                immediatePercent = false,
                ...rest
            } = updates;

            this.loadingDialog = {
                ...this.loadingDialog,
                ...rest
            };

            const effectiveTarget = typeof targetPercent === "number" ? targetPercent : percent;
            if (typeof effectiveTarget === "number" && Number.isFinite(effectiveTarget)) {
                this.setLoadingProgressTarget(effectiveTarget, {
                    step: progressStep,
                    interval: progressInterval,
                    immediate: immediatePercent
                });
            }
        },

        completeLoadingDialog(options = {}) {
            if (!this.loadingDialog) {
                return;
            }

            const { preserveStatus = false, preservePhases = false, immediate = false } = options;
            const { totalPhases = 0 } = this.loadingDialog;

            const nextState = {
                progressLabel: "Wrapping up"
            };

            if (!preservePhases) {
                nextState.phasesCompleted = totalPhases;
            }

            if (!preserveStatus) {
                nextState.status = "Finalizing dashboard…";
            }

            this.updateLoadingDialog({
                ...nextState,
                targetPercent: 100,
                progressStep: immediate ? undefined : LOADING_PROGRESS_COMPLETE_STEP,
                progressInterval: immediate ? undefined : LOADING_PROGRESS_COMPLETE_INTERVAL,
                immediatePercent: immediate
            });
        },

        async applyFiltersFromQuery() {
            if (typeof window === "undefined") {
                return;
            }

            const search = window.location.search || "";
            if (!search || search.length <= 1) {
                return;
            }

            const params = new URLSearchParams(search);
            if (Array.from(params.keys()).length === 0) {
                return;
            }

            console.log("🌐 Applying filters from query string:", params.toString());

            this.isApplyingQuery = true;

            try {
                // Support human-readable parameters with backward compatibility
                const rawType = params.get("view") || params.get("t") || params.get("type") || params.get("dataType") || params.get("objectType");
                if (rawType) {
                    this.setDataType(String(rawType).trim().toLowerCase());
                }

                const programParam = params.get("program") || params.get("p");
                const phaseParam = params.get("phase") || params.get("ph");
                const ataParam = params.get("ata") || params.get("a");
                const engParam = params.get("eng") || params.get("e");
                const makeBuyParam = params.get("make") || params.get("m") || params.get("makeBuy");
                const partTypeParam = params.get("part") || params.get("pt") || params.get("partType");
                const statParam = params.get("status") || params.get("s") || params.get("stat");

                if (programParam) {
                    const programValue = this.findMatchingOptionValue(this.programs, programParam);
                    this.filterValues.program = programValue || String(programParam);
                    await this.fetchPhases();
                }

                if (phaseParam) {
                    const phaseValue = this.findMatchingOptionValue(this.phases, phaseParam);
                    this.filterValues.phase = phaseValue || String(phaseParam);
                    if (this.filterValues.phase) {
                        await this.handlePhaseChange();
                    }
                }

                if (ataParam) {
                    this.filterValues.ataChapterGroup = this.findMatchingOptionValue(this.ataChapterGroups, ataParam) || String(ataParam);
                }

                if (engParam) {
                    this.filterValues.engSystemGroup = this.findMatchingOptionValue(this.engSystemGroups, engParam) || String(engParam);
                }

                if (makeBuyParam && this.currentDataType === "parts") {
                    this.filterValues.makeBuyFilter = this.findMatchingOptionValue(this.makeBuyOptions, makeBuyParam) || String(makeBuyParam);
                }

                if (partTypeParam && this.currentDataType === "parts") {
                    this.filterValues.partTypeFilter = this.findMatchingOptionValue(this.partTypeOptions, partTypeParam) || String(partTypeParam);
                }

                const normalizedStat = this.normalizeStatFilterFromQuery(statParam);
                if (normalizedStat) {
                    this.selectedStatFilter = normalizedStat;
                }
            } catch (error) {
                console.error("⚠️ Failed to apply filters from query:", error);
            } finally {
                this.isApplyingQuery = false;
                this.scheduleUrlSync(true);
            }
        },

        findMatchingOptionValue(options, rawValue) {
            if (rawValue === null || rawValue === undefined) {
                return null;
            }

            const trimmed = String(rawValue).trim();
            if (!trimmed) {
                return null;
            }

            if (!Array.isArray(options) || options.length === 0) {
                return trimmed;
            }

            const normalizedTarget = trimmed.toLowerCase();
            let fallback = null;

            for (const option of options) {
                if (option === null || option === undefined) {
                    continue;
                }

                if (typeof option === "string" || typeof option === "number") {
                    const candidate = String(option);
                    if (candidate.trim().toLowerCase() === normalizedTarget) {
                        return candidate;
                    }
                    continue;
                }

                if (typeof option === "object") {
                    const candidateValues = [];

                    if (option.value !== undefined && option.value !== null) {
                        const valueStr = String(option.value);
                        candidateValues.push(valueStr);
                        if (!fallback) {
                            fallback = valueStr;
                        }
                    }

                    if (option.text !== undefined && option.text !== null) {
                        candidateValues.push(String(option.text));
                    }

                    if (option.label !== undefined && option.label !== null) {
                        candidateValues.push(String(option.label));
                    }

                    if (option.name !== undefined && option.name !== null) {
                        candidateValues.push(String(option.name));
                    }

                    if (option.id !== undefined && option.id !== null) {
                        candidateValues.push(String(option.id));
                    }

                    for (const candidate of candidateValues) {
                        if (candidate.trim().toLowerCase() === normalizedTarget) {
                            return option.value !== undefined && option.value !== null
                                ? String(option.value)
                                : candidate;
                        }
                    }
                }
            }

            return fallback || trimmed;
        },

        normalizeStatFilterFromQuery(statParam) {
            if (statParam === null || statParam === undefined) {
                return null;
            }

            const normalized = String(statParam)
                .trim()
                .toLowerCase()
                .replace(/[^a-z0-9]/g, "");

            const lookup = {
                all: "all",
                released: "released",
                thisweek: "thisWeek",
                nextweek: "nextWeek",
                overdue: "overdue",
                criticallyoverdue: "criticallyOverdue",
                criticaloverdue: "criticallyOverdue",
                critoverdue: "criticallyOverdue",
                next30days: "next30Days",
                next30day: "next30Days"
            };

            return lookup[normalized] || null;
        },

        scheduleUrlSync(immediate = false) {
            if (typeof window === "undefined" || this.isApplyingQuery) {
                return;
            }

            if (this.urlSyncTimeout) {
                clearTimeout(this.urlSyncTimeout);
                this.urlSyncTimeout = null;
            }

            const execute = () => {
                this.writeFiltersToQuery();
            };

            if (immediate) {
                execute();
            } else {
                this.urlSyncTimeout = setTimeout(execute, this.urlSyncDelay);
            }
        },

        writeFiltersToQuery() {
            if (typeof window === "undefined") {
                return;
            }

            const queryString = this.buildQueryFromState();
            const basePath = window.location.pathname;
            const hash = window.location.hash || "";
            const newUrl = queryString ? `${basePath}?${queryString}${hash}` : `${basePath}${hash}`;

            window.history.replaceState({}, "", newUrl);
        },

        buildQueryFromState() {
            const params = new URLSearchParams();

            if (this.currentDataType && this.currentDataType !== "parts") {
                params.set("view", this.currentDataType);
            }

            const {
                program,
                phase,
                ataChapterGroup,
                engSystemGroup,
                makeBuyFilter,
                partTypeFilter
            } = this.filterValues;

            if (program) {
                params.set("program", program);
            }

            if (phase) {
                params.set("phase", phase);
            }

            if (ataChapterGroup && ataChapterGroup !== "All") {
                params.set("ata", ataChapterGroup);
            }

            if (engSystemGroup && engSystemGroup !== "All") {
                params.set("eng", engSystemGroup);
            }

            if (this.currentDataType === "parts" && makeBuyFilter && makeBuyFilter !== "All") {
                params.set("make", makeBuyFilter);
            }

            if (this.currentDataType === "parts" && partTypeFilter && partTypeFilter !== "All") {
                params.set("part", partTypeFilter);
            }

            if (this.selectedStatFilter && this.selectedStatFilter !== "all") {
                params.set("status", this.selectedStatFilter);
            }

            const sortedEntries = Array.from(params.entries()).sort(([a], [b]) => a.localeCompare(b));
            const sortedParams = new URLSearchParams(sortedEntries);

            return sortedParams.toString();
        },

        scrollToFilters() {
            this.$nextTick(() => {
                const filterRef = this.$refs.inlineFilterBar;
                const element = filterRef?.$el || filterRef;
                if (element && typeof element.scrollIntoView === "function") {
                    element.scrollIntoView({ behavior: "smooth", block: "start" });
                }

                const schedule = (typeof window !== "undefined" && window.requestAnimationFrame)
                    ? window.requestAnimationFrame.bind(window)
                    : cb => setTimeout(cb, FOCUS_SCROLL_DELAY);

                schedule(() => {
                    const firstInput = element?.querySelector?.("input, button, [tabindex]");
                    if (firstInput && typeof firstInput.focus === "function") {
                        firstInput.focus({ preventScroll: true });
                    }
                });
            });
        },

        /**
         * Determine if a filter should be disabled based on dependencies
         * @param {string} filterKey - The key of the filter to check
         * @returns {boolean} Whether the filter should be disabled
         */
        getFilterDisabledState(filterKey) {
            // Always require a data type to be selected first
            if (!this.currentDataType) {
                return true;
            }
            
            // Phase filter requires program to be selected
            if (filterKey === "phase") {
                const programValue = this.filterValues.program;
                const isDisabled = !programValue || 
                       programValue === "" ||
                       programValue === "All" ||
                       programValue === null || 
                       programValue === undefined;
                
                return isDisabled;
            }
            
            // All other filters only require data type
            return false;
        },

        /**
         * Get CSS class for table row based on overdue status
         * Uses the same logic as Release Stats to ensure consistency
         * @param {Object} item - Table row item
         * @returns {string} CSS class name
         */
        getRowClass(item) {
            // Only apply overdue styling for parts data type
            if (this.currentDataType !== "parts") {
                return "";
            }

            // Don't highlight released items - they are good to go
            const itemState = item.currentState || item.state || item.status || item.itemState;
            if (itemState === "RELEASED") {
                return "";
            }

            // Use the same logic as FilterService for consistency with Release Stats
            const currentDate = new Date();
            currentDate.setHours(0, 0, 0, 0);
            const currentMs = currentDate.getTime();

            // Check for critically overdue (critical date is past due)
            const criticalDate = item.criticalRelease || item.criticalReleaseDate;
            if (criticalDate) {
                const critical = new Date(criticalDate);
                critical.setHours(0, 0, 0, 0);
                if (critical.getTime() < currentMs) {
                    return "critically-overdue-row";
                }
            }

            // Check for overdue (target date is past due, but not critically overdue)
            const targetDate = this.extractTargetDate(item);
            if (targetDate) {
                const target = new Date(targetDate);
                target.setHours(0, 0, 0, 0);
                if (target.getTime() < currentMs) {
                    // Only mark as overdue if not already critically overdue
                    if (!criticalDate || new Date(criticalDate).getTime() >= currentMs) {
                        return "overdue-row";
                    }
                }
            }

            return "";
        },

        /**
         * Get drag attributes for a table row
         * @param {Object} item - Table row item
         * @returns {Object} Drag attributes for v-bind
         */
        getRowDragAttributes(item) {
            const tableDrag = this.dragDrop.setupTableRowDrag(
                this.filteredTableData,
                // Function to extract physId from row data
                rowData => {
                    return rowData.physId || rowData.objId || rowData.id;
                },
                // Function to extract additional item data
                rowData => {
                    return {
                        itemType: this.currentDataType,
                        itemNumber: rowData.itemNumber || rowData.partNo || rowData.caNumber || rowData.crNumber || rowData.name,
                        itemState: rowData.state || rowData.status || rowData.itemState,
                        physId: rowData.physId || rowData.objId || rowData.id,
                        title: rowData.title || rowData.name || ""
                    };
                }
            );
            
            const attrs = tableDrag.getRowDragAttributes(item);
            
            // Debug log when drag attributes are applied
            if (attrs.draggable === "true") {
                console.log("✅ Applied drag attributes to item:", {
                    physId: item.physId || item.objId,
                    itemNumber: item.itemNumber || item.partNo,
                    draggable: attrs.draggable
                });
            }
            
            return attrs;
        },

        /**
         * Handle drag start for table rows (new direct event handler approach)
         * @param {Object} item - Row item data
         * @param {DragEvent} event - Drag event
         */
        handleRowDragStart(item, event) {
            const physId = item.physId || item.objId || item.id;
            const itemData = {
                itemType: this.currentDataType,
                itemNumber: item.itemNumber || item.partNo || item.caNumber || item.crNumber || item.name,
                itemState: item.state || item.status || item.itemState,
                physId,
                title: item.title || item.name || ""
            };
            
            // Call the composable's onDragStart directly
            this.dragDrop.onDragStart(event, physId, itemData);
        },

        /**
         * Handle drag end for table rows
         * @param {DragEvent} event - Drag event
         */
        handleRowDragEnd(event) {
            this.dragDrop.onDragEnd(event);
        },

        /**
         * Get column value for display in table cell
         * @param {Object} item - Table row item
         * @param {string} columnKey - Column key/property name
         * @returns {any} Column value
         */
        getColumnValue(item, columnKey) {
            // Handle nested property access (e.g., "properties.status")
            if (columnKey.includes(".")) {
                return columnKey.split(".").reduce((obj, key) => obj?.[key], item);
            }
            return item[columnKey];
        },

        /**
         * Get column styling for proper alignment with headers
         * @param {Object} header - Table header object
         * @returns {Object} Style object for the column
         */
        getColumnStyle(header) {
            const style = {};
            
            // Apply width if specified
            if (header.width) {
                style.width = header.width;
                style.minWidth = header.width;
                style.maxWidth = header.width;
            }
            
            // Apply text alignment
            if (header.align) {
                style.textAlign = header.align;
            }
            
            // Apply any custom styles from header
            if (header.cellStyle) {
                Object.assign(style, header.cellStyle);
            }
            
            return style;
        },

        /**
         * Get a specific drag attribute for a table row
         * @param {Object} item - Table row item
         * @param {String} attributeName - Name of the attribute to get
         * @returns {*} The requested attribute value
         */
        getDragAttribute(item, attributeName) {
            const dragAttrs = this.getRowDragAttributes(item);
            return dragAttrs[attributeName];
        },

        /**
         * Set up drag and drop functionality on table rows
         * Adds event listeners to table rows after they render
         */
        setupTableDragListeners() {
            // Wait for DOM to update, then find and setup drag listeners
            this.$nextTick(() => {
                const tableElement = this.$el.querySelector(".v-data-table tbody");
                if (!tableElement) {
                    console.log("🎯 Table tbody not found yet, will retry on next update");
                    return;
                }
                
                const rows = tableElement.querySelectorAll("tr");
                console.log(`🎯 Setting up drag listeners for ${rows.length} table rows`);
                
                rows.forEach((row, index) => {
                    // Make row draggable
                    row.setAttribute("draggable", "true");
                    row.style.cursor = "grab";
                    row.classList.add("draggable-table-row");
                    
                    // Get the corresponding data item
                    const item = this.filteredTableData[index];
                    if (item) {
                        row.title = `Drag row: ${item.itemNumber || item.number || "N/A"}`;
                        
                        // Add drag event listeners
                        row.addEventListener("dragstart", event => {
                            this.handleRowDragStart(item, event);
                        });
                        
                        row.addEventListener("dragend", event => {
                            this.handleRowDragEnd(event);
                        });
                    }
                });
            });
        },

        /**
         * Handle responsive resize events - simplified for natural table sizing
         */
        onResponsiveResize(_resizeData) {
            if (typeof window === "undefined") return;
            
            // Calculate dynamic table height based on window height
            this.calculateTableHeight();
            
            // Chart resizes naturally via flex, no calculations needed
            console.log("📐 Natural sizing: Table sizes to content, chart fills container");
            
            // Force chart resize
            this.$nextTick(() => {
                if (this.$refs.lineChart && this.$refs.lineChart.chart) {
                    this.$refs.lineChart.chart.resize();
                }
                
                // Update chart data to reflect new responsive options
                this.updateChartFromFiltered();
            });
        },
        
        /**
         * Calculate dynamic table height based on available window space
         */
        calculateTableHeight() {
            if (typeof window === "undefined") return;
            
            const windowHeight = window.innerHeight;
            
            // Reserve space for:
            // - Header/toolbar: ~120px
            // - Chart and stats: ~280px
            // - Table header: ~48px
            // - Pagination footer: ~60px
            // - Padding/margins: ~60px
            const reservedSpace = 120 + 280 + 48 + 60 + 60; // ~568px
            
            // Calculate available space for table body
            const availableHeight = windowHeight - reservedSpace;
            
            // Set minimum of 300px and maximum of 800px
            this.dynamicTableHeight = Math.max(300, Math.min(800, availableHeight));
            
            console.log(`📏 Window height: ${windowHeight}px, Table height: ${this.dynamicTableHeight}px`);
        },
        
        /**
         * Initialize responsive dimensions on component mount
         */
        initializeResponsiveDimensions() {
            this.calculateTableHeight();
            this.onResponsiveResize({});
        },
        
        /**
         * Setup listener for environment changes from Konami code
         */
        setupEnvironmentChangeListener() {
            // Listen for storage events (localStorage changes)
            window.addEventListener("storage", event => {
                if (event.key === "env_override") {
                    console.log("🔄 Environment change detected via storage event:", event.newValue);
                    this.handleEnvironmentChange();
                }
            });
            
            // Also listen for custom events that we can dispatch from Konami code
            window.addEventListener("environmentChanged", () => {
                console.log("🔄 Environment change detected via custom event");
                this.handleEnvironmentChange();
            });
        },
        
        /**
         * Handle environment change - refresh data and UI
         */
        handleEnvironmentChange() {
            console.log("🔄 Handling environment change...");
            
            // Force reactivity update
            this.environmentChangeKey += 1;
            
            // Log current state
            console.log("🔄 Current API URL:", getApiBaseUrl());
            console.log("🔄 Environment chip will update:", this.apiEnvironmentChip);
            
            // Refresh data if we have selections
            if (this.currentDataType && this.filterValues.phase) {
                console.log("🔄 Refreshing data for new environment...");
                this.refreshData();
            }
        },
        
        // ===== EXISTING METHODS CONTINUE =====
        
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
            const baseData = dataTransformationService.mapItemToTableData(item, this.currentDataType);
            
            // Add masked state value for all data types
            baseData.currentStateMasked = this.maskStateValue(baseData.currentState);
            
            // Add part-specific computed fields
            if (this.currentDataType === "parts") {
                baseData.partNoWithRev = this.combinePartNoWithRev(baseData.partNo, baseData.rev);
                baseData.engSystemGroupShort = this.getSystemGroupShort(baseData.engSystemGroup);
            }
            
            return baseData;
        },

        /**
         * Mask state values for display
         * @param {string} state - Raw state value
         * @returns {string} Masked state value
         */
        maskStateValue(state) {
            if (!state) return "";
            
            const stateMap = {
                "RELEASED": "RLS",
                "FROZEN": "FRZ",
                "In Work": "WRK",
                "In Approval": "APR"
            };
            
            return stateMap[state] || state;
        },

        /**
         * Get truncated system group (first 4 letters)
         * @param {string} systemGroup - Full system group name
         * @returns {string} Truncated system group
         */
        getSystemGroupShort(systemGroup) {
            if (!systemGroup || systemGroup === "All") return systemGroup;
            return systemGroup.substring(0, 4).toUpperCase();
        },

        /**
         * Combine part number and revision
         * @param {string} partNo - Part number
         * @param {string} rev - Revision
         * @returns {string} Combined part number with revision
         */
        combinePartNoWithRev(partNo, rev) {
            if (!partNo) return "";
            if (!rev) return partNo;
            return `${partNo} (${rev})`;
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
        
        toggleCriticalLine() {
            this.showCriticalLine = !this.showCriticalLine;
            console.log("👁️ Critical line toggled:", this.showCriticalLine);
            this.updateChartFromFiltered();
        },

        /**
         * Focus chart on ±30 days from today
         * Toggles between focused view and full view
         */
        focusOn30Days() {
            if (this.chartFocusActive) {
                // Exit focus mode - return to full view
                this.chartFocusActive = false;
                this.chartFocusStartDate = null;
                this.chartFocusEndDate = null;
                console.log("📅 Focus mode deactivated - showing full timeline");
            } else {
                // Enter focus mode - zoom to ±30 days
                const today = new Date();
                
                // Calculate start date: 30 days before today
                const startDate = new Date(today);
                const DAYS_BEFORE = 30;
                startDate.setDate(today.getDate() - DAYS_BEFORE);
                
                // Calculate end date: 30 days after today
                const endDate = new Date(today);
                const DAYS_AFTER = 30;
                endDate.setDate(today.getDate() + DAYS_AFTER);
                
                this.chartFocusActive = true;
                this.chartFocusStartDate = startDate;
                this.chartFocusEndDate = endDate;
                
                console.log(`📅 Focused chart on ±30 days: ${startDate.toLocaleDateString()} to ${endDate.toLocaleDateString()}`);
            }
            
            // Force chart update
            this.chartKey++;
            this.updateChartFromFiltered();
        },
        
        // Handle filter changes from UniversalFilterControls with debouncing
        handleFilterChange(filterEvent) {
            console.log("🔄 HANDLE FILTER CHANGE (with debouncing):");
            console.log("  - Filter key:", filterEvent.key);
            console.log("  - Filter value:", filterEvent.value);
            console.log("  - All filters:", filterEvent.allFilters);
            console.log("  - Previous filterValues:", JSON.stringify(this.filterValues));
            
            // Clear dependent filters when parent filter changes
            let updatedFilters = { ...filterEvent.allFilters };
            if (filterEvent.key === "program") {
                // Clear phase when program changes or is cleared
                if (!filterEvent.value || filterEvent.value === "" || filterEvent.value === "All") {
                    updatedFilters.phase = "";
                    console.log("  - Cleared phase filter due to program change");
                }
            }
            
            // Update filter values immediately for UI responsiveness
            this.filterValues = updatedFilters;
            
            console.log("  - New filterValues:", JSON.stringify(this.filterValues));
            
            // Handle program changes immediately (no debounce needed for phase population)
            if (filterEvent.key === "program") {
                console.log("🚀 Executing program change immediately (no debounce)");
                this.executeFilterChange({ ...filterEvent, allFilters: updatedFilters });
                return; // Exit early, no debounce needed
            }
            
            // For all other filters, use debounce
            // Clear existing timeout
            if (this.filterChangeTimeout) {
                clearTimeout(this.filterChangeTimeout);
            }
            
            // Set up debounced execution with updated filters
            this.filterChangeTimeout = setTimeout(() => {
                this.executeFilterChange({ ...filterEvent, allFilters: updatedFilters });
            }, this.filterDebounceDelay);
        },
        
        // Execute the actual filter change logic (after debounce delay)
        executeFilterChange(filterEvent) {
            console.log("⏰ Executing debounced filter change for:", filterEvent.key);
            
            // Handle specific filter logic
            if (filterEvent.key === "program") {
                console.log("🔄 Program changed, fetching phases...");
                this.onProgramChange();
            } else if (filterEvent.key === "phase") {
                console.log("🔄 Phase changed, fetching data...");
                this.handlePhaseChange();
            } else if (filterEvent.key === "ataChapterGroup") {
                console.log("🔄 ATA Chapter changed, updating chart...");
                this.updateChartFromFiltered();
                this.lastUpdated = new Date().toLocaleTimeString();
            } else if (filterEvent.key === "engSystemGroup") {
                console.log("🔄 Engineering System changed, updating chart...");
                this.updateChartFromFiltered();
                this.lastUpdated = new Date().toLocaleTimeString();
            }
        },
        
        // Handle parts-specific filter changes with debouncing
        handlePartsFilterChange() {
            console.log("🔄 Parts filter changed (with debouncing)");
            
            // Clear existing timeout
            if (this.filterChangeTimeout) {
                clearTimeout(this.filterChangeTimeout);
            }
            
            // Set up debounced execution
            this.filterChangeTimeout = setTimeout(() => {
                console.log("⏰ Executing debounced parts filter change");
                this.changeActionRefreshKey++;
                this.$nextTick(() => {
                    this.updateChartFromFiltered();
                    this.lastUpdated = new Date().toLocaleTimeString();
                });
            }, this.filterDebounceDelay);
        },
        
        /**
         * Export table data in the specified format using ExportService
         */
        async exportTableData(format) {
            // Show export progress dialog
            this.setLoadingDialog({
                headline: "Exporting Data",
                detail: `Preparing ${format.toUpperCase()} export with complete CA data`,
                status: "Analyzing data requirements...",
                progressLabel: "Starting export",
                percent: 0,
                targetPercent: 20,
                progressInterval: 100,
                phasesCompleted: 0,
                totalPhases: 3
            });
            
            try {
                // Ensure all CA data is loaded before exporting using EXPRESS MODE
                const exportData = await this.ensureCADataForExport();
                
                this.updateLoadingDialog({
                    status: "Generating export file...",
                    progressLabel: "Creating download",
                    phasesCompleted: 2,
                    targetPercent: 95,
                    progressInterval: 50
                });
                
                const options = {
                    fileName: `${this.currentDataType}-table`,
                    documentTitle: `${this.widgetTitle} Export`
                };
                
                exportService.exportTableData(
                    format, 
                    exportData, 
                    this.tableHeaders, 
                    options
                );
                
                this.completeLoadingDialog({ immediate: false });
            } catch (error) {
                console.error("Export failed:", error);
                // Show error message to user
                alert("Export failed. Please try again.");
            } finally {
                // Hide the dialog after a short delay to show completion
                const COMPLETION_DELAY = 1000;
                setTimeout(() => {
                    this.loading = false;
                }, COMPLETION_DELAY);
            }
        },

        /**
         * Ensure CA data is loaded for all items before export (optimized with batching)
         * Includes 30-second timeout with partial export fallback
         */
        async ensureCADataForExport() {
            if (this.currentDataType !== "parts") {
                return this.tableData; // CA data only relevant for parts
            }
            
            // Wrap the entire process in a timeout
            const EXPORT_TIMEOUT_MS = 30000; // 30 seconds
            
            const exportPromise = this.performCADataExport();
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => {
                    reject(new Error('CA data loading timeout - exporting available data'));
                }, EXPORT_TIMEOUT_MS);
            });
            
            try {
                return await Promise.race([exportPromise, timeoutPromise]);
            } catch (error) {
                if (error.message.includes('timeout')) {
                    console.warn('⏰ CA data loading timed out after 30s - proceeding with partial export');
                    // Return current table data with whatever CA data we have
                    const partialCount = this.tableData.filter(item => item.caNumber && item.caNumber !== "").length;
                    const totalCount = this.tableData.length;
                    
                    this.updateLoadingDialog({
                        status: `Timeout reached - exporting ${partialCount}/${totalCount} items with CA data`,
                        progressLabel: `${Math.round(partialCount/totalCount*100)}% CA data available`,
                        targetPercent: 90,
                        progressInterval: 50
                    });
                    
                    return this.tableData; // Return what we have
                }
                throw error;
            }
        },
        
        /**
         * Perform the actual CA data export process
         */
        async performCADataExport() {
            // Get all items that don't have CA data loaded
            const itemsNeedingCAData = this.tableData.filter(item => 
                item.physId && (!item.caNumber || item.caNumber === "")
            );
            
            if (itemsNeedingCAData.length === 0) {
                console.log("All items already have CA data");
                const CA_LOADING_START_PERCENT = 30;
                const CA_LOADING_RANGE = 50;
                const PROGRESS_UPDATE_INTERVAL = 50;
                this.updateLoadingDialog({
                    status: "All CA data already loaded",
                    progressLabel: "Skipping CA data fetch",
                    phasesCompleted: 1,
                    targetPercent: CA_LOADING_START_PERCENT + CA_LOADING_RANGE,
                    progressInterval: PROGRESS_UPDATE_INTERVAL
                });
                return this.tableData;
            }
            
            console.log(`🔄 Loading CA data for ${itemsNeedingCAData.length} items in EXPRESS MODE for export`);
            
            const CA_LOADING_START_PERCENT = 30;
            const CA_LOADING_RANGE = 50;
            const PROGRESS_UPDATE_INTERVAL = 50;
            
            // Update progress to show we're starting CA data loading
            this.updateLoadingDialog({
                status: `EXPRESS MODE: Loading CA data for ${itemsNeedingCAData.length} items...`,
                progressLabel: "Maximum parallel processing active",
                phasesCompleted: 1,
                targetPercent: CA_LOADING_START_PERCENT,
                progressInterval: PROGRESS_UPDATE_INTERVAL
            });
            
            // Use EXPRESS MODE for critical export scenarios
            const physIdsToLoad = itemsNeedingCAData.map(item => item.physId);
            
            try {
                await ApiService.preloadCADataExpress(physIdsToLoad, (current, total, phase) => {
                    const progressPercent = Math.round((current / total) * 100);
                    const overallProgress = CA_LOADING_START_PERCENT + Math.round((current / total) * CA_LOADING_RANGE);
                    
                    this.updateLoadingDialog({
                        status: `EXPRESS: Loading CA data - ${current}/${total} items (${progressPercent}%)`,
                        progressLabel: `Phase: ${phase}`,
                        targetPercent: overallProgress,
                        progressInterval: PROGRESS_UPDATE_INTERVAL
                    });
                });
            } catch (error) {
                console.warn('⚠️ EXPRESS MODE failed, falling back to standard batching:', error);
                // Fall back to original batch processing if express mode fails
                await this.performStandardCADataExport(itemsNeedingCAData);
            }
            
            // Create export data by merging current table data with loaded CA data from cache
            const exportData = this.tableData.map(item => {
                if (!item.physId) return item;
                
                // Get CA data from ApiService cache
                const memoryCacheKey = `CA:${item.physId}`;
                const cachedCAData = ApiService.cache.get(memoryCacheKey);
                
                if (cachedCAData && cachedCAData.data) {
                    return {
                        ...item,
                        caNumber: cachedCAData.data.caNumber || item.caNumber || "",
                        caState: cachedCAData.data.caState || item.caState || "",
                        caRespEngr: cachedCAData.data.caRespEngr || item.caRespEngr || "",
                        statusComment: cachedCAData.data.statusComment || item.statusComment || ""
                    };
                }
                
                return item;
            });
            
            const itemsWithCA = exportData.filter(item => item.caNumber && item.caNumber !== "").length;
            console.log(`✅ EXPRESS MODE: Successfully loaded CA data. Coverage: ${itemsWithCA}/${exportData.length} items (${Math.round(itemsWithCA/exportData.length*100)}%)`);
            
            // Update progress to show CA data loading is complete
            this.updateLoadingDialog({
                status: `EXPRESS: CA data loaded for ${itemsWithCA}/${exportData.length} items`,
                progressLabel: "Export ready",
                targetPercent: CA_LOADING_START_PERCENT + CA_LOADING_RANGE,
                progressInterval: PROGRESS_UPDATE_INTERVAL
            });
            
            return exportData;
        },
        
        /**
         * Fallback method for standard CA data export processing
         */
        async performStandardCADataExport(itemsNeedingCAData) {
            // Use the same constants as main export method
            const CA_LOADING_START_PERCENT = 30;
            const CA_LOADING_RANGE = 50;
            const PROGRESS_UPDATE_INTERVAL = 50;
            
            // Configuration for maximum parallel processing
            const BATCH_SIZE = 100; // Process 100 items at a time for lightning speed
            const MAX_RETRIES = 2;
            const RETRY_DELAY_BASE = 50; // Minimal delay for retry attempts
            
            // Split items into batches
            const batches = [];
            for (let i = 0; i < itemsNeedingCAData.length; i += BATCH_SIZE) {
                batches.push(itemsNeedingCAData.slice(i, i + BATCH_SIZE));
            }
            
            console.log(`📦 FALLBACK: Processing ${batches.length} batches of ${BATCH_SIZE} items each`);
            
            // Process all batches in parallel
            let completedBatches = 0;
            
            const batchPromises = batches.map(async (batch, batchIndex) => {
                console.log(`🚀 FALLBACK: Starting batch ${batchIndex + 1}/${batches.length}`);
                
                // Process all items in this batch in parallel
                const batchResults = await Promise.all(
                    batch.map(async (item, itemIndex) => {
                        const globalIndex = batchIndex * BATCH_SIZE + itemIndex;
                        
                        // Retry logic for individual items
                        for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
                            try {
                                const caData = await ApiService.fetchChangeAction(
                                    item.physId, 
                                    item.physId, 
                                    globalIndex
                                );
                                
                                return {
                                    physId: item.physId,
                                    caNumber: caData.caNumber || "",
                                    caState: caData.caState || "",
                                    caLink: caData.caLink || "",
                                    caRespEngr: caData.caRespEngr || "",
                                    statusComment: caData.statusComment || ""
                                };
                            } catch (error) {
                                if (attempt === MAX_RETRIES) {
                                    console.warn(`Failed to load CA data for item ${item.physId} after ${MAX_RETRIES} attempts:`, error);
                                    return {
                                        physId: item.physId,
                                        caNumber: "",
                                        caState: "",
                                        caLink: "",
                                        caRespEngr: "",
                                        statusComment: ""
                                    };
                                }
                                
                                // Minimal retry delay
                                await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_BASE * attempt));
                            }
                        }
                    })
                );
                
                completedBatches++;
                console.log(`✅ FALLBACK: Completed batch ${batchIndex + 1}/${batches.length} (${completedBatches}/${batches.length} total)`);
                
                // Update progress dialog
                const batchProgress = Math.round((completedBatches / batches.length) * 100);
                const overallProgress = CA_LOADING_START_PERCENT + Math.round((completedBatches / batches.length) * CA_LOADING_RANGE);
                
                this.updateLoadingDialog({
                    status: `FALLBACK: Loading CA data: Batch ${completedBatches}/${batches.length} complete`,
                    progressLabel: `${batchProgress}% of CA requests finished`,
                    targetPercent: overallProgress,
                    progressInterval: PROGRESS_UPDATE_INTERVAL
                });
                
                return batchResults;
            });
            
            // Wait for all batches to complete
            await Promise.all(batchPromises);
            console.log('✅ FALLBACK: Standard CA data export processing completed');
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

                // Apply default program if set and not in kiosk mode
                if (this.defaultProgram && this.defaultProgram !== "All" && !this.isKioskMode) {
                    if (this.programs.includes(this.defaultProgram)) {
                        this.filterValues.program = this.defaultProgram;
                        console.log("📌 Applied default program:", this.defaultProgram);
                        // Fetch phases for the default program
                        await this.fetchPhases();
                    } else {
                        console.warn("⚠️ Default program not found in programs list:", this.defaultProgram);
                    }
                } else {
                    // Do NOT automatically select a program - wait for user selection
                    console.log("📋 Programs available for user selection:", this.programs);
                    
                    // Clear any existing selections to force user choice
                    this.filterValues.program = "";
                    this.filterValues.phase = "";
                    this.phases = [];
                    this.tableData = [];
                }
                
            } catch (err) {
                console.error("Failed to fetch programs:", err.message);
                this.programs = [];
                this.filterValues.program = "";
                this.filterValues.phase = "";
                this.phases = [];
                this.tableData = [];
            }
        },

        onProgramChange() {
            if (this.filterValues.program) {
                this.fetchPhases();
            }
        },

        async fetchPhases() {
            this.setLoadingDialog({
                headline: "Loading Phase Options",
                detail: "Preparing UI: Filters • Table",
                status: "Contacting API for phases…",
                progressLabel: "Requesting phase list",
                percent: 12,
                targetPercent: 55,
                progressInterval: 90,
                phasesCompleted: 0,
                totalPhases: 2
            });

            let loadFailed = false;
            this.loading = true;
            try {
                const phases = await dataService.fetchPhases(this.filterValues.program);
                this.updateLoadingDialog({
                    status: "Processing phase list…",
                    progressLabel: "Analyzing response",
                    phasesCompleted: 1,
                    targetPercent: 78,
                    progressInterval: 90
                });
                this.phases = phases || [];
                console.log("✅ Phases loaded:", this.phases.length);

                // Do NOT automatically select first phase or fetch data
                // Wait for user to explicitly select a phase
                if (this.phases.length > 0) {
                    console.log("📋 Phases available for user selection:", this.phases);
                    // Clear any existing phase selection to force user choice
                    this.filterValues.phase = "";
                } else {
                    console.warn("No phases returned from API");
                    this.phases = [];
                    this.filterValues.phase = "";
                }
                
                // Clear any existing table data since no phase is selected
                this.tableData = [];
                this.updateChartFromFiltered();

                this.updateLoadingDialog({
                    status: "Phase list ready",
                    progressLabel: "Preparing dashboard filters",
                    phasesCompleted: 2,
                    targetPercent: 92,
                    progressInterval: 70
                });
            } catch (error) {
                console.error("Failed to fetch phases:", error.message);
                this.updateLoadingDialog({
                    status: `Unable to load phases: ${error.message}`,
                    progressLabel: "Encountered an issue",
                    targetPercent: 100,
                    immediatePercent: true,
                    phasesCompleted: 0
                });
                loadFailed = true;
                this.phases = [];
                this.filterValues.phase = "";
                this.tableData = [];
                this.updateChartFromFiltered();
            } finally {
                this.completeLoadingDialog({ preserveStatus: true, preservePhases: loadFailed, immediate: loadFailed });
                this.loading = false;
            }
        },

        async handlePhaseChange() {
            // Only fetch data if a valid phase is selected (not empty, not "All")
            if (!this.filterValues.phase || this.filterValues.phase === "" || this.filterValues.phase === "All") {
                console.log("🚫 No valid phase selected, skipping data fetch");
                this.tableData = [];
                this.updateChartFromFiltered();
                return;
            }
            
            console.log("🎯 Phase selected by user:", this.filterValues.phase, "- fetching data...");
            await this.fetchData(this.filterValues.phase);
        },

        async fetchData(phase) {
            this.setLoadingDialog({
                headline: "Loading Dashboard Data",
                detail: this.currentDataType ? `Preparing ${this.currentDataType.toUpperCase()} UI: Chart • Table` : "Preparing UI: Chart • Table",
                status: this.currentDataType ? `Fetching ${this.currentDataType} data…` : "Fetching release planning data…",
                progressLabel: "Contacting data services",
                percent: 12,
                targetPercent: 65,
                progressInterval: 90,
                phasesCompleted: 0,
                totalPhases: 3
            });

            let loadFailed = false;
            this.loading = true;
            try {
                console.log("=== FETCHDATA START ===");
                console.log("Phase parameter:", phase);
                console.log("Current data type:", this.currentDataType);
                
                // Guard clause: Don't fetch data if no data type is selected
                if (!this.currentDataType) {
                    console.log("⚠️  No data type selected, skipping data fetch");
                    this.tableData = [];
                    this.ataChapterGroups = ["All"];
                    this.engSystemGroups = ["All"];
                    // Don't immediately reset parts options - let them persist until parts is selected again
                    // this.makeBuyOptions = ["All"];
                    // this.filterValues.makeBuyFilter = "All";
                    // this.partTypeOptions = ["All"];
                    // this.filterValues.partTypeFilter = "All";
                    this.updateChartFromFiltered();
                    return;
                }
                
                console.log("🔥 CRITICAL: About to call fetchItems with itemType:", this.currentDataType);
                console.log("USE_MOCK_DATA flag:", USE_MOCK_DATA);
                
                // Use the generic fetchItems method with the current data type
                const items = await dataService.fetchItems(phase, this.currentDataType);

                this.updateLoadingDialog({
                    progressLabel: "Structuring dataset",
                    status: "Transforming API response…",
                    phasesCompleted: 1,
                    targetPercent: 78,
                    progressInterval: 80
                });

                this.dataSourceStatus = {
                    hasError: false,
                    message: ""
                };
                
                console.log("=== RAW API RESPONSE ===");
                console.log("Type of items:", typeof items);
                console.log("Is Array:", Array.isArray(items));
                console.log("Items length:", items?.length);
                console.log("Raw items data:", items);
                
                // Log first raw item to see all available fields
                if (items && items.length > 0) {
                    console.log("🔍 First RAW item from API:");
                    console.log(JSON.stringify(items[0], null, 2));
                    console.log("Available fields in raw item:", Object.keys(items[0]));
                }
                
                // Use DataTransformationService to process API response and transform data
                const baseTableData = dataTransformationService.transformApiResponseToTableData(items, this.currentDataType);
                
                // Apply additional transformations for computed fields
                this.tableData = baseTableData.map(item => {
                    // Add masked state value for all data types
                    item.currentStateMasked = this.maskStateValue(item.currentState);
                    
                    // Add part-specific computed fields
                    if (this.currentDataType === "parts") {
                        item.partNoWithRev = this.combinePartNoWithRev(item.partNo, item.rev);
                        item.engSystemGroupShort = this.getSystemGroupShort(item.engSystemGroup);
                    }
                    
                    return item;
                });
                
                console.log("🔧 Applied computed field transformations");
                if (this.tableData.length > 0) {
                    console.log("Sample transformed item:", {
                        partNo: this.tableData[0].partNo,
                        rev: this.tableData[0].rev,
                        partNoWithRev: this.tableData[0].partNoWithRev,
                        owner: this.tableData[0].owner,
                        currentState: this.tableData[0].currentState,
                        currentStateMasked: this.tableData[0].currentStateMasked,
                        engSystemGroup: this.tableData[0].engSystemGroup,
                        engSystemGroupShort: this.tableData[0].engSystemGroupShort
                    });
                    console.log("All fields in transformed item:", Object.keys(this.tableData[0]));
                }

                this.updateLoadingDialog({
                    progressLabel: "Refreshing widgets",
                    status: "Updating charts and filters…",
                    phasesCompleted: 2,
                    targetPercent: 90,
                    progressInterval: 70
                });
                
                console.log("=== FINAL TABLE DATA ===");
                console.log("Final tableData array length:", this.tableData.length);
                if (this.tableData.length > 0) {
                    console.log("Sample mapped item:", this.tableData[0]);
                    console.log("Sample mapped item keys:", Object.keys(this.tableData[0]));
                } else {
                    console.log("❌ No items in tableData after mapping");
                }
                console.log("=== FETCHDATA END ===");

                // Update Chapter/System group filters from the data using DataTransformationService
                this.ataChapterGroups = dataTransformationService.extractAtaChapterGroups(this.tableData);
                console.log("✅ ATA Chapter groups updated from data:", this.ataChapterGroups);

                this.engSystemGroups = dataTransformationService.extractEngSystemGroups(this.tableData);
                console.log("✅ Engineering System groups updated from data:", this.engSystemGroups);

                // Update Make/Buy options - only for PARTS data type
                if (this.currentDataType === "parts") {
                    // Only update options if we have actual data
                    if (this.tableData && this.tableData.length > 0) {
                        this.makeBuyOptions = dataTransformationService.extractMakeBuyValues(this.tableData);
                        console.log("✅ Make/Buy options updated from PARTS data:", this.makeBuyOptions);
                        
                        this.partTypeOptions = dataTransformationService.extractPartTypeValues(this.tableData);
                        console.log("✅ Part Type options updated from PARTS data:", this.partTypeOptions);
                    }
                    // If no data, preserve existing options instead of resetting
                } else {
                    // Reset Make/Buy and Part Type options and filters when not viewing PARTS
                    this.makeBuyOptions = ["All"];
                    this.filterValues.makeBuyFilter = "All";
                    this.partTypeOptions = ["All"];
                    this.filterValues.partTypeFilter = "All";
                }

                // Update chart data from the filtered table data
                this.updateChartFromFiltered();

                // Force chart recreate if we're on parts data - this ensures chart renders with valid data
                if (this.currentDataType === "parts") {
                    this.$nextTick(() => {
                        console.log("📊 fetchData complete - bumping lateReleaseChartKey for parts");
                        this.lateReleaseChartKey++;
                    });
                }

                this.updateLoadingDialog({
                    progressLabel: "Finalizing dashboard",
                    status: "Polishing visuals…",
                    phasesCompleted: 3,
                    targetPercent: 96,
                    progressInterval: 70
                });

                // Trigger background CA data preloading after successful data load
                this.triggerBackgroundCAPreloading();

            } catch (error) {
                console.error("Error fetching data:", {
                    message: error.message,
                    phase,
                    currentDataType: this.currentDataType,
                    fullError: error
                });

                this.updateLoadingDialog({
                    progressLabel: "Encountered an issue",
                    status: `Unable to load ${this.currentDataType?.toUpperCase() || ""} data: ${error.message}`,
                    targetPercent: 100,
                    immediatePercent: true,
                    phasesCompleted: 0
                });
                loadFailed = true;
                
                // Clear data when API fails - no fallback data
                console.log("Clearing data due to API failure");
                this.tableData = [];
                this.ataChapterGroups = ["All"];
                this.engSystemGroups = ["All"];
                this.dataSourceStatus = {
                    hasError: true,
                    message: `Unable to load ${this.currentDataType?.toUpperCase() || ""} data right now. ${error.message}`
                };
                
                // Only reset parts-specific options if we're currently viewing parts
                // Otherwise preserve existing options to prevent dropdown flickering
                if (this.currentDataType === "parts") {
                    // Keep existing options during temporary failures to prevent UI disruption
                    // this.makeBuyOptions = ["All"];
                    // this.filterValues.makeBuyFilter = "All";
                    // this.partTypeOptions = ["All"];
                    // this.filterValues.partTypeFilter = "All";
                    console.log("⚠️ Preserving parts filter options during API failure");
                }
                
                this.updateChartFromFiltered();
            } finally {
                this.completeLoadingDialog({ preserveStatus: true, preservePhases: loadFailed, immediate: loadFailed });
                this.loading = false;
                this.lastUpdated = new Date().toLocaleTimeString();
            }
        },

        // Dynamically set the data type using DataTransformationService validation
        setDataType(dataType) {
            const validation = dataTransformationService.validateDataType(dataType);
            if (validation.isValid) {
                const previousDataType = this.currentDataType;
                this.currentDataType = dataType;
                
                // Reset filters when changing data types to ensure clean state
                if (previousDataType && previousDataType !== dataType) {
                    this.filterValues = {
                        program: "",
                        phase: "",
                        ataChapterGroup: "All",
                        engSystemGroup: "All",
                        makeBuyFilter: "All",
                        partTypeFilter: "All"
                    };
                    console.log(`🔄 Filters reset due to data type change: ${previousDataType} → ${dataType}`);
                }
                this.dataSourceStatus = {
                    hasError: false,
                    message: ""
                };
                
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
                
                // Reset filter values when switching data types to ensure clean state
                this.filterValues = {
                    program: "",
                    phase: "",
                    ataChapterGroup: "All",
                    engSystemGroup: "All",
                    makeBuyFilter: "All",
                    partTypeFilter: "All"
                };
                console.log("🔄 DEBUG: Reset filter values for new data type");
                
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
         * Show confirmation dialog before clearing cache
         */
        confirmClearCache() {
            this.showClearCacheDialog = true;
        },

        /**
         * Clear all caches and refresh data from API
         */
        async clearCacheAndRefresh() {
            console.log("🗑️ Clearing all caches and refreshing data...");
            this.clearingCache = true;
            
            // Store current data to display during reload
            const previousTableData = [...this.tableData];
            const previousChartData = { ...this.chartData };
            
            try {
                // Clear all cache sources
                
                // 1. Clear ApiService memory cache
                ApiService.clearCache();
                console.log("✅ ApiService memory cache cleared");
                
                // 2. Clear IndexedDB cache
                await ApiService.clearIndexedDBCache();
                console.log("✅ IndexedDB cache cleared");
                
                // 3. Clear UniversalDataService cache
                UniversalDataService.refreshAll();
                console.log("✅ UniversalDataService cache cleared");
                
                // 4. Clear session storage
                sessionStorage.clear();
                console.log("✅ Session storage cleared");
                
                // 5. Clear local storage (except user preferences)
                const keysToKeep = ["widget-dev-config"]; // Keep config settings
                const allKeys = Object.keys(localStorage);
                allKeys.forEach(key => {
                    if (!keysToKeep.includes(key)) {
                        localStorage.removeItem(key);
                    }
                });
                console.log("✅ Local storage cleared (preserved user preferences)");
                
                // 6. DON'T clear component data immediately - keep displaying old data during reload
                // Reset filter options but keep data displaying
                this.ataChapterGroups = ["All"];
                this.engSystemGroups = ["All"];
                this.makeBuyOptions = ["All"];
                this.partTypeOptions = ["All"];
                
                // 7. Refresh data from API
                if (this.filterValues.phase && this.currentDataType) {
                    console.log("🔄 Refreshing data from API...");
                    
                    // Set loading state to show we're refreshing
                    this.setLoadingDialog({
                        headline: "Refreshing Data",
                        detail: "Cache cleared - reloading fresh data",
                        status: "Fetching updated data from API...",
                        progressLabel: "Clearing cache and refreshing",
                        percent: 25,
                        targetPercent: 90,
                        progressInterval: 100
                    });
                    
                    // Fetch new data 
                    await this.fetchData(this.filterValues.phase);
                    console.log("✅ Data refreshed from API");
                    
                    // Clear cached parts data to ensure chart uses fresh data
                    this.cachedPartsData = null;
                    
                } else {
                    console.log("ℹ️ No phase or data type selected, clearing data display");
                    // Only clear data if no phase/type is selected
                    this.tableData = [];
                    this.chartData = { labels: [], datasets: [] };
                }
                
                // Show success message
                this.$nextTick(() => {
                    this.showSnackbar({ message: "Cache cleared and data refreshed successfully!", type: "success" });
                });
                
            } catch (error) {
                console.error("❌ Error clearing cache:", error);
                
                // Restore previous data on error
                this.tableData = previousTableData;
                this.chartData = previousChartData;
                
                this.showSnackbar({ message: "Error clearing cache: " + error.message, type: "error" });
            } finally {
                this.clearingCache = false;
                this.showClearCacheDialog = false; // Close the dialog
                this.loading = false; // Ensure loading state is cleared
            }
        },

        /**
         * Save default program to localStorage
         */
        saveDefaultProgram() {
            try {
                localStorage.setItem("defaultProgram", this.defaultProgram);
                this.settingsDialog = false;
                
                // Apply the default program immediately
                this.filterValues.program = this.defaultProgram === "All" ? "" : this.defaultProgram;
                
                this.showSnackbar({ 
                    message: `Default program set to: ${this.defaultProgram}`, 
                    type: "success" 
                });
            } catch (error) {
                console.error("❌ Error saving default program:", error);
                this.showSnackbar({ 
                    message: "Error saving default program: " + error.message, 
                    type: "error" 
                });
            }
        },

        /**
         * Reset default program to "All"
         */
        resetDefaultProgram() {
            this.defaultProgram = "All";
            localStorage.removeItem("defaultProgram");
            this.showSnackbar({ 
                message: "Default program reset to 'All'", 
                type: "info" 
            });
        },

        /**
         * Cancel settings dialog without saving
         */
        cancelSettings() {
            // Restore from localStorage or default to "All"
            this.defaultProgram = localStorage.getItem("defaultProgram") || "All";
            this.settingsDialog = false;
        },

        /**
         * Start background CA data preloading with dancing banana indicator
         */
        async startBackgroundCAPreloading(physIds) {
            if (!physIds || physIds.length === 0) return;
            
            console.log(`🍌 Starting background CA preloading for ${physIds.length} items`);
            
            // Constants for timeout delays
            const COMPLETION_DISPLAY_TIME = 3000; // 3 seconds to show completion
            const ERROR_DISPLAY_TIME = 2000; // 2 seconds to show error
            
            this.backgroundPreloadingCA = true;
            this.preloadingProgress = {
                current: 0,
                total: physIds.length,
                phase: "starting"
            };
            
            try {
                // Call ApiService preloading with progress callback
                await ApiService.preloadCAData(physIds, (current, total, phase) => {
                    this.preloadingProgress = { 
                        current: Math.min(current, total), 
                        total, 
                        phase 
                    };
                });
                
                // Show completion status for specified time
                this.preloadingProgress.phase = "completed";
                console.log("🍌 Background CA preloading completed successfully");
                
                setTimeout(() => {
                    this.backgroundPreloadingCA = false;
                }, COMPLETION_DISPLAY_TIME);
                
            } catch (error) {
                console.error("❌ Background CA preloading failed:", error);
                this.preloadingProgress.phase = "error";
                
                setTimeout(() => {
                    this.backgroundPreloadingCA = false;
                }, ERROR_DISPLAY_TIME);
            }
        },

        /**
         * Trigger express CA preloading for critical export scenarios
         */
        async triggerExpressCAPreloading(physIds) {
            if (!physIds || physIds.length === 0) return;
            
            console.log(`🚀 Starting EXPRESS CA preloading for ${physIds.length} items`);
            
            this.backgroundPreloadingCA = true;
            this.preloadingProgress = {
                current: 0,
                total: physIds.length,
                phase: "express-mode"
            };
            
            try {
                await ApiService.preloadCADataExpress(physIds, (current, total, phase) => {
                    this.preloadingProgress = { 
                        current: Math.min(current, total), 
                        total, 
                        phase 
                    };
                });
                
                this.preloadingProgress.phase = "express-completed";
                console.log("🚀 EXPRESS CA preloading completed successfully");
                
                const EXPRESS_COMPLETION_DISPLAY_TIME = 2000;
                setTimeout(() => {
                    this.backgroundPreloadingCA = false;
                }, EXPRESS_COMPLETION_DISPLAY_TIME);
                
            } catch (error) {
                console.error("❌ EXPRESS CA preloading failed:", error);
                this.preloadingProgress.phase = "express-error";
                
                const EXPRESS_ERROR_DISPLAY_TIME = 3000;
                setTimeout(() => {
                    this.backgroundPreloadingCA = false;
                }, EXPRESS_ERROR_DISPLAY_TIME);
            }
        },
        
        /**
         * Extract physIds from table data and trigger background preloading
         */
        triggerBackgroundCAPreloading() {
            if (this.currentDataType !== "parts") {
                return; // CA data only relevant for parts
            }
            
            // Extract physIds from current table data that don't have CA data
            const physIdsNeedingCA = this.tableData
                .filter(item => item.physId && (!item.caNumber || item.caNumber === ""))
                .map(item => item.physId);
            
            if (physIdsNeedingCA.length > 0) {
                console.log(`🍌 Found ${physIdsNeedingCA.length} items needing CA data preloading`);
                // Minimal delay for faster startup
                const PRELOAD_STARTUP_DELAY = 1000;
                setTimeout(() => {
                    this.startBackgroundCAPreloading(physIdsNeedingCA);
                }, PRELOAD_STARTUP_DELAY);
            } else {
                console.log("🍌 No CA data preloading needed - all items already have CA data");
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
            
            // Automatically adjust chart line visibility based on the selected filter
            switch (statusFilter) {
                case "criticallyOverdue":
                    // Show only critical line for critically overdue items
                    this.showTargetLine = false;
                    this.showActualLine = false;
                    this.showCriticalLine = true;
                    console.log("👁️ Chart lines adjusted for critically overdue: Target=OFF, Actual=OFF, Critical=ON");
                    break;
                    
                case "overdue":
                    // Show target and critical lines for overdue items
                    this.showTargetLine = true;
                    this.showActualLine = false;
                    this.showCriticalLine = true;
                    console.log("👁️ Chart lines adjusted for overdue: Target=ON, Actual=OFF, Critical=ON");
                    break;
                    
                case "released":
                    // Show actual line for released items
                    this.showTargetLine = true;
                    this.showActualLine = true;
                    this.showCriticalLine = false;
                    console.log("👁️ Chart lines adjusted for released: Target=ON, Actual=ON, Critical=OFF");
                    break;
                    
                case "thisWeek":
                case "nextWeek":
                    // Show target line for upcoming items
                    this.showTargetLine = true;
                    this.showActualLine = false;
                    this.showCriticalLine = true;
                    console.log("👁️ Chart lines adjusted for time-based filter: Target=ON, Actual=OFF, Critical=ON");
                    break;

                case "unreleased":
                    // Show target and critical lines for unreleased items
                    this.showTargetLine = true;
                    this.showActualLine = false;
                    this.showCriticalLine = true;
                    console.log("👁️ Chart lines adjusted for unreleased: Target=ON, Actual=OFF, Critical=ON");
                    break;
                    
                case "all":
                default:
                    // Show all lines for complete view
                    this.showTargetLine = true;
                    this.showActualLine = true;
                    this.showCriticalLine = true;
                    console.log("👁️ Chart lines adjusted for all data: Target=ON, Actual=ON, Critical=ON");
                    break;
            }
            
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
            
            // Debug: Check what data we're passing to ChartDataService
            console.log("🔍 DEBUG - updateChartFromFiltered data check:", {
                filteredTableDataLength: this.filteredTableData?.length || 0,
                currentDataType: this.currentDataType,
                selectedTimeBucket: this.selectedTimeBucket,
                selectedDatasetType: this.selectedDatasetType,
                firstFewItems: this.filteredTableData?.slice(0, 3).map(item => ({
                    partNo: item.partNoWithRev,
                    phase: item.phase,
                    criticalRelease: item.criticalRelease
                })) || []
            });
            
            // Use ChartDataService to create complete chart data
            this.chartData = chartDataService.createChartData(
                this.filteredTableData,
                this.currentDataType,
                {
                    showTargetLine: this.showTargetLine,
                    showActualLine: this.showActualLine,
                    showCriticalLine: this.showCriticalLine && this.showCriticalControls
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
            // Find the corresponding row and update the CA data using DataTransformationService with consistent ID matching
            const rowIndex = this.tableData.findIndex(row => 
                (row.physId && row.physId === caData.objectId) || 
                (row.objId && row.objId === caData.objectId)
            );
            if (rowIndex !== -1) {
                const updatedItem = dataTransformationService.updateCaData(this.tableData[rowIndex], {
                    caNumber: caData.itemNumber,
                    caState: caData.itemState,
                    caLink: caData.itemLink,
                    caRespEngr: caData.caRespEngr
                });
                this.$set(this.tableData, rowIndex, updatedItem);
            }
        },

        /**
         * Handle CR number loaded event from ChangeActionCell component
         */
        onCrNumberLoaded(crData) {
            console.log("📝 CR data loaded:", crData);
            // Find the corresponding row and update the CR data using consistent ID matching
            const rowIndex = this.tableData.findIndex(row => 
                (row.physId && row.physId === crData.objectId) || 
                (row.objId && row.objId === crData.objectId)
            );
            if (rowIndex !== -1) {
                // Update CR data in table
                this.$set(this.tableData[rowIndex], "crNumber", crData.itemNumber);
                this.$set(this.tableData[rowIndex], "crLink", crData.itemLink);
                this.$set(this.tableData[rowIndex], "crState", crData.itemState);
            }
        },

        /**
         * Get item number for ChangeActionCell component
         */
        getItemNumberForCell(header, item) {
            if (header.componentProps.itemType === "cr") {
                return item.crNumber || item.name;
            } else {
                return item.caNumber || item.name;
            }
        },

        /**
         * Get item state for ChangeActionCell component  
         */
        getItemStateForCell(header, item) {
            return item.currentState || "";
        },

        /**
         * Handle comment updated event from StatusCommentDisplay component
         */
        handleCommentUpdate(updateData) {
            console.log("💬 Comment updated with API response:", updateData);
            
            // Find the corresponding row and update the comment data
            const rowIndex = this.tableData.findIndex(row => 
                row.physId === updateData.objectId || 
                row.objId === updateData.objectId ||
                row.caNumber === updateData.objectId || 
                row.crNumber === updateData.objectId
            );
            
            if (rowIndex !== -1) {
                // Update the local table data
                this.$set(this.tableData[rowIndex], "statusComment", updateData.statusComment);
                this.$set(this.tableData[rowIndex], "caStatusComment", updateData.statusComment);
                
                // Log successful local update
                console.log("✅ Local table data updated for row:", rowIndex, {
                    objectId: updateData.objectId,
                    itemType: updateData.itemType,
                    commentLength: updateData.statusComment.length
                });

                // Optional: Update last modified timestamp if provided by API
                if (updateData.apiResponse && updateData.apiResponse.data) {
                    this.$set(this.tableData[rowIndex], "lastModified", updateData.apiResponse.data.updatedAt);
                    this.$set(this.tableData[rowIndex], "modifiedBy", updateData.apiResponse.data.updatedBy);
                }
            } else {
                console.warn("⚠️ Could not find row to update for objectId:", updateData.objectId);
            }
        },

        /**
         * Get status comment value handling both function and object componentProps
         */
        getStatusCommentValue(header, item) {
            // Enhanced debug logging for CA-00000268
            if (item.name === "CA-00000268" || item.caNumber === "CA-00000268") {
                console.log("🔍 getStatusCommentValue called for CA-00000268:", {
                    header,
                    item,
                    componentPropsType: typeof header.componentProps,
                    componentProps: header.componentProps
                });
            }
            
            if (header.componentProps) {
                if (typeof header.componentProps === "function") {
                    // WidgetRegistry style - function that returns props object
                    const props = header.componentProps(item);
                    const statusComment = props.statusComment || props.caStatusComment || "";
                    
                    // Debug for CA-00000268
                    if (item.name === "CA-00000268" || item.caNumber === "CA-00000268") {
                        console.log("🔍 getStatusCommentValue (function) for CA-00000268:", {
                            props,
                            statusComment,
                            propsStatusComment: props.statusComment,
                            propsCaStatusComment: props.caStatusComment,
                            item
                        });
                    }
                    
                    return statusComment;
                } else if (typeof header.componentProps === "object") {
                    // Local headerConfigurations style - static object
                    const statusComment = item.statusComment || item.caStatusComment || "";
                    
                    // Debug for CA-00000268
                    if (item.name === "CA-00000268" || item.caNumber === "CA-00000268") {
                        console.log("🔍 getStatusCommentValue (object) for CA-00000268:", {
                            headerComponentProps: header.componentProps,
                            statusComment,
                            itemStatusComment: item.statusComment,
                            itemCaStatusComment: item.caStatusComment,
                            itemKeys: Object.keys(item),
                            item
                        });
                    }
                    
                    return statusComment;
                }
            }
            // Fallback
            const fallbackComment = this.getStatusCommentForItem(item);
            
            // Debug fallback for CA-00000268
            if (item.name === "CA-00000268" || item.caNumber === "CA-00000268") {
                console.log("🔍 getStatusCommentValue (fallback) for CA-00000268:", {
                    fallbackComment,
                    item
                });
            }
            
            return fallbackComment;
        },

        /**
         * Get canEdit value handling both function and object componentProps
         */
        getCanEditValue(header, item) {
            if (header.componentProps) {
                if (typeof header.componentProps === "function") {
                    // WidgetRegistry style - function that returns props object
                    return header.componentProps(item).canEdit || false;
                } else if (typeof header.componentProps === "object") {
                    // Local headerConfigurations style - static object
                    return header.componentProps.canEdit || false;
                }
            }
            // Fallback
            return false;
        },

        /**
         * Get status comment for an item with debugging (fallback method)
         */
        getStatusCommentForItem(item) {
            const statusComment = item.statusComment || item.caStatusComment || "";
            
            // Debug logging for CA-00000268 (fallback case)
            if (item.name === "CA-00000268" || item.caNumber === "CA-00000268") {
                console.log("🔍 ReleasePlannerWidget getStatusCommentForItem (fallback) for CA-00000268:", {
                    item,
                    statusComment,
                    itemStatusComment: item.statusComment,
                    itemCaStatusComment: item.caStatusComment
                });
            }
            
            return statusComment;
        },

        /**
         * Show snackbar message (for StatusCommentDisplay feedback)
         */
        showSnackbar(message) {
            // TODO: Implement snackbar notification system
            console.log(`📢 ${message.type.toUpperCase()}: ${message.message}`);
            
            // For now, just log to console. In the future, you can add a proper snackbar/toast system
            if (message.type === "error") {
                console.error(message.message);
            } else {
                console.log(message.message);
            }
        }
    }
};
/* eslint-enable no-console */
</script>