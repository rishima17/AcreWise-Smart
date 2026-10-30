const BASE = (import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000').replace(/\/$/, '');

export async function apiRequest(path, options = {}) {
  const response = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const detailMsg = typeof body.detail === 'string' ? body.detail : (body.message || JSON.stringify(body.detail) || `Request failed (${response.status})`);
    throw new Error(detailMsg);
  }
  return body;
}

export async function fetchRecommendations(farmData, season) {
  const payload = {
    state: farmData.state || 'Punjab',
    district: farmData.district || 'Amritsar',
    acreage: Number(farmData.acres) || 5.0,
    soil_type: farmData.soil && farmData.soil !== 'Unknown' ? farmData.soil.toLowerCase() : null,
    water_availability: (farmData.water || 'medium').toLowerCase(),
    previous_crop: farmData.previousCrop && farmData.previousCrop !== 'Unknown' ? farmData.previousCrop : null,
    season: season || farmData.season || 'Rabi 2026'
  };
  return apiRequest('/api/recommendations', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export async function fetchWhatIfScenario(scenarioPayload) {
  return apiRequest('/api/scenarios/simulate', {
    method: 'POST',
    body: JSON.stringify(scenarioPayload)
  });
}

export async function sendAdvisoryMessage(message, language = 'en', history = [], farmContext = null) {
  return apiRequest('/api/advisory/chat', {
    method: 'POST',
    body: JSON.stringify({ message, language, history, farm_context: farmContext })
  });
}

export async function fetchSchemes() {
  return apiRequest('/api/schemes');
}

export const apiBase = BASE;
