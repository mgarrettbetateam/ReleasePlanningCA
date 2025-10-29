# Kiosk Mode Implementation Guide

## Overview
This guide explains how to implement Kiosk Mode in any Vue.js widget. Kiosk Mode is a full-screen display mode optimized for large monitors, dashboards, and public displays. It features automatic page rotation, auto-refresh, minimal UI, and URL-preservable state for easy deployment across multiple displays.

---

## What is Kiosk Mode?

Kiosk Mode transforms your widget into a display-optimized view with:

- **Auto-Rotation**: Automatically cycles through table pages
- **Auto-Refresh**: Periodically reloads data to stay current
- **Minimal UI**: Hides edit controls, filters, and interactive elements
- **Visual Badges**: Shows active filters and status at the top
- **Page Indicators**: Displays current page position
- **URL State**: Preserves filters in URL for easy sharing/bookmarking
- **Full-Screen Friendly**: Optimized layout for large displays

**Common Use Cases:**
- Wall-mounted dashboards in offices
- Factory floor monitoring displays
- Conference room status boards
- NOC (Network Operations Center) displays
- Public information kiosks

---

## Core Features

### 1. **Automatic Page Rotation**
Tables with many rows automatically rotate through pages at a fixed interval.

### 2. **Auto-Refresh Data**
Data refreshes periodically without user interaction to stay current.

### 3. **Minimal Interface**
Hides:
- Filter controls (shows active filters as badges instead)
- Edit buttons
- Interactive elements
- Unnecessary chrome/padding

### 4. **Visual Status Indicators**
Shows:
- Active filter chips/badges
- Countdown to next refresh
- Current page number and indicators
- Last refresh timestamp

### 5. **URL-Based Activation**
Activated via URL parameter: `?mode=kiosk` or `?display=kiosk`

---

## Implementation Steps

### Step 1: Add Kiosk Mode Data Properties

Add these properties to your component's `data()`:

```javascript
data() {
    return {
        // ... your existing data properties
        
        // Kiosk mode state
        kioskModeActive: false,              // Internal state flag
        
        // Kiosk pagination
        kioskCurrentPage: 1,                  // Current page being displayed
        kioskPageRotationTimer: null,         // Timer for auto page rotation
        kioskPageDelay: 10000,                // Milliseconds per page (10 seconds)
        kioskRowsPerPage: 15,                 // Number of rows per page
        kioskResizeTimeout: null,             // Debounce timer for resize events
        
        // Kiosk auto-refresh
        kioskRefreshTimer: null,              // Timer for auto data refresh
        kioskRefreshInterval: 60000,          // Milliseconds between refreshes (60 seconds)
        kioskLastRefreshTime: null,           // Timestamp of last refresh
        kioskNextRefreshTime: null,           // Timestamp of next refresh
        kioskCountdownUpdateTimer: null       // Timer for countdown display updates
    };
}
```

**Configuration Recommendations:**
- `kioskPageDelay`: 10-15 seconds (gives users time to read)
- `kioskRowsPerPage`: 10-20 rows (depends on screen size)
- `kioskRefreshInterval`: 30-120 seconds (depends on data update frequency)

---

### Step 2: Add Computed Properties

Create computed properties for kiosk mode detection and calculations:

```javascript
computed: {
    /**
     * Detect if kiosk mode is active
     * Checks both URL parameter and internal state
     */
    isKioskMode() {
        if (typeof window === "undefined") return false;
        
        const params = new URLSearchParams(window.location.search);
        const urlKioskMode = params.get("mode") === "kiosk" || 
                            params.get("display") === "kiosk";
        
        return urlKioskMode || this.kioskModeActive;
    },

    /**
     * Get active filter labels for badge display
     * Customize this based on your widget's filters
     */
    activeFilterLabels() {
        const labels = [];
        
        // Example: Program filter
        if (this.filterValues.program) {
            labels.push({ 
                icon: "mdi-briefcase", 
                text: this.filterValues.program 
            });
        }
        
        // Example: Status filter
        if (this.filterValues.status && this.filterValues.status !== "All") {
            labels.push({ 
                icon: "mdi-flag", 
                text: `Status: ${this.filterValues.status}` 
            });
        }
        
        // Add more filters as needed for your widget
        
        return labels;
    },

    /**
     * Calculate total number of pages in kiosk mode
     */
    kioskTotalPages() {
        if (!this.isKioskMode || !this.filteredTableData) return 1;
        return Math.ceil(this.filteredTableData.length / this.kioskRowsPerPage);
    },

    /**
     * Get the current page of data for kiosk display
     */
    kioskPagedData() {
        if (!this.isKioskMode) return this.filteredTableData;
        
        const start = (this.kioskCurrentPage - 1) * this.kioskRowsPerPage;
        const end = start + this.kioskRowsPerPage;
        return this.filteredTableData.slice(start, end);
    },

    /**
     * Generate page indicator array [1, 2, 3, ...]
     */
    kioskPageIndicators() {
        const indicators = [];
        for (let i = 1; i <= this.kioskTotalPages; i++) {
            indicators.push(i);
        }
        return indicators;
    },

    /**
     * Get items per page based on mode
     */
    currentItemsPerPage() {
        return this.isKioskMode ? this.kioskRowsPerPage : this.normalRowsPerPage;
    },

    /**
     * Countdown display for next refresh
     */
    kioskRefreshCountdown() {
        if (!this.isKioskMode || !this.kioskNextRefreshTime) return null;
        
        const now = Date.now();
        const remaining = Math.max(0, this.kioskNextRefreshTime - now);
        const seconds = Math.ceil(remaining / 1000);
        
        if (seconds > 60) {
            const minutes = Math.floor(seconds / 60);
            return `${minutes}m`;
        }
        return `${seconds}s`;
    },

    /**
     * Display how long ago last refresh occurred
     */
    kioskLastRefreshDisplay() {
        if (!this.kioskLastRefreshTime) return "Never";
        
        const now = Date.now();
        const elapsed = now - this.kioskLastRefreshTime;
        const seconds = Math.floor(elapsed / 1000);
        
        if (seconds < 60) return `${seconds}s ago`;
        
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes}m ago`;
        
        const hours = Math.floor(minutes / 60);
        return `${hours}h ago`;
    }
}
```

---

### Step 3: Add Kiosk Mode Methods

Implement the core kiosk mode functionality:

```javascript
methods: {
    // ============================================
    // KIOSK MODE ACTIVATION / DEACTIVATION
    // ============================================

    /**
     * Toggle kiosk mode on/off
     * Updates URL and starts/stops kiosk features
     */
    async toggleKioskMode() {
        if (typeof window === "undefined") return;
        
        const params = new URLSearchParams(window.location.search);
        const wasKioskMode = this.isKioskMode;
        
        if (wasKioskMode) {
            // Exit kiosk mode
            params.delete("mode");
            params.delete("display");
            this.kioskModeActive = false;
            
            // Stop all kiosk timers
            this.stopKioskPageRotation();
            this.stopKioskAutoRefresh();
        } else {
            // Enter kiosk mode
            params.set("mode", "kiosk");
            this.kioskModeActive = true;
        }
        
        // Update URL without reload
        const basePath = window.location.pathname;
        const hash = window.location.hash || "";
        const queryString = params.toString();
        const newUrl = queryString ? `${basePath}?${queryString}${hash}` : `${basePath}${hash}`;
        
        window.history.pushState({}, "", newUrl);
        
        // Wait for URL change to propagate
        await this.$nextTick();
        
        // Handle mode transitions
        if (!wasKioskMode && this.isKioskMode) {
            // Entering kiosk mode - start features
            await this.$nextTick();
            this.startKioskPageRotation();
            this.startKioskAutoRefresh();
            this.kioskLastRefreshTime = Date.now();
        }
        
        // Force reactivity update
        this.$forceUpdate();
    },

    // ============================================
    // PAGE ROTATION
    // ============================================

    /**
     * Start automatic page rotation
     */
    startKioskPageRotation() {
        if (!this.isKioskMode) return;
        
        this.stopKioskPageRotation();
        
        // Start rotation timer
        this.kioskPageRotationTimer = setInterval(() => {
            this.rotateToNextPage();
        }, this.kioskPageDelay);
        
        console.log(`🖥️ Kiosk page rotation: ${this.kioskPageDelay / 1000}s per page, ${this.kioskRowsPerPage} rows`);
    },

    /**
     * Stop automatic page rotation
     */
    stopKioskPageRotation() {
        if (this.kioskPageRotationTimer) {
            clearInterval(this.kioskPageRotationTimer);
            this.kioskPageRotationTimer = null;
        }
    },

    /**
     * Rotate to the next page (or loop back to page 1)
     */
    rotateToNextPage() {
        if (!this.isKioskMode || this.kioskTotalPages <= 1) return;
        
        if (this.kioskCurrentPage >= this.kioskTotalPages) {
            this.kioskCurrentPage = 1;
        } else {
            this.kioskCurrentPage++;
        }
        
        console.log(`🖥️ Rotated to page ${this.kioskCurrentPage} of ${this.kioskTotalPages}`);
    },

    /**
     * Reset pagination to page 1
     */
    resetKioskPagination() {
        this.kioskCurrentPage = 1;
    },

    // ============================================
    // AUTO-REFRESH
    // ============================================

    /**
     * Start automatic data refresh
     */
    startKioskAutoRefresh() {
        if (!this.isKioskMode) return;
        
        this.stopKioskAutoRefresh();
        
        // Set next refresh time
        this.kioskNextRefreshTime = Date.now() + this.kioskRefreshInterval;
        
        // Start refresh timer
        this.kioskRefreshTimer = setInterval(() => {
            this.refreshKioskData();
        }, this.kioskRefreshInterval);
        
        // Start countdown update timer (updates every second for display)
        this.kioskCountdownUpdateTimer = setInterval(() => {
            this.$forceUpdate(); // Update countdown display
        }, 1000);
        
        console.log(`🔄 Kiosk auto-refresh: every ${this.kioskRefreshInterval / 1000} seconds`);
    },

    /**
     * Stop automatic data refresh
     */
    stopKioskAutoRefresh() {
        if (this.kioskRefreshTimer) {
            clearInterval(this.kioskRefreshTimer);
            this.kioskRefreshTimer = null;
            this.kioskNextRefreshTime = null;
        }
        if (this.kioskCountdownUpdateTimer) {
            clearInterval(this.kioskCountdownUpdateTimer);
            this.kioskCountdownUpdateTimer = null;
        }
    },

    /**
     * Refresh data while preserving current page
     */
    async refreshKioskData() {
        console.log("🔄 Kiosk auto-refresh triggered");
        
        try {
            // Store current page to restore after refresh
            const currentPage = this.kioskCurrentPage;
            
            // Update last refresh time
            this.kioskLastRefreshTime = Date.now();
            
            // Calculate next refresh time
            this.kioskNextRefreshTime = Date.now() + this.kioskRefreshInterval;
            
            // Reload data - adapt this to your widget's data loading method
            await this.loadData(); // Replace with your data loading method
            
            // Restore current page if still valid
            this.$nextTick(() => {
                if (currentPage <= this.kioskTotalPages) {
                    this.kioskCurrentPage = currentPage;
                } else {
                    this.kioskCurrentPage = 1;
                }
            });
            
            console.log("✅ Kiosk data refreshed successfully");
        } catch (error) {
            console.error("❌ Kiosk refresh failed:", error);
        }
    },

    // ============================================
    // WINDOW RESIZE HANDLING
    // ============================================

    /**
     * Handle window resize events (debounced)
     */
    handleWindowResize() {
        if (this.kioskResizeTimeout) {
            clearTimeout(this.kioskResizeTimeout);
        }
        
        this.kioskResizeTimeout = setTimeout(() => {
            // Trigger any responsive layout updates
            this.updateResponsiveDimensions();
        }, 250);
    }
}
```

---

### Step 4: Lifecycle Hooks

Initialize and clean up kiosk mode in lifecycle hooks:

```javascript
async mounted() {
    console.log("🎯 Widget mounted");

    // Check URL for kiosk mode on mount
    if (typeof window !== "undefined") {
        const params = new URLSearchParams(window.location.search);
        const isKiosk = params.get("mode") === "kiosk";
        
        if (isKiosk) {
            this.kioskModeActive = true;
            console.log("🖥️ Kiosk mode detected from URL");
        }
    }

    // Initialize your widget (fetch data, etc.)
    await this.initializeWidget();

    // Apply filters from URL (preserves kiosk mode filters)
    if (this.isKioskMode) {
        await this.applyFiltersFromUrl();
    }

    // Start kiosk mode features if enabled
    if (this.isKioskMode) {
        this.$nextTick(() => {
            this.startKioskPageRotation();
            this.startKioskAutoRefresh();
            this.kioskLastRefreshTime = Date.now();
        });
    }

    // Add window resize listener
    if (typeof window !== "undefined") {
        window.addEventListener("resize", this.handleWindowResize);
    }
},

beforeDestroy() {
    // Clean up all timers
    this.stopKioskPageRotation();
    this.stopKioskAutoRefresh();
    
    if (this.kioskResizeTimeout) {
        clearTimeout(this.kioskResizeTimeout);
    }

    // Remove window resize listener
    if (typeof window !== "undefined") {
        window.removeEventListener("resize", this.handleWindowResize);
    }
}
```

---

### Step 5: Template Structure

Add kiosk mode UI elements to your template:

```vue
<template>
    <div class="widget-container" :class="{ 'kiosk-mode': isKioskMode }">
        
        <!-- ========================================= -->
        <!-- KIOSK MODE FILTER BADGE BAR -->
        <!-- ========================================= -->
        <v-card
            v-if="isKioskMode"
            class="kiosk-filter-badge-bar elevation-2 mb-3"
            color="blue-grey darken-4"
            dark
        >
            <v-card-text class="py-2 px-4">
                <div class="d-flex align-center justify-space-between">
                    <!-- Active Filter Badges -->
                    <div class="d-flex align-center flex-wrap">
                        <v-chip
                            v-for="(filter, index) in activeFilterLabels"
                            :key="index"
                            small
                            color="blue darken-1"
                            class="mr-2 mb-1 mt-1"
                            dark
                        >
                            <v-icon small left>{{ filter.icon }}</v-icon>
                            <span class="font-weight-medium">{{ filter.text }}</span>
                        </v-chip>
                        
                        <!-- No filters message -->
                        <v-chip
                            v-if="activeFilterLabels.length === 0"
                            small
                            color="grey darken-1"
                            class="mr-2"
                            dark
                        >
                            <v-icon small left>mdi-filter-off</v-icon>
                            <span>No Filters Applied</span>
                        </v-chip>
                    </div>
                    
                    <!-- Kiosk Mode Status Indicators -->
                    <div class="d-flex align-center">
                        <!-- Kiosk Mode Badge -->
                        <v-chip small color="green darken-1" dark class="ml-2">
                            <v-icon small left>mdi-monitor-dashboard</v-icon>
                            <span class="font-weight-bold">KIOSK MODE</span>
                        </v-chip>
                        
                        <!-- Refresh Countdown -->
                        <v-chip small color="teal darken-1" dark class="ml-2">
                            <v-icon small left>mdi-refresh</v-icon>
                            <span class="font-weight-medium">
                                {{ kioskRefreshCountdown || '60s' }}
                            </span>
                        </v-chip>
                        
                        <!-- Info Tooltip -->
                        <v-tooltip bottom>
                            <template #activator="{ on, attrs }">
                                <v-icon 
                                    small 
                                    class="ml-2" 
                                    color="white"
                                    v-bind="attrs"
                                    v-on="on"
                                >
                                    mdi-information
                                </v-icon>
                            </template>
                            <div style="max-width: 300px;">
                                <strong>Kiosk Mode Active</strong><br>
                                • Auto-rotates pages every 10s<br>
                                • Auto-refreshes data every 60s<br>
                                • Shows 15 rows per page<br>
                                • Copy URL to use on another display
                            </div>
                        </v-tooltip>
                        
                        <!-- Exit Kiosk Mode Button -->
                        <v-btn
                            small
                            icon
                            color="white"
                            class="ml-2"
                            title="Exit Kiosk Mode"
                            @click="toggleKioskMode"
                        >
                            <v-icon small>mdi-close-circle</v-icon>
                        </v-btn>
                    </div>
                </div>
            </v-card-text>
        </v-card>

        <!-- ========================================= -->
        <!-- NORMAL MODE FILTERS -->
        <!-- Hidden in kiosk mode -->
        <!-- ========================================= -->
        <v-card v-if="!isKioskMode" class="filter-bar mb-3">
            <v-card-text>
                <!-- Your normal filter controls here -->
                <div class="d-flex align-center">
                    <v-select
                        v-model="filterValues.category"
                        :items="categories"
                        label="Category"
                        dense
                        outlined
                    />
                    <!-- Add more filters as needed -->
                </div>
            </v-card-text>
        </v-card>

        <!-- ========================================= -->
        <!-- MAIN CONTENT AREA -->
        <!-- ========================================= -->
        <v-card class="main-content">
            <!-- Your charts, tables, etc. -->
            
            <!-- Example: Data Table -->
            <v-data-table
                :items="isKioskMode ? kioskPagedData : filteredTableData"
                :items-per-page="currentItemsPerPage"
                :hide-default-footer="isKioskMode"
                :headers="tableHeaders"
            >
                <!-- Your table content -->
            </v-data-table>
        </v-card>

        <!-- ========================================= -->
        <!-- KIOSK MODE PAGE INDICATOR BAR -->
        <!-- ========================================= -->
        <v-card
            v-if="isKioskMode && filteredTableData.length > 0"
            class="kiosk-page-indicator elevation-2 mt-2"
            color="blue-grey darken-3"
            dark
        >
            <v-card-text class="py-2 px-4">
                <div class="d-flex align-center justify-space-between">
                    <!-- Item Count Display -->
                    <div class="d-flex align-center">
                        <v-icon small class="mr-2">mdi-file-document-multiple</v-icon>
                        <span class="font-weight-medium">
                            Showing {{ ((kioskCurrentPage - 1) * kioskRowsPerPage) + 1 }} - 
                            {{ Math.min(kioskCurrentPage * kioskRowsPerPage, filteredTableData.length) }} 
                            of {{ filteredTableData.length }} items
                        </span>
                        <span v-if="kioskLastRefreshTime" class="ml-4 caption grey--text text--lighten-1">
                            <v-icon x-small class="mr-1">mdi-clock-outline</v-icon>
                            Updated {{ kioskLastRefreshDisplay }}
                        </span>
                    </div>
                    
                    <!-- Page Indicators -->
                    <div class="d-flex align-center">
                        <span class="mr-3 caption">
                            Page {{ kioskCurrentPage }} of {{ kioskTotalPages }}
                        </span>
                        <div class="d-flex align-center">
                            <v-chip
                                v-for="page in kioskPageIndicators"
                                :key="page"
                                x-small
                                :color="page === kioskCurrentPage ? 'blue' : 'grey darken-1'"
                                class="mx-1"
                            >
                                {{ page }}
                            </v-chip>
                        </div>
                    </div>
                </div>
            </v-card-text>
        </v-card>
        
        <!-- ========================================= -->
        <!-- KIOSK MODE TOGGLE BUTTON (NORMAL MODE) -->
        <!-- ========================================= -->
        <v-btn
            v-if="!isKioskMode"
            fixed
            bottom
            right
            fab
            small
            color="green darken-1"
            dark
            title="Enter Kiosk Mode"
            @click="toggleKioskMode"
        >
            <v-icon>mdi-monitor-dashboard</v-icon>
        </v-btn>
        
    </div>
</template>
```

---

### Step 6: Add Kiosk Mode Styles

Add CSS to enhance kiosk mode appearance:

```vue
<style scoped>
/* Kiosk Mode Container */
.kiosk-mode {
    /* Optional: Add any container-level kiosk styles */
}

/* Filter Badge Bar */
.kiosk-filter-badge-bar {
    position: sticky;
    top: 0;
    z-index: 100;
}

.filter-badge {
    font-size: 13px !important;
    height: 28px !important;
}

/* Refresh Indicator Pulse Animation */
.refresh-indicator {
    animation: pulse-glow 2s ease-in-out infinite;
}

@keyframes pulse-glow {
    0%, 100% {
        opacity: 1;
        box-shadow: 0 0 0 0 rgba(0, 150, 136, 0.7);
    }
    50% {
        opacity: 0.9;
        box-shadow: 0 0 0 6px rgba(0, 150, 136, 0);
    }
}

/* Page Indicator Bar */
.kiosk-page-indicator {
    position: sticky;
    bottom: 0;
    z-index: 100;
}

/* Page Dot Styles */
.page-dot {
    transition: all 0.3s ease;
}

.page-dot.active-page {
    transform: scale(1.2);
    box-shadow: 0 2px 8px rgba(33, 150, 243, 0.6);
}

/* Responsive adjustments for kiosk mode */
@media (max-width: 1280px) {
    .kiosk-mode .filter-badge {
        font-size: 11px !important;
        height: 24px !important;
    }
}
</style>
```

---

## Advanced Features

### Custom Timing Configuration

Allow timing to be configured via URL parameters:

```javascript
mounted() {
    const params = new URLSearchParams(window.location.search);
    
    // Custom page delay: ?pageDelay=15000 (15 seconds)
    const pageDelay = params.get("pageDelay");
    if (pageDelay && !isNaN(pageDelay)) {
        this.kioskPageDelay = parseInt(pageDelay);
    }
    
    // Custom rows per page: ?rows=20
    const rows = params.get("rows");
    if (rows && !isNaN(rows)) {
        this.kioskRowsPerPage = parseInt(rows);
    }
    
    // Custom refresh interval: ?refresh=120000 (2 minutes)
    const refresh = params.get("refresh");
    if (refresh && !isNaN(refresh)) {
        this.kioskRefreshInterval = parseInt(refresh);
    }
}
```

**Example URL:**
```
?mode=kiosk&program=CX300&pageDelay=12000&rows=20&refresh=90000
```

---

### Responsive Layout Adjustments

Adjust layout proportions in kiosk mode:

```javascript
computed: {
    chartHeight() {
        return this.isKioskMode ? 300 : 400; // Smaller chart in kiosk
    },
    
    tableHeight() {
        return this.isKioskMode ? 600 : 500; // Larger table in kiosk
    }
}
```

---

### Prevent Sleep/Screensaver

Add a wake lock to prevent the display from sleeping:

```javascript
async mounted() {
    if (this.isKioskMode && 'wakeLock' in navigator) {
        try {
            this.wakeLock = await navigator.wakeLock.request('screen');
            console.log('🔒 Wake lock active - screen won\'t sleep');
        } catch (err) {
            console.warn('Wake lock failed:', err);
        }
    }
},

beforeDestroy() {
    if (this.wakeLock) {
        this.wakeLock.release();
        console.log('🔓 Wake lock released');
    }
}
```

---

## Testing Your Implementation

### Test Cases

1. **Enter Kiosk Mode**
   - Click kiosk mode button
   - URL should update to include `?mode=kiosk`
   - Filter bar should hide
   - Badge bar should appear
   - Page rotation should start

2. **Exit Kiosk Mode**
   - Click exit button in badge bar
   - URL should remove `?mode=kiosk`
   - Filter bar should reappear
   - Badge bar should hide
   - Timers should stop

3. **URL Activation**
   - Open page with `?mode=kiosk` in URL
   - Should automatically enter kiosk mode
   - Should preserve other URL parameters

4. **Page Rotation**
   - Wait 10 seconds (or your configured delay)
   - Current page should increment
   - Should loop back to page 1 after last page
   - Page indicators should update

5. **Auto Refresh**
   - Wait 60 seconds (or your configured interval)
   - Data should reload
   - Current page should be preserved
   - Countdown should reset

6. **Filter Badges**
   - Apply various filters
   - Enter kiosk mode
   - All active filters should show as badges
   - Changing filters should update badges

7. **Bookmark/Share**
   - Enter kiosk mode with filters applied
   - Copy URL
   - Open in new tab/window
   - Should show same filtered view in kiosk mode

---

## Common Pitfalls

### 1. **Timers Not Cleaning Up**
**Problem**: Memory leaks from timers still running after component destroyed

**Solution**: Always clear timers in `beforeDestroy()`
```javascript
beforeDestroy() {
    this.stopKioskPageRotation();
    this.stopKioskAutoRefresh();
    clearTimeout(this.kioskResizeTimeout);
}
```

### 2. **Page Doesn't Rotate**
**Problem**: `kioskTotalPages` is 1 or rotation timer not started

**Solution**: Check data length and ensure timer starts
```javascript
// Debug logging
startKioskPageRotation() {
    console.log('Total pages:', this.kioskTotalPages);
    console.log('Data length:', this.filteredTableData?.length);
    console.log('Rows per page:', this.kioskRowsPerPage);
}
```

### 3. **Kiosk Mode Doesn't Activate from URL**
**Problem**: Checking URL too early or not checking correctly

**Solution**: Check in mounted() and use computed property
```javascript
mounted() {
    // Check AFTER window is available
    if (typeof window !== "undefined") {
        const params = new URLSearchParams(window.location.search);
        if (params.get("mode") === "kiosk") {
            this.kioskModeActive = true;
        }
    }
}
```

### 4. **Countdown Not Updating**
**Problem**: Computed property not recalculating

**Solution**: Use interval timer to force updates
```javascript
startKioskAutoRefresh() {
    // ... existing code ...
    
    // Force update every second for countdown
    this.kioskCountdownUpdateTimer = setInterval(() => {
        this.$forceUpdate();
    }, 1000);
}
```

### 5. **Data Refresh Loses Page Position**
**Problem**: Page resets to 1 after data refresh

**Solution**: Store and restore current page
```javascript
async refreshKioskData() {
    const currentPage = this.kioskCurrentPage; // Store
    await this.loadData();
    this.$nextTick(() => {
        this.kioskCurrentPage = currentPage; // Restore
    });
}
```

---

## Best Practices

### 1. **Timing Balance**
- Page rotation: Fast enough to show all data, slow enough to read
- Refresh interval: Balance between freshness and server load
- Countdown updates: 1 second is good for UX

### 2. **Visual Clarity**
- Use contrasting colors for kiosk mode badges
- Make page indicators clearly visible
- Show refresh status prominently

### 3. **Performance**
- Use `v-if` not `v-show` to completely remove hidden elements
- Debounce resize handlers
- Limit number of page indicator dots for large datasets

### 4. **Accessibility**
- Maintain keyboard navigation where possible
- Provide clear exit method
- Show status updates visually

### 5. **URL Management**
- Preserve filter state in URL for sharing
- Use `pushState` for mode toggle (allows back button)
- Support multiple parameter formats for flexibility

---

## Complete Example

Here's a minimal complete implementation:

```vue
<template>
    <div :class="{ 'kiosk-mode': isKioskMode }">
        <!-- Kiosk Badge Bar -->
        <v-card v-if="isKioskMode" color="blue-grey darken-4" dark class="mb-2">
            <v-card-text class="py-2">
                <div class="d-flex justify-space-between align-center">
                    <div>
                        <v-chip v-for="f in activeFilterLabels" :key="f.text" small class="mr-1">
                            <v-icon small left>{{ f.icon }}</v-icon>{{ f.text }}
                        </v-chip>
                    </div>
                    <div>
                        <v-chip small color="green">KIOSK</v-chip>
                        <v-chip small color="teal" class="ml-1">{{ kioskRefreshCountdown }}</v-chip>
                        <v-btn icon small @click="toggleKioskMode"><v-icon>mdi-close</v-icon></v-btn>
                    </div>
                </div>
            </v-card-text>
        </v-card>

        <!-- Normal Filters -->
        <v-card v-if="!isKioskMode" class="mb-2">
            <v-card-text>
                <v-select v-model="filter" :items="options" label="Filter" dense />
            </v-card-text>
        </v-card>

        <!-- Table -->
        <v-data-table
            :items="isKioskMode ? kioskPagedData : tableData"
            :items-per-page="currentItemsPerPage"
            :hide-default-footer="isKioskMode"
        />

        <!-- Page Indicators -->
        <v-card v-if="isKioskMode" color="blue-grey darken-3" dark class="mt-2">
            <v-card-text class="py-2">
                <div class="d-flex justify-space-between align-center">
                    <span>Page {{ kioskCurrentPage }} of {{ kioskTotalPages }}</span>
                    <div>
                        <v-chip v-for="p in kioskPageIndicators" :key="p" x-small class="mx-1"
                            :color="p === kioskCurrentPage ? 'blue' : 'grey'">
                            {{ p }}
                        </v-chip>
                    </div>
                </div>
            </v-card-text>
        </v-card>

        <!-- Toggle Button -->
        <v-btn v-if="!isKioskMode" fab fixed bottom right @click="toggleKioskMode">
            <v-icon>mdi-monitor-dashboard</v-icon>
        </v-btn>
    </div>
</template>

<script>
export default {
    data: () => ({
        kioskModeActive: false,
        kioskCurrentPage: 1,
        kioskPageRotationTimer: null,
        kioskRefreshTimer: null,
        kioskCountdownUpdateTimer: null,
        kioskPageDelay: 10000,
        kioskRowsPerPage: 15,
        kioskRefreshInterval: 60000,
        kioskNextRefreshTime: null,
        kioskLastRefreshTime: null,
        filter: null,
        tableData: []
    }),
    
    computed: {
        isKioskMode() {
            if (typeof window === "undefined") return false;
            const params = new URLSearchParams(window.location.search);
            return params.get("mode") === "kiosk" || this.kioskModeActive;
        },
        activeFilterLabels() {
            return this.filter ? [{ icon: 'mdi-filter', text: this.filter }] : [];
        },
        kioskTotalPages() {
            return Math.ceil(this.tableData.length / this.kioskRowsPerPage) || 1;
        },
        kioskPagedData() {
            const start = (this.kioskCurrentPage - 1) * this.kioskRowsPerPage;
            return this.tableData.slice(start, start + this.kioskRowsPerPage);
        },
        kioskPageIndicators() {
            return Array.from({ length: this.kioskTotalPages }, (_, i) => i + 1);
        },
        currentItemsPerPage() {
            return this.isKioskMode ? this.kioskRowsPerPage : 10;
        },
        kioskRefreshCountdown() {
            if (!this.kioskNextRefreshTime) return '60s';
            const remaining = Math.max(0, this.kioskNextRefreshTime - Date.now());
            const sec = Math.ceil(remaining / 1000);
            return sec > 60 ? `${Math.floor(sec/60)}m` : `${sec}s`;
        }
    },
    
    async mounted() {
        if (typeof window !== "undefined") {
            const params = new URLSearchParams(window.location.search);
            if (params.get("mode") === "kiosk") this.kioskModeActive = true;
        }
        
        if (this.isKioskMode) {
            this.$nextTick(() => {
                this.startKioskPageRotation();
                this.startKioskAutoRefresh();
                this.kioskLastRefreshTime = Date.now();
            });
        }
    },
    
    beforeDestroy() {
        this.stopKioskPageRotation();
        this.stopKioskAutoRefresh();
    },
    
    methods: {
        async toggleKioskMode() {
            const params = new URLSearchParams(window.location.search);
            const was = this.isKioskMode;
            
            if (was) {
                params.delete("mode");
                this.kioskModeActive = false;
                this.stopKioskPageRotation();
                this.stopKioskAutoRefresh();
            } else {
                params.set("mode", "kiosk");
                this.kioskModeActive = true;
            }
            
            const url = params.toString() ? `?${params}` : window.location.pathname;
            window.history.pushState({}, "", url);
            await this.$nextTick();
            
            if (!was && this.isKioskMode) {
                this.startKioskPageRotation();
                this.startKioskAutoRefresh();
                this.kioskLastRefreshTime = Date.now();
            }
            
            this.$forceUpdate();
        },
        
        startKioskPageRotation() {
            this.stopKioskPageRotation();
            this.kioskPageRotationTimer = setInterval(() => {
                this.kioskCurrentPage = this.kioskCurrentPage >= this.kioskTotalPages 
                    ? 1 : this.kioskCurrentPage + 1;
            }, this.kioskPageDelay);
        },
        
        stopKioskPageRotation() {
            if (this.kioskPageRotationTimer) {
                clearInterval(this.kioskPageRotationTimer);
                this.kioskPageRotationTimer = null;
            }
        },
        
        startKioskAutoRefresh() {
            this.stopKioskAutoRefresh();
            this.kioskNextRefreshTime = Date.now() + this.kioskRefreshInterval;
            this.kioskRefreshTimer = setInterval(() => this.refreshKioskData(), this.kioskRefreshInterval);
            this.kioskCountdownUpdateTimer = setInterval(() => this.$forceUpdate(), 1000);
        },
        
        stopKioskAutoRefresh() {
            clearInterval(this.kioskRefreshTimer);
            clearInterval(this.kioskCountdownUpdateTimer);
            this.kioskRefreshTimer = null;
            this.kioskCountdownUpdateTimer = null;
        },
        
        async refreshKioskData() {
            const page = this.kioskCurrentPage;
            this.kioskLastRefreshTime = Date.now();
            this.kioskNextRefreshTime = Date.now() + this.kioskRefreshInterval;
            await this.loadData(); // Your data loading method
            this.$nextTick(() => { this.kioskCurrentPage = page; });
        }
    }
};
</script>
```

---

## Summary Checklist

- [ ] Add kiosk data properties (timers, state, config)
- [ ] Add `isKioskMode` computed property
- [ ] Add `activeFilterLabels` computed property
- [ ] Add pagination computed properties (totalPages, pagedData, indicators)
- [ ] Add countdown computed properties
- [ ] Implement `toggleKioskMode()` method
- [ ] Implement page rotation methods (start, stop, rotate)
- [ ] Implement auto-refresh methods (start, stop, refresh)
- [ ] Add kiosk mode detection in `mounted()`
- [ ] Start kiosk features in `mounted()` when active
- [ ] Clean up timers in `beforeDestroy()`
- [ ] Add kiosk badge bar to template
- [ ] Add page indicator bar to template
- [ ] Hide normal filters with `v-if="!isKioskMode"`
- [ ] Use `kioskPagedData` for table items when in kiosk mode
- [ ] Add kiosk mode toggle button
- [ ] Add kiosk mode styles
- [ ] Test all features (rotation, refresh, toggle, URL)

---

**End of Guide**

For a complete working reference, see `ReleasePlannerWidget.vue` implementation.
