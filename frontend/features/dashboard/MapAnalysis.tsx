import { useState, useMemo, memo } from 'react';
import { Card } from '../../shared/ui/card';
import { Button } from '../../shared/ui/button';
import { Badge } from '../../shared/ui/badge';
import { MapPin, Layers, Filter, ZoomIn, ZoomOut, Maximize2, Bike, AlertCircle } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../shared/ui/select';

// Mock station locations for Paris
const stations = [
  { id: 1, name: 'Gare du Nord', lat: 48.8809, lng: 2.3553, bikes: 42, docks: 8, capacity: 50, status: 'high', arr: '10e' },
  { id: 2, name: 'Champs-Élysées', lat: 48.8698, lng: 2.3078, bikes: 38, docks: 12, capacity: 50, status: 'high', arr: '8e' },
  { id: 3, name: 'Bastille', lat: 48.8531, lng: 2.3694, bikes: 5, docks: 35, capacity: 40, status: 'low', arr: '11e' },
  { id: 4, name: 'Luxembourg', lat: 48.8462, lng: 2.3372, bikes: 28, docks: 22, capacity: 50, status: 'medium', arr: '6e' },
  { id: 5, name: 'République', lat: 48.8676, lng: 2.3634, bikes: 7, docks: 33, capacity: 40, status: 'low', arr: '3e' },
  { id: 6, name: 'Tour Eiffel', lat: 48.8584, lng: 2.2945, bikes: 32, docks: 18, capacity: 50, status: 'medium', arr: '7e' },
  { id: 7, name: 'Louvre', lat: 48.8606, lng: 2.3376, bikes: 15, docks: 25, capacity: 40, status: 'medium', arr: '1er' },
  { id: 8, name: 'Notre-Dame', lat: 48.8530, lng: 2.3499, bikes: 9, docks: 31, capacity: 40, status: 'low', arr: '4e' },
  { id: 9, name: 'Montmartre', lat: 48.8867, lng: 2.3431, bikes: 41, docks: 9, capacity: 50, status: 'high', arr: '18e' },
  { id: 10, name: 'Saint-Germain', lat: 48.8534, lng: 2.3330, bikes: 24, docks: 16, capacity: 40, status: 'medium', arr: '6e' },
  { id: 11, name: 'Opéra', lat: 48.8719, lng: 2.3316, bikes: 36, docks: 14, capacity: 50, status: 'high', arr: '9e' },
  { id: 12, name: 'Châtelet', lat: 48.8583, lng: 2.3470, bikes: 3, docks: 47, capacity: 50, status: 'critical', arr: '1er' },
];

const arrondissements = [
  { id: '1er', name: '1er', color: '#3b82f6', stations: 45 },
  { id: '3e', name: '3e', color: '#10b981', stations: 52 },
  { id: '4e', name: '4e', color: '#f59e0b', stations: 48 },
  { id: '6e', name: '6e', color: '#8b5cf6', stations: 50 },
  { id: '7e', name: '7e', color: '#ec4899', stations: 58 },
  { id: '8e', name: '8e', color: '#14b8a6', stations: 62 },
  { id: '9e', name: '9e', color: '#f97316', stations: 54 },
  { id: '10e', name: '10e', color: '#06b6d4', stations: 68 },
  { id: '11e', name: '11e', color: '#84cc16', stations: 72 },
  { id: '18e', name: '18e', color: '#a855f7', stations: 45 },
];

export function MapAnalysis() {
  const [selectedStation, setSelectedStation] = useState<number | null>(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [showHeatmap, setShowHeatmap] = useState(false);

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

  const filteredStations = filterStatus === 'all' 
    ? stations 
    : stations.filter(s => s.status === filterStatus);

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl text-gray-900 mb-2">Geolocation Map Analysis</h2>
          <p className="text-gray-600">Interactive map view of all bicycle stations across France</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Maximize2 className="w-4 h-4 mr-2" />
            Fullscreen
          </Button>
          <Button variant="outline" size="sm">
            Export Map
          </Button>
        </div>
      </div>

      {/* Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
        <Card className="p-4">
          <label className="block text-sm text-gray-700 mb-2">Filter by Status</label>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Stations</SelectItem>
              <SelectItem value="high">High Availability</SelectItem>
              <SelectItem value="medium">Medium Availability</SelectItem>
              <SelectItem value="low">Low Availability</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
            </SelectContent>
          </Select>
        </Card>

        <Card className="p-4">
          <label className="block text-sm text-gray-700 mb-2">Map Layer</label>
          <Select defaultValue="standard">
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="standard">Standard</SelectItem>
              <SelectItem value="satellite">Satellite</SelectItem>
              <SelectItem value="terrain">Terrain</SelectItem>
            </SelectContent>
          </Select>
        </Card>

        <Card className="p-4">
          <label className="block text-sm text-gray-700 mb-2">Overlay</label>
          <div className="flex items-center gap-2">
            <input 
              type="checkbox" 
              checked={showHeatmap}
              onChange={(e) => setShowHeatmap(e.target.checked)}
              className="rounded"
            />
            <span className="text-sm text-gray-700">Show Heatmap</span>
          </div>
        </Card>

        <Card className="p-4 bg-blue-50">
          <p className="text-sm text-blue-900">Showing {filteredStations.length} stations</p>
          <p className="text-xs text-blue-700 mt-1">of {stations.length} total</p>
        </Card>
      </div>

      {/* Main Map Area */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Map */}
        <Card className="p-0 lg:col-span-3 overflow-hidden">
          <div className="relative bg-gray-100 h-[600px]">
            {/* Map Placeholder - In production, use react-leaflet or similar */}
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-blue-50 to-green-50">
              {/* SVG Map Representation */}
              <svg width="100%" height="100%" viewBox="0 0 800 600" className="absolute inset-0">
                {/* Paris map outline (simplified) */}
                <circle cx="400" cy="300" r="200" fill="#e0f2fe" stroke="#3b82f6" strokeWidth="2" opacity="0.3" />
                
                {/* Station markers */}
                {filteredStations.map((station) => {
                  const x = 300 + (station.lng - 2.3) * 500;
                  const y = 300 - (station.lat - 48.85) * 2000;
                  const size = getMarkerSize(station.bikes, station.capacity);
                  
                  return (
                    <g key={station.id}>
                      <circle
                        cx={x}
                        cy={y}
                        r={size}
                        fill={getStatusColor(station.status)}
                        stroke="white"
                        strokeWidth="2"
                        opacity="0.9"
                        className="cursor-pointer hover:opacity-100 transition-opacity"
                        onClick={() => setSelectedStation(station.id)}
                      />
                      {selectedStation === station.id && (
                        <>
                          <circle cx={x} cy={y} r={size + 4} fill="none" stroke={getStatusColor(station.status)} strokeWidth="2" opacity="0.5" />
                          <circle cx={x} cy={y} r={size + 8} fill="none" stroke={getStatusColor(station.status)} strokeWidth="1" opacity="0.3" />
                        </>
                      )}
                    </g>
                  );
                })}

                {/* Labels for major stations */}
                {filteredStations.slice(0, 5).map((station) => {
                  const x = 300 + (station.lng - 2.3) * 500;
                  const y = 300 - (station.lat - 48.85) * 2000;
                  return (
                    <text 
                      key={`label-${station.id}`}
                      x={x} 
                      y={y - 20} 
                      textAnchor="middle" 
                      className="text-xs fill-gray-700"
                      style={{ fontSize: '10px' }}
                    >
                      {station.name}
                    </text>
                  );
                })}
              </svg>

              {/* Map watermark */}
              <div className="absolute bottom-4 right-4 bg-white/90 px-3 py-2 rounded shadow text-xs text-gray-600">
                Interactive Map View • Paris, France
              </div>
            </div>

            {/* Map Controls */}
            <div className="absolute top-4 right-4 flex flex-col gap-2">
              <Button size="sm" variant="secondary" className="shadow">
                <ZoomIn className="w-4 h-4" />
              </Button>
              <Button size="sm" variant="secondary" className="shadow">
                <ZoomOut className="w-4 h-4" />
              </Button>
              <Button size="sm" variant="secondary" className="shadow">
                <Layers className="w-4 h-4" />
              </Button>
            </div>

            {/* Legend */}
            <Card className="absolute bottom-4 left-4 p-4 shadow-lg">
              <p className="text-sm text-gray-900 mb-3">Station Status</p>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#10b981' }} />
                  <span className="text-xs text-gray-700">High Availability (70%+)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#f59e0b' }} />
                  <span className="text-xs text-gray-700">Medium (30-70%)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#ef4444' }} />
                  <span className="text-xs text-gray-700">Low Availability (&lt;30%)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#dc2626' }} />
                  <span className="text-xs text-gray-700">Critical</span>
                </div>
              </div>
            </Card>
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
                  <Card className="p-4">
                    <div className="flex items-start justify-between mb-4">
                      <h3 className="text-lg text-gray-900">{station.name}</h3>
                      <Badge variant="outline">{station.arr}</Badge>
                    </div>
                    
                    <div className="space-y-3 mb-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Available Bikes</span>
                        <span className="text-lg text-gray-900">{station.bikes}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Available Docks</span>
                        <span className="text-lg text-gray-900">{station.docks}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Capacity</span>
                        <span className="text-lg text-gray-900">{station.capacity}</span>
                      </div>
                      <div className="pt-2 border-t border-gray-200">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-gray-600">Occupancy</span>
                          <span className="text-sm text-gray-900">
                            {Math.round((station.bikes / station.capacity) * 100)}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="h-2 rounded-full" 
                            style={{ 
                              width: `${(station.bikes / station.capacity) * 100}%`,
                              backgroundColor: getStatusColor(station.status)
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button size="sm" className="flex-1">View Details</Button>
                      <Button size="sm" variant="outline">Directions</Button>
                    </div>
                  </Card>
                );
              })()}
            </>
          ) : (
            <Card className="p-6 text-center">
              <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-sm text-gray-600">Click on a station marker to view details</p>
            </Card>
          )}

          {/* Arrondissement List */}
          <Card className="p-4">
            <h3 className="text-sm text-gray-900 mb-3">Arrondissements</h3>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {arrondissements.map((arr) => (
                <div 
                  key={arr.id} 
                  className="flex items-center justify-between p-2 hover:bg-gray-50 rounded cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: arr.color }}
                    />
                    <span className="text-sm text-gray-900">{arr.name}</span>
                  </div>
                  <span className="text-xs text-gray-600">{arr.stations} stations</span>
                </div>
              ))}
            </div>
          </Card>

          {/* Quick Stats */}
          <Card className="p-4 bg-gradient-to-br from-blue-50 to-green-50">
            <div className="space-y-3">
              <div>
                <p className="text-xs text-gray-600">Active Stations</p>
                <p className="text-2xl text-gray-900">1,487</p>
              </div>
              <div>
                <p className="text-xs text-gray-600">Coverage Area</p>
                <p className="text-xl text-gray-900">105 km²</p>
              </div>
              <div>
                <p className="text-xs text-gray-600">Avg Distance</p>
                <p className="text-xl text-gray-900">280m</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
