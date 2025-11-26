const DB_NAME = 'finsiteDB';
const DB_VERSION = 1;
const STORE_NAME = 'transactions';

function openDatabase() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event) => {
            const db = event.target.result;

            if(!db.objectStoreNames.contains(STORE_NAME)) {
                const store = db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true});

                store.createIndex('groupIndex', 'group', {unique: false});
                store.createIndex('categoryIndex', 'category', {unique: false});
                store.createIndex('amountIndex','amount', {unique: false});
                store.createIndex('dateIndex', 'date', {unique: false});

            }
        }

        request.onsuccess = (event) => {
            resolve(event.target.result);
        };

        request.onerror = (event) => {
            reject(`Database error: ${event.target.error}`);
        };

    });

}

export async function getAllTransactions() {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);

        const request = store.getAll();

        request.onsuccess = (event) => {
            resolve(event.target.result);
        }

        request.onerror = (event) => {
            reject(`Failed to get all transactions: ${event.target.error}`);
        }
    });
}

export async function addTransaction(transactionData) {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);

        const request = store.add(transactionData);

        request.onsuccess = (event) => {
            const id = event.target.result;
            resolve({ id, ...transactionData });
        }
        request.onerror = (event) => {
            reject(`Failed to add transaction: ${event.target.error}`);
        }
    });
}