/* eslint-disable no-console */
import axios from "axios";
import { getApiBaseUrl } from "../config/ApiConfig.js";

class ApiService {
  constructor() {
    this.cache = new Map();
    this.pendingRequests = new Map();
    this.requestQueue = [];
    this.isProcessingQueue = false;
    
    // Configuration constants - Optimized for faster responses
    const DEFAULT_TIMEOUT = 10000;
    const DEFAULT_MAX_CONCURRENT = 8;
    const DEFAULT_MAX_RETRIES = 3;
    const DEFAULT_RETRY_DELAY = 500;
    const DEFAULT_BATCH_DELAY = 100;
    const DEFAULT_ROW_DELAY = 50;
    
    this.config = {
      maxConcurrentRequests: DEFAULT_MAX_CONCURRENT,
      maxRetries: DEFAULT_MAX_RETRIES,
      retryDelay: DEFAULT_RETRY_DELAY,
      batchDelay: DEFAULT_BATCH_DELAY,
      rowIndexDelay: DEFAULT_ROW_DELAY,
      timeout: DEFAULT_TIMEOUT
    };
    
    // HTTP status constants
    this.HTTP_STATUS = {
      SERVER_ERROR_MIN: 500,
      SERVER_ERROR_MAX: 504,
      TOO_MANY_REQUESTS: 429
    };
    
    this.JITTER_MAX = 1000;
  }

  /**
   * Generic data fetcher with caching, queuing, and retry logic
   * @param {string} cacheKey - Unique key for caching
   * @param {Function} apiCall - Function that returns a Promise with the API call
   * @param {Object} options - Optional configuration overrides
   * @param {number} rowIndex - Row index for staggered delays
   * @returns {Promise} - Promise that resolves with the data
   */
  async fetchData(cacheKey, apiCall, options = {}, rowIndex = 0) {
    const config = { ...this.config, ...options };
    
    console.log("📊 fetchData called:", {
      cacheKey,
      rowIndex,
      config: {
        maxConcurrentRequests: config.maxConcurrentRequests,
        timeout: config.timeout,
        maxRetries: config.maxRetries
      }
    });
    
    try {
      // Check cache first
      if (this.cache.has(cacheKey)) {
        console.log("💾 Cache HIT for " + cacheKey);
        const cachedData = this.cache.get(cacheKey);
        console.log("📄 Cached data structure:", this.analyzeDataStructure(cachedData));
        return cachedData;
      }

      // If request is already pending, wait for it
      if (this.pendingRequests.has(cacheKey)) {
        console.log("⏳ Waiting for pending request " + cacheKey);
        return await this.pendingRequests.get(cacheKey);
      }
      
      // Add staggered delay based on row index
      const delay = rowIndex * config.rowIndexDelay;
      if (delay > 0) {
        console.log("⏱️ Adding staggered delay:", delay + "ms for row " + rowIndex);
        await new Promise(resolve => setTimeout(resolve, delay));
      }

      // Add to queue
      console.log("🔄 Adding to request queue:", cacheKey);
      return await this.queueRequest(cacheKey, apiCall, config);

    } catch (err) {
      console.error("❌ fetchData error for " + cacheKey + ":", {
        error: err.message,
        stack: err.stack,
        response: err.response ? {
          status: err.response.status,
          statusText: err.response.statusText,
          data: err.response.data
        } : null
      });
      this.pendingRequests.delete(cacheKey);
      throw err;
    }
  }

  async queueRequest(cacheKey, apiCall, config) {
    return new Promise((resolve, reject) => {
      console.log("📥 Queueing request:", cacheKey);
      this.requestQueue.push({
        cacheKey,
        apiCall,
        config,
        resolve,
        reject,
        retryCount: 0
      });
      
      console.log("📋 Current queue size:", this.requestQueue.length);
      this.processQueue();
    });
  }

  async processQueue() {
    if (this.isProcessingQueue || this.requestQueue.length === 0) return;
    
    console.log("🔄 Starting queue processing with " + this.requestQueue.length + " requests");
    this.isProcessingQueue = true;
    
    while (this.requestQueue.length > 0) {
      const batch = this.requestQueue.splice(0, this.config.maxConcurrentRequests);
      console.log("📦 Processing batch of " + batch.length + " requests:", 
        batch.map(req => req.cacheKey));
      
      await Promise.allSettled(
        batch.map(async request => {
          try {
            // Double-check cache (might have been populated by another request)
            if (this.cache.has(request.cacheKey)) {
              console.log("💾 Found in cache during processing:", request.cacheKey);
              const cachedData = this.cache.get(request.cacheKey);
              request.resolve(cachedData);
              return;
            }

            // Check pending requests
            if (this.pendingRequests.has(request.cacheKey)) {
              console.log("⏳ Found pending request during processing:", request.cacheKey);
              const data = await this.pendingRequests.get(request.cacheKey);
              request.resolve(data);
              return;
            }

            // Make the actual API call with retry logic
            console.log("🚀 Making API call for:", request.cacheKey);
            const requestPromise = this.fetchWithRetry(request.apiCall, request.config, request.retryCount);
            this.pendingRequests.set(request.cacheKey, requestPromise);

            const data = await requestPromise;
            
            // Cache result and clean up
            console.log("💾 Caching result for:", request.cacheKey);
            console.log("📄 Data structure being cached:", this.analyzeDataStructure(data));
            this.cache.set(request.cacheKey, data);
            this.pendingRequests.delete(request.cacheKey);
            
            request.resolve(data);

          } catch (err) {
            console.error("❌ Request failed:", request.cacheKey, err.message);
            this.pendingRequests.delete(request.cacheKey);
            
            // Retry logic for server errors
            if (this.shouldRetry(err) && request.retryCount < request.config.maxRetries) {
              request.retryCount++;
              console.warn("🔄 Retrying request for " + request.cacheKey + 
                ", attempt " + request.retryCount + "/" + request.config.maxRetries);
              
              // Add back to queue with increased retry count
              this.requestQueue.push(request);
            } else {
              console.error("💀 Failed after " + request.config.maxRetries + 
                " retries for " + request.cacheKey + ":", err.message);
              request.reject(err);
            }
          }
        })
      );
      
      // Delay between batches
      if (this.requestQueue.length > 0) {
        console.log("⏸️ Batch delay before processing next " + this.requestQueue.length + " requests");
        await new Promise(resolve => setTimeout(resolve, this.config.batchDelay));
      }
    }
    
    console.log("✅ Queue processing complete");
    this.isProcessingQueue = false;
  }

  async fetchWithRetry(apiCall, config, retryCount = 0) {
    try {
      // Add exponential backoff for retries with jitter
      if (retryCount > 0) {
        const backoffDelay = config.retryDelay * Math.pow(2, retryCount - 1);
        const jitter = Math.random() * this.JITTER_MAX;
        const totalDelay = backoffDelay + jitter;
        console.log("⏱️ Retry backoff delay:", {
          retryCount,
          backoffDelay,
          jitter: Math.round(jitter),
          totalDelay: Math.round(totalDelay)
        });
        await new Promise(resolve => setTimeout(resolve, totalDelay));
      }

      console.log("🎯 Executing API call" + (retryCount > 0 ? " (retry " + retryCount + ")" : ""));
      const result = await apiCall();
      console.log("✅ API call successful" + (retryCount > 0 ? " after " + retryCount + " retries" : ""));
      return result;
      
    } catch (error) {
      console.error("❌ API call failed (attempt " + (retryCount + 1) + "):", {
        message: error.message,
        status: error.response ? error.response.status : "no response",
        statusText: error.response ? error.response.statusText : "no response"
      });
      throw error;
    }
  }

  shouldRetry(error) {
    // Retry on server errors (500, 502, 503, 504) or network errors
    if (error.response) {
      const status = error.response.status;
      return (status >= this.HTTP_STATUS.SERVER_ERROR_MIN && status <= this.HTTP_STATUS.SERVER_ERROR_MAX) || 
             status === this.HTTP_STATUS.TOO_MANY_REQUESTS;
    }
    // Retry on network errors (no response)
    return error.code === "ECONNABORTED" || 
           error.message.includes("timeout") ||
           error.message.includes("Network Error");
  }

  /**
   * Clear cache for specific key or all cache
   * @param {string} key - Optional specific key to clear
   */
  clearCache(key = null) {
    if (key) {
      console.log("🗑️ Clearing cache for key:", key);
      this.cache.delete(key);
    } else {
      console.log("🗑️ Clearing entire cache, had " + this.cache.size + " entries");
      this.cache.clear();
    }
  }

  /**
   * Get cache statistics for debugging
   */
  getCacheStats() {
    const stats = {
      totalEntries: this.cache.size,
      pendingRequests: this.pendingRequests.size,
      queueLength: this.requestQueue.length,
      isProcessingQueue: this.isProcessingQueue,
      cacheKeys: Array.from(this.cache.keys())
    };
    
    console.log("📊 Cache Statistics:", stats);
    return stats;
  }

  /**
   * Analyze data structure to help understand API responses
   * @param {*} data - The data to analyze
   * @returns {Object} - Analysis of the data structure
   */
  analyzeDataStructure(data) {
    if (data === null) return { type: "null", value: null };
    if (data === undefined) return { type: "undefined", value: undefined };
    
    const type = Array.isArray(data) ? "array" : typeof data;
    const analysis = { type };
    
    switch (type) {
      case "array":
        analysis.length = data.length;
        analysis.itemTypes = [...new Set(data.map(item => typeof item))];
        if (data.length > 0) {
          analysis.firstItem = this.analyzeDataStructure(data[0]);
          if (typeof data[0] === "object" && data[0] !== null) {
            analysis.commonKeys = Object.keys(data[0]);
          }
        }
        break;
      case "object":
        analysis.keys = Object.keys(data);
        analysis.keyCount = analysis.keys.length;
        analysis.keyTypes = {};
        analysis.keys.forEach(key => {
          analysis.keyTypes[key] = typeof data[key];
        });
        break;
      case "string":
        analysis.length = data.length;
        analysis.sample = data.length > 100 ? data.substring(0, 100) + "..." : data;
        break;
      case "number":
        analysis.value = data;
        analysis.isInteger = Number.isInteger(data);
        break;
      default:
        analysis.value = data;
    }
    
    return analysis;
  }

  /**
   * Pre-built API call methods for common patterns
   */
  
  // Generic GET request
  async get(url, params = {}, options = {}) {
    console.log("🔵 API GET Request:", {
      url,
      params,
      options: { ...options, rowIndex: options.rowIndex || 0 }
    });
    
    const cacheKey = `GET:${url}:${JSON.stringify(params)}`;
    const apiCall = async () => {
      const response = await axios.get(url, { 
        params, 
        timeout: options.timeout || this.config.timeout 
      });
      
      console.log("✅ API GET Response for " + url + ":", {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
        dataStructure: this.analyzeDataStructure(response.data),
        fullData: response.data
      });
      
      return response.data;
    };
    
    return this.fetchData(cacheKey, apiCall, options, options.rowIndex || 0);
  }

  // Generic POST request (usually not cached)
  async post(url, data = {}, options = {}) {
    console.log("🟡 API POST Request:", {
      url,
      requestData: data,
      options: { ...options, rowIndex: options.rowIndex || 0 }
    });
    
    const apiCall = async () => {
      const response = await axios.post(url, data, { 
        timeout: options.timeout || this.config.timeout 
      });
      
      console.log("✅ API POST Response for " + url + ":", {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
        dataStructure: this.analyzeDataStructure(response.data),
        fullData: response.data
      });
      
      return response.data;
    };
    
    // POST requests usually bypass cache unless specifically requested
    if (options.cache) {
      const cacheKey = `POST:${url}:${JSON.stringify(data)}`;
      return this.fetchData(cacheKey, apiCall, options, options.rowIndex || 0);
    } else {
      return apiCall();
    }
  }

  // Change Action specific method (backwards compatibility)
  async fetchChangeAction(objectId, rowIndex = 0) {
    console.log("🟠 Fetching Change Action:", {
      objectId,
      rowIndex,
      endpoint: getApiBaseUrl() + "/internal/resources/AttributeValQuery/retrieveReleaseChangeAction"
    });
    
    const apiCall = async () => {
      const response = await axios.get(
        `${getApiBaseUrl()}/internal/resources/AttributeValQuery/retrieveReleaseChangeAction`,
        { 
          params: { objectId },
          timeout: this.config.timeout
        }
      );
      
      const processedData = {
        caNumber: response.data.caNumber || "",
        caLink: response.data.caLink || "",
        caState: response.data.caState || ""
      };
      
      console.log("✅ Change Action Response:", {
        objectId,
        rawResponse: {
          status: response.status,
          statusText: response.statusText,
          headers: response.headers,
          fullData: response.data
        },
        processedData,
        availableFields: Object.keys(response.data || {}),
        dataTypes: this.analyzeDataStructure(response.data)
      });
      
      return processedData;
    };

    const cacheKey = `CA:${objectId}`;
    return this.fetchData(cacheKey, apiCall, {}, rowIndex);
  }

  // Note: Specific data fetching methods (fetchParts, fetchPrograms, etc.) 
  // are implemented in DataServiceBase.js with actual production endpoints
}

// Export singleton instance
export default new ApiService();
