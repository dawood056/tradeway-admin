// Time series analysis with trend, seasonality, and volatility
export function analyzeTimeSeries(data) {
  const n = data.length;
  if (n < 2) return null;

  // Calculate moving averages for trend
  const window = Math.min(6, Math.floor(n / 2));
  const ma = movingAverage(data, window);

  // Calculate volatility (standard deviation of returns)
  const returns = calculateReturns(data);
  const volatility = standardDeviation(returns);

  // Detect seasonality
  const seasonality = detectSeasonality(data);

  return {
    trend: ma,
    volatility,
    seasonality,
    lastValue: data[data.length - 1]
  };
}

// Generate predictions with trend, seasonality, and random walks
export function generatePredictions(analysis, horizons) {
  if (!analysis) return [];
  
  const { trend, volatility, seasonality, lastValue } = analysis;
  
  // Get trend direction and magnitude from last few points
  const trendSlope = getTrendSlope(trend);
  
  return Array.from({ length: horizons }).map((_, i) => {
    // Base prediction from trend
    let prediction = lastValue * (1 + trendSlope * (i + 1));
    
    // Add seasonality if detected
    if (seasonality.pattern) {
      prediction *= (1 + seasonality.magnitude * Math.sin(2 * Math.PI * (i / seasonality.period)));
    }
    
    // Add random walk based on historical volatility
    const randomWalk = randomNormal() * volatility * Math.sqrt(i + 1);
    prediction *= (1 + randomWalk);
    
    return Math.max(0, prediction);
  });
}

// Helper functions
function movingAverage(data, window) {
  const result = [];
  for (let i = 0; i < data.length; i++) {
    const start = Math.max(0, i - window + 1);
    const end = i + 1;
    const slice = data.slice(start, end);
    result.push(slice.reduce((a, b) => a + b, 0) / slice.length);
  }
  return result;
}

function calculateReturns(data) {
  const returns = [];
  for (let i = 1; i < data.length; i++) {
    returns.push((data[i] - data[i-1]) / data[i-1]);
  }
  return returns;
}

function standardDeviation(data) {
  const mean = data.reduce((a, b) => a + b, 0) / data.length;
  const squareDiffs = data.map(x => Math.pow(x - mean, 2));
  const variance = squareDiffs.reduce((a, b) => a + b, 0) / data.length;
  return Math.sqrt(variance);
}

function detectSeasonality(data) {
  // Simple seasonality detection using autocorrelation
  const n = data.length;
  if (n < 12) return { pattern: false, period: 0, magnitude: 0 };

  const demeaned = data.map(x => x - (data.reduce((a, b) => a + b, 0) / n));
  let maxCorr = 0;
  let period = 0;

  // Check for periods between 2 and 12 months
  for (let p = 2; p <= Math.min(12, Math.floor(n / 2)); p++) {
    let corr = 0;
    for (let i = 0; i < n - p; i++) {
      corr += demeaned[i] * demeaned[i + p];
    }
    corr /= n - p;
    
    if (Math.abs(corr) > Math.abs(maxCorr)) {
      maxCorr = corr;
      period = p;
    }
  }

  return {
    pattern: Math.abs(maxCorr) > 0.2,
    period,
    magnitude: maxCorr
  };
}

function getTrendSlope(trend) {
  if (trend.length < 2) return 0;
  const recent = trend.slice(-6);
  const x = Array.from({ length: recent.length }, (_, i) => i);
  
  // Simple linear regression on recent trend
  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = recent.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((a, v, i) => a + v * recent[i], 0);
  const sumXX = x.reduce((a, v) => a + v * v, 0);
  const n = recent.length;
  
  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  return slope / recent[0]; // Return relative slope
}

function randomNormal() {
  // Box-Muller transform
  const u1 = Math.random();
  const u2 = Math.random();
  return Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
}