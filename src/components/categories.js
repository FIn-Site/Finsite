// Import the category chart component
import './category-chart.js';

// Import storage service for IndexedDB persistence
import { 
    getAllGroups, 
    addGroup,
    deleteGroup,
    getAllCategories, 
    addCategory,
    getAllTransactions 
} from '../storage/storageService.js';

/**
 * Categories Web Component for FinSite
 * Page container that displays spending breakdown by groups
 * Each group (Household, Wealth, Expenses) is rendered as a category-chart component
 * Includes modal for viewing transactions when a group is clicked
 */
class FinSiteCategories extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });

        // Groups and categories data
        this.groups = [
            { id: 'household', name: 'Household' },
            { id: 'investments', name: 'Wealth' },
            { id: 'expenses', name: 'Expenses' }
        ];

        this.categories = [
            { id: 'groceries', groupId: 'household', name: 'Groceries', amount: 0 },
            { id: 'utilities', groupId: 'household', name: 'Utilities', amount: 0 },
            { id: 'fuel', groupId: 'household', name: 'Fuel', amount: 0 },
            { id: 'stocks', groupId: 'investments', name: 'Stocks', amount: 0 },
            { id: 'bonds', groupId: 'investments', name: 'Bonds', amount: 0 },
            { id: 'dining-out', groupId: 'expenses', name: 'Dining Out', amount: 0 },
            { id: 'shopping', groupId: 'expenses', name: 'Shopping', amount: 0 }
        ];

        // Sample transactions following IndexedDB structure:
        // { id, group, category, amount, date, merchant, notes }
        // Today is Dec 8, 2025 (Sunday) - This week: Dec 8 (Sun), Last week: Dec 1-7 (Sun-Sat)
        this.transactions = [
            // ============ LAST WEEK (Dec 1 - Dec 6, 2025) ============
            // Sunday Dec 1
            { id: 1, group: 'household', category: 'groceries', amount: 127.54, date: '2025-12-01', merchant: 'Whole Foods', notes: 'Weekly groceries' },
            { id: 2, group: 'household', category: 'utilities', amount: 156.78, date: '2025-12-01', merchant: 'PG&E', notes: 'Electric bill' },
            { id: 3, group: 'household', category: 'utilities', amount: 89.50, date: '2025-12-01', merchant: 'Comcast', notes: 'Internet' },
            { id: 4, group: 'investments', category: 'stocks', amount: 250.00, date: '2025-12-01', merchant: 'Robinhood', notes: 'AAPL purchase' },
            { id: 5, group: 'expenses', category: 'dining-out', amount: 35.20, date: '2025-12-01', merchant: 'Panera Bread', notes: 'Sunday brunch' },

            // Monday Dec 2
            { id: 6, group: 'household', category: 'fuel', amount: 58.42, date: '2025-12-02', merchant: 'Shell', notes: 'Gas fillup' },
            { id: 7, group: 'household', category: 'utilities', amount: 112.34, date: '2025-12-02', merchant: 'Water Company', notes: 'Water bill' },
            { id: 8, group: 'investments', category: 'bonds', amount: 150.00, date: '2025-12-02', merchant: 'Treasury Direct', notes: 'I-Bonds' },
            { id: 9, group: 'expenses', category: 'shopping', amount: 67.89, date: '2025-12-02', merchant: 'Amazon', notes: 'Books' },

            // Tuesday Dec 3
            { id: 10, group: 'household', category: 'groceries', amount: 89.23, date: '2025-12-03', merchant: 'Trader Joes', notes: 'Snacks and produce' },
            { id: 11, group: 'expenses', category: 'dining-out', amount: 45.67, date: '2025-12-03', merchant: 'Chipotle', notes: 'Lunch with team' },
            { id: 12, group: 'expenses', category: 'shopping', amount: 34.99, date: '2025-12-03', merchant: 'Target', notes: 'Cleaning supplies' },

            // Wednesday Dec 4
            { id: 13, group: 'investments', category: 'stocks', amount: 300.00, date: '2025-12-04', merchant: 'Fidelity', notes: 'Index fund' },
            { id: 14, group: 'expenses', category: 'shopping', amount: 124.99, date: '2025-12-04', merchant: 'Amazon', notes: 'Electronics' },
            { id: 15, group: 'expenses', category: 'dining-out', amount: 22.50, date: '2025-12-04', merchant: 'Starbucks', notes: 'Coffee meeting' },
            { id: 16, group: 'household', category: 'fuel', amount: 45.00, date: '2025-12-04', merchant: 'Arco', notes: 'Quick fillup' },

            // Thursday Dec 5
            { id: 17, group: 'household', category: 'groceries', amount: 65.80, date: '2025-12-05', merchant: 'Costco', notes: 'Bulk items' },
            { id: 18, group: 'household', category: 'fuel', amount: 62.15, date: '2025-12-05', merchant: 'Chevron', notes: 'Premium gas' },
            { id: 19, group: 'expenses', category: 'dining-out', amount: 78.90, date: '2025-12-05', merchant: 'Olive Garden', notes: 'Dinner date' },
            { id: 20, group: 'investments', category: 'bonds', amount: 100.00, date: '2025-12-05', merchant: 'Vanguard', notes: 'Bond ETF' },

            // Friday Dec 6
            { id: 21, group: 'household', category: 'groceries', amount: 43.12, date: '2025-12-06', merchant: 'Safeway', notes: 'Quick trip' },
            { id: 22, group: 'investments', category: 'bonds', amount: 200.00, date: '2025-12-06', merchant: 'Vanguard', notes: 'Bond ETF' },
            { id: 23, group: 'expenses', category: 'shopping', amount: 89.50, date: '2025-12-06', merchant: 'Target', notes: 'Household items' },
            { id: 24, group: 'expenses', category: 'dining-out', amount: 55.00, date: '2025-12-06', merchant: 'Buffalo Wild Wings', notes: 'Friday dinner' },
            { id: 25, group: 'household', category: 'fuel', amount: 52.30, date: '2025-12-06', merchant: 'Shell', notes: 'Weekend prep' },

            // Saturday Dec 7
            { id: 26, group: 'household', category: 'groceries', amount: 78.90, date: '2025-12-07', merchant: 'Whole Foods', notes: 'Weekend groceries' },
            { id: 27, group: 'household', category: 'fuel', amount: 55.80, date: '2025-12-07', merchant: 'Costco Gas', notes: 'Discount gas' },
            { id: 28, group: 'expenses', category: 'dining-out', amount: 32.45, date: '2025-12-07', merchant: 'Starbucks', notes: 'Coffee and pastry' },
            { id: 29, group: 'expenses', category: 'shopping', amount: 156.00, date: '2025-12-07', merchant: 'Best Buy', notes: 'Headphones' },
            { id: 30, group: 'investments', category: 'stocks', amount: 150.00, date: '2025-12-07', merchant: 'Robinhood', notes: 'TSLA shares' },

            // ============ THIS WEEK (Dec 8, 2025 - Sunday/Today) ============
            // Sunday Dec 8 (Today)
            { id: 31, group: 'household', category: 'groceries', amount: 142.33, date: '2025-12-08', merchant: 'Whole Foods', notes: 'Weekly groceries' },
            { id: 32, group: 'household', category: 'groceries', amount: 56.78, date: '2025-12-08', merchant: 'Trader Joes', notes: 'Specialty items' },
            { id: 33, group: 'household', category: 'fuel', amount: 61.50, date: '2025-12-08', merchant: 'Chevron', notes: 'Sunday fillup' },
            { id: 34, group: 'expenses', category: 'dining-out', amount: 48.90, date: '2025-12-08', merchant: 'IHOP', notes: 'Sunday brunch' },
            { id: 35, group: 'expenses', category: 'dining-out', amount: 67.50, date: '2025-12-08', merchant: 'Applebees', notes: 'Dinner' },
            { id: 36, group: 'investments', category: 'stocks', amount: 400.00, date: '2025-12-08', merchant: 'Fidelity', notes: 'Weekly investment' },
            { id: 37, group: 'expenses', category: 'shopping', amount: 234.99, date: '2025-12-08', merchant: 'Amazon', notes: 'Holiday gifts' },
            { id: 38, group: 'expenses', category: 'shopping', amount: 89.00, date: '2025-12-08', merchant: 'Walmart', notes: 'Household essentials' },
            { id: 39, group: 'household', category: 'utilities', amount: 175.00, date: '2025-12-08', merchant: 'PG&E', notes: 'Gas bill' },
            { id: 40, group: 'investments', category: 'bonds', amount: 250.00, date: '2025-12-08', merchant: 'Treasury Direct', notes: 'Series I Bonds' },

            // ============ ADDITIONAL HISTORICAL DATA (Nov 24-30) ============
            // For context - two weeks ago
            { id: 41, group: 'household', category: 'groceries', amount: 98.45, date: '2025-11-24', merchant: 'Costco', notes: 'Thanksgiving prep' },
            { id: 42, group: 'household', category: 'groceries', amount: 187.23, date: '2025-11-25', merchant: 'Whole Foods', notes: 'Thanksgiving shopping' },
            { id: 43, group: 'expenses', category: 'dining-out', amount: 125.00, date: '2025-11-27', merchant: 'The Cheesecake Factory', notes: 'Thanksgiving dinner out' },
            { id: 44, group: 'household', category: 'fuel', amount: 72.30, date: '2025-11-28', merchant: 'Shell', notes: 'Black Friday travel' },
            { id: 45, group: 'expenses', category: 'shopping', amount: 345.67, date: '2025-11-29', merchant: 'Amazon', notes: 'Black Friday deals' },
            { id: 46, group: 'expenses', category: 'shopping', amount: 189.99, date: '2025-11-29', merchant: 'Best Buy', notes: 'Black Friday electronics' },
            { id: 47, group: 'investments', category: 'stocks', amount: 500.00, date: '2025-11-30', merchant: 'Fidelity', notes: 'End of month investment' },
            { id: 48, group: 'household', category: 'utilities', amount: 145.00, date: '2025-11-30', merchant: 'Comcast', notes: 'Internet + TV bundle' },
            { id: 49, group: 'expenses', category: 'dining-out', amount: 43.50, date: '2025-11-30', merchant: 'Olive Garden', notes: 'Weekend dinner' },
            { id: 50, group: 'household', category: 'groceries', amount: 67.89, date: '2025-11-30', merchant: 'Safeway', notes: 'End of month groceries' }
        ];

        // Modal state
        this.isModalOpen = false;
        this.selectedGroup = null;
        this.selectedTransactions = [];
        this.selectedCategories = [];

        // Add group modal state
        this.isAddGroupModalOpen = false;
        this.newGroupName = '';
        this.selectedCategoryIds = new Set();
        this.newSubcategories = []; // User-created subcategories for the new group
    }

    async connectedCallback() {
        // Load data from IndexedDB first
        await this.loadFromStorage();
        
        this.calculateCategoryAmounts();
        this.render();
        this.setupEventListeners();
        // Delay chart update to ensure DOM is ready
        requestAnimationFrame(() => {
            this.updateChartComponents();
        });
    }

    /**
     * Load groups, categories, and transactions from IndexedDB
     * Seeds default data if storage is empty
     */
    async loadFromStorage() {
        try {
            // Load groups from IndexedDB
            const storedGroups = await getAllGroups();
            
            // If no groups in storage, seed the defaults
            if (storedGroups.length === 0) {
                console.log('📦 No groups in IndexedDB, seeding defaults...');
                for (const group of this.groups) {
                    await addGroup(group);
                }
            } else {
                // Use stored groups (includes any custom groups)
                this.groups = storedGroups;
                console.log('📦 Loaded groups from IndexedDB:', this.groups);
            }

            // Load categories from IndexedDB
            const storedCategories = await getAllCategories();
            
            if (storedCategories.length === 0) {
                console.log('📦 No categories in IndexedDB, seeding defaults...');
                for (const cat of this.categories) {
                    await addCategory(cat);
                }
            } else {
                // Merge stored categories with defaults (keep amounts at 0, will recalculate)
                this.categories = storedCategories.map(cat => ({ ...cat, amount: 0 }));
                console.log('📦 Loaded categories from IndexedDB:', this.categories);
            }

            // Load transactions from IndexedDB
            const storedTransactions = await getAllTransactions();
            
            if (storedTransactions.length > 0) {
                this.transactions = storedTransactions;
                console.log('📦 Loaded transactions from IndexedDB:', this.transactions.length, 'records');
            } else {
                // Keep sample transactions as fallback for demo
                console.log('📦 No transactions in IndexedDB, using sample data');
            }

        } catch (error) {
            console.error('❌ Error loading from IndexedDB:', error);
            // Continue with default data on error
        }
    }

    /**
     * Set data from external source (MVC model)
     * @param {Object} data - { groups, categories, transactions }
     */
    setData(data) {
        if (data.groups) {
            this.groups = data.groups;
        }
        if (data.categories) {
            this.categories = data.categories.map(cat => ({ ...cat, amount: 0 }));
        }
        if (data.transactions) {
            this.transactions = data.transactions;
        }
        this.calculateCategoryAmounts();
        this.updateChartComponents();
    }

    /**
     * Calculate spending amounts per category from transactions
     */
    calculateCategoryAmounts() {
        // Reset amounts
        this.categories = this.categories.map(cat => ({ ...cat, amount: 0 }));

        // Sum up transactions per category
        for (const tx of this.transactions) {
            const category = this.categories.find(c => c.id === tx.category);
            if (category) {
                category.amount += Math.abs(Number(tx.amount) || 0);
            }
        }
    }

    /**
     * Get categories for a specific group
     * For custom groups, uses categoryIds array
     * For default groups, uses groupId on categories
     */
    getCategoriesForGroup(groupId) {
        const group = this.groups.find(g => g.id === groupId);
        
        // Custom groups have categoryIds array
        if (group?.isCustom && group.categoryIds) {
            return this.categories.filter(cat => group.categoryIds.includes(cat.id));
        }
        
        // Default groups use groupId on categories
        return this.categories.filter(cat => cat.groupId === groupId);
    }

    /**
     * Get transactions for a specific group
     * Filters by category membership (works for both default and custom groups)
     */
    getTransactionsForGroup(groupId) {
        // Get all category IDs that belong to this group
        const groupCategoryIds = this.getCategoriesForGroup(groupId).map(cat => cat.id);
        
        // Filter transactions where the category belongs to this group
        return this.transactions.filter(tx => groupCategoryIds.includes(tx.category));
    }

    /**
     * Update child chart components with data
     */
    updateChartComponents() {
        const charts = this.shadowRoot.querySelectorAll('finsite-category-chart');
        charts.forEach(chart => {
            const groupId = chart.getAttribute('data-group-id');
            const group = this.groups.find(g => g.id === groupId);
            if (group) {
                chart.setData({
                    groupId: group.id,
                    groupName: group.name,
                    categories: this.getCategoriesForGroup(group.id),
                    transactions: this.getTransactionsForGroup(group.id)
                });
            }
        });
    }

    /**
     * Open modal with group details
     */
    openModal(groupData) {
        this.selectedGroup = groupData;
        this.selectedTransactions = groupData.transactions || [];
        this.selectedCategories = groupData.categories || [];
        this.isModalOpen = true;
        this.renderModal();
    }

    /**
     * Close modal
     */
    closeModal() {
        this.isModalOpen = false;
        const overlay = this.shadowRoot.querySelector('.modal-overlay');
        if (overlay) {
            overlay.classList.add('hidden');
        }
    }

    /**
     * Handle deleting a custom group
     */
    async handleDeleteGroup() {
        const groupId = this.selectedGroup?.groupId;
        const groupName = this.selectedGroup?.groupName;

        if (!groupId) {
            console.error('No group selected for deletion');
            return;
        }

        // Confirm deletion
        const confirmed = confirm(`Are you sure you want to delete the group "${groupName}"?\n\nThis will remove the custom group but will not delete any transactions.`);
        
        if (!confirmed) {
            return;
        }

        try {
            // Delete from IndexedDB
            await deleteGroup(groupId);
            console.log(`🗑️ Deleted group from IndexedDB: ${groupName}`);

            // Remove from local groups array
            this.groups = this.groups.filter(g => g.id !== groupId);

            // Dispatch event for controller awareness
            this.dispatchEvent(new CustomEvent('group-deleted', {
                detail: { groupId, groupName },
                bubbles: true,
                composed: true
            }));

            // Close modal and re-render
            this.closeModal();
            this.render();
            this.setupEventListeners();
            requestAnimationFrame(() => {
                this.updateChartComponents();
            });

            console.log(`✅ Successfully deleted group: ${groupName}`);

        } catch (error) {
            console.error('❌ Failed to delete group:', error);
            alert('Failed to delete group. Please try again.');
        }
    }

    /**
     * Open the Add Group modal
     */
    openAddGroupModal() {
        this.isAddGroupModalOpen = true;
        this.newGroupName = '';
        this.selectedCategoryIds = new Set();
        this.newSubcategories = [];
        this.renderAddGroupModal();
    }

    /**
     * Close the Add Group modal
     */
    closeAddGroupModal() {
        this.isAddGroupModalOpen = false;
        const overlay = this.shadowRoot.querySelector('.add-group-modal-overlay');
        if (overlay) {
            overlay.classList.add('hidden');
        }
    }

    /**
     * Add a new subcategory input field
     */
    addSubcategoryField() {
        this.newSubcategories.push({ id: `new-${Date.now()}`, name: '' });
        this.renderAddGroupModal();
    }

    /**
     * Remove a subcategory field
     */
    removeSubcategoryField(index) {
        this.newSubcategories.splice(index, 1);
        this.renderAddGroupModal();
    }

    /**
     * Handle form submission for creating a new group
     */
    async handleCreateGroup() {
        const nameInput = this.shadowRoot.querySelector('#new-group-name');
        const groupName = nameInput?.value.trim();

        if (!groupName) {
            alert('Please enter a group name');
            return;
        }

        // Generate group ID from name
        const groupId = groupName.toLowerCase().replace(/\s+/g, '-');

        // Check if group already exists
        if (this.groups.find(g => g.id === groupId)) {
            alert('A group with this name already exists');
            return;
        }

        // Collect selected category IDs for the custom group
        const selectedCategoryIdsArray = Array.from(this.selectedCategoryIds);

        // Get new subcategories from inputs and save them
        const newSubInputs = this.shadowRoot.querySelectorAll('.new-subcategory-input');
        for (const input of newSubInputs) {
            const subName = input.value.trim();
            if (subName) {
                const subId = subName.toLowerCase().replace(/\s+/g, '-');
                // Only add if not duplicate
                if (!this.categories.find(c => c.id === subId)) {
                    const newCategory = {
                        id: subId,
                        groupId: groupId,
                        name: subName,
                        amount: 0
                    };
                    this.categories.push(newCategory);
                    // Add new category ID to the selection
                    selectedCategoryIdsArray.push(subId);
                    
                    // Save new category to IndexedDB
                    try {
                        await addCategory(newCategory);
                        console.log(`💾 Saved new category: ${subName}`);
                    } catch (error) {
                        console.error('❌ Failed to save category:', error);
                    }
                }
            }
        }

        // Create the new group with categoryIds for custom groups
        const newGroup = {
            id: groupId,
            name: groupName,
            isCustom: true,
            categoryIds: selectedCategoryIdsArray // Store which categories belong to this custom group
        };

        this.groups.push(newGroup);

        // Save the new group to IndexedDB
        try {
            await addGroup(newGroup);
            console.log(`💾 Saved custom group to IndexedDB: ${groupName}`);
            console.log('   Category IDs:', selectedCategoryIdsArray);
        } catch (error) {
            console.error('❌ Failed to save group to IndexedDB:', error);
        }

        console.log(`✅ Created new group: ${groupName}`);
        console.log('Updated groups:', this.groups);

        // Dispatch event for controller/model
        this.dispatchEvent(new CustomEvent('group-created', {
            detail: {
                group: newGroup,
                categories: this.getCategoriesForGroup(groupId)
            },
            bubbles: true,
            composed: true
        }));

        // Close modal and re-render
        this.closeAddGroupModal();
        this.render();
        this.setupEventListeners();
        requestAnimationFrame(() => {
            this.updateChartComponents();
        });
    }

    /**
     * Render the Add Group modal
     */
    renderAddGroupModal() {
        const overlay = this.shadowRoot.querySelector('.add-group-modal-overlay');
        if (!overlay) return;

        // Get all unique categories (not assigned to existing default groups OR all categories)
        const allCategories = this.categories;

        // Group categories by their current group for display
        const categoryGroups = {};
        for (const cat of allCategories) {
            const group = this.groups.find(g => g.id === cat.groupId);
            const groupName = group?.name || 'Unassigned';
            if (!categoryGroups[groupName]) {
                categoryGroups[groupName] = [];
            }
            categoryGroups[groupName].push(cat);
        }

        // Build category checkboxes grouped by current assignment
        let categoriesHtml = '';
        for (const [groupName, cats] of Object.entries(categoryGroups)) {
            categoriesHtml += `
                <div class="category-group">
                    <div class="category-group-label">${groupName}</div>
                    <div class="category-checkboxes">
                        ${cats.map(cat => `
                            <label class="checkbox-item">
                                <input type="checkbox" 
                                       class="category-checkbox" 
                                       data-category-id="${cat.id}"
                                       ${this.selectedCategoryIds.has(cat.id) ? 'checked' : ''}>
                                <span class="checkbox-icon">${this._getCategoryIcon(cat.id)}</span>
                                <span class="checkbox-label">${cat.name}</span>
                                <span class="checkbox-amount">${this._formatCurrency(cat.amount)}</span>
                            </label>
                        `).join('')}
                    </div>
                </div>
            `;
        }

        // Build new subcategory inputs
        const newSubcategoriesHtml = this.newSubcategories.map((sub, index) => `
            <div class="new-subcategory-row">
                <input type="text" 
                       class="new-subcategory-input form-input" 
                       placeholder="Subcategory name"
                       value="${sub.name}">
                <button type="button" class="remove-subcategory-btn" data-index="${index}">✕</button>
            </div>
        `).join('');

        overlay.innerHTML = `
            <div class="modal-container add-group-modal">
                <div class="modal-header">
                    <div class="modal-title-section">
                        <h2 class="modal-title">Create New Group</h2>
                        <p class="modal-subtitle">Organize your spending categories</p>
                    </div>
                    <button class="modal-close-btn" id="add-group-modal-close">✕</button>
                </div>

                <div class="modal-body">
                    <form id="add-group-form">
                        <!-- Group Name -->
                        <div class="form-group">
                            <label class="form-label" for="new-group-name">Group Name</label>
                            <input type="text" 
                                   id="new-group-name" 
                                   class="form-input" 
                                   placeholder="e.g., Entertainment, Travel, Subscriptions"
                                   value="${this.newGroupName}"
                                   autocomplete="off">
                        </div>

                        <!-- Select Existing Categories -->
                        <div class="form-group">
                            <label class="form-label">Include Existing Categories</label>
                            <p class="form-help">Select categories to move into this new group</p>
                            <div class="categories-selection">
                                ${categoriesHtml}
                            </div>
                        </div>

                        <!-- Add New Subcategories -->
                        <div class="form-group">
                            <label class="form-label">Add New Subcategories</label>
                            <p class="form-help">Create new categories for this group</p>
                            <div class="new-subcategories-list">
                                ${newSubcategoriesHtml}
                            </div>
                            <button type="button" class="add-subcategory-btn" id="add-subcategory-btn">
                                <span class="btn-icon">+</span>
                                Add Subcategory
                            </button>
                        </div>
                    </form>
                </div>

                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" id="cancel-add-group">Cancel</button>
                    <button type="button" class="btn btn-primary" id="create-group-btn">Create Group</button>
                </div>
            </div>
        `;

        overlay.classList.remove('hidden');

        // Setup event listeners for the modal
        this.setupAddGroupModalListeners();
    }

    /**
     * Setup event listeners for Add Group modal
     */
    setupAddGroupModalListeners() {
        const overlay = this.shadowRoot.querySelector('.add-group-modal-overlay');
        if (!overlay) return;

        // Close button
        const closeBtn = overlay.querySelector('#add-group-modal-close');
        closeBtn?.addEventListener('click', () => this.closeAddGroupModal());

        // Cancel button
        const cancelBtn = overlay.querySelector('#cancel-add-group');
        cancelBtn?.addEventListener('click', () => this.closeAddGroupModal());

        // Create button
        const createBtn = overlay.querySelector('#create-group-btn');
        createBtn?.addEventListener('click', () => this.handleCreateGroup());

        // Add subcategory button
        const addSubBtn = overlay.querySelector('#add-subcategory-btn');
        addSubBtn?.addEventListener('click', () => this.addSubcategoryField());

        // Remove subcategory buttons
        overlay.querySelectorAll('.remove-subcategory-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(e.target.dataset.index);
                this.removeSubcategoryField(index);
            });
        });

        // Category checkboxes
        overlay.querySelectorAll('.category-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const categoryId = e.target.dataset.categoryId;
                if (e.target.checked) {
                    this.selectedCategoryIds.add(categoryId);
                } else {
                    this.selectedCategoryIds.delete(categoryId);
                }
            });
        });

        // Close on overlay click
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                this.closeAddGroupModal();
            }
        });

        // Track group name changes
        const nameInput = overlay.querySelector('#new-group-name');
        nameInput?.addEventListener('input', (e) => {
            this.newGroupName = e.target.value;
        });

        // Track subcategory name changes
        overlay.querySelectorAll('.new-subcategory-input').forEach((input, index) => {
            input.addEventListener('input', (e) => {
                if (this.newSubcategories[index]) {
                    this.newSubcategories[index].name = e.target.value;
                }
            });
        });
    }

    /**
     * Format currency
     */
    _formatCurrency(amount) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(amount || 0);
    }

    /**
     * Format date
     */
    _formatDate(dateStr) {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }

    /**
     * Get category icon
     */
    _getCategoryIcon(categoryId) {
        const icons = {
            'groceries': '🛒',
            'utilities': '💡',
            'fuel': '⛽',
            'stocks': '📈',
            'bonds': '📊',
            'dining-out': '🍽️',
            'shopping': '🛍️'
        };
        return icons[categoryId] || '💳';
    }

    /**
     * Format currency in short form for Y-axis labels
     */
    _formatCurrencyShort(amount) {
        if (amount >= 1000) {
            return '$' + (amount / 1000).toFixed(1) + 'k';
        }
        return '$' + Math.round(amount);
    }

    /**
     * Get week-over-week spending data for the chart
     * Returns spending aggregated by day for this week and last week
     */
    _getWeekOverWeekData(transactions) {
        const today = new Date();
        const dayOfWeek = today.getDay(); // 0 = Sunday
        
        // Calculate start of this week (Sunday)
        const thisWeekStart = new Date(today);
        thisWeekStart.setDate(today.getDate() - dayOfWeek);
        thisWeekStart.setHours(0, 0, 0, 0);
        
        // Calculate start of last week (Sunday)
        const lastWeekStart = new Date(thisWeekStart);
        lastWeekStart.setDate(thisWeekStart.getDate() - 7);
        
        // Calculate end of last week (Saturday)
        const lastWeekEnd = new Date(thisWeekStart);
        lastWeekEnd.setDate(thisWeekStart.getDate() - 1);
        lastWeekEnd.setHours(23, 59, 59, 999);

        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        
        // Initialize data structure
        const weekData = {
            thisWeek: Array(7).fill(0),
            lastWeek: Array(7).fill(0),
            thisWeekTotal: 0,
            lastWeekTotal: 0,
            days: days
        };

        // Aggregate transactions by day
        for (const tx of transactions) {
            const txDate = new Date(tx.date);
            txDate.setHours(0, 0, 0, 0);
            const amount = Math.abs(Number(tx.amount) || 0);
            
            // Check if transaction is in this week
            if (txDate >= thisWeekStart && txDate <= today) {
                const dayIndex = txDate.getDay();
                weekData.thisWeek[dayIndex] += amount;
                weekData.thisWeekTotal += amount;
            }
            // Check if transaction is in last week
            else if (txDate >= lastWeekStart && txDate <= lastWeekEnd) {
                const dayIndex = txDate.getDay();
                weekData.lastWeek[dayIndex] += amount;
                weekData.lastWeekTotal += amount;
            }
        }

        // Calculate max value for scaling
        weekData.maxValue = Math.max(
            ...weekData.thisWeek,
            ...weekData.lastWeek,
            1 // Prevent division by zero
        );

        // Calculate percent change
        if (weekData.lastWeekTotal > 0) {
            weekData.percentChange = ((weekData.thisWeekTotal - weekData.lastWeekTotal) / weekData.lastWeekTotal) * 100;
        } else {
            weekData.percentChange = weekData.thisWeekTotal > 0 ? 100 : 0;
        }

        // Calculate daily averages (only count days with data for this week up to today)
        const daysThisWeek = dayOfWeek + 1; // Days elapsed this week including today
        weekData.thisWeekAvg = weekData.thisWeekTotal / daysThisWeek;
        weekData.lastWeekAvg = weekData.lastWeekTotal / 7;

        return weekData;
    }

    /**
     * Generate HTML for the week-over-week comparison chart
     */
    _generateWeekChartHtml(weekData) {
        // Get current day of week (0 = Sunday, 6 = Saturday)
        const today = new Date();
        const currentDayIndex = today.getDay();

        const barsHtml = weekData.days.map((day, index) => {
            const thisWeekHeight = weekData.maxValue > 0 
                ? (weekData.thisWeek[index] / weekData.maxValue) * 100 
                : 0;
            const lastWeekHeight = weekData.maxValue > 0 
                ? (weekData.lastWeek[index] / weekData.maxValue) * 100 
                : 0;

            // Calculate daily % change
            let dailyChangeHtml = '';
            const lastWeekAmt = weekData.lastWeek[index];
            const thisWeekAmt = weekData.thisWeek[index];
            
            // Only show comparison for today and past days (not future days)
            const isFutureDay = index > currentDayIndex;
            
            if (isFutureDay) {
                // Future day - show blank
                dailyChangeHtml = `<div class="day-change neutral"></div>`;
            } else if (lastWeekAmt > 0 && thisWeekAmt > 0) {
                const dailyChange = ((thisWeekAmt - lastWeekAmt) / lastWeekAmt) * 100;
                const dailyChangeClass = dailyChange >= 0 ? 'change-up' : 'change-down';
                const dailyChangeSign = dailyChange >= 0 ? '+' : '';
                dailyChangeHtml = `<div class="day-change ${dailyChangeClass}">${dailyChangeSign}${dailyChange.toFixed(0)}%</div>`;
            } else if (thisWeekAmt > 0 && lastWeekAmt === 0) {
                dailyChangeHtml = `<div class="day-change change-up">NEW</div>`;
            } else if (lastWeekAmt > 0 && thisWeekAmt === 0) {
                dailyChangeHtml = `<div class="day-change change-down">-100%</div>`;
            } else {
                // Today or past with no spending either week
                dailyChangeHtml = `<div class="day-change neutral">--</div>`;
            }

            return `
                <div class="chart-day">
                    <div class="chart-bars">
                        <div class="bar-group">
                            <div class="bar bar-last-week" style="height: ${lastWeekHeight}%"
                                 title="Last week: ${this._formatCurrency(weekData.lastWeek[index])}"></div>
                            <div class="bar bar-this-week" style="height: ${thisWeekHeight}%" 
                                 title="This week: ${this._formatCurrency(weekData.thisWeek[index])}"></div>
                        </div>
                    </div>
                    <div class="chart-day-label">${day}</div>
                    ${dailyChangeHtml}
                </div>
            `;
        }).join('');

        const changeIcon = weekData.percentChange >= 0 ? '📈' : '📉';
        const changeClass = weekData.percentChange >= 0 ? 'change-up' : 'change-down';
        const changeSign = weekData.percentChange >= 0 ? '+' : '';

        // Generate Y-axis labels (4 tick marks: 0, 1/3, 2/3, max)
        const maxVal = weekData.maxValue;
        const yAxisLabels = [
            maxVal,
            Math.round(maxVal * 2 / 3),
            Math.round(maxVal / 3),
            0
        ];

        const yAxisHtml = yAxisLabels.map(val => `
            <div class="y-axis-label">${this._formatCurrencyShort(val)}</div>
        `).join('');

        return `
            <div class="section">
                <h3 class="section-title">This Week vs Last Week</h3>
                <div class="week-chart-container">
                    <div class="week-chart-wrapper">
                        <div class="y-axis">
                            ${yAxisHtml}
                        </div>
                        <div class="week-chart">
                            ${barsHtml}
                        </div>
                    </div>
                    <div class="chart-legend">
                        <div class="legend-item">
                            <span class="legend-color legend-this-week"></span>
                            <span class="legend-label">This Week</span>
                            <span class="legend-value">${this._formatCurrency(weekData.thisWeekTotal)}</span>
                        </div>
                        <div class="legend-item">
                            <span class="legend-color legend-last-week"></span>
                            <span class="legend-label">Last Week</span>
                            <span class="legend-value">${this._formatCurrency(weekData.lastWeekTotal)}</span>
                        </div>
                    </div>
                    <div class="chart-stats">
                        <div class="stat-item">
                            <span class="stat-icon">${changeIcon}</span>
                            <span class="stat-text ${changeClass}">${changeSign}${weekData.percentChange.toFixed(1)}% vs last week</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-icon">📊</span>
                            <span class="stat-text">Avg/day: ${this._formatCurrency(weekData.thisWeekAvg)} (this) vs ${this._formatCurrency(weekData.lastWeekAvg)} (last)</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Render the modal content
     */
    renderModal() {
        const overlay = this.shadowRoot.querySelector('.modal-overlay');
        if (!overlay) return;

        // Check if this is a custom group (can be deleted)
        const group = this.groups.find(g => g.id === this.selectedGroup?.groupId);
        const isCustomGroup = group?.isCustom === true;

        // Generate week-over-week chart data
        const weekData = this._getWeekOverWeekData(this.selectedTransactions);
        const weekChartHtml = this._generateWeekChartHtml(weekData);

        const transactionsHtml = this.selectedTransactions.length > 0
            ? this.selectedTransactions.map(tx => `
                <div class="transaction-row">
                    <div class="tx-icon">${this._getCategoryIcon(tx.category)}</div>
                    <div class="tx-details">
                        <div class="tx-merchant">${tx.merchant}</div>
                        <div class="tx-meta">${this._formatDate(tx.date)} · ${tx.category}</div>
                    </div>
                    <div class="tx-amount">${this._formatCurrency(tx.amount)}</div>
                </div>
            `).join('')
            : '<div class="no-transactions">No transactions found</div>';

        const categoryBreakdownHtml = this.selectedCategories.map(cat => `
            <div class="category-row">
                <span class="cat-icon">${this._getCategoryIcon(cat.id)}</span>
                <span class="cat-name">${cat.name}</span>
                <span class="cat-amount">${this._formatCurrency(cat.amount)}</span>
            </div>
        `).join('');

        // Delete button only for custom groups
        const deleteButtonHtml = isCustomGroup ? `
            <div class="modal-footer-actions">
                <button class="btn btn-danger" id="delete-group-btn">
                    🗑️ Delete Group
                </button>
            </div>
        ` : '';

        overlay.innerHTML = `
            <div class="modal-container">
                <div class="modal-header">
                    <div class="modal-title-section">
                        <h2 class="modal-title">${this.selectedGroup?.groupName || 'Group'} Details</h2>
                        <p class="modal-subtitle">Total: ${this._formatCurrency(this.selectedGroup?.totalSpent || 0)}</p>
                    </div>
                    <button class="modal-close-btn" id="modal-close-btn">✕</button>
                </div>

                <div class="modal-body">
                    ${weekChartHtml}

                    <div class="section">
                        <h3 class="section-title">Category Breakdown</h3>
                        <div class="category-breakdown">
                            ${categoryBreakdownHtml}
                        </div>
                    </div>

                    <div class="section">
                        <h3 class="section-title">Transactions (${this.selectedTransactions.length})</h3>
                        <div class="transactions-list">
                            ${transactionsHtml}
                        </div>
                    </div>
                </div>

                ${deleteButtonHtml}
            </div>
        `;

        overlay.classList.remove('hidden');

        // Re-attach close event
        const closeBtn = overlay.querySelector('#modal-close-btn');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.closeModal());
        }

        // Delete button event (only exists for custom groups)
        const deleteBtn = overlay.querySelector('#delete-group-btn');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', () => this.handleDeleteGroup());
        }

        // Close on overlay click
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                this.closeModal();
            }
        });
    }

    render() {
        // Sort groups: default groups first (in original order), then custom groups alphabetically
        const defaultGroups = this.groups.filter(g => !g.isCustom);
        const customGroups = this.groups
            .filter(g => g.isCustom)
            .sort((a, b) => a.name.localeCompare(b.name));
        const sortedGroups = [...defaultGroups, ...customGroups];

        // Generate chart components for each group
        const chartsHtml = sortedGroups.map(group => `
            <finsite-category-chart data-group-id="${group.id}"></finsite-category-chart>
        `).join('');

        this.shadowRoot.innerHTML = `
            <style>
                * {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                }

                :host {
                    display: block;
                    width: 100%;
                    height: 100%;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                }

                .categories-container {
                    display: flex;
                    flex-direction: column;
                    gap: 1.5rem;
                    padding: 2rem;
                    height: 100%;
                    overflow-y: auto;
                }

                .page-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }

                .page-title {
                    font-size: 1.75rem;
                    font-weight: 700;
                    color: #f1f5f9;
                    margin: 0;
                }

                .page-subtitle {
                    font-size: 0.875rem;
                    color: #64748b;
                    margin-top: 0.25rem;
                }

                .charts-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                    gap: 1.25rem;
                }

                .add-group-card {
                    background: #1e293b;
                    border-radius: 0.75rem;
                    padding: 1.25rem;
                    border: 2px dashed #334155;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    min-height: 240px;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }

                .add-group-card:hover {
                    border-color: #3b82f6;
                    background: rgba(59, 130, 246, 0.05);
                }

                .add-icon {
                    width: 3rem;
                    height: 3rem;
                    border-radius: 50%;
                    background: rgba(59, 130, 246, 0.15);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 1.5rem;
                    color: #3b82f6;
                    margin-bottom: 0.75rem;
                }

                .add-text {
                    font-size: 0.875rem;
                    color: #64748b;
                    font-weight: 500;
                }

                /* Modal Styles */
                .modal-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0, 0, 0, 0.7);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 1000;
                    backdrop-filter: blur(4px);
                }

                .modal-overlay.hidden {
                    display: none;
                }

                .modal-container {
                    background: #1e293b;
                    border-radius: 1rem;
                    padding: 1.5rem;
                    width: 100%;
                    max-width: 700px;
                    max-height: 85vh;
                    border: 1px solid #334155;
                    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
                    animation: modalSlideIn 0.2s ease-out;
                    display: flex;
                    flex-direction: column;
                }

                @keyframes modalSlideIn {
                    from {
                        opacity: 0;
                        transform: translateY(-20px) scale(0.95);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0) scale(1);
                    }
                }

                .modal-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    margin-bottom: 1.25rem;
                    padding-bottom: 1rem;
                    border-bottom: 1px solid #334155;
                }

                .modal-title {
                    font-size: 1.25rem;
                    font-weight: 600;
                    color: #f1f5f9;
                    margin: 0;
                }

                .modal-subtitle {
                    font-size: 0.875rem;
                    color: #10b981;
                    margin-top: 0.25rem;
                    font-weight: 600;
                }

                .modal-close-btn {
                    background: none;
                    border: none;
                    color: #64748b;
                    font-size: 1.5rem;
                    cursor: pointer;
                    padding: 0;
                    line-height: 1;
                }

                .modal-close-btn:hover {
                    color: #f1f5f9;
                }

                .modal-body {
                    overflow-y: auto;
                    flex: 1;
                }

                .section {
                    margin-bottom: 1.5rem;
                }

                .section:last-child {
                    margin-bottom: 0;
                }

                .section-title {
                    font-size: 0.875rem;
                    font-weight: 600;
                    color: #94a3b8;
                    margin-bottom: 0.75rem;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                }

                /* Week-over-Week Chart Styles */
                .week-chart-container {
                    background: #0f172a;
                    border-radius: 0.5rem;
                    padding: 1rem;
                }

                .week-chart-wrapper {
                    display: flex;
                    align-items: stretch;
                    margin-bottom: 1rem;
                }

                .y-axis {
                    display: flex;
                    flex-direction: column;
                    justify-content: space-between;
                    padding-right: 0.5rem;
                    padding-bottom: 2.5rem;
                    min-width: 45px;
                    text-align: right;
                }

                .y-axis-label {
                    font-size: 0.65rem;
                    color: #64748b;
                    line-height: 1;
                }

                .week-chart {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-end;
                    height: 160px;
                    flex: 1;
                    padding: 0 0.5rem;
                    border-bottom: 1px solid #334155;
                    border-left: 1px solid #334155;
                }

                .chart-day {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    flex: 1;
                }

                .chart-bars {
                    display: flex;
                    align-items: flex-end;
                    height: 120px;
                    width: 100%;
                    justify-content: center;
                }

                .bar-group {
                    display: flex;
                    gap: 4px;
                    align-items: flex-end;
                    height: 100%;
                }

                .bar {
                    width: 18px;
                    min-height: 2px;
                    border-radius: 3px 3px 0 0;
                    transition: height 0.3s ease;
                    cursor: pointer;
                }

                .bar:hover {
                    opacity: 0.8;
                }

                .bar-this-week {
                    background: linear-gradient(to top, #3b82f6, #60a5fa);
                }

                .bar-last-week {
                    background: linear-gradient(to top, #475569, #64748b);
                }

                .chart-day-label {
                    font-size: 0.7rem;
                    color: #94a3b8;
                    margin-top: 0.5rem;
                    text-transform: uppercase;
                    font-weight: 500;
                }

                .day-change {
                    font-size: 0.65rem;
                    font-weight: 600;
                    margin-top: 0.25rem;
                    padding: 0.125rem 0.25rem;
                    border-radius: 0.25rem;
                }

                .day-change.change-up {
                    color: #ef4444;
                }

                .day-change.change-down {
                    color: #10b981;
                }

                .day-change.neutral {
                    color: #64748b;
                }

                .chart-legend {
                    display: flex;
                    justify-content: center;
                    gap: 1.5rem;
                    margin-bottom: 0.75rem;
                }

                .legend-item {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                }

                .legend-color {
                    width: 12px;
                    height: 12px;
                    border-radius: 2px;
                }

                .legend-this-week {
                    background: linear-gradient(to right, #3b82f6, #60a5fa);
                }

                .legend-last-week {
                    background: linear-gradient(to right, #475569, #64748b);
                }

                .legend-label {
                    font-size: 0.75rem;
                    color: #94a3b8;
                }

                .legend-value {
                    font-size: 0.75rem;
                    font-weight: 600;
                    color: #f1f5f9;
                }

                .chart-stats {
                    display: flex;
                    flex-direction: column;
                    gap: 0.375rem;
                    padding-top: 0.75rem;
                    border-top: 1px solid #334155;
                }

                .stat-item {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                }

                .stat-icon {
                    font-size: 0.875rem;
                }

                .stat-text {
                    font-size: 0.75rem;
                    color: #94a3b8;
                }

                .stat-text.change-up {
                    color: #ef4444;
                }

                .stat-text.change-down {
                    color: #10b981;
                }

                .category-breakdown {
                    display: flex;
                    flex-direction: column;
                    gap: 0.5rem;
                }

                .category-row {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    padding: 0.625rem 0.75rem;
                    background: #0f172a;
                    border-radius: 0.5rem;
                }

                .cat-icon {
                    font-size: 1rem;
                }

                .cat-name {
                    flex: 1;
                    font-size: 0.875rem;
                    color: #f1f5f9;
                }

                .cat-amount {
                    font-size: 0.875rem;
                    font-weight: 600;
                    color: #10b981;
                }

                .transactions-list {
                    display: flex;
                    flex-direction: column;
                    gap: 0.5rem;
                    max-height: 300px;
                    overflow-y: auto;
                }

                .transaction-row {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    padding: 0.75rem;
                    background: #0f172a;
                    border-radius: 0.5rem;
                    transition: background 0.15s ease;
                }

                .transaction-row:hover {
                    background: #1e293b;
                }

                .tx-icon {
                    width: 2.25rem;
                    height: 2.25rem;
                    border-radius: 0.5rem;
                    background: rgba(59, 130, 246, 0.15);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 1rem;
                }

                .tx-details {
                    flex: 1;
                    min-width: 0;
                }

                .tx-merchant {
                    font-size: 0.875rem;
                    font-weight: 500;
                    color: #f1f5f9;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }

                .tx-meta {
                    font-size: 0.75rem;
                    color: #64748b;
                    margin-top: 0.125rem;
                }

                .tx-amount {
                    font-size: 0.875rem;
                    font-weight: 600;
                    color: #ef4444;
                }

                .no-transactions {
                    text-align: center;
                    padding: 2rem;
                    color: #64748b;
                    font-size: 0.875rem;
                }

                /* Add Group Modal Styles */
                .add-group-modal-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0, 0, 0, 0.7);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 1000;
                    backdrop-filter: blur(4px);
                }

                .add-group-modal-overlay.hidden {
                    display: none;
                }

                .add-group-modal {
                    max-width: 520px;
                }

                .form-group {
                    margin-bottom: 1.25rem;
                }

                .form-label {
                    display: block;
                    font-size: 0.875rem;
                    font-weight: 600;
                    color: #f1f5f9;
                    margin-bottom: 0.5rem;
                }

                .form-help {
                    font-size: 0.75rem;
                    color: #64748b;
                    margin-bottom: 0.5rem;
                }

                .form-input {
                    width: 100%;
                    padding: 0.75rem 1rem;
                    background: #0f172a;
                    border: 1px solid #334155;
                    border-radius: 0.5rem;
                    color: #f1f5f9;
                    font-size: 0.875rem;
                    transition: border-color 0.2s ease;
                }

                .form-input:focus {
                    outline: none;
                    border-color: #3b82f6;
                }

                .form-input::placeholder {
                    color: #64748b;
                }

                .categories-selection {
                    max-height: 200px;
                    overflow-y: auto;
                    background: #0f172a;
                    border-radius: 0.5rem;
                    padding: 0.5rem;
                }

                .category-group {
                    margin-bottom: 0.75rem;
                }

                .category-group:last-child {
                    margin-bottom: 0;
                }

                .category-group-label {
                    font-size: 0.7rem;
                    font-weight: 600;
                    color: #64748b;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    padding: 0.25rem 0.5rem;
                    margin-bottom: 0.25rem;
                }

                .category-checkboxes {
                    display: flex;
                    flex-direction: column;
                    gap: 0.25rem;
                }

                .checkbox-item {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 0.5rem;
                    border-radius: 0.375rem;
                    cursor: pointer;
                    transition: background 0.15s ease;
                }

                .checkbox-item:hover {
                    background: rgba(59, 130, 246, 0.1);
                }

                .checkbox-item input[type="checkbox"] {
                    width: 1rem;
                    height: 1rem;
                    accent-color: #3b82f6;
                    cursor: pointer;
                }

                .checkbox-icon {
                    font-size: 0.875rem;
                }

                .checkbox-label {
                    flex: 1;
                    font-size: 0.8rem;
                    color: #f1f5f9;
                }

                .checkbox-amount {
                    font-size: 0.75rem;
                    color: #64748b;
                }

                .new-subcategories-list {
                    display: flex;
                    flex-direction: column;
                    gap: 0.5rem;
                    margin-bottom: 0.75rem;
                }

                .new-subcategory-row {
                    display: flex;
                    gap: 0.5rem;
                    align-items: center;
                }

                .new-subcategory-row .form-input {
                    flex: 1;
                }

                .remove-subcategory-btn {
                    width: 2rem;
                    height: 2rem;
                    border-radius: 0.375rem;
                    background: rgba(239, 68, 68, 0.15);
                    border: none;
                    color: #ef4444;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 0.875rem;
                    transition: background 0.15s ease;
                }

                .remove-subcategory-btn:hover {
                    background: rgba(239, 68, 68, 0.25);
                }

                .add-subcategory-btn {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 0.5rem 0.75rem;
                    background: rgba(59, 130, 246, 0.15);
                    border: 1px dashed #3b82f6;
                    border-radius: 0.5rem;
                    color: #3b82f6;
                    font-size: 0.8rem;
                    font-weight: 500;
                    cursor: pointer;
                    transition: all 0.15s ease;
                }

                .add-subcategory-btn:hover {
                    background: rgba(59, 130, 246, 0.25);
                }

                .btn-icon {
                    font-size: 1rem;
                    line-height: 1;
                }

                .modal-footer {
                    display: flex;
                    justify-content: flex-end;
                    gap: 0.75rem;
                    padding-top: 1rem;
                    margin-top: 0.5rem;
                    border-top: 1px solid #334155;
                }

                .btn {
                    padding: 0.625rem 1.25rem;
                    border-radius: 0.5rem;
                    font-size: 0.875rem;
                    font-weight: 500;
                    cursor: pointer;
                    transition: all 0.15s ease;
                }

                .btn-secondary {
                    background: #334155;
                    border: none;
                    color: #f1f5f9;
                }

                .btn-secondary:hover {
                    background: #475569;
                }

                .btn-primary {
                    background: #3b82f6;
                    border: none;
                    color: white;
                }

                .btn-primary:hover {
                    background: #2563eb;
                }

                .btn-danger {
                    background: rgba(239, 68, 68, 0.15);
                    border: 1px solid #ef4444;
                    color: #ef4444;
                }

                .btn-danger:hover {
                    background: rgba(239, 68, 68, 0.25);
                }

                .modal-footer-actions {
                    padding-top: 1rem;
                    margin-top: 0.5rem;
                    border-top: 1px solid #334155;
                    display: flex;
                    justify-content: flex-end;
                }

                /* Responsive design */
                @media (max-width: 768px) {
                    .categories-container {
                        padding: 1rem;
                    }

                    .page-title {
                        font-size: 1.5rem;
                    }

                    .charts-grid {
                        grid-template-columns: 1fr;
                    }

                    .modal-container {
                        margin: 1rem;
                        max-height: calc(100vh - 2rem);
                    }
                }
            </style>

            <div class="categories-container">
                <div class="page-header">
                    <div>
                        <h1 class="page-title">Categories</h1>
                        <p class="page-subtitle">View spending breakdown by group</p>
                    </div>
                </div>

                <div class="charts-grid">
                    ${chartsHtml}
                    <div class="add-group-card" id="add-group-btn">
                        <div class="add-icon">+</div>
                        <span class="add-text">Add New Group</span>
                    </div>
                </div>
            </div>

            <!-- Modal for transaction details -->
            <div class="modal-overlay hidden" id="modal-overlay"></div>

            <!-- Modal for adding new group -->
            <div class="add-group-modal-overlay hidden" id="add-group-modal-overlay"></div>
        `;
    }

    setupEventListeners() {
        // Listen for group selection from child charts
        this.shadowRoot.addEventListener('group-selected', (event) => {
            const groupData = event.detail;
            console.log(`📂 Group selected: ${groupData.groupName} (${groupData.groupId})`);
            this.openModal(groupData);
        });

        // Add group button - opens the Add Group modal
        const addGroupBtn = this.shadowRoot.querySelector('#add-group-btn');
        if (addGroupBtn) {
            addGroupBtn.addEventListener('click', () => {
                console.log('➕ Add new group clicked');
                this.openAddGroupModal();
            });
        }
    }
}

customElements.define('finsite-categories', FinSiteCategories);
