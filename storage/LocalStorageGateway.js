const KEY = 'finance_transactions';
export class LocalStorageGateway {
  load() {
    try { return JSON.parse(localStorage.getItem(KEY) || '[]'); }
    catch { return []; }
  }
  save(list) { localStorage.setItem(KEY, JSON.stringify(list)); }
}
