# 💰 Finsite

> **Privacy-first personal finance tracker that runs entirely in your browser**

[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)
[![Built with Vanilla JS](https://img.shields.io/badge/Built%20with-Vanilla%20JS-yellow.svg)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![E2E Tests](https://img.shields.io/badge/E2E%20Tests-21%20suites-green.svg)](./test/e2e-tests)
[![Chart.js](https://img.shields.io/badge/Charts-Chart.js-ff6384.svg)](https://www.chartjs.org/)

Finsite is a modern, **local-first** personal finance application that helps you track income and expenses without compromising your privacy. All your financial data stays on your device—nothing is sent to external servers.

---

## ✨ Features

### 📊 **Financial Tracking**
- **Transaction Management** - Add, edit, delete, and organize all your transactions
- **Custom Categories** - Create groups and categories that match your spending habits
- **Smart Search & Filters** - Find transactions by amount, date, merchant, or category
- **Budget Tracking** - Monitor monthly spending with automatic comparisons

### 📈 **Data Visualization**
- **Spending Trends** - Interactive 6-month spending chart powered by Chart.js
- **Category Breakdown** - Visual breakdown of spending by category groups
- **Real-time Stats** - Live dashboard with spending metrics and trends
- **Responsive Charts** - Beautifully animated, mobile-friendly visualizations

### 🔒 **Privacy & Performance**
- **100% Local Storage** - All data stored in browser IndexedDB (never leaves your device)
- **No Server Required** - Runs entirely client-side with zero external dependencies
- **Lightning Fast** - O(1) incremental aggregation for instant dashboard updates
- **Works Offline** - Full functionality without internet connection

### 🛠️ **Developer Experience**
- **Clean MVC Architecture** - Well-organized, maintainable codebase
- **Comprehensive Testing** - 21 E2E test suites with Playwright
- **Full JSDoc Coverage** - Every function documented with examples
- **Architecture Decision Records** - Detailed rationale for technical decisions

---

## 🚀 Quick Start

### Prerequisites
- **Node.js** v18 or higher ([Download](https://nodejs.org/))
- Modern web browser (Chrome, Firefox, Safari, or Edge)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/FIn-Site/Finsite.git
   cd Finsite
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```

4. **Open your browser:**
   Navigate to `http://localhost:5173`

That's it! Finsite will launch with sample data to help you explore the features.

---

## 📖 Documentation

Comprehensive documentation is available in the [`docs/`](./docs) directory:

### User Documentation
- **[User Guide](./docs/USER_GUIDE.md)** - Complete guide to using Finsite
- **[FAQ & Troubleshooting](./docs/USER_GUIDE.md#troubleshooting)** - Common questions and solutions

### Developer Documentation
- **[Development Guide](./docs/DEVELOPMENT.md)** - Local setup, workflow, and best practices
- **[Deployment Guide](./docs/DEPLOYMENT.md)** - Build and deploy to production
- **[Contributing Guidelines](./CONTRIBUTING.md)** - How to contribute to Finsite
- **[API Documentation](./docs/api/)** - Auto-generated JSDoc reference

### Architecture Documentation
- **[Architecture Overview](./docs/architecture/README.md)** - System design and component hierarchy
- **[MVC Pattern](./docs/architecture/02-mvc-architecture.md)** - Model-View-Controller implementation
- **[Data Flow](./docs/architecture/04-data-flow.md)** - How data moves through the application
- **[Storage Architecture](./docs/architecture/05-storage-architecture.md)** - IndexedDB design and optimization

### Architecture Decision Records (ADRs)
- **[ADR-01: Use MVC Architecture](./docs/adr/01-use-mvc-architecture.md)** - Why we chose MVC pattern
- **[ADR-02: IndexedDB for Storage](./docs/adr/02-choose-indexeddb-for-storage.md)** - Local-first data persistence
- **[ADR-03: Chart.js for Visualization](./docs/adr/03-adopt-chartjs-for-visualization.md)** - Charting library selection
- **[ADR-04: Modular UI Components](./docs/adr/04-organize-ui-with-modular-components.md)** - Component organization
- **[ADR-05: Vanilla JavaScript](./docs/adr/05-use-vanilla-javascript.md)** - No framework approach
- **[View all ADRs →](./docs/adr/)**

---

## 🏗️ Project Structure

```
Finsite/
├── src/
│   ├── index.html              # Main HTML entry point
│   ├── app.js                  # Application initialization
│   ├── styles.css              # Global styles
│   │
│   ├── model/                  # 📊 Data Layer (MVC Model)
│   │   ├── financeModel.js     # Core business logic & state management
│   │   ├── seedDatabase.js     # Sample data for new users
│   │   └── seedTransactions.js # Transaction seeding utilities
│   │
│   ├── view/                   # 🎨 Presentation Layer (MVC View)
│   │   └── financeView.js      # DOM manipulation & rendering
│   │
│   ├── controller/             # 🎮 Coordination Layer (MVC Controller)
│   │   └── financeController.js # Event handling & app orchestration
│   │
│   ├── components/             # 🧩 Reusable UI Components
│   │   ├── dashboard.js        # Dashboard overview component
│   │   ├── transactions.js     # Transaction list component
│   │   ├── categories.js       # Category management component
│   │   ├── header.js           # App header with navigation
│   │   └── sidebar.js          # Navigation sidebar
│   │
│   ├── chart/                  # 📈 Chart.js Integration
│   │   ├── chart-core.js       # Chart initialization & config
│   │   ├── spending-chart.js   # Spending trend charts
│   │   └── category-chart.js   # Category breakdown charts
│   │
│   ├── storage/                # 💾 IndexedDB Abstraction
│   │   └── storageService.js   # CRUD operations for local storage
│   │
│   └── utils/                  # 🛠️ Helper Functions
│       ├── categoryAggregator.js # Category & group calculations
│       ├── formatters.js       # Date & currency formatting
│       ├── icons.js            # Category/group icon mappings
│       └── debugService.js     # Centralized debug logging
│
├── test/
│   ├── unit/                   # Unit tests (Vitest)
│   └── e2e-tests/              # E2E tests (Playwright)
│       ├── smoke.spec.ts       # Basic app loading tests
│       ├── add-transaction.spec.ts
│       ├── dashboard-stats.spec.ts
│       ├── chart-render.spec.ts
│       └── ... (21 test suites)
│
├── docs/                       # 📚 Documentation
│   ├── adr/                    # Architecture Decision Records
│   ├── architecture/           # System architecture diagrams
│   └── api/                    # Auto-generated API docs
│
├── ChartJS/                    # Chart.js library files
├── package.json                # Dependencies & scripts
├── vite.config.js              # Vite build configuration
└── playwright.config.ts        # E2E test configuration
```

---

## 🧪 Testing

Finsite includes comprehensive test coverage:

### End-to-End Tests (Playwright)
```bash
# Run all E2E tests
npm run e2e

# Run tests in UI mode (interactive)
npm run e2e:ui

# Debug specific test
npm run e2e:debug

# View test report
npm run e2e:report
```

**Test Coverage:**
- 21 test suites covering all major features
- Smoke tests, navigation, CRUD operations
- Form validation, filtering, sorting, search
- Chart rendering and data visualization
- Modal interactions and user workflows

### Unit Tests (Vitest)
```bash
# Run unit tests
npm test
```

### Linting
```bash
# Check code style
npm run lint

# Fix auto-fixable issues
npm run lint:fix
```

---

## 🏛️ Architecture

### MVC Pattern

Finsite follows the **Model-View-Controller** architectural pattern for clear separation of concerns:

```
┌─────────────────────────────────────────────────────┐
│                    👤 User                          │
└────────────────────┬────────────────────────────────┘
                     │ Interactions
                     ▼
         ┌───────────────────────┐
         │   🎨 View Layer       │
         │  (financeView.js)     │
         │  - DOM Manipulation   │
         │  - Event Binding      │
         │  - UI Components      │
         └───────┬───────────────┘
                 │ User Events
                 ▼
         ┌───────────────────────┐
         │  🎮 Controller Layer  │
         │ (financeController.js)│
         │  - Event Handling     │
         │  - Orchestration      │
         │  - Validation         │
         └───────┬───────────────┘
                 │ State Updates
                 ▼
         ┌───────────────────────┐
         │  📊 Model Layer       │
         │  (financeModel.js)    │
         │  - Business Logic     │
         │  - State Management   │
         │  - Data Aggregation   │
         └───────┬───────────────┘
                 │ CRUD Operations
                 ▼
         ┌───────────────────────┐
         │  💾 Storage Layer     │
         │ (storageService.js)   │
         │  - IndexedDB Access   │
         │  - Data Persistence   │
         └───────────────────────┘
```

### Performance Optimization

**O(1) Incremental Aggregation:**
- Dashboard metrics update in constant time
- Pre-computed monthly and group totals
- No full transaction scans on updates
- Cached computations for instant UI refresh

### Key Design Decisions

1. **Vanilla JavaScript** - No framework overhead, full control, transferable skills
2. **IndexedDB** - Client-side storage, privacy-first, offline support
3. **Chart.js** - Mature, performant charting with lazy loading
4. **Web Components** - Modular, reusable UI without framework
5. **E2E Testing** - Comprehensive Playwright coverage for reliability

See [Architecture Decision Records](./docs/adr/) for detailed rationale.

---

## 🛠️ Technology Stack

| Category | Technology | Purpose |
|----------|-----------|---------|
| **Language** | Vanilla JavaScript (ES6+) | Core application logic |
| **Build Tool** | Vite | Development server & production bundling |
| **Storage** | IndexedDB | Client-side data persistence |
| **Visualization** | Chart.js | Interactive charts and graphs |
| **Testing** | Playwright + Vitest | E2E and unit test coverage |
| **Code Quality** | ESLint (Airbnb) | Consistent code style |
| **Documentation** | JSDoc + documentation.js | API reference generation |

**Zero Runtime Dependencies** - Chart.js is the only library loaded in production.

---

## 📜 Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite development server |
| `npm run build` | Create production build in `dist/` |
| `npm run preview` | Preview production build locally |
| `npm test` | Run unit tests with Vitest |
| `npm run e2e` | Run E2E tests with Playwright |
| `npm run e2e:ui` | Run E2E tests in interactive UI mode |
| `npm run e2e:debug` | Debug E2E tests step-by-step |
| `npm run lint` | Check code style with ESLint |
| `npm run lint:fix` | Auto-fix linting issues |
| `npm run docs:generate` | Generate API documentation |
| `npm run docs:serve` | Serve docs with live reload |

---

## 🤝 Contributing

We welcome contributions! Here's how to get started:

1. **Fork the repository** on GitHub
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Make your changes** following our [code style guidelines](./CONTRIBUTING.md)
4. **Write or update tests** as needed
5. **Commit your changes**: `git commit -m 'Add amazing feature'`
6. **Push to your fork**: `git push origin feature/amazing-feature`
7. **Open a Pull Request** with a clear description

### Contribution Guidelines

- Follow the [Contributing Guide](./CONTRIBUTING.md)
- Add JSDoc comments for all functions
- Include tests for new features
- Update documentation as needed
- Follow Airbnb JavaScript style guide
- Create ADRs for architectural decisions

---

## 🗺️ Roadmap

### v1.0 - Foundation (Q1 2026) 🟡 In Progress
- ✅ Core transaction management
- ✅ Dashboard with visualizations
- ✅ Category organization
- 🟡 Complete documentation
- 📋 80%+ test coverage

### v1.1 - Data Management (Q2 2026)
- CSV import/export
- Transaction editing
- Recurring transactions
- Dark mode theme
- Keyboard shortcuts

### v1.2 - Analytics (Q2 2026)
- Advanced filtering
- Budget goals with alerts
- Spending predictions
- Category insights
- Custom date ranges

### v2.0 - Collaboration (Q3 2026)
- Multi-device sync (optional)
- Data backup to cloud
- Shared budgets
- Mobile PWA

View the [complete roadmap](./docs/ROADMAP.md) for detailed plans.

---

## 📄 License

This project is licensed under the **ISC License** - see the [LICENSE](./LICENSE) file for details.

---

## 🙏 Acknowledgments

- **[Chart.js](https://www.chartjs.org/)** - Beautiful, responsive charts
- **[Vite](https://vitejs.dev/)** - Lightning-fast build tool
- **[Playwright](https://playwright.dev/)** - Reliable E2E testing
- **[MDN Web Docs](https://developer.mozilla.org/)** - Essential web development reference

---

## 📞 Support & Contact

- **Issues**: [GitHub Issues](https://github.com/FIn-Site/Finsite/issues)
- **Discussions**: [GitHub Discussions](https://github.com/FIn-Site/Finsite/discussions)
- **Documentation**: [docs/](./docs)

---

<div align="center">

**Built with ❤️ using Vanilla JavaScript**

⭐ **Star this repo** if you find it helpful!

[Report Bug](https://github.com/FIn-Site/Finsite/issues) · [Request Feature](https://github.com/FIn-Site/Finsite/issues) · [Read Docs](./docs)

</div>
