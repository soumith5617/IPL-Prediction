/**
 * Cricket Mathematical Utilities.
 * Correctly converts cricket notation overs (e.g. 10.5 meaning 10 overs and 5 balls)
 * to true decimal overs (10 + 5/6 = 10.8333...) for exact run rate calculations.
 * Enforces strictly 6 balls per over (0.0 to 0.5 -> 1.0, 9.5 -> 10.0, etc.).
 */

/**
 * Validates whether an overs value is in valid cricket notation (0.0 to 20.0).
 * Decimal part must have balls between 0 and 5 (.0, .1, .2, .3, .4, .5).
 */
export function isValidCricketOvers(overs) {
  const num = Number(overs);
  if (isNaN(num) || num < 0 || num > 20) return false;
  
  const fullOvers = Math.floor(num);
  // Extract ball component with float rounding protection
  const balls = Math.round((num - fullOvers) * 10);
  
  if (fullOvers === 20 && balls > 0) return false; // 20.0 is max for T20
  return balls >= 0 && balls <= 5;
}

/**
 * Converts cricket overs notation (e.g. 10.5) to decimal overs (10 + 5/6).
 */
export function cricketOversToDecimal(overs) {
  const num = Number(overs);
  if (isNaN(num) || num <= 0) return 0;
  
  const fullOvers = Math.floor(num);
  const balls = Math.round((num - fullOvers) * 10);
  
  // Guard for ball overflow if entered raw (e.g., .6 balls is a full over)
  const normalizedBalls = Math.min(balls, 5);
  return fullOvers + (normalizedBalls / 6.0);
}

/**
 * Total balls bowled from cricket overs notation (e.g. 10.5 -> 65 balls).
 */
export function cricketOversToTotalBalls(overs) {
  const num = Number(overs);
  if (isNaN(num) || num <= 0) return 0;
  
  const fullOvers = Math.floor(num);
  const balls = Math.round((num - fullOvers) * 10);
  return (fullOvers * 6) + Math.min(Math.max(0, balls), 5);
}

/**
 * Calculates accurate Current Run Rate (CRR).
 * CRR = runs / completed_overs (using decimal conversion 10.5 -> 10 + 5/6).
 */
export function calculateAccurateCRR(runs, overs) {
  const decimalOvers = cricketOversToDecimal(overs);
  if (decimalOvers <= 0) return "0.00";
  const numRuns = Number(runs) || 0;
  return (numRuns / decimalOvers).toFixed(2);
}

/**
 * Formats cricket overs nicely (e.g. 10.5 -> "10.5 ov (65 balls)").
 */
export function formatCricketOvers(overs) {
  const num = Number(overs);
  if (isNaN(num) || num < 0) return "0.0 ov";
  const balls = cricketOversToTotalBalls(num);
  return `${Number(num).toFixed(1)} ov (${balls} balls)`;
}

/**
 * Increments cricket overs by exactly 1 legal ball delivery:
 * 9.0 -> 9.1 -> 9.2 -> 9.3 -> 9.4 -> 9.5 -> 10.0 -> 10.1 ... up to 20.0
 */
export function incrementCricketOvers(overs, maxOvers = 20.0) {
  const totalBalls = cricketOversToTotalBalls(overs);
  const maxBalls = Math.round(Number(maxOvers) * 6);
  const nextBalls = Math.min(maxBalls, totalBalls + 1);
  const fullOvers = Math.floor(nextBalls / 6);
  const remainingBalls = nextBalls % 6;
  return Number(`${fullOvers}.${remainingBalls}`);
}

/**
 * Decrements cricket overs by exactly 1 legal ball delivery:
 * 10.0 -> 9.5 -> 9.4 -> 9.3 -> 9.2 -> 9.1 -> 9.0 -> 8.5 ... down to 0.0
 */
export function decrementCricketOvers(overs, minOvers = 0.0) {
  const totalBalls = cricketOversToTotalBalls(overs);
  const minBalls = Math.round(Number(minOvers) * 6);
  const prevBalls = Math.max(minBalls, totalBalls - 1);
  const fullOvers = Math.floor(prevBalls / 6);
  const remainingBalls = prevBalls % 6;
  return Number(`${fullOvers}.${remainingBalls}`);
}

/**
 * Normalizes any number or step input into valid cricket overs:
 * If user inputs or steps .6, .7, .8, .9:
 * - Detects step-up from .5 -> .6: automatically rolls over to next whole over (.0)
 * - Detects step-down from .0 -> .9: automatically rolls down to previous over .5
 * - Enforces 6 balls maximum per over.
 */
export function normalizeCricketOvers(newVal, prevVal = null) {
  const num = Number(newVal);
  if (isNaN(num) || num < 0) return 0.0;
  if (num >= 20.0) return 20.0;

  const prev = prevVal !== null ? Number(prevVal) : null;
  const fullOvers = Math.floor(num);
  const ballFraction = Math.round((num - fullOvers) * 10);

  if (prev !== null) {
    const prevFull = Math.floor(prev);
    const prevBalls = Math.round((prev - prevFull) * 10);

    // Stepping up: was at .5 and became .6 -> roll over to next whole over
    if (prevBalls === 5 && ballFraction >= 6) {
      return Math.min(20.0, Number((prevFull + 1).toFixed(1)));
    }
    // Stepping down: was at .0 and became .9 -> roll down to (prevFull - 1).5
    if (prevBalls === 0 && ballFraction >= 6) {
      return Math.max(0.0, Number((prevFull - 1 + 0.5).toFixed(1)));
    }
  }

  // Direct manual input clamping: ball fraction cannot exceed 5
  if (ballFraction >= 6) {
    return Math.min(20.0, Number((fullOvers + 1).toFixed(1)));
  }

  return Number(`${fullOvers}.${ballFraction}`);
}
