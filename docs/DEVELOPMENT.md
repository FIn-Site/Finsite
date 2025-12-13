# Development Guide

This guide covers local development setup, workflow, and best practices for contributing to Finsite.

---

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **Git** - [Download](https://git-scm.com/)
- **Modern web browser** - Chrome, Firefox, or Edge
- **Code editor** - VS Code recommended

---

## Initial Setup

### 1. Clone the Repository

```bash
git clone https://github.com/FIn-Site/Finsite.git
cd Finsite
```

### 2. Install Dependencies

```bash
npm install
```

This installs:
- **Vite** - Development server and build tool
- **Playwright** - E2E testing framework
- **Vitest** - Unit testing framework
- **ESLint** - Code linting with Airbnb style guide

### 3. Start Development Server

```bash
npm run dev
```

This starts Vite's development server. Open your browser to the URL shown in the terminal (typically `http://localhost:5173`).

**Features:**
- Hot Module Replacement (HMR) - Changes reflect instantly
- Fast startup and rebuild times
- Detailed error messages with source maps

---

## Project Structure

```
Finsite/
├── src/
│   ├── index.html          # Main HTML entry point
│   ├── app.js              # Application initialization
│   ├── styles.css          # Global styles
│   ├── controller/         # MVC Controller layer
│   ├── model/              # MVC Model layer (business logic)
│   ├── view/               # MVC View layer (DOM manipulation)
│   ├── components/         # Web Components (UI modules)
│   ├── chart/              # Chart.js integration
│   ├── storage/            # IndexedDB abstraction
│   └── utils/              # Helper functions
├── test/
│   ├── unit/               # Unit tests (Vitest)
│   └── e2e-tests/          # End-to-end tests (Playwright)
├── docs/
│   ├── adr/                # Architecture Decision Records
│   └── architecture/       # System architecture documentation
├── ChartJS/                # Chart.js library files
└── package.json            # Dependencies and scripts
```

---

## Development Workflow

### Making Changes

1. **Create a feature branch:**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes** in the `src/` directory

3. **Test locally** - The dev server will auto-reload

4. **Run linter:**
   ```bash
   npm run lint
   ```

5. **Run unit tests:**
   ```bash
   npm test
   ```

6. **Run E2E tests:**
   ```bash
   npm run e2e
   ```

### Code Style

- **ESLint**: Enforces Airbnb JavaScript style guide with custom overrides
- **Indentation**: 4 spaces
- **ES Modules**: Use `import`/`export` with `.js` extensions
- **Naming**: 
  - `camelCase` for functions and variables
  - `PascalCase` for classes and components
  - `_privateMethod` for internal methods (underscore prefix)

### Running Tests

**Unit Tests (Vitest):**
```bash
npm test                    # Run all unit tests
npm test -- --watch         # Watch mode
npm test -- --coverage      # Generate coverage report
```

**E2E Tests (Playwright):**
```bash
npm run e2e                 # Run all E2E tests
npm run e2e:ui              # Run with UI mode (interactive)
npm run e2e:debug           # Debug mode (step through)
npm run e2e:report          # View HTML report
```

**Linting:**
```bash
npm run lint                # Check for issues
npm run lint:fix            # Auto-fix issues
```

---

## Architecture Overview

Finsite uses the **MVC (Model-View-Controller)** architectural pattern:

### Model (`src/model/financeModel.js`)
- Manages application state (transactions, categories, budgets)
- Implements O(1) incremental aggregation for dashboard performance
- Handles data validation and business logic
- Abstracts IndexedDB operations via storage service

### View (`src/view/financeView.js`)
- Handles all DOM manipulation
- Maintains references to Web Components
- Forwards user events to controller
- Passive layer - no business logic

### Controller (`src/controller/financeController.js`)
- Coordinates between Model and View
- Handles user interactions and navigation
- Manages application flow and state transitions
- Optimizes UI updates based on operation type

### Storage (`src/storage/storageService.js`)
- IndexedDB abstraction layer
- Promise-based API for all data operations
- Handles transactions, categories, and groups

### Components (`src/components/`)
- Self-contained Web Components using Shadow DOM
- Encapsulated styles (no global CSS conflicts)
- Event-driven communication with parent components

---

## Common Development Tasks

### Adding a New Feature

1. **Identify affected layers** (Model, View, Controller, Component)
2. **Update Model** if data structure changes
3. **Update Storage Service** if new IndexedDB operations needed
4. **Update Controller** to handle new user interactions
5. **Update View** to render new UI elements
6. **Add/update Components** for new UI modules
7. **Write tests** (unit and E2E)
8. **Update documentation** (ADRs if architectural change)

### Debugging

**Browser DevTools:**
- Use Chrome DevTools for inspecting Web Components (Shadow DOM)
- Check IndexedDB in Application tab
- Use Network tab to verify resource loading

**Console Logging:**
- Model, View, and Controller have `_debugLog()` methods
- Enable via: `model.debug = true` in browser console

**Playwright Debug:**
```bash
npm run e2e:debug           # Step through E2E tests
```

### Working with IndexedDB

**View data in browser:**
1. Open DevTools → Application tab
2. Navigate to IndexedDB → finsiteDB
3. Inspect transactions, groups, categories stores

**Clear database:**
```javascript
// In browser console
const request = indexedDB.deleteDatabase('finsiteDB');
request.onsuccess = () => location.reload();
```

---

## Best Practices

### Code Organization
- Keep files under 500 lines when possible
- One class/component per file
- Use JSDoc comments for all public methods
- Follow single responsibility principle

### Testing
- Write unit tests for business logic (Model)
- Add E2E tests for user-facing features
- Use `data-testid` attributes for stable test selectors
- Mock IndexedDB in unit tests using fake-indexeddb

### Performance
- Model uses O(1) aggregation - maintain this pattern
- Avoid re-rendering entire component trees
- Use `isHeavyUpdate` flag for bulk operations
- Lazy-load Chart.js if needed

### Accessibility
- Use semantic HTML elements
- Add ARIA labels where needed
- Ensure keyboard navigation works
- Test with screen readers

---

## Troubleshooting

### Dev Server Won't Start
- Check if port 5173 is in use: `lsof -i :5173` (Mac/Linux) or `netstat -ano | findstr :5173` (Windows)
- Try: `npm run dev -- --port 3000` to use different port

### Tests Failing
- Clear node_modules and reinstall: `rm -rf node_modules && npm install`
- Update Playwright browsers: `npx playwright install`
- Check if IndexedDB is being cleared between tests

### ESLint Errors
- Run auto-fix: `npm run lint:fix`
- Check `.eslintrc.json` for rule overrides
- See `docs/adr/07-configure-eslint-rules.md` for explanations

### Build Issues
- Clear Vite cache: `rm -rf node_modules/.vite`
- Restart dev server
- Check browser console for errors

---

## Getting Help

- **Documentation**: Check `docs/` directory for ADRs and architecture docs
- **Issues**: [GitHub Issues](https://github.com/FIn-Site/Finsite/issues)
- **Code Review**: Open a pull request for feedback
- **Architecture Questions**: See `docs/adr/` for decision records

---

## Next Steps

- Review [Architecture Documentation](architecture/README.md)
- Read [ADR files](adr/README.md) for design decisions
- Check [Deployment Guide](DEPLOYMENT.md) for production deployment
- See [Contributing Guidelines](../CONTRIBUTING.md) for pull request process
