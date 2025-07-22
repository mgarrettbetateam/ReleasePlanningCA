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
            <!-- Show CA/CR Number as link without tooltip -->
            <a 
                v-if="field === 'number'"
                v-bind="cellDragAttributes"
                :href="displayLink" 
                target="_blank"
                class="ca-link draggable-ca-link"
            >
                {{ displayNumber }}
            </a>
            <!-- Show CA/CR State -->
            <span v-else-if="field === 'state'">{{ displayState }}</span>
            <!-- Default: show CA/CR Number with tooltip -->
            <v-tooltip v-else bottom>
                <template #activator="{ on, attrs }">
                    <a 
                        v-bind="{ ...attrs, ...cellDragAttributes }"
                        :href="displayLink" 
                        target="_blank"
                        class="ca-link draggable-ca-link"
                        v-on="on"
                    >
                        {{ displayNumber }}
                    </a>
                </template>
                <div class="ca-tooltip">
                    <div class="tooltip-header">
                        <v-icon small color="white" class="mr-1">mdi-file-document</v-icon>
                        {{ tooltipTitle }}
                    </div>
                    <div class="tooltip-content">
                        <div><strong>{{ tooltipNumberLabel }}</strong> {{ displayNumber }}</div>
                        <div><strong>Status:</strong> {{ displayState }}</div>
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

/* Draggable CA Link Styles */
.draggable-ca-link[draggable="true"] {
    cursor: grab;
    position: relative;
}

.draggable-ca-link[draggable="true"]:active {
    cursor: grabbing;
}

.draggable-ca-link[draggable="true"].dragging {
    opacity: 0.7;
    transform: scale(1.05);
}

.draggable-ca-link[draggable="true"]::after {
    content: "⋮⋮";
    position: absolute;
    right: -12px;
    top: 50%;
    transform: translateY(-50%);
    color: #bbb;
    font-size: 10px;
    opacity: 0;
    transition: opacity 0.2s ease;
}

.draggable-ca-link[draggable="true"]:hover::after {
    opacity: 0.6;
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
import { USE_MOCK_DATA, getApiBaseUrl } from "../../config/ApiConfig.js";
import { useDragAndDrop } from "../../composables/useDragAndDrop.js";


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
        },
        itemType: {
            type: String,
            default: "ca",
            validator: value => ["ca", "cr"].includes(value)
        },
        // Direct props for when data is already available (CAS/CRS)
        itemNumber: {
            type: String,
            default: ""
        },
        itemState: {
            type: String,
            default: ""
        },
        physId: {
            type: String,
            default: ""
        }
    },
    data() {
        // Initialize drag and drop composable
        const dragDropComposable = useDragAndDrop();
        
        return {
            // Drag and drop functionality
            dragDrop: dragDropComposable,
            
            loading: false,
            caNumber: "",
            caLink: "",
            caState: ""
        };
    },

    computed: {
        displayNumber() {
            return this.itemNumber || this.caNumber;
        },
        displayState() {
            return this.itemState || this.caState;
        },
        displayLink() {
            if (this.itemNumber) {
                // Use direct data (CAS/CRS case) with physId for 3DX link
                return this.generateLink(this.itemNumber, this.physId);
            }
            return this.caLink; // Use API data (PARTS case)
        },
        tooltipTitle() {
            return this.itemType === "cr" ? "Change Request Details" : "Change Action Details";
        },
        tooltipNumberLabel() {
            return this.itemType === "cr" ? "CR Number:" : "CA Number:";
        },
        
        /**
         * Get drag attributes for the cell content
         * @returns {Object} Drag attributes for v-bind
         */
        cellDragAttributes() {
            if (!this.physId && !this.displayNumber) {
                return {};
            }
            
            return this.dragDrop.createDragAttributes({
                physId: this.physId,
                itemNumber: this.displayNumber,
                itemState: this.displayState,
                itemType: this.itemType
            }, {
                dataType: this.itemType.toUpperCase()
            });
        }
    },
    async mounted() {
        console.log("🔧 ChangeActionCell mounted:", {
            objId: this.objId,
            rowIndex: this.rowIndex,
            itemType: this.itemType,
            hasDirectProps: !!(this.itemNumber && this.physId),
            itemNumber: this.itemNumber,
            physId: this.physId
        });
        
        // Emit data immediately if we have direct props (CAS/CRS case)
        if (this.itemNumber && this.physId) {
            console.log("📄 Using direct props (CAS/CRS), no API call needed");
            this.emitData();
            return;
        }
        
        // Only fetch data if we don't have direct props (PARTS case)
        if (!this.itemNumber) {
            console.log("📡 PARTS item detected, making API call for Change Action data");
            this.loading = true;
            
            try {
                const data = await ApiService.fetchChangeAction(this.objId, this.rowIndex);
                this.setCAData(data);
            } catch (err) {
                this.handleError(err);
            } finally {
                this.loading = false;
            }
        }
    },
  
    // https://3dspace-prod.beta.team/3dspace/common/emxNavigator.jsp?objectId=5B1B136F000137E867E59E86000028E2
    // https://dev-3ds-app.beta.team/3dspace/common/emxNavigator.jsp?objectId=5B1B136F000137E867E59E86000028E2

    // https://3dspace-prod.beta.team/3dspace/common/emxNavigator.jsp?objectId=7049.44432.28745.26563
    methods: {
        generateLink(itemNumber, physId) {
            // Only use 3DX links for CAS and CRS items (when we have direct props)
            if (this.itemNumber && physId) {
                // This is a CAS or CRS item with direct data
                // Use the centralized API configuration
                const baseUrl = getApiBaseUrl();
                    
                return `${baseUrl}/3dspace/common/emxNavigator.jsp?objectId=${physId}`;
            }
            
            // Fallback for PARTS only (when no itemNumber/physId - legacy API-based links)
            // This should only be reached by PARTS items that don't have itemNumber prop
            if (this.itemType === "cr") {
                return `https://your-system.com/cr/${itemNumber}`;
            }
            // Default to CA link for PARTS
            return `https://your-system.com/ca/${itemNumber}`;
        },

        setCAData(data) {
            console.log("🔗 ChangeActionCell: Setting CA data", {
                objId: this.objId,
                caNumber: data.caNumber,
                caLink: data.caLink,
                caPhysId: data.caPhysId,
                caState: data.caState,
                hasApiLink: !!data.caLink,
                hasPhysId: !!data.caPhysId
            });
            
            this.caNumber = data.caNumber;
            this.caState = data.caState;
            
            // For PARTS items, prefer caLink from API, but if not available, use caPhysId to generate link
            if (data.caLink) {
                console.log("✅ Using API-provided caLink");
                this.caLink = data.caLink;
            } else if (data.caPhysId) {
                console.log("✅ Using caPhysId to generate Change Action link");
                // Generate link using Change Action's physical ID
                const baseUrl = getApiBaseUrl();
                this.caLink = `${baseUrl}/3dspace/common/emxNavigator.jsp?objectId=${data.caPhysId}`;
            } else {
                console.warn("⚠️ No caLink or caPhysId found, using fallback link generation");
                console.warn("⚠️ This may result in linking to the part instead of the Change Action!");
                // Fallback to generated link
                this.caLink = this.generateFallbackLink(data.caNumber);
            }
            
            console.log("🔗 ChangeActionCell: Final CA link set to", this.caLink);
            this.emitData();
        },

        generateFallbackLink(caNumber) {
            // Fallback link generation when API doesn't provide caLink or caPhysId
            if (!caNumber) return "#";
            
            const cleanNumber = caNumber.toString().trim();
            
            // For CA and CX items, try to build a reasonable fallback
            if (cleanNumber.startsWith("CA") || cleanNumber.startsWith("CX")) {
                const baseUrl = getApiBaseUrl();
                // Try to use the same pattern as other Change Actions
                return `${baseUrl}/3dspace/common/emxNavigator.jsp?changeAction=${cleanNumber}`;
            } else if (cleanNumber.startsWith("CR")) {
                const baseUrl = getApiBaseUrl();
                return `${baseUrl}/3dspace/common/emxNavigator.jsp?changeRequest=${cleanNumber}`;
            }
            
            return "#";
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
            const eventName = this.itemType === "cr" ? "cr-number-loaded" : "ca-number-loaded";
            this.$emit(eventName, {
                objectId: this.objId,
                itemNumber: this.displayNumber,
                itemLink: this.displayLink,
                itemState: this.displayState,
                itemType: this.itemType
            });
        }
  }
};
</script>