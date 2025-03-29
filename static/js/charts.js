/**
 * Charts.js
 * Handles creation and updates of all charts in the application
 */

// Global chart objects for later reference
let npvHistogramChart = null;
let cumulativeChart = null;
let cashFlowsChart = null;
let revenueForecastChart = null;

/**
 * Create all charts based on simulation results
 * @param {Object} results - Simulation results from the server
 */
function createCharts(results) {
    // Destroy existing charts to prevent memory leaks
    destroyCharts();
    
    // Create new charts
    createNpvHistogramChart(results.histogramData);
    createCumulativeChart(results.cumulativeData);
    createCashFlowsChart(results.sampleCashFlows, parseInt(document.getElementById('duration').value));
    
    // Create forecast chart if data is available
    if (results.revenuesForecast) {
        createForecastChart(results);
    }
}

/**
 * Create NPV histogram chart
 * @param {Array} histogramData - Histogram data from simulation
 */
function createNpvHistogramChart(histogramData) {
    const ctx = document.getElementById('npv-histogram-chart').getContext('2d');
    
    // Format data for Chart.js
    const labels = histogramData.map(d => d.x);
    const data = histogramData.map(d => d.y);
    
    // Determine color based on NPV values
    const borderColor = labels.map(value => value < 0 ? '#dc3545' : '#198754');
    const backgroundColor = labels.map(value => value < 0 ? 'rgba(220, 53, 69, 0.5)' : 'rgba(25, 135, 84, 0.5)');
    
    // Create chart
    npvHistogramChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Frequency',
                data: data,
                borderColor: borderColor,
                backgroundColor: backgroundColor,
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        title: function(tooltipItems) {
                            const item = tooltipItems[0];
                            const value = item.parsed.x;
                            return `NPV: ${formatCurrency(value)}`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Net Present Value (€)'
                    },
                    ticks: {
                        callback: function(value) {
                            return formatCurrencyCompact(value);
                        }
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Frequency'
                    },
                    beginAtZero: true
                }
            }
        }
    });
}

/**
 * Create cumulative probability chart
 * @param {Array} cumulativeData - Cumulative probability data from simulation
 */
function createCumulativeChart(cumulativeData) {
    const ctx = document.getElementById('cumulative-chart').getContext('2d');
    
    // Format data for Chart.js
    const labels = cumulativeData.map(d => d.x);
    const data = cumulativeData.map(d => d.y);
    
    // Find the index where NPV crosses zero
    let zeroIndex = 0;
    for (let i = 0; i < labels.length; i++) {
        if (labels[i] >= 0) {
            zeroIndex = i;
            break;
        }
    }
    
    // Create chart
    cumulativeChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Cumulative Probability',
                data: data,
                borderColor: '#0d6efd',
                backgroundColor: 'rgba(13, 110, 253, 0.1)',
                borderWidth: 2,
                tension: 0.1,
                fill: false,
                pointRadius: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        title: function(tooltipItems) {
                            const item = tooltipItems[0];
                            const value = item.parsed.x;
                            return `NPV: ${formatCurrency(value)}`;
                        },
                        label: function(context) {
                            const probability = context.parsed.y;
                            return `Probability: ${(probability * 100).toFixed(1)}%`;
                        }
                    }
                },
                annotation: {
                    annotations: {
                        zeroLine: {
                            type: 'line',
                            xMin: 0,
                            xMax: 0,
                            borderColor: 'rgba(220, 53, 69, 0.5)',
                            borderWidth: 2,
                            borderDash: [5, 5],
                            label: {
                                content: 'NPV = 0',
                                enabled: true,
                                position: 'top'
                            }
                        },
                        probLoss: {
                            type: 'point',
                            xValue: 0,
                            yValue: data[zeroIndex] || 0,
                            radius: 5,
                            backgroundColor: 'rgba(220, 53, 69, 0.8)'
                        }
                    }
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Net Present Value (€)'
                    },
                    ticks: {
                        callback: function(value) {
                            return formatCurrencyCompact(value);
                        }
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Cumulative Probability'
                    },
                    min: 0,
                    max: 1,
                    ticks: {
                        callback: function(value) {
                            return (value * 100).toFixed(0) + '%';
                        }
                    }
                }
            }
        }
    });
}

/**
 * Create cash flows chart
 * @param {Array} cashFlowsData - Sample cash flows from simulation
 * @param {number} duration - Investment duration in years
 */
function createCashFlowsChart(cashFlowsData, duration) {
    const ctx = document.getElementById('cash-flows-chart').getContext('2d');
    
    // Create labels for years
    const years = Array.from({length: duration + 1}, (_, i) => `Year ${i}`);
    
    // Prepare datasets (one per simulation run)
    const datasets = cashFlowsData.map((cashFlows, index) => {
        return {
            label: `Simulation ${index + 1}`,
            data: cashFlows,
            borderColor: getRandomColor(index),
            borderWidth: 2,
            tension: 0.1,
            fill: false,
            pointRadius: 3
        };
    });
    
    // Create chart
    cashFlowsChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: years,
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const value = context.parsed.y;
                            return `${context.dataset.label}: ${formatCurrency(value)}`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Time Period'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Cash Flow (€)'
                    },
                    ticks: {
                        callback: function(value) {
                            return formatCurrencyCompact(value);
                        }
                    }
                }
            }
        }
    });
}

/**
 * Create revenue forecast chart
 * @param {Object} results - Simulation results containing forecast data
 */
function createForecastChart(results) {
    // Get historical data from input field
    const historicalData = document.getElementById('historicalRevenues').value
        .split(',')
        .map(x => parseFloat(x.trim()))
        .filter(x => !isNaN(x));
    
    const ctx = document.getElementById('revenue-forecast-chart').getContext('2d');
    
    // Create year labels
    const pastYears = historicalData.map((_, i) => `Year -${historicalData.length - i}`);
    const futureYears = results.revenuesForecast.map((_, i) => `Year ${i + 1}`);
    const labels = [...pastYears, ...futureYears];
    
    // Create dataset
    const data = [...historicalData, ...results.revenuesForecast];
    
    // Find the split point between historical and forecast data
    const splitPoint = historicalData.length - 1;
    
    // Create chart
    revenueForecastChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Historical Revenue',
                data: data.slice(0, historicalData.length),
                borderColor: '#0d6efd',
                backgroundColor: 'rgba(13, 110, 253, 0.1)',
                borderWidth: 2,
                tension: 0.1,
                fill: false,
                pointRadius: 5
            },
            {
                label: 'Forecasted Revenue',
                data: Array(historicalData.length).fill(null).concat(results.revenuesForecast),
                borderColor: '#fd7e14',
                backgroundColor: 'rgba(253, 126, 20, 0.1)',
                borderWidth: 2,
                borderDash: [5, 5],
                tension: 0.1,
                fill: false,
                pointRadius: 5
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const value = context.parsed.y;
                            return `${context.dataset.label}: ${formatCurrency(value)}`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Time Period'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Revenue (€)'
                    },
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return formatCurrencyCompact(value);
                        }
                    }
                }
            }
        }
    });
}

/**
 * Destroy all existing charts to prevent memory leaks
 */
function destroyCharts() {
    if (npvHistogramChart) npvHistogramChart.destroy();
    if (cumulativeChart) cumulativeChart.destroy();
    if (cashFlowsChart) cashFlowsChart.destroy();
    if (revenueForecastChart) revenueForecastChart.destroy();
}

/**
 * Generate a random color for chart lines
 * @param {number} index - Index to help generate different colors
 * @returns {string} - Color in hex format
 */
function getRandomColor(index) {
    // Predefined array of colors for consistency
    const colors = [
        '#0d6efd', '#198754', '#dc3545', '#fd7e14', '#6f42c1',
        '#20c997', '#0dcaf0', '#6610f2', '#d63384', '#ffc107'
    ];
    
    return colors[index % colors.length];
}

/**
 * Format a number as currency (Euro)
 * @param {number} value - Value to format
 * @returns {string} - Formatted currency string
 */
function formatCurrency(value) {
    return new Intl.NumberFormat('de-DE', { 
        style: 'currency', 
        currency: 'EUR',
        maximumFractionDigits: 0 
    }).format(value);
}

/**
 * Format a number as compact currency (for axis labels)
 * @param {number} value - Value to format
 * @returns {string} - Formatted compact currency string
 */
function formatCurrencyCompact(value) {
    if (Math.abs(value) >= 1000000) {
        return new Intl.NumberFormat('de-DE', { 
            style: 'currency', 
            currency: 'EUR',
            notation: 'compact',
            maximumFractionDigits: 1
        }).format(value);
    } else {
        return new Intl.NumberFormat('de-DE', { 
            style: 'currency', 
            currency: 'EUR',
            maximumFractionDigits: 0
        }).format(value);
    }
}
