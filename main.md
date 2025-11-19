# /docs/adr/000-main-architecture.md
# ADR 000 – App Shell & Module Wiring (index.html, main.js, styles.css)

## Status
Accepted — initial version.

## Context
We need a minimal, testable app shell for a manual-entry financial tracker. It should load quickly, run without a build step, and support ES modules for clean separation (MVC).

## Decision
- **index.html** is the entry point and only includes:
  - `<link rel="stylesheet" href="./styles.css" />`
  - `<script type="module" src="./main.js"></script>`
  - A single `<div id="app"></div>` mount point.
- **styles.css** centralizes visual styles (layout, banner, table).
- **main.js** bootstraps MVC by importing:
  - `LocalStorageGateway` (persistence)
  - `FinanceModel` (domain state)
  - `FinanceView` (DOM rendering)
  - `FinanceController` (wiring/validation)
  and instantiates them against `#app`.

## Code used (high level)
- **ES modules** via `type="module"` to avoid globals and enable imports.
- **Vanilla CSS** for portability; no framework overhead for a simple page.
- **Vanilla DOM** mount in `#app`.

## Rationale (Why)
- **Fast to run** on any static server (Live Server / GitHub Pages).
- **Separation of concerns**: HTML shell, CSS styles, JS modules.
- **Scalable**: swap view or model without touching the shell.

## Alternatives considered
- Single-file HTML+JS: fastest to prototype but harder to maintain.
- Bundler/React: heavier setup not needed for current scope.

## Consequences
- No build step needed; easy local testing.
- Browser support requires ES modules (modern browsers OK).

## Verification
- Open `src/index.html` via a static server; the form, banner, and table render.
- Console shows no module import errors.

## Future Work
- Add a simple favicon / meta tags.
- Optional: adopt a component library if UI grows.
