/**
 * Calculate derived age accurately from a date of birth string.
 * Supports various formats: 'YYYY-MM-DD', 'DD-MM-YYYY', 'YYYY/MM/DD', 'DD/MM/YYYY', or single year 'YYYY'.
 * Returns formatted string like "35 yrs" or null if invalid.
 */
export function calculateDerivedAge(dobStr) {
  if (!dobStr || typeof dobStr !== 'string') return null;

  const trimmed = dobStr.trim();
  if (!trimmed) return null;

  let birthDate = null;

  // Try parsing ISO date or standard format
  if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(trimmed)) {
    const [y, m, d] = trimmed.split('-').map(Number);
    birthDate = new Date(y, m - 1, d);
  } else if (/^\d{1,2}[-/]\d{1,2}[-/]\d{4}$/.test(trimmed)) {
    const parts = trimmed.split(/[-/]/).map(Number);
    // Usually DD-MM-YYYY in cricket records
    birthDate = new Date(parts[2], parts[1] - 1, parts[0]);
  } else if (/^\d{4}$/.test(trimmed)) {
    const year = Number(trimmed);
    const currentYear = new Date().getFullYear();
    const age = currentYear - year;
    return age > 0 && age < 100 ? `${age} yrs` : null;
  } else {
    const parsed = new Date(trimmed);
    if (!isNaN(parsed.getTime())) {
      birthDate = parsed;
    }
  }

  if (!birthDate || isNaN(birthDate.getTime())) return null;

  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  if (age < 15 || age > 75) {
    return null; // out of reasonable range for professional cricketers
  }

  return `${age} yrs`;
}

/**
 * Format date string to standard readable format
 */
export function formatDob(dobStr) {
  if (!dobStr) return 'N/A';
  const age = calculateDerivedAge(dobStr);
  if (age) {
    return `${dobStr} (${age})`;
  }
  return dobStr;
}

/**
 * Format relative time (e.g., '2 mins ago', 'Just now')
 */
export function formatRelativeTime(dateStr) {
  if (!dateStr) return 'Recently';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return 'Recently';

  const now = new Date();
  const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffSec < 60) return 'Just now';
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  return `${Math.floor(diffSec / 86400)}d ago`;
}
