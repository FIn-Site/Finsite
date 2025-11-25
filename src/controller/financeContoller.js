/**
 * FinSiteController - Coordinates between Model and View
 * Handles user interactions and application logic
 */
export class FinSiteController {
    constructor(model, view) {
        this.model = model;
        this.view = view;
        
        console.log('FinSiteController initialized');
    }

    /**
     * Initialize the controller
     * Sets up event listeners and initial data
     */
    init() {
        // Initialize the model with default data
        this.model.init();
        
        // Get initial data from model
        const data = this.model.getData();
        
        // Set initial view to dashboard
        this.model.updateData({ currentView: 'dashboard' });
        
        console.log('Controller initialization complete');
    }
    
    /**
     * Handle navigation between different views
     * @param {string} viewName - Name of the view to navigate to
     */
    navigate(viewName) {
        console.log(`🧭 Navigating to: ${viewName}`);
        
        // Update model state
        this.model.updateData({ currentView: viewName });
        
        // Could trigger view updates here if needed
        const currentData = this.model.getData();
        console.log('Current app state:', currentData);
    }

    /**
     * Handle user interactions
     * @param {string} action - Action type
     * @param {Object} payload - Action data
     */
    handleAction(action, payload) {
        switch (action) {
            case 'navigate':
                this.navigate(payload.route);
                break;
            default:
                console.log('Unknown action:', action);
        }
    }

    /**
     * Navigate to different views
     * @param {string} route - Route to navigate to
     */
    navigate(route) {
        this.model.updateData({ currentView: route });
        const data = this.model.getData();
        this.view.update(data);
    }
}