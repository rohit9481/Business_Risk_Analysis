import numpy as np
from sklearn.linear_model import LinearRegression

class LinearRegressionPredictor:
    """
    A class to handle predictive analytics using linear regression.
    """
    
    def __init__(self):
        """Initialize the predictor with a LinearRegression model."""
        self.model = LinearRegression()
    
    def forecast(self, historical_data, forecast_periods=1):
        """
        Forecast future values based on historical data using linear regression.
        
        Args:
            historical_data (list): List of historical values
            forecast_periods (int): Number of periods to forecast
            
        Returns:
            numpy.ndarray: Array of forecasted values
        """
        if len(historical_data) < 2:
            raise ValueError("Need at least 2 data points for forecasting")
        
        # Convert data to numpy array if it's not already
        historical_data = np.array(historical_data)
        
        # Create X (time indices) and y (values)
        X = np.arange(len(historical_data)).reshape(-1, 1)
        y = historical_data
        
        # Fit the linear regression model
        self.model.fit(X, y)
        
        # Generate future time indices
        future_X = np.arange(len(historical_data), 
                             len(historical_data) + forecast_periods).reshape(-1, 1)
        
        # Predict future values
        future_y = self.model.predict(future_X)
        
        return future_y
    
    def get_model_metrics(self, historical_data):
        """
        Calculate model metrics based on historical data.
        
        Args:
            historical_data (list): List of historical values
            
        Returns:
            dict: Dictionary containing model metrics
        """
        if len(historical_data) < 2:
            raise ValueError("Need at least 2 data points for model metrics")
        
        # Convert data to numpy array if it's not already
        historical_data = np.array(historical_data)
        
        # Create X (time indices) and y (values)
        X = np.arange(len(historical_data)).reshape(-1, 1)
        y = historical_data
        
        # Fit the linear regression model
        self.model.fit(X, y)
        
        # Calculate R² score
        r_squared = self.model.score(X, y)
        
        # Calculate predicted values
        y_pred = self.model.predict(X)
        
        # Calculate mean squared error
        mse = np.mean((y - y_pred) ** 2)
        
        # Calculate trend (coefficient)
        trend = self.model.coef_[0]
        
        return {
            "r_squared": float(r_squared),
            "mse": float(mse),
            "trend": float(trend),
            "intercept": float(self.model.intercept_)
        }
