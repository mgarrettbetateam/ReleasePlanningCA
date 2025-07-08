<template>
    <div class="widget-development-container">
        <!-- Left Sidebar Toolbox -->
        <div class="toolbox-sidebar" :class="{ 'toolbox-collapsed': !showToolbox }">
            <div class="toolbox-header">
                <v-btn
                    icon
                    small
                    class="toolbox-toggle"
                    @click="showToolbox = !showToolbox"
                >
                    <v-icon>{{ showToolbox ? 'mdi-chevron-left' : 'mdi-chevron-right' }}</v-icon>
                </v-btn>
                <div v-if="showToolbox" class="toolbox-title">
                    <v-icon color="purple" class="mr-2">mdi-toolbox</v-icon>
                    <span>Components</span>
                </div>
            </div>
            
            <div v-if="showToolbox" class="toolbox-content">
                <!-- Form Controls -->
                <div class="toolbox-category">
                    <h4 class="category-title">
                        <v-icon small color="primary" class="mr-2">mdi-form-textbox</v-icon>
                        Form Controls
                    </h4>
                    <div class="component-group">
                        <div
                            v-for="component in formComponents"
                            :key="component.type"
                            class="toolbox-component"
                            draggable="true"
                            @dragstart="onComponentDragStart(component, $event)"
                        >
                            <v-card class="component-card" outlined hover>
                                <v-card-text class="pa-2 text-center">
                                    <v-icon size="18" :color="component.color" class="mb-1">
                                        {{ component.icon }}
                                    </v-icon>
                                    <div class="text-caption">{{ component.name }}</div>
                                </v-card-text>
                            </v-card>
                        </div>
                    </div>
                </div>
                
                <!-- Buttons & Actions -->
                <div class="toolbox-category">
                    <h4 class="category-title">
                        <v-icon small color="secondary" class="mr-2">mdi-gesture-tap-button</v-icon>
                        Buttons
                    </h4>
                    <div class="component-group">
                        <div
                            v-for="component in buttonComponents"
                            :key="component.type"
                            class="toolbox-component"
                            draggable="true"
                            @dragstart="onComponentDragStart(component, $event)"
                        >
                            <v-card class="component-card" outlined hover>
                                <v-card-text class="pa-2 text-center">
                                    <v-icon size="18" :color="component.color" class="mb-1">
                                        {{ component.icon }}
                                    </v-icon>
                                    <div class="text-caption">{{ component.name }}</div>
                                </v-card-text>
                            </v-card>
                        </div>
                    </div>
                </div>
                
                <!-- Display Elements -->
                <div class="toolbox-category">
                    <h4 class="category-title">
                        <v-icon small color="success" class="mr-2">mdi-view-list</v-icon>
                        Display
                    </h4>
                    <div class="component-group">
                        <div
                            v-for="component in displayComponents"
                            :key="component.type"
                            class="toolbox-component"
                            draggable="true"
                            @dragstart="onComponentDragStart(component, $event)"
                        >
                            <v-card class="component-card" outlined hover>
                                <v-card-text class="pa-2 text-center">
                                    <v-icon size="18" :color="component.color" class="mb-1">
                                        {{ component.icon }}
                                    </v-icon>
                                    <div class="text-caption">{{ component.name }}</div>
                                </v-card-text>
                            </v-card>
                        </div>
                    </div>
                </div>
                
                <!-- Layout Components -->
                <div class="toolbox-category">
                    <h4 class="category-title">
                        <v-icon small color="warning" class="mr-2">mdi-view-dashboard-outline</v-icon>
                        Layout
                    </h4>
                    <div class="component-group">
                        <div
                            v-for="component in layoutComponents"
                            :key="component.type"
                            class="toolbox-component"
                            draggable="true"
                            @dragstart="onComponentDragStart(component, $event)"
                        >
                            <v-card class="component-card" outlined hover>
                                <v-card-text class="pa-2 text-center">
                                    <v-icon size="18" :color="component.color" class="mb-1">
                                        {{ component.icon }}
                                    </v-icon>
                                    <div class="text-caption">{{ component.name }}</div>
                                </v-card-text>
                            </v-card>
                        </div>
                    </div>
                </div>
                
                <v-alert
                    type="info"
                    outlined
                    dense
                    class="ma-2"
                >
                    <div class="text-caption">
                        <strong>Tip:</strong> Drag components to the grid to create widgets.
                    </div>
                </v-alert>
            </div>
        </div>
        
        <!-- Main Content Area -->
        <div class="main-content" :class="{ 'main-content-expanded': !showToolbox }">
            <v-container fluid class="widget-development-area">
                <!-- Development Area Header -->
                <v-row class="mb-4">
                    <v-col cols="12">
                        <v-card class="development-header">
                            <v-card-title class="development-title">
                                <v-icon left color="primary" size="28">mdi-hammer-wrench</v-icon>
                                Widget Development Area
                                <v-spacer />
                                <v-chip
                                    color="info"
                                    small
                                    outlined
                                    class="mr-2"
                                >
                                    {{ GRID_COLUMNS }}×{{ GRID_ROWS }} Grid ({{ GRID_COLUMNS * gridSize }}×{{ GRID_ROWS * gridSize }}px)
                                </v-chip>
                                <v-chip
                                    :color="isDirty ? 'warning' : 'success'"
                                    small
                                    outlined
                                >
                                    {{ widgets.length }} widget{{ widgets.length !== 1 ? 's' : '' }}
                                </v-chip>
                            </v-card-title>
          
                            <!-- Action Buttons -->
                            <v-card-text class="pb-2">
                                <div class="d-flex align-center flex-wrap">
                                    <v-chip
                                        color="primary"
                                        outlined
                                        small
                                        class="mr-4 mb-2"
                                    >
                                        <v-icon left small>mdi-grid</v-icon>
                                        Grid View
                                    </v-chip>
                    
                                    <v-btn
                                        color="primary"
                                        class="mr-2 mb-2"
                                        @click="openWidgetWizard"
                                    >
                                        <v-icon left>mdi-plus</v-icon>
                                        New Widget
                                    </v-btn>
                    
                                    <v-btn
                                        color="secondary"
                                        class="mr-2 mb-2"
                                        :disabled="widgets.length === 0"
                                        @click="openLayoutManager"
                                    >
                                        <v-icon left>mdi-view-dashboard</v-icon>
                                        Manage Layout
                                    </v-btn>
                    
                                    <v-btn
                                        color="success"
                                        class="mr-2 mb-2"
                                        :disabled="widgets.length === 0"
                                        @click="exportDevelopmentArea"
                                    >
                                        <v-icon left>mdi-export</v-icon>
                                        Export Layout
                                    </v-btn>
                    
                                    <v-btn
                                        color="error"
                                        class="mr-2 mb-2"
                                        :disabled="widgets.length === 0"
                                        @click="clearDevelopmentArea"
                                    >
                                        <v-icon left>mdi-delete-sweep</v-icon>
                                        Clear All
                                    </v-btn>
                                    
                                    <v-btn
                                        color="info"
                                        outlined
                                        class="mb-2 mr-2"
                                        @click="showGridConfig = !showGridConfig"
                                    >
                                        <v-icon left>mdi-grid-large</v-icon>
                                        Configure Grid
                                    </v-btn>
                                </div>
                                
                                <!-- Grid size info -->
                                <div class="mt-3">
                                    <v-alert
                                        color="info"
                                        icon="mdi-information"
                                        border="left"
                                        dense
                                        text
                                        class="mb-0"
                                    >
                                        <small>
                                            Development area is now {{ GRID_COLUMNS }}×{{ GRID_ROWS }} cells ({{ GRID_COLUMNS * gridSize }}×{{ GRID_ROWS * gridSize }}px).
                                            Use scroll bars to navigate the full prototyping space.
                                        </small>
                                    </v-alert>
                                </div>
                            </v-card-text>
                        </v-card>
                    </v-col>
                </v-row>

                <!-- Grid Configuration Panel -->
                <v-row v-if="showGridConfig">
                    <v-col cols="12">
                        <v-card class="grid-config-panel">
                            <v-card-title class="grid-config-title">
                                <v-icon left color="info">mdi-grid-large</v-icon>
                                Grid Configuration
                                <v-spacer />
                                <v-btn icon @click="showGridConfig = false">
                                    <v-icon>mdi-close</v-icon>
                                </v-btn>
                            </v-card-title>
                    
                            <v-card-text>
                                <v-container>
                                    <v-row>
                                        <v-col cols="12" md="4">
                                            <v-text-field
                                                v-model.number="gridConfig.columns"
                                                label="Grid Columns"
                                                type="number"
                                                :min="gridConfig.minColumns"
                                                :max="gridConfig.maxColumns"
                                                outlined
                                                dense
                                                @input="onGridConfigChange"
                                            >
                                                <template #append>
                                                    <v-chip small>{{ gridConfig.minColumns }}-{{ gridConfig.maxColumns }}</v-chip>
                                                </template>
                                            </v-text-field>
                                        </v-col>
                                
                                        <v-col cols="12" md="4">
                                            <v-text-field
                                                v-model.number="gridConfig.rows"
                                                label="Grid Rows"
                                                type="number"
                                                :min="gridConfig.minRows"
                                                :max="gridConfig.maxRows"
                                                outlined
                                                dense
                                                @input="onGridConfigChange"
                                            >
                                                <template #append>
                                                    <v-chip small>{{ gridConfig.minRows }}-{{ gridConfig.maxRows }}</v-chip>
                                                </template>
                                            </v-text-field>
                                        </v-col>
                                
                                        <v-col cols="12" md="4">
                                            <v-text-field
                                                v-model.number="gridConfig.cellSize"
                                                label="Cell Size (px)"
                                                type="number"
                                                :min="gridConfig.minCellSize"
                                                :max="gridConfig.maxCellSize"
                                                outlined
                                                dense
                                                @input="onGridConfigChange"
                                            >
                                                <template #append>
                                                    <v-chip small>{{ gridConfig.minCellSize }}-{{ gridConfig.maxCellSize }}</v-chip>
                                                </template>
                                            </v-text-field>
                                        </v-col>
                                    </v-row>
                            
                                    <v-row>
                                        <v-col cols="12">
                                            <v-alert
                                                color="success"
                                                border="left"
                                                dense
                                                text
                                            >
                                                <strong>Current Grid:</strong> {{ GRID_COLUMNS }}×{{ GRID_ROWS }} cells 
                                                ({{ gridWidth }}×{{ gridHeight }} pixels total)
                                            </v-alert>
                                        </v-col>
                                    </v-row>
                            
                                    <v-row>
                                        <v-col cols="12">
                                            <div class="grid-presets">
                                                <h4 class="mb-3">Quick Presets</h4>
                                                <v-btn-toggle mandatory class="grid-preset-buttons">
                                                    <v-btn small @click="applyGridPreset('small')">
                                                        Small (12×12)
                                                    </v-btn>
                                                    <v-btn small @click="applyGridPreset('medium')">
                                                        Medium (16×16)
                                                    </v-btn>
                                                    <v-btn small @click="applyGridPreset('large')">
                                                        Large (20×20)
                                                    </v-btn>
                                                    <v-btn small @click="applyGridPreset('xlarge')">
                                                        X-Large (24×24)
                                                    </v-btn>
                                                </v-btn-toggle>
                                            </div>
                                        </v-col>
                                    </v-row>
                                </v-container>
                            </v-card-text>
                        </v-card>
                    </v-col>
                </v-row>



                <!-- Development Grid -->
                <v-row>
                    <v-col cols="12">
                        <v-card class="development-grid-container">
                            <v-card-text class="pa-0">
                                <!-- Grid System -->
                                <div 
                                    ref="developmentGrid"
                                    class="development-grid"
                                    :style="{ 
                                        width: `${gridWidth}px`, 
                                        height: `${gridHeight}px`,
                                        minWidth: `${gridWidth}px`
                                    }"
                                    @drop="onGridDrop"
                                    @dragover.prevent
                                    @dragenter.prevent
                                >
                                    <!-- Grid Lines -->
                                    <div class="grid-lines">
                                        <div
                                            v-for="i in GRID_ROWS"
                                            :key="`row-${i}`"
                                            class="grid-line grid-line-horizontal"
                                            :style="{ top: `${(i-1) * gridSize}px` }"
                                        ></div>
                                        <div
                                            v-for="i in GRID_COLUMNS"
                                            :key="`col-${i}`"
                                            class="grid-line grid-line-vertical"
                                            :style="{ left: `${(i-1) * gridSize}px` }"
                                        ></div>
                                    </div>
              
                                    <!-- Widgets on Grid -->
                                    <div
                                        v-for="widget in widgets"
                                        :key="widget.id"
                                        class="grid-widget"
                                        :class="{ 'widget-selected': selectedWidget === widget.id }"
                                        :style="getWidgetStyle(widget)"
                                        draggable="true"
                                        @mousedown="startDrag(widget, $event)"
                                        @click="selectWidget(widget.id)"
                                        @dragstart="onWidgetDragStart(widget, $event)"
                                    >
                                        <!-- Widget Header -->
                                        <div class="widget-header">
                                            <v-icon small class="mr-2">{{ widget.icon }}</v-icon>
                                            {{ widget.title }}
                                            <v-spacer />
                                            <v-btn
                                                icon
                                                x-small
                                                class="widget-action-btn"
                                                @click.stop="editWidget(widget)"
                                            >
                                                <v-icon x-small>mdi-pencil</v-icon>
                                            </v-btn>
                                            <v-btn
                                                icon
                                                x-small
                                                class="widget-action-btn"
                                                @click.stop="deleteWidget(widget.id)"
                                            >
                                                <v-icon x-small>mdi-delete</v-icon>
                                            </v-btn>
                                        </div>
                
                                        <!-- Widget Preview -->
                                        <div class="widget-preview">
                                            <component
                                                :is="widget.component"
                                                v-bind="getWidgetPreviewProps(widget)"
                                            />
                                        </div>
                
                                        <!-- Resize Handles -->
                                        <div
                                            class="resize-handle resize-se"
                                            @mousedown.stop="startResize(widget, 'se', $event)"
                                        ></div>
                                    </div>
              
                                    <!-- Grid Instructions -->
                                    <div v-if="widgets.length === 0" class="grid-instructions">
                                        <v-icon size="64" color="grey lighten-2">mdi-grid</v-icon>
                                        <h3 class="grey--text text--lighten-1 mt-4">{{ GRID_COLUMNS }}×{{ GRID_ROWS }} Development Grid</h3>
                                        <p class="grey--text">{{ gridWidth }}×{{ gridHeight }} pixel prototyping space ({{ gridSize }}px per cell)</p>
                                        <p class="grey--text">Click "New Widget" to create your first widget</p>
                                        <p class="grey--text">Drag widgets to position them on the grid</p>
                                        <p class="grey--text text--darken-2 caption">Scroll to explore the full development area</p>
                                    </div>
                                </div>
                            </v-card-text>
                        </v-card>
                    </v-col>
                </v-row>

                <!-- Widget Creation Wizard -->
                <WidgetCreationWizard
                    v-model="showWizard"
                    :dashboard-config="dashboardConfig"
                    @widget-created="onWidgetCreated"
                />

                <!-- Layout Manager Dialog -->
                <LayoutManagerDialog
                    v-model="showLayoutManager"
                    :widgets="widgets"
                    @layout-updated="onLayoutUpdated"
                />

                <!-- Export Dialog -->
                <ExportDialog
                    v-model="showExportDialog"
                    :widgets="widgets"
                    :grid-layout="gridLayout"
                />
            </v-container>
        </div>
    </div>
</template>

<style scoped>
.widget-development-area {
  background-color: #f5f5f5;
}

.development-header {
  border-left: 4px solid var(--primary-color);
}

.development-title {
  font-size: 1.5rem;
  font-weight: 500;
}

.development-grid-container {
  min-height: 1600px; /* 16 * 100px - will be dynamic */
  overflow: auto; /* Enable scrolling for the larger grid */
  max-height: 80vh; /* Limit height to 80% of viewport */
  border: 1px solid #e0e0e0;
  border-radius: 4px;
}

.development-grid {
  position: relative;
  /* Dynamic width and height will be set via computed style */
  margin: 0 auto;
  border: 2px solid #ddd;
  background: #fff;
  /* min-width will be set dynamically */
}

.grid-lines {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
}

.grid-line {
  position: absolute;
  background-color: #f0f0f0;
}

.grid-line-horizontal {
  width: 100%;
  height: 1px;
}

.grid-line-vertical {
  height: 100%;
  width: 1px;
}

.grid-widget {
  position: absolute;
  border: 2px solid #e0e0e0;
  border-radius: 4px;
  background: #fff;
  cursor: move;
  transition: border-color 0.2s, box-shadow 0.2s;
  overflow: hidden;
}

.grid-widget:hover {
  border-color: #2196f3;
  box-shadow: 0 2px 8px rgba(33, 150, 243, 0.3);
}

.widget-selected {
  border-color: #2196f3 !important;
  box-shadow: 0 4px 12px rgba(33, 150, 243, 0.4) !important;
}

.widget-header {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  background: #f5f5f5;
  border-bottom: 1px solid #e0e0e0;
  font-size: 0.875rem;
  font-weight: 500;
}

.widget-action-btn {
  margin-left: 4px;
}

.widget-preview {
  padding: 8px;
  height: calc(100% - 41px);
  overflow: hidden;
}

.resize-handle {
  position: absolute;
  background: #2196f3;
  cursor: se-resize;
}

.resize-se {
  bottom: 0;
  right: 0;
  width: 12px;
  height: 12px;
  border-radius: 12px 0 0 0;
}

.grid-instructions {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
}

.development-preview {
  min-height: 600px;
}

.grid-config-panel {
  border-left: 4px solid var(--info-color, #2196F3);
}

.grid-config-title {
  font-size: 1.25rem;
  font-weight: 500;
}

.grid-preset-buttons {
  flex-wrap: wrap;
}

.grid-preset-buttons .v-btn {
  margin: 2px;
}

/* Layout Container Styles */
.widget-development-container {
  display: flex;
  min-height: 100vh;
  background-color: #f5f5f5;
  position: relative;
  width: 100%;
}

/* Toolbox Sidebar Styles */
.toolbox-sidebar {
  width: 280px;
  background: white;
  border-right: 1px solid #e0e0e0;
  box-shadow: 2px 0 8px rgba(0,0,0,0.1);
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  min-height: 100vh;
  z-index: 1000;
  transition: all 0.3s ease;
  overflow-y: auto;
}

.toolbox-sidebar.toolbox-collapsed {
  width: 48px;
}

.toolbox-header {
  display: flex;
  align-items: center;
  padding: 12px 8px;
  border-bottom: 1px solid #e0e0e0;
  background: #f8f9fa;
  min-height: 64px;
}

.toolbox-toggle {
  z-index: 1001;
}

.toolbox-title {
  display: flex;
  align-items: center;
  font-weight: 500;
  color: #7B1FA2;
  margin-left: 8px;
}

.toolbox-content {
  padding: 16px 8px;
  height: calc(100% - 64px);
  overflow-y: auto;
}

.toolbox-category {
  margin-bottom: 24px;
}

.category-title {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 12px;
  color: #424242;
  display: flex;
  align-items: center;
  border-bottom: 1px solid #e0e0e0;
  padding-bottom: 4px;
}

.component-group {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 8px;
}

.toolbox-component {
  cursor: grab;
  transition: transform 0.2s ease;
}

.toolbox-component:hover {
  transform: translateY(-1px);
}

.toolbox-component:active {
  cursor: grabbing;
  transform: translateY(0);
}

.component-card {
  min-height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #e0e0e0;
  transition: all 0.2s ease;
}

.component-card:hover {
  border-color: var(--primary-color, #1976D2);
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

/* Main Content Area Styles */
.main-content {
  margin-left: 280px;
  width: calc(100% - 280px);
  transition: all 0.3s ease;
  min-height: 100vh;
  padding: 20px;
  box-sizing: border-box;
}

.main-content.main-content-expanded {
  margin-left: 48px;
  width: calc(100% - 48px);
}

/* Ensure proper spacing for the widget development area within main content */
.main-content .widget-development-area {
  background-color: transparent;
  padding: 0;
  margin: 0;
  max-width: none;
}

/* Override Vuetify container styles to prevent conflicts */
.main-content .v-container.widget-development-area {
  padding-left: 0;
  padding-right: 0;
}
</style>

<script>
import DashboardOrchestrator from "@/components/layouts/DashboardOrchestrator.vue";
import WidgetCreationWizard from "./WidgetCreationWizard.vue";
import LayoutManagerDialog from "./LayoutManagerDialog.vue";
import ExportDialog from "./ExportDialog.vue";

// Import universal components for preview
import UniversalChart from "@/components/universal/UniversalChart.vue";
import UniversalTable from "@/components/universal/UniversalTable.vue";
import UniversalForm from "@/components/universal/UniversalForm.vue";
import UniversalComponent from "@/components/universal/UniversalComponent.vue";
import UniversalDataService from "@/services/UniversalDataService.js";

export default {
  name: "WidgetDevelopmentArea",
  components: {
    DashboardOrchestrator,
    WidgetCreationWizard,
    LayoutManagerDialog,
    ExportDialog,
    UniversalChart,
    UniversalTable,
    UniversalForm,
    UniversalComponent
  },
  
  props: {
        dashboardConfig: {
            type: Object,
            default: () => ({ widgets: [] })
        }
    },
  
  data() {
    return {
      widgets: [],
      widgetData: {},
      selectedWidget: null,
      isDirty: false,
      
      // Grid configuration - easily configurable
      gridConfig: {
        cellSize: 100, // Size of each grid cell in pixels
        columns: 16,   // Number of grid columns
        rows: 16,      // Number of grid rows
        minCellSize: 50,  // Minimum cell size
        maxCellSize: 150, // Maximum cell size
        minColumns: 8,    // Minimum grid columns
        maxColumns: 24,   // Maximum grid columns
        minRows: 8,       // Minimum grid rows
        maxRows: 24       // Maximum grid rows
      },
      
      // Show/hide grid configuration panel
      showGridConfig: false,
      
      // Show/hide component toolbox panel
      showToolbox: true,
      
      // Dialog states
      showWizard: false,
      showLayoutManager: false,
      showExportDialog: false,
      
      // Drag and drop state
      dragState: {
        isDragging: false,
        widget: null,
        startX: 0,
        startY: 0,
        offsetX: 0,
        offsetY: 0
      },
      
      // Resize state
      resizeState: {
        isResizing: false,
        widget: null,
        direction: null
      },
      
      // Component toolbox definitions
      formComponents: [
        {
          type: "text-field",
          name: "Text Field",
          icon: "mdi-form-textbox",
          color: "primary",
          template: '<v-text-field label="Text Field" outlined />',
          defaultProps: { label: "Text Field", outlined: true }
        },
        {
          type: "textarea",
          name: "Text Area",
          icon: "mdi-card-text",
          color: "primary",
          template: '<v-textarea label="Text Area" outlined />',
          defaultProps: { label: "Text Area", outlined: true }
        },
        {
          type: "select",
          name: "Select",
          icon: "mdi-form-dropdown",
          color: "primary",
          template: '<v-select :items="[\'Option 1\', \'Option 2\', \'Option 3\']" label="Select" outlined />',
          defaultProps: { label: "Select", outlined: true, items: ["Option 1", "Option 2", "Option 3"] }
        },
        {
          type: "checkbox",
          name: "Checkbox",
          icon: "mdi-checkbox-marked",
          color: "primary",
          template: '<v-checkbox label="Checkbox" />',
          defaultProps: { label: "Checkbox" }
        },
        {
          type: "radio-group",
          name: "Radio Group",
          icon: "mdi-radiobox-marked",
          color: "primary",
          template: '<v-radio-group v-model="radioValue"><v-radio label="Option 1" value="1" /><v-radio label="Option 2" value="2" /></v-radio-group>',
          defaultProps: { radioValue: "1" }
        },
        {
          type: "switch",
          name: "Switch",
          icon: "mdi-toggle-switch",
          color: "primary",
          template: '<v-switch label="Switch" />',
          defaultProps: { label: "Switch" }
        },
        {
          type: "slider",
          name: "Slider",
          icon: "mdi-tune-vertical",
          color: "primary",
          template: '<v-slider label="Slider" />',
          defaultProps: { label: "Slider", min: 0, max: 100 }
        },
        {
          type: "date-picker",
          name: "Date Picker",
          icon: "mdi-calendar",
          color: "primary",
          template: '<v-text-field label="Date" prepend-icon="mdi-calendar" readonly />',
          defaultProps: { label: "Date", readonly: true, prependIcon: "mdi-calendar" }
        }
      ],
      
      buttonComponents: [
        {
          type: "button",
          name: "Button",
          icon: "mdi-gesture-tap-button",
          color: "secondary",
          template: '<v-btn color="primary">Button</v-btn>',
          defaultProps: { color: "primary", label: "Button" }
        },
        {
          type: "button-outlined",
          name: "Outlined Button",
          icon: "mdi-button-cursor",
          color: "secondary",
          template: '<v-btn outlined color="primary">Outlined</v-btn>',
          defaultProps: { outlined: true, color: "primary", label: "Outlined" }
        },
        {
          type: "button-text",
          name: "Text Button",
          icon: "mdi-format-text",
          color: "secondary",
          template: '<v-btn text color="primary">Text Button</v-btn>',
          defaultProps: { text: true, color: "primary", label: "Text Button" }
        },
        {
          type: "icon-button",
          name: "Icon Button",
          icon: "mdi-circle-double",
          color: "secondary",
          template: "<v-btn icon><v-icon>mdi-heart</v-icon></v-btn>",
          defaultProps: { icon: true, iconName: "mdi-heart" }
        },
        {
          type: "fab",
          name: "FAB",
          icon: "mdi-plus-circle",
          color: "secondary",
          template: '<v-btn fab color="primary"><v-icon>mdi-plus</v-icon></v-btn>',
          defaultProps: { fab: true, color: "primary", iconName: "mdi-plus" }
        },
        {
          type: "chip",
          name: "Chip",
          icon: "mdi-label",
          color: "secondary",
          template: "<v-chip>Chip</v-chip>",
          defaultProps: { text: "Chip" }
        }
      ],
      
      displayComponents: [
        {
          type: "alert",
          name: "Alert",
          icon: "mdi-alert",
          color: "success",
          template: '<v-alert type="info">This is an alert message</v-alert>',
          defaultProps: { type: "info", text: "This is an alert message" }
        },
        {
          type: "card",
          name: "Card",
          icon: "mdi-card",
          color: "success",
          template: "<v-card><v-card-title>Card Title</v-card-title><v-card-text>Card content goes here</v-card-text></v-card>",
          defaultProps: { title: "Card Title", content: "Card content goes here" }
        },
        {
          type: "avatar",
          name: "Avatar",
          icon: "mdi-account-circle",
          color: "success",
          template: '<v-avatar color="primary"><v-icon dark>mdi-account</v-icon></v-avatar>',
          defaultProps: { color: "primary", iconName: "mdi-account" }
        },
        {
          type: "badge",
          name: "Badge",
          icon: "mdi-numeric-1-circle",
          color: "success",
          template: '<v-badge content="6" color="red"><v-icon large>mdi-email</v-icon></v-badge>',
          defaultProps: { content: "6", color: "red", iconName: "mdi-email" }
        },
        {
          type: "progress-linear",
          name: "Progress Bar",
          icon: "mdi-progress-check",
          color: "success",
          template: '<v-progress-linear value="75" />',
          defaultProps: { value: 75 }
        },
        {
          type: "progress-circular",
          name: "Progress Circle",
          icon: "mdi-progress-clock",
          color: "success",
          template: '<v-progress-circular value="75" />',
          defaultProps: { value: 75 }
        },
        {
          type: "list",
          name: "List",
          icon: "mdi-format-list-bulleted",
          color: "success",
          template: "<v-list><v-list-item><v-list-item-content><v-list-item-title>List Item 1</v-list-item-title></v-list-item-content></v-list-item></v-list>",
          defaultProps: { items: ["List Item 1", "List Item 2", "List Item 3"] }
        }
      ],
      
      layoutComponents: [
        {
          type: "container",
          name: "Container",
          icon: "mdi-view-dashboard-outline",
          color: "warning",
          template: "<v-container><p>Container content</p></v-container>",
          defaultProps: { content: "Container content" }
        },
        {
          type: "row",
          name: "Row",
          icon: "mdi-view-sequential",
          color: "warning",
          template: "<v-row><v-col><p>Column content</p></v-col></v-row>",
          defaultProps: { content: "Column content" }
        },
        {
          type: "col",
          name: "Column",
          icon: "mdi-view-column",
          color: "warning",
          template: "<v-col><p>Column content</p></v-col>",
          defaultProps: { content: "Column content", cols: 12 }
        },
        {
          type: "spacer",
          name: "Spacer",
          icon: "mdi-arrow-expand-horizontal",
          color: "warning",
          template: "<v-spacer />",
          defaultProps: {}
        },
        {
          type: "divider",
          name: "Divider",
          icon: "mdi-minus",
          color: "warning",
          template: "<v-divider />",
          defaultProps: {}
        },
        {
          type: "sheet",
          name: "Sheet",
          icon: "mdi-application",
          color: "warning",
          template: '<v-sheet class="pa-4"><p>Sheet content</p></v-sheet>',
          defaultProps: { content: "Sheet content" }
        }
      ]
    };
  },
  
  computed: {
    // Computed properties for easy access to grid config
    gridSize() {
      return this.gridConfig.cellSize;
    },
    
    GRID_COLUMNS() {
      return this.gridConfig.columns;
    },
    
    GRID_ROWS() {
      return this.gridConfig.rows;
    },
    
    gridWidth() {
      return this.gridConfig.columns * this.gridConfig.cellSize;
    },
    
    gridHeight() {
      return this.gridConfig.rows * this.gridConfig.cellSize;
    },
    
    gridLayout() {
      return this.widgets.map(widget => ({
        id: widget.id,
        x: widget.gridX || 0,
        y: widget.gridY || 0,
        w: widget.gridW || 2,
        h: widget.gridH || 2
      }));
    }
  },
    watch: {
        dashboardConfig: {
            handler() {
                // No-op, but watcher is kept for potential future debugging
            },
            deep: true
        }
    },
  
  mounted() {
    this.loadGridConfiguration(); // Load saved grid config first
    this.loadDevelopmentArea();
    this.setupGlobalEvents();
  },
  
  beforeDestroy() {
    this.removeGlobalEvents();
  },
  
  methods: {
    // Grid Configuration
    onGridConfigChange() {
      // Validate grid configuration
      const DEFAULT_COLUMNS = 16;
      const DEFAULT_ROWS = 16;
      const DEFAULT_CELL_SIZE = 100;
      
      this.gridConfig.columns = Math.max(this.gridConfig.minColumns, 
        Math.min(this.gridConfig.maxColumns, this.gridConfig.columns || DEFAULT_COLUMNS));
      this.gridConfig.rows = Math.max(this.gridConfig.minRows, 
        Math.min(this.gridConfig.maxRows, this.gridConfig.rows || DEFAULT_ROWS));
      this.gridConfig.cellSize = Math.max(this.gridConfig.minCellSize, 
        Math.min(this.gridConfig.maxCellSize, this.gridConfig.cellSize || DEFAULT_CELL_SIZE));
      
      // Adjust widgets that are outside the new grid bounds
      this.adjustWidgetsToGrid();
      
      // Save configuration to localStorage
      this.saveGridConfiguration();
    },
    
    applyGridPreset(preset) {
      const presets = {
        small: { columns: 12, rows: 12, cellSize: 80 },
        medium: { columns: 16, rows: 16, cellSize: 100 },
        large: { columns: 20, rows: 20, cellSize: 100 },
        xlarge: { columns: 24, rows: 24, cellSize: 120 }
      };
      
      if (presets[preset]) {
        Object.assign(this.gridConfig, presets[preset]);
        this.onGridConfigChange();
      }
    },
    
    adjustWidgetsToGrid() {
      // Ensure all widgets fit within the new grid bounds
      this.widgets.forEach(widget => {
        if (widget.gridX + widget.gridW > this.GRID_COLUMNS) {
          widget.gridX = Math.max(0, this.GRID_COLUMNS - widget.gridW);
        }
        if (widget.gridY + widget.gridH > this.GRID_ROWS) {
          widget.gridY = Math.max(0, this.GRID_ROWS - widget.gridH);
        }
      });
    },
    
    saveGridConfiguration() {
      try {
        localStorage.setItem("dev-area-grid-config", JSON.stringify(this.gridConfig));
      } catch (error) {
        console.warn("Failed to save grid configuration:", error);
      }
    },
    
    loadGridConfiguration() {
      try {
        const saved = localStorage.getItem("dev-area-grid-config");
        if (saved) {
          const config = JSON.parse(saved);
          // Only load valid configuration values
          Object.keys(config).forEach(key => {
            if (Object.prototype.hasOwnProperty.call(this.gridConfig, key)) {
              this.gridConfig[key] = config[key];
            }
          });
          this.onGridConfigChange(); // Validate loaded config
        }
      } catch (error) {
        console.warn("Failed to load grid configuration:", error);
      }
    },
    
    // Widget Management
    openWidgetWizard() {
      this.showWizard = true;
    },
    
    onWidgetCreated(widgetConfig) {
      const newWidget = {
        ...widgetConfig,
        id: `dev-widget-${Date.now()}`,
        gridX: 0,
        gridY: 0,
        gridW: 2,
        gridH: 2,
        isDevelopment: true
      };
      
      // Find empty spot on grid
      const emptySpot = this.findEmptyGridSpot(newWidget.gridW, newWidget.gridH);
      newWidget.gridX = emptySpot.x;
      newWidget.gridY = emptySpot.y;
      
      this.widgets.push(newWidget);
      this.selectWidget(newWidget.id);
      this.markDirty();
      this.saveDevelopmentArea();
      this.refreshAllWidgetData();
    },
    
    editWidget(widget) {
      // Open widget configuration editor
      this.$emit("edit-widget", widget);
    },
    
    deleteWidget(widgetId) {
      const index = this.widgets.findIndex(w => w.id === widgetId);
      if (index > -1) {
        this.widgets.splice(index, 1);
        if (this.selectedWidget === widgetId) {
          this.selectedWidget = null;
        }
        this.markDirty();
        this.saveDevelopmentArea();
      }
    },
    
    selectWidget(widgetId) {
      this.selectedWidget = this.selectedWidget === widgetId ? null : widgetId;
    },
    
    // Grid System
    getWidgetStyle(widget) {
      return {
        left: `${widget.gridX * this.gridSize}px`,
        top: `${widget.gridY * this.gridSize}px`,
        width: `${widget.gridW * this.gridSize}px`,
        height: `${widget.gridH * this.gridSize}px`
      };
    },
    
    findEmptyGridSpot(width, height) {
      // Simple algorithm to find empty spot
      for (let y = 0; y <= this.GRID_ROWS - height; y++) {
        for (let x = 0; x <= this.GRID_COLUMNS - width; x++) {
          if (this.isGridSpotEmpty(x, y, width, height)) {
            return { x, y };
          }
        }
      }
      return { x: 0, y: 0 }; // Fallback to origin
    },
    
    isGridSpotEmpty(x, y, width, height, excludeWidgetId = null) {
      return !this.widgets.some(widget => {
        // Skip the widget being dragged
        if (excludeWidgetId && widget.id === excludeWidgetId) {
          return false;
        }
        
        return !(
          x >= widget.gridX + widget.gridW ||
          x + width <= widget.gridX ||
          y >= widget.gridY + widget.gridH ||
          y + height <= widget.gridY
        );
      });
    },
    
    snapToGrid(x, y) {
      return {
        x: Math.round(x / this.gridSize),
        y: Math.round(y / this.gridSize)
      };
    },
    
    // Drag and Drop
    startDrag(widget, event) {
      if (event.target.closest(".widget-action-btn") || event.target.closest(".resize-handle")) {
        return;
      }
      
      this.selectWidget(widget.id);
      
      const widgetRect = event.currentTarget.getBoundingClientRect();
      
      this.dragState = {
        isDragging: true,
        widget,
        startX: event.clientX,
        startY: event.clientY,
        startGridX: widget.gridX,
        startGridY: widget.gridY,
        offsetX: event.clientX - widgetRect.left,
        offsetY: event.clientY - widgetRect.top
      };
      
      document.addEventListener("mousemove", this.onDragMove);
      document.addEventListener("mouseup", this.onDragEnd);
      event.preventDefault();
    },
    
    onDragMove(event) {
      if (!this.dragState.isDragging) return;
      
      const rect = this.$refs.developmentGrid.getBoundingClientRect();
      const x = event.clientX - rect.left - this.dragState.offsetX;
      const y = event.clientY - rect.top - this.dragState.offsetY;
      
      const snapped = this.snapToGrid(x, y);
      
      // Constrain to grid bounds
      const constrainedX = Math.max(0, Math.min(this.GRID_COLUMNS - this.dragState.widget.gridW, snapped.x));
      const constrainedY = Math.max(0, Math.min(this.GRID_ROWS - this.dragState.widget.gridH, snapped.y));
      
      // Check for collisions with other widgets
      if (this.isGridSpotEmpty(constrainedX, constrainedY, this.dragState.widget.gridW, this.dragState.widget.gridH, this.dragState.widget.id)) {
        this.dragState.widget.gridX = constrainedX;
        this.dragState.widget.gridY = constrainedY;
      }
    },
    
    onDragEnd() {
      if (this.dragState.isDragging) {
        this.dragState.isDragging = false;
        this.markDirty();
        this.saveDevelopmentArea();
      }
      
      document.removeEventListener("mousemove", this.onDragMove);
      document.removeEventListener("mouseup", this.onDragEnd);
    },
    
    onWidgetDragStart(widget, event) {
      event.dataTransfer.setData("text/plain", widget.id);
    },
    
    // Component Toolbox Methods
    onComponentDragStart(component, event) {
      // Store component data for drop handling
      event.dataTransfer.setData("application/json", JSON.stringify({
        type: "component",
        componentData: component
      }));
      event.dataTransfer.effectAllowed = "copy";
    },
    
    // Enhanced grid drop to handle both widgets and components
    onGridDrop(event) {
      event.preventDefault();
      
      try {
        // First, try to parse as component data
        const transferData = event.dataTransfer.getData("application/json");
        if (transferData) {
          const data = JSON.parse(transferData);
          if (data.type === "component") {
            this.createComponentWidget(data.componentData, event);
            return;
          }
        }
      } catch (e) {
        // If JSON parsing fails, fall back to widget drag behavior
      }
      
      // Existing widget drag behavior
      const widgetId = event.dataTransfer.getData("text/plain");
      const widget = this.widgets.find(w => w.id === widgetId);
      
      if (widget) {
        const rect = this.$refs.developmentGrid.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        const snapped = this.snapToGrid(x, y);
        
        widget.gridX = Math.max(0, Math.min(this.GRID_COLUMNS - widget.gridW, snapped.x));
        widget.gridY = Math.max(0, Math.min(this.GRID_ROWS - widget.gridH, snapped.y));
        
        this.markDirty();
        this.saveDevelopmentArea();
      }
    },
    
    createComponentWidget(component, event) {
      const rect = this.$refs.developmentGrid.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      const snapped = this.snapToGrid(x, y);
      
      const BASE_36 = 36;
      const ID_SUFFIX_LENGTH = 9;
      const DEFAULT_WIDGET_WIDTH = 4;
      const DEFAULT_WIDGET_HEIGHT = 2;
      
      // Create a new widget from the component
      const newWidget = {
        id: "component-" + Date.now() + "-" + Math.random().toString(BASE_36).substr(2, ID_SUFFIX_LENGTH),
        title: component.name,
        component: "UniversalComponent", // Use UniversalComponent for UI elements
        icon: component.icon,
        gridX: Math.max(0, Math.min(this.GRID_COLUMNS - DEFAULT_WIDGET_WIDTH, snapped.x)),
        gridY: Math.max(0, Math.min(this.GRID_ROWS - DEFAULT_WIDGET_HEIGHT, snapped.y)),
        gridW: DEFAULT_WIDGET_WIDTH,
        gridH: DEFAULT_WIDGET_HEIGHT,
        visible: true,
        isDevelopment: true,
        dataSource: null,
        description: "Custom " + component.name + " component",
        props: {
          componentType: component.type,
          componentTemplate: component.template,
          ...component.defaultProps
        }
      };
      
      this.widgets.push(newWidget);
      this.markDirty();
      this.saveDevelopmentArea();
    },
    
    // Resize
    startResize(widget, direction, event) {
      this.resizeState = {
        isResizing: true,
        widget,
        direction,
        startX: event.clientX,
        startY: event.clientY,
        startW: widget.gridW,
        startH: widget.gridH
      };
      
      document.addEventListener("mousemove", this.onResizeMove);
      document.addEventListener("mouseup", this.onResizeEnd);
      event.preventDefault();
    },
    
    onResizeMove(event) {
      if (!this.resizeState.isResizing) return;
      
      const deltaX = event.clientX - this.resizeState.startX;
      const deltaY = event.clientY - this.resizeState.startY;
      
      const deltaGridX = Math.round(deltaX / this.gridSize);
      const deltaGridY = Math.round(deltaY / this.gridSize);
      
      if (this.resizeState.direction === "se") {
        const newW = Math.max(1, this.resizeState.startW + deltaGridX);
        const newH = Math.max(1, this.resizeState.startH + deltaGridY);
        
        // Constrain to grid bounds
        this.resizeState.widget.gridW = Math.min(newW, this.GRID_COLUMNS - this.resizeState.widget.gridX);
        this.resizeState.widget.gridH = Math.min(newH, this.GRID_ROWS - this.resizeState.widget.gridY);
      }
    },
    
    onResizeEnd() {
      if (this.resizeState.isResizing) {
        this.resizeState.isResizing = false;
        this.markDirty();
        this.saveDevelopmentArea();
      }
      
      document.removeEventListener("mousemove", this.onResizeMove);
      document.removeEventListener("mouseup", this.onResizeEnd);
    },
    
    // Layout Management
    openLayoutManager() {
      this.showLayoutManager = true;
    },
    
    onLayoutUpdated(newLayout) {
      newLayout.forEach(item => {
        const widget = this.widgets.find(w => w.id === item.id);
        if (widget) {
          widget.gridX = item.x;
          widget.gridY = item.y;
          widget.gridW = item.w;
          widget.gridH = item.h;
        }
      });
      
      this.markDirty();
      this.saveDevelopmentArea();
    },
    
    // Export
    exportDevelopmentArea() {
      this.showExportDialog = true;
    },
    
    // Clear
    clearDevelopmentArea() {
      if (confirm("Are you sure you want to remove all widgets from the development area? This action cannot be undone.")) {
        this.widgets = [];
        this.selectedWidget = null;
        this.markDirty();
        this.saveDevelopmentArea();
      }
    },
    
    // State Management
    markDirty() {
      this.isDirty = true;
      const DIRTY_TIMEOUT = 2000;
      setTimeout(() => {
        this.isDirty = false;
      }, DIRTY_TIMEOUT);
    },
    
    saveDevelopmentArea() {
      localStorage.setItem("widget-development-area", JSON.stringify({
        widgets: this.widgets,
        timestamp: Date.now()
      }));
    },
    
    loadDevelopmentArea() {
      const saved = localStorage.getItem("widget-development-area");
      if (saved) {
        try {
          const data = JSON.parse(saved);
          this.widgets = data.widgets || [];
        } catch (error) {
          // eslint-disable-next-line no-console
          console.error("Failed to load development area:", error);
        }
      }
      this.refreshAllWidgetData();
    },
    
    // Global Events
    setupGlobalEvents() {
      document.addEventListener("keydown", this.onKeyDown);
    },
    
    removeGlobalEvents() {
      document.removeEventListener("keydown", this.onKeyDown);
    },

    async refreshAllWidgetData() {
        const dataSourcesNeeded = [...new Set(this.widgets.map(w => w.dataSource).filter(Boolean))];
        if (dataSourcesNeeded.length === 0) return;

        try {
            const dataPromises = dataSourcesNeeded.map(async dataSource => {
                try {
                    const data = await UniversalDataService.fetchData(dataSource, {});
                    return { dataSource, data };
                } catch (error) {
                    console.error(`Error fetching data for ${dataSource}:`, error);
                    return { dataSource, data: null };
                }
            });

            const results = await Promise.all(dataPromises);
            const newData = {};

            this.widgets.forEach(widget => {
                const result = results.find(r => r.dataSource === widget.dataSource);
                if (result && result.data) {
                    newData[widget.id] = this.transformDataForWidget(widget, result.data);
                } else {
                    newData[widget.id] = {
                        chart: { labels: [], datasets: [] },
                        table: [],
                        raw: [],
                        metadata: {}
                    };
                }
            });
            this.widgetData = newData;
            this.$forceUpdate();
        } catch (error) {
            console.error("Error refreshing widget data in dev area:", error);
        }
    },

    transformDataForWidget(widget, data) {
        const result = {
            chart: data.chart || { labels: [], datasets: [] },
            table: data.table || [],
            raw: data.raw,
            metadata: data.metadata
        };
        return result;
    },

    getWidgetPreviewProps(widget) {
        const DEFAULT_WIDGET_HEIGHT = 200;
        const props = {
            ...(widget.props || {}),
            dataSource: widget.dataSource,
            previewMode: true,
            height: widget.height || DEFAULT_WIDGET_HEIGHT
        };

        const data = this.widgetData[widget.id];

        if (data) {
            if (widget.component === "UniversalChart") {
                props.data = data.chart;
            } else if (widget.component === "UniversalTable") {
                props.items = data.table;
                props.headers = widget.headers || [];
            }
        }

        return props;
    },
    
    onKeyDown(event) {
      if (this.selectedWidget && event.key === "Delete") {
        this.deleteWidget(this.selectedWidget);
      }
    }
  }
};
</script>

