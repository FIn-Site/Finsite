# IndexDB breakdown

## Initalization

To create a database in IndexedDB you need a database name (finsiteDB), a database version (2), and store names which refer to the storage collections:
- `transactions` - Financial transaction records
- `groups` - Category groups (Household, Investments, etc.)
- `categories` - Individual categories within groups (Groceries, Utilities, etc.)

## Opening the database

The `openDatabase()` function returns a usable connection to the IndexedDB database (finsiteDB)

The function `indexedDB.open(<database name>, <database version>)` returns an event based object which fires:
- onupgradeneeded
- onsuccess
- onerror
- onblocked

Meaning you cannot return the object directly - you must trigger one of the former operations.

## Promise wrapper
 
Since IndexedDB is event based, each part of the program that interacts with the database would need a way to handle all possible operations.

__The solution__ 

A _Promise wrapper_. By wrapping the `open` function with a promise we can `await` the database to open.

## Error Handling

The `createError(context, detail)` helper function creates consistent Error objects:
- Wraps context message with optional detail
- Attaches original error as `cause` property
- All rejections use this helper for consistent error format

## Operations

### onupgradeneeded

This operation triggers when the database doesn't exist, or when it is opened with a _new_ version. This triggers:
1. `createObjectStore` if the storage doesn't exist
2. Assign a primary key via `keyPath` and optionally make it auto increment
3. `createIndex` to create an index for each feature for simplified querying

**Store Schemas:**

**Transactions Store:**
- `keyPath: 'id'` with `autoIncrement: true`
- Indexes: `groupIndex`, `categoryIndex`, `amountIndex`, `dateIndex`

**Groups Store:**
- `keyPath: 'id'` (string id like "household")
- No additional indexes

**Categories Store:**
- `keyPath: 'id'` (string id like "groceries")
- Index: `groupIdIndex` for filtering categories by group

### onsuccess

Means the database exists/has been created/has been upgraded and resolves the promise fulfilling `openDatabase`

### onerror

Means the promise has been rejected, the database failed to open and will return a string with the error code

### onblocked 

Is unique because it fires when a _version upgrade cannot proceed_ so it is __NOT__ the final outcome.
This means:
- It happens before `onsuccess`
- It does not mean the operation failed
- It is not the same as `onerror`
 
It simply means that another tab, window, or worker still has the database open with the old version and it is _waiting_ to proceed after all connections are closed.

---

## Transactions API

### getAllTransactions()

Similar to the approach we took in opening the database, we wrapped this function with a promise and exported it as `async` so we can use `await` when we call it.

__Transactions__ are the operations we will use to manipulate the dataset. This includes:
- get
- getAll
- add
- put
- delete

`db.transaction(STORE_NAME, 'readonly')` starts a transaction on our storage in readonly mode. It's in readonly mode because we are not writing to it and IndexedDB can optimize this request.

These operations exist _on the object storage_ __NOT__ in `db` so we call `transaction.objectStore(STORE_NAME)`

**onsuccess:** Returns an array of all transactions

**onerror:** Returns the error 

__NOTE:__ There is a difference between `error` and `errorCode`
- error: returns [name, message, the error itself, stack trace]
- errorCode: (Outdated) only returns error value
    - 1: NotFoundError
    - 2: ConstraintError
    - 3: AbortError

### addTransaction(transactionData)

Similar to `getAllTransactions` in initial logic, only difference is:
- Use 'readwrite' mode
- Resolve with entire record + id (so it can be pushed to local storage array + updated on view)

### deleteTransactions(ids)

Deletes one or more transactions by ID:
- Opens database in 'readwrite' mode
- Validates each ID - rejects immediately if any ID is NaN
- Normalizes IDs to numbers via `Number(rawId)`
- Queues all delete operations in single transaction
- Resolves on `transaction.oncomplete`
- Rejects on `transaction.onerror`

**ID Validation:** If `Number(rawId)` produces NaN, rejects with descriptive error instead of silently no-op'ing.

### clearAllTransactions()

Removes all transactions from the store:
- Uses `store.clear()` for efficient bulk deletion
- Resolves when clear completes
- Used for reset functionality or testing

---

## Groups API

### getAllGroups()

Returns all groups from storage:
- Opens 'readonly' transaction on groups store
- Calls `store.getAll()`
- Returns empty array if no groups exist

### addGroup(group)

Creates or updates a group:
- Uses `store.put()` which handles both add and update
- Group shape: `{ id: string, name: string, color?: string, icon?: string }`
- Custom groups also have: `{ isCustom: true, categoryIds: string[] }`

### deleteGroup(groupId)

Deletes a group by ID:
- Opens 'readwrite' transaction
- Calls `store.delete(groupId)`
- Rejects with proper Error object via `createError()`

---

## Categories API

### getAllCategories()

Returns all categories from storage:
- Opens 'readonly' transaction on categories store
- Calls `store.getAll()`
- Returns empty array if no categories exist

### addCategory(category)

Creates or updates a category:
- Uses `store.put()` for upsert behavior
- Category shape: `{ id: string, groupId: string, name: string, color?: string, icon?: string }`

### updateCategoriesBatch(categories)

**Batch operation for updating multiple categories atomically:**
- More efficient than calling `addCategory()` in a loop
- All updates happen in single IndexedDB transaction
- Provides atomicity - all succeed or all fail
- Returns array of updated categories

**Transaction Handling:**
- `tx.oncomplete`: Resolves with all results
- `tx.onerror`: Rejects with error
- `tx.onabort`: Rejects with abort error
- Individual request errors cause transaction abort

**Use Case:** Used by `model.deleteGroup()` to reassign orphaned categories to 'uncategorized' group in a single atomic operation.

---

# Cleanup Refactor

## Problems Addressed

### 1. Inconsistent Error Rejection (deleteGroup)
**Before**: `deleteGroup()` rejected with a plain string instead of an Error object:
```javascript
reject(`Failed to delete group: ${event.target.error}`);
```

**Issue**: 
- Breaks the "always reject with Error objects" convention
- Callers can't reliably check `error.message` or `error.cause`
- Inconsistent with all other functions that use `createError()`

**After**: Uses `createError()` helper like all other functions:
```javascript
reject(createError('Failed to delete group', event.target.error));
```

### 2. Silent NaN IDs in deleteTransactions
**Before**: `deleteTransactions()` normalized IDs with `Number(rawId)` without validating:
```javascript
const normalizedIds = (ids || []).map((rawId) => Number(rawId));
```

**Issue**:
- `Number('abc')` returns NaN
- `store.delete(NaN)` is a no-op (doesn't throw)
- Promise resolves "successfully" even though nothing was deleted
- Caller has no way to know the delete failed silently

**After**: Validates each ID before queueing deletes:
```javascript
for (const rawId of rawIds) {
    const numId = Number(rawId);
    if (Number.isNaN(numId)) {
        reject(createError('Invalid transaction ID', `Cannot convert '${rawId}' to number`));
        return;
    }
    normalizedIds.push(numId);
}
```
Now rejects immediately with descriptive error if any ID is invalid.

### 3. Dead State in updateCategoriesBatch
**Before**: Tracked a `completed` counter that was never used:
```javascript
let completed = 0;
// ...
request.onsuccess = () => {
    results.push(category);
    completed++;  // Never read!
};
```

**Issue**:
- Dead code clutters function
- Confuses maintainers about its purpose
- Minor memory waste

**After**: Removed unused counter:
```javascript
request.onsuccess = () => {
    results.push(category);
};
```
The `results` array already tracks successful operations; counter was redundant.

## Implementation Summary

| Change | Old Approach | New Approach |
|--------|--------------|--------------|
| deleteGroup error | Plain string rejection | `createError()` for proper Error object |
| deleteTransactions IDs | Silent NaN no-op | Validate with `Number.isNaN()`, reject on invalid |
| updateCategoriesBatch | Unused `completed` counter | Removed dead state |

## Data Integrity Improvements

- **ID validation**: Invalid IDs now fail fast with clear error message
- **Consistent errors**: All rejections are proper Error objects with `cause` property
- **Clean code**: No dead state that could confuse future maintainers

## Error Handling Principles

All storage service functions now follow consistent error handling:

1. **Use createError()**: All rejections use `createError(context, detail)` for consistent format
2. **Fail fast**: Validation happens before any database operations
3. **Descriptive messages**: Errors include context about what failed and why
4. **Preserve cause**: Original IndexedDB errors attached as `error.cause`

## Future Work

- Add `deleteTransactionsBatch()` using single transaction like `updateCategoriesBatch()`
- Consider adding retry logic for transient IndexedDB errors
- Add connection pooling to avoid repeated `openDatabase()` calls
- Implement proper database migration strategy for version upgrades