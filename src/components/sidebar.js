/**
 * Sidebar Web Component for FinSite
 * Custom element that handles navigation between Dashboard and Transactions
 */
class SidebarComponent extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.currentPage = 'dashboard';
    }

    connectedCallback() {
        this.render();
        this.setupEventListeners();
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
                    position: fixed;
                    left: 0;
                    top: 0;
                    width: 240px;
                    height: 100vh;
                    background: #1a1a1a;
                    z-index: 1000;
                    transition: transform 0.3s ease;
                    padding: 80px 0 0 0;
                    margin: 0;
                }

                .nav-item {
                    width: calc(100% - 1rem);
                    height: 36px;
                    margin: 0 0.5rem 0.25rem 0.5rem;
                    background: transparent;
                    border: none;
                    border-radius: 0.5rem;
                    display: flex;
                    align-items: center;
                    padding: 0 1rem;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    text-decoration: none;
                    color: #9ca3af;
                    font-size: 14px;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    font-weight: 500;
                    line-height: 1;
                    border-left: none;
                }

                .nav-item:hover {
                    background: rgba(59, 130, 246, 0.1);
                    color: #ffffff;
                }

                .nav-item.active {
                    background: #3b82f6;
                    color: #ffffff;
                    border-radius: 0.75rem;
                    box-shadow: 0 0.125rem 0.25rem rgba(59, 130, 246, 0.3);
                }

                .nav-item-icon {
                    width: 18px;
                    height: 18px;
                    margin: 0 12px 0 0;
                    padding: 0;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 14px;
                    border-radius: 4px;
                    background: rgba(255, 255, 255, 0.1);
                }

                .nav-item.active .nav-item-icon {
                    background: rgba(255, 255, 255, 0.2);
                }

                .nav-label {
                    flex: 1;
                    margin: 0;
                    padding: 0;
                    font-weight: 500;
                }

                /* Responsive Design */
                @media (max-width: 768px) {
                    :host {
                        width: 100%;
                        transform: translateX(-100%);
                    }
                    
                    :host(.visible) {
                        transform: translateX(0);
                    }
                }
            </style>

            <a class="nav-item active" data-page="dashboard">
                <span class="nav-item-icon">📊</span>
                <span class="nav-label">Dashboard</span>
            </a>
            <a class="nav-item" data-page="transactions">
                <span class="nav-item-icon">💳</span>
                <span class="nav-label">Transactions</span>
            </a>
        `;
    }

    setupEventListeners() {
        const navItems = this.shadowRoot.querySelectorAll('.nav-item');
        
        navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const page = item.getAttribute('data-page');
                this.navigate(page, item);
            });
        });
    }

    navigate(page, clickedItem) {
        // Update active state
        const allItems = this.shadowRoot.querySelectorAll('.nav-item');
        allItems.forEach(item => item.classList.remove('active'));
        clickedItem.classList.add('active');
        
        // Update current page
        this.currentPage = page;
        
        // Dispatch custom event for navigation
        this.dispatchEvent(new CustomEvent('navigate', {
            detail: { page },
            bubbles: true,
            composed: true
        }));
        
        console.log(`🧭 Sidebar navigated to: ${page}`);
    }

    /**
     * Set the active page programmatically
     * @param {string} page - Page to set as active
     */
    setActivePage(page) {
        const targetItem = this.shadowRoot.querySelector(`[data-page="${page}"]`);
        if (targetItem) {
            const allItems = this.shadowRoot.querySelectorAll('.nav-item');
            allItems.forEach(item => item.classList.remove('active'));
            targetItem.classList.add('active');
            this.currentPage = page;
        }
    }

    /**
     * Get the current active page
     * @returns {string} Current page name
     */
    getCurrentPage() {
        return this.currentPage;
    }
}

// Define the custom element
customElements.define('finsite-sidebar', SidebarComponent);

export { SidebarComponent };