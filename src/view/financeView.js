import '../components/sidebar.js';
import '../components/dashboard.js';
import '../components/transactions.js';
import '../components/categories.js';

/**
 * FinSiteView - Manages UI rendering and DOM operations for the FinSite application.
 * 
 * Implements a persistent two-pane layout pattern where page components are created once
 * and toggled via visibility rather than destroyed/recreated on navigation. This improves
 * performance by preserving component state and avoiding unnecessary DOM manipulation.
 * 
 * Architecture:
 * - Sidebar persists across all pages
 * - Three page sections (dashboard, transactions, categories) exist simultaneously
 * - Only the active page is visible; others are hidden with HTML `hidden` attribute
 * - Components are cached on initialization and reused throughout the session
 */
export class FinSiteView {
    /**
     * Initialize the view with optional model dependency.
     * 
     * @param {Object} [model=null] - Shared data model; enables bidirectional data flow
     *                                between view and model without tight coupling
     */
    constructor(model = null) {
        /** @type {HTMLElement|null} Root DOM element where the app shell is mounted */
        this.container = null;
        
        /** @type {string} Tracks which page is currently visible to users */
        this.currentPage = 'dashboard';
        
        /** @type {Object} Callbacks registered by controller for view events (navigation, transactions) */
        this.handlers = {};
        
        /** @type {boolean} Tracks sidebar collapsed state to adjust main content layout dynamically */
        this.sidebarCollapsed = false;
        
        /** @type {Object|null} Shared model reference; passed to child components that need data access */
        this.model = model;

        /** @type {boolean} When false, suppresses all debug logs to reduce console noise in production */
        this.debug = false;

        // Cached component references to avoid repeated DOM queries and enable direct method calls
        /** @type {HTMLElement|null} Dashboard component instance; reused across navigation cycles */
        this.dashboardEl = null;
        
        /** @type {HTMLElement|null} Transactions component instance; persists filter/sort state */
        this.transactionsEl = null;
        
        /** @type {HTMLElement|null} Categories component instance; maintains modal/chart state */
        this.categoriesEl = null;

        /** @type {HTMLElement|null} Sidebar component instance; handles navigation events */
        this.sidebarEl = null;
    }

    /**
     * Conditionally log to console only when debug mode is enabled.
     * Prevents production console clutter while allowing developer visibility during development.
     * 
     * @param {...*} args - Any arguments that would normally go to console.log
     * @private
     */
    _debugLog(...args) {
        if (this.debug) {
            console.log(...args);
        }
    }

    /**
     * Register controller callbacks that respond to view-initiated events.
     * Enables loose coupling where the view doesn't need to know about controller internals.
     * 
     * @param {Object} handlers - Map of event names to handler functions
     * @param {Function} handlers.onNavigate - Called when user clicks sidebar nav; receives page name
     * @param {Function} handlers.onAddTransaction - Called when user submits transaction form; receives form data
     */
    bindHandlers(handlers) {
        this.handlers = handlers || {};
    }

    /**
     * Build the complete application shell and mount all page components.
     * 
     * Creates a persistent structure where components live throughout the session rather than
     * being destroyed/recreated on navigation. This preserves state (filters, scroll position)
     * and avoids expensive re-initialization of Web Components and Chart.js instances.
     * 
     * @param {string} selector - CSS selector for the mount point (e.g., '#app')
     * @throws {Error} If the container element doesn't exist; fails fast to catch config errors
     */
    render(selector) {
        this.container = document.querySelector(selector);

        // Fail immediately if mount point is missing rather than falling back to document.body
        // This surfaces integration bugs early instead of silently breaking layout
        if (!this.container) {
            throw new Error(`Container element ${selector} not found`);
        }

        this._debugLog('📦 Container found, rendering layout...');

        // Build the two-pane skeleton: sidebar + content area
        this.container.innerHTML = `
            <div class="app-shell">
                <finsite-sidebar></finsite-sidebar>
                <main class="main-content" id="main-content">
                    <div id="content-area"></div>
                </main>
            </div>
        `;

        // Create persistent page hosts that will hold components throughout the session
        // Using `hidden` attribute for visibility control preserves DOM state and is more
        // performant than destroying/recreating innerHTML
        const contentArea = this.container.querySelector('#content-area');
        contentArea.innerHTML = `
            <section id="page-dashboard"></section>
            <section id="page-transactions" hidden></section>
            <section id="page-categories" hidden></section>
        `;

        // Instantiate all page components once during initialization
        // These component instances persist for the lifetime of the view
        const dashboardHost = contentArea.querySelector('#page-dashboard');
        const transactionsHost = contentArea.querySelector('#page-transactions');
        const categoriesHost = contentArea.querySelector('#page-categories');

        this.dashboardEl = document.createElement('finsite-dashboard');
        dashboardHost.appendChild(this.dashboardEl);

        this.transactionsEl = document.createElement('finsite-transactions');
        transactionsHost.appendChild(this.transactionsEl);

        this.categoriesEl = document.createElement('finsite-categories');
        categoriesHost.appendChild(this.categoriesEl);

        // Cache sidebar reference to avoid repeated DOM queries in event handlers
        this.sidebarEl = this.container.querySelector('finsite-sidebar');

        // Wire up all event listeners that delegate user actions to the controller
        this.setupComponentEvents();

        // Inject model into categories component so it can fetch data directly
        this._wireModelToCategories();

        this._debugLog('✅ FinSite layout rendered successfully');
    }

    /**
     * Attach event listeners that forward user interactions to the controller.
     * 
     * Establishes the event-driven communication pattern where:
     * 1. User interacts with a component (e.g., clicks sidebar link)
     * 2. Component dispatches a custom event
     * 3. View catches the event and calls the appropriate controller handler
     * 4. Controller updates model and tells view to refresh
     * 
     * This keeps components decoupled from business logic.
     * 
     * @private
     */
    setupComponentEvents() {
        // Listen for sidebar navigation clicks and delegate routing to controller
        if (this.sidebarEl) {
            this.sidebarEl.addEventListener('navigate', (event) => {
                const { page } = event.detail;

                if (this.handlers && typeof this.handlers.onNavigate === 'function') {
                    // Controller handles the navigation (preferred path)
                    this.handlers.onNavigate(page);
                } else {
                    // Fallback for standalone testing without a controller
                    this.navigateToPage(page);
                }
            });

            // Track sidebar expand/collapse state to adjust main content margins dynamically
            this.sidebarEl.addEventListener('sidebar-toggle', (event) => {
                const { collapsed } = event.detail;
                this.sidebarCollapsed = collapsed;
                const mainContent = this.container.querySelector('#main-content');
                if (mainContent) {
                    // Add/remove CSS class that triggers layout transition
                    if (collapsed) {
                        mainContent.classList.add('sidebar-collapsed');
                    } else {
                        mainContent.classList.remove('sidebar-collapsed');
                    }
                }
            });
        }

        // Listen for transaction form submissions bubbling up from transactions component
        this.container.addEventListener('add-transaction', (event) => {
            const transactionData = event.detail;
            this._debugLog('📝 Add transaction event received:', transactionData);

            // Forward to controller which will persist to model and trigger view update
            if (this.handlers && typeof this.handlers.onAddTransaction === 'function') {
                this.handlers.onAddTransaction(transactionData);
            }
        });

        // Track when manual entry modal opens (useful for analytics/debugging)
        this.container.addEventListener('open-manual-entry', (event) => {
            this._debugLog('📊 Manual entry modal opened from:', event.detail.source);
        });
    }

    /**
     * Switch the visible page by toggling section visibility.
     * 
     * Uses the `hidden` attribute rather than destroying/recreating DOM, which:
     * - Preserves component state (scroll position, filter selections, etc.)
     * - Avoids re-initializing Web Components and Chart.js instances
     * - Reduces memory churn and improves perceived performance
     * 
     * @param {string} page - Page identifier ('dashboard' | 'transactions' | 'categories')
     */
    navigateToPage(page) {
        this.currentPage = page;
        this._togglePageVisibility(page);
        // Ensure categories component receives model reference after navigation
        // (important if navigation happens before model is available)
        this._wireModelToCategories();
        this._debugLog(`📄 Navigated to ${page} page`);
    }

    /**
     * Show the target page and hide all others.
     * 
     * @param {string} page - Page to make visible
     * @throws {Error} If page host elements weren't created during render()
     * @private
     */
    _togglePageVisibility(page) {
        const dashboardHost = this.container.querySelector('#page-dashboard');
        const transactionsHost = this.container.querySelector('#page-transactions');
        const categoriesHost = this.container.querySelector('#page-categories');

        // Fail fast if page hosts are missing (indicates render() wasn't called)
        if (!dashboardHost || !transactionsHost || !categoriesHost) {
            throw new Error('Page hosts not initialized');
        }

        // Toggle visibility using `hidden` attribute (more semantic and accessible than display:none)
        dashboardHost.hidden = page !== 'dashboard';
        transactionsHost.hidden = page !== 'transactions';
        categoriesHost.hidden = page !== 'categories';
    }

    /**
     * Push new data to all page components without changing which page is visible.
     * 
     * Called by the controller after model updates (e.g., transaction added, filters changed).
     * Updates all components regardless of visibility so switching pages shows fresh data
     * without an extra fetch.
     * 
     * Note: Navigation is now the controller's responsibility; this method only updates data.
     * 
     * @param {Object} data - Application state from the model
     * @param {Array} data.transactions - All transactions
     * @param {Array} data.groups - Spending categories groups
     * @param {Array} data.categories - Individual spending categories
     */
    update(data) {
        // Update all three page components simultaneously
        // They'll only re-render if they're currently visible, but data is ready when switching
        this._updateDashboardData(data);
        this._updateTransactionsData(data);
        this._updateCategoriesData(data);

        this._debugLog('View updated with data:', this.debug ? data : '[redacted]');
    }

    /**
     * Send updated data to the dashboard component.
     * Dashboard needs transactions for recent activity and totals for stat cards.
     * 
     * @param {Object} data - Model state
     * @private
     */
    _updateDashboardData(data) {
        if (!this.dashboardEl || typeof this.dashboardEl.updateData !== 'function') return;
        this.dashboardEl.updateData(data);
    }

    /**
     * Send updated transactions to the transactions page component.
     * Also passes taxonomy (groups/categories) so user can filter and categorize entries.
     * 
     * @param {Object} data - Model state
     * @private
     */
    _updateTransactionsData(data) {
        if (!this.transactionsEl || typeof this.transactionsEl.setTransactions !== 'function') return;
        this.transactionsEl.setTransactions(data.transactions || []);
        
        // Pass model reference so transactions component can query groups/categories directly
        if (this.model && typeof this.transactionsEl.setTaxonomy === 'function') {
            this.transactionsEl.model = this.model;
            this.transactionsEl.setTaxonomy({
                groups: data.groups || [],
                categories: data.categories || [],
            });
        }
    }

    /**
     * Send updated data to the categories page component.
     * Categories needs model reference to call aggregation methods directly.
     * 
     * @param {Object} data - Model state
     * @private
     */
    _updateCategoriesData(data) {
        if (!this.categoriesEl) return;
        
        // Inject model so categories component can call getCategoryAggregates() directly
        if (this.model && 'model' in this.categoriesEl) {
            this.categoriesEl.model = this.model;
        }
        
        // Pass raw data for fallback when model methods aren't available
        if (typeof this.categoriesEl.setData === 'function') {
            this.categoriesEl.setData(data);
        }
    }

    /**
     * Update dashboard charts with pre-computed aggregations from the model.
     * 
     * The model performs expensive aggregations (time-series totals, group breakdowns)
     * and passes ready-to-render data here. This keeps the view layer lightweight and
     * allows the model to optimize aggregations (e.g., incremental updates).
     * 
     * Uses cached dashboardEl reference to avoid DOM queries and enable direct method calls.
     * 
     * @param {Object} chartData - Pre-aggregated chart data from model
     * @param {Object} chartData.timeSeries - Monthly spending totals for line chart
     * @param {Object} chartData.groupBreakdown - Spending by category for pie chart
     * @param {Object} chartData.metrics - Summary stats (6-month average, percent change)
     * @param {boolean} [isHeavyUpdate=false] - If true, disables chart animations for bulk updates
     */
    updateDashboardCharts(chartData, isHeavyUpdate = false) {
        if (this.dashboardEl && typeof this.dashboardEl.updateChartData === 'function') {
            this.dashboardEl.updateChartData(chartData, isHeavyUpdate);
            this._debugLog('📊 Dashboard charts updated with:', chartData);
        }
    }

    /**
     * Update dashboard stat cards and recent activity section with summary data.
     * 
     * The model calculates totals, recent transactions, and comparison metrics,
     * then this method pushes them to the dashboard component for display.
     * Keeps the dashboard component purely presentational.
     * 
     * Uses cached dashboardEl reference for consistent component communication.
     * 
     * @param {Object} panelSummary - Dashboard summary from model
     * @param {number} panelSummary.totalSpentAllTime - Lifetime spending total
     * @param {number} panelSummary.transactionsThisWeek - Count of recent transactions
     * @param {number} panelSummary.monthlySpendingCurrent - This month's spending
     * @param {number} panelSummary.monthlyChangePercent - Month-over-month change
     * @param {Array} panelSummary.recentTransactions - Last 5 transactions for activity list
     */
    updateDashboardPanel(panelSummary) {
        if (this.dashboardEl && typeof this.dashboardEl.updateFromSummary === 'function') {
            this.dashboardEl.updateFromSummary(panelSummary);
            this._debugLog('📋 Dashboard panel updated with:', panelSummary);
        }
    }

    /**
     * Inject the shared model reference into all categories components in the DOM.
     * 
     * Categories components need the model to call aggregation methods (getCategoryAggregates)
     * directly rather than having the view act as a middleman. This supports the component's
     * async loading pattern where it fetches data after mounting.
     * 
     * Called after render() and navigation to ensure components have model access.
     * 
     * @private
     */
    _wireModelToCategories() {
        if (!this.model || !this.container) return;
        // Query all instances in case multiple exist (though typically only one)
        this.container.querySelectorAll('finsite-categories').forEach((el) => {
            el.model = this.model;
        });
    }

    /**
     * Get the currently visible page identifier.
     * Useful for controller to determine context when handling events.
     * 
     * @returns {string} Current page name ('dashboard' | 'transactions' | 'categories')
     */
    getCurrentPage() {
        return this.currentPage;
    }
}
