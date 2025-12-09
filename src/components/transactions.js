/**
 * Transactions Web Component for FinSite
 * Refactored UI/UX with sticky header, date grouping, and advanced filters
 */
class FinSiteTransactions extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });

        // Core state: all transactions
        this.transactions = [];

        // Filter state
        this.filters = {
            scope: 'all',          // all, income, expense
            search: '',            // search query
            dateRange: null,       // { start: Date, end: Date } or null
            groups: [],            // selected group IDs
            categories: [],        // selected category IDs
        };

        // UI state
        this.sortOrder = 'newest';     // newest, oldest, amount-high, amount-low
        this.isSearchActive = false;
        this.isDatePickerOpen = false;
        this.isFilterPanelOpen = false;
        this.isModalOpen = false;
        this.isEditMultipleMode = false;
        this.selectedTransactions = new Set();

        // Available groups and categories for filters
        this.availableGroups = [
            { id: 'household', name: 'Household' },
            { id: 'investments', name: 'Investments' },
            { id: 'expenses', name: 'General Expenses' }
        ];
        this.availableCategories = [
            { id: 'groceries', name: 'Groceries', groupId: 'household' },
            { id: 'utilities', name: 'Utilities', groupId: 'household' },
            { id: 'fuel', name: 'Fuel', groupId: 'household' },
            { id: 'stocks', name: 'Stocks', groupId: 'investments' },
            { id: 'bonds', name: 'Bonds', groupId: 'investments' },
            { id: 'dining-out', name: 'Dining Out', groupId: 'expenses' },
            { id: 'shopping', name: 'Shopping', groupId: 'expenses' }
        ];
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
        this.render();
        this.setupEventListeners();
    }

    // ============================================================
    // FILTERING & SORTING
    // ============================================================

    getFilteredTransactions() {
        let filtered = [...this.transactions];

        // Scope filter
        if (this.filters.scope === 'expense') {
            filtered = filtered.filter(tx => Number(tx.amount) > 0);
        } else if (this.filters.scope === 'income') {
            filtered = filtered.filter(tx => Number(tx.amount) < 0);
        }

        // Search filter
        if (this.filters.search.trim()) {
            const q = this.filters.search.toLowerCase();
            filtered = filtered.filter(tx =>
                (tx.merchant || '').toLowerCase().includes(q) ||
                (tx.category || '').toLowerCase().includes(q) ||
                (tx.notes || '').toLowerCase().includes(q) ||
                (tx.group || '').toLowerCase().includes(q) ||
                (tx.name || '').toLowerCase().includes(q)
            );
        }

        // Date range filter
        if (this.filters.dateRange) {
            const { start, end } = this.filters.dateRange;
            filtered = filtered.filter(tx => {
                const txDate = new Date(tx.date);
                return txDate >= start && txDate <= end;
            });
        }

        // Group filter
        if (this.filters.groups.length > 0) {
            filtered = filtered.filter(tx => this.filters.groups.includes(tx.group));
        }

        // Category filter
        if (this.filters.categories.length > 0) {
            filtered = filtered.filter(tx => this.filters.categories.includes(tx.category));
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
        
        const date = new Date(dateStr);
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
            day: 'numeric'
        });
    }

    clearAllFilters() {
        this.filters = { scope: 'all', search: '', dateRange: null, groups: [], categories: [] };
        this.isSearchActive = false;
        this.isDatePickerOpen = false;
        this.isFilterPanelOpen = false;
        this.render();
        this.setupEventListeners();
    }

    hasActiveFilters() {
        return this.filters.scope !== 'all' ||
               this.filters.search.trim() !== '' ||
               this.filters.dateRange !== null ||
               this.filters.groups.length > 0 ||
               this.filters.categories.length > 0;
    }

    // ============================================================
    // ICON HELPERS
    // ============================================================

    getCategoryIcon(category) {
        const icons = {
            'groceries': '🛒', 'utilities': '💡', 'fuel': '⛽', 'stocks': '📈',
            'bonds': '📊', 'dining-out': '🍽️', 'dining': '🍽️', 'shopping': '🛍️',
            'transport': '🚗', 'healthcare': '🏥', 'entertainment': '🎬',
            'education': '📚', 'bills': '📄', 'loans': '💰', 'luxuries': '💎', 'other': '📝'
        };
        return icons[(category || '').toLowerCase()] || '💸';
    }

    getGroupIcon(group) {
        const icons = { 'household': '🏠', 'investments': '📈', 'expenses': '💳', 'manual': '✏️' };
        return icons[(group || '').toLowerCase()] || '📁';
    }

    getGroupName(groupId) {
        const group = this.availableGroups.find(g => g.id === groupId);
        return group ? group.name : groupId;
    }

    escapeHtml(str) {
        return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;')
            .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
    }

    // ============================================================
    // RENDER
    // ============================================================

    render() {
        const filtered = this.getFilteredTransactions();
        const grouped = this.groupTransactionsByDate(filtered);
        const hasFilters = this.hasActiveFilters();

        this.shadowRoot.innerHTML = `
            <style>${this.getStyles()}</style>
            <div class="transactions-page">
                <header class="page-header">
                    <div class="header-content">
                        <h1 class="page-title">Transactions</h1>
                        <div class="header-actions">
                            ${hasFilters ? '<button class="action-link" id="clear-all-btn">Clear</button>' : ''}
                            <button class="action-btn ${this.isSearchActive ? 'active' : ''}" id="search-btn">
                                <span class="btn-icon">🔍</span><span class="btn-label">Search</span>
                            </button>
                            <button class="action-btn ${this.filters.dateRange ? 'active' : ''}" id="date-btn">
                                <span class="btn-icon">📅</span><span class="btn-label">Date</span>
                            </button>
                            <button class="action-btn ${this.filters.groups.length || this.filters.categories.length ? 'active' : ''}" id="filter-btn">
                                <span class="btn-icon">⚙️</span><span class="btn-label">Filters</span>
                            </button>
                            <button class="add-btn" id="add-transaction-btn" data-testid="btn-add-transaction">
                                <span class="add-icon">+</span><span>Add Transaction</span>
                            </button>
                        </div>
                    </div>
                    ${this.isSearchActive ? this.renderSearchBar() : ''}
                    ${this.isDatePickerOpen ? this.renderDatePicker() : ''}
                    ${this.isFilterPanelOpen ? this.renderFilterPanel() : ''}
                </header>

                <div class="filter-bar">
                    <div class="filter-bar-left">
                        <select class="scope-select" id="scope-select">
                            <option value="all" ${this.filters.scope === 'all' ? 'selected' : ''}>All transactions</option>
                            <option value="expense" ${this.filters.scope === 'expense' ? 'selected' : ''}>Expenses only</option>
                            <option value="income" ${this.filters.scope === 'income' ? 'selected' : ''}>Income only</option>
                        </select>
                        ${hasFilters ? `<span class="filter-badge">${filtered.length} of ${this.transactions.length}</span>` : ''}
                    </div>
                    <div class="filter-bar-right">
                        <button class="control-btn ${this.isEditMultipleMode ? 'active' : ''}" id="edit-multiple-btn">Edit multiple</button>
                        <select class="sort-select" id="sort-select">
                            <option value="newest" ${this.sortOrder === 'newest' ? 'selected' : ''}>Newest first</option>
                            <option value="oldest" ${this.sortOrder === 'oldest' ? 'selected' : ''}>Oldest first</option>
                            <option value="amount-high" ${this.sortOrder === 'amount-high' ? 'selected' : ''}>Amount (high)</option>
                            <option value="amount-low" ${this.sortOrder === 'amount-low' ? 'selected' : ''}>Amount (low)</option>
                        </select>
                    </div>
                </div>

                <div class="transaction-list-container" data-testid="transaction-list">
                    ${filtered.length === 0 ? this.renderEmptyState(hasFilters) : this.renderTransactionList(grouped)}
                </div>

                <div class="notification-banner" id="notification-banner"></div>
                ${this.renderModal()}
            </div>
        `;
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
                <div class="date-transactions">${txs.map(tx => this.renderTransactionRow(tx)).join('')}</div>
            </div>`;
        }
        return html + '</div>';
    }

    renderTransactionRow(tx) {
        const amount = Number(tx.amount) || 0;
        const isExpense = amount > 0;
        const formatted = Math.abs(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        const catIcon = this.getCategoryIcon(tx.category);
        const grpIcon = this.getGroupIcon(tx.group);
        const merchant = tx.merchant || tx.name || tx.category || 'Transaction';
        const isSelected = this.selectedTransactions.has(tx.id);

        return `
            <div class="transaction-row ${isSelected ? 'selected' : ''}" data-id="${tx.id}">
                ${this.isEditMultipleMode ? `<div class="row-checkbox"><input type="checkbox" class="tx-checkbox" data-id="${tx.id}" ${isSelected ? 'checked' : ''}></div>` : ''}
                <div class="row-icon ${isExpense ? 'expense' : 'income'}">${catIcon}</div>
                <div class="row-merchant"><span class="merchant-name">${this.escapeHtml(merchant)}</span></div>
                <div class="row-category"><span class="category-icon">${catIcon}</span><span class="category-name">${this.escapeHtml(tx.category || 'Uncategorized')}</span></div>
                <div class="row-account"><span class="account-icon">${grpIcon}</span><span class="account-name">${this.escapeHtml(this.getGroupName(tx.group || 'expenses'))}</span></div>
                <div class="row-amount ${isExpense ? 'expense' : 'income'}">${isExpense ? '-' : '+'}$${formatted}</div>
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
                    <div class="filter-options">${this.availableGroups.map(g => `
                        <label class="filter-option"><input type="checkbox" class="group-checkbox" value="${g.id}" ${this.filters.groups.includes(g.id) ? 'checked' : ''}>
                        <span class="option-icon">${this.getGroupIcon(g.id)}</span><span class="option-label">${g.name}</span></label>
                    `).join('')}</div>
                </div>
                <div class="filter-section">
                    <div class="filter-section-title">Categories</div>
                    <div class="filter-options">${this.availableCategories.map(c => `
                        <label class="filter-option"><input type="checkbox" class="category-checkbox" value="${c.id}" ${this.filters.categories.includes(c.id) ? 'checked' : ''}>
                        <span class="option-icon">${this.getCategoryIcon(c.id)}</span><span class="option-label">${c.name}</span></label>
                    `).join('')}</div>
                </div>
                <div class="panel-actions"><button class="btn-secondary" id="filter-clear-btn">Clear</button><button class="btn-primary" id="filter-apply-btn">Apply</button></div>
            </div>
        `;
    }

    renderModal() {
        return `
            <div class="modal-overlay ${this.isModalOpen ? '' : 'hidden'}" id="modal-overlay">
                <div class="modal-container">
                    <div class="modal-header">
                        <div><div class="modal-title">Add New Transaction</div><div class="modal-subtitle">Enter transaction details below</div></div>
                        <button class="modal-close-btn" id="modal-close-btn">✕</button>
                    </div>
                    <form class="modal-form" id="transaction-form" novalidate>
                        <div class="form-row">
                            <div class="form-group"><label class="form-label" for="tx-amount">Amount (USD)</label>
                                <input class="form-input" type="number" id="tx-amount" data-testid="input-amount" name="amount" step="0.01" min="0.01" placeholder="e.g., 12.34" required /></div>
                            <div class="form-group"><label class="form-label" for="tx-date">Date</label>
                                <input class="form-input" type="date" id="tx-date" data-testid="input-date" name="date" required /></div>
                        </div>
                        <div class="form-row">
                            <div class="form-group"><label class="form-label" for="tx-group">Group</label>
                                <select class="form-select" id="tx-group" data-testid="select-group" name="group" required>
                                    <option value="" disabled selected>Select a group</option>
                                    ${this.availableGroups.map(g => `<option value="${g.id}">${g.name}</option>`).join('')}
                                    <option value="manual">Manual Entry</option>
                                </select></div>
                            <div class="form-group"><label class="form-label" for="tx-category">Category</label>
                                <select class="form-select" id="tx-category" data-testid="select-categroy" name="category" required>
                                    <option value="" disabled selected>Select a category</option>
                                    <option value="bills">Bills</option><option value="utilities">Utilities</option>
                                    <option value="groceries">Groceries</option><option value="dining">Dining</option>
                                    <option value="transport">Transport</option><option value="loans">Loans</option>
                                    <option value="healthcare">Healthcare</option><option value="entertainment">Entertainment</option>
                                    <option value="education">Education</option><option value="luxuries">Luxuries</option>
                                    <option value="other">Other</option>
                                </select></div>
                        </div>
                        <div class="form-group"><label class="form-label" for="tx-merchant">Merchant</label>
                            <input class="form-input" type="text" id="tx-merchant" data-testid="input-merchant" name="merchant" placeholder="e.g., Amazon, Walmart" /></div>
                        <div class="form-group"><label class="form-label" for="tx-notes">Notes</label>
                            <textarea class="form-textarea" id="tx-notes" name="notes" placeholder="Add any additional notes..."></textarea></div>
                        <div class="modal-actions">
                            <button type="button" class="btn-secondary" id="modal-cancel-btn">Cancel</button>
                            <button type="submit" class="btn-primary" data-testid="btn-add-transaction">Add Transaction</button>
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
            :host { display: block; width: 100%; height: 100%; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #f1f5f9; }
            .transactions-page { display: flex; flex-direction: column; height: 100%; background: #0f172a; }

            /* Header */
            .page-header { position: sticky; top: 0; z-index: 100; background: #0f172a; border-bottom: 1px solid #334155; padding: 1.25rem 2rem 0; }
            .header-content { display: flex; justify-content: space-between; align-items: center; padding-bottom: 1rem; }
            .page-title { font-size: 1.75rem; font-weight: 700; color: #f1f5f9; }
            .header-actions { display: flex; align-items: center; gap: 0.75rem; }
            .action-link { background: none; border: none; color: #f97316; font-size: 0.875rem; font-weight: 500; cursor: pointer; padding: 0.5rem; }
            .action-link:hover { color: #fb923c; text-decoration: underline; }
            .action-btn { display: flex; align-items: center; gap: 0.375rem; padding: 0.5rem 0.875rem; background: #1e293b; border: 1px solid #334155; border-radius: 0.5rem; color: #94a3b8; font-size: 0.875rem; cursor: pointer; transition: all 0.15s ease; }
            .action-btn:hover { background: #334155; border-color: #475569; color: #f1f5f9; }
            .action-btn.active { background: #1e293b; border-color: #f97316; color: #f97316; }
            .btn-icon { font-size: 1rem; }
            .add-btn { display: flex; align-items: center; gap: 0.375rem; padding: 0.5rem 1rem; background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); border: none; border-radius: 0.5rem; color: #ffffff; font-size: 0.875rem; font-weight: 600; cursor: pointer; transition: all 0.15s ease; box-shadow: 0 2px 4px rgba(249, 115, 22, 0.3); }
            .add-btn:hover { background: linear-gradient(135deg, #fb923c 0%, #f97316 100%); box-shadow: 0 4px 8px rgba(249, 115, 22, 0.4); transform: translateY(-1px); }
            .add-icon { font-size: 1.125rem; font-weight: 700; }

            /* Search Bar */
            .search-bar { display: flex; align-items: center; gap: 0.5rem; padding: 0.75rem 0; border-top: 1px solid #334155; margin-top: 0.5rem; }
            .search-input { flex: 1; padding: 0.625rem 1rem; background: #1e293b; border: 1px solid #334155; border-radius: 0.5rem; color: #f1f5f9; font-size: 0.875rem; outline: none; transition: border-color 0.15s ease; }
            .search-input:focus { border-color: #f97316; box-shadow: 0 0 0 3px rgba(249, 115, 22, 0.15); }
            .search-input::placeholder { color: #64748b; }
            .search-close { padding: 0.5rem; background: none; border: none; color: #64748b; font-size: 1rem; cursor: pointer; }
            .search-close:hover { color: #f1f5f9; }

            /* Panels */
            .panel { background: #1e293b; border: 1px solid #334155; border-radius: 0.75rem; padding: 1rem; margin-top: 0.5rem; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3); }
            .panel-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
            .panel-title { font-size: 0.875rem; font-weight: 600; color: #f1f5f9; }
            .panel-close { padding: 0.25rem; background: none; border: none; color: #64748b; font-size: 1.25rem; cursor: pointer; }
            .panel-close:hover { color: #f1f5f9; }
            .date-inputs { display: flex; gap: 1rem; margin-bottom: 1rem; }
            .date-field { flex: 1; display: flex; flex-direction: column; gap: 0.375rem; }
            .date-field label { font-size: 0.75rem; color: #94a3b8; font-weight: 500; }
            .date-field input { padding: 0.5rem; background: #0f172a; border: 1px solid #334155; border-radius: 0.375rem; font-size: 0.875rem; color: #f1f5f9; }
            .date-presets { display: flex; gap: 0.5rem; margin-bottom: 1rem; }
            .preset-btn { padding: 0.375rem 0.75rem; background: #0f172a; border: 1px solid #334155; border-radius: 9999px; font-size: 0.75rem; color: #94a3b8; cursor: pointer; }
            .preset-btn:hover { background: #334155; color: #f1f5f9; }
            .filter-section { margin-bottom: 1rem; }
            .filter-section-title { font-size: 0.75rem; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.5rem; }
            .filter-options { display: flex; flex-wrap: wrap; gap: 0.5rem; }
            .filter-option { display: flex; align-items: center; gap: 0.375rem; padding: 0.375rem 0.75rem; background: #0f172a; border: 1px solid #334155; border-radius: 0.5rem; cursor: pointer; transition: all 0.15s ease; }
            .filter-option:has(input:checked) { background: rgba(249, 115, 22, 0.15); border-color: #f97316; }
            .filter-option input { display: none; }
            .option-icon { font-size: 0.875rem; }
            .option-label { font-size: 0.8125rem; color: #94a3b8; }
            .filter-option:has(input:checked) .option-label { color: #f97316; }
            .panel-actions { display: flex; justify-content: flex-end; gap: 0.5rem; padding-top: 0.75rem; border-top: 1px solid #334155; }
            .btn-secondary { padding: 0.5rem 1rem; background: #1e293b; border: 1px solid #334155; border-radius: 0.5rem; color: #94a3b8; font-size: 0.875rem; cursor: pointer; }
            .btn-secondary:hover { background: #334155; color: #f1f5f9; }
            .btn-primary { padding: 0.5rem 1rem; background: #f97316; border: none; border-radius: 0.5rem; color: #ffffff; font-size: 0.875rem; font-weight: 500; cursor: pointer; }
            .btn-primary:hover { background: #fb923c; }

            /* Filter Bar */
            .filter-bar { display: flex; justify-content: space-between; align-items: center; padding: 0.75rem 2rem; background: #0f172a; border-bottom: 1px solid #334155; }
            .filter-bar-left { display: flex; align-items: center; gap: 1rem; }
            .scope-select, .sort-select { padding: 0.5rem 2rem 0.5rem 0.75rem; background: #1e293b; border: 1px solid #334155; border-radius: 9999px; color: #f1f5f9; font-size: 0.875rem; cursor: pointer; appearance: none; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 0.75rem center; }
            .filter-badge { font-size: 0.75rem; color: #94a3b8; background: #1e293b; padding: 0.25rem 0.5rem; border-radius: 9999px; }
            .filter-bar-right { display: flex; align-items: center; gap: 0.75rem; }
            .control-btn { padding: 0.5rem 0.875rem; background: #1e293b; border: 1px solid #334155; border-radius: 0.5rem; color: #94a3b8; font-size: 0.8125rem; cursor: pointer; }
            .control-btn:hover { background: #334155; color: #f1f5f9; }
            .control-btn.active { background: #1e293b; border-color: #f97316; color: #f97316; }

            /* Transaction List */
            .transaction-list-container { flex: 1; overflow-y: auto; padding: 1rem 2rem 2rem; }
            .transaction-list { background: #1e293b; border-radius: 0.75rem; border: 1px solid #334155; overflow: hidden; }
            .date-group { border-bottom: 1px solid #334155; }
            .date-group:last-child { border-bottom: none; }
            .date-header { padding: 0.75rem 1.25rem; background: #0f172a; font-size: 0.8125rem; font-weight: 600; color: #64748b; border-bottom: 1px solid #334155; }
            .transaction-row { display: grid; grid-template-columns: auto 1fr auto auto auto auto; align-items: center; gap: 1rem; padding: 1rem 1.25rem; border-bottom: 1px solid #0f172a; cursor: pointer; transition: background 0.15s ease; }
            .transaction-row:last-child { border-bottom: none; }
            .transaction-row:hover { background: #334155; }
            .transaction-row.selected { background: rgba(249, 115, 22, 0.1); }
            .row-checkbox { display: flex; align-items: center; }
            .tx-checkbox { width: 1rem; height: 1rem; cursor: pointer; accent-color: #f97316; }
            .row-icon { width: 2.5rem; height: 2.5rem; border-radius: 0.625rem; display: flex; align-items: center; justify-content: center; font-size: 1.125rem; }
            .row-icon.expense { background: rgba(239, 68, 68, 0.15); }
            .row-icon.income { background: rgba(16, 185, 129, 0.15); }
            .row-merchant { min-width: 0; }
            .merchant-name { font-size: 0.9375rem; font-weight: 500; color: #f1f5f9; }
            .row-category, .row-account { display: flex; align-items: center; gap: 0.375rem; font-size: 0.8125rem; color: #64748b; }
            .category-icon, .account-icon { font-size: 0.875rem; }
            .row-amount { font-size: 0.9375rem; font-weight: 600; text-align: right; min-width: 5rem; }
            .row-amount.expense { color: #ef4444; }
            .row-amount.income { color: #10b981; }
            .row-chevron { color: #475569; font-size: 1.25rem; font-weight: 300; }

            /* Empty State */
            .empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 4rem 2rem; text-align: center; background: #1e293b; border-radius: 0.75rem; border: 1px solid #334155; }
            .empty-icon { font-size: 3rem; margin-bottom: 1rem; }
            .empty-title { font-size: 1.125rem; font-weight: 600; color: #f1f5f9; margin-bottom: 0.5rem; }
            .empty-subtitle { font-size: 0.875rem; color: #64748b; margin-bottom: 1.5rem; }
            .empty-action-btn { padding: 0.5rem 1rem; background: #1e293b; border: 1px solid #334155; border-radius: 0.5rem; color: #f97316; font-size: 0.875rem; font-weight: 500; cursor: pointer; }
            .empty-action-btn:hover { background: rgba(249, 115, 22, 0.1); border-color: #f97316; }

            /* Notification */
            .notification-banner { position: fixed; top: 0; left: 0; right: 0; padding: 0.75rem 1rem; text-align: center; font-size: 0.875rem; font-weight: 500; transform: translateY(-100%); transition: transform 0.3s ease; z-index: 1001; }
            .notification-banner.show { transform: translateY(0); }
            .notification-banner.success { background: rgba(16, 185, 129, 0.95); color: #ffffff; }
            .notification-banner.error { background: rgba(239, 68, 68, 0.95); color: #ffffff; }

            /* Modal */
            .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0, 0, 0, 0.7); display: flex; align-items: center; justify-content: center; z-index: 1000; backdrop-filter: blur(4px); }
            .modal-overlay.hidden { display: none; }
            .modal-container { background: #1e293b; border-radius: 1rem; padding: 1.5rem; width: 100%; max-width: 480px; border: 1px solid #334155; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5); animation: modalSlideIn 0.2s ease-out; }
            @keyframes modalSlideIn { from { opacity: 0; transform: translateY(-20px) scale(0.95); } to { opacity: 1; transform: translateY(0) scale(1); } }
            .modal-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.25rem; padding-bottom: 1rem; border-bottom: 1px solid #334155; }
            .modal-title { font-size: 1.125rem; font-weight: 600; color: #f1f5f9; }
            .modal-subtitle { font-size: 0.8125rem; color: #64748b; margin-top: 0.25rem; }
            .modal-close-btn { background: none; border: none; color: #64748b; font-size: 1.5rem; cursor: pointer; padding: 0; line-height: 1; }
            .modal-close-btn:hover { color: #f1f5f9; }
            .modal-form { display: flex; flex-direction: column; gap: 1rem; }
            .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
            .form-group { display: flex; flex-direction: column; gap: 0.375rem; }
            .form-label { font-size: 0.8125rem; font-weight: 500; color: #94a3b8; }
            .form-input, .form-select, .form-textarea { padding: 0.625rem 0.875rem; background: #0f172a; border: 1px solid #334155; border-radius: 0.5rem; color: #f1f5f9; font-size: 0.875rem; outline: none; transition: border-color 0.15s ease, box-shadow 0.15s ease; }
            .form-input:focus, .form-select:focus, .form-textarea:focus { border-color: #f97316; box-shadow: 0 0 0 3px rgba(249, 115, 22, 0.15); }
            .form-input::placeholder, .form-textarea::placeholder { color: #64748b; }
            .form-select { cursor: pointer; }
            .form-select option { background: #1e293b; color: #f1f5f9; }
            .form-textarea { min-height: 80px; resize: vertical; }
            .modal-actions { display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 0.5rem; padding-top: 1rem; border-top: 1px solid #334155; }

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
        root.querySelectorAll('#add-transaction-btn, #empty-add-btn').forEach(btn => {
            btn?.addEventListener('click', () => this.openModal());
        });

        // Clear all filters
        root.querySelectorAll('#clear-all-btn, #empty-clear-btn').forEach(btn => {
            btn?.addEventListener('click', () => this.clearAllFilters());
        });

        // Search button toggle
        root.querySelector('#search-btn')?.addEventListener('click', () => {
            this.isSearchActive = !this.isSearchActive;
            this.isDatePickerOpen = false;
            this.isFilterPanelOpen = false;
            this.render();
            this.setupEventListeners();
        });

        // Search input
        root.querySelector('#search-input')?.addEventListener('input', (e) => {
            this.filters.search = e.target.value;
            this.render();
            this.setupEventListeners();
            root.querySelector('#search-input')?.focus();
        });

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
                    start: new Date(startInput.value + 'T00:00:00'),
                    end: new Date(endInput.value + 'T23:59:59')
                };
            }
            this.isDatePickerOpen = false;
            this.render();
            this.setupEventListeners();
        });

        // Date presets
        root.querySelectorAll('.preset-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const preset = btn.dataset.preset;
                const now = new Date();
                let start, end;

                switch (preset) {
                    case 'today':
                        start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                        end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
                        break;
                    case 'week':
                        const dayOfWeek = now.getDay();
                        start = new Date(now);
                        start.setDate(now.getDate() - dayOfWeek);
                        start.setHours(0, 0, 0, 0);
                        end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
                        break;
                    case 'month':
                        start = new Date(now.getFullYear(), now.getMonth(), 1);
                        end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
                        break;
                    case 'year':
                        start = new Date(now.getFullYear(), 0, 1);
                        end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
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
            this.filters.groups = Array.from(root.querySelectorAll('.group-checkbox:checked')).map(cb => cb.value);
            this.filters.categories = Array.from(root.querySelectorAll('.category-checkbox:checked')).map(cb => cb.value);
            this.isFilterPanelOpen = false;
            this.render();
            this.setupEventListeners();
        });

        // Scope dropdown
        root.querySelector('#scope-select')?.addEventListener('change', (e) => {
            this.filters.scope = e.target.value;
            this.render();
            this.setupEventListeners();
        });

        // Sort dropdown
        root.querySelector('#sort-select')?.addEventListener('change', (e) => {
            this.sortOrder = e.target.value;
            this.render();
            this.setupEventListeners();
        });

        // Edit multiple toggle
        root.querySelector('#edit-multiple-btn')?.addEventListener('click', () => {
            this.isEditMultipleMode = !this.isEditMultipleMode;
            if (!this.isEditMultipleMode) this.selectedTransactions.clear();
            this.render();
            this.setupEventListeners();
        });

        // Transaction row clicks
        root.querySelectorAll('.transaction-row').forEach(row => {
            row.addEventListener('click', (e) => {
                if (e.target.classList.contains('tx-checkbox')) return;
                console.log('Transaction clicked:', row.dataset.id);
            });
        });

        // Checkbox changes
        root.querySelectorAll('.tx-checkbox').forEach(cb => {
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

        // Form submission
        root.querySelector('#transaction-form')?.addEventListener('submit', (e) => this.handleFormSubmit(e));
    }

    // ============================================================
    // MODAL & FORM
    // ============================================================

    openModal() {
        this.isModalOpen = true;
        this.render();
        this.setupEventListeners();
        const dateInput = this.shadowRoot.querySelector('#tx-date');
        if (dateInput) dateInput.value = new Date().toISOString().split('T')[0];
        this.dispatchEvent(new CustomEvent('open-manual-entry', { bubbles: true, composed: true, detail: { source: 'transactions-page' } }));
    }

    closeModal() {
        this.isModalOpen = false;
        const form = this.shadowRoot.querySelector('#transaction-form');
        if (form) form.reset();
        this.render();
        this.setupEventListeners();
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

        const transactionData = { amount, date, group, category, merchant, notes, name: merchant || category, account: 'Manual Entry', type: category, status: 'complete' };
        this.dispatchEvent(new CustomEvent('add-transaction', { bubbles: true, composed: true, detail: transactionData }));
    }

    onTransactionAdded(savedTransaction) {
        this.showNotification(`Added: ${savedTransaction.merchant || savedTransaction.category} • $${Number(savedTransaction.amount).toFixed(2)}`, true);
        this.closeModal();
    }

    onTransactionError(errorMessage) {
        this.showNotification(errorMessage || 'Failed to save transaction', false);
    }
}

customElements.define('finsite-transactions', FinSiteTransactions);
export { FinSiteTransactions };
