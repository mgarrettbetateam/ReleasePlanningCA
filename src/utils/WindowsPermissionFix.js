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
    
    dirs.forEach(dir => {
        ensureDir(dir);
        // Set proper permissions on Windows
        try {
            if (fs.existsSync(dir)) {
                fs.chmodSync(dir, READABLE_WRITABLE_EXECUTABLE);
            }
        } catch (error) {
            // Ignore permission errors but log them
            console.warn(`⚠️ Could not set permissions on ${dir}:`, error.message);
        }
    });
    
    // Add some delay to ensure filesystem operations complete
    return new Promise(resolve => setTimeout(resolve, 100));
}

/**
 * Webpack plugin to handle Windows permission issues
 */
class WindowsPermissionFixPlugin {
    apply(compiler) {
        // Run before any compilation starts
        compiler.hooks.beforeRun.tapAsync("WindowsPermissionFix", (compilation, callback) => {
            // eslint-disable-next-line no-console
            console.log("🔧 Setting up directories and permissions...");
            setupWebpackDirs().then(() => {
                callback();
            }).catch(error => {
                console.warn("⚠️ Directory setup warning:", error.message);
                callback(); // Continue anyway
            });
        });
        
        // Also run before watch mode starts
        compiler.hooks.watchRun.tapAsync("WindowsPermissionFix", (compilation, callback) => {
            setupWebpackDirs().then(() => {
                callback();
            }).catch(error => {
                console.warn("⚠️ Directory setup warning:", error.message);
                callback(); // Continue anyway
            });
        });
        
        // Handle any CleanWebpackPlugin issues
        compiler.hooks.beforeCompile.tap("WindowsPermissionFix", () => {
            try {
                // Re-ensure directories exist right before compile
                const dirs = ["dist", "dist/static", "dist/static/fonts", "dist/static/images"];
                dirs.forEach(dir => {
                    if (!fs.existsSync(dir)) {
                        fs.mkdirSync(dir, { recursive: true });
                    }
                });
            } catch (error) {
                console.warn("⚠️ Pre-compile directory check warning:", error.message);
            }
        });
    }
}

module.exports = {
    ensureDir,
    safeDelete,
    setupWebpackDirs,
    WindowsPermissionFixPlugin
};
