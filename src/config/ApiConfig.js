/**
 * Centralized API Configuration
 * Change USE_PRODUCTION to toggle between environments
 * Change USE_MOCK_DATA to toggle mock data usage
 */

/**
 * Set this to true for production, false for development
 */
export const USE_PRODUCTION = false; // Change this to toggle environments

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
 * Get the appropriate API base URL based on the boolean flag
 * @returns {string} - The base URL for API calls
 */
export const getApiBaseUrl = () => {
  return USE_PRODUCTION ? API_CONFIG.production : API_CONFIG.development;
};

export const API_BASE_URL = getApiBaseUrl();

// Log which environment is being used
/* eslint-disable no-console */
console.log("[ApiConfig] Using API Base URL:", API_BASE_URL, USE_PRODUCTION ? "(PRODUCTION)" : "(DEVELOPMENT)");
console.log("[ApiConfig] Mock Data Mode:", USE_MOCK_DATA ? "ENABLED" : "DISABLED");
