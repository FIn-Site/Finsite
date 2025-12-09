cat > docs/adr/e2e-testing.md << 'EOF'
# ADR: E2E Testing Approach

## Status
Accepted

## Context

**What?**
We needed automated, user-level verification that core flows work in a real browser. Unit/integration tests don't guarantee the UI, routing, and client logic behave correctly together.

**Why?**
- Regressions are easy to ship and hard to diagnose
- Manual testing is time-consuming and error-prone
- We need confidence that critical user flows work before merging

## Decision

**How?**
Implement Playwright-based E2E tests covering 16 core user flows, running across 3 browsers (Chromium, Firefox, WebKit) for a total of 48 test runs.

### Why Playwright?

Alternatives Considered:
- Cypress: Great developer experience, but heavier runtime and less cross-browser support
- Puppeteer: Lower-level API, more maintenance burden
- Playwright: Chosen for built-in trace/video, cross-browser support, and excellent auto-waiting

### Thought Process

Key Design Decisions:
1. Test IDs over brittle selectors - Using data-testid ensures tests survive UI refactoring
2. Shadow DOM handling - Our app uses Web Components, so tests use evaluateHandle() to access elements inside shadow roots
3. CI-first approach - GitHub Actions runs tests on every push/PR
4. Cross-browser testing - Tests run on Chromium, Firefox, and WebKit

## Running Tests

Run all tests: npm run e2e
Run with UI: npm run e2e:ui
View report: npm run e2e:report
Debug mode: npm run e2e:debug

## Test Files (16 Total)

### Core Functionality Tests
| Test File | Purpose |
|-----------|---------|
| smoke.spec.ts | Verifies app loads successfully, title is correct, sidebar visible |
| navigation.spec.ts | Tests navigation between dashboard and transactions pages |
| add-transaction.spec.ts | Tests adding a new transaction via the form |
| chart-render.spec.ts | Verifies chart displays on dashboard with proper dimensions |

### Dashboard Tests
| Test File | Purpose |
|-----------|---------|
| dashboard-stats.spec.ts | Verifies all 4 stat cards display (total spent, weekly count, monthly spending, monthly change) |

### Transaction Filtering & Sorting Tests
| Test File | Purpose |
|-----------|---------|
| search.spec.ts | Tests search functionality filters transactions by merchant name |
| sort.spec.ts | Tests sorting transactions by newest, oldest, amount high/low |
| scope-filter.spec.ts | Tests filtering by scope (all/expenses/income) |
| date-filter.spec.ts | Tests date range filter panel opens, sets dates, applies filter |
| filter-panel.spec.ts | Tests advanced filter panel open/close and apply functionality |
| clear-filters.spec.ts | Tests clearing all active filters resets to default state |

### UI Interaction Tests
| Test File | Purpose |
|-----------|---------|
| modal.spec.ts | Tests add transaction modal opens and closes via Cancel and X buttons |
| form-validation.spec.ts | Verifies required form fields have proper validation attributes |
| edit-multiple.spec.ts | Tests toggling edit multiple mode on/off |
| sidebar-collapse.spec.ts | Tests sidebar collapse/expand toggle functionality |
| header-menu.spec.ts | Tests header menu toggle button exists and is clickable |

## Test Coverage Summary

- **Total Test Files**: 16
- **Browsers Tested**: 3 (Chromium, Firefox, WebKit)
- **Total Test Runs**: 48
- **Features Covered**: App loading, navigation, transactions, charts, filtering, sorting, modals, forms, sidebar, header

## Consequences

Positive:
- Regressions caught before reaching main branch
- Fast feedback loop with CI integration
- Confidence to refactor without breaking flows
- Comprehensive coverage of user-facing features
- Cross-browser compatibility verified

Negative:
- Must maintain data-testid attributes when UI changes
- CI runs take additional time (~15-20 seconds)
- Shadow DOM requires special handling with evaluateHandle()
EOF