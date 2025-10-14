/* eslint-disable no-console */

import axios from "axios";
import ApiService from "../services/ApiService.js";
import { getApiBaseUrl } from "../config/ApiConfig.js";

const log = (...args) => {
  // Simple logger, can be enhanced or replaced with a logging library
  console.log("[DataService]", ...args);
};

const filterDataByPhase = (data, phase) => {
  if (!phase) {
    return data;
  }

  const filtered = data.filter(item => {
    const candidatePhase = item?.phase || item?.currentState || item?.currentPhase;
    return candidatePhase === phase;
  });

  if (filtered.length > 0) {
    return filtered;
  }

  // If nothing matched, return original data so the UI still has content in local mode
  return data;
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
      log("🟡 PUT Request:", url, data);
      // PUT operations typically don't use caching, so we use direct axios
      const response = await axios.put(url, data, { timeout: 10000 });
      
      log("✅ PUT Response:", {
        url,
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
        data: response.data
      });
      
      return response.data;
    } catch (error) {
      log("❌ PUT Error:", {
        url: `${this.baseURL}${endpoint}`,
        message: error.message,
        response: error.response ? {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data
        } : null
      });
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
      log("🔴 DELETE Request:", url);
      // DELETE operations typically don't use caching, so we use direct axios
      const response = await axios.delete(url, { timeout: 10000 });
      
      log("✅ DELETE Response:", {
        url,
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
        data: response.data
      });
      
      return response.data;
    } catch (error) {
      log("❌ DELETE Error:", {
        url: `${this.baseURL}${endpoint}`,
        message: error.message,
        response: error.response ? {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data
        } : null
      });
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
        const response = await axios.get(`${getApiBaseUrl()}/internal/resources/AttributeValQuery/retrievePrograms`);
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
        const response = await axios.get(`${getApiBaseUrl()}/internal/resources/AttributeValQuery/retrievePhases`, {
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
    try {
      // Guard clause: Handle null or undefined itemType
      if (!itemType) {
        console.warn("⚠️ fetchItems called with null/undefined itemType, defaulting to 'parts'");
        itemType = "parts";
      }

      // Determine endpoint and cache key based on item type
      const endpointMap = {
        parts: "/internal/resources/AttributeValQuery/retrievePhaseParts",
        cas: "/internal/resources/AttributeValQuery/retrievePhaseCAs",
        crs: "/internal/resources/AttributeValQuery/retrievePhaseCRs"
      };

      const endpoint = endpointMap[itemType] || endpointMap.parts;
      const cacheKey = `${itemType.toUpperCase()}:${phase}`;

      const apiCall = async () => {
        const url = `${getApiBaseUrl()}${endpoint}`;
        const params = { phase };

        const response = await axios.get(url, {
          params,
          timeout: 30000
        });

        // Check if response contains an error
        if (response.data && response.data.error) {
          throw new Error(`API Error: ${response.data.error}`);
        }

        return response.data;
      };

      const rawData = await ApiService.fetchData(cacheKey, apiCall);

      // Process the API response
      let processedData = this.processApiResponse(rawData, itemType);

      if (Array.isArray(processedData)) {
        processedData = filterDataByPhase(processedData, phase);
      }

      // Apply field mapping for CAs and CRs to ensure caStatusComment is set
      if ((itemType === "cas" || itemType === "crs") && Array.isArray(processedData)) {
        processedData = processedData.map(item => {
          // Debug logging for CA-00000268
          if (item && (item.name === "CA-00000268" || item.caNumber === "CA-00000268")) {
            console.log("🔍 Raw API Data for CA-00000268:", {
              item,
              allKeys: Object.keys(item),
              statusRelatedFields: Object.keys(item).filter(key =>
                key.toLowerCase().includes("status") ||
                key.toLowerCase().includes("comment") ||
                key.toLowerCase().includes("notes")
              ).reduce((acc, key) => {
                acc[key] = item[key];
                return acc;
              }, {})
            });
          }

          if (item && item.statusComment && !item.caStatusComment) {
            return {
              ...item,
              caStatusComment: item.statusComment
            };
          }
          return item;
        });
      }

      return processedData;

    } catch (error) {
      console.error(`Error in fetchItems (${itemType}):`, error.message);
      throw error;
    }
  },

  /**
   * Process API response data dynamically based on its structure
   * @param {any} rawData - Raw data from API
   * @param {string} itemType - Type of items (parts, cas, crs)
   * @returns {Array} - Processed array of items
   */
  processApiResponse(rawData, itemType) {
    // If it's already an array, process it for unique identifiers
    if (Array.isArray(rawData)) {
      return this.addUniqueIdentifiers(rawData, itemType);
    }
    
    // If it's a string, try to parse it as JSON
    if (typeof rawData === "string") {
      try {
        // First try: parse as-is (for well-formed JSON)
        const parsed = JSON.parse(rawData);
        return this.processApiResponse(parsed, itemType);
      } catch (firstError) {
        // Second try: clean control characters and escape them properly
        try {
          const cleanedData = rawData
            .replace(/[\r\n\t\f\b\v]/g, match => {
              switch (match) {
                case "\r": return "\\r";
                case "\n": return "\\n";
                case "\t": return "\\t";
                case "\f": return "\\f";
                case "\b": return "\\b";
                case "\v": return "\\v";
                default: return match;
              }
            });
          
          const parsed = JSON.parse(cleanedData);
          return this.processApiResponse(parsed, itemType);
        } catch (secondError) {
          // Third try: more aggressive cleaning - remove problematic control characters
          try {
            // eslint-disable-next-line no-control-regex
            const aggressiveCleanedData = rawData.replace(/[\u0000-\u001F\u007F-\u009F]/g, "");
            const parsed = JSON.parse(aggressiveCleanedData);
            return this.processApiResponse(parsed, itemType);
          } catch (thirdError) {
            console.error("Failed to parse JSON string after all attempts:", {
              originalError: firstError.message,
              cleanedError: secondError.message,
              aggressiveError: thirdError.message
            });
            const sampleLength = 500;
            console.error("Raw data sample:", rawData.substring(0, sampleLength));
            return [];
          }
        }
      }
    }
    
    // If it's an object, try to extract the relevant array
    if (rawData && typeof rawData === "object") {
      // Define possible keys based on item type
      const possibleKeys = {
        parts: ["parts", "Parts", "items", "data"],
        cas: ["CAs", "cas", "changeActions", "items", "data"],
        crs: ["CRs", "crs", "changeRequests", "items", "data"]
      };
      
      const keysToTry = possibleKeys[itemType] || possibleKeys.parts;
      
      // Try each possible key
      for (const key of keysToTry) {
        if (rawData[key] && Array.isArray(rawData[key])) {
          return rawData[key];
        }
      }
      
      // If no specific key worked, look for the first array we can find
      const firstArrayKey = Object.keys(rawData).find(key => Array.isArray(rawData[key]));
      if (firstArrayKey) {
        return this.addUniqueIdentifiers(rawData[firstArrayKey], itemType);
      }
      
      return [];
    }
    
    return [];
  },

  /**
   * Add unique identifiers to each item for stable caching
   * @param {Array} data - Array of data items
   * @param {string} itemType - Type of items (parts, cas, crs)
   * @returns {Array} - Array with unique identifiers added
   */
  addUniqueIdentifiers(data, itemType) {
    if (!Array.isArray(data)) {
      return data;
    }

    return data.map((item, index) => {
      // Skip if item already has a uniqueId
      if (item && item.uniqueId) {
        return item;
      }

      // Determine the best unique identifier based on item type and available fields
      let uniqueId;
      
      if (itemType === "parts") {
        // For parts, prioritize part-specific identifiers
        uniqueId = item?.physId || 
                  item?.objId || 
                  item?.objectId || 
                  item?.partNumber || 
                  item?.id || 
                  `part_${index}`;
      } else if (itemType === "cas") {
        // For change actions, prioritize CA-specific identifiers
        uniqueId = item?.physId || 
                  item?.objId || 
                  item?.caPhysId || 
                  item?.caObjectId || 
                  item?.caNumber || 
                  item?.changeActionId || 
                  item?.id || 
                  `ca_${index}`;
      } else if (itemType === "crs") {
        // For change requests, prioritize CR-specific identifiers
        uniqueId = item?.physId || 
                  item?.objId || 
                  item?.crPhysId || 
                  item?.crObjectId || 
                  item?.crNumber || 
                  item?.changeRequestId || 
                  item?.id || 
                  `cr_${index}`;
      } else {
        // Generic fallback for other item types
        uniqueId = item?.physId || 
                  item?.objId || 
                  item?.objectId || 
                  item?.id || 
                  `${itemType}_${index}`;
      }

      return {
        ...item,
        uniqueId,
        rowUniqueId: uniqueId // Alternative property name for backward compatibility
      };
    });
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

  async fetchChangeAction(objectId, uniqueId = null) {
    log("Fetching Change Action for objectId:", objectId, "uniqueId:", uniqueId);
    try {
      // Use ApiService directly - it already has this method implemented
      // Pass the unique identifier for better caching
      const data = await ApiService.fetchChangeAction(objectId, uniqueId);
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