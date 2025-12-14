// src/model/seedDatabase.js
// Only injects seed transactions if DB is empty and debug mode is enabled

import seedTransactions from './seedTransactions.js';
import { addTransaction } from '../storage/storageService.js';
import { isDebugEnabled } from '../utils/debugService.js';

/**
 * Injects seed data if DB is empty and debug mode is enabled.
 * Returns true if seeding occurred, false otherwise.
 * @param {Object} [model] - Optional model instance to use for bulk add (avoids cycle if not provided)
 */
export async function seedDatabase(model = null) {
    if (!isDebugEnabled()) return false;
    try {
        // If model is provided, use its bulk add method
        if (model && typeof model.addTransactionsBulk === 'function') {
            const { saved } = await model.addTransactionsBulk(seedTransactions);
            return saved && saved.length > 0;
        }

        // Fallback: add transactions directly via storage service
        const saved = [];
        for (const tx of seedTransactions) {
            const result = await addTransaction(tx);
            if (result) saved.push(result);
        }
        return saved.length > 0;
    } catch (e) {
        // Log but don't throw
        console.error('Seed database failed:', e);
        return false;
    }
}
