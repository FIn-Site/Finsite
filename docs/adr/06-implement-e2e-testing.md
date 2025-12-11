# ADR-06: Implement E2E Testing with Playwright

**Date:** 2025-12-08

**Status:** Accepted

---

## Context

Finsite required automated, user-level verification that core flows work in a real browser. Unit and integration tests don't guarantee the UI, routing, and client logic behave correctly together.

**Challenges:**
- Regressions are easy to ship and hard to diagnose
- Manual testing is time-consuming and error-prone
- Need confidence that critical user flows work before merging
- App uses Web Components with Shadow DOM (requires special handling)
- Must test across multiple browsers for compatibility

---

## Decision

Implement Playwright-based E2E tests covering 21 core user flows, running across 3 browsers (Chromium, Firefox, WebKit) for a total of 63 test runs per CI pipeline.

**Test Infrastructure:**
- 21 test files organized by feature area
- CI integration via GitHub Actions (runs on every push/PR)
- Cross-browser testing (Chromium, Firefox, WebKit)
- Test IDs (`data-testid`) for selector stability
- Shadow DOM handling with `evaluateHandle()` for Web Components

---

## Consequences

### Benefits
- **Regression Detection**: Catch breaking changes before reaching main branch
- **Fast Feedback**: CI provides results in ~1 minute
- **Refactoring Confidence**: Can restructure code knowing tests verify behavior
- **Comprehensive Coverage**: 21 test files cover all major user flows
- **Cross-Browser Compatibility**: Verified across 3 browser engines
- **Living Documentation**: Tests serve as examples of how features should work

### Costs/Limitations
- **Maintenance Overhead**: Must maintain `data-testid` attributes when UI changes
- **CI Time**: Adds ~1 minute to pipeline execution
- **Shadow DOM Complexity**: Requires special `evaluateHandle()` for component internals
- **Flakiness Risk**: E2E tests can be sensitive to timing issues (mitigated by Playwright's auto-waiting)

---

## Test Coverage

### Core Functionality (4 tests)
- `smoke.spec.ts`: App loads, title correct, sidebar visible
- `navigation.spec.ts`: Navigate between dashboard and transactions
- `add-transaction.spec.ts`: Add new transaction via form
- `chart-render.spec.ts`: Charts display with proper dimensions

### Dashboard (1 test)
- `dashboard-stats.spec.ts`: All 4 stat cards display correctly

### Transaction Filtering & Sorting (6 tests)
- `search.spec.ts`: Search filters by merchant name
- `sort.spec.ts`: Sort by newest, oldest, amount high/low
- `scope-filter.spec.ts`: Filter by scope (all/expenses/income)
- `date-filter.spec.ts`: Date range filter panel
- `filter-panel.spec.ts`: Advanced filter panel
- `clear-filters.spec.ts`: Clear all filters resets state

### UI Interactions (5 tests)
- `modal.spec.ts`: Modal open/close functionality
- `form-validation.spec.ts`: Required field validation
- `edit-multiple.spec.ts`: Toggle edit multiple mode
- `sidebar-collapse.spec.ts`: Sidebar collapse/expand
- `header-menu.spec.ts`: Header menu toggle

### Categories Page (5 tests)
- `categories-navigation.spec.ts`: Navigate to categories
- `add-group-modal.spec.ts`: Group modal open/close
- `create-group.spec.ts`: Create group form
- `add-subcategory.spec.ts`: Add subcategory input
- `group-details-modal.spec.ts`: Group details modal

---

## Alternatives Considered

**Cypress**
- Pros: Great developer experience, intuitive API, time-travel debugging
- Cons: Heavier runtime, less cross-browser support, more expensive for parallel execution

**Puppeteer**
- Pros: Lightweight, Chrome DevTools Protocol access, fast
- Cons: Chromium-only, lower-level API requires more test code, less built-in waiting logic

---

## Running Tests

```bash
npm run e2e          # Run all tests
npm run e2e:ui       # Run with UI mode
npm run e2e:report   # View HTML report
npm run e2e:debug    # Debug mode
```

---

## Notes

- Test IDs (`data-testid`) ensure tests survive UI refactoring
- Shadow DOM requires `evaluateHandle()` to access elements inside components
- Playwright's auto-waiting reduces flaky tests
- CI runs tests on every push and pull request
- HTML reports available as CI artifacts

**Related ADRs:**
- ADR-04: Organize UI with Web Components (Shadow DOM affects test strategy)
- ADR-05: Use Vanilla JavaScript (No framework-specific testing tools needed)
