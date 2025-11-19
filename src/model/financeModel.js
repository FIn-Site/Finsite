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


    /**
     * 
     * addTransaction(tx) {
      const saved = { ...tx, id: (crypto?.randomUUID?.() || String(Date.now() + Math.random())) };
      this.state.transactions.unshift(saved);
      this.storage.save(this.state.transactions);
      return saved;
    }
    clearAll() {
      this.state.transactions = [];
      this.storage.save(this.state.transactions);
    }
    removeMany(ids) {
      const set = new Set(ids);
      this.state.transactions = this.state.transactions.filter(t => !set.has(t.id));
      this.storage.save(this.state.transactions);
    }
    list() { return [...this.state.transactions]; }
     * 
     */
}