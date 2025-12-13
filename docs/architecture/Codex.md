# FinSite MVC Architecture Documentation

## 1. financeModel.js

### 1. File Overview

**File path:** `src/model/financeModel.js`

**File name:** financeModel.js

**Layer / role in architecture:** Model (Business Logic & Data Layer)

**Short summary:**
The Model manages all application data (transactions, groups, categories) and provides business logic for financial calculations. It implements an incremental aggregation strategy using Maps to achieve O(1) dashboard queries instead of O(n) full scans. All data persistence flows through this Model to IndexedDB via the storage service.

---

### 2. Responsibilities & Boundaries

**Core responsibilities:**
- Load/persist transactions, groups, and categories via storage service
- Maintain in-memory copies of all data (`this.data.transactions`, `this.data.groups`, `this.data.categories`)
- Incrementally update aggregate Maps (`_timeBuckets`, `_groupTotals`, `_cachedMetrics`) on every add/delete
- Provide O(1) dashboard summaries using pre-computed aggregates
- Validate and normalize transaction inputs before persistence
- Reassign categories to "Uncategorized" when groups are deleted
- Rebuild aggregates from scratch on init and after bulk operations

**What this file explicitly does NOT do:**
- Does not touch the DOM or know about UI components
- Does not handle user interactions or routing
- Does not format data for display (currency, dates, icons)
- Does not know about Chart.js or visualization libraries
- Does not manage modal state or component visibility

---

### 3. Public API of This File

**Main exports / public surface:**

**Exported Class:** `FinSiteModel`

**Key Methods:**
- `async init()` – Loads data from IndexedDB, seeds defaults if empty, builds aggregates
- `getData()` – Returns shallow copy of current state (`transactions`, `groups`, `categories`)
- `updateData(newData)` – Merges new data into internal state
- `async addTransaction(input)` – Validates, persists, and incrementally updates aggregates (O(1))
- `async addTransactionsBulk(transactions)` – Bulk import with single aggregate rebuild at end
- `async deleteTransactions(ids)` – Deletes and decrements aggregates (O(k) where k = deleted count)
- `async clearAllTransactions()` – Wipes all transactions and clears aggregates
- `getTransactions()` / `getGroups()` / `getCategories()` – Read-only getters returning copies
- `async addGroup(group)` / `async addCategory(category)` – Create/update groups and categories
- `async deleteGroup(groupId)` – Removes group, reassigns categories, rebuilds aggregates
- `getDashboardSummary()` – Returns `{timeSeries, groupBreakdown, metrics}` from aggregates (O(1))
- `getDashboardPanelSummary()` – Returns stats for dashboard cards (total spent, weekly count, recent txns)
- `getCategoryAggregates()` – Returns category breakdowns with amounts and group totals
- `getCategoryBreakdownByGroup(groupId)` – Returns single group's categories, transactions, totals
- `getDefaultConfig()` – Returns default groups/categories structure

**Side effects:**
- None (does not register components, attach listeners, or modify global state)
- All I/O is explicitly async and returns Promises

---

### 4. Dependencies: What This File Uses

**Internal imports:**
- `storage/storageService.js` – All IndexedDB operations (getAllTransactions, addTransaction, deleteTransactions, getAllGroups, addGroup, deleteGroup, getAllCategories, addCategory, updateCategoriesBatch, clearAllTransactions)
- `storage/seed-data.js` – `seedDatabase()` for first-time user setup
- `utils/debugService.js` – `createPrefixedLogger('[Model]')` for togglable debug logging
- `utils/categoryAggregator.js` – Pure functions for building category breakdowns (buildCategoryAggregates, buildGroupBreakdown)

**External libraries:**
- None (uses native JavaScript Map, Set, Array, Date)

**Direction of dependency:**
- **Lower-level utility** – The Model is the data layer that Controller and View depend on
- Sits above storage but below Controller
- No knowledge of View or UI components

---

### 5. Consumers: Who Uses This File

**Known files that import/use this:**
- `controller/financeContoller.js` – Primary consumer
- `view/financeView.js` – Receives Model reference for wiring to components

**How they use it:**

**Controller:**
- Calls `model.init()` on app startup
- Calls `model.addTransaction()` when user submits manual entry form
- Calls `model.deleteTransactions(ids)` when user deletes transactions
- Calls `model.deleteGroup(groupId)` when user deletes a custom group
- Calls `model.getData()` to sync state to View
- Calls `model.getDashboardSummary()` and `model.getDashboardPanelSummary()` for charts

**View:**
- Receives `model` reference in constructor
- Passes `model` to categories and transactions components for direct data access
- Components call `model.getGroups()`, `model.getCategories()`, `model.getTransactions()` for rendering

---

### 6. Data & Contracts

**Inputs:**

**Transaction Input (addTransaction):**
```javascript
{
  group: string,         // Group ID (required)
  category: string,      // Category ID (required)
  amount: number,        // Must be > 0 (required)
  date: string,          // ISO date "YYYY-MM-DD" (required)
  merchant?: string,     // Optional
  notes?: string         // Optional
}
```

**Group Input (addGroup):**
```javascript
{
  id: string,
  name: string,
  isCustom?: boolean,
  categoryIds?: string[], // For custom groups
  icon?: string
}
```

**Category Input (addCategory):**
```javascript
{
  id: string,
  groupId: string,
  name: string
}
```

**Outputs:**

**getData() returns:**
```javascript
{
  accounts: Array,
  transactions: Array<Transaction>,
  groups: Array<Group>,
  categories: Array<Category>,
  currentView: string,
  user: Object
}
```

**getDashboardSummary() returns:**
```javascript
{
  timeSeries: { labels: string[], values: number[] },
  groupBreakdown: { labels: string[], values: number[] },
  metrics: { thisMonth, lastMonth, percentChange, sixMonthAvg }
}
```

**Assumptions / invariants:**
- Transaction amounts are positive numbers (absolute value used internally)
- Dates are valid ISO strings or Date objects
- Group IDs and category IDs must exist when referenced by transactions
- "uncategorized" is a reserved system group ID
- Default groups (household, investments, expenses) always exist after `init()`
- Aggregates (`_timeBuckets`, `_groupTotals`) are always in sync with `this.data.transactions`

---

### 7. Storage & State Interaction

**Storage modules used:**
- `storageService.js` – All IndexedDB operations

**Object stores / collections / tables:**
- `TRANSACTIONS_STORE` – Stores transaction records
- `GROUPS_STORE` – Stores group definitions
- `CATEGORIES_STORE` – Stores category definitions

**Read operations:**
- **On init:** Loads all transactions, groups, categories via `getAllTransactions()`, `getAllGroups()`, `getAllCategories()`
- **No polling or intervals** – All reads are triggered by method calls

**Write/update/delete operations:**
- **addTransaction:** Calls `addTransaction()` storage, updates `this.data.transactions`, increments aggregates
- **addTransactionsBulk:** Calls `addTransaction()` for each valid transaction, rebuilds aggregates once at end
- **deleteTransactions:** Calls `deleteTransactions()` storage, filters `this.data.transactions`, decrements aggregates
- **clearAllTransactions:** Calls `clearAllTransactions()` storage, sets `this.data.transactions = []`, clears aggregates
- **deleteGroup:** Calls `deleteGroup()` storage, calls `updateCategoriesBatch()` to reassign categories, removes group from `this.data.groups`, rebuilds aggregates

**Caching / in-memory state:**
- `this.data.transactions` / `.groups` / `.categories` – Full in-memory copies of IndexedDB data
- `this._timeBuckets` – Map<"YYYY-MM", totalSpend> for monthly aggregates
- `this._groupTotals` – Map<groupId, totalSpend> for group aggregates
- `this._cachedMetrics` – Object with `{thisMonth, lastMonth, sixMonthTotal}`
- `this._lastNMonthKeysCache` – Set of last 6 month bucket keys for O(1) lookups

---

### 8. UI / Component Interaction

**DOM responsibilities:**
- None (Model has zero DOM knowledge)

**Components it uses or controls:**
- None (Model is a pure data layer)

**Events / callbacks:**
- Does not emit events
- Does not listen for events
- Controller invokes Model methods directly

**Lifecycle notes:**
- Initialized once by Controller via `model.init()` on app startup
- Remains in memory for entire session
- Methods called by Controller in response to user actions

---

### 9. Typical Flow Examples

**Scenario 1: User adds a transaction**

1. **User:** Fills out manual entry form and clicks "Add Transaction"
2. **Controller:** Calls `model.addTransaction(transactionData)`
3. **Model:**
   - Validates input via `_validateTransaction()`
   - Persists to IndexedDB via `addTransaction()`
   - Prepends to `this.data.transactions`
   - Calls `_applyTransactionDelta(tx, +1)` to increment aggregates
4. **Model returns:** Saved transaction object
5. **Controller:** Calls `view.update()` with refreshed data
6. **Controller:** Calls `view.updateDashboardCharts()` with new aggregates

**Scenario 2: User deletes a custom group**

1. **User:** Clicks delete button in categories page modal
2. **Categories component:** Dispatches `request-delete-group` event
3. **View:** Forwards to Controller via handler
4. **Controller:** Calls `model.deleteGroup(groupId)`
5. **Model:**
   - Finds categories with `groupId`
   - Batch updates them to `groupId: 'uncategorized'` via `updateCategoriesBatch()`
   - Deletes group from IndexedDB via `deleteGroup()`
   - Filters `this.data.groups` to remove deleted group
   - Calls `_rebuildAggregates()` to recalculate `_groupTotals` from scratch
6. **Model returns:** Updated data state
7. **Controller:** Calls `view.onGroupDeleted(groupId)` to close modal
8. **Controller:** Calls `_syncModelToView()` to refresh all components

---

### 10. Known Risks / Coupling / TODOs

**Tight couplings:**
- Tightly coupled to `storageService.js` API shape (all methods return Promises)
- Assumes IndexedDB is available and working (no fallback to localStorage)
- Default config hardcoded in `_getDefaultConfig()` instead of external JSON
- Group breakdown aggregation assumes deleted groups should show as "Uncategorized" instead of hiding completely

**Potential refactors:**
- Extract aggregate logic into separate `AggregationEngine` class for testability
- Add event emitter pattern so components can subscribe to model changes directly
- Support undo/redo by maintaining transaction history stack
- Add optimistic UI updates with rollback on storage failure
- Cache `getDashboardSummary()` result and invalidate on data change

**Anything surprising / non-obvious:**
- `_rebuildAggregates()` is O(n) but only called on `init()` and bulk operations – individual adds/deletes use O(1) incremental updates
- Transactions keep their original `group` reference even after group deletion (for historical accuracy)
- `_getGroupBreakdownFromAggregates()` filters out deleted groups but aggregates their spending under "Uncategorized"
- Month bucket keys are cached in a Set (`_lastNMonthKeysCache`) to avoid rebuilding on every transaction check

---

## 4. storageService.js

### 1. File Overview

**File path:** `src/storage/storageService.js`

**File name:** storageService.js

**Layer / role in architecture:** Storage (Persistence Layer / Database Abstraction)

**Short summary:**
The storage service provides a clean Promise-based API wrapping IndexedDB for all CRUD operations on transactions, groups, and categories. It handles database initialization, schema versioning, error handling, and transaction atomicity, abstracting away the complexity of IndexedDB's event-based API from higher layers.

---

### 2. Responsibilities & Boundaries

**Core responsibilities:**
- Initialize and manage IndexedDB database connection (`finsiteDB`)
- Create and upgrade database schema (object stores and indexes)
- Provide async CRUD operations for transactions (add, getAll, delete, clear)
- Provide async CRUD operations for groups (add, getAll, delete)
- Provide async CRUD operations for categories (add, getAll, batch update)
- Normalize and validate IDs before database operations
- Handle IndexedDB transaction management and error wrapping
- Ensure batch operations are atomic (all succeed or all fail)

**What this file explicitly does NOT do:**
- Does not compute aggregates or perform business logic calculations
- Does not validate transaction amounts, dates, or category references
- Does not know about UI components or DOM
- Does not manage in-memory caches (delegates to Model layer)
- Does not format data for display
- Does not know about default groups/categories structure
- Does not make decisions about what to delete or when to rebuild state

---

### 3. Public API of This File

**Main exports / public surface:**

**Transaction Operations:**
- `async getAllTransactions()` – Returns all transactions from IndexedDB as array
- `async addTransaction(transactionData)` – Adds transaction, returns object with auto-generated ID
- `async deleteTransactions(ids)` – Deletes multiple transactions in single transaction
- `async clearAllTransactions()` – Destructive wipe of all transactions (for reset)

**Group Operations:**
- `async getAllGroups()` – Returns all groups from IndexedDB as array
- `async addGroup(group)` – Adds or updates group using `put` operation
- `async deleteGroup(groupId)` – Deletes single group by ID

**Category Operations:**
- `async getAllCategories()` – Returns all categories from IndexedDB as array
- `async addCategory(category)` – Adds or updates category using `put` operation
- `async updateCategoriesBatch(categories)` – Atomic batch update of multiple categories

**Internal Functions (not exported):**
- `openDatabase()` – Returns Promise<IDBDatabase>, handles schema upgrades
- `createError(context, detail)` – Wraps errors with context for better debugging

**Side effects:**
- Creates IndexedDB database `finsiteDB` on first use
- Creates three object stores: `transactions`, `groups`, `categories`
- Creates indexes on transactions: `groupIndex`, `categoryIndex`, `amountIndex`, `dateIndex`
- Creates index on categories: `groupIdIndex`

---

### 4. Dependencies: What This File Uses

**Internal imports:**
- None (pure storage layer with no internal dependencies)

**External libraries:**
- `indexedDB` (browser native API) – All persistence operations
- None (no npm packages, uses only native browser APIs)

**Direction of dependency:**
- **Lowest-level module** – No dependencies on any other app code
- Model layer depends on this, but this knows nothing about Model
- Pure infrastructure layer that could be reused in other projects

---

### 5. Consumers: Who Uses This File

**Known files that import/use this:**
- `model/financeModel.js` – Primary and only consumer
- `storage/seed-data.js` – Uses this to seed initial data (not shown but implied)

**How they use it:**

**financeModel.js:**
- Calls `getAllTransactions()`, `getAllGroups()`, `getAllCategories()` during `init()`
- Calls `addTransaction()` when user adds single transaction
- Calls `addTransaction()` in loop during bulk import
- Calls `deleteTransactions(ids)` when user deletes transactions
- Calls `clearAllTransactions()` when user resets data
- Calls `addGroup()` to create custom groups or ensure defaults exist
- Calls `deleteGroup(groupId)` when user deletes custom group
- Calls `updateCategoriesBatch()` when reassigning categories after group deletion
- Calls `addCategory()` to create categories or ensure defaults exist

---

### 6. Data & Contracts

**Inputs:**

**addTransaction() expects:**
```javascript
{
  amount: number,       // Positive number
  description: string,  // User-provided text
  date: string,         // ISO date "YYYY-MM-DD"
  category: string,     // Category ID
  group: string,        // Group ID
  merchant?: string,    // Optional
  notes?: string        // Optional
}
// Does NOT include id (auto-generated)
```

**addGroup() expects:**
```javascript
{
  id: string,           // Unique identifier
  name: string,         // Display name
  color?: string,       // Hex color
  icon?: string,        // Emoji
  isCustom?: boolean,   // Flag for user-created groups
  categoryIds?: string[] // For custom groups
}
```

**addCategory() expects:**
```javascript
{
  id: string,       // Unique identifier
  groupId: string,  // Parent group
  name: string,     // Display name
  color?: string,   // Hex color
  icon?: string     // Emoji
}
```

**deleteTransactions() expects:**
- Array of IDs (number or string, will be normalized to number)

**Outputs:**

**getAllTransactions() returns:**
```javascript
Promise<Array<Transaction>> // Array of all transactions with IDs
```

**addTransaction() returns:**
```javascript
Promise<Transaction> // Input data + auto-generated id field
```

**deleteTransactions() returns:**
```javascript
Promise<void> // Resolves on success, rejects on error
```

**All functions return Promises:**
- Resolve with data on success
- Reject with Error object (created by `createError()`) on failure

**Assumptions / invariants:**
- IndexedDB is available in browser environment
- Database schema version matches `DB_VERSION` constant (currently 2)
- Transaction IDs are numbers (auto-increment)
- Group and category IDs are strings
- `put` operations (addGroup, addCategory) will overwrite existing records with same ID
- Batch operations are atomic – either all succeed or all fail
- IDs passed to `deleteTransactions()` can be coerced to numbers

---

### 7. Storage & State Interaction

**Storage modules used:**
- **This IS the storage module** – It directly manages IndexedDB

**Object stores / collections / tables:**

**`transactions` store:**
- Key: `id` (auto-increment number)
- Indexes: `groupIndex`, `categoryIndex`, `amountIndex`, `dateIndex`
- Purpose: Store all transaction records

**`groups` store:**
- Key: `id` (string, e.g., "household", "my-custom-group")
- No indexes
- Purpose: Store group definitions (default and custom)

**`categories` store:**
- Key: `id` (string, e.g., "groceries", "utilities")
- Index: `groupIdIndex` (allows quick lookup of all categories in a group)
- Purpose: Store category definitions

**Read operations:**
- `getAll()` operations load entire object store into memory (no filtering at storage layer)
- All reads are on-demand via method calls (no background polling)

**Write/update/delete operations:**
- `add()` – Inserts new transaction (ID auto-generated)
- `put()` – Upserts groups and categories (insert or update based on ID)
- `delete()` – Removes single record by key
- `clear()` – Wipes entire object store
- Batch updates use single IndexedDB transaction for atomicity

**Caching / in-memory state:**
- **None** – This layer is stateless
- Every call opens database connection and performs operation
- No caching, no connection pooling, no query optimization
- Model layer is responsible for in-memory caching

---

### 8. UI / Component Interaction

**DOM responsibilities:**
- None (zero UI knowledge)

**Components it uses or controls:**
- None (pure data persistence layer)

**Events / callbacks:**
- Does not emit events
- Does not listen for events
- Purely synchronous function calls returning Promises

**Lifecycle notes:**
- Initialized on first `openDatabase()` call (lazy initialization)
- Database remains open for browser session lifetime
- No explicit cleanup or connection closing logic

---

### 9. Typical Flow Examples

**Scenario 1: App initialization – loading all data**

1. **Trigger:** Model's `init()` method called by Controller on app startup
2. **Storage Service:**
   - Model calls `getAllTransactions()`, `getAllGroups()`, `getAllCategories()` in parallel
   - Each function calls `openDatabase()`
   - If database doesn't exist, `onupgradeneeded` fires and creates schema
   - If database exists but version is old, `onupgradeneeded` runs migrations
   - `getAll()` operations return arrays from each object store
3. **Returns:** Three arrays to Model layer
4. **Model:** Stores in `this.data`, builds aggregates

**Scenario 2: User adds transaction**

1. **Trigger:** Model's `addTransaction()` called with validated transaction data
2. **Storage Service:**
   - `addTransaction(transactionData)` called
   - Opens database connection
   - Creates readwrite transaction on `transactions` store
   - Calls `store.add(transactionData)`
   - IndexedDB auto-generates ID
   - Returns `{ id: generatedId, ...transactionData }`
3. **Returns:** Transaction object with ID to Model
4. **Model:** Adds to `this.data.transactions`, updates aggregates

**Scenario 3: User deletes custom group**

1. **Trigger:** Model's `deleteGroup(groupId)` called
2. **Storage Service (multiple calls):**
   - Model first calls `updateCategoriesBatch(categoriesToReassign)`
     - Opens transaction on `categories` store
     - Loops through categories, calls `put()` for each
     - Transaction commits atomically
   - Model then calls `deleteGroup(groupId)`
     - Opens transaction on `groups` store
     - Calls `store.delete(groupId)`
     - Resolves on success
3. **Returns:** void to Model
4. **Model:** Updates in-memory state, rebuilds aggregates

---

### 10. Known Risks / Coupling / TODOs

**Tight couplings:**
- Hardcoded database name `finsiteDB` and version `DB_VERSION = 2`
- Object store names hardcoded as constants (`TRANSACTION_STORE`, etc.)
- No abstraction layer – switching from IndexedDB to another storage would require rewriting this entire file
- Schema is defined in code (no migration framework or versioned schema files)

**Potential refactors:**
- Add connection pooling or persistent database handle to avoid reopening on every call
- Extract schema definitions to separate config file for easier maintenance
- Add query builder or filter support to avoid loading entire stores into memory
- Implement pagination for `getAllTransactions()` to handle large datasets
- Add retry logic for transient IndexedDB errors
- Support for transactions across multiple object stores (current batch only works per store)
- Add optional caching layer to reduce redundant reads
- Implement database versioning migrations in separate migration files

**Anything surprising / non-obvious:**
- `addGroup()` and `addCategory()` use `put()` instead of `add()` – will silently overwrite existing records with same ID
- `deleteTransactions()` accepts both strings and numbers, normalizes to numbers (flexible but potentially error-prone)
- No validation at this layer – relies on Model to validate data before calling
- Errors are wrapped with `createError()` helper but error handling is minimal (no retries, no fallbacks)
- Database connection is re-established on every operation (no connection reuse)
- `updateCategoriesBatch()` returns empty array if input is empty/invalid instead of throwing error
- IndexedDB transactions auto-commit when all operations succeed (no explicit commit call)
- Indexes are created but never queried in current implementation (all reads use `getAll()`)

---

## 2. financeView.js

### 1. File Overview

**File path:** `src/view/financeView.js`

**File name:** financeView.js

**Layer / role in architecture:** View (UI Orchestration & DOM Management)

**Short summary:**
The View handles all UI rendering and DOM manipulation for the application. It orchestrates Web Components (dashboard, transactions, categories), manages page navigation, and acts as the communication bridge between Controller and UI components by forwarding events upward and data/commands downward.

---

### 2. Responsibilities & Boundaries

**Core responsibilities:**
- Render the two-pane layout (sidebar + main content area)
- Navigate between pages (dashboard, transactions, categories) by swapping components
- Set up event listeners on container to catch bubbled events from components
- Forward component events (add-transaction, request-delete-group) to Controller via handlers
- Push model data to active components via `setTransactions()`, `setTaxonomy()`, `setData()`
- Wire model reference to categories and transactions components
- Update dashboard charts and panel with pre-aggregated data from Model
- Provide lifecycle callbacks (`onTransactionAdded`, `onGroupDeleted`) for Controller to notify components

**What this file explicitly does NOT do:**
- Does not call storage service directly (all data flows through Controller → Model)
- Does not compute aggregates or perform business logic
- Does not manage transaction/group/category state (delegates to Model)
- Does not know about IndexedDB or storage internals
- Does not render component internals (components are self-contained Web Components)

---

### 3. Public API of This File

**Main exports / public surface:**

**Exported Class:** `FinSiteView`

**Key Methods:**
- `constructor(model)` – Stores optional model reference for component wiring
- `bindHandlers(handlers)` – Registers Controller callbacks (`onNavigate`, `onAddTransaction`, `onDeleteGroup`)
- `render(selector)` – Creates app shell and renders initial page
- `setupComponentEvents()` – Attaches event listeners to container for component events
- `navigateToPage(page)` – Swaps page content and wires model to new components
- `update(data)` – Pushes model data to active page component
- `updateDashboardCharts(chartData, isHeavyUpdate)` – Passes aggregated chart data to dashboard
- `updateDashboardPanel(panelSummary)` – Updates dashboard stat cards with real data
- `onTransactionAdded(savedTransaction)` – Notifies transactions component of successful add
- `onTransactionError(errorMessage)` – Notifies transactions component of error
- `onGroupDeleted(groupId)` – Notifies categories component to close modal and refresh
- `onBulkImportComplete(result)` – Handles bulk import completion feedback
- `showError(message)` – Displays user-facing error (currently console.error)
- `getCurrentPage()` – Returns current page name

**Private Methods:**
- `renderPageComponent(page)` – Returns HTML string for requested page's component
- `_wireModelToCategories()` – Injects model reference into all `<finsite-categories>` elements
- `_wireModelToTransactions()` – Injects model reference and data into `<finsite-transactions>` elements

**Side effects:**
- Sets up global event listeners on `this.container` (removed when component is destroyed)
- No custom element registration (components register themselves)
- No window/document listeners

---

### 4. Dependencies: What This File Uses

**Internal imports:**
- `components/dashboard.js` – Imports `<finsite-dashboard>` component
- `components/sidebar.js` – Imports `<finsite-sidebar>` component
- `components/transactions.js` – Imports `<finsite-transactions>` component
- `components/categories.js` – Imports `<finsite-categories>` component
- `utils/debugService.js` – `createPrefixedLogger('[View]')` for debug logging

**External libraries:**
- None (uses native DOM APIs)

**Direction of dependency:**
- **Higher-level orchestrator** – Sits above components, below Controller
- Imports all component modules but doesn't know their internal implementation
- Model reference is injected, not owned

---

### 5. Consumers: Who Uses This File

**Known files that import/use this:**
- `controller/financeContoller.js` – Primary consumer
- `app.js` – Entry point instantiates View and passes to Controller

**How they use it:**

**Controller:**
- Instantiates `new FinSiteView(model)` and calls `view.render('#app')`
- Calls `view.bindHandlers()` to register callbacks
- Calls `view.update(data)` after model changes
- Calls `view.updateDashboardCharts(chartData)` for dashboard refresh
- Calls `view.updateDashboardPanel(panelSummary)` for stat cards
- Calls `view.onTransactionAdded()`, `view.onGroupDeleted()` for component feedback
- Calls `view.navigateToPage(route)` during navigation

**App.js:**
- Creates View instance and passes to Controller during initialization

---

### 6. Data & Contracts

**Inputs:**

**bindHandlers() expects:**
```javascript
{
  onNavigate: (route: string) => void,
  onAddTransaction: (transactionData: Object) => void,
  onDeleteGroup: (groupId: string, groupName: string) => void
}
```

**update() expects:**
```javascript
{
  currentView?: string,
  transactions?: Array<Transaction>,
  groups?: Array<Group>,
  categories?: Array<Category>
}
```

**updateDashboardCharts() expects:**
```javascript
{
  timeSeries: { labels: string[], values: number[] },
  groupBreakdown: { labels: string[], values: number[] },
  metrics: { thisMonth, lastMonth, percentChange, sixMonthAvg }
}
```

**Outputs:**

**Events forwarded to Controller:**
- `navigate` (from sidebar) → `handlers.onNavigate(page)`
- `add-transaction` (from transactions) → `handlers.onAddTransaction(data)`
- `request-delete-group` (from categories) → `handlers.onDeleteGroup(groupId, groupName)`

**DOM changes:**
- Renders `<finsite-sidebar>` and page component into `#app`
- Swaps `#content-area` innerHTML on navigation
- Updates component properties/methods (does NOT manipulate component shadow DOM)

**Assumptions / invariants:**
- `this.container` exists after `render()` is called
- Components are registered as custom elements before View uses them
- Model reference is set before calling `_wireModelToCategories()` or `_wireModelToTransactions()`
- Events from components have `bubbles: true, composed: true` to escape shadow DOM

---

### 7. Storage & State Interaction

**Storage modules used:**
- None (View does not touch storage directly)

**Object stores / collections / tables:**
- N/A

**Read operations:**
- None (View calls `model.getTransactions()` etc. but doesn't know about storage)

**Write/update/delete operations:**
- None (all writes go through Controller → Model → Storage)

**Caching / in-memory state:**
- `this.currentPage` – Tracks active page name
- `this.sidebarCollapsed` – Tracks sidebar visibility state
- `this.handlers` – Stores Controller callbacks
- No data caching (always gets fresh data from Model via Controller)

---

### 8. UI / Component Interaction

**DOM responsibilities:**
- Renders app shell: `<div class="app-shell">` containing sidebar and main content
- Swaps `#content-area` innerHTML when navigating
- Does NOT render component internals (components are self-contained)

**Components it uses or controls:**

**Uses:**
- `<finsite-sidebar>` – Navigation menu
- `<finsite-dashboard>` – Dashboard page with charts and stats
- `<finsite-transactions>` – Transactions list with manual entry
- `<finsite-categories>` – Categories page with group charts

**Controls via:**
- Calling component methods: `dashboard.updateChartData()`, `transactions.setTransactions()`, `categories.setData()`
- Setting component properties: `categoriesPage.model = this.model`
- Does NOT call component render methods (components self-render)

**Events / callbacks:**

**Listens for (via container event delegation):**
- `navigate` (from sidebar) – User clicks nav item
- `add-transaction` (from transactions) – User submits form
- `open-manual-entry` (from transactions) – Modal opened (logging only)
- `request-delete-group` (from categories) – User confirms group deletion
- `sidebar-toggle` (from sidebar) – Sidebar collapsed/expanded

**Emits upwards:**
- None (View is the top of the UI layer; forwards events to Controller via handlers)

**Lifecycle notes:**
- `render()` called once on app startup
- `navigateToPage()` called on route changes
- `update()` called after every model state change
- `_wireModelToCategories()` / `_wireModelToTransactions()` called after navigation to ensure new components get model reference

---

### 9. Typical Flow Examples

**Scenario 1: User navigates to Transactions page**

1. **User:** Clicks "Transactions" in sidebar
2. **Sidebar component:** Dispatches `navigate` event with `{page: 'transactions'}`
3. **View:** `setupComponentEvents()` listener catches event
4. **View:** Calls `handlers.onNavigate('transactions')`
5. **Controller:** Calls `view.navigateToPage('transactions')`
6. **View:**
   - Sets `this.currentPage = 'transactions'`
   - Swaps `#content-area` to `<finsite-transactions></finsite-transactions>`
   - Calls `_wireModelToTransactions()` to inject model and data
7. **View:** Calls model methods to get transactions/groups/categories and calls `setTransactions()` and `setTaxonomy()` on component
8. **Controller:** Calls `_syncModelToView()` which calls `view.update(data)`
9. **View:** Passes `data.transactions` to `transactions.setTransactions()`

**Scenario 2: Controller notifies of successful transaction add**

1. **Controller:** Calls `view.onTransactionAdded(savedTransaction)`
2. **View:** Finds `this.transactionsEl` (transactions component reference)
3. **View:** Calls `transactionsEl.onTransactionAdded(savedTransaction)`
4. **Transactions component:** Displays success toast, clears form

---

### 10. Known Risks / Coupling / TODOs

**Tight couplings:**
- Hardcoded component names (`<finsite-dashboard>`, `<finsite-transactions>`, etc.)
- Assumes components have specific methods (`setTransactions`, `setTaxonomy`, `updateChartData`)
- Direct method calls on components instead of event-driven communication
- `_wireModelToTransactions()` duplicates data injection logic from `update()`

**Potential refactors:**
- Use a router library instead of manual `navigateToPage()` switch statement
- Implement pub/sub pattern instead of direct component method calls
- Extract component wiring logic into separate ComponentRegistry
- Add error boundaries for component failures
- Replace `showError()` with a proper toast/notification component

**Anything surprising / non-obvious:**
- `_wireModelToTransactions()` injects both model reference AND transactions data because navigation creates fresh components before `update()` is called
- Default taxonomy fallback logic is duplicated in both `update()` and `_wireModelToTransactions()`
- View stores a model reference but Controller also passes data via `update()` – dual sync mechanism
- Categories component gets model reference for direct access but other components get data pushed to them

---

## 3. financeContoller.js

### 1. File Overview

**File path:** `src/controller/financeContoller.js`

**File name:** financeContoller.js

**Layer / role in architecture:** Controller (Business Logic Coordinator)

**Short summary:**
The Controller coordinates all interactions between Model and View following the MVC pattern. It handles user actions (add transaction, delete group, navigate), orchestrates data flow by calling Model methods and passing results to View, and manages dashboard refresh logic with optimized aggregation queries.

---

### 2. Responsibilities & Boundaries

**Core responsibilities:**
- Initialize application by loading Model data and rendering View
- Handle user actions forwarded from View (add transaction, navigate, delete group)
- Call Model methods to persist changes and retrieve data
- Call View methods to update UI with fresh data
- Decide when to refresh dashboard (after data changes, on navigation)
- Choose between light updates (with animation) vs heavy updates (bulk import, no animation)
- Log all operations for debugging
- Handle errors and notify View to display user-friendly messages

**What this file explicitly does NOT do:**
- Does not touch DOM or know about component internals
- Does not read/write to IndexedDB directly (delegates to Model)
- Does not compute aggregates or perform calculations (delegates to Model)
- Does not render UI or manage component state (delegates to View)
- Does not validate transaction inputs (Model validates)

---

### 3. Public API of This File

**Main exports / public surface:**

**Exported Class:** `FinSiteController`

**Key Methods:**
- `constructor(model, view)` – Stores references and calls `view.bindHandlers()`
- `async init()` – Loads data from Model, syncs to View, refreshes dashboard
- `handleAction(action, payload)` – Generic action dispatcher (currently only handles 'navigate')
- `navigate(route)` – Updates Model state, calls `view.navigateToPage()`, syncs data
- `async handleAddTransaction(transactionData)` – Adds transaction via Model, notifies View
- `async handleBulkImport(transactions)` – Bulk import with heavy update and result summary
- `async handleDeleteTransactions(ids)` – Deletes transactions, decides if heavy update needed
- `async handleDeleteGroup(groupId, groupName)` – Deletes group, notifies View, syncs state

**Private Methods:**
- `_syncModelToView({isHeavyUpdate, refreshDashboard})` – Gets data from Model, calls `view.update()`, optionally refreshes dashboard
- `_refreshDashboard(isHeavyUpdate)` – Gets chart/panel data from Model, pushes to View
- `_handleError(context, error, userMessage)` – Logs error, optionally calls `view.showError()`

**Side effects:**
- None (Controller doesn't attach global listeners or modify global state)
- All side effects happen via Model (storage writes) or View (DOM updates)

---

### 4. Dependencies: What This File Uses

**Internal imports:**
- `utils/debugService.js` – `createPrefixedLogger('[Controller]')` for debug logging
- Model instance (passed to constructor)
- View instance (passed to constructor)

**External libraries:**
- None

**Direction of dependency:**
- **Middle orchestrator** – Sits between Model (below) and View (above)
- Owns references to both but neither knows about Controller
- Drives all application flow in response to user actions

---

### 5. Consumers: Who Uses This File

**Known files that import/use this:**
- `app.js` – Entry point instantiates Controller and calls `controller.init()`

**How they use it:**
- **App.js:** Creates `new FinSiteController(model, view)` and calls `controller.init()` to start app

---

### 6. Data & Contracts

**Inputs:**

**handleAddTransaction() expects:**
```javascript
{
  group: string,
  category: string,
  amount: number,
  date: string,        // "YYYY-MM-DD"
  merchant?: string,
  notes?: string
}
```

**handleDeleteGroup() expects:**
- `groupId: string`
- `groupName: string` (for logging only)

**navigate() expects:**
- `route: string` (e.g., 'dashboard', 'transactions', 'categories')

**Outputs:**

**Calls View methods with:**
- `view.update(data)` where data = result of `model.getData()`
- `view.updateDashboardCharts(chartData, isHeavyUpdate)` where chartData = result of `model.getDashboardSummary()`
- `view.updateDashboardPanel(panelSummary)` where panelSummary = result of `model.getDashboardPanelSummary()`
- `view.onTransactionAdded(savedTransaction)` where savedTransaction = result of `model.addTransaction()`
- `view.onGroupDeleted(groupId)`

**Assumptions / invariants:**
- Model and View instances are valid and initialized
- View has called `bindHandlers()` before user actions occur
- Model's `init()` completes before user can interact with UI
- All Model methods return Promises that resolve with data or reject with errors

---

### 7. Storage & State Interaction

**Storage modules used:**
- None (all storage operations delegated to Model)

**Object stores / collections / tables:**
- N/A (Controller has no knowledge of IndexedDB structure)

**Read operations:**
- Calls `model.getData()` to get current state snapshot
- Calls `model.getDashboardSummary()` for chart data
- Calls `model.getDashboardPanelSummary()` for stat cards

**Write/update/delete operations:**
- Calls `model.addTransaction()` on user submit
- Calls `model.addTransactionsBulk()` on CSV import
- Calls `model.deleteTransactions()` on user delete
- Calls `model.deleteGroup()` on group deletion

**Caching / in-memory state:**
- Stores references to Model and View
- No data caching (always fetches fresh from Model)

---

### 8. UI / Component Interaction

**DOM responsibilities:**
- None (all DOM operations delegated to View)

**Components it uses or controls:**
- Indirectly controls all components via View methods
- Never calls component methods directly

**Events / callbacks:**

**Receives from View (via handlers):**
- `onNavigate(route)` – User navigation
- `onAddTransaction(data)` – User submits form
- `onDeleteGroup(groupId, groupName)` – User confirms deletion

**Sends to View:**
- `view.update(data)` – Push fresh data to active component
- `view.updateDashboardCharts(chartData)` – Update dashboard visualizations
- `view.onTransactionAdded(tx)` – Notify transactions component
- `view.onGroupDeleted(groupId)` – Notify categories component

**Lifecycle notes:**
- `init()` called once on app startup
- Handler methods called in response to user actions
- `_syncModelToView()` called after every data-changing operation

---

### 9. Typical Flow Examples

**Scenario 1: User adds a transaction**

1. **User:** Fills form and clicks "Add Transaction"
2. **Transactions component:** Dispatches `add-transaction` event
3. **View:** Catches event, calls `handlers.onAddTransaction(data)`
4. **Controller:** `handleAddTransaction(data)` invoked
5. **Controller:** Calls `model.addTransaction(data)`
6. **Model:** Validates, persists to IndexedDB, updates aggregates, returns saved transaction
7. **Controller:** Calls `view.onTransactionAdded(savedTransaction)` for component feedback
8. **Controller:** Calls `_syncModelToView({isHeavyUpdate: false})` which:
   - Calls `model.getData()` to get fresh state
   - Calls `view.update(data)` to push to active component
   - Calls `_refreshDashboard(false)` to update charts with animation
9. **View:** Updates transactions component and dashboard

**Scenario 2: App initialization**

1. **App.js:** Creates Model, View, Controller instances
2. **App.js:** Calls `controller.init()`
3. **Controller:** Calls `model.init()` (async)
4. **Model:** Loads transactions/groups/categories from IndexedDB, seeds defaults if empty, builds aggregates
5. **Controller:** Checks `initialData.currentView`, defaults to 'dashboard' if missing
6. **Controller:** Calls `_syncModelToView()` which:
   - Calls `view.update(data)` to render dashboard
   - Calls `_refreshDashboard(false)` to populate charts
7. **View:** Dashboard component receives data and renders

---

### 10. Known Risks / Coupling / TODOs

**Tight couplings:**
- Assumes View has specific methods (`update`, `updateDashboardCharts`, `onTransactionAdded`, etc.)
- Assumes Model has specific methods (`init`, `getData`, `addTransaction`, `getDashboardSummary`, etc.)
- Hardcoded decision logic for heavy vs light updates (e.g., `isHeavyUpdate: ids.length > 5`)
- Refresh logic assumes dashboard needs update after every data change

**Potential refactors:**
- Use Command pattern for user actions instead of separate handler methods
- Add middleware layer for logging, analytics, error tracking
- Extract `_syncModelToView()` pattern into a Mediator or EventBus
- Make `isHeavyUpdate` threshold configurable instead of hardcoded

**Anything surprising / non-obvious:**
- `navigate()` now calls `_syncModelToView()` to ensure newly rendered pages get data (recent fix for transactions disappearing)
- `handleDeleteGroup()` calls both `view.onGroupDeleted()` AND `_syncModelToView()` – dual notification to ensure modal closes and data refreshes
- Heavy updates disable chart animations for better performance on bulk operations
- Controller logs extensively but has no UI-facing logging panel (only console)


--- 

# UTILS

## 5. categoryAggregator.js

### 1. Basic Info

**File path:** `src/utils/categoryAggregator.js`

**Role:** Aggregation

**Purpose:**
Pure functional utilities for computing category spending totals, group breakdowns, and transaction filtering. Enables both Model and Components to build aggregate views without duplicating calculation logic.

---

### 2. Public API

**Exports:**

- `calculateCategoryTotals(transactions)` – Takes transaction array, returns Map<categoryId, totalSpent>
- `attachCategoryAmounts(categories, totals)` – Merges spending totals into category objects as `amount` field
- `getCategoriesForGroup(group, categoriesWithAmounts)` – Filters categories belonging to a group (handles custom groups with categoryIds array)
- `filterTransactionsByCategory(transactions, categoryIdSet)` – Filters transactions matching a Set of category IDs
- `buildGroupBreakdown({groups, categories, transactions, groupId})` – Builds complete breakdown for single group (categories, transactions, totalSpent)
- `buildCategoryAggregates({groups, categories, transactions})` – Builds breakdowns for all groups in one pass
- `buildGroupBreakdownFromPrepared({group, categoriesWithAmounts, transactions})` – Internal helper assuming amounts already attached

---

### 3. Usage & Dependencies

**Who uses this utility:**
- `model/financeModel.js` – Calls `buildCategoryAggregates()` and `buildGroupBreakdown()` for category breakdown queries
- `components/categories.js` – Calls `buildCategoryAggregates()` and `buildGroupBreakdown()` to render group charts

**Dependencies inside this file:**
- None – Pure functions with zero dependencies
- Uses only native JavaScript (Array, Map, Set)

---

### 4. Behavior & Assumptions

**Core behavior:**
- All functions are pure (no mutations, no side effects)
- Uses `Map` for category totals (O(1) lookups)
- Uses `Set` for category ID filtering (O(1) membership checks)
- Handles both default groups (categories have `groupId`) and custom groups (group has `categoryIds` array)
- Returns empty arrays/zero totals for empty inputs (never throws)

**Assumptions / contracts:**
- Transactions have `category` and `amount` fields
- Categories have `id` and `groupId` fields
- Groups have `id`, `name`, optional `icon`, `isCustom`, `categoryIds`
- Transaction amounts can be negative (uses `Math.abs()` for totals)
- Missing/invalid category IDs are skipped (no errors thrown)

**Side effects:**
- None (all functions are pure, no I/O, no logging, no mutations)

---

### 5. Notes / Future Changes

**Known limitations / TODOs:**
- No date filtering – aggregates all transactions regardless of date range
- No support for income vs expense categorization (treats all as positive)
- Returns entire transaction arrays in breakdowns (could be memory-intensive for large datasets)
- No pagination or lazy loading for large group breakdowns
- Custom group logic duplicated across `getCategoriesForGroup()` and `buildGroupBreakdownFromPrepared()`
- Could add memoization for repeated calls with same inputs

---

## 6. debugService.js

### 1. Basic Info

**File path:** `src/utils/debugService.js`

**Role:** Logging

**Purpose:**
Centralized debug logging control for the entire MVC stack. Provides single toggle to enable/disable diagnostic logging across Model, View, Controller, and Components, avoiding scattered debug flags and console.log statements.

---

### 2. Public API

**Exports:**

- `setDebugEnabled(enabled)` – Turns logging on/off globally for entire app
- `isDebugEnabled()` – Returns current debug state (boolean)
- `debugLog(...args)` – Conditional logger, outputs only when debug enabled
- `debugLogWithPrefix(prefix, ...args)` – Adds context prefix to log messages
- `createPrefixedLogger(prefix)` – Returns logger function with baked-in prefix (recommended pattern)

---

### 3. Usage & Dependencies

**Who uses this utility:**
- `model/financeModel.js` – Uses `createPrefixedLogger('[Model]')`
- `view/financeView.js` – Uses `createPrefixedLogger('[View]')`
- `controller/financeContoller.js` – Uses `createPrefixedLogger('[Controller]')`
- All components (dashboard, transactions, categories) – Use prefixed loggers

**Dependencies inside this file:**
- None – Pure logging utility with zero dependencies
- Wraps native `console.log`

---

### 4. Behavior & Assumptions

**Core behavior:**
- Maintains global `_debugEnabled` flag (module-scoped private variable)
- All log functions check flag before calling `console.log`
- `createPrefixedLogger()` returns closure with captured prefix
- Default state is `true` (logging enabled)

**Assumptions / contracts:**
- Console API is available (browser or Node environment)
- Prefix strings are short and readable (e.g., '[Model]', '[View]')
- Log calls are cheap when disabled (just boolean check, no string formatting)

**Side effects:**
- Outputs to browser console when enabled
- No file logging, no log rotation, no remote logging
- `setDebugEnabled(true)` logs a confirmation message

---

### 5. Notes / Future Changes

**Known limitations / TODOs:**
- No log levels (debug, info, warn, error) – only on/off toggle
- No filtering by module/component (all-or-nothing logging)
- No log formatting or colorization (relies on browser console styling)
- Could add timestamp prefixes for performance profiling
- Could add remote logging endpoint for production error tracking
- Could integrate with browser DevTools Performance API

---

## 7. formatters.js

### 1. Basic Info

**File path:** `src/utils/formatters.js`

**Role:** Formatting

**Purpose:**
Transforms raw model data into human-readable display formats. Maintains MVC separation by keeping display logic out of Model layer, enabling Model to be used in non-UI contexts and simplifying localization/theming.

---

### 2. Public API

**Exports:**

- `getRelativeDate(date, referenceDate?)` – Converts date to "Today", "Yesterday", or "Mon DD" format
- `formatTransactionForDisplay(tx, referenceDate?)` – Enriches transaction with icon, relative date, and absolute amount for UI rendering

---

### 3. Usage & Dependencies

**Who uses this utility:**
- `model/financeModel.js` – Calls `formatTransactionForDisplay()` in `_getRecentTransactions()` for dashboard panel
- `components/dashboard.js` – Receives formatted transactions for recent activity list
- Potentially used by transaction components for display

**Dependencies inside this file:**
- `utils/icons.js` – Uses `getCategoryIcon()` to add emoji icons to transactions
- Native JavaScript `Date` API and `toLocaleDateString()`

---

### 4. Behavior & Assumptions

**Core behavior:**
- `getRelativeDate()` compares input date to reference date (defaults to today)
  - Same day → "Today"
  - Previous day → "Yesterday"
  - Same year → "Mon DD"
  - Different year → "Mon DD, YYYY"
- `formatTransactionForDisplay()` adds:
  - `icon` – Category emoji via `getCategoryIcon()`
  - `date` – Relative date string
  - `rawDate` – Original ISO date for sorting
  - `amount` – Absolute value (always positive)
  - `merchant` – Falls back to category or "Transaction" if missing

**Assumptions / contracts:**
- Input dates are valid ISO strings or Date objects
- Invalid dates return "Unknown" instead of throwing
- Transaction amounts are numbers (coerces with `Number()`)
- Transaction objects have `category`, `group`, `amount`, `date`, optional `merchant`
- Locale is hardcoded to 'en-US' (no i18n support yet)

**Side effects:**
- None (pure functions, no I/O or mutations)

---

### 5. Notes / Future Changes

**Known limitations / TODOs:**
- Locale hardcoded to 'en-US' – needs i18n for international users
- No currency formatting (delegates to component-level formatters)
- No timezone handling (assumes local timezone)
- Could add "This week", "Last week" relative ranges
- Could add configurable date format preferences
- `referenceDate` parameter exists for testing but not exposed to UI (always uses current date)

---

## 8. icons.js

### 1. Basic Info

**File path:** `src/utils/icons.js`

**Role:** Configuration

**Purpose:**
Single source of truth for all emoji icons used throughout the application. Maps category/group IDs to emoji characters and provides picker options for custom group creation, ensuring visual consistency across components.

---

### 2. Public API

**Exports:**

**Constants:**
- `CATEGORY_ICONS` – Object mapping category IDs to emojis (e.g., 'groceries' → '🛒')
- `GROUP_ICONS` – Object mapping group IDs to emojis (e.g., 'household' → '🏠')
- `CUSTOM_GROUP_ICONS` – Array of 30 emojis for custom group picker

**Functions:**
- `getCategoryIcon(id)` – Returns emoji for category ID, falls back to ❔
- `getGroupIcon(id, customIcon?)` – Returns emoji for group ID or custom override, falls back to ❔
- `getCategoryOrGroupIcon(id)` – Tries category lookup, then group lookup, then fallback
- `getFallbackIcon()` – Returns '❔' for unknown IDs

---

### 3. Usage & Dependencies

**Who uses this utility:**
- `utils/formatters.js` – Uses `getCategoryIcon()` when formatting transactions
- `components/categories.js` – Uses `CUSTOM_GROUP_ICONS` for icon picker modal
- `components/category-chart.js` – Uses `getGroupIcon()` for chart headers
- `components/dashboard.js` – Uses `getCategoryIcon()` for recent transaction icons
- Any component displaying transactions, groups, or categories

**Dependencies inside this file:**
- None – Pure configuration module with zero dependencies

---

### 4. Behavior & Assumptions

**Core behavior:**
- Lookups are case-insensitive (converts keys to lowercase)
- Missing keys return fallback icon '❔' (never throws)
- `getGroupIcon()` checks `customIcon` parameter first (allows user-selected emojis)
- `getCategoryOrGroupIcon()` tries both lookups (useful when ID type is ambiguous)

**Assumptions / contracts:**
- Category/group IDs are strings
- Icon values are single emoji characters (Unicode)
- `CUSTOM_GROUP_ICONS` contains 30 emojis for picker UI
- Fallback icon '❔' is visually distinct from category/group icons

**Side effects:**
- None (pure configuration, no I/O or state)

---

### 5. Notes / Future Changes

**Known limitations / TODOs:**
- Icon sets are hardcoded – no dynamic loading or user customization
- Limited to 30 custom group icons – could expand picker
- No icon search or filtering in picker modal
- Could support custom user-uploaded icons (image URLs)
- Could add icon categories/tags for better picker organization
- Fallback icon '❔' could be configurable per component
- No validation that custom icons are valid emoji (accepts any string)
- Could add dark mode icon variants for better contrast

---



# COMPONENTS

## 5.1 categories.js

### 1. Basic Info

**File path:** `src/components/categories.js`

**Component name / tag:** `FinSiteCategories` / `<finsite-categories>`

**Purpose:** Displays spending breakdown by custom and default groups on the Categories page. Renders multiple `<finsite-category-chart>` components (one per group) and provides modals for viewing group details and creating new custom groups. Allows users to delete custom groups with confirmation.

---

### 2. Inputs & Outputs

**Inputs (props/attributes/params):**

**Setter: `model` (FinSiteModel instance)**
- Injected by View after navigation to Categories page
- Used to load groups, categories, and transactions via `getGroups()`, `getCategories()`, `getTransactions()`
- Used to call `deleteGroup(groupId)` when user deletes custom group (deprecated flow)
- Used to get group breakdowns via `getCategoryBreakdownByGroup(groupId)` if available

**Method: `setData({ groups, categories, transactions })`**
- Alternative to model injection
- Directly sets taxonomy and transaction data for rendering

**Events emitted:**

**`request-delete-group`** → When user confirms group deletion in modal
- Payload: `{ groupId: string, groupName: string }`
- Bubbles: `true`, Composed: `true`
- Purpose: Controller intercepts and handles deletion via Model

**`group-deleted`** (legacy, deprecated) → After direct model deletion
- Payload: `{ groupId: string, groupName: string }`
- Purpose: Notify controller of deletion (old flow before event-based architecture)

**External dependencies:**

**Imports:**
- `../chart/category-chart.js` – `<finsite-category-chart>` component for group bar charts
- `./category-modal-chart.js` – `<finsite-category-modal-chart>` for modal chart
- `../utils/categoryAggregator.js` – `buildCategoryAggregates()`, `buildGroupBreakdown()` for data processing
- `../utils/icons.js` – `getCategoryIcon()`, `CUSTOM_GROUP_ICONS` for visual icons
- `../utils/debugService.js` – `createPrefixedLogger('[Categories]')` for logging

**Data dependencies:**
- Requires `model.getGroups()`, `model.getCategories()`, `model.getTransactions()` OR `setData()` calls
- Expects default groups to exist (falls back to `model.getDefaultConfig()` if empty)

---

### 3. Internal Behavior

**Main responsibilities:**

**Rendering:**
- Grid of group charts (one `<finsite-category-chart>` per group)
- "Add Custom Group" button at end of grid
- Modal overlay with group details (transactions, categories, totals) when group clicked
- Add Group modal with icon picker, category selector, and subcategory creator

**Handling user actions:**
- Click group chart → Opens group detail modal (`openModal(groupId)`)
- Click "Delete Group" in modal → Confirms and emits `request-delete-group` event
- Click "Add Custom Group" → Opens add group modal
- Submit add group form → Creates new custom group via model (code not shown in excerpt)
- Select/deselect categories for new group → Updates `selectedCategoryIds` Set
- Add subcategories for new group → Appends to `newSubcategories` array

**State handled inside this component:**

**Data state:**
- `groups: Array<Group>` – All groups (default + custom)
- `categories: Array<Category>` – All categories
- `transactions: Array<Transaction>` – All transactions
- `groupBreakdowns: Array<GroupBreakdown>` – Aggregated data per group
- `categoriesWithAmounts: Array<CategoryWithAmount>` – Categories enriched with spending totals

**UI state:**
- `isModalOpen: boolean` – Group detail modal visibility
- `selectedGroup: Object|null` – Currently viewed group in modal
- `selectedTransactions: Array` – Transactions for selected group
- `selectedCategories: Array` – Categories for selected group
- `isAddGroupModalOpen: boolean` – Add group modal visibility
- `newGroupName: string` – Input value for new group name
- `selectedIcon: string` – Chosen emoji for new group (default '📁')
- `selectedCategoryIds: Set<string>` – Category IDs selected for new custom group
- `newSubcategories: Array` – User-created subcategories for new group

**Private state:**
- `_model: FinSiteModel|null` – Injected model reference
- `_connected: boolean` – Tracks if component is mounted to DOM
- `_isLoading: boolean` – Loading state for async data fetches
- `_eventsBound: boolean` – Flag to prevent duplicate event listeners

**Lifecycle points:**

**`connectedCallback()`** → When component added to DOM
- Sets `_connected = true`
- Calls `render()` immediately with loading/placeholder state
- Calls `setupEventListeners()` to attach click handlers
- Calls `_hydrateFromModel()` asynchronously to load real data without blocking first paint

**`set model(model)`** → When View injects model reference
- Stores model in `_model`
- Calls `loadFromModel()` if component already connected

**`loadFromModel()`** → Async data load from model
- Sets `_isLoading = true`
- Fetches groups, categories, transactions from `_model`
- Falls back to default config if data is empty
- Calls `_refreshAggregates()` to compute breakdowns
- Calls `render()` and `setupEventListeners()`
- Calls `updateChartComponents()` on next frame to push data to child charts

**`_refreshAggregates()`** → Recompute breakdowns
- Calls `buildCategoryAggregates()` from categoryAggregator utility
- Updates `groupBreakdowns` and `categoriesWithAmounts`

---

### 4. Relationships to Other Files

**Who uses this component:**

**View (financeView.js):**
- Renders `<finsite-categories>` when navigating to Categories page
- Injects model reference via `_wireModelToCategories()`
- Calls `setData()` to push updated taxonomy/transactions
- Calls `onGroupDeleted(groupId)` after controller deletes group

**How it fits in the flow:**

**Typical user interaction (delete custom group):**
1. User clicks custom group chart in Categories page
2. Component opens modal with group details (`openModal()`)
3. User clicks "Delete Group" button in modal
4. Component shows confirmation dialog (`handleDeleteGroup()`)
5. Component emits `request-delete-group` event with `{groupId, groupName}`
6. View forwards event to Controller via `handlers.onDeleteGroup()`
7. Controller calls `model.deleteGroup(groupId)`
8. Model deletes group, reassigns categories to "Uncategorized", rebuilds aggregates
9. Controller calls `view.onGroupDeleted(groupId)`
10. View calls `categories.onGroupDeleted(groupId)` to close modal and refresh
11. Component reloads from model, re-renders without deleted group

**What it depends on for data:**

**FinSiteModel (financeModel.js):**
- `getGroups()` – All group definitions
- `getCategories()` – All category definitions
- `getTransactions()` – All transaction records
- `getDefaultConfig()` – Default groups/categories if data is empty
- `getCategoryBreakdownByGroup(groupId)` – Aggregated group data (optional, falls back to local aggregation)
- `deleteGroup(groupId)` – Deletes custom group (deprecated direct call)

**categoryAggregator.js:**
- `buildCategoryAggregates({ groups, categories, transactions })` – Computes group breakdowns
- `buildGroupBreakdown({ groups, categories, transactions, groupId })` – Single group breakdown

**icons.js:**
- `getCategoryIcon(categoryId)` – Returns emoji for category
- `CUSTOM_GROUP_ICONS` – Icon list for custom group creation

---

### 5. Notes / Gotchas

**Important assumptions:**
- Assumes `model` reference is set before user interactions (View must call `_wireModelToCategories()`)
- Assumes default groups (household, investments, expenses) exist after `loadFromModel()`
- Falls back to `getDefaultConfig()` if groups/categories arrays are empty
- Custom groups have `isCustom: true` flag to show delete button
- Deleted groups are reassigned to "Uncategorized" by Model, not this component

**Quirks:**
- Renders immediately with empty/loading state, then hydrates asynchronously (`_hydrateFromModel()`)
- `updateChartComponents()` must be called on next animation frame to ensure child `<finsite-category-chart>` elements exist in shadow DOM
- Legacy method `handleDeleteGroupDirect()` directly calls `model.deleteGroup()` (deprecated; modern flow uses events)
- `_eventsBound` flag prevents duplicate listeners but isn't used consistently
- Modal state is internal – closing modal doesn't notify parent components
- Add Group modal allows both selecting existing categories AND creating new subcategories in single form
- Selected category IDs stored in Set (O(1) lookups), subcategories in Array

**Breaking changes to watch for:**
- Changing model API shape (`getGroups()` → `getAllGroups()`) would break this component
- Removing `isCustom` flag from groups would hide delete button for all groups
- Changing event name `request-delete-group` would break controller integration

---

## 5.2 category-modal-chart.js

### 1. Basic Info

**File path:** `src/components/category-modal-chart.js`

**Component name / tag:** `FinSiteCategoryModalChart` / `<finsite-category-modal-chart>`

**Purpose:** Renders a horizontal bar chart showing spending breakdown by category within a single group. Used in the Categories page group detail modal to visualize category spending. Wraps Chart.js chart with dark-themed styling.

---

### 2. Inputs & Outputs

**Inputs (props/attributes/params):**

**Attribute: `title` (string)**
- Chart title displayed above bars
- Default: `"Spending by Category"`
- Read once in constructor via `getAttribute('title')`

**Method: `setCategories(categories: Array<{name: string, amount: number}>)`**
- Updates chart data with category breakdown
- Expects array of objects with `name` (string) and `amount` (number) properties
- Triggers chart re-render via `_renderChart()`

**Events emitted:**
- None (pure display component)

**External dependencies:**

**Imports:**
- `../chart/chart-core.js` – `initChartCore()`, `createBarChartConfig()` for Chart.js setup

**Libraries:**
- Chart.js (loaded via `initChartCore()`) – Rendering engine

---

### 3. Internal Behavior

**Main responsibilities:**

**Rendering:**
- Horizontal bar chart with category names on X-axis, amounts on Y-axis
- Dark theme with gradient bars and subtle grid
- Empty state message if no categories provided
- Canvas element with fixed height (200px)

**Handling user actions:**
- None (read-only chart, no click handlers)

**State handled inside this component:**
- `categories: Array<{name, amount}>` – Chart data
- `title: string` – Chart title
- `_chart: Chart|null` – Chart.js instance reference

**Lifecycle points:**

**`connectedCallback()`** → When component added to DOM
- Calls `render()` to create canvas
- Calls `_renderChart()` to initialize Chart.js instance

**`disconnectedCallback()`** → When component removed from DOM
- Calls `_destroyChart()` to clean up Chart.js instance and prevent memory leaks

**`setCategories()`** → When parent updates data
- Stores new categories array
- Calls `_renderChart()` to redraw chart

**`_renderChart()`** → Chart rendering logic
- Destroys existing chart if present
- Shows empty state if `categories` is empty
- Maps category names to labels, amounts to values
- Initializes Chart.js with bar chart config
- Uses custom options: horizontal bars, gradient background, dark grid, truncated labels

**`_destroyChart()`** → Cleanup
- Calls `chart.destroy()` to release Chart.js resources
- Sets `_chart = null`

---

### 4. Relationships to Other Files

**Who uses this component:**

**Categories component (categories.js):**
- Renders `<finsite-category-modal-chart>` inside group detail modal
- Calls `setCategories(breakdown.categories)` to populate chart with group's category data

**What it depends on for data:**

**chart-core.js:**
- `initChartCore()` – Loads Chart.js library asynchronously
- `createBarChartConfig(labels, values, options)` – Generates Chart.js config object

**How it fits in the flow:**

**Typical user interaction:**
1. User clicks group chart in Categories page
2. Categories component opens modal with group details
3. Modal renders `<finsite-category-modal-chart>` in shadow DOM
4. Categories component calls `modalChart.setCategories(breakdown.categories)`
5. Component renders bar chart showing category spending for that group
6. User views chart (no interactions)
7. User closes modal
8. Component lifecycle: `disconnectedCallback()` destroys chart instance

---

### 5. Notes / Gotchas

**Important assumptions:**
- Assumes `categories` array has `name` (string) and `amount` (number) properties
- Assumes amounts are positive numbers (uses `Math.abs()` to ensure)
- Assumes Chart.js is available via `initChartCore()` (async load)
- Canvas must exist in DOM before chart initialization (uses `querySelector('#modalChartCanvas')`)

**Quirks:**
- Chart is destroyed and recreated on every `setCategories()` call instead of updating data in-place (less efficient but simpler)
- Empty state replaces canvas with `<div>` – subsequent `setCategories()` must recreate canvas element
- Labels are truncated to 14 characters to prevent overlap (`substring(0, 14)`)
- Max rotation for X-axis labels is 45° (angled labels for long category names)
- Bar thickness capped at 44px (`maxBarThickness: 44`)
- Uses `indexAxis: 'x'` for vertical bars (not horizontal despite variable naming suggesting otherwise)
- Styling is hardcoded in shadow DOM styles (no CSS variable support for theming)

**Performance notes:**
- Chart re-initialization on every data change is O(n) where n = number of categories
- For high-frequency updates (e.g., live data), consider using Chart.js `update()` method instead of destroy/recreate
- Shadow DOM prevents global CSS from affecting chart styling (isolated)

---

## 5.3 dashboard.js

### 1. Basic Info

**File path:** `src/components/dashboard.js`

**Component name / tag:** `FinSiteDashboard` / `<finsite-dashboard>`

**Purpose:** Displays the main dashboard overview with stat cards (total spent, weekly transactions, monthly spending), delegated charts (line chart for 6-month trend, bar chart for top 5 groups), and recent activity list. Orchestrates data flow to child `<finsite-spending-chart>` component.

---

### 2. Inputs & Outputs

**Inputs (props/attributes/params):**

**Method: `updateFromSummary(summary: Object)`**
- Updates stat cards and recent activity list
- Payload shape:
  ```javascript
  {
    totalSpentAllTime: number,
    transactionsThisWeek: number,
    monthlySpendingCurrent: number,
    monthlySpendingLast: number,
    monthlyChangePercent: number,
    monthlyDirection: 'up'|'down'|'neutral',
    recentTransactions: Array<Transaction>
  }
  ```

**Method: `updateChartData(chartData: Object, isHeavyUpdate: boolean = false)`**
- Passes pre-aggregated chart data to child `<finsite-spending-chart>` component
- Payload shape:
  ```javascript
  {
    timeSeries: { labels: string[], values: number[] },
    groupBreakdown: { labels: string[], values: number[] },
    metrics: { thisMonth, lastMonth, percentChange, sixMonthAvg }
  }
  ```
- `isHeavyUpdate = true` for bulk operations (CSV import) to optimize rendering

**Events emitted:**
- None (pure display component, delegates to child chart)

**External dependencies:**

**Imports:**
- `../chart/spending-chart.js` – `<finsite-spending-chart>` component for charts
- `../utils/icons.js` – `getCategoryIcon(categoryId)` for recent activity icons
- `../utils/formatters.js` – `getRelativeDate(date)` for "Today"/"Yesterday" formatting
- `../utils/debugService.js` – `createPrefixedLogger('[Dashboard]')` for logging

---

### 3. Internal Behavior

**Main responsibilities:**

**Rendering:**
- Dashboard header with title and subtitle
- Three stat cards (total spent, weekly count, monthly spending with % change)
- Charts section containing `<finsite-spending-chart>` component
- Recent activity list with transaction icons, merchants, dates, amounts

**Handling user actions:**
- None (read-only display, no user interactions handled directly)

**State handled inside this component:**

**Data state:**
- `panelData: Object` – Stat card values and recent transactions
  - `totalSpentAllTime: number` (default: 0)
  - `transactionsThisWeek: number` (default: 0)
  - `monthlySpendingCurrent: number` (default: 0)
  - `monthlySpendingLast: number` (default: 0)
  - `monthlyChangePercent: number` (default: 0)
  - `monthlyDirection: string` (default: 'neutral')
  - `recentTransactions: Array` (default: [])
- `chartData: Object|null` – Pre-aggregated chart data from Model

**UI state:**
- `_chartComponent: HTMLElement|null` – Reference to `<finsite-spending-chart>` child component

**Lifecycle points:**

**`connectedCallback()`** → When component added to DOM
- Calls `render()` to create dashboard UI
- On next frame: Gets reference to `<finsite-spending-chart>` via `querySelector('finsite-spending-chart')`

**`updateFromSummary()`** → When controller provides new panel data
- Merges new summary into `panelData`
- Calls `render()` to update stat cards and recent activity
- Re-acquires chart component reference
- Re-applies `chartData` to chart if available (ensures chart persists after re-render)

**`updateChartData()`** → When controller provides new chart data
- Stores `chartData` reference
- Gets chart component reference if not already cached
- Calls `chartComponent.updateChartData(chartData, isHeavyUpdate)` to update charts

---

### 4. Relationships to Other Files

**Who uses this component:**

**View (financeView.js):**
- Renders `<finsite-dashboard>` when navigating to Dashboard page
- Calls `dashboard.updateFromSummary(panelSummary)` with model data
- Calls `dashboard.updateChartData(chartData)` with pre-aggregated chart data

**Controller (financeContoller.js):**
- Indirectly via View
- Fetches `model.getDashboardPanelSummary()` and `model.getDashboardSummary()`
- Passes data to View, which forwards to Dashboard component

**What it depends on for data:**

**FinSiteModel (via View/Controller):**
- `getDashboardPanelSummary()` – Stats and recent transactions
- `getDashboardSummary()` – Chart data (time series, group breakdown, metrics)

**<finsite-spending-chart> (child component):**
- Receives `chartData` via `updateChartData()` method
- Handles chart rendering internally

**How it fits in the flow:**

**Typical flow (dashboard refresh after transaction add):**
1. User adds transaction via Transactions page
2. Controller calls `model.addTransaction()`
3. Model updates aggregates and transactions array
4. Controller calls `view.update(model.getData())`
5. Controller calls `view.updateDashboardPanel(model.getDashboardPanelSummary())`
6. Controller calls `view.updateDashboardCharts(model.getDashboardSummary())`
7. View calls `dashboard.updateFromSummary(panelSummary)` → stat cards refresh
8. View calls `dashboard.updateChartData(chartData)` → charts refresh
9. Dashboard passes `chartData` to `<finsite-spending-chart>`
10. User sees updated stats, charts, and recent activity

---

### 5. Notes / Gotchas

**Important assumptions:**
- Assumes `<finsite-spending-chart>` component is registered before Dashboard renders
- Assumes `panelData.recentTransactions` is already sorted (newest first) and limited to 5-10 items
- Assumes amounts in transactions are positive numbers (uses absolute value formatting)
- Stat cards assume `monthlyDirection` is one of: 'up', 'down', 'neutral'
- Recent activity assumes all transactions have `amount`, `date`, and either `merchant` or `category`

**Quirks:**
- Chart component reference (`_chartComponent`) is re-acquired after every `render()` call instead of being preserved
- `updateFromSummary()` re-renders entire component (not just stat cards) – inefficient for high-frequency updates
- `updateChartData()` is separate from `updateFromSummary()` – controller must call both to fully update dashboard
- Empty state for recent activity shows 📭 emoji with "No recent transactions" message
- Monthly spending change uses colored text: green for decrease (positive), red for increase (negative) – counterintuitive for spending (less = better)
- Chart is delegated to child component, but metrics (thisMonth, lastMonth, etc.) are included in `chartData` for potential display by chart component
- Legacy `updateData()` method exists but is deprecated in favor of `updateFromSummary()`

---

## 5.4 header.js

### 1. Basic Info

**File path:** `src/components/header.js`

**Component name / tag:** `FinSiteHeader` / `<finsite-header>`

**Purpose:** Top navigation bar with menu toggle, notification icon, and theme toggle. Currently not actively used in the Mint-style sidebar layout. Kept for potential future use or alternative layouts.

---

### 2. Inputs & Outputs

**Inputs (props/attributes/params):**
- None (self-contained UI component with no external data dependencies)

**Events emitted:**

**`theme-change`** → When user toggles theme via toggle switch (not implemented in shown code, but documented in JSDoc)
- Payload: `{ theme: 'light'|'dark' }`
- Bubbles: `true`, Composed: `true`
- Purpose: Notify parent to apply theme changes globally

**External dependencies:**
- None (pure UI component with hardcoded icons and styling)

---

### 3. Internal Behavior

**Main responsibilities:**

**Rendering:**
- Fixed-position header bar at top of viewport (z-index 1001)
- Left section: Menu toggle button
- Right section: Notification icon, theme toggle switch with sun/moon icons
- Dark theme styling with CSS custom properties

**Handling user actions:**
- Click menu toggle → (handler not shown, intended to toggle sidebar)
- Click theme toggle → Switches between light/dark mode, saves to localStorage, emits `theme-change` event (code not fully shown in excerpt)

**State handled inside this component:**
- Theme state (light/dark) stored in `localStorage` as `'finsite-theme'`
- Toggle switch visual state (`.dark` class)
- Icon opacity states (`.inactive` class on sun/moon icons)

**Lifecycle points:**

**`connectedCallback()`** → When component added to DOM
- Calls `render()` to create header HTML
- Calls `setupEventListeners()` to attach click handlers

---

### 4. Relationships to Other Files

**Who uses this component:**
- **None currently** – Component is imported but not used in active Mint-style layout
- Intended for top navigation bar layout (alternative to sidebar)

**What it depends on for data:**
- None (no data dependencies)

**How it fits in the flow:**
- Not integrated in current flow
- If activated: Would sit above sidebar and main content, provide global theme toggle and menu collapse

---

### 5. Notes / Gotchas

**Important assumptions:**
- Assumes `finsite-theme` localStorage key is free (no conflicts with other apps)
- Assumes `data-theme` attribute on `document.documentElement` controls global theme
- Fixed height of 60px – main content must account for this offset if header is activated

**Quirks:**
- **Not currently used in production layout** – Mint-style sidebar handles navigation instead
- Theme toggle duplicates functionality from sidebar's theme toggle
- Menu toggle has no attached handler in shown code (incomplete implementation)
- Header is position: fixed, which would overlap content if not accounted for in layout
- z-index 1001 places it above sidebar (z-index 1000)
- Notification icon is decorative only (no badge count, no click handler)

---

## 5.5 sidebar.js

### 1. Basic Info

**File path:** `src/components/sidebar.js`

**Component name / tag:** `SidebarComponent` / `<finsite-sidebar>`

**Purpose:** Persistent vertical navigation sidebar with collapsible icon-only mode. Provides primary navigation (Dashboard, Transactions, Categories), theme toggle, and visual branding. Emits navigation and toggle events for parent coordination.

---

### 2. Inputs & Outputs

**Inputs (props/attributes/params):**

**Method: `setActivePage(page: string)`**
- Programmatically sets active navigation item
- Values: `'dashboard'`, `'transactions'`, `'categories'`
- Updates `.active` class on corresponding nav item

**Events emitted:**

**`navigate`** → When user clicks navigation item
- Payload: `{ page: string }` (e.g., `'dashboard'`, `'transactions'`, `'categories'`)
- Bubbles: `true`, Composed: `true`
- Purpose: Controller intercepts and calls `view.navigateToPage(page)`

**`sidebar-toggle`** → When user clicks collapse button
- Payload: `{ collapsed: boolean }`
- Bubbles: `true`, Composed: `true`
- Purpose: Main content area can adjust width/padding based on sidebar state

**`theme-change`** → When user toggles light/dark theme
- Payload: `{ theme: 'light'|'dark' }`
- Bubbles: `true`, Composed: `true`
- Purpose: Global theme switching via `document.documentElement.setAttribute('data-theme', theme)`

**External dependencies:**

**Imports:**
- `../utils/debugService.js` – `createPrefixedLogger('[Sidebar]')` for logging

**Storage:**
- `localStorage.getItem/setItem('finsite-theme')` – Persists theme preference across sessions

---

### 3. Internal Behavior

**Main responsibilities:**

**Rendering:**
- Sidebar header with logo (💰 FinSite) and theme toggle switch
- Navigation section with three items: Dashboard (📊), Transactions (💳), Categories (🏷️)
- Collapse button at bottom with toggle icon (◀ expands/collapses)
- Tooltips in collapsed mode (show on hover via `::after` pseudo-element)

**Handling user actions:**
- Click nav item → Emits `navigate` event with page name, updates active state
- Click collapse button → Toggles `.collapsed` class, emits `sidebar-toggle` event
- Click theme toggle → Switches light/dark mode, saves to localStorage, updates `data-theme` attribute, emits `theme-change`

**State handled inside this component:**
- `currentPage: string` – Active navigation page (default: `'dashboard'`)
- `isCollapsed: boolean` – Sidebar collapsed state (default: `false`)
- Theme state: Stored in `localStorage`, read on mount, toggled via switch

**Lifecycle points:**

**`connectedCallback()`** → When component added to DOM
- Calls `render()` to create sidebar HTML
- Calls `setupEventListeners()` to attach nav, collapse, and theme handlers
- Reads saved theme from `localStorage` and applies via `setTheme()`

---

### 4. Relationships to Other Files

**Who uses this component:**

**View (financeView.js):**
- Renders `<finsite-sidebar>` in app shell layout
- Listens for `navigate` event and forwards to controller
- Listens for `sidebar-toggle` event (currently unused, but could adjust content area width)

**How it fits in the flow:**

**Typical navigation flow:**
1. User clicks "Transactions" nav item in sidebar
2. Sidebar component emits `navigate` event with `{page: 'transactions'}`
3. View's `setupComponentEvents()` catches bubbled event
4. View calls `handlers.onNavigate('transactions')` (bound to controller)
5. Controller calls `view.navigateToPage('transactions')`
6. View swaps content area to `<finsite-transactions>` component
7. Sidebar remains visible with "Transactions" item highlighted

---

### 5. Notes / Gotchas

**Important assumptions:**
- Assumes three hardcoded pages: `dashboard`, `transactions`, `categories` (not configurable)
- Assumes `data-theme` attribute on `<html>` controls global CSS theming
- Assumes `localStorage` is available (no fallback for browsers with storage disabled)
- Fixed width: 240px expanded, 68px collapsed
- Fixed position (left: 0, top: 0, full viewport height)

**Quirks:**
- Collapsed state uses CSS-only tooltips (`:host(.collapsed) .nav-item::after`) instead of `<title>` or ARIA
- Theme toggle duplicates functionality of header's theme toggle (header not currently used)
- Logo icon (💰) is hardcoded, not configurable
- Nav items use `data-page` attribute for page names, `data-tooltip` for collapsed tooltips
- Collapse icon (◀) rotates 180° via CSS transform when collapsed (becomes ▶)
- `setActivePage()` method allows external control but `navigate()` method also updates active state (potential conflict if both used)
- Responsive design: Mobile viewport (<768px) collapses by default, expands with `.expanded-mobile` class (not currently implemented in JS)
- Theme is stored as `'finsite-theme'` in localStorage (app-specific key)

---

## 5.6 transaction-item.js

### 1. Basic Info

**File path:** `src/components/transaction-item.js`

**Component name / tag:** `FinSiteTransactionItem` / `<finsite-transaction-item>`

**Purpose:** Displays a single transaction row with icon, description, date, and amount. Lightweight reusable component for transaction lists. Can be used standalone or as part of transaction list (though currently not used in production – Transactions component renders rows directly via HTML strings).

---

### 2. Inputs & Outputs

**Inputs (props/attributes/params):**

**Attribute: `transaction-data` (JSON string)**
- Observed attribute that triggers re-render on change
- Must be valid JSON string representing transaction object
- Parsed via `JSON.parse(newValue)` in `attributeChangedCallback()`

**Method: `setTransactionData(data: Object)`**
- Programmatic setter for transaction data
- Payload shape:
  ```javascript
  {
    amount: number,
    description: string,
    date: string,
    status?: string (e.g., 'Pending')
  }
  ```
- Triggers re-render via `render()`

**Events emitted:**
- None (pure display component, no user interactions)

**External dependencies:**
- None (self-contained with inline styles and logic)

---

### 3. Internal Behavior

**Main responsibilities:**

**Rendering:**
- Transaction row with icon, details, and amount
- Icon color based on transaction type: expense (red), income (green), pending (gray)
- Description and date displayed in details section
- Amount formatted as currency with +/- prefix

**Handling user actions:**
- None (read-only display)

**State handled inside this component:**
- `transactionData: Object|null` – Transaction data to display

**Lifecycle points:**

**`connectedCallback()`** → When component added to DOM
- Calls `render()` to create initial UI

**`attributeChangedCallback(name, oldValue, newValue)`** → When `transaction-data` attribute changes
- Parses JSON string to object
- Stores in `transactionData`
- Calls `render()` to update UI

**`setTransactionData(data)`** → When data set programmatically
- Stores data in `transactionData`
- Calls `render()` to update UI

**`render()`** → UI rendering
- Returns early if no transaction data
- Determines icon class based on `status` ('Pending') or amount sign (positive/negative)
- Creates transaction row HTML with icon, description, date, amount

---

### 4. Relationships to Other Files

**Who uses this component:**
- **None currently** – Component is defined but not actively used
- Transactions component (transactions.js) renders transaction rows directly via HTML strings instead of using this component

**What it depends on for data:**
- None (receives data via attribute or method call)

**How it fits in the flow:**
- **Not integrated in current flow**
- If activated: Would be instantiated per transaction in a list, e.g., `<finsite-transaction-item transaction-data='${JSON.stringify(tx)}'>`

---

### 5. Notes / Gotchas

**Important assumptions:**
- Assumes `amount` is a number (uses `> 0` check for positive/negative)
- Assumes `status` field indicates pending state (exact string match: `'Pending'`)
- Assumes `description` and `date` fields exist (no validation)
- Returns early from `render()` if `transactionData` is null/undefined (no error thrown)

**Quirks:**
- **Not used in production** – Transactions component renders rows directly for performance (string concatenation faster than creating N web components)
- Icon class logic: `status === 'Pending'` → gray, `amount > 0` → green (income), else → red (expense)
- Hardcoded icon symbols: Expense (−), Income (+), Pending (⏳) – not configurable
- Styling is inline in shadow DOM (no CSS variable support for theming)
- No hover effects or click handlers (purely visual)
- Observed attribute `transaction-data` requires JSON string (not object) – inconvenient for programmatic use

---

## 5.7 transactions.js

### 1. Basic Info

**File path:** `src/components/transactions.js`

**Component name / tag:** `FinSiteTransactions` / `<finsite-transactions>`

**Purpose:** Full-featured transaction management page with date-grouped list, advanced filtering (search, date range, groups, categories), multi-sort, bulk selection, and manual transaction entry modal. Provides complete CRUD UI for transactions with rich UX (sticky headers, filter badges, empty states).

---

### 2. Inputs & Outputs

**Inputs (props/attributes/params):**

**Setter: `model` (FinSiteModel instance)**
- Injected by View after navigation to Transactions page
- Used to sync taxonomy (groups/categories) via `getGroups()`, `getCategories()`

**Method: `setTransactions(transactionsArray: Array<Transaction>)`**
- Sets transaction data for display
- Triggers re-render if component is connected

**Method: `setTaxonomy({ groups, categories })`**
- Sets available groups and categories for filters and form dropdowns
- Alternative to model injection for taxonomy

**Events emitted:**

**`add-transaction`** → When user submits manual entry form
- Payload:
  ```javascript
  {
    group: string,
    category: string,
    amount: number,
    date: string (YYYY-MM-DD),
    merchant: string,
    notes: string
  }
  ```
- Bubbles: `true`, Composed: `true`
- Purpose: Controller intercepts and calls `model.addTransaction()`

**`open-manual-entry`** → When manual entry modal is opened
- Payload: `{ source: string }` (e.g., `'header-button'`, `'empty-state'`)
- Bubbles: `true`, Composed: `true`
- Purpose: Logging/analytics (not handled by controller)

**External dependencies:**

**Imports:**
- `../utils/icons.js` – `getCategoryIcon()`, `getGroupIcon()` for visual icons
- `../utils/debugService.js` – `createPrefixedLogger('[Transactions]')` for logging

---

### 3. Internal Behavior

**Main responsibilities:**

**Rendering:**
- Page header with search, date, filter, and add transaction buttons
- Filter bar with result count badge, edit multiple mode toggle, sort dropdown
- Date-grouped transaction list with sticky date headers
- Search bar overlay (toggleable)
- Date range picker with presets (Today, This Week, This Month, This Year)
- Advanced filter panel with group/category checkboxes
- Manual entry modal with group dropdown, dynamic category dropdown, amount/date/merchant/notes inputs
- Empty states for no transactions or no filter results
- Notification banner for success/error messages

**Handling user actions:**
- **Search:** Type query → `_updateTransactionList()` on input (preserves focus)
- **Date filter:** Select date range or preset → Applies filter and re-renders
- **Advanced filters:** Select groups/categories → Applies filter and re-renders
- **Sort:** Change dropdown → Updates `sortOrder` state and re-renders
- **Edit multiple mode:** Toggle → Shows checkboxes, enables bulk selection
- **Transaction row click:** Opens transaction detail modal (code not shown)
- **Add transaction:** Open modal → Fill form → Submit → Emits `add-transaction` event
- **Group selection in modal:** Changes category dropdown to only show categories for selected group
- **Clear filters:** Clears all filter state and re-renders

**State handled inside this component:**

**Data state:**
- `transactions: Array<Transaction>` – All transactions (unfiltered)
- `availableGroups: Array<Group>` – For filter panel and form dropdown
- `availableCategories: Array<Category>` – For filter panel and form dropdown

**Filter state:**
- `filters: Object`
  - `search: string` – Search query
  - `dateRange: {start: Date, end: Date}|null` – Date range filter
  - `groups: Array<string>` – Selected group IDs
  - `categories: Array<string>` – Selected category IDs
- `sortOrder: string` – `'newest'`, `'oldest'`, `'amount-high'`, `'amount-low'`

**UI state:**
- `isSearchActive: boolean` – Search bar visibility
- `isDatePickerOpen: boolean` – Date picker panel visibility
- `isFilterPanelOpen: boolean` – Advanced filter panel visibility
- `isModalOpen: boolean` – Manual entry modal visibility
- `isEditMultipleMode: boolean` – Bulk selection mode
- `selectedTransactions: Set<number>` – Selected transaction IDs for bulk operations

**Modal form state:**
- `currentGroupId: string|null` – Selected group in form (filters categories)

**Lifecycle points:**

**`connectedCallback()`** → When component added to DOM
- Ensures `transactions` is array (fallback to `[]`)
- Calls `_syncTaxonomyFromModel()` to load groups/categories from model
- Calls `render()` and `setupEventListeners()`

**`getCategoriesForCurrentGroup()`** → Dynamic category filtering
- Returns categories for `currentGroupId` in modal form
- Handles both default groups (categories have `groupId`) and custom groups (group has `categoryIds` array)
- Returns empty array if no group selected

**`getFilteredTransactions()`** → Filtering logic
- Applies search filter (case-insensitive substring match)
- Applies date range filter
- Applies group/category filters
- Applies sort order
- Returns filtered array

**`_updateTransactionList()`** → Partial re-render
- Updates only transaction list container and filter badge
- Preserves search input focus
- Used for search optimization

---

### 4. Relationships to Other Files

**Who uses this component:**

**View (financeView.js):**
- Renders `<finsite-transactions>` when navigating to Transactions page
- Injects model reference via `_wireModelToTransactions()`
- Calls `setTransactions()` and `setTaxonomy()` to populate data

**Controller (financeContoller.js):**
- Listens for `add-transaction` event and calls `model.addTransaction()`
- Calls `view.onTransactionAdded()` to notify component of success

**How it fits in the flow:**

**Typical flow (add transaction):**
1. User clicks "Add Transaction" button
2. Component opens modal
3. User fills form and submits
4. Component emits `add-transaction` event
5. Controller calls `model.addTransaction()`
6. Model saves to IndexedDB, updates aggregates
7. Controller notifies View
8. Component refreshes list with new transaction

---

### 5. Notes / Gotchas

**Important assumptions:**
- Assumes `model` reference is set before user interactions
- Assumes transactions have `id`, `amount`, `date`, `group`, `category`
- Search is case-insensitive substring match
- Sort order persists until manually changed

**Quirks:**
- `_updateTransactionList()` is partial re-render optimization for search
- Transaction rows rendered as HTML strings (not web components)
- `currentGroupId` filters categories but resets on modal close
- Empty state offers "Add Transaction" button
- Filter badge shows "X of Y" when filters active
- Edit multiple mode shows checkboxes but bulk operations not fully implemented
- Date picker presets hardcoded
- No virtualization for long lists

---


# CHARTS

## 6.1 chart-core.js

### 1. File Overview

**File path:** `src/chart/chart-core.js`

**File name:** chart-core.js

**Layer / role in architecture:** Utility / Chart Library Abstraction

**Short summary:**
Centralized Chart.js initialization and configuration module. Lazy-loads Chart.js on first use (avoiding initial bundle bloat), applies global defaults, provides factory functions for creating line and bar charts, and ensures all charts use consistent styling and behavior.

---

### 2. Responsibilities & Boundaries

**Core responsibilities:**
- Lazy-load Chart.js via dynamic script injection when first chart is rendered
- Register Chart.js components (scales, tooltips, etc.) with minimal surface area
- Apply global Chart.js defaults (fonts, colors, animations, tooltips)
- Provide factory functions (`createLineChartConfig`, `createBarChartConfig`) for consistent chart creation
- Export `formatCurrency()` helper for axis labels and tooltips
- Expose `CHART_COLORS` palette for multi-category visualizations
- Cache Chart.js instance to prevent duplicate loads

**What this file explicitly does NOT do:**
- Does not render charts directly (delegates to Web Components)
- Does not manage chart data or state (receives pre-aggregated data)
- Does not load date adapters (uses categorical X-axis for month labels)
- Does not touch DOM outside of script injection
- Does not compute aggregates or filter transactions

---

### 3. Public API of This File

**Main exports / public surface:**

**Functions:**
- `async initChartCore()` – Lazy-loads Chart.js, applies defaults, returns Chart constructor (cached)
- `getChart()` – Returns cached Chart.js instance or global Chart if available, null otherwise
- `isInitialized()` – Returns boolean indicating if Chart.js is loaded
- `createLineChartConfig({ labels, values, ctx, animate })` – Factory for line chart configs (6-month trend)
- `createBarChartConfig(labels, values, overrides)` – Factory for bar chart configs (group/category breakdown)
- `formatCurrency(value)` – Formats numbers as currency strings with locale-aware separators

**Constants:**
- `CHART_COLORS` – Array of 7 hex colors for bar chart categories

**Side effects:**
- Dynamically injects `<script>` tag for Chart.js UMD bundle into `<head>` on first `initChartCore()` call
- Sets global Chart.js defaults via `Chart.defaults` mutation
- Caches Chart.js instance in module-level `_chartInstance` variable

---

### 4. Dependencies: What This File Uses

**Internal imports:**
- `utils/debugService.js` – `createPrefixedLogger('[ChartCore]')` for initialization logging

**External libraries:**
- Chart.js (v3.x) – Loaded dynamically from `/ChartJS/chart.umd.min.js`
- Uses `import.meta.url` to resolve Chart.js bundle path relative to this file

**Direction of dependency:**
- **Lowest-level chart module** – All chart components depend on this
- No dependencies on Model, View, Controller, or Storage
- Pure utility module that could be extracted to separate package

---

### 5. Consumers: Who Uses This File

**Known files that import/use this:**
- `chart/spending-chart.js` – Imports `initChartCore()`, `createLineChartConfig()`, `createBarChartConfig()`, `formatCurrency()`
- `chart/category-chart.js` – Imports `initChartCore()`, `createBarChartConfig()`
- `components/category-modal-chart.js` – Imports `initChartCore()`, `createBarChartConfig()`

**How they use it:**
- Components call `await initChartCore()` in lifecycle hooks (e.g., `connectedCallback()`)
- Components call factory functions to generate Chart.js config objects
- Components use `formatCurrency()` for consistent number formatting

---

### 6. Data & Contracts

**Inputs:**

**`createLineChartConfig()` expects:**
```javascript
{
  labels: string[],           // Month names (e.g., ['Jun', 'Jul', 'Aug'])
  values: number[],           // Spending amounts for each month
  ctx: CanvasRenderingContext2D, // For gradient creation
  animate: boolean = true     // Enable/disable animations
}
```

**`createBarChartConfig()` expects:**
```javascript
labels: string[],             // Category/group names
values: number[],             // Spending amounts
overrides: {                  // Optional customizations
  animate: boolean,
  title: string,
  indexAxis: 'x'|'y',        // Vertical vs horizontal bars
  legend: object,
  datasetOptions: object,
  options: object             // Merged with base config
}
```

**Outputs:**

**`initChartCore()` returns:**
```javascript
Promise<typeof Chart>         // Chart.js constructor function
```

**`createLineChartConfig()` returns:**
```javascript
{
  type: 'line',
  data: { labels, datasets: [...] },
  options: { scales, plugins, animation, ... }
}
```

**`createBarChartConfig()` returns:**
```javascript
{
  type: 'bar',
  data: { labels, datasets: [...] },
  options: { indexAxis, scales, plugins, animation, ... }
}
```

**Assumptions / invariants:**
- Chart.js UMD bundle exists at `/ChartJS/chart.umd.min.js` relative to repo root
- `labels` and `values` arrays have matching lengths
- `values` are numbers (no validation performed)
- `ctx` (canvas context) is valid for gradient creation
- Chart.js global `Chart` is available after script load
- Only one Chart.js instance is needed per app (singleton pattern)

---

### 7. Storage & State Interaction

**Storage modules used:**
- None (pure chart configuration layer)

**Caching / in-memory state:**
- `_chartInstance: Chart|null` – Cached Chart.js constructor after first load
- `_isInitialized: boolean` – Flag tracking initialization status
- `_initPromise: Promise|null` – Prevents concurrent initialization attempts

---

### 8. UI / Component Interaction

**DOM responsibilities:**
- Injects `<script>` tag into `<head>` for Chart.js bundle loading
- Does NOT render charts (delegates to components)

**Components it uses or controls:**
- None (utility module used BY components)

**Events / callbacks:**
- No events emitted
- Script `onload`/`onerror` callbacks for dynamic loading

**Lifecycle notes:**
- Initialized lazily on first `initChartCore()` call (not on module import)
- Waits for Chart.js global to be available with polling (max 5 seconds)
- Remains in memory for app lifetime (no cleanup)

---

### 9. Typical Flow Examples

**Scenario 1: Dashboard renders for first time**

1. **Trigger:** User navigates to Dashboard page
2. **Dashboard component:** Calls `<finsite-spending-chart>` in `connectedCallback()`
3. **Spending chart:** Calls `await initChartCore()` in `_initChartsAsync()`
4. **chart-core:**
   - Checks `_chartInstance` cache (null on first run)
   - Checks global `Chart` (undefined)
   - Injects `<script src="/ChartJS/chart.umd.min.js">`
   - Waits for script load
   - Polls for global `Chart` availability (max 5 seconds)
   - Applies global defaults via `_applyDefaults(Chart)`
   - Caches `Chart` in `_chartInstance`
   - Returns `Chart` constructor
5. **Spending chart:** Calls `createLineChartConfig()` and `createBarChartConfig()`
6. **chart-core:** Returns config objects with pre-configured options
7. **Spending chart:** Instantiates `new Chart(ctx, config)` for each chart

**Scenario 2: User navigates to Categories page (Chart.js already loaded)**

1. **Trigger:** User clicks Categories nav item
2. **Categories component:** Renders `<finsite-category-chart>` for each group
3. **Category chart:** Calls `await initChartCore()` in `_initChart()`
4. **chart-core:**
   - Checks `_chartInstance` cache (found)
   - Returns cached `Chart` immediately (no script load)
5. **Category chart:** Calls `createBarChartConfig(labels, values)`
6. **chart-core:** Returns bar chart config
7. **Category chart:** Instantiates `new Chart(ctx, config)`

---

### 10. Known Risks / Coupling / TODOs

**Tight couplings:**
- Hardcoded path to Chart.js UMD bundle (`/ChartJS/chart.umd.min.js`)
- Assumes Chart.js is bundled in repo (not npm package)
- Factory functions return Chart.js v3.x config shape (breaks if upgrading to v4)
- Color palette (`CHART_COLORS`) is fixed (no theming support)

**Potential refactors:**
- Add CDN fallback if local Chart.js bundle fails to load
- Support npm-based Chart.js import instead of script injection
- Make `CHART_DEFAULTS` and `CHART_COLORS` configurable via init options
- Add TypeScript types for factory function parameters
- Extract gradient creation to separate utility (reused across charts)
- Support Chart.js plugins (e.g., datalabels, zoom)
- Add error handling for invalid canvas context
- Cache compiled configs to avoid recreating on every render

**Anything surprising / non-obvious:**
- Uses `import.meta.url` to resolve relative paths (requires ES modules)
- Polling with 100ms interval to detect global `Chart` (max 50 attempts = 5s)
- No date adapter loaded despite Chart.js supporting time scales (uses categorical X-axis instead)
- `createBarChartConfig()` has complex override merging logic for scales and plugins
- `formatCurrency()` uses different precision for values above/below $1000 (0 vs 2 decimals)
- Animations are disabled for "heavy updates" (bulk operations) to improve performance
- Gradient for line chart is created in factory (requires canvas context parameter)
- Global Chart.js defaults are mutated (affects all charts, even non-FinSite charts if app is embedded)
- Module state (`_chartInstance`) is singleton (only one Chart.js instance per app)

---

## 6.2 category-chart.js

### 1. File Overview

**File path:** `src/chart/category-chart.js`

**File name:** category-chart.js

**Layer / role in architecture:** Web Component / Chart Visualization

**Short summary:**
Reusable bar chart card component for the Categories page. Displays spending breakdown for a single group (Household, Wealth, Expenses, custom groups) as a vertical bar chart with subcategories as bars. Clickable to open modal with transaction details. Includes delete button for custom groups.

---

### 2. Responsibilities & Boundaries

**Core responsibilities:**
- Render group summary card with icon, name, total spent, transaction/category counts
- Initialize Chart.js bar chart showing category spending for one group
- Handle click events to open group detail modal
- Show delete button for custom groups (isCustom flag)
- Emit `group-selected` event when card clicked
- Emit `request-delete-group` event when delete button clicked
- Destroy Chart.js instance on component removal to prevent memory leaks

**What this file explicitly does NOT do:**
- Does not fetch or compute group data (receives pre-aggregated data via `setData()`)
- Does not render the detail modal (delegates to parent component)
- Does not delete groups directly (emits event for controller to handle)
- Does not aggregate transactions (receives category breakdowns)
- Does not manage global state (stateless component)

---

### 3. Public API of This File

**Main exports / public surface:**

**Custom Element:** `<finsite-category-chart>`

**Methods:**
- `setData(data: Object)` – Sets group data and triggers render + chart initialization
  - Payload: `{ groupId, groupName, groupIcon, categories: [{id, name, amount}], transactions: [], isCustom: boolean }`

**Events emitted:**
- `group-selected` → When card is clicked (opens modal)
  - Payload: `{ groupId, groupName, categories, transactions, totalSpent }`
  - Bubbles: `true`, Composed: `true`
- `request-delete-group` → When delete button clicked
  - Payload: `{ groupId, groupName }`
  - Bubbles: `true`, Composed: `true`

**Side effects:**
- Registers custom element `<finsite-category-chart>`
- Lazy-loads Chart.js via `initChartCore()` on first chart render
- Creates Chart.js instance in shadow DOM canvas
- Attaches click listeners to card and delete button

---

### 4. Dependencies: What This File Uses

**Internal imports:**
- `./chart-core.js` – `initChartCore()`, `createBarChartConfig()` for Chart.js setup
- `../utils/icons.js` – `getGroupIcon(groupId, customIcon)` for group emoji display

**External libraries:**
- Chart.js (via chart-core) – Bar chart rendering

**Direction of dependency:**
- **Higher-level component** – Used by Categories page
- Depends on chart-core (lower-level utility)
- No dependencies on Model, Controller, or Storage

---

### 5. Consumers: Who Uses This File

**Known files that import/use this:**
- `components/categories.js` – Renders one `<finsite-category-chart>` per group
- Imports component to register custom element (no direct function calls)

**How they use it:**
- Categories component renders cards in grid: `<finsite-category-chart data-group-id="household">`
- Calls `chart.setData(breakdown)` to populate with group data
- Listens for `group-selected` event to open detail modal
- Listens for `request-delete-group` event to trigger deletion flow

---

### 6. Data & Contracts

**Inputs:**

**`setData()` expects:**
```javascript
{
  groupId: string,              // e.g., 'household', 'custom-123'
  groupName: string,            // e.g., 'Household', 'My Custom Group'
  groupIcon: string|null,       // Custom emoji or null (uses default)
  categories: Array<{           // Subcategories with spending
    id: string,
    name: string,
    amount: number
  }>,
  transactions: Array<Transaction>, // Full transaction objects
  isCustom: boolean             // True for deletable custom groups
}
```

**Outputs:**

**Events:**
- `group-selected` with `{ groupId, groupName, categories, transactions, totalSpent }`
- `request-delete-group` with `{ groupId, groupName }`

**DOM changes:**
- Renders card in shadow DOM with chart canvas
- Destroys chart on component removal

**Assumptions / invariants:**
- `categories` array has `name` and `amount` properties
- `transactions` array is non-empty if `hasTransactions = true`
- `isCustom` flag is explicitly `true` for custom groups (defaults to `false`)
- `groupIcon` is valid emoji string or `null`
- Chart canvas exists in shadow DOM before `_initChart()` is called

---

### 7. Storage & State Interaction

**Storage modules used:**
- None (receives data from parent, no direct storage access)

**Caching / in-memory state:**
- `groupId, groupName, groupIcon, categories, transactions, totalSpent, hasTransactions, isCustom` – Component data properties
- `_chart: Chart|null` – Chart.js instance reference
- `_chartInitialized: boolean` – Flag tracking chart creation

---

### 8. UI / Component Interaction

**DOM responsibilities:**
- Renders group card with header, chart area, footer in shadow DOM
- Creates `<canvas id="categoryChart">` for Chart.js rendering
- Shows "No transactions yet" message if no data

**Components it uses or controls:**
- None (leaf component, uses Chart.js directly)

**Events / callbacks:**
- Listens for click on `.chart-card` → Emits `group-selected`
- Listens for click on `.delete-btn` → Stops propagation, emits `request-delete-group`

**Lifecycle notes:**
- `connectedCallback()` → Calls `render()`
- `setData()` → Calls `render()`, then `_initChart()` on next tick
- `disconnectedCallback()` → Calls `_destroyChart()` to clean up Chart.js instance
- Chart initialized asynchronously after DOM render (ensures canvas exists)

---

### 9. Typical Flow Examples

**Scenario 1: Categories page loads with 3 groups**

1. **Trigger:** User navigates to Categories page
2. **Categories component:** Calls `buildCategoryAggregates()` to compute group breakdowns
3. **Categories component:** Renders 3 `<finsite-category-chart>` elements in grid
4. **Each category chart:**
   - `connectedCallback()` → Calls `render()` (empty card)
5. **Categories component:** Calls `chart.setData(breakdown)` for each chart
6. **Each category chart:**
   - Stores data properties (`groupId`, `categories`, etc.)
   - Calls `render()` again with real data
   - Calls `_initChart()` asynchronously
7. **Each category chart `_initChart()`:**
   - Calls `await initChartCore()` (lazy loads Chart.js on first call)
   - Gets canvas from shadow DOM
   - Calls `createBarChartConfig(labels, values)` from chart-core
   - Instantiates `new Chart(ctx, config)`
8. **Result:** 3 cards displayed with bar charts showing category spending

**Scenario 2: User deletes custom group**

1. **Trigger:** User hovers over custom group card, clicks 🗑️ delete button
2. **Category chart:** Delete button click handler
   - Calls `e.stopPropagation()` (prevents card click)
   - Emits `request-delete-group` with `{groupId, groupName}`
3. **Categories component:** Catches event, calls `_requestDeleteGroup()`
4. **Categories component:** Shows confirmation dialog
5. **User confirms:** Categories component emits `request-delete-group` upward
6. **View:** Forwards event to Controller
7. **Controller:** Calls `model.deleteGroup(groupId)`
8. **Model:** Deletes group from storage, reassigns categories, rebuilds aggregates
9. **Controller:** Calls `view.onGroupDeleted(groupId)`
10. **View:** Calls `categories.onGroupDeleted(groupId)`
11. **Categories component:** Refreshes from model, re-renders without deleted group
12. **Category chart:** `disconnectedCallback()` destroys Chart.js instance

---

### 10. Known Risks / Coupling / TODOs

**Tight couplings:**
- Assumes parent component (Categories) handles modal rendering
- Relies on `isCustom` flag for delete button visibility (brittle if flag not set correctly)
- Chart config is partially duplicated from chart-core (custom ticks, colors)
- Event names `group-selected` and `request-delete-group` are implicit contract

**Potential refactors:**
- Extract card header/footer to separate template functions
- Make delete button optional via attribute instead of `isCustom` flag
- Support horizontal bar charts (currently hardcoded vertical)
- Add loading skeleton while Chart.js initializes
- Memoize chart config to avoid recreating on every `setData()`
- Add error boundary for Chart.js initialization failures
- Support chart interactions (click bar to filter transactions by category)

**Anything surprising / non-obvious:**
- Destroys and recreates chart on every `setData()` call (inefficient for frequent updates)
- Empty state renders plain text instead of canvas (no chart instance created)
- Delete button uses `stopPropagation()` to prevent card click (modal open)
- Chart labels are truncated to 10 characters (`substring(0, 10)`)
- Bar thickness capped at 40px (`maxBarThickness: 40`)
- Custom icon from `groupIcon` property overrides default from `getGroupIcon()`
- Chart initialization is async (uses `await initChartCore()`) but rendering is sync
- `_formatCurrency()` method duplicates logic from chart-core's `formatCurrency()`
- Total spent is computed by summing category amounts (not from transactions directly)

---

## 6.3 spending-chart.js

### 1. File Overview

**File path:** `src/chart/spending-chart.js`

**File name:** spending-chart.js

**Layer / role in architecture:** Web Component / Chart Visualization

**Short summary:**
Dashboard chart container component that renders two Chart.js visualizations (line chart for 6-month spending trend, bar chart for top groups breakdown) plus KPI metric cards. Receives pre-aggregated data from Model via View and handles chart updates efficiently with animation toggles for bulk operations.

---

### 2. Responsibilities & Boundaries

**Core responsibilities:**
- Render metrics row with 4 KPI cards (this month, % change, last month, 6-month avg)
- Initialize and manage two Chart.js instances (line chart, bar chart)
- Update charts when new data provided via `updateChartData()` without recreating instances
- Disable animations for "heavy updates" (bulk imports) to improve performance
- Lazy-load Chart.js via chart-core module on first render
- Destroy Chart.js instances on component removal to prevent memory leaks
- Format currency values for metrics display

**What this file explicitly does NOT do:**
- Does not compute aggregates or query transactions (receives pre-aggregated data)
- Does not fetch data from Model or Storage (purely presentational)
- Does not handle user interactions beyond chart tooltips/hovers
- Does not emit events (no click handlers, no navigation)
- Does not manage dashboard layout (just the charts section)

---

### 3. Public API of This File

**Main exports / public surface:**

**Custom Element:** `<finsite-spending-chart>`

**Methods:**
- `updateChartData(newData: Object, isHeavyUpdate: boolean = false)` – Updates charts with new pre-aggregated data
  - Payload:
    ```javascript
    {
      timeSeries: { labels: string[], values: number[] },
      groupBreakdown: { labels: string[], values: number[] },
      metrics: { thisMonth, lastMonth, percentChange, sixMonthAvg }
    }
    ```
  - `isHeavyUpdate = true` disables animations for bulk operations
- `resize()` – Manually triggers chart resize (for responsive layouts)

**Attributes:**
- `data` (JSON string) – Alternative to `updateChartData()`, triggers `attributeChangedCallback()`

**Side effects:**
- Registers custom element `<finsite-spending-chart>`
- Lazy-loads Chart.js via `initChartCore()` on first render
- Creates two Chart.js instances in shadow DOM
- Mutates Chart.js instance data on updates (not immutable)

---

### 4. Dependencies: What This File Uses

**Internal imports:**
- `./chart-core.js` – `initChartCore()`, `getChart()`, `createLineChartConfig()`, `createBarChartConfig()`, `formatCurrency()`
- `../utils/debugService.js` – `createPrefixedLogger('[SpendingChart]')` for logging

**External libraries:**
- Chart.js (via chart-core) – Line and bar chart rendering

**Direction of dependency:**
- **Higher-level component** – Used by Dashboard
- Depends on chart-core (lower-level utility)
- No dependencies on Model, Controller, or Storage

---

### 5. Consumers: Who Uses This File

**Known files that import/use this:**
- `components/dashboard.js` – Renders `<finsite-spending-chart>` in dashboard layout
- Calls `chart.updateChartData(chartData)` when model provides new aggregates
- Calls `chart.updateFromSummary()` indirectly via Dashboard component wrapper

**How they use it:**
- Dashboard renders: `<finsite-spending-chart data-testid="summary-chart">`
- Gets reference: `this._chartComponent = shadowRoot.querySelector('finsite-spending-chart')`
- Updates data: `chartComponent.updateChartData(chartData, isHeavyUpdate)`
- No event listeners (component does not emit events)

---

### 6. Data & Contracts

**Inputs:**

**`updateChartData()` expects:**
```javascript
{
  timeSeries: {
    labels: string[],      // Month names: ['Jul', 'Aug', 'Sep', ...]
    values: number[]       // Spending per month: [1200, 1500, 1300, ...]
  },
  groupBreakdown: {
    labels: string[],      // Group names: ['Household', 'Expenses', ...]
    values: number[]       // Spending per group: [800, 600, 400, ...]
  },
  metrics: {
    thisMonth: number,     // Current month spending
    lastMonth: number,     // Previous month spending
    percentChange: number, // Month-over-month % change
    sixMonthAvg: number    // 6-month average spending
  }
}
isHeavyUpdate: boolean     // True for bulk imports (disables animations)
```

**Outputs:**

**DOM changes:**
- Updates metric card values in shadow DOM
- Updates chart data via `chart.update()` (mutates existing instances)
- Re-renders entire component if `render()` called (rare)

**Assumptions / invariants:**
- `labels` and `values` arrays have matching lengths
- `values` are numbers (no validation)
- `metrics` properties are numbers (default to 0 if missing)
- Chart.js is available after `_initChartsAsync()` completes
- Canvas elements exist in shadow DOM when `_initCharts()` is called

---

### 7. Storage & State Interaction

**Storage modules used:**
- None (receives data from parent, no direct storage access)

**Caching / in-memory state:**
- `chartData: Object` – Stored chart data structure (timeSeries, groupBreakdown, metrics)
- `_lineChart: Chart|null` – Line chart instance reference
- `_barChart: Chart|null` – Bar chart instance reference
- `_Chart: Chart|null` – Chart.js constructor reference (cached from `initChartCore()`)
- `_isHeavyUpdate: boolean` – Flag for animation control
- `_isInitializing: boolean` – Prevents concurrent initialization

---

### 8. UI / Component Interaction

**DOM responsibilities:**
- Renders metrics row with 4 KPI cards
- Renders two chart cards with canvases
- Updates metric values via DOM queries (no full re-render)

**Components it uses or controls:**
- None (leaf component, uses Chart.js directly)

**Events / callbacks:**
- No events emitted
- No click handlers (charts are read-only)
- Chart.js tooltips handle hover interactions internally

**Lifecycle notes:**
- `connectedCallback()` → Calls `render()`, then `_initChartsAsync()`
- `_initChartsAsync()` → Lazy-loads Chart.js, then creates chart instances
- `updateChartData()` → Updates existing chart instances without recreating
- `_updateMetricsDisplay()` → Updates metric card values via DOM queries
- `disconnectedCallback()` → Calls `_destroyCharts()` to prevent memory leaks

---

### 9. Typical Flow Examples

**Scenario 1: Dashboard loads for first time**

1. **Trigger:** User navigates to Dashboard page
2. **Dashboard component:** Renders `<finsite-spending-chart>` in layout
3. **Spending chart:**
   - `connectedCallback()` → Calls `render()` with default data (zeros)
   - `_initChartsAsync()` starts asynchronously
4. **`_initChartsAsync()`:**
   - Calls `await initChartCore()` (lazy-loads Chart.js)
   - Waits for Chart.js to load (first time only)
   - Calls `_initCharts()` on next animation frame
5. **`_initCharts()`:**
   - Calls `_createLineChart()` → Gets canvas, creates line chart instance
   - Calls `_createBarChart()` → Gets canvas, creates bar chart instance
6. **Controller:** Calls `view.updateDashboardCharts(model.getDashboardSummary())`
7. **View:** Calls `dashboard.updateChartData(chartData)`
8. **Dashboard:** Forwards to `spendingChart.updateChartData(chartData)`
9. **Spending chart:**
   - `updateChartData()` → Merges new data into `chartData`
   - `_updateCharts()` → Mutates chart instances' data arrays
   - Calls `chart.update()` on each instance (animates transition)
10. **Result:** Charts animate from default state to real data

**Scenario 2: User imports 500 transactions via CSV**

1. **Trigger:** User uploads CSV file with bulk transactions
2. **Controller:** Calls `model.addTransactionsBulk(transactions)`
3. **Model:** Adds all transactions, rebuilds aggregates once at end
4. **Controller:** Calls `view.updateDashboardCharts(chartData, isHeavyUpdate=true)`
5. **Dashboard:** Forwards `updateChartData(chartData, true)` to spending chart
6. **Spending chart:**
   - `updateChartData()` → Sets `_isHeavyUpdate = true`
   - `_updateCharts()` → Sets `animation.duration = 0` (disables animations)
   - Mutates chart data, calls `chart.update()`
7. **Result:** Charts update instantly without animation lag
8. **`_updateCharts()` cleanup:** Resets `_isHeavyUpdate = false` for future updates

---

### 10. Known Risks / Coupling / TODOs

**Tight couplings:**
- Assumes Chart.js v3.x API (breaks if upgraded to v4 without migration)
- Hardcoded canvas IDs (`#line-chart`, `#bar-chart`) in shadow DOM
- Tightly coupled to chart-core factory functions (config shape dependency)
- Metric card DOM queries rely on hardcoded IDs (`#metric-this-month`, etc.)
- Assumes parent component (Dashboard) manages layout and data flow

**Potential refactors:**
- Extract metrics row to separate component (`<finsite-metrics-row>`)
- Use Chart.js `update()` mode parameter instead of manual animation toggling
- Memoize chart configs to avoid recreation
- Add loading skeletons during Chart.js initialization
- Support chart export (PNG, SVG) for reports
- Add error boundary for Chart.js failures
- Make chart types configurable (e.g., swap line for area chart)
- Support dark/light mode theming for charts (currently hardcoded dark theme colors)

**Anything surprising / non-obvious:**
- Charts are updated by mutating existing instances (not recreated) for performance
- `_updateMetricsDisplay()` updates DOM directly without re-rendering (micro-optimization)
- `_isHeavyUpdate` flag disables animations globally for both charts (not per-chart)
- Chart initialization is async but chart updates are sync
- `formatCurrency()` from chart-core is used instead of local method
- Percent change color is inverted for spending (red = increase = bad, green = decrease = good)
- Chart instances are cached in `_lineChart` and `_barChart` (not recreated on data change)
- `attributeChangedCallback()` supports JSON attribute but is not used by current consumers
- `resize()` method is exposed but never called by consumers (defensive API)
- Gradient for line chart is created in chart-core factory (requires context parameter)

--- 

