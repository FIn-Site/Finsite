cd/**
 * FinSiteModel - Manages application data and business logic
 * Handles data operations, API calls, and state management
 */
export class FinSiteModel {
    constructor() {
        this.data = {
            user: null,
            accounts: [],
            transactions: [],
            currentView: 'dashboard'
        };
        
        console.log('FinSiteModel initialized');
    }

    /**
     * Get current application data
     * @returns {Object} Current data state
     */
    getData() {
        return this.data;
    }

    /**
     * Update application data
     * @param {Object} newData - New data to merge
     */
    updateData(newData) {
        this.data = { ...this.data, ...newData };
        console.log('Model data updated:', this.data);
    }

    /**
     * Initialize default data
     */
    init() {
        this.data.user = {
            name: 'Jenner',
            greeting: 'Good evening'
        };
        
        console.log('Model initialized with default data');
    }
}