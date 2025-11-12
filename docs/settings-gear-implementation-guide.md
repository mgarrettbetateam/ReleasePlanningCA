# Settings Gear Icon Implementation Guide
## "Set Default Program" Feature

This document provides complete implementation details for building a settings gear icon with a popup dialog, styled and positioned exactly like the Release Planning app.

---

## 📋 Overview

**Feature**: Settings gear icon that opens a dialog to set a default program filter
**Framework**: Vue.js 2.x + Vuetify 2.x
**Storage**: Browser localStorage for persistence
**Location**: Right side of filter bar, after all filter dropdowns

---

## 🎨 Visual Design

### Gear Icon Button
- **Position**: Far right of filter bar (inline with filter dropdowns)
- **Icon**: `mdi-cog` (Material Design Icons)
- **Size**: Small icon button
- **Color**: `grey darken-1`
- **Spacing**: `ml-2` (8px left margin)

### Settings Dialog
- **Width**: 600px max-width
- **Modal**: Persistent (cannot close by clicking outside)
- **Header**: Primary color background with white text
- **Icon in header**: `mdi-cog` in white
- **Title**: "Set Default Program"

---

## 💻 Implementation Code

### 1. Settings Gear Icon Button (in Filter Bar)

Add this button at the end of your filter bar:

```vue
<!-- Settings Gear Icon -->
<v-btn
    icon
    small
    color="grey darken-1"
    class="ml-2"
    @click="settingsDialog = true"
>
    <v-icon>mdi-cog</v-icon>
</v-btn>
```

**Placement**: After all filter dropdown components, before closing the filter bar container.

---

### 2. Settings Dialog Component

Add this dialog anywhere in your template (typically after main content):

```vue
<v-dialog v-model="settingsDialog" max-width="600" persistent>
    <v-card>
        <v-card-title class="primary white--text">
            <v-icon left color="white">mdi-cog</v-icon>
            Set Default Program
        </v-card-title>
        
        <v-card-text class="pt-4">
            <p class="mb-4">
                Set a default program that will be automatically selected when the widget loads.
            </p>
            
            <v-select
                v-model="defaultProgram"
                :items="programsWithAll"
                label="Default Program"
                prepend-inner-icon="mdi-briefcase"
                outlined
                dense
                hint="Leave as 'All' to show all programs by default"
                persistent-hint
            />
        </v-card-text>
        
        <v-card-actions>
            <v-btn
                text
                @click="resetDefaultProgram"
            >
                <v-icon left>mdi-restore</v-icon>
                RESET TO ALL
            </v-btn>
            <v-spacer />
            <v-btn
                text
                @click="cancelSettings"
            >
                CANCEL
            </v-btn>
            <v-btn
                color="primary"
                @click="saveDefaultProgram"
            >
                <v-icon left>mdi-content-save</v-icon>
                SAVE DEFAULT
            </v-btn>
        </v-card-actions>
    </v-card>
</v-dialog>
```

---

### 3. Vue Component Data Properties

Add these data properties:

```javascript
data() {
    return {
        // Settings dialog
        settingsDialog: false,
        defaultProgram: "All",
        
        // Your existing data...
        programs: [], // List of available programs
        filterValues: {
            program: "" // Current program filter
        }
    };
}
```

---

### 4. Computed Properties

Add this computed property to create the programs list with "All" option:

```javascript
computed: {
    // Programs list with "All" option for settings dialog
    programsWithAll() {
        return ["All", ...this.programs];
    }
}
```

---

### 5. Methods - Save, Reset, and Cancel

Implement these three methods:

```javascript
methods: {
    /**
     * Save default program to localStorage
     */
    saveDefaultProgram() {
        try {
            localStorage.setItem("defaultProgram", this.defaultProgram);
            this.settingsDialog = false;
            
            // Apply the default program immediately
            this.filterValues.program = this.defaultProgram === "All" ? "" : this.defaultProgram;
            
            // Optional: Show success message (requires snackbar component)
            this.showSnackbar({ 
                message: `Default program set to: ${this.defaultProgram}`, 
                type: "success" 
            });
        } catch (error) {
            console.error("Error saving default program:", error);
            // Optional: Show error message
            this.showSnackbar({ 
                message: "Error saving default program: " + error.message, 
                type: "error" 
            });
        }
    },

    /**
     * Reset default program to "All"
     */
    resetDefaultProgram() {
        this.defaultProgram = "All";
        localStorage.removeItem("defaultProgram");
        
        // Optional: Show info message
        this.showSnackbar({ 
            message: "Default program reset to 'All'", 
            type: "info" 
        });
    },

    /**
     * Cancel settings dialog without saving
     */
    cancelSettings() {
        // Restore from localStorage or default to "All"
        this.defaultProgram = localStorage.getItem("defaultProgram") || "All";
        this.settingsDialog = false;
    }
}
```

---

### 6. Load Default Program on Component Mount

Add this to your `mounted()` lifecycle hook:

```javascript
mounted() {
    // Load default program from localStorage
    const savedProgram = localStorage.getItem("defaultProgram");
    if (savedProgram) {
        this.defaultProgram = savedProgram;
        // Apply to filter if not "All"
        if (savedProgram !== "All") {
            this.filterValues.program = savedProgram;
        }
    }
    
    // Your other mounted logic...
}
```

---

## 🎯 Key Features Explained

### 1. **Persistent Dialog** (`persistent` prop)
- User cannot close by clicking outside
- Forces deliberate action (Cancel or Save)
- Prevents accidental data loss

### 2. **localStorage Integration**
- Key: `"defaultProgram"`
- Value: Program name or `"All"`
- Persists across browser sessions
- Cleared on reset

### 3. **Three Action Buttons**

| Button | Action | Style |
|--------|--------|-------|
| **RESET TO ALL** | Clears saved preference | Text button (left) |
| **CANCEL** | Closes without saving | Text button (center-right) |
| **SAVE DEFAULT** | Saves to localStorage | Primary filled button (right) |

### 4. **Immediate Application**
When saved, the default program is:
1. Stored in localStorage
2. Immediately applied to current filter
3. Loaded automatically on next page load

---

## 🎨 Styling Details

### Filter Bar Integration
```vue
<div class="filter-inline-row">
    <!-- Filter dropdowns here -->
    <v-select ... />
    <v-select ... />
    
    <!-- Settings gear at the end -->
    <v-btn icon small color="grey darken-1" class="ml-2" @click="settingsDialog = true">
        <v-icon>mdi-cog</v-icon>
    </v-btn>
</div>
```

### Dialog Header Styling
- **Background**: Primary theme color (`class="primary white--text"`)
- **Text**: White color
- **Icon**: White, positioned left of title

### Dialog Content
- **Padding**: `pt-4` (padding-top: 16px)
- **Description**: Regular paragraph with `mb-4` spacing
- **Select Input**: Outlined style, dense size
- **Hint**: Persistent (always visible)

### Dialog Actions
- **Layout**: Flexbox with spacer
- **Left**: Reset button (text style)
- **Right**: Cancel (text) + Save (primary)
- **Icons**: All buttons have left-aligned icons

---

## 📦 Required Dependencies

### Vuetify Components Used
- `v-btn` - Buttons
- `v-icon` - Material Design Icons
- `v-dialog` - Modal dialog
- `v-card` / `v-card-title` / `v-card-text` / `v-card-actions` - Card structure
- `v-select` - Dropdown selector
- `v-spacer` - Layout spacing

### Material Design Icons
- `mdi-cog` - Settings gear
- `mdi-briefcase` - Program selector
- `mdi-restore` - Reset button
- `mdi-content-save` - Save button

### Browser API
- `localStorage.setItem(key, value)` - Save data
- `localStorage.getItem(key)` - Load data
- `localStorage.removeItem(key)` - Clear data

---

## 🔧 Customization Options

### Change Dialog Title
```vue
<v-card-title class="primary white--text">
    <v-icon left color="white">mdi-cog</v-icon>
    Your Custom Title Here
</v-card-title>
```

### Change Dropdown Icon
```vue
<v-select
    prepend-inner-icon="mdi-your-icon-here"
    ...
/>
```

### Change Button Text
```vue
<v-btn ...>
    <v-icon left>mdi-icon</v-icon>
    YOUR TEXT
</v-btn>
```

### Adjust Dialog Width
```vue
<v-dialog v-model="settingsDialog" max-width="700" persistent>
```

---

## 🧪 Testing Checklist

- [ ] Gear icon appears at right end of filter bar
- [ ] Clicking gear opens dialog
- [ ] Cannot close dialog by clicking outside (persistent)
- [ ] Dropdown shows all available programs plus "All"
- [ ] SAVE DEFAULT stores to localStorage
- [ ] SAVE DEFAULT applies to current filter immediately
- [ ] CANCEL closes without saving changes
- [ ] RESET TO ALL removes localStorage entry
- [ ] Default program loads on page refresh
- [ ] "All" option clears the program filter

---

## 💡 Best Practices

1. **Always validate localStorage access** - Wrap in try/catch blocks
2. **Provide user feedback** - Use snackbar/toast messages for actions
3. **Default to "All"** - If localStorage is empty or corrupted
4. **Apply immediately** - User sees changes take effect right away
5. **Persistent dialog** - Prevents accidental closes during editing

---

## 📝 Example Full Component Structure

```vue
<template>
    <div>
        <!-- Filter Bar -->
        <v-card class="filter-bar">
            <v-card-text>
                <div class="filter-inline-row">
                    <!-- Filter Dropdowns -->
                    <v-select v-model="filterValues.program" ... />
                    
                    <!-- Settings Gear -->
                    <v-btn icon small color="grey darken-1" class="ml-2" 
                           @click="settingsDialog = true">
                        <v-icon>mdi-cog</v-icon>
                    </v-btn>
                </div>
            </v-card-text>
        </v-card>

        <!-- Settings Dialog -->
        <v-dialog v-model="settingsDialog" max-width="600" persistent>
            <!-- Full dialog code here -->
        </v-dialog>
    </div>
</template>

<script>
export default {
    data() {
        return {
            settingsDialog: false,
            defaultProgram: "All",
            programs: ["Program A", "Program B", "Program C"],
            filterValues: { program: "" }
        };
    },
    computed: {
        programsWithAll() {
            return ["All", ...this.programs];
        }
    },
    mounted() {
        const saved = localStorage.getItem("defaultProgram");
        if (saved) {
            this.defaultProgram = saved;
            if (saved !== "All") {
                this.filterValues.program = saved;
            }
        }
    },
    methods: {
        saveDefaultProgram() { /* implementation */ },
        resetDefaultProgram() { /* implementation */ },
        cancelSettings() { /* implementation */ }
    }
};
</script>
```

---

## 🎓 Summary

This implementation provides:
- ✅ Clean, professional settings gear icon
- ✅ User-friendly dialog interface
- ✅ Persistent storage across sessions
- ✅ Immediate filter application
- ✅ Reset functionality
- ✅ Cancel without saving
- ✅ Proper error handling
- ✅ Consistent with Vuetify Material Design

Use this guide to replicate the exact styling and behavior of the Release Planning app's settings feature!
