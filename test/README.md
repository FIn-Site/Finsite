# Testing Overview

This document describes how automated testing is set up for the FinSite project and how to run and extend the tests.

We focus on **unit testing the Model not the UI. The goal is to verify that the **business logic** and **persistence behavior** are correct and reliable.

---

## 1. Tools & Setup

We use:

- **npm** as the package manager
- **[Vitest](https://vitest.dev/)** as the JavaScript test runner





## What’s Being Tested

### 1. Model (FinSiteModel)

File under test:
- `src/model/financeModel.js`

The following core behaviors are covered by unit tests:

#### Bucket / Date Logic
- `_getBucketKey(date)`  
  - Converts a `Date` object into a monthly bucket key (`YYYY-MM`)

#### Aggregation & Math Logic
- `_applyTransactionDelta(tx, sign)`  
  - Applies or removes a transaction’s effect on monthly and group totals  
- `_calculateTotalSpent(transactions)`  
  - Computes the numeric total from a list of transactions

#### Transaction Logic
- `addTransaction(tx)`  
  - Adds a transaction  
  - Assigns a unique `id`  
  - Updates internal transaction state  
- `deleteTransactions(ids)`  
  - Deletes transactions by ID  
  - Updates aggregates accordingly  
- `clearAllTransactions()`  
  - Removes all transactions  
  - Resets internal aggregates  

#### Utility Helpers
- `_getCategoryIcon(name)`  
  - Returns the correct icon for known categories  
- `_getRelativeDate(date)`  
  - Returns human-readable labels such as `"Today"`  




