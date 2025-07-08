# Widget Creation Guide - Step-by-Step Tutorial

## 📋 Overview

This guide provides detailed instructions for using the Widget Template to create new widgets efficiently. There are multiple approaches depending on your needs and project structure.

## 🚀 Getting Started - Choose Your Approach

### Approach 1: Clone & Customize (Recommended for New Projects)
**Best for:** Starting a new dashboard application or widget library

### Approach 2: Copy Components (Best for Existing Projects)
**Best for:** Adding widget capabilities to an existing Vue/Vuetify application

### Approach 3: Use as Reference (Best for Learning)
**Best for:** Understanding patterns and implementing similar solutions

---

## 🔧 Approach 1: Clone & Customize (Full Template Usage)

### Prerequisites
- Node.js 16+ installed
- Git installed
- Basic knowledge of Vue.js and Vuetify
- Code editor (VS Code recommended)

### Step 1: Clone the Template
```bash
# Clone the repository
git clone <repository-url> my-widget-project
cd my-widget-project

# Install dependencies
npm install

# Start development server
npm run serve
```

### Step 2: Explore the Template
```bash
# Run the application to see all widgets
npm run serve
# Open http://localhost:8080 in your browser
```

**What you'll see:**
- Default dashboard with sample widgets
- Chart widgets (line, bar, pie)
- Data table widget
- Form widgets
- Widget gallery for browsing components

### Step 3: Create Your First Widget

#### Option A: Using the CLI Generator (Fastest)
**📋 See detailed CLI documentation: [CLI_GENERATOR_GUIDE.md](./CLI_GENERATOR_GUIDE.md)**

```bash
# Run the widget generator
node scripts/create-widget.js
```

**Follow the interactive prompts:**
1. **Widget Type**: Choose from chart, table, form, metrics, or custom
2. **Widget Name**: Enter a descriptive name (e.g., "Sales Dashboard")
3. **Data Source**: Choose existing or create new
4. **Configuration**: The generator will create the basic structure

**Generated automatically:**
- Widget configuration added to `WidgetRegistry.js`
- Schema validation added (if needed)
- Sample data structure created
- Complete file structure with best practices

#### Option B: Manual Creation

**Step 3a: Define Your Widget in WidgetRegistry.js**
```javascript
// Add to WIDGET_DEFINITIONS in src/config/WidgetRegistry.js
mySalesChart: {
    component: "UniversalChart",
    title: "Sales Performance",
    icon: "mdi-chart-line",
    description: "Monthly sales trends and KPIs",
    category: "analytics",
    props: {
        type: "line",
        height: 400,
        responsive: true,
        legend: {
            display: true,
            position: "top"
        }
    },
    dataSource: "salesData",
    filters: ["period", "region", "product"],
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

**Step 3b: Create Data Source**
```javascript
// Add to DATA_SOURCES in src/config/WidgetRegistry.js
salesData: {
    endpoint: "/api/sales",
    localData: () => import("@/assets/config/sales-data.json").then(m => m.default),
    chartAdapter: data => {
        // Transform your data for charts
        return {
            labels: data.months,
            datasets: [{
                label: "Sales ($)",
                data: data.sales,
                backgroundColor: "rgba(54, 162, 235, 0.2)",
                borderColor: "rgba(54, 162, 235, 1)",
                borderWidth: 2,
                fill: true
            }]
        };
    },
    tableAdapter: data => {
        // Transform your data for tables
        return data.map(item => ({
            month: item.month,
            sales: item.sales,
            growth: item.growth,
            region: item.region
        }));
    },
    filters: ["period", "region", "product"]
}
```

**Step 3c: Create Sample Data**
```json
// Create src/assets/config/sales-data.json
{
    "months": ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
    "sales": [12000, 15000, 18000, 22000, 25000, 28000],
    "data": [
        {
            "month": "January",
            "sales": 12000,
            "growth": 5.2,
            "region": "North America"
        },
        {
            "month": "February", 
            "sales": 15000,
            "growth": 8.1,
            "region": "North America"
        }
    ]
}
```

### Step 4: Test Your Widget
```bash
# Start development server
npm run serve
```

**Testing checklist:**
- [ ] Widget appears in the dashboard
- [ ] Data loads correctly
- [ ] Chart/table displays properly
- [ ] Responsive behavior works
- [ ] Filters work (if applicable)

### Step 5: Customize and Extend

#### Add Custom Styling
```css
/* Add to src/assets/styles/BetaStyles.css */
.my-sales-widget {
    border: 2px solid var(--primary-color);
    border-radius: var(--border-radius-lg);
    padding: var(--spacing-md);
}

.sales-chart-container {
    background: var(--surface-color);
    box-shadow: var(--shadow-sm);
}
```

#### Create Custom Component (Advanced)
```vue
<!-- src/components/custom/MySalesWidget.vue -->
<template>
    <v-card class="my-sales-widget">
        <v-card-title>
            <v-icon left>{{ icon }}</v-icon>
            {{ title }}
        </v-card-title>
        <v-card-text>
            <!-- Your custom widget content -->
            <div class="sales-metrics">
                <div class="metric">
                    <h3>{{ totalSales }}</h3>
                    <span>Total Sales</span>
                </div>
                <div class="metric">
                    <h3>{{ growth }}%</h3>
                    <span>Growth</span>
                </div>
            </div>
            <UniversalChart v-bind="chartProps" />
        </v-card-text>
    </v-card>
</template>

<script>
import UniversalChart from "@/components/universal/UniversalChart.vue";

export default {
    name: "MySalesWidget",
    components: { UniversalChart },
    props: {
        title: String,
        icon: String,
        data: Object,
        chartProps: Object
    },
    computed: {
        totalSales() {
            return this.data?.sales?.reduce((sum, val) => sum + val, 0) || 0;
        },
        growth() {
            const sales = this.data?.sales || [];
            if (sales.length < 2) return 0;
            const current = sales[sales.length - 1];
            const previous = sales[sales.length - 2];
            return ((current - previous) / previous * 100).toFixed(1);
        }
    }
};
</script>
```

---

## 📋 Approach 2: Copy Components to Existing Project

### Prerequisites
- Existing Vue.js project with Vuetify
- Chart.js installed (for chart widgets)

### Step 1: Copy Core Files

**Essential files to copy:**
```bash
# Core configuration files
src/config/WidgetRegistry.js
src/config/WidgetSchemas.js

# Universal components
src/components/universal/UniversalChart.vue
src/components/universal/UniversalTable.vue
src/components/universal/UniversalForm.vue

# Data service
src/services/UniversalDataService.js

# Layout orchestrator
src/components/layouts/DashboardOrchestrator.vue

# Styling (optional but recommended)
src/assets/styles/BetaStyles.css
```

### Step 2: Install Dependencies
```bash
# If not already installed
npm install chart.js vue-chartjs
```

### Step 3: Integrate with Your Project

**Add to your main Vue file:**
```javascript
// In your main.js or App.vue
import DashboardOrchestrator from "@/components/layouts/DashboardOrchestrator.vue";
import "@/assets/styles/BetaStyles.css"; // Optional

export default {
    components: {
        DashboardOrchestrator
    }
};
```

**Use in your template:**
```vue
<template>
    <div id="app">
        <!-- Your existing content -->
        <DashboardOrchestrator :dashboard-config="myDashboard" />
    </div>
</template>

<script>
import { WidgetRegistry } from "@/config/WidgetRegistry.js";

export default {
    data() {
        return {
            myDashboard: WidgetRegistry.getDefaultDashboard()
        };
    }
};
</script>
```

### Step 4: Customize for Your Data

**Modify WidgetRegistry.js:**
```javascript
// Replace sample data sources with your API endpoints
export const DATA_SOURCES = {
    myApiData: {
        endpoint: "/api/my-data",
        localData: () => fetch("/api/my-data").then(r => r.json()),
        chartAdapter: data => {
            // Transform your API response to chart format
            return {
                labels: data.map(item => item.label),
                datasets: [{
                    label: "My Data",
                    data: data.map(item => item.value)
                }]
            };
        },
        tableAdapter: data => data // If your API returns table-ready data
    }
};
```

---

## 🎓 Approach 3: Use as Reference/Learning

### Step 1: Study the Architecture
```bash
# Clone for reference
git clone <repository-url> widget-reference
cd widget-reference
```

### Step 2: Key Patterns to Learn

**Widget Configuration Pattern:**
- Study `src/config/WidgetRegistry.js`
- Understand widget definition structure
- Learn data source configuration

**Universal Component Pattern:**
- Examine `src/components/universal/`
- Understand prop-based configuration
- Learn data binding patterns

**Data Flow Pattern:**
- Study `src/services/UniversalDataService.js`
- Understand adapter pattern for data transformation
- Learn caching and error handling

**Validation Pattern:**
- Examine `src/config/WidgetSchemas.js`
- Understand schema validation
- Learn type safety patterns

### Step 3: Implement Similar Patterns
Apply these patterns in your own project structure.

---

## 🛠️ Common Widget Creation Scenarios

### Scenario 1: Create a Metrics Dashboard Widget

**Goal:** Display key performance indicators with cards and charts

**Steps:**
1. **Define widget in WidgetRegistry.js:**
```javascript
kpiDashboard: {
    component: "UniversalChart",
    title: "KPI Dashboard",
    icon: "mdi-chart-box",
    props: {
        type: "doughnut",
        height: 300,
        responsive: true
    },
    dataSource: "kpiData",
    layout: { minHeight: 350, flex: 1 },
    visible: true
}
```

2. **Create data source:**
```javascript
kpiData: {
    endpoint: "/api/kpi",
    localData: () => Promise.resolve({
        labels: ["Sales", "Marketing", "Support"],
        values: [65, 25, 10]
    }),
    chartAdapter: data => ({
        labels: data.labels,
        datasets: [{
            data: data.values,
            backgroundColor: ["#FF6384", "#36A2EB", "#FFCE56"]
        }]
    })
}
```

### Scenario 2: Create a Data Entry Form Widget

**Goal:** Create a form for collecting user input

**Steps:**
1. **Use UniversalForm component:**
```javascript
userRegistration: {
    component: "UniversalForm",
    title: "User Registration",
    icon: "mdi-account-plus",
    props: {
        title: "Create Account",
        fields: [
            {
                name: "username",
                type: "text",
                label: "Username",
                required: true,
                cols: 6
            },
            {
                name: "email",
                type: "email",
                label: "Email",
                required: true,
                cols: 6
            },
            {
                name: "role",
                type: "select",
                label: "Role",
                options: ["Admin", "User", "Manager"],
                cols: 12
            }
        ],
        submitEndpoint: "/api/users"
    }
}
```

### Scenario 3: Create a Custom Complex Widget

**Goal:** Build a widget with custom functionality

**Steps:**
1. **Create custom component:**
```vue
<!-- src/components/custom/ProjectTracker.vue -->
<template>
    <v-card>
        <v-card-title>Project Tracker</v-card-title>
        <v-card-text>
            <!-- Custom project tracking interface -->
            <div class="project-grid">
                <div v-for="project in projects" :key="project.id" class="project-card">
                    <h4>{{ project.name }}</h4>
                    <v-progress-linear :value="project.progress" />
                    <span>{{ project.progress }}% Complete</span>
                </div>
            </div>
        </v-card-text>
    </v-card>
</template>
```

2. **Register in WidgetRegistry:**
```javascript
projectTracker: {
    component: "ProjectTracker",
    title: "Project Tracker",
    icon: "mdi-project",
    dataSource: "projects",
    layout: { minHeight: 400, flex: 2 }
}
```

3. **Import in DashboardOrchestrator:**
```javascript
import ProjectTracker from "@/components/custom/ProjectTracker.vue";

export default {
    components: {
        // ...existing components
        ProjectTracker
    }
};
```

---

## 🧪 Testing Your Widgets

### Development Testing
```bash
# Start development server
npm run serve

# Run in different viewports:
# - Mobile: Chrome DevTools device simulation
# - Tablet: Resize browser window
# - Desktop: Full screen
```

### Widget Gallery Testing
1. Navigate to Widget Gallery component
2. Find your widget in the gallery
3. Test different configurations
4. Copy/export configurations for reuse

### Configuration Playground Testing
1. Open Configuration Playground
2. Load your widget configuration
3. Modify properties in real-time
4. Test edge cases and validation

---

## 📚 Best Practices & Tips

### 1. Data Source Best Practices
- Always provide both `endpoint` and `localData` fallback
- Make `chartAdapter` and `tableAdapter` functions robust
- Handle empty/null data gracefully
- Use consistent data formats

### 2. Widget Configuration Best Practices
- Use descriptive titles and icons
- Configure responsive breakpoints
- Set appropriate default values
- Include helpful descriptions

### 3. Performance Best Practices
- Use lazy loading for large datasets
- Implement data caching where appropriate
- Optimize chart rendering for large datasets
- Use skeleton loaders for better UX

### 4. Styling Best Practices
- Use CSS variables for consistency
- Follow the existing design system
- Make widgets responsive by default
- Test in dark/light themes

---

## 🚨 Troubleshooting Common Issues

### Charts Not Showing Data
**Problem:** Charts render but show no data
**Solution:**
1. Check `chartAdapter` function in your data source
2. Verify data structure matches Chart.js expectations
3. Check browser console for errors
4. Validate data is being fetched correctly

### Widget Not Appearing
**Problem:** Widget doesn't appear in dashboard
**Solution:**
1. Check `visible: true` in widget definition
2. Verify component is imported in DashboardOrchestrator
3. Check for JavaScript errors in console
4. Validate widget configuration syntax

### Styling Issues
**Problem:** Widget doesn't match design
**Solution:**
1. Check if BetaStyles.css is imported
2. Verify CSS variable usage
3. Check responsive breakpoint configuration
4. Test in different viewport sizes

---

## 📈 Advanced Features

### Custom Filters
```javascript
// Add custom filter handling
filters: {
    dateRange: {
        type: "date-range",
        label: "Date Range",
        default: { start: "2025-01-01", end: "2025-12-31" }
    },
    status: {
        type: "multi-select",
        label: "Status",
        options: ["Active", "Pending", "Complete"]
    }
}
```

### Real-time Data Updates
```javascript
// Configure auto-refresh for live data
dataSource: {
    // ...existing config
    refreshInterval: 30000, // 30 seconds
    realtime: true
}
```

### Widget Interactions
```javascript
// Add click handlers and interactions
props: {
    // ...existing props
    onClick: (dataPoint) => {
        // Handle chart/widget clicks
        this.$emit('datapoint-clicked', dataPoint);
    }
}
```

---

## 🎯 Next Steps

### For New Projects (Approach 1)
1. ✅ Clone and set up the template
2. ✅ Create your first widget
3. 🔄 Customize styling and branding
4. 🔄 Add your data sources
5. 🔄 Deploy to production

### For Existing Projects (Approach 2)
1. ✅ Copy essential components
2. ✅ Integrate with existing architecture
3. 🔄 Migrate existing widgets to new system
4. 🔄 Train team on new patterns

### For Learning (Approach 3)
1. ✅ Study the patterns and architecture
2. ✅ Implement similar solutions
3. 🔄 Adapt to your tech stack
4. 🔄 Share learnings with team

---

## 📞 Support & Resources

### Documentation
- `IMPLEMENTATION_GUIDE.md` - Architecture overview
- `README.md` - Quick start guide
- Inline code comments for implementation details

### Development Tools
- Widget Gallery - Visual widget browser
- Configuration Playground - Live editing
- CLI Generator - Quick scaffolding
- Schema Validation - Type safety

### Community
- GitHub Issues for bugs and feature requests
- Wiki for additional documentation
- Examples folder for reference implementations

---

*This guide provides comprehensive instructions for using the Widget Template effectively. Choose the approach that best fits your project needs and follow the step-by-step instructions for successful widget creation.*
