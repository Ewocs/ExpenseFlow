// Analytics Dashboard Feature for ExpenseFlow
// Main orchestrator that uses modular API, utils, and renderers

// Load dependencies
function loadAnalyticsDependencies() {
  return new Promise((resolve) => {
    const dependencies = [
      'analytics-api.js',
      'analytics-utils.js',
      'analytics-renderers.js'
    ];

    let loaded = 0;
    dependencies.forEach(dep => {
      const script = document.createElement('script');
      script.src = dep;
      script.onload = () => {
        loaded++;
        if (loaded === dependencies.length) {
          resolve();
        }
      };
      document.head.appendChild(script);
    });
  });
}

// ========================
// Main Analytics Dashboard Class
// ========================

class AnalyticsDashboard {
  constructor() {
    this.isLoading = false;
    this.currentPeriod = 'monthly';
    this.currentMonths = 6;
    this.charts = {};
  }

  /**
   * Initialize the analytics dashboard
   */
  async init() {
    await loadAnalyticsDependencies();

    this.bindEvents();
    await this.loadAllAnalytics();
  }

  /**
   * Bind event listeners
   */
  bindEvents() {
    // Period selector
    const periodSelect = document.getElementById('analytics-period');
    if (periodSelect) {
      periodSelect.addEventListener('change', (e) => {
        this.currentPeriod = e.target.value;
        this.loadTrendsData();
      });
    }

    // Months selector
    const monthsSelect = document.getElementById('analytics-months');
    if (monthsSelect) {
      monthsSelect.addEventListener('change', (e) => {
        this.currentMonths = parseInt(e.target.value);
        this.loadTrendsData();
      });
    }

    // Refresh button
    const refreshBtn = document.getElementById('refresh-analytics');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => this.loadAllAnalytics());
    }
  }

  /**
   * Load all analytics data
   */
  async loadAllAnalytics() {
    if (this.isLoading) return;

    this.isLoading = true;
    this.showLoadingState();

    try {
      // Load data in parallel for better performance
      const promises = [
        this.loadTrendsData(),
        this.loadCategoryData(),
        this.loadInsightsData(),
        this.loadPredictionsData(),
        this.loadVelocityData(),
        this.loadForecastData()
      ];

      await Promise.allSettled(promises);
    } catch (error) {
      console.error('Error loading analytics:', error);
      this.showErrorState('Failed to load analytics data');
    } finally {
      this.isLoading = false;
      this.hideLoadingState();
    }
  }

  /**
   * Load spending trends data
   */
  async loadTrendsData() {
    try {
      const trends = await window.AnalyticsAPI.fetchSpendingTrends(this.currentPeriod, this.currentMonths);
      window.AnalyticsRenderers.renderTrendsChart(trends);
    } catch (error) {
      console.error('Error loading trends:', error);
      this.showChartError('trends-chart', 'Failed to load spending trends');
    }
  }

  /**
   * Load category breakdown data
   */
  async loadCategoryData() {
    try {
      const breakdown = await window.AnalyticsAPI.fetchCategoryBreakdown();
      window.AnalyticsRenderers.renderCategoryChart(breakdown);
    } catch (error) {
      console.error('Error loading categories:', error);
      this.showChartError('category-chart', 'Failed to load category breakdown');
    }
  }

  /**
   * Load insights data
   */
  async loadInsightsData() {
    try {
      const insights = await window.AnalyticsAPI.fetchInsights();
      window.AnalyticsRenderers.renderInsightsWidget(insights);
    } catch (error) {
      console.error('Error loading insights:', error);
      this.showWidgetError('insights-widget', 'Failed to load insights');
    }
  }

  /**
   * Load predictions data
   */
  async loadPredictionsData() {
    try {
      const predictions = await window.AnalyticsAPI.fetchPredictions();
      window.AnalyticsRenderers.renderPredictionsWidget(predictions);
    } catch (error) {
      console.error('Error loading predictions:', error);
      this.showWidgetError('predictions-widget', 'Failed to load predictions');
    }
  }

  /**
   * Load velocity data
   */
  async loadVelocityData() {
    try {
      const velocity = await window.AnalyticsAPI.fetchSpendingVelocity();
      window.AnalyticsRenderers.renderVelocityWidget(velocity);
    } catch (error) {
      console.error('Error loading velocity:', error);
      this.showWidgetError('velocity-widget', 'Failed to load velocity data');
    }
  }

  /**
   * Load forecast data
   */
  async loadForecastData() {
    try {
      const forecast = await window.AnalyticsAPI.fetchForecast();
      window.AnalyticsRenderers.renderForecastWidget(forecast);
    } catch (error) {
      console.error('Error loading forecast:', error);
      this.showWidgetError('forecast-widget', 'Failed to load forecast data');
    }
  }

  /**
   * Show loading state
   */
  showLoadingState() {
    const containers = [
      'trends-chart', 'category-chart', 'insights-widget',
      'predictions-widget', 'velocity-widget', 'forecast-widget'
    ];

    containers.forEach(id => {
      const container = document.getElementById(id);
      if (container) {
        container.innerHTML = '<div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i> Loading...</div>';
      }
    });
  }

  /**
   * Hide loading state
   */
  hideLoadingState() {
    // Loading state is automatically replaced by content
  }

  /**
   * Show error state for charts
   */
  showChartError(containerId, message) {
    const container = document.getElementById(containerId);
    if (container) {
      container.innerHTML = `<div class="error-state"><i class="fas fa-exclamation-triangle"></i> ${message}</div>`;
    }
  }

  /**
   * Show error state for widgets
   */
  showWidgetError(containerId, message) {
    const container = document.getElementById(containerId);
    if (container) {
      container.innerHTML = `<div class="error-state"><i class="fas fa-exclamation-triangle"></i> ${message}</div>`;
    }
  }

  /**
   * Show general error state
   */
  showErrorState(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'analytics-error';
    errorDiv.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${message}`;
    errorDiv.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #ff5722;
      color: white;
      padding: 1rem;
      border-radius: 8px;
      z-index: 1000;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    `;

    document.body.appendChild(errorDiv);
    setTimeout(() => errorDiv.remove(), 5000);
  }
}

// ========================
// Initialization
// ========================

// Global analytics dashboard instance
let analyticsDashboard;

// Initialize analytics when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
  // Check if we're on the analytics page
  if (document.getElementById('analytics-dashboard')) {
    analyticsDashboard = new AnalyticsDashboard();
    await analyticsDashboard.init();
  }
});

// Export for external use
window.AnalyticsDashboard = AnalyticsDashboard;
