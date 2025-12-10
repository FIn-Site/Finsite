// Import spending chart component
import './spending-chart.js';

/**
 * Dashboard Web Component for FinSite
 * Handles dashboard content display with spending charts and quick stats
 * Receives pre-aggregated chart data and panel summary from model via view
 */
class FinSiteDashboard extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });

        // Dashboard panel data - starts empty, populated from model
        this.panelData = {
            totalSpentAllTime: 0,
            transactionsThisWeek: 0,
            monthlySpendingCurrent: 0,
            monthlySpendingLast: 0,
            monthlyChangePercent: 0,
            monthlyDirection: 'neutral',
            recentTransactions: [],
        };

        // Chart data structure (pre-aggregated from model)
        this.chartData = null;

        // Reference to chart component
        this._chartComponent = null;
    }

    connectedCallback() {
        this.render();
        // Get reference to chart component after render
        requestAnimationFrame(() => {
            this._chartComponent = this.shadowRoot.querySelector('finsite-spending-chart');
        });
    }

    /**
     * Format currency for display
     * @param {number} amount
     * @returns {string} Formatted currency string
     */
    _formatCurrency(amount) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(amount || 0);
    }

    render() {
        const {
            totalSpentAllTime,
            transactionsThisWeek,
            monthlySpendingCurrent,
            monthlyChangePercent,
            monthlyDirection,
        } = this.panelData;

        // Determine change indicator styling
        let changeClass = '';
        let changePrefix = '';

        if (monthlyDirection === 'up') {
            changeClass = 'negative';
            changePrefix = '+';
        } else if (monthlyDirection === 'down') {
            changeClass = 'positive';
            changePrefix = '';
        }
        const changeText = monthlyChangePercent !== 0
            ? `${changePrefix}${monthlyChangePercent.toFixed(1)}% vs last month`
            : 'No change vs last month';

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
                    height: 100%;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                }

                .dashboard-container {
                    display: flex;
                    flex-direction: column;
                    gap: 1.5rem;
                    padding: 2rem;
                    height: 100%;
                    overflow-y: auto;
                }

                .dashboard-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }

                .dashboard-title {
                    font-size: 1.75rem;
                    font-weight: 700;
                    color: #f1f5f9;
                    margin: 0;
                }

                .dashboard-subtitle {
                    font-size: 0.875rem;
                    color: #64748b;
                    margin-top: 0.25rem;
                }

                .quick-stats-row {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 1rem;
                }

                .stat-card {
                    background: #1e293b;
                    border-radius: 0.75rem;
                    padding: 1.25rem;
                    border: 1px solid #334155;
                }

                .stat-card-header {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    margin-bottom: 0.5rem;
                }

                .stat-icon {
                    width: 2rem;
                    height: 2rem;
                    border-radius: 0.5rem;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 1rem;
                }

                .stat-icon.balance {
                    background: rgba(16, 185, 129, 0.15);
                    color: #10b981;
                }

                .stat-icon.transactions {
                    background: rgba(59, 130, 246, 0.15);
                    color: #3b82f6;
                }

                .stat-icon.spending {
                    background: rgba(245, 158, 11, 0.15);
                    color: #f59e0b;
                }

                .stat-label {
                    font-size: 0.75rem;
                    color: #64748b;
                    font-weight: 500;
                }

                .stat-value {
                    font-size: 1.5rem;
                    font-weight: 700;
                    color: #f1f5f9;
                }

                .stat-change {
                    font-size: 0.75rem;
                    font-weight: 500;
                    margin-top: 0.25rem;
                }

                .stat-change.positive {
                    color: #10b981;
                }

                .stat-change.negative {
                    color: #ef4444;
                }

                .charts-section {
                    flex: 1;
                    min-height: 500px;
                }

                .recent-activity {
                    background: #1e293b;
                    border-radius: 0.75rem;
                    padding: 1.25rem;
                    border: 1px solid #334155;
                }

                .activity-header {
                    font-size: 1rem;
                    font-weight: 600;
                    color: #f1f5f9;
                    margin-bottom: 1rem;
                }

                .activity-list {
                    display: flex;
                    flex-direction: column;
                    gap: 0.75rem;
                }

                .activity-item {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    padding: 0.75rem;
                    background: #0f172a;
                    border-radius: 0.5rem;
                }

                .activity-icon {
                    width: 2.25rem;
                    height: 2.25rem;
                    background: #1e293b;
                    border-radius: 0.5rem;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 1rem;
                }

                .activity-info {
                    flex: 1;
                }

                .activity-text {
                    font-size: 0.875rem;
                    color: #e2e8f0;
                    font-weight: 500;
                }

                .activity-date {
                    font-size: 0.75rem;
                    color: #64748b;
                }

                .activity-amount {
                    font-size: 0.875rem;
                    font-weight: 600;
                    color: #ef4444;
                }

                .empty-state {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    padding: 2rem;
                    color: #64748b;
                    text-align: center;
                }

                .empty-state-icon {
                    font-size: 2rem;
                    margin-bottom: 0.5rem;
                }

                .empty-state-text {
                    font-size: 0.875rem;
                }

                /* Responsive */
                @media (max-width: 1024px) {
                    .quick-stats-row {
                        grid-template-columns: 1fr;
                    }
                }
            </style>
            
            <div class="dashboard-container">
                <!-- Header -->
                <div class="dashboard-header">
                    <div>
                        <h1 class="dashboard-title">Dashboard</h1>
                        <p class="dashboard-subtitle">Your financial overview</p>
                    </div>
                </div>

                <!-- Quick Stats Row -->
                <div class="quick-stats-row">
                    <div class="stat-card">
                        <div class="stat-card-header">
                            <div class="stat-icon balance">💰</div>
                            <span class="stat-label">Total Spent (All Time)</span>
                        </div>
                        <div class="stat-value" data-field="totalSpent">${this._formatCurrency(totalSpentAllTime)}</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-card-header">
                            <div class="stat-icon transactions">📊</div>
                            <span class="stat-label">Transactions This Week</span>
                        </div>
                        <div class="stat-value" data-field="weeklyCount">${transactionsThisWeek}</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-card-header">
                            <div class="stat-icon spending">💳</div>
                            <span class="stat-label">Monthly Spending</span>
                        </div>
                        <div class="stat-value" data-field="monthlySpending">${this._formatCurrency(monthlySpendingCurrent)}</div>
                        <div class="stat-change ${changeClass}" data-field="monthlyChange">${changeText}</div>
                    </div>
                </div>

                <!-- Charts Section - spending-chart handles its own metrics and charts -->
                <div class="charts-section">
                    <finsite-spending-chart data-testid="summary-chart"></finsite-spending-chart>
                </div>

                <!-- Recent Activity -->
                <div class="recent-activity">
                    <h3 class="activity-header">Recent Activity</h3>
                    <div class="activity-list">
                        ${this._renderActivities()}
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Render activity items or empty state
     * @returns {string} HTML for activity list
     */
    _renderActivities() {
        const { recentTransactions } = this.panelData;

        if (!recentTransactions || recentTransactions.length === 0) {
            return `
                <div class="empty-state">
                    <div class="empty-state-icon">📭</div>
                    <div class="empty-state-text">No recent transactions</div>
                </div>
            `;
        }

        return recentTransactions.map((tx) => `
            <div class="activity-item">
                <span class="activity-icon">${tx.icon}</span>
                <div class="activity-info">
                    <div class="activity-text">${tx.merchant}</div>
                    <div class="activity-date">${tx.date}</div>
                </div>
                <div class="activity-amount">-${this._formatCurrency(tx.amount)}</div>
            </div>
        `).join('');
    }

    /**
     * Update dashboard from panel summary (stats, recent activity)
     * Called by view when model provides new dashboard panel summary
     * @param {Object} summary - Dashboard panel summary from model
     */
    updateFromSummary(summary) {
        if (!summary) return;

        this.panelData = {
            ...this.panelData,
            ...summary,
        };

        // Re-render the component
        this.render();

        // Re-acquire chart reference after render
        requestAnimationFrame(() => {
            this._chartComponent = this.shadowRoot.querySelector('finsite-spending-chart');

            // Re-apply chart data if we have it
            if (this.chartData && this._chartComponent && this._chartComponent.updateChartData) {
                this._chartComponent.updateChartData(this.chartData);
            }
        });

        console.log('📋 Dashboard panel updated from summary:', summary);
    }

    /**
     * Update chart data - passes pre-aggregated data to spending-chart
     * Called by view when model provides new dashboard summary
     * @param {Object} chartData - Pre-aggregated chart data from model
     * @param {boolean} isHeavyUpdate - True for bulk updates (CSV import)
     */
    updateChartData(chartData, isHeavyUpdate = false) {
        this.chartData = chartData;

        // Get or find chart component reference
        if (!this._chartComponent) {
            this._chartComponent = this.shadowRoot.querySelector('finsite-spending-chart');
        }

        // Pass data to chart component
        if (this._chartComponent && this._chartComponent.updateChartData) {
            this._chartComponent.updateChartData(chartData, isHeavyUpdate);
        }
    }

    /**
     * Legacy method - Update dashboard data
     * @deprecated Use updateFromSummary instead
     * @param {Object} newData - New data to display
     */
    updateData(newData) {
    // Map old format to new if needed
        if (newData.stats) {
            this.panelData.transactionsThisWeek = newData.stats.transactions || 0;
        }
        this.render();

        // Re-acquire chart reference after render
        requestAnimationFrame(() => {
            this._chartComponent = this.shadowRoot.querySelector('finsite-spending-chart');

            // Re-apply chart data if we have it
            if (this.chartData && this._chartComponent) {
                this._chartComponent.updateChartData(this.chartData);
            }
        });
    }
}

// Define the custom element
customElements.define('finsite-dashboard', FinSiteDashboard);

export { FinSiteDashboard };
