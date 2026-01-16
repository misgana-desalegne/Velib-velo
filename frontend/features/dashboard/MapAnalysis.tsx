import { useState, useMemo, memo, useEffect, useRef } from 'react';
import { Card } from '../../shared/ui/card';
import { Button } from '../../shared/ui/button';
import { Badge } from '../../shared/ui/badge';
import { MapPin, Layers, Filter, ZoomIn, ZoomOut, Maximize2, Bike, AlertCircle, X } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../shared/ui/select';
import { api, API_ENDPOINTS } from '../../api/config';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Helper function to determine status based on utilization
const getStatusFromUtilization = (bikes: number, docks: number): string => {
  const capacity = bikes + docks;
  if (capacity === 0) return 'low';
  const utilization = (bikes / capacity) * 100;
  if (utilization >= 70) return 'high';
  if (utilization >= 40) return 'medium';
  return 'low';
};

export function MapAnalysis() {
  const [stations, setStations] = useState<any[]>([]);
  const [selectedStation, setSelectedStation] = useState<number | null>(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterProfile, setFilterProfile] = useState('all');
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [arrondissements, setArrondissements] = useState<any[]>([]);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any>({});

  useEffect(() => {
    const fetchStations = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch real stations from API (limit to first 500 for performance on map)
        const response = await api.get(`${API_ENDPOINTS.stations}?limit=500`);
        
        // API returns paginated response with results property
        const stationsList = response.results || response;
        
        if (Array.isArray(stationsList)) {
          const transformedStations = stationsList.map((s: any, idx: number) => {
            // Use mechanical + ebike since numbikesavailable is always 0
            const bikes = (s.mechanical || 0) + (s.ebike || 0);
            const capacity = s.capacity || 1;
            const status = getStatusFromUtilization(bikes, capacity - bikes);
            
            return {
              id: s.id || idx,
              name: s.name || s.stationcode || s.station || `Station ${s.id}`,
              lat: parseFloat(s.latitude) || 48.85,
              lng: parseFloat(s.longitude) || 2.35,
              bikes: bikes,
              docks: capacity - bikes, // Remaining capacity
              capacity: capacity,
              status: status,
              arr: s.commune_name || s.commune || `Commune ${s.id}`,
              profile: s.profile || 'unknown',
              isGhost: s.profile === 'ghost_station',
            };
          });
          
          setStations(transformedStations);
        } else {
          setError('Failed to parse station data');
          setStations([]);
        }
      } catch (err) {
        console.error('Error fetching stations:', err);
        setError(`Unable to load stations: ${err instanceof Error ? err.message : 'Unknown error'}`);
        setStations([]);
      } finally {
        setLoading(false);
      }
    };

    fetchStations();
  }, []);

  // Fetch communes data for arrondissements list
  useEffect(() => {
    const fetchArrondissements = async () => {
      try {
        const communes = await api.get(API_ENDPOINTS.communeSummary);
        if (Array.isArray(communes)) {
          const colors = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#14b8a6', '#f97316', '#6366f1', '#84cc16', '#22d3ee', '#a855f7', '#ef4444'];
          setArrondissements(communes.map((c: any, idx: number) => ({
            id: c.id,
            name: c.name || c.commune,
            stations: c.station_count || 0,
            color: colors[idx % colors.length],
          })));
        }
      } catch (err) {
        console.error('Error fetching arrondissements:', err);
      }
    };
    fetchArrondissements();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'high': return '#10b981';
      case 'medium': return '#f59e0b';
      case 'low': return '#ef4444';
      case 'critical': return '#dc2626';
      default: return '#6b7280';
    }
  };

  const getMarkerSize = (bikes: number, capacity: number) => {
    const ratio = bikes / capacity;
    if (ratio > 0.7) return 16;
    if (ratio > 0.3) return 12;
    return 10;
  };

  const filteredStations = stations.filter(s => {
    const statusMatch = filterStatus === 'all' || s.status === filterStatus;
    const profileMatch = filterProfile === 'all' || s.profile === filterProfile;
    return statusMatch && profileMatch;
  });

  // Initialize Leaflet map
  useEffect(() => {
    if (!mapRef.current) {
      // Create map
      const map = L.map('map-container', {
        center: [48.8566, 2.3522],
        zoom: 12,
        scrollWheelZoom: true
      });

      // Add OpenStreetMap tiles
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19,
        minZoom: 10
      }).addTo(map);

      mapRef.current = map;
    }
  }, []);

  // Update markers when filtered stations change
  useEffect(() => {
    if (!mapRef.current) return;

    // Clear existing markers
    Object.values(markersRef.current).forEach((marker: any) => {
      marker.remove();
    });
    markersRef.current = {};

    // Add new markers for filtered stations
    filteredStations.forEach((station) => {
      const statusColor = getStatusColor(station.status);
      const isGhost = station.isGhost;
      const markerColor = isGhost ? '#9ca3af' : statusColor;

      // Create custom HTML for marker
      const markerHTML = `
        <div style="
          width: 32px;
          height: 42px;
          background-color: ${markerColor};
          border: 3px solid white;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          cursor: pointer;
          opacity: ${isGhost ? '0.6' : '0.9'};
        ">
          <div style="
            transform: rotate(45deg);
            color: white;
            font-size: 16px;
            font-weight: bold;
          ">
            ${isGhost ? '⚠️' : '🚴'}
          </div>
        </div>
      `;

      const icon = L.divIcon({
        html: markerHTML,
        iconSize: [32, 42],
        iconAnchor: [16, 42],
        popupAnchor: [0, -42],
        className: 'custom-pin'
      });

      const popupContent = `
        <div style="padding: 12px; min-width: 220px; font-family: Arial, sans-serif;">
          <h4 style="margin: 0 0 8px 0; font-size: 14px; font-weight: bold; color: #1f2937;">
            ${station.name}
          </h4>
          <p style="margin: 0 0 12px 0; font-size: 12px; color: #6b7280;">
            📍 ${station.arr}
          </p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 8px 0;" />
          <div style="font-size: 12px; color: #374151; space-y: 8px;">
            <div style="margin: 8px 0; display: flex; justify-content: space-between;">
              <span>🚲 Vélos:</span>
              <strong style="color: #10b981;">${station.bikes}</strong>
            </div>
            <div style="margin: 8px 0; display: flex; justify-content: space-between;">
              <span>📍 Places:</span>
              <strong style="color: #3b82f6;">${station.docks}</strong>
            </div>
            <div style="margin: 8px 0; display: flex; justify-content: space-between;">
              <span>⚙️ Capacité:</span>
              <strong>${station.capacity}</strong>
            </div>
          </div>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 8px 0;" />
          <div style="margin: 8px 0; display: flex; justify-content: space-between; align-items: center;">
            <span style="font-weight: bold;">Occupation:</span>
            <strong style="font-size: 14px;">${Math.round((station.bikes / station.capacity) * 100)}%</strong>
          </div>
          <div style="margin: 8px 0; background-color: #f3f4f6; border-radius: 4px; height: 8px; overflow: hidden;">
            <div style="
              height: 100%;
              width: ${(station.bikes / station.capacity) * 100}%;
              background-color: ${markerColor};
              transition: width 0.3s;
            "></div>
          </div>
          ${isGhost ? '<div style="margin-top: 12px; padding: 8px; background-color: #fee2e2; border: 1px solid #fca5a5; border-radius: 4px; color: #991b1b; font-weight: bold; font-size: 11px;">⚠️ Station Fantôme - Comportement Imprévisible</div>' : ''}
          <div style="margin-top: 12px; padding: 8px; background-color: ${station.status === 'high' ? '#dcfce7' : station.status === 'medium' ? '#fef3c7' : '#fee2e2'}; border-radius: 4px; text-align: center; font-weight: bold; font-size: 12px; color: ${station.status === 'high' ? '#166534' : station.status === 'medium' ? '#92400e' : '#991b1b'};">
            État: ${station.status === 'high' ? '✅ Haute Disponibilité' : station.status === 'medium' ? '⚠️ Disponibilité Moyenne' : '❌ Basse Disponibilité'}
          </div>
        </div>
      `;

      const marker = L.marker([station.lat, station.lng], { icon })
        .bindPopup(popupContent, { maxWidth: 280 })
        .addTo(mapRef.current)
        .on('click', () => setSelectedStation(station.id));

      markersRef.current[station.id] = marker;
    });
  }, [filteredStations]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      {/* Header with gradient */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-8 pt-8 pb-12">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-4xl font-bold mb-2 flex items-center gap-3">
              <MapPin className="w-8 h-8" />
              Analyse Cartographique
            </h2>
            <p className="text-purple-100 text-lg">Vue interactive de toutes les stations de vélos à travers Paris</p>
          </div>
          <div className="flex gap-2">
            <Button className="bg-white text-purple-600 hover:bg-purple-50 font-semibold">
              <Maximize2 className="w-4 h-4 mr-2" />
              Plein Écran
            </Button>
            <Button className="bg-white text-purple-600 hover:bg-purple-50 font-semibold">
              Exporter Carte
            </Button>
          </div>
        </div>
      </div>

      <div className="px-8 py-8">
      {/* Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-6">
        <Card className="p-4 border-0 shadow-md">
          <label className="block text-sm font-semibold text-gray-700 mb-3">Filtrer par État</label>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="border border-gray-300">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les Stations</SelectItem>
              <SelectItem value="high">Disponibilité Haute</SelectItem>
              <SelectItem value="medium">Disponibilité Moyenne</SelectItem>
              <SelectItem value="low">Disponibilité Basse</SelectItem>
              <SelectItem value="critical">Critique</SelectItem>
            </SelectContent>
          </Select>
        </Card>

        <Card className="p-4 border-0 shadow-md">
          <label className="block text-sm font-semibold text-gray-700 mb-3">Profil de Station</label>
          <Select value={filterProfile} onValueChange={setFilterProfile}>
            <SelectTrigger className="border border-gray-300">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les Profils</SelectItem>
              <SelectItem value="ghost_station">🚫 Stations Fantômes</SelectItem>
              <SelectItem value="commuter_source">📤 Sources (Distributeurs)</SelectItem>
              <SelectItem value="commuter_sink">📥 Puits (Attracteurs)</SelectItem>
              <SelectItem value="balanced_hub">⚖️ Hubs Équilibrés</SelectItem>
            </SelectContent>
          </Select>
        </Card>

        <Card className="p-4 border-0 shadow-md">
          <label className="block text-sm font-semibold text-gray-700 mb-3">Couche Cartographique</label>
          <Select defaultValue="standard">
            <SelectTrigger className="border border-gray-300">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="standard">Standard</SelectItem>
              <SelectItem value="satellite">Satellite</SelectItem>
              <SelectItem value="terrain">Terrain</SelectItem>
            </SelectContent>
          </Select>
        </Card>

        <Card className="p-4 border-0 shadow-md">
          <label className="block text-sm font-semibold text-gray-700 mb-3">Superposition</label>
          <div className="flex items-center gap-3 p-2 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg border border-purple-200">
            <input 
              type="checkbox" 
              checked={showHeatmap}
              onChange={(e) => setShowHeatmap(e.target.checked)}
              className="rounded border border-purple-300 accent-purple-600"
              id="heatmap"
            />
            <label htmlFor="heatmap" className="text-sm font-medium text-gray-700 cursor-pointer">Afficher Heatmap</label>
          </div>
        </Card>

        <Card className={`p-4 border-0 shadow-md ${error ? 'bg-red-50 border border-red-300' : loading ? 'bg-blue-50 border border-blue-200' : 'bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200'}`}>
          {loading ? (
            <div>
              <div className="w-6 h-6 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-2"></div>
              <p className="text-sm font-semibold text-blue-900">Chargement...</p>
            </div>
          ) : error ? (
            <div className="text-sm text-red-900">
              <AlertCircle className="w-4 h-4 inline mr-1" />
              {error}
            </div>
          ) : (
            <>
              <p className="text-sm font-bold text-gray-900">{filteredStations.length} stations</p>
              <p className="text-xs text-gray-600 mt-1">sur {stations.length} au total</p>
            </>
          )}
        </Card>
      </div>

      {/* Main Map Area */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mt-6">
        {/* Map */}
        <Card className="p-0 lg:col-span-3 overflow-hidden border-0 shadow-lg">
          <div id="map-container" style={{ height: '600px', width: '100%', borderRadius: '0.5rem' }}>
            {loading && (
              <div className="flex items-center justify-center h-full bg-gradient-to-br from-blue-50 to-green-50">
                <div className="text-center">
                  <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4 mx-auto"></div>
                  <p className="text-blue-900 font-semibold">Chargement de la carte...</p>
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Station Details Panel */}
        <div className="space-y-4">
          {selectedStation ? (
            <>
              {(() => {
                const station = stations.find(s => s.id === selectedStation);
                if (!station) return null;
                return (
                  <Card className="p-5 border-0 shadow-md">
                    <div className="flex items-start justify-between mb-5">
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">{station.name}</h3>
                        <p className="text-sm text-gray-600 mt-1">📍 {station.arr}</p>
                      </div>
                      <Badge className={`px-3 py-1 font-bold text-xs ${
                        station.status === 'high' ? 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-700' :
                        station.status === 'medium' ? 'bg-gradient-to-r from-yellow-100 to-amber-100 text-yellow-700' :
                        'bg-gradient-to-r from-red-100 to-pink-100 text-red-700'
                      }`}>
                        {station.status === 'high' ? 'Haute' : station.status === 'medium' ? 'Moyenne' : 'Basse'}
                      </Badge>
                    </div>
                    
                    <div className="space-y-4 mb-5">
                      <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-semibold text-gray-700">🚲 Vélos Disponibles</span>
                          <span className="text-2xl font-bold text-green-600">{station.bikes}</span>
                        </div>
                        <p className="text-xs text-gray-600">Vélos prêts à être utilisés</p>
                      </div>
                      
                      <div className="p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg border border-blue-200">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-semibold text-gray-700">📍 Places Disponibles</span>
                          <span className="text-2xl font-bold text-blue-600">{station.docks}</span>
                        </div>
                        <p className="text-xs text-gray-600">Emplacements libres pour stationnement</p>
                      </div>
                      
                      <div className="p-4 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg border border-purple-200">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-semibold text-gray-700">⚙️ Capacité Totale</span>
                          <span className="text-2xl font-bold text-purple-600">{station.capacity}</span>
                        </div>
                        <p className="text-xs text-gray-600">Capacité maximale de la station</p>
                      </div>

                      <div className="pt-4 border-t-2 border-gray-200">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-sm font-bold text-gray-700">Taux d'Occupation</span>
                          <span className="text-lg font-bold text-gray-900">
                            {Math.round((station.bikes / station.capacity) * 100)}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-300 rounded-full h-3 overflow-hidden">
                          <div 
                            className="h-3 rounded-full transition-all duration-300 shadow-md" 
                            style={{ 
                              width: `${(station.bikes / station.capacity) * 100}%`,
                              backgroundColor: getStatusColor(station.status),
                              boxShadow: `0 0 8px ${getStatusColor(station.status)}`
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-4 border-t border-gray-200">
                      <Button size="sm" className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-semibold">
                        Détails
                      </Button>
                      <Button size="sm" className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold">
                        Itinéraire
                      </Button>
                    </div>
                  </Card>
                );
              })()}
            </>
          ) : (
            <Card className="p-6 border-0 shadow-md text-center">
              <MapPin className="w-12 h-12 text-purple-400 mx-auto mb-4" />
              <p className="text-gray-600 font-semibold">Sélectionnez une station</p>
              <p className="text-sm text-gray-500 mt-2">Cliquez sur un marqueur sur la carte pour voir les détails</p>
            </Card>
          )}

          {/* Legend */}
          <Card className="p-5 border-0 shadow-md">
            <p className="text-sm font-bold text-gray-900 mb-4">Légende des États</p>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
                <div className="w-4 h-4 rounded-full bg-gradient-to-br from-green-400 to-green-600" />
                <div className="text-xs">
                  <p className="font-semibold text-gray-900">Haute Disponibilité</p>
                  <p className="text-gray-600">70%+ de vélos</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                <div className="w-4 h-4 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600" />
                <div className="text-xs">
                  <p className="font-semibold text-gray-900">Disponibilité Moyenne</p>
                  <p className="text-gray-600">30-70% de vélos</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-red-50 rounded-lg border border-red-200">
                <div className="w-4 h-4 rounded-full bg-gradient-to-br from-red-400 to-red-600" />
                <div className="text-xs">
                  <p className="font-semibold text-gray-900">Basse Disponibilité</p>
                  <p className="text-gray-600">&lt;30% de vélos</p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Stations Table */}
      <div className="mt-8">
        <Card className="p-0 border-0 shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-4">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <Bike className="w-5 h-5" />
              Détail des Stations ({filteredStations.length})
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100 border-b-2 border-gray-300">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-700">Station</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-700">Commune</th>
                  <th className="px-6 py-3 text-center text-xs font-bold text-gray-700">🚲 Vélos</th>
                  <th className="px-6 py-3 text-center text-xs font-bold text-gray-700">📍 Places</th>
                  <th className="px-6 py-3 text-center text-xs font-bold text-gray-700">Occupation</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-700">État</th>
                </tr>
              </thead>
              <tbody>
                {filteredStations.map((station, idx) => (
                  <tr 
                    key={station.id} 
                    className={`border-b border-gray-200 hover:bg-purple-50 transition cursor-pointer ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
                    onClick={() => setSelectedStation(station.id)}
                  >
                    <td className="px-6 py-4">
                      <div className="font-semibold text-gray-900">{station.name}</div>
                      {station.isGhost && <span className="text-xs text-red-600 font-bold">⚠️ Ghost</span>}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{station.arr}</td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-block bg-green-100 text-green-800 px-3 py-1 rounded-full font-bold text-sm">
                        {station.bikes}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-bold text-sm">
                        {station.docks}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-16 bg-gray-300 rounded-full h-2 overflow-hidden">
                          <div 
                            className="h-2 rounded-full" 
                            style={{ 
                              width: `${(station.bikes / station.capacity) * 100}%`,
                              backgroundColor: getStatusColor(station.status)
                            }}
                          />
                        </div>
                        <span className="text-sm font-bold text-gray-900 min-w-[40px]">
                          {Math.round((station.bikes / station.capacity) * 100)}%
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge className={`px-3 py-1 font-bold text-xs ${
                        station.status === 'high' ? 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-700' :
                        station.status === 'medium' ? 'bg-gradient-to-r from-yellow-100 to-amber-100 text-yellow-700' :
                        'bg-gradient-to-r from-red-100 to-pink-100 text-red-700'
                      }`}>
                        {station.status === 'high' ? '✅ Haute' : station.status === 'medium' ? '⚠️ Moyenne' : '❌ Basse'}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredStations.length === 0 && (
              <div className="p-8 text-center text-gray-500">
                Aucune station ne correspond aux filtres sélectionnés
              </div>
            )}
          </div>
        </Card>
      </div>
      </div>
    </div>
  );
}
