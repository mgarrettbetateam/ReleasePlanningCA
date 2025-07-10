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
            <!-- Show CA Number as link -->
            <a v-if="field === 'number'" :href="caLink" target="_blank">{{ caNumber }}</a>
            <!-- Show CA State -->
            <span v-else-if="field === 'state'">{{ caState }}</span>
            <!-- Default: show CA Number -->
            <a v-else :href="caLink" target="_blank">{{ caNumber }}</a>
        </template>
    </span>
</template>
  
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