# Widget Generator CLI Documentation

## Overview

The `create-widget.js` script is an interactive command-line tool that automates the creation of new widgets for the Vue.js Widget Template. It provides a guided experience for generating all necessary files and configurations for a new widget component.

## 🚀 Quick Start

### Basic Usage
```bash
# Run from the project root directory
node scripts/create-widget.js
```

### Prerequisites
- Node.js 14+ installed
- Project dependencies installed (`npm install`)
- Working in the widget template project directory

## 📋 What the Tool Does

### 1. Interactive Prompts
The CLI will ask you for:
- **Widget Name**: CamelCase name (e.g., "SalesChart", "UserTable")
- **Widget Type**: Choose from 5 predefined templates
- **Data Source**: Key identifier for your data (e.g., "sales", "users")
- **Description**: Brief description of the widget's purpose

### 2. File Generation
Creates a complete widget structure:
```
src/components/widgets/[widget-name]/
├── [WidgetName]Widget.vue    # Main Vue component
├── config.js                # Widget configuration
├── test.js                  # Unit tests
└── service.js               # Data service (custom widgets only)
```

### 3. Registry Integration
Generates code for `WidgetRegistry.js` integration that you can copy/paste.

## 🎯 Widget Templates

### 1. Chart Widget
**Best for:** Data visualization with charts and graphs

**Uses:** `UniversalChart` component
**Generated files:** 3 files (component, config, test)
**Features:**
- Built-in chart type configuration
- Responsive chart sizing
- Data transformation support

**Example use cases:**
- Sales performance charts
- KPI dashboards
- Analytics widgets

### 2. Table Widget
**Best for:** Displaying structured data in rows and columns

**Uses:** `UniversalTable` component
**Generated files:** 3 files (component, config, test)
**Features:**
- Sorting and filtering
- Pagination
- Responsive design

**Example use cases:**
- User lists
- Product catalogs
- Data grids

### 3. Form Widget
**Best for:** Data entry and user input

**Uses:** `UniversalForm` component
**Generated files:** 3 files (component, config, test)
**Features:**
- Dynamic field generation
- Built-in validation
- Multiple field types

**Example use cases:**
- Contact forms
- User registration
- Data entry forms

### 4. Metrics Widget
**Best for:** Displaying key performance indicators

**Uses:** `UniversalMetrics` component
**Generated files:** 3 files (component, config, test)
**Features:**
- Card-based layout
- Number formatting
- Trend indicators

**Example use cases:**
- KPI cards
- Summary statistics
- Performance metrics

### 5. Custom Widget
**Best for:** Unique functionality not covered by other templates

**Uses:** Custom implementation
**Generated files:** 4 files (component, config, test, service)
**Features:**
- Full customization
- Dedicated service layer
- Complete control over functionality

**Example use cases:**
- Complex interactive widgets
- Specialized visualizations
- Custom business logic

## 📝 Step-by-Step Example

### Creating a Sales Chart Widget

1. **Run the generator:**
   ```bash
   node scripts/create-widget.js
   ```

2. **Follow the prompts:**
   ```
   🎯 Widget Generator - Create a new widget from template

   Widget name (e.g., SalesChart): SalesPerformance
   
   Available widget templates:
   1. Chart Widget (chart)
   2. Table Widget (table)
   3. Form Widget (form)
   4. Metrics Widget (metrics)
   5. Custom Widget (custom)
   
   Select template (1-5): 1
   
   Data source key (e.g., sales, users): salesData
   
   Widget description: Monthly sales performance tracking
   ```

3. **Files are generated:**
   ```
   📁 Created 3 files in src/components/widgets/salesperformance/
   ├── SalesPerformanceWidget.vue
   ├── config.js
   └── test.js
   ```

4. **Registry code is provided:**
   ```javascript
   // Add this to your WidgetRegistry.js WIDGET_DEFINITIONS:
   salesPerformance: {
       component: "SalesPerformanceWidget",
       title: "SalesPerformance",
       icon: "mdi-chart-line",
       description: "Monthly sales performance tracking",
       category: "chart",
       props: { type: "line", height: 400 },
       dataSource: "salesData",
       filters: ["organization"],
       layout: { 
           minHeight: 400, 
           flex: 2,
           breakpoints: {
               mobile: { flex: 1, height: 300 },
               tablet: { flex: 2, height: 350 },
               desktop: { flex: 2, height: 400 }
           }
       },
       visible: true
   }
   ```

## 🔧 Generated File Structure

### Vue Component (`[WidgetName]Widget.vue`)

**For Universal Components (chart, table, form, metrics):**
```vue
<template>
    <div class="widget-name-widget">
        <UniversalChart
            v-bind="$props"
            :loading="loading"
            :data-source="dataSource"
            @data-loaded="onDataLoaded"
            @error="onError"
        />
    </div>
</template>

<script>
import UniversalChart from '@/components/universal/UniversalChart.vue';

export default {
    name: 'WidgetNameWidget',
    components: { UniversalChart },
    props: {
        dataSource: { type: String, default: 'yourDataSource' },
        loading: { type: Boolean, default: false },
        // Widget-specific props
    },
    methods: {
        onDataLoaded(data) { /* Handle data loading */ },
        onError(error) { /* Handle errors */ }
    }
};
</script>
```

**For Custom Components:**
```vue
<template>
    <div class="widget-name-widget">
        <v-card class="widget-card">
            <v-card-title>
                <v-icon left>mdi-widgets</v-icon>
                Widget Name
            </v-card-title>
            <v-card-text>
                <!-- Custom widget content -->
            </v-card-text>
        </v-card>
    </div>
</template>
```

### Configuration File (`config.js`)
```javascript
export const WIDGET_NAME_CONFIG = {
    name: 'WidgetName',
    type: 'chart',
    dataSource: 'yourDataSource',
    description: 'Widget description',
    
    defaultProps: {
        type: 'line',
        height: 400,
        responsive: true
    },
    
    layout: {
        minHeight: 400,
        flex: 2,
        breakpoints: { /* responsive config */ }
    },
    
    dataConfig: {
        source: 'yourDataSource',
        refreshInterval: 300000,
        cacheTTL: 600000
    }
};
```

### Test File (`test.js`)
```javascript
import { shallowMount } from '@vue/test-utils';
import WidgetNameWidget from './WidgetNameWidget.vue';

describe('WidgetNameWidget', () => {
    // Basic component tests
    // Loading state tests
    // Event emission tests
    // Error handling tests
});
```

### Service File (`service.js`) - Custom widgets only
```javascript
import UniversalDataService from '@/services/UniversalDataService.js';

class WidgetNameService {
    constructor() {
        this.dataService = new UniversalDataService();
    }

    async fetchData(filters = {}, options = {}) {
        // Data fetching logic
    }

    transformData(rawData) {
        // Data transformation logic
    }
}

export default new WidgetNameService();
```

## 🛠️ Integration Steps

### 1. Import the Component
```javascript
// In DashboardOrchestrator.vue or your main component
import SalesPerformanceWidget from "@/components/widgets/salesperformance/SalesPerformanceWidget.vue";

export default {
    components: {
        // ...existing components
        SalesPerformanceWidget
    }
};
```

### 2. Add to Widget Registry
```javascript
// In src/config/WidgetRegistry.js
export const WIDGET_DEFINITIONS = {
    // ...existing widgets
    salesPerformance: {
        // Paste the generated configuration here
    }
};
```

### 3. Configure Data Source (if new)
```javascript
// In src/config/WidgetRegistry.js DATA_SOURCES
export const DATA_SOURCES = {
    // ...existing sources
    salesData: {
        endpoint: "/api/sales",
        localData: () => import("@/assets/config/sales-data.json").then(m => m.default),
        chartAdapter: data => {
            // Transform data for charts
            return {
                labels: data.months,
                datasets: [{
                    label: "Sales",
                    data: data.values
                }]
            };
        },
        tableAdapter: data => data
    }
};
```

### 4. Test Your Widget
```bash
# Start development server
npm run serve

# Navigate to your dashboard to see the new widget
```

## 🎯 Best Practices

### Widget Naming
- Use **PascalCase** for widget names (e.g., "SalesChart", "UserTable")
- Be descriptive but concise
- Avoid generic names like "Widget1" or "Chart"

### Data Source Keys
- Use **camelCase** for data source keys (e.g., "salesData", "userProfiles")
- Match your API endpoint naming when possible
- Be consistent across related widgets

### Descriptions
- Write clear, concise descriptions
- Focus on what the widget does, not how it works
- Use action words (e.g., "Displays...", "Manages...", "Tracks...")

### After Generation
1. **Review generated code** - Customize as needed
2. **Add data source** - Configure in WidgetRegistry.js if new
3. **Test thoroughly** - Use Widget Gallery and Configuration Playground
4. **Update documentation** - Add to your project docs

## 🚨 Troubleshooting

### Common Issues

**"Template selection invalid"**
- Enter a number between 1-5
- Make sure you press Enter after typing

**"Files not generated"**
- Check write permissions in the project directory
- Ensure you're running from the project root
- Verify Node.js version (14+ required)

**"Widget not appearing in dashboard"**
- Verify widget is added to WidgetRegistry.js
- Check component import in DashboardOrchestrator.vue
- Ensure `visible: true` in widget configuration

### File Locations
```
scripts/create-widget.js                           # CLI tool
src/components/widgets/[widget-name]/              # Generated files
src/config/WidgetRegistry.js                       # Registry configuration
src/components/layouts/DashboardOrchestrator.vue   # Component imports
```

## 🔄 Workflow Integration

### Development Workflow
1. **Plan** → Define widget requirements
2. **Generate** → Use CLI tool to create structure
3. **Customize** → Modify generated code as needed
4. **Configure** → Add to registry and data sources
5. **Test** → Use dev tools and manual testing
6. **Deploy** → Include in production build

### Team Workflow
1. **Standardization** → All team members use same generator
2. **Review** → Code review focuses on customizations
3. **Documentation** → Update project docs with new widgets
4. **Testing** → Consistent test structure across widgets

## 📈 Advanced Usage

### Custom Templates
You can modify the generator to add your own templates by editing the `templates` object in the constructor.

### Batch Generation
For multiple similar widgets, you can extend the CLI to accept command-line arguments instead of prompts.

### Integration with Build Tools
Consider integrating the generator with your build process or CI/CD pipeline for automated widget scaffolding.

---

## 💡 Tips for Success

1. **Start with existing templates** - Modify generated code rather than starting from scratch
2. **Use consistent naming** - Follow the patterns established by the generator
3. **Test early and often** - Use the Widget Gallery to validate your widgets
4. **Document customizations** - Note any changes you make to generated code
5. **Share configurations** - Use the Configuration Playground to share widget setups

The Widget Generator CLI is designed to get you from idea to working widget in minutes, following best practices and maintaining consistency across your widget library.
