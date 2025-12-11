// src/model/seedDatabase.js
// Only injects seed transactions if DB is empty and debug mode is enabled


import seedTransactions from './seedTransactions.js';
import { FinSiteModel } from './financeModel.js';
import { isDebugEnabled } from '../utils/debugService.js';

/**
 * Injects seed data if DB is empty and debug mode is enabled.
 * Returns true if seeding occurred, false otherwise.
 */
export async function seedDatabase() {
  if (!isDebugEnabled()) return false;
  try {
    // Create a temporary model instance for seeding
    const tempModel = new FinSiteModel();
    const { saved } = await tempModel.addTransactionsBulk(seedTransactions);
    return saved && saved.length > 0;
  } catch (e) {
    // Log but don't throw
    console.error('Seed database failed:', e);
    return false;
  }
}
