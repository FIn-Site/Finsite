/**
 * formatters.js - View/display formatting utilities
 * 
 * These functions convert raw model data into human-readable formats.
 * Moved out of FinSiteModel to maintain MVC separation:
 * - Model exposes raw data (ids, keys, timestamps)
 * - Formatters transform for display (emojis, relative dates)
 * 
 * This separation improves:
 * - Portability: Model can be used in non-UI contexts (CLI, API)
 * - Localization: Formatters can be swapped for i18n versions
 * - Testability: Model tests don't depend on display logic
 */

/**
 * Icon mapping for categories and groups
 * @type {Object<string, string>}
 */
const CATEGORY_ICONS = {
    // Categories
    groceries: '🛒',
    utilities: '💡',
    fuel: '⛽',
    stocks: '📈',
    bonds: '📊',
    'dining-out': '🍽️',
    shopping: '🛍️',
    // Groups
    household: '🏠',
    investments: '💰',
    expenses: '💳',
    // Default
    uncategorized: '📝',
};

/**
 * Default icon when category/group not found in mapping
 * @type {string}
 */
const DEFAULT_ICON = '💸';

/**
 * Get emoji icon for a category or group
 * @param {string} categoryOrGroup - Category or group id
 * @returns {string} Emoji icon
 */
export function getCategoryIcon(categoryOrGroup) {
    const key = (categoryOrGroup || 'uncategorized').toLowerCase();
    return CATEGORY_ICONS[key] || DEFAULT_ICON;
}

/**
 * Get relative date string (Today, Yesterday, or formatted date)
 * @param {string|Date} date - Date to format
 * @param {Date} [referenceDate=new Date()] - Reference date for comparison (useful for testing)
 * @returns {string} Relative date string
 */
export function getRelativeDate(date, referenceDate = new Date()) {
    const txDate = new Date(date);
    
    if (Number.isNaN(txDate.getTime())) {
        return 'Unknown';
    }

    // Reset time for comparison
    const txDay = new Date(txDate.getFullYear(), txDate.getMonth(), txDate.getDate());
    const today = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), referenceDate.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    if (txDay.getTime() === today.getTime()) {
        return 'Today';
    }
    if (txDay.getTime() === yesterday.getTime()) {
        return 'Yesterday';
    }

    // Format as "Mon DD" or "Mon DD, YYYY" if different year
    const options = { month: 'short', day: 'numeric' };
    if (txDate.getFullYear() !== referenceDate.getFullYear()) {
        options.year = 'numeric';
    }
    return txDate.toLocaleDateString('en-US', options);
}

/**
 * Format a transaction for display with icon and relative date
 * @param {Object} tx - Raw transaction object
 * @param {Date} [referenceDate] - Reference date for relative formatting
 * @returns {Object} Formatted transaction with icon and relative date
 */
export function formatTransactionForDisplay(tx, referenceDate = new Date()) {
    return {
        id: tx.id,
        icon: getCategoryIcon(tx.category || tx.group),
        merchant: tx.merchant || tx.category || 'Transaction',
        amount: Math.abs(Number(tx.amount) || 0),
        date: getRelativeDate(tx.date, referenceDate),
        rawDate: tx.date,
        category: tx.category,
        group: tx.group,
    };
}
