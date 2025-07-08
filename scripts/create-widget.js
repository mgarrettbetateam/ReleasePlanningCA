#!/usr/bin/env node
/* eslint-disable no-console */

/**
 * Widget Generator CLI Tool
 * 
 * This script automates the creation of new widgets for the Vue.js Widget Template.
 * It generates all necessary files including Vue components, configuration, tests,
 * and provides registry integration code.
 * 
 * Usage:
 *   node scripts/create-widget.js
 * 
 * Features:
 * - Interactive CLI prompts for widget configuration
 * - Multiple widget templates (chart, table, form, metrics, custom)
 * - Automatic file generation with proper structure
 * - Registry integration code generation
 * - Best practices enforcement
 * 
 * Generated Files:
 * - Vue component file
 * - Configuration file
 * - Test file
 * - Service file (for custom widgets)
 * 
 * @author Widget Template Team
 * @version 2.0
 */

const fs = require("fs");
const path = require("path");
const readline = require("readline");

/**
 * WidgetGenerator Class
 * 
 * Handles the automated generation of widget components and their associated files.
 * Provides an interactive CLI interface for creating widgets from predefined templates.
 * 
 * Features:
 * - Five widget templates: chart, table, form, metrics, custom
 * - Automatic file structure creation
 * - Registry integration code generation
 * - Best practices enforcement
 * - Interactive prompts for configuration
 */
class WidgetGenerator {
    /**
     * Initialize the widget generator with available templates and CLI interface
     */
    constructor() {
        // Define available widget templates with their configurations
        this.templates = {
            chart: {
                name: "Chart Widget",
                files: ["component.vue", "config.js", "test.js"],
                baseComponent: "UniversalChart",
                schema: "chart"
            },
            table: {
                name: "Table Widget", 
                files: ["component.vue", "config.js", "test.js"],
                baseComponent: "UniversalTable",
                schema: "table"
            },
            form: {
                name: "Form Widget",
                files: ["component.vue", "config.js", "test.js"],
                baseComponent: "UniversalForm",
                schema: "form"
            },
            metrics: {
                name: "Metrics Widget",
                files: ["component.vue", "config.js", "test.js"],
                baseComponent: "UniversalMetrics",
                schema: "metrics"
            },
            custom: {
                name: "Custom Widget",
                files: ["component.vue", "config.js", "test.js", "service.js"],
                baseComponent: null,
                schema: "custom"
            }
        };
        
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
    }

    /**
     * Main entry point for widget creation.
     * Orchestrates the entire widget generation process through interactive prompts.
     * 
     * Process:
     * 1. Collect widget details (name, type, data source, description)
     * 2. Generate component files from templates
     * 3. Update registry with new widget configuration
     * 4. Provide success feedback and next steps
     */
    async createWidget() {
        console.log("🎯 Widget Generator - Create a new widget from template\n");
        
        try {
            const widgetName = await this.prompt("Widget name (e.g., SalesChart): ");
            const widgetType = await this.selectTemplate();
            const dataSource = await this.prompt("Data source key (e.g., sales, users): ");
            const description = await this.prompt("Widget description: ");
            
            const config = {
                name: widgetName,
                type: widgetType,
                dataSource,
                description,
                template: this.templates[widgetType]
            };
            
            await this.generateFiles(config);
            await this.updateRegistry(config);
            
            console.log(`\n✅ Widget "${widgetName}" created successfully!`);
            console.log(`📁 Location: src/components/widgets/${widgetName.toLowerCase()}/`);
            console.log("📝 Don't forget to add your data source to WidgetRegistry.js");
            
        } catch (error) {
            console.error("❌ Error creating widget:", error.message);
        } finally {
            this.rl.close();
        }
    }

    /**
     * Present available widget templates and get user selection
     * 
     * @returns {string} Selected template key (chart, table, form, metrics, custom)
     */
    async selectTemplate() {
        console.log("\nAvailable widget templates:");
        const types = Object.keys(this.templates);
        types.forEach((type, index) => {
            console.log(`${index + 1}. ${this.templates[type].name} (${type})`);
        });
        
        const selection = await this.prompt("\nSelect template (1-4): ");
        const index = parseInt(selection) - 1;
        
        if (index < 0 || index >= types.length) {
            throw new Error("Invalid template selection");
        }
        
        return types[index];
    }

    /**
     * Generate all necessary files for the widget
     * 
     * @param {Object} config - Widget configuration object
     * @param {string} config.name - Widget name
     * @param {string} config.type - Widget type (template key)
     * @param {Object} config.template - Template configuration
     */
    async generateFiles(config) {
        const widgetDir = path.join("src", "components", "widgets", config.name.toLowerCase());
        
        // Create widget directory
        if (!fs.existsSync(widgetDir)) {
            fs.mkdirSync(widgetDir, { recursive: true });
        }
        
        // Generate component files
        for (const fileName of config.template.files) {
            const templateContent = this.getTemplate(fileName, config);
            const filePath = path.join(widgetDir, fileName.replace("component", config.name));
            fs.writeFileSync(filePath, templateContent);
        }
        
        console.log(`📁 Created ${config.template.files.length} files in ${widgetDir}`);
    }

    async updateRegistry(config) {
        const registryPath = path.join("src", "config", "WidgetRegistry.js");
        
        if (!fs.existsSync(registryPath)) {
            console.log("⚠️  WidgetRegistry.js not found, skipping auto-registration");
            return;
        }
        
        const newWidgetConfig = this.generateRegistryEntry(config);
        console.log("\n📝 Add this to your WidgetRegistry.js WIDGET_DEFINITIONS:\n");
        console.log(newWidgetConfig);
    }

    generateRegistryEntry(config) {
        const kebabName = config.name.toLowerCase().replace(/([a-z])([A-Z])/g, "$1-$2");
        const componentName = `${config.name}Widget`;
        
        return `    ${kebabName}: {
        component: "${componentName}",
        title: "${config.name}",
        icon: "mdi-${config.type === "chart" ? "chart-line" : config.type === "table" ? "table" : "widgets"}",
        description: "${config.description}",
        category: "${config.type}",
        props: ${config.type === "chart" ? '{ type: "line", height: 400 }' : "{}"},
        dataSource: "${config.dataSource}",
        filters: ["organization"], // Update as needed
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
    },`;
    }

    getTemplate(fileName, config) {
        switch (fileName) {
            case "component.vue":
                return this.getVueTemplate(config);
            case "config.js":
                return this.getConfigTemplate(config);
            case "test.js":
                return this.getTestTemplate(config);
            case "service.js":
                return this.getServiceTemplate(config);
            default:
                return "// Generated file";
        }
    }

    getVueTemplate(config) {
        const componentName = `${config.name}Widget`;
        const baseComponent = config.template.baseComponent;
        
        if (baseComponent) {
            return `<template>
    <div class="${config.name.toLowerCase()}-widget">
        <${baseComponent}
            v-bind="$props"
            :loading="loading"
            :data-source="dataSource"
            @data-loaded="onDataLoaded"
            @error="onError"
        />
    </div>
</template>

<script>
import ${baseComponent} from '@/components/universal/${baseComponent}.vue';

export default {
    name: '${componentName}',
    components: {
        ${baseComponent}
    },
    props: {
        dataSource: {
            type: String,
            default: '${config.dataSource}'
        },
        loading: {
            type: Boolean,
            default: false
        },
        // Add widget-specific props here
        ${config.type === "chart" ? `type: {
            type: String,
            default: 'line'
        },
        height: {
            type: Number,
            default: 400
        }` : ""}
    },
    data() {
        return {
            // Widget-specific data
        };
    },
    methods: {
        onDataLoaded(data) {
            this.$emit('data-loaded', data);
            // Handle data loading
        },
        onError(error) {
            this.$emit('error', error);
            console.error('${componentName} error:', error);
        }
    }
};
</script>`;
        } else {
            return `<template>
    <div class="${config.name.toLowerCase()}-widget">
        <v-card class="widget-card">
            <v-card-title>
                <v-icon left>mdi-widgets</v-icon>
                ${config.name}
            </v-card-title>
            <v-card-text>
                <!-- Custom widget content goes here -->
                <div v-if="loading" class="text-center">
                    <v-progress-circular indeterminate color="primary" />
                    <p>Loading...</p>
                </div>
                <div v-else>
                    <!-- Your custom widget implementation -->
                    <p>Custom ${config.name} widget content</p>
                </div>
            </v-card-text>
        </v-card>
    </div>
</template>

<script>
export default {
    name: '${componentName}',
    props: {
        dataSource: {
            type: String,
            default: '${config.dataSource}'
        },
        loading: {
            type: Boolean,
            default: false
        }
    },
    data() {
        return {
            // Widget data
        };
    },
    mounted() {
        this.loadData();
    },
    methods: {
        async loadData() {
            try {
                // Load widget data
                this.$emit('data-loaded');
            } catch (error) {
                this.$emit('error', error);
            }
        }
    }
};
</script>`;
        }
    }

    getConfigTemplate(config) {
        return `// ${config.name} Widget Configuration
export const ${config.name.toUpperCase()}_CONFIG = {
    name: '${config.name}',
    type: '${config.type}',
    dataSource: '${config.dataSource}',
    description: '${config.description}',
    
    // Default properties
    defaultProps: {
        ${config.type === "chart" ? `type: 'line',
        height: 400,
        responsive: true` : config.type === "table" ? `pageSize: 10,
        sortable: true,
        filterable: true` : "// Custom props"}
    },
    
    // Layout configuration
    layout: {
        minHeight: 400,
        flex: 2,
        breakpoints: {
            mobile: { flex: 1, height: 300 },
            tablet: { flex: 2, height: 350 },
            desktop: { flex: 2, height: 400 }
        }
    },
    
    // Data configuration
    dataConfig: {
        source: '${config.dataSource}',
        refreshInterval: 300000, // 5 minutes
        cacheTTL: 600000 // 10 minutes
    }
};
`;
    }

    getTestTemplate(config) {
        const componentName = `${config.name}Widget`;
        
        return `import { shallowMount } from '@vue/test-utils';
import ${componentName} from './${componentName}.vue';

describe('${componentName}', () => {
    let wrapper;

    beforeEach(() => {
        wrapper = shallowMount(${componentName}, {
            propsData: {
                dataSource: '${config.dataSource}',
                loading: false
            }
        });
    });

    afterEach(() => {
        wrapper.destroy();
    });

    it('renders correctly', () => {
        expect(wrapper.exists()).toBe(true);
        expect(wrapper.find('.${config.name.toLowerCase()}-widget').exists()).toBe(true);
    });

    it('handles loading state', async () => {
        await wrapper.setProps({ loading: true });
        // Add loading state assertions
    });

    it('emits data-loaded event', () => {
        wrapper.vm.onDataLoaded({ test: 'data' });
        expect(wrapper.emitted('data-loaded')).toBeTruthy();
    });

    it('handles errors gracefully', () => {
        const error = new Error('Test error');
        wrapper.vm.onError(error);
        expect(wrapper.emitted('error')).toBeTruthy();
    });

    // Add more widget-specific tests
});
`;
    }

    getServiceTemplate(config) {
        return `// ${config.name} Widget Service
import UniversalDataService from '@/services/UniversalDataService.js';

class ${config.name}Service {
    constructor() {
        this.dataService = new UniversalDataService();
        this.cache = new Map();
    }

    async fetchData(filters = {}, options = {}) {
        try {
            const data = await this.dataService.fetchData(
                '${config.dataSource}',
                filters,
                options
            );
            
            return this.transformData(data);
        } catch (error) {
            console.error('${config.name}Service error:', error);
            throw error;
        }
    }

    transformData(rawData) {
        // Transform data for ${config.name} widget
        // Add your data transformation logic here
        return rawData;
    }

    // Add widget-specific service methods
}

export default new ${config.name}Service();
`;
    }

    prompt(question) {
        return new Promise(resolve => {
            this.rl.question(question, resolve);
        });
    }
}

// CLI execution
if (require.main === module) {
    const generator = new WidgetGenerator();
    generator.createWidget().catch(console.error);
}

module.exports = WidgetGenerator;
