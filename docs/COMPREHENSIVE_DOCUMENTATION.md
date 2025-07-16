# 📚 Release Planning Framework - Comprehensive Documentation

## Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [Component System](#component-system)
3. [Configuration Management](#configuration-management)
4. [Boolean Controls & Conditional Rendering](#boolean-controls--conditional-rendering)
5. [Data Flow & State Management](#data-flow--state-management)
6. [Widget System](#widget-system)
7. [Styling & Theming](#styling--theming)
8. [API Integration](#api-integration)
9. [Responsive Design](#responsive-design)
10. [Development Guide](#development-guide)

---

## Architecture Overview

### Project Structure
```
src/
├── components/
│   ├── universal/          # Reusable UI components
│   ├── release-planning/   # Domain-specific components
│   ├── layouts/           # Layout containers
│   └── dev/               # Development tools
├── config/                # Configuration files
├── data/                  # Data services
├── services/              # Business logic services
├── assets/styles/         # CSS & styling
└── static/               # Static assets
```

### Core Principles
- **Component-based Architecture**: Modular, reusable Vue.js components
- **Configuration-driven**: Centralized widget and layout configuration
- **Universal Components**: Generic components adaptable to any data structure
- **Responsive-first**: Mobile-first design with progressive enhancement
- **API-agnostic**: Works with mock data or live APIs

---

## Component System

### Universal Components
These components adapt to any data structure through configuration:

#### UniversalTable
```vue
<UniversalTable
  :headers="tableHeaders"
  :items="tableData"
  :searchable="true"
  :filterable="true"
  :expandable="false"
  :show-export-button="true"
  :show-controls="true"
  @row-click="handleRowClick"
  @export="handleExport"
/>
```

**Boolean Props:**
- `searchable`: Enables search functionality
- `filterable`: Shows column filter dropdowns
- `expandable`: Allows row expansion for details
- `show-export-button`: Shows PDF/CSV export options
- `show-controls`: Shows the entire control panel

#### UniversalChart
```vue
<UniversalChart
  :data="chartData"
  :options="chartOptions"
  type="line"
  :height="400"
  :show-export-button="true"
  :loading="false"
/>
```

**Boolean Props:**
- `show-export-button`: Shows chart export functionality
- `loading`: Shows loading state

#### UniversalFilterControls
```vue
<UniversalFilterControls
  title="Filter Controls"
  subtitle="Select your criteria"
  :filters="filterConfig"
  :filter-values="filterValues"
  :show-summary="true"
  @filter-change="handleFilterChange"
/>
```

**Boolean Props:**
- `show-summary`: Shows active filter summary

#### UniversalForm
```vue
<UniversalForm
  :fields="formFields"
  :initial-values="formData"
  :show-submit="true"
  :show-reset="true"
  :show-cancel="false"
  @submit="handleSubmit"
/>
```

**Boolean Props:**
- `show-submit`: Shows submit button
- `show-reset`: Shows reset button  
- `show-cancel`: Shows cancel button

### Domain-Specific Components

#### ReleasePlannerWidget
The main dashboard widget with comprehensive release planning functionality.

```vue
<ReleasePlannerWidget
  :hide-header="false"
/>
```

**Boolean Props:**
- `hide-header`: Controls widget header visibility

#### ChangeActionCell
Specialized table cell for displaying Change Action data.

---

## Configuration Management

### Widget Registry
Central configuration for all widgets in `/src/config/WidgetRegistry.js`:

```javascript
export const WIDGET_DEFINITIONS = {
    enhancedPartsPlanner: {
        component: "ReleasePlannerWidget",
        title: "Release Planning CA",
        icon: "mdi-clipboard-list",
        props: {
            hideHeader: true    // Boolean control
        },
        dataSource: "parts",
        filters: ["program", "phase", "organization"],
        layout: { 
            minHeight: 600, 
            flex: 3,
            breakpoints: {
                mobile: { flex: 1, height: 500 },
                tablet: { flex: 2, height: 550 },
                desktop: { flex: 3, height: 600 }
            }
        },
        standalone: true,
        visible: true       // Boolean control
    }
}
```

### Widget Schemas
Data structure definitions in `/src/config/WidgetSchemas.js`:

```javascript
export const WIDGET_SCHEMAS = {
    table: {
        headers: Array,
        searchable: Boolean,
        filterable: Boolean,
        expandable: Boolean,
        showExportButton: Boolean
    },
    chart: {
        type: String,
        height: Number,
        showExportButton: Boolean,
        loading: Boolean
    }
}
```

---

## Boolean Controls & Conditional Rendering

### Vue.js Conditional Directives

#### v-if vs v-show
```vue
<!-- v-if: Element not rendered in DOM when false -->
<div v-if="showHeader">
  This is completely removed when showHeader is false
</div>

<!-- v-show: Element always in DOM, visibility toggled -->
<div v-show="isVisible">
  This stays in DOM but becomes hidden when isVisible is false
</div>
```

### Component Boolean Props

#### Table Component Example
```vue
<template>
  <!-- Control Panel: Show/hide entire controls section -->
  <div v-if="showControls" class="table-controls">
    
    <!-- Search Field: Conditional search functionality -->
    <v-text-field
      v-if="searchable"
      v-model="searchQuery"
      placeholder="Search..."
    />
    
    <!-- Filter Dropdown: Conditional filtering -->
    <v-select
      v-if="filterable && filterOptions.length > 0"
      v-model="selectedFilter"
      :items="filterOptions"
    />
    
    <!-- Export Menu: Conditional export functionality -->
    <v-menu v-if="showExportButton" bottom left>
      <template #activator="{ on, attrs }">
        <v-btn icon v-bind="attrs" v-on="on">
          <v-icon>mdi-download</v-icon>
        </v-btn>
      </template>
      <v-list>
        <v-list-item @click="exportToPDF">PDF</v-list-item>
        <v-list-item @click="exportToCSV">CSV</v-list-item>
      </v-list>
    </v-menu>
    
  </div>
  
  <!-- Expandable Rows: Conditional row expansion -->
  <template v-if="expandable" #expanded-item="{ item }">
    <div class="expanded-content">
      {{ item.details }}
    </div>
  </template>
</template>

<script>
export default {
  props: {
    // Boolean props for conditional rendering
    searchable: { type: Boolean, default: true },
    filterable: { type: Boolean, default: true },
    expandable: { type: Boolean, default: false },
    showExportButton: { type: Boolean, default: true },
    showControls: { type: Boolean, default: true }
  }
}
</script>
```

#### Form Component Example
```vue
<template>
  <!-- Form Header: Optional title section -->
  <div v-if="title" class="form-header">
    <h3>{{ title }}</h3>
    <p v-if="description">{{ description }}</p>
  </div>
  
  <!-- Dynamic Field Rendering -->
  <div v-for="field in fields" :key="field.name">
    <!-- Text Input: Conditional field types -->
    <v-text-field
      v-if="field.type === 'text' || field.type === 'email'"
      v-model="formData[field.name]"
      :label="field.label"
      :type="field.type"
      :required="field.required"
    />
    
    <!-- Select Input: Conditional dropdown -->
    <v-select
      v-else-if="field.type === 'select'"
      v-model="formData[field.name]"
      :items="field.options"
      :label="field.label"
    />
  </div>
  
  <!-- Action Buttons: Conditional button display -->
  <div class="form-actions">
    <v-btn
      v-if="showSubmit"
      color="primary"
      @click="handleSubmit"
    >
      Submit
    </v-btn>
    
    <v-btn
      v-if="showReset"
      color="secondary"
      @click="handleReset"
    >
      Reset
    </v-btn>
    
    <v-btn
      v-if="showCancel"
      text
      @click="handleCancel"
    >
      Cancel
    </v-btn>
  </div>
  
  <!-- Status Messages: Conditional feedback -->
  <v-alert
    v-if="successMessage"
    type="success"
    dismissible
  >
    {{ successMessage }}
  </v-alert>
  
  <v-alert
    v-if="errorMessage"
    type="error"
    dismissible
  >
    {{ errorMessage }}
  </v-alert>
</template>
```

### Advanced Boolean Patterns

#### Computed Boolean Properties
```javascript
computed: {
  // Dynamic boolean based on data state
  hasData() {
    return this.items && this.items.length > 0;
  },
  
  // Complex boolean logic
  showAdvancedFeatures() {
    return this.userRole === 'admin' && this.hasData && this.featureEnabled;
  },
  
  // Responsive boolean
  isMobile() {
    return this.$vuetify.breakpoint.mobile;
  }
}
```

#### Method-based Boolean Controls
```javascript
methods: {
  // Dynamic boolean methods
  shouldShowExport(item) {
    return item.status === 'completed' && this.userCanExport;
  },
  
  // Toggle boolean state
  toggleVisibility() {
    this.isVisible = !this.isVisible;
  },
  
  // Conditional method execution
  conditionalAction() {
    if (this.isEnabled && this.hasPermission) {
      this.performAction();
    }
  }
}
```

---

## Data Flow & State Management

### Component Data Flow
```
Parent Component
    ↓ props
Child Component
    ↓ emit events
Parent Component
    ↓ update state
Re-render Components
```

### Filter State Management
```javascript
// Parent component manages filter state
data() {
  return {
    filterValues: {
      program: "",
      phase: "",
      organization: "All"
    }
  }
},

// Child components receive filter state as props
computed: {
  filteredData() {
    return this.applyFilters(this.rawData, this.filterValues);
  }
}
```

### Boolean State Patterns
```javascript
data() {
  return {
    // UI state booleans
    loading: false,
    showDialog: false,
    isExpanded: false,
    
    // Feature toggle booleans
    enableAdvancedMode: false,
    showDebugInfo: false,
    
    // Permission booleans
    canEdit: false,
    canDelete: false,
    canExport: true
  }
}
```

---

## Widget System

### Widget Definition Structure
```javascript
{
  component: "ComponentName",        // Vue component name
  title: "Widget Title",            // Display title
  icon: "mdi-icon-name",            // Material Design icon
  description: "Widget description", // Help text
  category: "category",             // Widget category
  props: {                          // Component props
    hideHeader: Boolean,            // Boolean controls
    showExportButton: Boolean
  },
  dataSource: "dataSourceName",     // Data binding
  filters: ["filter1", "filter2"], // Available filters
  layout: {                         // Layout configuration
    minHeight: Number,
    flex: Number,
    breakpoints: Object
  },
  standalone: Boolean,              // Self-contained widget
  visible: Boolean                  // Widget visibility
}
```

### Widget Registration
```javascript
// Register new widget
WIDGET_DEFINITIONS.newWidget = {
  component: "MyNewWidget",
  title: "My New Widget",
  props: {
    showAdvanced: true,     // Enable advanced features
    readOnly: false         // Allow editing
  },
  visible: true
};
```

### Dynamic Widget Loading
```vue
<component
  :is="widget.component"
  v-bind="widget.props"
  :visible="widget.visible"
  @update="handleWidgetUpdate"
/>
```

---

## Styling & Theming

### CSS Architecture
The framework uses a utility-first CSS approach with semantic design tokens:

#### CSS Custom Properties (Variables)
```css
:root {
  /* Boolean-controlled features */
  --show-animations: 1;      /* 1 = enabled, 0 = disabled */
  --enable-shadows: 1;
  --mobile-layout: 0;
  
  /* Design tokens */
  --space-1: 4px;
  --space-2: 8px;
  --blue-primary: #1976d2;
  --transition: all 0.2s ease;
}
```

#### Utility Classes
```css
/* Layout utilities */
.flex { display: flex; }
.flex-col { flex-direction: column; }
.flex-center { align-items: center; justify-content: center; }

/* Conditional utilities */
.show-on-mobile { display: none; }
.hide-on-mobile { display: block; }

@media (max-width: 600px) {
  .show-on-mobile { display: block; }
  .hide-on-mobile { display: none; }
}
```

#### Component-Specific Styles
```css
/* Boolean-controlled visibility */
.widget-header[data-visible="false"] {
  display: none;
}

.export-button[data-enabled="true"] {
  opacity: 1;
  pointer-events: auto;
}

.export-button[data-enabled="false"] {
  opacity: 0.5;
  pointer-events: none;
}
```

---

## API Integration

### Configuration
```javascript
// /src/config/ApiConfig.js
export const USE_MOCK_DATA = true;    // Boolean: Use mock vs live data

export const API_CONFIG = {
  baseURL: 'https://api.example.com',
  timeout: 5000,
  retries: 3,
  enableLogging: true,        // Boolean: API call logging
  enableCaching: true,        // Boolean: Response caching
  enableOfflineMode: false    // Boolean: Offline support
};
```

### Data Service Pattern
```javascript
// Boolean-controlled data fetching
class DataService {
  async fetchData(endpoint, useCache = true) {
    // Check boolean flags
    if (USE_MOCK_DATA) {
      return this.getMockData(endpoint);
    }
    
    if (useCache && API_CONFIG.enableCaching) {
      const cached = this.getFromCache(endpoint);
      if (cached) return cached;
    }
    
    return this.fetchFromAPI(endpoint);
  }
}
```

---

## Responsive Design

### Breakpoint System
```javascript
// Vuetify breakpoints
const breakpoints = {
  xs: 0,      // < 600px
  sm: 600,    // 600px - 960px
  md: 960,    // 960px - 1264px
  lg: 1264,   // 1264px - 1904px
  xl: 1904    // > 1904px
};
```

### Responsive Boolean Logic
```vue
<template>
  <!-- Desktop layout -->
  <div v-if="$vuetify.breakpoint.mdAndUp" class="desktop-layout">
    <widget-grid :columns="3" />
  </div>
  
  <!-- Mobile layout -->
  <div v-else class="mobile-layout">
    <widget-stack />
  </div>
  
  <!-- Conditional features based on screen size -->
  <advanced-chart v-if="!$vuetify.breakpoint.mobile" />
  <simple-chart v-else />
</template>

<script>
computed: {
  isMobileView() {
    return this.$vuetify.breakpoint.mobile;
  },
  
  showAdvancedFeatures() {
    return !this.isMobileView && this.userPreferences.enableAdvanced;
  }
}
</script>
```

### CSS Media Queries
```css
/* Boolean-controlled responsive features */
@media (max-width: 600px) {
  .flexible-filters { 
    flex-direction: column !important; 
  }
  
  .hide-on-mobile { 
    display: none !important; 
  }
  
  .compact-on-mobile {
    padding: var(--space-2) !important;
    font-size: 0.875rem !important;
  }
}

@media (min-width: 961px) {
  .desktop-only { 
    display: block !important; 
  }
  
  .enhanced-layout {
    grid-template-columns: repeat(3, 1fr) !important;
  }
}
```

---

## Development Guide

### Adding Boolean Controls

#### 1. Define Props
```javascript
// In your component
export default {
  props: {
    showAdvancedMode: { 
      type: Boolean, 
      default: false 
    },
    enableExport: { 
      type: Boolean, 
      default: true 
    },
    readOnlyMode: { 
      type: Boolean, 
      default: false 
    }
  }
}
```

#### 2. Implement Conditional Rendering
```vue
<template>
  <!-- Feature toggle -->
  <div v-if="showAdvancedMode" class="advanced-controls">
    <advanced-settings />
  </div>
  
  <!-- Conditional functionality -->
  <v-btn 
    v-if="enableExport && !readOnlyMode"
    @click="exportData"
  >
    Export
  </v-btn>
  
  <!-- Conditional styling -->
  <input 
    :readonly="readOnlyMode"
    :class="{ 'read-only': readOnlyMode }"
  />
</template>
```

#### 3. Update Widget Registry
```javascript
// Register widget with boolean props
WIDGET_DEFINITIONS.myWidget = {
  component: "MyWidget",
  props: {
    showAdvancedMode: false,
    enableExport: true,
    readOnlyMode: false
  }
};
```

### Boolean Best Practices

#### 1. Naming Conventions
```javascript
// Use clear, descriptive names
✅ showHeader, enableExport, isVisible
❌ header, export, visible

// Use consistent prefixes
✅ show*, enable*, is*, has*, can*
❌ mixed naming patterns
```

#### 2. Default Values
```javascript
// Provide sensible defaults
props: {
  showControls: { type: Boolean, default: true },   // Show by default
  enableDebug: { type: Boolean, default: false },   // Hide by default
  isRequired: { type: Boolean, default: false }     // Optional by default
}
```

#### 3. Documentation
```javascript
// Document boolean purpose
props: {
  /**
   * Controls visibility of the export functionality
   * @type {Boolean}
   * @default true
   */
  showExportButton: { 
    type: Boolean, 
    default: true 
  }
}
```

### Testing Boolean Controls

#### Unit Tests
```javascript
// Test boolean prop behavior
it('should show export button when showExportButton is true', () => {
  const wrapper = mount(Component, {
    propsData: { showExportButton: true }
  });
  
  expect(wrapper.find('.export-button').exists()).toBe(true);
});

it('should hide export button when showExportButton is false', () => {
  const wrapper = mount(Component, {
    propsData: { showExportButton: false }
  });
  
  expect(wrapper.find('.export-button').exists()).toBe(false);
});
```

---

## Advanced Features

### Dynamic Boolean Configuration
```javascript
// Runtime boolean configuration
const widgetConfig = {
  features: {
    enableSearch: user.hasPermission('search'),
    showExport: user.hasPermission('export'),
    allowEdit: user.role === 'admin'
  }
};

// Apply to widget
<MyWidget v-bind="widgetConfig.features" />
```

### Boolean State Persistence
```javascript
// Save boolean preferences
methods: {
  savePreferences() {
    const preferences = {
      showAdvancedMode: this.showAdvancedMode,
      enableNotifications: this.enableNotifications
    };
    
    localStorage.setItem('userPreferences', JSON.stringify(preferences));
  },
  
  loadPreferences() {
    const saved = JSON.parse(localStorage.getItem('userPreferences') || '{}');
    this.showAdvancedMode = saved.showAdvancedMode ?? false;
    this.enableNotifications = saved.enableNotifications ?? true;
  }
}
```

### Conditional Component Loading
```javascript
// Dynamic imports based on booleans
computed: {
  chartComponent() {
    if (this.enableAdvancedCharts) {
      return () => import('@/components/AdvancedChart.vue');
    }
    return () => import('@/components/SimpleChart.vue');
  }
}
```

---

## Summary

The Release Planning Framework provides a flexible, configuration-driven approach to building dashboards with extensive boolean control systems. Key features include:

- **Universal Components**: Adaptable to any data structure
- **Boolean-Driven UI**: Fine-grained control over feature visibility
- **Configuration Management**: Centralized widget and layout control
- **Responsive Design**: Mobile-first with progressive enhancement
- **Developer-Friendly**: Clear patterns and extensive documentation

The boolean control system allows for:
- ✅ Feature toggles at component level
- ✅ Conditional rendering based on user permissions
- ✅ Responsive behavior control
- ✅ A/B testing capabilities
- ✅ Runtime configuration changes

For additional support or questions, refer to the component source code and configuration files.
