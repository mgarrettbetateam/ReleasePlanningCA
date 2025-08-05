<template>
    <div class="responsive-demo">
        <v-alert :type="getAlertType()" outlined dense class="mb-3">
            <div class="text-body-2">
                <strong>{{ breakpoint.toUpperCase() }} Layout Active</strong><br />
                Breakpoint: {{ getBreakpointDescription() }}
            </div>
        </v-alert>

        <v-row>
            <v-col v-for="n in getColumnCount()" :key="n" :cols="getColSize()">
                <v-card outlined>
                    <v-card-title class="pa-2 text-subtitle-2">
                        <v-icon small left>mdi-widgets</v-icon>
                        Widget {{ n }}
                    </v-card-title>
                    <v-card-text class="pa-2">
                        <div class="text-caption">
                            Responsive content for {{ breakpoint }} screen
                        </div>
                        <v-progress-linear
                            :value="(n / getColumnCount()) * 100"
                            color="primary"
                            height="4"
                            class="mt-2"
                        />
                    </v-card-text>
                </v-card>
            </v-col>
        </v-row>

        <v-divider class="my-3" />

        <v-card outlined>
            <v-card-title class="pa-2 text-subtitle-2">
                <v-icon small left>mdi-information</v-icon>
                Breakpoint Information
            </v-card-title>
            <v-card-text class="pa-2">
                <v-simple-table dense>
                    <tbody>
                        <tr>
                            <td><strong>Current:</strong></td>
                            <td>{{ breakpoint }}</td>
                        </tr>
                        <tr>
                            <td><strong>Columns:</strong></td>
                            <td>{{ getColumnCount() }}</td>
                        </tr>
                        <tr>
                            <td><strong>Col Size:</strong></td>
                            <td>{{ getColSize() }}</td>
                        </tr>
                        <tr>
                            <td><strong>Description:</strong></td>
                            <td>{{ getBreakpointDescription() }}</td>
                        </tr>
                    </tbody>
                </v-simple-table>
            </v-card-text>
        </v-card>
    </div>
</template>

<style scoped>
.responsive-demo {
    width: 100%;
}
</style>

<script>
/* eslint-disable no-magic-numbers */
export default {
    name: "ResponsiveDemo",
    props: {
        breakpoint: {
            type: String,
            default: "desktop",
            validator: value => ["mobile", "tablet", "desktop"].includes(value)
        }
    },
    methods: {
        getColumnCount() {
            const counts = {
                mobile: 1,
                tablet: 2,
                desktop: 3
            };
            return counts[this.breakpoint] || 3;
        },
        getColSize() {
            const sizes = {
                mobile: 12,
                tablet: 6,
                desktop: 4
            };
            return sizes[this.breakpoint] || 4;
        },
        getBreakpointDescription() {
            const descriptions = {
                mobile: "xs-sm (< 960px)",
                tablet: "md (960px - 1264px)",
                desktop: "lg-xl (> 1264px)"
            };
            return descriptions[this.breakpoint] || "Unknown";
        },
        getAlertType() {
            const types = {
                mobile: "warning",
                tablet: "info",
                desktop: "success"
            };
            return types[this.breakpoint] || "info";
        }
    }
};
</script>
