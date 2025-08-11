/**
 * Performance Optimization Utility
 * Provides production-ready performance improvements
 */

// Constants to avoid magic numbers
const RESIZE_THROTTLE_MS = 150;
const SCROLL_DEBOUNCE_MS = 50;
const MAX_LISTENERS_WARNING = 5;
const SLOW_WATCHER_THRESHOLD_MS = 10;
const BYTES_PER_KB = 1024;
const BYTES_PER_MB = BYTES_PER_KB * BYTES_PER_KB;
const HIGH_MEMORY_THRESHOLD_MB = 100;

// Development vs Production logging
export const logger = {
    debug: (...args) => {
        if (process.env.NODE_ENV === "development") {
            // eslint-disable-next-line no-console
            console.log(...args);
        }
    },
    
    warn: (...args) => {
        if (process.env.NODE_ENV === "development") {
            // eslint-disable-next-line no-console
            console.warn(...args);
        }
    },
    
    error: (...args) => {
        // eslint-disable-next-line no-console
        console.error(...args); // Always log errors
    },
    
    group: label => {
        if (process.env.NODE_ENV === "development") {
            // eslint-disable-next-line no-console
            console.group(label);
        }
    },
    
    groupEnd: () => {
        if (process.env.NODE_ENV === "development") {
            // eslint-disable-next-line no-console
            console.groupEnd();
        }
    }
};

// Debounce utility for performance
export function debounce(func, wait, immediate = false) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            timeout = null;
            if (!immediate) func.apply(this, args);
        };
        const callNow = immediate && !timeout;
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
        if (callNow) func.apply(this, args);
    };
}

// Throttle utility for performance
export function throttle(func, limit) {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// Smart watcher that only triggers on meaningful changes
export function createSmartWatcher(getValue, callback, options = {}) {
    const { 
        deep = false, 
        immediate = false, 
        debounceTime = 100,
        throttleTime = null,
        compareFunction = null 
    } = options;
    
    let _lastValue = getValue();
    let timeoutId;
    let lastCallTime = 0;
    
    const wrappedCallback = (...args) => {
        if (throttleTime) {
            const now = Date.now();
            if (now - lastCallTime < throttleTime) {
                return;
            }
            lastCallTime = now;
        }
        
        if (debounceTime > 0) {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => callback(...args), debounceTime);
        } else {
            callback(...args);
        }
    };
    
    return {
        handler(newValue, oldValue) {
            // Use custom compare function if provided
            if (compareFunction) {
                if (!compareFunction(newValue, oldValue)) {
                    return; // No meaningful change
                }
            }
            // Default comparison for arrays (check length only)
            else if (Array.isArray(newValue) && Array.isArray(oldValue)) {
                if (newValue.length === oldValue.length) {
                    return; // Same length, likely just content changes
                }
            }
            // Default comparison for objects
            else if (typeof newValue === "object" && typeof oldValue === "object") {
                if (JSON.stringify(newValue) === JSON.stringify(oldValue)) {
                    return; // Same object content
                }
            }
            
            wrappedCallback(newValue, oldValue);
        },
        deep,
        immediate
    };
}

// Performance-optimized event listener manager
export class EventListenerManager {
    constructor() {
        this.listeners = new Map();
        this.cleanupCallbacks = new Set();
    }
    
    addEventListener(element, event, handler, options = {}) {
        const key = `${element.constructor.name}-${event}`;
        
        // Throttle resize events
        if (event === "resize") {
            handler = throttle(handler, RESIZE_THROTTLE_MS);
        }
        
        // Debounce scroll events
        if (event === "scroll") {
            handler = debounce(handler, SCROLL_DEBOUNCE_MS);
        }
        
        // Add passive option for better performance
        const finalOptions = {
            passive: true,
            ...options
        };
        
        element.addEventListener(event, handler, finalOptions);
        
        // Track for cleanup
        const cleanup = () => {
            element.removeEventListener(event, handler, finalOptions);
        };
        
        this.cleanupCallbacks.add(cleanup);
        
        // Count listeners for debugging
        const count = this.listeners.get(key) || 0;
        this.listeners.set(key, count + 1);
        
        if (count > MAX_LISTENERS_WARNING) {
            logger.warn(`⚠️ Many ${event} listeners on ${element.constructor.name}: ${count + 1}`);
        }
        
        return cleanup;
    }
    
    cleanup() {
        this.cleanupCallbacks.forEach(cleanup => {
            try {
                cleanup();
            } catch (error) {
                logger.error("Error cleaning up event listener:", error);
            }
        });
        this.cleanupCallbacks.clear();
        this.listeners.clear();
    }
    
    getListenerCount() {
        return Array.from(this.listeners.entries());
    }
}

// Performance monitoring for watchers
export function trackWatcherPerformance(name, watcher) {
    return {
        ...watcher,
        handler(...args) {
            const start = performance.now();
            const result = watcher.handler.apply(this, args);
            const duration = performance.now() - start;
            
            if (duration > SLOW_WATCHER_THRESHOLD_MS) { // Log slow watchers
                logger.warn(`🐌 Slow watcher '${name}': ${duration.toFixed(2)}ms`);
            }
            
            return result;
        }
    };
}

// Batch DOM updates for better performance
export function batchDOMUpdates(updates) {
    return new Promise(resolve => {
        requestAnimationFrame(() => {
            updates.forEach(update => {
                try {
                    update();
                } catch (error) {
                    logger.error("Error in batch DOM update:", error);
                }
            });
            resolve();
        });
    });
}

// Memory usage monitor
export function checkMemoryUsage() {
    if (window.performance && window.performance.memory) {
        const memory = window.performance.memory;
        const usedMB = (memory.usedJSHeapSize / BYTES_PER_MB).toFixed(2);
        const totalMB = (memory.totalJSHeapSize / BYTES_PER_MB).toFixed(2);
        
        logger.debug(`💾 Memory: ${usedMB}MB / ${totalMB}MB`);
        
        if (memory.usedJSHeapSize > HIGH_MEMORY_THRESHOLD_MB * BYTES_PER_MB) { // 100MB
            logger.warn(`🧠 High memory usage: ${usedMB}MB`);
        }
        
        return { used: usedMB, total: totalMB };
    }
    return null;
}

export default {
    logger,
    debounce,
    throttle,
    createSmartWatcher,
    EventListenerManager,
    trackWatcherPerformance,
    batchDOMUpdates,
    checkMemoryUsage
};
