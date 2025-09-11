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
        },
        // Allow consumers to provide Chart.js plugins (Chart.js v2 compatible)
        extraPlugins: {
            type: Array,
            default: () => []
        }
    },
    data() {
        return {
            pluginIds: new Set()
        };
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
                // Ensure plugins are applied before rendering
                this.applyExtraPlugins();
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
                // Ensure plugins are applied before rendering
                this.applyExtraPlugins();
                if (this.chartData && this.chartData.labels && this.chartData.labels.length > 0) {
                    this.renderChart(this.chartData, {
                        ...newOptions,
                        responsive: true,
                        maintainAspectRatio: false
                    });
                }
            },
            deep: true
        },
        // Re-render when plugins change
        extraPlugins: {
            handler() {
                if (this.$data._chart) {
                    this.$data._chart.destroy();
                }
                this.pluginIds.clear();
                this.applyExtraPlugins();
                if (this.chartData && this.chartData.labels && this.chartData.labels.length > 0) {
                    this.renderChart(this.chartData, {
                        ...this.chartOptions,
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
        
        // Apply any extra plugins before the initial render
        this.applyExtraPlugins();

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
    },
    methods: {
        applyExtraPlugins() {
            if (!this.extraPlugins || !Array.isArray(this.extraPlugins)) return;
            this.extraPlugins.forEach(p => {
                // Avoid duplicate registrations by id if provided
                const id = p && (p.id || p.name || JSON.stringify(p));
                if (id && this.pluginIds.has(id)) return;
                if (typeof this.addPlugin === "function") {
                    this.addPlugin(p);
                    if (id) this.pluginIds.add(id);
                }
            });
        }
    }
};
</script>
