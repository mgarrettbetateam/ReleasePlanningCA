/* eslint-disable no-console */
import axios from "axios";

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
    
    try {
      // Check cache first
      if (this.cache.has(cacheKey)) {
        console.log(`Cache hit for ${cacheKey}`);
        return this.cache.get(cacheKey);
      }

      // If request is already pending, wait for it
      if (this.pendingRequests.has(cacheKey)) {
        console.log(`Waiting for pending request ${cacheKey}`);
        return await this.pendingRequests.get(cacheKey);
      }
      
      // Add staggered delay based on row index
      const delay = rowIndex * config.rowIndexDelay;
      if (delay > 0) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }

      // Add to queue
      return await this.queueRequest(cacheKey, apiCall, config);

    } catch (err) {
      this.pendingRequests.delete(cacheKey);
      throw err;
    }
  }

  async queueRequest(cacheKey, apiCall, config) {
    return new Promise((resolve, reject) => {
      this.requestQueue.push({
        cacheKey,
        apiCall,
        config,
        resolve,
        reject,
        retryCount: 0
      });
      
      this.processQueue();
    });
  }

  async processQueue() {
    if (this.isProcessingQueue || this.requestQueue.length === 0) return;
    
    this.isProcessingQueue = true;
    
    while (this.requestQueue.length > 0) {
      const batch = this.requestQueue.splice(0, this.config.maxConcurrentRequests);
      
      await Promise.allSettled(
        batch.map(async request => {
          try {
            // Double-check cache (might have been populated by another request)
            if (this.cache.has(request.cacheKey)) {
              const cachedData = this.cache.get(request.cacheKey);
              request.resolve(cachedData);
              return;
            }

            // Check pending requests
            if (this.pendingRequests.has(request.cacheKey)) {
              const data = await this.pendingRequests.get(request.cacheKey);
              request.resolve(data);
              return;
            }

            // Make the actual API call with retry logic
            const requestPromise = this.fetchWithRetry(request.apiCall, request.config, request.retryCount);
            this.pendingRequests.set(request.cacheKey, requestPromise);

            const data = await requestPromise;
            
            // Cache result and clean up
            this.cache.set(request.cacheKey, data);
            this.pendingRequests.delete(request.cacheKey);
            
            request.resolve(data);

          } catch (err) {
            this.pendingRequests.delete(request.cacheKey);
            
            // Retry logic for server errors
            if (this.shouldRetry(err) && request.retryCount < request.config.maxRetries) {
              request.retryCount++;
              console.warn(`Retrying request for ${request.cacheKey}, attempt ${request.retryCount}/${request.config.maxRetries}`);
              
              // Add back to queue with increased retry count
              this.requestQueue.push(request);
            } else {
              console.error(`Failed after ${request.config.maxRetries} retries for ${request.cacheKey}:`, err.message);
              request.reject(err);
            }
          }
        })
      );
      
      // Delay between batches
      if (this.requestQueue.length > 0) {
        await new Promise(resolve => setTimeout(resolve, this.config.batchDelay));
      }
    }
    
    this.isProcessingQueue = false;
  }

  async fetchWithRetry(apiCall, config, retryCount = 0) {
    try {
      // Add exponential backoff for retries with jitter
      if (retryCount > 0) {
        const backoffDelay = config.retryDelay * Math.pow(2, retryCount - 1);
        const jitter = Math.random() * this.JITTER_MAX;
        await new Promise(resolve => setTimeout(resolve, backoffDelay + jitter));
      }

      return await apiCall();
      
    } catch (error) {
      console.error(`API call failed (attempt ${retryCount + 1}):`, error.message);
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
      this.cache.delete(key);
    } else {
      this.cache.clear();
    }
  }

  /**
   * Pre-built API call methods for common patterns
   */
  
  // Generic GET request
  async get(url, params = {}, options = {}) {
    const cacheKey = `GET:${url}:${JSON.stringify(params)}`;
    const apiCall = () => axios.get(url, { 
      params, 
      timeout: options.timeout || this.config.timeout 
    }).then(response => response.data);
    
    return this.fetchData(cacheKey, apiCall, options, options.rowIndex || 0);
  }

  // Generic POST request (usually not cached)
  async post(url, data = {}, options = {}) {
    const apiCall = () => axios.post(url, data, { 
      timeout: options.timeout || this.config.timeout 
    }).then(response => response.data);
    
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
    const apiCall = () => axios.get(
      "https://3dspace-prod.beta.team/internal/resources/AttributeValQuery/retrieveReleaseChangeAction",
      { 
        params: { objectId },
        timeout: this.config.timeout
      }
    ).then(response => ({
      caNumber: response.data.caNumber || "",
      caLink: response.data.caLink || "",
      caState: response.data.caState || ""
    }));

    const cacheKey = `CA:${objectId}`;
    return this.fetchData(cacheKey, apiCall, {}, rowIndex);
  }

  // Parts data fetching
  async fetchParts(phase, options = {}) {
    const cacheKey = `PARTS:${phase}`;
    const apiCall = () => axios.get("/api/parts", {
      params: { phase },
      timeout: this.config.timeout
    }).then(response => response.data);

    return this.fetchData(cacheKey, apiCall, options);
  }

  // Programs data fetching
  async fetchPrograms(options = {}) {
    const cacheKey = "PROGRAMS";
    const apiCall = () => axios.get("/api/programs", {
      timeout: this.config.timeout
    }).then(response => response.data);

    return this.fetchData(cacheKey, apiCall, options);
  }

  // Phases data fetching
  async fetchPhases(program, options = {}) {
    const cacheKey = `PHASES:${program}`;
    const apiCall = () => axios.get("/api/phases", {
      params: { program },
      timeout: this.config.timeout
    }).then(response => response.data);

    return this.fetchData(cacheKey, apiCall, options);
  }

  // Organizations data fetching
  async fetchOrganizations(options = {}) {
    const cacheKey = "ORGANIZATIONS";
    const apiCall = () => axios.get("/api/organizations", {
      timeout: this.config.timeout
    }).then(response => response.data);

    return this.fetchData(cacheKey, apiCall, options);
  }

  // CA Stats fetching
  async fetchCAStats(physId, rowIndex = 0) {
    const cacheKey = `CA_STATS:${physId}`;
    const apiCall = () => axios.get("/api/ca-stats", {
      params: { physId },
      timeout: this.config.timeout
    }).then(response => response.data);

    return this.fetchData(cacheKey, apiCall, {}, rowIndex);
  }
}

// Export singleton instance
export default new ApiService();
