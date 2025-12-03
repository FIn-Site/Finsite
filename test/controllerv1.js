// /src/controller/FinanceController.js

export class FinanceController {
  /**
   * @param {FinanceModel} model - IndexedDB-backed model with init(), addEntry(), getAll()
   * @param {FinanceView} view  - v1 view that exposes onSubmit, renderTable, showBanner, resetForm
   */
  constructor(model, view) {
    this.model = model;
    this.view = view;

    // Wire the view's submit callback to our handler
    this.view.onSubmit = (tx) => this.handleSubmit(tx);
    this.view.onDeleteSelected = (ids) => this.handleDeleteSelected(ids);
    this.view.onClearFields = () => this.handleClearAll();

  }

  /**
   * Called once from main.js after constructing controller.
   * Loads existing transactions from IndexedDB and renders the table.
   */
  async init() {
    try {
      await this.model.init();                 // calls getAllTransactions() under the hood
      const rows = this.model.getAll();        // use existing IndexedDB API
      this.view.renderTable(rows);
    } catch (error) {
      console.error("Error initializing FinanceController:", error);
      this.view.renderTable([]);               // safe fallback
      this.view.showBanner("Failed to load existing transactions.", false);
    }
  }

  /**
   * Handles form submission from the view.
   * Validates input, saves to IndexedDB via model.addEntry(), then re-renders.
   * @param {{amount:number, category:string, date:string}} tx
   */
  async handleSubmit(tx) {
    const amount = Number(tx.amount);

    // v1-style validation
    if (!Number.isFinite(amount) || amount <= 0) {
      this.view.showBanner("Enter a valid amount > 0", false);
      return;
    }
    if (!tx.category) {
      this.view.showBanner("Select a category", false);
      return;
    }
    if (!tx.date) {
      this.view.showBanner("Pick a date", false);
      return;
    }

    // Map v1 payload to the IndexedDB model's expected shape
    const payload = {
      group: "manual",          // v1 view has no group; we default to 'manual' for manual entry
      category: tx.category,
      amount: amount,
      date: tx.date,
    };

    try {
      // IndexedDB-backed model; returns the saved transaction (with generated id)
      const saved = await this.model.addEntry(payload);

      this.view.showBanner(
        `Added: ${saved.category} • $${Number(saved.amount).toFixed(2)} on ${saved.date}`,
        true
      );

      this.view.resetForm();

      // Re-render from the model's current state
      const rows = this.model.getAll();
      this.view.renderTable(rows);
    } catch (error) {
      console.error("Error adding transaction:", error);
      this.view.showBanner("Failed to save transaction.", false);
    }
  }

  
  /**
   * Handles delete of selected rows from the view.
   * Uses model.removeMany(ids) which updates IndexedDB and in-memory state.
   * @param {string[]} ids - array of ids from data-id attributes (strings)
   */
  async handleDeleteSelected(ids) {
    if (!ids || !ids.length) {
      this.view.showBanner("No rows selected.", false, 1400);
      return;
    }

    try {
      await this.model.deleteEntry(ids);        // updates DB + in-memory cache
      const rows = this.model.getAll();
      this.view.renderTable(rows);

      this.view.showBanner("Selected entries deleted.", true, 1400);
    } catch (error) {
      console.error("Error deleting transactions:", error);
      this.view.showBanner("Failed to delete selected entries.", false, 2000);
    }
  }

  async handleClearAll() {
    try {
      await this.model.clearAll();        // wipe IndexedDB + in-memory cache
      const rows = this.model.getAll();   // should now be []
      this.view.renderTable(rows);

      this.view.resetForm();
      this.view.showBanner("All transactions cleared.", true, 1600);
    } catch (error) {
      console.error("Error clearing all transactions:", error);
      this.view.showBanner("Failed to clear all transactions.", false, 2000);
    }
  }
}


