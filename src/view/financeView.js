// /src/view/FinanceView.js
export class FinanceView {
    constructor(root) {
      this.root = root;
      this.onSubmit = null;
      this.onClearFields = null;
      this.onDeleteSelected = null; // NEW
      this._render();
    }
  
    _render() {
      this.root.innerHTML = `
        <div id="banner" class="banner" aria-live="polite"><div class="inner"></div></div>
        <div class="wrap">
          <div class="card">
            <h1>Manual Transaction Entry</h1>
            <p class="muted">Enter cash transactions without receipts.</p>
            <form id="txForm" novalidate>
              <div class="row">
                <div>
                  <label for="amount">Amount (USD)</label>
                  <input id="amount" name="amount" type="number" step="0.01" min="0.01" placeholder="e.g., 12.34" required />
                </div>
                <div>
                  <label for="date">Date</label>
                  <input id="date" name="date" type="date" required />
                </div>
              </div>
              <label for="category">Category</label>
              <select id="category" name="category" required>
                <option value="" disabled selected>Select a category</option>
                <option>bills</option>
                <option>utilities</option>
                <option>groceries</option>
                <option>dining</option>
                <option>transport</option>
                <option>loans</option>
                <option>healthcare</option>
                <option>entertainment</option>
                <option>education</option>
                <option>luxuries</option>
                <option>other</option>
              </select>
              <div class="actions">
                <button type="button" id="clearBtn">Clear</button>
                <button type="button" id="deleteSelectedBtn" title="Delete selected rows">Delete Selected</button>
                <button type="submit" id="addBtn">Add to Financials</button>
              </div>
            </form>
          </div>
  
          <div class="card" id="recentCard">
            <h2 style="margin:0 0 8px;font-size:18px;">Recent Entries</h2>
            <table class="table" id="txTable" aria-label="Recent transactions">
              <thead>
                <tr>
                  <th style="width:38px;"><input id="selectAll" type="checkbox" title="Select all" /></th>
                  <th>Amount</th><th>Date</th><th>Category</th>
                </tr>
              </thead>
              <tbody></tbody>
            </table>
          </div>
        </div>
      `;
      this.banner = this.root.querySelector('#banner');
      this.bannerInner = this.root.querySelector('#banner .inner');
      this.form = this.root.querySelector('#txForm');
      this.amountEl = this.root.querySelector('#amount');
      this.dateEl = this.root.querySelector('#date');
      this.categoryEl = this.root.querySelector('#category');
      this.tbody = this.root.querySelector('#txTable tbody');
      this.selectAllEl = this.root.querySelector('#selectAll');
  
      this.dateEl.value = new Date().toISOString().slice(0,10);
  
      this.root.querySelector('#clearBtn').addEventListener('click', () => {
        this.form.reset();
        this.dateEl.value = new Date().toISOString().slice(0,10);
        this.showBanner('Fields cleared.', true, 1400);
      });
  
      this.form.addEventListener('submit', (e) => {
        e.preventDefault();
        const payload = {
          amount: parseFloat(this.amountEl.value),
          category: this.categoryEl.value,
          date: this.dateEl.value
        };
        this.onSubmit && this.onSubmit(payload);
      });
  
      this.root.querySelector('#deleteSelectedBtn').addEventListener('click', () => {
        const ids = this.getSelectedIds();
        this.onDeleteSelected && this.onDeleteSelected(ids);
        this.selectAllEl.checked = false;
      });
  
      this.selectAllEl.addEventListener('change', () => {
        this.tbody.querySelectorAll('input[type="checkbox"]').forEach(cb => { cb.checked = this.selectAllEl.checked; });
      });
    }
  
    showBanner(text, ok = true, ms = 2200) {
      this.banner.className = 'banner ' + (ok ? 'ok' : 'err') + ' show';
      this.bannerInner.textContent = text;
      clearTimeout(this._timer);
      this._timer = setTimeout(() => this.banner.classList.remove('show'), ms);
    }
  
    resetForm() {
      this.form.reset();
      this.dateEl.value = new Date().toISOString().slice(0,10);
    }
  
    renderTable(rows) {
      const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
      this.tbody.innerHTML = rows.map(r =>
        `<tr data-id="${esc(r.id)}">
          <td><input type="checkbox" data-id="${esc(r.id)}" /></td>
          <td class="right">$${Number(r.amount).toFixed(2)}</td>
          <td>${esc(r.date)}</td>
          <td>${esc(r.category)}</td>
        </tr>`
      ).join('');
    }
  
    getSelectedIds() {
      return Array.from(this.tbody.querySelectorAll('input[type="checkbox"]:checked')).map(cb => cb.getAttribute('data-id'));
    }
  }
  