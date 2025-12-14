// Import chart components
import '../chart/category-chart.js';
import './category-modal-chart.js';

import { buildCategoryAggregates, buildGroupBreakdown } from '../utils/categoryAggregator.js';
import { getCategoryIcon, getGroupIcon, CUSTOM_GROUP_ICONS } from '../utils/icons.js';
import { createPrefixedLogger } from '../utils/debugService.js';

// Prefixed logger for categories component
const log = createPrefixedLogger('[Categories]');

/**
 * Categories Web Component for FinSite
 * Page container that displays spending breakdown by groups
 * Each group is rendered as a category-chart component
 * Includes modal for viewing transactions when a group is clicked
 */
class FinSiteCategories extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });

        this._model = null;
        this._connected = false;

        // Groups and categories data
        this.groups = [];
        this.categories = [];
        this.transactions = [];

        this._isLoading = true;

        // Aggregated views
        this.groupBreakdowns = [];
        this.categoriesWithAmounts = [];

        // Modal state
        this.isModalOpen = false;
        this.selectedGroup = null;
        this.selectedTransactions = [];
        this.selectedCategories = [];

        // Add group modal state
        this.isAddGroupModalOpen = false;
        this.newGroupName = '';
        this.selectedIcon = '📁'; // Default icon for new groups
        this.selectedCategoryIds = new Set();

        // Add category modal state
        this.isAddCategoryModalOpen = false;
        this.newCategoryName = '';
        this.newCategoryIcon = '📝'; // Default icon for new categories
        this.selectedGroupsForCategory = new Set();

        // Event binding flag to prevent multiple listeners
        this._eventsBound = false;
    }

    connectedCallback() {
        this._connected = true;
        // Render immediately with placeholders/loading state
        this.render();
        this.setupEventListeners();
        // Hydrate asynchronously without blocking first paint
        this._hydrateFromModel();
    }

    async _hydrateFromModel() {
        try {
            await this.loadFromModel();
        } catch (error) {
            console.error('❌ Error hydrating categories from model:', error);
            this._isLoading = false;
            this.render();
            this.setupEventListeners();
        }
    }

    /**
     * Expose model setter for parent components (controller/view) to inject the shared model
     */
    set model(model) {
        this._model = model;
        if (this._connected) {
            this.loadFromModel();
        }
    }

    get model() {
        return this._model;
    }

    /**
     * Load groups, categories, and transactions from the injected model
     * Model remains the single source of truth; no direct storage access here
     * Falls back to default groups/categories if none exist yet
     */
    async loadFromModel() {
        this._isLoading = true;
        if (!this._model) {
            console.warn('Categories component has no model reference');
            this._isLoading = false;
            this.render();
            this.setupEventListeners();
            return;
        }

        try {
            let groups = this._model.getGroups?.() || [];
            let categories = this._model.getCategories?.() || [];
            const transactions = this._model.getTransactions?.() || [];

            // Fall back to default config if no groups/categories exist
            if (groups.length === 0 || categories.length === 0) {
                const defaults = this._model.getDefaultConfig?.();
                if (defaults) {
                    if (groups.length === 0) {
                        groups = defaults.defaultGroups || [];
                    }
                    if (categories.length === 0) {
                        categories = defaults.defaultCategories || [];
                    }
                    log('Using default groups/categories (no data yet)');
                }
            }

            this.groups = groups;
            this.categories = categories;
            this.transactions = transactions;
            this._refreshAggregates();
        } catch (error) {
            console.error('❌ Error loading data from model:', error);
        } finally {
            this._isLoading = false;
            this.render();
            this.setupEventListeners();
            // Delay chart update to ensure DOM is ready
            requestAnimationFrame(() => {
                this.updateChartComponents();
            });
        }
    }

    /**
     * Set data from external source (MVC model)
     * @param {Object} data - { groups, categories, transactions }
     */
    setData(data) {
        this._isLoading = false;
        if (data.groups) {
            this.groups = data.groups;
        }
        if (data.categories) {
            this.categories = data.categories;
        }
        if (data.transactions) {
            this.transactions = data.transactions;
        }
        this._refreshAggregates();
        this.render();
        this.setupEventListeners();
        requestAnimationFrame(() => this.updateChartComponents());
    }

    /**
     * Refresh aggregated views using the model (preferred) or local data.
     * Falls back to default groups/categories if none exist yet.
     */
    _refreshAggregates() {
        let groups = this._model?.getGroups?.() || this.groups;
        let categories = this._model?.getCategories?.() || this.categories;
        const transactions = this._model?.getTransactions?.() || this.transactions;

        // Fall back to default config if no groups/categories exist
        if ((groups.length === 0 || categories.length === 0) && this._model?.getDefaultConfig) {
            const defaults = this._model.getDefaultConfig();
            if (defaults) {
                if (groups.length === 0) {
                    groups = defaults.defaultGroups || [];
                }
                if (categories.length === 0) {
                    categories = defaults.defaultCategories || [];
                }
            }
        }

        const source = { groups, categories, transactions };

        const { breakdowns, categoriesWithAmounts } = buildCategoryAggregates(source);
        this.groupBreakdowns = breakdowns;
        this.categoriesWithAmounts = categoriesWithAmounts;

        // Keep local snapshots in sync for form usage
        this.groups = source.groups;
        this.categories = source.categories;
        this.transactions = source.transactions;
    }

    /**
     * Get a group breakdown using the model or local aggregates.
     * @param {string} groupId
     * @returns {Object|null}
     */
    _getGroupBreakdown(groupId) {
        if (!groupId) return null;
        if (this._model?.getCategoryBreakdownByGroup) {
            return this._model.getCategoryBreakdownByGroup(groupId);
        }
        return this.groupBreakdowns.find((b) => b.groupId === groupId)
            || buildGroupBreakdown({
                groups: this.groups,
                categories: this.categories,
                transactions: this.transactions,
                groupId,
            });
    }

    /**
     * Update child chart components with data
     * Passes isCustom flag to each chart for delete button visibility
     */
    updateChartComponents() {
        const charts = this.shadowRoot.querySelectorAll('finsite-category-chart');
        charts.forEach((chart) => {
            const groupId = chart.getAttribute('data-group-id');
            const breakdown = this.groupBreakdowns.find((b) => b.groupId === groupId);
            const group = this.groups.find((g) => g.id === groupId);
            if (breakdown) {
                // Include isCustom flag for delete button visibility
                chart.setData({
                    ...breakdown,
                    isCustom: group?.isCustom === true,
                });
            }
        });
    }

    /**
     * Open modal with group details
     */
    openModal(groupId) {
        const breakdown = this._getGroupBreakdown(groupId);
        if (!breakdown) return;

        this.selectedGroup = breakdown;
        this.selectedTransactions = breakdown.transactions || [];
        this.selectedCategories = breakdown.categories || [];
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
     * Handle deleting a custom group (from modal)
     * Shows confirmation and emits request-delete-group event for controller to handle
     */
    handleDeleteGroup() {
        const groupId = this.selectedGroup?.groupId;
        const groupName = this.selectedGroup?.groupName;

        if (!groupId) {
            console.error('No group selected for deletion');
            return;
        }

        this._requestDeleteGroup(groupId, groupName);
    }

    /**
     * Request deletion of a custom group
     * Shows confirmation dialog and emits event for controller to handle
     * @param {string} groupId - The group ID to delete
     * @param {string} groupName - The group name (for display)
     */
    _requestDeleteGroup(groupId, groupName) {
        if (!groupId) return;

        // Confirm deletion
        const confirmed = confirm(
            `Are you sure you want to delete the group "${groupName}"?\n\n`
            + 'This will:\n'
            + '• Remove the custom group from the Categories page\n'
            + '• Move its categories back to "Uncategorized"\n'
            + '• Your transactions will NOT be deleted',
        );

        if (!confirmed) return;

        // Emit event for controller to handle deletion
        this.dispatchEvent(new CustomEvent('request-delete-group', {
            detail: { groupId, groupName },
            bubbles: true,
            composed: true,
        }));

        log(`📤 Requested deletion of group: ${groupName} (${groupId})`);
    }

    /**
     * Called by controller after successful group deletion
     * Refreshes the view and closes any open modal
     */
    onGroupDeleted(groupId) {
        log(`✅ Group deleted successfully: ${groupId}`);

        // Close modal if it was open for this group
        if (this.isModalOpen && this.selectedGroup?.groupId === groupId) {
            this.closeModal();
        }

        // Refresh from model (controller should have already updated the model)
        this.loadFromModel();
    }

    /**
     * Handle deleting a custom group (legacy method for direct model access)
     * @deprecated Use _requestDeleteGroup for event-based flow
     */
    async handleDeleteGroupDirect() {
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
            if (!this._model?.deleteGroup) {
                throw new Error('Model does not support group deletion');
            }

            console.log('🗑️ Deleting group:', groupId);
            console.log('Groups before delete:', this._model.getGroups?.().map((g) => g.id));

            await this._model.deleteGroup(groupId);

            console.log('Groups after delete:', this._model.getGroups?.().map((g) => g.id));

            // Dispatch event for controller awareness
            this.dispatchEvent(new CustomEvent('group-deleted', {
                detail: { groupId, groupName },
                bubbles: true,
                composed: true,
            }));

            // Clear selected group state
            this.selectedGroup = null;
            this.selectedTransactions = [];
            this.selectedCategories = [];

            // Close modal
            this.closeModal();

            // Clear local group cache and force fresh load from model
            this.groups = [];
            this.categories = [];
            this.groupBreakdowns = [];
            this.categoriesWithAmounts = [];

            // Re-sync from model with fresh data
            await this.loadFromModel();

            log(`✅ Successfully deleted group: ${groupName}`);
        } catch (error) {
            console.error('❌ Failed to delete group:', error);
            alert('Failed to delete group. Please try again.');
        }
    }

    /**
     * Handle removing a category from the current group
     * @param {string} categoryId - The category ID to remove from group
     */
    async handleDeleteCategory(categoryId) {
        if (!categoryId) {
            console.error('No category ID provided for removal');
            return;
        }

        const category = this.categories.find((c) => c.id === categoryId);
        const categoryName = category?.name || categoryId;
        const currentGroupId = this.selectedGroup?.groupId;
        const currentGroup = this.groups.find((g) => g.id === currentGroupId);

        if (!currentGroup) {
            console.error('No group selected');
            return;
        }

        // Confirm removal
        const confirmed = confirm(
            `Remove "${categoryName}" from "${currentGroup.name}"?\n\n`
            + 'This will remove the category from this group only.\n'
            + 'If the category has no other groups, it will become uncategorized.',
        );

        if (!confirmed) return;

        try {
            if (!this._model) {
                throw new Error('Model not available');
            }

            // If this is a custom group, remove from categoryIds array
            if (currentGroup.isCustom) {
                const updatedGroup = {
                    ...currentGroup,
                    categoryIds: (currentGroup.categoryIds || []).filter((id) => id !== categoryId),
                };
                await this._model.addGroup(updatedGroup);
                log(`📂 Removed category ${categoryName} from custom group: ${currentGroup.name}`);
            } else if (category.groupId === currentGroupId) {
                // If this is the category's primary group (default group), move to uncategorized
                const updatedCategory = { ...category, groupId: 'uncategorized' };
                await this._model.addCategory(updatedCategory);
                log(`📝 Moved category ${categoryName} to uncategorized`);
            }

            // Dispatch event for controller awareness
            this.dispatchEvent(new CustomEvent('category-removed-from-group', {
                detail: { categoryId, categoryName, groupId: currentGroupId },
                bubbles: true,
                composed: true,
            }));

            // Reload data and reopen the same group modal
            await this.loadFromModel();

            // Reopen the modal for the same group
            this.openModal(currentGroupId);

            log(`✅ Successfully removed category ${categoryName} from group ${currentGroup.name}`);
        } catch (error) {
            console.error('❌ Failed to remove category from group:', error);
            alert('Failed to remove category. Please try again.');
        }
    }

    /**
     * Open the Add Group modal
     */
    openAddGroupModal() {
        this.isAddGroupModalOpen = true;
        this.newGroupName = '';
        this.selectedIcon = CUSTOM_GROUP_ICONS[0]; // Default to first icon
        this.selectedCategoryIds = new Set();
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
     * Open Add Category modal
     */
    openAddCategoryModal() {
        this.isAddCategoryModalOpen = true;
        this.newCategoryName = '';
        this.newCategoryIcon = CUSTOM_GROUP_ICONS[0]; // Default to first icon
        // Set first default group as primary, custom groups as empty
        const defaultGroups = this.groups.filter((g) => !g.isCustom && g.id !== 'uncategorized' && !g.isSystem);
        this.newCategoryPrimaryGroup = defaultGroups.length > 0 ? defaultGroups[0].id : 'expenses';
        this.selectedGroupsForCategory = new Set();
        this.renderAddCategoryModal();
    }

    /**
     * Close Add Category modal
     */
    closeAddCategoryModal() {
        this.isAddCategoryModalOpen = false;
        const overlay = this.shadowRoot.querySelector('.add-category-modal-overlay');
        if (overlay) {
            overlay.classList.add('hidden');
        }
    }

    /**
     * Render the Add Category modal
     */
    renderAddCategoryModal() {
        const overlay = this.shadowRoot.querySelector('.add-category-modal-overlay');
        if (!overlay) return;

        // Build icon picker HTML
        const iconPickerHtml = CUSTOM_GROUP_ICONS.map((icon) => `
            <button type="button" 
                    class="icon-option ${this.newCategoryIcon === icon ? 'selected' : ''}" 
                    data-icon="${icon}">
                ${icon}
            </button>
        `).join('');

        // Build group selection - radio for primary, checkboxes for custom groups only
        const userVisibleGroups = this.groups.filter((g) => g.id !== 'uncategorized' && !g.isSystem);
        const defaultGroups = userVisibleGroups.filter((g) => !g.isCustom);
        const customGroups = userVisibleGroups.filter((g) => g.isCustom);

        const primaryGroupHtml = defaultGroups.map((group) => `
            <label class="radio-label">
                <input type="radio" 
                       name="primary-group"
                       class="primary-group-radio" 
                       data-group-id="${group.id}"
                       ${this.newCategoryPrimaryGroup === group.id ? 'checked' : ''}>
                <span class="radio-text">${getGroupIcon(group.id, group.icon)} ${group.name}</span>
            </label>
        `).join('');

        const customGroupHtml = customGroups.length > 0 ? `
            <div class="form-group">
                <label class="form-label">Also Include in Custom Groups (Optional)</label>
                <p class="form-help">Select custom groups to include this category</p>
                <div class="groups-selection">
                    ${customGroups.map((group) => `
                        <label class="checkbox-label">
                            <input type="checkbox" 
                                   class="group-checkbox" 
                                   data-group-id="${group.id}"
                                   ${this.selectedGroupsForCategory.has(group.id) ? 'checked' : ''}>
                            <span class="checkbox-text">${getGroupIcon(group.id, group.icon)} ${group.name}</span>
                        </label>
                    `).join('')}
                </div>
            </div>
        ` : '';

        overlay.innerHTML = `
            <div class="modal-container add-category-modal">
                <div class="modal-header">
                    <div class="modal-title-section">
                        <h2 class="modal-title">Create New Category</h2>
                        <p class="modal-subtitle">Add a category to organize your transactions</p>
                    </div>
                    <button class="modal-close-btn" id="add-category-modal-close">✕</button>
                </div>

                <div class="modal-body">
                    <form id="add-category-form">
                        <!-- Category Name -->
                        <div class="form-group">
                            <label class="form-label" for="new-category-name">Category Name</label>
                            <input type="text" 
                                   id="new-category-name" 
                                   class="form-input" 
                                   placeholder="e.g., Netflix, Gym Membership, Groceries"
                                   value="${this.newCategoryName}"
                                   autocomplete="off">
                        </div>

                        <!-- Icon Selection -->
                        <div class="form-group">
                            <label class="form-label">Category Icon</label>
                            <p class="form-help">Choose an icon for your category</p>
                            <div class="icon-picker">
                                ${iconPickerHtml}
                            </div>
                        </div>

                        <!-- Primary Group Selection -->
                        <div class="form-group">
                            <label class="form-label">Primary Group</label>
                            <p class="form-help">Select the main group for this category</p>
                            <div class="groups-selection">
                                ${primaryGroupHtml}
                            </div>
                        </div>

                        ${customGroupHtml}

                    </form>
                </div>

                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" id="cancel-add-category">Cancel</button>
                    <button type="button" class="btn btn-primary" id="create-category-btn">Create Category</button>
                </div>
            </div>
        `;

        overlay.classList.remove('hidden');

        // Setup event listeners for the modal
        this.setupAddCategoryModalListeners();
    }

    /**
     * Setup event listeners for Add Category modal
     */
    setupAddCategoryModalListeners() {
        const overlay = this.shadowRoot.querySelector('.add-category-modal-overlay');
        if (!overlay) return;

        // Close button
        const closeBtn = overlay.querySelector('#add-category-modal-close');
        closeBtn?.addEventListener('click', () => this.closeAddCategoryModal());

        // Cancel button
        const cancelBtn = overlay.querySelector('#cancel-add-category');
        cancelBtn?.addEventListener('click', () => this.closeAddCategoryModal());

        // Create button
        const createBtn = overlay.querySelector('#create-category-btn');
        createBtn?.addEventListener('click', () => this.handleCreateCategory());

        // Icon picker buttons
        overlay.querySelectorAll('.icon-option').forEach((btn) => {
            btn.addEventListener('click', (e) => {
                const { icon } = e.target.dataset;
                this.newCategoryIcon = icon;
                // Update UI to show selection
                overlay.querySelectorAll('.icon-option').forEach((b) => b.classList.remove('selected'));
                e.target.classList.add('selected');
            });
        });

        // Primary group radio buttons
        overlay.querySelectorAll('.primary-group-radio').forEach((radio) => {
            radio.addEventListener('change', (e) => {
                if (e.target.checked) {
                    this.newCategoryPrimaryGroup = e.target.dataset.groupId;
                }
            });
        });

        // Custom group checkboxes (additional groups)
        overlay.querySelectorAll('.group-checkbox').forEach((checkbox) => {
            checkbox.addEventListener('change', (e) => {
                const { groupId } = e.target.dataset;
                if (e.target.checked) {
                    this.selectedGroupsForCategory.add(groupId);
                } else {
                    this.selectedGroupsForCategory.delete(groupId);
                }
            });
        });

        // Close on overlay click
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                this.closeAddCategoryModal();
            }
        });

        // Track category name changes
        const nameInput = overlay.querySelector('#new-category-name');
        nameInput?.addEventListener('input', (e) => {
            this.newCategoryName = e.target.value;
        });
    }

    /**
     * Handle form submission for creating a new category
     */
    async handleCreateCategory() {
        const nameInput = this.shadowRoot.querySelector('#new-category-name');
        const categoryName = nameInput?.value.trim();

        if (!categoryName) {
            alert('Please enter a category name');
            return;
        }

        // Generate category ID from name
        const categoryId = categoryName.toLowerCase().replace(/\s+/g, '-');

        // Check if category already exists
        if (this.categories.find((c) => c.id === categoryId)) {
            alert('A category with this name already exists');
            return;
        }

        if (!this._model) {
            console.error('Model not available for creating category');
            return;
        }

        // Use selected primary group (from radio buttons)
        const primaryGroupId = this.newCategoryPrimaryGroup || 'expenses';
        const categoryIcon = this.newCategoryIcon || CUSTOM_GROUP_ICONS[0];

        // Create the new category with primary groupId
        const newCategory = {
            id: categoryId,
            groupId: primaryGroupId,
            name: categoryName,
            icon: categoryIcon,
            amount: 0,
        };

        try {
            // Save category to database
            await this._model.addCategory(newCategory);
            log(`💾 Saved new category: ${categoryName} with icon: ${categoryIcon} to group: ${primaryGroupId}`);

            // Add category to any selected custom groups
            const selectedCustomGroups = Array.from(this.selectedGroupsForCategory);
            for (const groupId of selectedCustomGroups) {
                const group = this._model.data.groups.find((g) => g.id === groupId);
                if (group && group.isCustom) {
                    // Initialize categoryIds if needed
                    if (!group.categoryIds) {
                        group.categoryIds = [];
                    }
                    // Add category if not already present
                    if (!group.categoryIds.includes(categoryId)) {
                        group.categoryIds.push(categoryId);
                        await this._model.addGroup(group);
                        log(`📂 Added category to custom group: ${group.name}`);
                    }
                }
            }

            // Dispatch event for controller/model
            this.dispatchEvent(new CustomEvent('category-created', {
                detail: { category: newCategory },
                bubbles: true,
                composed: true,
            }));

            // Close modal and reload data
            this.closeAddCategoryModal();
            await this.loadFromModel();
        } catch (error) {
            console.error('❌ Failed to save category via model:', error);
            alert('Failed to create category. Please try again.');
        }
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
        if (this.groups.find((g) => g.id === groupId)) {
            alert('A group with this name already exists');
            return;
        }

        // Collect selected category IDs for the custom group
        const selectedCategoryIdsArray = Array.from(this.selectedCategoryIds);

        if (!this._model) {
            console.error('Model not available for creating group');
            return;
        }

        // Create the new group with categoryIds for custom groups
        const newGroup = {
            id: groupId,
            name: groupName,
            icon: this.selectedIcon, // Custom icon selected by user
            isCustom: true,
            categoryIds: selectedCategoryIdsArray, // Store which categories belong to this custom group
        };

        try {
            await this._model.addGroup(newGroup);
            log(`💾 Saved custom group via model: ${groupName}`);

            // Dispatch event for controller/model
            this.dispatchEvent(new CustomEvent('group-created', {
                detail: {
                    group: newGroup,
                    categories: [],
                },
                bubbles: true,
                composed: true,
            }));

            // Close modal and re-sync
            this.closeAddGroupModal();
            await this.loadFromModel();
        } catch (error) {
            console.error('❌ Failed to save group via model:', error);
        }
    }

    /**
     * Render the Add Group modal
     */
    renderAddGroupModal() {
        const overlay = this.shadowRoot.querySelector('.add-group-modal-overlay');
        if (!overlay) return;

        // Get all unique categories with amounts when available
        const allCategories = this.categoriesWithAmounts.length ? this.categoriesWithAmounts : this.categories;

        // Group categories by their current group for display
        // For custom groups, check categoryIds array; for default groups, check category.groupId
        const categoryGroups = {};
        for (const cat of allCategories) {
            // Check if category is in any custom group
            const customGroup = this.groups.find((g) => g.isCustom && g.categoryIds && g.categoryIds.includes(cat.id));

            if (customGroup) {
                // Category is in a custom group
                const groupName = customGroup.name;
                if (!categoryGroups[groupName]) {
                    categoryGroups[groupName] = [];
                }
                categoryGroups[groupName].push(cat);
            } else {
                // Category is in a default group (by groupId)
                const group = this.groups.find((g) => g.id === cat.groupId);
                const groupName = group?.name || 'UNCATEGORIZED';
                if (!categoryGroups[groupName]) {
                    categoryGroups[groupName] = [];
                }
                categoryGroups[groupName].push(cat);
            }
        }

        // Build category checkboxes grouped by current assignment
        let categoriesHtml = '';
        for (const [groupName, cats] of Object.entries(categoryGroups)) {
            categoriesHtml += `
                <div class="category-group">
                    <div class="category-group-label">${groupName}</div>
                    <div class="category-checkboxes">
                        ${cats.map((cat) => `
                            <label class="checkbox-item">
                                <input type="checkbox" 
                                       class="category-checkbox" 
                                       data-category-id="${cat.id}"
                                       ${this.selectedCategoryIds.has(cat.id) ? 'checked' : ''}>
                                <span class="checkbox-icon">${cat.icon || getCategoryIcon(cat.id)}</span>
                                <span class="checkbox-label">${cat.name}</span>
                                <span class="checkbox-amount">${this._formatCurrency(cat.amount)}</span>
                            </label>
                        `).join('')}
                    </div>
                </div>
            `;
        }

        // Build icon picker HTML
        const iconPickerHtml = CUSTOM_GROUP_ICONS.map((icon) => `
            <button type="button" 
                    class="icon-option ${this.selectedIcon === icon ? 'selected' : ''}" 
                    data-icon="${icon}">
                ${icon}
            </button>
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

                        <!-- Icon Selection -->
                        <div class="form-group">
                            <label class="form-label">Group Icon</label>
                            <p class="form-help">Choose an icon for your group</p>
                            <div class="icon-picker">
                                ${iconPickerHtml}
                            </div>
                        </div>

                        <!-- Select Existing Categories -->
                        <div class="form-group">
                            <label class="form-label">Include Existing Categories</label>
                            <p class="form-help">Select categories to move into this new group</p>
                            <div class="categories-selection">
                                ${categoriesHtml}
                            </div>
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

        // Icon picker buttons
        overlay.querySelectorAll('.icon-option').forEach((btn) => {
            btn.addEventListener('click', (e) => {
                const { icon } = e.target.dataset;
                this.selectedIcon = icon;
                // Update UI to show selection
                overlay.querySelectorAll('.icon-option').forEach((b) => b.classList.remove('selected'));
                e.target.classList.add('selected');
            });
        });

        // Category checkboxes
        overlay.querySelectorAll('.category-checkbox').forEach((checkbox) => {
            checkbox.addEventListener('change', (e) => {
                const { categoryId } = e.target.dataset;
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
    }

    /**
     * Format currency
     */
    _formatCurrency(amount) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
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
     * Format currency in short form for Y-axis labels
     */
    _formatCurrencyShort(amount) {
        if (amount >= 1000) {
            return `$${(amount / 1000).toFixed(1)}k`;
        }
        return `$${Math.round(amount)}`;
    }

    /**
     * Render the modal content
     */
    renderModal() {
        const overlay = this.shadowRoot.querySelector('.modal-overlay');
        if (!overlay) return;

        // Check if this is a custom group (can be deleted)
        const group = this.groups.find((g) => g.id === this.selectedGroup?.groupId);
        const isCustomGroup = group?.isCustom === true;

        const transactionsHtml = this.selectedTransactions.length > 0
            ? this.selectedTransactions.map((tx) => {
                // Find the category to get its custom icon if it exists
                const category = this.categories.find((c) => c.id === tx.category);
                const categoryIcon = category?.icon || getCategoryIcon(tx.category);

                return `
                <div class="transaction-row">
                    <div class="tx-icon">${categoryIcon}</div>
                    <div class="tx-details">
                        <div class="tx-merchant">${tx.merchant}</div>
                        <div class="tx-meta">${this._formatDate(tx.date)} · ${tx.category}</div>
                    </div>
                    <div class="tx-amount">${this._formatCurrency(tx.amount)}</div>
                </div>
            `;
            }).join('')
            : '<div class="no-transactions">No transactions found</div>';

        const categoryBreakdownHtml = this.selectedCategories.map((cat) => {
            // Only show delete button for custom groups or if category has a custom icon (user-created)
            const isPresetCategory = !cat.icon && !isCustomGroup;
            const deleteButton = isPresetCategory
                ? '<span class="cat-delete-spacer"></span>'
                : `<button class="cat-delete-btn" data-category-id="${cat.id}" title="Remove from group">🗑️</button>`;

            return `
                <div class="category-row">
                    <span class="cat-icon">${cat.icon || getCategoryIcon(cat.id)}</span>
                    <span class="cat-name">${cat.name}</span>
                    <span class="cat-amount">${this._formatCurrency(cat.amount)}</span>
                    ${deleteButton}
                </div>
            `;
        }).join('');

        // Delete button only for custom groups
        const deleteButtonHtml = isCustomGroup ? `
            <div class="modal-footer-actions">
                <button class="btn btn-danger" id="delete-group-btn">
                    🗑️ Delete Group
                </button>
            </div>
        ` : '';

        overlay.innerHTML = `
            <div class="modal-container group-detail-modal">
                <div class="modal-header">
                    <div class="modal-title-section">
                        <h2 class="modal-title">${this.selectedGroup?.groupName || 'Group'} Details</h2>
                        <p class="modal-subtitle">Total: ${this._formatCurrency(this.selectedGroup?.totalSpent || 0)}</p>
                    </div>
                    <button class="modal-close-btn" id="modal-close-btn">✕</button>
                </div>

                <div class="modal-body">
                    <div class="section">
                        <h3 class="section-title">Spending by Category</h3>
                        <finsite-category-modal-chart id="modal-category-chart" title="Spending by Category"></finsite-category-modal-chart>
                    </div>

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

        // Category delete buttons
        overlay.querySelectorAll('.cat-delete-btn').forEach((btn) => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const { categoryId } = btn.dataset;
                this.handleDeleteCategory(categoryId);
            });
        });

        // Close on overlay click
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                this.closeModal();
            }
        });

        // Pass data into modal chart component
        const modalChart = overlay.querySelector('#modal-category-chart');
        if (modalChart && typeof modalChart.setCategories === 'function') {
            modalChart.setCategories(this.selectedCategories);
        }
    }

    render() {
        // Filter out system/uncategorized groups - they are internal only
        const isUserVisibleGroup = (g) => g.id !== 'uncategorized' && !g.isSystem;

        // Sort groups: default groups first (in original order), then custom groups alphabetically
        const defaultGroups = this.groups.filter((g) => !g.isCustom && isUserVisibleGroup(g));
        const customGroups = this.groups
            .filter((g) => g.isCustom && isUserVisibleGroup(g))
            .sort((a, b) => a.name.localeCompare(b.name));
        const sortedGroups = [...defaultGroups, ...customGroups];

        const loadingIndicator = this._isLoading ? `
            <div class="loading-indicator">Loading categories…</div>
        ` : '';

        // Generate chart components for each group or show placeholder
        const chartsHtml = sortedGroups.length > 0
            ? sortedGroups.map((group) => `
                <finsite-category-chart data-group-id="${group.id}"></finsite-category-chart>
            `).join('')
            : `<div class="loading-card">${this._isLoading ? 'Loading categories…' : 'No categories available'}</div>`;

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
                    color: var(--text-primary, #f1f5f9);
                    margin: 0;
                }

                .page-subtitle {
                    font-size: 0.875rem;
                    color: var(--text-muted, #64748b);
                    margin-top: 0.25rem;
                }

                .header-actions {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                }

                .btn-create-category {
                    background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
                    color: white;
                    border: none;
                    padding: 0.625rem 1.25rem;
                    border-radius: 0.5rem;
                    font-size: 0.875rem;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    box-shadow: 0 2px 4px rgba(59, 130, 246, 0.2);
                }

                .btn-create-category:hover {
                    transform: translateY(-1px);
                    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
                }

                .btn-create-category:active {
                    transform: translateY(0);
                }

                .loading-indicator {
                    color: var(--text-secondary, #94a3b8);
                    font-size: 0.875rem;
                }

                .loading-card {
                    background: var(--bg-primary, #0f172a);
                    border: 1px dashed var(--border-color, #334155);
                    border-radius: 0.75rem;
                    padding: 1.5rem;
                    color: var(--text-secondary, #94a3b8);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    min-height: 160px;
                }

                .charts-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                    gap: 1.25rem;
                }

                .add-group-card {
                    background: var(--bg-card, #1e293b);
                    border-radius: 0.75rem;
                    padding: 1.25rem;
                    border: 2px dashed var(--border-color, #334155);
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
                    color: var(--text-muted, #64748b);
                    font-weight: 500;
                }

                /* Modal Styles */
                .modal-overlay,
                .add-group-modal-overlay,
                .add-category-modal-overlay {
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

                .modal-overlay.hidden,
                .add-group-modal-overlay.hidden,
                .add-category-modal-overlay.hidden {
                    display: none;
                }

                .modal-container {
                    background: var(--bg-card, #1e293b);
                    border-radius: 1rem;
                    padding: 1.5rem;
                    width: 100%;
                    max-width: 700px;
                    max-height: 85vh;
                    border: 1px solid var(--border-color, #334155);
                    box-shadow: var(--shadow-lg, 0 25px 50px -12px rgba(0, 0, 0, 0.5));
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
                    border-bottom: 1px solid var(--border-color, #334155);
                }

                .modal-title {
                    font-size: 1.25rem;
                    font-weight: 600;
                    color: var(--text-primary, #f1f5f9);
                    margin: 0;
                }

                .modal-subtitle {
                    font-size: 0.875rem;
                    color: var(--text-primary, #f1f5f9);
                    margin-top: 0.25rem;
                    font-weight: 600;
                }

                .modal-close-btn {
                    background: none;
                    border: none;
                    color: var(--text-muted, #64748b);
                    font-size: 1.5rem;
                    cursor: pointer;
                    padding: 0;
                    line-height: 1;
                }

                .modal-close-btn:hover {
                    color: var(--text-primary, #f1f5f9);
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
                    color: var(--text-secondary, #94a3b8);
                    margin-bottom: 0.75rem;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                }

                /* Week-over-Week Chart Styles */
                .week-chart-container {
                    background: var(--bg-primary, #0f172a);
                    border-radius: 0.5rem;
                    padding: 1rem;
                }

                .week-chart-canvas-wrapper {
                    height: 180px;
                    margin-bottom: 0.5rem;
                    position: relative;
                }

                .week-chart-canvas-wrapper canvas {
                    width: 100% !important;
                    height: 100% !important;
                }

                .daily-badges {
                    display: flex;
                    justify-content: space-around;
                    margin-bottom: 1rem;
                    padding: 0 2rem;
                }

                .badge-day {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    flex: 1;
                }

                .badge-day-label {
                    font-size: 0.65rem;
                    color: var(--text-muted, #64748b);
                    margin-bottom: 0.25rem;
                    text-transform: uppercase;
                }

                .day-change {
                    font-size: 0.65rem;
                    font-weight: 600;
                    padding: 0.125rem 0.25rem;
                    border-radius: 0.25rem;
                    min-height: 1.25rem;
                }

                .day-change.change-up {
                    color: var(--negative-color, #ef4444);
                }

                .day-change.change-down {
                    color: var(--positive-color, #10b981);
                }

                .day-change.neutral {
                    color: var(--text-muted, #64748b);
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
                    color: var(--text-secondary, #94a3b8);
                }

                .legend-value {
                    font-size: 0.75rem;
                    font-weight: 600;
                    color: var(--text-primary, #f1f5f9);
                }

                .chart-stats {
                    display: flex;
                    flex-direction: column;
                    gap: 0.375rem;
                    padding-top: 0.75rem;
                    border-top: 1px solid var(--border-color, #334155);
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
                    color: var(--text-secondary, #94a3b8);
                }

                .stat-text.change-up {
                    color: var(--negative-color, #ef4444);
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
                    background: var(--bg-primary);
                    border-radius: 0.5rem;
                }

                .cat-icon {
                    font-size: 1rem;
                }

                .cat-name {
                    flex: 1;
                    font-size: 0.875rem;
                    color: var(--text-primary);
                }

                .cat-amount {
                    font-size: 0.875rem;
                    font-weight: 600;
                    color: var(--text-primary, #f1f5f9);
                }

                .cat-delete-btn {
                    background: none;
                    border: none;
                    padding: 0.25rem 0.5rem;
                    cursor: pointer;
                    font-size: 1rem;
                    opacity: 0.6;
                    transition: opacity 0.15s ease, transform 0.15s ease;
                    color: #ef4444;
                }

                .cat-delete-btn:hover {
                    opacity: 1;
                    transform: scale(1.1);
                }

                .cat-delete-spacer {
                    display: inline-block;
                    width: 2.25rem;
                    height: 1.5rem;
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
                    background: var(--bg-primary);
                    border-radius: 0.5rem;
                    transition: background 0.15s ease;
                }

                .transaction-row:hover {
                    background: var(--bg-hover);
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
                    color: var(--text-primary);
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
                    color: var(--text-primary, #f1f5f9);
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

                .add-group-modal,
                .add-category-modal,
                .group-detail-modal {
                    max-width: 520px;
                }

                .form-group {
                    margin-bottom: 1.25rem;
                }

                .form-label {
                    display: block;
                    font-size: 0.875rem;
                    font-weight: 600;
                    color: var(--text-primary);
                    margin-bottom: 0.5rem;
                }

                .form-help {
                    font-size: 0.75rem;
                    color: #64748b;
                    margin-bottom: 0.5rem;
                }

                .form-input,
                .form-select {
                    width: 100%;
                    padding: 0.75rem 1rem;
                    background: var(--bg-primary);
                    border: 1px solid var(--border-color);
                    border-radius: 0.5rem;
                    color: var(--text-primary);
                    font-size: 0.875rem;
                    transition: border-color 0.2s ease;
                }

                .form-input:focus,
                .form-select:focus {
                    outline: none;
                    border-color: #3b82f6;
                }

                .form-input::placeholder {
                    color: #64748b;
                }

                .form-select {
                    cursor: pointer;
                }

                .icon-picker {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 0.5rem;
                    background: var(--bg-primary);
                    border-radius: 0.5rem;
                    padding: 0.75rem;
                    max-height: 150px;
                    overflow-y: auto;
                }

                .icon-option {
                    width: 2.5rem;
                    height: 2.5rem;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 1.25rem;
                    background: var(--bg-card);
                    border: 2px solid transparent;
                    border-radius: 0.5rem;
                    cursor: pointer;
                    transition: all 0.15s ease;
                }

                .icon-option:hover {
                    background: var(--bg-hover);
                    border-color: var(--border-color);
                }

                .icon-option.selected {
                    background: rgba(59, 130, 246, 0.15);
                    border-color: #3b82f6;
                    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.3);
                }

                .categories-selection,
                .groups-selection {
                    max-height: 200px;
                    overflow-y: auto;
                    background: var(--bg-primary);
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
                    color: var(--text-primary);
                }

                /* Group radio buttons and checkboxes in category modal */
                .groups-selection .radio-label,
                .groups-selection .checkbox-label {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 0.5rem;
                    border-radius: 0.375rem;
                    cursor: pointer;
                    transition: background 0.15s ease;
                }

                .groups-selection .radio-label:hover,
                .groups-selection .checkbox-label:hover {
                    background: rgba(59, 130, 246, 0.1);
                }

                .groups-selection .primary-group-radio,
                .groups-selection .group-checkbox {
                    width: 1rem;
                    height: 1rem;
                    accent-color: #3b82f6;
                    cursor: pointer;
                }

                .groups-selection .radio-text,
                .groups-selection .checkbox-text {
                    font-size: 0.875rem;
                    color: var(--text-primary);
                }

                .checkbox-amount {
                    font-size: 0.75rem;
                    color: #64748b;
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
                    border-top: 1px solid var(--border-color);
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
                    background: var(--bg-hover);
                    border: none;
                    color: var(--text-primary);
                }

                .btn-secondary:hover {
                    background: var(--border-color);
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
                    border-top: 1px solid var(--border-color);
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
                    <div class="header-actions">
                        <button class="btn-create-category" id="btn-create-category">
                            Create a New Category
                        </button>
                        ${loadingIndicator}
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

            <!-- Modal for adding new category -->
            <div class="add-category-modal-overlay hidden" id="add-category-modal-overlay"></div>
        `;
    }

    setupEventListeners() {
        // Only bind shadowRoot-level listeners once per component instance
        if (!this._eventsBound) {
            // Listen for group selection from child charts
            this.shadowRoot.addEventListener('group-selected', (event) => {
                const { groupId, groupName } = event.detail || {};
                if (!groupId) return;
                log(`📂 Group selected: ${groupName || 'Group'} (${groupId})`);
                this.openModal(groupId);
            });

            // Listen for delete requests from child chart cards (custom groups only)
            this.shadowRoot.addEventListener('request-delete-group', (event) => {
                const { groupId, groupName } = event.detail || {};
                if (!groupId) return;
                log(`🗑️ Delete requested for group: ${groupName || 'Group'} (${groupId})`);
                this._requestDeleteGroup(groupId, groupName);
            });

            this._eventsBound = true;
        }

        // Add group button - rebind after each render (element is recreated)
        const addGroupBtn = this.shadowRoot.querySelector('#add-group-btn');
        if (addGroupBtn) {
            addGroupBtn.addEventListener('click', () => {
                log('➕ Add new group clicked');
                this.openAddGroupModal();
            });
        }

        // Add category button - rebind after each render (element is recreated)
        const addCategoryBtn = this.shadowRoot.querySelector('#btn-create-category');
        if (addCategoryBtn) {
            addCategoryBtn.addEventListener('click', () => {
                log('➕ Create category clicked');
                this.openAddCategoryModal();
            });
        }
    }
}

customElements.define('finsite-categories', FinSiteCategories);
