/**
 * Vue 3 Composable for Drag and Drop functionality (Table Rows Only)
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
     * Create 3DX Content protocol data with exact specification
     * @param {string} physId - Physical ID of the object
     * @param {Object} customData - Additional data to include (optional)
     * @param {Object} options - Configuration options (optional)
     * @returns {string} JSON protocol string
     */
    function createDragProtocol(physId, customData = {}, options = {}) {
        const defaultOptions = {
            widgetId: "preview-ac2fb2",
            envId: "OnPremise",
            serviceId: "3DSpace",
            contextId: "",
            objectType: "VPMReference",
            source: "X3DSEAR_AP"
        };

        const config = { ...defaultOptions, ...options };
        
        const protocol = {
            protocol: "3DXContent",
            version: "1.1",
            source: config.source,
            widgetId: config.widgetId,
            data: {
                items: [
                    {
                        envId: config.envId,
                        serviceId: config.serviceId,
                        contextId: config.contextId,
                        objectId: physId,
                        objectType: config.objectType
                    }
                ]
            }
        };

        const protocolString = JSON.stringify(protocol);
        
        /* eslint-disable no-console */
        console.group("🎯 DRAG PROTOCOL CREATED");
        console.log("📋 Payload for receiving widget:", protocolString);
        console.log("📊 Structured data:", protocol);
        console.log("🔑 Key properties:", {
            physId,
            itemType: customData.itemType || "unknown",
            itemNumber: customData.itemNumber || "N/A",
            widgetSource: config.widgetId,
            protocolVersion: "1.1"
        });
        console.groupEnd();
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
            
            // Set drag data for receiving widgets
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
            console.group("🚀 ROW DRAG STARTED");
            console.log("📦 Data Transfer Object contains:");
            console.log("  • text/plain:", protocolData);
            console.log("  • application/json:", protocolData);
            console.log("  • 3DXContent:", protocolData);
            console.log("🎯 Row details:", {
                physId: dragData.physId,
                itemType: dragData.itemType,
                itemNumber: dragData.itemNumber,
                rowElement: event.target
            });
            console.log("📋 Full payload for drop target:", protocolData);
            console.log("🔍 Event target info:", {
                tagName: event.target.tagName,
                className: event.target.className,
                draggable: event.target.draggable
            });
            console.log("🎯 DRAG PAYLOAD JSON:");
            console.log(protocolData);
            console.groupEnd();
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
                        style: "cursor: grab;"
                    };
                } catch (error) {
                    console.error("❌ Error setting up row drag:", error);
                    return {};
                }
            }
        };
    }

    /**
     * Register drag listeners for table rows
     * @param {Vue.Ref} tableRef - Reference to the table element
     * @param {Function} getRowData - Function to get row data from element
     */
    function registerRowDragListeners(tableRef, getRowData) {
        /* eslint-disable no-console */
        console.log("🔧 registerRowDragListeners called", {
            tableRef: tableRef?.value,
            hasGetRowData: typeof getRowData === "function"
        });
        /* eslint-enable no-console */
        
        const processTableRows = () => {
            if (!tableRef?.value) {
                /* eslint-disable no-console */
                console.warn("⚠️ No tableRef.value found");
                /* eslint-enable no-console */
                return;
            }
            
            const tbody = tableRef.value.querySelector("tbody");
            if (!tbody) {
                /* eslint-disable no-console */
                console.warn("⚠️ No tbody found in table");
                /* eslint-enable no-console */
                return;
            }
            
            const rows = tbody.querySelectorAll("tr");
            
            /* eslint-disable no-console */
            console.log(`🔍 Found ${rows.length} table rows to make draggable`);
            /* eslint-enable no-console */
            
            rows.forEach((row, index) => {
                // Skip if already has listeners
                if (row.hasAttribute("data-drag-enabled")) {
                    /* eslint-disable no-console */
                    console.log(`⏭️ Row ${index} already has drag enabled`);
                    /* eslint-enable no-console */
                    return;
                }
                
                /* eslint-disable no-console */
                console.log(`🎯 Setting up drag for row ${index}`, row);
                /* eslint-enable no-console */
                
                // Make row draggable
                row.draggable = true;
                row.setAttribute("data-drag-enabled", "true");
                row.style.cursor = "grab";
                
                // Add drag event listeners
                /* eslint-disable-next-line arrow-parens */
                row.addEventListener("dragstart", (event) => {
                    /* eslint-disable no-console */
                    console.log(`🚀 Drag started on row ${index}`);
                    /* eslint-enable no-console */
                    
                    const rowData = getRowData ? getRowData(row, index) : {
                        physId: row.dataset.physId || `row-${index}`,
                        itemNumber: row.dataset.itemNumber || "",
                        itemType: "table-row"
                    };
                    
                    /* eslint-disable no-console */
                    console.log("📋 Row data for drag:", rowData);
                    /* eslint-enable no-console */
                    
                    onDragStart(event, rowData.physId, rowData);
                });
                
                row.addEventListener("dragend", onDragEnd);
                
                // Visual feedback for draggable rows
                row.addEventListener("mouseenter", () => {
                    if (!isDragging.value) {
                        row.style.backgroundColor = "#f5f5f5";
                        row.title = "Drag this row to another widget";
                    }
                });
                
                row.addEventListener("mouseleave", () => {
                    if (!isDragging.value) {
                        row.style.backgroundColor = "";
                    }
                });
            });
            
            /* eslint-disable no-console */
            console.log(`🎯 Enabled drag for ${rows.length} table rows`);
            /* eslint-enable no-console */
        };
        
        // Initial setup
        processTableRows();
        
        // Watch for table changes
        if (tableRef?.value) {
            const observer = new MutationObserver(processTableRows);
            observer.observe(tableRef.value, {
                childList: true,
                subtree: true
            });
            
            // Store observer for cleanup
            if (!tableRef.value._dragObserver) {
                tableRef.value._dragObserver = observer;
            }
        }
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
        
        // Table row specific functions
        setupTableRowDrag,
        registerRowDragListeners,
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
