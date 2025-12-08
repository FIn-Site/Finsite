const DB_NAME = 'finsiteDB';
const DB_VERSION = 2; // updated version

// Store names
const TRANSACTION_STORE = 'transactions';
const GROUPS_STORE = 'groups';
const CATEGORIES_STORE = 'categories';

function openDatabase() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event) => {
            const db = event.target.result;

            // 1) Transactions store
            if (!db.objectStoreNames.contains(TRANSACTION_STORE)) {
                const store = db.createObjectStore(TRANSACTION_STORE, {
                    keyPath: 'id',
                    autoIncrement: true,
                });

                store.createIndex('groupIndex', 'group', { unique: false });
                store.createIndex('categoryIndex', 'category', { unique: false });
                store.createIndex('amountIndex', 'amount', { unique: false });
                store.createIndex('dateIndex', 'date', { unique: false });
            }

            // 2) Groups store
            if (!db.objectStoreNames.contains(GROUPS_STORE)) {
                db.createObjectStore(GROUPS_STORE, {
                    keyPath: 'id', // string id like "household"
                });
            }

            // 3) Categories store (new)
            if (!db.objectStoreNames.contains(CATEGORIES_STORE)) {
                const catStore = db.createObjectStore(CATEGORIES_STORE, {
                    keyPath: 'id', // string id like "groceries"
                });

                // Index to quickly get all categories for a group
                catStore.createIndex('groupIdIndex', 'groupId', { unique: false });
            }
        };

        request.onsuccess = (event) => {
            resolve(event.target.result);
        };

        request.onerror = (event) => {
            reject(`Database error: ${event.target.error}`);
        };
    });
}

/* -------------------- TRANSACTIONS API  -------------------- */

export async function getAllTransactions() {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([TRANSACTION_STORE], 'readonly');
        const store = transaction.objectStore(TRANSACTION_STORE);

        const request = store.getAll();

        request.onsuccess = (event) => {
            resolve(event.target.result);
        };

        request.onerror = (event) => {
            reject(`Failed to get all transactions: ${event.target.error}`);
        };
    });
}

export async function addTransaction(transactionData) {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([TRANSACTION_STORE], 'readwrite');
        const store = transaction.objectStore(TRANSACTION_STORE);

        const request = store.add(transactionData);

        request.onsuccess = (event) => {
            const id = event.target.result;
            resolve({ id, ...transactionData });
        };
        request.onerror = (event) => {
            reject(`Failed to add transaction: ${event.target.error}`);
        };
    });
}

export async function deleteTransactions(ids) {
    const db = await openDatabase();

    return new Promise((resolve, reject) => {
        const transaction = db.transaction([TRANSACTION_STORE], 'readwrite');
        const store = transaction.objectStore(TRANSACTION_STORE);

        const normalizedIds = (ids || []).map((rawId) => Number(rawId));

        for (const id of normalizedIds) {
            store.delete(id);
        }

        transaction.oncomplete = () => {
            resolve();
        };
        transaction.onerror = (event) => {
            reject(`Failed to delete transactions: ${event.target.error}`);
        };
    });
}

export async function clearAllTransactions() {
    const db = await openDatabase();

    return new Promise((resolve, reject) => {
        const transaction = db.transaction([TRANSACTION_STORE], 'readwrite');
        const store = transaction.objectStore(TRANSACTION_STORE);

        const request = store.clear();

        request.onsuccess = () => {
            resolve();
        };

        request.onerror = (event) => {
            reject(`Failed to clear transactions: ${event.target.error}`);
        };
    });
}

/* -------------------- GROUPS API -------------------- */

/**
 * Get all groups from storage.
 */
export async function getAllGroups() {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
        const tx = db.transaction([GROUPS_STORE], 'readonly');
        const store = tx.objectStore(GROUPS_STORE);

        const request = store.getAll();

        request.onsuccess = (event) => {
            resolve(event.target.result || []);
        };

        request.onerror = (event) => {
            reject(`Failed to get all groups: ${event.target.error}`);
        };
    });
}

/**
 * Add or overwrite a group.
 * Group shape: { id: string, name: string, color?: string, icon?: string }
 */
export async function addGroup(group) {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
        const tx = db.transaction([GROUPS_STORE], 'readwrite');
        const store = tx.objectStore(GROUPS_STORE);

        const request = store.put(group); // put = add or update

        request.onsuccess = () => {
            resolve(group);
        };

        request.onerror = (event) => {
            reject(`Failed to add group: ${event.target.error}`);
        };
    });
}

/* -------------------- CATEGORIES API -------------------- */

/**
 * Get all categories from storage.
 */
export async function getAllCategories() {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
        const tx = db.transaction([CATEGORIES_STORE], 'readonly');
        const store = tx.objectStore(CATEGORIES_STORE);

        const request = store.getAll();

        request.onsuccess = (event) => {
            resolve(event.target.result || []);
        };

        request.onerror = (event) => {
            reject(`Failed to get all categories: ${event.target.error}`);
        };
    });
}

/**
 * Add or overwrite a category.
 * Category shape: { id: string, groupId: string, name: string, color?: string, icon?: string }
 */
export async function addCategory(category) {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
        const tx = db.transaction([CATEGORIES_STORE], 'readwrite');
        const store = tx.objectStore(CATEGORIES_STORE);

        const request = store.put(category);

        request.onsuccess = () => {
            resolve(category);
        };

        request.onerror = (event) => {
            reject(`Failed to add category: ${event.target.error}`);
        };
    });
}
