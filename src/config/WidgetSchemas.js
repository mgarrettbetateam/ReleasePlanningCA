// Widget Schema Validation System
// Provides type safety and validation for widget configurations

export const WIDGET_SCHEMAS = {
    chart: {
        name: "Chart Widget",
        description: "Universal chart component supporting multiple chart types",
        category: "visualization",
        required: ["type", "dataSource"],
        properties: {
            type: {
                type: "string",
                enum: ["line", "bar", "pie", "doughnut", "radar", "scatter", "polarArea"],
                description: "Chart type to render"
            },
            height: {
                type: "number",
                min: 200,
                max: 800,
                default: 400,
                description: "Chart height in pixels"
            },
            dataSource: {
                type: "string",
                description: "Data source key from DATA_SOURCES configuration"
            },
            responsive: {
                type: "boolean",
                default: true,
                description: "Enable responsive chart resizing"
            },
            legend: {
                type: "object",
                properties: {
                    display: { type: "boolean", default: true },
                    position: { enum: ["top", "bottom", "left", "right"], default: "top" }
                }
            }
        }
    },

    table: {
        name: "Table Widget",
        description: "Universal table component with sorting, filtering, and pagination",
        category: "data",
        required: ["headers", "dataSource"],
        properties: {
            headers: {
                type: "array",
                items: {
                    type: "object",
                    required: ["text", "value"],
                    properties: {
                        text: { type: "string" },
                        value: { type: "string" },
                        sortable: { type: "boolean", default: true },
                        align: { enum: ["start", "center", "end"], default: "start" }
                    }
                },
                description: "Table column definitions"
            },
            dataSource: {
                type: "string",
                description: "Data source key from DATA_SOURCES configuration"
            },
            searchable: {
                type: "boolean",
                default: true,
                description: "Enable search functionality"
            },
            filterable: {
                type: "boolean",
                default: true,
                description: "Enable column filtering"
            },
            itemsPerPage: {
                type: "number",
                min: 5,
                max: 100,
                default: 15,
                description: "Number of items per page"
            },
            dense: {
                type: "boolean",
                default: false,
                description: "Use compact table styling"
            }
        }
    },

    form: {
        name: "Form Widget",
        description: "Dynamic form component with validation",
        category: "input",
        required: ["fields"],
        properties: {
            fields: {
                type: "array",
                items: {
                    type: "object",
                    required: ["name", "type"],
                    properties: {
                        name: { type: "string" },
                        type: { enum: ["text", "number", "email", "select", "checkbox", "date"] },
                        label: { type: "string" },
                        required: { type: "boolean", default: false },
                        options: { type: "array" } // for select fields
                    }
                },
                description: "Form field definitions"
            },
            submitEndpoint: {
                type: "string",
                description: "API endpoint for form submission"
            },
            validation: {
                type: "object",
                description: "Validation rules for form fields"
            }
        }
    },

    metrics: {
        name: "Metrics Widget",
        description: "KPI and metrics display component",
        category: "analytics",
        required: ["metrics"],
        properties: {
            metrics: {
                type: "array",
                items: {
                    type: "object",
                    required: ["key", "title"],
                    properties: {
                        key: { type: "string" },
                        title: { type: "string" },
                        format: { enum: ["number", "currency", "percentage"], default: "number" },
                        trend: { type: "boolean", default: false }
                    }
                },
                description: "Metrics to display"
            },
            dataSource: {
                type: "string",
                description: "Data source key from DATA_SOURCES configuration"
            },
            layout: {
                enum: ["grid", "list", "cards"],
                default: "grid",
                description: "Metrics layout style"
            }
        }
    },

    custom: {
        name: "Custom Widget",
        description: "Custom widget implementation",
        category: "custom",
        required: ["component"],
        properties: {
            component: {
                type: "string",
                description: "Vue component name to render"
            },
            props: {
                type: "object",
                description: "Props to pass to the component"
            },
            dataSource: {
                type: "string",
                description: "Optional data source key"
            }
        }
    }
};

export const LAYOUT_SCHEMAS = {
    widget: {
        required: ["minHeight"],
        properties: {
            minHeight: {
                type: "number",
                min: 100,
                max: 1000,
                description: "Minimum widget height in pixels"
            },
            flex: {
                type: "number",
                min: 1,
                max: 12,
                default: 1,
                description: "Flex grow factor for responsive layouts"
            },
            breakpoints: {
                type: "object",
                properties: {
                    mobile: {
                        type: "object",
                        properties: {
                            flex: { type: "number", min: 1, max: 12 },
                            height: { type: "number", min: 100, max: 800 }
                        }
                    },
                    tablet: {
                        type: "object",
                        properties: {
                            flex: { type: "number", min: 1, max: 12 },
                            height: { type: "number", min: 100, max: 800 }
                        }
                    },
                    desktop: {
                        type: "object",
                        properties: {
                            flex: { type: "number", min: 1, max: 12 },
                            height: { type: "number", min: 100, max: 800 }
                        }
                    }
                }
            }
        }
    }
};

export class WidgetValidator {
    /**
     * Validate a widget configuration against its schema
     * @param {Object} widgetConfig - Widget configuration to validate
     * @param {string} widgetType - Widget type (chart, table, form, etc.)
     * @returns {Object} - Validation result with isValid and errors
     */
    static validateWidget(widgetConfig, widgetType) {
        const schema = WIDGET_SCHEMAS[widgetType];
        if (!schema) {
            return {
                isValid: false,
                errors: [`Unknown widget type: ${widgetType}`]
            };
        }

        const errors = [];
        
        // Check required fields
        for (const requiredField of schema.required || []) {
            if (!(requiredField in widgetConfig.props || widgetConfig[requiredField])) {
                errors.push(`Missing required field: ${requiredField}`);
            }
        }

        // Validate properties
        const props = widgetConfig.props || widgetConfig;
        this.validateProperties(props, schema.properties, errors, "");

        // Validate layout if present
        if (widgetConfig.layout) {
            this.validateProperties(widgetConfig.layout, LAYOUT_SCHEMAS.widget.properties, errors, "layout.");
        }

        return {
            isValid: errors.length === 0,
            errors,
            schema
        };
    }

    /**
     * Validate properties against schema definition
     * @private
     */
    static validateProperties(obj, schemaProps, errors, prefix = "") {
        for (const [propName, propSchema] of Object.entries(schemaProps || {})) {
            const value = obj[propName];
            const fieldPath = prefix + propName;

            if (value !== undefined) {
                this.validateProperty(value, propSchema, errors, fieldPath);
            }
        }
    }

    /**
     * Validate a single property value
     * @private
     */
    static validateProperty(value, schema, errors, fieldPath) {
        // Type validation
        if (schema.type && typeof value !== schema.type) {
            errors.push(`${fieldPath}: Expected ${schema.type}, got ${typeof value}`);
            return;
        }

        // Enum validation
        if (schema.enum && !schema.enum.includes(value)) {
            errors.push(`${fieldPath}: Must be one of [${schema.enum.join(", ")}]`);
        }

        // Range validation for numbers
        if (schema.type === "number") {
            if (schema.min !== undefined && value < schema.min) {
                errors.push(`${fieldPath}: Must be >= ${schema.min}`);
            }
            if (schema.max !== undefined && value > schema.max) {
                errors.push(`${fieldPath}: Must be <= ${schema.max}`);
            }
        }

        // Array validation
        if (schema.type === "array" && Array.isArray(value)) {
            if (schema.items) {
                value.forEach((item, index) => {
                    this.validateProperties(item, schema.items.properties, errors, `${fieldPath}[${index}].`);
                });
            }
        }

        // Object validation
        if (schema.type === "object" && schema.properties) {
            this.validateProperties(value, schema.properties, errors, `${fieldPath}.`);
        }
    }

    /**
     * Get widget schema by type
     * @param {string} widgetType - Widget type
     * @returns {Object|null} - Widget schema or null if not found
     */
    static getSchema(widgetType) {
        return WIDGET_SCHEMAS[widgetType] || null;
    }

    /**
     * Get all available widget types
     * @returns {Array} - Array of widget type objects with metadata
     */
    static getAvailableTypes() {
        return Object.entries(WIDGET_SCHEMAS).map(([type, schema]) => ({
            type,
            name: schema.name,
            description: schema.description,
            category: schema.category
        }));
    }

    /**
     * Apply default values to widget configuration
     * @param {Object} widgetConfig - Widget configuration
     * @param {string} widgetType - Widget type
     * @returns {Object} - Widget configuration with defaults applied
     */
    static applyDefaults(widgetConfig, widgetType) {
        const schema = WIDGET_SCHEMAS[widgetType];
        if (!schema) return widgetConfig;

        const result = JSON.parse(JSON.stringify(widgetConfig)); // Deep clone
        const props = result.props || {};

        // Apply property defaults
        for (const [propName, propSchema] of Object.entries(schema.properties || {})) {
            if (propSchema.default !== undefined && props[propName] === undefined) {
                props[propName] = propSchema.default;
            }
        }

        result.props = props;
        return result;
    }
}

export default WidgetValidator;
