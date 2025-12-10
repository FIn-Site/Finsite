/**
 * Header Web Component for FinSite
 * Handles top navigation with menu toggle, notifications, and user greeting
 */
class FinSiteHeader extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
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
                    top: 0;
                    left: 0;
                    right: 0;
                    height: 60px;
                    background: #1a1a1a;
                    z-index: 1001;
                    border-bottom: 1px solid #333;
                }

                .top-nav {
                    height: 100%;
                    display: flex;
                    align-items: center;
                    padding: 0 20px;
                    justify-content: space-between;
                }

                .top-nav-left {
                    display: flex;
                    align-items: center;
                    gap: 15px;
                }

                .top-nav-right {
                    display: flex;
                    align-items: center;
                    gap: 15px;
                }

                .nav-icon {
                    width: 32px;
                    height: 32px;
                    background: #374151;
                    border: none;
                    border-radius: 6px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    color: #9ca3af;
                    font-size: 16px;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                }

                .nav-icon:hover {
                    background: #4b5563;
                    color: #ffffff;
                }

                .nav-icon.active {
                    background: #3b82f6;
                    color: #ffffff;
                }

                .greeting {
                    font-size: 18px;
                    font-weight: 600;
                    color: #ffffff;
                    margin-left: 10px;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                }

                /* Responsive Design */
                @media (max-width: 768px) {
                    .greeting {
                        display: none;
                    }
                    
                    .top-nav {
                        padding: 0 15px;
                    }
                }
            </style>

            <div class="top-nav">
                <div class="top-nav-left">
                    <button class="nav-icon" id="menu-toggle">☰</button>
                </div>
                <div class="top-nav-right">
                    <button class="nav-icon">🔔</button>
                    <button class="nav-icon">⚙️</button>
                    <span class="greeting">Good evening, Jenner</span>
                </div>
            </div>
        `;
    }

    setupEventListeners() {
        const menuToggle = this.shadowRoot.querySelector('#menu-toggle');

        if (menuToggle) {
            menuToggle.addEventListener('click', () => {
                // Dispatch custom event for sidebar toggle
                this.dispatchEvent(new CustomEvent('toggle-sidebar', {
                    bubbles: true,
                    composed: true,
                }));
            });
        }
    }

    /**
     * Update the greeting text
     * @param {string} greeting - New greeting text
     */
    updateGreeting(greeting) {
        const greetingElement = this.shadowRoot.querySelector('.greeting');
        if (greetingElement) {
            greetingElement.textContent = greeting;
        }
    }

    /**
     * Set menu toggle active state
     * @param {boolean} active - Whether menu is active
     */
    setMenuActive(active) {
        const menuToggle = this.shadowRoot.querySelector('#menu-toggle');
        if (menuToggle) {
            if (active) {
                menuToggle.classList.add('active');
            } else {
                menuToggle.classList.remove('active');
            }
        }
    }
}

// Define the custom element
customElements.define('finsite-header', FinSiteHeader);

export { FinSiteHeader };
