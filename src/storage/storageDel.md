# /docs/adr/004-storage-localstoragegateway.md
# ADR 004 – LocalStorageGateway (Client-Side Persistence)

## Status
Accepted — initial version.

## Context
We need persistence between page reloads without a backend. This is a school project prototype; a server/database may come later.

## Decision
- **LocalStorageGateway** with:
  - `load()` → read `finance_transactions`, parse JSON, return `[]` on failure.
  - `save(list)` → `JSON.stringify(list)` to the same key.
- Injected into the Model to keep storage swappable.

## Code used (key patterns)
- Try/catch in `load()` to guard against corrupt JSON.
- A single constant key to avoid collisions.

## Rationale (Why)
- **Zero setup**, works offline, sufficient for demo scope.
- Keeps I/O outside Model (DI), enabling future replacements.

## Alternatives considered
- `IndexedDB`: more robust but heavier API surface.
- Remote DB (Firestore/Supabase): requires auth & network; overkill for now.

## Consequences
- Data is device-local; no cross-device sync.
- Storage limits apply (~5–10MB depending on browser).

## Verification
- Add a row → refresh → data remains.
- Clear all → refresh → empty list.

## Future Work
- Replace with API gateway when backend exists.
- Migrate data from LocalStorage to server on sign-in.
