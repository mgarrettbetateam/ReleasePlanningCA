<template>
    <v-dialog v-model="show" max-width="800" persistent>
        <v-card class="widget-wizard">
            <v-card-title class="wizard-header">
                <v-icon left color="primary">mdi-auto-fix</v-icon>
                Widget Creation Wizard
                <v-spacer />
                <v-btn icon @click="closeWizard">
                    <v-icon>mdi-close</v-icon>
                </v-btn>
            </v-card-title>

            <v-stepper v-model="currentStep" vertical>
                <!-- Step 1: Choose Template -->
                <v-stepper-step :complete="currentStep > 1" step="1">
                    Choose Widget Template
                    <small>Select an existing widget to use as a template</small>
                </v-stepper-step>
                <v-stepper-content step="1">
                    <v-container>
                        <v-row>
                            <v-col 
                                v-for="widget in templateableWidgets" 
                                :key="widget.id"
                                cols="12" 
                                md="6"
                            >
                                <v-card
                                    class="widget-type-card"
                                    :class="{ 'selected': selectedTemplate && selectedTemplate.id === widget.id }"
                                    outlined
                                    hover
                                    @click="selectWidgetTemplate(widget)"
                                >
                                    <v-card-text class="text-center">
                                        <v-icon size="48" :color="selectedTemplate && selectedTemplate.id === widget.id ? 'primary' : 'grey'">
                                            {{ widget.icon }}
                                        </v-icon>
                                        <h3 class="mt-2">{{ widget.title }}</h3>
                                        <p class="text-caption">{{ widget.description }}</p>
                                    </v-card-text>
                                </v-card>
                            </v-col>
                        </v-row>
                    </v-container>
                    <v-card-actions>
                        <v-spacer />
                        <v-btn 
                            color="primary" 
                            :disabled="!selectedTemplate"
                            @click="nextStep"
                        >
                            Next
                        </v-btn>
                    </v-card-actions>
                </v-stepper-content>

                <!-- Step 2: Configure & Create -->
                <v-stepper-step step="2">
                    Configure & Create
                    <small>Set a new title and create your widget</small>
                </v-stepper-step>
                <v-stepper-content step="2">
                    <v-form ref="configForm" v-model="configValid">
                        <v-text-field
                            v-model="widgetConfig.title"
                            label="Widget Title"
                            :rules="[rules.required]"
                            required
                        />
                        
                        <v-textarea
                            v-model="widgetConfig.description"
                            label="Description"
                            rows="2"
                        />
                    </v-form>

                    <v-card outlined class="mt-4 mb-4">
                        <v-card-title>Widget Preview</v-card-title>
                        <v-card-text>
                            <div class="widget-preview-container">
                                <component
                                    :is="getPreviewComponent()"
                                    v-bind="getPreviewProps()"
                                    preview-mode
                                />
                            </div>
                        </v-card-text>
                    </v-card>
                    
                    <v-card-actions>
                        <v-btn @click="previousStep">Back</v-btn>
                        <v-spacer />
                        <v-btn 
                            color="success" 
                            :loading="creating"
                            :disabled="!configValid"
                            @click="createWidget"
                        >
                            <v-icon left>mdi-plus</v-icon>
                            Create Widget
                        </v-btn>
                    </v-card-actions>
                </v-stepper-content>
            </v-stepper>
        </v-card>
        
        <!-- Success Snackbar -->
        <v-snackbar
            v-model="successSnackbar"
            color="success"
            timeout="3000"
            top
        >
            {{ successMessage }}
            <template #action="{ attrs }">
                <v-btn text v-bind="attrs" @click="successSnackbar = false">
                    Close
                </v-btn>
            </template>
        </v-snackbar>
        
        <!-- Error Snackbar -->
        <v-snackbar
            v-model="errorSnackbar"
            color="error"
            timeout="5000"
            top
        >
            {{ errorMessage }}
            <template #action="{ attrs }">
                <v-btn text v-bind="attrs" @click="errorSnackbar = false">
                    Close
                </v-btn>
            </template>
        </v-snackbar>
    </v-dialog>
</template>

<style scoped>
.widget-wizard {
    max-height: 90vh;
    overflow-y: auto;
}

.wizard-header {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
}

.widget-type-card {
    cursor: pointer;
    transition: all 0.3s ease;
}

.widget-type-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}

.widget-type-card.selected {
    border-color: var(--v-primary-base);
    background-color: rgba(var(--v-primary-base), 0.05);
}

.widget-preview-container {
    border: 1px solid #e0e0e0;
    border-radius: 4px;
    padding: 16px;
    background: #fafafa;
    min-height: 200px;
}
</style>

<script>
import UniversalChart from "@/components/universal/UniversalChart.vue";
import UniversalTable from "@/components/universal/UniversalTable.vue";
import UniversalForm from "@/components/universal/UniversalForm.vue";

export default {
    name: "WidgetCreationWizard",
    components: {
        UniversalChart,
        UniversalTable,
        UniversalForm
    },
    
    props: {
        value: {
            type: Boolean,
            default: false
        },
        dashboardConfig: {
            type: Object,
            default: () => ({ widgets: [] })
        }
    },
    
    data() {
        return {
            currentStep: 1,
            selectedTemplate: null,
            configValid: false,
            creating: false,
            
            // Snackbar properties
            successSnackbar: false,
            successMessage: "",
            errorSnackbar: false,
            errorMessage: "",
            
            widgetConfig: {
                title: "",
                description: ""
            },
            
            rules: {
                required: value => !!value || "This field is required"
            }
        };
    },
    
    computed: {
        show: {
            get() {
                return this.value;
            },
            set(value) {
                this.$emit("input", value);
            }
        },
        
        templateableWidgets() {
            if (!this.dashboardConfig || !this.dashboardConfig.widgets) {
                return [];
            }
            // Show all widgets as templates, not just visible ones
            return this.dashboardConfig.widgets;
        }
    },
    
    watch: {
        dashboardConfig: {
            handler() {
                // Dashboard config updated - no action needed for now
            },
            deep: true
        },
        show(newVal) {
            if (newVal) {
                this.resetWizard();
            }
        }
    },
    
    methods: {
        selectWidgetTemplate(widget) {
            this.selectedTemplate = widget;
            this.widgetConfig.title = `Copy of ${widget.title}`;
            this.widgetConfig.description = widget.description || "";
        },
        
        nextStep() {
            const MAX_STEPS = 2;
            if (this.currentStep < MAX_STEPS) {
                this.currentStep++;
            }
        },
        
        previousStep() {
            if (this.currentStep > 1) {
                this.currentStep--;
            }
        },
        
        getPreviewComponent() {
            return this.selectedTemplate?.component || "div";
        },
        
        getPreviewProps() {
            if (!this.selectedTemplate) return {};

            const props = {
                ...(this.selectedTemplate.props || {}),
                title: this.widgetConfig.title,
                height: 200,
                previewMode: true,
                dataSource: this.selectedTemplate.dataSource
            };
            
            return props;
        },
        
        async createWidget() {
            if (!this.selectedTemplate) return;

            this.creating = true;
            
            try {
                const newWidget = JSON.parse(JSON.stringify(this.selectedTemplate));

                // Assign a new unique ID for the dev area
                newWidget.id = `dev-widget-${Date.now()}`;
                delete newWidget.visible;

                newWidget.title = this.widgetConfig.title;
                newWidget.description = this.widgetConfig.description;
                
                this.$emit("widget-created", newWidget);
                this.closeWizard();
                
                this.successMessage = "Widget created successfully!";
                this.successSnackbar = true;
                
            } catch (error) {
                console.error("Error creating widget:", error);
                this.errorMessage = "Failed to create widget";
                this.errorSnackbar = true;
            } finally {
                this.creating = false;
            }
        },
        
        resetWizard() {
            this.currentStep = 1;
            this.selectedTemplate = null;
            this.configValid = false;
            this.creating = false;
            
            this.widgetConfig = {
                title: "",
                description: ""
            };
        },
        
        closeWizard() {
            this.show = false;
            this.resetWizard();
        }
    }
};
</script>
