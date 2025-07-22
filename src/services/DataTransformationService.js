/**
 * DataTransformationService
 * 
 * Handles data transformation, type management, and API response processing
 * for the Release Planner Widget. This service provides a centralized way to:
 * 
 * 1. Transform raw API data into standardized table format
 * 2. Manage data type configurations and switching
 * 3. Process API responses and extract arrays from complex objects
 * 4. Extract organizations and other derived data
 * 
 * @author Release Planner Team
 * @version 1.0.0
 */

class DataTransformationService {
    constructor() {
        // Data type configurations that define how each data type is structured
        this.dataTypeConfigurations = {
            parts: {
                name: "Parts",
                title: "Parts Release Planner",
                apiKeys: ["parts", "data", "items", "results"],
                fieldMappings: {
                    partNo: ["partNumber", "partNo"],
                    rev: ["revision", "rev"],
                    description: ["description"],
                    organization: ["organization"],
                    tgtRelease: ["targetReleaseDate", "tgtRelease"],
                    actualRelease: ["actualReleaseDate", "actualRelease"],
                    currentState: ["currentState", "state"],
                    physId: ["physId", "id"],
                    caNumber: [], // Populated by ChangeActionCell
                    caState: [],   // Populated by ChangeActionCell
                    statusComment: ["statusComment", "caStatusComment", "partStatusComment"],
                    caStatusComment: ["caStatusComment", "statusComment", "partStatusComment"]
                }
            },
            cas: {
                name: "Change Actions",
                title: "Change Actions Release Planner",
                apiKeys: ["CAs", "cas", "parts", "data", "items", "results"],
                fieldMappings: {
                    caNumber: ["caNumber", "changeActionNumber"],
                    changeDescription: ["changeDescription", "changeSummary", "description"],
                    resEngr: ["respEngr", "responsibleEngineer"],
                    currentState: ["currentState", "status"],
                    targetReleaseDate: ["targetReleaseDate", "targetCompleteDate"],
                    approvedDate: ["approvedDate"],
                    actualReleaseDate: ["actualReleaseDate", "actualCompleteDate"],
                    organization: ["organization"],
                    statusComment: ["statusComment", "caStatusComment"],
                    caStatusComment: ["caStatusComment", "statusComment"],
                    name: ["name", "caNumber", "changeActionNumber"],
                    revision: ["revision", "rev"],
                    physId: ["physId", "id"]
                }
            },
            crs: {
                name: "Change Requests",
                title: "Change Requests Release Planner",
                apiKeys: ["CRs", "crs", "parts", "data", "items", "results"],
                fieldMappings: {
                    crNumber: ["crNumber", "changeRequestNumber"],
                    changeDescription: ["changeDescription", "reasonforChange", "name", "summary", "description"],
                    owner: ["owner", "respEngr", "responsibleEngineer"],
                    currentState: ["currentState", "status"],
                    targetReleaseDate: ["targetReleaseDate", "dueDate"],
                    actualCompleteDate: ["actualCompleteDate", "actualReleaseDate", "completedDate"],
                    statusComment: ["statusComment", "caStatusComment"],
                    caStatusComment: ["caStatusComment", "statusComment"]
                }
            }
        };
    }

    /**
     * Get configuration for a specific data type
     * @param {string} dataType - The data type to get configuration for
     * @returns {Object|null} Configuration object or null if not found
     */
    getDataTypeConfig(dataType) {
        const config = this.dataTypeConfigurations[dataType];
        if (!config) {
            return null;
        }
        return config;
    }

    /**
     * Get the display title for a data type
     * @param {string} dataType - The data type
     * @returns {string} Display title
     */
    getDataTypeTitle(dataType) {
        const config = this.getDataTypeConfig(dataType);
        return config ? config.title : `${dataType} Release Planner`;
    }

    /**
     * Get all available data types
     * @returns {Array<string>} Array of available data type keys
     */
    getAvailableDataTypes() {
        return Object.keys(this.dataTypeConfigurations);
    }

    /**
     * Validate if a data type is supported
     * @param {string} dataType - The data type to validate
     * @returns {boolean} True if supported, false otherwise
     */
    isValidDataType(dataType) {
        return Object.prototype.hasOwnProperty.call(this.dataTypeConfigurations, dataType);
    }

    /**
     * Extract value from item using field mapping priorities
     * @param {Object} item - The data item
     * @param {Array<string>} fieldOptions - Array of field names to try in order
     * @param {string} defaultValue - Default value if no field found
     * @returns {string} Extracted value or default
     */
    extractFieldValue(item, fieldOptions, defaultValue = "") {
        for (const field of fieldOptions) {
            if (item[field] !== undefined && item[field] !== null && item[field] !== "") {
                return item[field];
            }
        }
        return defaultValue;
    }

    /**
     * Transform raw API item to standardized table format
     * 
     * Maps raw API data to the standardized format expected by the table component.
     * Each data type has its own mapping configuration to ensure consistency.
     * 
     * @param {Object} item - Raw item from API
     * @param {string} dataType - Current data type (parts, cas, crs)
     * @returns {Object} Transformed item with standardized field names
     */
    mapItemToTableData(item, dataType) {
        const config = this.getDataTypeConfig(dataType);
        if (!config) {
            return item; // Return raw item as fallback
        }

        const mappedItem = {};
        
        // Apply field mappings based on configuration
        for (const [targetField, sourceOptions] of Object.entries(config.fieldMappings)) {
            if (sourceOptions.length === 0) {
                // Fields like caNumber and caState are populated externally
                mappedItem[targetField] = "";
            } else {
                // Extract value using priority order
                const defaultValue = targetField === "organization" ? "Unknown" : 
                                   targetField.includes("Date") || targetField.includes("Release") ? "N/A" : "";
                mappedItem[targetField] = this.extractFieldValue(item, sourceOptions, defaultValue);
            }
        }

        // Add internal ID for lookups (always try to preserve)
        if (!mappedItem.physId) {
            mappedItem.physId = item.physId || item.objId || item.id || item._id || "";
        }

        return mappedItem;
    }

    /**
     * Process API response and extract array data
     * 
     * Handles various API response formats by trying different common property names
     * based on the data type. This is necessary because different APIs return data
     * in different structures.
     * 
     * @param {*} apiResponse - Raw API response
     * @param {string} dataType - Current data type
     * @returns {Array} Extracted array of items
     */
    processApiResponse(apiResponse, dataType) {
        // If already an array, return as-is
        if (Array.isArray(apiResponse)) {
            return apiResponse;
        }

        // If not an object, return empty array
        if (!apiResponse || typeof apiResponse !== "object") {
            return [];
        }

        // Try to extract array from object using data type configuration
        const config = this.getDataTypeConfig(dataType);
        if (!config) {
            return [];
        }
        
        for (const key of config.apiKeys) {
            if (apiResponse[key] && Array.isArray(apiResponse[key])) {
                return apiResponse[key];
            }
        }
        
        return [];
    }

    /**
     * Transform API response to table data
     * 
     * Complete transformation pipeline that processes the API response,
     * extracts the array, and maps each item to table format.
     * 
     * @param {*} apiResponse - Raw API response
     * @param {string} dataType - Current data type
     * @returns {Array} Array of transformed table items
     */
    transformApiResponseToTableData(apiResponse, dataType) {
        // Extract array from API response
        const itemsArray = this.processApiResponse(apiResponse, dataType);
        
        // Transform each item to table format
        const tableData = itemsArray.map(item => this.mapItemToTableData(item, dataType));
        
        return tableData;
    }

    /**
     * Extract unique organizations from table data
     * 
     * Scans the transformed table data to build a list of unique organizations
     * for filtering purposes.
     * 
     * @param {Array} tableData - Array of transformed table items
     * @returns {Array<string>} Sorted array of unique organizations with "All" prefix
     */
    extractOrganizations(tableData) {
        if (!Array.isArray(tableData)) {
            return ["All"];
        }

        const orgSet = new Set();
        
        tableData.forEach(item => {
            if (item.organization && item.organization !== "Unknown" && item.organization.trim() !== "") {
                orgSet.add(item.organization.trim());
            }
        });

        const organizations = ["All", ...Array.from(orgSet).sort()];
        
        return organizations;
    }

    /**
     * Validate data type and provide suggestions
     * 
     * Checks if a data type is valid and provides helpful error messages
     * with suggestions for valid alternatives.
     * 
     * @param {string} dataType - The data type to validate
     * @returns {Object} Validation result with isValid flag and message
     */
    validateDataType(dataType) {
        const isValid = this.isValidDataType(dataType);
        
        if (isValid) {
            return {
                isValid: true,
                message: `✅ Data type "${dataType}" is valid`
            };
        } else {
            const availableTypes = this.getAvailableDataTypes();
            return {
                isValid: false,
                message: `❌ Invalid data type: "${dataType}". Available types: ${availableTypes.join(", ")}`
            };
        }
    }

    /**
     * Get field mapping information for debugging
     * 
     * Returns the field mapping configuration for a specific data type,
     * useful for debugging data transformation issues.
     * 
     * @param {string} dataType - The data type
     * @returns {Object|null} Field mapping configuration
     */
    getFieldMappings(dataType) {
        const config = this.getDataTypeConfig(dataType);
        return config ? config.fieldMappings : null;
    }

    /**
     * Update CA (Change Action) data in table item
     * 
     * Helper method to update CA-related fields in a table item.
     * This is typically called when CA data is loaded asynchronously.
     * 
     * @param {Object} tableItem - The table item to update
     * @param {Object} caData - CA data with caNumber, caState, and caLink
     * @returns {Object} Updated table item
     */
    updateCaData(tableItem, caData) {
        if (!tableItem || !caData) {
            return tableItem;
        }

        return {
            ...tableItem,
            caNumber: caData.caNumber || tableItem.caNumber || "",
            caState: caData.caState || tableItem.caState || "",
            caLink: caData.caLink || tableItem.caLink || ""
        };
    }

    /**
     * Get data type statistics
     * 
     * Returns statistics about the available data types and their configurations.
     * Useful for debugging and monitoring.
     * 
     * @returns {Object} Statistics object
     */
    getDataTypeStatistics() {
        const types = this.getAvailableDataTypes();
        const stats = {
            totalTypes: types.length,
            types: {},
            summary: []
        };

        types.forEach(type => {
            const config = this.getDataTypeConfig(type);
            const fieldCount = Object.keys(config.fieldMappings).length;
            const apiKeyCount = config.apiKeys.length;
            
            stats.types[type] = {
                name: config.name,
                title: config.title,
                fieldCount,
                apiKeyCount,
                fields: Object.keys(config.fieldMappings)
            };
            
            stats.summary.push(`${type}: ${fieldCount} fields, ${apiKeyCount} API keys`);
        });

        return stats;
    }
}

// Create and export singleton instance
const dataTransformationService = new DataTransformationService();

export default dataTransformationService;
