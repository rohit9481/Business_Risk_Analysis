import numpy as np
from scipy import stats

class MonteCarloSimulation:
    """
    Monte Carlo simulation class for financial risk assessment.
    """
    
    def __init__(self, initial_investment, duration, revenue_range, cost_range, 
                 discount_rate, num_simulations=1000):
        """
        Initialize the Monte Carlo simulation with investment parameters.
        
        Args:
            initial_investment (float): Initial investment amount
            duration (int): Investment duration in years
            revenue_range (tuple): (min_revenue, max_revenue) per year
            cost_range (tuple): (min_cost, max_cost) per year
            discount_rate (float): Annual discount rate (decimal form, e.g., 0.1 for 10%)
            num_simulations (int): Number of simulations to run
        """
        self.initial_investment = initial_investment
        self.duration = duration
        self.revenue_range = revenue_range
        self.cost_range = cost_range
        self.discount_rate = discount_rate
        self.num_simulations = num_simulations
        self.results = None
    
    def calculate_npv(self, cash_flows):
        """
        Calculate Net Present Value (NPV) for a series of cash flows.
        
        Args:
            cash_flows (array): Cash flows starting from year 0 (initial investment)
            
        Returns:
            float: The calculated NPV
        """
        npv = 0
        for t, cf in enumerate(cash_flows):
            npv += cf / ((1 + self.discount_rate) ** t)
        return npv
    
    def run(self):
        """
        Run the Monte Carlo simulation.
        
        Returns:
            dict: Simulation results including NPV statistics and distribution data
        """
        # Initialize array to store NPV results
        npv_results = np.zeros(self.num_simulations)
        cash_flows_all = []
        
        # Run simulations
        for i in range(self.num_simulations):
            # Initial investment (negative cash flow)
            cash_flows = [-self.initial_investment]
            
            # Generate random revenues and costs for each year
            for year in range(1, self.duration + 1):
                revenue = np.random.uniform(self.revenue_range[0], self.revenue_range[1])
                cost = np.random.uniform(self.cost_range[0], self.cost_range[1])
                net_cash_flow = revenue - cost
                cash_flows.append(net_cash_flow)
            
            # Store sample of cash flows for visualization
            if i < 10:  # Store only a few samples to keep response size manageable
                cash_flows_all.append(cash_flows)
            
            # Calculate NPV
            npv_results[i] = self.calculate_npv(cash_flows)
        
        # Calculate statistics
        mean_npv = np.mean(npv_results)
        median_npv = np.median(npv_results)
        std_dev = np.std(npv_results)
        min_npv = np.min(npv_results)
        max_npv = np.max(npv_results)
        
        # Calculate probability of loss (NPV < 0)
        prob_loss = np.sum(npv_results < 0) / self.num_simulations
        
        # Calculate the 95% confidence interval
        ci_lower = np.percentile(npv_results, 2.5)
        ci_upper = np.percentile(npv_results, 97.5)
        
        # Prepare histogram data
        hist, bin_edges = np.histogram(npv_results, bins=30)
        hist_data = [{"x": (bin_edges[i] + bin_edges[i+1])/2, "y": int(hist[i])} 
                     for i in range(len(hist))]
        
        # Calculate cumulative probability distribution
        sorted_npvs = np.sort(npv_results)
        cum_probs = np.arange(1, len(sorted_npvs) + 1) / len(sorted_npvs)
        
        # Sample cumulative probability data (100 points for efficiency)
        indices = np.linspace(0, len(sorted_npvs) - 1, 100).astype(int)
        cumulative_data = [{"x": float(sorted_npvs[i]), "y": float(cum_probs[i])} 
                           for i in indices]
        
        # Determine investment recommendation based on NPV and risk
        recommendation = self._get_recommendation(mean_npv, prob_loss, std_dev)
        
        # Store and return results
        self.results = {
            "npvResults": npv_results.tolist(),
            "meanNpv": float(mean_npv),
            "medianNpv": float(median_npv),
            "stdDev": float(std_dev),
            "minNpv": float(min_npv),
            "maxNpv": float(max_npv),
            "probLoss": float(prob_loss),
            "confidenceInterval": [float(ci_lower), float(ci_upper)],
            "histogramData": hist_data,
            "cumulativeData": cumulative_data,
            "sampleCashFlows": cash_flows_all,
            "recommendation": recommendation
        }
        
        return self.results
    
    def _get_recommendation(self, mean_npv, prob_loss, std_dev):
        """
        Generate an investment recommendation based on simulation results.
        
        Args:
            mean_npv (float): Mean NPV
            prob_loss (float): Probability of loss
            std_dev (float): Standard deviation of NPV
            
        Returns:
            dict: Recommendation info including text, confidence level, and color code
        """
        # Calculate coefficient of variation (normalized risk measure)
        if mean_npv != 0:
            cv = abs(std_dev / mean_npv)
        else:
            cv = float('inf')  # Avoid division by zero
        
        if mean_npv > 0 and prob_loss < 0.1 and cv < 0.5:
            confidence = "High"
            text = "Strong investment opportunity with good returns and low risk."
            color = "success"  # Green
        elif mean_npv > 0 and prob_loss < 0.25:
            confidence = "Medium"
            text = "Positive expected returns but with moderate risk levels."
            color = "primary"  # Blue
        elif mean_npv > 0:
            confidence = "Low"
            text = "Potential for positive returns but with significant risk."
            color = "warning"  # Yellow
        else:
            confidence = "Very Low"
            text = "High probability of loss. Not recommended."
            color = "danger"  # Red
        
        return {
            "text": text,
            "confidence": confidence,
            "color": color
        }
