/**
 * Vue Plugin for Responsive Utils
 * Makes responsive utilities globally available in all components
 */

import { responsiveUtils } from "../utils/ResponsiveUtils.js";

export default {
    install(Vue) {
        // Add responsive utilities to Vue prototype
        Vue.prototype.$responsive = responsiveUtils;
        
        // Add lightweight global properties without auto-updating mixin
        // Components that need responsive updates should use ResponsiveMixin explicitly
        Vue.mixin({
            computed: {
                // Read-only responsive state (no auto-updates to prevent performance issues)
                $isMobile() {
                    return responsiveUtils.isMobile();
                },
                
                $isTablet() {
                    return responsiveUtils.isTablet();
                },
                
                $isDesktop() {
                    return responsiveUtils.isDesktop();
                },
                
                $breakpoint() {
                    return responsiveUtils.currentBreakpoint;
                },
                
                $windowSize() {
                    return {
                        width: window.innerWidth,
                        height: window.innerHeight
                    };
                }
            }
        });
        
        // Add global responsive filters
        Vue.filter("responsiveHeight", (baseHeight, config = {}) => {
            const dimensions = responsiveUtils.getResponsiveDimensions({
                height: baseHeight,
                ...config
            });
            return dimensions.height;
        });
        
        Vue.filter("responsiveWidth", (baseWidth, config = {}) => {
            const dimensions = responsiveUtils.getResponsiveDimensions({
                width: baseWidth,
                ...config
            });
            return dimensions.width;
        });
        
        // Add responsive directives
        Vue.directive("responsive-height", {
            bind(el, binding) {
                const updateHeight = () => {
                    const config = binding.value || {};
                    const baseHeight = el.getAttribute("data-base-height") || 400;
                    const dimensions = responsiveUtils.getResponsiveDimensions({
                        height: parseInt(baseHeight),
                        ...config
                    });
                    el.style.height = `${dimensions.height}px`;
                };
                
                // Initial height
                updateHeight();
                
                // Update on resize
                el._responsiveHeightHandler = responsiveUtils.onWindowResize(updateHeight);
            },
            
            update(el, binding) {
                if (binding.value !== binding.oldValue) {
                    const config = binding.value || {};
                    const baseHeight = el.getAttribute("data-base-height") || 400;
                    const dimensions = responsiveUtils.getResponsiveDimensions({
                        height: parseInt(baseHeight),
                        ...config
                    });
                    el.style.height = `${dimensions.height}px`;
                }
            },
            
            unbind(el) {
                if (el._responsiveHeightHandler) {
                    el._responsiveHeightHandler();
                    el._responsiveHeightHandler = null;
                }
            }
        });
        
        Vue.directive("responsive-width", {
            bind(el, binding) {
                const updateWidth = () => {
                    const config = binding.value || {};
                    const baseWidth = el.getAttribute("data-base-width") || "100%";
                    const dimensions = responsiveUtils.getResponsiveDimensions({
                        width: baseWidth,
                        ...config
                    });
                    el.style.width = dimensions.width;
                };
                
                // Initial width
                updateWidth();
                
                // Update on resize
                el._responsiveWidthHandler = responsiveUtils.onWindowResize(updateWidth);
            },
            
            update(el, binding) {
                if (binding.value !== binding.oldValue) {
                    const config = binding.value || {};
                    const baseWidth = el.getAttribute("data-base-width") || "100%";
                    const dimensions = responsiveUtils.getResponsiveDimensions({
                        width: baseWidth,
                        ...config
                    });
                    el.style.width = dimensions.width;
                }
            },
            
            unbind(el) {
                if (el._responsiveWidthHandler) {
                    el._responsiveWidthHandler();
                    el._responsiveWidthHandler = null;
                }
            }
        });
    }
};
