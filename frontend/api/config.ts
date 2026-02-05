/// <reference types="vite/client" />
//API Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export const API_ENDPOINTS = {
  // Dashboard
  liveDashboard: `${API_BASE_URL}/dashboard/live/`,
  velibRealtime: `${API_BASE_URL}/dashboard/live/`,
  communeList: `${API_BASE_URL}/dashboard/communes-list/`,
  communeSummary: `${API_BASE_URL}/dashboard/communes/`,
  
  // Arrondissements
  arrondissements: `${API_BASE_URL}/communes/`,
  arrondissementDetail: (id: number) => `${API_BASE_URL}/communes/${id}/`,
  arrondissementAnalytics: (id: number) => `${API_BASE_URL}/communes/${id}/analytics/`,
  
  // Stations
  stations: `${API_BASE_URL}/stations/`,
  stationsAll: `${API_BASE_URL}/stations/all/`,
  stationDetail: (id: number) => `${API_BASE_URL}/stations/${id}/`,
  stationStatusHistory: (id: number, hours?: number) => 
    `${API_BASE_URL}/stations/${id}/status_history/?hours=${hours || 24}`,
  
  // Status
  status: `${API_BASE_URL}/status/`,
  
  // Trips
  trips: `${API_BASE_URL}/trips/`,
  
  // Analytics
  analytics: `${API_BASE_URL}/analytics/`,
  hourlyAnalytics: `${API_BASE_URL}/hourly-analytics/`,
  weeklyAnalytics: `${API_BASE_URL}/weekly-analytics/`,
  advancedAnalytics: `${API_BASE_URL}/advanced-analytics/`,
  // Team members
  teamMembers: `${API_BASE_URL}/team-members/`,
};

// Generic API helper functions
export const api = {
  get: async (url: string) => {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`);
    }
    return response.json();
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
      throw new Error(`API error: ${response.statusText}`);
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
      throw new Error(`API error: ${response.statusText}`);
    }
    return response.json();
  },
  
  delete: async (url: string) => {
    const response = await fetch(url, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`);
    }
    return response.json();
  },
};
