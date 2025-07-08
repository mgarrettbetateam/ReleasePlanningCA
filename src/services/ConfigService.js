/* eslint-disable no-console */
// Configuration Service - Manages development/production mode settings

class ConfigService {
    constructor() {
        // Default configuration - can be overridden by environment variables or build settings
        this.config = {
            showDevelopmentHeader: true,
            showDevelopmentTools: true,
            environment: "development"
        };
        
        // Check if we're in production build (webpack will replace this)
        if (process.env.NODE_ENV === "production") {
            this.config.environment = "production";
            this.config.showDevelopmentHeader = false;
            this.config.showDevelopmentTools = false;
        }
        
        // Check for runtime configuration overrides
        this.loadRuntimeConfig();
    }
    
    /**
     * Load configuration from URL parameters or localStorage for runtime overrides
     */
    loadRuntimeConfig() {
        // Check URL parameters for quick toggling during development
        const urlParams = new URLSearchParams(window.location.search);
        
        // URL parameter overrides (useful for testing)
        if (urlParams.has("dev-header")) {
            this.config.showDevelopmentHeader = urlParams.get("dev-header") === "true";
        }
        
        if (urlParams.has("dev-tools")) {
            this.config.showDevelopmentTools = urlParams.get("dev-tools") === "true";
        }
        
        if (urlParams.has("env")) {
            this.config.environment = urlParams.get("env");
        }
        
        // Check localStorage for persistent overrides
        const storedConfig = localStorage.getItem("widget-dev-config");
        if (storedConfig) {
            try {
                const parsed = JSON.parse(storedConfig);
                this.config = { ...this.config, ...parsed };
            } catch (error) {
                console.warn("Invalid stored configuration, using defaults:", error);
            }
        }
        
        console.log("🔧 ConfigService loaded:", this.config);
    }
    
    /**
     * Get whether to show the development header
     */
    showDevelopmentHeader() {
        return this.config.showDevelopmentHeader;
    }
    
    /**
     * Get whether to show development tools
     */
    showDevelopmentTools() {
        return this.config.showDevelopmentTools;
    }
    
    /**
     * Get current environment
     */
    getEnvironment() {
        return this.config.environment;
    }
    
    /**
     * Check if we're in production mode
     */
    isProduction() {
        return this.config.environment === "production";
    }
    
    /**
     * Check if we're in development mode
     */
    isDevelopment() {
        return this.config.environment === "development";
    }
    
    /**
     * Toggle development header visibility
     */
    toggleDevelopmentHeader() {
        this.config.showDevelopmentHeader = !this.config.showDevelopmentHeader;
        this.saveConfig();
        return this.config.showDevelopmentHeader;
    }
    
    /**
     * Toggle development tools visibility
     */
    toggleDevelopmentTools() {
        this.config.showDevelopmentTools = !this.config.showDevelopmentTools;
        this.saveConfig();
        return this.config.showDevelopmentTools;
    }
    
    /**
     * Set production mode
     */
    setProductionMode() {
        this.config.environment = "production";
        this.config.showDevelopmentHeader = false;
        this.config.showDevelopmentTools = false;
        this.saveConfig();
        console.log("🚀 Production mode enabled");
    }
    
    /**
     * Set development mode
     */
    setDevelopmentMode() {
        this.config.environment = "development";
        this.config.showDevelopmentHeader = true;
        this.config.showDevelopmentTools = true;
        this.saveConfig();
        console.log("🔧 Development mode enabled");
    }
    
    /**
     * Save current configuration to localStorage
     */
    saveConfig() {
        localStorage.setItem("widget-dev-config", JSON.stringify(this.config));
    }
    
    /**
     * Reset configuration to defaults
     */
    reset() {
        localStorage.removeItem("widget-dev-config");
        this.config = {
            showDevelopmentHeader: process.env.NODE_ENV !== "production",
            showDevelopmentTools: process.env.NODE_ENV !== "production",
            environment: process.env.NODE_ENV === "production" ? "production" : "development"
        };
        console.log("🔄 Configuration reset to defaults");
    }
    
    /**
     * Get configuration for debugging
     */
    getConfig() {
        return { ...this.config };
    }
    
    /**
     * Quick production setup - hides all dev elements
     */
    enableProductionMode() {
        this.setProductionMode();
        // Optionally reload the page to apply changes immediately
        if (window.confirm("Production mode enabled. Reload page to apply changes?")) {
            window.location.reload();
        }
    }
    
    /**
     * Quick development setup - shows all dev elements
     */
    enableDevelopmentMode() {
        this.setDevelopmentMode();
        // Optionally reload the page to apply changes immediately
        if (window.confirm("Development mode enabled. Reload page to apply changes?")) {
            window.location.reload();
        }
    }
}

// Export singleton instance
export default new ConfigService();
