// Analytics Renderers Module
// UI rendering functions for analytics dashboard

/**
 * Render spending trends chart
 */
function renderTrendsChart(trends) {
  const container = document.getElementById('trends-chart');
  if (!container) return;

  if (!AnalyticsUtils.isValidData(trends)) {
    container.innerHTML = '<div class="no-data">No trend data available</div>';
    return;
  }

  // Clear previous chart
  container.innerHTML = '';

  // Create canvas for Chart.js
  const canvas = document.createElement('canvas');
  canvas.id = 'trends-line-chart';
  canvas.style.maxWidth = '100%';
  canvas.style.height = '300px';
  container.appendChild(canvas);

  // Prepare data for Chart.js
  const chartData = {
    labels: trends.map(trend => trend.month),
    datasets: [{
      label: 'Monthly Spending',
      data: trends.map(trend => trend.amount),
      borderColor: '#64ffda',
      backgroundColor: 'rgba(100, 255, 218, 0.1)',
      borderWidth: 3,
      fill: true,
      tension: 0.4,
      pointBackgroundColor: '#64ffda',
      pointBorderColor: '#fff',
      pointBorderWidth: 2,
      pointRadius: 6,
      pointHoverRadius: 8
    }]
  };

  // Create line chart
  new Chart(canvas, {
    type: 'line',
    data: chartData,
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              return AnalyticsUtils.formatAnalyticsCurrency(context.parsed.y);
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: function(value) {
              return AnalyticsUtils.formatAnalyticsCurrency(value, { maximumFractionDigits: 0 });
            }
          }
        }
      }
    }
  });
}

/**
 * Render spending velocity widget
 */
function renderVelocityWidget(velocity) {
  const container = document.getElementById('velocity-widget');
  if (!container) return;

  const progressPercent = Math.min(100, (velocity.dayOfMonth / 30) * 100);

  container.innerHTML = `
    <div class="velocity-header">
      <h4><i class="fas fa-tachometer-alt"></i> Spending Velocity</h4>
      <span class="velocity-date">Day ${velocity.dayOfMonth} of month</span>
    </div>
    <div class="velocity-stats">
      <div class="velocity-stat">
        <span class="stat-value">${AnalyticsUtils.formatAnalyticsCurrency(velocity.currentSpent)}</span>
        <span class="stat-label">Spent this month</span>
      </div>
      <div class="velocity-stat">
        <span class="stat-value">${AnalyticsUtils.formatAnalyticsCurrency(velocity.dailyAverage)}</span>
        <span class="stat-label">Daily average</span>
      </div>
      <div class="velocity-stat projected">
        <span class="stat-value">${AnalyticsUtils.formatAnalyticsCurrency(velocity.projectedMonthEnd)}</span>
        <span class="stat-label">Projected month end</span>
      </div>
    </div>
    <div class="velocity-progress">
      <div class="progress-bar">
        <div class="progress-fill" style="width: ${progressPercent}%"></div>
      </div>
      <span class="progress-text">${velocity.daysRemaining} days remaining</span>
    </div>
  `;
}

/**
 * Render category breakdown chart
 */
function renderCategoryChart(breakdown) {
  const container = document.getElementById('category-chart');
  if (!container) return;

  if (!AnalyticsUtils.isValidData(breakdown?.categories)) {
    container.innerHTML = '<div class="no-data">No expense data available</div>';
    return;
  }

  // Clear previous chart
  container.innerHTML = '';

  const categoryColors = AnalyticsUtils.getCategoryColors();
  const categoryIcons = AnalyticsUtils.getCategoryIcons();

  // Create chart header
  const header = document.createElement('div');
  header.className = 'category-chart-header';
  header.innerHTML = `
    <h4><i class="fas fa-pie-chart"></i> Category Breakdown</h4>
    <span class="total-amount">Total: ${AnalyticsUtils.formatAnalyticsCurrency(breakdown.grandTotal)}</span>
  `;
  container.appendChild(header);

  // Create canvas for Chart.js
  const canvas = document.createElement('canvas');
  canvas.id = 'category-pie-chart';
  canvas.style.maxWidth = '100%';
  canvas.style.height = '300px';
  container.appendChild(canvas);

  // Prepare data for Chart.js
  const chartData = {
    labels: breakdown.categories.map(cat => `${categoryIcons[cat.category] || '📋'} ${AnalyticsUtils.capitalizeFirst(cat.category)}`),
    datasets: [{
      data: breakdown.categories.map(cat => cat.total),
      backgroundColor: breakdown.categories.map(cat => categoryColors[cat.category] || '#999'),
      borderColor: breakdown.categories.map(cat => categoryColors[cat.category] || '#999'),
      borderWidth: 2,
      hoverOffset: 10
    }]
  };

  // Create pie chart
  new Chart(canvas, {
    type: 'pie',
    data: chartData,
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            padding: 20,
            usePointStyle: true
          }
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const total = context.dataset.data.reduce((a, b) => a + b, 0);
              const percentage = ((context.parsed / total) * 100).toFixed(1);
              return `${context.label}: ${AnalyticsUtils.formatAnalyticsCurrency(context.parsed)} (${percentage}%)`;
            }
          }
        }
      }
    }
  });
}

/**
 * Render insights widget
 */
function renderInsightsWidget(insights) {
  const container = document.getElementById('insights-widget');
  if (!container) return;

  if (!AnalyticsUtils.isValidData(insights)) {
    container.innerHTML = '<div class="no-data">No insights available</div>';
    return;
  }

  const insightsHTML = insights.map(insight => `
    <div class="insight-item">
      <div class="insight-icon">
        <i class="fas fa-lightbulb"></i>
      </div>
      <div class="insight-content">
        <h5>${insight.title}</h5>
        <p>${insight.description}</p>
        ${insight.suggestion ? `<small class="suggestion">${insight.suggestion}</small>` : ''}
      </div>
    </div>
  `).join('');

  container.innerHTML = `
    <div class="insights-header">
      <h4><i class="fas fa-brain"></i> AI Insights</h4>
    </div>
    <div class="insights-list">
      ${insightsHTML}
    </div>
  `;
}

/**
 * Render predictions widget
 */
function renderPredictionsWidget(predictions) {
  const container = document.getElementById('predictions-widget');
  if (!container) return;

  if (!AnalyticsUtils.isValidData(predictions)) {
    container.innerHTML = '<div class="no-data">No predictions available</div>';
    return;
  }

  const predictionsHTML = predictions.map(prediction => `
    <div class="prediction-item">
      <div class="prediction-category">
        <span class="category-name">${AnalyticsUtils.capitalizeFirst(prediction.category)}</span>
        <span class="confidence">${AnalyticsUtils.formatPercentage(prediction.confidence)}</span>
      </div>
      <div class="prediction-amount">
        <span class="amount">${AnalyticsUtils.formatAnalyticsCurrency(prediction.predictedAmount)}</span>
        <span class="period">next month</span>
      </div>
    </div>
  `).join('');

  container.innerHTML = `
    <div class="predictions-header">
      <h4><i class="fas fa-chart-line"></i> Spending Predictions</h4>
    </div>
    <div class="predictions-list">
      ${predictionsHTML}
    </div>
  `;
}

/**
 * Render forecast widget
 */
function renderForecastWidget(forecast) {
  const container = document.getElementById('forecast-widget');
  if (!container) return;

  if (!AnalyticsUtils.isValidData(forecast)) {
    container.innerHTML = '<div class="no-data">No forecast data available</div>';
    return;
  }

  container.innerHTML = `
    <div class="forecast-header">
      <h4><i class="fas fa-crystal-ball"></i> Financial Forecast</h4>
    </div>
    <div class="forecast-content">
      <div class="forecast-item">
        <span class="forecast-label">3-Month Projection:</span>
        <span class="forecast-value">${AnalyticsUtils.formatAnalyticsCurrency(forecast.threeMonthProjection)}</span>
      </div>
      <div class="forecast-item">
        <span class="forecast-label">6-Month Projection:</span>
        <span class="forecast-value">${AnalyticsUtils.formatAnalyticsCurrency(forecast.sixMonthProjection)}</span>
      </div>
      <div class="forecast-item">
        <span class="forecast-label">Savings Potential:</span>
        <span class="forecast-value positive">${AnalyticsUtils.formatAnalyticsCurrency(forecast.savingsPotential)}</span>
      </div>
    </div>
  `;
}

// Export rendering functions
window.AnalyticsRenderers = {
  renderTrendsChart,
  renderVelocityWidget,
  renderCategoryChart,
  renderInsightsWidget,
  renderPredictionsWidget,
  renderForecastWidget
};