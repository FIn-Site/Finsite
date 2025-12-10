import { createPrefixedLogger } from '../utils/debugService.js';

// Prefixed logger for sidebar component
const log = createPrefixedLogger('[Sidebar]');

/**
 * Sidebar Web Component for FinSite
 * Mint-style persistent sidebar with collapsible feature
 * Contains header with logo/icons, navigation items, and collapse toggle
 */
class SidebarComponent extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.currentPage = 'dashboard';
        this.isCollapsed = false;
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
                    display: flex;
                    flex-direction: column;
                    position: fixed;
                    left: 0;
                    top: 0;
                    width: 240px;
                    height: 100vh;
                    background: #0f172a;
                    z-index: 1000;
                    transition: width 0.25s ease;
                    border-right: 1px solid #1e293b;
                }

                :host(.collapsed) {
                    width: 68px;
                }

                /* Sidebar Header */
                .sidebar-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 1rem 1rem;
                    border-bottom: 1px solid #1e293b;
                    min-height: 60px;
                }

                .logo-section {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    overflow: hidden;
                }

                .logo-icon {
                    width: 32px;
                    height: 32px;
                    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                    border-radius: 8px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 1.1rem;
                    flex-shrink: 0;
                }

                .logo-text {
                    font-size: 1.125rem;
                    font-weight: 700;
                    color: #ffffff;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    white-space: nowrap;
                    transition: opacity 0.2s ease;
                }

                :host(.collapsed) .logo-text {
                    opacity: 0;
                    width: 0;
                }

                .header-icons {
                    display: flex;
                    align-items: center;
                    gap: 0.25rem;
                    transition: opacity 0.2s ease;
                }

                :host(.collapsed) .header-icons {
                    opacity: 0;
                    width: 0;
                    overflow: hidden;
                }

                .icon-btn {
                    width: 32px;
                    height: 32px;
                    background: transparent;
                    border: none;
                    border-radius: 6px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    color: #64748b;
                    font-size: 1rem;
                    transition: all 0.15s ease;
                }

                .icon-btn:hover {
                    background: #1e293b;
                    color: #e2e8f0;
                }

                .icon-btn.has-notification {
                    position: relative;
                }

                .icon-btn.has-notification::after {
                    content: '';
                    position: absolute;
                    top: 6px;
                    right: 6px;
                    width: 6px;
                    height: 6px;
                    background: #ef4444;
                    border-radius: 50%;
                }

                /* Navigation Section */
                .nav-section {
                    flex: 1;
                    padding: 1rem 0.75rem;
                    overflow-y: auto;
                    overflow-x: hidden;
                }

                .nav-label {
                    font-size: 0.65rem;
                    font-weight: 600;
                    color: #64748b;
                    text-transform: uppercase;
                    letter-spacing: 0.08em;
                    padding: 0 0.5rem;
                    margin-bottom: 0.5rem;
                    white-space: nowrap;
                    transition: opacity 0.2s ease;
                }

                :host(.collapsed) .nav-label {
                    opacity: 0;
                }

                .nav-item {
                    width: 100%;
                    height: 44px;
                    margin-bottom: 0.25rem;
                    background: transparent;
                    border: none;
                    border-radius: 0.5rem;
                    display: flex;
                    align-items: center;
                    padding: 0 0.75rem;
                    cursor: pointer;
                    transition: all 0.15s ease;
                    text-decoration: none;
                    color: #94a3b8;
                    font-size: 0.875rem;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    font-weight: 500;
                    position: relative;
                    overflow: hidden;
                }

                .nav-item:hover {
                    background: #1e293b;
                    color: #e2e8f0;
                }

                .nav-item.active {
                    background: linear-gradient(90deg, rgba(59, 130, 246, 0.15) 0%, transparent 100%);
                    color: #3b82f6;
                }

                .nav-item.active::before {
                    content: '';
                    position: absolute;
                    left: 0;
                    top: 8px;
                    bottom: 8px;
                    width: 3px;
                    background: #3b82f6;
                    border-radius: 0 2px 2px 0;
                }

                .nav-item-icon {
                    width: 20px;
                    height: 20px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 1rem;
                    flex-shrink: 0;
                    margin-right: 0.75rem;
                }

                :host(.collapsed) .nav-item-icon {
                    margin-right: 0;
                }

                .nav-item-text {
                    white-space: nowrap;
                    transition: opacity 0.2s ease;
                }

                :host(.collapsed) .nav-item-text {
                    opacity: 0;
                    width: 0;
                }

                /* Tooltip for collapsed state */
                .nav-item[data-tooltip] {
                    position: relative;
                }

                :host(.collapsed) .nav-item::after {
                    content: attr(data-tooltip);
                    position: absolute;
                    left: calc(100% + 12px);
                    top: 50%;
                    transform: translateY(-50%);
                    background: #1e293b;
                    color: #e2e8f0;
                    padding: 0.5rem 0.75rem;
                    border-radius: 6px;
                    font-size: 0.8rem;
                    white-space: nowrap;
                    opacity: 0;
                    visibility: hidden;
                    transition: all 0.15s ease;
                    z-index: 1001;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
                }

                :host(.collapsed) .nav-item:hover::after {
                    opacity: 1;
                    visibility: visible;
                }

                /* Collapse Toggle at Bottom */
                .sidebar-footer {
                    padding: 0.75rem;
                    border-top: 1px solid #1e293b;
                }

                .collapse-btn {
                    width: 100%;
                    height: 40px;
                    background: transparent;
                    border: 1px solid #1e293b;
                    border-radius: 0.5rem;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 0.5rem;
                    cursor: pointer;
                    color: #64748b;
                    font-size: 0.8rem;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    transition: all 0.15s ease;
                }

                .collapse-btn:hover {
                    background: #1e293b;
                    color: #e2e8f0;
                }

                .collapse-icon {
                    font-size: 1rem;
                    transition: transform 0.25s ease;
                }

                :host(.collapsed) .collapse-icon {
                    transform: rotate(180deg);
                }

                .collapse-text {
                    white-space: nowrap;
                    transition: opacity 0.2s ease;
                }

                :host(.collapsed) .collapse-text {
                    opacity: 0;
                    width: 0;
                    overflow: hidden;
                }

                /* Responsive Design */
                @media (max-width: 768px) {
                    :host {
                        width: 68px;
                    }
                    
                    :host(.expanded-mobile) {
                        width: 240px;
                    }

                    .logo-text,
                    .header-icons,
                    .nav-label,
                    .nav-item-text,
                    .collapse-text {
                        opacity: 0;
                        width: 0;
                    }

                    :host(.expanded-mobile) .logo-text,
                    :host(.expanded-mobile) .header-icons,
                    :host(.expanded-mobile) .nav-label,
                    :host(.expanded-mobile) .nav-item-text,
                    :host(.expanded-mobile) .collapse-text {
                        opacity: 1;
                        width: auto;
                    }
                }
            </style>

            <div class="sidebar-header">
                <div class="logo-section">
                    <div class="logo-icon">💰</div>
                    <span class="logo-text">FinSite</span>
                </div>
                <div class="header-icons">
                    <button class="icon-btn has-notification" title="Notifications" id="notifications-btn">🔔</button>
                    <button class="icon-btn" title="Settings" id="settings-btn">⚙️</button>
                </div>
            </div>

            <nav class="nav-section">
                <div class="nav-label">Menu</div>
                <a class="nav-item active" data-page="dashboard" data-tooltip="Dashboard">
                    <span class="nav-item-icon">📊</span>
                    <span class="nav-item-text">Dashboard</span>
                </a>
                <a class="nav-item" data-page="transactions" data-tooltip="Transactions">
                    <span class="nav-item-icon">💳</span>
                    <span class="nav-item-text">Transactions</span>
                </a>
                <a class="nav-item" data-page="categories" data-tooltip="Categories">
                    <span class="nav-item-icon">🏷️</span>
                    <span class="nav-item-text">Categories</span>
                </a>
            </nav>

            <div class="sidebar-footer">
                <button class="collapse-btn" id="collapse-btn">
                    <span class="collapse-icon">◀</span>
                    <span class="collapse-text">Collapse</span>
                </button>
            </div>
        `;
    }

    setupEventListeners() {
        const navItems = this.shadowRoot.querySelectorAll('.nav-item');

        navItems.forEach((item) => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const page = item.getAttribute('data-page');
                this.navigate(page, item);
            });
        });

        // Collapse toggle
        const collapseBtn = this.shadowRoot.querySelector('#collapse-btn');
        if (collapseBtn) {
            collapseBtn.addEventListener('click', () => {
                this.toggleCollapse();
            });
        }

        // Settings and Notifications buttons
        const settingsBtn = this.shadowRoot.querySelector('#settings-btn');
        const notificationsBtn = this.shadowRoot.querySelector('#notifications-btn');

        if (settingsBtn) {
            settingsBtn.addEventListener('click', () => {
                this.dispatchEvent(new CustomEvent('open-settings', {
                    bubbles: true,
                    composed: true,
                }));
            });
        }

        if (notificationsBtn) {
            notificationsBtn.addEventListener('click', () => {
                this.dispatchEvent(new CustomEvent('open-notifications', {
                    bubbles: true,
                    composed: true,
                }));
            });
        }
    }

    toggleCollapse() {
        this.isCollapsed = !this.isCollapsed;

        if (this.isCollapsed) {
            this.classList.add('collapsed');
        } else {
            this.classList.remove('collapsed');
        }

        // Dispatch event so the main content area can adjust
        this.dispatchEvent(new CustomEvent('sidebar-toggle', {
            detail: { collapsed: this.isCollapsed },
            bubbles: true,
            composed: true,
        }));

        log(`🔄 Sidebar ${this.isCollapsed ? 'collapsed' : 'expanded'}`);
    }

    navigate(page, clickedItem) {
    // Update active state
        const allItems = this.shadowRoot.querySelectorAll('.nav-item');
        allItems.forEach((item) => item.classList.remove('active'));
        clickedItem.classList.add('active');

        // Update current page
        this.currentPage = page;

        // Dispatch custom event for navigation
        this.dispatchEvent(new CustomEvent('navigate', {
            detail: { page },
            bubbles: true,
            composed: true,
        }));

        log(`🧭 Sidebar navigated to: ${page}`);
    }

    /**
     * Set the active page programmatically
     * @param {string} page - Page to set as active
     */
    setActivePage(page) {
        const targetItem = this.shadowRoot.querySelector(`[data-page="${page}"]`);
        if (targetItem) {
            const allItems = this.shadowRoot.querySelectorAll('.nav-item');
            allItems.forEach((item) => item.classList.remove('active'));
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

    /**
     * Get collapsed state
     * @returns {boolean} Whether sidebar is collapsed
     */
    getIsCollapsed() {
        return this.isCollapsed;
    }
}

// Define the custom element
customElements.define('finsite-sidebar', SidebarComponent);

export { SidebarComponent };
