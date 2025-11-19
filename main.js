/**
 * Main application entry point
 * Initializes and coordinates all MVC components
 */
import { FinanceModel } from "./model/FinanceModel.js"
import { FinanceView } from "./view/FinanceView.js"
import { FinanceController } from "./controller/FinanceController.js"
import { LocalStorageGateway } from "./storage/LocalStorageGateway.js"

/**
 * Initialize the chat application
 * Sets up MVC components and establishes their connections
 */
function initializeApp() {
    console.log('🚀 Initialize FinSite...');
    
    try {
        // Create storage gateway
        const storage = new LocalStorageGateway();
        
        // Instantiate MVC components
        const model = new FinanceModel(storage);
        const view = new FinanceView(document.querySelector('#app'));

        // Link Everything through the Controller
        const controller = new FinanceController(model, view);
        
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