import { FinanceModel } from '../models/financeModel.js';

export class FinanceController {
    constructor() {
        this.model = new FinanceModel();
    }

    async init() {
        try {
            const transactions = await this.model.init();
        } catch (error) {
            console.error("Error initializing FinanceController:", error);
        }
    }
}