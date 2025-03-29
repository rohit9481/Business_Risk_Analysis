/**
 * Simulation.js
 * Client-side code for simulation visualization
 */

/**
 * Formats a number with the specified number of decimal places
 * @param {number} value - The value to format
 * @param {number} decimals - Number of decimal places
 * @returns {string} Formatted number
 */
function formatNumber(value, decimals = 0) {
    return value.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

/**
 * Calculates the Net Present Value (NPV) of a series of cash flows
 * @param {Array} cashFlows - Array of cash flows starting with initial investment (negative)
 * @param {number} discountRate - Discount rate as a decimal
 * @returns {number} The calculated NPV
 */
function calculateNPV(cashFlows, discountRate) {
    let npv = 0;
    for (let t = 0; t < cashFlows.length; t++) {
        npv += cashFlows[t] / Math.pow(1 + discountRate, t);
    }
    return npv;
}

/**
 * Creates a visual representation of the probability of loss
 * Used in tooltips and information displays
 * @param {number} probability - Probability as a decimal
 * @returns {string} HTML string with visual representation
 */
function createProbabilityVisual(probability) {
    const percentage = Math.round(probability * 100);
    const greenBlocks = 10 - Math.round(probability * 10);
    const redBlocks = Math.round(probability * 10);
    
    let html = `<div class="probability-visual" title="${percentage}% probability of loss">`;
    
    // Add red blocks (representing loss probability)
    for (let i = 0; i < redBlocks; i++) {
        html += `<span class="prob-block prob-red"></span>`;
    }
    
    // Add green blocks (representing success probability)
    for (let i = 0; i < greenBlocks; i++) {
        html += `<span class="prob-block prob-green"></span>`;
    }
    
    html += `</div>`;
    return html;
}

/**
 * Calculates the Internal Rate of Return (IRR) for a series of cash flows
 * This is a complex calculation that uses numerical approximation
 * @param {Array} cashFlows - Array of cash flows starting with initial investment (negative)
 * @returns {number} The calculated IRR as a decimal
 */
function calculateIRR(cashFlows) {
    // Calculate NPV using a given discount rate
    const npv = rate => {
        let value = 0;
        for (let i = 0; i < cashFlows.length; i++) {
            value += cashFlows[i] / Math.pow(1 + rate, i);
        }
        return value;
    };
    
    // Use numerical approximation to find the IRR
    // IRR is the discount rate at which NPV equals zero
    let lowerBound = -0.99;
    let upperBound = 1;
    let guess = 0.1;
    let tolerance = 0.0001;
    let maxIterations = 100;
    let currentNPV = npv(guess);
    
    // Stop if we're close enough to zero, or we've iterated too many times
    for (let i = 0; i < maxIterations && Math.abs(currentNPV) > tolerance; i++) {
        if (currentNPV > 0) {
            lowerBound = guess;
        } else {
            upperBound = guess;
        }
        guess = (lowerBound + upperBound) / 2;
        currentNPV = npv(guess);
    }
    
    return Math.abs(currentNPV) < tolerance ? guess : null;
}

/**
 * Translates risk level into a human-readable text and styling
 * @param {string} riskLevel - Risk level category
 * @returns {Object} Object with text and CSS class
 */
function getRiskDisplay(riskLevel) {
    switch(riskLevel) {
        case 'very_low':
            return { text: 'Very Low Risk', class: 'text-success' };
        case 'low':
            return { text: 'Low Risk', class: 'text-success' };
        case 'moderate':
            return { text: 'Moderate Risk', class: 'text-primary' };
        case 'high':
            return { text: 'High Risk', class: 'text-warning' };
        case 'very_high':
            return { text: 'Very High Risk', class: 'text-danger' };
        default:
            return { text: 'Unknown', class: 'text-secondary' };
    }
}

/**
 * Categorizes an investment based on NPV and risk metrics
 * @param {Object} metrics - Object containing NPV, probability of loss, etc.
 * @returns {string} Investment category
 */
function categorizeInvestment(metrics) {
    const { meanNpv, probLoss, stdDev } = metrics;
    
    // Calculate coefficient of variation for normalized risk assessment
    const cv = Math.abs(stdDev / meanNpv);
    
    if (meanNpv <= 0) {
        return 'Avoid';
    }
    
    if (probLoss < 0.05 && cv < 0.3) {
        return 'Safe';
    } else if (probLoss < 0.15 && cv < 0.5) {
        return 'Conservative';
    } else if (probLoss < 0.3 && cv < 1) {
        return 'Balanced';
    } else if (probLoss < 0.4) {
        return 'Growth';
    } else {
        return 'Speculative';
    }
}

/**
 * Creates a visual representation of a confidence interval
 * @param {Array} interval - The confidence interval [lower, upper]
 * @param {number} meanNpv - The mean NPV
 * @returns {string} HTML string with visual representation
 */
function createConfidenceIntervalVisual(interval, meanNpv) {
    const lower = interval[0];
    const upper = interval[1];
    
    // Calculate positions for visualization (percentages)
    const range = upper - lower;
    const zeroPosition = lower < 0 && upper > 0 
        ? Math.abs(lower) / range * 100 
        : (lower >= 0 ? 0 : 100);
    const meanPosition = (meanNpv - lower) / range * 100;
    
    let html = `
        <div class="confidence-interval" title="95% Confidence Interval">
            <div class="ci-range">
                <div class="ci-zero-marker" style="left: ${zeroPosition}%"></div>
                <div class="ci-mean-marker" style="left: ${meanPosition}%"></div>
            </div>
            <div class="ci-labels">
                <span class="ci-lower">${formatCurrency(lower)}</span>
                <span class="ci-upper">${formatCurrency(upper)}</span>
            </div>
        </div>
    `;
    
    return html;
}
