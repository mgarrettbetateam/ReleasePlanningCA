/* eslint-disable no-console */
// Universal Data Service - Consolidates all data operations with caching and transformation

import ApiService from "./ApiService.js";
import dataService from "@/data/DataServiceBase.js";
import { DATA_SOURCES } from "@/config/WidgetRegistry.js";

class UniversalDataService {
    constructor() {
        this.api = ApiService;
        this.cache = new Map();
        this.subscriptions = new Map();
        this.lastFetch = new Map();
        
        // Cache settings
        this.CACHE_TTL = 300000; // 5 minutes
        this.MAX_CACHE_SIZE = 100;
        
        // Logging constants
        this.MAX_SAMPLE_KEYS = 5;
        this.MAX_ITEM_KEYS = 10;
        
        // API Configuration - Set to true to use real API endpoints
        this.USE_API = false; // Change to true to enable API calls
    }

    /**
     * Generic data fetcher with auto-caching and transformation
     * @param {string} dataSourceKey - Key from DATA_SOURCES config
     * @param {Object} filters - Filter parameters
     * @param {Object} options - Additional options
     * @returns {Promise<Object>} - Transformed data for charts and tables
     */
    async fetchData(dataSourceKey, filters = {}, options = {}) {
        const cacheKey = this.generateCacheKey(dataSourceKey, filters);
        
        // Check cache first
        if (this.isCacheValid(cacheKey) && !options.forceRefresh) {
            console.log(`Cache hit for ${dataSourceKey}`);
            return this.cache.get(cacheKey);
        }

        try {
            const dataSource = DATA_SOURCES[dataSourceKey];
            if (!dataSource) {
                throw new Error(`Unknown data source: ${dataSourceKey}`);
            }

            let rawData;
            
            // Try API first, fallback to local data
            if (dataSource.endpoint && this.USE_API && !options.useLocalData) {
                try {
                    console.log("🌐 API Mode - Attempting API call:", {
                        dataSourceKey,
                        endpoint: dataSource.endpoint,
                        filters,
                        options
                    });
                    
                    // Use the specific API methods for different data types
                    if (dataSourceKey === "parts") {
                        const phase = filters.phase || filters.selectedPhase || "Phase 1";
                        console.log("📦 Fetching PARTS data:", {
                            phase,
                            dataSourceKey,
                            endpoint: dataSource.endpoint
                        });
                        rawData = await this.api.fetchParts(phase);
                        console.log("✅ PARTS data received:", {
                            type: typeof rawData,
                            isArray: Array.isArray(rawData),
                            count: Array.isArray(rawData) ? rawData.length : "Not array",
                            firstItem: Array.isArray(rawData) && rawData.length > 0 ? rawData[0] : null
                        });
                    } else if (dataSourceKey === "cas") {
                        console.log("🔄 Fetching CAS data for phase:", filters.phase);
                        const phase = filters.phase || filters.selectedPhase || "Phase 1";
                        console.log("� Fetching CAS data:", {
                            phase,
                            dataSourceKey,
                            endpoint: dataSource.endpoint
                        });
                        rawData = await dataService.fetchCAs(phase);
                        console.log("✅ CAS data received:", {
                            type: typeof rawData,
                            isArray: Array.isArray(rawData),
                            count: Array.isArray(rawData) ? rawData.length : "Not array",
                            firstItem: Array.isArray(rawData) && rawData.length > 0 ? rawData[0] : null
                        });
                    } else if (dataSourceKey === "stats") {
                        console.log("📊 Fetching STATS data:", {
                            dataSourceKey,
                            endpoint: dataSource.endpoint
                        });
                        // Fetch stats data using dedicated method
                        rawData = await this.api.get(dataSource.endpoint);
                        console.log("✅ STATS data received:", {
                            type: typeof rawData,
                            keys: rawData && typeof rawData === "object" ? Object.keys(rawData) : "Not object"
                        });
                    } else {
                        console.log("🔧 Generic API call:", {
                            dataSourceKey,
                            endpoint: dataSource.endpoint,
                            filters
                        });
                        // Generic API call for other endpoints
                        const params = this.buildFilterParams(filters);
                        console.log("📋 Built filter params:", params);
                        rawData = await this.api.get(dataSource.endpoint, params);
                        console.log("✅ Generic API data received:", {
                            type: typeof rawData,
                            isArray: Array.isArray(rawData),
                            count: Array.isArray(rawData) ? rawData.length : "Not array"
                        });
                    }
                    
                    console.log("🎯 Final API data summary:", {
                        dataSourceKey,
                        dataType: typeof rawData,
                        isArray: Array.isArray(rawData),
                        itemCount: Array.isArray(rawData) ? rawData.length : "Not array",
                        hasData: !!rawData,
                        sampleKeys: rawData && typeof rawData === "object" && !Array.isArray(rawData) 
                            ? Object.keys(rawData).slice(0, Math.min(Object.keys(rawData).length, this.MAX_SAMPLE_KEYS)) 
                            : null,
                        firstItemKeys: Array.isArray(rawData) && rawData.length > 0 && typeof rawData[0] === "object"
                            ? Object.keys(rawData[0]).slice(0, Math.min(Object.keys(rawData[0]).length, this.MAX_ITEM_KEYS))
                            : null
                    });
                    
                } catch (apiError) {
                    console.warn("❌ API failed, falling back to local data:", {
                        dataSourceKey,
                        endpoint: dataSource.endpoint,
                        error: apiError.message,
                        stack: apiError.stack
                    });
                    rawData = await this.loadLocalData(dataSource);
                }
            } else {
                console.log("💾 Local Mode - Loading local data:", {
                    dataSourceKey,
                    hasEndpoint: !!dataSource.endpoint,
                    useApi: this.USE_API,
                    useLocalData: options.useLocalData
                });
                rawData = await this.loadLocalData(dataSource);
                console.log("📁 Local data loaded:", {
                    dataSourceKey,
                    type: typeof rawData,
                    isArray: Array.isArray(rawData),
                    count: Array.isArray(rawData) ? rawData.length : "Not array"
                });
            }

            // Transform data for different widget types
            const transformedData = {
                raw: rawData,
                chart: dataSource.chartAdapter ? dataSource.chartAdapter(rawData) : null,
                table: dataSource.tableAdapter ? dataSource.tableAdapter(rawData) : rawData,
                filters: this.extractFilterOptions(rawData, filters),
                metadata: {
                    lastUpdated: new Date().toISOString(),
                    recordCount: Array.isArray(rawData) ? rawData.length : Object.keys(rawData || {}).length,
                    source: dataSource.endpoint && !options.useLocalData ? "api" : "local"
                }
            };

            // Cache the result
            this.setCache(cacheKey, transformedData);
            this.notifySubscribers(cacheKey, transformedData);

            return transformedData;

        } catch (error) {
            console.error(`Error fetching data for ${dataSourceKey}:`, error);
            
            // Return empty data structure on error
            return {
                raw: null,
                chart: { labels: [], datasets: [] },
                table: [],
                filters: {},
                metadata: {
                    error: error.message,
                    lastUpdated: new Date().toISOString(),
                    recordCount: 0,
                    source: "error"
                }
            };
        }
    }

    /**
     * Load local data from module
     */
    async loadLocalData(dataSource) {
        if (dataSource.localData) {
            const data = await dataSource.localData();
            return data;
        }
        return null;
    }

    /**
     * Subscribe to data changes
     */
    subscribe(dataSourceKey, filters, callback) {
        const cacheKey = this.generateCacheKey(dataSourceKey, filters);
        
        if (!this.subscriptions.has(cacheKey)) {
            this.subscriptions.set(cacheKey, new Set());
        }
        
        this.subscriptions.get(cacheKey).add(callback);
        
        // Return unsubscribe function
        return () => {
            const subscribers = this.subscriptions.get(cacheKey);
            if (subscribers) {
                subscribers.delete(callback);
                if (subscribers.size === 0) {
                    this.subscriptions.delete(cacheKey);
                }
            }
        };
    }

    /**
     * Get available filter values for a data source
     */
    async getFilterOptions(dataSourceKey, filterField) {
        try {
            const data = await this.fetchData(dataSourceKey, {}, { useLocalData: true });
            
            if (!data.raw || !Array.isArray(data.raw)) {
                return [];
            }

            const uniqueValues = [...new Set(
                data.raw
                    .map(item => item[filterField])
                    .filter(value => value !== null && value !== undefined && value !== "")
            )];

            return uniqueValues.sort().map(value => ({
                text: value,
                value
            }));

        } catch (error) {
            console.error(`Error getting filter options for ${dataSourceKey}.${filterField}:`, error);
            return [];
        }
    }

    /**
     * Invalidate cache for specific data source or all
     */
    invalidateCache(dataSourceKey = null) {
        if (dataSourceKey) {
            // Invalidate specific data source
            const keysToDelete = Array.from(this.cache.keys())
                .filter(key => key.startsWith(`${dataSourceKey}:`));
            
            keysToDelete.forEach(key => {
                this.cache.delete(key);
                this.lastFetch.delete(key);
            });
            
            console.log(`Cache invalidated for ${dataSourceKey}`);
        } else {
            // Invalidate all cache
            this.cache.clear();
            this.lastFetch.clear();
            console.log("All cache invalidated");
        }
    }

    /**
     * Generate cache key from data source and filters
     */
    generateCacheKey(dataSourceKey, filters) {
        const filterStr = Object.entries(filters)
            .filter(([, value]) => value && value !== "All")
            .sort()
            .map(([key, value]) => `${key}=${value}`)
            .join("&");
        
        return `${dataSourceKey}:${filterStr}`;
    }

    /**
     * Build filter parameters for API calls
     */
    buildFilterParams(filters) {
        return Object.entries(filters)
            .filter(([, value]) => value && value !== "All" && value !== "")
            .reduce((params, [key, value]) => {
                params[key] = value;
                return params;
            }, {});
    }

    /**
     * Extract filter options from raw data
     */
    extractFilterOptions(rawData, requestedFilters) {
        if (!rawData || !Array.isArray(rawData)) {
            return {};
        }

        const filterOptions = {};
        
        Object.keys(requestedFilters).forEach(filterKey => {
            const uniqueValues = [...new Set(
                rawData
                    .map(item => item[filterKey])
                    .filter(value => value !== null && value !== undefined && value !== "")
            )];

            filterOptions[filterKey] = uniqueValues.sort().map(value => ({
                text: value,
                value
            }));
        });

        return filterOptions;
    }

    /**
     * Check if cache is valid
     */
    isCacheValid(cacheKey) {
        if (!this.cache.has(cacheKey)) return false;
        
        const lastFetch = this.lastFetch.get(cacheKey);
        if (!lastFetch) return false;
        
        return (Date.now() - lastFetch) < this.CACHE_TTL;
    }

    /**
     * Set cache with cleanup
     */
    setCache(cacheKey, data) {
        // Clean up old cache if at max size
        if (this.cache.size >= this.MAX_CACHE_SIZE) {
            const oldestKey = this.cache.keys().next().value;
            this.cache.delete(oldestKey);
            this.lastFetch.delete(oldestKey);
        }

        this.cache.set(cacheKey, data);
        this.lastFetch.set(cacheKey, Date.now());
    }

    /**
     * Notify subscribers of data changes
     */
    notifySubscribers(cacheKey, data) {
        const subscribers = this.subscriptions.get(cacheKey);
        if (subscribers) {
            subscribers.forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error("Error in data subscription callback:", error);
                }
            });
        }
    }

    /**
     * Get cache statistics
     */
    getCacheStats() {
        return {
            size: this.cache.size,
            maxSize: this.MAX_CACHE_SIZE,
            ttl: this.CACHE_TTL,
            keys: Array.from(this.cache.keys()),
            subscriptions: this.subscriptions.size
        };
    }

    /**
     * Enable or disable API usage
     * @param {boolean} useApi - Whether to use API endpoints
     */
    setApiUsage(useApi) {
        this.USE_API = useApi;
        if (useApi) {
            console.log("✅ API mode enabled - Will attempt real API calls");
        } else {
            console.log("📁 Local mode enabled - Using sample data files");
        }
        // Clear cache when switching modes
        this.cache.clear();
    }

    /**
     * Get current API usage status
     */
    isUsingApi() {
        return this.USE_API;
    }

    /**
     * Force refresh all cached data
     */
    refreshAll() {
        this.cache.clear();
        this.lastFetch.clear();
    }
}

// Export singleton instance
export default new UniversalDataService();
