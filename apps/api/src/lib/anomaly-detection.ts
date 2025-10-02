/**
 * ML-Based Anomaly Detection System
 *
 * Uses time-series analysis and statistical methods to detect anomalies
 * in system metrics (latency, error rate, traffic patterns).
 *
 * Algorithms:
 * - Z-Score (Statistical)
 * - Moving Average Deviation
 * - Exponential Smoothing
 * - IQR (Interquartile Range)
 *
 * Future: Prophet/ARIMA for forecasting (requires Python service)
 *
 * References:
 * - Statistical Anomaly Detection: https://en.wikipedia.org/wiki/Anomaly_detection
 * - Time Series Analysis: https://otexts.com/fpp3/
 * - Prophet (Meta): https://facebook.github.io/prophet/
 *
 * Created: October 2, 2025
 */

export interface TimeSeries {
  timestamp: number; // Unix timestamp
  value: number;
}

export interface AnomalyDetectionResult {
  isAnomaly: boolean;
  score: number; // 0-1, higher = more anomalous
  expectedValue: number;
  actualValue: number;
  deviation: number;
  method: string;
  confidence: number; // 0-1
}

/**
 * Z-Score anomaly detection
 * Detects values that are N standard deviations from the mean
 */
export function detectAnomalyZScore(
  timeseries: TimeSeries[],
  threshold = 3,
): AnomalyDetectionResult[] {
  if (timeseries.length < 3) {
    return [];
  }

  // Calculate mean and standard deviation
  const values = timeseries.map((t) => t.value);
  const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
  const variance =
    values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
  const stdDev = Math.sqrt(variance);

  // Detect anomalies
  return timeseries.map((point) => {
    const zScore = stdDev === 0 ? 0 : Math.abs(point.value - mean) / stdDev;
    const isAnomaly = zScore > threshold;

    return {
      isAnomaly,
      score: Math.min(zScore / threshold, 1),
      expectedValue: mean,
      actualValue: point.value,
      deviation: point.value - mean,
      method: "z-score",
      confidence: isAnomaly ? 1 - 1 / zScore : 0,
    };
  });
}

/**
 * Moving Average anomaly detection
 * Detects values that deviate significantly from moving average
 */
export function detectAnomalyMovingAverage(
  timeseries: TimeSeries[],
  windowSize = 10,
  thresholdPercent = 30,
): AnomalyDetectionResult[] {
  if (timeseries.length < windowSize) {
    return [];
  }

  const results: AnomalyDetectionResult[] = [];

  for (let i = windowSize; i < timeseries.length; i++) {
    // Calculate moving average
    const window = timeseries.slice(i - windowSize, i);
    const ma = window.reduce((sum, t) => sum + t.value, 0) / window.length;

    const actualValue = timeseries[i].value;
    const deviation = Math.abs(actualValue - ma);
    const deviationPercent = (deviation / ma) * 100;
    const isAnomaly = deviationPercent > thresholdPercent;

    results.push({
      isAnomaly,
      score: Math.min(deviationPercent / thresholdPercent, 1),
      expectedValue: ma,
      actualValue,
      deviation: actualValue - ma,
      method: "moving-average",
      confidence: isAnomaly ? deviationPercent / 100 : 0,
    });
  }

  return results;
}

/**
 * IQR (Interquartile Range) anomaly detection
 * Detects outliers using the IQR method
 */
export function detectAnomalyIQR(
  timeseries: TimeSeries[],
): AnomalyDetectionResult[] {
  if (timeseries.length < 4) {
    return [];
  }

  // Sort values
  const sortedValues = timeseries.map((t) => t.value).sort((a, b) => a - b);

  // Calculate quartiles
  const q1Index = Math.floor(sortedValues.length * 0.25);
  const q3Index = Math.floor(sortedValues.length * 0.75);
  const q1 = sortedValues[q1Index];
  const q3 = sortedValues[q3Index];
  const iqr = q3 - q1;

  // Calculate bounds
  const lowerBound = q1 - 1.5 * iqr;
  const upperBound = q3 + 1.5 * iqr;

  // Detect anomalies
  return timeseries.map((point) => {
    const isAnomaly = point.value < lowerBound || point.value > upperBound;
    const median = sortedValues[Math.floor(sortedValues.length / 2)];

    let score = 0;
    if (point.value < lowerBound) {
      score = (lowerBound - point.value) / iqr;
    } else if (point.value > upperBound) {
      score = (point.value - upperBound) / iqr;
    }

    return {
      isAnomaly,
      score: Math.min(score, 1),
      expectedValue: median,
      actualValue: point.value,
      deviation: point.value - median,
      method: "iqr",
      confidence: isAnomaly ? Math.min(score, 1) : 0,
    };
  });
}

/**
 * Exponential Smoothing anomaly detection
 * Detects deviations from exponentially weighted moving average
 */
export function detectAnomalyExponentialSmoothing(
  timeseries: TimeSeries[],
  alpha = 0.3,
  thresholdPercent = 25,
): AnomalyDetectionResult[] {
  if (timeseries.length < 2) {
    return [];
  }

  const results: AnomalyDetectionResult[] = [];
  let ema = timeseries[0].value; // Initialize with first value

  for (let i = 1; i < timeseries.length; i++) {
    const actualValue = timeseries[i].value;
    const deviation = Math.abs(actualValue - ema);
    const deviationPercent = ema === 0 ? 0 : (deviation / ema) * 100;
    const isAnomaly = deviationPercent > thresholdPercent;

    results.push({
      isAnomaly,
      score: Math.min(deviationPercent / thresholdPercent, 1),
      expectedValue: ema,
      actualValue,
      deviation: actualValue - ema,
      method: "exponential-smoothing",
      confidence: isAnomaly ? Math.min(deviationPercent / 50, 1) : 0,
    });

    // Update EMA
    ema = alpha * actualValue + (1 - alpha) * ema;
  }

  return results;
}

/**
 * Ensemble anomaly detection
 * Combines multiple methods for higher accuracy
 */
export function detectAnomalyEnsemble(
  timeseries: TimeSeries[],
): AnomalyDetectionResult[] {
  // Run all detection methods
  const zScoreResults = detectAnomalyZScore(timeseries, 3);
  const maResults = detectAnomalyMovingAverage(timeseries, 10, 30);
  const iqrResults = detectAnomalyIQR(timeseries);
  const esResults = detectAnomalyExponentialSmoothing(timeseries, 0.3, 25);

  // Combine results (voting)
  const ensembleResults: AnomalyDetectionResult[] = [];

  for (let i = 0; i < timeseries.length; i++) {
    const votes: AnomalyDetectionResult[] = [];

    if (zScoreResults[i]) votes.push(zScoreResults[i]);
    if (maResults[i - 10]) votes.push(maResults[i - 10]); // Offset for MA window
    if (iqrResults[i]) votes.push(iqrResults[i]);
    if (esResults[i - 1]) votes.push(esResults[i - 1]); // Offset for ES

    if (votes.length === 0) continue;

    const anomalyCount = votes.filter((v) => v.isAnomaly).length;
    const avgScore = votes.reduce((sum, v) => sum + v.score, 0) / votes.length;
    const avgConfidence =
      votes.reduce((sum, v) => sum + v.confidence, 0) / votes.length;

    // Anomaly if majority vote (>50%)
    const isAnomaly = anomalyCount > votes.length / 2;

    ensembleResults.push({
      isAnomaly,
      score: avgScore,
      expectedValue:
        votes.reduce((sum, v) => sum + v.expectedValue, 0) / votes.length,
      actualValue: timeseries[i].value,
      deviation: votes.reduce((sum, v) => sum + v.deviation, 0) / votes.length,
      method: "ensemble",
      confidence: avgConfidence,
    });
  }

  return ensembleResults;
}

/**
 * Monitor metric for anomalies
 * Fetches timeseries from Prometheus and runs detection
 */
export async function monitorMetricForAnomalies(
  metricName: string,
  prometheusUrl: string,
  lookbackMinutes = 60,
): Promise<{
  anomaliesDetected: boolean;
  anomalies: {
    timestamp: number;
    value: number;
    score: number;
    method: string;
  }[];
  totalPoints: number;
}> {
  try {
    // Fetch metric from Prometheus
    const query = `${metricName}[${lookbackMinutes}m]`;
    const response = await fetch(
      `${prometheusUrl}/api/v1/query?query=${encodeURIComponent(query)}`,
    );

    const data = (await response.json()) as {
      data: {
        result: {
          values: [number, string][];
        }[];
      };
    };

    if (
      !data.data.result ||
      data.data.result.length === 0 ||
      !data.data.result[0].values
    ) {
      return {
        anomaliesDetected: false,
        anomalies: [],
        totalPoints: 0,
      };
    }

    // Convert to TimeSeries
    const timeseries: TimeSeries[] = data.data.result[0].values.map(
      ([timestamp, value]) => ({
        timestamp,
        value: parseFloat(value),
      }),
    );

    // Run ensemble detection
    const results = detectAnomalyEnsemble(timeseries);
    const anomalies = results
      .map((r, i) => ({
        timestamp: timeseries[i].timestamp,
        value: r.actualValue,
        score: r.score,
        method: r.method,
      }))
      .filter((_, i) => results[i].isAnomaly);

    return {
      anomaliesDetected: anomalies.length > 0,
      anomalies,
      totalPoints: timeseries.length,
    };
  } catch (error) {
    console.error(`[AnomalyDetection] Failed to monitor ${metricName}:`, error);
    return {
      anomaliesDetected: false,
      anomalies: [],
      totalPoints: 0,
    };
  }
}

/**
 * Get anomaly detection recommendations
 */
export function getAnomalyRecommendations(
  results: AnomalyDetectionResult[],
): string[] {
  const recommendations: string[] = [];
  const anomalies = results.filter((r) => r.isAnomaly);

  if (anomalies.length === 0) {
    return ["No anomalies detected. System is operating normally."];
  }

  const avgScore =
    anomalies.reduce((sum, a) => sum + a.score, 0) / anomalies.length;

  if (avgScore > 0.8) {
    recommendations.push(
      "⚠️ Critical anomalies detected. Immediate investigation required.",
    );
  } else if (avgScore > 0.5) {
    recommendations.push("⚡ Moderate anomalies detected. Monitor closely.");
  } else {
    recommendations.push(
      "ℹ️ Minor anomalies detected. Review when convenient.",
    );
  }

  // Detect patterns
  const consecutiveAnomalies = results.reduce((max, r, i, arr) => {
    if (!r.isAnomaly) return max;
    let count = 1;
    for (let j = i + 1; j < arr.length && arr[j].isAnomaly; j++) {
      count++;
    }
    return Math.max(max, count);
  }, 0);

  if (consecutiveAnomalies > 5) {
    recommendations.push(
      "📈 Sustained anomaly pattern detected. Possible systemic issue.",
    );
  }

  return recommendations;
}
