# ADR-02: Choose IndexedDB for Client-Side Storage

**Date:** 2025-12-08

**Status:** Accepted

---

## Context

Finsite needs persistent storage for user financial data (transactions, categories, budgets) that:
- Works entirely client-side with no backend server
- Persists data across browser sessions
- Handles potentially large datasets (thousands of transactions)
- Supports complex queries (filtering, sorting, date ranges)
- Maintains user privacy (data never leaves user's device)
- Works reliably across major browsers

The storage solution must balance capacity, performance, ease of use, and browser support.

---

## Decision

We will use IndexedDB as the primary client-side storage mechanism for Finsite.

**Implementation:**
- Store all transactions, categories, and budgets in IndexedDB
- Implement storage abstraction layer (`src/storage/storageService.js`) to wrap IndexedDB API
- Use object stores for different data types (transactions, categories, budgets)
- Implement indexes for common query patterns (by date, by category, by amount)

---

## Consequences

### Benefits
- **Large Capacity**: Can store hundreds of MBs of data (far more than localStorage's ~5-10MB limit)
- **Structured Data**: Supports complex objects natively without JSON serialization
- **Query Performance**: Indexed queries enable fast filtering and sorting of large transaction sets
- **Asynchronous**: Non-blocking operations prevent UI freezing during data operations
- **Browser Support**: Widely supported across all modern browsers
- **Offline-First**: Data available immediately without network dependency
- **Privacy**: Data never leaves user's browser, no server required

### Costs/Limitations
- **API Complexity**: IndexedDB API is verbose and callback-based, requiring abstraction layer
- **No SQL**: Query capabilities limited compared to SQL databases
- **Browser-Specific**: Data doesn't sync across devices or browsers automatically
- **Debugging**: Harder to inspect and debug than localStorage
- **Migrations**: Schema changes require version management and migration logic
- **No Cross-Origin**: Data isolated per origin, can't be shared across domains

---

## Alternatives Considered

**Alternative 1: localStorage**
- Pros: Simple key-value API; easy to use; synchronous; good browser support
- Cons: ~5-10MB storage limit (too small for years of transactions); only stores strings (requires JSON serialization); synchronous (blocks UI); no query capabilities

**Alternative 2: Cloud Storage (Firebase, Supabase, etc.)**
- Pros: Cross-device sync; backup; powerful queries; real-time updates
- Cons: Requires backend/third-party service; privacy concerns (data leaves device); requires internet; ongoing costs; adds complexity; conflicts with "local-first" vision

---

## Notes

- Storage service abstraction (`storageService.js`) hides IndexedDB complexity from rest of application
- Could add localStorage fallback for basic demo/compatibility in future if needed
- Export/import features can provide manual cross-device sync and backup
- If future requirements demand cloud sync, IndexedDB can coexist with server synchronization

**Related ADRs:**
- ADR-01: Use MVC Architecture (Model layer uses storage service)
- Future: May need ADR for data migration strategy as schema evolves

---

## Implementation Details

### Database Schema
- **Database Name**: `finsiteDB`
- **Version**: 2
- **Object Stores**:
  - `transactions`: Primary key `id` (auto-increment), indexes on `group`, `category`, `amount`, `date`
  - `groups`: Primary key `id` (string), stores both default and custom groups
  - `categories`: Primary key `id` (string), index on `groupId`

### Storage Service API (`src/storage/storageService.js`)
**Transactions:**
- `getAllTransactions()`: Returns all transaction records
- `addTransaction(data)`: Creates single transaction, returns record with ID
- `updateTransaction(data)`: Updates existing transaction using `put()`
- `deleteTransactions(ids)`: Deletes multiple transactions by ID array
- `clearAllTransactions()`: Removes all transactions (reset functionality)

**Groups:**
- `getAllGroups()`: Returns all groups
- `addGroup(group)`: Creates or updates group using `put()`
- `deleteGroup(groupId)`: Deletes group by ID

**Categories:**
- `getAllCategories()`: Returns all categories
- `addCategory(category)`: Creates or updates category
- `updateCategoriesBatch(categories)`: Atomic batch update in single transaction

### Error Handling
- Promise-based API with consistent error objects
- `createError(context, detail)` helper for consistent error format
- ID validation: Rejects invalid IDs immediately (prevents silent failures)
- Atomic operations: Batch updates ensure all-or-nothing consistency
