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
        // Create current date at midnight local time
        this.currentDate = new Date();
        this.currentDate.setHours(0, 0, 0, 0);
    }

    /**
     * Create filter configuration for UniversalFilterControls
     * @param {Object} options - Filter configuration options
     * @param {Array} options.programs - Available programs
     * @param {Array} options.phases - Available phases
     * @param {Array} options.ataChapterGroups - Available ATA Chapter groups
     * @param {Array} options.engSystemGroups - Available Engineering System groups
     * @param {Object} options.filterValues - Current filter values
     * @returns {Array} Filter configuration array
     */
    createFilterConfig({ programs = [], phases = [], ataChapterGroups = [], engSystemGroups = [], filterValues = {} }) {
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
                key: "ataChapterGroup",
                label: "ATA Chapter",
                icon: "mdi-book-open-page-variant",
                value: filterValues.ataChapterGroup,
                options: ataChapterGroups,
                clearable: false,
                placeholder: "Select ATA Chapter",
                color: "deep-orange"
            },
            {
                type: "select",
                key: "engSystemGroup",
                label: "Engineering System",
                icon: "mdi-cog-outline",
                value: filterValues.engSystemGroup,
                options: engSystemGroups,
                clearable: false,
                placeholder: "Select Engineering System",
                color: "teal"
            }
        ];

        // Note: Make/Buy and Part Type filters are now handled in a separate section
        // in the filter flyout, so they are not included in the general filter config

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

    // Apply basic filters (program, phase, ATA chapter, engineering system)
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
    * Apply basic filters (program, phase, ATA chapter, engineering system, make/buy, part type)
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

        // ATA Chapter Group filter
        if (filterValues.ataChapterGroup && filterValues.ataChapterGroup !== "All") {
            const beforeCount = filtered.length;
            filtered = filtered.filter(item => 
                (item.ataChapterGroup === filterValues.ataChapterGroup) ||
                (item.chapterGroup === filterValues.ataChapterGroup)
            );
            console.log(`  - ATA Chapter filter (${filterValues.ataChapterGroup}): ${beforeCount} -> ${filtered.length}`);
        }

        // Engineering System Group filter
        if (filterValues.engSystemGroup && filterValues.engSystemGroup !== "All") {
            const beforeCount = filtered.length;
            filtered = filtered.filter(item => 
                (item.engSystemGroup === filterValues.engSystemGroup) ||
                (item.engineeringSystemGroup === filterValues.engSystemGroup)
            );
            console.log(`  - Engineering System filter (${filterValues.engSystemGroup}): ${beforeCount} -> ${filtered.length}`);
        }

        // Make/Buy filter - only apply if filter value is set and not "All"
        if (filterValues.makeBuyFilter && filterValues.makeBuyFilter !== "All") {
            const beforeCount = filtered.length;
            filtered = filtered.filter(item => 
                item.makeBuy === filterValues.makeBuyFilter
            );
            console.log(`  - Make/Buy filter (${filterValues.makeBuyFilter}): ${beforeCount} -> ${filtered.length}`);
        }

        // Part Type filter - only apply if filter value is set and not "All"
        if (filterValues.partTypeFilter && filterValues.partTypeFilter !== "All") {
            const beforeCount = filtered.length;
            filtered = filtered.filter(item => 
                item.partType === filterValues.partTypeFilter
            );
            console.log(`  - Part Type filter (${filterValues.partTypeFilter}): ${beforeCount} -> ${filtered.length}`);
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
                    const isTargetOverdue = tgt.getTime() < currentMs && item.currentState !== "RELEASED";
                    
                    // Only include if target is overdue but not critically overdue
                    if (isTargetOverdue) {
                        const criticalDate = this.extractCriticalDate(item);
                        if (!criticalDate) return true; // No critical date, so just overdue
                        
                        const critical = new Date(criticalDate);
                        critical.setHours(0, 0, 0, 0);
                        return critical.getTime() >= currentMs; // Critical date is not overdue
                    }
                    
                    return false;
                });

            case "criticallyOverdue":
                return data.filter(item => {
                    const criticalDate = this.extractCriticalDate(item);
                    if (!criticalDate) return false;
                    
                    const critical = new Date(criticalDate);
                    critical.setHours(0, 0, 0, 0);
                    return critical.getTime() < currentMs && item.currentState !== "RELEASED";
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

            case "unreleased":
                return data.filter(item => item.currentState !== "RELEASED");
                
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
     * Extract critical date from item
     * @param {Object} item - Data item
     * @returns {string|null} Critical date string or null
     */
    extractCriticalDate(item) {
        return item.criticalRelease || 
               item.criticalReleaseDate || 
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
     * @param {Array} allData - Complete unfiltered data array for totals
     * @returns {Object} Statistics object with counts and totals for each filter type
     */
    computeStatistics(data, allData = null) {
        if (!data || data.length === 0) {
            return {
                releasedCount: 0,
                thisWeekCount: 0,
                thisWeekTotal: 0,
                nextWeekCount: 0,
                nextWeekTotal: 0,
                overdueCount: 0,
                criticallyOverdueCount: 0,
                next30DaysCount: 0,
                next30DaysTotal: 0,
                totalCount: 0
            };
        }

        // Use allData for totals if provided, otherwise use filtered data
        const totalData = allData || data;

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
            thisWeekTotal: 0,
            nextWeekCount: 0,
            nextWeekTotal: 0,
            overdueCount: 0,
            criticallyOverdueCount: 0,
            next30DaysCount: 0,
            next30DaysTotal: 0,
            totalCount: data.length
        };

        // Calculate filtered counts
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

                // This week count (filtered) - count released items in this timeframe
                if (tgtMs >= startOfWeek && tgtMs <= endOfWeek && item.currentState === "RELEASED") {
                    stats.thisWeekCount++;
                }

                // Next week count (filtered) - count released items in this timeframe
                if (tgtMs >= startNextWeek && tgtMs <= endNextWeek && item.currentState === "RELEASED") {
                    stats.nextWeekCount++;
                }

                // Check for critically overdue (critical date is past due)
                const criticalDate = this.extractCriticalDate(item);
                if (criticalDate) {
                    const critical = new Date(criticalDate);
                    critical.setHours(0, 0, 0, 0);
                    const criticalMs = critical.getTime();
                    
                    if (criticalMs < currentMs && item.currentState !== "RELEASED") {
                        stats.criticallyOverdueCount++;
                    }
                }

                // Overdue count (target date is past due, but not critically overdue)
                if (tgtMs < currentMs && item.currentState !== "RELEASED") {
                    // Only count as overdue if not already critically overdue
                    const criticalDate = this.extractCriticalDate(item);
                    if (!criticalDate || new Date(criticalDate).getTime() >= currentMs) {
                        stats.overdueCount++;
                    }
                }

                // Next 30 days count (filtered) - count released items in this timeframe
                if (tgtMs >= currentMs && tgtMs <= next30Ms && item.currentState === "RELEASED") {
                    stats.next30DaysCount++;
                }
            }
        });

        // Calculate total counts from all data
        totalData.forEach(item => {
            const targetDate = this.extractTargetDate(item);
            if (targetDate) {
                const tgt = new Date(targetDate);
                tgt.setHours(0, 0, 0, 0);
                const tgtMs = tgt.getTime();

                // This week total - count all items (released and unreleased) in timeframe
                if (tgtMs >= startOfWeek && tgtMs <= endOfWeek) {
                    stats.thisWeekTotal++;
                }

                // Next week total - count all items (released and unreleased) in timeframe
                if (tgtMs >= startNextWeek && tgtMs <= endNextWeek) {
                    stats.nextWeekTotal++;
                }

                // Next 30 days total - count all items (released and unreleased) in timeframe
                if (tgtMs >= currentMs && tgtMs <= next30Ms) {
                    stats.next30DaysTotal++;
                }
            }
        });

        console.log("📊 FilterService: Statistics computed:", {
            ...stats,
            thisWeekRatio: `${stats.thisWeekCount} released of ${stats.thisWeekTotal} total`,
            nextWeekRatio: `${stats.nextWeekCount} released of ${stats.nextWeekTotal} total`,
            next30DaysRatio: `${stats.next30DaysCount} released of ${stats.next30DaysTotal} total`
        });

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
            criticallyOverdue: "Critically Overdue",
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
