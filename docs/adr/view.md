# ADR 002 – FinSiteView (DOM Rendering & Navigation)

## Status
Accepted — revised after cleanup refactor.

## Context
The application needs a persistent two-pane layout (sidebar + content area) that:
- Renders three page components (dashboard, transactions, categories)
- Handles navigation without destroying component state
- Forwards user events (navigation, form submissions) to the controller
- Accepts data updates from the controller and pushes them to child components

The View should remain passive—emitting events upward and accepting data downward—without business logic.

## Decision

### Architecture
- **Persistent Shell**: All three page sections (`#page-dashboard`, `#page-transactions`, `#page-categories`) exist simultaneously in the DOM
- **Visibility Toggle**: Navigation uses HTML `hidden` attribute to show/hide pages instead of destroying/recreating innerHTML
- **Cached References**: Component instances (`dashboardEl`, `transactionsEl`, `categoriesEl`, `sidebarEl`) are created once during `render()` and reused throughout the session
- **Event Delegation**: Sidebar navigation and form submissions bubble up through custom events to controller-registered handlers

### Core Methods

**`render(selector)`**
- Mounts the app shell to a container element
- Creates persistent page host sections
- Instantiates all Web Components once
- Caches element references for direct method calls
- Throws if container selector is invalid (fail-fast)

**`navigateToPage(page)`**
- Toggles page visibility via `_togglePageVisibility()`
- Updates `currentPage` tracking
- Re-wires model to categories component

**`update(data)`**
- Pushes new data to all page components via dedicated helpers
- Does NOT handle routing (single responsibility)
- Updates all components regardless of visibility for instant switching

**`_updateDashboardData(data)` / `_updateTransactionsData(data)` / `_updateCategoriesData(data)`**
- Per-page data wiring functions
- Each handles its component's specific data needs
- Isolated so changes to one don't affect others

**`updateDashboardCharts(chartData, isHeavyUpdate)`**
- Passes pre-aggregated chart data directly to dashboard component
- Uses cached `dashboardEl` reference (no DOM query)

**`updateDashboardPanel(panelSummary)`**
- Passes stat card and recent activity data to dashboard
- Uses cached element reference

**`setupComponentEvents()`**
- Wires sidebar navigation events to controller handlers
- Listens for add-transaction and open-manual-entry events
- Uses cached `sidebarEl` reference

**`_wireModelToCategories()`**
- Injects shared model reference into categories component
- Allows component to call model methods directly for aggregations

### Debug Logging
- All `console.log` calls routed through `_debugLog(...args)`
- Controlled by `this.debug` boolean flag
- Disabled by default for production; enable for development

## Code Patterns

```javascript
// Visibility toggle instead of innerHTML rebuild
_togglePageVisibility(page) {
    dashboardHost.hidden = page !== 'dashboard';
    transactionsHost.hidden = page !== 'transactions';
    categoriesHost.hidden = page !== 'categories';
}

// Fail-fast container validation
render(selector) {
    this.container = document.querySelector(selector);
    if (!this.container) {
        throw new Error(`Container element ${selector} not found`);
    }
    // ...
}

// Debug-gated logging
_debugLog(...args) {
    if (this.debug) {
        console.log(...args);
    }
}
```

## Rationale (Why)

- **Persistent Components**: Web Components and Chart.js instances are expensive to initialize; keeping them alive preserves state (scroll position, filter selections) and avoids re-initialization overhead
- **Visibility Toggle**: `hidden` attribute is more semantic and accessible than `display:none`; browser can optimize hidden content
- **Cached References**: Avoids repeated DOM queries; enables direct method calls without querySelector overhead
- **Separated Concerns**: `update()` only handles data; `navigateToPage()` only handles routing; per-page helpers isolate component-specific logic
- **Fail-Fast**: Throwing on invalid container surfaces integration bugs immediately instead of silently breaking
- **Debug Flag**: Keeps production console clean while allowing developer visibility during development

## Alternatives Considered

- **innerHTML rebuild on navigation**: Simpler code but destroys component state, triggers expensive re-initialization, and causes visual flicker
- **document.body fallback**: Masks configuration errors; fail-fast is more developer-friendly
- **Single monolithic update()**: Lower cohesion; changes to one page's wiring affect the whole method
- **Always-on console.log**: Production noise and minor performance cost; debug flag is standard practice

## Consequences

- View is easy to test in isolation with mock handlers
- Can swap to React/Vue later—view layer is already passive
- Navigation feels instant because components are pre-initialized
- Slightly more memory usage from persistent components (acceptable trade-off)

## Verification

- Navigation toggles visibility without DOM destruction (inspect elements)
- `update()` pushes data to all components; navigation is handled separately
- No console output when `debug = false`
- Invalid selector throws clear error message
- Model wiring errors surface instead of being swallowed

---

# Cleanup Refactor

## Problems Addressed

### 1. Routing Mixed with Data Updates (SRP Violation)
**Before**: `update(data)` checked `data.currentView` and called `navigateToPage()`, mixing two responsibilities

**After**: `update()` only pushes data to components; routing is the controller's responsibility

### 2. innerHTML Rebuild on Navigation (Performance)
**Before**: `navigateToPage()` rebuilt `#content-area` via innerHTML on every route change, destroying component state and Chart.js instances

**After**: Page sections exist persistently; `_togglePageVisibility()` uses `hidden` attribute to show/hide without destruction

### 3. Raw console.log in Production (Noise)
**Before**: Direct `console.log()` calls throughout the view, including verbose data logging

**After**: All logging routed through `_debugLog()` controlled by `this.debug` flag (default: false)

### 4. Silent Error Swallowing (_wireModelToCategories)
**Before**: Broad try/catch swallowed all errors with a generic warning, masking real wiring issues

**After**: No try/catch; errors surface naturally for debugging; method is simple enough that exceptions indicate real problems

### 5. document.body Fallback (Hidden Bugs)
**Before**: Invalid container selector fell back to `document.body`, hiding integration bugs

**After**: Invalid selector throws `Error` with clear message; fail-fast surfaces problems immediately

## Implementation Summary

| Change | Old Approach | New Approach |
|--------|--------------|--------------|
| Navigation | `innerHTML = renderPageComponent(page)` | `hidden` attribute toggle |
| Data updates | Mixed with routing in `update()` | Separate `_update*Data()` helpers |
| Logging | Direct `console.log()` | `_debugLog()` with flag |
| Container validation | Fallback to `document.body` | Throw on invalid selector |
| Error handling | Silent try/catch | Let errors surface |
| DOM queries | `querySelector()` each time | Cached element references |

## Performance Impact

- **Navigation**: O(1) visibility toggle vs O(n) component re-initialization
- **Data updates**: Direct method calls on cached refs vs DOM queries
- **Logging**: Zero overhead when disabled vs always-on string formatting

## Future Work

- Accessibility improvements (focus management on navigation)
- Lazy loading for components not needed on initial page
- Animation transitions between pages
- Service worker integration for offline support
