/**
 * Vue 3 Composable for Drag and Drop functionality
 * Integrates with 3DX Content protocol and Release Planning framework
 */
import { ref, reactive } from "vue";

export function useDragAndDrop() {
    // Reactive state
    const isDragging = ref(false);
    const draggedElement = ref(null);
    const dragData = reactive({
        physId: null,
        itemType: null,
        itemNumber: null,
        protocol: null
    });

    /**
     * Create 3DX Content protocol data
     * @param {string} physId - Physical ID of the object
     * @param {Object} customData - Additional data to include
     * @param {Object} options - Configuration options
     * @returns {string} JSON protocol string
     */
    function createDragProtocol(physId, customData = {}, options = {}) {
        const defaultOptions = {
            widgetId: "ReleasePlanningWidget",
            envId: "DEV",
            serviceId: "ReleasePlanningService",
            contextId: "ReleasePlanningContext",
            objectType: "ChangeAction"
        };

        const config = { ...defaultOptions, ...options };
        
        const protocol = {
            "3DXContent": {
                data: [
                    {
                        id: physId,
                        type: config.objectType,
                        properties: {
                            physId,
                            widgetId: config.widgetId,
                            envId: config.envId,
                            serviceId: config.serviceId,
                            contextId: config.contextId,
                            timestamp: new Date().toISOString(),
                            ...customData
                        }
                    }
                ]
            }
        };

        const protocolString = JSON.stringify(protocol);
        
        /* eslint-disable no-console */
        console.log("🎯 Created drag protocol:", {
            physId,
            customData,
            options: config,
            protocol: protocolString
        });
        /* eslint-enable no-console */
        
        return protocolString;
    }

    /**
     * Handle drag start event
     * @param {DragEvent} event - Drag event
     * @param {string|Object} customProtocol - Custom protocol data or physId
     * @param {Object} itemData - Additional item data
     */
    function onDragStart(event, customProtocol, itemData = {}) {
        try {
            isDragging.value = true;
            draggedElement.value = event.target;
            
            let protocolData;
            
            // Handle different protocol input types
            if (typeof customProtocol === "string" && customProtocol.startsWith("{")) {
                // Already a JSON string
                protocolData = customProtocol;
            } else if (typeof customProtocol === "object") {
                // Object to stringify
                protocolData = JSON.stringify(customProtocol);
            } else {
                // Assume it's a physId, create protocol
                protocolData = createDragProtocol(customProtocol, itemData);
            }
            
            // Set drag data
            event.dataTransfer.setData("text/plain", protocolData);
            event.dataTransfer.setData("application/json", protocolData);
            event.dataTransfer.setData("3DXContent", protocolData);
            
            // Store drag data internally
            dragData.physId = itemData.physId || customProtocol;
            dragData.itemType = itemData.itemType || "unknown";
            dragData.itemNumber = itemData.itemNumber || "";
            dragData.protocol = protocolData;
            
            // Set drag effect
            event.dataTransfer.effectAllowed = "copy";
            
            // Add visual feedback
            if (event.target) {
                event.target.classList.add("dragging");
                event.target.style.opacity = "0.7";
            }
            
            /* eslint-disable no-console */
            console.log("🎯 Drag started:", {
                physId: dragData.physId,
                itemType: dragData.itemType,
                itemNumber: dragData.itemNumber,
                protocol: protocolData
            });
            /* eslint-enable no-console */
            
        } catch (error) {
            console.error("❌ Error in onDragStart:", error);
            // Reset state on error
            isDragging.value = false;
            draggedElement.value = null;
        }
    }

    /**
     * Handle drag end event
     * @param {DragEvent} event - Drag event
     */
    function onDragEnd(event) {
        try {
            isDragging.value = false;
            
            // Remove visual feedback
            if (event.target) {
                event.target.classList.remove("dragging");
                event.target.style.opacity = "";
            }
            
            /* eslint-disable no-console */
            console.log("🎯 Drag ended:", {
                physId: dragData.physId,
                itemType: dragData.itemType,
                itemNumber: dragData.itemNumber
            });
            /* eslint-enable no-console */
            
            // Reset drag data
            dragData.physId = null;
            dragData.itemType = null;
            dragData.itemNumber = null;
            dragData.protocol = null;
            draggedElement.value = null;
            
        } catch (error) {
            console.error("❌ Error in onDragEnd:", error);
        }
    }

    /**
     * Set up drag for table rows
     * @param {Array} tableData - Array of table row data
     * @param {Function} getPhysIdCallback - Function to extract physId from row data
     * @param {Function} getItemDataCallback - Function to extract additional item data
     */
    function setupTableRowDrag(tableData, getPhysIdCallback, getItemDataCallback) {
        return {
            /**
             * Apply drag attributes to table row
             * @param {Object} rowData - Row data object
             */
            getRowDragAttributes(rowData) {
                try {
                    const physId = getPhysIdCallback ? getPhysIdCallback(rowData) : rowData.physId;
                    const itemData = getItemDataCallback ? getItemDataCallback(rowData) : rowData;
                    
                    if (!physId) {
                        /* eslint-disable no-console */
                        console.warn("⚠️ No physId found for row:", rowData);
                        /* eslint-enable no-console */
                        return {};
                    }
                    
                    return {
                        draggable: "true",
                        onDragstart: event => onDragStart(event, physId, itemData),
                        onDragend: onDragEnd,
                        style: {
                            cursor: "grab"
                        },
                        class: {
                            "draggable-row": true
                        }
                    };
                } catch (error) {
                    console.error("❌ Error setting up row drag:", error);
                    return {};
                }
            }
        };
    }

    /**
     * Set up drag for chart elements
     * @param {Array} chartData - Array of chart data points
     * @param {Function} getPhysIdCallback - Function to extract physId from data point
     * @param {Function} getItemDataCallback - Function to extract additional item data
     */
    function setupChartElementDrag(chartData, getPhysIdCallback, getItemDataCallback) {
        return {
            /**
             * Apply drag attributes to chart element
             * @param {Object} elementData - Chart element data
             */
            getElementDragAttributes(elementData) {
                try {
                    const physId = getPhysIdCallback ? getPhysIdCallback(elementData) : elementData.physId;
                    const itemData = getItemDataCallback ? getItemDataCallback(elementData) : elementData;
                    
                    if (!physId) {
                        /* eslint-disable no-console */
                        console.warn("⚠️ No physId found for chart element:", elementData);
                        /* eslint-enable no-console */
                        return {};
                    }
                    
                    return {
                        draggable: "true",
                        onDragstart: event => onDragStart(event, physId, itemData),
                        onDragend: onDragEnd,
                        style: {
                            cursor: "grab"
                        },
                        class: {
                            "draggable-element": true
                        }
                    };
                } catch (error) {
                    console.error("❌ Error setting up chart element drag:", error);
                    return {};
                }
            }
        };
    }

    /**
     * Create drag attributes object for v-bind
     * @param {Object} item - Item data
     * @param {Object} options - Configuration options
     * @returns {Object} Attributes for v-bind
     */
    function createDragAttributes(item, options = {}) {
        const physId = item.physId || item.objId;
        
        if (!physId) {
            return { draggable: false };
        }

        return setupTableRowDrag(item, options);
    }

    // Return composable interface
    return {
        // State
        isDragging,
        draggedElement,
        dragData,
        
        // Core functions
        createDragProtocol,
        onDragStart,
        onDragEnd,
        
        // Helper functions
        setupTableRowDrag,
        setupChartElementDrag,
        createDragAttributes
    };
}

/**
 * Global drag and drop utilities
 */
export const dragUtils = {
    /**
     * Check if an element has valid drag protocol
     * @param {HTMLElement} element - Element to check
     * @returns {boolean} Whether element has valid protocol
     */
    hasValidProtocol(element) {
        const protocol = element?.dataset?.protocol;
        return !!(protocol && protocol.startsWith("{"));
    },

    /**
     * Extract protocol data from element
     * @param {HTMLElement} element - Element with protocol data
     * @returns {Object|null} Parsed protocol data
     */
    extractProtocol(element) {
        try {
            const protocol = element?.dataset?.protocol;
            return protocol ? JSON.parse(protocol) : null;
        } catch (error) {
            console.error("❌ Error extracting protocol:", error);
            return null;
        }
    }
};
