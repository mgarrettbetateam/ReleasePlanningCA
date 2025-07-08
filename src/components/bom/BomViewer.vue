<template>
    <div class="bom-viewer" :style="gridStyle">
        <!-- BOM Tree Section -->
        <div class="bom-tree">
            <h2>Bill of Materials</h2>
            <!-- Render BOM tree if data is available -->
            <ul v-if="bomData && bomData.length" class="bom-list">
                <bom-node
                    v-for="node in bomData"
                    :key="node.id"
                    :node="node"
                    @part-selected="onPartSelected"
                />
            </ul>
            <!-- Show message if no BOM data -->
            <div v-else>No BOM data available.</div>
        </div>

        <!-- 3D Viewer Section -->
        <div v-if="selectedPart" class="cad-model-container">
            <!-- Show 3D model if a part is selected -->
            <iframe
                :src="get3DPlayUrl(partDetails.cadModelUrl)"
                class="cad-model"
                frameborder="0"
                allowfullscreen
            ></iframe>
        </div>

        <!-- Part Details Table Section -->
        <div v-if="selectedPart" class="part-details">
            <h3>{{ selectedPart.name }}</h3>
            <table class="details-table">
                <tr>
                    <th>Part Number</th>
                    <td>{{ partDetails.partNumber }}</td>
                </tr>
                <tr>
                    <th>Availability</th>
                    <td>{{ partDetails.availability }}</td>
                </tr>
                <tr>
                    <th>Owner</th>
                    <td>{{ partDetails.owner }}</td>
                </tr>
            </table>
            <!-- Button to close the part details and 3D viewer -->
            <button @click="selectedPart = null">Close</button>
        </div>
    </div>
</template>

<style scoped>
/* All styles moved to BetaStyles.css */
</style>

<script>

import "../../assets/styles/BetaStyles.css";
import { BomService } from "./BomService";
import BomNode from "./BomNode.vue";

export default {
  name: "BomViewer",
  components: { BomNode },
  props: {
    gridStyle: {
      type: Object,
      default: () => ({})
    }
  },
  data() {
    return {
      bomData: [],        // Holds the BOM tree data
      selectedPart: null, // Currently selected part node
      partDetails: {}     // Details for the selected part
    };
  },
  async mounted() {
    // Fetch BOM data when component mounts
    try {
      this.bomData = await BomService.getBom();
    } catch (e) {
      this.bomData = [];
    }
  },
  methods: {
    // Handler for when a part is selected in the BOM tree
    async onPartSelected(part) {
      this.selectedPart = part;
      this.partDetails = {};
      // Fetch part details (including 3D model URL)
      const details = await BomService.getPartDetails(part.id);
      if (details) {
        this.partDetails = details;
      }
    },
    // Helper to build the 3DPlay URL for the iframe
    get3DPlayUrl(referenceUrl) {
      if (!referenceUrl) return "";
      return `https://3dplay.3dexperience.3ds.com/3dplay?file=${encodeURIComponent(referenceUrl)}`;
    }
  }
};
</script>