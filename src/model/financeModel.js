import { getAllTransactions, addTransaction } from "../storage/storageService.js";

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

    async addEntry({group, category, amount, date}) {
        try {
            const newTransaction = { group, category, amount: Number(amount), date };
            const savedTransaction = await addTransaction(newTransaction);
            this.transactions.push(savedTransaction);
            return savedTransaction;
        } catch (error) {
            console.error("Error adding transaction:", error);
            throw error;
        }
    }

    getAll() {
        return [...this.transactions];
    }
}