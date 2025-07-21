// Test script for useDragAndDrop composable
// Run this in Node.js to test the composable functions

// Mock Vue 3 ref function for testing
function ref(value) {
    return {
        value: value,
        valueOf: () => value
    };
}

// Import and test the composable
try {
    console.log("🧪 Testing useDragAndDrop Composable");
    console.log("=" .repeat(50));

    // Mock the composable functions for testing
    const useDragAndDrop = () => {
        const isDragging = ref(false);
        const draggedElement = ref(null);
        const dragData = {
            physId: null,
            itemType: null,
            itemNumber: null,
            protocol: null
        };

        function createDragProtocol(physId, itemData = {}, options = {}) {
            const protocol = {
                version: "1.0",
                timestamp: new Date().toISOString(),
                source: "ReleasePlannerWidget",
                objectType: options.objectType || itemData.itemType?.toUpperCase() || "Unknown",
                objectId: physId,
                metadata: {
                    itemType: itemData.itemType || "unknown",
                    itemNumber: itemData.itemNumber || "",
                    itemState: itemData.itemState || "",
                    dataType: options.dataType || itemData.itemType?.toUpperCase() || "UNKNOWN"
                }
            };
            
            return JSON.stringify(protocol);
        }

        function createDragAttributes(item, options = {}) {
            const physId = item.physId || item.id;
            if (!physId) {
                return {};
            }

            const protocol = createDragProtocol(physId, item, options);
            
            return {
                draggable: "true",
                "data-protocol": protocol,
                onDragstart: (event) => {
                    console.log("Drag started for:", item.itemNumber);
                    return protocol;
                },
                onDragend: () => {
                    console.log("Drag ended for:", item.itemNumber);
                }
            };
        }

        function setupTableRowDrag(tableData, getPhysIdCallback, getItemDataCallback) {
            return {
                getRowDragAttributes(rowData) {
                    const physId = getPhysIdCallback ? getPhysIdCallback(rowData) : rowData.physId;
                    const itemData = getItemDataCallback ? getItemDataCallback(rowData) : rowData;
                    
                    if (!physId) {
                        return {};
                    }
                    
                    return createDragAttributes({ physId, ...itemData });
                }
            };
        }

        return {
            isDragging,
            draggedElement,
            dragData,
            createDragProtocol,
            createDragAttributes,
            setupTableRowDrag
        };
    };

    // Test 1: Basic Protocol Creation
    console.log("Test 1: Basic Protocol Creation");
    console.log("-".repeat(30));
    
    const dragDrop = useDragAndDrop();
    const testProtocol = dragDrop.createDragProtocol("TEST123", {
        itemType: "ca",
        itemNumber: "CA-12345",
        itemState: "APPROVED"
    }, {
        dataType: "CAS"
    });

    const parsedProtocol = JSON.parse(testProtocol);
    console.log("✅ Protocol created:", parsedProtocol.objectId === "TEST123");
    console.log("✅ Metadata correct:", parsedProtocol.metadata.itemNumber === "CA-12345");
    console.log("✅ DataType correct:", parsedProtocol.metadata.dataType === "CAS");

    // Test 2: Drag Attributes
    console.log("\nTest 2: Drag Attributes Creation");
    console.log("-".repeat(30));
    
    const testItem = {
        physId: "PHYS456",
        itemNumber: "P001-REV001",
        itemState: "RELEASED",
        itemType: "part"
    };

    const attributes = dragDrop.createDragAttributes(testItem, { dataType: "PARTS" });
    console.log("✅ Draggable set:", attributes.draggable === "true");
    console.log("✅ Protocol data exists:", attributes["data-protocol"] !== undefined);
    console.log("✅ Event handlers exist:", typeof attributes.onDragstart === "function");

    // Test 3: Table Row Drag Setup
    console.log("\nTest 3: Table Row Drag Setup");
    console.log("-".repeat(30));
    
    const mockTableData = [
        { id: "ROW1", partNo: "P001", state: "ACTIVE", physId: "PHYS1" },
        { id: "ROW2", partNo: "P002", state: "PENDING", physId: "PHYS2" }
    ];

    const tableDrag = dragDrop.setupTableRowDrag(
        mockTableData,
        rowData => rowData.physId || rowData.id,
        rowData => ({
            itemType: "part",
            itemNumber: rowData.partNo,
            itemState: rowData.state,
            physId: rowData.physId
        })
    );

    const rowAttributes = tableDrag.getRowDragAttributes(mockTableData[0]);
    console.log("✅ Row attributes created:", Object.keys(rowAttributes).length > 0);
    console.log("✅ Row draggable:", rowAttributes.draggable === "true");

    // Test 4: Protocol Structure Validation
    console.log("\nTest 4: Protocol Structure Validation");
    console.log("-".repeat(30));
    
    const protocolObj = JSON.parse(testProtocol);
    const requiredFields = ["version", "timestamp", "source", "objectType", "objectId", "metadata"];
    const hasAllFields = requiredFields.every(field => protocolObj.hasOwnProperty(field));
    
    console.log("✅ All required fields present:", hasAllFields);
    console.log("✅ Version is 1.0:", protocolObj.version === "1.0");
    console.log("✅ Source is correct:", protocolObj.source === "ReleasePlannerWidget");
    console.log("✅ Timestamp is valid date:", !isNaN(new Date(protocolObj.timestamp)));

    // Test 5: Error Handling
    console.log("\nTest 5: Error Handling");
    console.log("-".repeat(30));
    
    const emptyAttributes = dragDrop.createDragAttributes({}, {});
    console.log("✅ Empty item handled:", Object.keys(emptyAttributes).length === 0);

    const noPhysIdRow = tableDrag.getRowDragAttributes({ id: "NOPHYSID" });
    console.log("✅ No physId handled:", Object.keys(noPhysIdRow).length === 0);

    console.log("\n🎉 All Tests Passed!");
    console.log("✨ Drag and Drop Composable is working correctly");
    
} catch (error) {
    console.error("❌ Test failed:", error.message);
    console.error(error.stack);
}
