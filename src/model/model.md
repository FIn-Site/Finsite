# /docs/adr/001-model-financemodel.md
# ADR 001 – FinanceModel (Domain State & Operations)

## Status
Accepted — initial version.

## Context
We need to store transactions (amount, date, category), add new ones, list them, and support deletion (multi-select) and clear-all. Persistence should be swappable.

## Decision
- **FinanceModel** holds `state.transactions`.
- **addTransaction(tx)**:
  - Valid tx appended to the **front** (`unshift`) so newest appear first.
  - Adds a unique `id` (`crypto.randomUUID()` fallback to timestamp).
  - Persists via the injected storage gateway.
- **removeMany(ids)**:
  - Deletes all IDs in one pass using a `Set`.
- **clearAll()**:
  - Empties state and persists.
- **list()** returns a shallow copy for immutability at call sites.

## Code used (key snippets)
- `unshift(saved)` to maintain reverse-chronological order.
- `id` generation for stable per-row operations (delete/select).
- Storage is **injected**: `new FinanceModel(storage)`.

## Rationale (Why)
- **Deterministic ordering** matches “most recent at top”.
- **ID-based operations** enable precise deletion irrespective of table order.
- **Dependency injection** keeps persistence pluggable (LocalStorage now, API later).

## Alternatives considered
- Index-based deletion: fragile when sorting/filtering.
- Push + manual sort: more code for same effect.

## Consequences
- Model is UI-agnostic; safe to reuse in other views (CSV import page, etc.).
- Storage decisions are isolated.

## Verification
- Adding a tx updates `list()` with new item at index 0.
- `removeMany([id])` removes only selected rows.
- Data persists across refresh via storage gateway.

## Future Work
- Add schema validation/types.
- Support edits/undo.
