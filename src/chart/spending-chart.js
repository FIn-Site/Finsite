/**
 * @fileoverview Spending Chart Web Component for FinSite.
 * Chart.js integration component for dashboard visualizations.
 * @module components/spending-chart
 */

/**
 * Spending Chart Web Component.
 *
 * Performance Optimizations:
 * - Uses chart-core module for lazy Chart.js loading
 * - Categorical X-axis (no date adapter needed)
 * - Animation disabled for bulk updates
 *
 * Features:
 * - Line chart for 6-month spending trend
 * - Bar chart for top 5 groups breakdown
 * - KPI metrics display
 *
 * This is the ONLY component that directly interacts with Chart.js.
 *
 * @extends HTMLElement
 */
import {
    initChartCore,
    getChart,
    createLineChartConfig,
    createBarChartConfig,
    formatCurrency,
} from './chart-core.js';
import { createPrefixedLogger } from '../utils/debugService.js';

// Prefixed logger for spending chart component
const log = createPrefixedLogger('[SpendingChart]');

class FinSiteSpendingChart extends HTMLElement {
    /**
     * Initialize spending chart component.
     * Sets up Shadow DOM, chart instances, and default data.
     */
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });

        // Chart.js instances - one per chart type
        this._lineChart = null;
        this._barChart = null;
        this._Chart = null; // Chart.js constructor reference

        // Default chart data structure (pre-aggregated from model)
        this.chartData = {
            // Time series for line chart (money x time)
            timeSeries: {
                labels: [],
                values: [],
            },
            // Group breakdown for bar chart (money x group)
            groupBreakdown: {
                labels: [],
                values: [],
            },
            // KPI metrics
            metrics: {
                thisMonth: 0,
                lastMonth: 0,
                percentChange: 0,
                sixMonthAvg: 0,
            },
        };

        // Animation settings
        this._isHeavyUpdate = false;
        this._isInitializing = false;
    }

    static get observedAttributes() {
        return ['data'];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (name === 'data' && newValue) {
            try {
                this.updateChartData(JSON.parse(newValue));
            } catch (e) {
                console.warn('Invalid chart data provided:', e);
            }
        }
    }

    connectedCallback() {
        this.render();
        // Initialize charts asynchronously (lazy load Chart.js)
        this._initChartsAsync();
    }

    disconnectedCallback() {
    // Properly destroy Chart.js instances to prevent memory leaks
        this._destroyCharts();
    }

    /**
     * Async initialization - lazy loads Chart.js via chart-core module
     */
    async _initChartsAsync() {
        if (this._isInitializing) return;
        this._isInitializing = true;

        try {
            // Lazy load Chart.js through chart-core module
            this._Chart = await initChartCore();

            // Create charts now that Chart.js is loaded
            requestAnimationFrame(() => {
                this._initCharts();
            });
        } catch (error) {
            console.error('Failed to initialize charts:', error);

            // Fallback: try global Chart if available
            const globalChart = getChart();
            if (globalChart) {
                this._Chart = globalChart;
                requestAnimationFrame(() => {
                    this._initCharts();
                });
            }
        } finally {
            this._isInitializing = false;
        }
    }

    /**
     * Update chart data from external source (model via view)
     * @param {Object} newData - Pre-aggregated chart data
     * @param {boolean} isHeavyUpdate - True for bulk updates (CSV import), disables animation
     */
    updateChartData(newData, isHeavyUpdate = false) {
        this._isHeavyUpdate = isHeavyUpdate;

        // Merge new data with existing
        if (newData.timeSeries) {
            this.chartData.timeSeries = { ...this.chartData.timeSeries, ...newData.timeSeries };
        }
        if (newData.groupBreakdown) {
            this.chartData.groupBreakdown = { ...this.chartData.groupBreakdown, ...newData.groupBreakdown };
        }
        if (newData.metrics) {
            this.chartData.metrics = { ...this.chartData.metrics, ...newData.metrics };
        }

        // Update existing chart instances without recreating
        this._updateCharts();

        // Update metric displays
        this._updateMetricsDisplay();
    }

    render() {
        const { metrics } = this.chartData;
        const percentChange = metrics.percentChange || 0;
        // For spending: negative change (spent less) = good (green), positive change (spent more) = bad (red)
        const changeClass = percentChange < 0 ? 'positive' : 'negative';
        const changeSymbol = percentChange > 0 ? '+' : '';

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

                .charts-container {
                    display: flex;
                    flex-direction: column;
                    gap: 1.5rem;
                    height: 100%;
                }

                .chart-card {
                    background: var(--bg-card, #1e293b);
                    border-radius: 1rem;
                    padding: 1.5rem;
                    border: 1px solid var(--border-color, #334155);
                    box-shadow: var(--shadow-sm);
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    min-height: 280px;
                    transition: background 0.3s ease, border-color 0.3s ease;
                }

                .chart-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    margin-bottom: 1rem;
                }

                .chart-title {
                    font-size: 1rem;
                    font-weight: 600;
                    color: var(--text-primary, #f1f5f9);
                    margin: 0;
                }

                .chart-subtitle {
                    font-size: 0.75rem;
                    color: var(--text-muted, #64748b);
                    margin-top: 0.25rem;
                }

                .chart-area {
                    flex: 1;
                    position: relative;
                    min-height: 200px;
                }

                .chart-canvas {
                    width: 100% !important;
                    height: 100% !important;
                }

                .metrics-row {
                    display: grid;
                    grid-template-columns: repeat(4, 1fr);
                    gap: 1rem;
                    margin-bottom: 1.5rem;
                }

                .metric-card {
                    background: var(--bg-card, #1e293b);
                    border-radius: 0.75rem;
                    padding: 1rem 1.25rem;
                    border: 1px solid var(--border-color, #334155);
                    box-shadow: var(--shadow-sm);
                    transition: background 0.3s ease, border-color 0.3s ease;
                }

                .metric-value {
                    font-size: 1.5rem;
                    font-weight: 700;
                    color: var(--text-primary, #f1f5f9);
                    margin-bottom: 0.25rem;
                }

                .metric-value.positive {
                    color: var(--positive-color, #10b981);
                }

                .metric-value.negative {
                    color: var(--negative-color, #ef4444);
                }

                .metric-label {
                    font-size: 0.75rem;
                    color: var(--text-muted, #64748b);
                    font-weight: 500;
                }

                .charts-grid {
                    display: flex;
                    flex-direction: column;
                    gap: 1.5rem;
                    flex: 1;
                }

                .chart-card.line-chart {
                    min-height: 320px;
                }

                .chart-card.bar-chart {
                    min-height: 280px;
                }

                /* Responsive adjustments */
                @media (max-width: 1024px) {
                    .metrics-row {
                        grid-template-columns: repeat(2, 1fr);
                    }
                }

                @media (max-width: 640px) {
                    .metrics-row {
                        grid-template-columns: 1fr;
                    }
                    
                    .chart-card {
                        min-height: 240px;
                    }
                }
            </style>

            <div class="charts-container">
                <!-- Metrics Row -->
                <div class="metrics-row">
                    <div class="metric-card">
                        <div class="metric-value ${changeClass}" id="metric-change">
                            ${changeSymbol}${percentChange.toFixed(1)}%
                        </div>
                        <div class="metric-label">vs Last Month</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-value" id="metric-last-month">
                            $${this._formatCurrency(metrics.lastMonth)}
                        </div>
                        <div class="metric-label">Last Month</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-value" id="metric-avg">
                            $${this._formatCurrency(metrics.sixMonthAvg)}
                        </div>
                        <div class="metric-label">6-Month Average</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-value" id="metric-transactions-week">
                            ${metrics.transactionsThisWeek || 0}
                        </div>
                        <div class="metric-label">Transactions This Week</div>
                    </div>
                </div>

                <!-- Charts Grid -->
                <div class="charts-grid">
                    <!-- Line Chart: Money x Time -->
                    <div class="chart-card line-chart">
                        <div class="chart-header">
                            <div>
                                <h3 class="chart-title">Spending Over Time</h3>
                                <p class="chart-subtitle">Monthly spending trend</p>
                            </div>
                        </div>
                        <div class="chart-area">
                            <canvas id="line-chart" class="chart-canvas"></canvas>
                        </div>
                    </div>

                    <!-- Bar Chart: Money x Group -->
                    <div class="chart-card bar-chart">
                        <div class="chart-header">
                            <div>
                                <h3 class="chart-title">Spending by Group</h3>
                                <p class="chart-subtitle">All groups with transactions</p>
                            </div>
                        </div>
                        <div class="chart-area">
                            <canvas id="bar-chart" class="chart-canvas"></canvas>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Initialize Chart.js instances
     * Only called once per component lifecycle
     * Uses chart-core module instead of global Chart
     */
    _initCharts() {
    // Use module-provided Chart or fallback to global
        const Chart = this._Chart || getChart();

        if (!Chart) {
            console.error('Chart.js not available. Initialization failed.');
            return;
        }

        this._createLineChart(Chart);
        this._createBarChart(Chart);

        log('📊 Chart.js instances created via chart-core module');
    }

    /**
     * Create the line chart (money x time)
     * @param {typeof Chart} Chart - Chart.js constructor
     */
    _createLineChart(Chart) {
        const canvas = this.shadowRoot.querySelector('#line-chart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const { labels, values } = this.chartData.timeSeries;

        // Use chart-core factory for configuration
        const config = createLineChartConfig({
            labels,
            values,
            ctx,
            animate: !this._isHeavyUpdate,
        });

        this._lineChart = new Chart(ctx, config);
    }

    /**
     * Create the bar chart (money x group)
     * @param {typeof Chart} Chart - Chart.js constructor
     */
    _createBarChart(Chart) {
        const canvas = this.shadowRoot.querySelector('#bar-chart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const { labels, values } = this.chartData.groupBreakdown;

        // Use chart-core factory for configuration
        const config = createBarChartConfig(labels, values, {
            animate: !this._isHeavyUpdate,
            title: 'Spending by Group',
        });

        this._barChart = new Chart(ctx, config);
    }

    /**
     * Update existing chart instances with new data
     * Does NOT recreate charts - mutates data and calls update()
     */
    _updateCharts() {
        const animationDuration = this._isHeavyUpdate ? 0 : 400;

        // Update line chart
        if (this._lineChart) {
            const { labels, values } = this.chartData.timeSeries;
            this._lineChart.data.labels = labels;
            this._lineChart.data.datasets[0].data = values;
            this._lineChart.options.animation.duration = animationDuration;
            this._lineChart.update();
        }

        // Update bar chart
        if (this._barChart) {
            const { labels, values } = this.chartData.groupBreakdown;
            this._barChart.data.labels = labels;
            this._barChart.data.datasets[0].data = values;
            this._barChart.options.animation.duration = animationDuration;
            this._barChart.update();
        }

        // Reset heavy update flag
        this._isHeavyUpdate = false;
    }

    /**
     * Update the metrics display without re-rendering
     */
    _updateMetricsDisplay() {
        const { metrics } = this.chartData;

        const changeEl = this.shadowRoot.querySelector('#metric-change');
        const lastMonthEl = this.shadowRoot.querySelector('#metric-last-month');
        const avgEl = this.shadowRoot.querySelector('#metric-avg');
        const transactionsWeekEl = this.shadowRoot.querySelector('#metric-transactions-week');

        if (changeEl) {
            // For spending: negative change (spent less) = good (green), positive change (spent more) = bad (red)
            const changeClass = metrics.percentChange < 0 ? 'positive' : 'negative';
            const changeSymbol = metrics.percentChange > 0 ? '+' : '';
            changeEl.textContent = `${changeSymbol}${metrics.percentChange.toFixed(1)}%`;
            changeEl.className = `metric-value ${changeClass}`;
        }

        if (lastMonthEl) {
            lastMonthEl.textContent = `$${formatCurrency(metrics.lastMonth)}`;
        }

        if (avgEl) {
            avgEl.textContent = `$${formatCurrency(metrics.sixMonthAvg)}`;
        }

        if (transactionsWeekEl) {
            transactionsWeekEl.textContent = metrics.transactionsThisWeek || 0;
        }
    }

    /**
     * Destroy Chart.js instances to prevent memory leaks
     */
    _destroyCharts() {
        if (this._lineChart) {
            this._lineChart.destroy();
            this._lineChart = null;
        }
        if (this._barChart) {
            this._barChart.destroy();
            this._barChart = null;
        }
        log('📊 Chart.js instances destroyed');
    }

    /**
     * Format currency value for display
     * Uses chart-core module's formatCurrency
     * @param {number} value - Amount in dollars
     * @returns {string} Formatted string
     */
    _formatCurrency(value) {
        return formatCurrency(value);
    }

    /**
     * Handle resize events
     */
    resize() {
        if (this._lineChart) {
            this._lineChart.resize();
        }
        if (this._barChart) {
            this._barChart.resize();
        }
    }
}

// Define the custom element
customElements.define('finsite-spending-chart', FinSiteSpendingChart);

export { FinSiteSpendingChart };
