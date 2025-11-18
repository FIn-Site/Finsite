import { getAllTransactions } from "../storage/storageService";

export class FinanceModel {
    constructor() {
        this.transactions = [];
    }

    async init() {
        try {
            const storedTransactions = await getAllTransactions();
            this.transactions = Array.isArray(storedTransactions) ? storedTransactions : [];

            return this.transactions;
        } catch (error) {
            console.error("Error initializing FinanceModel:", error);
            this.transactions = [];
            return this.transactions;
        }
    }

    getAll() {
        return [...this.transactions];
    }
}