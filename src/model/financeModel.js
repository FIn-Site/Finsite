import {
    getAllTransactions,
    addTransaction,
    deleteTransactions,
    clearAllTransactions,
    getAllGroups,
    addGroup,
    deleteGroup,
    getAllCategories,
    addCategory,
    updateCategoriesBatch,
} from '../storage/storageService.js';
import {
    buildCategoryAggregates,
    buildGroupBreakdown,
} from '../utils/categoryAggregator.js';
import { createPrefixedLogger } from '../utils/debugService.js';

// Prefixed logger for model layer
const log = createPrefixedLogger('[Model]');

/**
 * FinSiteModel - Manages application data and business logic
 * Handles data operations, API calls, and state management
 *
 *
 * Instead of O(n) full scans on every dashboard refresh, we maintain
 * running aggregates that are updated in O(1) on add/delete operations.
 */
export class FinSiteModel {
    constructor() {
        this.data = {
            user: null,
            accounts: [],
            transactions: [],
            groups: [],
            categories: [],
            currentView: 'dashboard',
        };

        // ============================================================
        // INCREMENTAL AGGREGATION STATE
        // These structures mirror transactions in aggregated form
        // ============================================================

        /**
         * Time-based aggregates: Map<bucketKey, totalSpend>
         * Key format: "YYYY-MM" (e.g., "2025-12")
         */
        this._timeBuckets = new Map();

        /**
         * Group-based aggregates: Map<groupId, totalSpend>
         */
        this._groupTotals = new Map();

        /**
         * Cached metrics derived from aggregates
         */
        this._cachedMetrics = {
            thisMonth: 0,
            lastMonth: 0,
            sixMonthTotal: 0,
        };

        /**
         * Cached Set of last-N-month keys for O(1) lookups
         * Rebuilt once per _rebuildAggregates() instead of per-transaction
         * @type {Set<string>|null}
         */
        this._lastNMonthKeysCache = null;

        log('FinSiteModel initialized with incremental aggregation');
    }

    // ============================================================
    // BUCKET KEY HELPERS
    // ============================================================

    /**
     * Generate a bucket key from a date
     * @param {Date|string} date
     * @returns {string} "YYYY-MM" format
     */
    _getBucketKey(date) {
        const d = date instanceof Date ? date : new Date(date);
        if (Number.isNaN(d.getTime())) return null;
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        return `${year}-${month}`;
    }

    /**
     * Get the bucket key for "last month" relative to current date
     */
    _getLastMonthKey() {
        const now = new Date();
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        return this._getBucketKey(lastMonth);
    }

    /**
     * Get an array of bucket keys for the last N months
     * @param {number} months
     * @returns {string[]} Array of "YYYY-MM" keys, oldest first
     */
    _getLastNMonthKeys(months = 6) {
        const keys = [];
        const now = new Date();
        for (let i = months - 1; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            keys.push(this._getBucketKey(d));
        }
        return keys;
    }

    /**
     * Check if a bucket key is within the last N months
     * Uses pre-computed cache for O(1) lookup instead of rebuilding Set each call
     * @param {string} key
     * @returns {boolean}
     */
    _isWithinLastNMonths(key) {
        if (!key) return false;
        // Use cached Set if available, otherwise fall back to computation
        if (this._lastNMonthKeysCache) {
            return this._lastNMonthKeysCache.has(key);
        }
        // Fallback for edge cases before cache is built
        const validKeys = new Set(this._getLastNMonthKeys(6));
        return validKeys.has(key);
    }

    // ============================================================
    // AGGREGATE UPDATE METHODS (O(1) operations)
    // ============================================================

    /**
     * Apply a single transaction's delta to aggregates
     * @param {Object} tx - Transaction object
     * @param {number} sign - 1 for add, -1 for remove
     */
    _applyTransactionDelta(tx, sign = 1) {
        const amount = Math.abs(Number(tx.amount) || 0) * sign;
        const bucketKey = this._getBucketKey(tx.date);
        const groupId = tx.group || 'uncategorized';

        // Update time bucket
        if (bucketKey) {
            const current = this._timeBuckets.get(bucketKey) || 0;
            this._timeBuckets.set(bucketKey, Math.max(0, current + amount));
        }

        // Update group total
        const groupCurrent = this._groupTotals.get(groupId) || 0;
        this._groupTotals.set(groupId, Math.max(0, groupCurrent + amount));

        // Update cached metrics
        this._updateCachedMetrics(bucketKey, amount);
    }

    /**
     * Update cached metrics based on bucket change
     * @param {string} bucketKey
     * @param {number} delta
     */
    _updateCachedMetrics(bucketKey, delta) {
        const currentKey = this._getBucketKey(new Date());
        const lastMonthKey = this._getLastMonthKey();

        if (bucketKey === currentKey) {
            this._cachedMetrics.thisMonth = Math.max(0, this._cachedMetrics.thisMonth + delta);
        }

        if (bucketKey === lastMonthKey) {
            this._cachedMetrics.lastMonth = Math.max(0, this._cachedMetrics.lastMonth + delta);
        }

        if (this._isWithinLastNMonths(bucketKey, 6)) {
            this._cachedMetrics.sixMonthTotal = Math.max(0, this._cachedMetrics.sixMonthTotal + delta);
        }
    }

    /**
     * Rebuild all aggregates from scratch (used on init and bulk ops)
     * O(n) but only called once per bulk operation
     * Also caches the last-N-month key Set for O(1) lookups in _isWithinLastNMonths
     */
    _rebuildAggregates() {
        // Clear existing aggregates
        this._timeBuckets.clear();
        this._groupTotals.clear();
        this._cachedMetrics = { thisMonth: 0, lastMonth: 0, sixMonthTotal: 0 };

        const currentKey = this._getBucketKey(new Date());
        const lastMonthKey = this._getLastMonthKey();

        // Cache the last-N-month keys Set for O(1) lookups
        this._lastNMonthKeysCache = new Set(this._getLastNMonthKeys(6));

        // Single pass through all transactions
        for (const tx of this.data.transactions) {
            const amount = Math.abs(Number(tx.amount) || 0);
            const bucketKey = this._getBucketKey(tx.date);
            const groupId = tx.group || 'uncategorized';

            // Time bucket
            if (bucketKey) {
                this._timeBuckets.set(bucketKey, (this._timeBuckets.get(bucketKey) || 0) + amount);
            }

            // Group total
            this._groupTotals.set(groupId, (this._groupTotals.get(groupId) || 0) + amount);

            // Cached metrics
            if (bucketKey === currentKey) {
                this._cachedMetrics.thisMonth += amount;
            }
            if (bucketKey === lastMonthKey) {
                this._cachedMetrics.lastMonth += amount;
            }
            if (this._lastNMonthKeysCache.has(bucketKey)) {
                this._cachedMetrics.sixMonthTotal += amount;
            }
        }

        log('📊 Aggregates rebuilt:', {
            timeBuckets: this._timeBuckets.size,
            groupTotals: this._groupTotals.size,
            metrics: this._cachedMetrics,
        });
    }

    // ============================================================
    // ORIGINAL PUBLIC API (unchanged signatures)
    // ============================================================

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
            categories: [...this.data.categories],
        };
    }

    /**
     * Update application data
     * @param {Object} newData - New data to merge
     */
    updateData(newData) {
        this.data = { ...this.data, ...newData };
        log('Model data updated:', this.data);
    }

    /**
     * Initialize data from storage (transactions, groups, categories)
     */
    async init() {
        try {
            // Load everything in parallel
            const [storedTransactions, storedGroups, storedCategories] = await Promise.all([
                getAllTransactions(),
                getAllGroups(),
                getAllCategories(),
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
                const { defaultGroups, defaultCategories } = this._getDefaultConfig();

                // Persist defaults
                await Promise.all([
                    ...defaultGroups.map((g) => addGroup(g)),
                    ...defaultCategories.map((c) => addCategory(c)),
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
                    greeting: 'Good evening',
                };
            }

            // OPTIMIZATION A: Build aggregates once on init
            this._rebuildAggregates();

            log(
                'Model initialized from storage.',
                'Transactions:',
                transactions.length,
                'Groups:',
                groups.length,
                'Categories:',
                categories.length,
            );
            return this.getData();
        } catch (error) {
            console.error('Error initializing model data:', error);
            this.data.transactions = [];
            this.data.groups = [];
            this.data.categories = [];
            this._rebuildAggregates();
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
            { id: 'expenses', name: 'General Expenses' },
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
            { id: 'shopping', groupId: 'expenses', name: 'Shopping' },
        ];

        return { defaultGroups, defaultCategories };
    }

    /**
     * Expose default config for consumers that need reference data
     * without duplicating constants in the view layer.
     */
    getDefaultConfig() {
        return this._getDefaultConfig();
    }

    /**
     * Add a new transaction (and persist it).
     * OPTIMIZATION A: O(1) aggregate update instead of O(n) rescan
     * Expected shape: { group, category, amount, date, ... }
     * @throws {Error} If amount or date are invalid
     */
    async addTransaction(input) {
        // Validate and normalize input (same pipeline as bulk)
        const newTx = this._validateTransaction(input);

        try {
            // Persist to IndexedDB
            const saved = await addTransaction(newTx);

            // Keep newest on top
            this.data.transactions = [saved, ...this.data.transactions];

            // OPTIMIZATION A: Incremental aggregate update (O(1))
            this._applyTransactionDelta(saved, 1);

            log('Transaction added:', saved);
            return saved;
        } catch (error) {
            console.error('Error adding transaction in FinSiteModel:', error);
            throw error;
        }
    }

    /**
     * Add multiple transactions in bulk (e.g., CSV import)
     * OPTIMIZATION A: Single pass through new items, one rebuild at end
     * @param {Array} transactions - Array of transaction objects
     * @returns {{ saved: Array, skipped: Array }} Saved and skipped transactions
     */
    async addTransactionsBulk(transactions) {
        if (!Array.isArray(transactions) || transactions.length === 0) {
            return { saved: [], skipped: [] };
        }

        const saved = [];
        const skipped = [];

        try {
            // Validate and persist each transaction
            for (const input of transactions) {
                try {
                    const validatedTx = this._validateTransaction(input);
                    const savedTx = await addTransaction(validatedTx);
                    saved.push(savedTx);
                } catch (validationError) {
                    // Skip invalid transactions but continue with valid ones
                    skipped.push({ input, error: validationError.message });
                    log('Skipping invalid transaction:', input, validationError.message);
                }
            }

            // Add all valid transactions to in-memory list
            if (saved.length > 0) {
                this.data.transactions = [...saved, ...this.data.transactions];
                // OPTIMIZATION A: Rebuild aggregates once (not per transaction)
                this._rebuildAggregates();
            }

            log(`Bulk import complete: ${saved.length} saved, ${skipped.length} skipped`);
            return { saved, skipped };
        } catch (error) {
            console.error('Error in bulk import:', error);
            throw error;
        }
    }

    /**
     * Delete one or more transactions by id (and persist).
     * OPTIMIZATION A: O(k) aggregate update where k = number of deleted items
     * @param {Array<string|number>} ids
     */
    async deleteTransactions(ids) {
        if (!Array.isArray(ids) || ids.length === 0) {
            return this.getData();
        }

        try {
            await deleteTransactions(ids);

            const idSet = new Set(ids.map((rawId) => Number(rawId)));

            // Find transactions being deleted to update aggregates
            const toDelete = this.data.transactions.filter(
                (tx) => idSet.has(Number(tx.id)),
            );

            // OPTIMIZATION A: Decrement aggregates for deleted items
            for (const tx of toDelete) {
                this._applyTransactionDelta(tx, -1);
            }

            this.data.transactions = this.data.transactions.filter(
                (tx) => !idSet.has(Number(tx.id)),
            );

            log(
                'Transactions deleted. New count:',
                this.data.transactions.length,
            );
            return this.getData();
        } catch (error) {
            console.error(
                'Error deleting transactions in FinSiteModel:',
                error,
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

            // OPTIMIZATION A: Clear all aggregates
            this._timeBuckets.clear();
            this._groupTotals.clear();
            this._cachedMetrics = { thisMonth: 0, lastMonth: 0, sixMonthTotal: 0 };
            this._lastNMonthKeysCache = null;

            log('All transactions cleared in FinSiteModel');
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
     * Read-only helper for all categories.
     */
    getCategories() {
        return [...this.data.categories];
    }

    /**
     * Get category aggregates (categories with amounts + group breakdowns).
     * @returns {{ breakdowns: Object[], categoriesWithAmounts: Object[] }}
     */
    getCategoryAggregates() {
        return buildCategoryAggregates({
            groups: this.data.groups,
            categories: this.data.categories,
            transactions: this.data.transactions,
        });
    }

    /**
     * Get a single group's breakdown (categories, transactions, totals).
     * @param {string} groupId
     * @returns {Object|null}
     */
    getCategoryBreakdownByGroup(groupId) {
        if (!groupId) return null;
        return buildGroupBreakdown({
            groups: this.data.groups,
            categories: this.data.categories,
            transactions: this.data.transactions,
            groupId,
        });
    }

    /**
     * Read-only helper for categories by group.
     * @param {string} groupId
     */
    getCategoriesByGroup(groupId) {
        const group = this.data.groups.find((g) => g.id === groupId);

        // Custom groups may store categoryIds instead of groupId
        if (group?.isCustom && Array.isArray(group.categoryIds)) {
            const idSet = new Set(group.categoryIds);
            return this.data.categories.filter((cat) => idSet.has(cat.id));
        }

        return this.data.categories.filter((cat) => cat.groupId === groupId);
    }

    /**
     * Create or update a group.
     * @param {Object} group - { id, name, isCustom?, categoryIds? }
     */
    async addGroup(group) {
        const safeGroup = group || {};
        const existingIndex = this.data.groups.findIndex((g) => g.id === safeGroup.id);

        await addGroup(safeGroup);

        if (existingIndex >= 0) {
            this.data.groups.splice(existingIndex, 1, safeGroup);
        } else {
            this.data.groups = [...this.data.groups, safeGroup];
        }

        return safeGroup;
    }

    /**
     * Create or update a category.
     * @param {Object} category - { id, groupId, name, ... }
     */
    async addCategory(category) {
        const safeCategory = category || {};
        const existingIndex = this.data.categories.findIndex((c) => c.id === safeCategory.id);

        await addCategory(safeCategory);

        if (existingIndex >= 0) {
            this.data.categories.splice(existingIndex, 1, safeCategory);
        } else {
            this.data.categories = [...this.data.categories, safeCategory];
        }

        return safeCategory;
    }

    /**
     * Delete a group and safely update dependent data.
     * Categories tied to the group are reassigned to 'uncategorized'.
     * Transactions remain but keep their original group for history.
     * Uses batched category updates for better performance and atomicity.
     * @param {string} groupId
     */
    async deleteGroup(groupId) {
        if (!groupId) return this.getData();

        // Block deletion of system groups (uncategorized is internal)
        if (groupId === 'uncategorized') {
            log('Cannot delete system group: uncategorized');
            return this.getData();
        }

        const group = this.data.groups.find((g) => g.id === groupId);

        // Ensure an 'uncategorized' group exists for orphaned categories
        // Mark as system group so it won't appear in the UI
        let uncategorizedGroup = this.data.groups.find((g) => g.id === 'uncategorized');
        if (!uncategorizedGroup) {
            uncategorizedGroup = { id: 'uncategorized', name: 'Uncategorized', isSystem: true, isCustom: false };
            await addGroup(uncategorizedGroup);
            this.data.groups = [...this.data.groups, uncategorizedGroup];
        }

        // Identify categories that need reassignment
        const idSet = group?.isCustom && Array.isArray(group.categoryIds)
            ? new Set(group.categoryIds)
            : null;

        const categoriesToUpdate = [];
        const updatedCategories = [];

        for (const cat of this.data.categories) {
            const belongsToCustom = idSet ? idSet.has(cat.id) : false;
            if (cat.groupId === groupId || belongsToCustom) {
                const updated = { ...cat, groupId: 'uncategorized' };
                categoriesToUpdate.push(updated);
                updatedCategories.push(updated);
            } else {
                updatedCategories.push(cat);
            }
        }

        try {
            // Batch update categories in storage (single operation)
            if (categoriesToUpdate.length > 0) {
                await updateCategoriesBatch(categoriesToUpdate);
            }

            // Delete the group from storage
            await deleteGroup(groupId);

            // Update in-memory state only after successful persistence
            this.data.groups = this.data.groups.filter((g) => g.id !== groupId);
            this.data.categories = updatedCategories;

            log(`Group '${groupId}' deleted, ${categoriesToUpdate.length} categories reassigned`);
        } catch (error) {
            console.error(`Error deleting group '${groupId}':`, error);
            throw error;
        }

        return this.getData();
    }

    // ============================================================
    // Dashboard Summary - NOW READS FROM AGGREGATES (O(1))
    // ============================================================

    /**
     * Generate dashboard summary from pre-computed aggregates
     * OPTIMIZATION A: Pure read from aggregates, no transaction iteration
     * @returns {Object} Dashboard summary with timeSeries, groupBreakdown, metrics
     */
    getDashboardSummary() {
    // Read from aggregates instead of iterating transactions
        const timeSeries = this._getTimeSeriesFromAggregates();
        const groupBreakdown = this._getGroupBreakdownFromAggregates();
        const metrics = this._getMetricsFromAggregates();

        return {
            timeSeries,
            groupBreakdown,
            metrics,
        };
    }

    /**
     * Get time series data from pre-computed buckets
     * @returns {Object} { labels: string[], values: number[] }
     */
    _getTimeSeriesFromAggregates() {
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
            'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const keys = this._getLastNMonthKeys(6);

        const labels = [];
        const values = [];

        for (const key of keys) {
            // Parse month from key "YYYY-MM"
            const month = parseInt(key.split('-')[1], 10) - 1;
            labels.push(monthNames[month]);
            values.push(Math.round((this._timeBuckets.get(key) || 0) * 100) / 100);
        }

        return { labels, values };
    }

    /**
     * Get group breakdown from pre-computed totals
     * @returns {Object} { labels: string[], values: number[] }
     */
    _getGroupBreakdownFromAggregates() {
        const groupIdToName = {};

        // Build group name lookup
        this.data.groups.forEach((g) => {
            groupIdToName[g.id] = g.name;
        });

        // Convert map to sorted array
        const entries = [];
        for (const [groupId, total] of this._groupTotals) {
            if (total > 0) {
                const name = groupIdToName[groupId] || groupId;
                entries.push([name, total]);
            }
        }

        // Sort by total descending and take top 5
        entries.sort((a, b) => b[1] - a[1]);
        const top5 = entries.slice(0, 5);

        if (top5.length === 0) {
            return { labels: ['No Data'], values: [0] };
        }

        const labels = top5.map(([name]) => name);
        const values = top5.map(([, total]) => Math.round(total * 100) / 100);

        return { labels, values };
    }

    /**
     * Get metrics from cached values
     * @returns {Object} { thisMonth, lastMonth, percentChange, sixMonthAvg }
     */
    _getMetricsFromAggregates() {
        const { thisMonth, lastMonth, sixMonthTotal } = this._cachedMetrics;

        // Calculate percent change
        let percentChange = 0;
        if (lastMonth > 0) {
            percentChange = ((thisMonth - lastMonth) / lastMonth) * 100;
        } else if (thisMonth > 0) {
            percentChange = 100;
        }

        // 6-month average
        const sixMonthAvg = sixMonthTotal / 6;

        return {
            thisMonth: Math.round(thisMonth * 100) / 100,
            lastMonth: Math.round(lastMonth * 100) / 100,
            percentChange: Math.round(percentChange * 100) / 100,
            sixMonthAvg: Math.round(sixMonthAvg * 100) / 100,
        };
    }

    // ============================================================
    // Dashboard Panel Summary - Dynamic Data for Dashboard Cards
    // ============================================================

    /**
     * Generate dashboard panel summary with real transaction data
     * Used for the dashboard stat cards and recent activity section
     * @returns {Object} Dashboard panel summary
     */
    getDashboardPanelSummary() {
        const { transactions } = this.data;

        // Calculate recent transactions (max 5, sorted desc by date)
        const recentTransactions = this._getRecentTransactions(5);

        // Calculate total spent all time (only 'spend' transactions, exclude income)
        const totalSpentAllTime = this._calculateTotalSpent(transactions);

        // Calculate transactions this week (last 7 days rolling window)
        const transactionsThisWeek = this._countTransactionsThisWeek();

        // Monthly spending current (from cached metrics)
        const monthlySpendingCurrent = this._cachedMetrics.thisMonth;

        // Monthly spending last month
        const monthlySpendingLast = this._cachedMetrics.lastMonth;

        // Calculate monthly change percent and direction
        let monthlyChangePercent = 0;
        let monthlyDirection = 'neutral';

        if (monthlySpendingLast > 0) {
            monthlyChangePercent = ((monthlySpendingCurrent - monthlySpendingLast) / monthlySpendingLast) * 100;

            if (monthlyChangePercent > 0) {
                monthlyDirection = 'up';
            } else if (monthlyChangePercent < 0) {
                monthlyDirection = 'down';
            } else {
                monthlyDirection = 'neutral';
            }
        } else if (monthlySpendingCurrent > 0) {
            monthlyChangePercent = 100;
            monthlyDirection = 'up';
        }

        return {
            recentTransactions,
            totalSpentAllTime: Math.round(totalSpentAllTime * 100) / 100,
            transactionsThisWeek,
            monthlySpendingCurrent: Math.round(monthlySpendingCurrent * 100) / 100,
            monthlySpendingLast: Math.round(monthlySpendingLast * 100) / 100,
            monthlyChangePercent: Math.round(monthlyChangePercent * 100) / 100,
            monthlyDirection,
        };
    }

    /**
     * Get recent transactions sorted by date descending
     * Returns raw transaction data - view layer handles formatting (icons, relative dates)
     * @param {number} limit - Maximum number of transactions to return
     * @returns {Array} Recent transactions with raw data
     */
    _getRecentTransactions(limit = 5) {
        const { transactions } = this.data;

        if (!transactions || transactions.length === 0) {
            return [];
        }

        // Sort by date descending (newest first)
        const sorted = [...transactions].sort((a, b) => {
            const dateA = new Date(a.date);
            const dateB = new Date(b.date);
            return dateB - dateA;
        });

        // Return raw transaction data - view layer formats for display
        return sorted.slice(0, limit).map((tx) => ({
            id: tx.id,
            merchant: tx.merchant || '',
            amount: Math.abs(Number(tx.amount) || 0),
            date: tx.date,
            category: tx.category,
            group: tx.group,
        }));
    }

    /**
     * Calculate total spent from all transactions
     * @param {Array} transactions
     * @returns {number} Total spent amount
     */
    _calculateTotalSpent(transactions) {
        if (!transactions || transactions.length === 0) {
            return 0;
        }

        return transactions.reduce((total, tx) => {
            // Only count spending (positive amounts or amounts not marked as income)
            const amount = Math.abs(Number(tx.amount) || 0);
            // For now, count all transactions as spending
            // If you have a type field, you could filter: tx.type !== 'income'
            return total + amount;
        }, 0);
    }

    /**
     * Count transactions in the last 7 days (rolling window)
     * @returns {number} Count of transactions this week
     */
    _countTransactionsThisWeek() {
        const { transactions } = this.data;

        if (!transactions || transactions.length === 0) {
            return 0;
        }

        const now = new Date();
        const sevenDaysAgo = new Date(now);
        sevenDaysAgo.setDate(now.getDate() - 7);
        sevenDaysAgo.setHours(0, 0, 0, 0);

        return transactions.filter((tx) => {
            const txDate = new Date(tx.date);
            return txDate >= sevenDaysAgo && txDate <= now;
        }).length;
    }
}
