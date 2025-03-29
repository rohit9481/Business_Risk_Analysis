import os
import logging
from flask import Flask, render_template, request, jsonify
from models.monte_carlo import MonteCarloSimulation
from models.prediction import LinearRegressionPredictor

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Create Flask app
app = Flask(__name__)
app.secret_key = os.environ.get("SESSION_SECRET", "default_secret_key_for_development")

@app.route('/')
def index():
    """Render the main page of the application."""
    return render_template('index.html')

@app.route('/about')
def about():
    """Render the about page with information about the application."""
    return render_template('about.html')

@app.route('/api/simulate', methods=['POST'])
def simulate():
    """API endpoint to run a Monte Carlo simulation based on input parameters."""
    try:
        data = request.json
        logger.debug(f"Received simulation data: {data}")
        
        # Extract parameters from the request
        initial_investment = float(data.get('initialInvestment', 0))
        duration = int(data.get('duration', 0))
        min_revenue = float(data.get('minRevenue', 0))
        max_revenue = float(data.get('maxRevenue', 0))
        min_cost = float(data.get('minCost', 0))
        max_cost = float(data.get('maxCost', 0))
        discount_rate = float(data.get('discountRate', 0)) / 100
        num_simulations = int(data.get('numSimulations', 1000))

        # Create and run simulation
        simulation = MonteCarloSimulation(
            initial_investment=initial_investment,
            duration=duration,
            revenue_range=(min_revenue, max_revenue),
            cost_range=(min_cost, max_cost),
            discount_rate=discount_rate,
            num_simulations=num_simulations
        )
        
        results = simulation.run()
        
        # Get forecasting data if historical data is provided
        forecasting_results = {}
        if 'historicalRevenues' in data and len(data['historicalRevenues']) > 0:
            predictor = LinearRegressionPredictor()
            forecast_revenue = predictor.forecast(
                data['historicalRevenues'], 
                forecast_periods=duration
            )
            forecasting_results['revenuesForecast'] = forecast_revenue.tolist()
        
        # Return the combined results
        return jsonify({**results, **forecasting_results})
    
    except Exception as e:
        logger.error(f"Error in simulation: {str(e)}", exc_info=True)
        return jsonify({"error": str(e)}), 400

@app.route('/api/demo')
def demo_data():
    """API endpoint to provide a demo case for the application."""
    return jsonify({
        "initialInvestment": 40000,
        "duration": 5,
        "minRevenue": 15000,
        "maxRevenue": 30000,
        "minCost": 8000,
        "maxCost": 15000,
        "discountRate": 10,
        "numSimulations": 1000,
        "historicalRevenues": [12000, 14500, 16800, 19200, 22000]
    })

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
