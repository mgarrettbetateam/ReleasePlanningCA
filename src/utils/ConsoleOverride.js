/**
 * Performance Console Override
 * Uses master boolean flags to control console logging for better performance
 */

/* eslint-disable no-console */
// This file intentionally manipulates console methods for performance optimization

// Master control flags - change these to control console output
const ENABLE_CONSOLE_LOGGING = true; // Set to true to enable all console logging
const ENABLE_DEBUG_LOGGING = true;   // Set to true to enable debug/info logging
const ENABLE_CHART_LOGGING = true;   // Set to true to enable chart-specific logging
const ENABLE_TABLE_LOGGING = true;   // Set to true to enable table-specific logging

// Store original console methods
const originalConsole = {
    log: console.log,
    warn: console.warn,
    error: console.error,
    debug: console.debug,
    info: console.info,
    group: console.group,
    groupEnd: console.groupEnd
};

// Performance-aware console wrapper
export const performanceConsole = {
    // Always allow errors
    error: originalConsole.error,
    
    // Conditional logging based on master flags
    log: (...args) => {
        if (ENABLE_CONSOLE_LOGGING) {
            originalConsole.log(...args);
        }
    },
    
    warn: (...args) => {
        if (ENABLE_CONSOLE_LOGGING) {
            originalConsole.warn(...args);
        }
    },
    
    debug: (...args) => {
        if (ENABLE_DEBUG_LOGGING) {
            originalConsole.debug(...args);
        }
    },
    
    info: (...args) => {
        if (ENABLE_DEBUG_LOGGING) {
            originalConsole.info(...args);
        }
    },
    
    group: label => {
        if (ENABLE_DEBUG_LOGGING) {
            originalConsole.group(label);
        }
    },
    
    groupEnd: () => {
        if (ENABLE_DEBUG_LOGGING) {
            originalConsole.groupEnd();
        }
    },
    
    // Specific loggers for different areas
    chart: (...args) => {
        if (ENABLE_CHART_LOGGING) {
            originalConsole.log("📊", ...args);
        }
    },
    
    table: (...args) => {
        if (ENABLE_TABLE_LOGGING) {
            originalConsole.log("📋", ...args);
        }
    }
};

// Override global console methods for maximum performance
if (!ENABLE_CONSOLE_LOGGING) {
    // Disable console methods that impact performance
    console.log = () => {};
    console.debug = () => {};
    console.info = () => {};
    
    if (!ENABLE_DEBUG_LOGGING) {
        console.group = () => {};
        console.groupEnd = () => {};
    }
    
    // Keep warnings but throttle them if console logging is disabled
    let lastWarnTime = 0;
    const WARN_THROTTLE_MS = 1000; // 1 second
    console.warn = (...args) => {
        const now = Date.now();
        if (now - lastWarnTime > WARN_THROTTLE_MS) {
            originalConsole.warn(...args);
            lastWarnTime = now;
        }
    };
}

// Expose control functions for runtime debugging
window.consoleControls = {
    enableAll: () => {
        console.log = originalConsole.log;
        console.warn = originalConsole.warn;
        console.debug = originalConsole.debug;
        console.info = originalConsole.info;
        console.group = originalConsole.group;
        console.groupEnd = originalConsole.groupEnd;
        originalConsole.log("✅ Console logging enabled");
    },
    
    disableAll: () => {
        console.log = () => {};
        console.warn = () => {};
        console.debug = () => {};
        console.info = () => {};
        console.group = () => {};
        console.groupEnd = () => {};
        originalConsole.log("🚫 Console logging disabled");
    },
    
    status: () => {
        originalConsole.log("🔍 Console Status:", {
            generalLogging: ENABLE_CONSOLE_LOGGING,
            debugLogging: ENABLE_DEBUG_LOGGING,
            chartLogging: ENABLE_CHART_LOGGING,
            tableLogging: ENABLE_TABLE_LOGGING
        });
    }
};

export default performanceConsole;
