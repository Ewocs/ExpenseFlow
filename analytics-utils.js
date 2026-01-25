// Analytics Utils Module
// Utility functions for analytics dashboard

/**
 * Get current locale for formatting
 */
const getAnalyticsLocale = () => (window.i18n?.getLocale?.() && window.i18n.getLocale()) || 'en-US';

/**
 * Get current currency for formatting
 */
const getAnalyticsCurrency = () => (window.i18n?.getCurrency?.() && window.i18n.getCurrency()) || 'INR';

/**
 * Format currency values for display
 */
function formatAnalyticsCurrency(value, options = {}) {
  const currency = options.currency || getAnalyticsCurrency();
  if (window.i18n?.formatCurrency) {
    return window.i18n.formatCurrency(value, {
      currency,
      locale: getAnalyticsLocale(),
      minimumFractionDigits: options.minimumFractionDigits ?? 0,
      maximumFractionDigits: options.maximumFractionDigits ?? 0
    });
  }

  const amount = Number(value || 0);
  return `${currency} ${amount.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

/**
 * Capitalize first letter of a string
 */
function capitalizeFirst(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Format percentage values
 */
function formatPercentage(value, decimals = 1) {
  return `${Number(value || 0).toFixed(decimals)}%`;
}

/**
 * Generate color palette for charts
 */
function getCategoryColors() {
  return {
    food: '#FF6B6B',
    transport: '#4ECDC4',
    entertainment: '#96CEB4',
    utilities: '#FECA57',
    healthcare: '#FF9FF3',
    shopping: '#45B7D1',
    other: '#A55EEA'
  };
}

/**
 * Get category icons
 */
function getCategoryIcons() {
  return {
    food: '🍽️',
    transport: '🚗',
    entertainment: '🎬',
    utilities: '💡',
    healthcare: '🏥',
    shopping: '🛒',
    other: '📋'
  };
}

/**
 * Debounce function for performance optimization
 */
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Check if data is valid and not empty
 */
function isValidData(data) {
  return data && (Array.isArray(data) ? data.length > 0 : Object.keys(data).length > 0);
}

// Export utility functions
window.AnalyticsUtils = {
  getAnalyticsLocale,
  getAnalyticsCurrency,
  formatAnalyticsCurrency,
  capitalizeFirst,
  formatPercentage,
  getCategoryColors,
  getCategoryIcons,
  debounce,
  isValidData
};