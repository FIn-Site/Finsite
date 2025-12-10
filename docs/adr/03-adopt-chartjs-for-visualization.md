# ADR-03: Adopt Chart.js for Data Visualization

**Date:** 2025-12-08

**Status:** Accepted

---

## Context

Finsite requires interactive charts to visualize financial data:
- Display spending trends over time (line/bar charts)
- Show category breakdowns (pie/doughnut charts)
- Compare budget vs actual spending
- Support interactive features (tooltips, legends, filtering)
- Integrate with vanilla JavaScript (no framework)
- Maintain small bundle size
- Provide responsive, mobile-friendly charts
- Balance ease of use with customization capability

The charting library must be lightweight, well-documented, actively maintained, and suitable for financial data visualization.

---

## Decision

We will use Chart.js for all data visualizations in Finsite.

**Implementation:**
- Include Chart.js UMD bundle (`chart.umd.min.js`)
- Include date-fns adapter for time-series support (`chartjs-adapter-date-fns.bundle.min.js`)
- Create chart abstraction layer (`src/chart/chart-core.js`) for common configurations
- Implement chart components for specific visualizations (`spending-chart.js`, etc.)

---

## Consequences

### Benefits
- **Easy to Use**: Simple, declarative API; minimal setup code
- **Rich Features**: Supports all needed chart types (line, bar, pie, doughnut)
- **Interactive**: Built-in tooltips, legends, hover effects, click events
- **Responsive**: Auto-adapts to container size; mobile-friendly
- **Customizable**: Extensive configuration options for colors, styles, animations
- **Well-Documented**: Excellent docs with many examples
- **Active Maintenance**: Large community; frequent updates; long-term viability
- **Framework-Agnostic**: Works with vanilla JS (matches ADR-05)
- **Small Bundle**: ~60KB minified + gzipped (reasonable for features provided)

### Costs/Limitations
- **Library Dependency**: ~200KB uncompressed (but still lightweight compared to alternatives)
- **Learning Curve**: Configuration object can be verbose for advanced customizations
- **Performance**: May struggle with extremely large datasets (>10,000 points), though unlikely to be issue for personal finance app
- **Limited 3D**: No built-in 3D charts (not needed for Finsite)

---

## Alternatives Considered

**Alternative 1: D3.js**
- Pros: Maximum flexibility; powerful; can create any visualization; great for complex custom charts
- Cons: Steep learning curve; verbose code; larger bundle size; overkill for standard chart types; slower development time

**Alternative 2: Custom Canvas/SVG**
- Pros: Full control; minimal dependencies; smallest possible bundle
- Cons: Very high development time; reinventing wheel; maintaining chart features is complex; accessibility challenges

---

## Notes

- Chart.js can be lazy-loaded to improve initial page load if needed
- Date-fns adapter enables time-series charts with proper date handling
- Chart abstraction layer (`chart-core.js`) provides consistent theming and default configurations
- For extremely large datasets (unlikely in personal finance context), could implement data sampling/aggregation before charting

**Related ADRs:**
- ADR-05: Use Vanilla JavaScript (Chart.js is framework-agnostic)
- ADR-04: Organize UI with Modular Components (charts are self-contained components)
