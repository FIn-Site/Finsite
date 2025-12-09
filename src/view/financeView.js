/**
 * @fileoverview View layer for FinSite application.
 * Handles UI rendering, DOM manipulation, and component orchestration.
 * @module financeView
 */

import '../components/sidebar.js';
import '../components/dashboard.js';
import '../components/transactions.js';

/**
 * FinSite View - Handles all UI rendering and DOM manipulation.
 * 
 * Architecture:
 * - Mint-style two-pane layout with persistent sidebar and main content area
 * - Uses Web Components for modular UI
 * - Delegates data visualization to chart components
 * - Handles component event forwarding to controller
 * 
 * @class
 */
export class FinSiteView {
    /**
     * Initialize view with default state.
     */
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
     * Set up component event listeners.
     * 
     * Listens for:
     * - Sidebar navigation events
     * - Sidebar collapse/expand events
     * - Add transaction events from transactions component
     * - Manual entry modal open events
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
     * Navigate to a specific page.
     * 
     * Updates current page state and re-renders content area
     * with appropriate component.
     * 
     * @param {string} page - Page identifier ('dashboard', 'transactions')
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
     * Render component for a specific page.
     * 
     * Returns HTML string for the appropriate Web Component.
     * Shows 404 message for unknown pages.
     * 
     * @param {string} page - Page identifier ('dashboard', 'transactions')
     * @returns {string} Component HTML string
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
     * Update the view with new data.
     * 
     * Handles page navigation and passes data to active component.
     * Called by controller after model state changes.
     * 
     * @param {Object} data - Data from model
     * @param {string} [data.currentView] - Page to display
     * @param {Array} [data.transactions] - Transaction array for transactions page
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
     * Update dashboard charts with pre-aggregated data from model.
     * 
     * Passes aggregated chart data directly to dashboard component's
     * chart child component. Only updates if dashboard is currently rendered.
     * 
     * @param {Object} chartData - Pre-aggregated chart data from model
     * @param {Object} chartData.timeSeries - {labels: string[], values: number[]}
     * @param {Object} chartData.groupBreakdown - {labels: string[], values: number[]}
     * @param {Object} chartData.metrics - {thisMonth, lastMonth, percentChange, sixMonthAvg}
     * @param {boolean} [isHeavyUpdate=false] - True for bulk updates (disables animations)
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
     * Update dashboard panel with summary data.
     * 
     * Replaces static demo values in dashboard stat cards and
     * recent activity section with real transaction data.
     * 
     * @param {Object} panelSummary - Panel summary from model
     * @param {Array} panelSummary.recentTransactions - Recent transactions for activity list
     * @param {number} panelSummary.totalSpentAllTime - Lifetime spending total
     * @param {number} panelSummary.transactionsThisWeek - Transactions in last 7 days
     * @param {number} panelSummary.monthlySpendingCurrent - Current month spending
     * @param {number} panelSummary.monthlySpendingLast - Last month spending
     * @param {number} panelSummary.monthlyChangePercent - Month-over-month change %
     * @param {'up'|'down'|'neutral'} panelSummary.monthlyDirection - Spending trend
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
     * Get the current page identifier.
     * 
     * @returns {string} Current page name ('dashboard', 'transactions', etc.)
     */
    getCurrentPage() {
        return this.currentPage;
    }
}