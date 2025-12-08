# ESLint Configuration Decisions

**Date:** December 7, 2025  
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

