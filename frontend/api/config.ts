/// <reference types="vite/client" />
//API Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export const API_ENDPOINTS = {
  // Dashboard
  liveDashboard: `${API_BASE_URL}/dashboard/live/`,
  arrondissementSummary: `${API_BASE_URL}/dashboard/arrondissements/`,
  velibRealtime: `${API_BASE_URL}/velib/realtime/`,
  
  // Arrondissements
  arrondissements: `${API_BASE_URL}/arrondissements/`,
  arrondissementDetail: (id: number) => `${API_BASE_URL}/arrondissements/${id}/`,
  arrondissementAnalytics: (id: number) => `${API_BASE_URL}/arrondissements/${id}/analytics/`,
  
  // Stations
  stations: `${API_BASE_URL}/stations/`,
  stationDetail: (id: number) => `${API_BASE_URL}/stations/${id}/`,
  stationStatusHistory: (id: number, hours?: number) => 
    `${API_BASE_URL}/stations/${id}/status_history/?hours=${hours || 24}`,
  
  // Status
  status: `${API_BASE_URL}/status/`,
  
  // Trips
  trips: `${API_BASE_URL}/trips/`,
  
  // Analytics
  analytics: `${API_BASE_URL}/analytics/`,
};

async function buildApiError(response: Response): Promise<Error> {
  let bodyText = '';
  try {
    bodyText = await response.text();
  } catch {
    // ignore
  }

  const statusLine = `${response.status} ${response.statusText}`.trim();
  const proxyHint =
    response.status === 500 &&
    /ECONNREFUSED|Error occurred while proxying request|proxy/i.test(bodyText)
      ? ' (Backend not reachable: start Django on http://127.0.0.1:8000, or run `npm run start:all`.)'
      : '';

  const details = bodyText ? `\n${bodyText.slice(0, 500)}` : '';
  return new Error(`API error: ${statusLine}${proxyHint}${details}`);
}

// Generic API helper functions
export const api = {
  get: async (url: string) => {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw await buildApiError(response);
      }
      return response.json();
    } catch (err: any) {
      // Network errors (server down, CORS, DNS, etc.)
      if (err?.name === 'TypeError') {
        throw new Error(
          'API error: Network failure (is the backend running on http://127.0.0.1:8000?).',
        );
      }
      throw err;
    }
  },
  
  post: async (url: string, data: any) => {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw await buildApiError(response);
    }
    return response.json();
  },
  
  put: async (url: string, data: any) => {
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw await buildApiError(response);
    }
    return response.json();
  },
  
  delete: async (url: string) => {
    const response = await fetch(url, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw await buildApiError(response);
    }
    return response.json();
  },
};
