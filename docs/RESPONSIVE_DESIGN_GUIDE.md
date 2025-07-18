# 📱 Responsive Design System - Implementation Guide

## Overview

The Release Planning Framework now includes a comprehensive responsive design system that automatically adjusts charts, tables, and other components to fit the current window size dynamically.

## 🔧 Core Components

### 1. ResponsiveUtils.js
Central utility class that provides:
- **Breakpoint Detection**: Automatically detects mobile, tablet, and desktop viewports
- **Dynamic Sizing**: Calculates optimal component dimensions based on screen size
- **Window Resize Handling**: Debounced resize events with callback system
- **Configuration Management**: Responsive configuration for charts, tables, and grids

```javascript
import { responsiveUtils } from '@/utils/ResponsiveUtils.js';

// Check current breakpoint
const isMobile = responsiveUtils.isMobile();
const isTablet = responsiveUtils.isTablet();
const isDesktop = responsiveUtils.isDesktop();

// Get responsive dimensions
const chartConfig = responsiveUtils.getChartConfig({
    height: 400,
    breakpoints: {
        mobile: { height: 250 },
        tablet: { height: 300 },
        desktop: { height: 400 }
    }
});
```

### 2. ResponsiveMixin
Vue mixin that provides reactive responsive properties:

```javascript
import { ResponsiveMixin } from '@/utils/ResponsiveUtils.js';

export default {
    mixins: [ResponsiveMixin],
    
    methods: {
        onResponsiveResize(resizeData) {
            // Handle window resize events
            console.log('New breakpoint:', resizeData.breakpoint);
            console.log('Window size:', resizeData.width, 'x', resizeData.height);
        }
    }
};
```

### 3. Vue Plugin
Global responsive utilities available in all components:

```javascript
// Available in all components
this.$responsive.isMobile()
this.$breakpoint     // Current breakpoint: 'xs', 'sm', 'md', 'lg', 'xl'
this.$isMobile       // Boolean: true if mobile
this.$isTablet       // Boolean: true if tablet
this.$isDesktop      // Boolean: true if desktop
this.$windowSize     // { width: number, height: number }
```

## 📊 Component Integration

### Enhanced UniversalChart
Automatically adjusts:
- Chart height based on viewport
- Legend position (top for desktop, bottom for mobile)
- Font sizes and tick limits
- Aspect ratio optimization

```vue
<template>
    <UniversalChart
        :data="chartData"
        :base-config="chartConfig"
        type="line"
    />
</template>

<script>
export default {
    data() {
        return {
            chartConfig: {
                height: 400,
                breakpoints: {
                    mobile: { height: 250, showLegendOnMobile: false },
                    tablet: { height: 300 },
                    desktop: { height: 400 }
                }
            }
        };
    }
};
</script>
```

### Enhanced UniversalTable
Automatically adjusts:
- Table height and items per page
- Dense mode for mobile
- Header visibility (essential headers only on mobile)
- Footer visibility

```vue
<template>
    <UniversalTable
        :headers="tableHeaders"
        :items="tableData"
        :height="tableHeight"
    />
</template>

<script>
export default {
    computed: {
        tableHeaders() {
            return this.allHeaders.filter(header => {
                if (this.$isMobile) {
                    return header.essential !== false && header.mobileVisible !== false;
                }
                return true;
            });
        }
    }
};
</script>
```

### Enhanced ReleasePlannerWidget
Implements comprehensive responsive behavior:
- Dynamic chart and table heights
- Responsive filter layouts
- Adaptive data display

## 🎨 CSS Classes

### Responsive Containers
```css
.chart-container-responsive {
    position: relative;
    width: 100%;
    height: 400px;
    min-height: 200px;
}

.table-container-responsive {
    position: relative;
    width: 100%;
    height: 500px;
    min-height: 200px;
    overflow: auto;
}

.container-responsive {
    width: 100%;
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 var(--spacing-md);
}
```

### Responsive Grid Layouts
```css
.grid-responsive-auto {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: var(--spacing-md);
}

.grid-responsive-2 {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: var(--spacing-md);
}

.grid-responsive-3 {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: var(--spacing-md);
}
```

## 📱 Breakpoint System

### Standard Breakpoints
- **xs**: 0-599px (Mobile)
- **sm**: 600-959px (Large Mobile/Small Tablet)
- **md**: 960-1263px (Tablet)
- **lg**: 1264-1903px (Desktop)
- **xl**: 1904px+ (Large Desktop)

### Responsive Behavior
```javascript
// Mobile (xs, sm)
- Single column layouts
- Reduced chart heights (250-300px)
- Dense tables with fewer items per page
- Essential headers only
- Bottom legends for charts

// Tablet (md)
- Two column layouts
- Medium chart heights (300-350px)
- Standard table density
- Most headers visible
- Top legends for charts

// Desktop (lg, xl)
- Full multi-column layouts
- Full chart heights (400-450px)
- Fixed headers and full pagination
- All headers visible
- Full feature set
```

## 🚀 Usage Examples

### Basic Responsive Component
```vue
<template>
    <div class="responsive-component">
        <div 
            class="chart-container"
            :style="{ height: `${chartHeight}px` }"
        >
            <canvas ref="chart"></canvas>
        </div>
        
        <div v-if="$isDesktop" class="desktop-only-features">
            <!-- Advanced features for desktop -->
        </div>
    </div>
</template>

<script>
import { ResponsiveMixin } from '@/utils/ResponsiveUtils.js';

export default {
    mixins: [ResponsiveMixin],
    
    data() {
        return {
            chartHeight: 400
        };
    },
    
    methods: {
        onResponsiveResize(resizeData) {
            // Update chart height based on breakpoint
            if (resizeData.breakpoint === 'xs') {
                this.chartHeight = 250;
            } else if (resizeData.breakpoint === 'sm') {
                this.chartHeight = 300;
            } else {
                this.chartHeight = 400;
            }
            
            // Resize chart if it exists
            if (this.chart) {
                this.chart.resize();
            }
        }
    }
};
</script>
```

### Responsive Directives
```vue
<template>
    <div>
        <!-- Automatically adjusts height based on breakpoint -->
        <div 
            v-responsive-height="{
                breakpoints: {
                    mobile: { height: 250 },
                    tablet: { height: 300 },
                    desktop: { height: 400 }
                }
            }"
            data-base-height="400"
        >
            Chart content
        </div>
        
        <!-- Responsive width -->
        <div 
            v-responsive-width="{
                breakpoints: {
                    mobile: { width: '100%' },
                    desktop: { width: '80%' }
                }
            }"
            data-base-width="100%"
        >
            Table content
        </div>
    </div>
</template>
```

### Responsive Filters
```vue
<template>
    <div>
        <!-- Height filter -->
        <div :style="{ height: baseHeight | responsiveHeight(heightConfig) }">
            Content
        </div>
        
        <!-- Width filter -->
        <div :style="{ width: baseWidth | responsiveWidth(widthConfig) }">
            Content
        </div>
    </div>
</template>

<script>
export default {
    data() {
        return {
            baseHeight: 400,
            baseWidth: '100%',
            heightConfig: {
                breakpoints: {
                    mobile: { height: 250 },
                    tablet: { height: 300 },
                    desktop: { height: 400 }
                }
            },
            widthConfig: {
                breakpoints: {
                    mobile: { width: '100%' },
                    desktop: { width: '80%' }
                }
            }
        };
    }
};
</script>
```

## 🔧 Configuration

### Chart Configuration
```javascript
const chartConfig = {
    height: 400,
    showLegendOnMobile: true,
    breakpoints: {
        mobile: { 
            height: 250,
            showLegendOnMobile: false,
            aspectRatio: 1.5
        },
        tablet: { 
            height: 300,
            aspectRatio: 2.0
        },
        desktop: { 
            height: 400,
            aspectRatio: 2.5
        }
    }
};
```

### Table Configuration
```javascript
const tableConfig = {
    height: 500,
    itemsPerPage: 15,
    breakpoints: {
        mobile: { 
            height: 300,
            itemsPerPage: 5,
            dense: true,
            hideFooter: true
        },
        tablet: { 
            height: 400,
            itemsPerPage: 10,
            dense: false
        },
        desktop: { 
            height: 500,
            itemsPerPage: 15,
            fixedHeader: true
        }
    }
};
```

## 🎯 Best Practices

### 1. Mobile-First Design
```css
/* Mobile styles first */
.component {
    height: 250px;
    font-size: 14px;
}

/* Then enhance for larger screens */
@media (min-width: 600px) {
    .component {
        height: 300px;
        font-size: 16px;
    }
}

@media (min-width: 960px) {
    .component {
        height: 400px;
        font-size: 18px;
    }
}
```

### 2. Performance Optimization
```javascript
// Debounced resize handling
const debouncedResize = debounce(() => {
    updateComponentSizes();
}, 150);

window.addEventListener('resize', debouncedResize);
```

### 3. Progressive Enhancement
```vue
<template>
    <div>
        <!-- Essential content always visible -->
        <div class="essential-content">
            {{ title }}
        </div>
        
        <!-- Enhanced features for larger screens -->
        <div v-if="$isDesktop" class="enhanced-features">
            <advanced-chart />
            <detailed-controls />
        </div>
        
        <!-- Simplified features for mobile -->
        <div v-if="$isMobile" class="mobile-features">
            <simple-chart />
            <basic-controls />
        </div>
    </div>
</template>
```

## 📋 Migration Guide

### Existing Components
1. **Add ResponsiveMixin** to existing components
2. **Update template** to use responsive dimensions
3. **Add onResponsiveResize method** to handle resize events
4. **Update CSS classes** to use responsive utilities

### Before
```vue
<template>
    <div style="height: 400px;">
        <chart />
    </div>
</template>
```

### After
```vue
<template>
    <div :style="{ height: `${chartHeight}px` }">
        <chart />
    </div>
</template>

<script>
import { ResponsiveMixin } from '@/utils/ResponsiveUtils.js';

export default {
    mixins: [ResponsiveMixin],
    
    data() {
        return {
            chartHeight: 400
        };
    },
    
    methods: {
        onResponsiveResize(resizeData) {
            this.chartHeight = resizeData.isMobile ? 250 : 400;
        }
    }
};
</script>
```

## 🐛 Troubleshooting

### Common Issues

1. **Components not resizing**: Ensure ResponsiveMixin is included
2. **Chart not updating**: Call `chart.resize()` in `onResponsiveResize`
3. **Table not responsive**: Set `mobile-breakpoint` prop
4. **CSS not responsive**: Use responsive utility classes

### Debug Information
```javascript
// Check responsive state
console.log('Breakpoint:', this.$breakpoint);
console.log('Window size:', this.$windowSize);
console.log('Is mobile:', this.$isMobile);
console.log('Is tablet:', this.$isTablet);
console.log('Is desktop:', this.$isDesktop);
```

## 🎉 Results

With this responsive system implemented:

✅ **Charts automatically resize** to fit current window size
✅ **Tables adapt** with appropriate items per page and density
✅ **Layouts adjust** from multi-column to single-column on mobile
✅ **Components optimize** for touch vs. mouse interaction
✅ **Performance optimized** with debounced resize events
✅ **Consistent behavior** across all components
✅ **Easy to extend** with new responsive configurations

The system provides a seamless experience across all device sizes while maintaining performance and usability.
