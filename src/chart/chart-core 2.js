/**
 * Chart Core Module for FinSite
 * 
 * 
 * 
 * This module:
 * 1. Lazy-loads Chart.js only when needed (on dashboard render)
 * 2. Registers only the components we actually use
 * 3. Applies global defaults in one place
 * 4. Exports factory functions for creating dashboard charts
 * 
 * 
 * We use string labels for the X-axis, not a time scale,
 * so the date adapter is intentionally not loaded.
 */

// Module state
let _chartInstance = null;
let _isInitialized = false;
let _initPromise = null;

/**
 * Global Chart.js defaults for FinSite
 */
const CHART_DEFAULTS = {
    font: {
        family: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        size: 12
    },
    color: '#94a3b8',
    animation: {
        duration: 400
    },
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: {
            display: false
        },
        tooltip: {
            backgroundColor: 'rgba(15, 23, 42, 0.95)',
            titleColor: '#ffffff',
            bodyColor: '#e2e8f0',
            borderColor: '#334155',
            borderWidth: 1,
            cornerRadius: 8,
            padding: 12
        }
    }
};

/**
 * Color palette for bar charts
 */
export const CHART_COLORS = [
    '#3b82f6', // Blue
    '#10b981', // Green
    '#f59e0b', // Amber
    '#8b5cf6', // Purple
    '#ef4444', // Red
    '#06b6d4', // Cyan
    '#ec4899'  // Pink
];

/**
 * Dynamically load a script and return a promise
 * @param {string} src - Script source URL
 * @returns {Promise<void>}
 */
function loadScript(src) {
    return new Promise((resolve, reject) => {
        // Check if script already loaded
        if (document.querySelector(`script[src="${src}"]`)) {
            resolve();
            return;
        }

        const script = document.createElement('script');
        script.src = src;
        script.async = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
        document.head.appendChild(script);
    });
}

/**
 * Initialize Chart.js with required components
 * Uses dynamic script loading for lazy loading
 * @returns {Promise<typeof Chart>} The configured Chart constructor
 */
export async function initChartCore() {
    // Return cached instance if already initialized
    if (_isInitialized && _chartInstance) {
        return _chartInstance;
    }

    // If Chart.js is already available globally, use it
    if (typeof Chart !== 'undefined') {
        _applyDefaults(Chart);
        _chartInstance = Chart;
        _isInitialized = true;
        console.log('📊 Chart.js already loaded, using existing instance');
        return _chartInstance;
    }

    // Prevent multiple concurrent initializations
    if (_initPromise) {
        return _initPromise;
    }

    _initPromise = _doInit();
    return _initPromise;
}

/**
 * Internal initialization logic
 * Loads Chart.js via script injection (no date adapter - OPTIMIZATION C)
 */
async function _doInit() {
    try {
        // Determine the base path for Chart.js files
        // This works whether we're in /src/ or /src/chart/
        const basePath = new URL('../../ChartJS/', import.meta.url).href;
        
        // Load only Chart.js core (no date adapter needed - OPTIMIZATION C)
        await loadScript(`${basePath}chart.umd.min.js`);
        
        // Wait for Chart to be available on window
        await new Promise((resolve, reject) => {
            let attempts = 0;
            const maxAttempts = 50; // 5 seconds max
            const check = () => {
                if (typeof Chart !== 'undefined') {
                    resolve();
                } else if (++attempts > maxAttempts) {
                    reject(new Error('Chart.js failed to initialize'));
                } else {
                    setTimeout(check, 100);
                }
            };
            check();
        });

        // Apply global defaults
        _applyDefaults(Chart);

        _chartInstance = Chart;
        _isInitialized = true;
        
        console.log('📊 Chart core initialized (lazy loaded, no date adapter)');
        return Chart;
        
    } catch (error) {
        console.error('Failed to initialize Chart.js:', error);
        _initPromise = null;
        throw error;
    }
}

/**
 * Apply global defaults to Chart.js
 * @param {typeof Chart} Chart 
 */
function _applyDefaults(Chart) {
    // Font defaults
    Chart.defaults.font.family = CHART_DEFAULTS.font.family;
    Chart.defaults.font.size = CHART_DEFAULTS.font.size;
    Chart.defaults.color = CHART_DEFAULTS.color;
    
    // Animation defaults
    Chart.defaults.animation.duration = CHART_DEFAULTS.animation.duration;
    
    // Layout defaults
    Chart.defaults.responsive = CHART_DEFAULTS.responsive;
    Chart.defaults.maintainAspectRatio = CHART_DEFAULTS.maintainAspectRatio;
    
    // Plugin defaults
    Chart.defaults.plugins.legend.display = CHART_DEFAULTS.plugins.legend.display;
    Object.assign(Chart.defaults.plugins.tooltip, CHART_DEFAULTS.plugins.tooltip);
}

/**
 * Check if Chart.js is available (either via module or global)
 * @returns {typeof Chart | null}
 */
export function getChart() {
    if (_chartInstance) return _chartInstance;
    if (typeof Chart !== 'undefined') return Chart;
    return null;
}

/**
 * Check if chart core is initialized
 * @returns {boolean}
 */
export function isInitialized() {
    return _isInitialized || typeof Chart !== 'undefined';
}

// ============================================================
// CHART FACTORY FUNCTIONS
// ============================================================

/**
 * Create a line chart configuration for spending over time
 * @param {Object} options
 * @param {string[]} options.labels - Month labels
 * @param {number[]} options.values - Spending values
 * @param {CanvasRenderingContext2D} options.ctx - Canvas context (for gradient)
 * @param {boolean} options.animate - Whether to animate
 * @returns {Object} Chart.js configuration object
 */
export function createLineChartConfig({ labels, values, ctx, animate = true }) {
    // Create gradient for line fill
    const gradient = ctx.createLinearGradient(0, 0, 0, 200);
    gradient.addColorStop(0, 'rgba(59, 130, 246, 0.3)');
    gradient.addColorStop(1, 'rgba(59, 130, 246, 0)');

    return {
        type: 'line',
        data: {
            labels,
            datasets: [{
                data: values,
                borderColor: '#3b82f6',
                backgroundColor: gradient,
                borderWidth: 2.5,
                fill: true,
                tension: 0.4,
                pointRadius: 4,
                pointBackgroundColor: '#3b82f6',
                pointBorderColor: '#1e293b',
                pointBorderWidth: 2,
                pointHoverRadius: 6,
                pointHoverBackgroundColor: '#3b82f6',
                pointHoverBorderColor: '#ffffff',
                pointHoverBorderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: {
                duration: animate ? 400 : 0
            },
            interaction: {
                mode: 'index',
                intersect: false
            },
            scales: {
                // OPTIMIZATION C: Categorical X axis (no time scale)
                x: {
                    type: 'category',
                    grid: {
                        color: 'rgba(148, 163, 184, 0.1)',
                        drawBorder: false
                    },
                    ticks: {
                        color: '#64748b',
                        font: { size: 11 }
                    }
                },
                y: {
                    grid: {
                        color: 'rgba(148, 163, 184, 0.1)',
                        drawBorder: false
                    },
                    ticks: {
                        color: '#64748b',
                        font: { size: 11 },
                        callback: (value) => '$' + formatCurrency(value)
                    },
                    beginAtZero: false
                }
            },
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: (context) => `Spent: $${formatCurrency(context.raw)}`
                    }
                }
            }
        }
    };
}

/**
 * Create a bar chart configuration for spending by category
 * @param {Object} options
 * @param {string[]} options.labels - Category labels
 * @param {number[]} options.values - Spending values
 * @param {boolean} options.animate - Whether to animate
 * @returns {Object} Chart.js configuration object
 */
export function createBarChartConfig({ labels, values, animate = true }) {
    return {
        type: 'bar',
        data: {
            labels,
            datasets: [{
                data: values,
                backgroundColor: labels.map((_, i) => CHART_COLORS[i % CHART_COLORS.length]),
                borderRadius: 6,
                borderSkipped: false,
                barThickness: 32,
                maxBarThickness: 40
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            indexAxis: 'y',
            animation: {
                duration: animate ? 400 : 0
            },
            scales: {
                x: {
                    grid: {
                        color: 'rgba(148, 163, 184, 0.1)',
                        drawBorder: false
                    },
                    ticks: {
                        color: '#64748b',
                        font: { size: 11 },
                        callback: (value) => '$' + formatCurrency(value)
                    },
                    beginAtZero: true
                },
                y: {
                    type: 'category',
                    grid: {
                        display: false
                    },
                    ticks: {
                        color: '#e2e8f0',
                        font: { size: 11, weight: '500' }
                    }
                }
            },
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: (context) => `$${formatCurrency(context.raw)}`
                    }
                }
            }
        }
    };
}

/**
 * Format currency value for display
 * @param {number} value 
 * @returns {string}
 */
export function formatCurrency(value) {
    if (value >= 1000) {
        return value.toLocaleString(undefined, {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        });
    }
    return value.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}
