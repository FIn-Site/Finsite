# Architecture Documentation

## Overview

This directory contains comprehensive architectural documentation for Finsite, a client-side personal finance application built with vanilla JavaScript and the MVC pattern.

## Documentation Structure

### Core Diagrams

1. **[System Context](./01-system-context.md)**
   - High-level view of Finsite within its environment
   - External dependencies and boundaries
   - User interactions and data flow
   - **Use when:** Understanding the big picture, onboarding new contributors

2. **[MVC Architecture](./02-mvc-architecture.md)**
   - Model-View-Controller pattern implementation
   - Layer responsibilities and communication
   - Separation of concerns
   - **Use when:** Understanding code organization, making architectural changes

3. **[Component Hierarchy](./03-component-hierarchy.md)**
   - UI component structure and relationships
   - Component composition patterns
   - Reusability strategy
   - **Use when:** Adding new UI features, refactoring components

4. **[Data Flow](./04-data-flow.md)**
   - Sequence diagrams for CRUD operations
   - Data transformations through layers
   - Error handling patterns
   - **Use when:** Debugging data issues, implementing new features

5. **[Storage Architecture](./05-storage-architecture.md)**
   - IndexedDB schema and structure
   - StorageService API
   - Query patterns and indexes
   - **Use when:** Modifying data model, optimizing queries

6. **[Chart.js Integration](./06-chartjs-integration.md)**
   - Visualization architecture
   - Chart abstraction layer
   - Data transformation for charts
   - **Use when:** Adding new charts, customizing visualizations

## How to Use This Documentation

### For New Contributors

**Start here:**
1. Read [System Context](./01-system-context.md) to understand what Finsite is
2. Review [MVC Architecture](./02-mvc-architecture.md) to see how code is organized
3. Explore [Component Hierarchy](./03-component-hierarchy.md) to navigate the UI code

**Then dive deeper based on your task:**
- **Adding UI features?** → Component Hierarchy + Data Flow
- **Modifying data model?** → Storage Architecture + Data Flow
- **Working on charts?** → Chart.js Integration
- **Fixing bugs?** → Data Flow + relevant architecture doc

### For Maintainers

**When planning new features:**
1. Check if feature fits within current architecture
2. Identify which components/layers need changes
3. Review data flow to understand impact
4. Consider if architectural changes needed (create new ADR if so)

**When reviewing PRs:**
1. Verify changes align with architectural patterns
2. Check if diagrams need updates
3. Ensure layer boundaries respected (MVC)
4. Validate data flow follows established patterns

### For Documentation Updates

**Update diagrams when:**
- New components added
- Layer responsibilities change
- Data flow patterns modified
- Storage schema evolves
- New Chart.js integrations added

**Process:**
1. Edit the Mermaid diagram code in relevant `.md` file
2. Verify diagram renders correctly in VS Code or GitHub
3. Update description text if needed
4. Create ADR if architectural decision involved
5. Link ADR from diagram documentation

## Diagram Conventions

### Mermaid Syntax

All diagrams use [Mermaid.js](https://mermaid.js.org/) for:
- **Version control friendly** (text-based, easy to diff)
- **Renders in GitHub** (automatic diagram rendering in markdown)
- **VS Code preview** (with Mermaid extension)
- **Export capability** (can generate PNG/SVG)

### Color Coding

Consistent colors across all diagrams:

| Color | Hex Code | Usage |
|-------|----------|-------|
| Green | `#4CAF50` | View layer, UI components, success states |
| Blue | `#2196F3` | Model layer, data entities |
| Orange | `#FF9800` | Controller layer, business logic |
| Purple | `#9C27B0` | Storage layer, persistence |
| Light Blue | `#00BCD4` | External libraries, utilities |
| Red | `#FF5722` | Data stores, databases |
| Yellow | `#FFC107` | Browser APIs, system resources |

### Shape Meanings

- **Rectangles**: Components, modules, files
- **Rounded rectangles**: Processes, functions
- **Cylinders**: Databases, data stores
- **Circles/Ovals**: Users, external actors
- **Diamonds**: Decision points
- **Dashed lines**: Optional or conditional relationships
- **Solid arrows**: Data flow, dependencies
- **Dotted arrows**: Reads, references

## Tooling

### Viewing Diagrams

**In VS Code:**
1. Install "Markdown Preview Mermaid Support" extension
2. Open any `.md` file in this directory
3. Use preview pane (Ctrl+Shift+V or Cmd+Shift+V)

**On GitHub:**
- Diagrams render automatically in markdown preview

**Standalone:**
- Visit [Mermaid Live Editor](https://mermaid.live/)
- Copy/paste Mermaid code for editing

### Exporting Diagrams

**For Presentations/Docs:**

Using Mermaid CLI:
```bash
npm install -g @mermaid-js/mermaid-cli
mmdc -i 01-system-context.md -o system-context.png
```

Using Mermaid Live:
1. Go to https://mermaid.live/
2. Paste diagram code
3. Click "PNG" or "SVG" export button

## Related Documentation

- **[ADRs](../adr/)** - Architectural decision records explaining why these patterns chosen
- **[CONTRIBUTING.md](../../CONTRIBUTING.md)** - Guidelines for updating architecture docs
- **[README.md](../../README.md)** - Main project documentation

## Questions?

- **Architecture questions:** Open issue with `question` label
- **Diagram unclear:** Open issue with `documentation` label
- **Suggest improvements:** Open PR with proposed changes

---

**Last Updated:** December 2025  
**Maintained by:** Finsite Core Team
