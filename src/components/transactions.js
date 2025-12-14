import { getCategoryIcon, getGroupIcon } from '../utils/icons.js';
import { createPrefixedLogger } from '../utils/debugService.js';

// Prefixed logger for transactions component
const log = createPrefixedLogger('[Transactions]');

/**
 * @fileoverview Transactions Web Component for FinSite.
 * Full-featured transaction list with filtering, sorting, and manual entry.
 * @module components/transactions
 */

/**
 * Transactions Web Component.
 *
 * Features:
 * - Date-grouped transaction list with sticky headers
 * - Advanced filtering (scope, search, date range, groups, categories)
 * - Sorting (newest, oldest, amount high/low)
 * - Multi-select for bulk operations
 * - Manual transaction entry modal
 *
 * @extends HTMLElement
 * @fires add-transaction - When new transaction submitted {group, category, amount, date, merchant, notes}
 * @fires open-manual-entry - When manual entry modal opened {source: string}
 */
class FinSiteTransactions extends HTMLElement {
    /**
     * Initialize transactions component.
     * Sets up Shadow DOM, filter state, and UI state.
     */
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });

        this._model = null;

        // Core state: all transactions
        this.transactions = [];

        // Filter state
        this.filters = {
            search: '', // search query
            dateRange: null, // { start: Date, end: Date } or null
            groups: [], // selected group IDs
            categories: [], // selected category IDs
        };

        // UI state
        this.sortOrder = 'newest'; // newest, oldest, amount-high, amount-low
        this.isSearchActive = false;
        this.isSortPanelOpen = false;
        this.isDatePickerOpen = false;
        this.isFilterPanelOpen = false;
        this.isModalOpen = false;
        this.isEditMode = false;
        this.editingTransactionId = null;
        this.selectedTransactions = new Set();

        // Available groups and categories for filters
        this.availableGroups = [];
        this.availableCategories = [];

        // Modal form state - track currently selected group for category filtering
        this.currentGroupId = null;
    }

    set model(model) {
        this._model = model;
        this._syncTaxonomyFromModel();
    }

    get model() {
        return this._model;
    }

    /**
     * Set transactions data from external source (MVC model)
     */
    setTransactions(transactionsArray) {
        this.transactions = Array.isArray(transactionsArray) ? [...transactionsArray] : [];
        if (this.isConnected) {
            this.render();
            this.setupEventListeners();
        }
    }

    connectedCallback() {
        if (!Array.isArray(this.transactions)) {
            this.transactions = [];
        }
        this._syncTaxonomyFromModel();
        this.render();
        this.setupEventListeners();
    }

    /**
     * Allow external injection of taxonomy data (groups/categories)
     * so this component does not define defaults itself.
     */
    setTaxonomy({ groups = [], categories = [] } = {}) {
        this.availableGroups = Array.isArray(groups) ? [...groups] : [];
        this.availableCategories = Array.isArray(categories) ? [...categories] : [];
        if (this.isConnected) {
            this.render();
            this.setupEventListeners();
        }
    }

    _syncTaxonomyFromModel() {
        if (!this._model) return;
        const groups = this._model.getGroups?.() || [];
        const categories = this._model.getCategories?.() || [];
        this.availableGroups = groups;
        this.availableCategories = categories;
        log('Taxonomy synced from model:', { groups: groups.length, categories: categories.length });
    }

    /**
     * Get categories filtered by the currently selected group in the modal.
     * Returns all categories if no group is selected.
     * Handles both default groups (categories have groupId) and custom groups (group has categoryIds array).
     * @returns {Array} Filtered categories for the current group
     */
    getCategoriesForCurrentGroup() {
        if (!this.currentGroupId) {
            return [];
        }

        // Find the selected group to check if it's a custom group with categoryIds
        const selectedGroup = this.availableGroups.find((g) => g.id === this.currentGroupId);

        // If it's a custom group with categoryIds array, filter by those IDs
        if (selectedGroup?.categoryIds && Array.isArray(selectedGroup.categoryIds)) {
            return this.availableCategories.filter(
                (c) => selectedGroup.categoryIds.includes(c.id),
            );
        }

        // Default behavior: filter categories that belong to the group by groupId
        return this.availableCategories.filter(
            (c) => c.groupId === this.currentGroupId || c.group === this.currentGroupId,
        );
    }

    // ============================================================
    // FILTERING & SORTING
    // ============================================================

    getFilteredTransactions() {
        let filtered = [...this.transactions];

        // Search filter
        if (this.filters.search.trim()) {
            const q = this.filters.search.toLowerCase();
            filtered = filtered.filter((tx) => (tx.merchant || '').toLowerCase().includes(q)
                || (tx.category || '').toLowerCase().includes(q)
                || (tx.notes || '').toLowerCase().includes(q)
                || (tx.group || '').toLowerCase().includes(q)
                || (tx.name || '').toLowerCase().includes(q));
        }

        // Date range filter
        if (this.filters.dateRange) {
            const { start, end } = this.filters.dateRange;
            // Convert filter dates to YYYY-MM-DD strings for comparison
            const startStr = start.toISOString().split('T')[0];
            const endStr = end.toISOString().split('T')[0];

            filtered = filtered.filter((tx) =>
                // tx.date is already in YYYY-MM-DD format
                tx.date >= startStr && tx.date <= endStr);
        }

        // Group filter
        if (this.filters.groups.length > 0) {
            filtered = filtered.filter((tx) => this.filters.groups.includes(tx.group));
        }

        // Category filter
        if (this.filters.categories.length > 0) {
            filtered = filtered.filter((tx) => this.filters.categories.includes(tx.category));
        }

        // Sort
        filtered.sort((a, b) => {
            switch (this.sortOrder) {
                case 'oldest':
                    return new Date(a.date) - new Date(b.date);
                case 'amount-high':
                    return Math.abs(Number(b.amount)) - Math.abs(Number(a.amount));
                case 'amount-low':
                    return Math.abs(Number(a.amount)) - Math.abs(Number(b.amount));
                case 'newest':
                default:
                    return new Date(b.date) - new Date(a.date);
            }
        });

        return filtered;
    }

    groupTransactionsByDate(transactions) {
        const groups = new Map();
        for (const tx of transactions) {
            const dateKey = tx.date || 'Unknown';
            if (!groups.has(dateKey)) {
                groups.set(dateKey, []);
            }
            groups.get(dateKey).push(tx);
        }
        return groups;
    }

    formatDateHeader(dateStr) {
        if (!dateStr || dateStr === 'Unknown') return 'Unknown Date';

        // Parse date string as local time to avoid timezone shifts
        // Assuming dateStr is in YYYY-MM-DD format
        const parts = dateStr.split('-');
        const date = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));

        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);

        const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const yesterdayOnly = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());

        if (dateOnly.getTime() === todayOnly.getTime()) return 'Today';
        if (dateOnly.getTime() === yesterdayOnly.getTime()) return 'Yesterday';

        return date.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    }

    /**
     * Update only the transaction list without full re-render
     * Used for search to preserve input focus and cursor position
     */
    _updateTransactionList() {
        const root = this.shadowRoot;
        const container = root.querySelector('.transaction-list-container');

        if (!container) return;

        const filtered = this.getFilteredTransactions();
        const grouped = this.groupTransactionsByDate(filtered);
        const hasFilters = this.hasActiveFilters();

        // Update transaction list
        if (filtered.length === 0) {
            container.innerHTML = this.renderEmptyState(hasFilters);
        } else {
            container.innerHTML = this.renderTransactionList(grouped);
        }

        // Re-attach transaction row listeners
        this._setupTransactionRowListeners();
    }

    /**
     * Setup event listeners for transaction rows only
     */
    _setupTransactionRowListeners() {
        const root = this.shadowRoot;

        // Transaction row clicks
        root.querySelectorAll('.transaction-row').forEach((row) => {
            row.addEventListener('click', (e) => {
                const id = Number(row.dataset.id);
                this.openTransactionModal(id);
            });
        });
    }

    clearAllFilters() {
        this.filters = {
            search: '', dateRange: null, groups: [], categories: [],
        };
        this.isSearchActive = false;
        this.isDatePickerOpen = false;
        this.isFilterPanelOpen = false;
        this.render();
        this.setupEventListeners();
    }

    hasActiveFilters() {
        return this.filters.search.trim() !== ''
               || this.filters.dateRange !== null
               || this.filters.groups.length > 0
               || this.filters.categories.length > 0;
    }

    getGroupName(groupId) {
        const group = this.availableGroups.find((g) => g.id === groupId);
        return group ? group.name : groupId;
    }

    escapeHtml(str) {
        return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    // ============================================================
    // RENDER
    // ============================================================

    render() {
        const filtered = this.getFilteredTransactions();
        const grouped = this.groupTransactionsByDate(filtered);
        const hasFilters = this.hasActiveFilters();

        // Preserve notification state before re-render
        const oldBanner = this.shadowRoot.querySelector('#notification-banner');
        const wasShowing = oldBanner?.classList.contains('show');
        const bannerContent = oldBanner?.innerHTML;
        const bannerClass = oldBanner?.className;

        this.shadowRoot.innerHTML = `
            <style>${this.getStyles()}</style>
            <div class="transactions-page">
                <header class="page-header">
                    <div class="header-content">
                        <div class="header-title-section">
                            <h1 class="page-title">Transactions</h1>
                            <p class="page-subtitle">View and manage all transactions</p>
                        </div>
                        <div class="header-actions">
                            ${hasFilters ? '<button class="action-link" id="clear-all-btn">Clear</button>' : ''}
                            <button class="action-btn ${this.isSearchActive ? 'active' : ''}" id="search-btn">
                                <span class="btn-icon">🔍</span><span class="btn-label">Search</span>
                            </button>
                            <button class="action-btn" id="sort-btn">
                                <span class="btn-icon">⇅</span><span class="btn-label">Sort By</span>
                            </button>
                            <button class="action-btn ${this.filters.dateRange ? 'active' : ''}" id="date-btn">
                                <span class="btn-icon">📅</span><span class="btn-label">Date</span>
                            </button>
                            <button class="action-btn ${this.filters.groups.length || this.filters.categories.length ? 'active' : ''}" id="filter-btn">
                                <span class="btn-icon">⚙️</span><span class="btn-label">Filter</span>
                            </button>
                            <button class="add-btn" id="add-transaction-btn" data-testid="btn-add-transaction">
                                <span class="add-icon">+</span><span>Add Transaction</span>
                            </button>
                        </div>
                    </div>
                    ${this.isSearchActive ? this.renderSearchBar() : ''}
                    ${this.isSortPanelOpen ? this.renderSortPanel() : ''}
                    ${this.isDatePickerOpen ? this.renderDatePicker() : ''}
                    ${this.isFilterPanelOpen ? this.renderFilterPanel() : ''}
                </header>

                <div class="transaction-list-container" data-testid="transaction-list">
                    ${filtered.length === 0 ? this.renderEmptyState(hasFilters) : this.renderTransactionList(grouped)}
                </div>

                <div class="notification-banner" id="notification-banner"></div>
                ${this.renderModal()}
            </div>
        `;

        // Restore notification state after re-render
        if (wasShowing && bannerContent) {
            const newBanner = this.shadowRoot.querySelector('#notification-banner');
            if (newBanner) {
                newBanner.innerHTML = bannerContent;
                newBanner.className = bannerClass;
                // Restart the timer to remove the notification
                clearTimeout(this._notificationTimer);
                this._notificationTimer = setTimeout(() => {
                    const banner = this.shadowRoot.querySelector('#notification-banner');
                    if (banner) banner.classList.remove('show');
                }, 2500);
            }
        }
    }

    renderSearchBar() {
        return `
            <div class="search-bar">
                <input type="text" class="search-input" placeholder="Search by merchant, category, or notes..." 
                    id="search-input" value="${this.escapeHtml(this.filters.search)}" autofocus>
                <button class="search-close" id="search-close-btn">✕</button>
            </div>
        `;
    }

    renderTransactionList(grouped) {
        let html = '<div class="transaction-list">';
        for (const [dateKey, txs] of grouped) {
            html += `<div class="date-group">
                <div class="date-header">${this.formatDateHeader(dateKey)}</div>
                <div class="date-transactions">${txs.map((tx) => this.renderTransactionRow(tx)).join('')}</div>
            </div>`;
        }
        return `${html}</div>`;
    }

    renderTransactionRow(tx) {
        const amount = Number(tx.amount) || 0;
        const isExpense = amount > 0;
        const formatted = Math.abs(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

        // Get icon from category/group object if available, otherwise use default
        const category = this.availableCategories.find((c) => c.id === tx.category);
        const group = this.availableGroups.find((g) => g.id === tx.group);
        const catIcon = category?.icon || getCategoryIcon(tx.category);
        const grpIcon = group?.icon || getGroupIcon(tx.group);

        const merchant = tx.merchant || tx.name || tx.category || 'Transaction';
        const isSelected = this.selectedTransactions.has(tx.id);

        return `
            <div class="transaction-row" data-id="${tx.id}">
                <div class="row-icon ${isExpense ? 'expense' : 'income'}">${catIcon}</div>
                <div class="row-merchant"><span class="merchant-name">${this.escapeHtml(merchant)}</span></div>
                <div class="row-category"><span class="category-icon">${catIcon}</span><span class="category-name">${this.escapeHtml(tx.category || 'Uncategorized')}</span></div>
                <div class="row-account"><span class="account-icon">${grpIcon}</span><span class="account-name">${this.escapeHtml(this.getGroupName(tx.group || 'expenses'))}</span></div>
                <div class="row-amount ${isExpense ? 'expense' : 'income'}">$${formatted}</div>
                <div class="row-chevron">›</div>
            </div>
        `;
    }

    renderEmptyState(hasFilters) {
        if (hasFilters) {
            return `<div class="empty-state">
                <div class="empty-icon">🔍</div>
                <div class="empty-title">No transactions match your filters</div>
                <div class="empty-subtitle">Try adjusting your search or filter criteria</div>
                <button class="empty-action-btn" id="empty-clear-btn">Clear all filters</button>
            </div>`;
        }
        return `<div class="empty-state">
            <div class="empty-icon">📭</div>
            <div class="empty-title">No transactions yet</div>
            <div class="empty-subtitle">Start tracking your spending by adding a transaction</div>
            <button class="add-btn" id="empty-add-btn"><span class="add-icon">+</span><span>Add Transaction</span></button>
        </div>`;
    }

    renderSortPanel() {
        return `
            <div class="panel sort-panel">
                <div class="panel-header"><span class="panel-title">Sort By</span><button class="panel-close" id="sort-close-btn">✕</button></div>
                <div class="sort-options">
                    <button class="sort-option ${this.sortOrder === 'newest' ? 'active' : ''}" data-sort="newest">
                        <span class="sort-icon">⬇️</span>
                        <span class="sort-label">Newest first</span>
                    </button>
                    <button class="sort-option ${this.sortOrder === 'oldest' ? 'active' : ''}" data-sort="oldest">
                        <span class="sort-icon">⬆️</span>
                        <span class="sort-label">Oldest first</span>
                    </button>
                    <button class="sort-option ${this.sortOrder === 'amount-high' ? 'active' : ''}" data-sort="amount-high">
                        <span class="sort-icon">💵</span>
                        <span class="sort-label">Amount (high)</span>
                    </button>
                    <button class="sort-option ${this.sortOrder === 'amount-low' ? 'active' : ''}" data-sort="amount-low">
                        <span class="sort-icon">💳</span>
                        <span class="sort-label">Amount (low)</span>
                    </button>
                </div>
            </div>
        `;
    }

    renderDatePicker() {
        const today = new Date().toISOString().split('T')[0];
        const startDate = this.filters.dateRange?.start?.toISOString().split('T')[0] || '';
        const endDate = this.filters.dateRange?.end?.toISOString().split('T')[0] || '';
        return `
            <div class="panel date-picker-panel">
                <div class="panel-header"><span class="panel-title">Select Date Range</span><button class="panel-close" id="date-close-btn">✕</button></div>
                <div class="date-inputs">
                    <div class="date-field"><label>From</label><input type="date" id="date-start" value="${startDate}" max="${today}"></div>
                    <div class="date-field"><label>To</label><input type="date" id="date-end" value="${endDate}" max="${today}"></div>
                </div>
                <div class="date-presets">
                    <button class="preset-btn" data-preset="today">Today</button>
                    <button class="preset-btn" data-preset="week">This Week</button>
                    <button class="preset-btn" data-preset="month">This Month</button>
                    <button class="preset-btn" data-preset="year">This Year</button>
                </div>
                <div class="panel-actions"><button class="btn-secondary" id="date-clear-btn">Clear</button><button class="btn-primary" id="date-apply-btn">Apply</button></div>
            </div>
        `;
    }

    renderFilterPanel() {
        return `
            <div class="panel filter-panel">
                <div class="panel-header"><span class="panel-title">Advanced Filters</span><button class="panel-close" id="filter-close-btn">✕</button></div>
                <div class="filter-section">
                    <div class="filter-section-title">Groups</div>
                    <div class="filter-options">${this.availableGroups.map((g) => `
                        <label class="filter-option"><input type="checkbox" class="group-checkbox" value="${g.id}" ${this.filters.groups.includes(g.id) ? 'checked' : ''}>
                        <span class="option-icon">${g.icon || getGroupIcon(g.id, g.icon)}</span><span class="option-label">${g.name}</span></label>
                    `).join('')}</div>
                </div>
                <div class="filter-section">
                    <div class="filter-section-title">Categories</div>
                    <div class="filter-options">${this.availableCategories.map((c) => `
                        <label class="filter-option"><input type="checkbox" class="category-checkbox" value="${c.id}" ${this.filters.categories.includes(c.id) ? 'checked' : ''}>
                        <span class="option-icon">${c.icon || getCategoryIcon(c.id)}</span><span class="option-label">${c.name}</span></label>
                    `).join('')}</div>
                </div>
                <div class="panel-actions"><button class="btn-secondary" id="filter-clear-btn">Clear</button><button class="btn-primary" id="filter-apply-btn">Apply</button></div>
            </div>
        `;
    }

    renderModal() {
        // Get the transaction being edited if in edit mode
        const editTx = this.isEditMode && this.editingTransactionId
            ? this.transactions.find((t) => t.id === this.editingTransactionId)
            : null;

        // Get categories filtered by currently selected group
        const filteredCategories = this.getCategoriesForCurrentGroup();
        const showCategoryPlaceholder = !this.currentGroupId || filteredCategories.length === 0;
        const todayDate = new Date().toISOString().split('T')[0];

        const modalTitle = this.isEditMode ? 'Edit Transaction' : 'Add New Transaction';
        const modalSubtitle = this.isEditMode ? 'Update transaction details below' : 'Enter transaction details below';

        // Pre-fill values if editing
        const amountValue = editTx ? Math.abs(Number(editTx.amount)) : '';
        const dateValue = editTx ? editTx.date : todayDate;
        const merchantValue = editTx ? (editTx.merchant || '') : '';
        const notesValue = editTx ? (editTx.notes || '') : '';

        return `
            <div class="modal-overlay ${this.isModalOpen ? '' : 'hidden'}" id="modal-overlay">
                <div class="modal-container">
                    <div class="modal-header">
                        <div><div class="modal-title">${modalTitle}</div><div class="modal-subtitle">${modalSubtitle}</div></div>
                        <button class="modal-close-btn" id="modal-close-btn">✕</button>
                    </div>
                    <form class="modal-form" id="transaction-form" novalidate>
                        <div class="form-row">
                            <div class="form-group"><label class="form-label" for="tx-amount">Amount (USD)</label>
                                <input class="form-input" type="number" id="tx-amount" data-testid="input-amount" name="amount" step="0.01" min="0.01" placeholder="e.g., 12.34" value="${amountValue}" required /></div>
                            <div class="form-group"><label class="form-label" for="tx-date">Date</label>
                                <input class="form-input" type="date" id="tx-date" data-testid="input-date" name="date" value="${dateValue}" required /></div>
                        </div>
                        <div class="form-row">
                            <div class="form-group"><label class="form-label" for="tx-group">Group</label>
                                <select class="form-select" id="tx-group" data-testid="select-group" name="group" required>
                                    <option value="" disabled ${!this.currentGroupId ? 'selected' : ''}>Select a group</option>
                                    ${this.availableGroups
        .filter((g, index, self) => index === self.findIndex((t) => t.id === g.id))
        .map((g) => `<option value="${g.id}" ${this.currentGroupId === g.id ? 'selected' : ''}>${g.name}</option>`).join('')}
                                </select></div>
                            <div class="form-group"><label class="form-label" for="tx-category">Category</label>
                                <select class="form-select" id="tx-category" data-testid="select-category" name="category" required ${showCategoryPlaceholder ? 'disabled' : ''}>
                                    <option value="" disabled ${!editTx ? 'selected' : ''}>${showCategoryPlaceholder ? 'Select a group first' : 'Select a category'}</option>
                                    ${filteredCategories.map((c) => `<option value="${c.id}" ${editTx && editTx.category === c.id ? 'selected' : ''}>${c.name}</option>`).join('')}
                                </select></div>
                        </div>
                        <div class="form-group"><label class="form-label" for="tx-merchant">Merchant</label>
                            <input class="form-input" type="text" id="tx-merchant" data-testid="input-merchant" name="merchant" placeholder="e.g., Amazon, Walmart" value="${this.escapeHtml(merchantValue)}" /></div>
                        <div class="form-group"><label class="form-label" for="tx-notes">Notes</label>
                            <textarea class="form-textarea" id="tx-notes" name="notes" placeholder="Add any additional notes...">${this.escapeHtml(notesValue)}</textarea></div>
                        <div class="modal-actions">
                            <button type="button" class="btn-secondary" id="modal-cancel-btn">Cancel</button>
                            ${this.isEditMode ? '<button type="button" class="btn-danger" id="modal-delete-btn">Delete</button>' : ''}
                            <button type="submit" class="btn-primary" data-testid="btn-add-transaction">${this.isEditMode ? 'Save' : 'Add Transaction'}</button>
                        </div>
                    </form>
                </div>
            </div>
        `;
    }

    // ============================================================
    // STYLES
    // ============================================================

    getStyles() {
        return `
            * { margin: 0; padding: 0; box-sizing: border-box; }
            :host { display: block; width: 100%; height: 100%; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: var(--text-primary, #f1f5f9); }
            .transactions-page { display: flex; flex-direction: column; height: 100%; background: var(--bg-primary, #0f172a); transition: background 0.3s ease; }

            /* Header */
            .page-header { position: sticky; top: 0; z-index: 100; background: var(--bg-primary, #0f172a); padding: 2rem 2rem 0; transition: background 0.3s ease, border-color 0.3s ease; }
            .header-content { display: flex; justify-content: space-between; align-items: center; padding-bottom: 1rem; }
            .header-title-section { display: flex; flex-direction: column; gap: 0.25rem; }
            .page-title { font-size: 1.75rem; font-weight: 700; color: var(--text-primary, #f1f5f9); margin: 0; }
            .page-subtitle { font-size: 0.875rem; color: var(--text-muted, #64748b); margin: 0; }
            .header-actions { display: flex; align-items: center; gap: 0.75rem; }
            .action-link { background: none; border: none; color: var(--accent-primary, #f97316); font-size: 0.875rem; font-weight: 500; cursor: pointer; padding: 0.5rem; }
            .action-link:hover { color: var(--accent-primary-hover, #fb923c); text-decoration: underline; }
            .action-btn { display: flex; align-items: center; gap: 0.375rem; padding: 0.5rem 0.875rem; background: var(--bg-card, #1e293b); border: 1px solid var(--border-color, #334155); border-radius: 0.5rem; color: var(--text-secondary, #94a3b8); font-size: 0.875rem; cursor: pointer; transition: all 0.15s ease; }
            .action-btn:hover { background: var(--bg-card-hover, #334155); border-color: var(--border-color, #475569); color: var(--text-primary, #f1f5f9); }
            .action-btn.active { background: var(--bg-card, #1e293b); border-color: var(--accent-primary, #f97316); color: var(--accent-primary, #f97316); }
            .btn-icon { font-size: 1rem; }
            .add-btn { display: flex; align-items: center; gap: 0.375rem; padding: 0.5rem 1rem; background: linear-gradient(135deg, var(--accent-primary, #f97316) 0%, #ea580c 100%); border: none; border-radius: 0.5rem; color: #ffffff; font-size: 0.875rem; font-weight: 600; cursor: pointer; transition: all 0.15s ease; box-shadow: 0 2px 4px rgba(249, 115, 22, 0.3); }
            .add-btn:hover { background: linear-gradient(135deg, var(--accent-primary-hover, #fb923c) 0%, var(--accent-primary, #f97316) 100%); box-shadow: 0 4px 8px rgba(249, 115, 22, 0.4); transform: translateY(-1px); }
            .add-icon { font-size: 1.125rem; font-weight: 700; }

            /* Search Bar */
            .search-bar { display: flex; align-items: center; gap: 0.5rem; padding: 0.75rem 0; border-top: 1px solid var(--border-color, #334155); margin-top: 0.5rem; }
            .search-input { flex: 1; padding: 0.625rem 1rem; background: var(--bg-input, #0f172a); border: 1px solid var(--border-color, #334155); border-radius: 0.5rem; color: var(--text-primary, #f1f5f9); font-size: 0.875rem; outline: none; transition: border-color 0.15s ease; }
            .search-input:focus { border-color: var(--accent-primary, #f97316); box-shadow: 0 0 0 3px rgba(249, 115, 22, 0.15); }
            .search-input::placeholder { color: var(--text-muted, #64748b); }
            .search-close { padding: 0.5rem; background: none; border: none; color: var(--text-muted, #64748b); font-size: 1rem; cursor: pointer; }
            .search-close:hover { color: var(--text-primary, #f1f5f9); }

            /* Panels */
            .panel { background: var(--bg-card, #1e293b); border: 1px solid var(--border-color, #334155); border-radius: 0.75rem; padding: 1rem; margin-top: 0.5rem; box-shadow: var(--shadow-md, 0 4px 12px rgba(0, 0, 0, 0.3)); }
            .panel-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
            .panel-title { font-size: 0.875rem; font-weight: 600; color: var(--text-primary, #f1f5f9); }
            .panel-close { padding: 0.25rem; background: none; border: none; color: var(--text-muted, #64748b); font-size: 1.25rem; cursor: pointer; }
            .panel-close:hover { color: var(--text-primary, #f1f5f9); }
            .date-inputs { display: flex; gap: 1rem; margin-bottom: 1rem; }
            .date-field { flex: 1; display: flex; flex-direction: column; gap: 0.375rem; }
            .date-field label { font-size: 0.75rem; color: var(--text-secondary, #94a3b8); font-weight: 500; }
            .date-field input { padding: 0.5rem; background: var(--bg-primary, #0f172a); border: 1px solid var(--border-color, #334155); border-radius: 0.375rem; font-size: 0.875rem; color: var(--text-primary, #f1f5f9); }
            .date-presets { display: flex; gap: 0.5rem; margin-bottom: 1rem; }
            .preset-btn { padding: 0.375rem 0.75rem; background: var(--bg-primary, #0f172a); border: 1px solid var(--border-color, #334155); border-radius: 9999px; font-size: 0.75rem; color: var(--text-secondary, #94a3b8); cursor: pointer; }
            .preset-btn:hover { background: var(--bg-tertiary, #334155); color: var(--text-primary, #f1f5f9); }
            .filter-section { margin-bottom: 1rem; }
            .filter-section-title { font-size: 0.75rem; font-weight: 600; color: var(--text-muted, #64748b); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.5rem; }
            .filter-options { display: flex; flex-wrap: wrap; gap: 0.5rem; }
            .filter-option { display: flex; align-items: center; gap: 0.375rem; padding: 0.375rem 0.75rem; background: var(--bg-primary, #0f172a); border: 1px solid var(--border-color, #334155); border-radius: 0.5rem; cursor: pointer; transition: all 0.15s ease; }
            .filter-option:has(input:checked) { background: rgba(249, 115, 22, 0.15); border-color: var(--accent-primary, #f97316); }
            .filter-option input { display: none; }
            .option-icon { font-size: 0.875rem; }
            .option-label { font-size: 0.8125rem; color: var(--text-secondary, #94a3b8); }
            .filter-option:has(input:checked) .option-label { color: var(--accent-primary, #f97316); }
            .sort-options { display: flex; flex-direction: column; gap: 0.5rem; }
            .sort-option { display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem 1rem; background: var(--bg-primary, #0f172a); border: 1px solid var(--border-color, #334155); border-radius: 0.5rem; cursor: pointer; transition: all 0.15s ease; width: 100%; text-align: left; }
            .sort-option:hover { background: var(--bg-tertiary, #334155); border-color: var(--accent-primary, #f97316); }
            .sort-option.active { background: rgba(249, 115, 22, 0.15); border-color: var(--accent-primary, #f97316); }
            .sort-icon { font-size: 1rem; }
            .sort-label { font-size: 0.875rem; color: var(--text-secondary, #94a3b8); }
            .sort-option.active .sort-label { color: var(--accent-primary, #f97316); }
            .panel-actions { display: flex; justify-content: flex-end; gap: 0.5rem; padding-top: 0.75rem; border-top: 1px solid var(--border-color, #334155); }
            .btn-secondary { padding: 0.5rem 1rem; background: var(--bg-card, #1e293b); border: 1px solid var(--border-color, #334155); border-radius: 0.5rem; color: var(--text-secondary, #94a3b8); font-size: 0.875rem; cursor: pointer; }
            .btn-secondary:hover { background: var(--bg-tertiary, #334155); color: var(--text-primary, #f1f5f9); }
            .btn-danger { padding: 0.5rem 1rem; background: #dc2626; border: none; border-radius: 0.5rem; color: #ffffff; font-size: 0.875rem; font-weight: 500; cursor: pointer; }
            .btn-danger:hover { background: #b91c1c; }
            .btn-primary { padding: 0.5rem 1rem; background: var(--accent-primary, #f97316); border: none; border-radius: 0.5rem; color: #ffffff; font-size: 0.875rem; font-weight: 500; cursor: pointer; }
            .btn-primary:hover { background: var(--accent-primary-hover, #fb923c); }

            /* Transaction List */
            .transaction-list-container { flex: 1; overflow-y: auto; padding: 1rem 2rem 2rem; }
            .transaction-list { background: var(--bg-card, #1e293b); border-radius: 0.75rem; border: 1px solid var(--border-color, #334155); overflow: hidden; box-shadow: var(--shadow-sm); transition: background 0.3s ease, border-color 0.3s ease; }
            .date-group { border-bottom: 1px solid var(--border-color, #334155); }
            .date-group:last-child { border-bottom: none; }
            .date-header { padding: 0.75rem 1.25rem; background: var(--bg-secondary, #0f172a); font-size: 0.8125rem; font-weight: 600; color: var(--text-muted, #64748b); border-bottom: 1px solid var(--border-color, #334155); }
            .transaction-row { position: relative; display: grid; grid-template-columns: auto 1fr auto auto auto auto; align-items: center; gap: 1rem; padding: 1rem 1.25rem; border-bottom: 1px solid var(--border-light, #0f172a); cursor: pointer; transition: background 0.15s ease, padding 0.2s ease; }
            .transaction-row:last-child { border-bottom: none; }
            .transaction-row:hover { background: var(--bg-card-hover, #334155); }
            .row-icon { width: 2.5rem; height: 2.5rem; border-radius: 0.625rem; display: flex; align-items: center; justify-content: center; font-size: 1.125rem; background: var(--icon-bg, #f5f5f5); }
            .row-merchant { min-width: 0; }
            .merchant-name { font-size: 0.9375rem; font-weight: 500; color: var(--text-primary, #f1f5f9); }
            .row-category, .row-account { display: flex; align-items: center; gap: 0.375rem; font-size: 0.8125rem; color: var(--text-muted, #64748b); }
            .category-icon, .account-icon { font-size: 0.875rem; }
            .row-amount { font-size: 0.9375rem; font-weight: 600; text-align: right; min-width: 5rem; }
            .row-amount.expense { color: var(--text-primary, #f1f5f9); }
            .row-amount.income { color: var(--positive-color, #10b981); }
            .row-chevron { color: var(--text-muted, #475569); font-size: 1.25rem; font-weight: 300; }

            /* Empty State */
            .empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 4rem 2rem; text-align: center; background: var(--bg-card, #1e293b); border-radius: 0.75rem; border: 1px solid var(--border-color, #334155); }
            .empty-icon { font-size: 3rem; margin-bottom: 1rem; }
            .empty-title { font-size: 1.125rem; font-weight: 600; color: var(--text-primary, #f1f5f9); margin-bottom: 0.5rem; }
            .empty-subtitle { font-size: 0.875rem; color: var(--text-muted, #64748b); margin-bottom: 1.5rem; }
            .empty-action-btn { padding: 0.5rem 1rem; background: var(--bg-card, #1e293b); border: 1px solid var(--border-color, #334155); border-radius: 0.5rem; color: var(--accent-primary, #f97316); font-size: 0.875rem; font-weight: 500; cursor: pointer; }
            .empty-action-btn:hover { background: rgba(249, 115, 22, 0.1); border-color: var(--accent-primary, #f97316); }

            /* Notification */
            .notification-banner { position: fixed; top: 0; left: 0; right: 0; padding: 0.75rem 1rem; text-align: center; font-size: 0.875rem; font-weight: 500; transform: translateY(-100%); transition: transform 0.3s ease; z-index: 1001; }
            .notification-banner.show { transform: translateY(0); }
            .notification-banner.success { background: #16b981; color: #ffffff; }
            .notification-banner.error { background: #ef4444; color: #ffffff; }

            /* Modal */
            .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0, 0, 0, 0.7); display: flex; align-items: center; justify-content: center; z-index: 1000; backdrop-filter: blur(4px); }
            .modal-overlay.hidden { display: none; }
            .modal-container { background: var(--bg-card, #1e293b); border-radius: 1rem; padding: 1.5rem; width: 100%; max-width: 480px; border: 1px solid var(--border-color, #334155); box-shadow: var(--shadow-lg, 0 25px 50px -12px rgba(0, 0, 0, 0.5)); animation: modalSlideIn 0.2s ease-out; }
            @keyframes modalSlideIn { from { opacity: 0; transform: translateY(-20px) scale(0.95); } to { opacity: 1; transform: translateY(0) scale(1); } }
            .modal-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.25rem; padding-bottom: 1rem; border-bottom: 1px solid var(--border-color, #334155); }
            .modal-title { font-size: 1.125rem; font-weight: 600; color: var(--text-primary, #f1f5f9); }
            .modal-subtitle { font-size: 0.8125rem; color: var(--text-muted, #64748b); margin-top: 0.25rem; }
            .modal-close-btn { background: none; border: none; color: var(--text-muted, #64748b); font-size: 1.5rem; cursor: pointer; padding: 0; line-height: 1; }
            .modal-close-btn:hover { color: var(--text-primary, #f1f5f9); }
            .modal-form { display: flex; flex-direction: column; gap: 1rem; }
            .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
            .form-group { display: flex; flex-direction: column; gap: 0.375rem; }
            .form-label { font-size: 0.8125rem; font-weight: 500; color: var(--text-secondary, #94a3b8); }
            .form-input, .form-select, .form-textarea { padding: 0.625rem 0.875rem; background: var(--bg-input, #0f172a); border: 1px solid var(--border-color, #334155); border-radius: 0.5rem; color: var(--text-primary, #f1f5f9); font-size: 0.875rem; outline: none; transition: border-color 0.15s ease, box-shadow 0.15s ease; }
            .form-input:focus, .form-select:focus, .form-textarea:focus { border-color: var(--accent-primary, #f97316); box-shadow: 0 0 0 3px rgba(249, 115, 22, 0.15); }
            .form-input::placeholder, .form-textarea::placeholder { color: var(--text-muted, #64748b); }
            .form-select { cursor: pointer; }
            .form-select option { background: var(--bg-card, #1e293b); color: var(--text-primary, #f1f5f9); }
            .form-textarea { min-height: 80px; resize: vertical; }
            .modal-actions { display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 0.5rem; padding-top: 1rem; border-top: 1px solid var(--border-color, #334155); }

            /* Responsive */
            @media (max-width: 1024px) {
                .transaction-row { grid-template-columns: auto 1fr auto auto; }
                .row-category, .row-account { display: none; }
            }
            @media (max-width: 768px) {
                .page-header { padding: 1rem 1rem 0; }
                .header-content { flex-direction: column; align-items: flex-start; gap: 1rem; }
                .header-actions { flex-wrap: wrap; width: 100%; }
                .btn-label { display: none; }
                .filter-bar { padding: 0.75rem 1rem; flex-wrap: wrap; gap: 0.75rem; }
                .transaction-list-container { padding: 1rem; }
                .transaction-row { grid-template-columns: auto 1fr auto; gap: 0.75rem; padding: 0.875rem 1rem; }
                .row-chevron { display: none; }
                .form-row { grid-template-columns: 1fr; }
            }
        `;
    }

    // ============================================================
    // EVENT LISTENERS
    // ============================================================

    setupEventListeners() {
        const root = this.shadowRoot;
        if (!root) return;

        // Add Transaction buttons
        root.querySelectorAll('#add-transaction-btn, #empty-add-btn').forEach((btn) => {
            btn?.addEventListener('click', () => this.openModal());
        });

        // Clear all filters
        root.querySelectorAll('#clear-all-btn, #empty-clear-btn').forEach((btn) => {
            btn?.addEventListener('click', () => this.clearAllFilters());
        });

        // Search button toggle
        root.querySelector('#search-btn')?.addEventListener('click', () => {
            this.isSearchActive = !this.isSearchActive;
            this.isSortPanelOpen = false;
            this.isDatePickerOpen = false;
            this.isFilterPanelOpen = false;
            this.render();
            this.setupEventListeners();
        });

        // Sort button toggle
        root.querySelector('#sort-btn')?.addEventListener('click', () => {
            this.isSortPanelOpen = !this.isSortPanelOpen;
            this.isSearchActive = false;
            this.isDatePickerOpen = false;
            this.isFilterPanelOpen = false;
            this.render();
            this.setupEventListeners();
        });

        // Sort panel close
        root.querySelector('#sort-close-btn')?.addEventListener('click', () => {
            this.isSortPanelOpen = false;
            this.render();
            this.setupEventListeners();
        });

        // Sort option clicks
        root.querySelectorAll('.sort-option').forEach((btn) => {
            btn.addEventListener('click', () => {
                this.sortOrder = btn.dataset.sort;
                this.isSortPanelOpen = false;
                this.render();
                this.setupEventListeners();
            });
        });

        // Search input - updates immediately while preserving cursor position
        const searchInput = root.querySelector('#search-input');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.filters.search = e.target.value;
                this._updateTransactionList();
            });
        }

        // Search close
        root.querySelector('#search-close-btn')?.addEventListener('click', () => {
            this.isSearchActive = false;
            this.filters.search = '';
            this.render();
            this.setupEventListeners();
        });

        // Date button toggle
        root.querySelector('#date-btn')?.addEventListener('click', () => {
            this.isDatePickerOpen = !this.isDatePickerOpen;
            this.isSearchActive = false;
            this.isSortPanelOpen = false;
            this.isFilterPanelOpen = false;
            this.render();
            this.setupEventListeners();
        });

        // Date picker controls
        root.querySelector('#date-close-btn')?.addEventListener('click', () => {
            this.isDatePickerOpen = false;
            this.render();
            this.setupEventListeners();
        });

        root.querySelector('#date-clear-btn')?.addEventListener('click', () => {
            this.filters.dateRange = null;
            this.isDatePickerOpen = false;
            this.render();
            this.setupEventListeners();
        });

        root.querySelector('#date-apply-btn')?.addEventListener('click', () => {
            const startInput = root.querySelector('#date-start');
            const endInput = root.querySelector('#date-end');
            if (startInput?.value && endInput?.value) {
                this.filters.dateRange = {
                    start: new Date(`${startInput.value}T00:00:00`),
                    end: new Date(`${endInput.value}T23:59:59`),
                };
            }
            this.isDatePickerOpen = false;
            this.render();
            this.setupEventListeners();
        });

        // Date presets
        root.querySelectorAll('.preset-btn').forEach((btn) => {
            btn.addEventListener('click', () => {
                const { preset } = btn.dataset;
                const now = new Date();
                let start; let
                    end;

                switch (preset) {
                    case 'today':
                        start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                        end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
                        break;
                    case 'week': {
                        const dayOfWeek = now.getDay();
                        start = new Date(now);
                        start.setDate(now.getDate() - dayOfWeek);
                        start.setHours(0, 0, 0, 0);
                        end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
                    }
                        break;
                    case 'month':
                        start = new Date(now.getFullYear(), now.getMonth(), 1);
                        end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
                        break;
                    case 'year':
                        start = new Date(now.getFullYear(), 0, 1);
                        end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
                        break;
                    default:
                        break;
                }

                this.filters.dateRange = { start, end };
                this.isDatePickerOpen = false;
                this.render();
                this.setupEventListeners();
            });
        });

        // Filter button toggle
        root.querySelector('#filter-btn')?.addEventListener('click', () => {
            this.isFilterPanelOpen = !this.isFilterPanelOpen;
            this.isSearchActive = false;
            this.isSortPanelOpen = false;
            this.isDatePickerOpen = false;
            this.render();
            this.setupEventListeners();
        });

        // Filter panel controls
        root.querySelector('#filter-close-btn')?.addEventListener('click', () => {
            this.isFilterPanelOpen = false;
            this.render();
            this.setupEventListeners();
        });

        root.querySelector('#filter-clear-btn')?.addEventListener('click', () => {
            this.filters.groups = [];
            this.filters.categories = [];
            this.isFilterPanelOpen = false;
            this.render();
            this.setupEventListeners();
        });

        root.querySelector('#filter-apply-btn')?.addEventListener('click', () => {
            this.filters.groups = Array.from(root.querySelectorAll('.group-checkbox:checked')).map((cb) => cb.value);
            this.filters.categories = Array.from(root.querySelectorAll('.category-checkbox:checked')).map((cb) => cb.value);
            this.isFilterPanelOpen = false;
            this.render();
            this.setupEventListeners();
        });

        // Transaction row clicks
        root.querySelectorAll('.transaction-row').forEach((row) => {
            row.addEventListener('click', (e) => {
                const id = Number(row.dataset.id);
                this.openTransactionModal(id);
            });
        });

        // Checkbox changes
        root.querySelectorAll('.tx-checkbox').forEach((cb) => {
            cb.addEventListener('change', (e) => {
                const txId = e.target.dataset.id;
                if (e.target.checked) this.selectedTransactions.add(txId);
                else this.selectedTransactions.delete(txId);
                this.render();
                this.setupEventListeners();
            });
        });

        // Modal controls
        root.querySelector('#modal-close-btn')?.addEventListener('click', () => this.closeModal());
        root.querySelector('#modal-cancel-btn')?.addEventListener('click', () => this.closeModal());
        root.querySelector('#modal-overlay')?.addEventListener('click', (e) => {
            if (e.target.id === 'modal-overlay') this.closeModal();
        });

        // Group dropdown change - update category options based on selected group
        root.querySelector('#tx-group')?.addEventListener('change', (e) => {
            this.currentGroupId = e.target.value;
            log('Group selected:', this.currentGroupId);
            // Re-render to update category dropdown with filtered options
            this._updateCategoryDropdown();
        });

        // Form submission
        root.querySelector('#transaction-form')?.addEventListener('submit', (e) => this.handleFormSubmit(e));

        // Delete button (only in edit mode)
        root.querySelector('#modal-delete-btn')?.addEventListener('click', () => {
            if (!this.isEditMode || !this.editingTransactionId) return;

            const confirmed = confirm('Are you sure you want to delete this transaction?');
            if (!confirmed) return;

            // Dispatch delete event
            this.dispatchEvent(new CustomEvent('delete-transaction', {
                bubbles: true,
                composed: true,
                detail: { id: this.editingTransactionId },
            }));

            // Close modal
            this.closeModal();
        });
    }

    // ============================================================
    // MODAL & FORM
    // ============================================================

    openModal() {
        this.isModalOpen = true;
        this.isEditMode = false;
        this.editingTransactionId = null;
        this.currentGroupId = null; // Reset group selection when opening modal
        this.render();
        this.setupEventListeners();
        const dateInput = this.shadowRoot.querySelector('#tx-date');
        if (dateInput) {
            // Use local date to avoid timezone issues
            const now = new Date();
            const year = now.getFullYear();
            const month = String(now.getMonth() + 1).padStart(2, '0');
            const day = String(now.getDate()).padStart(2, '0');
            dateInput.value = `${year}-${month}-${day}`;
        }
        this.dispatchEvent(new CustomEvent('open-manual-entry', { bubbles: true, composed: true, detail: { source: 'transactions-page' } }));
    }

    openTransactionModal(transactionId) {
        const tx = this.transactions.find((t) => t.id === transactionId);
        if (!tx) return;

        this.isModalOpen = true;
        this.isEditMode = true;
        this.editingTransactionId = transactionId;
        this.currentGroupId = tx.group || null;
        this.render();
        this.setupEventListeners();
    }

    closeModal() {
        this.isModalOpen = false;
        this.isEditMode = false;
        this.editingTransactionId = null;
        this.currentGroupId = null; // Reset group selection when closing modal
        const form = this.shadowRoot.querySelector('#transaction-form');
        if (form) form.reset();
        this.render();
        this.setupEventListeners();
    }

    /**
     * Update the category dropdown based on currently selected group.
     * Called when the group dropdown changes to filter categories.
     * This method updates only the category dropdown without full re-render.
     */
    _updateCategoryDropdown() {
        const categorySelect = this.shadowRoot.querySelector('#tx-category');
        if (!categorySelect) return;

        const filteredCategories = this.getCategoriesForCurrentGroup();
        const showPlaceholder = !this.currentGroupId || filteredCategories.length === 0;

        // Clear and rebuild options
        categorySelect.innerHTML = `
            <option value="" disabled selected>${showPlaceholder ? 'Select a group first' : 'Select a category'}</option>
            ${filteredCategories.map((c) => `<option value="${c.id}">${c.name}</option>`).join('')}
        `;

        // Enable/disable based on whether we have categories
        categorySelect.disabled = showPlaceholder;

        log('Category dropdown updated:', { groupId: this.currentGroupId, categoryCount: filteredCategories.length });
    }

    showNotification(message, isSuccess = true, duration = 2500) {
        const banner = this.shadowRoot.querySelector('#notification-banner');
        if (!banner) return;
        banner.textContent = message;
        banner.className = `notification-banner ${isSuccess ? 'success' : 'error'} show`;
        clearTimeout(this._notificationTimer);
        this._notificationTimer = setTimeout(() => banner.classList.remove('show'), duration);
    }

    handleFormSubmit(e) {
        e.preventDefault();
        const form = this.shadowRoot.querySelector('#transaction-form');
        const formData = new FormData(form);
        const amount = parseFloat(formData.get('amount'));
        const date = formData.get('date');
        const group = formData.get('group');
        const category = formData.get('category');
        const merchant = formData.get('merchant') || '';
        const notes = formData.get('notes') || '';

        if (!Number.isFinite(amount) || amount <= 0) { this.showNotification('Please enter a valid amount greater than 0', false); return; }
        if (!date) { this.showNotification('Please select a date', false); return; }
        if (!group) { this.showNotification('Please select a group', false); return; }
        if (!category) { this.showNotification('Please select a category', false); return; }

        const transactionData = {
            amount, date, group, category, merchant, notes, name: merchant || category, account: 'Manual Entry', type: category, status: 'complete',
        };

        // If in edit mode, include the ID and dispatch update event
        if (this.isEditMode && this.editingTransactionId) {
            transactionData.id = this.editingTransactionId;
            this.dispatchEvent(new CustomEvent('update-transaction', {
                bubbles: true,
                composed: true,
                detail: transactionData,
            }));
            this.showNotification('Transaction updated successfully!', true);
            this.closeModal();
        } else {
            // Otherwise, add new transaction
            this.dispatchEvent(new CustomEvent('add-transaction', { bubbles: true, composed: true, detail: transactionData }));

            // Show success notification immediately (same as error notifications)
            this.showNotification('Transaction successfully added!', true);

            // Reset form but keep today's date
            form.reset();
            const dateInput = this.shadowRoot.querySelector('#tx-date');
            if (dateInput) {
                dateInput.value = new Date().toISOString().split('T')[0];
            }
            this.currentGroupId = null;
            this._updateCategoryDropdown();
        }
    }

    onTransactionAdded(savedTransaction) {
        this.showNotification('Transaction successfully added!', true);
        // Modal remains open for further additions
    }

    onTransactionUpdated(updatedTransaction) {
        this.showNotification(`Updated: ${updatedTransaction.merchant || updatedTransaction.category} • $${Number(updatedTransaction.amount).toFixed(2)}`, true);
        this.closeModal();
    }

    onTransactionDeleted(transactionId) {
        this.showNotification('Transaction deleted successfully', true);
    }

    onTransactionError(errorMessage) {
        this.showNotification(errorMessage || 'Failed to save transaction', false);
    }
}

customElements.define('finsite-transactions', FinSiteTransactions);
export { FinSiteTransactions };
