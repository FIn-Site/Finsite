# Controller

## Overview

The `FinSiteController` coordinates between the Model and View layers in the MVC architecture. It handles user interactions, orchestrates data flow, and manages application state transitions.

**Core Responsibilities:**
- Initialize application and load data
- Handle user interactions and navigation
- Coordinate model updates and view refreshes
- Manage transaction operations (add, delete, bulk import)
- Optimize dashboard updates based on operation type

## Constructor

```javascript
constructor(model, view)
```

**Purpose:** Initializes the controller with references to model and view instances

**Parameters:**
- `model`: FinSiteModel instance for data operations
- `view`: FinanceView instance for UI rendering

**Behavior:**
- Stores model and view references
- Checks if view has `bindHandlers` method
- If present, binds event handlers:
  - `onNavigate`: Navigation handler
  - `onAddTransaction`: Transaction creation handler
- Logs initialization confirmation

**Pattern:** Dependency injection - controller receives its dependencies instead of creating them

## init()

**Purpose:** Asynchronous initialization sequence for the entire application

**Flow:**
1. Calls `model.init()` to load data from IndexedDB (transactions, groups, categories)
2. Ensures `currentView` is set (defaults to 'dashboard' if missing)
3. Gets fresh data snapshot from model via `getData()`
4. Tells view to render initial UI with `view.update(data)`
5. Refreshes dashboard charts with aggregated data via `_refreshDashboardCharts()`

**Error Handling:**
- Wraps entire flow in try-catch
- Logs errors but doesn't throw (graceful degradation)
- View and model handle their own error states

**Why async:** Storage operations (IndexedDB) are asynchronous

## handleAction(action, payload)

**Purpose:** Generic action dispatcher for user interactions

**Parameters:**
- `action`: String indicating action type
- `payload`: Object containing action-specific data

**Current Actions:**
- `'navigate'`: Routes to different views via `navigate(payload.route)`
- Default: Logs unknown actions for debugging

**Pattern:** Command pattern - encapsulates actions as objects

**Extensibility:** Easy to add new actions without modifying other code

## navigate(route)

**Purpose:** Handles navigation between different application views

**Parameters:**
- `route`: String view identifier ('dashboard', 'transactions', etc.)

**Flow:**
1. Logs navigation event with emoji for visibility
2. Updates model's `currentView` via `model.updateData()`
3. Gets updated data state from model
4. Tells view to render the new route via `view.update(data)`
5. If navigating to dashboard, calls `_refreshDashboardCharts()` to update charts

**Why refresh on dashboard navigation:**
- User may have added/deleted transactions from other views
- Dashboard charts need to reflect latest data
- Charts are only rendered on dashboard page

## _refreshDashboard(isHeavyUpdate)

**Purpose:** Updates dashboard with the latest aggregated data from the model

**Parameters:**
- `isHeavyUpdate`: Boolean flag for optimization
  - `false`: Single/few transactions (default) - smooth animations
  - `true`: Bulk operations - skip animations for performance

**Flow:**
1. Gets pre-aggregated chart data via `model.getDashboardSummary()`
   - Returns: `{ timeSeries, groupBreakdown, metrics }`
2. Gets panel summary via `model.getDashboardPanelSummary()`
   - Returns: `{ recentTransactions, totalSpentAllTime, transactionsThisWeek, monthlySpending... }`
3. If view has `updateDashboardCharts` method:
   - Passes chart data and heavy update flag
   - View forwards to chart component
4. If view has `updateDashboardPanel` method:
   - Passes panel summary data
   - View forwards to dashboard component for stat cards
5. Logs both updates for debugging

**Optimization Strategy:**
- Light updates (single transaction): Charts animate smoothly
- Heavy updates (bulk import): Charts rebuild without animation to avoid lag

**Why separate methods:**
- `updateDashboardCharts`: Time series and group breakdown charts
- `updateDashboardPanel`: Stat cards and recent activity list

## _refreshDashboardCharts(isHeavyUpdate)

**Purpose:** Legacy method name that delegates to `_refreshDashboard()`

**Marked as:** `@deprecated` - Use `_refreshDashboard()` instead

**Why kept:** Backward compatibility with existing code that calls this name

**Behavior:** Simply calls `_refreshDashboard(isHeavyUpdate)` with same parameters

## handleAddTransaction(transactionData)

**Purpose:** Handles manual transaction entry from the UI form

**Parameters:**
- `transactionData`: Object with transaction fields
  - `{ group, category, amount, date, merchant, notes, ... }`

**Flow:**
1. Logs transaction data for debugging
2. Calls `model.addTransaction(transactionData)` (async)
   - Model persists to IndexedDB
   - Model updates in-memory array
   - Model updates aggregates incrementally (O(1))
3. On success:
   - Finds `finsite-transactions` component in DOM
   - Calls `onTransactionAdded(savedTransaction)` if method exists
   - Updates view with new data via `view.update()`
   - Refreshes dashboard with `isHeavyUpdate = false` (smooth animation)
4. On error:
   - Logs error
   - Finds `finsite-transactions` component
   - Calls `onTransactionError(message)` if method exists

**Component Communication Pattern:**
- Controller doesn't directly manipulate components
- Uses component's public API methods for notifications
- Maintains loose coupling between controller and web components

**Optimization:** Single transaction triggers light dashboard update with animations

## handleBulkImport(transactions)

**Purpose:** Handles CSV import or bulk transaction insertion

**Parameters:**
- `transactions`: Array of transaction objects to import

**OPTIMIZATION A:** Uses `model.addTransactionsBulk()` which rebuilds aggregates once instead of incrementally updating per transaction

**Flow:**
1. Logs bulk import with transaction count
2. Calls `model.addTransactionsBulk(transactions)` (async)
   - Model persists all transactions to IndexedDB in sequence
   - Model prepends all to in-memory array in one operation
   - Model calls `_rebuildAggregates()` once at the end (O(n))
3. Updates view with new data via `view.update()`
4. Refreshes dashboard with `isHeavyUpdate = true` (no animation)
5. Logs completion

**Why isHeavyUpdate = true:**
- Bulk imports can add dozens/hundreds of transactions
- Animating chart updates for each would cause lag
- Instant rebuild provides better UX for large imports

**Error Handling:**
- Try-catch logs errors
- Partial imports may succeed (transactions added before error)

## handleDeleteTransactions(ids)

**Purpose:** Handles deletion of one or more transactions

**Parameters:**
- `ids`: Array of transaction IDs (strings or numbers)

**Flow:**
1. Logs deletion request with IDs
2. Calls `model.deleteTransactions(ids)` (async)
   - Model deletes from IndexedDB
   - Model finds matching transactions in memory
   - Model decrements aggregates for each (O(k) where k = deleted count)
   - Model filters transactions from in-memory array
3. Updates view with new data via `view.update()`
4. Refreshes dashboard with optimization:
   - If `ids.length > 5`: Heavy update (no animation)
   - If `ids.length <= 5`: Light update (with animation)
5. Logs completion

**Optimization Logic:**
- Small deletions (≤5): Smooth animated chart updates
- Large deletions (>5): Instant chart rebuild for better performance

**Error Handling:**
- Try-catch logs errors
- View may show stale data if delete fails

## Code Patterns Used

### Async/Await
All data operations use async/await for cleaner asynchronous code flow compared to promises

### Try-Catch Error Handling
Every async method wraps operations in try-catch for graceful error handling

### Guard Clauses
Methods check for method existence before calling (e.g., `typeof this.view.updateDashboardCharts === 'function'`)

### Dependency Injection
Controller receives model and view as constructor parameters instead of creating them

### Single Responsibility
Each method has one clear purpose - easy to test and understand

### Event Handler Binding
View events are bound through a central `bindHandlers` method for organized event management

## Architecture Decisions

### Why Controller Owns Sequencing
**Pattern:** Controller coordinates: validate → mutate model → update view

**Rationale:**
- Centralizes business logic away from View
- Keeps Model focused on data operations
- Clear test surface - can mock model/view
- Easy to extend with new actions

**Alternatives Considered:**
- Validation in View: Mixes concerns, duplicates logic
- Model performing validation: Harder to tailor UI messages

### Why Separate Heavy/Light Updates
**Pattern:** Different refresh strategies based on operation scale

**Rationale:**
- Single transactions: User expects smooth feedback
- Bulk operations: User expects fast completion
- Chart.js animations can lag with large data changes

**Trade-off:** Slightly more complex refresh logic, but much better UX

### Why Component Communication via Public Methods
**Pattern:** Controller calls component methods instead of direct DOM manipulation

**Rationale:**
- Maintains web component encapsulation
- Loose coupling between controller and components
- Components control their own rendering logic

**Alternative:** Custom events - more decoupled but more verbose

## Verification & Testing

**Successful Flows:**
- App initializes with data from storage
- Navigation updates URL and view
- Single transaction adds with animation
- Bulk import completes quickly without lag
- Deletions update dashboard correctly

**Error Flows:**
- Storage failures don't crash app
- Invalid data logs errors but doesn't throw
- Component method checks prevent errors if component missing

## Future Work

**Potential Enhancements:**
- Server sync with loading states
- Undo/redo for deletions
- Transaction editing support
- Validation middleware/schema (zod, valibot)
- Error boundary component integration
- Optimistic updates with rollback on failure
- Batch multiple actions before single refresh
