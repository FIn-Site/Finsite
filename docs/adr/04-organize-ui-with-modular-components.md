# ADR-04: Organize UI with Modular Components

**Date:** 2025-12-08

**Status:** Accepted

---

## Context

Finsite's UI has several reusable elements:
- Transaction list items
- Dashboard summary cards
- Charts and visualizations
- Header/navigation
- Sidebar filters

Without organization, these would lead to:
- Monolithic View file with all DOM manipulation code
- Duplicated code for similar UI elements
- Difficult testing and maintenance
- Unclear separation of concerns
- Hard to reuse components in different contexts

We need a way to organize UI code into logical, reusable pieces that maintain the vanilla JavaScript approach (ADR-05) while avoiding the complexity of a full framework.

---

## Decision

We will organize UI into modular components, each in its own file under `src/components/`.

**Structure:**
- Each component is a separate JavaScript module
- Components export functions for creation, rendering, and updating
- Components handle their own DOM structure and event listeners
- Parent components/views orchestrate child components
- Components are stateless—state managed by Model/Controller

**Examples:**
- `src/components/dashboard.js` - Dashboard layout and cards
- `src/components/transactions.js` - Transaction list container
- `src/components/transaction-item.js` - Individual transaction element
- `src/components/spending-chart.js` - Chart component wrapper
- `src/components/header.js` - App header
- `src/components/sidebar.js` - Filter sidebar

---

## Consequences

### Benefits
- **Separation of Concerns**: Each component has clear, focused responsibility
- **Reusability**: Components can be used in multiple contexts
- **Testability**: Easy to test components in isolation
- **Maintainability**: Changes to one component don't affect others
- **Discoverability**: File structure mirrors UI structure—easy to find code
- **Collaboration**: Multiple developers can work on different components
- **Consistency**: Standardized component patterns across codebase

### Costs/Limitations
- **More Files**: More granular file structure to navigate
- **Manual Coordination**: Parent must manually wire up and update components
- **No Framework Magic**: No auto-reactivity or lifecycle hooks
- **Boilerplate**: Some repeated patterns (creation, update, event binding)
- **Import Management**: Need to explicitly import and export components

---

## Alternative Considered

**Web Components (Custom Elements)**
- Pros: Standard browser API; true encapsulation; reusable across projects
- Cons: More boilerplate; Shadow DOM complexity; learning curve; overkill for internal components

---

## Notes

- Components follow functional programming style where possible
- Component functions accept data and return DOM elements or update existing ones
- Event handlers call Controller methods—components don't manage state
- Component structure supports progressive enhancement and future Web Component migration if needed

**Related ADRs:**
- ADR-01: Use MVC Architecture (components are part of View layer)
- ADR-05: Use Vanilla JavaScript (components use plain DOM APIs)
- ADR-03: Adopt Chart.js (chart component wraps Chart.js)
