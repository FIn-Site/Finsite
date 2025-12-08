# ESLint Configuration Decisions

**Date:** December 8, 2025  
**Status:** Active  
**Context:** Airbnb Base ESLint configuration with custom rule overrides

---

## Overview

This document explains the ESLint configuration choices made for the Finsite project. We use the Airbnb JavaScript Style Guide as our base, but have customized specific rules to better match our project's runtime environment (native browser ES modules) and development needs.

---

## Environment Configuration

### `env: { browser: true }`

**What it does:**
- Tells ESLint that this code executes in a browser environment
- Registers browser-specific globals (`window`, `document`, `navigator`, `localStorage`, etc.) as known built-ins
- Prevents `no-undef` from flagging legitimate browser APIs as undeclared variables

**Why we enabled it:**
- Our codebase legitimately uses browser APIs throughout (e.g., `document.querySelector()`, `document.readyState`, `window.addEventListener()`)
- Without `browser: true`, ESLint treats `document` and other browser globals as undeclared variables and throws false-positive `no-undef` errors
- This is a configuration gap, not a real bug—we fix the config instead of the code

**Impact:** Eliminates dozens of false-positive errors for valid browser API usage.

---

### `env: { es2021: true }`

**What it does:**
- Configures ESLint to parse and understand ES2021 language features (and all prior versions)
- Implicitly sets `parserOptions.ecmaVersion` to 2021
- Recognizes modern syntax: `const`/`let`, arrow functions, template literals, destructuring, spread operators, optional chaining, nullish coalescing, etc.

**Why we enabled it:**
- Our codebase uses modern JavaScript, not legacy ES5
- If ESLint assumes an older ECMAScript version, valid modern syntax may be flagged as errors or parsed incorrectly
- Setting `es2021: true` aligns ESLint's parser with the actual language features we use

**Impact:** Ensures ESLint correctly understands and validates modern JavaScript syntax.

---

## Disabled Rules

All rule overrides live in the `rules` section of `.eslintrc.json`:

```json
"rules": {
  "no-console": "off",
  "no-plusplus": "off",
  "no-underscore-dangle": "off",
  "import/extensions": "off"
}
```

---

### 1. `"no-console": "off"`

**What the rule does:**
- Forbids using `console.log()`, `console.error()`, `console.warn()`, etc.
- Airbnb treats console statements as debug code that shouldn't reach production
- Designed to prevent noisy or accidentally-committed logging

**Why we disabled it:**
- `console.log()` is a legitimate debugging tool during active development
- For a local/educational/small-team application, banning console creates more friction than value
- Fighting dozens of `no-console` errors for code that isn't actually problematic wastes time
- We prioritize development velocity over strict production-readiness during iteration

**Tradeoff:**
- Could later re-enable as `"warn"` for gentle reminders without blocking
- For production builds, a bundler (Webpack, Vite) could strip console calls via plugins

**Impact:** Allows flexible logging during development without ESLint noise.

---

### 2. `"no-plusplus": "off"`

**What the rule does:**
- Forbids increment (`++`) and decrement (`--`) operators
- Forces alternative syntax: `i += 1` instead of `i++`
- Rationale: Prevents confusion between pre-increment (`++i`) and post-increment (`i++`), and avoids side effects in complex expressions

**Why we disabled it:**
- Standard loop constructs like `for (let i = 0; i < n; i++)` are perfectly clear and idiomatic
- Disallowing `++` in simple loop contexts is purely stylistic and doesn't improve correctness
- Enforcing `i += 1` everywhere creates busy-work refactoring standard patterns
- The rule is "style for style's sake" rather than bug prevention in our use cases

**When the rule helps:**
- Expressions like `array[i++]` or `if (++count > 10)` can be confusing
- Our code doesn't have complex increment/decrement side effects

**Impact:** Maintains idiomatic JavaScript loop syntax without artificial restrictions.

---

### 3. `"no-underscore-dangle": "off"`

**What the rule does:**
- Flags identifiers with leading or trailing underscores (e.g., `_initChart`, `_isInitializing`, `_cachedData`)
- Airbnb discourages using `_` to signal "private" or "internal" members
- Reasoning: JavaScript has no true private members (pre-ES2022 `#`), so `_` is just a convention with no enforcement

**Why we disabled it:**
- Our codebase uses `_` prefixes to mark internal/private-ish methods and properties (e.g., `_timeBuckets`, `_refreshDashboard`, `_isInitializing`)
- This is a common convention for signaling intent, especially in class-based or modular code
- Renaming all underscore-prefixed identifiers provides zero functional benefit and creates massive churn
- Some third-party libraries or charting internals may also use underscore conventions we can't control

**Alternative considered:**
- Could configure `allowAfterThis: true` or use per-file overrides
- For now, full disabling removes noise without compromising code quality

**Impact:** Preserves intentional naming conventions for internal APIs without ESLint interference.

---

### 4. `"import/extensions": "off"`

**What the rule does:**
- Controls whether file extensions (`.js`, `.mjs`, `.json`) are required or forbidden in import statements
- Airbnb defaults to **disallowing** `.js` extensions for local imports (expects extensionless imports like `import x from './foo';`)
- Assumes a Node.js or bundler environment (Webpack, Rollup) that resolves extensions automatically

**Why we disabled it:**
- **Our runtime environment:** Native ES modules in the browser (`<script type="module">`)
- **Browser requirement:** Import paths **must** include `.js` extensions—`import x from './foo.js';` is mandatory
- If we removed `.js` to satisfy the rule, our code would **break in the browser** with 404 errors
- ESLint's default assumption (Node/bundler toolchain) doesn't match our actual execution environment

**The conflict:**
```javascript
// ✅ Works in browser (required)
import { FinanceController } from './controller/financeController.js';

// ❌ Breaks in browser (404: cannot resolve './controller/financeController')
import { FinanceController } from './controller/financeController';
```

**Why this matters:**
- We're **not** using a build tool that transforms imports
- We serve raw `.js` files directly to the browser
- Browser module resolution requires explicit file extensions per the ES modules spec

**Impact:** Allows correct native ES module imports without artificially breaking working code.

---

## Parser Configuration

### `parserOptions.sourceType: "module"`

**What it does:**
- Tells ESLint to parse all files as ES modules (rather than scripts)
- Enables `import`/`export` syntax, `import.meta`, and module-specific features
- Sets the parsing mode to match ECMAScript module semantics

**Why we configured it:**
- Our entire codebase uses native ES modules (`import`/`export` statements)
- Without `sourceType: "module"`, ESLint would treat files as scripts and flag module syntax as errors
- Aligns ESLint's parser with how the browser actually executes our code (`<script type="module">`)

**Impact:** Allows ESLint to correctly parse and validate ES module syntax throughout the project.

---

### `parserOptions.ecmaVersion: 12`

**What it does:**
- Sets the ECMAScript version to ES2021 (version 12)
- Enables parsing of modern features: optional chaining (`?.`), nullish coalescing (`??`), `BigInt`, `Promise.allSettled()`, etc.
- Works in conjunction with `env: { es2021: true }` for complete ES2021 support

**Why we configured it:**
- Explicitly declares the language version our code targets
- Ensures ESLint understands all ES2021 syntax we use (optional chaining, nullish coalescing, etc.)
- Provides clarity and specificity beyond just the `env` setting

**Impact:** Guarantees ESLint correctly parses all modern JavaScript features we depend on.

---

## Global Declarations

### `globals.Chart: "readonly"`

**What it does:**
- Declares `Chart` as a read-only global variable
- Tells ESLint that `Chart` is provided by an external script (Chart.js loaded via `<script>` tag)
- Prevents `no-undef` errors when using `Chart` while still protecting against accidental reassignment

**Why we configured it:**
- Chart.js is loaded globally via CDN (`<script>` tag), not imported as an ES module
- Without this declaration, ESLint flags every `Chart.defaults`, `new Chart()`, etc. as undefined
- `"readonly"` ensures we can't accidentally do `Chart = something` and break the library

**The pattern:**
```javascript
// ✅ Allowed: using the global Chart object
Chart.defaults.font.family = 'Inter';
const chart = new Chart(ctx, config);

// ❌ Blocked: reassigning the global
Chart = myCustomChart; // ESLint error
```

**Impact:** Allows legitimate Chart.js usage while maintaining protection against unintended modifications.

---

## Modified Rules

These rules remain enabled but with customized configurations:

```json
"rules": {
  "import/prefer-default-export": "off",
  "indent": ["error", 4, { "SwitchCase": 1 }],
  "no-use-before-define": ["error", { "functions": false, "classes": true, "variables": true }],
  "no-param-reassign": ["error", { "props": false }]
}
```

---

### 5. `"import/prefer-default-export": "off"`

**What the rule does:**
- Enforces using `export default` when a module has only a single export
- Discourages named exports (`export { Foo }`) in favor of default exports (`export default Foo`)
- Aims for consistency in single-export modules

**Why we disabled it:**
- Our codebase consistently uses named exports (e.g., `export { FinSiteDashboard }`, `export { FinanceModel }`)
- Named exports provide better refactoring support (easier to rename, find references)
- Mixing default and named exports based on file export count creates inconsistency
- We prefer the explicitness of named exports across the entire project

**Example pattern we use:**
```javascript
// Our preferred style (named export)
export { FinanceController };

// Rule wants this (default export)
export default FinanceController;
```

**Impact:** Maintains consistent named export pattern throughout the codebase without ESLint friction.

---

### 6. `"indent": ["error", 4, { "SwitchCase": 1 }]`

**What the rule does:**
- Enforces consistent indentation throughout the codebase
- Sets indent size to **4 spaces** (overriding Airbnb's 2-space default)
- Requires 1 additional indentation level for `case` statements inside `switch` blocks

**Why we configured it:**
- Our project uses 4-space indentation as the chosen visual style
- Airbnb defaults to 2 spaces, which doesn't match our existing codebase
- 4 spaces provide clearer visual hierarchy, especially in nested structures
- `SwitchCase: 1` prevents awkward alignment of `case` statements flush with `switch`

**Example:**
```javascript
switch (type) {
    case 'expense':  // Indented 1 level from switch
        return calculateExpense();
    case 'income':
        return calculateIncome();
    default:
        return 0;
}
```

**Impact:** Aligns ESLint's indentation expectations with our actual code style, eliminating hundreds of false errors.

---

### 7. `"no-use-before-define": ["error", { "functions": false, "classes": true, "variables": true }]`

**What the rule does:**
- Prevents using variables, classes, or functions before they're defined in the code
- By default, flags **all** usage before definition as errors
- Protects against temporal dead zone issues and initialization order bugs

**Why we customized it:**
- **Functions:** JavaScript hoists function declarations, so calling a function before its definition is safe and idiomatic
- **Classes & Variables:** These are **not** hoisted safely (`let`/`const` have temporal dead zones), so we keep the protection
- Our code uses a pattern of calling helper functions (like `_applyDefaults()`, `formatCurrency()`) before their definitions

**Example:**
```javascript
// ✅ Allowed: function called before definition (hoisted)
initializeChart();
function initializeChart() { /* ... */ }

// ❌ Still blocked: class used before definition
const instance = new MyClass(); // Error!
class MyClass { /* ... */ }

// ❌ Still blocked: variable used before definition
console.log(value); // Error!
const value = 42;
```

**Impact:** Allows natural function organization while maintaining safety for classes and variables.

---

### 8. `"no-param-reassign": ["error", { "props": false }]`

**What the rule does:**
- Prevents reassigning function parameters (e.g., `param = newValue`)
- By default, also prevents mutating parameter properties (e.g., `param.key = value`)
- Protects against accidental side effects and unclear data flow

**Why we customized it:**
- **Parameter reassignment:** Still blocked—reassigning `param = something` is confusing and error-prone
- **Property mutation:** Allowed via `props: false`—necessary for configuring objects like Chart.js defaults
- Chart.js configuration requires mutating `Chart.defaults.*` properties, which are passed as parameters

**Example:**
```javascript
function configureChart(defaults) {
    // ❌ Still blocked: reassigning the parameter
    defaults = {}; // Error!
    
    // ✅ Allowed: mutating properties of the parameter
    defaults.font.family = 'Inter';
    defaults.color = '#f1f5f9';
}

// Real usage in chart-core.js
function _applyDefaults(Chart) {
    Chart.defaults.font.family = 'Inter'; // ✅ Allowed
    Chart.defaults.color = '#f1f5f9';     // ✅ Allowed
}
```

**Impact:** Enables necessary Chart.js configuration patterns while maintaining protection against parameter reassignment.

---

### 9. `"class-methods-use-this": "off"`

**What the rule does:**
- Flags any class method that doesn't reference `this`
- Suggests converting such methods to static methods or moving them outside the class
- Aims to ensure instance methods actually need instance context

**Why we disabled it:**
- Our web components contain small helper methods (e.g., `_formatCurrency()`) that are intentionally instance methods for organizational clarity
- These helpers are called as `this._formatCurrency(...)` which is readable and consistent with the component's API
- They don't need to access instance state, but keeping them as instance methods maintains logical cohesion
- Making every helper `static` or extracting it outside the class would fragment the component's structure without improving correctness

**Example pattern we use:**
```javascript
class FinSiteDashboard extends HTMLElement {
    _formatCurrency(amount) {
        // Doesn't use 'this', but logically belongs to the component
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    }
    
    updateBalance(amount) {
        // Uses the helper as an instance method
        this.shadowRoot.querySelector('.balance').textContent = this._formatCurrency(amount);
    }
}
```

**Impact:** Allows organizing helper methods within classes for cohesion without forcing artificial static declarations.

---

### 10. `"max-len": "off"`

**What the rule does:**
- Enforces a maximum line length (Airbnb default: 100 characters)
- Flags any line exceeding the limit, regardless of context
- Intended to improve readability by preventing overly long lines

**Why we disabled it:**
- Our code occasionally uses wider lines in contexts where they're more readable than forced breaks:
  - Long object spreads with many properties
  - HTML template strings in web components
  - Chained method calls with descriptive names
  - Detailed configuration objects
- Breaking these lines purely to satisfy character count often reduces readability rather than improving it
- Line width is primarily an editor/display concern—modern editors handle wrapping well
- For this project, semantic clarity matters more than arbitrary character limits

**Example scenarios:**
```javascript
// Long template string that reads better as one line
return `<div class="transaction-row" data-id="${id}" data-type="${type}" data-amount="${amount}" data-category="${category}">`;

// Object spread with many properties
const config = { ...baseDefaults, backgroundColor: '#1e293b', borderColor: '#334155', pointRadius: 4, tension: 0.4 };
```

**Impact:** Eliminates cosmetic line-length errors while maintaining focus on functional code quality.

---

### 11. `"no-restricted-syntax": [customized]`

**What the rule does (Airbnb default):**
- Bans several JavaScript constructs: `for...in`, `for...of`, labeled statements, and `with`
- Original rationale: Avoid iterators and generators that require regenerator-runtime polyfills
- Applies blanket restrictions across all loop types

**Why we customized it:**
- **`for...of` loops:** We use these extensively for iterating arrays and Maps (e.g., transaction grouping, rendering lists)
- Modern browser-only environment: No polyfill concerns with `for...of`—it's native and performant
- **Kept restrictions on:**
  - `for...in`: Dangerous for arrays (iterates prototype chain); better to use `Object.keys()`/`Object.entries()`
  - Labeled statements: Rare, confusing control flow with `break label`/`continue label`
  - `with`: Forbidden in strict mode and creates scope ambiguity

**Our configuration:**
```json
"no-restricted-syntax": [
    "error",
    {
        "selector": "ForInStatement",
        "message": "for..in is discouraged. Use Object.keys/entries + array methods instead."
    },
    {
        "selector": "LabeledStatement",
        "message": "Labels are discouraged."
    },
    {
        "selector": "WithStatement",
        "message": "`with` is forbidden in strict mode."
    }
]
```

**Example of allowed pattern:**
```javascript
// ✅ Allowed: for...of with arrays and Maps
for (const transaction of transactions) {
    processTransaction(transaction);
}

for (const [date, items] of groupedByDate) {
    renderDateGroup(date, items);
}

// ❌ Still blocked: for...in over arrays
for (const key in transactions) { // Error!
    console.log(transactions[key]);
}
```

**Impact:** Enables idiomatic `for...of` usage for modern JavaScript while maintaining safety warnings for problematic constructs.

---

### 12. `"prefer-destructuring": ["error", { "array": false, "object": true }]`

**What the rule does (Airbnb default):**
- Enforces destructuring for both objects and arrays
- Pushes patterns like `const { foo } = obj;` instead of `const foo = obj.foo;`
- For arrays: `const [first] = arr;` instead of `const first = arr[0];`

**Why we customized it:**
- **Object destructuring:** Generally improves clarity and conciseness—we keep this enabled
- **Array destructuring:** Not always more readable, especially for single-element access
- Explicit array indexing (`arr[0]`, `arr[1]`) is often clearer than destructuring in our codebase
- The rule was generating noise for perfectly clear index-based access patterns

**Our configuration:**
```json
"prefer-destructuring": [
    "error",
    {
        "array": false,
        "object": true
    },
    {
        "enforceForRenamedProperties": false
    }
]
```

**Examples:**
```javascript
// ✅ Object destructuring: still encouraged
const { amount, category, date } = transaction;

// ✅ Allowed: explicit array indexing (clearer for single elements)
const firstTransaction = transactions[0];
const lastItem = items[items.length - 1];

// ❌ Would be required if array: true
const [firstTransaction] = transactions; // Less clear for single access
```

**Impact:** Maintains object destructuring benefits while avoiding forced array destructuring that reduces clarity.

---
