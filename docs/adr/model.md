# Model

## Setup

Model is exported as `FinanceModel` for later intstantiation by the controller, the constructor initalizaes `this.transactions` with an empty array to prevent undefined or null returns, this will later be used as our local copy of the transactions for faster viewing/manipulating

## init()

is set as an async function so we can use `await` for `getAllTransactions` 

in the `try` we await all transactions from storage service and initalize  `this.transactions` with it, the conditional operator is an extra saftey net incase storage service returns anything except an array

in the `catch` we send out the error as well as overwrite transaction with an empty array


## addEntry()
async function to await `addTransaction` in storage service. Takes in a record parameter with the formatting:
{ group, category, amount, date }

`try` write new record to a variable (record) and pass it to `addTransaction` since `onsuccess` returns the full record + id, it can directly be pushed to `this.transactions` (local database) and returns the saved record so the controlel can update the view

`catch` throws an error, controller handles it


## getAll

returns a __Shallow copy__ of the array, this is to prevent data mutation by copying the array over to a new array so mutation does affect source of truth

## Incremental Aggregation System

The model uses an **O(1) incremental aggregation** approach instead of O(n) full scans. This optimization significantly improves dashboard performance by maintaining running totals that update instantly on add/delete operations.

### Data Structures

**`_timeBuckets`**: Map<bucketKey, totalSpend>
- Stores monthly spending totals using "YYYY-MM" format keys (e.g., "2025-12")
- Updated incrementally when transactions are added or deleted
- Eliminates need to scan all transactions for time-based queries

**`_groupTotals`**: Map<groupId, totalSpend>
- Tracks spending totals per group (household, investments, expenses, etc.)
- Updated in O(1) time on each transaction operation
- Used for group breakdown charts

**`_cachedMetrics`**: Object with { thisMonth, lastMonth, sixMonthTotal }
- Pre-computed dashboard metrics updated incrementally
- Avoids recalculating common metrics on every dashboard refresh
- Single source of truth for performance-critical dashboard data

### Helper Methods

**`_getBucketKey(date)`**
- Generates a "YYYY-MM" bucket key from a date
- Used to categorize transactions into monthly buckets
- Returns null for invalid dates

**`_getLastMonthKey()`**
- Calculates the bucket key for the previous month relative to current date
- Used for month-over-month comparisons

**`_getLastNMonthKeys(months)`**
- Returns array of bucket keys for the last N months (oldest first)
- Default: 6 months for dashboard time series
- Used to generate chart labels and filter relevant data

**`_isWithinLastNMonths(key, months)`**
- Checks if a bucket key falls within the last N months
- Used to filter aggregates for specific time windows

### Aggregate Update Methods

**`_applyTransactionDelta(tx, sign)`**
- Applies a single transaction's impact to all aggregates
- `sign = 1` for adding, `sign = -1` for removing
- Updates time buckets, group totals, and cached metrics in O(1)
- Called after individual add/delete operations

**`_updateCachedMetrics(bucketKey, delta)`**
- Updates cached metrics (thisMonth, lastMonth, sixMonthTotal) based on bucket changes
- Conditionally updates metrics only if the bucket is relevant
- Maintains consistency between time buckets and cached values

**`_rebuildAggregates()`**
- Performs O(n) full rebuild of all aggregates from transactions array
- Called only on init() and bulk operations (addTransactionsBulk)
- Single pass through transactions to reconstruct all data structures
- Clears existing aggregates before rebuilding

## Core Data Operations

### getData()

Returns the current application data state with **shallow copies** of all arrays to prevent external mutation:
- Spreads the data object
- Creates new array references for accounts, transactions, groups, and categories
- Ensures immutability of internal state

### updateData(newData)

Merges new data into the model's data object:
- Uses spread operator to merge without mutating original
- Logs update for debugging
- Used by controller to update non-transaction data

### addTransactionsBulk(transactions)

Handles bulk import of multiple transactions (e.g., from CSV):
- Validates input array is non-empty
- Persists each transaction to IndexedDB in sequence
- Prepends all saved transactions to in-memory array
- **OPTIMIZATION**: Calls `_rebuildAggregates()` once at the end instead of updating incrementally per transaction
- Returns array of saved transactions with IDs

`try` persists each transaction via storage service loop and collects saved records. Prepends all saved records to `this.transactions` in one operation. Rebuilds aggregates once for all new data.

`catch` throws error for controller to handle

### deleteTransactions(ids)

Removes one or more transactions by ID:
- Accepts array of string or number IDs
- Normalizes IDs to numbers for comparison
- Calls storage service to delete from IndexedDB
- **OPTIMIZATION**: Calls `_applyTransactionDelta(tx, -1)` for each deleted transaction (O(k) where k = deleted count)
- Filters deleted transactions from in-memory array
- Returns updated data state

`try` await storage deletion, creates ID set for efficient lookup, finds transactions being deleted, decrements aggregates for each, filters transactions array

`catch` logs error and re-throws for controller

### clearAllTransactions()

Removes all transactions from storage and memory:
- Calls storage service to clear IndexedDB
- Resets `this.transactions` to empty array
- **OPTIMIZATION**: Clears all aggregate data structures (timeBuckets, groupTotals, cachedMetrics)
- Returns empty data state

Used for reset functionality or testing

## Read-Only Helpers

### getTransactions()

Returns shallow copy of transactions array:
- Prevents external code from mutating the source array
- Simple read operation without side effects

### getGroups()

Returns shallow copy of groups array:
- Used by UI to render group selection dropdowns
- Prevents external mutations

### getCategoriesByGroup(groupId)

Filters categories by their parent group:
- Takes groupId string parameter
- Returns array of categories matching that groupId
- Used for cascading dropdowns (select group → show relevant categories)

## Dashboard Summary Methods

### getDashboardSummary()

**Main dashboard data generator - reads from pre-computed aggregates (O(1) operation)**

Returns object with:
- `timeSeries`: 6-month spending trend for line chart
- `groupBreakdown`: Top 5 spending groups for pie/doughnut chart
- `metrics`: This month, last month, percent change, 6-month average

Calls three aggregate-reading helper methods instead of iterating transactions

### _getTimeSeriesFromAggregates()

Generates time series chart data from `_timeBuckets`:
- Gets last 6 month keys
- Maps each key to month name (Jan, Feb, Mar, etc.)
- Reads pre-computed totals from time buckets
- Returns `{ labels: [...], values: [...] }` for Chart.js

Pure read operation, no transaction iteration

### _getGroupBreakdownFromAggregates()

Generates group breakdown chart data from `_groupTotals`:
- Builds group name lookup from `this.data.groups`
- Converts map entries to array of [name, total] pairs
- Sorts descending by total and takes top 5
- Returns `{ labels: [...], values: [...] }` for Chart.js
- Handles empty case with "No Data" placeholder

### _getMetricsFromAggregates()

Reads dashboard metrics from `_cachedMetrics`:
- Gets thisMonth, lastMonth, sixMonthTotal from cache
- Calculates percent change: `((thisMonth - lastMonth) / lastMonth) * 100`
- Handles edge cases (lastMonth = 0, no transactions)
- Calculates 6-month average: `sixMonthTotal / 6`
- Rounds all values to 2 decimal places
- Returns object with all computed metrics

## Dashboard Panel Summary Methods

### getDashboardPanelSummary()

**Generates dynamic data for dashboard stat cards and recent activity section**

Returns object with:
- `recentTransactions`: Array of 5 most recent transactions with formatted data
- `totalSpentAllTime`: Sum of all transaction amounts (lifetime total)
- `transactionsThisWeek`: Count of transactions in last 7 days (rolling window)
- `monthlySpendingCurrent`: Current month spending from cached metrics
- `monthlySpendingLast`: Previous month spending from cached metrics
- `monthlyChangePercent`: Percent change between current and last month
- `monthlyDirection`: 'up', 'down', or 'neutral' based on change

Used by dashboard component to display real-time stats instead of static placeholders

### _getRecentTransactions(limit)

Returns formatted array of recent transactions:
- Takes limit parameter (default: 5)
- Sorts transactions by date descending (newest first)
- Slices to requested limit
- Maps each transaction to display format with:
  - `id`: Transaction ID
  - `icon`: Category emoji icon from `_getCategoryIcon()`
  - `merchant`: Display name (merchant || category || 'Transaction')
  - `amount`: Absolute value of amount
  - `date`: Relative date string from `_getRelativeDate()`
  - `rawDate`: Original date for sorting
  - `category` and `group`: Original values
- Returns empty array if no transactions exist

### _calculateTotalSpent(transactions)

Calculates lifetime spending total:
- Takes transactions array as parameter
- Uses `reduce()` to sum all transaction amounts
- Converts amounts to absolute values (handles negative values)
- Returns 0 if transactions array is empty or null
- Currently counts all transactions as spending (could be filtered by type field)

### _countTransactionsThisWeek()

Counts transactions in rolling 7-day window:
- Calculates date 7 days ago from current time
- Filters transactions with dates >= 7 days ago and <= now
- Returns count of matching transactions
- Returns 0 if no transactions exist

### _getCategoryIcon(categoryOrGroup)

Maps category/group names to emoji icons:
- Takes category or group string
- Converts to lowercase for case-insensitive matching
- Returns emoji from `iconMap` object:
  - Categories: groceries 🛒, utilities 💡, fuel ⛽, stocks 📈, bonds 📊, dining-out 🍽️, shopping 🛍️
  - Groups: household 🏠, investments 💰, expenses 💳
  - Default: uncategorized 📝 or fallback 💸
- Used to add visual context to transaction lists

### _getRelativeDate(date)

Formats dates as relative strings:
- Takes date string or Date object
- Compares transaction date to current date
- Returns "Today" if same day
- Returns "Yesterday" if previous day
- Otherwise formats as "Mon DD" (e.g., "Dec 8")
- Includes year if different from current year (e.g., "Dec 8, 2024")
- Used for human-readable recent activity display

## Default Configuration

### _getDefaultConfig()

**Provides startup default groups and categories when none exist in storage**

Returns object with:
- `defaultGroups`: Array of 3 initial groups (Household, Investments, General Expenses)
- `defaultCategories`: Array of 7 initial categories mapped to groups
  - Household: Groceries, Utilities, Fuel
  - Investments: Stocks, Bonds
  - General Expenses: Dining Out, Shopping

Called during `init()` if storage is empty. These defaults are persisted to IndexedDB so users start with a working structure and can modify/delete them later.

## Performance Optimizations Summary

**OPTIMIZATION : Incremental Aggregation**
- Time Complexity: O(1) for dashboard reads (was O(n) before)
- Space Complexity: O(m + g) where m = unique months, g = unique groups
- Impact: Dashboard loads instantly regardless of transaction count
- Trade-off: Slightly more complex add/delete logic, but much faster queries

**When aggregates are updated:**
- `init()`: Full rebuild O(n) - happens once on app start
- `addTransaction()`: Incremental update O(1)
- `addTransactionsBulk()`: Full rebuild O(n) - happens once per bulk import
- `deleteTransactions()`: Incremental update O(k) where k = deleted count
- `clearAllTransactions()`: Clear all aggregates O(1)

**When aggregates are read:**
- `getDashboardSummary()`: Pure reads O(1)
- `getDashboardPanelSummary()`: Mix of aggregate reads and recent transaction scan

This architecture ensures dashboard performance scales independently of transaction volume.

---

# Cleanup Refactor

## Problems Addressed

### 1. View Concerns in Data Layer (MVC Violation)
**Before**: Model contained `_getCategoryIcon()` and `_getRelativeDate()` helper methods that mapped data to display formats (emoji icons, human-readable date strings)

**Issue**: This mixed presentation logic into the data layer, violating MVC separation and making the model harder to:
- Port to non-UI contexts (CLI tools, APIs)
- Localize for internationalization
- Test without display dependencies

**After**: Created `formatters.js` module with exported `getCategoryIcon()` and `getRelativeDate()` functions; model now only exposes raw data (category IDs, ISO timestamps)

### 2. Production Debug Logging (Noise)
**Before**: Multiple direct `console.log()` calls throughout the model (`init`, `_rebuildAggregates`, `addTransaction`, `deleteTransactions`, etc.)

**Issue**: Debug logs run in production, adding noise to console and minor performance cost from string formatting

**After**: Added `_debugLog(...args)` method controlled by `this.debug` boolean flag (default: `false`); all logging routed through this method for centralized control

### 3. Unused State (_initialized, _currentBucketKey)
**Before**: Constructor initialized `_initialized` and `_currentBucketKey` properties that were never read anywhere in the codebase

**Issue**: Dead code clutters the model, confuses maintainers about their purpose, and wastes memory

**After**: Removed both unused properties; state is now minimal and intentional

### 4. Repeated Set Construction in _isWithinLastNMonths
**Before**: `_isWithinLastNMonths()` called `new Set(this._getLastNMonthKeys(6))` on every invocation, which happened for every transaction delta in `_updateCachedMetrics()`

**Issue**: Each transaction add/delete triggered O(6) Set construction, making aggregate updates heavier than necessary

**After**: Added `_lastNMonthKeysCache` Set built once during `_rebuildAggregates()`; `_isWithinLastNMonths()` now does O(1) Set lookups instead of O(6) construction

### 5. Slow Category Updates in deleteGroup (No Batching)
**Before**: `deleteGroup()` updated categories one-by-one with `await addCategory(updated)` inside a loop

**Issue**: 
- Each category update was a separate IndexedDB transaction (slow)
- No rollback strategy if a middle update failed (partial state)
- Risk of inconsistent state between in-memory and storage

**After**: Added `updateCategoriesBatch()` to storage service using single transaction; `deleteGroup()` collects all category updates, calls batch function once, and only updates in-memory state after successful persistence

### 6. Loose Input Validation (Transaction Data Integrity)
**Before**: `addTransaction()` accepted loosely validated inputs with shallow destructuring; `addTransactionsBulk()` also lacked validation

**Issue**: Invalid dates (non-parseable strings, `null`, `undefined`) could create transactions that exist in history but never appear in time-based aggregates, causing dashboard-vs-history inconsistencies

**After**: 
- Added `_validateTransaction(input)` that throws on invalid amounts/dates
- Normalizes dates to ISO strings for consistent storage format
- `addTransaction()` now uses validation pipeline
- `addTransactionsBulk()` validates each transaction, returns `{ saved, skipped }` with error details for invalid entries

### 7. Console.log Remained in addTransaction (Missed Fix)
**Before**: After initial cleanup, `addTransaction()` still had `console.log('Transaction added:', saved)` instead of using `_debugLog()`

**Issue**: Production noise, inconsistent with rest of codebase

**After**: Replaced with `this._debugLog('Transaction added:', saved)` for consistency

### 8. addTransaction Bypassed Validation (Single-Add vs Bulk Inconsistency)
**Before**: While `addTransactionsBulk()` used `_validateTransaction()`, single `addTransaction()` still did shallow destructuring without validation

**Issue**: Different validation paths for single vs bulk operations, allowing invalid data through single-add path

**After**: `addTransaction()` now calls `_validateTransaction(input)` before persistence, ensuring identical validation rules for both paths

### 9. Model Formatted View-Ready Data (_getRecentTransactions)
**Before**: `_getRecentTransactions()` returned display-formatted objects with `icon`, `date` (human-readable), and `merchant` fallback logic

**Issue**: Model mixed data and presentation concerns; formatting should happen in view layer per MVC principles

**After**: 
- `_getRecentTransactions()` now returns raw transaction data (IDs, timestamps, amounts, category/group keys)
- Created `formatTransactionForDisplay()` in `formatters.js` for view-layer formatting
- Dashboard component imports `getCategoryIcon()` and `getRelativeDate()` to format raw data during rendering

## Implementation Summary

| Change | Old Approach | New Approach |
|--------|--------------|--------------|
| View formatting | `_getCategoryIcon()` / `_getRelativeDate()` in model | `formatters.js` module, model returns raw data |
| Debug logging | Direct `console.log()` calls | `_debugLog()` controlled by `this.debug` flag |
| Unused state | `_initialized`, `_currentBucketKey` tracked | Removed both properties |
| Last-N-months check | Rebuild Set on every call | Cache Set in `_lastNMonthKeysCache` |
| Category updates | Per-category `await addCategory()` loop | `updateCategoriesBatch()` single transaction |
| Input validation | Shallow destructuring, no date checks | `_validateTransaction()` with date normalization |
| Data format | Model returns view-ready objects | Model returns raw data, view formats for display |

## Performance Impact

- **Last-N-months lookup**: O(6) Set construction per transaction → O(1) cached Set lookup
- **Category batch update**: O(n) separate transactions → O(1) single transaction where n = categories affected
- **Debug logging**: Always-on string formatting → Zero overhead when `debug = false`
- **Date validation**: Silent invalid dates → Throws immediately, prevents aggregate corruption

## Data Integrity Improvements

- **Consistent date format**: All transactions normalized to ISO strings before storage
- **Aggregate consistency**: Invalid dates rejected before hitting storage, preventing dashboard-history mismatches
- **Atomic category updates**: Single transaction ensures all-or-nothing updates on group deletion
- **Clear error messages**: Validation throws descriptive errors (`Invalid date: undefined`) instead of silent failures

## MVC Separation Benefits

- **Portability**: Model can be used in Node.js CLI tools, Electron apps, or APIs without DOM dependencies
- **Localization**: Formatters can be swapped for locale-specific versions without touching model
- **Testability**: Model tests focus on business logic; formatter tests focus on display logic
- **Maintainability**: Clear separation of concerns makes changes easier to reason about

## Future Work

- Add `model.debug = true` toggle in dev environment for debugging
- Consider exporting `formatTransactionForDisplay()` as primary formatter API
- Add locale parameter to formatters for internationalization
- Implement validation schema library (e.g., Zod) for more robust input validation
- Add bulk delete optimization with single transaction like batch category updates



