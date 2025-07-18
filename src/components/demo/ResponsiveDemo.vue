<!-- Responsive Demo Component -->
<template>
    <div class="responsive-demo">
        <v-container>
            <v-row>
                <v-col cols="12">
                    <h1>📱 Responsive Design Demo</h1>
                    <p>This demo shows how components automatically resize to fit the current window size.</p>
                </v-col>
            </v-row>
            
            <!-- Responsive Info Card -->
            <v-row>
                <v-col cols="12" md="4">
                    <v-card class="responsive-info-card">
                        <v-card-title>
                            <v-icon left>{{ deviceIcon }}</v-icon>
                            Current Device
                        </v-card-title>
                        <v-card-text>
                            <div class="info-item">
                                <strong>Breakpoint:</strong> {{ $breakpoint }}
                            </div>
                            <div class="info-item">
                                <strong>Screen Size:</strong> {{ $windowSize.width }}×{{ $windowSize.height }}
                            </div>
                            <div class="info-item">
                                <strong>Mobile:</strong> {{ $isMobile ? 'Yes' : 'No' }}
                            </div>
                            <div class="info-item">
                                <strong>Tablet:</strong> {{ $isTablet ? 'Yes' : 'No' }}
                            </div>
                            <div class="info-item">
                                <strong>Desktop:</strong> {{ $isDesktop ? 'Yes' : 'No' }}
                            </div>
                        </v-card-text>
                    </v-card>
                </v-col>
                
                <!-- Responsive Chart -->
                <v-col cols="12" md="8">
                    <v-card>
                        <v-card-title>
                            <v-icon left>mdi-chart-line</v-icon>
                            Responsive Chart
                        </v-card-title>
                        <v-card-text>
                            <div 
                                class="chart-container-responsive"
                                :style="{ height: `${chartHeight}px` }"
                            >
                                <canvas ref="demoChart"></canvas>
                            </div>
                        </v-card-text>
                    </v-card>
                </v-col>
            </v-row>
            
            <!-- Responsive Table -->
            <v-row>
                <v-col cols="12">
                    <v-card>
                        <v-card-title>
                            <v-icon left>mdi-table</v-icon>
                            Responsive Table
                        </v-card-title>
                        <v-card-text>
                            <div 
                                class="table-container-responsive"
                                :style="{ height: `${tableHeight}px` }"
                            >
                                <v-data-table
                                    :headers="responsiveHeaders"
                                    :items="demoData"
                                    :dense="$isMobile"
                                    :items-per-page="responsiveItemsPerPage"
                                    :fixed-header="$isDesktop"
                                    :hide-default-footer="$isMobile"
                                    :mobile-breakpoint="600"
                                    :height="tableHeight"
                                />
                            </div>
                        </v-card-text>
                    </v-card>
                </v-col>
            </v-row>
            
            <!-- Responsive Grid -->
            <v-row>
                <v-col cols="12">
                    <h2>Responsive Grid Layout</h2>
                    <p>This grid automatically adjusts columns based on screen size.</p>
                    <div class="grid-responsive-auto">
                        <v-card 
                            v-for="(item, index) in gridItems" 
                            :key="index"
                            class="pa-4"
                        >
                            <v-card-title>{{ item.title }}</v-card-title>
                            <v-card-text>{{ item.description }}</v-card-text>
                        </v-card>
                    </div>
                </v-col>
            </v-row>
            
            <!-- Resize Instructions -->
            <v-row>
                <v-col cols="12">
                    <v-alert type="info" class="mt-4">
                        <h3>📐 Try Resizing Your Window</h3>
                        <p>
                            Watch how the components automatically adjust their size and layout 
                            as you resize the browser window. The chart height, table rows, 
                            and grid layout will all adapt to provide the best experience 
                            for your current screen size.
                        </p>
                    </v-alert>
                </v-col>
            </v-row>
        </v-container>
    </div>
</template>

<style scoped>
.responsive-demo {
    padding: 20px;
}

.responsive-info-card {
    height: 100%;
}

.info-item {
    margin-bottom: 8px;
    padding: 4px 0;
    border-bottom: 1px solid #eee;
}

.chart-container-responsive {
    position: relative;
    width: 100%;
}

.chart-container-responsive canvas {
    width: 100% !important;
    height: 100% !important;
}

.table-container-responsive {
    position: relative;
    width: 100%;
    overflow: auto;
}

.grid-responsive-auto {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 16px;
    margin-top: 16px;
}
</style>

<script>
import Chart from "chart.js";

export default {
    name: "ResponsiveDemo",
    
    data() {
        return {
            chart: null,
            chartHeight: 400,
            tableHeight: 400,
            
            // Demo data
            demoData: [
                { id: 1, name: "Item 1", category: "A", value: 100, status: "Active" },
                { id: 2, name: "Item 2", category: "B", value: 200, status: "Inactive" },
                { id: 3, name: "Item 3", category: "A", value: 150, status: "Active" },
                { id: 4, name: "Item 4", category: "C", value: 300, status: "Active" },
                { id: 5, name: "Item 5", category: "B", value: 250, status: "Inactive" },
                { id: 6, name: "Item 6", category: "A", value: 180, status: "Active" },
                { id: 7, name: "Item 7", category: "C", value: 220, status: "Active" },
                { id: 8, name: "Item 8", category: "B", value: 170, status: "Inactive" }
            ],
            
            gridItems: [
                { title: "Card 1", description: "This card adapts to the available space" },
                { title: "Card 2", description: "The grid automatically adjusts columns" },
                { title: "Card 3", description: "Mobile shows 1 column, tablet shows 2-3" },
                { title: "Card 4", description: "Desktop shows the full grid layout" },
                { title: "Card 5", description: "Each card maintains proper spacing" },
                { title: "Card 6", description: "The layout is fully responsive" }
            ]
        };
    },
    
    computed: {
        deviceIcon() {
            if (this.$isMobile) return "mdi-cellphone";
            if (this.$isTablet) return "mdi-tablet";
            return "mdi-desktop-mac";
        },
        
        responsiveHeaders() {
            const baseHeaders = [
                { text: "ID", value: "id", essential: true },
                { text: "Name", value: "name", essential: true },
                { text: "Category", value: "category", mobileVisible: false },
                { text: "Value", value: "value", essential: true },
                { text: "Status", value: "status", mobileVisible: false }
            ];
            
            return baseHeaders.filter(header => {
                if (this.$isMobile) {
                    return header.essential !== false && header.mobileVisible !== false;
                }
                return true;
            });
        },
        
        responsiveItemsPerPage() {
            if (this.$isMobile) return 5;
            if (this.$isTablet) return 10;
            return 15;
        }
    },
    
    watch: {
        $breakpoint() {
            this.updateResponsiveDimensions();
        }
    },
    
    mounted() {
        this.updateResponsiveDimensions();
        this.initChart();
    },
    
    beforeDestroy() {
        if (this.chart) {
            this.chart.destroy();
        }
    },
    
    methods: {
        updateResponsiveDimensions() {
            // Update chart height based on breakpoint
            if (this.$isMobile) {
                this.chartHeight = 250;
                this.tableHeight = 300;
            } else if (this.$isTablet) {
                this.chartHeight = 300;
                this.tableHeight = 350;
            } else {
                this.chartHeight = 400;
                this.tableHeight = 400;
            }
            
            // Update chart if it exists
            if (this.chart) {
                this.chart.resize();
            }
        },
        
        initChart() {
            if (!this.$refs.demoChart) return;
            
            const ctx = this.$refs.demoChart.getContext("2d");
            
            this.chart = new Chart(ctx, {
                type: "line",
                data: {
                    labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
                    datasets: [{
                        label: "Responsive Data",
                        data: [12, 19, 3, 5, 2, 3],
                        borderColor: "#2196F3",
                        backgroundColor: "rgba(33, 150, 243, 0.1)",
                        fill: true
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: !this.$isMobile,
                            position: this.$isMobile ? "bottom" : "top"
                        }
                    },
                    scales: {
                        x: {
                            ticks: {
                                maxRotation: this.$isMobile ? 45 : 0,
                                fontSize: this.$isMobile ? 10 : 12
                            }
                        },
                        y: {
                            ticks: {
                                fontSize: this.$isMobile ? 10 : 12
                            }
                        }
                    }
                }
            });
        }
    }
};
</script>
