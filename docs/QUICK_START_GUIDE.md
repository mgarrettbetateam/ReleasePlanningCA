# 🚀 Release Planning Framework - Quick Start Guide

## Overview
The Release Planning Framework is a Vue.js-based dashboard system for tracking and visualizing release planning data across parts, change actions (CAs), and change requests (CRs).

## 🎯 Getting Started in 5 Minutes

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Development Server
```bash
npm run serve
```

### 3. Access the Dashboard
Open your browser to `http://localhost:8080`

## 🎮 Basic Usage

### Dashboard Navigation
- **Main Dashboard**: Interactive widgets showing release data
- **Filter Controls**: Program, Phase, and Organization dropdowns
- **Data Type Switcher**: Toggle between Parts, CAs, and CRs
- **Export Options**: PDF and CSV export for all data

### Key Features
- **Real-time Filtering**: Filter data across all widgets simultaneously
- **Interactive Charts**: Click-to-filter cumulative release timeline
- **Release Headliners**: Quick stats with clickable filters
- **Responsive Design**: Works on desktop, tablet, and mobile

### Widget Configuration
Enable/disable features using boolean props:

```javascript
// In WidgetRegistry.js
props: {
    hideHeader: true,        // Hide widget headers
    showExportButton: true,  // Show export functionality
    searchable: true,        // Enable search in tables
    filterable: true,        // Enable column filters
    expandable: true         // Enable row expansion
}
```

## 📊 Data Sources

### Mock Data (Development)
Set `USE_MOCK_DATA = true` in `/src/config/ApiConfig.js`

### Live API Data (Production)
Set `USE_MOCK_DATA = false` and configure API endpoints in `/src/config/ApiConfig.js`

## 🔧 Quick Customization

### Add New Widget
1. Create component in `/src/components/`
2. Register in `/src/config/WidgetRegistry.js`
3. Add to dashboard layout

### Modify Filters
Update filter configuration in `UniversalFilterControls` component

### Change Styling
Modify `/src/assets/styles/BetaStyles.css` for custom themes

## 🎨 Visual Controls

### Show/Hide Elements
```vue
<!-- Conditional rendering based on props -->
<div v-if="showHeader">Header Content</div>
<div v-show="isVisible">Always in DOM, toggle visibility</div>

<!-- Props control -->
<UniversalTable 
  :searchable="true"
  :filterable="true" 
  :show-export-button="true"
/>
```

### Layout Breakpoints
- **Mobile**: < 600px
- **Tablet**: 600px - 960px  
- **Desktop**: > 960px

## 📱 Mobile Optimization
The framework automatically adapts:
- Stacked layouts on mobile
- Touch-friendly controls
- Responsive typography
- Collapsible filters

## 🔍 Troubleshooting

### Common Issues
1. **Blank Dashboard**: Check `USE_MOCK_DATA` setting
2. **No Data**: Verify API endpoints and CORS settings
3. **Styling Issues**: Clear browser cache and rebuild

### Debug Mode
Enable console logging in components for detailed debugging information.

## 📈 Next Steps
- Read the [Comprehensive Documentation](./COMPREHENSIVE_DOCUMENTATION.md)
- Explore widget configurations in `/src/config/`
- Customize styling in `/src/assets/styles/`
- Add your own data sources and widgets

---
*For detailed information, see the Comprehensive Documentation*
