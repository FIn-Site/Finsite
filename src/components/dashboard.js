// Import spending chart component
import './spending-chart.js';

/**
 * Dashboard Web Component for FinSite
 * Handles dashboard content display with account balance, activities, and stats
 */
class FinSiteDashboard extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
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
    }

    connectedCallback() {
        this.render();
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
                }

                .page-header {
                    margin: 0 0 1.875rem 0;
                }

                .page-header h1 {
                    font-size: 2rem;
                    font-weight: 600;
                    margin: 0 0 0.5rem 0;
                    padding: 0;
                    color: #ffffff;
                    line-height: 1.2;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                }

                .page-header p {
                    font-size: 1rem;
                    color: #9ca3af;
                    margin: 0;
                    padding: 0;
                    line-height: 1.4;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                }

                .dashboard-content {
                    display: grid;
                    grid-template-columns: 1fr 3fr;
                    gap: 1.5rem;
                    height: calc(100vh - 7.5rem);
                    max-width: 100rem;
                    margin: 0 auto;
                    padding: 1.25rem;
                    width: 100%;
                }

                .left-sidebar {
                    display: flex;
                    flex-direction: column;
                    gap: 1.25rem;
                }

                .cards-container {
                    display: flex;
                    flex-direction: column;
                    gap: 1.25rem;
                }

                .right-main {
                    display: flex;
                    flex-direction: column;
                }

                .spending-chart-container {
                    flex: 1;
                    min-height: 31.25rem;
                    width: 100%;
                }

                .card {
                    background: #2a2a2a;
                    border-radius: 0.75rem;
                    padding: 1.5rem;
                    margin: 0;
                    border: 0.0625rem solid #444;
                    display: block;
                }

                .card h3 {
                    font-size: 1.125rem;
                    font-weight: 600;
                    margin: 0 0 0.9375rem 0;
                    padding: 0;
                    color: #ffffff;
                    line-height: 1.3;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                }

                .balance {
                    font-size: 2.25rem;
                    font-weight: 700;
                    color: #10b981;
                    margin: 0 0 0.5rem 0;
                    padding: 0;
                    line-height: 1.1;
                    display: block;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                }

                .balance-change {
                    font-size: 0.875rem;
                    font-weight: 500;
                    margin: 0;
                    padding: 0;
                    display: block;
                    color: #10b981;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                }

                .balance-change.positive {
                    color: #10b981;
                }

                .balance-change.negative {
                    color: #ef4444;
                }

                .activity-item {
                    display: flex;
                    align-items: center;
                    padding: 0.75rem 0;
                    border-bottom: 0.0625rem solid #374151;
                }

                .activity-item:last-child {
                    border-bottom: none;
                }

                .activity-icon {
                    font-size: 1.25rem;
                    margin-right: 0.75rem;
                    width: 2rem;
                    text-align: center;
                }

                .activity-text {
                    flex: 1;
                    font-size: 0.875rem;
                    color: #ffffff;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                }

                .activity-date {
                    font-size: 0.75rem;
                    color: #9ca3af;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                }

                .stats-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 1.25rem;
                }

                .stat {
                    text-align: center;
                }

                .stat-value {
                    display: block;
                    font-size: 1.5rem;
                    font-weight: 700;
                    color: #3b82f6;
                    margin: 0 0 0.25rem 0;
                    padding: 0;
                    line-height: 1.2;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                }

                .stat-label {
                    display: block;
                    font-size: 0.75rem;
                    color: #9ca3af;
                    margin: 0;
                    padding: 0;
                    line-height: 1.3;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                }

                /* Responsive Design */
                @media (max-width: 64rem) {
                    .dashboard-content {
                        grid-template-columns: 1fr;
                        height: auto;
                    }
                    
                    .spending-chart-container {
                        min-height: 25rem;
                    }
                }
                
                @media (max-width: 48rem) {
                    .stats-grid {
                        grid-template-columns: 1fr;
                    }
                    
                    .spending-chart-container {
                        min-height: 21.875rem;
                    }
                }
            </style>
            
            <div class="dashboard-content">
                <div class="left-sidebar">
                    <div class="cards-container">
                        <div class="card">
                            <h3>Account Balance</h3>
                            <div class="balance">${this.data.balance}</div>
                            <div class="balance-change positive">${this.data.balanceChange}</div>
                        </div>
                        
                        <div class="card">
                            <h3>Recent Activity</h3>
                            ${this.renderActivities()}
                        </div>
                        
                        <div class="card">
                            <h3>Quick Stats</h3>
                            <div class="stats-grid">
                                <div class="stat">
                                    <span class="stat-value">${this.data.stats.transactions}</span>
                                    <span class="stat-label">Transactions this week</span>
                                </div>
                                <div class="stat">
                                    <span class="stat-value">${this.data.stats.monthlySpending}</span>
                                    <span class="stat-label">Monthly spending</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="right-main">
                    <div class="spending-chart-container">
                        <finsite-spending-chart width="100%" height="100%"></finsite-spending-chart>
                    </div>
                </div>
            </div>
        `;
    }

    renderActivities() {
        return this.data.activities.map(activity => `
            <div class="activity-item">
                <span class="activity-icon">${activity.icon}</span>
                <span class="activity-text">${activity.text}</span>
                <span class="activity-date">${activity.date}</span>
            </div>
        `).join('');
    }

    /**
     * Update dashboard data
     * @param {Object} newData - New data to display
     */
    updateData(newData) {
        this.data = { ...this.data, ...newData };
        this.render();
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