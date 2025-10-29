# Version Management - Consolidated Approach

## Overview
The application version is now managed from a **single source of truth**: `package.json`.

## Version Files

### 1. `package.json` - PRIMARY SOURCE ✅
```json
{
  "version": "2.1.0"
}
```
- **Purpose**: Single source of truth for application version
- **Usage**: Imported into Vue components as needed
- **Updates**: Use `npm version` commands to update

### 2. `src/static/version.json` - CACHE BUSTING ONLY ⚠️
```json
{
  "stable": "v2.1.0"
}
```
- **Purpose**: Used by `index.html` to add cache-busting query parameter to `bundle.js`
- **Usage**: Loaded by standalone HTML to prevent browser caching
- **Updates**: Must be manually updated to match `package.json` when version changes

### 3. `ReleasePlannerWidget.vue` - COMPUTED PROPERTY ✅
```javascript
// Import at top of <script>
import { version } from "../../../package.json";

// Computed property in component
computed: {
    appVersion() {
        return version;
    }
}
```
- **Purpose**: Display version in component UI (e.g., `v{{ appVersion }}`)
- **Usage**: Automatically pulls from `package.json` import
- **Updates**: Automatically updates when `package.json` changes (no manual intervention needed)

## How to Update Version

### Step 1: Update package.json
Use npm version commands (recommended):
```bash
# Patch version (2.1.0 → 2.1.1)
npm version patch

# Minor version (2.1.0 → 2.2.0)
npm version minor

# Major version (2.1.0 → 3.0.0)
npm version major
```

Or manually edit `package.json`:
```json
{
  "version": "2.2.0"
}
```

### Step 2: Update version.json
Manually update `src/static/version.json` to match:
```json
{
  "stable": "v2.2.0"
}
```
⚠️ **Important**: Add the "v" prefix in version.json (e.g., "v2.2.0")

### Step 3: No Component Changes Needed ✅
The `ReleasePlannerWidget.vue` component will automatically pick up the new version from the import - no code changes required!

## Why This Approach?

### Benefits
1. **Single Source of Truth**: `package.json` is the standard location for npm package versions
2. **Automatic Updates**: Components import the version directly - no hardcoded values to forget
3. **Standard Practice**: Follows npm/Node.js conventions
4. **Git Integration**: `npm version` commands automatically create git tags
5. **Build Process**: Build tools can inject version into built bundles

### What Changed
**Before** (❌ Error-prone):
- Version hardcoded in component: `appVersion: "2.1.0"`
- Easy to forget to update when version changes
- Caused bug where UI showed old version

**After** (✅ Maintainable):
- Version imported from package.json: `import { version } from "../../../package.json"`
- Computed property returns imported value
- Automatically stays in sync

## Files That Need Manual Updates

Only **ONE file** needs manual updating when version changes:

1. ✅ `package.json` - Update with `npm version` or manual edit
2. ⚠️ `src/static/version.json` - Manual update to match (used for cache busting)

## Files That Auto-Update

These files automatically reflect the new version:

- ✅ `ReleasePlannerWidget.vue` - Via import and computed property
- ✅ Any future components that import `{ version }` from package.json

## Example Version Update

```bash
# Update version using npm
npm version patch

# This updates package.json from 2.1.0 → 2.1.1
# Now manually update version.json:
```

**src/static/version.json:**
```json
{
  "stable": "v2.1.1"
}
```

**Result:**
- ✅ UI displays "v2.1.1" (automatic via import)
- ✅ bundle.js loads with `?v=v2.1.1` query parameter (cache busting)
- ✅ All components stay in sync

## Technical Details

### Why We Can't Eliminate version.json

The `version.json` file serves a specific purpose in the standalone HTML loading mechanism:

```javascript
// From index.html
fetch(uwaPath + "static/version.json?ts=" + Date.now())
    .then(response => response.json())
    .then(version => {
        var scriptElement = document.createElement("script");
        scriptElement.src = uwaPath + "bundle.js?v=" + version.stable;
        document.head.appendChild(scriptElement);
    });
```

This ensures browsers don't cache old versions of the JavaScript bundle when the app is updated.

### Webpack JSON Import

The Vue component can import from `package.json` because Webpack supports JSON imports out of the box:

```javascript
import { version } from "../../../package.json";
// version = "2.1.0"
```

## Troubleshooting

### UI Shows Old Version
- Check that `package.json` has been updated
- Verify the import statement in component: `import { version } from "../../../package.json"`
- Clear browser cache and hard refresh (Ctrl+F5)

### Bundle Not Loading / Cached
- Verify `version.json` has been updated
- Check that the "v" prefix is included (e.g., "v2.1.0" not "2.1.0")
- Clear browser cache

### Build Errors
- Ensure Webpack can resolve the package.json path
- Check that the path in import is correct: `"../../../package.json"` (3 levels up from component)

## Best Practices

1. **Always use npm version commands** when possible
2. **Remember to update version.json** after changing package.json
3. **Never hardcode version** in component data() properties
4. **Use computed properties** to expose imported values
5. **Test after version updates** to ensure UI reflects change

## Future Improvements

Consider adding a build script to automatically sync `version.json` with `package.json`:

```javascript
// scripts/sync-version.js
const fs = require('fs');
const pkg = require('../package.json');

const versionJson = {
    stable: `v${pkg.version}`
};

fs.writeFileSync(
    './src/static/version.json',
    JSON.stringify(versionJson, null, 4) + '\n'
);

console.log(`✅ Synced version.json to v${pkg.version}`);
```

Then add to package.json:
```json
{
  "scripts": {
    "version": "node scripts/sync-version.js && git add src/static/version.json"
  }
}
```

This would automatically update `version.json` whenever you run `npm version`.
