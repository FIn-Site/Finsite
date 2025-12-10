# ADR-04: Organize UI with Web Components

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
- Style conflicts and specificity issues

We need a way to organize UI code into logical, reusable pieces with proper encapsulation while maintaining the vanilla JavaScript approach (ADR-05).

---

## Decision

We will organize UI using Web Components (Custom Elements), each in its own file under `src/components/`.

**Structure:**
- Each component is a Custom Element extending `HTMLElement`
- Components use Shadow DOM for style and DOM encapsulation
- Components register with `customElements.define()`
- Parent components/views coordinate child components
- Components communicate via attributes, properties, and custom events
- Components are mostly stateless—state managed by Model/Controller

**Examples:**
- `src/components/dashboard.js` → `<finsite-dashboard>`
- `src/components/transactions.js` → `<finsite-transactions>`
- `src/components/transaction-item.js` → `<finsite-transaction-item>`
- `src/components/spending-chart.js` → `<finsite-spending-chart>`
- `src/components/header.js` → `<finsite-header>`
- `src/components/sidebar.js` → `<finsite-sidebar>`

---

## Consequences

### Benefits
- **True Encapsulation**: Shadow DOM prevents style leakage and conflicts
- **Separation of Concerns**: Each component has clear, focused responsibility
- **Native Browser API**: Uses standard Web Components, no framework needed
- **Reusability**: Components can be used anywhere with simple HTML tags
- **Testability**: Easy to test components in isolation
- **Maintainability**: Changes to one component don't affect others
- **Discoverability**: File structure mirrors UI structure—easy to find code
- **Scoped Styles**: CSS in Shadow DOM doesn't leak, no naming conflicts
- **Framework Agnostic**: Web Components work with any framework or vanilla JS

### Costs/Limitations
- **More Boilerplate**: Custom Element lifecycle requires more setup than simple functions
- **Shadow DOM Complexity**: Some CSS features (like ::part) needed for styling from outside
- **Browser APIs**: Requires understanding of Custom Elements and Shadow DOM APIs
- **Event Handling**: Custom events needed for child→parent communication
- **Learning Curve**: More complex than simple component functions
- **IE Not Supported**: Requires modern browsers (Edge, Chrome, Firefox, Safari)

---

## Alternatives Considered

**Alternative 1: Monolithic View**
- Pros: All UI code in one place; fewer files; less import management
- Cons: Very large files; hard to test; difficult to maintain; code duplication; poor separation of concerns; style conflicts

**Alternative 2: Simple Component Functions**
- Pros: Simpler than Web Components; less boilerplate; easier to understand
- Cons: No style encapsulation; global CSS conflicts; manual lifecycle management; no standard pattern

**Alternative 3: Template Literals / HTML Strings**
- Pros: Simple; declarative; easy to read; minimal setup
- Cons: No encapsulation; no type safety; XSS risks without sanitization; harder to manipulate after render; testing more difficult; style conflicts

**Alternative 4: Framework Components (React, Vue, etc.)**
- Pros: Reactivity; lifecycle management; rich ecosystem; mature tooling
- Cons: Conflicts with ADR-05 (Vanilla JavaScript); unnecessary complexity; larger bundle; framework lock-in; build step required

---

## Notes

- Web Components provide true encapsulation without framework overhead
- Shadow DOM isolates styles, preventing conflicts and specificity issues
- Custom Elements are part of web standards, supported by all modern browsers
- Components use standard `CustomEvent` for child→parent communication
- Event handlers call Controller methods—components don't manage state
- Component structure is now implemented, not a future migration

**Related ADRs:**
- ADR-01: Use MVC Architecture (components are part of View layer)
- ADR-05: Use Vanilla JavaScript (components use plain DOM APIs)
- ADR-03: Adopt Chart.js (chart component wraps Chart.js)
