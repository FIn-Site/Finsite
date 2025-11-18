# /docs/adr/002-view-financeview.md
# ADR 002 – FinanceView (DOM Rendering & UI Events)

## Status
Accepted — initial version.

## Context
We need a form for manual entry, a top banner for feedback, and a “Recent Entries” table with multi-select deletion. The View should be passive and emit events upward.

## Decision
- **Render**:
  - Form inputs: amount (`number`), date (`date`), category (`select`).
  - Actions: **Clear**, **Delete Selected**, **Add to Financials**.
  - Table with columns: [Select], Amount, Date, Category.
  - **Banner** at the top for success/error messages.
- **Expose callbacks**:
  - `onSubmit(payload)`, `onDeleteSelected(ids)`.
- **Utilities**:
  - `renderTable(rows)` rebuilds `<tbody>` from model data.
  - `resetForm()` resets inputs and keeps date default to **today**.
  - `showBanner(msg, ok, ms)` announces feedback.

## Code used (key patterns)
- Event handlers inside View call user-provided callbacks.
- `getSelectedIds()` queries checked checkboxes to feed controller.
- Minimal escaping for table cells to prevent HTML injection.

## Rationale (Why)
- **Passive view** keeps all business rules in the controller/model.
- **Single render method** simplifies DOM updates and reduces bugs.
- **Banner UX** surfaces validation and actions without modals.

## Alternatives considered
- Two-way binding framework: heavier than needed.
- Inline alerts: less visible; banner provides consistent feedback.

## Consequences
- View is simple to replace if we later adopt a framework (React/Vue).
- All “why” decisions (validation, rules) stay outside the View.

## Verification
- “Add” triggers `onSubmit`.
- “Delete Selected” produces a non-empty list only when checkboxes checked.
- Banner shows/hides as expected.

## Future Work
- Accessibility improvements (aria-invalid, error descriptions).
- Filters/sorting on the table.
