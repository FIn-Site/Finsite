// Import spending chart component
import './spending-chart.js';

/**
 * Dashboard Web Component for FinSite
 * Handles dashboard content display with spending charts and quick stats
 * Receives pre-aggregated chart data from model via view
 */
class FinSiteDashboard extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        
        // Dashboard data structure
        this.data = {
            balance: '$12,345.67',
            balanceChange: '+$234.50 this month',
            activities: [
                { icon: '🛒', text: 'Grocery Store - $45.67', date: 'Today' },
                { icon: '⛽', text: 'Gas Station - $32.10', date: 'Yesterday' }
            ],
            stats: {
                transactions: 15,
                monthlySpending: '$1,234'
            }
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
                            <span class="stat-label">Account Balance</span>
                        </div>
                        <div class="stat-value">${this.data.balance}</div>
                        <div class="stat-change positive">${this.data.balanceChange}</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-card-header">
                            <div class="stat-icon transactions">📊</div>
                            <span class="stat-label">Transactions This Week</span>
                        </div>
                        <div class="stat-value">${this.data.stats.transactions}</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-card-header">
                            <div class="stat-icon spending">💳</div>
                            <span class="stat-label">Monthly Spending</span>
                        </div>
                        <div class="stat-value">${this.data.stats.monthlySpending}</div>
                    </div>
                </div>

                <!-- Charts Section - spending-chart handles its own metrics and charts -->
                <div class="charts-section">
                    <finsite-spending-chart></finsite-spending-chart>
                </div>

                <!-- Recent Activity -->
                <div class="recent-activity">
                    <h3 class="activity-header">Recent Activity</h3>
                    <div class="activity-list">
                        ${this.renderActivities()}
                    </div>
                </div>
            </div>
        `;
    }

    renderActivities() {
        return this.data.activities.map(activity => `
            <div class="activity-item">
                <span class="activity-icon">${activity.icon}</span>
                <div class="activity-info">
                    <div class="activity-text">${activity.text}</div>
                    <div class="activity-date">${activity.date}</div>
                </div>
            </div>
        `).join('');
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
     * Update dashboard data (balance, stats, activities)
     * @param {Object} newData - New data to display
     */
    updateData(newData) {
        this.data = { ...this.data, ...newData };
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

    /**
     * Update account balance
     * @param {string} balance - New balance amount
     * @param {string} change - Balance change text
     */
    updateBalance(balance, change) {
        this.data.balance = balance;
        this.data.balanceChange = change;
        this.render();
    }

    /**
     * Add new activity item
     * @param {Object} activity - Activity object with icon, text, date
     */
    addActivity(activity) {
        this.data.activities.unshift(activity);
        if (this.data.activities.length > 5) {
            this.data.activities = this.data.activities.slice(0, 5);
        }
        this.render();
    }
}

// Define the custom element
customElements.define('finsite-dashboard', FinSiteDashboard);

export { FinSiteDashboard };