/**
 * @fileoverview Header Web Component for FinSite.
 * Top navigation bar with menu toggle, notifications, and user greeting.
 * @module components/header
 */

/**
 * Header Web Component.
 * 
 * Features:
 * - Menu toggle button
 * - Notification icon
 * - User greeting
 * 
 * Note: Currently not actively used in Mint-style layout.
 * 
 * @extends HTMLElement
 */
class FinSiteHeader extends HTMLElement {
    /**
     * Initialize header component.
     * Sets up Shadow DOM.
     */
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
                    background: var(--header-bg, #1a1a1a);
                    z-index: 1001;
                    border-bottom: 1px solid var(--border-color, #333);
                    transition: background 0.3s ease, border-color 0.3s ease;
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

                /* Theme Toggle Switch */
                .theme-toggle {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }

                .theme-toggle-label {
                    font-size: 18px;
                    cursor: pointer;
                    transition: opacity 0.2s ease;
                }

                .theme-toggle-label.inactive {
                    opacity: 0.4;
                }

                .toggle-switch {
                    position: relative;
                    width: 50px;
                    height: 26px;
                    background: #374151;
                    border-radius: 13px;
                    cursor: pointer;
                    transition: background 0.3s ease;
                    border: none;
                    padding: 0;
                }

                .toggle-switch::after {
                    content: '';
                    position: absolute;
                    top: 3px;
                    left: 3px;
                    width: 20px;
                    height: 20px;
                    background: #f59e0b;
                    border-radius: 50%;
                    transition: transform 0.3s ease, background 0.3s ease;
                    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
                }

                .toggle-switch.dark::after {
                    transform: translateX(24px);
                    background: #6366f1;
                }

                .toggle-switch:hover {
                    background: #4b5563;
                }

                .greeting {
                    font-size: 18px;
                    font-weight: 600;
                    color: var(--text-primary, #ffffff);
                    margin-left: 10px;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    transition: color 0.3s ease;
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
                    <div class="theme-toggle">
                        <span class="theme-toggle-label" id="light-icon">☀️</span>
                        <button class="toggle-switch dark" id="theme-toggle" aria-label="Toggle dark/light mode"></button>
                        <span class="theme-toggle-label inactive" id="dark-icon">🌙</span>
                    </div>
                    <span class="greeting">Good evening, Jenner</span>
                </div>
            </div>
        `;
    }

    setupEventListeners() {
        const menuToggle = this.shadowRoot.querySelector('#menu-toggle');
        const themeToggle = this.shadowRoot.querySelector('#theme-toggle');
        const lightIcon = this.shadowRoot.querySelector('#light-icon');
        const darkIcon = this.shadowRoot.querySelector('#dark-icon');

        if (menuToggle) {
            menuToggle.addEventListener('click', () => {
                // Dispatch custom event for sidebar toggle
                this.dispatchEvent(new CustomEvent('toggle-sidebar', {
                    bubbles: true,
                    composed: true,
                }));
            });
        }

        if (themeToggle) {
            // Check for saved theme preference or default to dark
            const savedTheme = localStorage.getItem('finsite-theme') || 'dark';
            this.setTheme(savedTheme, themeToggle, lightIcon, darkIcon);

            themeToggle.addEventListener('click', () => {
                const isDark = themeToggle.classList.contains('dark');
                const newTheme = isDark ? 'light' : 'dark';
                this.setTheme(newTheme, themeToggle, lightIcon, darkIcon);
                localStorage.setItem('finsite-theme', newTheme);

                // Dispatch custom event for theme change
                this.dispatchEvent(new CustomEvent('theme-change', {
                    bubbles: true,
                    composed: true,
                    detail: { theme: newTheme },
                }));
            });
        }
    }

    /**
     * Set the theme and update toggle UI
     */
    setTheme(theme, toggleBtn, lightIcon, darkIcon) {
        if (theme === 'dark') {
            toggleBtn.classList.add('dark');
            lightIcon.classList.add('inactive');
            darkIcon.classList.remove('inactive');
            document.documentElement.setAttribute('data-theme', 'dark');
        } else {
            toggleBtn.classList.remove('dark');
            lightIcon.classList.remove('inactive');
            darkIcon.classList.add('inactive');
            document.documentElement.setAttribute('data-theme', 'light');
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
