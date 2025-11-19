/**
 * FinSiteView - Handles all UI rendering and DOM manipulation
 * Responsible for presenting data and capturing user interactions
 */
export class FinSiteView {
    constructor() {
        this.container = null;
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
            // Try to find any container as fallback
            this.container = document.body;
            console.log('📍 Using body as fallback container');
        }

        console.log('📦 Container found:', this.container);
        console.log('📏 Container dimensions:', this.container.offsetWidth, 'x', this.container.offsetHeight);

        // Clear any existing content
        this.container.innerHTML = '';
        console.log('🧹 Container cleared');

        // Create the main application structure
        const content = `
            <div class="app-container">
                <h1 class="hello-message">Hello World</h1>
                <p class="subtitle">FinSite Financial Dashboard</p>
            </div>
        `;
        
        console.log('📝 Setting innerHTML with content');
        this.container.innerHTML = content;
        
        console.log('✅ FinSiteView rendered successfully');
    }

    /**
     * Update the view with new data
     * @param {Object} data - Data to display
     */
    update(data) {
        // Future implementation for updating the view
        console.log('View updated with data:', data);
    }
}