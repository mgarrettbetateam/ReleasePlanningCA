<template>
    <v-form ref="form" v-model="valid" class="universal-form">
        <!-- Form Title -->
        <div v-if="title" class="form-header mb-20">
            <h2 class="font-lg font-medium">{{ title }}</h2>
            <p v-if="description" class="text-secondary font-sm">{{ description }}</p>
        </div>

        <!-- Dynamic Form Fields -->
        <div class="form-fields">
            <v-row>
                <v-col
                    v-for="field in fields"
                    :key="field.name"
                    :cols="getFieldCols(field)"
                    :md="getFieldMd(field)"
                >
                    <!-- Text Input -->
                    <v-text-field
                        v-if="field.type === 'text' || field.type === 'email'"
                        v-model="formData[field.name]"
                        :label="field.label"
                        :type="field.type"
                        :required="field.required"
                        :rules="getFieldRules(field)"
                        :disabled="loading"
                        outlined
                        dense
                    />

                    <!-- Number Input -->
                    <v-text-field
                        v-else-if="field.type === 'number'"
                        v-model.number="formData[field.name]"
                        :label="field.label"
                        type="number"
                        :required="field.required"
                        :rules="getFieldRules(field)"
                        :disabled="loading"
                        outlined
                        dense
                    />

                    <!-- Select/Dropdown -->
                    <v-select
                        v-else-if="field.type === 'select'"
                        v-model="formData[field.name]"
                        :items="field.options"
                        :label="field.label"
                        :required="field.required"
                        :rules="getFieldRules(field)"
                        :disabled="loading"
                        outlined
                        dense
                    />

                    <!-- Checkbox -->
                    <v-checkbox
                        v-else-if="field.type === 'checkbox'"
                        v-model="formData[field.name]"
                        :label="field.label"
                        :required="field.required"
                        :rules="getFieldRules(field)"
                        :disabled="loading"
                    />

                    <!-- Date Picker -->
                    <v-menu
                        v-else-if="field.type === 'date'"
                        v-model="dateMenus[field.name]"
                        :close-on-content-click="false"
                        transition="scale-transition"
                        offset-y
                        max-width="290px"
                        min-width="auto"
                    >
                        <template #activator="{ on, attrs }">
                            <v-text-field
                                v-model="formData[field.name]"
                                :label="field.label"
                                :required="field.required"
                                :rules="getFieldRules(field)"
                                :disabled="loading"
                                outlined
                                dense
                                readonly
                                v-bind="attrs"
                                v-on="on"
                            />
                        </template>
                        <v-date-picker
                            v-model="formData[field.name]"
                            no-title
                            scrollable
                            @input="dateMenus[field.name] = false"
                        />
                    </v-menu>

                    <!-- Textarea -->
                    <v-textarea
                        v-else-if="field.type === 'textarea'"
                        v-model="formData[field.name]"
                        :label="field.label"
                        :required="field.required"
                        :rules="getFieldRules(field)"
                        :disabled="loading"
                        :rows="field.rows || 3"
                        outlined
                        dense
                    />
                </v-col>
            </v-row>
        </div>

        <!-- Form Actions -->
        <div class="form-actions mt-20">
            <v-btn
                v-if="showSubmit"
                :loading="loading"
                :disabled="!valid"
                color="primary"
                @click="handleSubmit"
            >
                {{ submitText }}
            </v-btn>
            
            <v-btn
                v-if="showReset"
                :disabled="loading"
                text
                class="ml-12"
                @click="handleReset"
            >
                {{ resetText }}
            </v-btn>

            <v-btn
                v-if="showCancel"
                :disabled="loading"
                text
                class="ml-12"
                @click="handleCancel"
            >
                {{ cancelText }}
            </v-btn>
        </div>

        <!-- Success/Error Messages -->
        <v-alert
            v-if="successMessage"
            type="success"
            dense
            class="mt-16"
        >
            {{ successMessage }}
        </v-alert>

        <v-alert
            v-if="errorMessage"
            type="error"
            dense
            class="mt-16"
        >
            {{ errorMessage }}
        </v-alert>
    </v-form>
</template>

<style scoped>
.universal-form {
    width: 100%;
}

.form-header {
    text-align: center;
    padding-bottom: var(--spacing-md);
    border-bottom: 1px solid var(--light-border);
}

.form-fields {
    margin: var(--spacing-md) 0;
}

.form-actions {
    display: flex;
    justify-content: center;
    align-items: center;
    padding-top: var(--spacing-md);
    border-top: 1px solid var(--light-border);
}

@media (max-width: 600px) {
    .form-actions {
        flex-direction: column;
        gap: var(--spacing-sm);
    }
    
    .form-actions .v-btn {
        margin: 0 !important;
        width: 100%;
    }
}
</style>

<script>
export default {
    name: "UniversalForm",
    props: {
        // Form configuration
        title: {
            type: String,
            default: ""
        },
        description: {
            type: String,
            default: ""
        },
        fields: {
            type: Array,
            required: true,
            validator: fields => {
                return fields.every(field => field.name && field.type);
            }
        },
        
        // Form behavior
        initialData: {
            type: Object,
            default: () => ({})
        },
        validation: {
            type: Object,
            default: () => ({})
        },
        
        // API integration
        submitEndpoint: {
            type: String,
            default: ""
        },
        method: {
            type: String,
            default: "POST",
            validator: value => ["GET", "POST", "PUT", "PATCH", "DELETE"].includes(value)
        },
        
        // UI customization
        showSubmit: {
            type: Boolean,
            default: true
        },
        showReset: {
            type: Boolean,
            default: true
        },
        showCancel: {
            type: Boolean,
            default: false
        },
        submitText: {
            type: String,
            default: "Submit"
        },
        resetText: {
            type: String,
            default: "Reset"
        },
        cancelText: {
            type: String,
            default: "Cancel"
        },
        
        // Layout
        fieldsPerRow: {
            type: Number,
            default: 1,
            validator: value => {
                const MIN_FIELDS = 1;
                const MAX_FIELDS = 4;
                return value >= MIN_FIELDS && value <= MAX_FIELDS;
            }
        }
    },
    
    data() {
        return {
            valid: false,
            loading: false,
            formData: {},
            dateMenus: {},
            successMessage: "",
            errorMessage: ""
        };
    },
    
    watch: {
        initialData: {
            handler(newData) {
                this.initializeFormData(newData);
            },
            immediate: true,
            deep: true
        }
    },
    
    methods: {
        initializeFormData(data = {}) {
            const formData = { ...data };
            
            // Initialize all field values
            this.fields.forEach(field => {
                if (!(field.name in formData)) {
                    formData[field.name] = this.getDefaultValue(field);
                }
                
                // Initialize date menus
                if (field.type === "date") {
                    this.$set(this.dateMenus, field.name, false);
                }
            });
            
            this.formData = formData;
        },
        
        getDefaultValue(field) {
            switch (field.type) {
                case "checkbox":
                    return false;
                case "number":
                    return 0;
                case "select":
                    return field.multiple ? [] : "";
                default:
                    return "";
            }
        },
        
        getFieldCols(field) {
            if (field.cols) return field.cols;
            const TOTAL_COLUMNS = 12;
            return Math.floor(TOTAL_COLUMNS / this.fieldsPerRow);
        },
        
        getFieldMd(field) {
            if (field.md) return field.md;
            return this.getFieldCols(field);
        },
        
        getFieldRules(field) {
            const rules = [];
            
            // Required validation
            if (field.required) {
                rules.push(v => !!v || `${field.label} is required`);
            }
            
            // Email validation
            if (field.type === "email") {
                rules.push(v => !v || /.+@.+\..+/.test(v) || "E-mail must be valid");
            }
            
            // Custom validation from props
            if (this.validation[field.name]) {
                rules.push(this.validation[field.name]);
            }
            
            // Field-specific validation
            if (field.min !== undefined && field.type === "number") {
                rules.push(v => v >= field.min || `Minimum value is ${field.min}`);
            }
            
            if (field.max !== undefined && field.type === "number") {
                rules.push(v => v <= field.max || `Maximum value is ${field.max}`);
            }
            
            if (field.minLength !== undefined) {
                rules.push(v => !v || v.length >= field.minLength || `Minimum length is ${field.minLength}`);
            }
            
            if (field.maxLength !== undefined) {
                rules.push(v => !v || v.length <= field.maxLength || `Maximum length is ${field.maxLength}`);
            }
            
            return rules;
        },
        
        async handleSubmit() {
            if (!this.$refs.form.validate()) {
                return;
            }
            
            this.loading = true;
            this.clearMessages();
            
            try {
                // Emit submit event
                this.$emit("submit", this.formData);
                
                // If endpoint is provided, make API call
                if (this.submitEndpoint) {
                    const response = await this.submitToApi();
                    this.successMessage = "Form submitted successfully!";
                    this.$emit("submit-success", response);
                }
                
            } catch (error) {
                this.errorMessage = error.message || "An error occurred while submitting the form";
                this.$emit("submit-error", error);
            } finally {
                this.loading = false;
            }
        },
        
        async submitToApi() {
            // This would integrate with the ApiService
            // For now, simulate API call
            return new Promise((resolve, reject) => {
                const SIMULATE_DELAY = 1000;
                const SUCCESS_RATE = 0.9;
                
                setTimeout(() => {
                    // Simulate success/failure
                    if (Math.random() > SUCCESS_RATE) {
                        resolve({ success: true, data: this.formData });
                    } else {
                        reject(new Error("API Error: Could not submit form"));
                    }
                }, SIMULATE_DELAY);
            });
        },
        
        handleReset() {
            this.$refs.form.reset();
            this.initializeFormData(this.initialData);
            this.clearMessages();
            this.$emit("reset");
        },
        
        handleCancel() {
            this.clearMessages();
            this.$emit("cancel");
        },
        
        clearMessages() {
            this.successMessage = "";
            this.errorMessage = "";
        },
        
        // Public methods for parent components
        validate() {
            return this.$refs.form.validate();
        },
        
        resetValidation() {
            this.$refs.form.resetValidation();
        },
        
        getData() {
            return { ...this.formData };
        },
        
        setData(data) {
            this.formData = { ...this.formData, ...data };
        }
    }
};
</script>
