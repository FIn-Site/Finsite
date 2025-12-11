# ADR-01: Use Model-View-Controller (MVC) Architecture Pattern

**Date:** 2025-12-08

**Status:** Accepted

---

## Context

Finsite is a personal finance tracking application that manages transactions, categories, budgets, and visualizations. The application needed an architectural pattern to:
- Separate concerns between data management, user interface, and coordination logic
- Enable independent testing of business logic without UI dependencies
- Support multiple views of the same data (dashboard, transactions list, charts)
- Allow team members to work on different aspects without conflicts
- Maintain code that's easy to understand and modify

Without a clear architectural pattern, the codebase risked becoming a tangled mix of data manipulation, DOM operations, and event handling, making it difficult to reason about, test, and extend.

---

## Decision

We will use the Model-View-Controller (MVC) architectural pattern to structure the Finsite application.

**Implementation:**
- **Model** (`src/model/financeModel.js`): Manages application state and business logic for transactions, categories, and budgets
- **View** (`src/view/financeView.js`): Handles all DOM manipulation and rendering
- **Controller** (`src/controller/financeController.js`): Coordinates between Model and View, handles user input, manages application flow

---

## Consequences

### Benefits
- **Separation of Concerns**: Clear boundaries between data (Model), presentation (View), and coordination (Controller)
- **Testability**: Business logic in Model can be tested independently of the DOM
- **Maintainability**: Changes to UI don't affect business logic and vice versa
- **Multiple Views**: Same Model data can power dashboard, transactions page, and charts without duplication
- **Team Collaboration**: Developers can work on Model, View, or Controller with minimal conflicts
- **Learning**: MVC is a well-understood pattern with extensive documentation and examples

### Costs/Limitations
- **Boilerplate**: Requires more files and structure than a single-file approach
- **Indirection**: Simple changes may require touching multiple files (Model, View, Controller)
- **Coordination Complexity**: Controller must carefully manage the interaction between Model and View
- **Not Framework-Backed**: Without a framework, we implement MVC manually, requiring discipline to maintain patterns

---

## Alternative Considered

**Component-Based Architecture (like React/Vue)**
- Pros: Encapsulates related logic, markup, and styles together; modern approach; excellent for reusable UI components
- Cons: Requires framework or significant custom implementation; heavier learning curve; may be overkill for relatively simple app; we wanted vanilla JS

---

## Notes

- MVC pattern guides the overall architecture but doesn't prevent using other patterns within layers (e.g., component pattern for View)
- The `src/components/` directory contains reusable UI components that work alongside the MVC structure
- Storage layer (`src/storage/`) is separate from Model, treating IndexedDB as an external service
- This decision was made early in project to establish clear structure before codebase grew

**Related ADRs:**
- ADR-04: Implement Web Components for UI Modularity (complements MVC by organizing View layer)
- ADR-05: Use Vanilla JavaScript (influenced choice to manually implement MVC vs. framework)

---

## Implementation Details

### Model Layer (`src/model/financeModel.js`)
- Manages application state for transactions, categories, groups, and budgets
- Implements **O(1) incremental aggregation** for dashboard performance
- Data structures: `_timeBuckets` (monthly spending), `_groupTotals`, `_cachedMetrics`
- Core operations: `addTransaction()`, `deleteTransactions()`, `addTransactionsBulk()`
- Dashboard data: `getDashboardSummary()`, `getDashboardPanelSummary()`
- Validation: `_validateTransaction()` ensures data integrity

### View Layer (`src/view/financeView.js`)
- Handles all DOM manipulation and rendering
- Maintains persistent component shell with visibility toggle via `hidden` attribute
- Caches component references for direct method calls (no repeated DOM queries)
- Event delegation: Forwards user interactions to controller via custom events
- Passive layer: Accepts data updates from controller, no business logic

### Controller Layer (`src/controller/financeController.js`)
- Coordinates between Model and View
- Handles user interactions: navigation, transaction operations, bulk import
- Optimizes dashboard updates: `isHeavyUpdate` flag for animation control
- Error handling: `_handleError()` provides user feedback
- State synchronization: `_syncModelToView()` centralizes refresh logic
