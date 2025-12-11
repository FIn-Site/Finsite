// src/model/seedTransactions.js
// Seed data for 150 transactions spanning Oct, Nov, Dec 2025
// Structure matches IndexedDB transaction schema

const seedTransactions = [
  // Example structure, will be filled with 150 items
  // {
  //   id: 'txn-1',
  //   date: '2025-10-01',
  //   amount: 50.25,
  //   category: 'Groceries',
  //   description: 'Supermarket',
  //   type: 'expense',
  //   group: 'Food',
  //   ...other fields as needed
  // },
];

// Generate 150 transactions

// Use the app's taxonomy for categories and groups
const taxonomy = [
  { category: 'groceries', group: 'household', merchant: 'Supermarket', name: 'Groceries' },
  { category: 'utilities', group: 'household', merchant: 'Utility Co', name: 'Utilities' },
  { category: 'fuel', group: 'household', merchant: 'Gas Station', name: 'Fuel' },
  { category: 'stocks', group: 'investments', merchant: 'Brokerage', name: 'Stocks' },
  { category: 'bonds', group: 'investments', merchant: 'Bond Market', name: 'Bonds' },
  { category: 'dining-out', group: 'expenses', merchant: 'Restaurant', name: 'Dining Out' },
  { category: 'shopping', group: 'expenses', merchant: 'Retailer', name: 'Shopping' },
];


const today = new Date('2025-12-10'); // Use today's date as the max for December
let count = 0;
for (let monthIdx = 0; monthIdx < 3; monthIdx++) {
  const month = 10 + monthIdx; // 10: Oct, 11: Nov, 12: Dec
  let daysInMonth = 30;
  if (month === 12) {
    // For December, only go up to today's date
    daysInMonth = today.getDate();
  }
  for (let day = 1; day <= daysInMonth; day++) {
    if (count >= 150) break;
    const date = `2025-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    const t = taxonomy[count % taxonomy.length];
    // Make every 20th transaction an 'income' (simulate salary)
    const isIncome = count % 20 === 0;
    const type = isIncome ? 'income' : 'expense';
    const amount = isIncome ? 2500 + (count % 3) * 250 : (10 + (count % 90)) + Math.random() * 50;
    seedTransactions.push({
      id: `txn-${count + 1}`,
      date,
      amount: Math.round(amount * 100) / 100,
      category: t.category,
      group: t.group,
      merchant: t.merchant,
      name: t.name,
      description: `${t.name} transaction #${count + 1}`,
      type,
      status: 'complete',
      account: 'Manual Entry',
      notes: '',
    });
    count++;
  }
}

export default seedTransactions;
