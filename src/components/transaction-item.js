/**
 * Transaction Item Web Component for FinSite
 */
class FinSiteTransactionItem extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });

        // Transaction data properties
        this.transactionData = null;
    }

    // Define observed attributes for property changes
    static get observedAttributes() {
        return ['transaction-data'];
    }

    connectedCallback() {
        this.render();
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (name === 'transaction-data' && newValue) {
            this.transactionData = JSON.parse(newValue);
            this.render();
        }
    }

    // Method to set transaction data programmatically
    setTransactionData(data) {
        this.transactionData = data;
        this.render();
    }

    render() {
        let iconClass;
        if (!this.transactionData) return;

        const transaction = this.transactionData;
        const isPositive = transaction.amount > 0;

        // Determine icon class based on transaction status
        if (transaction.status === 'Pending') {
            iconClass = 'pending';
        } else if (isPositive) {
            iconClass = 'income';
        } else {
            iconClass = 'expense';
        }

        this.shadowRoot.innerHTML = `
            <style>
                /* Reset-aware styles for shadow DOM */
                * {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                }

                :host {
                    display: block;
                    width: 100%;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                }

                .transaction-item {
                    display: flex;
                    align-items: center;
                    padding: 0.875rem 1.5rem;
                    border-bottom: 0.0625rem solid #333;
                    transition: background-color 0.2s ease;
                    background: #2a2a2a;
                }

                .transaction-item:hover {
                    background: #333;
                }

                .transaction-icon {
                    width: 2rem;
                    height: 2rem;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 0.875rem;
                    margin-right: 0.875rem;
                    flex-shrink: 0;
                    color: #ffffff;
                    font-weight: bold;
                }

                .transaction-icon.expense {
                    background: #ef4444;
                }

                .transaction-icon.income {
                    background: #10b981;
                }

                .transaction-icon.pending {
                    background: #6b7280;
                }

                .transaction-details {
                    flex: 1;
                    min-width: 0;
                }

                .transaction-name {
                    font-size: 0.875rem;
                    font-weight: 500;
                    color: #ffffff;
                    margin-bottom: 0.125rem;
                }

                .transaction-meta {
                    font-size: 0.75rem;
                    color: #9ca3af;
                    display: flex;
                    gap: 0.375rem;
                    flex-wrap: wrap;
                }

                .transaction-amount {
                    font-size: 0.875rem;
                    font-weight: 600;
                    margin-right: 1rem;
                    flex-shrink: 0;
                }

                .transaction-amount.positive {
                    color: #10b981;
                }

                .transaction-amount.negative {
                    color: #ffffff;
                }

                .transaction-date {
                    font-size: 0.75rem;
                    color: #9ca3af;
                    flex-shrink: 0;
                }

                .transaction-status {
                    font-size: 0.75rem;
                    padding: 0.125rem 0.375rem;
                    border-radius: 0.25rem;
                    font-weight: 500;
                    margin-left: 0.5rem;
                }

                .status-pending {
                    background: rgba(107, 114, 128, 0.2);
                    color: #9ca3af;
                }
            </style>
            
            <div class="transaction-item">
                <div class="transaction-icon ${iconClass}">
                    ${transaction.icon}
                </div>
                <div class="transaction-details">
                    <div class="transaction-name">${transaction.name}</div>
                    <div class="transaction-meta">
                        <span>${transaction.account}</span>
                        <span>${transaction.type}</span>
                    </div>
                </div>
                <div class="transaction-amount ${isPositive ? 'positive' : 'negative'}">
                    ${isPositive ? '+' : '-'}$${Math.abs(transaction.amount).toLocaleString()}
                </div>
                <div class="transaction-date">${transaction.date}</div>
                ${transaction.status === 'Pending' ? '<div class="transaction-status status-pending">(Pending)</div>' : ''}
            </div>
        `;
    }
}

// Define the custom element
customElements.define('finsite-transaction-item', FinSiteTransactionItem);

export { FinSiteTransactionItem };
