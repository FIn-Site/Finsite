/**
 * Category aggregation helpers for FinSite.
 * Pure functions that compute category spend, group breakdowns, and
 * transactions per group without mutating inputs.
 */

/**
 * Build a Map of categoryId -> total spent (absolute amounts).
 * @param {Array} transactions
 * @returns {Map<string, number>}
 */
export function calculateCategoryTotals(transactions = []) {
    const totals = new Map();
    for (const tx of transactions) {
        const categoryId = tx?.category;
        if (!categoryId) continue;
        const amount = Math.abs(Number(tx.amount) || 0);
        totals.set(categoryId, (totals.get(categoryId) || 0) + amount);
    }
    return totals;
}

/**
 * Attach computed amounts to categories.
 * @param {Array} categories
 * @param {Map<string, number>} totals
 * @returns {Array}
 */
export function attachCategoryAmounts(categories = [], totals = new Map()) {
    return categories.map((cat) => ({
        ...cat,
        amount: totals.get(cat.id) || 0,
    }));
}

/**
 * Get categories that belong to a group (handles custom groups via categoryIds).
 * @param {Object} group
 * @param {Array} categoriesWithAmounts
 * @returns {Array}
 */
export function getCategoriesForGroup(group, categoriesWithAmounts = []) {
    if (!group) return [];

    if (group.isCustom && Array.isArray(group.categoryIds)) {
        const idSet = new Set(group.categoryIds);
        return categoriesWithAmounts.filter((cat) => idSet.has(cat.id));
    }

    return categoriesWithAmounts.filter((cat) => cat.groupId === group.id);
}

/**
 * Filter transactions belonging to a set of category IDs.
 * @param {Array} transactions
 * @param {Set<string>} categoryIdSet
 * @returns {Array}
 */
export function filterTransactionsByCategory(transactions = [], categoryIdSet = new Set()) {
    if (!categoryIdSet.size) return [];
    return transactions.filter((tx) => categoryIdSet.has(tx.category));
}

/**
 * Build a single group breakdown with categories, transactions, and totals.
 * @param {Object} params
 * @param {Object[]} params.groups
 * @param {Object[]} params.categories
 * @param {Object[]} params.transactions
 * @param {string} params.groupId
 * @returns {Object|null}
 */
export function buildGroupBreakdown({ groups = [], categories = [], transactions = [], groupId }) {
    const group = groups.find((g) => g.id === groupId);
    if (!group) return null;

    const safeTransactions = Array.isArray(transactions) ? transactions : [];
    if (safeTransactions.length === 0) {
        return {
            groupId: group.id,
            groupName: group.name || 'Group',
            groupIsCustom: Boolean(group.isCustom),
            categories: [],
            transactions: [],
            totalSpent: 0,
        };
    }

    const totals = calculateCategoryTotals(safeTransactions);
    const categoriesWithAmounts = attachCategoryAmounts(categories, totals);
    return buildGroupBreakdownFromPrepared({ group, categoriesWithAmounts, transactions: safeTransactions });
}

/**
 * Build group breakdowns for all groups in the provided order.
 * @param {Object} params
 * @param {Object[]} params.groups
 * @param {Object[]} params.categories
 * @param {Object[]} params.transactions
 * @returns {{ breakdowns: Object[], categoriesWithAmounts: Object[] }}
 */
export function buildCategoryAggregates({ groups = [], categories = [], transactions = [] }) {
    const safeTransactions = Array.isArray(transactions) ? transactions : [];

    if (safeTransactions.length === 0) {
        const emptyBreakdowns = groups.filter(Boolean).map((group) => ({
            groupId: group.id,
            groupName: group.name || 'Group',
            groupIsCustom: Boolean(group.isCustom),
            categories: [],
            transactions: [],
            totalSpent: 0,
        }));
        return { breakdowns: emptyBreakdowns, categoriesWithAmounts: [] };
    }

    const totals = calculateCategoryTotals(safeTransactions);
    const categoriesWithAmounts = attachCategoryAmounts(categories, totals);

    const breakdowns = groups.map((group) => buildGroupBreakdownFromPrepared({
        group,
        categoriesWithAmounts,
        transactions: safeTransactions,
    })).filter(Boolean);

    return { breakdowns, categoriesWithAmounts };
}

/**
 * Internal helper that assumes amounts are already attached to categories.
 * @param {Object} params
 * @param {Object} params.group
 * @param {Object[]} params.categoriesWithAmounts
 * @param {Object[]} params.transactions
 * @returns {Object|null}
 */
export function buildGroupBreakdownFromPrepared({ group, categoriesWithAmounts = [], transactions = [] }) {
    if (!group) return null;

    const groupCategories = getCategoriesForGroup(group, categoriesWithAmounts);
    const categoryIdSet = new Set(groupCategories.map((c) => c.id));
    const groupTransactions = filterTransactionsByCategory(transactions, categoryIdSet);
    const totalSpent = groupCategories.reduce((sum, cat) => sum + (cat.amount || 0), 0);

    return {
        groupId: group.id,
        groupName: group.name || 'Group',
        groupIsCustom: Boolean(group.isCustom),
        categories: groupCategories,
        transactions: groupTransactions,
        totalSpent,
    };
}
