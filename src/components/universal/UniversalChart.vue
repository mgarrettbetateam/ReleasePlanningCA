<!-- Universal Chart Component - Consolidates all chart types -->
<template>
    <div class="universal-chart-container" :style="containerStyle">
        <!-- Export Button -->
        <div v-if="!loading && hasValidData && showExportButton" class="export-button-container">
            <v-menu offset-y>
                <template #activator="{ on, attrs }">
                    <v-btn
                        icon
                        small
                        color="primary"
                        class="export-btn"
                        title="Export Chart"
                        v-bind="attrs"
                        v-on="on"
                    >
                        <v-icon small>mdi-download</v-icon>
                    </v-btn>
                </template>
                <v-list dense>
                    <v-list-item @click="exportChart('pdf')">
                        <v-list-item-icon>
                            <v-icon small>mdi-file-pdf-box</v-icon>
                        </v-list-item-icon>
                        <v-list-item-content>
                            <v-list-item-title>Export as PDF</v-list-item-title>
                        </v-list-item-content>
                    </v-list-item>
                    <v-list-item @click="exportData('csv')">
                        <v-list-item-icon>
                            <v-icon small>mdi-file-delimited</v-icon>
                        </v-list-item-icon>
                        <v-list-item-content>
                            <v-list-item-title>Export Data as CSV</v-list-item-title>
                        </v-list-item-content>
                    </v-list-item>
                </v-list>
            </v-menu>
        </div>

        <div v-if="loading" class="chart-loading">
            <v-progress-circular indeterminate color="primary" />
            <span>Loading chart data...</span>
        </div>
        <div v-else-if="!hasValidData" class="chart-error">
            <v-icon color="grey" size="48">mdi-chart-line</v-icon>
            <span>No chart data available</span>
        </div>
        <canvas 
            v-else
            ref="chartCanvas" 
            :height="height"
        ></canvas>
    </div>
</template>

<style scoped>
/* Component-specific styles that can't be consolidated */
.export-button-container {
    position: absolute;
    top: 10px;
    right: 10px;
    z-index: 10;
}
</style>

<script>
import Chart from "chart.js/auto";

export default {
    name: "UniversalChart",
    props: {
        type: {
            type: String,
            required: true,
            validator: value => ["line", "bar", "pie", "doughnut", "radar", "scatter"].includes(value)
        },
        data: {
            type: Object,
            required: false,
            validator(value) {
                if (!value) return true; // Allow null/undefined for empty state
                return typeof value === "object" && 
                       Array.isArray(value.labels) && 
                       Array.isArray(value.datasets);
            },
            default: () => ({ 
                labels: ["No Data"], 
                datasets: [{ 
                    label: "No Data",
                    data: [0],
                    backgroundColor: "#f0f0f0"
                }] 
            })
        },
        options: {
            type: Object,
            default: () => ({})
        },
        height: {
            type: [String, Number],
            default: 400
        },
        loading: {
            type: Boolean,
            default: false
        },
        theme: {
            type: String,
            default: "default",
            validator: value => ["default", "dark", "minimal"].includes(value)
        },
        showExportButton: {
            type: Boolean,
            default: true
        }
    },
    data() {
        return {
            chart: null,
            resizeObserver: null
        };
    },
    computed: {
        containerStyle() {
            return {
                height: typeof this.height === "number" ? `${this.height}px` : this.height,
                position: "relative"
            };
        },
        hasValidData() {
            if (!this.data || !this.data.datasets || !Array.isArray(this.data.datasets) || this.data.datasets.length === 0) {
                return false;
            }
            
            // Scatter charts don't need labels, just datasets with data
            if (this.type === "scatter") {
                return this.data.datasets.some(dataset => 
                    dataset.data && Array.isArray(dataset.data) && dataset.data.length > 0
                );
            }
            
            // Other chart types need labels
            return this.data.labels && 
                   Array.isArray(this.data.labels) && 
                   this.data.labels.length > 0;
        },
        chartOptions() {
            const baseOptions = {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true,
                        position: "top"
                    },
                    decimation: {
                        enabled: false // Disable decimation to show all points
                    }
                },
                spanGaps: false, // Do not skip points
                ...this.getThemeOptions()
            };
            
            // Add specific options for scatter charts
            if (this.type === "scatter") {
                baseOptions.scales = {
                    x: {
                        type: "linear",
                        position: "bottom",
                        title: {
                            display: true,
                            text: "Quantity"
                        }
                    },
                    y: {
                        type: "linear",
                        title: {
                            display: true,
                            text: "Days Until Release"
                        }
                    }
                };
                
                baseOptions.plugins.tooltip = {
                    callbacks: {
                        label(context) {
                            const point = context.raw;
                            return `${point.label || "Point"}: (${point.x}, ${point.y})`;
                        }
                    }
                };
            }
            
            return this.mergeDeep(baseOptions, this.options);
        }
    },
    watch: {
        data: {
            handler(newData) {
                // eslint-disable-next-line no-console
                console.log("[UniversalChart] Data watcher triggered with:", newData);
                this.updateChart(newData);
            },
            deep: true
        },
        type() {
            this.recreateChart();
        },
        options: {
            handler() {
                this.recreateChart();
            },
            deep: true
        }
    },
    mounted() {
        this.$nextTick(() => {
            this.initChart();
            this.setupResizeObserver();
        });
    },
    beforeDestroy() {
        this.destroyChart();
        if (this.resizeObserver) {
            this.resizeObserver.disconnect();
        }
    },
    methods: {
        initChart() {
            if (!this.$refs.chartCanvas) {
                console.warn("Canvas ref not available for chart initialization");
                return;
            }
            
            // Validate data before creating chart
            if (!this.hasValidData) {
                console.warn("Invalid chart data provided for", this.type, "chart");
                return;
            }
            
            const ctx = this.$refs.chartCanvas.getContext("2d");
            
            try {
                this.chart = new Chart(ctx, {
                    type: this.type,
                    data: this.data,
                    options: this.chartOptions
                });
            } catch (error) {
                console.error("Error creating chart:", error);
            }
        },
        
        updateChart(newData) {
            if (this.chart && newData) {
                // eslint-disable-next-line no-console
                console.log("[UniversalChart] updateChart called with new data:", newData);
                
                this.chart.data = newData;
                this.chart.update("none"); // No animation for better performance
                
                // eslint-disable-next-line no-console
                console.log("[UniversalChart] Chart updated successfully");
            } else {
                // eslint-disable-next-line no-console
                console.warn("[UniversalChart] updateChart called but chart or data is missing", {
                    hasChart: !!this.chart,
                    hasData: !!newData
                });
            }
        },
        
        recreateChart() {
            // eslint-disable-next-line no-console
            console.log("[UniversalChart] recreateChart called");
            this.destroyChart();
            this.$nextTick(() => {
                this.initChart();
                // eslint-disable-next-line no-console
                console.log("[UniversalChart] Chart recreated successfully");
            });
        },
        
        forceUpdate() {
            // eslint-disable-next-line no-console
            console.log("[UniversalChart] forceUpdate called");
            if (this.chart) {
                this.chart.data = this.data;
                this.chart.update("active"); // Use active animation to ensure visible update
                // eslint-disable-next-line no-console
                console.log("[UniversalChart] Forced update with active animation");
            } else {
                // eslint-disable-next-line no-console
                console.log("[UniversalChart] No chart to update, recreating");
                this.recreateChart();
            }
        },
        
        destroyChart() {
            if (this.chart) {
                this.chart.destroy();
                this.chart = null;
            }
        },
        
        setupResizeObserver() {
            if (window.ResizeObserver) {
                this.resizeObserver = new ResizeObserver(() => {
                    if (this.chart) {
                        this.chart.resize();
                    }
                });
                this.resizeObserver.observe(this.$refs.chartCanvas);
            }
        },
        
        getThemeOptions() {
            const themes = {
                default: {
                    backgroundColor: "rgba(75, 192, 192, 0.2)",
                    borderColor: "rgba(75, 192, 192, 1)"
                },
                dark: {
                    backgroundColor: "rgba(255, 255, 255, 0.1)",
                    borderColor: "rgba(255, 255, 255, 0.8)",
                    plugins: {
                        legend: {
                            labels: {
                                color: "white"
                            }
                        }
                    },
                    scales: {
                        x: {
                            ticks: { color: "white" },
                            grid: { color: "rgba(255, 255, 255, 0.1)" }
                        },
                        y: {
                            ticks: { color: "white" },
                            grid: { color: "rgba(255, 255, 255, 0.1)" }
                        }
                    }
                },
                minimal: {
                    plugins: {
                        legend: {
                            display: true
                        }
                    },
                    elements: {
                        point: {
                            radius: 2
                        }
                    }
                }
            };
            
            return themes[this.theme] || themes.default;
        },
        
        mergeDeep(target, source) {
            const result = { ...target };
            
            for (const key in source) {
                if (source[key] && typeof source[key] === "object" && !Array.isArray(source[key])) {
                    result[key] = this.mergeDeep(result[key] || {}, source[key]);
                } else {
                    result[key] = source[key];
                }
            }
            
            return result;
        },
        
        exportChart(format) {
            if (!this.chart || !this.$refs.chartCanvas) {
                return;
            }

            const canvas = this.$refs.chartCanvas;
            const DATE_FORMAT_LENGTH = 10;
            const fileName = `chart-${new Date().toISOString().slice(0, DATE_FORMAT_LENGTH)}`;

            if (format === "pdf") {
                this.exportAsPDF(fileName, canvas);
            }
        },
        
        exportData(format) {
            if (!this.data) {
                return;
            }

            const DATE_FORMAT_LENGTH = 10;
            const fileName = `chart-data-${new Date().toISOString().slice(0, DATE_FORMAT_LENGTH)}`;

            if (format === "csv") {
                this.downloadAsCSV(fileName);
            }
        },

        exportAsPDF(fileName, canvas) {
            try {
                this.createPDFFromCanvas(canvas, fileName);
            } catch (error) {
                // Fallback - open print dialog
                window.print();
            }
        },

        createPDFFromCanvas(canvas, fileName) {
            const imgData = canvas.toDataURL("image/png");
            const pdfContent = this.createPDFHTML(imgData, fileName);
            this.downloadPDFContent(pdfContent, fileName);
        },

        createPDFHTML(imgData, title) {
            return `
                <!DOCTYPE html>
                <html>
                <head>
                    <title>${title}</title>
                    <style>
                        @page { size: A4; margin: 20mm; }
                        body { margin: 0; padding: 0; font-family: Arial, sans-serif; }
                        .header { text-align: center; margin-bottom: 20px; }
                        .chart-container { text-align: center; }
                        img { max-width: 100%; height: auto; }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <h2>Chart Export</h2>
                        <p>Generated on ${new Date().toLocaleDateString()}</p>
                    </div>
                    <div class="chart-container">
                        <img src="${imgData}" alt="Chart" />
                    </div>
                </body>
                </html>
            `;
        },

        downloadPDFContent(htmlContent, fileName) {
            try {
                const printWindow = window.open("", "_blank");
                printWindow.document.write(htmlContent);
                printWindow.document.close();
                
                const PRINT_DELAY = 500;
                setTimeout(() => {
                    printWindow.print();
                }, PRINT_DELAY);
            } catch (error) {
                const blob = new Blob([htmlContent], { type: "text/html" });
                const url = URL.createObjectURL(blob);
                const link = document.createElement("a");
                link.href = url;
                link.download = `${fileName}.html`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
            }
        },

        downloadAsCSV(fileName) {
            try {
                const csvContent = this.convertDataToCSV();
                const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
                const url = URL.createObjectURL(blob);
                const link = document.createElement("a");
                link.href = url;
                link.download = `${fileName}.csv`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
            } catch (error) {
                // Silently handle error
            }
        },

        convertDataToCSV() {
            if (!this.data || !this.data.labels || !this.data.datasets) {
                return "";
            }

            const labels = this.data.labels;
            const datasets = this.data.datasets;
            
            const headers = ["Label", ...datasets.map(dataset => dataset.label || "Dataset")];
            let csvContent = headers.join(",") + "\n";
            
            labels.forEach((label, index) => {
                const row = [label];
                datasets.forEach(dataset => {
                    const value = dataset.data[index] !== undefined ? dataset.data[index] : "";
                    row.push(value);
                });
                csvContent += row.join(",") + "\n";
            });
            
            return csvContent;
        }
    }
};
</script>
