// Analytics API Module
// Handles all API calls for analytics dashboard

const ANALYTICS_API_URL = '/api/analytics';

// State management
let analyticsData = {
  trends: null,
  categoryBreakdown: null,
  insights: null,
  predictions: null,
  velocity: null,
  forecast: null
};

/**
 * Get authentication headers for API requests
 */
async function getAuthHeaders() {
  const token = localStorage.getItem('authToken');
  return {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : ''
  };
}

/**
 * Generic API fetch function with error handling
 */
async function apiFetch(endpoint, options = {}) {
  try {
    const token = localStorage.getItem('authToken');
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${ANALYTICS_API_URL}${endpoint}`, {
      headers: await getAuthHeaders(),
      ...options
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error(`Error fetching ${endpoint}:`, error);
    throw error;
  }
}

/**
 * Fetch spending trends
 */
async function fetchSpendingTrends(period = 'monthly', months = 6) {
  const data = await apiFetch(`/spending-trends?period=${period}&months=${months}`);
  analyticsData.trends = data;
  return data;
}

/**
 * Fetch category breakdown
 */
async function fetchCategoryBreakdown(type = 'expense', startDate = null, endDate = null) {
  let url = `/category-breakdown?type=${type}`;
  if (startDate) url += `&startDate=${startDate}`;
  if (endDate) url += `&endDate=${endDate}`;

  const data = await apiFetch(url);
  analyticsData.categoryBreakdown = data;
  return data;
}

/**
 * Fetch insights
 */
async function fetchInsights() {
  const data = await apiFetch('/insights');
  analyticsData.insights = data;
  return data;
}

/**
 * Fetch predictions
 */
async function fetchPredictions() {
  const data = await apiFetch('/predictions');
  analyticsData.predictions = data;
  return data;
}

/**
 * Fetch spending velocity
 */
async function fetchSpendingVelocity() {
  const data = await apiFetch('/velocity');
  analyticsData.velocity = data;
  return data;
}

/**
 * Fetch financial forecast
 */
async function fetchForecast() {
  const data = await apiFetch('/forecast');
  analyticsData.forecast = data;
  return data;
}

/**
 * Get analytics data
 */
function getAnalyticsData() {
  return analyticsData;
}

/**
 * Clear analytics data
 */
function clearAnalyticsData() {
  analyticsData = {
    trends: null,
    categoryBreakdown: null,
    insights: null,
    predictions: null,
    velocity: null,
    forecast: null
  };
}

// Export functions for use in other modules
window.AnalyticsAPI = {
  fetchSpendingTrends,
  fetchCategoryBreakdown,
  fetchInsights,
  fetchPredictions,
  fetchSpendingVelocity,
  fetchForecast,
  getAnalyticsData,
  clearAnalyticsData
};