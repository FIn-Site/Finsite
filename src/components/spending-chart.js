/**
 * Spending Chart Web Component for FinSite
 * Reusable chart component with line graph and metrics
 */
class FinSiteSpendingChart extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        
        // Default data
        this.chartData = {
            labels: ['Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'],
            values: [1650, 1720, 1580, 1820, 1780, 1890, 1847],
            metrics: {
                thisMonth: '$1,847',
                vsLastMonth: '+12%',
                sixMonthAvg: '$1,456'
            }
        };
        
        // Component properties
        this.width = this.getAttribute('width') || '100%';
        this.height = this.getAttribute('height') || 'auto';
    }

    static get observedAttributes() {
        return ['width', 'height', 'data'];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (name === 'width') this.width = newValue;
        if (name === 'height') this.height = newValue;
        if (name === 'data') {
            try {
                this.chartData = JSON.parse(newValue);
            } catch (e) {
                console.warn('Invalid chart data provided');
            }
        }
        if (this.shadowRoot) this.render();
    }

    connectedCallback() {
        this.render();
        this.setupChart();
    }

    render() {
        this.shadowRoot.innerHTML = `
            <style>
                /* Reset-aware styles */
                * {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                }

                :host {
                    display: block;
                    width: ${this.width};
                    height: ${this.height};
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                }

                .chart-container {
                    background: #2a2a2a;
                    border-radius: 0.75rem;
                    padding: 2rem;
                    border: 0.0625rem solid #444;
                    height: 100%;
                    min-height: 31.25rem;
                    display: flex;
                    flex-direction: column;
                }

                .chart-header {
                    margin-bottom: 24px;
                }

                .chart-title {
                    font-size: 1.5rem;
                    font-weight: 600;
                    color: #ffffff;
                    margin: 0 0 1.5rem 0;
                    text-align: center;
                }

                .chart-area {
                    flex: 1;
                    position: relative;
                    background: #2a2a2a;
                    border-radius: 0.75rem;
                    padding: 2rem;
                    margin-bottom: 1.5rem;
                    min-height: 18.75rem;
                }

                .chart-canvas {
                    width: 100%;
                    height: 100%;
                    display: block;
                }

                .chart-grid {
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    pointer-events: none;
                }

                .metrics-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr 1fr;
                    gap: 12px;
                }

                .metric-card {
                    background: linear-gradient(135deg, #333333 0%, #2a2a2a 100%);
                    border-radius: 0.75rem;
                    padding: 1.5rem;
                    text-align: center;
                    border: 0.0625rem solid #404040;
                    box-shadow: 0 0.25rem 0.5rem rgba(0, 0, 0, 0.2);
                    transition: all 0.2s ease;
                }

                .metric-card:hover {
                    background: linear-gradient(135deg, #3a3a3a 0%, #2f2f2f 100%);
                    box-shadow: 0 0.375rem 0.75rem rgba(0, 0, 0, 0.3);
                    transform: translateY(-0.125rem);
                }

                .metric-value {
                    font-size: 1.375rem;
                    font-weight: 700;
                    margin: 0 0 0.375rem 0;
                    color: #ffffff;
                }

                .metric-value.positive {
                    color: #10b981;
                }

                .metric-value.negative {
                    color: #ef4444;
                }

                .metric-label {
                    font-size: 0.75rem;
                    color: #9ca3af;
                    margin: 0;
                    font-weight: 500;
                }

                .chart-tooltip {
                    position: absolute;
                    background: rgba(0, 0, 0, 0.9);
                    color: white;
                    padding: 0.5rem 0.75rem;
                    border-radius: 0.375rem;
                    font-size: 0.75rem;
                    font-weight: 500;
                    pointer-events: none;
                    opacity: 0;
                    transition: opacity 0.2s ease;
                    z-index: 1000;
                    box-shadow: 0 0.25rem 0.5rem rgba(0, 0, 0, 0.3);
                    white-space: nowrap;
                }

                .chart-tooltip.visible {
                    opacity: 1;
                }

                /* Responsive Design */
                @media (max-width: 768px) {
                    .metrics-grid {
                        grid-template-columns: 1fr;
                        gap: 8px;
                    }
                    
                    .chart-container {
                        padding: 16px;
                    }
                    
                    .metric-card {
                        padding: 12px;
                    }
                }
            </style>

            <div class="chart-container">
                <div class="chart-header">
                    <h3 class="chart-title">Monthly Spending Trend</h3>
                </div>
                
                <div class="chart-area">
                    <canvas class="chart-canvas" id="spending-chart"></canvas>
                    <div class="chart-tooltip" id="tooltip"></div>
                </div>
                
                <div class="metrics-grid">
                    <div class="metric-card">
                        <div class="metric-value">${this.chartData.metrics.thisMonth}</div>
                        <div class="metric-label">This Month</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-value ${this.getMetricClass(this.chartData.metrics.vsLastMonth)}">${this.chartData.metrics.vsLastMonth}</div>
                        <div class="metric-label">vs Last Month</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-value">${this.chartData.metrics.sixMonthAvg}</div>
                        <div class="metric-label">6-Mo Avg</div>
                    </div>
                </div>
            </div>
        `;
    }

    getMetricClass(value) {
        if (value.includes('+')) return 'positive';
        if (value.includes('-')) return 'negative';
        return '';
    }

    setupChart() {
        const canvas = this.shadowRoot.querySelector('#spending-chart');
        const tooltip = this.shadowRoot.querySelector('#tooltip');
        
        console.log('Setting up chart - Canvas:', canvas, 'Tooltip:', tooltip);
        
        if (!canvas) {
            console.error('Canvas not found');
            return;
        }

        if (!tooltip) {
            console.error('Tooltip not found');
            return;
        }

        const ctx = canvas.getContext('2d');
        const rect = canvas.parentElement.getBoundingClientRect();
        
        // Set canvas size
        canvas.width = rect.width - 40; // Account for padding
        canvas.height = rect.height - 40;
        
        console.log('Canvas size set:', canvas.width, 'x', canvas.height);
        
        // Store references for event handling
        this.canvas = canvas;
        this.ctx = ctx;
        this.tooltip = tooltip;
        this.points = [];
        
        this.drawChart(ctx, canvas, tooltip);
        
        // Setup hover events with a small delay to ensure everything is ready
        setTimeout(() => {
            this.setupHoverEvents();
        }, 100);
    }

    drawChart(ctx, canvas, tooltip) {
        const { labels, values } = this.chartData;
        const padding = 40;
        const width = canvas.width;
        const height = canvas.height;
        const chartWidth = width - (padding * 2);
        const chartHeight = height - (padding * 2);

        // Clear canvas
        ctx.clearRect(0, 0, width, height);

        // Draw grid
        this.drawGrid(ctx, padding, chartWidth, chartHeight);

        // Calculate points
        const points = this.calculatePoints(values, labels, padding, chartWidth, chartHeight);
        this.points = points; // Store for hover detection
        
        console.log('Chart points calculated:', this.points);

        // Draw line and points
        this.drawLine(ctx, points);
        this.drawPoints(ctx, points);

        // Draw labels
        this.drawLabels(ctx, labels, padding, chartWidth, height);
        this.drawYAxisLabels(ctx, values, padding, chartHeight);
    }

    drawGrid(ctx, padding, chartWidth, chartHeight) {
        ctx.strokeStyle = '#374151';
        ctx.lineWidth = 1;

        // Vertical grid lines
        for (let i = 0; i <= 6; i++) {
            const x = padding + (i * chartWidth / 6);
            ctx.beginPath();
            ctx.moveTo(x, padding);
            ctx.lineTo(x, padding + chartHeight);
            ctx.stroke();
        }

        // Horizontal grid lines
        for (let i = 0; i <= 4; i++) {
            const y = padding + (i * chartHeight / 4);
            ctx.beginPath();
            ctx.moveTo(padding, y);
            ctx.lineTo(padding + chartWidth, y);
            ctx.stroke();
        }
    }

    calculatePoints(values, labels, padding, chartWidth, chartHeight) {
        const minValue = Math.min(...values);
        const maxValue = Math.max(...values);
        
        // Add padding to the range for better visual spacing
        const roundedMin = Math.floor(minValue / 200) * 200;
        const roundedMax = Math.ceil(maxValue / 200) * 200 + 200; // Add extra bracket
        const valueRange = roundedMax - roundedMin;

        return values.map((value, index) => {
            const x = padding + (index * chartWidth / (labels.length - 1));
            const y = padding + chartHeight - ((value - roundedMin) / valueRange * chartHeight);
            return { x, y, value, label: labels[index] };
        });
    }

    drawLine(ctx, points) {
        // Draw line
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        ctx.beginPath();
        points.forEach((point, index) => {
            if (index === 0) {
                ctx.moveTo(point.x, point.y);
            } else {
                ctx.lineTo(point.x, point.y);
            }
        });
        ctx.stroke();
    }

    drawPoints(ctx, points, highlightIndex = -1) {
        points.forEach((point, index) => {
            ctx.save();
            
            if (index === highlightIndex) {
                // Highlighted point - larger with glow
                ctx.shadowColor = index === points.length - 1 ? '#10b981' : '#3b82f6';
                ctx.shadowBlur = 12;
                ctx.fillStyle = index === points.length - 1 ? '#10b981' : '#3b82f6';
                ctx.beginPath();
                ctx.arc(point.x, point.y, 6, 0, 2 * Math.PI);
                ctx.fill();
                
                // Add outer ring
                ctx.shadowBlur = 0;
                ctx.strokeStyle = index === points.length - 1 ? '#10b981' : '#3b82f6';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(point.x, point.y, 8, 0, 2 * Math.PI);
                ctx.stroke();
            } else {
                // Regular point with glow effect
                ctx.shadowColor = index === points.length - 1 ? '#10b981' : '#3b82f6';
                ctx.shadowBlur = 8;
                ctx.fillStyle = index === points.length - 1 ? '#10b981' : '#3b82f6';
                ctx.beginPath();
                ctx.arc(point.x, point.y, 4, 0, 2 * Math.PI);
                ctx.fill();
            }
            
            ctx.restore();
        });
    }

    drawLabels(ctx, labels, padding, chartWidth, height) {
        ctx.fillStyle = '#9ca3af';
        ctx.font = '0.75rem -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.textAlign = 'center';

        labels.forEach((label, index) => {
            const x = padding + (index * chartWidth / (labels.length - 1));
            if (index === labels.length - 1) {
                ctx.fillStyle = '#10b981';
                ctx.font = '0.75rem -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
            } else {
                ctx.fillStyle = '#9ca3af';
                ctx.font = '0.75rem -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
            }
            ctx.fillText(label, x, height - 10);
        });
    }

    drawYAxisLabels(ctx, values, padding, chartHeight) {
        const minValue = Math.min(...values);
        const maxValue = Math.max(...values);
        
        // Create nice round numbers for y-axis with extra headroom
        const roundedMin = Math.floor(minValue / 200) * 200;
        const roundedMax = Math.ceil(maxValue / 200) * 200 + 200; // Add extra bracket
        const valueRange = roundedMax - roundedMin;
        const step = (roundedMax - roundedMin) / 4;
        
        ctx.fillStyle = '#9ca3af';
        ctx.font = '0.75rem -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.textAlign = 'right';
        
        for (let i = 0; i <= 4; i++) {
            const value = roundedMin + (step * i);
            const y = padding + chartHeight - ((value - roundedMin) / valueRange * chartHeight);
            const formattedValue = `$${(value / 1000).toFixed(1)}k`;
            ctx.fillText(formattedValue, padding - 10, y + 3);
        }
    }

    redrawWithHighlight(ctx, canvas, points, highlightIndex) {
        const { labels, values } = this.chartData;
        const padding = 40;
        const width = canvas.width;
        const height = canvas.height;
        const chartWidth = width - (padding * 2);
        const chartHeight = height - (padding * 2);

        // Clear and redraw everything
        ctx.clearRect(0, 0, width, height);
        this.drawGrid(ctx, padding, chartWidth, chartHeight);
        this.drawLine(ctx, points);

        // Draw all points
        points.forEach((point, index) => {
            ctx.save();
            
            if (index === highlightIndex) {
                // Highlighted point - larger with glow
                ctx.shadowColor = index === points.length - 1 ? '#10b981' : '#3b82f6';
                ctx.shadowBlur = 12;
                ctx.fillStyle = index === points.length - 1 ? '#10b981' : '#3b82f6';
                ctx.beginPath();
                ctx.arc(point.x, point.y, 6, 0, 2 * Math.PI);
                ctx.fill();
                
                // Add outer ring
                ctx.shadowBlur = 0;
                ctx.strokeStyle = index === points.length - 1 ? '#10b981' : '#3b82f6';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(point.x, point.y, 8, 0, 2 * Math.PI);
                ctx.stroke();
            } else {
                // Regular point
                ctx.shadowColor = index === points.length - 1 ? '#10b981' : '#3b82f6';
                ctx.shadowBlur = 6;
                ctx.fillStyle = index === points.length - 1 ? '#10b981' : '#3b82f6';
                ctx.beginPath();
                ctx.arc(point.x, point.y, 4, 0, 2 * Math.PI);
                ctx.fill();
            }
            
            ctx.restore();
        });

        this.drawLabels(ctx, labels, padding, chartWidth, height);
    }

    setupHoverEvents() {
        if (!this.canvas || !this.tooltip) {
            console.log('Canvas or tooltip not found for hover setup');
            return;
        }

        console.log('Setting up hover events', this.canvas, this.tooltip);

        // Simple, direct event handlers
        this.canvas.addEventListener('mousemove', (e) => {
            if (!this.points || this.points.length === 0) return;

            const rect = this.canvas.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;

            let hoveredIndex = -1;
            let minDistance = 20; // Increased detection radius

            this.points.forEach((point, index) => {
                const distance = Math.sqrt(
                    Math.pow(mouseX - point.x, 2) + Math.pow(mouseY - point.y, 2)
                );

                if (distance < minDistance) {
                    minDistance = distance;
                    hoveredIndex = index;
                }
            });

            if (hoveredIndex !== -1) {
                const { labels, values } = this.chartData;
                this.tooltip.textContent = `${labels[hoveredIndex]}: $${values[hoveredIndex].toLocaleString()}`;
                this.tooltip.style.left = `${mouseX + 10}px`;
                this.tooltip.style.top = `${mouseY - 40}px`;
                this.tooltip.classList.add('visible');
                this.canvas.style.cursor = 'pointer';
                
                console.log('Showing tooltip:', this.tooltip.textContent);
            } else {
                this.tooltip.classList.remove('visible');
                this.canvas.style.cursor = 'default';
            }
        });

        this.canvas.addEventListener('mouseleave', () => {
            this.tooltip.classList.remove('visible');
            this.canvas.style.cursor = 'default';
            console.log('Mouse left canvas, hiding tooltip');
        });
    }

    redrawChart(highlightIndex = -1) {
        if (!this.canvas || !this.ctx) return;

        const { labels, values } = this.chartData;
        const padding = 40;
        const width = this.canvas.width;
        const height = this.canvas.height;
        const chartWidth = width - (padding * 2);
        const chartHeight = height - (padding * 2);

        // Clear and redraw everything
        this.ctx.clearRect(0, 0, width, height);
        this.drawGrid(this.ctx, padding, chartWidth, chartHeight);
        this.drawLine(this.ctx, this.points);
        this.drawPoints(this.ctx, this.points, highlightIndex);
        this.drawLabels(this.ctx, labels, padding, chartWidth, height);
        this.drawYAxisLabels(this.ctx, values, padding, chartHeight);
    }

    /**
     * Update chart data
     * @param {Object} newData - New chart data
     */
    updateData(newData) {
        this.chartData = { ...this.chartData, ...newData };
        this.render();
        this.setupChart();
    }

    /**
     * Resize chart
     * @param {string} width - New width
     * @param {string} height - New height
     */
    resize(width, height) {
        this.width = width || this.width;
        this.height = height || this.height;
        this.render();
        setTimeout(() => this.setupChart(), 100);
    }
}

// Define the custom element
customElements.define('finsite-spending-chart', FinSiteSpendingChart);

export { FinSiteSpendingChart };