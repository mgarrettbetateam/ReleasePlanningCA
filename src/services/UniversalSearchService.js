/**
 * Universal Search Service
 * Searches across Parts, CAs, and CRs data simultaneously
 * 
 * Provides intelligent cross-domain search capabilities with:
 * - Multi-data-type searching
 * - Smart field matching
 * - Search suggestions and autocomplete
 * - Result prioritization and data type recommendations
 * 
 * @author Release Planner Team
 * @version 1.0.0
 */

/* eslint-disable no-console */

class UniversalSearchService {
    constructor() {
        // Define searchable fields for each data type
        this.searchFields = {
            parts: ["partNo", "description", "organization", "statusComment", "makeBuy", "partType", "currentState"],
            cas: ["caNumber", "changeDescription", "resEngr", "statusComment", "organization", "currentState"],
            crs: ["crNumber", "changeDescription", "owner", "statusComment", "currentState"]
        };
        
        // Field weights for relevance scoring (higher = more important)
        this.fieldWeights = {
            parts: {
                partNo: 10,
                description: 8,
                organization: 5,
                statusComment: 3,
                makeBuy: 4,
                partType: 4,
                currentState: 2
            },
            cas: {
                caNumber: 10,
                changeDescription: 8,
                resEngr: 6,
                organization: 5,
                statusComment: 3,
                currentState: 2
            },
            crs: {
                crNumber: 10,
                changeDescription: 8,
                owner: 6,
                statusComment: 3,
                currentState: 2
            }
        };
        
        // Search relevance multipliers
        this.RELEVANCE_MULTIPLIERS = {
            EXACT_MATCH: 3,
            STARTS_WITH: 2,
            CONTAINS: 1
        };
        
        // Default configuration
        this.DEFAULT_MAX_SUGGESTIONS = 8;
    }

    /**
     * Search across all data types simultaneously
     * @param {string} searchTerm - Search string
     * @param {Object} allData - { parts: [], cas: [], crs: [] }
     * @returns {Object} Search results with counts and filtered data
     */
    searchAll(searchTerm, allData) {
        console.log("🔍 Universal search started:", { searchTerm, dataAvailable: Object.keys(allData) });
        
        if (!searchTerm || searchTerm.trim().length < 2) {
            return this.getEmptyResults();
        }

        const normalizedTerm = searchTerm.toLowerCase().trim();
        
        const results = {
            searchTerm: normalizedTerm,
            originalTerm: searchTerm,
            results: {
                parts: this.searchDataType(normalizedTerm, allData.parts || [], "parts"),
                cas: this.searchDataType(normalizedTerm, allData.cas || [], "cas"),
                crs: this.searchDataType(normalizedTerm, allData.crs || [], "crs")
            },
            totalResults: 0,
            suggestedDataType: null,
            timestamp: new Date().toISOString()
        };

        // Calculate totals and suggest primary data type
        results.totalResults = 
            results.results.parts.length + 
            results.results.cas.length + 
            results.results.crs.length;

        // Suggest data type with most results
        results.suggestedDataType = this.getSuggestedDataType(results.results);

        console.log("🔍 Universal search results:", {
            searchTerm: normalizedTerm,
            partResults: results.results.parts.length,
            casResults: results.results.cas.length,
            crsResults: results.results.crs.length,
            totalResults: results.totalResults,
            suggested: results.suggestedDataType
        });

        return results;
    }

    /**
     * Search within specific data type with relevance scoring
     * @param {string} searchTerm - Normalized search term
     * @param {Array} data - Data array to search
     * @param {string} dataType - Data type (parts, cas, crs)
     * @returns {Array} Filtered and scored results
     */
    searchDataType(searchTerm, data, dataType) {
        console.log(`🔍 Searching ${dataType} data:`, {
            searchTerm,
            dataLength: data.length,
            firstItem: data[0] ? Object.keys(data[0]) : "no data",
            sampleItem: data[0]
        });
        
        // Log the actual partNo field value for the first few items
        if (dataType === "parts" && data.length > 0) {
            const SAMPLE_SIZE = 3;
            console.log("🔍 First 3 parts partNo values:", 
                data.slice(0, SAMPLE_SIZE).map(item => ({ 
                    partNo: item.partNo, 
                    allFields: Object.keys(item) 
                }))
            );
            
            // Check if A5340005-101 exists in the data
            const targetPart = data.find(item => item.partNo && item.partNo.includes("A5340005"));
            if (targetPart) {
                console.log("🔍 Found target part A5340005:", targetPart.partNo);
            } else {
                console.log("🔍 Target part A5340005 NOT found in data");
                // Show some part numbers that start with A
                const A_PARTS_SAMPLE = 5;
                const aParts = data.filter(item => item.partNo && item.partNo.toLowerCase().startsWith("a")).slice(0, A_PARTS_SAMPLE);
                console.log("🔍 Parts starting with A:", aParts.map(p => p.partNo));
            }
        }
        
        const searchFields = this.searchFields[dataType] || [];
        const fieldWeights = this.fieldWeights[dataType] || {};
        
        console.log(`🔍 Search fields for ${dataType}:`, searchFields);
        
        const results = data.filter(item => {
            // Calculate relevance score
            let relevanceScore = 0;
            let hasMatch = false;
            
            searchFields.forEach(field => {
                const value = item[field];
                if (!value) return;
                
                const fieldValue = String(value).toLowerCase();
                const weight = fieldWeights[field] || 1;
                
                // Add debug logging for partNo field
                if (field === "partNo" && fieldValue.includes(searchTerm)) {
                    console.log(`🔍 MATCH FOUND: ${fieldValue} contains ${searchTerm}`);
                }
                
                // Exact match gets full weight
                if (fieldValue === searchTerm) {
                    relevanceScore += weight * this.RELEVANCE_MULTIPLIERS.EXACT_MATCH;
                    hasMatch = true;
                }
                // Starts with gets high weight
                else if (fieldValue.startsWith(searchTerm)) {
                    relevanceScore += weight * this.RELEVANCE_MULTIPLIERS.STARTS_WITH;
                    hasMatch = true;
                }
                // Contains gets normal weight
                else if (fieldValue.includes(searchTerm)) {
                    relevanceScore += weight * this.RELEVANCE_MULTIPLIERS.CONTAINS;
                    hasMatch = true;
                }
            });
            
            // Add relevance score to item for sorting
            if (hasMatch) {
                item._searchRelevance = relevanceScore;
                item._searchTerm = searchTerm;
            }
            
            return hasMatch;
        });
        
        // Sort by relevance score (highest first)
        results.sort((a, b) => (b._searchRelevance || 0) - (a._searchRelevance || 0));
        
        console.log(`🔍 ${dataType} search results:`, {
            searchTerm,
            totalFound: results.length,
            topRelevance: results[0]?._searchRelevance || 0
        });
        
        return results;
    }

    /**
     * Determine which data type has the most results
     * @param {Object} results - Results object with parts, cas, crs arrays
     * @returns {string} Data type with highest count
     */
    getSuggestedDataType(results) {
        const counts = {
            parts: results.parts.length,
            cas: results.cas.length,
            crs: results.crs.length
        };

        // Return data type with highest count
        const sortedCounts = Object.entries(counts)
            .sort(([,a], [,b]) => b - a);
            
        return sortedCounts[0][0];
    }

    /**
     * Get search suggestions based on partial input
     * @param {string} partialTerm - Partial search term
     * @param {Object} allData - All data to extract suggestions from
     * @param {number} maxSuggestions - Maximum suggestions to return
     * @returns {Array} Array of suggestion strings
     */
    getSearchSuggestions(partialTerm, allData, maxSuggestions = this.DEFAULT_MAX_SUGGESTIONS) {
        if (!partialTerm || partialTerm.length < 1) return [];

        const suggestions = new Set();
        const normalizedTerm = partialTerm.toLowerCase();
        const suggestionsList = [];

        // Extract suggestions from all data types
        Object.entries(allData).forEach(([dataType, data]) => {
            const fields = this.searchFields[dataType] || [];
            
            data.forEach(item => {
                fields.forEach(field => {
                    const value = item[field];
                    if (!value) return;
                    
                    const stringValue = String(value);
                    const lowerValue = stringValue.toLowerCase();
                    
                    // Add exact matches and partial matches
                    if (lowerValue.includes(normalizedTerm)) {
                        // Prefer exact starts-with matches
                        if (lowerValue.startsWith(normalizedTerm)) {
                            suggestionsList.unshift({
                                value: stringValue,
                                relevance: 10,
                                dataType,
                                field
                            });
                        } else {
                            suggestionsList.push({
                                value: stringValue,
                                relevance: 5,
                                dataType,
                                field
                            });
                        }
                        
                        suggestions.add(stringValue);
                    }
                });
            });
        });

        // Sort suggestions by relevance and remove duplicates
        const uniqueSuggestions = suggestionsList
            .filter((suggestion, index, self) => 
                index === self.findIndex(s => s.value === suggestion.value)
            )
            .sort((a, b) => b.relevance - a.relevance)
            .map(s => s.value)
            .slice(0, maxSuggestions);

        console.log("💡 Search suggestions generated:", {
            partialTerm,
            suggestionsCount: uniqueSuggestions.length,
            suggestions: uniqueSuggestions
        });

        return uniqueSuggestions;
    }

    /**
     * Get empty search results structure
     * @returns {Object} Empty results object
     */
    getEmptyResults() {
        return {
            searchTerm: "",
            originalTerm: "",
            results: { parts: [], cas: [], crs: [] },
            totalResults: 0,
            suggestedDataType: null,
            timestamp: null
        };
    }

    /**
     * Validate search term
     * @param {string} searchTerm - Search term to validate
     * @returns {Object} Validation result
     */
    validateSearchTerm(searchTerm) {
        const result = {
            isValid: true,
            errors: [],
            warnings: []
        };

        if (!searchTerm || typeof searchTerm !== "string") {
            result.isValid = false;
            result.errors.push("Search term must be a non-empty string");
            return result;
        }

        const trimmed = searchTerm.trim();
        
        if (trimmed.length < 2) {
            result.isValid = false;
            result.errors.push("Search term must be at least 2 characters long");
        }

        if (trimmed.length > 100) {
            result.warnings.push("Search term is very long and may not return optimal results");
        }

        return result;
    }

    /**
     * Clear search relevance metadata from results
     * @param {Array} results - Search results array
     * @returns {Array} Cleaned results
     */
    cleanSearchMetadata(results) {
        return results.map(item => {
            const cleaned = { ...item };
            delete cleaned._searchRelevance;
            delete cleaned._searchTerm;
            return cleaned;
        });
    }
}

// Create and export singleton instance
const universalSearchService = new UniversalSearchService();

export default universalSearchService;
