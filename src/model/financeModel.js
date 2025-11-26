import {getAllTransactions, addTransaction, deleteTransactions, clearAllTransactions} from '../storage/storageService.js';

/**
 * FinSiteModel - Manages application data and business logic
 * Handles data operations, API calls, and state management
 */
export class FinSiteModel {
    constructor() {
           this.data = {
            user: null,
            accounts: [],
            transactions: [],
            currentView: 'dashboard'
        };

        this._initialized = false;

        console.log('FinSiteModel initialized');
    }

    /**
     * Get current application data
     * @returns {Object} Current data state
     */
    getData() {
        return {
            ...this.data,
            accounts: [...this.data.accounts],
            transactions: [...this.data.transactions]
        };  
    }

    /**
     * Update application data
     * @param {Object} newData - New data to merge
     */
    updateData(newData) {
        this.data = { ...this.data, ...newData };
        console.log('Model data updated:', this.data);
    }

    /**
     * Initialize default data
     */
    async init() {
    try {
        const storedTransactions = await getAllTransactions();
        const transactions = Array.isArray(storedTransactions) ? storedTransactions : [];

        this.data.transactions = transactions;

        if (!this.data.user) {
            this.data.user = {
                name: 'Jenner',
                greeting: 'Good evening'
            };
        }

        this._initialized = true;
        console.log('Model initialized from storage. Count:', transactions.length);
        return this.getData();
    } catch (error) {
            console.error('Error initializing model data:', error);
            this.data.transactions = [];
            this._initialized = true;
            return this.getData();
        }
    }

        /**
     * Add a new transaction (and persist it).
     * Expected shape: { group, category, amount, date, ... }
     */
    async addTransaction(input) {
        const { group = 'manual', category, amount, date, ...rest } = input || {};

        const newTx = {
            group,
            category,
            amount: Number(amount),
            date,
            ...rest,
        };

        try {
            // Persist to IndexedDB
            const saved = await addTransaction(newTx);

            // Keep newest on top
            this.data.transactions = [saved, ...this.data.transactions];

            console.log('Transaction added:', saved);
            return saved;
        } catch (error) {
            console.error('Error adding transaction in FinSiteModel:', error);
            throw error;
        }
    }

    /**
     * Delete one or more transactions by id (and persist).
     * @param {Array<string|number>} ids
     */
    async deleteTransactions(ids) {
        if (!Array.isArray(ids) || ids.length === 0) {
            return this.getData();
        }

        try {
            // 1) remove from IndexedDB
            await deleteTransactions(ids);

            const idSet = new Set(ids.map((rawId) => Number(rawId)));

            // 2) update in-memory copy
            this.data.transactions = this.data.transactions.filter(
                (tx) => !idSet.has(Number(tx.id))
            );

            console.log('Transactions deleted. New count:', this.data.transactions.length);
            return this.getData();
        } catch (error) {
            console.error('Error deleting transactions in FinSiteModel:', error);
            throw error;
        }
    }

    /**
     * Clear all transactions from storage and memory.
     */
    async clearAllTransactions() {
        try {
            await clearAllTransactions();
            this.data.transactions = [];
            console.log('All transactions cleared in FinSiteModel');
            return this.getData();
        } catch (error) {
            console.error('Error clearing transactions in FinSiteModel:', error);
            throw error;
        }
    }

    /**
     * Read-only helper just for transactions.
     */
    getTransactions() {
        return [...this.data.transactions];
    }

}