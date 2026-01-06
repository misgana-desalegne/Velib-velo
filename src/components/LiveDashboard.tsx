import { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Bike, MapPin, AlertCircle, TrendingUp, RefreshCw } from 'lucide-react';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Progress } from './ui/progress';

// Mock live data - in real app, this would come from Django API
const generateLiveData = () => ({
  totalStations: 1500,
  activeBikes: Math.floor(12000 + Math.random() * 2000),
  availableDocks: Math.floor(8000 + Math.random() * 2000),
  inMaintenance: Math.floor(50 + Math.random() * 30),
  utilizationRate: (65 + Math.random() * 15).toFixed(1),
});

const hourlyData = [
  { hour: '00:00', bikes: 8234, docks: 11766 },
  { hour: '03:00', bikes: 6789, docks: 13211 },
  { hour: '06:00', bikes: 5432, docks: 14568 },
  { hour: '09:00', bikes: 11234, docks: 8766 },
  { hour: '12:00', bikes: 13456, docks: 6544 },
  { hour: '15:00', bikes: 12890, docks: 7110 },
  { hour: '18:00', bikes: 14567, docks: 5433 },
  { hour: '21:00', bikes: 10234, docks: 9766 },
];

const topStations = [
  { id: 1, name: 'Gare du Nord', arrondissement: '10e', bikes: 42, docks: 8, capacity: 50, status: 'high' },
  { id: 2, name: 'Champs-Élysées', arrondissement: '8e', bikes: 38, docks: 12, capacity: 50, status: 'high' },
  { id: 3, name: 'Bastille', arrondissement: '11e', bikes: 5, docks: 35, capacity: 40, status: 'low' },
  { id: 4, name: 'Luxembourg', arrondissement: '6e', bikes: 28, docks: 22, capacity: 50, status: 'medium' },
  { id: 5, name: 'République', arrondissement: '3e', bikes: 7, docks: 33, capacity: 40, status: 'low' },
];

const criticalStations = [
  { name: 'Montmartre Nord', issue: 'No bikes available', severity: 'critical' },
  { name: 'La Défense Esplanade', issue: 'No docks available', severity: 'critical' },
  { name: 'Châtelet', issue: 'Low availability', severity: 'warning' },
  { name: 'Saint-Michel', issue: 'Low availability', severity: 'warning' },
];

const arrondissementSummary = [
  { arr: '1er', bikes: 456, docks: 344, utilization: 57 },
  { arr: '2e', bikes: 378, docks: 422, utilization: 47 },
  { arr: '3e', bikes: 512, docks: 288, utilization: 64 },
  { arr: '4e', bikes: 445, docks: 355, utilization: 56 },
  { arr: '5e', bikes: 523, docks: 277, utilization: 65 },
  { arr: '6e', bikes: 489, docks: 311, utilization: 61 },
];

export function LiveDashboard() {
  const [liveData, setLiveData] = useState(generateLiveData());
  const [lastUpdate, setLastUpdate] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setLiveData(generateLiveData());
      setLastUpdate(new Date());
    }, 5000); // Update every 5 seconds to simulate live data

    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'high': return 'bg-green-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const refreshData = () => {
    setLiveData(generateLiveData());
    setLastUpdate(new Date());
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl text-gray-900 mb-2">Live Station Analysis</h2>
          <p className="text-gray-600">Real-time monitoring of 1,500 bicycle stations across France</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm text-gray-600">Last Updated</p>
            <p className="text-sm text-gray-900">{lastUpdate.toLocaleTimeString()}</p>
          </div>
          <Button onClick={refreshData} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Live Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        <Card className="p-6">
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="text-sm text-gray-600">Total Stations</p>
              <p className="text-3xl text-gray-900">{liveData.totalStations.toLocaleString()}</p>
            </div>
            <MapPin className="w-8 h-8 text-blue-600" />
          </div>
          <Badge variant="secondary">Active</Badge>
        </Card>

        <Card className="p-6">
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="text-sm text-gray-600">Available Bikes</p>
              <p className="text-3xl text-gray-900">{liveData.activeBikes.toLocaleString()}</p>
            </div>
            <Bike className="w-8 h-8 text-green-600" />
          </div>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-green-600" />
            <span className="text-sm text-green-600">+3.2%</span>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="text-sm text-gray-600">Available Docks</p>
              <p className="text-3xl text-gray-900">{liveData.availableDocks.toLocaleString()}</p>
            </div>
            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
              <div className="w-4 h-4 border-2 border-purple-600 rounded" />
            </div>
          </div>
          <span className="text-sm text-gray-600">60% capacity</span>
        </Card>

        <Card className="p-6">
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="text-sm text-gray-600">Utilization Rate</p>
              <p className="text-3xl text-gray-900">{liveData.utilizationRate}%</p>
            </div>
            <TrendingUp className="w-8 h-8 text-orange-600" />
          </div>
          <Progress value={parseFloat(liveData.utilizationRate)} />
        </Card>

        <Card className="p-6">
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="text-sm text-gray-600">Maintenance</p>
              <p className="text-3xl text-gray-900">{liveData.inMaintenance}</p>
            </div>
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <span className="text-sm text-gray-600">Stations offline</span>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Hourly Availability */}
        <Card className="p-6">
          <h3 className="text-lg text-gray-900 mb-4">24-Hour Availability Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={hourlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="hour" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Area type="monotone" dataKey="bikes" stackId="1" stroke="#10b981" fill="#86efac" name="Available Bikes" />
              <Area type="monotone" dataKey="docks" stackId="2" stroke="#3b82f6" fill="#93c5fd" name="Available Docks" />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        {/* Arrondissement Overview */}
        <Card className="p-6">
          <h3 className="text-lg text-gray-900 mb-4">Top Arrondissements by Utilization</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={arrondissementSummary}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="arr" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="utilization" fill="#3b82f6" name="Utilization %" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Critical Alerts */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg text-gray-900">Critical Alerts</h3>
            <Badge variant="destructive">{criticalStations.length}</Badge>
          </div>
          <div className="space-y-3">
            {criticalStations.map((station, idx) => (
              <div key={idx} className="flex items-start gap-3 p-3 bg-red-50 rounded-lg">
                <AlertCircle className={`w-5 h-5 ${station.severity === 'critical' ? 'text-red-600' : 'text-orange-600'} flex-shrink-0 mt-0.5`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900 truncate">{station.name}</p>
                  <p className="text-xs text-gray-600">{station.issue}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Top Stations */}
        <Card className="p-6 lg:col-span-2">
          <h3 className="text-lg text-gray-900 mb-4">Station Status Overview</h3>
          <div className="space-y-3">
            {topStations.map((station) => (
              <div key={station.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                <div className={`w-3 h-3 rounded-full ${getStatusColor(station.status)}`} />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-gray-900">{station.name}</p>
                    <Badge variant="outline" className="text-xs">{station.arrondissement}</Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                      <Bike className="w-4 h-4" />
                      {station.bikes} bikes
                    </span>
                    <span>{station.docks} docks</span>
                    <span className="text-xs">Capacity: {station.capacity}</span>
                  </div>
                </div>
                <div className="text-right">
                  <Progress value={(station.bikes / station.capacity) * 100} className="w-24 mb-1" />
                  <p className="text-xs text-gray-600">{Math.round((station.bikes / station.capacity) * 100)}% full</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
