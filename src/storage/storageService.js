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
            reject(`Database error: ${event.target.errorCode}`);
        };

    });

}