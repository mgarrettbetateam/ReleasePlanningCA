# URL Parameter Synchronization Implementation Guide

## Overview
This guide explains how to implement URL parameter synchronization for Vue.js widgets with filters and inputs. This allows users to bookmark, share, and reload pages with their selected filters preserved.

---

## Core Concepts

### 1. **URL Parameters Sync to State**
When the page loads, read URL parameters and apply them to the widget's filter state.

### 2. **State Changes Sync to URL**
When users change filters, update the URL without page reload (using `window.history.pushState`).

### 3. **Human-Readable Parameters**
Use short, descriptive parameter names for clean, shareable URLs.

---

## Implementation Steps

### Step 1: Define Your Filter/Input Mappings

Create a mapping between your widget's state properties and URL parameter names.

```javascript
// Example: ReleasePlannerWidget uses these mappings
const URL_PARAM_MAPPINGS = {
    currentDataType: "view",        // ?view=parts
    program: "program",              // ?program=CX300
    phase: "phase",                  // ?phase=Phase%201
    ataChapterGroup: "ata",          // ?ata=Powerplant
    engSystemGroup: "eng",           // ?eng=Propulsion
    makeBuyFilter: "make",           // ?make=Make
    partTypeFilter: "part",          // ?part=Standard
    selectedStatFilter: "status"     // ?status=released
};
```

**For your widget:**
- List all dropdowns, text inputs, checkboxes, etc.
- Choose short, memorable parameter names
- Avoid special characters in parameter names

---

### Step 2: Add Data Properties for URL Sync Control

```javascript
data() {
    return {
        // ... your existing data properties
        
        // URL sync control properties
        urlSyncTimeout: null,           // Debounce timer for URL updates
        isApplyingQuery: false,         // Prevent circular updates
        filterChangeTimeout: null       // Debounce filter changes
    };
}
```

---

### Step 3: Build Query String from Current State

Create a method that converts your current filter state to URL parameters.

```javascript
methods: {
    buildQueryFromState() {
        const params = new URLSearchParams();

        // Add each filter value to params
        // Only include non-default values to keep URL clean
        
        // Example: Data Type (exclude default)
        if (this.currentDataType && this.currentDataType !== "parts") {
            params.set("view", this.currentDataType);
        }

        // Example: Program filter
        if (this.filterValues.program) {
            params.set("program", this.filterValues.program);
        }

        // Example: Phase filter
        if (this.filterValues.phase) {
            params.set("phase", this.filterValues.phase);
        }

        // Example: Dropdown with "All" default
        if (this.filterValues.ataChapterGroup && 
            this.filterValues.ataChapterGroup !== "All") {
            params.set("ata", this.filterValues.ataChapterGroup);
        }

        // Example: Checkbox/toggle
        if (this.showAdvancedFilters) {
            params.set("advanced", "true");
        }

        // Sort parameters alphabetically for consistent URLs
        const sortedEntries = Array.from(params.entries())
            .sort(([a], [b]) => a.localeCompare(b));
        const sortedParams = new URLSearchParams(sortedEntries);

        return sortedParams.toString();
    }
}
```

**Tips:**
- Only include non-default values to keep URLs short
- Handle special cases like "All", empty strings, null values
- Sort parameters for consistency
- URI encode is handled automatically by URLSearchParams

---

### Step 4: Schedule URL Sync with Debouncing

Prevent excessive URL updates by debouncing changes.

```javascript
methods: {
    /**
     * Schedule a URL sync after filter changes
     * Debounces updates to prevent URL thrashing
     * @param {boolean} immediate - Skip debounce delay
     */
    scheduleUrlSync(immediate = false) {
        // Don't sync if we're currently applying query params
        // This prevents circular updates
        if (this.isApplyingQuery) {
            return;
        }

        // Clear any pending sync
        if (this.urlSyncTimeout) {
            clearTimeout(this.urlSyncTimeout);
        }

        // Determine delay
        const delay = immediate ? 0 : 500; // 500ms debounce

        this.urlSyncTimeout = setTimeout(() => {
            this.syncUrlWithState();
        }, delay);
    },

    syncUrlWithState() {
        if (typeof window === "undefined") {
            return;
        }

        const queryString = this.buildQueryFromState();
        const basePath = window.location.pathname;
        const hash = window.location.hash || "";
        
        // Build new URL
        const newUrl = queryString 
            ? `${basePath}?${queryString}${hash}` 
            : `${basePath}${hash}`;

        // Update URL without page reload
        window.history.replaceState({}, "", newUrl);
        
        console.log("🔗 URL synchronized:", newUrl);
    }
}
```

**Key Points:**
- Use `replaceState` (not `pushState`) to avoid polluting browser history
- Use `pushState` only for major navigation changes
- Check `isApplyingQuery` to prevent circular updates
- Default debounce of 500ms balances responsiveness and performance

---

### Step 5: Apply Filters from URL on Page Load

Read URL parameters and apply them to your widget state.

```javascript
methods: {
    async applyFiltersFromQuery() {
        if (typeof window === "undefined") {
            return;
        }

        const search = window.location.search || "";
        if (!search || search.length <= 1) {
            return; // No parameters to apply
        }

        const params = new URLSearchParams(search);
        if (Array.from(params.keys()).length === 0) {
            return; // Empty parameters
        }

        console.log("🌐 Applying filters from URL:", params.toString());

        // Set flag to prevent circular updates
        this.isApplyingQuery = true;

        try {
            // Apply each parameter to your state
            
            // Example: Data type with fallbacks
            const dataType = params.get("view") || 
                           params.get("type") || 
                           params.get("dataType");
            if (dataType) {
                this.currentDataType = dataType.trim().toLowerCase();
            }

            // Example: Simple string value
            const program = params.get("program") || params.get("p");
            if (program) {
                this.filterValues.program = program;
                // If dependent data needs loading, do it here
                await this.fetchPhases();
            }

            // Example: Value with options list validation
            const phase = params.get("phase") || params.get("ph");
            if (phase) {
                // Find matching value from options
                const matchedPhase = this.findMatchingOptionValue(
                    this.phases, 
                    phase
                );
                this.filterValues.phase = matchedPhase || phase;
                
                // Trigger dependent data loading
                if (this.filterValues.phase) {
                    await this.handlePhaseChange();
                }
            }

            // Example: Dropdown with "All" default
            const ata = params.get("ata") || params.get("a");
            if (ata) {
                this.filterValues.ataChapterGroup = 
                    this.findMatchingOptionValue(this.ataOptions, ata) || ata;
            }

            // Example: Conditional filter (only for specific data type)
            if (this.currentDataType === "parts") {
                const makeBuy = params.get("make") || params.get("makeBuy");
                if (makeBuy) {
                    this.filterValues.makeBuyFilter = 
                        this.findMatchingOptionValue(this.makeBuyOptions, makeBuy) || makeBuy;
                }
            }

            // Example: Boolean/toggle
            const advanced = params.get("advanced");
            if (advanced === "true") {
                this.showAdvancedFilters = true;
            }

        } catch (error) {
            console.error("⚠️ Failed to apply URL filters:", error);
        } finally {
            // Always clear the flag
            this.isApplyingQuery = false;
            
            // Sync URL to clean up any invalid values
            this.scheduleUrlSync(true);
        }
    },

    /**
     * Find matching option value from list (case-insensitive)
     * Useful for validating URL params against dropdown options
     * @param {Array} options - List of valid options
     * @param {string} rawValue - Value from URL parameter
     * @returns {string|null} - Matched value or null
     */
    findMatchingOptionValue(options, rawValue) {
        if (!rawValue || !options || !Array.isArray(options)) {
            return null;
        }

        const normalized = String(rawValue).trim().toLowerCase();

        // Try exact match first
        for (const option of options) {
            if (String(option).trim().toLowerCase() === normalized) {
                return option;
            }
        }

        // If options are objects with label/value
        for (const option of options) {
            if (option && typeof option === "object") {
                const value = option.value || option.id || option.name;
                const label = option.label || option.text || option.title;
                
                if (String(value).trim().toLowerCase() === normalized ||
                    String(label).trim().toLowerCase() === normalized) {
                    return value;
                }
            }
        }

        return null; // No match found
    }
}
```

**Important:**
- Always set `isApplyingQuery = true` before applying parameters
- Always set `isApplyingQuery = false` in the `finally` block
- Handle dependent data loading (e.g., phases depend on program)
- Validate parameter values against options lists
- Support multiple parameter name variations for backward compatibility

---

### Step 6: Call applyFiltersFromQuery in mounted()

```javascript
async mounted() {
    console.log("🎯 Widget mounted");

    // Initialize your widget (fetch initial data, etc.)
    await this.initializeWidget();

    // Apply filters from URL parameters
    await this.applyFiltersFromQuery();

    // Continue with other initialization...
}
```

---

### Step 7: Trigger URL Sync on Filter Changes

Connect your filter change handlers to the URL sync mechanism.

```javascript
watch: {
    // Watch simple properties directly
    currentDataType(newVal, oldVal) {
        if (newVal !== oldVal && !this.isApplyingQuery) {
            this.scheduleUrlSync();
        }
    },

    // Watch nested properties
    "filterValues.program"(newVal, oldVal) {
        if (newVal !== oldVal && !this.isApplyingQuery) {
            this.scheduleUrlSync();
        }
    },

    "filterValues.phase"(newVal, oldVal) {
        if (newVal !== oldVal && !this.isApplyingQuery) {
            this.scheduleUrlSync();
        }
    },

    // Deep watch for entire objects
    filterValues: {
        handler() {
            if (!this.isApplyingQuery) {
                this.scheduleUrlSync();
            }
        },
        deep: true
    }
},

methods: {
    // Or call in your change handlers
    async handleProgramChange() {
        this.filterValues.phase = ""; // Reset dependent filter
        await this.fetchPhases();
        this.scheduleUrlSync(); // Sync after changes
    },

    handleFilterChange(filterKey, newValue) {
        this.filterValues[filterKey] = newValue;
        this.scheduleUrlSync(); // Sync after any filter change
    }
}
```

**Recommendations:**
- Use watchers for automatic sync
- Call `scheduleUrlSync()` in manual change handlers
- Always check `!this.isApplyingQuery` before syncing
- Debouncing happens automatically in `scheduleUrlSync()`

---

### Step 8: Clean Up Timers (Important!)

```javascript
beforeDestroy() {
    // Clear pending timeouts to prevent memory leaks
    if (this.urlSyncTimeout) {
        clearTimeout(this.urlSyncTimeout);
    }
    if (this.filterChangeTimeout) {
        clearTimeout(this.filterChangeTimeout);
    }
}
```

---

## Special Features

### Kiosk Mode / Display Mode

Preserve URL parameters for special display modes:

```javascript
mounted() {
    // Check for special mode parameters
    const params = new URLSearchParams(window.location.search);
    const isKioskMode = params.get("mode") === "kiosk" || 
                       params.get("display") === "kiosk";

    if (isKioskMode) {
        this.kioskModeActive = true;
        // Don't clear URL parameters - preserve all filters
        console.log("🖥️ Kiosk mode - preserving URL parameters");
    } else {
        // Normal mode - optionally clear URL on fresh load
        if (window.location.search) {
            window.history.replaceState({}, "", window.location.pathname);
            console.log("🧹 Cleared URL parameters");
        }
    }

    // Apply filters from URL
    await this.applyFiltersFromQuery();
}
```

---

## Complete Example Template

```javascript
export default {
    name: "MyWidget",
    
    data() {
        return {
            // Your filter state
            filterValues: {
                category: "",
                status: "",
                dateRange: ""
            },
            
            // URL sync control
            urlSyncTimeout: null,
            isApplyingQuery: false
        };
    },
    
    async mounted() {
        // Initialize widget
        await this.loadInitialData();
        
        // Apply URL parameters
        await this.applyFiltersFromQuery();
    },
    
    beforeDestroy() {
        if (this.urlSyncTimeout) {
            clearTimeout(this.urlSyncTimeout);
        }
    },
    
    watch: {
        filterValues: {
            handler() {
                if (!this.isApplyingQuery) {
                    this.scheduleUrlSync();
                }
            },
            deep: true
        }
    },
    
    methods: {
        buildQueryFromState() {
            const params = new URLSearchParams();
            
            if (this.filterValues.category) {
                params.set("cat", this.filterValues.category);
            }
            
            if (this.filterValues.status && this.filterValues.status !== "All") {
                params.set("status", this.filterValues.status);
            }
            
            if (this.filterValues.dateRange) {
                params.set("date", this.filterValues.dateRange);
            }
            
            return params.toString();
        },
        
        scheduleUrlSync(immediate = false) {
            if (this.isApplyingQuery) return;
            
            if (this.urlSyncTimeout) {
                clearTimeout(this.urlSyncTimeout);
            }
            
            this.urlSyncTimeout = setTimeout(() => {
                this.syncUrlWithState();
            }, immediate ? 0 : 500);
        },
        
        syncUrlWithState() {
            if (typeof window === "undefined") return;
            
            const queryString = this.buildQueryFromState();
            const basePath = window.location.pathname;
            const newUrl = queryString ? `${basePath}?${queryString}` : basePath;
            
            window.history.replaceState({}, "", newUrl);
        },
        
        async applyFiltersFromQuery() {
            if (typeof window === "undefined") return;
            
            const params = new URLSearchParams(window.location.search);
            if (params.toString() === "") return;
            
            this.isApplyingQuery = true;
            
            try {
                const category = params.get("cat");
                if (category) {
                    this.filterValues.category = category;
                }
                
                const status = params.get("status");
                if (status) {
                    this.filterValues.status = status;
                }
                
                const dateRange = params.get("date");
                if (dateRange) {
                    this.filterValues.dateRange = dateRange;
                }
                
            } catch (error) {
                console.error("Failed to apply URL parameters:", error);
            } finally {
                this.isApplyingQuery = false;
                this.scheduleUrlSync(true);
            }
        },
        
        findMatchingOptionValue(options, rawValue) {
            if (!rawValue || !options) return null;
            
            const normalized = String(rawValue).trim().toLowerCase();
            
            for (const option of options) {
                if (String(option).trim().toLowerCase() === normalized) {
                    return option;
                }
            }
            
            return null;
        }
    }
};
```

---

## Testing Your Implementation

### Test Cases

1. **Fresh Load**: Open widget without URL parameters - should show defaults
2. **URL Parameters on Load**: Open `?cat=electronics&status=active` - should apply filters
3. **Change Filter**: Change a dropdown - URL should update within 500ms
4. **Multiple Changes**: Rapidly change filters - URL should debounce properly
5. **Invalid Parameters**: Open `?cat=invalid_value` - should handle gracefully
6. **Browser Back/Forward**: Should maintain state through navigation
7. **Bookmark**: Copy URL with filters, close tab, reopen - filters should restore
8. **Share URL**: Send URL to colleague - they see same filtered view

### Debugging Tips

```javascript
// Add logging to track URL sync behavior
scheduleUrlSync(immediate = false) {
    console.log("🔄 URL sync scheduled", { immediate, isApplyingQuery: this.isApplyingQuery });
    // ... rest of method
}

syncUrlWithState() {
    const queryString = this.buildQueryFromState();
    console.log("🔗 Syncing URL:", queryString);
    // ... rest of method
}

applyFiltersFromQuery() {
    const params = new URLSearchParams(window.location.search);
    console.log("🌐 Applying URL params:", Array.from(params.entries()));
    // ... rest of method
}
```

---

## Common Pitfalls

### 1. **Circular Updates**
**Problem**: URL changes trigger state changes, which trigger URL changes...

**Solution**: Always check `isApplyingQuery` flag
```javascript
if (!this.isApplyingQuery) {
    this.scheduleUrlSync();
}
```

### 2. **Browser History Pollution**
**Problem**: Every filter change creates a history entry

**Solution**: Use `replaceState` instead of `pushState`
```javascript
window.history.replaceState({}, "", newUrl); // Good
// window.history.pushState({}, "", newUrl); // Bad for filters
```

### 3. **Race Conditions**
**Problem**: Dependent data loads conflict with URL parameter application

**Solution**: Use `async/await` and proper sequencing
```javascript
async applyFiltersFromQuery() {
    this.isApplyingQuery = true;
    try {
        if (program) {
            this.filterValues.program = program;
            await this.fetchPhases(); // Wait for dependency
        }
        if (phase) {
            this.filterValues.phase = phase;
            await this.handlePhaseChange(); // Wait for dependent data
        }
    } finally {
        this.isApplyingQuery = false;
    }
}
```

### 4. **Special Characters**
**Problem**: Filter values with spaces, symbols break URL

**Solution**: URLSearchParams handles encoding automatically
```javascript
params.set("name", "Value with spaces & symbols"); // Automatically encoded
```

### 5. **Default Values Cluttering URL**
**Problem**: URL shows `?status=All&category=All`

**Solution**: Only include non-default values
```javascript
if (this.filterValues.status && this.filterValues.status !== "All") {
    params.set("status", this.filterValues.status);
}
```

---

## Advanced: Hash-Based Routing

If your app uses hash routing (`#/page`), preserve the hash:

```javascript
syncUrlWithState() {
    const queryString = this.buildQueryFromState();
    const basePath = window.location.pathname;
    const hash = window.location.hash || ""; // Preserve hash
    
    const newUrl = queryString 
        ? `${basePath}?${queryString}${hash}` 
        : `${basePath}${hash}`;
    
    window.history.replaceState({}, "", newUrl);
}
```

---

## Summary Checklist

- [ ] Define URL parameter mappings for all filters/inputs
- [ ] Add `urlSyncTimeout` and `isApplyingQuery` to data
- [ ] Implement `buildQueryFromState()` method
- [ ] Implement `scheduleUrlSync()` with debouncing
- [ ] Implement `syncUrlWithState()` method
- [ ] Implement `applyFiltersFromQuery()` method
- [ ] Implement `findMatchingOptionValue()` helper
- [ ] Call `applyFiltersFromQuery()` in `mounted()`
- [ ] Add watchers or handlers to trigger `scheduleUrlSync()`
- [ ] Clean up timers in `beforeDestroy()`
- [ ] Test all scenarios (fresh load, URL params, changes, bookmarks)
- [ ] Add logging for debugging

---

## Reference: ReleasePlannerWidget Parameter Map

```javascript
// Full parameter map from ReleasePlannerWidget.vue
{
    view: "currentDataType",           // parts | cas | crs
    program: "filterValues.program",    // CX300 Pre-Production Builds
    phase: "filterValues.phase",        // Phase 1 | Phase 2
    ata: "filterValues.ataChapterGroup", // Powerplant | Drive Systems
    eng: "filterValues.engSystemGroup",  // Propulsion | Transmission
    make: "filterValues.makeBuyFilter",  // Make | Buy (parts only)
    part: "filterValues.partTypeFilter", // Standard | ... (parts only)
    status: "selectedStatFilter"         // all | released | overdue | critical
}

// Example URLs:
// ?view=cas&program=CX300&phase=Phase%201
// ?program=CX300&ata=Powerplant&status=released
// ?view=parts&program=CX300&make=Make&part=Standard
```

---

**End of Guide**

For questions or issues, refer to the ReleasePlannerWidget.vue implementation as a working reference.
