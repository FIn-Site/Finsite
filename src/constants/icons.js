// Shared icon mappings for groups and categories
export const CATEGORY_ICONS = {
    groceries: '🛒',
    utilities: '💡',
    fuel: '⛽',
    stocks: '📈',
    bonds: '📊',
    'dining-out': '🍽️',
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
};

export function getCategoryIcon(id = 'other') {
    const key = String(id || 'other').toLowerCase();
    return CATEGORY_ICONS[key] || CATEGORY_ICONS.other;
}

export function getGroupIcon(id = 'expenses') {
    const key = String(id || 'expenses').toLowerCase();
    return GROUP_ICONS[key] || '📁';
}

export function getCategoryOrGroupIcon(id) {
    return getCategoryIcon(id) || getGroupIcon(id);
}
