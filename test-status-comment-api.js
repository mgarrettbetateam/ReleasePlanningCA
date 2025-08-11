/**
 * Status Comment API Test Script
 * Test the new status comment update functionality
 */

// Test console message
console.log("🧪 Testing Status Comment API Implementation");

// Test if ApiService is available
if (window.ApiService || (typeof ApiService !== "undefined")) {
    console.log("✅ ApiService available for testing");
} else {
    console.log("❌ ApiService not found globally, checking import in components");
}

// Test function to simulate status comment update
async function testStatusCommentUpdate() {
    console.log("🔧 Testing status comment update...");
    
    try {
        // Test data
        const testData = {
            objectId: "TEST-001",
            statusComment: "Test comment from API - " + new Date().toISOString(),
            itemType: "parts"
        };
        
        console.log("📝 Test data:", testData);
        
        // This would normally be called through the StatusCommentDisplay component
        // But we can test the API directly if available
        if (typeof ApiService !== "undefined") {
            const response = await ApiService.updateStatusComment(
                testData.objectId,
                testData.statusComment,
                testData.itemType
            );
            
            console.log("✅ Test API response:", response);
            return response;
        } else {
            console.log("📝 ApiService not available for direct testing");
            console.log("🔍 Testing will occur through component interactions");
        }
        
    } catch (error) {
        console.error("❌ Test failed:", error);
        return { error: error.message };
    }
}

// Test different item types
async function testAllItemTypes() {
    console.log("🧪 Testing all item types...");
    
    const itemTypes = ["parts", "cas", "crs"];
    const results = {};
    
    for (const itemType of itemTypes) {
        console.log(`🔧 Testing ${itemType}...`);
        
        try {
            const testData = {
                objectId: `TEST-${itemType.toUpperCase()}-001`,
                statusComment: `Test ${itemType} comment - ${new Date().toISOString()}`,
                itemType: itemType
            };
            
            if (typeof ApiService !== "undefined") {
                const response = await ApiService.updateStatusComment(
                    testData.objectId,
                    testData.statusComment,
                    testData.itemType
                );
                
                results[itemType] = {
                    success: true,
                    response: response
                };
                
                console.log(`✅ ${itemType} test passed:`, response);
            } else {
                results[itemType] = {
                    success: false,
                    message: "ApiService not available"
                };
            }
            
        } catch (error) {
            results[itemType] = {
                success: false,
                error: error.message
            };
            console.error(`❌ ${itemType} test failed:`, error);
        }
        
        // Add delay between tests
        await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    console.log("🎯 All item type tests completed:", results);
    return results;
}

// Check if components are properly connected
function checkComponentIntegration() {
    console.log("🔍 Checking component integration...");
    
    // Check if ReleasePlannerWidget has handleCommentUpdate method
    const widgets = document.querySelectorAll("[data-widget-type='release-planner']");
    console.log(`📊 Found ${widgets.length} release planner widgets`);
    
    // Check if StatusCommentDisplay components exist
    const commentDisplays = document.querySelectorAll(".status-comment-display");
    console.log(`💬 Found ${commentDisplays.length} status comment displays`);
    
    // Check for click handlers
    const commentCells = document.querySelectorAll(".comment-cell");
    console.log(`🖱️ Found ${commentCells.length} comment cells`);
    
    return {
        widgets: widgets.length,
        commentDisplays: commentDisplays.length,
        commentCells: commentCells.length
    };
}

// Main test execution
console.log("🚀 Starting Status Comment API Tests...");

// Test component integration
const integration = checkComponentIntegration();
console.log("📊 Component integration status:", integration);

// Export test functions for manual execution
window.statusCommentTests = {
    testStatusCommentUpdate,
    testAllItemTypes,
    checkComponentIntegration
};

console.log("🎯 Status Comment API test setup complete!");
console.log("💡 Run tests manually:");
console.log("  - statusCommentTests.testStatusCommentUpdate()");
console.log("  - statusCommentTests.testAllItemTypes()");
console.log("  - statusCommentTests.checkComponentIntegration()");
