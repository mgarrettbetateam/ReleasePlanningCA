<script>
/* eslint-disable no-console */
import { Line, mixins } from "vue-chartjs";

export default {
    name: "ReleaseChart",
    extends: Line,
    mixins: [mixins.reactiveProp],
    props: {
        chartOptions: {
            type: Object,
            default: () => ({
                responsive: true,
                maintainAspectRatio: false
            })
        }
    },
    watch: {
        chartData: {
            handler(newData) {
                console.log("🔄 Chart data changed in ReleaseChart:", newData);
                console.log("🔄 New labels count:", newData?.labels?.length || 0);
                console.log("🔄 New datasets count:", newData?.datasets?.length || 0);
                if (newData?.datasets?.length > 0) {
                    console.log("🔄 Dataset sample:", newData.datasets[0]);
                    console.log("🔄 First dataset data points:", newData.datasets[0]?.data?.length || 0);
                }
                
                // Re-render chart when data changes
                if (this.$data._chart) {
                    this.$data._chart.destroy();
                }
                if (newData && newData.labels && newData.labels.length > 0) {
                    this.renderChart(newData, {
                        ...this.chartOptions,
                        responsive: true,
                        maintainAspectRatio: false
                    });
                }
            },
            deep: true
        },
        chartOptions: {
            handler(newOptions) {
                console.log("📊 Chart options changed:", newOptions);
                if (this.$data._chart) {
                    this.$data._chart.destroy();
                }
                if (this.chartData && this.chartData.labels && this.chartData.labels.length > 0) {
                    this.renderChart(this.chartData, {
                        ...newOptions,
                        responsive: true,
                        maintainAspectRatio: false
                    });
                }
            },
            deep: true
        }
    },
    mounted() {
        console.log("🎯 ReleaseChart mounted!");
        console.log("🎯 Initial chartData:", this.chartData);
        console.log("🎯 Chart labels:", this.chartData?.labels?.length || 0);
        console.log("🎯 Chart datasets:", this.chartData?.datasets?.length || 0);
        
        if (this.chartData && this.chartData.labels && this.chartData.labels.length > 0) {
            console.log("🎯 Rendering chart with valid data");
            this.renderChart(this.chartData, {
                ...this.chartOptions,
                responsive: true,
                maintainAspectRatio: false
            });
        } else {
            console.log("🎯 No valid data to render chart initially");
        }
    }
};
</script>
