// Single source of truth for all icons used in the app
const FALLBACK_ICON = '❔';

export const CATEGORY_ICONS = {
    groceries: '🛒',
    utilities: '💡',
    fuel: '⛽',
    stocks: '📈',
    bonds: '📊',
    'dining-out': '🍽️',
    dining: '🍽️',
    shopping: '🛍️',
    transport: '🚗',
    healthcare: '🏥',
    entertainment: '🎬',
    education: '📚',
    bills: '📄',
    loans: '💰',
    luxuries: '💎',
    other: '📝',
};

export const GROUP_ICONS = {
    household: '🏠',
    investments: '💰',
    expenses: '💳',
    uncategorized: '📂',
    manual: '✏️',
};

/**
 * Get icon for a category id or name.
 */
export function getCategoryIcon(id = 'other') {
    const key = String(id || 'other').toLowerCase();
    return CATEGORY_ICONS[key] || FALLBACK_ICON;
}

/**
 * Get icon for a group id or name.
 */
export function getGroupIcon(id = 'expenses') {
    const key = String(id || 'expenses').toLowerCase();
    return GROUP_ICONS[key] || FALLBACK_ICON;
}

/**
 * Convenience helper when the caller is not sure if the id is a category or group.
 */
export function getCategoryOrGroupIcon(id) {
    return getCategoryIcon(id) || getGroupIcon(id) || FALLBACK_ICON;
}

export function getFallbackIcon() {
    return FALLBACK_ICON;
}
