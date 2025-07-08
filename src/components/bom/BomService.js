import appData from "../../assets/config/app-data.json";

/**
 * BomService provides methods to interact with BOM data.
 * It allows fetching the BOM tree and retrieving details for a specific part.
 */
export const BomService = {
  /**
   * Get the full BOM tree data.
   * @returns {Promise<Array>} Promise resolving to the BOM data array
   */
  async getBom() {
    // Simulate async fetch if needed (could add delay here)
    return appData.bom;
  },

  /**
   * Get details for a specific part by its ID.
   * Recursively searches the BOM tree for the part.
   * @param {string} partId - The ID of the part to find
   * @returns {Promise<Object>} Promise resolving to the part details object
   * @throws {Error} If the part is not found
   */
  async getPartDetails(partId) {
    // Helper function to recursively search for the part by id
    const findPart = nodes => {
      for (const node of nodes) {
        if (node.id === partId) return node;
        if (node.children) {        const found = findPart(node.children);
        if (found) return found;
      }
    }
    return null;
  };
  // Search the BOM data for the requested part
  const result = findPart(appData.bom);
  if (!result) {
    throw new Error(`Part with id ${partId} not found`);
  }
  return result;
  }
};