/**
 * Main application JavaScript file
 * Handles the initialization and event listeners
 */

document.addEventListener('DOMContentLoaded', function() {
    // Elements from the DOM
    const simulationForm = document.getElementById('simulation-form');
    const loadDemoButton = document.getElementById('load-demo');
    const welcomeCard = document.getElementById('welcome-card');
    const resultsContainer = document.getElementById('results-container');
    const loadingIndicator = document.getElementById('loading-indicator');
    const forecastUnavailable = document.getElementById('forecast-unavailable');
    const forecastAvailable = document.getElementById('forecast-available');
    
    // Initialize application
    initializeApp();
    
    // Event Listeners
    simulationForm.addEventListener('submit', handleFormSubmit);
    loadDemoButton.addEventListener('click', loadDemoData);
    
    /**
     * Initialize the application
     */
    function initializeApp() {
        console.log('Financial Risk Assessment Platform initialized');
        // Initially hide forecast charts as they require historical data
        forecastUnavailable.style.display = 'block';
        forecastAvailable.style.display = 'none';
    }
    
    /**
     * Handle form submission
     * @param {Event} event - The form submission event
     */
    async function handleFormSubmit(event) {
        event.preventDefault();
        
        try {
            showLoading();
            
            // Get form data
            const formData = getFormData();
            
            // Validate form data
            if (!validateFormData(formData)) {
                throw new Error('Please check your inputs. Make sure all required fields are filled and values are valid.');
            }
            
            // Run simulation
            const results = await runSimulation(formData);
            
            // Display results
            displayResults(results);
            
        } catch (error) {
            showError(error.message);
        } finally {
            hideLoading();
        }
    }
    
    /**
     * Get form data from input fields
     * @returns {Object} Form data object
     */
    function getFormData() {
        const formData = {
            initialInvestment: parseFloat(document.getElementById('initialInvestment').value),
            duration: parseInt(document.getElementById('duration').value),
            minRevenue: parseFloat(document.getElementById('minRevenue').value),
            maxRevenue: parseFloat(document.getElementById('maxRevenue').value),
            minCost: parseFloat(document.getElementById('minCost').value),
            maxCost: parseFloat(document.getElementById('maxCost').value),
            discountRate: parseFloat(document.getElementById('discountRate').value),
            numSimulations: parseInt(document.getElementById('numSimulations').value)
        };
        
        // Process historical revenues if provided
        const historicalRevenuesInput = document.getElementById('historicalRevenues').value.trim();
        if (historicalRevenuesInput) {
            formData.historicalRevenues = historicalRevenuesInput.split(',')
                .map(value => parseFloat(value.trim()))
                .filter(value => !isNaN(value));
        }
        
        return formData;
    }
    
    /**
     * Validate form data
     * @param {Object} data - Form data object
     * @returns {boolean} True if data is valid, false otherwise
     */
    function validateFormData(data) {
        // Check if all required fields are present and have valid values
        if (isNaN(data.initialInvestment) || data.initialInvestment < 0) return false;
        if (isNaN(data.duration) || data.duration < 1 || data.duration > 100) return false;
        if (isNaN(data.minRevenue) || data.minRevenue < 0) return false;
        if (isNaN(data.maxRevenue) || data.maxRevenue < data.minRevenue) return false;
        if (isNaN(data.minCost) || data.minCost < 0) return false;
        if (isNaN(data.maxCost) || data.maxCost < data.minCost) return false;
        if (isNaN(data.discountRate) || data.discountRate < 0 || data.discountRate > 100) return false;
        if (isNaN(data.numSimulations) || data.numSimulations < 1) return false;
        
        // If we have historical revenues, ensure they're valid
        if (data.historicalRevenues && data.historicalRevenues.length < 2) {
            alert('Please enter at least 2 historical revenue values for forecasting, or leave the field empty.');
            return false;
        }
        
        return true;
    }
    
    /**
     * Run simulation by sending data to the server
     * @param {Object} data - Form data object
     * @returns {Promise<Object>} Simulation results
     */
    async function runSimulation(data) {
        try {
            const response = await fetch('/api/simulate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to run simulation');
            }
            
            return await response.json();
        } catch (error) {
            console.error('Error running simulation:', error);
            throw error;
        }
    }
    
    /**
     * Load demo data from the server
     */
    async function loadDemoData() {
        try {
            showLoading();
            
            // Fetch demo data
            const response = await fetch('/api/demo');
            const demoData = await response.json();
            
            // Fill the form with demo data
            document.getElementById('initialInvestment').value = demoData.initialInvestment;
            document.getElementById('duration').value = demoData.duration;
            document.getElementById('minRevenue').value = demoData.minRevenue;
            document.getElementById('maxRevenue').value = demoData.maxRevenue;
            document.getElementById('minCost').value = demoData.minCost;
            document.getElementById('maxCost').value = demoData.maxCost;
            document.getElementById('discountRate').value = demoData.discountRate;
            document.getElementById('numSimulations').value = demoData.numSimulations;
            document.getElementById('historicalRevenues').value = demoData.historicalRevenues.join(', ');
            
            // Run simulation with demo data
            const results = await runSimulation(demoData);
            
            // Display results
            displayResults(results);
            
        } catch (error) {
            showError('Failed to load demo data: ' + error.message);
        } finally {
            hideLoading();
        }
    }
    
    /**
     * Display simulation results
     * @param {Object} results - Simulation results
     */
    function displayResults(results) {
        // Hide welcome card and show results
        welcomeCard.classList.add('d-none');
        resultsContainer.classList.remove('d-none');
        
        // Format and display summary statistics
        displaySummaryStatistics(results);
        
        // Set up recommendation
        displayRecommendation(results.recommendation);
        
        // Create charts
        createCharts(results);
        
        // Show/hide forecast based on availability
        if (results.revenuesForecast) {
            forecastUnavailable.style.display = 'none';
            forecastAvailable.style.display = 'block';
            createForecastChart(results);
        } else {
            forecastUnavailable.style.display = 'block';
            forecastAvailable.style.display = 'none';
        }
    }
    
    /**
     * Display summary statistics
     * @param {Object} results - Simulation results
     */
    function displaySummaryStatistics(results) {
        // Format currency values
        const formatCurrency = value => {
            return new Intl.NumberFormat('de-DE', { 
                style: 'currency', 
                currency: 'EUR',
                maximumFractionDigits: 0 
            }).format(value);
        };
        
        // Format percentage values
        const formatPercent = value => {
            return new Intl.NumberFormat('en-US', { 
                style: 'percent',
                minimumFractionDigits: 1,
                maximumFractionDigits: 1
            }).format(value);
        };
        
        // Update DOM with formatted values
        document.getElementById('mean-npv').textContent = formatCurrency(results.meanNpv);
        document.getElementById('mean-npv').className = results.meanNpv >= 0 ? 'text-positive mb-0' : 'text-negative mb-0';
        
        document.getElementById('median-npv').textContent = formatCurrency(results.medianNpv);
        document.getElementById('median-npv').className = results.medianNpv >= 0 ? 'text-positive mb-0' : 'text-negative mb-0';
        
        document.getElementById('min-npv').textContent = formatCurrency(results.minNpv);
        document.getElementById('min-npv').className = results.minNpv >= 0 ? 'text-positive mb-0' : 'text-negative mb-0';
        
        document.getElementById('max-npv').textContent = formatCurrency(results.maxNpv);
        document.getElementById('max-npv').className = results.maxNpv >= 0 ? 'text-positive mb-0' : 'text-negative mb-0';
        
        document.getElementById('std-dev').textContent = formatCurrency(results.stdDev);
        
        document.getElementById('prob-loss').textContent = formatPercent(results.probLoss);
        document.getElementById('prob-loss').className = results.probLoss < 0.25 ? 'text-positive mb-0' : 'text-negative mb-0';
        
        document.getElementById('confidence-interval').textContent = 
            `${formatCurrency(results.confidenceInterval[0])} to ${formatCurrency(results.confidenceInterval[1])}`;
    }
    
    /**
     * Display recommendation
     * @param {Object} recommendation - Recommendation object
     */
    function displayRecommendation(recommendation) {
        const header = document.getElementById('recommendation-header');
        const text = document.getElementById('recommendation-text');
        const badge = document.getElementById('confidence-badge');
        
        // Set recommendation text
        text.textContent = recommendation.text;
        
        // Set confidence badge
        badge.innerHTML = `<span class="badge bg-${recommendation.color}">${recommendation.confidence} Confidence</span>`;
        
        // Set header color
        header.className = `card-header bg-${recommendation.color}`;
        if (recommendation.color === 'warning') {
            header.classList.add('text-dark');
        }
    }
    
    /**
     * Show loading indicator
     */
    function showLoading() {
        loadingIndicator.classList.remove('d-none');
        resultsContainer.classList.add('d-none');
        welcomeCard.classList.add('d-none');
    }
    
    /**
     * Hide loading indicator
     */
    function hideLoading() {
        loadingIndicator.classList.add('d-none');
    }
    
    /**
     * Show error message
     * @param {string} message - Error message to display
     */
    function showError(message) {
        alert('Error: ' + message);
        // Show welcome card again if no results are displayed
        if (resultsContainer.classList.contains('d-none')) {
            welcomeCard.classList.remove('d-none');
        }
    }
});
