# /docs/adr/003-controller-financecontroller.md
# ADR 003 – FinanceController (Validation & Coordination)

## Status
Accepted — initial version.

## Context
We need a single place to validate input, coordinate model updates, and refresh the view. It must also handle table deletion actions.

## Decision
- **handleSubmit(tx)**:
  - Validates: `amount` is finite and > 0; `category` and `date` are present.
  - On success, calls `model.addTransaction(tx)`, shows success banner, resets form, and re-renders the table from `model.list()`.
  - Leaves a `// CHANGE` hook to forward events to charts later.
- **handleDeleteSelected(ids)**:
  - If none selected: show error banner.
  - Else: `model.removeMany(ids)`, banner success, re-render table.
- **Initial render**:
  - On construction, `view.renderTable(model.list())`.

## Code used (key patterns)
- Guards with early returns for invalid data.
- Controller owns sequencing: validate → mutate model → update view.

## Rationale (Why)
- Centralizes all business logic away from View.
- Keeps Model thin and focused on state.

## Alternatives considered
- Validation inside View: mixes concerns and duplicates logic.
- Model performing validation: harder to tailor UI messages.

## Consequences
- Clear test surface: controller unit tests can mock model/view.
- Easy to extend with more actions (edit, import).

## Verification
- Invalid inputs produce error banner without changing model.
- Deletions are persisted and immediately reflected in the table.

## Future Work
- Async actions (e.g., server sync) with loading states.
- Schema-level validation (e.g., zod/valibot) if inputs expand.
