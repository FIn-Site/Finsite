import {
    getAllTransactions,
    addTransaction,
    deleteTransactions,
    clearAllTransactions,
    getAllGroups,
    addGroup,
    getAllCategories,
    addCategory
} from '../storage/storageService.js';

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
            groups: [],
            categories: [],
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
            transactions: [...this.data.transactions],
            groups: [...this.data.groups],
            categories: [...this.data.categories]
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
     * Initialize data from storage (transactions, groups, categories)
     */
    async init() {
        try {
            // Load everything in parallel
            const [storedTransactions, storedGroups, storedCategories] =
                await Promise.all([
                    getAllTransactions(),
                    getAllGroups(),
                    getAllCategories()
                ]);

            const transactions = Array.isArray(storedTransactions)
                ? storedTransactions
                : [];

            let groups = Array.isArray(storedGroups) ? storedGroups : [];
            let categories = Array.isArray(storedCategories)
                ? storedCategories
                : [];

            // If no groups/categories exist yet, seed defaults
            if (groups.length === 0 || categories.length === 0) {
                const { defaultGroups, defaultCategories } =
                    this._getDefaultConfig();

                // Persist defaults
                await Promise.all([
                    ...defaultGroups.map((g) => addGroup(g)),
                    ...defaultCategories.map((c) => addCategory(c))
                ]);

                groups = defaultGroups;
                categories = defaultCategories;
            }

            this.data.transactions = transactions;
            this.data.groups = groups;
            this.data.categories = categories;

            if (!this.data.user) {
                this.data.user = {
                    name: 'Jenner',
                    greeting: 'Good evening'
                };
            }

            this._initialized = true;
            console.log(
                'Model initialized from storage.',
                'Transactions:',
                transactions.length,
                'Groups:',
                groups.length,
                'Categories:',
                categories.length
            );
            return this.getData();
        } catch (error) {
            console.error('Error initializing model data:', error);
            this.data.transactions = [];
            this.data.groups = [];
            this.data.categories = [];
            this._initialized = true;
            return this.getData();
        }
    }

    /**
     * Default configuration for groups and categories.
     * These are just startup defaults and can be changed by the user later.
     */
    _getDefaultConfig() {
        const defaultGroups = [
            { id: 'household', name: 'Household' },
            { id: 'investments', name: 'Investments' },
            { id: 'expenses', name: 'General Expenses' }
        ];

        const defaultCategories = [
            // Household
            { id: 'groceries', groupId: 'household', name: 'Groceries' },
            { id: 'utilities', groupId: 'household', name: 'Utilities' },
            { id: 'fuel', groupId: 'household', name: 'Fuel' },

            // Investments
            { id: 'stocks', groupId: 'investments', name: 'Stocks' },
            { id: 'bonds', groupId: 'investments', name: 'Bonds' },

            // General
            { id: 'dining-out', groupId: 'expenses', name: 'Dining Out' },
            { id: 'shopping', groupId: 'expenses', name: 'Shopping' }
        ];

        return { defaultGroups, defaultCategories };
    }

    /**
     * Add a new transaction (and persist it).
     * Expected shape: { group, category, amount, date, ... }
     */
    async addTransaction(input) {
        const { group = 'expenses', category, amount, date, merchant = '', notes = '', ...rest } =
            input || {};

        const newTx = {
            group,
            category,
            amount: Number(amount),
            date,
            merchant,
            notes,
            ...rest
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
            await deleteTransactions(ids);

            const idSet = new Set(ids.map((rawId) => Number(rawId)));

            this.data.transactions = this.data.transactions.filter(
                (tx) => !idSet.has(Number(tx.id))
            );

            console.log(
                'Transactions deleted. New count:',
                this.data.transactions.length
            );
            return this.getData();
        } catch (error) {
            console.error(
                'Error deleting transactions in FinSiteModel:',
                error
            );
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

    /**
     * Read-only helper for groups.
     */
    getGroups() {
        return [...this.data.groups];
    }

    /**
     * Read-only helper for categories by group.
     * @param {string} groupId
     */
    getCategoriesByGroup(groupId) {
        return this.data.categories.filter(
            (cat) => cat.groupId === groupId
        );
    }
}
