// /src/model/FinanceModel.js
import {
  getAllTransactions,
  addTransaction,
  deleteTransactions,
  clearAllTransactions,
} from './storageService.js';

export class FinanceModel {
  constructor() {
    this.transactions = [];
  }

  /**
   * Load all transactions from IndexedDB into memory.
   * Call this once at startup (controller.init()).
   */
  async init() {
    try {
      const storedTransactions = await getAllTransactions();

      this.transactions = Array.isArray(storedTransactions)
        ? storedTransactions
        : [];

      // Optional: keep newest first if there is an auto-incrementing id
      this.transactions.sort((a, b) => {
        if (a.id == null || b.id == null) return 0;
        return b.id - a.id;
      });

      return this.getAll();
    } catch (error) {
      console.error('Error initializing FinanceModel:', error);
      this.transactions = [];
      return this.getAll();
    }
  }

  /**
   * Add a new transaction to IndexedDB and to the in-memory list.
   * Expected shape: { group, category, amount, date }
   */
  async addEntry({ group = 'manual', category, amount, date }) {
    try {
      const newTransaction = {
        group,
        category,
        amount: Number(amount),
        date,
      };

      const savedTransaction = await addTransaction(newTransaction);

      // Keep newest on top (matches v1 behaviour using unshift)
      this.transactions.unshift(savedTransaction);

      return savedTransaction;
    } catch (error) {
      console.error('Error adding transaction:', error);
      throw error;
    }
  }

  async deleteEntry(ids) {
    if (!ids || !ids.length) return this.getAll();

    try {
      // First delete from IndexedDB
      await deleteTransactions(ids);

      // Normalize ids to numbers, since DB ids are numeric
      const idSet = new Set(ids.map((rawId) => Number(rawId)));

      // Then update in-memory cache
      this.transactions = this.transactions.filter(
        (tx) => !idSet.has(Number(tx.id))
      );

      return this.getAll();
    } catch (error) {
      console.error('Error removing transactions:', error);
      throw error;
    }
  }

  /**
   * Clear ALL transactions from IndexedDB and memory.
   */
  async clearAll() {
    try {
      await clearAllTransactions();
      this.transactions = [];
      return this.getAll();
    } catch (error) {
      console.error('Error clearing all transactions:', error);
      throw error;
    }
  }

  /**
   * Read-only snapshot of all transactions.
   * Used by the controller to render the table.
   */
  getAll() {
    return [...this.transactions];
  }
}
