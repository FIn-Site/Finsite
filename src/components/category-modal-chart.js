/**
 * Modal bar chart component for category breakdowns.
 * Renders a money × category bar chart using chart-core utilities.
 */
import { initChartCore, createBarChartConfig } from '../chart/chart-core.js';

class FinSiteCategoryModalChart extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.categories = [];
        this.title = this.getAttribute('title') || 'Spending by Category';
        this._chart = null;
    }

    connectedCallback() {
        this.render();
        this._renderChart();
    }

    disconnectedCallback() {
        this._destroyChart();
    }

    setCategories(categories) {
        this.categories = Array.isArray(categories) ? categories : [];
        this._renderChart();
    }

    render() {
        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: block;
                }

                .chart-wrapper {
                    background: var(--bg-card, #1e293b);
                    border-radius: 0.75rem;
                    padding: 0.75rem;
                    border: 1px solid var(--border-color, #334155);
                    min-height: 220px;
                }

                canvas {
                    width: 100% !important;
                    height: 200px !important;
                }

                .empty-state {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: #64748b;
                    font-size: 0.875rem;
                    height: 200px;
                }
            </style>
            <div class="chart-wrapper">
                <canvas id="modalChartCanvas"></canvas>
            </div>
        `;
    }

    _destroyChart() {
        if (this._chart) {
            this._chart.destroy();
            this._chart = null;
        }
    }

    async _renderChart() {
        // Ensure DOM is ready
        let canvas = this.shadowRoot.querySelector('#modalChartCanvas');
        if (!canvas) {
            this.render();
            canvas = this.shadowRoot.querySelector('#modalChartCanvas');
        }

        // Destroy any existing chart
        this._destroyChart();

        const safeCategories = Array.isArray(this.categories) ? this.categories : [];
        if (safeCategories.length === 0) {
            const wrapper = this.shadowRoot.querySelector('.chart-wrapper');
            if (wrapper) {
                wrapper.innerHTML = '<div class="empty-state">No category data</div>';
            }
            return;
        }

        // Ensure canvas exists (could be replaced when showing empty state)
        const wrapper = this.shadowRoot.querySelector('.chart-wrapper');
        if (wrapper && !wrapper.querySelector('canvas')) {
            wrapper.innerHTML = '<canvas id="modalChartCanvas"></canvas>';
            canvas = this.shadowRoot.querySelector('#modalChartCanvas');
        }

        const labels = safeCategories.map((cat) => cat.name);
        const values = safeCategories.map((cat) => Math.abs(Number(cat.amount)) || 0);

        const Chart = await initChartCore();
        const ctx = canvas.getContext('2d');

        const config = createBarChartConfig(labels, values, {
            title: this.title,
            indexAxis: 'x',
            datasetOptions: {
                barThickness: 32,
                maxBarThickness: 44,
                borderRadius: 6,
            },
            options: {
                scales: {
                    x: {
                        type: 'category',
                        grid: { display: false },
                        ticks: {
                            color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary').trim() || '#94a3b8',
                            font: { size: 11, weight: '500' },
                            maxRotation: 45,
                            callback: (value) => {
                                const label = typeof value === 'string' ? value : labels[value] ?? '';
                                return String(label).substring(0, 14);
                            },
                        },
                    },
                    y: {
                        grid: {
                            color: 'rgba(148, 163, 184, 0.1)',
                            drawBorder: false,
                        },
                        ticks: {
                            color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary').trim() || '#94a3b8',
                            font: { size: 11 },
                            callback: (value) => `$${value.toLocaleString()}`,
                        },
                        beginAtZero: true,
                    },
                },
                plugins: {
                    tooltip: {
                        displayColors: false,
                    },
                },
            },
        });

        this._chart = new Chart(ctx, config);
    }
}

customElements.define('finsite-category-modal-chart', FinSiteCategoryModalChart);
