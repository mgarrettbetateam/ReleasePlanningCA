// Test file to verify imports work
try {
    console.log("Testing imports...");
    
    const ApiService = require('./src/services/ApiService.js');
    console.log("✅ ApiService imported successfully");
    
    const UniversalDataService = require('./src/services/UniversalDataService.js');
    console.log("✅ UniversalDataService imported successfully");
    
    console.log("All imports working correctly!");
} catch (error) {
    console.error("❌ Import error:", error.message);
}
