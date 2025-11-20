/**
 * Transactions Web Component for FinSite
 * Matches the exact reference image layout and styling
 */
class FinSiteTransactions extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.data = {
            summary: {
                totalIncome: 3200.00,
                totalExpenses: 1847.32,
                netIncome: 1352.68,
                totalTransactions: 247
            },
            transactions: [
                {
                    id: 1,
                    category: 'pending',
                    name: 'Uber.com',
                    account: 'Credit Card 2',
                    type: 'Fast Food',
                    amount: -24.78,
                    date: 'Mar 5',
                    status: 'Pending',
                    icon: '$'
                },
                {
                    id: 2,
                    category: 'pending',
                    name: 'Work Barista',
                    account: 'Credit Card 2',
                    type: 'Coffee Shops',
                    amount: -2.70,
                    date: 'Mar 3',
                    status: 'Pending',
                    icon: '$'
                },
                {
                    id: 3,
                    category: 'march2025',
                    name: 'Salary Deposit - Tech Corp',
                    account: 'Chase Checking',
                    type: 'Income',
                    amount: 3200.00,
                    date: 'Mar 15',
                    status: 'Complete',
                    icon: '$'
                },
                {
                    id: 4,
                    category: 'march2025',
                    name: 'Instacart',
                    account: 'Credit Card 2',
                    type: 'Groceries',
                    amount: -40.22,
                    date: 'Mar 4',
                    status: 'Complete',
                    icon: '$'
                },
                {
                    id: 5,
                    category: 'march2025',
                    name: 'Convenience Store',
                    account: 'Credit Card 2',
                    type: 'Groceries',
                    amount: -12.30,
                    date: 'Mar 3',
                    status: 'Complete',
                    icon: '$'
                }
            ]
        };
        this.currentFilter = 'all';
        this.searchQuery = '';
    }

    // Method to set transactions data from external source
    setTransactions(transactionsArray) {
        this.transactions = transactionsArray || [];
        this.calculateSummaryData();
        
        // Only re-render if the component is already connected
        if (this.isConnected) {
            this.render();
            this.setupEventListeners();
        }
    }

    // Calculate summary statistics
    calculateSummaryData() {
        const income = this.transactions.filter(t => t.amount > 0).reduce((sum, t) => sum + t.amount, 0);
        const expenses = Math.abs(this.transactions.filter(t => t.amount < 0).reduce((sum, t) => sum + t.amount, 0));
        
        this.summaryData = {
            totalIncome: income,
            totalExpenses: expenses,
            netIncome: income - expenses,
            totalTransactions: this.transactions.length
        };
    }

    connectedCallback() {
        // Initialize with sample data matching the screenshot
        this.initializeWithSampleData();
        this.render();
        this.setupEventListeners();
    }

    // Initialize with sample data matching the screenshot
    initializeWithSampleData() {
        const sampleTransactions = [
            {
                id: 1,
                category: 'pending',
                name: 'Uber.com',
                account: 'Credit Card 2',
                type: 'Fast Food',
                amount: -24.78,
                date: 'Mar 5',
                status: 'Pending',
                icon: '$'
            },
            {
                id: 2,
                category: 'pending',
                name: 'Work Barista',
                account: 'Credit Card 2',
                type: 'Coffee Shops',
                amount: -2.70,
                date: 'Mar 3',
                status: 'Pending',
                icon: '$'
            },
            {
                id: 3,
                category: 'march2025',
                name: 'Salary Deposit - Tech Corp',
                account: 'Chase Checking',
                type: 'Income',
                amount: 3200.00,
                date: 'Mar 15',
                status: 'Complete',
                icon: '$'
            },
            {
                id: 4,
                category: 'march2025',
                name: 'Instacart',
                account: 'Credit Card 2',
                type: 'Groceries',
                amount: -40.22,
                date: 'Mar 4',
                status: 'Complete',
                icon: '$'
            },
            {
                id: 5,
                category: 'march2025',
                name: 'Convenience Store',
                account: 'Credit Card 2',
                type: 'Groceries',
                amount: -12.30,
                date: 'Mar 3',
                status: 'Complete',
                icon: '$'
            }
        ];
        
        this.setTransactions(sampleTransactions);
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
                }

                .transactions-container {
                    padding: 1.5rem;
                    width: 100%;
                    max-width: none;
                    background: #1a1a1a;
                    min-height: 100vh;
                    box-sizing: border-box;
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
                    gap: 1.5rem;
                    flex: 1;
                }

                .page-title {
                    font-size: 1.75rem;
                    font-weight: 600;
                    color: #ffffff;
                    margin: 0;
                    margin-right: 2rem;
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
                    gap: 0.5rem;
                }

                .filter-btn {
                    padding: 0.625rem 1rem;
                    background: #374151;
                    border: none;
                    border-radius: 0.5rem;
                    color: #ffffff;
                    font-size: 0.875rem;
                    font-weight: 500;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    min-width: 4rem;
                }

                .filter-btn:hover {
                    background: #4b5563;
                }

                .filter-btn.active {
                    background: #3b82f6;
                    color: #ffffff;
                }

                .export-btn {
                    padding: 0.625rem 1rem;
                    background: #4b5563;
                    border: none;
                    border-radius: 0.5rem;
                    color: #ffffff;
                    font-size: 0.875rem;
                    font-weight: 500;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }

                .export-btn:hover {
                    background: #6b7280;
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
                    background: #2a2a2a;
                    border: none;
                    border-radius: 1rem;
                    overflow: hidden;
                    width: 100%;
                }

                .transactions-info {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 1rem 1.5rem;
                    border-bottom: 0.0625rem solid #333;
                    background: #333;
                }

                .transactions-count {
                    font-size: 0.875rem;
                    color: #ffffff;
                }

                .section-header {
                    padding: 1rem 1.5rem;
                    background: #434957;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    cursor: pointer;
                    user-select: none;
                }

                .section-header:hover {
                    background: #4a5568;
                }

                .section-title {
                    font-size: 1rem;
                    font-weight: 600;
                    color: #ffffff;
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                }

                .section-amount {
                    font-size: 1rem;
                    font-weight: 600;
                }

                .section-amount.positive {
                    color: #10b981;
                }

                .section-amount.negative {
                    color: #ef4444;
                }

                .transaction-list {
                    display: flex;
                    flex-direction: column;
                }

                .transaction-item {
                    display: flex;
                    align-items: center;
                    padding: 0.875rem 1.5rem;
                    border-bottom: 0.0625rem solid #333;
                    transition: background-color 0.2s ease;
                    background: #2a2a2a;
                }

                .transaction-item:hover {
                    background: #333;
                }

                .transaction-item:last-child {
                    border-bottom: none;
                }

                .transaction-icon {
                    width: 2rem;
                    height: 2rem;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 0.875rem;
                    margin-right: 0.875rem;
                    flex-shrink: 0;
                    color: #ffffff;
                    font-weight: bold;
                }

                .transaction-icon.expense {
                    background: #ef4444;
                }

                .transaction-icon.income {
                    background: #10b981;
                }

                .transaction-icon.pending {
                    background: #6b7280;
                }

                .transaction-details {
                    flex: 1;
                    min-width: 0;
                }

                .transaction-name {
                    font-size: 0.875rem;
                    font-weight: 500;
                    color: #ffffff;
                    margin-bottom: 0.125rem;
                }

                .transaction-meta {
                    font-size: 0.75rem;
                    color: #9ca3af;
                    display: flex;
                    gap: 0.375rem;
                    flex-wrap: wrap;
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
                    color: #ffffff;
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
                    background: rgba(107, 114, 128, 0.2);
                    color: #9ca3af;
                }

                /* Responsive Design */
                @media (max-width: 64rem) {
                    .transactions-header {
                        flex-direction: column;
                        align-items: stretch;
                    }

                    .header-left {
                        flex-direction: column;
                        align-items: stretch;
                        gap: 1rem;
                    }

                    .summary-cards {
                        grid-template-columns: repeat(2, 1fr);
                        gap: 1rem;
                    }
                }

                @media (max-width: 48rem) {
                    .transactions-container {
                        padding: 1rem;
                    }

                    .summary-cards {
                        grid-template-columns: 1fr;
                    }

                    .transaction-item {
                        padding: 0.75rem 1rem;
                    }
                }
            </style>
            
            <div class="transactions-container">
                <div class="transactions-header">
                    <div class="header-left">
                        <h1 class="page-title">Transaction Activity</h1>
                        <div class="search-container">
                            <input type="text" class="search-input" placeholder="Search transactions..." id="search-input">
                        </div>
                    </div>
                    <div class="header-actions">
                        <div class="filter-buttons">
                            <button class="filter-btn active" data-filter="all">All</button>
                            <button class="filter-btn" data-filter="income">Income</button>
                            <button class="filter-btn" data-filter="expenses">Expenses</button>
                            <button class="filter-btn" data-filter="pending">Pending</button>
                        </div>
                        <button class="export-btn">Export CSV</button>
                    </div>
                </div>

                <div class="summary-cards">
                    <div class="summary-card">
                        <div class="summary-value positive">+$${this.summaryData.totalIncome.toLocaleString()}</div>
                        <div class="summary-label">Total Income</div>
                    </div>
                    <div class="summary-card">
                        <div class="summary-value negative">-$${this.summaryData.totalExpenses.toLocaleString()}</div>
                        <div class="summary-label">Total Expenses</div>
                    </div>
                    <div class="summary-card">
                        <div class="summary-value ${this.summaryData.netIncome >= 0 ? 'positive' : 'negative'}">${this.summaryData.netIncome >= 0 ? '+' : ''}$${Math.abs(this.summaryData.netIncome).toLocaleString()}</div>
                        <div class="summary-label">Net Income</div>
                    </div>
                    <div class="summary-card">
                        <div class="summary-value">${this.summaryData.totalTransactions}</div>
                        <div class="summary-label">Total Transactions</div>
                    </div>
                </div>

                <div class="transactions-content">
                    <div class="transactions-info">
                        <span class="transactions-count">Showing ${this.getFilteredTransactions().length} transactions since 2025</span>
                        <button class="export-btn">Export CSV</button>
                    </div>
                    ${this.renderTransactionSections()}
                </div>
            </div>
        `;
    }

    renderTransactionSections() {
        const sections = this.groupTransactionsByCategory();
        return Object.entries(sections).map(([category, transactions]) => {
            const sectionTotal = transactions.reduce((sum, t) => sum + t.amount, 0);
            return `
                <div class="section-header">
                    <div class="section-title">
                        ▼ ${this.getSectionTitle(category)}
                    </div>
                    <div class="section-amount ${sectionTotal >= 0 ? 'positive' : 'negative'}">
                        ${sectionTotal >= 0 ? '+' : ''}$${Math.abs(sectionTotal).toLocaleString()}
                    </div>
                </div>
                <div class="transaction-list">
                    ${transactions.map(transaction => this.renderTransactionItem(transaction)).join('')}
                </div>
            `;
        }).join('');
    }

    renderTransactionItem(transaction) {
        // return `<finsite-transaction-item transaction-data='${JSON.stringify(transaction)}'></finsite-transaction-item>`;
        const isPositive = transaction.amount > 0;
        const iconClass = transaction.status === 'Pending' ? 'pending' : (isPositive ? 'income' : 'expense');
        
        return `
            <div class="transaction-item">
                <div class="transaction-icon ${iconClass}">
                    ${transaction.icon}
                </div>
                <div class="transaction-details">
                    <div class="transaction-name">${transaction.name}</div>
                    <div class="transaction-meta">
                        <span>${transaction.account}</span>
                        <span>${transaction.type}</span>
                    </div>
                </div>
                <div class="transaction-amount ${isPositive ? 'positive' : 'negative'}">
                    ${isPositive ? '+' : '-'}$${Math.abs(transaction.amount).toLocaleString()}
                </div>
                <div class="transaction-date">${transaction.date}</div>
                ${transaction.status === 'Pending' ? '<div class="transaction-status status-pending">(Pending)</div>' : ''}
            </div>
        `;
    }

    groupTransactionsByCategory() {
        const filtered = this.getFilteredTransactions();
        const groups = {};
        
        filtered.forEach(transaction => {
            if (!groups[transaction.category]) {
                groups[transaction.category] = [];
            }
            groups[transaction.category].push(transaction);
        });
        
        return groups;
    }

    getFilteredTransactions() {
        let filtered = [...this.transactions];
        
        // Apply filter
        if (this.currentFilter !== 'all') {
            filtered = filtered.filter(transaction => {
                switch (this.currentFilter) {
                    case 'income':
                        return transaction.amount > 0;
                    case 'expenses':
                        return transaction.amount < 0;
                    case 'pending':
                        return transaction.status === 'Pending';
                    default:
                        return true;
                }
            });
        }
        
        // Apply search
        if (this.searchQuery && this.searchQuery.trim() !== '') {
            filtered = filtered.filter(transaction => 
                transaction.name.toLowerCase().includes(this.searchQuery) ||
                transaction.account.toLowerCase().includes(this.searchQuery) ||
                transaction.type.toLowerCase().includes(this.searchQuery) ||
                transaction.status.toLowerCase().includes(this.searchQuery)
            );
        }
        
        return filtered;
    }

    getSectionTitle(category) {
        const titles = {
            'pending': 'Pending',
            'march2025': 'March 2025'
        };
        return titles[category] || category;
    }

    setupEventListeners() {
        // Filter buttons
        const filterButtons = this.shadowRoot.querySelectorAll('.filter-btn');
        filterButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const filter = e.target.getAttribute('data-filter');
                this.setFilter(filter);
            });
        });

        // Search input
        const searchInput = this.shadowRoot.querySelector('#search-input');
        searchInput.addEventListener('input', (e) => {
            this.searchTransactions(e.target.value);
        });

        // Export buttons
        const exportButtons = this.shadowRoot.querySelectorAll('.export-btn');
        exportButtons.forEach(button => {
            button.addEventListener('click', () => {
                this.exportTransactions();
            });
        });

        // Section headers for collapse/expand
        this.setupSectionToggle();
    }

    setupSectionToggle() {
        const sectionHeaders = this.shadowRoot.querySelectorAll('.section-header');
        sectionHeaders.forEach(header => {
            header.addEventListener('click', () => {
                const transactionList = header.nextElementSibling;
                const isCollapsed = transactionList.style.display === 'none';
                
                // Toggle visibility instantly
                if (isCollapsed) {
                    transactionList.style.display = 'block';
                } else {
                    transactionList.style.display = 'none';
                }
                
                // Update arrow direction
                const titleElement = header.querySelector('.section-title');
                if (titleElement) {
                    const currentText = titleElement.textContent;
                    const newArrow = isCollapsed ? '▼' : '▶';
                    titleElement.textContent = currentText.replace(/[▼▶]/, newArrow);
                }
            });
        });
    }

    setFilter(filter) {
        this.currentFilter = filter;
        
        // Update button states
        const filterButtons = this.shadowRoot.querySelectorAll('.filter-btn');
        filterButtons.forEach(button => {
            button.classList.toggle('active', button.getAttribute('data-filter') === filter);
        });
        
        // Re-render transactions
        this.updateTransactionsDisplay();
    }

    searchTransactions(query) {
        this.searchQuery = query.toLowerCase();
        this.updateTransactionsDisplay();
    }

    updateTransactionsDisplay() {
        const transactionsContent = this.shadowRoot.querySelector('.transactions-content');
        transactionsContent.innerHTML = `
            <div class="transactions-info">
                <span class="transactions-count">Showing ${this.getFilteredTransactions().length} transactions since 2025</span>
                <button class="export-btn">Export CSV</button>
            </div>
            ${this.renderTransactionSections()}
        `;
        
        // Re-setup export button listeners
        const exportButtons = transactionsContent.querySelectorAll('.export-btn');
        exportButtons.forEach(button => {
            button.addEventListener('click', () => {
                this.exportTransactions();
            });
        });

        // Re-setup section toggle functionality
        this.setupSectionToggle();
    }

    exportTransactions() {
        const transactions = this.getFilteredTransactions();
        console.log('📊 Exporting transactions:', transactions);
        
        // Create CSV content
        const headers = ['Date', 'Name', 'Account', 'Type', 'Amount', 'Status'];
        const csvContent = [
            headers.join(','),
            ...transactions.map(t => [
                t.date,
                `"${t.name}"`,
                `"${t.account}"`,
                `"${t.type}"`,
                t.amount,
                t.status
            ].join(','))
        ].join('\n');
        
        // Create and download file
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