/**
 * FinSiteController - Coordinates between Model and View
 * Handles user interactions and application logic
 */
export class FinSiteController {
    constructor(model, view) {
        this.model = model;
        this.view = view;
        
        if(typeof this.view.blindHandlers === 'function') {
            this.view.bindHandlers({
                onNavigate: (route) => this.navigate(route)
            });
        }

        console.log('FinSiteController initialized with model and view');
    }

    /**
     * Initialize the controller
     * Sets up event listeners and initial data
     */
    async init() {
        console.log('Controller initialization started');

        try {
            // 1) Load from storage via the model (async)
            const initialData = await this.model.init();

            // 2) Make sure we have a starting route in the model
            if (!initialData.currentView) {
                this.model.updateData({ currentView: 'dashboard' });
            }

            // 3) Get a fresh snapshot of state
            const data = this.model.getData();

            // 4) Tell the view to render based on model state
            this.view.update(data);

            console.log('Controller initialization complete');
        } catch (error) {
            console.error('Error during controller initialization:', error);
          
        }

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
        console.log(`🧭 Navigating to: ${route}`);
        this.model.updateData({ currentView: route });
        const data = this.model.getData();
        this.view.update(data);
    }
}