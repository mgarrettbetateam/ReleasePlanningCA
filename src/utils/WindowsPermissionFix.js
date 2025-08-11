/**
 * Windows File Permission Fix
 * Handles common Windows EPERM errors during development
 */

const fs = require("fs");
const path = require("path");

// Constants for file permissions
const READABLE_WRITABLE_EXECUTABLE = 0o755;

/**
 * Ensure directory exists with proper permissions
 */
function ensureDir(dirPath) {
    try {
        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true });
            // eslint-disable-next-line no-console
            console.log(`✅ Created directory: ${dirPath}`);
        }
    } catch (error) {
        // eslint-disable-next-line no-console
        console.warn(`⚠️ Could not create directory ${dirPath}:`, error.message);
    }
}

/**
 * Safe delete that handles Windows permission issues
 */
function safeDelete(targetPath) {
    try {
        if (fs.existsSync(targetPath)) {
            const stats = fs.lstatSync(targetPath);
            
            if (stats.isDirectory()) {
                // Remove readonly attribute if it exists
                try {
                    fs.chmodSync(targetPath, READABLE_WRITABLE_EXECUTABLE);
                } catch (chmodError) {
                    // Ignore chmod errors on Windows
                }
                
                // Delete directory contents first
                const files = fs.readdirSync(targetPath);
                files.forEach(file => {
                    safeDelete(path.join(targetPath, file));
                });
                
                fs.rmdirSync(targetPath);
            } else {
                // Remove readonly attribute from file
                try {
                    fs.chmodSync(targetPath, READABLE_WRITABLE_EXECUTABLE);
                } catch (chmodError) {
                    // Ignore chmod errors on Windows
                }
                
                fs.unlinkSync(targetPath);
            }
        }
    } catch (error) {
        console.warn(`⚠️ Could not delete ${targetPath}:`, error.message);
        // Don't throw, just warn
    }
}

/**
 * Setup required directories for webpack
 */
function setupWebpackDirs() {
    const dirs = [
        "dist",
        "dist/static",
        "dist/static/fonts",
        "dist/static/images"
    ];
    
    dirs.forEach(ensureDir);
}

/**
 * Webpack plugin to handle Windows permission issues
 */
class WindowsPermissionFixPlugin {
    apply(compiler) {
        compiler.hooks.beforeRun.tap("WindowsPermissionFix", () => {
            setupWebpackDirs();
        });
        
        compiler.hooks.watchRun.tap("WindowsPermissionFix", () => {
            setupWebpackDirs();
        });
    }
}

module.exports = {
    ensureDir,
    safeDelete,
    setupWebpackDirs,
    WindowsPermissionFixPlugin
};
