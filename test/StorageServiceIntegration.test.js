import { describe, it, beforeEach, expect } from 'vitest';
// This polyfills global indexedDB in Node so storageService can use it
import 'fake-indexeddb/auto';

import {
  getAllTransactions,
  addTransaction,
  deleteTransactions,
  clearAllTransactions,
  getAllGroups,
  addGroup,
  getAllCategories,
  addCategory
} from '../src/storage/storageService.js';

describe('Integration: storageService with IndexedDB (via fake-indexeddb)', () => {

  // Always start tests with a clean transaction store
  beforeEach(async () => {
    await clearAllTransactions();
  });

  // ----------------------------
  // TRANSACTIONS
  // ----------------------------

  it('saves and retrieves a transaction', async () => {
    const tx = {
      amount: 40,
      group: 'expenses',
      category: 'groceries',
      date: new Date().toISOString()
    };

    const saved = await addTransaction(tx);
    expect(saved).toHaveProperty('id');

    const all = await getAllTransactions();
    expect(all.length).toBe(1);
    expect(all[0].amount).toBe(40);
    expect(all[0].group).toBe('expenses');
    expect(all[0].category).toBe('groceries');
  });

  it('deletes a transaction by id', async () => {
    const tx = await addTransaction({
      amount: 25,
      group: 'expenses',
      category: 'food',
      date: new Date().toISOString()
    });

    let all = await getAllTransactions();
    expect(all.length).toBe(1);

    await deleteTransactions([tx.id]);

    all = await getAllTransactions();
    expect(all.length).toBe(0);
  });

  it('clears all transactions', async () => {
    await addTransaction({
      amount: 10,
      group: 'expenses',
      category: 'coffee',
      date: new Date().toISOString()
    });

    await addTransaction({
      amount: 20,
      group: 'expenses',
      category: 'food',
      date: new Date().toISOString()
    });

    let all = await getAllTransactions();
    expect(all.length).toBe(2);

    await clearAllTransactions();

    all = await getAllTransactions();
    expect(all.length).toBe(0);
  });

  // ----------------------------
  // GROUPS
  // ----------------------------

  it('adds and retrieves a group', async () => {
    const group = {
      id: 'household-int',
      name: 'Household INT',
      color: '#ff0000',
      icon: '🏠'
    };

    await addGroup(group);

    const groups = await getAllGroups();
    const found = groups.find(g => g.id === 'household-int');

    expect(found).toBeDefined();
    expect(found.name).toBe('Household INT');
  });

  // ----------------------------
  // CATEGORIES
  // ----------------------------

  it('adds and retrieves a category', async () => {
    const category = {
      id: 'groceries-int',
      groupId: 'household-int',
      name: 'Groceries INT',
      color: '#00ff00',
      icon: '🛒'
    };

    await addCategory(category);

    const categories = await getAllCategories();
    const found = categories.find(c => c.id === 'groceries-int');

    expect(found).toBeDefined();
    expect(found.groupId).toBe('household-int');
  });
});
