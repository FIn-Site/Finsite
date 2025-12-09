# JSDoc Style Guide for Finsite

## Overview

This guide defines the JSDoc conventions for the Finsite codebase. All JavaScript code should include JSDoc comments for functions, classes, methods, and complex data structures.

## Why JSDoc?

- **IDE Support**: Enables IntelliSense/autocomplete in VS Code
- **Type Safety**: Documents expected types without TypeScript
- **Self-Documentation**: Code explains itself
- **API Clarity**: Function contracts are explicit
- **Documentation Generation**: Can auto-generate docs with JSDoc tool

## Basic Syntax

### Function Documentation

```javascript
/**
 * Brief description of what the function does.
 * 
 * More detailed explanation if needed. Can span multiple lines
 * and include usage examples or important notes.
 * 
 * @param {Type} paramName - Description of parameter
 * @param {Type} [optionalParam] - Optional parameter (note the brackets)
 * @param {Type} [paramWithDefault=defaultValue] - Parameter with default
 * @returns {Type} Description of return value
 * @throws {ErrorType} When this error might occur
 * 
 * @example
 * // Usage example
 * const result = functionName(arg1, arg2);
 */
function functionName(paramName, optionalParam, paramWithDefault = 5) {
    // implementation
}
```

### Class Documentation

```javascript
/**
 * Brief description of the class.
 * 
 * Detailed explanation of the class purpose and responsibilities.
 */
export class ClassName {
    /**
     * Create a new instance.
     * 
     * @param {Type} param - Constructor parameter
     */
    constructor(param) {
        /**
         * Description of property.
         * @type {Type}
         */
        this.property = param;
    }
    
    /**
     * Method description.
     * 
     * @param {Type} param - Parameter description
     * @returns {Type} Return value description
     */
    methodName(param) {
        // implementation
    }
}
```

### Type Definitions

```javascript
/**
 * Transaction data structure.
 * 
 * @typedef {Object} Transaction
 * @property {number} id - Auto-incremented transaction ID
 * @property {number} amount - Transaction amount (positive number)
 * @property {string} description - User-provided description
 * @property {string} date - ISO date string (YYYY-MM-DD)
 * @property {string} category - Category ID
 * @property {string} group - Group ID
 */
```

### Async Functions

```javascript
/**
 * Load all transactions from storage.
 * 
 * @async
 * @returns {Promise<Transaction[]>} Array of transaction objects
 * @throws {Error} If database connection fails
 */
async function getAllTransactions() {
    // implementation
}
```

### Callback Functions

```javascript
/**
 * Register event handlers.
 * 
 * @param {Object} handlers - Event handler functions
 * @param {function(string): void} handlers.onNavigate - Called when route changes
 * @param {function(Transaction): void} handlers.onAddTransaction - Called when transaction added
 */
function bindHandlers(handlers) {
    // implementation
}
```

## Type Conventions

### Primitive Types
- `{string}` - String value
- `{number}` - Numeric value (integer or float)
- `{boolean}` - Boolean value
- `{null}` - Null value
- `{undefined}` - Undefined value

### Complex Types
- `{Object}` - Generic object
- `{Array}` - Generic array
- `{Array<Type>}` - Array of specific type
- `{Map<KeyType, ValueType>}` - Map with typed keys/values
- `{Set<Type>}` - Set of specific type
- `{Function}` - Generic function
- `{Promise<Type>}` - Promise that resolves to Type

### DOM Types
- `{HTMLElement}` - Generic HTML element
- `{Element}` - Generic DOM element
- `{Node}` - DOM node
- `{Event}` - DOM event
- `{CustomEvent}` - Custom event

### Custom Types
- `{Transaction}` - Use @typedef for project-specific types
- `{Category}` - Custom type definitions
- `{Group}` - Domain-specific types

### Union Types
- `{string|number}` - Can be string OR number
- `{Date|string}` - Can be Date object or string

### Nullable Types
- `{?string}` - String or null
- `{!string}` - String, never null

### Optional Parameters
- `{Type} [paramName]` - Optional parameter
- `{Type} [paramName=default]` - Optional with default

## Finsite-Specific Conventions

### Model Layer

```javascript
/**
 * Add a transaction and update incremental aggregates.
 * 
 * This method updates running totals in O(1) time by maintaining
 * time buckets and group totals.
 * 
 * @param {Transaction} transaction - Transaction to add
 * @returns {Promise<Transaction>} The added transaction with generated ID
 * @throws {Error} If validation fails or storage error occurs
 */
```

### Storage Layer

```javascript
/**
 * Retrieve all transactions from IndexedDB.
 * 
 * Note: This loads all transactions into memory. For large datasets,
 * consider implementing pagination or filtering at the storage level.
 * 
 * @async
 * @returns {Promise<Transaction[]>} Array of all transactions
 * @throws {Error} If IndexedDB connection fails
 */
```

### Controller Layer

```javascript
/**
 * Handle add transaction action.
 * 
 * Validates input, updates model, refreshes view, and updates
 * dashboard charts. May throw validation errors.
 * 
 * @param {Object} transactionData - Raw form data
 * @param {number} transactionData.amount - Transaction amount (must be > 0)
 * @param {string} transactionData.description - Description text
 * @param {string} transactionData.date - ISO date string
 * @param {string} transactionData.category - Category ID (must exist)
 * @param {string} transactionData.group - Group ID (must exist)
 * @returns {Promise<void>}
 */
```

### View Layer

```javascript
/**
 * Render the main application layout.
 * 
 * Creates two-pane layout with sidebar and main content area.
 * Initializes Web Components for header, sidebar, and content.
 * 
 * @param {string} selector - CSS selector for container element
 * @returns {void}
 */
```

### Web Components

```javascript
/**
 * Dashboard Web Component.
 * 
 * Displays spending charts and summary cards. Receives pre-aggregated
 * data from Model via View. Uses Shadow DOM for encapsulation.
 * 
 * @extends HTMLElement
 * 
 * @property {Object} panelData - Dashboard summary metrics
 * @property {number} panelData.totalSpentAllTime - Total spending (all time)
 * @property {number} panelData.transactionsThisWeek - Transaction count this week
 * @property {number} panelData.monthlySpendingCurrent - Current month spending
 * @property {number} panelData.monthlySpendingLast - Last month spending
 * @property {number} panelData.monthlyChangePercent - Month-over-month change %
 * @property {Object} chartData - Pre-aggregated chart data
 */
class FinSiteDashboard extends HTMLElement {
    // implementation
}
```

## Required Documentation

### All Public Functions/Methods
- Function purpose (what it does)
- All parameters with types and descriptions
- Return value with type and description
- Side effects or state mutations
- Thrown errors
- Usage example for complex functions

### All Classes
- Class purpose and responsibilities
- Constructor parameters
- Important properties (especially public ones)

### Complex Data Structures
- Use @typedef for any object passed between layers
- Document all properties with types
- Include constraints (e.g., "amount must be positive")

### Module-Level Comments
```javascript
/**
 * @fileoverview Brief description of module's purpose
 * @module moduleName
 * @author Your Name (optional)
 */
```

## What NOT to Document

- Obvious getters/setters if they just return/set a property
- Private implementation details (prefix with underscore)
- Trivial one-line functions that are self-explanatory

```javascript
// ❌ Don't over-document obvious code
/**
 * Gets the name.
 * @returns {string} The name
 */
getName() {
    return this.name;
}

// ✅ But DO document if there are side effects or complexity
/**
 * Gets the current month's spending total.
 * 
 * Uses cached aggregate from incremental aggregation system.
 * Returns 0 if no transactions exist for current month.
 * 
 * @returns {number} Total spending for current month
 */
getCurrentMonthSpending() {
    const key = this._currentBucketKey;
    return this._timeBuckets.get(key) || 0;
}
```

## VS Code Integration

Add to `.vscode/settings.json`:

```json
{
  "javascript.suggest.jsdoc.generateReturns": true,
  "javascript.suggest.completeJSDocs": true,
  "javascript.inlayHints.parameterNames.enabled": "all",
  "javascript.inlayHints.functionLikeReturnTypes.enabled": true
}
```

## JSDoc Generation

To generate HTML documentation:

```bash
# Install JSDoc
npm install -g jsdoc

# Generate docs
jsdoc src/ -r -d docs/api -c jsdoc.json
```

Example `jsdoc.json`:
```json
{
  "source": {
    "include": ["src"],
    "includePattern": ".+\\.js$",
    "excludePattern": "(node_modules/|test/)"
  },
  "opts": {
    "destination": "./docs/api",
    "recurse": true,
    "readme": "./README.md"
  },
  "plugins": ["plugins/markdown"]
}
```

## Examples from Finsite

### Good Example: Model Method

```javascript
/**
 * Calculate spending for the last N months using cached aggregates.
 * 
 * Returns an array of monthly spending totals in chronological order
 * (oldest first). Uses pre-computed time buckets for O(1) lookup per month.
 * Missing months return 0.
 * 
 * @param {number} [months=6] - Number of months to include
 * @returns {number[]} Array of monthly spending totals
 * 
 * @example
 * // Get last 6 months of spending
 * const spending = model.getLastNMonthsSpending(6);
 * // => [450.00, 523.50, 489.25, 612.00, 545.75, 498.50]
 */
getLastNMonthsSpending(months = 6) {
    const keys = this._getLastNMonthKeys(months);
    return keys.map(key => this._timeBuckets.get(key) || 0);
}
```

### Good Example: Component Method

```javascript
/**
 * Update dashboard with new data.
 * 
 * Re-renders summary cards and updates chart. Does not trigger
 * a full component re-render, only updates changed elements.
 * 
 * @param {Object} newPanelData - Updated panel metrics
 * @param {Object} newChartData - Updated chart data
 * @returns {void}
 */
updateData(newPanelData, newChartData) {
    this.panelData = newPanelData;
    this.chartData = newChartData;
    this._updatePanelDisplay();
    this._updateChart();
}
```

## Resources

- [JSDoc Official Documentation](https://jsdoc.app/)
- [VS Code JSDoc Support](https://code.visualstudio.com/docs/languages/javascript#_jsdoc-support)
- [Google JavaScript Style Guide - JSDoc](https://google.github.io/styleguide/jsguide.html#jsdoc)

## Questions?

- See existing code for examples
- Check [CONTRIBUTING.md](../CONTRIBUTING.md) for code review requirements
- Open an issue with the `documentation` label
