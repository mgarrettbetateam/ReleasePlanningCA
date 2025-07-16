# 🚀 Release Planning Framework

A comprehensive Vue.js dashboard framework for tracking and visualizing release planning data across parts, change actions (CAs), and change requests (CRs).

## ✨ Features

- **Universal Components**: Adaptable components that work with any data structure
- **Boolean-Driven UI**: Fine-grained control over feature visibility and behavior
- **Responsive Design**: Mobile-first with progressive enhancement
- **Interactive Dashboards**: Real-time filtering, charts, and data visualization
- **Export Capabilities**: PDF and CSV export functionality
- **Configuration-Driven**: Centralized widget and layout management

## 📚 Documentation

- **[🚀 Quick Start Guide](./docs/QUICK_START_GUIDE.md)** - Get up and running in 5 minutes
- **[📚 Comprehensive Documentation](./docs/COMPREHENSIVE_DOCUMENTATION.md)** - Complete feature guide and API reference

## 🎯 Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run serve

# Build for production
npm run build
```

## 🏗️ Project Structure

```
src/
├── components/
│   ├── universal/          # Reusable UI components
│   ├── release-planning/   # Domain-specific components
│   ├── layouts/           # Layout containers
│   └── dev/               # Development tools
├── config/                # Configuration files
├── data/                  # Data services
├── services/              # Business logic services
├── assets/styles/         # CSS & styling
└── static/               # Static assets
docs/                      # Documentation
├── README.md              # Documentation index
├── QUICK_START_GUIDE.md   # 5-minute setup guide
└── COMPREHENSIVE_DOCUMENTATION.md  # Complete reference
```

## 🎮 Key Components

### Universal Components
- **UniversalTable**: Configurable data tables with search, filter, and export
- **UniversalChart**: Adaptive charting with multiple visualization types
- **UniversalFilterControls**: Dynamic filter interfaces
- **UniversalForm**: Schema-driven form generation

### Release Planning Components
- **ReleasePlannerWidget**: Main dashboard with integrated filtering and visualization
- **ChangeActionCell**: Specialized table cells for CA data

## ⚙️ Configuration

### Boolean Controls
The framework uses extensive boolean props for feature control:

```vue
<UniversalTable
  :searchable="true"          # Enable search functionality
  :filterable="true"          # Show column filters
  :show-export-button="true"  # Display export options
  :expandable="false"         # Allow row expansion
/>
```

### Widget Registry
Centralized widget configuration in `/src/config/WidgetRegistry.js`:

```javascript
enhancedPartsPlanner: {
  component: "ReleasePlannerWidget",
  props: {
    hideHeader: true,        # Boolean control
    showExportButton: true   # Feature toggle
  },
  visible: true             # Widget visibility
}
```

## 🎨 Styling System

Modern utility-first CSS with semantic design tokens:

```css
/* Utility classes */
.flex { display: flex; }
.gap-4 { gap: 16px; }
.p-4 { padding: 16px; }

/* Responsive utilities */
.hide-on-mobile { display: block; }
@media (max-width: 600px) {
  .hide-on-mobile { display: none; }
}
```

## 📱 Responsive Design

Automatic adaptation across device sizes:
- **Mobile**: < 600px (stacked layouts, touch-friendly)
- **Tablet**: 600px - 960px (hybrid layouts)
- **Desktop**: > 960px (full feature set)

## 🔧 Development Commands

```bash
# Development
npm run serve              # Start dev server
npm run build             # Production build
npm run lint              # Code linting

# Testing
npm run test:unit         # Unit tests
npm run test:e2e          # End-to-end tests
```

## 🌟 Getting Started

1. **Read the [Quick Start Guide](./docs/QUICK_START_GUIDE.md)** for immediate setup
2. **Explore the [Comprehensive Documentation](./docs/COMPREHENSIVE_DOCUMENTATION.md)** for detailed features
3. **Check `/src/config/` for configuration options**
4. **Customize styling in `/src/assets/styles/BetaStyles.css`**

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests and documentation
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

---

*For detailed information and advanced usage, see the [Comprehensive Documentation](./docs/COMPREHENSIVE_DOCUMENTATION.md)*
