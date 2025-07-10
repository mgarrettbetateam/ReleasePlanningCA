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

  async fetchParts(phase) {
    log("Fetching CAs for phase:", phase);
    try {
      // Use the new fetchCAs method instead
      return await this.fetchCAs(phase);
    } catch (error) {
      log("Error fetching CAs:", error);
      throw error;
    }
  },

  async fetchCAs(phase) {
    log("Fetching CAs for phase:", phase);
    log("Phase details:", {
      value: phase,
      type: typeof phase,
      length: phase?.length,
      string: String(phase),
      encoded: encodeURIComponent(phase || "")
    });
    
    try {
      // Use ApiService with the environment-specific endpoint
      const cacheKey = `CAS:${phase}`;
      log("Cache key:", cacheKey);
      
      const apiCall = async () => {
        const axios = (await import("axios")).default;
        const url = `${API_BASE_URL}/internal/resources/AttributeValQuery/retrievePhaseCAs`;
        const params = { phase };
        
        log("Making API call details:", {
          url,
          params,
          phase,
          API_BASE_URL
        });
        
        try {
          const response = await axios.get(url, {
            params,
            timeout: 30000
          });
          
          log("API call successful - Response details:", {
            status: response.status,
            statusText: response.statusText,
            headers: response.headers,
            dataType: typeof response.data,
            dataKeys: response.data ? Object.keys(response.data) : "No data keys",
            hasError: !!(response.data && response.data.error),
            fullResponse: response.data
          });
          
          // Check if response contains an error
          if (response.data && response.data.error) {
            log("API returned server-side error:", response.data.error);
            throw new Error(`API Error: ${response.data.error}`);
          }
          
          // Try to extract data from different possible structures
          let extractedData = null;
          if (response.data.parts && Array.isArray(response.data.parts)) {
            extractedData = response.data.parts;
            log("Extracted data from response.data.parts (array with", extractedData.length, "items)");
          } else if (response.data.cas && Array.isArray(response.data.cas)) {
            extractedData = response.data.cas;
            log("Extracted data from response.data.cas (array with", extractedData.length, "items)");
          } else if (Array.isArray(response.data)) {
            extractedData = response.data;
            log("Using response.data directly (array with", extractedData.length, "items)");
          } else {
            extractedData = response.data;
            log("Using response.data as-is (type:", typeof extractedData, ")");
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
            config: {
              url: axiosError.config?.url,
              method: axiosError.config?.method,
              params: axiosError.config?.params
            }
          });
          throw axiosError;
        }
      };
      
      log("About to call ApiService.fetchData with cache key:", cacheKey);
      const cas = await ApiService.fetchData(cacheKey, apiCall);
      
      log("ApiService.fetchData completed. Result:", {
        count: Array.isArray(cas) ? cas.length : "Not an array",
        type: typeof cas,
        isArray: Array.isArray(cas),
        hasData: !!cas,
        sample: Array.isArray(cas) && cas.length > 0 ? cas.slice(0, 2) : cas
      });
      
      return cas;
      
    } catch (error) {
      log("Error in fetchCAs - Complete error details:", {
        message: error.message,
        name: error.name,
        stack: error.stack,
        phase,
        phaseType: typeof phase,
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