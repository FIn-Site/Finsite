import '../components/sidebar.js';
import '../components/dashboard.js';
import '../components/transactions.js';

/**
 * FinSiteView - Handles all UI rendering and DOM manipulation
 * Mint-style two-pane layout with persistent sidebar and main content area
 */
export class FinSiteView {
    constructor() {
        this.container = null;
        this.currentPage = 'dashboard';
        this.handlers = {};
        this.sidebarCollapsed = false;
    }

    /**
     * Allow the controller to register callbacks for view events
     * @param {Object} handlers - { onNavigate: (route) => {...}}
     */
    bindHandlers(handlers) {
        this.handlers = handlers || {};
    }

    /**
     * Render the main application view
     * @param {string} selector - CSS selector for the container element
     */
    render(selector) {
        console.log('🔍 Looking for container:', selector);
        this.container = document.querySelector(selector);
        
        if (!this.container) {
            console.error(`❌ Container element ${selector} not found`);
            this.container = document.body;
            console.log('📍 Using body as fallback container');
        }

        console.log('📦 Container found, rendering layout...');

        // Create the two-pane layout: sidebar + main content
        this.container.innerHTML = `
            <div class="app-shell">
                <finsite-sidebar></finsite-sidebar>
                <main class="main-content" id="main-content">
                    <div id="content-area">
                        ${this.renderPageComponent('dashboard')}
                    </div>
                </main>
            </div>
        `;
        
        // Set up component event listeners
        this.setupComponentEvents();
        
        console.log('✅ FinSite layout rendered successfully');
    }

    /**
     * Set up component event listeners
     */
    setupComponentEvents() {
        // Set up sidebar navigation listener
        const sidebar = this.container.querySelector('finsite-sidebar');
        if (sidebar) {
            sidebar.addEventListener('navigate', (event) => {
                const { page } = event.detail;
                
                if (this.handlers && typeof this.handlers.onNavigate === 'function') {
                    // Forward to controller
                    this.handlers.onNavigate(page);
                } else {
                    // Fallback: local navigation
                    this.navigateToPage(page);
                }
            });

            // Handle sidebar collapse/expand
            sidebar.addEventListener('sidebar-toggle', (event) => {
                const { collapsed } = event.detail;
                this.sidebarCollapsed = collapsed;
                const mainContent = this.container.querySelector('#main-content');
                if (mainContent) {
                    if (collapsed) {
                        mainContent.classList.add('sidebar-collapsed');
                    } else {
                        mainContent.classList.remove('sidebar-collapsed');
                    }
                }
            });
        }

        // Set up add-transaction listener (bubbles from finsite-transactions component)
        this.container.addEventListener('add-transaction', (event) => {
            const transactionData = event.detail;
            console.log('📝 Add transaction event received:', transactionData);
            
            if (this.handlers && typeof this.handlers.onAddTransaction === 'function') {
                this.handlers.onAddTransaction(transactionData);
            }
        });

        // Set up open-manual-entry listener for analytics/logging
        this.container.addEventListener('open-manual-entry', (event) => {
            console.log('📊 Manual entry modal opened from:', event.detail.source);
        });
    }

    /**
     * Navigate to a specific page
     * @param {string} page - Page to navigate to
     */
    navigateToPage(page) {
        this.currentPage = page;
        const contentArea = this.container.querySelector('#content-area');
        if (contentArea) {
            contentArea.innerHTML = this.renderPageComponent(page);
        }
        console.log(`📄 Navigated to ${page} page`);
    }

    /**
     * Render component for a specific page
     * @param {string} page - Page to render component for
     * @returns {string} Component HTML for the page
     */
    renderPageComponent(page) {
        switch(page) {
            case 'dashboard':
                return '<finsite-dashboard></finsite-dashboard>';
            case 'transactions':
                return '<finsite-transactions></finsite-transactions>';
            default:
                return `
                    <div class="page-header">
                        <h1>Page Not Found</h1>
                        <p>The requested page could not be found.</p>
                    </div>
                `;
        }
    }

    /**
     * Update the view with new data
     * @param {Object} data - Data to display
     */
    update(data) {
        if (data.currentView && data.currentView !== this.currentPage) {
            this.navigateToPage(data.currentView);
        }
        
        // Update dashboard component with new data if it's active
        if (this.currentPage === 'dashboard') {
            const dashboard = this.container.querySelector('finsite-dashboard');
            if (dashboard && dashboard.updateData) {
                dashboard.updateData(data);
            }
        }

        // Update transactions component with new data if it's active
        if (this.currentPage === 'transactions') {
            const transactionsPage = this.container.querySelector('finsite-transactions');
            if (transactionsPage && typeof transactionsPage.setTransactions === 'function') {
                transactionsPage.setTransactions(data.transactions || []);
            }
        }
        
        console.log('View updated with data:', data);
    }

    /**
     * Update dashboard charts with pre-aggregated data from model
     * This passes the summary directly to the dashboard's chart component
     * @param {Object} chartData - Pre-aggregated chart data { timeSeries, groupBreakdown, metrics }
     * @param {boolean} isHeavyUpdate - True for bulk updates (disables animation)
     */
    updateDashboardCharts(chartData, isHeavyUpdate = false) {
        // Only update if dashboard is visible or exists
        const dashboard = this.container?.querySelector('finsite-dashboard');
        if (dashboard && typeof dashboard.updateChartData === 'function') {
            dashboard.updateChartData(chartData, isHeavyUpdate);
            console.log('📊 Dashboard charts updated with:', chartData);
        }
    }

    /**
     * Update dashboard panel with summary data (stats cards, recent activity)
     * This passes real transaction data to replace static demo values
     * @param {Object} panelSummary - Panel summary from model
     */
    updateDashboardPanel(panelSummary) {
        // Only update if dashboard is visible or exists
        const dashboard = this.container?.querySelector('finsite-dashboard');
        if (dashboard && typeof dashboard.updateFromSummary === 'function') {
            dashboard.updateFromSummary(panelSummary);
            console.log('📋 Dashboard panel updated with:', panelSummary);
        }
    }

    /**
     * Get the current page
     * @returns {string} Current page name
     */
    getCurrentPage() {
        return this.currentPage;
    }
}