/**
 * Seed Data for FinSite
 * Generates 100 realistic transactions spread across the last 2 months
 * Only runs once when the database is empty
 */

import { addTransaction, getAllTransactions } from './storageService.js';

/**
 * Category configuration with realistic amount ranges
 */
const CATEGORY_CONFIG = {
    // Household
    groceries: { groupId: 'household', minAmount: 20, maxAmount: 150 },
    utilities: { groupId: 'household', minAmount: 50, maxAmount: 200 },
    fuel: { groupId: 'household', minAmount: 30, maxAmount: 80 },

    // Investments
    stocks: { groupId: 'investments', minAmount: 100, maxAmount: 1000 },
    bonds: { groupId: 'investments', minAmount: 200, maxAmount: 800 },

    // General Expenses
    'dining-out': { groupId: 'expenses', minAmount: 15, maxAmount: 75 },
    shopping: { groupId: 'expenses', minAmount: 25, maxAmount: 200 },
};

/**
 * Transaction name templates by category
 */
const TRANSACTION_NAMES = {
    groceries: [
        'Whole Foods Market',
        'Trader Joe\'s',
        'Safeway',
        'Costco',
        'Target Groceries',
        'Walmart Grocery',
        'Sprouts Farmers Market',
        'Kroger',
    ],
    utilities: [
        'Electric Bill',
        'Water Bill',
        'Gas Bill',
        'Internet Service',
        'Phone Bill',
        'Trash Collection',
    ],
    fuel: [
        'Shell Gas Station',
        'Chevron',
        'Arco',
        '76 Gas',
        'Costco Gas',
        'Mobil',
    ],
    stocks: [
        'AAPL Purchase',
        'GOOGL Investment',
        'MSFT Shares',
        'AMZN Stock',
        'TSLA Investment',
        'NVDA Purchase',
        'VOO ETF',
        'SPY ETF',
    ],
    bonds: [
        'Treasury Bond',
        'Municipal Bond',
        'Corporate Bond',
        'Bond ETF - BND',
        'I-Bond Purchase',
    ],
    'dining-out': [
        'Chipotle',
        'Starbucks',
        'McDonald\'s',
        'Olive Garden',
        'Panera Bread',
        'Chick-fil-A',
        'Local Restaurant',
        'Pizza Hut',
        'Subway',
        'Thai Food',
    ],
    shopping: [
        'Amazon Purchase',
        'Target',
        'Best Buy',
        'Walmart',
        'Home Depot',
        'IKEA',
        'Clothing Store',
        'Nike',
        'Apple Store',
    ],
};

/**
 * Generate a random number between min and max (inclusive)
 */
function randomBetween(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Generate a random date within the last 2 months (November and December 2025)
 */
function generateRandomDate() {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth(); // 0-indexed (December = 11)

    // Randomly pick current month or last month
    const monthOffset = Math.random() < 0.5 ? 0 : 1;
    const targetMonth = currentMonth - monthOffset;

    // Determine max day for the month
    let maxDay;
    if (monthOffset === 0) {
        // Current month - only up to today
        maxDay = now.getDate();
    } else {
        // Last month - full month (November has 30 days)
        maxDay = new Date(currentYear, targetMonth + 1, 0).getDate();
    }

    const day = randomBetween(1, maxDay);

    // Format as YYYY-MM-DD
    const month = String(targetMonth + 1).padStart(2, '0');
    const dayStr = String(day).padStart(2, '0');

    return `${currentYear}-${month}-${dayStr}`;
}

/**
 * Generate a single random transaction
 */
function generateTransaction() {
    // Pick a random category
    const categories = Object.keys(CATEGORY_CONFIG);
    const categoryId = categories[randomBetween(0, categories.length - 1)];
    const config = CATEGORY_CONFIG[categoryId];

    // Pick a random merchant for this category
    const merchants = TRANSACTION_NAMES[categoryId];
    const merchant = merchants[randomBetween(0, merchants.length - 1)];

    // Generate random amount within range (rounded to 2 decimals)
    const amount = (
        Math.random() * (config.maxAmount - config.minAmount) + config.minAmount
    ).toFixed(2);

    return {
        merchant,            // Standardized property for all components
        amount: parseFloat(amount),
        date: generateRandomDate(),
        group: config.groupId,
        category: categoryId,
    };
}

/**
 * Generate 100 seed transactions
 */
function generateSeedTransactions(count = 100) {
    const transactions = [];
    for (let i = 0; i < count; i++) {
        transactions.push(generateTransaction());
    }

    // Sort by date (oldest first)
    transactions.sort((a, b) => new Date(a.date) - new Date(b.date));

    return transactions;
}

/**
 * Seed the database with sample transactions
 * Only runs if the database is empty
 * @returns {Promise<boolean>} true if seeding occurred, false if skipped
 */
export async function seedDatabase() {
    try {
        // Check if transactions already exist
        const existingTransactions = await getAllTransactions();

        if (existingTransactions && existingTransactions.length > 0) {
            console.log(`📊 Database already has ${existingTransactions.length} transactions. Skipping seed.`);
            return false;
        }

        console.log('🌱 Seeding database with 100 sample transactions...');

        const seedTransactions = generateSeedTransactions(100);

        // Add all transactions
        for (const tx of seedTransactions) {
            await addTransaction(tx);
        }

        console.log('✅ Successfully seeded 100 transactions!');
        return true;
    } catch (error) {
        console.error('❌ Error seeding database:', error);
        return false;
    }
}

/**
 * Force seed the database (ignores existing data check)
 * Use this to add more sample data
 * @param {number} count - Number of transactions to add
 */
export async function forceSeedDatabase(count = 100) {
    try {
        console.log(`🌱 Force seeding ${count} transactions...`);

        const seedTransactions = generateSeedTransactions(count);

        for (const tx of seedTransactions) {
            await addTransaction(tx);
        }

        console.log(`✅ Successfully added ${count} transactions!`);
        return true;
    } catch (error) {
        console.error('❌ Error force seeding database:', error);
        return false;
    }
}

// Expose to window for console access
if (typeof window !== 'undefined') {
    window.seedDatabase = seedDatabase;
    window.forceSeedDatabase = forceSeedDatabase;
}
