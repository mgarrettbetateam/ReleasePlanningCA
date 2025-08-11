/**
 * Responsive Utilities - Dynamic viewport and window resize handling
 * Provides centralized responsive behavior for all components
 */

// Constants to avoid magic numbers
const DEFAULT_HEIGHT = 400;
const DEFAULT_MIN_HEIGHT = 200;
const DEFAULT_MAX_HEIGHT = 800;
const DEFAULT_ITEMS_PER_PAGE = 10;
const MAX_LISTENERS_WARNING_THRESHOLD = 3;
const RESIZE_DEBOUNCE_TIME = 150;
const MOBILE_ASPECT_RATIO = 1.5;
const DESKTOP_ASPECT_RATIO = 2.5;
const MOBILE_PADDING = 10;
const DESKTOP_PADDING = 20;
const MOBILE_LEGEND_BOX_WIDTH = 12;
const DESKTOP_LEGEND_BOX_WIDTH = 16;
const SMALL_FONT_SIZE = 10;
const MEDIUM_FONT_SIZE = 12;
const MAX_X_ROTATION = 45;
const MOBILE_MAX_TICKS = 5;
const DESKTOP_MAX_TICKS = 10;
const Y_MAX_TICKS = 8;
const DEFAULT_GRID_COLUMNS = 3;
const MOBILE_GRID_GAP = 16;
const DESKTOP_GRID_GAP = 24;
const MOBILE_MIN_ITEM_WIDTH = 280;
const DESKTOP_MIN_ITEM_WIDTH = 350;
const CONTAINER_HEIGHT_RATIO = 0.8;
const CONTAINER_WIDTH_RATIO = 0.6;
const MOBILE_MAX_HEIGHT = 300;
const TABLET_MAX_HEIGHT = 400;
const ABSOLUTE_MIN_HEIGHT = 200;
const COMPONENT_UPDATE_DEBOUNCE = 200;

export class ResponsiveUtils {
    constructor() {
        this.resizeObserver = null;
        this.windowResizeCallbacks = new Set();
        this.breakpoints = {
            xs: 0,      // < 600px
            sm: 600,    // 600px - 960px
            md: 960,    // 960px - 1264px
            lg: 1264,   // 1264px - 1904px
            xl: 1904    // > 1904px
        };
        this.currentBreakpoint = this.getCurrentBreakpoint();
        this.setupWindowResizeHandler();
    }

    /**
     * Get current breakpoint based on window width
     */
    getCurrentBreakpoint() {
        const width = window.innerWidth;
        
        if (width < this.breakpoints.sm) return "xs";
        if (width < this.breakpoints.md) return "sm";
        if (width < this.breakpoints.lg) return "md";
        if (width < this.breakpoints.xl) return "lg";
        return "xl";
    }

    /**
     * Check if current viewport matches breakpoint
     */
    isBreakpoint(breakpoint) {
        return this.currentBreakpoint === breakpoint;
    }

    /**
     * Check if current viewport is mobile (xs or sm)
     */
    isMobile() {
        return this.isBreakpoint("xs") || this.isBreakpoint("sm");
    }

    /**
     * Check if current viewport is tablet (sm or md)
     */
    isTablet() {
        return this.isBreakpoint("sm") || this.isBreakpoint("md");
    }

    /**
     * Check if current viewport is desktop (md and up)
     */
    isDesktop() {
        return !this.isMobile();
    }

    /**
     * Get responsive dimensions for components
     */
    getResponsiveDimensions(baseConfig) {
        const breakpoint = this.currentBreakpoint;
        const config = baseConfig.breakpoints && baseConfig.breakpoints[breakpoint] 
            ? baseConfig.breakpoints[breakpoint] 
            : baseConfig;

        return {
            width: config.width || "100%",
            height: config.height || baseConfig.height || DEFAULT_HEIGHT,
            minHeight: config.minHeight || baseConfig.minHeight || DEFAULT_MIN_HEIGHT,
            maxHeight: config.maxHeight || baseConfig.maxHeight || DEFAULT_MAX_HEIGHT,
            flex: config.flex || baseConfig.flex || 1,
            itemsPerPage: config.itemsPerPage || baseConfig.itemsPerPage || DEFAULT_ITEMS_PER_PAGE
        };
    }

    /**
     * Setup window resize handler with performance optimizations
     */
    setupWindowResizeHandler() {
        let resizeTimeout;
        let rafId;
        
        const handleResize = () => {
            // Cancel previous timeout and animation frame
            clearTimeout(resizeTimeout);
            if (rafId) {
                cancelAnimationFrame(rafId);
            }
            
            // Use requestAnimationFrame for better performance
            rafId = requestAnimationFrame(() => {
                resizeTimeout = setTimeout(() => {
                    const newBreakpoint = this.getCurrentBreakpoint();
                    const breakpointChanged = newBreakpoint !== this.currentBreakpoint;
                    
                    // Only notify if breakpoint actually changed or if there are few listeners
                    if (breakpointChanged || this.windowResizeCallbacks.size <= MAX_LISTENERS_WARNING_THRESHOLD) {
                        this.currentBreakpoint = newBreakpoint;
                        
                        const resizeData = {
                            breakpoint: newBreakpoint,
                            breakpointChanged,
                            width: window.innerWidth,
                            height: window.innerHeight,
                            isMobile: this.isMobile(),
                            isTablet: this.isTablet(),
                            isDesktop: this.isDesktop()
                        };
                        
                        // Notify callbacks with error handling
                        this.windowResizeCallbacks.forEach(callback => {
                            try {
                                callback(resizeData);
                            } catch (error) {
                                console.error("Error in resize callback:", error);
                                // Remove problematic callback to prevent repeated errors
                                this.windowResizeCallbacks.delete(callback);
                            }
                        });
                    }
                }, RESIZE_DEBOUNCE_TIME); // Increased debounce for better performance
            });
        };

        window.addEventListener("resize", handleResize, { passive: true });
        
        // Initial call with delay to ensure DOM is ready
        setTimeout(handleResize, 100);
    }

    /**
     * Register callback for window resize events
     */
    onWindowResize(callback) {
        this.windowResizeCallbacks.add(callback);
        
        // Return unsubscribe function
        return () => {
            this.windowResizeCallbacks.delete(callback);
        };
    }

    /**
     * Setup ResizeObserver for element-specific resize handling
     */
    observeElementResize(element, callback) {
        if (!window.ResizeObserver) {
            console.warn("ResizeObserver not supported, falling back to window resize");
            return this.onWindowResize(callback);
        }

        const resizeObserver = new ResizeObserver(entries => {
            entries.forEach(entry => {
                const { width, height } = entry.contentRect;
                callback({
                    width,
                    height,
                    element: entry.target
                });
            });
        });

        resizeObserver.observe(element);

        // Return cleanup function
        return () => {
            resizeObserver.unobserve(element);
        };
    }

    /**
     * Get responsive chart configuration
     */
    getChartConfig(baseConfig = {}) {
        const responsive = this.getResponsiveDimensions(baseConfig);
        
        return {
            responsive: true,
            maintainAspectRatio: false,
            aspectRatio: this.isMobile() ? MOBILE_ASPECT_RATIO : DESKTOP_ASPECT_RATIO,
            layout: {
                padding: this.isMobile() ? MOBILE_PADDING : DESKTOP_PADDING
            },
            plugins: {
                legend: {
                    display: !this.isMobile() || baseConfig.showLegendOnMobile !== false,
                    position: this.isMobile() ? "bottom" : "top",
                    labels: {
                        boxWidth: this.isMobile() ? MOBILE_LEGEND_BOX_WIDTH : DESKTOP_LEGEND_BOX_WIDTH,
                        fontSize: this.isMobile() ? SMALL_FONT_SIZE : MEDIUM_FONT_SIZE
                    }
                },
                tooltip: {
                    enabled: true,
                    mode: this.isMobile() ? "nearest" : "index",
                    intersect: this.isMobile()
                }
            },
            scales: {
                x: {
                    ticks: {
                        maxRotation: this.isMobile() ? MAX_X_ROTATION : 0,
                        maxTicksLimit: this.isMobile() ? MOBILE_MAX_TICKS : DESKTOP_MAX_TICKS,
                        fontSize: this.isMobile() ? SMALL_FONT_SIZE : MEDIUM_FONT_SIZE
                    }
                },
                y: {
                    ticks: {
                        maxTicksLimit: this.isMobile() ? MOBILE_MAX_TICKS : Y_MAX_TICKS,
                        fontSize: this.isMobile() ? SMALL_FONT_SIZE : MEDIUM_FONT_SIZE
                    }
                }
            },
            ...responsive
        };
    }

    /**
     * Get responsive table configuration
     */
    getTableConfig(baseConfig = {}) {
        const responsive = this.getResponsiveDimensions(baseConfig);
        
        return {
            dense: this.isMobile(),
            fixedHeader: true,
            height: responsive.height,
            itemsPerPage: responsive.itemsPerPage,
            showSelect: !this.isMobile(),
            showExpand: this.isMobile(),
            hideDefaultFooter: this.isMobile(),
            mobile: this.isMobile(),
            ...responsive
        };
    }

    /**
     * Get responsive grid configuration
     */
    getGridConfig(baseConfig = {}) {
        const columns = this.isMobile() ? 1 : 
                       this.isTablet() ? 2 : 
                       baseConfig.columns || DEFAULT_GRID_COLUMNS;
        
        return {
            columns,
            gap: this.isMobile() ? MOBILE_GRID_GAP : DESKTOP_GRID_GAP,
            minItemWidth: this.isMobile() ? MOBILE_MIN_ITEM_WIDTH : DESKTOP_MIN_ITEM_WIDTH,
            ...baseConfig
        };
    }

    /**
     * Calculate optimal chart height based on container and content
     */
    calculateOptimalHeight(container, _content) {
        if (!container) return DEFAULT_HEIGHT;
        
        const containerHeight = container.clientHeight;
        const containerWidth = container.clientWidth;
        
        // Base height calculation
        let optimalHeight = Math.min(containerHeight * CONTAINER_HEIGHT_RATIO, containerWidth * CONTAINER_WIDTH_RATIO);
        
        // Adjust for breakpoints
        if (this.isMobile()) {
            optimalHeight = Math.min(optimalHeight, MOBILE_MAX_HEIGHT);
        } else if (this.isTablet()) {
            optimalHeight = Math.min(optimalHeight, TABLET_MAX_HEIGHT);
        }
        
        // Minimum height
        optimalHeight = Math.max(optimalHeight, ABSOLUTE_MIN_HEIGHT);
        
        return Math.round(optimalHeight);
    }

    /**
     * Cleanup all observers and listeners
     */
    cleanup() {
        this.windowResizeCallbacks.clear();
        if (this.resizeObserver) {
            this.resizeObserver.disconnect();
        }
    }
}

// Create singleton instance
export const responsiveUtils = new ResponsiveUtils();

// Vue mixin for easy component integration - PERFORMANCE OPTIMIZED
export const ResponsiveMixin = {
    data() {
        return {
            currentBreakpoint: responsiveUtils.currentBreakpoint,
            windowDimensions: {
                width: window.innerWidth,
                height: window.innerHeight
            },
            _responsiveDebounceTimeout: null
        };
    },
    
    computed: {
        isMobile() {
            return this.currentBreakpoint === "xs" || this.currentBreakpoint === "sm";
        },
        
        isTablet() {
            return this.currentBreakpoint === "sm" || this.currentBreakpoint === "md";
        },
        
        isDesktop() {
            return this.currentBreakpoint === "md" || this.currentBreakpoint === "lg" || this.currentBreakpoint === "xl";
        },
        
        responsiveConfig() {
            return responsiveUtils.getResponsiveDimensions(this.baseConfig || {});
        }
    },
    
    mounted() {
        // Only register for resize updates if component has a resize handler
        if (this.onResponsiveResize && typeof this.onResponsiveResize === "function") {
            this.unsubscribeResize = responsiveUtils.onWindowResize(resizeData => {
                // Debounce component-specific resize handling
                clearTimeout(this._responsiveDebounceTimeout);
                this._responsiveDebounceTimeout = setTimeout(() => {
                    // Only update if breakpoint actually changed
                    if (resizeData.breakpointChanged) {
                        this.currentBreakpoint = resizeData.breakpoint;
                        this.windowDimensions = {
                            width: resizeData.width,
                            height: resizeData.height
                        };
                    }
                    
                    // Call component-specific resize handler
                    try {
                        this.onResponsiveResize(resizeData);
                    } catch (error) {
                        console.error("Error in component resize handler:", error);
                    }
                }, COMPONENT_UPDATE_DEBOUNCE); // Debounce component updates
            });
        }
    },
    
    beforeDestroy() {
        // Clean up resize listener and timeout
        if (this.unsubscribeResize) {
            this.unsubscribeResize();
        }
        if (this._responsiveDebounceTimeout) {
            clearTimeout(this._responsiveDebounceTimeout);
        }
    }
};

export default responsiveUtils;
