// Test the new multi-stage JSON parsing approach
const testDataWithNewlines = `{ "CAs": [{"name": "CA-00000268", "revision": "-", "changeSummary": "Test-Do Not Send To Plex", "targetReleaseDate": "7/16/2025", "actualReleaseDate": "", "currentState": "Prepare", "organization": "Beta Technologies", "respEngr": "nghaffari", "caNumber": "CA-00000268", "approvedDate": "", "statusComment": "[2025-07-16] nghaffari: Waiting on Bill to do his job!
- ETA: 2025-07-18", "physId": "60FA60230001231C6317AA730018F179"}] }`;

function processApiResponse(rawData, itemType) {
    console.log("Processing API response for type:", itemType);
    
    // If it's already an array, return it
    if (Array.isArray(rawData)) {
        return rawData;
    }
    
    // If it's a string, try to parse it as JSON
    if (typeof rawData === "string") {
        try {
            // First try: parse as-is (for well-formed JSON)
            const parsed = JSON.parse(rawData);
            return processApiResponse(parsed, itemType);
        } catch (firstError) {
            console.log("First attempt failed:", firstError.message);
            // Second try: clean control characters and escape them properly
            try {
                const cleanedData = rawData
                    .replace(/[\r\n\t\f\b\v]/g, match => {
                        switch (match) {
                            case "\r": return "\\r";
                            case "\n": return "\\n";
                            case "\t": return "\\t";
                            case "\f": return "\\f";
                            case "\b": return "\\b";
                            case "\v": return "\\v";
                            default: return match;
                        }
                    });
                
                const parsed = JSON.parse(cleanedData);
                return processApiResponse(parsed, itemType);
            } catch (secondError) {
                console.log("Second attempt failed:", secondError.message);
                // Third try: more aggressive cleaning - remove problematic control characters
                try {
                    // eslint-disable-next-line no-control-regex
                    const aggressiveCleanedData = rawData.replace(/[\u0000-\u001F\u007F-\u009F]/g, "");
                    const parsed = JSON.parse(aggressiveCleanedData);
                    return processApiResponse(parsed, itemType);
                } catch (thirdError) {
                    console.error("All parsing attempts failed:", {
                        originalError: firstError.message,
                        cleanedError: secondError.message,
                        aggressiveError: thirdError.message
                    });
                    return [];
                }
            }
        }
    }
    
    // If it's an object, try to extract the relevant array
    if (rawData && typeof rawData === "object") {
        const possibleKeys = {
            parts: ["parts", "Parts", "items", "data"],
            cas: ["CAs", "cas", "changeActions", "items", "data"],
            crs: ["CRs", "crs", "changeRequests", "items", "data"]
        };
        
        const keysToTry = possibleKeys[itemType] || possibleKeys.parts;
        
        // Try each possible key
        for (const key of keysToTry) {
            if (rawData[key] && Array.isArray(rawData[key])) {
                return rawData[key];
            }
        }
        
        // If no specific key worked, look for the first array we can find
        const firstArrayKey = Object.keys(rawData).find(key => Array.isArray(rawData[key]));
        if (firstArrayKey) {
            return rawData[firstArrayKey];
        }
        
        return [];
    }
    
    return [];
}

console.log("Testing multi-stage JSON parsing...");
console.log("Input contains newlines:", testDataWithNewlines.includes('\n'));

const result = processApiResponse(testDataWithNewlines, "cas");

console.log("Result:", {
    success: Array.isArray(result) && result.length > 0,
    type: typeof result,
    isArray: Array.isArray(result),
    length: result.length,
    statusComment: result.length > 0 ? result[0].statusComment : "No items"
});

if (result.length > 0) {
    console.log("✅ SUCCESS: Multi-stage parsing worked!");
    console.log("First item name:", result[0].name);
} else {
    console.log("❌ FAILED: Multi-stage parsing failed");
}
