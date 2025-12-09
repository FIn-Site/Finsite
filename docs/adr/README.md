# Architecture Decision Records (ADR)

This directory contains Architecture Decision Records (ADRs) for the Finsite project. ADRs document significant architectural and design decisions, capturing the context, rationale, and consequences of each choice.

## What is an ADR?

An Architecture Decision Record (ADR) is a document that captures an important architectural decision made along with its context and consequences. ADRs help teams understand:
- **Why** decisions were made (not just what was decided)
- **What alternatives** were considered
- **What trade-offs** were accepted
- **When** decisions were made and by whom

## When to Create an ADR

Create an ADR when making decisions about:
- Architectural patterns (MVC, microservices, etc.)
- Technology choices (frameworks, libraries, databases)
- Major refactorings or structural changes
- Data structures or storage strategies
- Development tooling and processes
- Integration approaches
- Security or performance strategies

**Rule of thumb:** If the decision will impact how others work on the project or is hard to reverse, document it in an ADR.

## ADR Format

We use a lightweight format inspired by Michael Nygard's ADR template. See [`template.md`](./template.md) for the structure.

Key sections:
- **Context**: What problem are we solving? What constraints exist?
- **Decision**: What did we decide to do?
- **Consequences**: What are the benefits and costs?
- **Alternatives Considered**: What other options did we evaluate?

## Current ADRs

| Number | Title | Status | Date |
|--------|-------|--------|------|
| [01](./01-use-mvc-architecture.md) | Use Model-View-Controller (MVC) Architecture Pattern | Accepted | 2025-12-08 |
| [02](./02-choose-indexeddb-for-storage.md) | Choose IndexedDB for Client-Side Storage | Accepted | 2025-12-08 |
| [03](./03-adopt-chartjs-for-visualization.md) | Adopt Chart.js for Data Visualization | Accepted | 2025-12-08 |
| [04](./04-organize-ui-with-modular-components.md) | Organize UI with Web Components | Accepted | 2025-12-08 |
| [05](./05-use-vanilla-javascript.md) | Use Vanilla JavaScript (No Framework) | Accepted | 2025-12-08 |

## ADR Statuses

- **Proposed**: Decision is under consideration
- **Accepted**: Decision has been agreed upon and is being implemented
- **Deprecated**: Decision is no longer recommended but may still be in use
- **Superseded**: Decision has been replaced by a newer decision (link to new ADR)

## Why ADRs Matter

ADRs create a decision trail that helps:
- **New team members** understand why things are the way they are
- **Current team** remember the rationale behind past decisions
- **Future team** evaluate whether decisions still make sense as context changes
- **Everyone** avoid relitigating already-settled debates

ADRs are lightweight documentation that travels with the code, ensuring architectural knowledge isn't lost.

## Resources

- [Michael Nygard's original ADR article](https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions)
- [ADR organization examples](https://adr.github.io/)
