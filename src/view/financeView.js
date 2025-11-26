import '../components/sidebar.js';
import '../components/header.js';
import '../components/dashboard.js';
import '../components/transactions.js';

/**
 * FinSiteView - Handles all UI rendering and DOM manipulation
 * Responsible for presenting data and capturing user interactions
 */
export class FinSiteView {
    constructor() {
        this.container = null;
        this.currentPage = 'dashboard';
        this.handlers = {};
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

        // Create the main application layout with components
        this.container.innerHTML = `
            <finsite-header></finsite-header>
            <finsite-sidebar></finsite-sidebar>
            <div class="main-container" id="main-container">
                <div id="content-area">
                    ${this.renderPageComponent('dashboard')}
                </div>
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
        }

        // Set up header toggle listener
        const header = this.container.querySelector('finsite-header');
        const mainContainer = this.container.querySelector('#main-container');
        
        if (header && sidebar && mainContainer) {
            header.addEventListener('toggle-sidebar', () => {
                sidebar.classList.toggle('hidden');
                mainContainer.classList.toggle('sidebar-hidden');
            });
        }
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
        
        console.log('View updated with data:', data);
    }

    /**
     * Get the current page
     * @returns {string} Current page name
     */
    getCurrentPage() {
        return this.currentPage;
    }
}