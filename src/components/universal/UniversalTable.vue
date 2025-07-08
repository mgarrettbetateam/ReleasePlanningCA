<!-- Universal Table Component - Consolidates all table functionality -->
<template>
    <div class="universal-table-container">
        <!-- Table Controls -->
        <div v-if="showControls" class="table-controls">
            <v-text-field
                v-if="searchable"
                v-model="searchTerm"
                label="Search..."
                prepend-inner-icon="mdi-magnify"
                dense
                outlined
                clearable
                class="search-field"
            />
            
            <v-select
                v-if="filterable && filterOptions.length > 0"
                v-model="selectedFilter"
                :items="filterOptions"
                label="Filter by"
                dense
                outlined
                clearable
                class="filter-select"
            />

            <!-- Export Button -->
            <v-menu v-if="showExportButton" bottom left>
                <template #activator="{ on, attrs }">
                    <v-btn
                        icon
                        small
                        color="primary"
                        class="export-btn"
                        title="Export Data"
                        v-bind="attrs"
                        v-on="on"
                    >
                        <v-icon small>mdi-download</v-icon>
                    </v-btn>
                </template>
                <v-list>
                    <v-list-item @click="exportData('pdf')">
                        <v-list-item-icon>
                            <v-icon>mdi-file-pdf-box</v-icon>
                        </v-list-item-icon>
                        <v-list-item-title>Export as PDF</v-list-item-title>
                    </v-list-item>
                    <v-list-item @click="exportData('csv')">
                        <v-list-item-icon>
                            <v-icon>mdi-file-delimited</v-icon>
                        </v-list-item-icon>
                        <v-list-item-title>Export as CSV</v-list-item-title>
                    </v-list-item>
                </v-list>
            </v-menu>
        </div>

        <!-- Data Table -->
        <v-data-table
            :headers="computedHeaders"
            :items="filteredItems"
            :loading="loading"
            :items-per-page="itemsPerPage"
            :sort-by="sortBy"
            :sort-desc="sortDesc"
            :show-expand="expandable"
            :single-expand="singleExpand"
            :dense="dense"
            :height="tableHeight"
            class="universal-table"
            @click:row="handleRowClick"
        >
            <!-- Custom cell rendering -->
            <template v-for="header in headers" #[`item.${header.value}`]="{ item }">
                <div :key="header.value">
                    <slot 
                        :name="`cell-${header.value}`"
                        :item="item"
                        :value="item[header.value]"
                        :header="header"
                    >
                        <span v-if="header.type === 'link'">
                            <a :href="item[header.value]" target="_blank">
                                {{ formatCellValue(item[header.value], header) }}
                            </a>
                        </span>
                        <v-chip
                            v-else-if="header.type === 'status'"
                            :color="getStatusColor(item[header.value])"
                            small
                            text-color="white"
                        >
                            {{ formatCellValue(item[header.value], header) }}
                        </v-chip>
                        <span v-else>
                            {{ formatCellValue(item[header.value], header) }}
                        </span>
                    </slot>
                </div>
            </template>

            <!-- Expandable content -->
            <template v-if="expandable" #expanded-item="{ headers: tableHeaders, item }">
                <td :colspan="tableHeaders.length">
                    <slot name="expanded-content" :item="item">
                        <div class="expanded-content">
                            <pre>{{ JSON.stringify(item, null, 2) }}</pre>
                        </div>
                    </slot>
                </td>
            </template>

            <!-- Loading slot -->
            <template #loading>
                <div class="table-loading">
                    <v-progress-circular indeterminate color="primary" />
                    <span>Loading data...</span>
                </div>
            </template>

            <!-- No data slot -->
            <template #no-data>
                <div class="no-data">
                    <v-icon large color="grey">mdi-database-off</v-icon>
                    <p>No data available</p>
                </div>
            </template>
        </v-data-table>
    </div>
</template>

<style scoped>
/* All styles moved to BetaStyles.css */
</style>

<script>
export default {
    name: "UniversalTable",
    props: {
        headers: {
            type: Array,
            required: true
        },
        items: {
            type: Array,
            default: () => []
        },
        loading: {
            type: Boolean,
            default: false
        },
        searchable: {
            type: Boolean,
            default: true
        },
        filterable: {
            type: Boolean,
            default: false
        },
        expandable: {
            type: Boolean,
            default: false
        },
        singleExpand: {
            type: Boolean,
            default: true
        },
        dense: {
            type: Boolean,
            default: false
        },
        itemsPerPage: {
            type: Number,
            default: 10
        },
        height: {
            type: [String, Number],
            default: null
        },
        sortBy: {
            type: String,
            default: ""
        },
        sortDesc: {
            type: Boolean,
            default: false
        },
        filterField: {
            type: String,
            default: ""
        },
        showControls: {
            type: Boolean,
            default: true
        },
        showExportButton: {
            type: Boolean,
            default: true
        }
    },
    data() {
        return {
            searchTerm: "",
            selectedFilter: null
        };
    },
    computed: {
        computedHeaders() {
            return this.headers.map(header => ({
                ...header,
                sortable: header.sortable !== false,
                filterable: header.filterable !== false
            }));
        },
        
        filteredItems() {
            let filtered = [...this.items];
            
            // Apply search filter
            if (this.searchTerm) {
                const searchLower = this.searchTerm.toLowerCase();
                filtered = filtered.filter(item => {
                    return this.headers.some(header => {
                        const value = item[header.value];
                        return value && value.toString().toLowerCase().includes(searchLower);
                    });
                });
            }
            
            // Apply dropdown filter
            if (this.selectedFilter && this.filterField) {
                filtered = filtered.filter(item => 
                    item[this.filterField] === this.selectedFilter
                );
            }
            
            return filtered;
        },
        
        filterOptions() {
            if (!this.filterable || !this.filterField) return [];
            
            const uniqueValues = [...new Set(
                this.items
                    .map(item => item[this.filterField])
                    .filter(value => value !== null && value !== undefined)
            )];
            
            return uniqueValues.map(value => ({
                text: value,
                value
            }));
        },
        
        tableHeight() {
            if (this.height) {
                return typeof this.height === "number" ? `${this.height}px` : this.height;
            }
            return null;
        }
    },
    methods: {
        formatCellValue(value, header) {
            if (value === null || value === undefined) return "";
            
            switch (header.type) {
                case "date":
                    return new Date(value).toLocaleDateString();
                case "datetime":
                    return new Date(value).toLocaleString();
                case "currency":
                    return new Intl.NumberFormat("en-US", {
                        style: "currency",
                        currency: header.currency || "USD"
                    }).format(value);
                case "number":
                    return Number(value).toLocaleString();
                case "percentage":
                    return `${(Number(value) * 100).toFixed(1)}%`;
                default:
                    return value.toString();
            }
        },
        
        getStatusColor(status) {
            const statusColors = {
                "completed": "green",
                "in progress": "orange",
                "pending": "yellow",
                "cancelled": "red",
                "approved": "green",
                "rejected": "red",
                "under review": "blue"
            };
            
            return statusColors[status?.toLowerCase()] || "grey";
        },
        
        handleRowClick(item) {
            this.$emit("row-click", item);
        },

        exportData(format) {
            const DATE_FORMAT_LENGTH = 10;
            const fileName = `table-data-${new Date().toISOString().slice(0, DATE_FORMAT_LENGTH)}`;

            if (format === "csv") {
                this.downloadAsCSV(fileName);
            } else if (format === "pdf") {
                this.exportAsPDF(fileName);
            }
        },

        downloadAsCSV(fileName) {
            try {
                const csvContent = this.convertToCSV();
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

        convertToCSV() {
            const headers = this.headers.map(header => header.text);
            const csvHeaders = headers.join(",");
            
            const csvRows = this.filteredItems.map(item => {
                return this.headers.map(header => {
                    const value = item[header.value];
                    const formattedValue = this.formatCellValue(value, header);
                    // Escape commas and quotes in CSV
                    return `"${String(formattedValue).replace(/"/g, '""')}"`;
                }).join(",");
            });
            
            return [csvHeaders, ...csvRows].join("\n");
        },

        exportAsPDF(fileName) {
            try {
                const htmlContent = this.createPDFHTML(fileName);
                this.downloadPDFContent(htmlContent, fileName);
            } catch (error) {
                window.print();
            }
        },

        createPDFHTML(title) {
            const headers = this.headers.map(header => `<th>${header.text}</th>`).join("");
            const rows = this.filteredItems.map(item => {
                const cells = this.headers.map(header => {
                    const value = this.formatCellValue(item[header.value], header);
                    return `<td>${value}</td>`;
                }).join("");
                return `<tr>${cells}</tr>`;
            }).join("");

            return `
                <!DOCTYPE html>
                <html>
                <head>
                    <title>${title}</title>
                    <style>
                        @page { size: A4; margin: 15mm; }
                        body { font-family: Arial, sans-serif; margin: 0; }
                        .header { text-align: center; margin-bottom: 20px; }
                        table { width: 100%; border-collapse: collapse; font-size: 12px; }
                        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                        th { background-color: #f2f2f2; font-weight: bold; }
                        tr:nth-child(even) { background-color: #f9f9f9; }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <h2>Table Export</h2>
                        <p>Generated on ${new Date().toLocaleDateString()}</p>
                    </div>
                    <table>
                        <thead>
                            <tr>${headers}</tr>
                        </thead>
                        <tbody>
                            ${rows}
                        </tbody>
                    </table>
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
        }
    }
};
</script>
