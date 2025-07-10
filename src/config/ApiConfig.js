/**
 * Centralized API Configuration
 * Change USE_PRODUCTION to toggle between environments
 */

/**
 * Set this to true for production, false for development
 */
export const USE_PRODUCTION = true; // Change this to toggle environments

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
