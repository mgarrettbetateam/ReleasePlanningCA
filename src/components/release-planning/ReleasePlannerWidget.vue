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
            <div class="flyout-header d-flex align-center pa-4" style="background: linear-gradient(135deg, #1976d2 0%, #1565c0 100%);">
                <v-icon left color="white">mdi-filter-variant</v-icon>
                <span class="flyout-title white--text text-h6 font-weight-medium ml-2">Filters</span>
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

            <div class="flyout-content-scrollable pa-5 overflow-y-auto" style="height: calc(100vh - 120px); scrollbar-width: thin; scrollbar-color: rgba(25, 118, 210, 0.3) transparent;">
                <!-- Data Type Switcher - First priority at the top -->
                <div class="mb-6">
                    <div class="text-subtitle-2 font-weight-bold primary--text text-uppercase mb-3 d-flex align-center">
                        <v-icon small color="primary" class="mr-2">mdi-database</v-icon>
                        Data Type
                        <v-spacer />
                        <v-chip 
                            v-if="currentDataType"
                            x-small
                            color="success"
                            class="ml-2"
                        >
                            {{ currentDataType.toUpperCase() }} Active
                        </v-chip>
                        <v-chip 
                            v-else
                            x-small
                            color="grey"
                            outlined
                            class="ml-2"
                        >
                            None Selected
                        </v-chip>
                    </div>
                    
                    <!-- Show currently selected data type prominently -->
                    <v-alert
                        v-if="currentDataType"
                        type="success"
                        dense
                        class="mb-3 selected-data-type-alert"
                        style="font-size: 13px; font-weight: 500;"
                    >
                        <div class="d-flex align-center">
                            <v-icon small left color="success">mdi-check-circle</v-icon>
                            <span class="font-weight-bold">{{ currentDataType.toUpperCase() }}</span>
                            <span class="ml-2">data type selected</span>
                            <v-spacer />
                            <v-chip
                                x-small
                                color="success"
                                outlined
                                class="ml-2"
                            >
                                Active
                            </v-chip>
                        </div>
                    </v-alert>
                    
                    <!-- Helpful message when no data type is selected -->
                    <v-alert
                        v-if="!currentDataType"
                        type="info"
                        dense
                        text
                        class="mb-3"
                        style="font-size: 12px;"
                    >
                        <v-icon small left>mdi-information</v-icon>
                        Choose a data type to get started
                    </v-alert>
                    
                    <v-chip-group 
                        v-model="currentDataType" 
                        column
                        class="ma-0"
                    >
                        <v-chip
                            v-for="dataType in getAvailableDataTypes()"
                            :key="dataType"
                            :value="dataType"
                            small
                            block
                            class="mb-2 data-type-chip"
                            :class="{ 'selected-chip': currentDataType === dataType }"
                            @click="switchDataType(dataType)"
                        >
                            <v-icon small left>{{ currentDataType === dataType ? 'mdi-check-circle' : 'mdi-table' }}</v-icon>
                            {{ dataType.toUpperCase() }}
                            <v-spacer />
                            <v-icon v-if="currentDataType === dataType" small color="white">mdi-check-bold</v-icon>
                        </v-chip>
                    </v-chip-group>
                </div>

                <v-divider class="my-4" />

                <!-- Filter Controls Grid -->
                <div class="mb-6">
                    <div class="text-subtitle-2 font-weight-bold primary--text text-uppercase mb-3 d-flex align-center">
                        <v-icon small color="primary" class="mr-2">mdi-tune</v-icon>
                        Data Filters
                        <v-spacer />
                        <v-chip 
                            v-if="!currentDataType"
                            x-small
                            color="grey"
                            outlined
                            class="ml-2"
                        >
                            Disabled
                        </v-chip>
                    </div>
                    
                    <!-- Show helper message when no data type is selected -->
                    <v-alert
                        v-if="!currentDataType"
                        type="warning"
                        dense
                        text
                        class="mb-3"
                        style="font-size: 12px;"
                    >
                        <v-icon small left>mdi-alert-circle</v-icon>
                        Select a data type above to enable data filters
                    </v-alert>
                    
                    <!-- Show helper message about phase dependency -->
                    <v-alert
                        v-if="currentDataType && (!filterValues.program || filterValues.program === '' || filterValues.program === 'All')"
                        type="info"
                        dense
                        text
                        class="mb-3"
                        style="font-size: 12px;"
                    >
                        <v-icon small left>mdi-information</v-icon>
                        Select a program to enable phase filtering
                    </v-alert>
                    
                    <div 
                        v-for="filter in filterConfig"
                        :key="filter.key"
                        class="mb-4"
                    >
                        <label class="caption font-weight-bold grey--text text--darken-2 mb-2 d-flex align-center text-uppercase">
                            <v-icon small class="mr-1">{{ filter.icon }}</v-icon>
                            {{ filter.label }}
                            <v-chip 
                                v-if="filter.key === 'phase' && getFilterDisabledState('phase')"
                                x-small
                                color="grey"
                                outlined
                                class="ml-2"
                            >
                                Requires Program
                            </v-chip>
                        </label>
                        <v-select
                            :value="filterValues[filter.key]"
                            :items="filter.options"
                            :placeholder="filter.placeholder"
                            dense
                            outlined
                            hide-details
                            clearable
                            :disabled="getFilterDisabledState(filter.key)"
                            class="mb-3"
                            @change="handleFilterChange({ key: filter.key, value: $event, allFilters: { ...filterValues, [filter.key]: $event } })"
                        />
                    </div>
                </div>

                <v-divider class="my-4" />

                <!-- PARTS-Specific Filters - Only shown for PARTS data type -->
                <div v-if="currentDataType === 'parts'" class="mb-6">
                    <div class="text-subtitle-2 font-weight-bold warning--text text-uppercase mb-3 d-flex align-center">
                        <v-icon small color="warning" class="mr-2">mdi-cog-outline</v-icon>
                        Part Filters
                        <v-spacer />
                        <v-chip 
                            x-small
                            color="warning"
                            outlined
                            class="ml-2"
                        >
                            PARTS Only
                        </v-chip>
                    </div>
                    
                    <!-- Make/Buy Filter -->
                    <div class="mb-4">
                        <label class="caption font-weight-bold grey--text text--darken-2 mb-2 d-flex align-center text-uppercase">
                            <v-icon small class="mr-1">mdi-factory</v-icon>
                            Make / Buy
                        </label>
                        <v-select
                            v-model="filterValues.makeBuyFilter"
                            :items="makeBuyOptions"
                            placeholder="Select Make / Buy"
                            dense
                            outlined
                            hide-details
                            class="mb-3"
                            :loading="loading && currentDataType === 'parts'"
                            :disabled="loading && currentDataType === 'parts' && makeBuyOptions.length <= 1"
                            @change="handlePartsFilterChange"
                        />
                    </div>

                    <!-- Part Type Filter -->
                    <div class="mb-4">
                        <label class="caption font-weight-bold grey--text text--darken-2 mb-2 d-flex align-center text-uppercase">
                            <v-icon small class="mr-1">mdi-shape</v-icon>
                            Part Type
                        </label>
                        <v-select
                            v-model="filterValues.partTypeFilter"
                            :items="partTypeOptions"
                            placeholder="Select Part Type"
                            dense
                            outlined
                            hide-details
                            class="mb-3"
                            :loading="loading && currentDataType === 'parts'"
                            :disabled="loading && currentDataType === 'parts' && partTypeOptions.length <= 1"
                            @change="handlePartsFilterChange"
                        />
                    </div>
                </div>

                <v-divider v-if="currentDataType === 'parts'" class="my-4" />

                <!-- Scroll indicator at bottom -->
                <div class="d-flex align-center justify-center pt-4 pb-5 mt-5 opacity-60" style="border-top: 1px solid #e0e0e0;">
                    <v-icon small color="grey">mdi-chevron-down</v-icon>
                    <span class="caption grey--text ml-1 font-italic">Scroll for more options</span>
                </div>
            </div>
        </v-navigation-drawer>

        <!-- Header with Title and Discrete Filter Button -->
        <v-card-title class="planner-header">
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
            
            <!-- Filter Summary in Header -->
            <div v-if="currentDataType || hasActiveFilters" class="ml-4 d-flex align-center flex-wrap" style="gap: 8px;">
                <!-- Program -->
                <div v-if="filterValues.program && filterValues.program !== ''" class="d-flex align-center" style="gap: 4px;">
                    <v-icon x-small color="white">mdi-folder</v-icon>
                    <span class="filter-label-header">Program:</span>
                    <span class="filter-value-header">{{ filterValues.program }}</span>
                </div>

                <!-- Phase -->
                <div v-if="filterValues.phase && filterValues.phase !== ''" class="d-flex align-center" style="gap: 4px;">
                    <v-icon x-small color="white">mdi-timeline</v-icon>
                    <span class="filter-label-header">Phase:</span>
                    <span class="filter-value-header">{{ filterValues.phase }}</span>
                </div>

                <!-- Organization -->
                <div v-if="filterValues.organization && filterValues.organization !== 'All'" class="d-flex align-center" style="gap: 4px;">
                    <v-icon x-small color="white">mdi-domain</v-icon>
                    <span class="filter-label-header">Organization:</span>
                    <span class="filter-value-header">{{ filterValues.organization }}</span>
                </div>

                <!-- Make/Buy Filter - Only for PARTS -->
                <div v-if="currentDataType === 'parts' && filterValues.makeBuyFilter && filterValues.makeBuyFilter !== 'All'" class="d-flex align-center" style="gap: 4px;">
                    <v-icon x-small color="white">mdi-factory</v-icon>
                    <span class="filter-label-header">Make/Buy:</span>
                    <span class="filter-value-header">{{ filterValues.makeBuyFilter }}</span>
                </div>

                <!-- Part Type Filter - Only for PARTS -->
                <div v-if="currentDataType === 'parts' && filterValues.partTypeFilter && filterValues.partTypeFilter !== 'All'" class="d-flex align-center" style="gap: 4px;">
                    <v-icon x-small color="white">mdi-cog</v-icon>
                    <span class="filter-label-header">Part Type:</span>
                    <span class="filter-value-header">{{ filterValues.partTypeFilter }}</span>
                </div>
            </div>
            
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

        <!-- Layout: Chart and Stats Side by Side -->
        <div class="pa-4 d-flex flex-column" style="gap: 16px;">
            <!-- Chart and Stats Row - Horizontal Layout -->
            <div class="d-flex" style="gap: 8px;">
                <!-- Chart Container - Expanded to Fill Available Space -->
                <v-card class="chart-container-large" elevation="4" style="flex: 1; max-width: calc(100% - 416px);">
                    <v-card-title class="chart-header pa-3">
                        <v-icon left color="primary">mdi-chart-line</v-icon>
                        <span class="text-h6">Release Timeline</span>
                        <v-spacer />
                        <!-- Legend inline in header -->
                        <div class="d-flex align-center legend-chip-container" style="gap: 8px;">
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
                    
                    <v-card-text class="pa-4">
                        <div style="height: 600px; width: 100%;">
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
                
                <!-- Release Stats Container - Right Aligned -->
                <v-card class="stats-container" elevation="4" style="width: 400px; max-width: 400px; flex-shrink: 0;">
                    <v-card-title class="stats-header pa-3">
                        <v-icon left color="primary">mdi-chart-bar</v-icon>
                        <span class="text-h6">Release Stats</span>
                    </v-card-title>
                    
                    <v-card-text class="pa-2" style="height: 600px; overflow-y: auto;">
                        <div v-if="releaseStats" class="d-flex flex-column" style="gap: 4px;">
                            <v-card
                                v-for="stat in releaseStatsArray"
                                :key="stat.key"
                                class="stat-item-compact pa-1 d-flex align-center justify-space-between"
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
                                        stat.key === 'overdue' ? 'rgba(255, 152, 0, 0.05)' : '#fafafa'
                                }"
                                outlined
                                @click="stat.count > 0 ? filterByReleaseStatus(stat.key) : null"
                            >
                                <div class="d-flex flex-column" style="gap: 2px; flex: 1;">
                                    <span 
                                        class="text-subtitle-1 font-weight-bold primary--text"
                                        :class="{ 
                                            'error--text': stat.key === 'criticallyOverdue',
                                            'orange--text': stat.key === 'overdue'
                                        }"
                                    >
                                        {{ stat.displayText || stat.count }}
                                    </span>
                                    <span class="text-caption font-weight-medium">{{ stat.label }}</span>
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
                            
                            <!-- Clear filter -->
                            <v-btn
                                v-if="selectedStatFilter !== 'all'"
                                outlined
                                x-small
                                color="primary"
                                block
                                class="mt-2"
                                @click="filterByReleaseStatus('all')"
                            >
                                <v-icon x-small left>mdi-filter-off</v-icon>
                                Clear Filter
                            </v-btn>
                        </div>
                        <div v-else class="d-flex flex-column align-center justify-center" style="height: 100%;">
                            <v-icon size="48" color="grey lighten-2">mdi-chart-bar</v-icon>
                            <p class="text-center mt-2 caption">No stats available</p>
                        </div>
                    </v-card-text>
                </v-card>
            </div>
            
            <!-- Table - Full Width Below -->
            <v-card class="table-card">
                <v-card-title class="table-header pa-3">
                    <v-icon left>mdi-table</v-icon>
                    <span class="text-h6">{{ currentDataType ? currentDataType.toUpperCase() + ' Data' : 'Data Table' }}</span>
                    
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
                
                <v-card-text class="pa-0 position-relative">
                    <!-- Loading Overlay for Better Visibility -->
                    <v-overlay 
                        v-if="loading" 
                        absolute
                        color="white" 
                        opacity="0.8"
                        z-index="10"
                    >
                        <div class="text-center">
                            <v-progress-circular
                                indeterminate
                                size="64"
                                width="4"
                                color="primary"
                            />
                            <div class="mt-4">
                                <h4 class="text-h6 mb-2">Loading Data...</h4>
                                <p class="text-body-2 grey--text">Please wait while we fetch your {{ currentDataType || 'release planning' }} data</p>
                            </div>
                        </div>
                    </v-overlay>
                    
                    <!-- Show getting started message when no data type is selected -->
                    <div v-if="!currentDataType" class="getting-started-message d-flex flex-column align-center justify-center" :style="{ height: `${currentTableHeight}px` }">
                        <v-icon size="64" color="primary" class="mb-4">mdi-format-list-checks</v-icon>
                        <h3 class="text-h5 font-weight-light primary--text mb-2">Welcome to Release Planner</h3>
                        <p class="text-body-1 grey--text text--darken-2 mb-4 text-center">
                            Select a data type from the filter panel to get started
                        </p>
                        <v-btn
                            color="primary"
                            large
                            outlined
                            @click="showFilterFlyout = true"
                        >
                            <v-icon left>mdi-filter-variant</v-icon>
                            Open Filters
                        </v-btn>
                    </div>
                    
                    <!-- Show data table when data type is selected and data is available -->
                    <v-data-table
                        v-else-if="currentDataType && filteredTableData.length > 0"
                        :headers="tableHeaders"
                        :items="filteredTableData"
                        :loading="loading"
                        :dense="isMobile"
                        :height="currentTableHeight"
                        :fixed-header="isDesktop"
                        :items-per-page="currentItemsPerPage"
                        :hide-default-footer="isMobile"
                        :mobile-breakpoint="600"
                        :item-class="getRowClass"
                        item-value="partNo"
                        class="pa-0 draggable-table"
                        @click:row="handleRowClick"
                    >
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
                                @ca-number-loaded="onCaNumberLoaded"
                                @cr-number-loaded="onCrNumberLoaded"
                            />
                            <!-- Use StatusCommentDisplay component for status comment fields -->
                            <StatusCommentDisplay
                                v-else-if="header.component === 'StatusCommentDisplay'"
                                :key="`comment-${header.value}-${index}`"
                                :value="getStatusCommentValue(header, item)"
                                :object-id="item.physId || item.objId || item.id"
                                :item-type="header.componentProps.itemType || 'parts'"
                                :can-edit="getCanEditValue(header, item)"
                                :ca-number="header.componentProps.itemType === 'parts' ? (item.caNumber || '') : ''"
                                :ca-phys-id="header.componentProps.itemType === 'parts' ? (item.caPhysId || '') : ''"
                                :ca-link="header.componentProps.itemType === 'parts' ? (item.caLink || '') : ''"
                                @comment-updated="handleCommentUpdate"
                                @show-message="showSnackbar"
                            />
                        </template>
                        
                        <!-- Individual column slots with drag functionality applied to table rows via CSS and events -->
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
                            <StatusCommentDisplay
                                v-else-if="header.component === 'StatusCommentDisplay'"
                                :key="`comment-${header.value}-${index}`"
                                :value="getStatusCommentValue(header, item)"
                                :object-id="item.physId || item.objId || item.id"
                                :item-type="header.componentProps.itemType || 'parts'"
                                :can-edit="getCanEditValue(header, item)"
                                :ca-number="header.componentProps.itemType === 'parts' ? (item.caNumber || '') : ''"
                                :ca-phys-id="header.componentProps.itemType === 'parts' ? (item.caPhysId || '') : ''"
                                :ca-link="header.componentProps.itemType === 'parts' ? (item.caLink || '') : ''"
                                @comment-updated="handleCommentUpdate"
                                @show-message="showSnackbar"
                            />
                        </template>

                        <!-- Custom template for Part Number - make it a hyperlink for PARTS data type -->
                        <template v-if="currentDataType === 'parts'" #item.partNo="{ item }">
                            <a 
                                :href="`https://3dspace-prod.beta.team/3dspace/common/emxTree.jsp?objectId=${item.physId || item.objId}&DefaultCategory=betaProductNavigatorPortalCmd`"
                                target="_blank"
                                rel="noopener noreferrer"
                                class="part-number-link"
                                :title="`Open ${item.partNo} in 3DSpace`"
                            >
                                {{ item.partNo }}
                                <v-icon x-small class="ml-1" color="primary">mdi-open-in-new</v-icon>
                            </a>
                        </template>
                    </v-data-table>
                    
                    <!-- Show no data message when data type is selected but no data is available -->
                    <div v-else-if="currentDataType" class="no-data-message d-flex flex-column align-center justify-center" :style="{ height: `${currentTableHeight}px` }">
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
                                @click="showFilterFlyout = true"
                            >
                                <v-icon left small>mdi-filter-variant</v-icon>
                                Open Filters
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
                                @click="showFilterFlyout = true"
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
    </div>
</template>

<style scoped>
/* Position relative for loading overlay */
.position-relative {
  position: relative;
}

/* Custom text colors for Release Stats */
.orange--text {
  color: #ff9800 !important;
}

/* Filter Flyout Styles - Keep custom glass effect */
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

/* Custom scrollbar styling for flyout */
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
}

.chart-container-large .chart-header {
  background-color: rgba(25, 118, 210, 0.05);
  border-bottom: 1px solid #e0e0e0;
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
@media (max-width: 960px) {
  .filter-flyout-trigger-header {
    font-size: 12px !important;
  }
  
  .filter-flyout-trigger-header .v-btn__content {
    font-size: 12px !important;
  }
}

@media (max-width: 600px) {
  .legend-chip-container {
    flex-direction: column !important;
    gap: 4px !important;
  }
  
  .legend-chip-container .v-chip {
    align-self: flex-start !important;
  }
  
  .filter-flyout-trigger-header {
    font-size: 11px !important;
    padding: 4px 8px !important;
  }
  
  .filter-flyout-trigger-header .v-btn__content {
    font-size: 11px !important;
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

/* Ensure header and body column widths stay in sync */
.draggable-table >>> table {
  table-layout: fixed !important;
  width: 100% !important;
}

.draggable-table >>> .v-data-table__wrapper {
  overflow-x: auto !important;
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
.filter-label-header {
  font-size: 11px;
  font-weight: 500;
  color: #E3F2FD;
}

.filter-value-header {
  font-size: 11px;
  font-weight: 600;
  color: #FFF9C4;
  background-color: rgba(255, 193, 7, 0.2);
  padding: 2px 6px;
  border-radius: 4px;
  border: 1px solid rgba(255, 193, 7, 0.3);
}

.results-count {
  font-size: 13px;
  font-weight: 600;
  color: #4caf50;
}

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

/* Disabled Filter Styling */
.v-select.v-input--is-disabled .v-input__slot {
  background-color: rgba(0, 0, 0, 0.02) !important;
  opacity: 0.6 !important;
}

.v-select.v-input--is-disabled .v-input__slot::before {
  border-style: dashed !important;
  border-color: rgba(0, 0, 0, 0.2) !important;
}

.v-select.v-input--is-disabled .v-select__selection {
  color: rgba(0, 0, 0, 0.4) !important;
}
</style>

<script>
/* eslint-disable no-console */
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
import { responsiveUtils, ResponsiveMixin } from "@/utils/ResponsiveUtils.js";
import { useDragAndDrop } from "@/composables/useDragAndDrop.js";

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
            
            // Filter flyout state
            showFilterFlyout: false,
            
            // Debouncing for filter changes
            filterChangeTimeout: null,
            filterDebounceDelay: 1000, // 1000ms delay before triggering API calls
            
            // Filter values - consolidated object for UniversalFilterControls
            filterValues: {
                program: "",
                phase: "",
                organization: "All",
                makeBuyFilter: "All", // Only used for PARTS data type
                partTypeFilter: "All" // Only used for PARTS data type
            },
            
            // Filter options - will be loaded dynamically
            programs: [],
            phases: [],
            organizations: ["All"], // Initialize with default
            makeBuyOptions: ["All"], // Initialize with default - only for PARTS
            partTypeOptions: ["All"], // Initialize with default - only for PARTS
            
            // Raw data
            tableData: [],
            
            // Data for chart and filtered display
            chartData: { labels: [], datasets: [] },
            
            // Current data type being displayed - determines which header configuration to use
            currentDataType: null, // null initially - user must select "parts", "cas", "crs", etc.
            
            // Configuration for different data types - easily extensible
            // ⚠️  IMPORTANT: When adding new data types here, you MUST also update 
            // the mapItemToTableData() method in the methods section below (around line 890)
            // to handle the new data type. Field names must match exactly!
            headerConfigurations: {
                parts: [
                    { text: "Part Number", value: "partNo", sortable: true, required: true, icon: "mdi-barcode" },
                    { text: "Rev", value: "rev", sortable: true, icon: "mdi-source-branch" },
                    { text: "Description", value: "description", sortable: true, icon: "mdi-text" },
                    { text: "Make / Buy", value: "makeBuy", sortable: true, icon: "mdi-factory" },
                    { text: "Organization", value: "organization", sortable: true, icon: "mdi-domain" },
                    { text: "Target Release", value: "tgtRelease", sortable: true, icon: "mdi-calendar-clock" },
                    { text: "Actual Release", value: "actualRelease", sortable: true, icon: "mdi-calendar-check" },
                    { text: "Critical Release", value: "criticalRelease", sortable: true, icon: "mdi-calendar-alert" },
                    { text: "State", value: "currentState", sortable: true, icon: "mdi-flag" },
                    { text: "Change Action", value: "caNumber", sortable: false, component: "ChangeActionCell", componentProps: { field: "number" } },
                    { text: "Status Comments", value: "statusComment", sortable: false, icon: "mdi-comment-text", component: "StatusCommentDisplay", componentProps: { itemType: "parts", canEdit: true } }
                ],
                cas: [
                    { text: "CA Number", value: "caNumber", sortable: true, required: true, icon: "mdi-file-document", component: "ChangeActionCell", componentProps: { field: "number", itemType: "ca" } },
                    { text: "Description", value: "changeDescription", sortable: true, icon: "mdi-text" },
                    { text: "Resp Engr", value: "resEngr", sortable: true, icon: "mdi-account" },
                    { text: "Status", value: "currentState", sortable: true, icon: "mdi-flag" },
                    { text: "Target Complete", value: "targetReleaseDate", sortable: true, icon: "mdi-calendar-clock" },
                    { text: "Actual Approved", value: "approvedDate", sortable: true, icon: "mdi-calendar-check" },
                    { text: "Actual Complete", value: "actualReleaseDate", sortable: true, icon: "mdi-calendar-check" },
                    { text: "Status Comments", value: "statusComment", sortable: false, icon: "mdi-comment-text", component: "StatusCommentDisplay", componentProps: { itemType: "cas", canEdit: true } }
                ],
                crs: [
                    { text: "CR Number", value: "crNumber", sortable: true, required: true, icon: "mdi-file-document-outline", component: "ChangeActionCell", componentProps: { field: "number", itemType: "cr" } },
                    { text: "Description", value: "changeDescription", sortable: true, icon: "mdi-format-title" },
                    { text: "Resp Engr", value: "owner", sortable: true, icon: "mdi-account" },
                    { text: "Status", value: "currentState", sortable: true, icon: "mdi-flag" },
                    { text: "Target Complete", value: "targetReleaseDate", sortable: true, icon: "mdi-calendar-plus" },
                    { text: "Actual Complete", value: "actualCompleteDate", sortable: true, icon: "mdi-calendar-check" },
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
            lastUpdated: new Date().toLocaleTimeString(),
            
            // Environment change detection
            environmentChangeKey: 0, // Force reactivity updates when environment changes
            
            // Chart line visibility
            showTargetLine: true,
            showActualLine: true,
            showCriticalLine: true,
            
            // Release headliner filter
            selectedStatFilter: "all",
            
            // Chart refresh key to force chart updates
            chartKey: 0,
            
            // Change Action refresh key to force CA link updates when filters change
            changeActionRefreshKey: 0,
            
            // Cache clearing state
            clearingCache: false,
            showClearCacheDialog: false,
            
            // Responsive dimensions
            currentChartHeight: 400,
            currentTableHeight: 500,
            
            // Base config for responsive utilities
            baseConfig: {
                chart: {
                    height: 400,
                    breakpoints: {
                        mobile: { height: 300 },
                        tablet: { height: 350 },
                        desktop: { height: 400 }
                    }
                },
                table: {
                    height: 500,
                    itemsPerPage: 15,
                    breakpoints: {
                        mobile: { height: 300, itemsPerPage: 5 },
                        tablet: { height: 400, itemsPerPage: 10 },
                        desktop: { height: 500, itemsPerPage: 15 }
                    }
                }
            }
        };
    },
    
    computed: {
        // Dynamic widget title based on current data type using DataTransformationService
        widgetTitle() {
            if (!this.currentDataType) {
                return "Release Planner - Select Data Type";
            }
            return dataTransformationService.getDataTypeTitle(this.currentDataType);
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

            return filteredHeaders;
        },

        // Responsive items per page based on screen size and configuration
        currentItemsPerPage() {
            const tableConfig = this.baseConfig.table;
            if (this.isMobile) {
                return tableConfig.breakpoints.mobile.itemsPerPage;
            } else if (this.isTablet) {
                return tableConfig.breakpoints.tablet.itemsPerPage;
            } else {
                return tableConfig.breakpoints.desktop.itemsPerPage;
            }
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
                { 
                    key: "thisWeek", 
                    label: "This Week", 
                    count: this.releaseStats.thisWeekCount,
                    total: this.releaseStats.thisWeekTotal,
                    displayText: `${this.releaseStats.thisWeekCount} of ${this.releaseStats.thisWeekTotal}`
                },
                { 
                    key: "nextWeek", 
                    label: "Next Week", 
                    count: this.releaseStats.nextWeekCount,
                    total: this.releaseStats.nextWeekTotal,
                    displayText: `${this.releaseStats.nextWeekCount} of ${this.releaseStats.nextWeekTotal}`
                },
                { key: "criticallyOverdue", label: "Critically Overdue", count: this.releaseStats.criticallyOverdueCount },
                { key: "overdue", label: "Overdue", count: this.releaseStats.overdueCount },
                { 
                    key: "next30Days", 
                    label: "Next 30 Days", 
                    count: this.releaseStats.next30DaysCount,
                    total: this.releaseStats.next30DaysTotal,
                    displayText: `${this.releaseStats.next30DaysCount} of ${this.releaseStats.next30DaysTotal}`
                },
                { key: "all", label: "Total", count: this.releaseStats.totalCount }
            ];
        },
        
        hasActiveFilters() {
            return (this.filterValues.program && this.filterValues.program !== "") ||
                   (this.filterValues.phase && this.filterValues.phase !== "") ||
                   (this.filterValues.organization && this.filterValues.organization !== "All") ||
                   (this.currentDataType === "parts" && this.filterValues.makeBuyFilter && this.filterValues.makeBuyFilter !== "All") ||
                   (this.currentDataType === "parts" && this.filterValues.partTypeFilter && this.filterValues.partTypeFilter !== "All");
        },
        
        activeFilterCount() {
            let count = 0;
            if (this.filterValues.program && this.filterValues.program !== "") count++;
            if (this.filterValues.phase && this.filterValues.phase !== "") count++;
            if (this.filterValues.organization && this.filterValues.organization !== "All") count++;
            // Only count Make/Buy filter when viewing PARTS
            if (this.currentDataType === "parts" && this.filterValues.makeBuyFilter && this.filterValues.makeBuyFilter !== "All") count++;
            // Only count Part Type filter when viewing PARTS
            if (this.currentDataType === "parts" && this.filterValues.partTypeFilter && this.filterValues.partTypeFilter !== "All") count++;
            return count;
        },

        // Dynamic chart options using ChartDataService
        dynamicChartOptions() {
            // Return default options if no data type is selected
            if (!this.currentDataType) {
                return {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: false
                        }
                    }
                };
            }
            
            return chartDataService.createChartOptions(this.currentDataType);
        },

        // Filter table data using FilterService
        filteredTableData() {
            // Return empty array if no data type is selected
            if (!this.currentDataType) {
                return [];
            }
            
            return filterService.applyAllFilters(
                this.tableData,
                this.filterValues,
                this.selectedStatFilter
            );
        },

        // Release statistics using FilterService
        releaseStats() {
            return filterService.computeStatistics(this.filteredTableData, this.tableData);
        },

        // Dynamic chart legend label using ChartDataService
        chartLegendLabel() {
            return chartDataService.getChartLegendLabel(this.currentDataType);
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
                
                // Set up drag listeners for table rows whenever data changes
                this.setupTableDragListeners();
            },
            deep: false // Don't deep watch - we only care about array length changes
        },
        
        // Debug watcher for tableData to track CA-00000268
        "tableData": {
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
        
        "filterValues.organization": {
            handler() {
                console.log("👀 CHART WATCH: Organization filter changed");
                this.changeActionRefreshKey++; // Refresh Change Action links
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
                this.changeActionRefreshKey++; // Refresh Change Action links
                this.$nextTick(() => {
                    this.updateChartFromFiltered();
                    // Re-setup drag listeners when data type changes
                    this.setupTableDragListeners();
                });
            }
        },
        
        // Watch tableHeaders changes to re-setup drag listeners
        "tableHeaders": {
            handler() {
                console.log("👀 TABLE WATCH: Headers changed, re-setting up drag listeners");
                this.$nextTick(() => {
                    this.setupTableDragListeners();
                });
            }
        }
    },
    
    async mounted() {
        console.log("🚀 ReleasePlannerWidget mounted - initializing...");
        console.log("📊 Current data type:", this.currentDataType);
        console.log("🏷️  Widget title:", this.widgetTitle);
        console.log(" USE_MOCK_DATA:", USE_MOCK_DATA);
        
        // Initialize responsive dimensions
        this.initializeResponsiveDimensions();
        
        // Initialize by fetching programs first
        await this.fetchPrograms();
        
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
    },
    
    methods: {
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
            if (filterKey === 'phase') {
                const programValue = this.filterValues.program;
                const isDisabled = !programValue || 
                       programValue === '' || 
                       programValue === 'All' || 
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
         * Handle responsive resize events from ResponsiveMixin
         */
        onResponsiveResize(_resizeData) {
            // Update chart height
            const chartConfig = responsiveUtils.getResponsiveDimensions(this.baseConfig.chart);
            this.currentChartHeight = chartConfig.height;
            
            // Update table height
            const tableConfig = responsiveUtils.getResponsiveDimensions(this.baseConfig.table);
            this.currentTableHeight = tableConfig.height;
            
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
         * Initialize responsive dimensions on component mount
         */
        initializeResponsiveDimensions() {
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
        
        toggleCriticalLine() {
            this.showCriticalLine = !this.showCriticalLine;
            console.log("👁️ Critical line toggled:", this.showCriticalLine);
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
            if (filterEvent.key === 'program') {
                // Clear phase when program changes or is cleared
                if (!filterEvent.value || filterEvent.value === '' || filterEvent.value === 'All') {
                    updatedFilters.phase = '';
                    console.log("  - Cleared phase filter due to program change");
                }
            }
            
            // Update filter values immediately for UI responsiveness
            this.filterValues = updatedFilters;
            
            console.log("  - New filterValues:", JSON.stringify(this.filterValues));
            
            // Handle program changes immediately (no debounce needed for phase population)
            if (filterEvent.key === 'program') {
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
            } else if (filterEvent.key === "organization") {
                console.log("🔄 Organization changed, updating chart...");
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
            }, this.filterDebounceDelay);
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

                // Do NOT automatically select a program - wait for user selection
                console.log("📋 Programs available for user selection:", this.programs);
                
                // Clear any existing selections to force user choice
                this.filterValues.program = "";
                this.filterValues.phase = "";
                this.phases = [];
                this.tableData = [];
                
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
            this.loading = true;
            try {
                const phases = await dataService.fetchPhases(this.filterValues.program);
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
            } catch (error) {
                console.error("Failed to fetch phases:", error.message);
                this.phases = [];
                this.filterValues.phase = "";
                this.tableData = [];
                this.updateChartFromFiltered();
            } finally {
                this.loading = false;
            }
        },

        async handlePhaseChange() {
            // Only fetch data if a valid phase is selected (not empty, not "All")
            if (!this.filterValues.phase || this.filterValues.phase === '' || this.filterValues.phase === 'All') {
                console.log("🚫 No valid phase selected, skipping data fetch");
                this.tableData = [];
                this.updateChartFromFiltered();
                return;
            }
            
            console.log("🎯 Phase selected by user:", this.filterValues.phase, "- fetching data...");
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
                
                // Guard clause: Don't fetch data if no data type is selected
                if (!this.currentDataType) {
                    console.log("⚠️  No data type selected, skipping data fetch");
                    this.tableData = [];
                    this.organizations = ["All"];
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
                        organization: "All",
                        makeBuyFilter: "All",
                        partTypeFilter: "All"
                    };
                    console.log(`🔄 Filters reset due to data type change: ${previousDataType} → ${dataType}`);
                }
                
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
                    organization: "All",
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
            
            try {
                // Clear all cache sources
                
                // 1. Clear ApiService cache
                ApiService.clearCache();
                console.log("✅ ApiService cache cleared");
                
                // 2. Clear UniversalDataService cache
                UniversalDataService.refreshAll();
                console.log("✅ UniversalDataService cache cleared");
                
                // 3. Clear session storage
                sessionStorage.clear();
                console.log("✅ Session storage cleared");
                
                // 4. Clear local storage (except user preferences)
                const keysToKeep = ["widget-dev-config"]; // Keep config settings
                const allKeys = Object.keys(localStorage);
                allKeys.forEach(key => {
                    if (!keysToKeep.includes(key)) {
                        localStorage.removeItem(key);
                    }
                });
                console.log("✅ Local storage cleared (preserved user preferences)");
                
                // 5. Reset component data
                this.tableData = [];
                this.chartData = { labels: [], datasets: [] };
                this.organizations = ["All"];
                this.makeBuyOptions = ["All"];
                this.partTypeOptions = ["All"];
                
                // 6. Refresh data from API
                if (this.filterValues.phase && this.currentDataType) {
                    console.log("🔄 Refreshing data from API...");
                    await this.fetchData(this.filterValues.phase);
                    console.log("✅ Data refreshed from API");
                } else {
                    console.log("ℹ️ No phase or data type selected, skipping data refresh");
                }
                
                // Show success message
                this.showSnackbar({ message: "Cache cleared and data refreshed successfully!", type: "success" });
                
            } catch (error) {
                console.error("❌ Error clearing cache:", error);
                this.showSnackbar({ message: "Error clearing cache: " + error.message, type: "error" });
            } finally {
                this.clearingCache = false;
                this.showClearCacheDialog = false; // Close the dialog
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
                case 'criticallyOverdue':
                    // Show only critical line for critically overdue items
                    this.showTargetLine = false;
                    this.showActualLine = false;
                    this.showCriticalLine = true;
                    console.log("👁️ Chart lines adjusted for critically overdue: Target=OFF, Actual=OFF, Critical=ON");
                    break;
                    
                case 'overdue':
                    // Show target and critical lines for overdue items
                    this.showTargetLine = true;
                    this.showActualLine = false;
                    this.showCriticalLine = true;
                    console.log("👁️ Chart lines adjusted for overdue: Target=ON, Actual=OFF, Critical=ON");
                    break;
                    
                case 'released':
                    // Show actual line for released items
                    this.showTargetLine = true;
                    this.showActualLine = true;
                    this.showCriticalLine = false;
                    console.log("👁️ Chart lines adjusted for released: Target=ON, Actual=ON, Critical=OFF");
                    break;
                    
                case 'thisWeek':
                case 'nextWeek':
                    // Show target line for upcoming items
                    this.showTargetLine = true;
                    this.showActualLine = false;
                    this.showCriticalLine = true;
                    console.log("👁️ Chart lines adjusted for time-based filter: Target=ON, Actual=OFF, Critical=ON");
                    break;
                    
                case 'all':
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
                    caLink: caData.itemLink
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