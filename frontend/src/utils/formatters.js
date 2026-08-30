/**
 * Centralized Formatting & Display Utilities.
 * Enforces single percentage conversion, NaN/Null safety, and consistent mathematical presentation.
 */

/**
 * Formats a metric value into a clean, safe percentage string.
 * Automatically detects whether the value is in decimal notation (0.0 to 1.0)
 * or already scaled percentage notation (1.0 to 100.0).
 * Never multiplies by 100 twice (prevents 9691% bug).
 * Never outputs NaN%, null%, undefined%, or Infinity%.
 *
 * Examples:
 *   formatPercentage(0.9691)  => "96.9%"
 *   formatPercentage(96.91)   => "96.9%"
 *   formatPercentage(0.5)     => "50.0%"
 *   formatPercentage(1.0)     => "100.0%"
 *   formatPercentage(0)       => "0.0%"
 *   formatPercentage(NaN)     => "N/A"
 *   formatPercentage(null)    => "N/A"
 */
export function formatPercentage(val, decimals = 1, fallback = 'N/A') {
  if (val === null || val === undefined || val === '') return fallback;
  const num = Number(val);
  if (isNaN(num) || !isFinite(num)) return fallback;

  let scaled = num;
  // If the number is between 0 and 1 (exclusive of 0 and including 1.0 as 100%), scale it once
  // Special case: if val is strictly > 0 and <= 1.0, it represents a ratio (e.g. 0.9691 -> 96.91)
  if (num > 0 && num <= 1.0) {
    scaled = num * 100.0;
  }

  return `${scaled.toFixed(decimals)}%`;
}

/**
 * Safely formats any numeric metric value (MAE, RMSE, MSE, R²).
 * Replaces NaN / Infinity / undefined / null with clean fallback text.
 */
export function formatMetric(val, decimals = 2, fallback = 'N/A') {
  if (val === null || val === undefined || val === '') return fallback;
  const num = Number(val);
  if (isNaN(num) || !isFinite(num)) return fallback;
  return num.toFixed(decimals);
}

/**
 * Formats the Expected Score Range accurately.
 * Ensures lower bound <= predicted <= upper bound.
 */
export function formatExpectedScoreRange(predictedScore, margin = 8, minBound = 0) {
  const pred = Number(predictedScore) || 0;
  const m = Number(margin) || 8;
  const low = Math.max(minBound, pred - m);
  const high = pred + m;
  return `${low} – ${high} Runs`;
}

/**
 * Safely formats win probabilities ensuring both sum to 100%.
 */
export function formatWinProbabilities(probA, probB, decimals = 1) {
  let pA = Number(probA);
  let pB = Number(probB);

  if (isNaN(pA) && isNaN(pB)) {
    return { probA: "50.0%", probB: "50.0%", numA: 50.0, numB: 50.0 };
  }

  if (pA <= 1.0 && pA >= 0) pA = pA * 100.0;
  if (pB <= 1.0 && pB >= 0) pB = pB * 100.0;

  if (isNaN(pA)) pA = Math.max(0, 100.0 - pB);
  if (isNaN(pB)) pB = Math.max(0, 100.0 - pA);

  const roundedA = Number(pA.toFixed(decimals));
  const roundedB = Number((100.0 - roundedA).toFixed(decimals));

  return {
    probA: `${roundedA.toFixed(decimals)}%`,
    probB: `${roundedB.toFixed(decimals)}%`,
    numA: roundedA,
    numB: roundedB
  };
}
