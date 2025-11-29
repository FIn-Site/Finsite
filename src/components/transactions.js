/**
 * Transactions Web Component for FinSite
 * Matches the exact reference image layout and styling
 */
class FinSiteTransactions extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });

        // Core state: all transactions currently displayed
        this.transactions = [];

        // Summary data derived from this.transactions (spending-only)
        this.summaryData = {
            totalSpent: 0,
            totalTransactions: 0,
            avgPerTransaction: 0
        };

        // UI state
        this.currentFilter = 'all';
        this.searchQuery = '';
    }

    /**
     * Set transactions data from external source (MVC model)
     * @param {Array<Object>} transactionsArray
     */
    setTransactions(transactionsArray) {
        this.transactions = Array.isArray(transactionsArray)
            ? [...transactionsArray]
            : [];

        this.calculateSummaryData();

        // Only re-render if the component is already connected
        if (this.isConnected) {
            this.render();
            this.setupEventListeners();
        }
    }

    /**
     * Calculate summary statistics for spending-only view
     * Assumes all amounts are positive "money out"
     */
    calculateSummaryData() {
        let totalSpent = 0;

        this.transactions.forEach((tx) => {
            const amount = Number(tx.amount) || 0;
            totalSpent += amount;
        });

        const totalTransactions = this.transactions.length;
        const avgPerTransaction =
            totalTransactions > 0 ? totalSpent / totalTransactions : 0;

        this.summaryData = {
            totalSpent,
            totalTransactions,
            avgPerTransaction
        };
    }

    connectedCallback() {
        // Ensure transactions is at least an empty array
        if (!Array.isArray(this.transactions)) {
            this.transactions = [];
        }

        // Keep summary in sync with whatever data we currently have
        this.calculateSummaryData();

        this.render();
        this.setupEventListeners();
    }


    render() {
        this.shadowRoot.innerHTML = `
            <style>
                /* Reset-aware styles for shadow DOM */
                * {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                }

                :host {
                    display: block;
                    width: 100%;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    color: #ffffff;
                }

                .transactions-card {
                    background: #111827;
                    border-radius: 1rem;
                    padding: 1.5rem;
                    border: 1px solid #1f2937;
                    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);
                    display: flex;
                    flex-direction: column;
                    gap: 1.5rem;
                }

                .transactions-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 1.5rem;
                    flex-wrap: wrap;
                    gap: 1.5rem;
                }

                .header-left {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                }

                .transactions-title {
                    font-size: 1.125rem;
                    font-weight: 600;
                    letter-spacing: 0.01em;
                }

                .badge {
                    display: inline-flex;
                    align-items: center;
                    gap: 0.25rem;
                    padding: 0.125rem 0.5rem;
                    background: rgba(52, 211, 153, 0.1);
                    border-radius: 9999px;
                    border: 1px solid rgba(52, 211, 153, 0.2);
                    font-size: 0.7rem;
                    text-transform: uppercase;
                    letter-spacing: 0.08em;
                    color: #6ee7b7;
                }

                .badge-dot {
                    width: 0.375rem;
                    height: 0.375rem;
                    border-radius: 9999px;
                    background: #10b981;
                    box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.5);
                }

                .header-right {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                    flex-wrap: wrap;
                    justify-content: flex-end;
                }

                .search-container {
                    position: relative;
                    flex: 1;
                    max-width: 25rem;
                }

                .search-input {
                    width: 100%;
                    padding: 0.625rem 1rem;
                    background: #374151;
                    border: none;
                    border-radius: 0.5rem;
                    color: #ffffff;
                    font-size: 0.875rem;
                    outline: none;
                    transition: all 0.2s ease;
                }

                .search-input::placeholder {
                    color: #9ca3af;
                }

                .header-actions {
                    display: flex;
                    gap: 0.75rem;
                    align-items: center;
                }

                .filter-buttons {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                }

                .filter-btn {
                    padding: 0.4rem 0.75rem;
                    border-radius: 9999px;
                    border: 1px solid #4b5563;
                    background: transparent;
                    color: #e5e7eb;
                    font-size: 0.75rem;
                    cursor: pointer;
                    display: inline-flex;
                    align-items: center;
                    gap: 0.25rem;
                    transition: all 0.2s ease;
                }

                .filter-btn:hover {
                    background: #374151;
                }

                .filter-btn.active {
                    background: #4b5563;
                    border-color: #6b7280;
                }

                .filter-circle {
                    width: 0.4rem;
                    height: 0.4rem;
                    border-radius: 9999px;
                    background: #9ca3af;
                }

                .filter-btn[data-filter="income"] .filter-circle {
                    background: #10b981;
                }

                .filter-btn[data-filter="expenses"] .filter-circle {
                    background: #ef4444;
                }

                .filter-btn[data-filter="pending"] .filter-circle {
                    background: #f97316;
                }

                .export-btn {
                    padding: 0.45rem 0.85rem;
                    border-radius: 9999px;
                    border: 1px solid #4b5563;
                    background: transparent;
                    color: #e5e7eb;
                    font-size: 0.75rem;
                    cursor: pointer;
                    display: inline-flex;
                    align-items: center;
                    gap: 0.35rem;
                    transition: all 0.2s ease;
                    white-space: nowrap;
                }

                .export-btn:hover {
                    background: #374151;
                }

                .export-icon {
                    font-size: 0.85rem;
                }

                .transactions-body {
                    display: flex;
                    flex-direction: column;
                    gap: 1.5rem;
                }

                .summary-cards {
                    display: grid;
                    grid-template-columns: repeat(4, 1fr);
                    gap: 2rem;
                    margin-bottom: 1.5rem;
                    width: 100%;
                }

                .summary-card {
                    background: transparent;
                    border: none;
                    border-radius: 0;
                    padding: 0;
                    text-align: left;
                }

                .summary-value {
                    font-size: 1.25rem;
                    font-weight: 600;
                    margin-bottom: 0.25rem;
                    color: #ffffff;
                }

                .summary-value.positive {
                    color: #10b981;
                }

                .summary-value.negative {
                    color: #ef4444;
                }

                .summary-value.neutral {
                    color: #ffffff;
                }

                .summary-label {
                    font-size: 0.75rem;
                    color: #9ca3af;
                    font-weight: 400;
                    text-transform: capitalize;
                }

                .transactions-content {
                    display: grid;
                    grid-template-columns: minmax(0, 1.8fr) minmax(0, 1fr);
                    gap: 1.5rem;
                }

                .transactions-list-card {
                    background: #020617;
                    border-radius: 0.75rem;
                    padding: 1rem 0;
                    border: 1px solid #111827;
                    overflow: hidden;
                }

                .transactions-list-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 0 1.5rem 0.75rem;
                    border-bottom: 1px solid #111827;
                }

                .transactions-list-title {
                    font-size: 0.85rem;
                    font-weight: 500;
                    text-transform: uppercase;
                    letter-spacing: 0.08em;
                    color: #9ca3af;
                }

                .transactions-list-actions {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                }

                .chip {
                    padding: 0.15rem 0.55rem;
                    border-radius: 9999px;
                    background: #111827;
                    border: 1px solid #1f2937;
                    font-size: 0.7rem;
                    color: #9ca3af;
                    display: inline-flex;
                    align-items: center;
                    gap: 0.35rem;
                }

                .chip-dot {
                    width: 0.35rem;
                    height: 0.35rem;
                    border-radius: 9999px;
                    background: #f97316;
                }

                .transactions-list {
                    max-height: 400px;
                    overflow-y: auto;
                }

                .transactions-list::-webkit-scrollbar {
                    width: 0.375rem;
                }

                .transactions-list::-webkit-scrollbar-thumb {
                    background: #1f2937;
                    border-radius: 9999px;
                }

                .transactions-list::-webkit-scrollbar-track {
                    background: transparent;
                }

                .transaction-row {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 0.75rem 1.5rem;
                    border-bottom: 1px solid #020617;
                    transition: background-color 0.15s ease;
                }

                .transaction-row:last-child {
                    border-bottom: none;
                }

                .transaction-row:hover {
                    background: #020617;
                }

                .transaction-main {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                }

                .transaction-icon {
                    width: 2.2rem;
                    height: 2.2rem;
                    border-radius: 0.75rem;
                    background: #111827;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 1.1rem;
                    flex-shrink: 0;
                }

                .transaction-icon.pending {
                    background: rgba(249, 115, 22, 0.12);
                    color: #f97316;
                }

                .transaction-icon.income {
                    background: rgba(16, 185, 129, 0.12);
                    color: #10b981;
                }

                .transaction-icon.expense {
                    background: rgba(239, 68, 68, 0.12);
                    color: #ef4444;
                }

                .transaction-text {
                    display: flex;
                    flex-direction: column;
                    gap: 0.15rem;
                }

                .transaction-name {
                    font-size: 0.9rem;
                    font-weight: 500;
                }

                .transaction-meta {
                    font-size: 0.75rem;
                    color: #9ca3af;
                    display: flex;
                    align-items: center;
                    gap: 0.4rem;
                }

                .transaction-meta-dot {
                    width: 0.2rem;
                    height: 0.2rem;
                    border-radius: 9999px;
                    background: #4b5563;
                }

                .transaction-amount {
                    font-size: 0.875rem;
                    font-weight: 600;
                    margin-right: 1rem;
                    flex-shrink: 0;
                }

                .transaction-amount.positive {
                    color: #10b981;
                }

                .transaction-amount.negative {
                    color: #ef4444;
                }

                .transaction-date {
                    font-size: 0.75rem;
                    color: #9ca3af;
                    flex-shrink: 0;
                }

                .transaction-status {
                    font-size: 0.75rem;
                    padding: 0.25rem 0.5rem;
                    border-radius: 0.375rem;
                    font-weight: 500;
                    margin-left: 0.5rem;
                }

                .status-pending {
                    background: rgba(249, 115, 22, 0.16);
                    color: #fbbf24;
                }

                .status-complete {
                    background: rgba(16, 185, 129, 0.16);
                    color: #6ee7b7;
                }

                .transactions-overview-card {
                    background: #020617;
                    border-radius: 0.75rem;
                    padding: 1rem 1.25rem;
                    border: 1px solid #111827;
                }

                .overview-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 1rem;
                }

                .overview-title {
                    font-size: 0.85rem;
                    font-weight: 500;
                    text-transform: uppercase;
                    letter-spacing: 0.08em;
                    color: #9ca3af;
                }

                .overview-tag {
                    font-size: 0.75rem;
                    color: #9ca3af;
                }

                .overview-metric {
                    margin-bottom: 1rem;
                }

                .metric-label {
                    font-size: 0.75rem;
                    color: #9ca3af;
                    margin-bottom: 0.4rem;
                }

                .metric-value {
                    font-size: 1.4rem;
                    font-weight: 600;
                    display: flex;
                    align-items: baseline;
                    gap: 0.25rem;
                }

                .metric-value.positive {
                    color: #10b981;
                }

                .metric-value.negative {
                    color: #ef4444;
                }

                .metric-trend {
                    font-size: 0.75rem;
                    color: #9ca3af;
                    display: flex;
                    align-items: center;
                    gap: 0.35rem;
                }

                .trend-icon {
                    font-size: 0.8rem;
                }

                .trend-label {
                    font-weight: 500;
                }

                .trend-value {
                    color: #10b981;
                }

                .trend-value.negative {
                    color: #ef4444;
                }

                .trend-period {
                    color: #6b7280;
                }

                .overview-list {
                    display: flex;
                    flex-direction: column;
                    gap: 0.6rem;
                }

                .overview-item {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    font-size: 0.8rem;
                }

                .overview-item-label {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    color: #d1d5db;
                }

                .badge-dot {
                    width: 0.35rem;
                    height: 0.35rem;
                    border-radius: 9999px;
                }

                .badge-dot.groceries {
                    background: #f97316;
                }

                .badge-dot.food {
                    background: #3b82f6;
                }

                .badge-dot.utilities {
                    background: #8b5cf6;
                }

                .overview-item-value {
                    font-weight: 500;
                    color: #e5e7eb;
                }

                @media (max-width: 1024px) {
                    .transactions-content {
                        grid-template-columns: minmax(0, 1.4fr) minmax(0, 0.9fr);
                    }
                }

                @media (max-width: 768px) {
                    .transactions-card {
                        padding: 1.25rem;
                    }

                    .transactions-header {
                        align-items: flex-start;
                    }

                    .header-right {
                        flex-direction: column;
                        align-items: flex-start;
                    }

                    .transactions-content {
                        grid-template-columns: minmax(0, 1fr);
                    }
                }
            </style>

            <div class="transactions-card">
                <div class="transactions-header">
                    <div class="header-left">
                        <div>
                            <div class="transactions-title">Transactions</div>
                            <div class="badge">
                                <span class="badge-dot"></span>
                                <span>Spending Tracker</span>
                            </div>
                        </div>
                    </div>
                    <div class="header-right">
                        <div class="search-container">
                            <input 
                                type="text" 
                                class="search-input" 
                                placeholder="Search transactions..." 
                                id="search-input"
                            >
                        </div>
                        <div class="header-actions">
                            <div class="filter-buttons">
                                <button class="filter-btn active" data-filter="all">All</button>
                                <button class="filter-btn" data-filter="income">Income</button>
                                <button class="filter-btn" data-filter="expenses">Expenses</button>
                                <button class="filter-btn" data-filter="pending">Pending</button>
                            </div>
                            <button class="export-btn">
                                <span class="export-icon">⭳</span>
                                <span>Export CSV</span>
                            </button>
                        </div>
                    </div>
                </div>

                <div class="summary-cards">
                    <div class="summary-card">
                        <div class="summary-value negative">
                            $${this.summaryData.totalSpent.toLocaleString()}
                        </div>
                        <div class="summary-label">Total Spent</div>
                    </div>
                    <div class="summary-card">
                        <div class="summary-value">
                            ${this.summaryData.totalTransactions}
                        </div>
                        <div class="summary-label">Total Transactions</div>
                    </div>
                    <div class="summary-card">
                        <div class="summary-value neutral">
                            $${this.summaryData.avgPerTransaction.toLocaleString(undefined, { 
                                minimumFractionDigits: 2, 
                                maximumFractionDigits: 2 
                            })}
                        </div>
                        <div class="summary-label">Average per Transaction</div>
                    </div>
                    <div class="summary-card">
                        <div class="summary-value">
                            ${this.getFilteredTransactions().length}
                        </div>
                        <div class="summary-label">Currently Visible</div>
                    </div>
                </div>

                <div class="transactions-body">
                    <div class="transactions-content">
                        <div class="transactions-list-card">
                            <div class="transactions-list-header">
                                <div class="transactions-list-title">Recent Transactions</div>
                                <div class="transactions-list-actions">
                                    <div class="chip">
                                        <span class="chip-dot"></span>
                                        <span>Manual Entry</span>
                                    </div>
                                    <div class="chip">
                                        <span>${this.transactions.length}</span>
                                        <span>Entries</span>
                                    </div>
                                </div>
                            </div>
                            <div class="transactions-list">
                                ${this.getFilteredTransactions()
                                    .map(transaction => this.renderTransactionItem(transaction))
                                    .join('')}
                            </div>
                        </div>

                        <div class="transactions-overview-card">
                            <div class="overview-header">
                                <div>
                                    <div class="overview-title">Spending Overview</div>
                                    <div class="overview-tag">Based on current visible transactions</div>
                                </div>
                            </div>

                            <div class="overview-metric">
                                <div class="metric-label">Total spent</div>
                                <div class="metric-value negative">
                                    $${this.summaryData.totalSpent.toLocaleString()}
                                </div>
                            </div>

                            <div class="overview-list">
                                <div class="overview-item">
                                    <div class="overview-item-label">
                                        <span class="badge-dot groceries"></span>
                                        <span>Entries Logged</span>
                                    </div>
                                    <div class="overview-item-value">
                                        ${this.summaryData.totalTransactions}
                                    </div>
                                </div>
                                <div class="overview-item">
                                    <div class="overview-item-label">
                                        <span class="badge-dot food"></span>
                                        <span>Currently visible</span>
                                    </div>
                                    <div class="overview-item-value">
                                        ${this.getFilteredTransactions().length}
                                    </div>
                                </div>
                                <div class="overview-item">
                                    <div class="overview-item-label">
                                        <span class="badge-dot utilities"></span>
                                        <span>Average per transaction</span>
                                    </div>
                                    <div class="overview-item-value">
                                        $${this.summaryData.avgPerTransaction.toLocaleString(undefined, { 
                                            minimumFractionDigits: 2, 
                                            maximumFractionDigits: 2 
                                        })}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

     getFilteredTransactions() {
        let filtered = Array.isArray(this.transactions)
            ? [...this.transactions]
            : [];

        // 1) Apply filter
        if (this.currentFilter !== 'all') {
            filtered = filtered.filter((transaction) => {
                const amount = Number(transaction.amount) || 0;
                const status = (transaction.status || '').toLowerCase();

                switch (this.currentFilter) {

                    case 'expenses':
                        // All logged transactions are expenses/spending
                        return amount >= 0;

                    case 'pending':
                        return status === 'pending';

                    default:
                        return true;
                }
            });
        }

        // 2) Apply search (name/account/type/status)
        if (this.searchQuery && this.searchQuery.trim() !== '') {
            const q = this.searchQuery.toLowerCase();
            filtered = filtered.filter((transaction) =>
                (transaction.name || '').toLowerCase().includes(q) ||
                (transaction.account || '').toLowerCase().includes(q) ||
                (transaction.type || '').toLowerCase().includes(q) ||
                (transaction.status || '').toLowerCase().includes(q)
            );
        }

        return filtered;
    }

    /**
     * Render a single transaction row
     * Matches the structure expected by the CSS in render()
     */
    renderTransactionItem(transaction) {
        const name = this.escapeHtml(transaction.name || '');
        const account = this.escapeHtml(transaction.account || '');
        const type = this.escapeHtml(transaction.type || '');
        const date = this.escapeHtml(transaction.date || '');
        const status = (transaction.status || '').toLowerCase();
        const rawStatus = this.escapeHtml(transaction.status || '');

        const amountNum = Number(transaction.amount) || 0;
        const formattedAmount = amountNum.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });

        const isPending = status === 'pending';

        const iconClass = [
            'transaction-icon',
            isPending ? 'pending' : 'expense'
        ].join(' ');

        const statusClass = [
            'transaction-status',
            isPending ? 'status-pending' : 'status-complete'
        ].join(' ');

        // All amounts are spending, so we style as "negative" (money out)
        const amountClass = ['transaction-amount', 'negative'].join(' ');

        return `
            <div class="transaction-row">
                <div class="transaction-main">
                    <div class="${iconClass}">
                        ${this.escapeHtml(transaction.icon || '$')}
                    </div>
                    <div class="transaction-text">
                        <div class="transaction-name">${name}</div>
                        <div class="transaction-meta">
                            <span>${account}</span>
                            <span class="transaction-meta-dot"></span>
                            <span>${type}</span>
                        </div>
                    </div>
                </div>
                <div class="${amountClass}">-$${formattedAmount}</div>
                <div class="transaction-date">${date}</div>
                <div class="${statusClass}">
                    ${rawStatus}
                </div>
            </div>
        `;
    }

    /**
     * Escape HTML to avoid XSS from dynamic content
     */
    escapeHtml(str) {
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    /**
     * Wire up search, filter, and export interactions
     * Must be called after every render()
     */
    setupEventListeners() {
        const root = this.shadowRoot;
        if (!root) return;

        // Search input
        const searchInput = root.querySelector('#search-input');
        if (searchInput) {
            searchInput.value = this.searchQuery;
            searchInput.addEventListener('input', (e) => {
                this.searchQuery = e.target.value || '';
                this.render();
                this.setupEventListeners();
            });
        }

        // Filter buttons
        const filterButtons = root.querySelectorAll('.filter-btn');
        filterButtons.forEach((btn) => {
            const filter = btn.getAttribute('data-filter') || 'all';

            // Set active class based on currentFilter
            if (filter === this.currentFilter) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }

            btn.addEventListener('click', () => {
                this.currentFilter = filter;
                this.render();
                this.setupEventListeners();
            });
        });

        // Export buttons
        const exportButtons = root.querySelectorAll('.export-btn');
        exportButtons.forEach((btn) => {
            btn.addEventListener('click', () => {
                this.exportTransactions();
            });
        });
    }

    /**
     * Export currently visible transactions to CSV
     */
    exportTransactions() {
        const transactions = this.getFilteredTransactions();
        console.log('📊 Exporting transactions:', transactions);

        if (!transactions.length) {
            alert('No transactions to export.');
            return;
        }

        const headers = ['Date', 'Name', 'Account', 'Type', 'Amount', 'Status'];
        const rows = transactions.map((t) => [
            t.date || '',
            t.name || '',
            t.account || '',
            t.type || '',
            Number(t.amount || 0).toFixed(2),
            t.status || ''
        ]);

        const csvContent = [headers, ...rows]
            .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
            .join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `transactions-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
    }
}

// Define the custom element
customElements.define('finsite-transactions', FinSiteTransactions);

export { FinSiteTransactions };