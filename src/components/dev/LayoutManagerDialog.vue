<template>
    <v-dialog v-model="show" max-width="600">
        <v-card>
            <v-card-title>
                <v-icon left>mdi-view-dashboard</v-icon>
                Layout Manager
            </v-card-title>
            
            <v-card-text>
                <p class="text-body-2 mb-4">
                    Manage the layout and positioning of your widgets on the grid.
                </p>
                
                <v-list>
                    <v-list-item 
                        v-for="widget in widgets" 
                        :key="widget.id"
                    >
                        <v-list-item-avatar>
                            <v-icon>{{ widget.icon }}</v-icon>
                        </v-list-item-avatar>
                        
                        <v-list-item-content>
                            <v-list-item-title>{{ widget.title }}</v-list-item-title>
                            <v-list-item-subtitle>
                                Position: ({{ widget.gridX }}, {{ widget.gridY }}) 
                                Size: {{ widget.gridW }}x{{ widget.gridH }}
                            </v-list-item-subtitle>
                        </v-list-item-content>
                        
                        <v-list-item-action>
                            <v-btn 
                                icon 
                                @click="resetWidgetPosition(widget)"
                            >
                                <v-icon>mdi-restore</v-icon>
                            </v-btn>
                        </v-list-item-action>
                    </v-list-item>
                </v-list>
                
                <v-divider class="my-4" />
                
                <v-row>
                    <v-col cols="6">
                        <v-btn 
                            block 
                            @click="autoArrange"
                        >
                            <v-icon left>mdi-auto-fix</v-icon>
                            Auto Arrange
                        </v-btn>
                    </v-col>
                    <v-col cols="6">
                        <v-btn 
                            block 
                            @click="resetAllPositions"
                        >
                            <v-icon left>mdi-restore</v-icon>
                            Reset All
                        </v-btn>
                    </v-col>
                </v-row>
            </v-card-text>
            
            <v-card-actions>
                <v-spacer />
                <v-btn @click="show = false">Close</v-btn>
                <v-btn 
                    color="primary" 
                    @click="applyChanges"
                >
                    Apply
                </v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<script>
export default {
    name: "LayoutManagerDialog",
    
    props: {
        value: {
            type: Boolean,
            default: false
        },
        widgets: {
            type: Array,
            default: () => []
        }
    },
    
    computed: {
        show: {
            get() {
                return this.value;
            },
            set(value) {
                this.$emit("input", value);
            }
        }
    },
    
    methods: {
        resetWidgetPosition(widget) {
            const updatedWidget = {
                ...widget,
                gridX: 0,
                gridY: 0,
                gridW: 2,
                gridH: 2
            };
            
            this.$emit("layout-updated", [updatedWidget]);
        },
        
        autoArrange() {
            const arranged = [];
            let currentX = 0;
            let currentY = 0;
            const maxCols = 12;
            
            this.widgets.forEach(widget => {
                const w = widget.gridW || 2;
                const h = widget.gridH || 2;
                
                if (currentX + w > maxCols) {
                    currentX = 0;
                    currentY += 2; // Move to next row with spacing
                }
                
                arranged.push({
                    id: widget.id,
                    x: currentX,
                    y: currentY,
                    w,
                    h
                });
                
                currentX += w;
            });
            
            this.$emit("layout-updated", arranged);
        },
        
        resetAllPositions() {
            const WIDGETS_PER_ROW = 6;
            const reset = this.widgets.map((widget, index) => ({
                id: widget.id,
                x: (index % WIDGETS_PER_ROW) * 2,
                y: Math.floor(index / WIDGETS_PER_ROW) * 2,
                w: 2,
                h: 2
            }));
            
            this.$emit("layout-updated", reset);
        },
        
        applyChanges() {
            this.show = false;
        }
    }
};
</script>
