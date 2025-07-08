<!-- Universal Filter Controls - Reusable filter component -->
<template>
    <v-card class="filter-controls-card" outlined elevation="2">
        <v-card-title class="filter-section-header">
            <v-icon left color="primary" size="24">mdi-filter-variant</v-icon>
            <span class="filter-title">{{ title }}</span>
            <v-spacer />
            <v-chip 
                color="primary" 
                small
                outlined
                class="filter-chip"
            >
                <v-icon small left>mdi-tune</v-icon>
                {{ activeFilterCount }} Active
            </v-chip>
        </v-card-title>
        
        <v-card-subtitle class="filter-subtitle">
            {{ subtitle }}
        </v-card-subtitle>
        
        <v-card-text class="filter-content">
            <!-- Filter Controls Grid -->
            <v-container fluid class="pa-0">
                <v-row no-gutters class="filter-row flexible-filters">
                    <v-col 
                        v-for="filter in filters"
                        :key="filter.key"
                        class="filter-col flex-dropdown"
                    >
                        <div class="filter-group">
                            <label class="filter-label">
                                <v-icon small class="mr-1">{{ filter.icon }}</v-icon>
                                {{ filter.label }}
                            </label>
                            <v-select
                                :value="filterValues[filter.key]"
                                :items="filter.options"
                                :placeholder="filter.placeholder"
                                dense
                                outlined
                                hide-details
                                clearable
                                class="filter-select compact-select"
                                @change="handleFilterChange(filter.key, $event)"
                            />
                        </div>
                    </v-col>
                </v-row>
            </v-container>

            <!-- Current Filter Summary -->
            <v-expand-transition>
                <div v-if="showSummary && hasActiveFilters" class="filter-summary-section">
                    <v-divider class="my-3" />
                    <div class="filter-summary-content">
                        <v-icon small color="info" class="mr-2">mdi-information</v-icon>
                        <span class="summary-text">
                            <strong>Active Filters:</strong>
                            <v-chip
                                v-for="filter in activeFiltersDisplay"
                                :key="filter.key"
                                small
                                :color="filter.color"
                                outlined
                                class="mx-1"
                            >
                                <v-icon small left>{{ filter.icon }}</v-icon>
                                {{ filter.value }}
                            </v-chip>
                        </span>
                    </div>
                </div>
            </v-expand-transition>
        </v-card-text>
    </v-card>
</template>

<style scoped>
/* All styles moved to BetaStyles.css */
</style>

<script>
export default {
    name: "UniversalFilterControls",
    props: {
        /**
         * Title for the filter controls section
         */
        title: {
            type: String,
            default: "Filter Controls"
        },
        
        /**
         * Subtitle for the filter controls section
         */
        subtitle: {
            type: String,
            default: "Select your criteria to view data"
        },
        
        /**
         * Array of filter configurations
         * Each filter should have: key, label, icon, placeholder, options, color
         */
        filters: {
            type: Array,
            required: true,
            validator(filters) {
                return filters.every(filter => 
                    filter.key && 
                    filter.label && 
                    filter.icon && 
                    Array.isArray(filter.options)
                );
            }
        },
        
        /**
         * Object containing current filter values
         */
        filterValues: {
            type: Object,
            required: true
        },
        
        /**
         * Whether to show the filter summary section
         */
        showSummary: {
            type: Boolean,
            default: true
        }
    },
    
    computed: {
        activeFilterCount() {
            return this.filters.reduce((count, filter) => {
                const value = this.filterValues[filter.key];
                const isActive = value && 
                    value !== "" && 
                    value !== "All" && 
                    value !== null && 
                    value !== undefined;
                return count + (isActive ? 1 : 0);
            }, 0);
        },
        
        hasActiveFilters() {
            return this.activeFilterCount > 0;
        },
        
        activeFiltersDisplay() {
            return this.filters
                .map(filter => {
                    const value = this.filterValues[filter.key];
                    const isActive = value && 
                        value !== "" && 
                        value !== "All" && 
                        value !== null && 
                        value !== undefined;
                    
                    if (isActive) {
                        return {
                            key: filter.key,
                            value,
                            icon: filter.icon,
                            color: filter.color || "primary"
                        };
                    }
                    return null;
                })
                .filter(filter => filter !== null);
        }
    },
    
    methods: {
        handleFilterChange(filterKey, value) {
            this.$emit("filter-change", {
                key: filterKey,
                value,
                allFilters: {
                    ...this.filterValues,
                    [filterKey]: value
                }
            });
        }
    }
};
</script>
