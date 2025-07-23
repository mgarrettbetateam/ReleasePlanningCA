/**
 * Centralized API Configuration
 * Change USE_PRODUCTION to toggle between environments
 * Change USE_MOCK_DATA to toggle mock data usage
 */

/**
 * Set this to true for production, false for development
 */
let USE_PRODUCTION = true; // Change this to toggle environments

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
      
      // Determine current environment state
      let currentlyProduction;
      const override = localStorage.getItem("env_override");
      if (override !== null) {
        currentlyProduction = override === "true";
      } else {
        currentlyProduction = USE_PRODUCTION;
      }
      
      // Toggle to opposite environment
      const newEnvironmentIsProduction = !currentlyProduction;
      environmentOverride = newEnvironmentIsProduction;
      
      // Store in localStorage to persist across sessions
      localStorage.setItem("env_override", environmentOverride.toString());
      
      /* eslint-disable no-console */
      console.log("🥚 KONAMI CODE DEBUGGING:");
      console.log("  - Current environment was:", currentlyProduction ? "PRODUCTION" : "DEVELOPMENT");
      console.log("  - New environment is:", newEnvironmentIsProduction ? "PRODUCTION" : "DEVELOPMENT");
      console.log("  - environmentOverride set to:", environmentOverride);
      console.log("  - localStorage env_override:", localStorage.getItem("env_override"));
      console.log("  - Calling getApiBaseUrl() immediately:");
      console.log("  - getApiBaseUrl() returns:", getApiBaseUrl());
      /* eslint-enable no-console */
      
      // Show accurate notification in console
      const fromMode = currentlyProduction ? "PRODUCTION" : "DEVELOPMENT";
      const toMode = newEnvironmentIsProduction ? "PRODUCTION" : "DEVELOPMENT";
      const emoji = newEnvironmentIsProduction ? "🟢" : "🔴";
      /* eslint-disable no-console */
      console.log(`%c🥚 KONAMI CODE: ${fromMode} → ${toMode} ${emoji}`, 
        "background: #222; color: #bada55; font-size: 16px; padding: 10px; border-radius: 5px;");
      /* eslint-enable no-console */
      
      // Dispatch custom event to notify Vue components
      window.dispatchEvent(new CustomEvent("environmentChanged", {
        detail: {
          from: fromMode,
          to: toMode,
          isProduction: newEnvironmentIsProduction
        }
      }));
      
      // Show accurate visual feedback
      try {
        if (window.document.body) {
          const flash = document.createElement("div");
          flash.style.cssText = `
            position: fixed; top: 20px; right: 20px; z-index: 10000;
            background: ${newEnvironmentIsProduction ? "#4caf50" : "#f44336"};
            color: white; padding: 12px 20px; border-radius: 8px;
            font-family: monospace; font-weight: bold; font-size: 14px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            transition: all 0.3s ease;
          `;
          flash.textContent = `${emoji} SWITCHING TO ${toMode}`;
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
      const url = useProduction ? API_CONFIG.production : API_CONFIG.development;
      return url;
    }
  }
  
  // Default to production when no override is set
  const url = USE_PRODUCTION ? API_CONFIG.production : API_CONFIG.development;
  return url;
};

// Log which environment is being used (with override detection)
/* eslint-disable no-console */
const currentEnv = (() => {
  if (typeof window !== "undefined") {
    const override = localStorage.getItem("env_override");
    if (override !== null) {
      const useProduction = override === "true";
      return useProduction ? "(PRODUCTION - OVERRIDE)" : "(DEVELOPMENT)";
    }
  }
  return USE_PRODUCTION ? "(PRODUCTION)" : "(DEVELOPMENT)";
})();

// Use dynamic function call instead of cached constant for logging
console.log("[ApiConfig] Using API Base URL:", getApiBaseUrl(), currentEnv);
console.log("[ApiConfig] Mock Data Mode:", USE_MOCK_DATA ? "ENABLED" : "DISABLED");
console.log("[ApiConfig] 🥚 Konami Code available: ↑↑↓↓←→←→BA");

// Debug function to test environment switching manually
/* eslint-disable no-console */
window.testEnvironmentSwitch = function() {
  console.log("🧪 TESTING ENVIRONMENT SWITCH:");
  console.log("  - Current localStorage env_override:", localStorage.getItem("env_override"));
  console.log("  - Current getApiBaseUrl():", getApiBaseUrl());
  
  // Toggle environment
  const currentOverride = localStorage.getItem("env_override");
  const currentlyProduction = currentOverride !== null ? currentOverride === "true" : USE_PRODUCTION;
  const newValue = !currentlyProduction;
  
  localStorage.setItem("env_override", newValue.toString());
  
  console.log("  - Set env_override to:", newValue);
  console.log("  - New getApiBaseUrl():", getApiBaseUrl());
  console.log("  - Environment switched from", currentlyProduction ? "PROD" : "DEV", "to", newValue ? "PROD" : "DEV");
  
  // Dispatch event to notify components
  window.dispatchEvent(new CustomEvent("environmentChanged", {
    detail: {
      from: currentlyProduction ? "PRODUCTION" : "DEVELOPMENT",
      to: newValue ? "PRODUCTION" : "DEVELOPMENT",
      isProduction: newValue
    }
  }));
  
  return {
    oldEnvironment: currentlyProduction ? "PRODUCTION" : "DEVELOPMENT",
    newEnvironment: newValue ? "PRODUCTION" : "DEVELOPMENT",
    newUrl: getApiBaseUrl()
  };
};

// Test function to verify API calls use correct environment
window.testApiCall = async function() {
  console.log("🧪 TESTING API CALL:");
  console.log("  - Current API URL:", getApiBaseUrl());
  
  try {
    // Make a simple API call to test
    const response = await fetch(`${getApiBaseUrl()}/internal/resources/AttributeValQuery/retrievePrograms`);
    console.log("  - API Response status:", response.status);
    console.log("  - API Response headers:", response.headers);
    const data = await response.json();
    console.log("  - API Response data sample:", data);
    return { success: true, url: getApiBaseUrl(), data };
  } catch (error) {
    console.error("  - API Call failed:", error);
    return { success: false, url: getApiBaseUrl(), error: error.message };
  }
};
/* eslint-enable no-console */

