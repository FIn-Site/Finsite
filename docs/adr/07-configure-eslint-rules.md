# ADR-07: Configure ESLint with Airbnb Base + Custom Overrides

**Date:** 2025-12-08

**Status:** Active

---

## Context

Finsite needed consistent code style and automated error detection. We chose ESLint with the Airbnb JavaScript Style Guide as our foundation, but several rules conflicted with our project's runtime environment (native browser ES modules) and development practices.

**Conflicts:**
- Browser globals (`document`, `window`) flagged as undefined
- Required file extensions (`.js`) in imports flagged as errors
- Legitimate development logging blocked
- Idiomatic JavaScript patterns (loop `++`, underscore prefixes) forbidden

---

## Decision

Use Airbnb Base ESLint configuration with targeted rule overrides to match our browser-based, ES module environment.

**Configuration:**
```json
{
  "extends": "airbnb-base",
  "env": {
    "browser": true,
    "es2021": true
  },
  "parserOptions": {
    "ecmaVersion": 12,
    "sourceType": "module"
  },
  "globals": {
    "Chart": "readonly"
  }
}
```

---

## Consequences

### Benefits
- **Industry Standard Base**: Airbnb style guide is widely recognized and well-documented
- **Browser Compatibility**: `env.browser` registers browser globals, eliminating false positives
- **Modern JavaScript**: ES2021 support for optional chaining, nullish coalescing, etc.
- **Native Modules**: `sourceType: "module"` enables `import`/`export` syntax
- **Customized for Reality**: Overrides align rules with actual runtime environment

### Costs/Limitations
- **Rule Maintenance**: Must document why each override exists
- **Team Alignment**: Developers must understand both Airbnb rules and our exceptions
- **Update Complexity**: Airbnb updates may conflict with our overrides

---

## Rule Overrides

### Environment Configuration

**`env.browser: true`**
- Registers browser globals (`window`, `document`, `navigator`, `localStorage`)
- Prevents `no-undef` errors for legitimate browser API usage

**`env.es2021: true`**
- Enables ES2021 syntax parsing (optional chaining, nullish coalescing, etc.)
- Implicitly sets `parserOptions.ecmaVersion` to 2021

**`globals.Chart: "readonly"`**
- Declares Chart.js as global (loaded via CDN `<script>` tag)
- Prevents `no-undef` for Chart.js usage

---

### Disabled Rules

**`no-console: off`**
- **Why**: `console.log()` is legitimate debugging tool during development
- **Impact**: Allows flexible logging without ESLint noise

**`no-plusplus: off`**
- **Why**: `for (let i = 0; i < n; i++)` is idiomatic and clear
- **Impact**: Maintains standard loop syntax without artificial restrictions

**`no-underscore-dangle: off`**
- **Why**: `_` prefix signals internal/private methods (e.g., `_timeBuckets`, `_refreshDashboard`)
- **Impact**: Preserves intentional naming conventions

**`import/extensions: off`**
- **Why**: Browser requires `.js` extensions in imports (`import x from './foo.js'`)
- **Conflict**: Airbnb assumes bundler environment that auto-resolves extensions
- **Impact**: Allows correct native ES module imports

**`import/prefer-default-export: off`**
- **Why**: We consistently use named exports for refactoring support
- **Impact**: Maintains consistent export pattern across codebase

**`class-methods-use-this: off`**
- **Why**: Helper methods (e.g., `_formatCurrency()`) belong to component for cohesion
- **Impact**: Allows organizing helpers within classes without forcing static declarations

**`max-len: off`**
- **Why**: Long template strings and configuration objects read better unbroken
- **Impact**: Eliminates cosmetic errors while maintaining functional quality

---

### Modified Rules

**`indent: ["error", 4, { "SwitchCase": 1 }]`**
- Overrides Airbnb's 2-space default with 4 spaces
- Indents `case` statements 1 level from `switch`

**`no-use-before-define: ["error", { "functions": false }]`**
- Allows calling functions before definition (hoisted)
- Still blocks classes and variables (temporal dead zone protection)

**`no-param-reassign: ["error", { "props": false }]`**
- Blocks parameter reassignment: `param = value` ❌
- Allows property mutation: `param.key = value` ✅ (needed for Chart.js config)

**`no-restricted-syntax: [customized]`**
- Allows `for...of` loops (native ES6, no polyfill concerns)
- Still blocks: `for...in` (prototype chain issues), labeled statements, `with`

**`prefer-destructuring: ["error", { "array": false, "object": true }]`**
- Encourages object destructuring: `const { foo } = obj` ✅
- Allows explicit array indexing: `arr[0]` ✅ (clearer than `[first] = arr`)

---

## Parser Configuration

**`parserOptions.sourceType: "module"`**
- Tells ESLint to parse files as ES modules (not scripts)
- Enables `import`/`export`, `import.meta`

**`parserOptions.ecmaVersion: 12`**
- Sets ECMAScript version to ES2021 (version 12)
- Ensures all modern features are recognized

---

## Alternatives Considered

**Standard.js**
- Pros: Zero config, no decisions needed
- Cons: Less flexible, can't customize rules for our environment

**Prettier + ESLint**
- Pros: Automatic formatting
- Cons: Additional tooling complexity, config overlap

**Custom Rules from Scratch**
- Pros: Complete control
- Cons: Reinventing wheel, no community consensus

---

## Notes

- Rule overrides are documented to explain why each exists
- Browser environment and native modules are non-negotiable for our runtime
- Can incrementally enable stricter rules as codebase matures
- Consider adding Prettier for automatic formatting in future

**Related ADRs:**
- ADR-05: Use Vanilla JavaScript (influences ESLint environment config)
- ADR-03: Adopt Chart.js (requires Chart global declaration)
