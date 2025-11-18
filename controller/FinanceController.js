// /src/controller/FinanceController.js
export class FinanceController {
    constructor(model, view) {
      this.model = model;
      this.view = view;
  
      this.view.onSubmit = (tx) => this.handleSubmit(tx);
      this.view.onDeleteSelected = (ids) => this.handleDeleteSelected(ids); // NEW
  
      this.view.renderTable(this.model.list());
    }
  
    handleSubmit(tx) {
      if (!Number.isFinite(tx.amount) || tx.amount <= 0) { this.view.showBanner('Enter a valid amount > 0', false); return; }
      if (!tx.category) { this.view.showBanner('Select a category', false); return; }
      if (!tx.date) { this.view.showBanner('Pick a date', false); return; }
  
      const saved = this.model.addTransaction(tx);
      // CHANGE: forward `saved` to charts/graph updater when available.
  
      this.view.showBanner(`Added: ${saved.category} • $${saved.amount.toFixed(2)} on ${saved.date}`, true);
      this.view.resetForm();
      this.view.renderTable(this.model.list());
    }
  
    handleDeleteSelected(ids) {
      if (!ids?.length) { this.view.showBanner('No rows selected.', false, 1400); return; }
      this.model.removeMany(ids);
      this.view.renderTable(this.model.list());
      this.view.showBanner('Selected entries deleted.', true, 1400);
    }
  }
  