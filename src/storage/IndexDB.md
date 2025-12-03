# IndexDB breakdown

## Initalization

to create a database in indexdb you need a database name (finsiteDB) a database version (1) and a store name, which refers to teh storage name (transactions)

## Opening the database

the `openDatabase()` function returns a usable connection to the indexDB database (finsiteDB)

the function `indexDB.open(<database name>, <database version>)` returns an event based object which fires
- onupgradeneeded
- onsuccess
- onerror
- onblocked

meaning you cannot return the object directly you must trigger one of the former operations

## Promise wrapper
 
 Since indexDB is event based each part of the program that interacts with the database would need a way to handle all possible operations

 __The solution__ 

 A _Promise wrapper_, by wrapping the `open` function with a promise we can `await` the database to open

 ## Operations

 ### onupgradeneeded

 This operation triggers when the database doesnt exist, or when it is opened with a _new_ version this trigger 
 `createObjectStore` if the storage doesnt exist and assing it a primary key `keypath` and optionally making the primary key auto increment, then `createIndex` to create an index for each feature for simplified querying down the line

 ### onsuccess

 means the database exists/has been created/has been upgraded and resolves the promise fullfilling `openDatabase`

 ### onerror

 means the promise has been rejected, the database failed to open and will return a string with the error code

 ### onblocked 

 is unique because it fires when a _version upgrade cannot proceed_ so it is __NOT__ the final outcome,
 this means;
 - it happens before `onsuccess`
 - it does not mean the operation failed
 - it is not the same as `onerror`
 
 It simply means that another tab, window, or worker still has the database open with the old version and it is _waiting_ to proceed after all connections are closed

 ---

 ## Get all transactions

 Similar to the approach we took in opening the database, we wrapped this function with a promise and exported it as `async` so we can use `await` when we call it

__Transactions__ are the opreations we will use to manipualte the dataset this includes:
- get
- getAll
- add
- put
- delete

`db.transaction(STORE_NAME, 'readonly')` starts a transaction on our storage in readonly mode, its in readonly mode because we are not writing to it and indexDB can optimize this request

These operations exist _on the object storage_ __NOT__ in `db` so we call `trasnaction.objectStore(STORE_NAME)`

### onsuccess

will return an array of all transactions

### onerror

returns the error 
__NOTE__
there is a difference between `error` and `errorCode`
- error: returns[ name, message, the error itself, stack trace]
- errorCode: (Outdated) only returns error value
    - 1: NotFoundError
    - 2: ConstraintError
    - 3: AbortError

---

## add transaction

similar to `getAllTransactions` in inital logic only difference is
- use 'readwrite'
- resolve with entire record + id (so it can be pushed to local storage array + updated on view)