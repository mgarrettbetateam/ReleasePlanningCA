<template>
    <div class="part-planner">
        <v-card class="pa-4" outlined>
            <v-card-title class="headline">Part Planner</v-card-title>
            <v-card-text>
                <v-form>
                    <!-- Show loading spinner while data is loading -->
                    <template v-if="loading">
                        <v-progress-circular indeterminate color="primary" />
                    </template>
                    <template v-else>
                        <!-- Top Section: Basic part info -->
                        <v-row dense>
                            <v-col cols="12" sm="6">
                                <v-text-field v-model="form.partNumber" label="Part Number" />
                            </v-col>
                            <v-col cols="12" sm="6">
                                <v-text-field v-model="form.partName" label="Part Name" />
                            </v-col>
                            <v-col cols="12" sm="6">
                                <v-text-field v-model="form.owner" label="Owner" />
                            </v-col>
                            <v-col cols="12" sm="6">
                                <v-text-field v-model="form.organization" label="Organization" />
                            </v-col>
                        </v-row>
                        <v-divider class="my-4" />
                        <!-- Middle Section: Requirement and manufacturing info -->
                        <v-row dense>
                            <v-col cols="12" sm="6">
                                <v-text-field v-model="form.deliverableFor" label="Deliverable For" />
                            </v-col>
                            <v-col cols="12" sm="6">
                                <v-text-field v-model="form.materialRequiredDate" label="Mat’l Req’d Date" />
                            </v-col>
                            <v-col cols="12" sm="6">
                                <v-text-field v-model="form.mfgSeqGroup" label="Mfg Seq Group" />
                            </v-col>
                            <v-col cols="12" sm="6">
                                <v-text-field v-model="form.requiredDateMod" label="Req’d Date Mod" />
                            </v-col>
                        </v-row>
                        <v-divider class="my-4" />
                        <!-- Timeline Section: Lead times and expedite info -->
                        <v-row dense>
                            <v-col cols="12" sm="6">
                                <v-text-field v-model="form.targetRelease" label="Target Release" />
                            </v-col>
                            <v-col cols="12" sm="6">
                                <v-text-field v-model="form.toolLeadTime" label="Tool Lead Time" />
                            </v-col>
                            <v-col cols="12" sm="6">
                                <v-text-field v-model="form.partLeadTime" label="Part Lead Time" />
                            </v-col>
                            <v-col cols="12" sm="6">
                                <v-text-field v-model="form.expediteMod" label="Expedite Mod" />
                            </v-col>
                        </v-row>
                        <v-divider class="my-4" />
                        <!-- Estimations Section -->
                        <v-row dense>
                            <v-col cols="12" sm="6">
                                <v-text-field v-model="form.estMaterialReadyDate" label="Est. Mat’l Ready Date" />
                            </v-col>
                            <v-col cols="12" sm="6">
                                <v-text-field v-model="form.onTimeStatus" label="On-Time / Late" />
                            </v-col>
                        </v-row>
                        <v-divider class="my-4" />
                        <!-- Status Section -->
                        <v-row dense>
                            <v-col cols="12" sm="6">
                                <v-text-field v-model="form.releaseVia" label="Release Via" />
                            </v-col>
                            <v-col cols="12" sm="6">
                                <v-text-field v-model="form.status" label="Status" />
                            </v-col>
                            <v-col cols="12">
                                <v-textarea v-model="form.statusComment" label="Status Comment" auto-grow rows="2" />
                            </v-col>
                        </v-row>
                    </template>
                    <!-- Show error message if data loading fails -->
                    <template v-if="error">
                        <v-alert type="error" color="error" outlined>
                            {{ error }}
                        </v-alert>
                    </template>
                </v-form>
            </v-card-text>
        </v-card>
    </div>
</template>

<style scoped>

</style>

<script>
import UniversalDataService from "@/services/UniversalDataService.js";

// Default form structure for initialization/reset
const defaultForm = () => ({
    partNumber: "",
    partName: "",
    owner: "",
    organization: "",
    deliverableFor: "",
    materialRequiredDate: "",
    mfgSeqGroup: "",
    requiredDateMod: "",
    targetRelease: "",
    toolLeadTime: "",
    partLeadTime: "",
    expediteMod: "",
    estMaterialReadyDate: "",
    onTimeStatus: "",
    releaseVia: "",
    status: "",
    statusComment: ""
});

export default {
    name: "PartPlanner",
    data() {
        return {
            form: defaultForm(), // Holds the form data
            loading: true,       // Loading state for async data
            error: ""            // Error message if loading fails
        };
    },
    async mounted() {
        // Fetch form data when component is mounted (better than created for async)
        await this.loadData();
    },
    methods: {
        async loadData() {
            try {
                this.loading = true;
                this.error = "";
                const data = await UniversalDataService.fetchData("partPlanner");
                this.form = data.raw || defaultForm();
            } catch (error) {
                this.error = "Failed to load part planner data.";
                console.error("PartPlanner: Failed to load data", error);
            } finally {
                this.loading = false;
            }
        },
        
        resetForm() {
            this.form = defaultForm();
        }
    }
};
</script>