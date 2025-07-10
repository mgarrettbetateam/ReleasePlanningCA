/* eslint-disable no-console */

import ApiService from "../services/ApiService.js";
import { API_BASE_URL } from "../config/ApiConfig.js";

const log = (...args) => {
  // Simple logger, can be enhanced or replaced with a logging library
  console.log("[DataService]", ...args);
};

/**
 * Base class for data services
 * Now uses the sophisticated ApiService for all requests
 */
class DataServiceBase {
  constructor(baseURL = null) {
    this.baseURL = baseURL || process.env.VUE_APP_API_BASE_URL || "";
    this.apiService = ApiService;
  }

  /**
   * Make a GET request using ApiService
   * @param {string} endpoint - API endpoint
   * @param {object} params - Query parameters
   * @param {object} options - Request options
   * @returns {Promise} - Response data
   */
  async get(endpoint, params = {}, options = {}) {
    try {
      const url = `${this.baseURL}${endpoint}`;
      log("GET Request:", url, params);
      return await this.apiService.get(url, params, options);
    } catch (error) {
      log("GET Error:", error);
      throw this.handleError(error);
    }
  }

  /**
   * Make a POST request using ApiService
   * @param {string} endpoint - API endpoint
   * @param {object} data - Request body
   * @param {object} options - Request options
   * @returns {Promise} - Response data
   */
  async post(endpoint, data = {}, options = {}) {
    try {
      const url = `${this.baseURL}${endpoint}`;
      log("POST Request:", url, data);
      return await this.apiService.post(url, data, options);
    } catch (error) {
      log("POST Error:", error);
      throw this.handleError(error);
    }
  }

  /**
   * Make a PUT request (fallback to direct axios for non-cached operations)
   * @param {string} endpoint - API endpoint
   * @param {object} data - Request body
   * @returns {Promise} - Response data
   */
  async put(endpoint, data = {}) {
    try {
      const url = `${this.baseURL}${endpoint}`;
      log("PUT Request:", url, data);
      // PUT operations typically don't use caching, so we use direct axios
      const axios = (await import("axios")).default;
      const response = await axios.put(url, data, { timeout: 10000 });
      return response.data;
    } catch (error) {
      log("PUT Error:", error);
      throw this.handleError(error);
    }
  }

  /**
   * Make a DELETE request (fallback to direct axios for non-cached operations)
   * @param {string} endpoint - API endpoint
   * @returns {Promise} - Response data
   */
  async delete(endpoint) {
    try {
      const url = `${this.baseURL}${endpoint}`;
      log("DELETE Request:", url);
      // DELETE operations typically don't use caching, so we use direct axios
      const axios = (await import("axios")).default;
      const response = await axios.delete(url, { timeout: 10000 });
      return response.data;
    } catch (error) {
      log("DELETE Error:", error);
      throw this.handleError(error);
    }
  }

  /**
   * Filter data array using a predicate function
   * @param {Array} data - Data to filter
   * @param {Function} predicate - Filter function
   * @returns {Array} - Filtered data
   */
  filterData(data, predicate) {
    log("Filtering data, items before:", data.length);
    const filtered = data.filter(predicate);
    log("Items after filter:", filtered.length);
    return filtered;
  }

  /**
   * Handle API errors consistently
   * @param {Error} error - The error object
   * @returns {Error} - Processed error
   */
  handleError(error) {
    if (error.response) {
      // Server responded with error status
      const message = error.response.data?.message || error.response.statusText || "API Error";
      return new Error(`${error.response.status}: ${message}`);
    } else if (error.request) {
      // Request was made but no response received
      return new Error("Network Error: No response from server");
    } else {
      // Something else happened
      return new Error(`Request Error: ${error.message}`);
    }
  }
}

/**
 * Legacy data service object for backward compatibility
 * Now uses the sophisticated ApiService for all requests
 */
const dataService = {
  async fetchPrograms() {
    log("Fetching programs...");
    try {
      // Use ApiService with the environment-specific endpoint
      const cacheKey = "PROGRAMS";
      const apiCall = async () => {
        const axios = (await import("axios")).default;
        const response = await axios.get(`${API_BASE_URL}/internal/resources/AttributeValQuery/retrievePrograms`);
        return response.data.programs;
      };
      
      const programs = await ApiService.fetchData(cacheKey, apiCall);
      log("Programs fetched:", programs);
      return programs;
    } catch (error) {
      log("Error fetching programs:", error);
      throw error;
    }
  },

  async fetchPhases(program) {
    log("Fetching phases for program:", program);
    try {
      // Use ApiService with the environment-specific endpoint
      const cacheKey = `PHASES:${program}`;
      const apiCall = async () => {
        const axios = (await import("axios")).default;
        const response = await axios.get(`${API_BASE_URL}/internal/resources/AttributeValQuery/retrievePhases`, {
          params: { program }
        });
        return response.data.phases;
      };
      
      const phases = await ApiService.fetchData(cacheKey, apiCall);
      log("Phases fetched:", phases);
      return phases;
    } catch (error) {
      log("Error fetching phases:", error);
      throw error;
    }
  },

  /**
   * Generic method to fetch items for a given phase
   * Can be configured to fetch different types of data (parts, CAs, etc.)
   * @param {string} phase - The phase to fetch items for
   * @param {string} itemType - The type of items to fetch ('parts' or 'cas')
   * @returns {Promise} - Array of items
   */
  async fetchItems(phase, itemType = "parts") {
    log(`Fetching ${itemType} for phase:`, phase);
    try {
      // Determine endpoint and cache key based on item type
      const endpointMap = {
        parts: "/internal/resources/AttributeValQuery/retrievePhaseParts",
        cas: "/internal/resources/AttributeValQuery/retrievePhaseCAs",
        crs: "/internal/resources/AttributeValQuery/retrievePhaseCRs"
      };

      const responseKeyMap = {
        parts: "parts",
        cas: ["CAs", "cas", "parts"], // API returns "CAs" (capital), try that first
        crs: ["CRs", "crs", "parts"] // API likely returns "CRs" (capital)
      };

      const endpoint = endpointMap[itemType] || endpointMap.parts;
      const responseKeys = responseKeyMap[itemType] || responseKeyMap.parts;
      const cacheKey = `${itemType.toUpperCase()}:${phase}`;

      log(`Using endpoint: ${endpoint}, cache key: ${cacheKey}`);

      const apiCall = async () => {
        const axios = (await import("axios")).default;
        const url = `${API_BASE_URL}${endpoint}`;
        const params = { phase };
        
        log("Making API call details:", {
          url,
          params,
          phase,
          itemType,
          API_BASE_URL,
          encodedPhase: encodeURIComponent(phase)
        });
        
        try {
          const response = await axios.get(url, {
            params,
            timeout: 30000
          });
          
          log("API call successful - Response details:", {
            status: response.status,
            statusText: response.statusText,
            dataType: typeof response.data,
            dataKeys: response.data ? Object.keys(response.data) : "No data keys",
            hasError: !!(response.data && response.data.error),
            itemType
          });
          
          // Check if response contains an error
          if (response.data && response.data.error) {
            log("API returned server-side error:", response.data.error);
            throw new Error(`API Error: ${response.data.error}`);
          }
          
          // Try to extract data from different possible structures
          let extractedData = null;
          const keysToTry = Array.isArray(responseKeys) ? responseKeys : [responseKeys];
          
          log(`Trying to extract data with keys: ${keysToTry.join(", ")}`);
          log(`Available response keys: ${Object.keys(response.data).join(", ")}`);
          
          // Try each configured response key
          for (const key of keysToTry) {
            log(`Checking key: ${key}, exists: ${!!response.data[key]}, isArray: ${Array.isArray(response.data[key])}`);
            if (response.data[key] && Array.isArray(response.data[key])) {
              extractedData = response.data[key];
              log(`✅ Extracted data from response.data.${key} (array with ${extractedData.length} items)`);
              break;
            }
          }
          
          // If no specific key worked, try direct array response
          if (!extractedData && Array.isArray(response.data)) {
            extractedData = response.data;
            log(`Using response.data directly (array with ${extractedData.length} items)`);
          }
          
          // If still no array, use the response as-is
          if (!extractedData) {
            extractedData = response.data;
            log(`Using response.data as-is (type: ${typeof extractedData})`);
          }
          
          log("Final extracted data:", {
            type: typeof extractedData,
            isArray: Array.isArray(extractedData),
            length: Array.isArray(extractedData) ? extractedData.length : "Not an array",
            keys: extractedData && typeof extractedData === "object" ? Object.keys(extractedData) : "Not an object",
            sample: Array.isArray(extractedData) && extractedData.length > 0 ? extractedData[0] : extractedData
          });
          
          return extractedData;
          
        } catch (axiosError) {
          log("Axios request failed:", {
            message: axiosError.message,
            code: axiosError.code,
            response: axiosError.response?.data,
            status: axiosError.response?.status,
            statusText: axiosError.response?.statusText,
            itemType
          });
          throw axiosError;
        }
      };
      
      log("About to call ApiService.fetchData with cache key:", cacheKey);
      const items = await ApiService.fetchData(cacheKey, apiCall);
      
      log("ApiService.fetchData completed. Result:", {
        count: Array.isArray(items) ? items.length : "Not an array",
        type: typeof items,
        isArray: Array.isArray(items),
        hasData: !!items,
        itemType
      });
      
      return items;
      
    } catch (error) {
      log(`Error in fetchItems (${itemType}) - Complete error details:`, {
        message: error.message,
        name: error.name,
        phase,
        itemType,
        apiBaseUrl: API_BASE_URL,
        response: error.response?.data,
        status: error.response?.status,
        isApiError: error.message.includes("API Error"),
        isNetworkError: error.code === "ECONNABORTED" || error.message.includes("Network"),
        isTimeoutError: error.message.includes("timeout")
      });
      
      throw error;
    }
  },

  // Legacy method for backward compatibility - now uses generic fetchItems
  async fetchParts(phase) {
    log("fetchParts called - delegating to fetchItems('parts')");
    return await this.fetchItems(phase, "parts");
  },

  // Legacy method for backward compatibility - now uses generic fetchItems
  async fetchCAs(phase) {
    log("fetchCAs called - delegating to fetchItems('cas')");
    return await this.fetchItems(phase, "cas");
  },

  // Legacy method for backward compatibility - now uses generic fetchItems
  async fetchCRs(phase) {
    log("fetchCRs called - delegating to fetchItems('crs')");
    return await this.fetchItems(phase, "crs");
  },

  filterData(data, predicate) {
    const service = new DataServiceBase();
    return service.filterData(data, predicate);
  },

  async fetchChangeAction(objectId) {
    log("Fetching Change Action for objectId:", objectId);
    try {
      // Use ApiService directly - it already has this method implemented
      const data = await ApiService.fetchChangeAction(objectId);
      log("Change Action fetched:", data);
      return data;
    } catch (error) {
      log("Error fetching Change Action:", error);
      throw error;
    }
  },

  async fetchCAStats(physId, rowIndex = 0) {
    log("Fetching CA Stats for physId:", physId);
    try {
      // Use ApiService for CA stats
      const data = await ApiService.fetchCAStats(physId, rowIndex);
      log("CA Stats fetched:", data);
      return data;
    } catch (error) {
      log("Error fetching CA Stats:", error);
      throw error;
    }
  }
};

// Export both the class and the legacy object
export { DataServiceBase };
export default dataService;