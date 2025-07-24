/**
 * Filter Service - Centralized filtering logic for Release Planning components
 * 
 * This service extracts all filtering logic from ReleasePlannerWidget to:
 * - Manage filter configurations
 * - Apply various filter types (program, phase, organization, status)
 * - Handle statistical filters (released, this week, next week, overdue, etc.)
 * - Compute date ranges for time-based filters
 * - Provide a clean API for filter operations
 */

/* eslint-disable no-console */

export class FilterService {
    constructor() {
        this.currentDate = new Date();
        this.currentDate.setHours(0, 0, 0, 0);
    }

    /**
     * Create filter configuration for UniversalFilterControls
     * @param {Object} options - Filter configuration options
     * @param {Array} options.programs - Available programs
     * @param {Array} options.phases - Available phases
     * @param {Array} options.organizations - Available organizations
     * @param {Array} options.makeBuyOptions - Available Make/Buy values (PARTS only)
     * @param {Object} options.filterValues - Current filter values
     * @param {string} options.currentDataType - Current data type (parts, cas, crs)
     * @returns {Array} Filter configuration array
     */
    createFilterConfig({ programs = [], phases = [], organizations = [], makeBuyOptions = [], filterValues = {}, currentDataType = null }) {
        const baseConfig = [
            {
                type: "select",
                key: "program",
                label: "Program",
                icon: "mdi-application",
                value: filterValues.program,
                options: programs,
                clearable: true,
                placeholder: "Select Program",
                color: "primary"
            },
            {
                type: "select",
                key: "phase",
                label: "Phase",
                icon: "mdi-timeline",
                value: filterValues.phase,
                options: phases,
                clearable: true,
                placeholder: "Select Phase",
                color: "secondary"
            },
            {
                type: "select",
                key: "organization", 
                label: "Organization",
                icon: "mdi-domain",
                value: filterValues.organization,
                options: organizations,
                clearable: false,
                placeholder: "Select Organization",
                color: "info"
            }
        ];

        // Add Make/Buy filter only for PARTS data type
        if (currentDataType === "parts") {
            baseConfig.push({
                type: "select",
                key: "makeBuyFilter",
                label: "Make / Buy",
                icon: "mdi-factory",
                value: filterValues.makeBuyFilter,
                options: makeBuyOptions,
                clearable: false,
                placeholder: "Select Make / Buy",
                color: "warning"
            });
        }

        return baseConfig;
    }    /**
     * Apply all filters to table data
     * @param {Array} tableData - Raw table data
     * @param {Object} filterValues - Filter values (program, phase, organization)
     * @param {string} selectedStatFilter - Statistical filter type
     * @returns {Array} Filtered data
     */
    applyAllFilters(tableData, filterValues = {}, selectedStatFilter = "all") {
        console.log("🔍 FilterService: Applying all filters");
        console.log("  - Input data length:", tableData?.length || 0);
        console.log("  - Filter values:", filterValues);
        console.log("  - Stat filter:", selectedStatFilter);

        if (!tableData || tableData.length === 0) {
            console.log("❌ FilterService: No table data available");
            return [];
        }

        let filtered = [...tableData];

        // Apply basic filters (program, phase, organization)
        filtered = this.applyBasicFilters(filtered, filterValues);

        // Apply statistical filter
        if (selectedStatFilter && selectedStatFilter !== "all") {
            const beforeCount = filtered.length;
            filtered = this.applyStatisticalFilter(filtered, selectedStatFilter);
            console.log(`  - Statistical filter (${selectedStatFilter}): ${beforeCount} -> ${filtered.length}`);
        }

        console.log("🔍 FilterService: Final filtered data length:", filtered.length);
        return filtered;
    }

    /**
     * Apply basic filters (program, phase, organization)
     * @param {Array} data - Data to filter
     * @param {Object} filterValues - Filter values
     * @returns {Array} Filtered data
     */
    applyBasicFilters(data, filterValues) {
        let filtered = [...data];

        // Program filter
        if (filterValues.program && filterValues.program !== "") {
            const beforeCount = filtered.length;
            const wouldMatch = filtered.some(item => 
                item.program === filterValues.program ||
                item.organization === filterValues.program
            );
            
            if (wouldMatch) {
                filtered = filtered.filter(item => 
                    item.program === filterValues.program ||
                    item.organization === filterValues.program
                );
                console.log(`  - Program filter (${filterValues.program}): ${beforeCount} -> ${filtered.length}`);
            } else {
                console.log(`  - ⚠️ Skipping program filter - no matches: ${filterValues.program}`);
            }
        }

        // Phase filter
        if (filterValues.phase && filterValues.phase !== "") {
            const beforeCount = filtered.length;
            const wouldMatch = filtered.some(item => 
                item.phase === filterValues.phase ||
                item.currentState === filterValues.phase
            );
            
            if (wouldMatch) {
                filtered = filtered.filter(item => 
                    item.phase === filterValues.phase ||
                    item.currentState === filterValues.phase
                );
                console.log(`  - Phase filter (${filterValues.phase}): ${beforeCount} -> ${filtered.length}`);
            } else {
                console.log(`  - ⚠️ Skipping phase filter - no matches: ${filterValues.phase}`);
            }
        }

        // Organization filter
        if (filterValues.organization && filterValues.organization !== "All") {
            const beforeCount = filtered.length;
            filtered = filtered.filter(item => 
                item.organization === filterValues.organization
            );
            console.log(`  - Organization filter (${filterValues.organization}): ${beforeCount} -> ${filtered.length}`);
        }

        // Make/Buy filter - only apply if filter value is set and not "All"
        if (filterValues.makeBuyFilter && filterValues.makeBuyFilter !== "All") {
            const beforeCount = filtered.length;
            filtered = filtered.filter(item => 
                item.makeBuy === filterValues.makeBuyFilter
            );
            console.log(`  - Make/Buy filter (${filterValues.makeBuyFilter}): ${beforeCount} -> ${filtered.length}`);
        }

        return filtered;
    }

    /**
     * Apply statistical filter based on release status and dates
     * @param {Array} data - Data to filter
     * @param {string} filterType - Type of statistical filter
     * @returns {Array} Filtered data
     */
    applyStatisticalFilter(data, filterType) {
        const currentMs = this.currentDate.getTime();
        
        switch (filterType) {
            case "released":
                return data.filter(item => item.currentState === "RELEASED");
                
            case "thisWeek": {
                const [startOfWeek, endOfWeek] = this.getCurrentWeekRange(this.currentDate);
                return data.filter(item => {
                    const targetDate = this.extractTargetDate(item);
                    if (!targetDate) return false;
                    
                    const tgt = new Date(targetDate);
                    tgt.setHours(0, 0, 0, 0);
                    const tgtMs = tgt.getTime();
                    return tgtMs >= startOfWeek && tgtMs <= endOfWeek;
                });
            }
                
            case "nextWeek": {
                const [startNextWeek, endNextWeek] = this.getNextWeekRange(this.currentDate);
                return data.filter(item => {
                    const targetDate = this.extractTargetDate(item);
                    if (!targetDate) return false;
                    
                    const tgt = new Date(targetDate);
                    tgt.setHours(0, 0, 0, 0);
                    const tgtMs = tgt.getTime();
                    return tgtMs >= startNextWeek && tgtMs <= endNextWeek;
                });
            }
                
            case "overdue":
                return data.filter(item => {
                    const targetDate = this.extractTargetDate(item);
                    if (!targetDate) return false;
                    
                    const tgt = new Date(targetDate);
                    tgt.setHours(0, 0, 0, 0);
                    return tgt.getTime() < currentMs && item.currentState !== "RELEASED";
                });
                
            case "next30Days": {
                const DAYS_IN_30 = 30;
                const next30 = new Date(this.currentDate);
                next30.setDate(next30.getDate() + DAYS_IN_30);
                const next30Ms = next30.getTime();
                
                return data.filter(item => {
                    const targetDate = this.extractTargetDate(item);
                    if (!targetDate) return false;
                    
                    const tgt = new Date(targetDate);
                    tgt.setHours(0, 0, 0, 0);
                    const tgtMs = tgt.getTime();
                    return tgtMs >= currentMs && tgtMs <= next30Ms;
                });
            }
                
            case "all":
            default:
                return data;
        }
    }

    /**
     * Extract target date from item based on data type patterns
     * @param {Object} item - Data item
     * @returns {string|null} Target date string or null
     */
    extractTargetDate(item) {
        return item.tgtRelease || 
               item.targetReleaseDate || 
               item.dueDate || 
               null;
    }

    /**
     * Get current week date range (Monday to Sunday)
     * @param {Date} date - Reference date
     * @returns {Array} [startOfWeek, endOfWeek] in milliseconds
     */
    getCurrentWeekRange(date) {
        const current = new Date(date);
        const SUNDAY = 0;
        const MONDAY = 1;
        const DAYS_IN_WEEK = 7;
        const DAYS_FROM_SUNDAY_TO_MONDAY = -6;
        const END_OF_DAY_HOUR = 23;
        const END_OF_DAY_MINUTE = 59;
        const END_OF_DAY_SECOND = 59;
        const END_OF_DAY_MILLISECOND = 999;
        
        // Get Monday of current week
        const dayOfWeek = current.getDay();
        const daysToMonday = dayOfWeek === SUNDAY ? DAYS_FROM_SUNDAY_TO_MONDAY : MONDAY - dayOfWeek;
        
        const startOfWeek = new Date(current);
        startOfWeek.setDate(current.getDate() + daysToMonday);
        startOfWeek.setHours(0, 0, 0, 0);
        
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + DAYS_IN_WEEK - 1);
        endOfWeek.setHours(END_OF_DAY_HOUR, END_OF_DAY_MINUTE, END_OF_DAY_SECOND, END_OF_DAY_MILLISECOND);
        
        return [startOfWeek.getTime(), endOfWeek.getTime()];
    }

    /**
     * Get next week date range (Monday to Sunday)
     * @param {Date} date - Reference date
     * @returns {Array} [startOfNextWeek, endOfNextWeek] in milliseconds
     */
    getNextWeekRange(date) {
        const DAYS_IN_WEEK = 7;
        const END_OF_DAY_HOUR = 23;
        const END_OF_DAY_MINUTE = 59;
        const END_OF_DAY_SECOND = 59;
        const END_OF_DAY_MILLISECOND = 999;
        const [startOfThisWeek] = this.getCurrentWeekRange(date);
        
        const startOfNextWeek = new Date(startOfThisWeek);
        startOfNextWeek.setDate(startOfNextWeek.getDate() + DAYS_IN_WEEK);
        
        const endOfNextWeek = new Date(startOfNextWeek);
        endOfNextWeek.setDate(startOfNextWeek.getDate() + DAYS_IN_WEEK - 1);
        endOfNextWeek.setHours(END_OF_DAY_HOUR, END_OF_DAY_MINUTE, END_OF_DAY_SECOND, END_OF_DAY_MILLISECOND);
        
        return [startOfNextWeek.getTime(), endOfNextWeek.getTime()];
    }

    /**
     * Compute statistics for filtered data
     * @param {Array} data - Filtered data array
     * @returns {Object} Statistics object with counts for each filter type
     */
    computeStatistics(data) {
        if (!data || data.length === 0) {
            return {
                releasedCount: 0,
                thisWeekCount: 0,
                nextWeekCount: 0,
                overdueCount: 0,
                next30DaysCount: 0,
                totalCount: 0
            };
        }

        const currentMs = this.currentDate.getTime();
        const [startOfWeek, endOfWeek] = this.getCurrentWeekRange(this.currentDate);
        const [startNextWeek, endNextWeek] = this.getNextWeekRange(this.currentDate);
        
        const DAYS_IN_30 = 30;
        const next30 = new Date(this.currentDate);
        next30.setDate(next30.getDate() + DAYS_IN_30);
        const next30Ms = next30.getTime();

        const stats = {
            releasedCount: 0,
            thisWeekCount: 0,
            nextWeekCount: 0,
            overdueCount: 0,
            next30DaysCount: 0,
            totalCount: data.length
        };

        data.forEach(item => {
            // Released count
            if (item.currentState === "RELEASED") {
                stats.releasedCount++;
            }

            const targetDate = this.extractTargetDate(item);
            if (targetDate) {
                const tgt = new Date(targetDate);
                tgt.setHours(0, 0, 0, 0);
                const tgtMs = tgt.getTime();

                // This week count
                if (tgtMs >= startOfWeek && tgtMs <= endOfWeek) {
                    stats.thisWeekCount++;
                }

                // Next week count
                if (tgtMs >= startNextWeek && tgtMs <= endNextWeek) {
                    stats.nextWeekCount++;
                }

                // Overdue count
                if (tgtMs < currentMs && item.currentState !== "RELEASED") {
                    stats.overdueCount++;
                }

                // Next 30 days count
                if (tgtMs >= currentMs && tgtMs <= next30Ms) {
                    stats.next30DaysCount++;
                }
            }
        });

        console.log("📊 FilterService: Statistics computed:", stats);
        return stats;
    }

    /**
     * Get display name for filter type
     * @param {string} filterType - Filter type key
     * @returns {string} Human-readable filter name
     */
    getFilterDisplayName(filterType) {
        const displayNames = {
            all: "Items",
            released: "Released",
            thisWeek: "This Week",
            nextWeek: "Next Week",
            overdue: "Overdue",
            next30Days: "Next 30 Days"
        };
        return displayNames[filterType] || "Items";
    }

    /**
     * Validate and normalize date string
     * @param {string} dateStr - Date string to validate
     * @returns {Date|null} Valid date object or null
     */
    validateDate(dateStr) {
        if (!dateStr || dateStr === "N/A" || dateStr === null || dateStr === "") {
            return null;
        }
        try {
            const dateObj = new Date(dateStr);
            return !isNaN(dateObj.getTime()) ? dateObj : null;
        } catch (error) {
            console.warn("FilterService: Invalid date format:", dateStr);
            return null;
        }
    }
}

// Export singleton instance
export const filterService = new FilterService();
export default filterService;
