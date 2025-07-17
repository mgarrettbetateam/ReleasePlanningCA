// Test script to handle control characters in JSON
const testJsonWithControlChars = `{ "CAs": [{"name": "CA-00000268", "revision": "-", "changeSummary": "Test-Do Not Send To Plex", "targetReleaseDate": "7/16/2025", "actualReleaseDate": "", "currentState": "Prepare", "organization": "Beta Technologies", "respEngr": "nghaffari", "caNumber": "CA-00000268", "approvedDate": "", "statusComment": "[2025-07-16] nghaffari: Waiting on Bill to do his job!
- ETA: 2025-07-18", "physId": "60FA60230001231C6317AA730018F179"}] }`;

// Mock the log function
const log = (...args) => console.log("[Test]", ...args);

// Updated processApiResponse function with control character handling
function processApiResponse(rawData, itemType) {
    log("🔄 Processing API response:", {
        itemType,
        rawDataType: typeof rawData,
        isArray: Array.isArray(rawData),
        dataLength: typeof rawData === "string" ? rawData.length : (Array.isArray(rawData) ? rawData.length : "Not applicable")
    });
    
    // If it's already an array, return it
    if (Array.isArray(rawData)) {
        log("✅ Data is already an array, returning as-is");
        return rawData;
    }
    
    // If it's a string, try to parse it as JSON
    if (typeof rawData === "string") {
        log("⚠️ Data is a string, attempting JSON parsing");
        try {
            // Clean the string first to handle control characters
            const cleanedData = rawData
                .replace(/\r\n/g, "\\n")    // Replace actual newlines with escaped newlines
                .replace(/\n/g, "\\n")      // Replace line feeds with escaped newlines
                .replace(/\r/g, "\\r")      // Replace carriage returns with escaped carriage returns
                .replace(/\t/g, "\\t")      // Replace tabs with escaped tabs
                .replace(/\f/g, "\\f")      // Replace form feeds with escaped form feeds
                .replace(/\b/g, "\\b")      // Replace backspaces with escaped backspaces
                .replace(/\v/g, "\\v");     // Replace vertical tabs with escaped vertical tabs
            
            log("🧹 Cleaned data sample:", cleanedData.substring(0, 200));
            
            const parsed = JSON.parse(cleanedData);
            log("✅ Successfully parsed JSON string");
            return processApiResponse(parsed, itemType); // Recursively process the parsed data
        } catch (error) {
            log("❌ Failed to parse JSON string:", error.message);
            const sampleLength = 500;
            log("Raw data sample:", rawData.substring(0, sampleLength));
            return []; // Return empty array if parsing fails
        }
    }
    
    // If it's an object, try to extract the relevant array
    if (rawData && typeof rawData === "object") {
        log("🔍 Data is an object, looking for array fields");
        
        // Define possible keys based on item type
        const possibleKeys = {
            parts: ["parts", "Parts", "items", "data"],
            cas: ["CAs", "cas", "changeActions", "items", "data"],
            crs: ["CRs", "crs", "changeRequests", "items", "data"]
        };
        
        const keysToTry = possibleKeys[itemType] || possibleKeys.parts;
        
        log(`Trying keys: ${keysToTry.join(", ")}`);
        log(`Available keys: ${Object.keys(rawData).join(", ")}`);
        
        // Try each possible key
        for (const key of keysToTry) {
            if (rawData[key] && Array.isArray(rawData[key])) {
                log(`✅ Found array at key: ${key} with ${rawData[key].length} items`);
                return rawData[key];
            }
        }
        
        // If no specific key worked, look for the first array we can find
        const firstArrayKey = Object.keys(rawData).find(key => Array.isArray(rawData[key]));
        if (firstArrayKey) {
            log(`✅ Found first available array at key: ${firstArrayKey} with ${rawData[firstArrayKey].length} items`);
            return rawData[firstArrayKey];
        }
        
        log("❌ No array found in object, returning empty array");
        return [];
    }
    
    log("❌ Unsupported data type, returning empty array");
    return [];
}

console.log("Testing control character handling...");
console.log("Original data contains newlines:", testJsonWithControlChars.includes('\n'));

// Test the processing
const processedData = processApiResponse(testJsonWithControlChars, "cas");

console.log("Final result:", {
    type: typeof processedData,
    isArray: Array.isArray(processedData),
    length: Array.isArray(processedData) ? processedData.length : "Not an array",
    firstItem: Array.isArray(processedData) && processedData.length > 0 ? processedData[0] : "No items"
});

if (Array.isArray(processedData) && processedData.length > 0) {
    console.log("✅ Successfully processed data with control characters!");
    console.log("Status comment:", processedData[0].statusComment);
} else {
    console.log("❌ Failed to process data with control characters");
}
