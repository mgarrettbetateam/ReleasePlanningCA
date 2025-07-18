/**
 * Responsive Utilities - Dynamic viewport and window resize handling
 * Provides centralized responsive behavior for all components
 */

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
        
        if (width < this.breakpoints.sm) return 'xs';
        if (width < this.breakpoints.md) return 'sm';
        if (width < this.breakpoints.lg) return 'md';
        if (width < this.breakpoints.xl) return 'lg';
        return 'xl';
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
        return this.isBreakpoint('xs') || this.isBreakpoint('sm');
    }

    /**
     * Check if current viewport is tablet (sm or md)
     */
    isTablet() {
        return this.isBreakpoint('sm') || this.isBreakpoint('md');
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
            width: config.width || '100%',
            height: config.height || baseConfig.height || 400,
            minHeight: config.minHeight || baseConfig.minHeight || 200,
            maxHeight: config.maxHeight || baseConfig.maxHeight || 800,
            flex: config.flex || baseConfig.flex || 1,
            itemsPerPage: config.itemsPerPage || baseConfig.itemsPerPage || 10
        };
    }

    /**
     * Setup window resize handler
     */
    setupWindowResizeHandler() {
        let resizeTimeout;
        
        const handleResize = () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                const newBreakpoint = this.getCurrentBreakpoint();
                const breakpointChanged = newBreakpoint !== this.currentBreakpoint;
                
                this.currentBreakpoint = newBreakpoint;
                
                // Notify all registered callbacks
                this.windowResizeCallbacks.forEach(callback => {
                    try {
                        callback({
                            breakpoint: newBreakpoint,
                            breakpointChanged,
                            width: window.innerWidth,
                            height: window.innerHeight,
                            isMobile: this.isMobile(),
                            isTablet: this.isTablet(),
                            isDesktop: this.isDesktop()
                        });
                    } catch (error) {
                        console.error('Error in resize callback:', error);
                    }
                });
            }, 100); // Debounce resize events
        };

        window.addEventListener('resize', handleResize);
        
        // Initial call
        handleResize();
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
            console.warn('ResizeObserver not supported, falling back to window resize');
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
            aspectRatio: this.isMobile() ? 1.5 : 2.5,
            layout: {
                padding: this.isMobile() ? 10 : 20
            },
            plugins: {
                legend: {
                    display: !this.isMobile() || baseConfig.showLegendOnMobile !== false,
                    position: this.isMobile() ? 'bottom' : 'top',
                    labels: {
                        boxWidth: this.isMobile() ? 12 : 16,
                        fontSize: this.isMobile() ? 10 : 12
                    }
                },
                tooltip: {
                    enabled: true,
                    mode: this.isMobile() ? 'nearest' : 'index',
                    intersect: this.isMobile()
                }
            },
            scales: {
                x: {
                    ticks: {
                        maxRotation: this.isMobile() ? 45 : 0,
                        maxTicksLimit: this.isMobile() ? 5 : 10,
                        fontSize: this.isMobile() ? 10 : 12
                    }
                },
                y: {
                    ticks: {
                        maxTicksLimit: this.isMobile() ? 5 : 8,
                        fontSize: this.isMobile() ? 10 : 12
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
                       baseConfig.columns || 3;
        
        return {
            columns,
            gap: this.isMobile() ? 16 : 24,
            minItemWidth: this.isMobile() ? 280 : 350,
            ...baseConfig
        };
    }

    /**
     * Calculate optimal chart height based on container and content
     */
    calculateOptimalHeight(container, content) {
        if (!container) return 400;
        
        const containerHeight = container.clientHeight;
        const containerWidth = container.clientWidth;
        
        // Base height calculation
        let optimalHeight = Math.min(containerHeight * 0.8, containerWidth * 0.6);
        
        // Adjust for breakpoints
        if (this.isMobile()) {
            optimalHeight = Math.min(optimalHeight, 300);
        } else if (this.isTablet()) {
            optimalHeight = Math.min(optimalHeight, 400);
        }
        
        // Minimum height
        optimalHeight = Math.max(optimalHeight, 200);
        
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

// Vue mixin for easy component integration
export const ResponsiveMixin = {
    data() {
        return {
            currentBreakpoint: responsiveUtils.currentBreakpoint,
            windowDimensions: {
                width: window.innerWidth,
                height: window.innerHeight
            }
        };
    },
    
    computed: {
        isMobile() {
            return responsiveUtils.isMobile();
        },
        
        isTablet() {
            return responsiveUtils.isTablet();
        },
        
        isDesktop() {
            return responsiveUtils.isDesktop();
        },
        
        responsiveConfig() {
            return responsiveUtils.getResponsiveDimensions(this.baseConfig || {});
        }
    },
    
    mounted() {
        // Register for window resize updates
        this.unsubscribeResize = responsiveUtils.onWindowResize((resizeData) => {
            this.currentBreakpoint = resizeData.breakpoint;
            this.windowDimensions = {
                width: resizeData.width,
                height: resizeData.height
            };
            
            // Call component-specific resize handler if it exists
            if (this.onResponsiveResize) {
                this.onResponsiveResize(resizeData);
            }
        });
    },
    
    beforeDestroy() {
        // Clean up resize listener
        if (this.unsubscribeResize) {
            this.unsubscribeResize();
        }
    }
};

export default responsiveUtils;
