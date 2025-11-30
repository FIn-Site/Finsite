/**
 * FinSiteController - Coordinates between Model and View
 * Handles user interactions and application logic
 */
export class FinSiteController {
    constructor(model, view) {
        this.model = model;
        this.view = view;
        
        if(typeof this.view.bindHandlers === 'function') {
            this.view.bindHandlers({
                onNavigate: (route) => this.navigate(route),
                onAddTransaction: (transactionData) => this.handleAddTransaction(transactionData)
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

    /**
     * Handle adding a new transaction from the manual entry form
     * @param {Object} transactionData - Transaction data from the form
     */
    async handleAddTransaction(transactionData) {
        console.log('💰 Handling add transaction:', transactionData);

        try {
            // Use the model to persist the transaction to IndexedDB
            const savedTransaction = await this.model.addTransaction(transactionData);

            console.log('✅ Transaction saved successfully:', savedTransaction);

            // Get the transactions component and notify it of success
            const transactionsPage = document.querySelector('finsite-transactions');
            if (transactionsPage && typeof transactionsPage.onTransactionAdded === 'function') {
                transactionsPage.onTransactionAdded(savedTransaction);
            }

            // Update the view with the new data
            const data = this.model.getData();
            this.view.update(data);

        } catch (error) {
            console.error('❌ Error adding transaction:', error);

            // Notify the transactions component of the error
            const transactionsPage = document.querySelector('finsite-transactions');
            if (transactionsPage && typeof transactionsPage.onTransactionError === 'function') {
                transactionsPage.onTransactionError('Failed to save transaction. Please try again.');
            }
        }
    }
}