<!-- Simple Drag Test Component -->
<template>
    <div class="drag-test-container">
        <h2>Drag Test Component</h2>
        
        <div class="debug-section">
            <button class="debug-btn" @click="debugDragAttributes">Debug Drag Attributes</button>
            <div v-if="debugOutput" class="debug-output">
                <h4>Debug Output:</h4>
                <pre>{{ debugOutput }}</pre>
            </div>
        </div>
        
        <!-- MINIMAL TEST: Simple draggable element -->
        <div class="minimal-test">
            <h3>Minimal Drag Test</h3>
            <div 
                draggable="true" 
                class="simple-drag-item"
                style="padding: 10px; background: lightblue; border: 1px solid blue; cursor: grab; width: 200px; margin: 10px 0;"
                @dragstart="simpleHandleDragStart"
                @mousedown="simpleDragMouseDown"
                @drag="simpleDragDrag"
                @dragend="simpleDragEnd"
            >
                Drag this simple item
            </div>
        </div>
        
        <div class="test-table-container">
            <table class="test-table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Name</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    <tr 
                        v-for="item in testData" 
                        :key="item.physId"
                        :draggable="true"
                        class="test-row"
                        :style="'cursor: grab;'"
                        @click="onRowClick(item)"
                        @mousedown="onMouseDown(item)"
                        @dragstart="handleDragStart(item, $event)"
                        @dragend="handleDragEnd($event)"
                    >
                        <td>{{ item.physId }}</td>
                        <td>{{ item.name }}</td>
                        <td>{{ item.status }}</td>
                    </tr>
                </tbody>
            </table>
        </div>

        <div class="drop-zone" @drop="onDrop" @dragover="onDragOver" @dragleave="onDragLeave">
            <h3>Drop Zone</h3>
            <p v-if="!droppedData">Drag a row here to test</p>
            <div v-if="droppedData" class="dropped-data">
                <h4>Dropped:</h4>
                <pre>{{ JSON.stringify(droppedData, null, 2) }}</pre>
            </div>
        </div>
    </div>
</template>

<style scoped>
.drag-test-container {
    padding: 20px;
    max-width: 800px;
    margin: 0 auto;
}

.test-table-container {
    margin: 20px 0;
}

.debug-section {
    margin: 20px 0;
    padding: 15px;
    background-color: #f0f0f0;
    border-radius: 5px;
}

.debug-btn {
    background-color: #007cba;
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 4px;
    cursor: pointer;
}

.debug-btn:hover {
    background-color: #005c87;
}

.debug-output {
    margin-top: 15px;
    background-color: white;
    padding: 10px;
    border-radius: 4px;
    border: 1px solid #ddd;
}

.debug-output pre {
    margin: 0;
    font-size: 12px;
    overflow-x: auto;
}

.test-table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 20px;
}

.test-table th,
.test-table td {
    border: 1px solid #ddd;
    padding: 8px 12px;
    text-align: left;
}

.test-table th {
    background-color: #f5f5f5;
    font-weight: bold;
}

.test-row[draggable="true"] {
    cursor: grab;
    transition: background-color 0.2s ease;
}

.test-row[draggable="true"]:hover {
    background-color: #f0f8ff;
}

.drop-zone {
    border: 2px dashed #ccc;
    border-radius: 8px;
    padding: 20px;
    text-align: center;
    margin: 20px 0;
    min-height: 150px;
    background-color: #f9f9f9;
    transition: border-color 0.2s ease;
}

.dropped-data {
    text-align: left;
    background-color: #e8f5e8;
    padding: 15px;
    border-radius: 4px;
    border: 1px solid #d4edda;
}

.dropped-data pre {
    margin: 10px 0 0 0;
    font-size: 12px;
    overflow-x: auto;
}
</style>

<script>
import { useDragAndDrop } from "@/composables/useDragAndDrop.js";

export default {
    name: "DragTestComponent",
    data() {
        const dragDropComposable = useDragAndDrop();
        
        return {
            dragDrop: dragDropComposable,
            droppedData: null,
            debugOutput: null,
            testData: [
                { physId: "E060478075B84CB5A1C9E8E7EF9E1001", name: "Test Item 1", status: "Active", itemType: "test-item" },
                { physId: "F070589186C95DC6B2D0F9F8F0AF2002", name: "Test Item 2", status: "Pending", itemType: "test-item" },
                { physId: "G0815A0297D06ED7C3E10A098F1B0003", name: "Test Item 3", status: "Complete", itemType: "test-item" }
            ]
        };
    },
    mounted() {
        /* eslint-disable no-console */
        console.log("🚀 DragTestComponent mounted");
        console.log("📦 Test data:", this.testData);
        console.log("🛠️ Drag drop composable:", this.dragDrop);
        
        // Check DOM after Vue has rendered
        this.$nextTick(() => {
            console.log("🔍 DOM CHECK - Table rows after render:");
            const rows = this.$el.querySelectorAll(".test-row");
            rows.forEach((row, index) => {
                console.log(`Row ${index}:`, {
                    draggable: row.getAttribute("draggable"),
                    style: row.getAttribute("style"),
                    hasOnDragStart: typeof row.ondragstart,
                    classList: row.className,
                    element: row
                });
            });
        });
        /* eslint-enable no-console */
    },
    methods: {
        getRowDragAttributes(item) {
            /* eslint-disable no-console */
            console.log("🔧 getRowDragAttributes called for item:", item);
            /* eslint-enable no-console */
            
            const tableDrag = this.dragDrop.setupTableRowDrag(
                this.testData,
                // Function to extract physId from row data
                /* eslint-disable-next-line arrow-parens */
                (rowData) => {
                    /* eslint-disable no-console */
                    console.log("🔑 Extracting physId from:", rowData);
                    /* eslint-enable no-console */
                    return rowData.physId;
                },
                // Function to extract additional item data
                /* eslint-disable-next-line arrow-parens */
                (rowData) => {
                    const itemData = {
                        itemType: "test-item",
                        itemNumber: rowData.name,
                        physId: rowData.physId,
                        status: rowData.status
                    };
                    /* eslint-disable no-console */
                    console.log("📦 Extracting item data:", itemData);
                    /* eslint-enable no-console */
                    return itemData;
                }
            );
            
            const attrs = tableDrag.getRowDragAttributes(item);
            /* eslint-disable no-console */
            console.log("🎯 Final drag attributes generated:", attrs);
            console.log("🔍 Attributes breakdown:", {
                draggable: attrs.draggable,
                hasOnDragstart: typeof attrs.onDragstart === "function",
                hasOnDragend: typeof attrs.onDragend === "function",
                style: attrs.style
            });
            /* eslint-enable no-console */
            
            return attrs;
        },
        
        debugDragAttributes() {
            /* eslint-disable no-console */
            console.log("🔧 DEBUG: Testing drag attributes generation");
            /* eslint-enable no-console */
            
            const testItem = this.testData[0];
            const attrs = this.getRowDragAttributes(testItem);
            
            this.debugOutput = JSON.stringify({
                testItem,
                generatedAttributes: {
                    draggable: attrs.draggable,
                    hasOnDragstart: typeof attrs.onDragstart,
                    hasOnDragend: typeof attrs.onDragend,
                    style: attrs.style
                },
                domInspection: {
                    rowsFound: this.$el?.querySelectorAll?.(".test-row")?.length || "Not available",
                    firstRowDraggable: this.$el?.querySelector?.(".test-row")?.getAttribute?.("draggable") || "Not found"
                }
            }, null, 2);
        },
        
        onRowClick(item) {
            /* eslint-disable no-console */
            console.log("🖱️ Row clicked:", item);
            /* eslint-enable no-console */
        },
        
        onMouseDown(item) {
            /* eslint-disable no-console */
            console.log("👇 Mouse down on row:", item);
            /* eslint-enable no-console */
        },
        
        simpleDragMouseDown() {
            /* eslint-disable no-console */
            console.log("🟦 SIMPLE: Mouse down on blue box");
            /* eslint-enable no-console */
        },
        
        simpleDragDrag() {
            /* eslint-disable no-console */
            console.log("🟦 SIMPLE: Dragging blue box");
            /* eslint-enable no-console */
        },
        
        simpleDragEnd() {
            /* eslint-disable no-console */
            console.log("🟦 SIMPLE: Drag end on blue box");
            /* eslint-enable no-console */
        },
        
        simpleHandleDragStart(event) {
            /* eslint-disable no-console */
            console.log("🟦 SIMPLE DRAG START");
            console.log("📦 Event:", event);
            console.log("📋 DataTransfer:", event.dataTransfer);
            /* eslint-enable no-console */
            
            const simpleData = "SIMPLE TEST DATA - This should work!";
            
            try {
                event.dataTransfer.setData("text/plain", simpleData);
                /* eslint-disable no-console */
                console.log("✅ Simple setData successful:", simpleData);
                console.log("🔍 Types after setData:", Array.from(event.dataTransfer.types || []));
                /* eslint-enable no-console */
            } catch (error) {
                /* eslint-disable no-console */
                console.log("❌ Simple setData failed:", error);
                /* eslint-enable no-console */
            }
        },
        
        handleDragStart(item, event) {
            /* eslint-disable no-console */
            console.log("🚀 DRAG START HANDLER:", item);
            console.log("📦 Event:", event);
            console.log("📋 DataTransfer object:", event.dataTransfer);
            console.log("🔧 DataTransfer types before:", Array.from(event.dataTransfer.types || []));
            /* eslint-enable no-console */
            
            // Call the composable's onDragStart directly
            this.dragDrop.onDragStart(event, item.physId, {
                itemType: "test-item",
                itemNumber: item.name,
                physId: item.physId,
                status: item.status
            });
            
            // MANUAL TEST: Let's try setting data directly as a fallback
            const testPayload = JSON.stringify({
                protocol: "3DXContent",
                version: "1.1",
                source: "X3DSEAR_AP",
                widgetId: "preview-ac2fb2",
                manualTest: true,
                item
            });
            
            try {
                event.dataTransfer.setData("text/plain", testPayload);
                event.dataTransfer.setData("application/json", testPayload);
                event.dataTransfer.setData("3DXContent", testPayload);
                /* eslint-disable no-console */
                console.log("✅ Manual setData successful with payload:", testPayload);
                /* eslint-enable no-console */
            } catch (error) {
                /* eslint-disable no-console */
                console.log("❌ Manual setData failed:", error);
                /* eslint-enable no-console */
            }
            
            /* eslint-disable no-console */
            console.log("🔍 DataTransfer types after composable call:", Array.from(event.dataTransfer.types || []));
            
            // Let's manually check what was set
            setTimeout(() => {
                try {
                    console.log("⏱️ Manual check of dataTransfer (async):");
                    console.log("  • text/plain:", event.dataTransfer.getData("text/plain"));
                    console.log("  • application/json:", event.dataTransfer.getData("application/json"));
                    console.log("  • 3DXContent:", event.dataTransfer.getData("3DXContent"));
                } catch (error) {
                    console.log("❌ Cannot read dataTransfer after dragstart:", error.message);
                }
            }, 0);
            /* eslint-enable no-console */
        },
        
        handleDragEnd(event) {
            /* eslint-disable no-console */
            console.log("🏁 DRAG END HANDLER");
            /* eslint-enable no-console */
            
            // Call the composable's onDragEnd directly
            this.dragDrop.onDragEnd(event);
        },
        
        onDirectDragStart(item, event) {
            /* eslint-disable no-console */
            console.log("🚀 DIRECT DRAG START:", item);
            console.log("📦 Event:", event);
            /* eslint-enable no-console */
        },
        
        onDragOver(event) {
            event.preventDefault();
            event.dataTransfer.dropEffect = "copy";
            event.target.style.borderColor = "#007cba";
        },
        
        onDragLeave(event) {
            event.target.style.borderColor = "#ccc";
        },
        
        onDrop(event) {
            event.preventDefault();
            event.target.style.borderColor = "#ccc";
            
            /* eslint-disable no-console */
            console.log("📥 DROP EVENT DETAILS:");
            console.log("  • Event:", event);
            console.log("  • DataTransfer:", event.dataTransfer);
            console.log("  • Available types:", Array.from(event.dataTransfer.types || []));
            console.log("  • Files:", event.dataTransfer.files);
            /* eslint-enable no-console */
            
            // Try to get data from all available types
            let receivedData = null;
            const types = Array.from(event.dataTransfer.types || []);
            
            for (const type of types) {
                try {
                    const data = event.dataTransfer.getData(type);
                    /* eslint-disable no-console */
                    console.log(`  • ${type}:`, data);
                    /* eslint-enable no-console */
                    if (data && !receivedData) {
                        receivedData = data;
                    }
                } catch (error) {
                    /* eslint-disable no-console */
                    console.log(`  • ${type}: ERROR:`, error);
                    /* eslint-enable no-console */
                }
            }
            
            // Fallback: try common types
            if (!receivedData) {
                const fallbackTypes = ["text/plain", "application/json", "3DXContent", "text/html"];
                for (const type of fallbackTypes) {
                    try {
                        const data = event.dataTransfer.getData(type);
                        if (data) {
                            receivedData = data;
                            /* eslint-disable no-console */
                            console.log(`✅ Found data in ${type}:`, data);
                            /* eslint-enable no-console */
                            break;
                        }
                    } catch (error) {
                        // Ignore errors for fallback types
                    }
                }
            }
            
            /* eslint-disable no-console */
            console.log("📥 Final received data:", receivedData);
            /* eslint-enable no-console */
            
            if (receivedData) {
                try {
                    this.droppedData = JSON.parse(receivedData);
                } catch (error) {
                    // Not JSON, display as raw text
                    this.droppedData = { 
                        rawData: receivedData, 
                        type: "text",
                        message: "Successfully received text data"
                    };
                }
            } else {
                this.droppedData = { 
                    rawData: "", 
                    error: "No data received",
                    availableTypes: types,
                    message: "Drop event occurred but no data was transferred"
                };
            }
        }
    }
};
</script>
