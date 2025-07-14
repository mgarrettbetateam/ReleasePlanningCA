<!-- ChangeActionCell.vue -->
<template>
    <span>
        <v-progress-circular
            v-if="loading"
            color="blue"
            size="16"
            indeterminate
        />
        <template v-else>
            <!-- Show CA Number as link with tooltip -->
            <v-tooltip v-if="field === 'number'" bottom>
                <template #activator="{ on, attrs }">
                    <a 
                        :href="caLink" 
                        target="_blank"
                        class="ca-link"
                        v-bind="attrs"
                        v-on="on"
                    >
                        {{ caNumber }}
                    </a>
                </template>
                <div class="ca-tooltip">
                    <div class="tooltip-header">
                        <v-icon small color="white" class="mr-1">mdi-file-document</v-icon>
                        Change Action Details
                    </div>
                    <div class="tooltip-content">
                        <div><strong>CA Number:</strong> {{ caNumber }}</div>
                        <div><strong>Status:</strong> {{ caState }}</div>
                        <div class="tooltip-action">
                            <v-icon small color="lightblue" class="mr-1">mdi-open-in-new</v-icon>
                            Click to view in new tab
                        </div>
                    </div>
                </div>
            </v-tooltip>
            <!-- Show CA State -->
            <span v-else-if="field === 'state'">{{ caState }}</span>
            <!-- Default: show CA Number with tooltip -->
            <v-tooltip v-else bottom>
                <template #activator="{ on, attrs }">
                    <a 
                        :href="caLink" 
                        target="_blank"
                        class="ca-link"
                        v-bind="attrs"
                        v-on="on"
                    >
                        {{ caNumber }}
                    </a>
                </template>
                <div class="ca-tooltip">
                    <div class="tooltip-header">
                        <v-icon small color="white" class="mr-1">mdi-file-document</v-icon>
                        Change Action Details
                    </div>
                    <div class="tooltip-content">
                        <div><strong>CA Number:</strong> {{ caNumber }}</div>
                        <div><strong>Status:</strong> {{ caState }}</div>
                        <div class="tooltip-action">
                            <v-icon small color="lightblue" class="mr-1">mdi-open-in-new</v-icon>
                            Click to view in new tab
                        </div>
                    </div>
                </div>
            </v-tooltip>
        </template>
    </span>
</template>

<style scoped>
.ca-link {
    color: #1976d2;
    text-decoration: none;
    font-weight: 500;
    transition: color 0.2s ease;
}

.ca-link:hover {
    color: #1565c0;
    text-decoration: underline;
}

.ca-tooltip {
    max-width: 280px;
    font-size: 12px;
}

.tooltip-header {
    font-weight: bold;
    font-size: 13px;
    margin-bottom: 6px;
    display: flex;
    align-items: center;
}

.tooltip-content {
    line-height: 1.4;
}

.tooltip-content > div {
    margin-bottom: 3px;
}

.tooltip-action {
    margin-top: 6px;
    padding-top: 6px;
    border-top: 1px solid rgba(255, 255, 255, 0.2);
    font-style: italic;
    font-size: 11px;
    display: flex;
    align-items: center;
}
</style>
  
<script>
/* eslint-disable no-console */
import ApiService from "../../services/ApiService.js";
import { USE_MOCK_DATA } from "../../config/ApiConfig.js";

export default {
    name: "ChangeActionCell",
    props: {
        objId: {
            type: String,
            required: true
        },
        rowIndex: {
            type: Number,
            default: 0
        },
        field: {
            type: String,
            default: "number",
            validator: value => ["number", "state"].includes(value)
        }
    },
    data() {
        return {
            loading: false,
            caNumber: "",
            caLink: "",
            caState: ""
        };
    },
  async mounted() {
    this.loading = true;
    
    try {
      const data = await ApiService.fetchChangeAction(this.objId, this.rowIndex);
      this.setCAData(data);
    } catch (err) {
      this.handleError(err);
    } finally {
      this.loading = false;
    }
  },
  
  methods: {
    setCAData(data) {
      this.caNumber = data.caNumber;
      this.caLink = data.caLink;
      this.caState = data.caState;
      this.emitData();
    },

    handleError(err) {
      console.error("Error fetching CA data after all retries:", err);
      
      // Use global mock data flag instead of hardcoded environment check
      if (USE_MOCK_DATA) {
        console.warn("Using mock data for CA:", err.message);
        
        // Generate mock data for template demo
        const CA_ID_RANGE = 9000;
        const CA_ID_MIN = 1000;
        const caId = Math.floor(Math.random() * CA_ID_RANGE) + CA_ID_MIN;
        this.caNumber = `CA-${caId}`;
        this.caLink = `#ca-${caId}`;
        const caStates = ["APPROVED", "PENDING", "REJECTED"];
        this.caState = caStates[Math.floor(Math.random() * caStates.length)];
        this.emitData();
      } else {
        // In production, show error state or empty data
        this.caNumber = "Error";
        this.caLink = "#";
        this.caState = "ERROR";
        this.emitData();
      }
    },
    
    emitData() {
      this.$emit("ca-number-loaded", {
        objectId: this.objId,
        caNumber: this.caNumber,
        caLink: this.caLink,
        caState: this.caState
      });
    }
  }
};
</script>