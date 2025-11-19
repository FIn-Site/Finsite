// /src/model/FinanceModel.js
export class FinanceModel {
    constructor(storage) {
      this.storage = storage;
      this.state = { transactions: this.storage.load() };
    }
    addTransaction(tx) {
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
  }
  