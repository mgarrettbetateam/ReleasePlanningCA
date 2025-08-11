/**
 * Performance Monitoring Utility
 * Helps identify performance bottlenecks in the application
 */

export class PerformanceMonitor {
    constructor() {
        this.enabled = false; // Enable in development only
        this.metrics = new Map();
        this.observers = new Map();
        this.thresholds = {
            slowRender: 16, // More than 16ms render time
            memoryLeak: 50 * 1024 * 1024, // 50MB
            tooManyListeners: 10
        };
        
        // Enable in development
        if (process.env.NODE_ENV === "development") {
            this.enabled = true;
            this.startMonitoring();
        }
    }
    
    startMonitoring() {
        if (!this.enabled) return;
        
        this.monitorRenderTimes();
        this.monitorMemoryUsage();
        this.monitorEventListeners();
        this.setupConsoleCommands();
    }
    
    /**
     * Monitor Vue component render times
     */
    monitorRenderTimes() {
        const originalUpdate = Vue.prototype.$forceUpdate;
        Vue.prototype.$forceUpdate = function() {
            const start = performance.now();
            const result = originalUpdate.call(this);
            const duration = performance.now() - start;
            
            if (duration > this.thresholds.slowRender) {
                console.warn(`🐌 Slow render detected: ${this.$options.name || "Unknown"} took ${duration.toFixed(2)}ms`);
            }
            
            return result;
        }.bind(this);
    }
    
    /**
     * Monitor memory usage
     */
    monitorMemoryUsage() {
        setInterval(() => {
            if (window.performance && window.performance.memory) {
                const memory = window.performance.memory;
                const used = memory.usedJSHeapSize;
                
                if (used > this.thresholds.memoryLeak) {
                    console.warn(`🧠 High memory usage: ${(used / 1024 / 1024).toFixed(2)}MB`);
                }
                
                this.metrics.set("memory", {
                    used,
                    total: memory.totalJSHeapSize,
                    limit: memory.jsHeapSizeLimit,
                    timestamp: Date.now()
                });
            }
        }, 5000); // Check every 5 seconds
    }
    
    /**
     * Monitor event listeners
     */
    monitorEventListeners() {
        const originalAddEventListener = EventTarget.prototype.addEventListener;
        const originalRemoveEventListener = EventTarget.prototype.removeEventListener;
        const listenerCount = new Map();
        
        EventTarget.prototype.addEventListener = function(type, listener, options) {
            const key = `${this.constructor.name}-${type}`;
            listenerCount.set(key, (listenerCount.get(key) || 0) + 1);
            
            const total = listenerCount.get(key);
            if (total > this.thresholds.tooManyListeners) {
                console.warn(`👂 Too many listeners: ${total} ${type} listeners on ${this.constructor.name}`);
            }
            
            return originalAddEventListener.call(this, type, listener, options);
        }.bind(this);
        
        EventTarget.prototype.removeEventListener = function(type, listener, options) {
            const key = `${this.constructor.name}-${type}`;
            const current = listenerCount.get(key) || 0;
            if (current > 0) {
                listenerCount.set(key, current - 1);
            }
            
            return originalRemoveEventListener.call(this, type, listener, options);
        };
    }
    
    /**
     * Setup console commands for debugging
     */
    setupConsoleCommands() {
        window.perf = {
            // Show current performance metrics
            status: () => {
                console.group("🔍 Performance Status");
                console.log("Memory:", this.metrics.get("memory"));
                console.log("Render times recorded:", this.metrics.size);
                console.groupEnd();
            },
            
            // Profile Vue components
            profileComponents: () => {
                console.log("🔍 Profiling Vue components...");
                const startTime = performance.now();
                
                // Force update all components to measure render times
                document.querySelectorAll("[data-v-]").forEach(el => {
                    if (el.__vue__) {
                        const componentStart = performance.now();
                        el.__vue__.$forceUpdate();
                        const componentTime = performance.now() - componentStart;
                        
                        if (componentTime > 5) { // Log components taking more than 5ms
                            console.log(`📊 ${el.__vue__.$options.name || "Component"}: ${componentTime.toFixed(2)}ms`);
                        }
                    }
                });
                
                console.log(`✅ Profile complete: ${(performance.now() - startTime).toFixed(2)}ms`);
            },
            
            // Clear performance data
            clear: () => {
                this.metrics.clear();
                console.log("🧹 Performance data cleared");
            },
            
            // Show responsive listener count
            responsiveListeners: () => {
                const utils = window.Vue?.prototype?.$responsive;
                if (utils) {
                    console.log(`👂 Responsive listeners: ${utils.windowResizeCallbacks?.size || "Unknown"}`);
                } else {
                    console.log("❌ ResponsiveUtils not accessible");
                }
            }
        };
        
        console.log("🔧 Performance monitoring enabled. Use 'perf.status()' for current metrics.");
    }
    
    /**
     * Track component lifecycle
     */
    trackComponent(component, phase) {
        if (!this.enabled) return;
        
        const key = `${component.$options.name || "Component"}-${phase}`;
        const start = performance.now();
        
        return () => {
            const duration = performance.now() - start;
            this.metrics.set(key, duration);
            
            if (duration > this.thresholds.slowRender) {
                console.warn(`⏱️ Slow ${phase}: ${key} took ${duration.toFixed(2)}ms`);
            }
        };
    }
    
    /**
     * Cleanup monitoring
     */
    cleanup() {
        this.metrics.clear();
        this.observers.clear();
        this.enabled = false;
    }
}

// Create singleton instance
export const performanceMonitor = new PerformanceMonitor();

// Vue mixin for component performance tracking
export const PerformanceMixin = {
    beforeCreate() {
        this._perfStart = performance.now();
    },
    
    created() {
        const duration = performance.now() - this._perfStart;
        if (duration > 10) { // Log components taking more than 10ms to create
            console.log(`🏗️ ${this.$options.name || "Component"} creation: ${duration.toFixed(2)}ms`);
        }
    },
    
    beforeMount() {
        this._mountStart = performance.now();
    },
    
    mounted() {
        const duration = performance.now() - this._mountStart;
        if (duration > 20) { // Log components taking more than 20ms to mount
            console.log(`🔧 ${this.$options.name || "Component"} mount: ${duration.toFixed(2)}ms`);
        }
    }
};

export default performanceMonitor;
