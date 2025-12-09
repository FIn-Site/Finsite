/**
 * Category Chart Web Component for FinSite
 * Reusable bar chart card that displays spending breakdown for a single group
 * Used by the Categories page to show Household, Wealth, Expenses, etc.
 * 
 * Displays subcategories as bars with heights proportional to spending
 * Clicking opens a modal with transaction details
 */
class FinSiteCategoryChart extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });

        // Chart data
        this.groupId = '';
        this.groupName = '';
        this.categories = [];      // { id, name, amount }
        this.transactions = [];    // Raw transactions for this group
        this.totalSpent = 0;
    }

    connectedCallback() {
        this.render();
    }

    /**
     * Set chart data from parent component
     * @param {Object} data - { groupId, groupName, categories: [{ id, name, amount }], transactions: [] }
     */
    setData(data) {
        this.groupId = data.groupId || '';
        this.groupName = data.groupName || 'Unknown';
        this.categories = Array.isArray(data.categories) ? data.categories : [];
        this.transactions = Array.isArray(data.transactions) ? data.transactions : [];
        this.totalSpent = this.categories.reduce((sum, cat) => sum + (cat.amount || 0), 0);
        this.render();
    }

    /**
     * Get icon for group
     */
    _getGroupIcon(groupId) {
        const icons = {
            'household': '🏠',
            'investments': '💰',
            'expenses': '💳'
        };
        return icons[groupId] || '📊';
    }

    /**
     * Get color for category bars
     */
    _getCategoryColor(index) {
        const colors = [
            '#3b82f6', // blue
            '#10b981', // green
            '#f59e0b', // amber
            '#ef4444', // red
            '#8b5cf6', // purple
            '#ec4899', // pink
            '#06b6d4'  // cyan
        ];
        return colors[index % colors.length];
    }

    /**
     * Format currency
     */
    _formatCurrency(amount) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount || 0);
    }

    /**
     * Format date for display
     */
    _formatDate(dateStr) {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }

    render() {
        // Calculate max amount for scaling bars
        const maxAmount = Math.max(...this.categories.map(c => c.amount || 0), 1);

        // Generate bar chart HTML
        const barsHtml = this.categories.length > 0 
            ? this.categories.map((cat, index) => {
                const percentage = ((cat.amount || 0) / maxAmount) * 100;
                const color = this._getCategoryColor(index);
                return `
                    <div class="bar-container" data-category-id="${cat.id}">
                        <div class="bar" style="height: ${Math.max(percentage, 5)}%; background: ${color};" title="${cat.name}: ${this._formatCurrency(cat.amount)}"></div>
                        <span class="bar-label">${cat.name.substring(0, 4)}</span>
                        <span class="bar-amount">${this._formatCurrency(cat.amount)}</span>
                    </div>
                `;
            }).join('')
            : `<div class="no-data">No categories</div>`;

        this.shadowRoot.innerHTML = `
            <style>
                * {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                }

                :host {
                    display: block;
                }

                .chart-card {
                    background: #1e293b;
                    border-radius: 0.75rem;
                    padding: 1.25rem;
                    border: 1px solid #334155;
                    transition: all 0.2s ease;
                    cursor: pointer;
                }

                .chart-card:hover {
                    border-color: #3b82f6;
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
                }

                .card-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    margin-bottom: 1rem;
                }

                .group-info {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                }

                .group-icon {
                    width: 2rem;
                    height: 2rem;
                    border-radius: 0.5rem;
                    background: rgba(59, 130, 246, 0.15);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 1rem;
                }

                .group-name {
                    font-size: 1rem;
                    font-weight: 600;
                    color: #f1f5f9;
                }

                .total-amount {
                    font-size: 0.875rem;
                    font-weight: 600;
                    color: #10b981;
                }

                .chart-area {
                    height: 140px;
                    display: flex;
                    align-items: flex-end;
                    justify-content: space-around;
                    gap: 0.75rem;
                    padding: 0.5rem 0;
                    border-top: 1px solid #334155;
                }

                .bar-container {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 0.25rem;
                    flex: 1;
                    max-width: 60px;
                    height: 100%;
                    justify-content: flex-end;
                    cursor: pointer;
                    transition: transform 0.15s ease;
                }

                .bar-container:hover {
                    transform: scale(1.05);
                }

                .bar-container:hover .bar {
                    filter: brightness(1.2);
                }

                .bar {
                    width: 100%;
                    min-height: 4px;
                    border-radius: 4px 4px 0 0;
                    transition: all 0.3s ease;
                }

                .bar-label {
                    font-size: 0.625rem;
                    color: #94a3b8;
                    text-transform: uppercase;
                    letter-spacing: 0.02em;
                    text-align: center;
                    white-space: nowrap;
                }

                .bar-amount {
                    font-size: 0.625rem;
                    color: #64748b;
                    font-weight: 500;
                }

                .no-data {
                    color: #64748b;
                    font-size: 0.875rem;
                    text-align: center;
                    padding: 2rem;
                    width: 100%;
                }

                .category-count {
                    font-size: 0.75rem;
                    color: #64748b;
                    margin-top: 0.75rem;
                    text-align: center;
                }

                .view-details {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 0.25rem;
                    font-size: 0.75rem;
                    color: #3b82f6;
                    margin-top: 0.5rem;
                    opacity: 0;
                    transition: opacity 0.2s ease;
                }

                .chart-card:hover .view-details {
                    opacity: 1;
                }
            </style>

            <div class="chart-card" data-group-id="${this.groupId}">
                <div class="card-header">
                    <div class="group-info">
                        <div class="group-icon">${this._getGroupIcon(this.groupId)}</div>
                        <span class="group-name">${this.groupName}</span>
                    </div>
                    <span class="total-amount">${this._formatCurrency(this.totalSpent)}</span>
                </div>
                <div class="chart-area">
                    ${barsHtml}
                </div>
                <div class="category-count">${this.transactions.length} transactions · ${this.categories.length} categories</div>
                <div class="view-details">Click to view details →</div>
            </div>
        `;

        this.setupEventListeners();
    }

    setupEventListeners() {
        const card = this.shadowRoot.querySelector('.chart-card');
        if (card) {
            card.addEventListener('click', () => {
                this.dispatchEvent(new CustomEvent('group-selected', {
                    detail: { 
                        groupId: this.groupId, 
                        groupName: this.groupName,
                        categories: this.categories,
                        transactions: this.transactions,
                        totalSpent: this.totalSpent
                    },
                    bubbles: true,
                    composed: true
                }));
            });
        }
    }
}

customElements.define('finsite-category-chart', FinSiteCategoryChart);
