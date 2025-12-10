import '../components/sidebar.js';
import '../components/dashboard.js';
import '../components/transactions.js';
import '../components/categories.js';

/**
 * FinSiteView - Handles all UI rendering and DOM manipulation
 * Mint-style two-pane layout with persistent sidebar and main content area
 */
export class FinSiteView {
    constructor(model = null) {
        this.container = null;
        this.currentPage = 'dashboard';
        this.handlers = {};
        this.sidebarCollapsed = false;
        this.model = model;
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

        // Pass model reference to categories component if available
        this._wireModelToCategories();

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

        // Ensure freshly-rendered categories receive the model
        this._wireModelToCategories();
        console.log(`📄 Navigated to ${page} page`);
    }

    /**
     * Render component for a specific page
     * @param {string} page - Page to render component for
     * @returns {string} Component HTML for the page
     */
    renderPageComponent(page) {
        switch (page) {
            case 'dashboard':
                return '<finsite-dashboard></finsite-dashboard>';
            case 'transactions':
                return '<finsite-transactions></finsite-transactions>';
            case 'categories':
                return '<finsite-categories></finsite-categories>';
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
                if (this.model) {
                    transactionsPage.model = this.model;
                    if (typeof transactionsPage.setTaxonomy === 'function') {
                        transactionsPage.setTaxonomy({
                            groups: data.groups || [],
                            categories: data.categories || [],
                        });
                    }
                }
            }
        }

        // Keep categories component in sync with latest model data
        if (this.currentPage === 'categories') {
            const categoriesPage = this.container.querySelector('finsite-categories');
            if (categoriesPage) {
                if (this.model && 'model' in categoriesPage) {
                    categoriesPage.model = this.model;
                }
                if (typeof categoriesPage.setData === 'function') {
                    categoriesPage.setData(data);
                }
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
     * Inject the shared model into any categories components currently rendered.
     */
    _wireModelToCategories() {
        if (!this.model || !this.container) return;
        this.container.querySelectorAll('finsite-categories').forEach((el) => {
            try {
                el.model = this.model;
            } catch (err) {
                console.warn('Failed to wire model to categories component', err);
            }
        });
    }

    // ============================================================
    // TRANSACTION FEEDBACK METHODS (Controller → View → Component)
    // ============================================================

    /**
     * Notify the transactions component that a transaction was successfully added.
     * Routes controller feedback through view interface to avoid direct DOM coupling.
     * 
     * @param {Object} savedTransaction - The persisted transaction with ID
     */
    onTransactionAdded(savedTransaction) {
        if (this.transactionsEl && typeof this.transactionsEl.onTransactionAdded === 'function') {
            this.transactionsEl.onTransactionAdded(savedTransaction);
        }
        this._debugLog('✅ Transaction added notification sent to component');
    }

    /**
     * Notify the transactions component that a transaction save failed.
     * Routes controller error feedback through view interface.
     * 
     * @param {string} errorMessage - User-friendly error message
     */
    onTransactionError(errorMessage) {
        if (this.transactionsEl && typeof this.transactionsEl.onTransactionError === 'function') {
            this.transactionsEl.onTransactionError(errorMessage);
        }
        this._debugLog('❌ Transaction error notification sent to component:', errorMessage);
    }

    /**
     * Notify the view that transactions were successfully deleted.
     * Can be used to update UI state or show confirmation.
     * 
     * @param {Array} ids - IDs of deleted transactions
     */
    onTransactionsDeleted(ids) {
        this._debugLog(`🗑️ ${ids.length} transactions deleted`);
        // Transactions component will update via the normal update() flow
        // This hook is available for additional UI feedback if needed
    }

    /**
     * Notify the view that a bulk import completed.
     * Can show summary toast/notification with import results.
     * 
     * @param {Object} result - Import results
     * @param {number} result.savedCount - Number of successfully saved transactions
     * @param {number} result.skippedCount - Number of skipped/invalid transactions
     * @param {Array} result.skippedDetails - Details of skipped transactions with error reasons
     */
    onBulkImportComplete(result) {
        this._debugLog(`📦 Bulk import: ${result.savedCount} saved, ${result.skippedCount} skipped`);
        // Could show a toast notification here
        // For now, transactions component updates via normal update() flow
    }

    /**
     * Display an error message to the user.
     * Provides user feedback for failed operations.
     * 
     * @param {string} message - Error message to display
     */
    showError(message) {
        // For now, use browser alert. Could be replaced with toast/banner component.
        // This is better than silent failure.
        console.error('UI Error:', message);
        // Optionally show to user - can be enhanced with toast component later
        // alert(message);
    }

    /**
     * Get the current page
     * @returns {string} Current page name
     */
    getCurrentPage() {
        return this.currentPage;
    }
}
