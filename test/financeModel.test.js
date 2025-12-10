import { describe, it, expect, beforeEach, vi } from 'vitest';
import { FinSiteModel } from '../src/model/financeModel.js';

//  MOCK STORAGE LAYER
vi.mock('../src/storage/storageService.js', () => {
  let db = [];

  return {
    getAllTransactions: vi.fn(async () => db),
    addTransaction: vi.fn(async (tx) => {
      const saved = { ...tx, id: Date.now() };
      db.push(saved);
      return saved;
    }),
    deleteTransactions: vi.fn(async (ids) => {
      db = db.filter(tx => !ids.includes(tx.id));
    }),
    clearAllTransactions: vi.fn(async () => {
      db = [];
    }),
    getAllGroups: vi.fn(async () => []),
    getAllCategories: vi.fn(async () => []),
    addGroup: vi.fn(async () => {}),
    addCategory: vi.fn(async () => {})
  };
});

describe('FinSiteModel — Core Logic', () => {
  let model;

  beforeEach(() => {
    model = new FinSiteModel();
  });

  // ---------------------------
  //  BUCKET KEY LOGIC
  // ---------------------------

  it('creates correct bucket key from date', () => {
    const key = model._getBucketKey(new Date('2025-12-15'));
    expect(key).toBe('2025-12');
  });

  it('returns null for invalid date', () => {
    const key = model._getBucketKey('invalid');
    expect(key).toBe(null);
  });

  // ---------------------------
  // APPLY TRANSACTION DELTA
  // ---------------------------

  it('applies transaction change correctly to month and group', () => {
    const tx = { amount: 50, date: new Date(), group: 'expenses' };

    model._applyTransactionDelta(tx, 1);

    const key = model._getBucketKey(new Date());
    expect(model._timeBuckets.get(key)).toBe(50);
    expect(model._groupTotals.get('expenses')).toBe(50);
  });

  it('removes transaction delta correctly', () => {
    const tx = { amount: 50, date: new Date(), group: 'expenses' };

    model._applyTransactionDelta(tx, 1);
    model._applyTransactionDelta(tx, -1);

    const key = model._getBucketKey(new Date());
    expect(model._timeBuckets.get(key)).toBe(0);
    expect(model._groupTotals.get('expenses')).toBe(0);
  });

  // ---------------------------
  //  TOTAL SPENT CALCULATION
  // ---------------------------

  it('calculates total spent correctly', () => {
    const txs = [
      { amount: 20 },
      { amount: -10 },
      { amount: 30 }
    ];

    const total = model._calculateTotalSpent(txs);
    expect(total).toBe(60);
  });

  it('returns zero for empty transaction list', () => {
    expect(model._calculateTotalSpent([])).toBe(0);
  });

  // ---------------------------
  //  CATEGORY ICONS
  // ---------------------------

  it('returns correct icon for groceries', () => {
    expect(model._getCategoryIcon('groceries')).toBe('🛒');
  });

  it('returns default icon for unknown category', () => {
    expect(model._getCategoryIcon('random')).toBe('💸');
  });

  // ---------------------------
  //  RELATIVE DATE
  // ---------------------------

  it('returns Today for today date', () => {
    const result = model._getRelativeDate(new Date());
    expect(result).toBe('Today');
  });

  // ---------------------------
  //  ADD TRANSACTION (MOCKED DB)
  // ---------------------------

  it('adds a transaction and updates aggregates', async () => {
    const tx = {
      amount: 40,
      group: 'expenses',
      category: 'groceries',
      date: new Date()
    };

    const saved = await model.addTransaction(tx);

    expect(saved).toHaveProperty('id');
    expect(model.data.transactions.length).toBe(1);
  });

  // ---------------------------
  //  DELETE TRANSACTION
  // ---------------------------

  it('deletes a transaction by id', async () => {
    const tx = await model.addTransaction({
      amount: 25,
      date: new Date(),
      group: 'expenses'
    });

    await model.deleteTransactions([tx.id]);

    expect(model.data.transactions.length).toBe(0);
  });

  // ---------------------------
  //  CLEAR ALL TRANSACTIONS
  // ---------------------------

  it('clears all transactions and resets aggregates', async () => {
    await model.addTransaction({
      amount: 10,
      date: new Date(),
      group: 'expenses'
    });

    await model.clearAllTransactions();

    expect(model.data.transactions.length).toBe(0);
    expect(model._timeBuckets.size).toBe(0);
  });
});
