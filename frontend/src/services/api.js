/**
 * Centralized API Service for IPL Prediction System.
 * Connects frontend views directly to production FastAPI backend endpoints.
 * Handles 200, 400, 404, 422, 500, network errors, timeouts, and formats user-friendly error messages.
 */

const RAW_BASE = import.meta.env.VITE_API_BASE_URL || '';
// In development with Vite proxy or production, use relative /api or configured base URL
export const API_BASE = RAW_BASE ? `${RAW_BASE.replace(/\/$/, '')}/api` : '/api';

const DEFAULT_TIMEOUT_MS = 10000;

/**
 * Standardized Fetch Wrapper with timeout and error handling.
 */
async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), options.timeoutMs || DEFAULT_TIMEOUT_MS);

  const config = {
    ...options,
    signal: controller.signal,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...(options.headers || {})
    }
  };

  try {
    const response = await fetch(url, config);
    clearTimeout(timeoutId);

    // 1. Success 200-299
    if (response.ok) {
      // Return empty object for 204 No Content
      if (response.status === 204) return {};
      return await response.json();
    }

    // 2. Error status handling: 400, 404, 422, 500
    let errorData = null;
    try {
      errorData = await response.json();
    } catch {
      // Non-JSON response payload
      errorData = { message: response.statusText };
    }

    let userFriendlyMessage = 'An unexpected error occurred while communicating with the prediction engine.';

    if (response.status === 400) {
      userFriendlyMessage = errorData.detail || errorData.message || 'Invalid prediction parameters provided.';
    } else if (response.status === 404) {
      userFriendlyMessage = errorData.detail || errorData.message || 'Requested match, player, or model record was not found.';
    } else if (response.status === 422) {
      // Format validation errors cleanly
      if (Array.isArray(errorData.details) && errorData.details.length > 0) {
        userFriendlyMessage = errorData.details.map(d => `${d.field ? `${d.field}: ` : ''}${d.message}`).join(', ');
      } else if (Array.isArray(errorData.detail)) {
        userFriendlyMessage = errorData.detail.map(d => `${d.loc ? d.loc.slice(-1)[0] : 'field'}: ${d.msg}`).join(', ');
      } else {
        userFriendlyMessage = errorData.detail || errorData.message || 'Input validation failed. Please check all match fields.';
      }
    } else if (response.status === 500) {
      userFriendlyMessage = 'The prediction server encountered an internal error. Please try again shortly.';
    } else {
      userFriendlyMessage = errorData.detail || errorData.message || `Server returned error (${response.status}).`;
    }

    const err = new Error(userFriendlyMessage);
    err.status = response.status;
    err.data = errorData;
    throw err;

  } catch (error) {
    clearTimeout(timeoutId);

    if (error.name === 'AbortError') {
      const timeoutErr = new Error('Connection timed out. The prediction server took too long to respond.');
      timeoutErr.status = 408;
      throw timeoutErr;
    }

    if (!error.status && (error instanceof TypeError || error.message?.includes('Failed to fetch'))) {
      const networkErr = new Error('Unable to connect to the prediction backend server. Please verify the API is online.');
      networkErr.status = 503;
      throw networkErr;
    }

    throw error;
  }
}

// ============================================================================
// SYSTEM & HEALTH FLOWS
// ============================================================================

export async function fetchHealth() {
  return request('/health');
}

// ============================================================================
// FRANCHISE / TEAMS FLOWS
// ============================================================================

export async function fetchTeams() {
  return request('/teams');
}

export async function fetchTeamById(teamId) {
  return request(`/teams/${teamId}`);
}

export async function compareTeamsH2H(team1, team2) {
  const params = new URLSearchParams({ team1, team2 });
  return request(`/teams/compare/h2h?${params.toString()}`);
}

// ============================================================================
// PLAYER SCOUTING FLOWS
// ============================================================================

export async function fetchPlayers({
  search = '',
  country = '',
  battingHand = '',
  bowlingSkill = '',
  sortBy = 'runs',
  page = 1,
  limit = 25
} = {}) {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    sort_by: sortBy
  });

  if (search.trim()) params.append('search', search.trim());
  if (country && country !== 'All') params.append('country', country);
  if (battingHand && battingHand !== 'All') params.append('batting_hand', battingHand);
  if (bowlingSkill && bowlingSkill !== 'All') params.append('bowling_skill', bowlingSkill);

  return request(`/players?${params.toString()}`);
}

export async function fetchPlayerDetail(playerId) {
  return request(`/players/${playerId}`);
}

// ============================================================================
// MACHINE LEARNING PREDICTION FLOWS
// ============================================================================

/**
 * 1st Innings Score Prediction
 * POST /api/predict/score
 */
export async function predictScore(payload) {
  return request('/predict/score', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

/**
 * 2nd Innings Win Probability Prediction
 * POST /api/predict/win
 */
export async function predictWinProbability(payload) {
  return request('/predict/win', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

/**
 * Pre-Match Ensemble Match Forecast
 * POST /api/predict/match
 */
export async function predictMatch(payload) {
  return request('/predict/match', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

// ============================================================================
// PREDICTION HISTORY & AUDIT FLOWS
// ============================================================================

export async function fetchPredictions({
  predictionType = 'all',
  limit = 50,
  skip = 0
} = {}) {
  const params = new URLSearchParams({
    limit: limit.toString(),
    skip: skip.toString()
  });

  if (predictionType && predictionType !== 'all') {
    params.append('prediction_type', predictionType);
  }

  return request(`/predictions?${params.toString()}`);
}

export async function fetchHistory(predictionType = 'all', limit = 50) {
  return fetchPredictions({ predictionType, limit });
}

export async function clearHistory() {
  return request('/predictions/clear', {
    method: 'DELETE'
  });
}

// ============================================================================
// ANALYTICS & METRICS FLOWS
// ============================================================================

export async function fetchDashboardSummary() {
  return request('/analytics/dashboard-summary');
}

export async function fetchVenues() {
  return request('/analytics/venues');
}

export async function fetchModelMetrics() {
  return request('/model/metrics');
}

export async function fetchModelInfo() {
  return request('/model/info');
}

export async function fetchDatasetInfo() {
  return request('/model/dataset-info');
}
