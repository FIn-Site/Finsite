/**
 * @fileoverview View layer for FinSite application.
 * Handles UI rendering, DOM manipulation, and component orchestration.
 * @module financeView
 */

import '../components/sidebar.js';
import '../components/dashboard.js';
import '../components/transactions.js';
import '../components/categories.js';
import { createPrefixedLogger } from '../utils/debugService.js';

// Prefixed logger for view layer
const log = createPrefixedLogger('[View]');

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
        log('🔍 Looking for container:', selector);
        this.container = document.querySelector(selector);

        if (!this.container) {
            console.error(`❌ Container element ${selector} not found`);
            this.container = document.body;
            log('📍 Using body as fallback container');
        }

        log('📦 Container found, rendering layout...');

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

        log('✅ FinSite layout rendered successfully');
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
            log('📝 Add transaction event received:', transactionData);

            if (this.handlers && typeof this.handlers.onAddTransaction === 'function') {
                this.handlers.onAddTransaction(transactionData);
            }
        });

        // Set up update-transaction listener (bubbles from finsite-transactions component)
        this.container.addEventListener('update-transaction', (event) => {
            const transactionData = event.detail;
            log('✏️ Update transaction event received:', transactionData);

            if (this.handlers && typeof this.handlers.onUpdateTransaction === 'function') {
                this.handlers.onUpdateTransaction(transactionData);
            }
        });

        // Set up delete-transaction listener (bubbles from finsite-transactions component)
        this.container.addEventListener('delete-transaction', (event) => {
            const { id } = event.detail;
            log('🗑️ Delete transaction event received:', id);

            if (this.handlers && typeof this.handlers.onDeleteTransaction === 'function') {
                this.handlers.onDeleteTransaction(id);
            }
        });

        // Set up open-manual-entry listener for analytics/logging
        this.container.addEventListener('open-manual-entry', (event) => {
            log('📊 Manual entry modal opened from:', event.detail.source);
        });

        // Set up delete-group listener (bubbles from finsite-categories component)
        this.container.addEventListener('request-delete-group', (event) => {
            const { groupId, groupName } = event.detail || {};
            log('🗑️ Delete group request received:', groupId, groupName);

            if (this.handlers && typeof this.handlers.onDeleteGroup === 'function') {
                this.handlers.onDeleteGroup(groupId, groupName);
            }
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

        // Ensure freshly-rendered categories receive the model
        this._wireModelToCategories();

        // Ensure freshly-rendered transactions receive taxonomy
        this._wireModelToTransactions();

        log(`📄 Navigated to ${page} page`);
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
            // Store reference for notifications
            this.transactionsEl = transactionsPage;
            if (transactionsPage && typeof transactionsPage.setTransactions === 'function') {
                transactionsPage.setTransactions(data.transactions || []);
                if (this.model) {
                    transactionsPage.model = this.model;
                    if (typeof transactionsPage.setTaxonomy === 'function') {
                        let groups = data.groups || [];
                        let categories = data.categories || [];

                        // Fall back to default config if no groups/categories exist
                        if (groups.length === 0 || categories.length === 0) {
                            const defaults = this.model.getDefaultConfig?.();
                            if (defaults) {
                                if (groups.length === 0) {
                                    groups = defaults.defaultGroups || [];
                                }
                                if (categories.length === 0) {
                                    categories = defaults.defaultCategories || [];
                                }
                            }
                        }

                        transactionsPage.setTaxonomy({ groups, categories });
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

        log('View updated with data:', data);
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
            log('📊 Dashboard charts updated with:', chartData);
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
            log('📋 Dashboard panel updated with:', panelSummary);
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

    /**
     * Inject taxonomy (groups/categories) into transactions component.
     * This ensures the dropdown menus are populated with available options.
     * Falls back to default config if no groups/categories exist yet.
     */
    _wireModelToTransactions() {
        if (!this.model || !this.container) return;
        this.container.querySelectorAll('finsite-transactions').forEach((el) => {
            try {
                // Set model reference for future syncing
                el.model = this.model;

                // Inject transactions data
                if (typeof el.setTransactions === 'function') {
                    const transactions = this.model.getTransactions?.() || [];
                    el.setTransactions(transactions);
                    log('Transactions wired to component:', transactions.length);
                }

                // Inject taxonomy data directly
                if (typeof el.setTaxonomy === 'function') {
                    let groups = this.model.getGroups?.() || [];
                    let categories = this.model.getCategories?.() || [];

                    // Fall back to default config if no groups/categories exist
                    if (groups.length === 0 || categories.length === 0) {
                        const defaults = this.model.getDefaultConfig?.();
                        if (defaults) {
                            if (groups.length === 0) {
                                groups = defaults.defaultGroups || [];
                            }
                            if (categories.length === 0) {
                                categories = defaults.defaultCategories || [];
                            }
                            log('Using default taxonomy for transactions (no data yet)');
                        }
                    }

                    el.setTaxonomy({ groups, categories });
                    log('Taxonomy wired to transactions:', { groups: groups.length, categories: categories.length });
                }
            } catch (err) {
                console.warn('Failed to wire model to transactions component', err);
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
        log('✅ Transaction added notification sent to component');
    }

    /**
     * Notify the transactions component that a transaction was successfully updated.
     * Routes controller feedback through view interface to avoid direct DOM coupling.
     *
     * @param {Object} updatedTransaction - The updated transaction with ID
     */
    onTransactionUpdated(updatedTransaction) {
        if (this.transactionsEl && typeof this.transactionsEl.onTransactionUpdated === 'function') {
            this.transactionsEl.onTransactionUpdated(updatedTransaction);
        }
        log('✅ Transaction updated notification sent to component');
    }

    /**
     * Notify the transactions component that a transaction was successfully deleted.
     * Routes controller feedback through view interface to avoid direct DOM coupling.
     *
     * @param {number} transactionId - The ID of the deleted transaction
     */
    onTransactionDeleted(transactionId) {
        if (this.transactionsEl && typeof this.transactionsEl.onTransactionDeleted === 'function') {
            this.transactionsEl.onTransactionDeleted(transactionId);
        }
        log('✅ Transaction deleted notification sent to component');
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
        log('❌ Transaction error notification sent to component:', errorMessage);
    }

    /**
     * Notify the view that transactions were successfully deleted.
     * Can be used to update UI state or show confirmation.
     *
     * @param {Array} ids - IDs of deleted transactions
     */
    onTransactionsDeleted(ids) {
        log(`🗑️ ${ids.length} transactions deleted`);
        // Transactions component will update via the normal update() flow
        // This hook is available for additional UI feedback if needed
    }

    /**
     * Notify the categories component that a group was successfully deleted.
     * Routes controller feedback through view interface.
     *
     * @param {string} groupId - ID of deleted group
     */
    onGroupDeleted(groupId) {
        const categoriesPage = this.container?.querySelector('finsite-categories');
        if (categoriesPage && typeof categoriesPage.onGroupDeleted === 'function') {
            categoriesPage.onGroupDeleted(groupId);
        }
        log(`🗑️ Group deleted notification sent to component: ${groupId}`);
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
        log(`📦 Bulk import: ${result.savedCount} saved, ${result.skippedCount} skipped`);
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
