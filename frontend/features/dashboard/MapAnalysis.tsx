import { useState, useMemo, memo, useEffect, useRef } from 'react';
import { Card } from '../../shared/ui/card';
import { Button } from '../../shared/ui/button';
import { Badge } from '../../shared/ui/badge';
import { MapPin, Layers, Filter, ZoomIn, ZoomOut, Maximize2, Bike, AlertCircle, X } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../shared/ui/select';
import { api, API_ENDPOINTS } from '../../api/config';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';

// Extend Leaflet with marker cluster
import 'leaflet.markercluster';

// Paris Arrondissements with center coordinates
const PARIS_ARRONDISSEMENTS = [
  { num: 1, name: 'Louvre', lat: 48.8619, lng: 2.3356, color: '#FF6B6B' },
  { num: 2, name: 'Bourse', lat: 48.8691, lng: 2.3394, color: '#4ECDC4' },
  { num: 3, name: 'Temple', lat: 48.8634, lng: 2.3556, color: '#45B7D1' },
  { num: 4, name: 'Hôtel-de-Ville', lat: 48.8552, lng: 2.3495, color: '#96CEB4' },
  { num: 5, name: 'Panthéon', lat: 48.8445, lng: 2.3485, color: '#FFEAA7' },
  { num: 6, name: 'Luxembourg', lat: 48.8494, lng: 2.3372, color: '#DDA15E' },
  { num: 7, name: 'Palais-Bourbon', lat: 48.8550, lng: 2.3168, color: '#BC6C25' },
  { num: 8, name: 'Élysée', lat: 48.8699, lng: 2.3077, color: '#C9ADA7' },
  { num: 9, name: 'Opéra', lat: 48.8720, lng: 2.3325, color: '#9A8C98' },
  { num: 10, name: 'Entrepôt', lat: 48.8686, lng: 2.3627, color: '#A23B72' },
  { num: 11, name: 'Popincourt', lat: 48.8572, lng: 2.3813, color: '#F18F01' },
  { num: 12, name: 'Reuilly', lat: 48.8359, lng: 2.4024, color: '#C73E1D' },
  { num: 13, name: 'Gobelins', lat: 48.8270, lng: 2.3560, color: '#6A994E' },
  { num: 14, name: 'Observatoire', lat: 48.8330, lng: 2.3330, color: '#BC4749' },
  { num: 15, name: 'Vaugirard', lat: 48.8412, lng: 2.2888, color: '#2E8B9E' },
  { num: 16, name: 'Passy', lat: 48.8633, lng: 2.2782, color: '#A4243B' },
  { num: 17, name: 'Batignolles-Monceau', lat: 48.8799, lng: 2.3004, color: '#6A4C93' },
  { num: 18, name: 'Butte-Montmartre', lat: 48.8867, lng: 2.3431, color: '#D291BC' },
  { num: 19, name: 'Buttes-Chaumont', lat: 48.8831, lng: 2.3844, color: '#FED9B7' },
  { num: 20, name: 'Ménilmontant', lat: 48.8637, lng: 2.4007, color: '#F77F00' },
];

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
  const [filterCommune, setFilterCommune] = useState('all');
  const [showGhostStations, setShowGhostStations] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [arrondissements, setArrondissements] = useState<any[]>([]);
  const [mapZoom, setMapZoom] = useState(12);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any>({});
  const clusterGroupRef = useRef<any>(null);
  const arrondissementLayersRef = useRef<any>({});

  useEffect(() => {
    const fetchStations = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch all stations from API - handle pagination
        let allStations: any[] = [];
        let nextUrl: string | null = API_ENDPOINTS.stations;
        
        // Collect all paginated results
        while (nextUrl) {
          try {
            const response = await api.get(nextUrl);
            
            // Handle paginated response
            if (response.results && Array.isArray(response.results)) {
              allStations = allStations.concat(response.results);
              nextUrl = response.next || null;
            } else if (Array.isArray(response)) {
              // Direct array response
              allStations = response;
              nextUrl = null;
            } else {
              throw new Error('Unexpected response format');
            }
          } catch (pageErr) {
            console.error('Error fetching page:', pageErr);
            if (allStations.length === 0) {
              throw pageErr;
            }
            break; // Continue with what we have
          }
        }
        
        if (allStations.length > 0) {
          const transformedStations = allStations.map((s: any, idx: number) => {
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
              arr: s.commune_name || s.commune || `Commune ${s.id}`,              communeCode: s.commune_code || '',              profile: s.profile || 'unknown',
              isGhost: s.profile === 'ghost_station',
            };
          });
          
          setStations(transformedStations);
        } else {
          setError('No stations found');
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
            id: c.code || c.id,
            code: c.code || '',
            name: c.name || c.commune,
            stations: c.stations || 0,
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
    const communeMatch = filterCommune === 'all' || s.arr === filterCommune;
    const ghostMatch = showGhostStations || !s.isGhost;
    
    if (filterCommune !== 'all' && !communeMatch) {
      // Debug: Log if commune filtering is excluding stations
    }
    
    return statusMatch && communeMatch && ghostMatch;
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

      // Add zoom listener for arrondissement details
      map.on('zoom', () => {
        const zoom = map.getZoom();
        setMapZoom(zoom);
        updateArrondissementDisplay(map, zoom);
      });

      // Initial display
      updateArrondissementDisplay(map, 12);
    }
  }, []);

  // Update arrondissement display based on zoom level
  const updateArrondissementDisplay = (map: any, zoom: number) => {
    // Clear existing layers
    Object.values(arrondissementLayersRef.current).forEach((layers: any) => {
      if (Array.isArray(layers)) {
        layers.forEach((layer: any) => map.removeLayer(layer));
      } else {
        map.removeLayer(layers);
      }
    });
    arrondissementLayersRef.current = {};

    // Only show details when zoomed in very close (zoom 16+)
    const isZoomedInClose = zoom >= 16;

    PARIS_ARRONDISSEMENTS.forEach((arr) => {
      if (isZoomedInClose) {
        // Very zoomed in: Show circles and detailed labels
        const circle = L.circle([arr.lat, arr.lng], {
          radius: 800,
          color: arr.color,
          weight: 2,
          opacity: 0.3,
          fillOpacity: 0.05,
          dashArray: '5, 5'
        }).addTo(map);

        const label = L.marker([arr.lat, arr.lng], {
          icon: L.divIcon({
            html: `
              <div style="
                background-color: ${arr.color};
                color: white;
                border-radius: 50%;
                width: 40px;
                height: 40px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: bold;
                font-size: 16px;
                border: 2px solid white;
                box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                flex-direction: column;
              ">
                <div style="font-size: 14px;">${arr.num}</div>
                <div style="font-size: 10px; line-height: 1;">${arr.name.split('-')[0]}</div>
              </div>
            `,
            iconSize: [40, 40],
            iconAnchor: [20, 20],
            className: 'arrondissement-label'
          })
        }).addTo(map);

        arrondissementLayersRef.current[arr.num] = [circle, label];
      }
      // No display when zoomed out - keep map clean
    });
  };

  // Update markers when filtered stations change - uses clustering
  useEffect(() => {
    if (!mapRef.current) return;

    // Clear existing cluster group
    if (clusterGroupRef.current) {
      mapRef.current.removeLayer(clusterGroupRef.current);
    }

    // Create new cluster group with optimized settings
    const markerClusterGroup = (L as any).markerClusterGroup({
      maxClusterRadius: 80, // Distance in pixels for clustering
      iconCreateFunction: (cluster: any) => {
        const count = cluster.getChildCount();
        let size = 'small';
        let radius = 25;
        let fontSize = 12;
        
        if (count > 100) {
          size = 'large';
          radius = 35;
          fontSize = 16;
        } else if (count > 30) {
          size = 'medium';
          radius = 30;
          fontSize = 14;
        }

        return L.divIcon({
          html: `
            <div style="
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              border-radius: 50%;
              width: ${radius * 2}px;
              height: ${radius * 2}px;
              display: flex;
              align-items: center;
              justify-content: center;
              font-weight: bold;
              font-size: ${fontSize}px;
              border: 2px solid white;
              box-shadow: 0 3px 8px rgba(0,0,0,0.3);
            ">
              ${count}
            </div>
          `,
          iconSize: [radius * 2, radius * 2],
          iconAnchor: [radius, radius],
          popupAnchor: [0, -radius],
          className: 'station-cluster'
        });
      }
    });

    // Add filtered stations to cluster group
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
          ${isGhost ? '<div style="margin-top: 12px; padding: 8px; background-color: #fee2e2; border: 1px solid #fca5a5; border-radius: 4px; color: #991b1b; font-weight: bold; font-size: 11px;">👻 La station phantom, pas de activity</div>' : ''}
          <div style="margin-top: 12px; padding: 8px; background-color: ${station.status === 'high' ? '#dcfce7' : station.status === 'medium' ? '#fef3c7' : '#fee2e2'}; border-radius: 4px; text-align: center; font-weight: bold; font-size: 12px; color: ${station.status === 'high' ? '#166534' : station.status === 'medium' ? '#92400e' : '#991b1b'};">
            État: ${station.status === 'high' ? '✅ Haute Disponibilité' : station.status === 'medium' ? '⚠️ Disponibilité Moyenne' : '❌ Basse Disponibilité'}
          </div>
        </div>
      `;

      const marker = L.marker([station.lat, station.lng], { icon })
        .bindPopup(popupContent, { maxWidth: 280 })
        .on('click', () => setSelectedStation(station.id));

      // Add marker to cluster group instead of directly to map
      markerClusterGroup.addLayer(marker);
      markersRef.current[station.id] = marker;
    });

    // Add cluster group to map
    mapRef.current.addLayer(markerClusterGroup);
    clusterGroupRef.current = markerClusterGroup;
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
      {/* Controls - Status, Commune, and Ghost Stations Filters */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
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
          <label className="block text-sm font-semibold text-gray-700 mb-3">Filtrer par Commune</label>
          <Select value={filterCommune} onValueChange={setFilterCommune}>
            <SelectTrigger className="border border-gray-300">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les Communes</SelectItem>
              {arrondissements.map((arr) => (
                <SelectItem key={arr.code || arr.id} value={arr.name}>
                  {arr.name} ({arr.stations} stations)
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Card>

        <Card className="p-4 border-0 shadow-md">
          <label className="block text-sm font-semibold text-gray-700 mb-3">Stations Fantômes</label>
          <Button 
            onClick={() => setShowGhostStations(!showGhostStations)}
            className={`w-full py-2 px-4 rounded-lg font-medium transition-all ${
              showGhostStations 
                ? 'bg-red-500 text-white hover:bg-red-600' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {showGhostStations ? '👻 Affichées' : '👻 Masquées'}
          </Button>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
        <Card className={`p-4 border-0 shadow-md col-span-full ${error ? 'bg-red-50 border border-red-300' : loading ? 'bg-blue-50 border border-blue-200' : 'bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200'}`}>
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
              <p className="text-sm font-bold text-gray-900">{filteredStations.length} stations affichées</p>
              <p className="text-xs text-gray-600 mt-1">sur {stations.length} stations au total • Zoom niveau: {mapZoom}</p>
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
        <div className="hidden lg:block gap-12 p-4">{/* Spacer for layout alignment */}</div>
      </div>
      </div>
    </div>
  );
}
