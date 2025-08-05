<template>
    <v-dialog v-model="dialog" max-width="500px">
        <v-card>
            <v-card-title class="pa-4">
                <v-icon left color="primary">mdi-export</v-icon>
                Export Configuration
                <v-spacer />
                <v-btn icon @click="close">
                    <v-icon>mdi-close</v-icon>
                </v-btn>
            </v-card-title>
            
            <v-card-text class="pa-4">
                <v-alert type="info" outlined dense class="mb-4">
                    <div class="text-body-2">
                        Export your dashboard configuration for backup or sharing.
                    </div>
                </v-alert>
                
                <v-select
                    v-model="exportFormat"
                    :items="formatOptions"
                    label="Export Format"
                    outlined
                    dense
                />
                
                <v-checkbox
                    v-model="includeData"
                    label="Include sample data"
                    dense
                />
                
                <v-textarea
                    v-model="exportPreview"
                    label="Preview"
                    outlined
                    readonly
                    rows="6"
                    dense
                />
            </v-card-text>
            
            <v-card-actions class="pa-4">
                <v-spacer />
                <v-btn text @click="close">
                    Cancel
                </v-btn>
                <v-btn color="primary" @click="downloadExport">
                    <v-icon small left>mdi-download</v-icon>
                    Download
                </v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<style scoped>
.v-textarea {
    font-family: monospace;
}
</style>

<script>
export default {
    name: "ExportDialog",
    props: {
        modelValue: {
            type: Boolean,
            default: false
        },
        data: {
            type: Object,
            default: () => ({})
        }
    },
    emits: ["update:modelValue"],
    data() {
        return {
            exportFormat: "json",
            includeData: false,
            formatOptions: [
                { text: "JSON", value: "json" },
                { text: "YAML", value: "yaml" },
                { text: "JavaScript", value: "js" }
            ]
        };
    },
    computed: {
        dialog: {
            get() {
                return this.modelValue;
            },
            set(value) {
                this.$emit("update:modelValue", value);
            }
        },
        exportPreview() {
            const exportData = {
                timestamp: new Date().toISOString(),
                format: this.exportFormat,
                config: this.data || {},
                ...(this.includeData && { sampleData: this.getSampleData() })
            };
            
            switch (this.exportFormat) {
                case "yaml":
                    return this.toYaml(exportData);
                case "js":
                    return `export const config = ${JSON.stringify(exportData, null, 2)};`;
                default:
                    return JSON.stringify(exportData, null, 2);
            }
        }
    },
    methods: {
        close() {
            this.dialog = false;
        },
        downloadExport() {
            const filename = `dashboard-config-${Date.now()}.${this.exportFormat}`;
            const blob = new Blob([this.exportPreview], { type: "text/plain" });
            const url = URL.createObjectURL(blob);
            
            const link = document.createElement("a");
            link.href = url;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            
            this.close();
        },
        getSampleData() {
            return {
                widgets: ["chart", "table", "form"],
                layout: "grid",
                theme: "default"
            };
        },
        toYaml(obj, indent = 0) {
            const spaces = "  ".repeat(indent);
            let yaml = "";
            
            for (const [key, value] of Object.entries(obj)) {
                if (typeof value === "object" && value !== null && !Array.isArray(value)) {
                    yaml += `${spaces}${key}:\n${this.toYaml(value, indent + 1)}`;
                } else if (Array.isArray(value)) {
                    yaml += `${spaces}${key}:\n`;
                    value.forEach(item => {
                        yaml += `${spaces}  - ${item}\n`;
                    });
                } else {
                    yaml += `${spaces}${key}: ${value}\n`;
                }
            }
            
            return yaml;
        }
    }
};
</script>
