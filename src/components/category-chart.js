// Import Chart.js core
import { initChartCore, CHART_COLORS, formatCurrency } from '../chart/chart-core.js';

//...
/**
 * Category Chart Web Component for FinSite
 * Reusable bar chart card that displays spending breakdown for a single group
 * Used by the Categories page to show Household, Wealth, Expenses, etc.
 * 
 * Displays subcategories as bars using Chart.js
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

        // Chart.js instance
        this._chart = null;
        this._chartInitialized = false;
    }

    connectedCallback() {
        this.render();
    }

    disconnectedCallback() {
        // Clean up chart when component is removed
        this._destroyChart();
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
        // Initialize chart after render
        this._initChart();
    }

    /**
     * Destroy existing chart instance
     */
    _destroyChart() {
        if (this._chart) {
            this._chart.destroy();
            this._chart = null;
        }
    }

    /**
     * Initialize Chart.js bar chart
     */
    async _initChart() {
        // Don't create chart if no categories
        if (this.categories.length === 0) return;

        const canvas = this.shadowRoot.querySelector('#categoryChart');
        if (!canvas) return;

        // Destroy existing chart
        this._destroyChart();

        try {
            // Initialize Chart.js core (lazy loads if needed)
            const Chart = await initChartCore();

            const ctx = canvas.getContext('2d');
            
            // Prepare data for Chart.js
            const labels = this.categories.map(cat => cat.name);
            const values = this.categories.map(cat => cat.amount || 0);
            const colors = this.categories.map((_, i) => CHART_COLORS[i % CHART_COLORS.length]);

            this._chart = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels,
                    datasets: [{
                        data: values,
                        backgroundColor: colors,
                        borderRadius: 4,
                        borderSkipped: false,
                        barThickness: 28,
                        maxBarThickness: 40
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    animation: {
                        duration: 400
                    },
                    scales: {
                        x: {
                            grid: {
                                display: false
                            },
                            ticks: {
                                color: '#94a3b8',
                                font: { size: 10 },
                                maxRotation: 0,
                                callback: function(value, index) {
                                    // Truncate labels to 4 chars
                                    const label = this.getLabelForValue(value);
                                    return label.substring(0, 4);
                                }
                            }
                        },
                        y: {
                            grid: {
                                color: 'rgba(148, 163, 184, 0.1)',
                                drawBorder: false
                            },
                            ticks: {
                                color: '#64748b',
                                font: { size: 10 },
                                callback: (value) => '$' + formatCurrency(value)
                            },
                            beginAtZero: true
                        }
                    },
                    plugins: {
                        legend: { display: false },
                        tooltip: {
                            backgroundColor: '#1e293b',
                            titleColor: '#f1f5f9',
                            bodyColor: '#94a3b8',
                            borderColor: '#334155',
                            borderWidth: 1,
                            padding: 10,
                            displayColors: false,
                            callbacks: {
                                title: (context) => context[0].label,
                                label: (context) => `$${formatCurrency(context.raw)}`
                            }
                        }
                    }
                }
            });

            this._chartInitialized = true;
        } catch (error) {
            console.error('Failed to initialize category chart:', error);
        }
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

    render() {
        // Destroy existing chart before re-rendering
        this._destroyChart();

        // Generate chart area HTML - either canvas or no-data message
        const chartAreaHtml = this.categories.length > 0 
            ? `<canvas id="categoryChart"></canvas>`
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
                    padding: 0.5rem 0;
                    border-top: 1px solid #334155;
                    position: relative;
                }

                .chart-area canvas {
                    width: 100% !important;
                    height: 100% !important;
                }

                .no-data {
                    color: #64748b;
                    font-size: 0.875rem;
                    text-align: center;
                    padding: 2rem;
                    width: 100%;
                    height: 100%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
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
                    ${chartAreaHtml}
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
