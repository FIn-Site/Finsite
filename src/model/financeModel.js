/**
 * @fileoverview Model layer for FinSite application.
 * Implements incremental aggregation for O(1) dashboard updates.
 * @module financeModel
 */

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
 * FinSite Model - Manages application data and business logic.
 * 
 * Performance Optimization:
 * Instead of O(n) full scans on every dashboard refresh, maintains
 * running aggregates that are updated in O(1) on add/delete operations.
 * 
 * Aggregation Strategy:
 * - Time buckets: Map<"YYYY-MM", totalSpend> for monthly aggregates
 * - Group totals: Map<groupId, totalSpend> for category breakdowns
 * - Cached metrics: Pre-computed thisMonth, lastMonth, sixMonthTotal
 * 
 * @class
 */
export class FinSiteModel {
    /**
     * Initialize the model with empty data structures and aggregation state.
     */
    constructor() {
        this.data = {
            user: null,
            accounts: [],
            transactions: [],
            groups: [],
            categories: [],
            currentView: 'dashboard'
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
            sixMonthTotal: 0
        };
        
        /**
         * Track current month/year for bucket calculations
         */
        this._currentBucketKey = this._getBucketKey(new Date());

        this._initialized = false;

        console.log('FinSiteModel initialized with incremental aggregation');
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
        if (isNaN(d.getTime())) return null;
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        return `${year}-${month}`;
    }

    /**
     * Get the bucket key for "last month" relative to current date.
     * 
     * @private
     * @returns {string} Bucket key in "YYYY-MM" format
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
     * @param {string} key 
     * @param {number} months 
     * @returns {boolean}
     */
    _isWithinLastNMonths(key, months = 6) {
        if (!key) return false;
        const validKeys = new Set(this._getLastNMonthKeys(months));
        return validKeys.has(key);
    }

    // ============================================================
    // AGGREGATE UPDATE METHODS (O(1) operations)
    // ============================================================

    /**
     * Apply a single transaction's delta to aggregates (O(1) operation).
     * 
     * Updates time buckets, group totals, and cached metrics based on
     * the transaction's amount, date, and group.
     * 
     * @private
     * @param {import('../storage/storageService.js').Transaction} tx - Transaction object
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
     * Update cached metrics based on bucket change.
     * 
     * Only updates metrics if the bucket is current month, last month,
     * or within the last 6 months.
     * 
     * @private
     * @param {string} bucketKey - Bucket key in "YYYY-MM" format
     * @param {number} delta - Amount to add/subtract from metrics
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
     * Rebuild all aggregates from scratch.
     * 
     * Clears and recalculates time buckets, group totals, and cached metrics
     * by iterating through all transactions once. O(n) complexity but only
     * called on init and after bulk operations.
     * 
     * @private
     */
    _rebuildAggregates() {
        // Clear existing aggregates
        this._timeBuckets.clear();
        this._groupTotals.clear();
        this._cachedMetrics = { thisMonth: 0, lastMonth: 0, sixMonthTotal: 0 };

        const currentKey = this._getBucketKey(new Date());
        const lastMonthKey = this._getLastMonthKey();
        const validSixMonthKeys = new Set(this._getLastNMonthKeys(6));

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
            if (validSixMonthKeys.has(bucketKey)) {
                this._cachedMetrics.sixMonthTotal += amount;
            }
        }

        console.log('📊 Aggregates rebuilt:', {
            timeBuckets: this._timeBuckets.size,
            groupTotals: this._groupTotals.size,
            metrics: this._cachedMetrics
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
     * Initialize model from storage.
     * 
     * Loads transactions, groups, and categories from IndexedDB.
     * Seeds default groups/categories if none exist.
     * Builds initial aggregates for O(1) dashboard queries.
     * 
     * @async
     * @returns {Promise<Object>} Current data state
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

            // OPTIMIZATION A: Build aggregates once on init
            this._rebuildAggregates();

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
            this._rebuildAggregates();
            this._initialized = true;
            return this.getData();
        }
    }

    /**
     * Get default configuration for groups and categories.
     * 
     * Provides seed data for first-time users. Includes household,
     * investments, and general expense groups with common categories.
     * 
     * @private
     * @returns {{defaultGroups: Array, defaultCategories: Array}} Default configuration
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
     * Add a new transaction and persist to storage.
     * 
     * Performance: O(1) aggregate update instead of O(n) rescan.
     * Transaction is added to in-memory array and aggregates are
     * incrementally updated.
     * 
     * @async
     * @param {Object} input - Transaction data
     * @param {string} [input.group='expenses'] - Group ID
     * @param {string} input.category - Category ID
     * @param {number} input.amount - Transaction amount
     * @param {string} input.date - ISO date string (YYYY-MM-DD)
     * @param {string} [input.merchant=''] - Merchant name
     * @param {string} [input.notes=''] - Additional notes
     * @returns {Promise<import('../storage/storageService.js').Transaction>} Added transaction with ID
     * @throws {Error} If transaction cannot be persisted
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

            // OPTIMIZATION A: Incremental aggregate update (O(1))
            this._applyTransactionDelta(saved, 1);

            console.log('Transaction added:', saved);
            return saved;
        } catch (error) {
            console.error('Error adding transaction in FinSiteModel:', error);
            throw error;
        }
    }

    /**
     * Add multiple transactions in bulk (e.g., CSV import).
     * 
     * Performance: Single aggregate rebuild at end instead of O(k)
     * incremental updates. More efficient for large imports.
     * 
     * @async
     * @param {Array<Object>} transactions - Array of transaction objects
     * @returns {Promise<Array<import('../storage/storageService.js').Transaction>>} Array of saved transactions with IDs
     * @throws {Error} If any transaction fails to persist
     */
    async addTransactionsBulk(transactions) {
        if (!Array.isArray(transactions) || transactions.length === 0) {
            return [];
        }

        const saved = [];
        
        try {
            // Persist each transaction
            for (const input of transactions) {
                const { group = 'expenses', category, amount, date, merchant = '', notes = '', ...rest } = input || {};
                const newTx = {
                    group,
                    category,
                    amount: Number(amount),
                    date,
                    merchant,
                    notes,
                    ...rest
                };
                const savedTx = await addTransaction(newTx);
                saved.push(savedTx);
            }

            // Add all to in-memory list
            this.data.transactions = [...saved, ...this.data.transactions];

            // OPTIMIZATION A: Rebuild aggregates once (not per transaction)
            this._rebuildAggregates();

            console.log(`Bulk import complete: ${saved.length} transactions`);
            return saved;
        } catch (error) {
            console.error('Error in bulk import:', error);
            throw error;
        }
    }

    /**
     * Delete one or more transactions by ID.
     * 
     * Performance: O(k) aggregate updates where k = number of deleted items.
     * Each deleted transaction's amount is decremented from aggregates.
     * 
     * @async
     * @param {Array<string|number>} ids - Array of transaction IDs to delete
     * @returns {Promise<Object>} Updated data state
     * @throws {Error} If deletion fails
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
                (tx) => idSet.has(Number(tx.id))
            );

            // OPTIMIZATION A: Decrement aggregates for deleted items
            for (const tx of toDelete) {
                this._applyTransactionDelta(tx, -1);
            }

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
     * 
     * WARNING: Destructive operation. Also clears all aggregates.
     * 
     * @async
     * @returns {Promise<Object>} Updated data state (empty transactions)
     * @throws {Error} If clear operation fails
     */
    async clearAllTransactions() {
        try {
            await clearAllTransactions();
            this.data.transactions = [];
            
            // OPTIMIZATION A: Clear all aggregates
            this._timeBuckets.clear();
            this._groupTotals.clear();
            this._cachedMetrics = { thisMonth: 0, lastMonth: 0, sixMonthTotal: 0 };
            
            console.log('All transactions cleared in FinSiteModel');
            return this.getData();
        } catch (error) {
            console.error('Error clearing transactions in FinSiteModel:', error);
            throw error;
        }
    }

    /**
     * Get a copy of all transactions.
     * 
     * @returns {Array<import('../storage/storageService.js').Transaction>} Copy of transactions array
     */
    getTransactions() {
        return [...this.data.transactions];
    }

    /**
     * Get a copy of all groups.
     * 
     * @returns {Array<import('../storage/storageService.js').Group>} Copy of groups array
     */
    getGroups() {
        return [...this.data.groups];
    }

    /**
     * Get categories filtered by group ID.
     * 
     * @param {string} groupId - Group ID to filter by
     * @returns {Array<import('../storage/storageService.js').Category>} Array of categories in group
     */
    getCategoriesByGroup(groupId) {
        return this.data.categories.filter(
            (cat) => cat.groupId === groupId
        );
    }

    // ============================================================
    // Dashboard Summary - NOW READS FROM AGGREGATES (O(1))
    // ============================================================

    /**
     * Generate dashboard summary from pre-computed aggregates.
     * 
     * Performance: O(1) read from aggregates, no transaction iteration.
     * Returns data ready for Chart.js visualization.
     * 
     * @returns {Object} Dashboard summary
     * @returns {Object} return.timeSeries - {labels: string[], values: number[]}
     * @returns {Object} return.groupBreakdown - {labels: string[], values: number[]}
     * @returns {Object} return.metrics - {thisMonth, lastMonth, percentChange, sixMonthAvg}
     */
    getDashboardSummary() {
        // Read from aggregates instead of iterating transactions
        const timeSeries = this._getTimeSeriesFromAggregates();
        const groupBreakdown = this._getGroupBreakdownFromAggregates();
        const metrics = this._getMetricsFromAggregates();

        return {
            timeSeries,
            groupBreakdown,
            metrics
        };
    }

    /**
     * Get time series data from pre-computed buckets.
     * 
     * Returns last 6 months of spending with month names as labels.
     * 
     * @private
     * @returns {Object} Time series data for Chart.js
     * @returns {string[]} return.labels - Month names (e.g., ['Jun', 'Jul', 'Aug'])
     * @returns {number[]} return.values - Monthly spending totals
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
     * Get group breakdown from pre-computed totals.
     * 
     * Returns top 5 groups by spending for bar chart display.
     * 
     * @private
     * @returns {Object} Group breakdown data for Chart.js
     * @returns {string[]} return.labels - Group names sorted by spending (descending)
     * @returns {number[]} return.values - Group spending totals
     */
    _getGroupBreakdownFromAggregates() {
        const groupIdToName = {};
        
        // Build group name lookup
        this.data.groups.forEach(g => {
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
     * Get dashboard metrics from cached values.
     * 
     * Calculates percent change and 6-month average from pre-computed data.
     * 
     * @private
     * @returns {Object} Dashboard metrics
     * @returns {number} return.thisMonth - Current month spending
     * @returns {number} return.lastMonth - Last month spending
     * @returns {number} return.percentChange - Month-over-month change percentage
     * @returns {number} return.sixMonthAvg - 6-month average spending
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
            sixMonthAvg: Math.round(sixMonthAvg * 100) / 100
        };
    }

    // ============================================================
    // Dashboard Panel Summary - Dynamic Data for Dashboard Cards
    // ============================================================

    /**
     * Generate dashboard panel summary for stat cards.
     * 
     * Provides data for dashboard cards: total spent, transactions this week,
     * monthly spending comparison, and recent activity.
     * 
     * @returns {Object} Dashboard panel summary
     * @returns {Array} return.recentTransactions - Last 5 transactions
     * @returns {number} return.totalSpentAllTime - Lifetime spending total
     * @returns {number} return.transactionsThisWeek - Count of transactions in last 7 days
     * @returns {number} return.monthlySpendingCurrent - Current month spending
     * @returns {number} return.monthlySpendingLast - Last month spending
     * @returns {number} return.monthlyChangePercent - Month-over-month change %
     * @returns {'up'|'down'|'neutral'} return.monthlyDirection - Spending trend direction
     */
    getDashboardPanelSummary() {
        const transactions = this.data.transactions;
        const now = new Date();
        
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
            monthlyDirection = monthlyChangePercent > 0 ? 'up' : monthlyChangePercent < 0 ? 'down' : 'neutral';
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
            monthlyDirection
        };
    }

    /**
     * Get recent transactions sorted by date descending
     * @param {number} limit - Maximum number of transactions to return
     * @returns {Array} Recent transactions with formatted data
     */
    _getRecentTransactions(limit = 5) {
        const transactions = this.data.transactions;
        
        if (!transactions || transactions.length === 0) {
            return [];
        }

        // Sort by date descending (newest first)
        const sorted = [...transactions].sort((a, b) => {
            const dateA = new Date(a.date);
            const dateB = new Date(b.date);
            return dateB - dateA;
        });

        // Take top N and format for display
        return sorted.slice(0, limit).map(tx => {
            const categoryIcon = this._getCategoryIcon(tx.category || tx.group);
            const relativeDate = this._getRelativeDate(tx.date);
            
            return {
                id: tx.id,
                icon: categoryIcon,
                merchant: tx.merchant || tx.category || 'Transaction',
                amount: Math.abs(Number(tx.amount) || 0),
                date: relativeDate,
                rawDate: tx.date,
                category: tx.category,
                group: tx.group
            };
        });
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
        const transactions = this.data.transactions;
        
        if (!transactions || transactions.length === 0) {
            return 0;
        }

        const now = new Date();
        const sevenDaysAgo = new Date(now);
        sevenDaysAgo.setDate(now.getDate() - 7);
        sevenDaysAgo.setHours(0, 0, 0, 0);

        return transactions.filter(tx => {
            const txDate = new Date(tx.date);
            return txDate >= sevenDaysAgo && txDate <= now;
        }).length;
    }

    /**
     * Get icon for category/group
     * @param {string} categoryOrGroup 
     * @returns {string} Emoji icon
     */
    _getCategoryIcon(categoryOrGroup) {
        const iconMap = {
            // Categories
            'groceries': '🛒',
            'utilities': '💡',
            'fuel': '⛽',
            'stocks': '📈',
            'bonds': '📊',
            'dining-out': '🍽️',
            'shopping': '🛍️',
            // Groups
            'household': '🏠',
            'investments': '💰',
            'expenses': '💳',
            // Default
            'uncategorized': '📝'
        };

        const key = (categoryOrGroup || 'uncategorized').toLowerCase();
        return iconMap[key] || '💸';
    }

    /**
     * Get relative date string (Today, Yesterday, or formatted date)
     * @param {string|Date} date 
     * @returns {string} Relative date string
     */
    _getRelativeDate(date) {
        const txDate = new Date(date);
        const now = new Date();
        
        // Reset time for comparison
        const txDay = new Date(txDate.getFullYear(), txDate.getMonth(), txDate.getDate());
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);

        if (txDay.getTime() === today.getTime()) {
            return 'Today';
        } else if (txDay.getTime() === yesterday.getTime()) {
            return 'Yesterday';
        } else {
            // Format as "Mon DD" or "Mon DD, YYYY" if different year
            const options = { month: 'short', day: 'numeric' };
            if (txDate.getFullYear() !== now.getFullYear()) {
                options.year = 'numeric';
            }
            return txDate.toLocaleDateString('en-US', options);
        }
    }
}
