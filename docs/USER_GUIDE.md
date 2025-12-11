# Finsite User Guide

Welcome to Finsite! This guide will help you get started with tracking your personal finances.

---

## What is Finsite?

Finsite is a **privacy-first** personal finance tracker that runs entirely in your browser. All your financial data stays on your device - nothing is sent to external servers.

**Key Features:**
- 📊 Track income and expenses
- 📈 Visualize spending trends with interactive charts
- 🏷️ Organize transactions with categories and groups
- 💰 Monitor budgets and spending limits
- 🔍 Search and filter transactions
- 📱 Works on desktop and mobile
- 🔒 Your data never leaves your device

---

## Getting Started

### First Time Setup

When you first open Finsite, you'll see the **Dashboard** with some default categories:

**Default Groups:**
- 🏠 **Household** - Groceries, Utilities, Fuel
- 💰 **Investments** - Stocks, Bonds
- 💳 **General Expenses** - Dining Out, Shopping

You can customize these or create your own!

### Quick Tour

**Main Navigation (Sidebar):**
- **Dashboard** - Overview of spending with charts
- **Transactions** - Detailed list of all transactions
- **Categories** - Manage groups and categories

**Quick Actions:**
- Click the **+ Add Transaction** button to record spending
- Use the **Search** bar to find specific transactions
- Apply **Filters** to view transactions by date, category, or amount

---

## Adding Transactions

### Method 1: Add Transaction Button

1. Click **+ Add Transaction** (top-right or sidebar)
2. Fill in the transaction details:
   - **Group** - Select the main category (e.g., Household)
   - **Category** - Select specific type (e.g., Groceries)
   - **Amount** - Enter the dollar amount (without $ sign)
   - **Date** - Pick the transaction date
   - **Merchant** - Enter store/vendor name (e.g., "Whole Foods")
   - **Notes** (optional) - Add any details
3. Click **Save Transaction**

### Method 2: Click Existing Transaction

1. Click on any transaction in the list
2. The form opens with pre-filled data
3. Make your changes
4. Click **Save** to update or **Delete** to remove

### Tips for Adding Transactions
- Use descriptive merchant names for better search
- Add notes for unusual purchases (e.g., "Birthday gift for Mom")
- Check the date - it defaults to today
- You can add both expenses and income

---

## Understanding the Dashboard

### Overview Stats (Top Cards)

**Total Spent All Time**
- Lifetime spending across all transactions
- Updates automatically as you add transactions

**Transactions This Week**
- Count of transactions in the last 7 days
- Helps track spending frequency

**This Month's Spending**
- Total spending for current month
- Includes percentage change from last month
- 🔺 Red = spending more, 🔽 Green = spending less

### Spending Trend Chart

**What it shows:**
- Last 6 months of spending
- Each bar represents one month
- Hover over bars to see exact amounts

**How to use it:**
- Spot spending patterns (seasonal changes, trends)
- Identify months with unusually high/low spending
- Compare current month to recent history

### Group Breakdown Chart

**What it shows:**
- Top 5 spending groups (pie/doughnut chart)
- Percentage of total spending per group
- Hover to see dollar amounts

**How to use it:**
- See where most money goes
- Identify opportunities to reduce spending
- Compare group priorities

### Recent Activity

- Shows last 5 transactions
- Quick view without leaving dashboard
- Click "View All" to see full transaction list

---

## Managing Transactions

### Viewing Transactions

**Transaction List:**
- Each row shows: icon, merchant, category, date, amount
- Sorted by date (newest first by default)
- Click any transaction to edit or delete

### Searching Transactions

1. Use the **Search** box (top of transactions page)
2. Type merchant name, category, or notes
3. Results filter in real-time
4. Clear search to see all transactions again

### Filtering Transactions

**By Date:**
1. Click **Date** button
2. Select date range (from → to)
3. Click **Apply**
4. Transactions filter to selected range

**By Scope:**
- **All** - Show everything
- **Expenses** - Only spending (negative amounts)
- **Income** - Only income (positive amounts)

**Clear All Filters:**
- Click **Clear Filters** button to reset

### Sorting Transactions

Click **Sort By** dropdown:
- **Newest** - Most recent first (default)
- **Oldest** - Oldest transactions first
- **Amount: High to Low** - Largest amounts first
- **Amount: Low to High** - Smallest amounts first

### Editing Transactions

1. Click on the transaction you want to change
2. Modal opens with current values
3. Update any field
4. Click **Save** to apply changes
5. Click **Cancel** to discard changes

### Deleting Transactions

1. Click on the transaction you want to remove
2. Click the **Delete** button (red)
3. Transaction is permanently removed
4. Dashboard updates automatically

---

## Categories and Groups

### Understanding the Structure

**Groups** = Broad categories (e.g., Household, Investments)  
**Categories** = Specific types within groups (e.g., Groceries, Stocks)

Think of it as: **Group → Category → Transaction**

### Default Groups & Categories

Finsite comes with preset groups and categories:

**Household:**
- 🛒 Groceries
- 💡 Utilities
- ⛽ Fuel

**Investments:**
- 📈 Stocks
- 📊 Bonds

**General Expenses:**
- 🍽️ Dining Out
- 🛍️ Shopping

### Creating Custom Categories

1. Go to **Categories** page
2. Find the group you want to add to
3. Click **Add Category** (inside the group card)
4. Fill in:
   - **Category Name** (e.g., "Gym Membership")
   - **Icon** (emoji picker)
5. Click **Save**

### Creating Custom Groups

1. Go to **Categories** page
2. Click **+ Create New Group** (top-right)
3. Fill in:
   - **Group Name** (e.g., "Entertainment")
   - **Select Categories** - Check boxes for categories to include
4. Click **Create Group**

**Note:** Categories can belong to multiple custom groups!

### Deleting Categories or Groups

1. Click on the category/group card
2. Click **Delete** button
3. Confirm deletion

**Warning:** Deleting a category/group doesn't delete transactions - they become "uncategorized"

---

## Tips & Best Practices

### Organizing Transactions
- ✅ Be consistent with merchant names (e.g., always "Target" not "target" or "Target Store")
- ✅ Add notes for shared expenses (e.g., "Split with roommate")
- ✅ Use custom categories for recurring expenses (e.g., "Netflix")
- ✅ Create groups for specific goals (e.g., "Vacation Fund")

### Tracking Accurately
- ✅ Add transactions promptly (don't let them pile up)
- ✅ Review weekly to catch missing transactions
- ✅ Use the dashboard to spot unusual patterns
- ✅ Set aside time monthly to review spending

### Privacy & Data
- ✅ Data stored locally in browser (IndexedDB)
- ✅ No account required, no login
- ✅ Data persists across sessions
- ✅ Clearing browser data will delete all transactions
- ✅ Export data regularly as backup (coming in v1.1)

### Performance
- ✅ Finsite handles thousands of transactions efficiently
- ✅ Charts update in real-time
- ✅ Works offline - no internet required

---

## Keyboard Shortcuts

(Coming in v1.1)

---

## Frequently Asked Questions

### Is my data secure?

Yes! All data is stored locally in your browser's IndexedDB. Nothing is sent to external servers. Your financial information never leaves your device.

### Can I access my data on multiple devices?

Not currently. Finsite is single-device only in v1.0. Multi-device sync is planned for v2.0 (see [Roadmap](ROADMAP.md)).

### Can I export my data?

Export features (CSV, JSON) are planned for v1.1. Currently, data exists only in your browser's IndexedDB.

### What happens if I clear my browser data?

All Finsite data will be deleted. We recommend **not** clearing browser storage for sites you want to keep data for. In v1.1, you'll be able to export backups.

### Can I import transactions from my bank?

Not yet. CSV import and bank integration are on the [roadmap](ROADMAP.md) for future releases.

### Does Finsite work offline?

Yes! Since everything runs locally in your browser, no internet connection is required after the initial page load.

### Which browsers are supported?

- ✅ Chrome/Edge (Chromium)
- ✅ Firefox
- ✅ Safari
- ❌ Internet Explorer (not supported)

### Can I use Finsite on mobile?

Yes! The interface is responsive and works on phones and tablets. A dedicated mobile app is planned for v2.0.

### Is there a budget feature?

Budget tracking exists in the code but the UI is limited in v1.0. Full budget management is coming in v1.1.

### Can I categorize income separately from expenses?

Yes! When adding a transaction, you can enter positive amounts for income. Use the Scope filter to view only income or expenses.

### How do I back up my data?

Currently, data exists only in browser storage. Manual export/import is planned for v1.1. As a workaround, avoid clearing browser data.

### The charts aren't showing data. Why?

- Make sure you've added some transactions
- Check that transactions have valid dates
- Try refreshing the page
- Check browser console for errors (F12)

### Can I undo a deletion?

Not currently. Once deleted, transactions cannot be recovered. Undo/redo is planned for v1.1.

### How do I reset everything and start over?

Currently, you need to manually delete all transactions or clear your browser's storage for the Finsite origin. A "Clear All Data" feature is planned.

---

## Troubleshooting

### Problem: Transactions not saving

**Solution:**
- Check browser console (F12) for errors
- Ensure browser supports IndexedDB
- Try in incognito mode (extensions may block storage)
- Check if browser storage is full

### Problem: Charts not updating

**Solution:**
- Refresh the page (F5)
- Navigate to another page and back to dashboard
- Check that transactions have valid dates

### Problem: Search not working

**Solution:**
- Try clearing the search box and typing again
- Check spelling of merchant name
- Try searching by category instead

### Problem: Sidebar won't collapse

**Solution:**
- Refresh the page
- Check browser console for JavaScript errors
- Try a different browser

### Problem: Date picker not showing

**Solution:**
- Make sure you're using a modern browser
- Try clicking directly on the date input field
- Check if browser extensions are interfering

---

## Getting Help

### Report a Bug
1. Go to [GitHub Issues](https://github.com/FIn-Site/Finsite/issues)
2. Click "New Issue"
3. Select "Bug Report" template
4. Include:
   - What you were trying to do
   - What happened instead
   - Browser and OS version
   - Steps to reproduce

### Request a Feature
1. Go to [GitHub Issues](https://github.com/FIn-Site/Finsite/issues)
2. Click "New Issue"
3. Select "Feature Request" template
4. Describe your use case and proposed solution

### Ask Questions
- Check this guide first
- Review the [FAQ](#frequently-asked-questions)
- Search [GitHub Discussions](https://github.com/FIn-Site/Finsite/discussions)
- Create a new discussion if your question isn't answered

---

## What's Next?

Check out the [Roadmap](ROADMAP.md) to see what features are coming in future releases!

**Coming in v1.1:**
- CSV import/export
- Edit existing transactions
- Budget creation UI
- Dark mode
- Transaction templates
- Undo/redo

---

**Happy tracking!** 💰
