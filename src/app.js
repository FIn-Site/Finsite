/**
 * Main application entry point
 * Initializes and coordinates all MVC components
 */
import { FinSiteModel } from "./model/financeModel.js"
import { FinSiteView } from "./view/financeView.js"
import { FinSiteController } from "./controller/financeContoller.js"

/**
 * Initialize the chat application
 * Sets up MVC components and establishes their connections
 */
function initializeApp() {
    console.log('🚀 Initialize FinSite...');
    
    try {
        // Instantiate MVC components
        const model = new FinSiteModel();
        const view = new FinSiteView();

        // Render the view in the #app container
        view.render('#app');

        // Link Everything through the Controller
        const controller = new FinSiteController(model, view);
        controller.init();
        
        console.log('✅ FinSight initialization complete!');
    } catch (error) {
        console.error('❌ Error during initialization:', error);
        document.querySelector('#app').innerHTML = '<h1 style="color: white; text-align: center; margin-top: 50px;">Error: ' + error.message + '</h1>';
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    initializeApp();
}