import { FinanceModel } from '../model/financeModel.js';

export class FinanceController {
    constructor() {
        this.model = new FinanceModel();
    }

    async init() {
        try {
            const transactions = await this.model.init();

            return transactions; // switch to display on view later
        } catch (error) {
            console.error("Error initializing FinanceController:", error);
            throw error;
        }
    }

    async addTransaction({ group, category, amount, date }) {
        try {
            const newTransaction = await this.model.addEntry({ group, category, amount, date });
            return newTransaction; //for view
        } catch (error) {
            console.error("Error in FinanceController while adding transaction:", error);
            throw error;
        }
    }

    getAllTransactions() {
        return this.model.getAll();
    }
}