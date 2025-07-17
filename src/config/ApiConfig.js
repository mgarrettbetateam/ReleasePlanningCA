/**
 * Centralized API Configuration
 * Change USE_PRODUCTION to toggle between environments
 * Change USE_MOCK_DATA to toggle mock data usage
 */

/**
 * Set this to true for production, false for development
 */
let USE_PRODUCTION = false; // Change this to toggle environments

/**
 * Set this to true to use mock data instead of real API calls
 * Useful for development, testing, or when APIs are not available
 */
export const USE_MOCK_DATA = false; // Back to real API for debugging

/**
 * Environment configuration for API endpoints
 */
export const API_CONFIG = {
  production: "https://3dspace-prod.beta.team",
  development: "https://dev-3ds-app.beta.team"
};

/**
 * 🥚 Easter egg: Konami Code to toggle production/development
 * Secret: ↑↑↓↓←→←→BA
 */
const KONAMI_CODE = [
  "ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown",
  "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight",
  "KeyB", "KeyA"
];

let konamiSequence = [];
let environmentOverride = null;

// Check for stored override on load
if (typeof window !== "undefined" && localStorage.getItem("env_override")) {
  environmentOverride = localStorage.getItem("env_override") === "true";
}

// Listen for the secret key combination
if (typeof window !== "undefined") {
  document.addEventListener("keydown", event => {
    konamiSequence.push(event.code);
    
    // Keep only the last 10 keystrokes
    if (konamiSequence.length > KONAMI_CODE.length) {
      konamiSequence.shift();
    }
    
    // Check if the sequence matches
    if (konamiSequence.length === KONAMI_CODE.length &&
        konamiSequence.every((key, index) => key === KONAMI_CODE[index])) {
      
      // Toggle environment
      environmentOverride = environmentOverride === null ? !USE_PRODUCTION : !environmentOverride;
      
      // Store in localStorage to persist across sessions
      localStorage.setItem("env_override", environmentOverride.toString());
      
      // Show subtle notification in console
      const mode = environmentOverride ? "PRODUCTION" : "DEVELOPMENT";
      const emoji = environmentOverride ? "�" : "�";
      /* eslint-disable no-console */
      console.log(`%c🥚 KONAMI CODE ACTIVATED: ${mode} MODE ${emoji}`, 
        "background: #222; color: #bada55; font-size: 16px; padding: 10px; border-radius: 5px;");
      /* eslint-enable no-console */
      
      // Show subtle visual feedback (if available)
      try {
        if (window.document.body) {
          const flash = document.createElement("div");
          flash.style.cssText = `
            position: fixed; top: 20px; right: 20px; z-index: 10000;
            background: ${environmentOverride ? "#4caf50" : "#f44336"};
            color: white; padding: 12px 20px; border-radius: 8px;
            font-family: monospace; font-weight: bold; font-size: 14px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            transition: all 0.3s ease;
          `;
          flash.textContent = `${emoji} ${mode} MODE`;
          document.body.appendChild(flash);
          
          // Fade out and remove
          const FLASH_DURATION = 2000;
          const FADE_DURATION = 300;
          setTimeout(() => {
            flash.style.opacity = "0";
            flash.style.transform = "translateY(-20px)";
            setTimeout(() => flash.remove(), FADE_DURATION);
          }, FLASH_DURATION);
        }
      } catch (e) {
        // Silently fail if DOM manipulation fails
      }
      
      // Reset sequence
      konamiSequence = [];
      
      // Reload page to apply new environment
      const RELOAD_DELAY = 2500;
      setTimeout(() => {
        window.location.reload();
      }, RELOAD_DELAY);
    }
  });
}

/**
 * Get the appropriate API base URL based on the boolean flag and environment override
 * @returns {string} - The base URL for API calls
 */
export const getApiBaseUrl = () => {
  // Check for environment override from easter egg
  if (typeof window !== "undefined") {
    const override = localStorage.getItem("env_override");
    if (override !== null) {
      const useProduction = override === "true";
      return useProduction ? API_CONFIG.production : API_CONFIG.development;
    }
  }
  
  return USE_PRODUCTION ? API_CONFIG.production : API_CONFIG.development;
};

export const API_BASE_URL = getApiBaseUrl();

// Log which environment is being used (with override detection)
/* eslint-disable no-console */
const currentEnv = (() => {
  if (typeof window !== "undefined") {
    const override = localStorage.getItem("env_override");
    if (override !== null) {
      const useProduction = override === "true";
      return useProduction ? "(PRODUCTION - OVERRIDE)" : "(DEVELOPMENT - OVERRIDE)";
    }
  }
  return USE_PRODUCTION ? "(PRODUCTION)" : "(DEVELOPMENT)";
})();

console.log("[ApiConfig] Using API Base URL:", API_BASE_URL, currentEnv);
console.log("[ApiConfig] Mock Data Mode:", USE_MOCK_DATA ? "ENABLED" : "DISABLED");
console.log("[ApiConfig] 🥚 Konami Code available: ↑↑↓↓←→←→BA");

