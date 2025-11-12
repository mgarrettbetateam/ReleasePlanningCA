# Badge/Chip Spacing Instructions
## How to Match the Target/Actual/Critical Badge Layout

---

## 📸 Reference Image
The badges should look like this: **Target** | **Actual** | **Critical** with even spacing between them.

---

## ✅ Simple Instructions

Place the Vuetify chips directly next to each other with **NO spacing classes**. Vuetify will automatically create ~8-10px gaps between them.

---

## 💻 Code Example

```vue
<!-- Button before badges needs mr-2 (8px right margin) -->
<v-btn small class="mr-2" color="orange darken-1" dark>
    <v-icon small left>mdi-calendar-range</v-icon>
    Focus 30
</v-btn>

<!-- Badges with NO margin classes between them -->
<v-chip 
    small 
    :color="showTarget ? 'primary' : 'grey'"
    class="legend-chip"
    @click="showTarget = !showTarget"
>
    <v-icon small left>{{ showTarget ? 'mdi-eye' : 'mdi-eye-off' }}</v-icon>
    Target
</v-chip>

<v-chip 
    small 
    :color="showActual ? 'success' : 'grey'"
    class="legend-chip"
    @click="showActual = !showActual"
>
    <v-icon small left>{{ showActual ? 'mdi-eye' : 'mdi-eye-off' }}</v-icon>
    Actual
</v-chip>

<v-chip 
    small 
    :color="showCritical ? 'error' : 'grey'"
    class="legend-chip"
    @click="showCritical = !showCritical"
>
    <v-icon small left>{{ showCritical ? 'mdi-eye' : 'mdi-eye-off' }}</v-icon>
    Critical
</v-chip>
```

---

## 🎯 Key Points

### **Spacing Rules:**
1. ❌ **DO NOT** add `ml-*` or `mr-*` margin classes to the chips
2. ✅ **DO** add `mr-2` (8px right margin) to the element BEFORE the first chip
3. ✅ **DO** place chips directly adjacent in HTML markup
4. ✅ **DO** use `small` prop on all chips for consistent sizing
5. ✅ **DO** use `left` prop on icons for 8px icon-to-text spacing
6. ✅ Vuetify creates the natural ~8-10px gaps between chips automatically

### **Result:**
```
[Focus 30 Button] --8px-- [Target] ~8px~ [Actual] ~8px~ [Critical]
     mr-2 class           Automatic  Automatic  Automatic
                          Vuetify    Vuetify    Vuetify
                          spacing    spacing    spacing
```

---

## 🎨 Colors

Use these Vuetify color props:

| Badge | Active Color | Inactive Color |
|-------|-------------|----------------|
| **Target** | `primary` (blue #2196F3) | `grey` |
| **Actual** | `success` (green #4CAF50) | `grey` |
| **Critical** | `error` (red #F44336) | `grey` |

---

## 🔧 CSS for Hover Effect (Optional)

Add this CSS for the hover scale effect:

```css
.legend-chip {
  cursor: pointer;
  transition: all 0.2s ease;
}

.legend-chip:hover {
  transform: scale(1.05);
}
```

---

## 📐 Exact Measurements

- **Gap between button and first chip:** 8px (from `mr-2`)
- **Gap between chips:** ~8-10px (automatic Vuetify spacing)
- **Icon to text spacing inside chip:** 8px (from `left` prop)
- **Chip height:** ~24px (Vuetify `small` chip default)
- **Chip padding:** 8px horizontal (Vuetify default)

---

## ⚠️ Common Mistakes to Avoid

### ❌ Don't Do This:
```vue
<!-- WRONG: Adding spacing classes -->
<v-chip small class="ml-2">Target</v-chip>
<v-chip small class="ml-2">Actual</v-chip>

<!-- WRONG: Using flex gap on chips themselves -->
<v-chip small style="margin-left: 8px">Target</v-chip>
```

### ✅ Do This Instead:
```vue
<!-- CORRECT: No spacing on chips -->
<v-chip small>Target</v-chip>
<v-chip small>Actual</v-chip>
<v-chip small>Critical</v-chip>
```

---

## 🎓 Why This Works

When Vuetify chips are placed adjacent in HTML:
1. They have `display: inline-flex` 
2. Small whitespace exists in DOM between elements
3. Browser renders natural spacing (~8-10px)
4. **No manual spacing needed!**

---

## 📱 Responsive (Optional)

If you need vertical stacking on mobile:

```css
@media (max-width: 600px) {
  .legend-chip-container {
    flex-direction: column !important;
    gap: 4px !important;
  }
}
```

---

## 🎯 Summary

**To perfectly match the badge spacing:**

```vue
<v-btn small class="mr-2">Button</v-btn>
<v-chip small :color="active ? 'primary' : 'grey'">Target</v-chip>
<v-chip small :color="active ? 'success' : 'grey'">Actual</v-chip>
<v-chip small :color="active ? 'error' : 'grey'">Critical</v-chip>
```

**That's it!** No spacing classes on chips. Let Vuetify handle the gaps naturally.
