// Simple test to understand the control character issue at position 381
const testData = `{ "CAs": [{"name": "CA-00000268", "revision": "-", "changeSummary": "Test-Do Not Send To Plex", "targetReleaseDate": "7/16/2025", "actualReleaseDate": "", "currentState": "Prepare", "organization": "Beta Technologies", "respEngr": "nghaffari", "caNumber": "CA-00000268", "approvedDate": "", "statusComment": "[2025-07-16] nghaffari: Waiting on Bill to do his job! - ETA: 2025-07-18", "physId": "60FA60230001231C6317AA730018F179"}] }`;

console.log("Character at position 381:", testData.charAt(381));
console.log("Character code at position 381:", testData.charCodeAt(381));
console.log("Context around position 381:", testData.substring(370, 390));

// Try to parse normally
try {
    const parsed = JSON.parse(testData);
    console.log("SUCCESS: Normal parsing worked");
} catch (error) {
    console.log("ERROR: Normal parsing failed:", error.message);
    
    // Try with control character cleaning
    const cleanedData = testData
        .replace(/\r\n/g, "\\n")
        .replace(/\n/g, "\\n")
        .replace(/\r/g, "\\r")
        .replace(/\t/g, "\\t")
        .replace(/\f/g, "\\f")
        .replace(/\b/g, "\\b")
        .replace(/\v/g, "\\v");
    
    try {
        const parsed = JSON.parse(cleanedData);
        console.log("SUCCESS: Cleaned parsing worked");
    } catch (cleanError) {
        console.log("ERROR: Even cleaned parsing failed:", cleanError.message);
    }
}
