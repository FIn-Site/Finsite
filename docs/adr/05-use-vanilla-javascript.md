# ADR-05: Use Vanilla JavaScript (No Framework)

**Date:** 2025-12-08

**Status:** Accepted

---

## Context

Finsite requires:
- Interactive UI with form inputs, buttons, dynamic content
- State management for financial data
- Data visualization with charts
- Client-side routing (single-page app feel)
- Responsive, performant user experience

The decision required balancing several factors:
- **Educational Goals**: Learning fundamental web technologies deeply
- **Project Complexity**: Relatively simple CRUD app, not a large-scale system
- **Performance**: Fast initial load, minimal overhead
- **Maintainability**: Code clarity and long-term sustainability
- **Skill Development**: Transferable skills vs framework-specific knowledge

We needed to decide whether to use a JavaScript framework (React, Vue, Svelte) or build with vanilla JavaScript and native browser APIs.

---

## Decision

We will build Finsite using vanilla JavaScript without a framework.

**Implementation:**
- Use native DOM APIs (`document.querySelector`, `addEventListener`, etc.) for UI manipulation
- Implement MVC architecture manually (ADR-01)
- Use ES6 modules for code organization
- Minimal external dependencies (only Chart.js for visualization—ADR-03)
- No build step required initially (though could add bundler later if needed)

---

## Consequences

### Benefits
- **Deep Learning**: Forces understanding of fundamental DOM APIs, event handling, async JavaScript
- **No Framework Overhead**: Smaller bundle size; faster initial load; no framework runtime
- **No Build Complexity**: Works directly in browser; no webpack/vite/babel config needed
- **Full Control**: Complete transparency; no framework "magic" or abstractions
- **Transferable Skills**: DOM/JavaScript knowledge applies to any framework or environment
- **Debugging**: Straightforward stack traces; no framework internals to navigate
- **Flexibility**: Can add framework later if needed; not locked in

### Costs/Limitations
- **More Boilerplate**: Manual DOM manipulation is more verbose than declarative frameworks
- **No Reactivity**: Must manually update UI when data changes (can't rely on framework reactivity)
- **Reinventing Wheels**: Need to build routing, state updates, component patterns from scratch
- **Less Productivity**: Slower development for complex UI interactions vs framework helpers
- **Maintainability**: Larger projects may become harder to maintain without framework structure
- **Team Onboarding**: Custom patterns vs standardized framework conventions

---

## Alternative Considered

**React**
- Pros: Industry standard; huge ecosystem; declarative UI; rich dev tools; component reusability; JSX; many libraries
- Cons: Larger bundle (~40-130KB); build step required; framework lock-in; less educational for fundamentals; overkill for simple app

---

## Notes

- This decision prioritizes learning and simplicity over development speed
- For larger, more complex applications, a framework would be more appropriate
- Can introduce build tools (bundler, TypeScript) incrementally without changing core approach
- If application grows significantly, can migrate to framework later (though would be substantial refactor)
- Vanilla approach works well with MVC pattern (ADR-01) and modular components (ADR-04)

**Related ADRs:**
- ADR-01: Use MVC Architecture (manually implemented without framework)
- ADR-04: Organize UI with Modular Components (custom component pattern vs framework components)
- ADR-03: Adopt Chart.js (Chart.js is framework-agnostic)
