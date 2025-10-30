# Release Planning Widget

A Vue.js widget for tracking and visualizing release planning data including parts, change actions, and change requests.

## Features

### 📊 Data Visualization
- **Interactive Chart**: Line chart showing release trends over time
  - Target Release (blue line)
  - Actual Release (green line)  
  - Critical Release (red line)
- **Focus 30 Button**: Zoom chart to ±30 days from today for recent activity view
- **Data Table**: Sortable, filterable table of parts with release information

### 🎯 Filtering & Search
- **Program Filter**: Filter by program/project
- **Phase Filter**: Filter by development phase
- **System Group Filter**: Filter by system/subsystem
- **State Filter**: Filter by part state
- **Type Filter**: Switch between Parts, Change Actions (CAs), and Change Requests (CRs)
- **URL Parameters**: All filters saved to URL for bookmarking and sharing

### 🖥️ Kiosk Mode
Full-screen dashboard mode for displays and monitors:
- **Auto-Rotation**: Automatically cycles through table pages
- **Auto-Refresh**: Periodically reloads data
- **Minimal UI**: Hides controls, shows filter badges
- **Page Indicators**: Visual progress through pages
- **URL Activation**: Enable via `?mode=kiosk` parameter

### 💬 Status Comments
- View and add comments for each part/CA/CR
- Tracks comment history with timestamps
- Modal dialog for detailed comment view

---

## Quick Start

### Installation

```bash
# Install dependencies
npm install

# Run development server
npm run serve

# Build for production
npm run build

# Analyze bundle size
npm run build:analyze
```

### Development

```bash
# Start dev server (default: http://localhost:8080)
npm run serve
```

### Production Build

```bash
# Create optimized production build
npm run build

# Output: dist/ folder
```

---

## Usage

### Basic URL

```
http://localhost:8080/
```

### With Filters

```
http://localhost:8080/?program=CX300&phase=Design&type=parts
```

### Kiosk Mode

```
http://localhost:8080/?mode=kiosk&program=CX300
```

### Kiosk Mode with Custom Settings

```
http://localhost:8080/?mode=kiosk&program=CX300&pageDelay=15000&rows=20&refresh=120000
```

**Kiosk URL Parameters:**
- `mode=kiosk` - Activate kiosk mode
- `pageDelay=15000` - Milliseconds per page (default: 10000)
- `rows=20` - Rows per page (default: 15)
- `refresh=120000` - Refresh interval in ms (default: 60000)

---

## URL Parameters Reference

### Filter Parameters

| Parameter | Values | Example |
|-----------|--------|---------|
| `program` | Program name | `?program=CX300` |
| `phase` | Phase name | `?phase=Design` |
| `systemGroup` | System name | `?systemGroup=Avionics` |
| `state` | Part state | `?state=Released` |
| `type` | `parts`, `cas`, `crs` | `?type=parts` |
| `targetFilter` | `all`, `target`, `actual`, `critical` | `?targetFilter=target` |

### Display Parameters

| Parameter | Values | Example |
|-----------|--------|---------|
| `mode` | `kiosk` | `?mode=kiosk` |
| `pageDelay` | Milliseconds | `?pageDelay=15000` |
| `rows` | Number | `?rows=20` |
| `refresh` | Milliseconds | `?refresh=120000` |

### Combining Parameters

```
?program=CX300&phase=Design&type=parts&mode=kiosk&pageDelay=12000&rows=15
```

---

## Configuration

### API Endpoints

Configure in `src/services/ApiService.js`:

```javascript
const API_BASE_URL = process.env.VUE_APP_API_BASE_URL || '/api';
```

Set via environment variable:
```bash
VUE_APP_API_BASE_URL=https://your-api.com/api npm run build
```

### Mock Data Mode

Toggle mock data in `src/services/ApiService.js`:

```javascript
const MOCK_MODE = false; // Set to true for development without API
```

Mock data located at: `src/assets/config/app-data.json`

---

## Project Structure

```
src/
├── components/
│   ├── release-planning/
│   │   └── ReleasePlannerWidget.vue    # Main widget component
│   ├── charts/
│   │   └── ReleaseChart.vue            # Chart component
│   ├── common/
│   │   └── StatusCommentDisplay.vue    # Comments display
│   └── universal/                       # Reusable components
├── data/
│   ├── DataServiceBase.js              # Base data service
│   └── DataMethodsReleasePlanner.js    # Release planning data methods
├── services/
│   ├── ApiService.js                   # API communication
│   ├── ChartDataService.js             # Chart data transformation
│   └── DataTransformationService.js    # Data mapping/transformation
├── assets/
│   └── config/
│       └── app-data.json               # Mock data
├── plugins/
│   └── vuetify.js                      # Vuetify configuration
├── static/
│   └── version.json                    # Version for cache busting
├── App.vue                             # Root component
└── main.js                             # Application entry point
```

---

## Key Technologies

- **Vue.js 2.6** - Frontend framework
- **Vuetify 2.6** - UI component library
- **Chart.js 2.9** - Chart visualization
- **Axios 1.10** - HTTP client
- **Webpack 5.88** - Module bundler

---

## Data Types

### Parts
Tracked fields:
- Part Number / Revision
- Description
- Make/Buy status
- System Group
- Target/Actual/Critical Release dates
- State
- Change Action number
- Status Comments

### Change Actions (CAs)
Tracked fields:
- CA Number
- Title
- Responsible Engineer
- Status
- Target/Actual Release
- State

### Change Requests (CRs)
Tracked fields:
- CR Number
- Title
- Owner
- Status
- Target/Actual Release
- State

---

## Kiosk Mode Details

### How to Activate

**Method 1: URL Parameter**
```
?mode=kiosk
```

**Method 2: Toggle Button**
- Click the green monitor icon button (bottom-right in normal mode)
- Click the X button in the badge bar to exit

### Kiosk Mode Features

1. **Auto Page Rotation**
   - Default: 10 seconds per page
   - Cycles through all data pages
   - Loops back to page 1 after last page

2. **Auto Data Refresh**
   - Default: Every 60 seconds
   - Shows countdown timer
   - Preserves current page position

3. **Visual Indicators**
   - **Green Badge**: "KIOSK MODE" indicator
   - **Teal Badge**: Countdown to next refresh
   - **Filter Chips**: Active filters displayed as badges
   - **Page Indicators**: Shows current page (e.g., Page 2 of 5)

4. **Minimal Interface**
   - Hides filter controls
   - Removes edit buttons
   - Optimized for viewing only
   - Shows only essential information

### Custom Kiosk Configuration

**15-second page rotation, 20 rows, 2-minute refresh:**
```
?mode=kiosk&pageDelay=15000&rows=20&refresh=120000
```

**With filters:**
```
?mode=kiosk&program=CX300&phase=Design&pageDelay=12000&rows=15&refresh=90000
```

---

## Chart Features

### Focus 30 Button

Click "Focus 30" to zoom the chart timeline to ±30 days from today:
- Shows only data within 30 days before and after current date
- Helps focus on recent and upcoming releases
- Click "Reset" to return to full timeline view

### Chart Lines

- **Blue Line (Target)**: Target release dates
- **Green Line (Actual)**: Actual release dates
- **Red Line (Critical)**: Critical release dates

Toggle visibility by clicking the filter buttons above the chart.

---

## Status Comments

### View Comments
1. Click the comment icon (💬) in the table row
2. Modal dialog shows all comments with timestamps
3. Scroll to view comment history

### Add Comments
1. Open comment dialog
2. Type comment in text area
3. Click "Add Comment"
4. Comment saved with your username and timestamp

Comments are stored per-item (part/CA/CR) and persist across sessions.

---

## Version Management

Current version: **2.1.0**

Version is managed in:
- `package.json` - Primary version source
- `src/static/version.json` - Used for cache busting

To update version:
```bash
# Use npm version command
npm version patch  # 2.1.0 -> 2.1.1
npm version minor  # 2.1.0 -> 2.2.0
npm version major  # 2.1.0 -> 3.0.0

# Manually update src/static/version.json to match
```

The widget imports version from package.json:
```javascript
import { version } from "../../../package.json";
```

---

## Troubleshooting

### Chart Not Showing
- Check browser console for errors
- Verify data is loading: `console.log(this.chartData)`
- Ensure Chart.js is imported correctly

### Filters Not Working
- Check URL updates when filter changes
- Verify `updateUrlFromFilters()` is called
- Check `filteredTableData` computed property

### Kiosk Mode Not Starting
- Verify URL contains `?mode=kiosk`
- Check browser console for timer errors
- Ensure `isKioskMode` computed property is true

### Data Not Loading
- Check API endpoint configuration
- Verify network requests in DevTools
- Check CORS settings if API is on different domain
- Try enabling MOCK_MODE for testing

### Bundle Size Too Large
```bash
# Analyze what's in the bundle
npm run build:analyze

# Opens bundle-report.html showing size breakdown
```

---

## Browser Support

- Chrome/Edge: ✅ Latest 2 versions
- Firefox: ✅ Latest 2 versions
- Safari: ✅ Latest 2 versions
- IE11: ❌ Not supported

---

## Performance

### Bundle Size
- **Current**: ~18 MB uncompressed (~6 MB gzipped)
- **Target**: < 2 MB (gzipped < 500 KB)
- Use `npm run build:analyze` to monitor

### Known Large Dependencies
- moment.js with all locales (~500-700 KB)
- @mdi/font icon library (~500 KB)
- Chart.js v2 (~200-300 KB)
- Vuetify components

---

**Last Updated**: October 30, 2025  
**Version**: 2.1.0
