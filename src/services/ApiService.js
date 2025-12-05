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
    
    // Initialize IndexedDB for persistent CA data caching
    this.initIndexedDBCache();
  }

  /**
   * Initialize IndexedDB for persistent CA data caching
   * Write-through caching with 24-hour TTL and auto-cleanup
   */
  async initIndexedDBCache() {
    this.dbName = "ReleasePlannerCA";
    this.dbVersion = 1;
    this.storeName = "ca-cache";
    this.db = null;
    this.TTL_HOURS = 24;
    this.MAX_CACHE_ENTRIES = 5000; // Auto-cleanup when reached
    
    try {
      this.db = await this.openIndexedDB();
      console.log("✅ IndexedDB cache initialized successfully");
      
      // Start background cleanup on initialization
      setTimeout(() => this.cleanupExpiredEntries(), 5000);
      
    } catch (error) {
      console.warn("⚠️ IndexedDB initialization failed, continuing without persistent cache:", error);
      this.db = null;
    }
  }

  /**
   * Open IndexedDB connection with proper schema
   */
  openIndexedDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);
      
      request.onerror = () => reject(request.error);
      
      request.onsuccess = () => {
        const db = request.result;
        
        // Handle version changes (like browser updates)
        db.onversionchange = () => {
          db.close();
          console.log("📦 IndexedDB version changed, will reinitialize on next access");
        };
        
        resolve(db);
      };
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        
        // Create object store if it doesn't exist
        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, { keyPath: "physId" });
          
          // Create indexes for efficient querying
          store.createIndex("timestamp", "timestamp");
          store.createIndex("ttl", "expiresAt");
          
          console.log("📦 IndexedDB store created with indexes");
        }
      };
    });
  }

  /**
   * Get CA data from IndexedDB cache (Tier 2 cache)
   */
  async getCachedCAData(physId) {
    if (!this.db || !physId) return null;
    
    try {
      const transaction = this.db.transaction([this.storeName], "readonly");
      const store = transaction.objectStore(this.storeName);
      
      return new Promise((resolve, reject) => {
        const request = store.get(physId);
        
        request.onsuccess = () => {
          const result = request.result;
          
          // Check if entry exists and hasn't expired
          if (result && Date.now() < result.expiresAt) {
            console.log("💾 IndexedDB cache hit for physId:", physId);
            resolve(result.data);
          } else {
            // Entry expired or doesn't exist
            if (result) {
              console.log("⏰ IndexedDB cache expired for physId:", physId);
              // Clean up expired entry asynchronously
              this.deleteCADataFromCache(physId);
            }
            resolve(null);
          }
        };
        
        request.onerror = () => {
          console.warn("⚠️ IndexedDB read error for physId:", physId, request.error);
          resolve(null); // Graceful degradation
        };
      });
    } catch (error) {
      console.warn("⚠️ IndexedDB getCachedCAData error:", error);
      return null;
    }
  }

  /**
   * Store CA data in IndexedDB cache (Write-through for performance)
   */
  async storeCADataInCache(physId, caData) {
    if (!this.db || !physId || !caData) return;
    
    try {
      const now = Date.now();
      const expiresAt = now + (this.TTL_HOURS * 60 * 60 * 1000);
      
      const cacheEntry = {
        physId,
        data: caData,
        timestamp: now,
        expiresAt,
        version: this.dbVersion
      };
      
      const transaction = this.db.transaction([this.storeName], "readwrite");
      const store = transaction.objectStore(this.storeName);
      
      const request = store.put(cacheEntry);
      
      request.onsuccess = () => {
        console.log("💾 CA data stored in IndexedDB cache:", physId);
      };
      
      request.onerror = () => {
        console.warn("⚠️ Failed to store CA data in IndexedDB:", physId, request.error);
      };
      
      // Check if we need to trigger cleanup
      transaction.oncomplete = () => {
        this.checkCacheSizeAndCleanup();
      };
      
    } catch (error) {
      console.warn("⚠️ IndexedDB storeCADataInCache error:", error);
    }
  }

  /**
   * Delete specific CA data from IndexedDB cache
   */
  async deleteCADataFromCache(physId) {
    if (!this.db || !physId) return;
    
    try {
      const transaction = this.db.transaction([this.storeName], "readwrite");
      const store = transaction.objectStore(this.storeName);
      
      const request = store.delete(physId);
      
      request.onsuccess = () => {
        console.log("🗑️ Deleted expired CA data from IndexedDB:", physId);
      };
      
    } catch (error) {
      console.warn("⚠️ Error deleting CA data from IndexedDB:", error);
    }
  }

  /**
   * Clear all IndexedDB cache entries
   */
  async clearIndexedDBCache() {
    if (!this.db) return;
    
    try {
      const transaction = this.db.transaction([this.storeName], "readwrite");
      const store = transaction.objectStore(this.storeName);
      
      const request = store.clear();
      
      return new Promise((resolve) => {
        request.onsuccess = () => {
          console.log("🗑️ IndexedDB cache cleared completely");
          resolve();
        };
        
        request.onerror = () => {
          console.warn("⚠️ Error clearing IndexedDB cache:", request.error);
          resolve(); // Don't block on cache clear errors
        };
      });
      
    } catch (error) {
      console.warn("⚠️ Error clearing IndexedDB cache:", error);
    }
  }

  /**
   * Background cleanup of expired entries and size management
   */
  async cleanupExpiredEntries() {
    if (!this.db) return;
    
    try {
      const transaction = this.db.transaction([this.storeName], "readwrite");
      const store = transaction.objectStore(this.storeName);
      const index = store.index("ttl");
      
      // Get all expired entries
      const now = Date.now();
      const expiredRange = IDBKeyRange.upperBound(now);
      
      const request = index.openCursor(expiredRange);
      let deletedCount = 0;
      
      request.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
          cursor.delete();
          deletedCount++;
          cursor.continue();
        } else {
          if (deletedCount > 0) {
            console.log(`🧹 Cleaned up ${deletedCount} expired CA cache entries`);
          }
        }
      };
      
    } catch (error) {
      console.warn("⚠️ Error during cache cleanup:", error);
    }
  }

  /**
   * Check cache size and perform cleanup if needed (keep 80% newest)
   */
  async checkCacheSizeAndCleanup() {
    if (!this.db) return;
    
    try {
      const transaction = this.db.transaction([this.storeName], "readonly");
      const store = transaction.objectStore(this.storeName);
      
      const countRequest = store.count();
      
      countRequest.onsuccess = () => {
        const totalCount = countRequest.result;
        
        if (totalCount > this.MAX_CACHE_ENTRIES) {
          console.log(`📊 Cache size (${totalCount}) exceeds limit (${this.MAX_CACHE_ENTRIES}), triggering cleanup...`);
          this.performSizeBasedCleanup(totalCount);
        }
      };
      
    } catch (error) {
      console.warn("⚠️ Error checking cache size:", error);
    }
  }

  /**
   * Remove oldest 20% of entries when cache is full
   */
  async performSizeBasedCleanup(currentCount) {
    if (!this.db) return;
    
    try {
      const keepCount = Math.floor(currentCount * 0.8); // Keep 80% newest entries
      const deleteCount = currentCount - keepCount;
      
      const transaction = this.db.transaction([this.storeName], "readwrite");
      const store = transaction.objectStore(this.storeName);
      const index = store.index("timestamp");
      
      // Delete oldest entries (lowest timestamps)
      const request = index.openCursor();
      let deletedCount = 0;
      
      request.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor && deletedCount < deleteCount) {
          cursor.delete();
          deletedCount++;
          cursor.continue();
        } else {
          if (deletedCount > 0) {
            console.log(`🧹 Size-based cleanup: deleted ${deletedCount} oldest entries`);
          }
        }
      };
      
    } catch (error) {
      console.warn("⚠️ Error during size-based cleanup:", error);
    }
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

  // Change Action specific method with 3-tier caching (memory, IndexedDB, API)
  async fetchChangeAction(objectId, uniqueId = null, rowIndex = 0) {
    // Use unique identifier for caching if provided, otherwise fall back to objectId
    const cacheIdentifier = uniqueId || objectId;
    
    console.log("🟠 Fetching Change Action (3-tier cache):", {
      objectId,
      uniqueId,
      cacheIdentifier,
      rowIndex,
      endpoint: getApiBaseUrl() + "/internal/resources/AttributeValQuery/retrieveReleaseChangeAction"
    });

    // Tier 1: Check memory cache first (fastest)
    const memoryCacheKey = `CA:${cacheIdentifier}`;
    const memoryCached = this.cache.get(memoryCacheKey);
    
    if (memoryCached && Date.now() < memoryCached.timestamp + memoryCached.ttl) {
      console.log("🚀 Memory cache hit for CA:", cacheIdentifier);
      return memoryCached.data;
    }

    // Tier 2: Check IndexedDB cache (persistent)
    const indexedDBCached = await this.getCachedCAData(cacheIdentifier);
    if (indexedDBCached) {
      console.log("💾 IndexedDB cache hit for CA:", cacheIdentifier);
      
      // Store in memory cache for faster future access
      this.cache.set(memoryCacheKey, {
        data: indexedDBCached,
        timestamp: Date.now(),
        ttl: 300000 // 5 minutes in memory
      });
      
      return indexedDBCached;
    }

    // Tier 3: Fetch from API (slowest)
    console.log("🌐 Fetching CA from API:", cacheIdentifier);
    
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
        caPhysId: response.data.caPhysId || response.data.physId || response.data.objectId || 
                  response.data.caObjectId || response.data.changeActionId || response.data.id || "",
        caState: response.data.caState || "",
        caRespEngr: response.data.caRespEngr || "",
        statusComment: response.data.statusComment || response.data.caStatusComment || 
                      response.data.comment || response.data.comments || response.data.description || ""
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
        dataTypes: this.analyzeDataStructure(response.data),
        // Debug: Show all potential ID fields
        potentialIdFields: {
          caPhysId: response.data.caPhysId,
          physId: response.data.physId,
          objectId: response.data.objectId,
          caObjectId: response.data.caObjectId,
          changeActionId: response.data.changeActionId,
          id: response.data.id
        }
      });

      // Write-through caching: Store in both memory and IndexedDB immediately
      this.cache.set(memoryCacheKey, {
        data: processedData,
        timestamp: Date.now(),
        ttl: 300000 // 5 minutes in memory
      });
      
      // Store in IndexedDB for 24-hour persistence (async, non-blocking)
      this.storeCADataInCache(cacheIdentifier, processedData);
      
      return processedData;
    };

    // Use existing fetchData queue management for API calls
    return this.fetchData(memoryCacheKey, apiCall, {}, rowIndex);
  }

  /**
   * Background preload CA data for given physIds with progress tracking
   * @param {Array<string>} physIds - Array of physIds to preload
   * @param {Function} progressCallback - Callback function (current, total, phase) => {}
   * @returns {Promise} Promise that resolves when preloading is complete
   */
  async preloadCAData(physIds, progressCallback = null) {
    if (!Array.isArray(physIds) || physIds.length === 0) return;
    
    console.log(`🔄 Background preloading CA data for ${physIds.length} items...`);
    
    // Filter out physIds that are already cached (memory or IndexedDB)
    const uncachedIds = [];
    let checkedCount = 0;
    
    for (const physId of physIds) {
      // Check memory cache first
      const memoryCacheKey = `CA:${physId}`;
      if (this.cache.has(memoryCacheKey)) {
        checkedCount++;
        if (progressCallback) progressCallback(checkedCount, physIds.length, "checking-cache");
        continue; // Already in memory cache
      }
      
      // Check IndexedDB cache
      const cachedData = await this.getCachedCAData(physId);
      if (cachedData) {
        // Store in memory cache for faster access
        this.cache.set(memoryCacheKey, {
          data: cachedData,
          timestamp: Date.now(),
          ttl: 300000 // 5 minutes in memory
        });
        checkedCount++;
        if (progressCallback) progressCallback(checkedCount, physIds.length, "cache-hit");
        continue;
      }
      
      uncachedIds.push(physId);
      checkedCount++;
      if (progressCallback) progressCallback(checkedCount, physIds.length, "checking-cache");
    }
    
    if (uncachedIds.length === 0) {
      console.log("✅ All CA data already cached, no preloading needed");
      if (progressCallback) progressCallback(physIds.length, physIds.length, "completed");
      return;
    }
    
    console.log(`📦 Preloading ${uncachedIds.length} uncached CA items in background...`);
    
    // Process in larger batches with maximum parallelism for speed
    const PRELOAD_BATCH_SIZE = 50;
    let completedCount = 0;
    
    // Create all batches upfront
    const batches = [];
    for (let i = 0; i < uncachedIds.length; i += PRELOAD_BATCH_SIZE) {
      batches.push(uncachedIds.slice(i, i + PRELOAD_BATCH_SIZE));
    }
    
    // Process all batches in parallel with no delays
    const batchPromises = batches.map(async (batch, batchIndex) => {
      const batchPromises = batch.map(async (physId, index) => {
        try {
          // This will automatically cache the result via fetchChangeAction
          const result = await this.fetchChangeAction(physId, physId, batchIndex * PRELOAD_BATCH_SIZE + index);
          completedCount++;
          const totalCompleted = physIds.length - uncachedIds.length + completedCount;
          if (progressCallback) progressCallback(totalCompleted, physIds.length, "loading");
          console.log(`✅ Preloaded CA data for: ${physId}`);
          return result;
        } catch (error) {
          console.warn(`⚠️ Failed to preload CA data for ${physId}:`, error);
          completedCount++;
          const totalCompleted = physIds.length - uncachedIds.length + completedCount;
          if (progressCallback) progressCallback(totalCompleted, physIds.length, "error");
          return null;
        }
      });
      
      const results = await Promise.all(batchPromises);
      console.log(`📦 Completed preload batch ${batchIndex + 1}/${batches.length} (${completedCount}/${uncachedIds.length} total)`);
      return results;
    });
    
    // Wait for all batches to complete in parallel
    await Promise.all(batchPromises);
    
    if (progressCallback) progressCallback(physIds.length, physIds.length, "completed");
    console.log("✅ Background CA preloading completed");
  }

  /**
   * Express preload mode for critical export scenarios - maximum parallelism
   * @param {Array<string>} physIds - Array of physIds to preload
   * @param {Function} progressCallback - Callback function (current, total, phase) => {}
   * @returns {Promise} Promise that resolves when preloading is complete
   */
  async preloadCADataExpress(physIds, progressCallback = null) {
    if (!Array.isArray(physIds) || physIds.length === 0) return;
    
    console.log(`🚀 EXPRESS MODE: Preloading ${physIds.length} CA items with maximum parallelism...`);
    
    // Filter out already cached items
    const uncachedIds = [];
    let checkedCount = 0;
    
    for (const physId of physIds) {
      const memoryCacheKey = `CA:${physId}`;
      if (this.cache.has(memoryCacheKey)) {
        checkedCount++;
        if (progressCallback) progressCallback(checkedCount, physIds.length, "cache-hit");
        continue;
      }
      
      const cachedData = await this.getCachedCAData(physId);
      if (cachedData) {
        this.cache.set(memoryCacheKey, {
          data: cachedData,
          timestamp: Date.now(),
          ttl: 300000
        });
        checkedCount++;
        if (progressCallback) progressCallback(checkedCount, physIds.length, "cache-hit");
        continue;
      }
      
      uncachedIds.push(physId);
      checkedCount++;
    }
    
    if (uncachedIds.length === 0) {
      console.log("✅ EXPRESS MODE: All CA data already cached");
      if (progressCallback) progressCallback(physIds.length, physIds.length, "completed");
      return;
    }
    
    console.log(`🔥 EXPRESS MODE: Processing ${uncachedIds.length} uncached items with NO LIMITS...`);
    
    // NO BATCH SIZE LIMITS - Process everything in parallel
    let completedCount = 0;
    
    const allPromises = uncachedIds.map(async (physId, index) => {
      try {
        const result = await this.fetchChangeAction(physId, physId, index);
        completedCount++;
        const totalCompleted = physIds.length - uncachedIds.length + completedCount;
        if (progressCallback) progressCallback(totalCompleted, physIds.length, "express-loading");
        console.log(`⚡ EXPRESS: Preloaded CA data for: ${physId}`);
        return result;
      } catch (error) {
        console.warn(`❌ EXPRESS: Failed to preload CA data for ${physId}:`, error);
        completedCount++;
        const totalCompleted = physIds.length - uncachedIds.length + completedCount;
        if (progressCallback) progressCallback(totalCompleted, physIds.length, "express-error");
        return null;
      }
    });
    
    // Wait for ALL requests to complete in parallel
    await Promise.all(allPromises);
    
    if (progressCallback) progressCallback(physIds.length, physIds.length, "express-completed");
    console.log(`🚀 EXPRESS MODE: Completed all ${physIds.length} items in maximum parallel mode`);
  }

  /**
   * Update status comment for any item type (parts, cas, crs)
   * @param {string} objectId - The object ID (physId/objId)
   * @param {string} statusComment - The updated comment text
   * @param {string} itemType - Type of item ("parts", "cas", "crs")
   * @returns {Promise<Object>} API response
   */
  async updateStatusComment(objectId, statusComment, itemType) {
    console.log("🔄 ApiService.updateStatusComment called:", {
      objectId,
      statusComment: statusComment.substring(0, 100) + "...",
      itemType
    });

    // Validate inputs
    if (!objectId || !itemType) {
      throw new Error("ObjectId and itemType are required for status comment update");
    }

    // Route to appropriate endpoint based on item type
    switch (itemType.toLowerCase()) {
      case "parts":
        // Parts should be handled by StatusCommentDisplay component, but if it reaches here,
        // treat it as a CA update (this is a fallback for backwards compatibility)
        return this.updateCasStatusComment(objectId, statusComment);
      case "cas":
      case "ca":
        return this.updateCasStatusComment(objectId, statusComment);
      case "crs":
      case "cr":
        return this.updateCrsStatusComment(objectId, statusComment);
      case "cx":
        return this.updateCxsStatusComment(objectId, statusComment);
      default:
        throw new Error(`Unsupported item type for status comment update: ${itemType}`);
    }
  }

  /**
   * Update status comment for Change Actions (CAs)
   * @param {string} objectId - CA's physId/objId  
   * @param {string} statusComment - Updated comment
   * @returns {Promise<Object>} API response
   */
  async updateCasStatusComment(objectId, statusComment) {
    console.log("🔄 Updating CAS status comment:", { objectId, statusComment });

    return this.updateStatusCommentAPI(objectId, statusComment, "CA");
  }

  /**
   * Update status comment for Change X (CXs)
   * @param {string} objectId - CX's physId/objId  
   * @param {string} statusComment - Updated comment
   * @returns {Promise<Object>} API response
   */
  async updateCxsStatusComment(objectId, statusComment) {
    console.log("🔄 Updating CXS status comment:", { objectId, statusComment });

    return this.updateStatusCommentAPI(objectId, statusComment, "CX");
  }


  /**
   * Update status comment for Change Requests (CRs)
   * @param {string} objectId - CR's physId/objId
   * @param {string} statusComment - Updated comment
   * @returns {Promise<Object>} API response
   */
  async updateCrsStatusComment(objectId, statusComment) {
    console.log("🔄 Updating CRS status comment:", { objectId, statusComment });

    return this.updateStatusCommentAPI(objectId, statusComment, "CR");
  }

  /**
   * Update status comment via 3DSpace API
   * @param {string} physId - Object physical ID
   * @param {string} comment - Comment text
   * @param {string} type - Object type ("CA" or "CR")
   * @returns {Promise<Object>} API response
   */
  async updateStatusCommentAPI(physId, comment, type) {
    const url = "https://3dspace-prod.beta.team/internal/resources/AttributeValQuery/updateStatusComment";
    
    const requestBody = {
      type,
      comment,
      objectId: physId
    };

    console.log("🔄 Calling 3DSpace status comment API:", {
      url,
      requestBody: {
        type: requestBody.type,
        objectId: requestBody.objectId,
        commentLength: requestBody.comment.length
      }
    });

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify(requestBody)
      });

      console.log("📡 3DSpace API Response Status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ 3DSpace API Error:", {
          status: response.status,
          statusText: response.statusText,
          errorText
        });
        throw new Error(`API request failed: ${response.status} ${response.statusText}\n${errorText}`);
      }

      const responseData = await response.json();
      console.log("✅ 3DSpace API Success:", responseData);

      return {
        success: true,
        message: "Status comment updated successfully",
        data: responseData,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error("❌ 3DSpace API Error:", error);
      
      // Re-throw with more context
      throw new Error(`Failed to update status comment: ${error.message}`);
    }
  }

  // Note: Specific data fetching methods (fetchParts, fetchPrograms, etc.) 
  // are implemented in DataServiceBase.js with actual production endpoints
}

// Export singleton instance
export default new ApiService();
