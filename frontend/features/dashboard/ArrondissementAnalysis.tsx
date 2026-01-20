import { useState, useEffect, useMemo } from 'react';
import { Card } from '../../shared/ui/card';
import { Badge } from '../../shared/ui/badge';
import { Building2, Bike, TrendingUp, MapPin, AlertCircle, Zap } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { api, API_ENDPOINTS } from '../../api/config';

interface CommuneData {
  code: string;
  name: string;
  stations: number;
  bikes: number;
  docks: number;
  capacity: number;
  utilization: number;
  cv: number;  // Coefficient of Variation (%)
  population: number;
}

export function ArrondissementAnalysis() {
  const [communes, setCommunesData] = useState<CommuneData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCommune, setSelectedCommune] = useState('all');

  useEffect(() => {
    const fetchCommuneData = async () => {
      try {
        setError(null);
        const data = await api.get(API_ENDPOINTS.communeSummary);
        setCommunesData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load commune data');
        setCommunesData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCommuneData();
  }, []);

  const topCommunes = useMemo(() => {
    return communes.slice(0, 5);
  }, [communes]);

  const comparisonData = useMemo(() => {
    const top4 = communes.slice(0, 4);
    if (top4.length === 0) return [];
    
    return [
      { metric: 'Stations', ...Object.fromEntries(top4.map(c => [c.code, c.stations])) },
      { metric: 'Vélos Disponibles', ...Object.fromEntries(top4.map(c => [c.code, c.bikes])) },
      { metric: 'CV (%)', ...Object.fromEntries(top4.map(c => [c.code, parseFloat((c.cv || 0).toFixed(2))])) },
    ];
  }, [communes]);

  if (loading) {
    return (
      <div className="p-8">
        <div className="text-center">
          <p className="text-gray-600">Loading commune data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <Card className="p-6 border border-red-200 bg-red-50">
          <div className="flex items-start gap-4">
            <AlertCircle className="w-5 h-5 text-red-600 mt-1 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-red-900 mb-1">Error Loading Data</h3>
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-8 bg-white/95 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Analysis by Commune</h2>
        <p className="text-gray-600">Compare station performance across communes in the Île-de-France region</p>
      </div>

      {/* Top Communes by Coefficient of Variation */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-8">
        {topCommunes.map(commune => (
          <Card 
            key={commune.code} 
            className="p-6 hover:shadow-lg transition-shadow cursor-pointer border-l-4 border-l-purple-500"
            onClick={() => setSelectedCommune(commune.code)}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">INSEE Code</p>
                <h3 className="text-lg font-bold text-gray-900">{commune.code}</h3>
                <p className="text-sm font-medium text-gray-700 mt-2">{commune.name}</p>
              </div>
              <Badge className="bg-purple-100 text-purple-800 whitespace-nowrap flex items-center gap-1">
                <Zap className="w-3 h-3" />
                {(commune.cv || 0).toFixed(2)}%
              </Badge>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2 text-gray-600">
                <Bike className="w-4 h-4 text-blue-600" />
                <span className="font-semibold text-gray-900">{commune.bikes} vélos</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <Building2 className="w-4 h-4" />
                <span>{commune.stations} station{commune.stations !== 1 ? 's' : ''}</span>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Main Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Coefficient of Variation by Commune */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Coefficient de Variation (%) par Commune</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart 
              data={communes}
              margin={{ top: 20, right: 30, left: 0, bottom: 60 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="code" 
                angle={-45}
                textAnchor="end"
                height={80}
                tick={{ fontSize: 12 }}
              />
              <YAxis />
              <Tooltip 
                content={({ active, payload }) => {
                  if (active && payload && payload[0]) {
                    const data = payload[0].payload as CommuneData;
                    return (
                      <div className="bg-white p-3 border border-gray-200 rounded shadow-lg">
                        <p className="font-semibold text-gray-900">{data.name}</p>
                        <p className="text-sm text-gray-600">CV: {data.cv.toFixed(2)}%</p>
                        <p className="text-sm text-gray-600">Vélos: {data.bikes}</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="cv" fill="#8b5cf6" name="Coefficient de Variation (%)" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Bikes Available by Commune */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Available Bikes by Commune</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart 
              data={communes}
              margin={{ top: 20, right: 30, left: 0, bottom: 60 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="code"
                angle={-45}
                textAnchor="end"
                height={80}
                tick={{ fontSize: 12 }}
              />
              <YAxis />
              <Tooltip 
                content={({ active, payload }) => {
                  if (active && payload && payload[0]) {
                    const data = payload[0].payload as CommuneData;
                    return (
                      <div className="bg-white p-3 border border-gray-200 rounded shadow-lg">
                        <p className="font-semibold text-gray-900">{data.name}</p>
                        <p className="text-sm text-gray-600">Bikes: {data.bikes}</p>
                        <p className="text-sm text-gray-600">Docks: {data.docks}</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend />
              <Line type="monotone" dataKey="bikes" stroke="#10b981" strokeWidth={2} name="Bikes" />
              <Line type="monotone" dataKey="docks" stroke="#f59e0b" strokeWidth={2} name="Docks" />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* Comparison Chart - Top Communes */}
        {comparisonData.length > 0 && (
          <Card className="p-6 lg:col-span-2">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Metrics Comparison - Top 4 Communes</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={comparisonData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="metric" />
                <YAxis />
                <Tooltip />
                <Legend />
                {communes.slice(0, 4).map((commune, idx) => (
                  <Bar key={commune.code} dataKey={commune.code} fill={['#3b82f6', '#10b981', '#f59e0b', '#ef4444'][idx]} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </Card>
        )}
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-2">Avg Coefficient de Variation</p>
              <p className="text-3xl font-bold text-gray-900">
                {communes.length > 0 
                  ? (communes.reduce((sum, c) => sum + (c.cv || 0), 0) / communes.length).toFixed(2)
                  : '0'}
              </p>
              <p className="text-xs text-gray-500 mt-1">% (Activity Variability)</p>
            </div>
            <Zap className="w-8 h-8 text-purple-500" />
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-2">Total Bikes Available</p>
              <p className="text-3xl font-bold text-gray-900">
                {communes.reduce((sum, c) => sum + c.bikes, 0).toLocaleString()}
              </p>
            </div>
            <Bike className="w-8 h-8 text-blue-500" />
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-2">Total Communes</p>
              <p className="text-3xl font-bold text-gray-900">{communes.length}</p>
            </div>
            <MapPin className="w-8 h-8 text-blue-500" />
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-2">Total Stations</p>
              <p className="text-3xl font-bold text-gray-900">
                {communes.reduce((sum, c) => sum + c.stations, 0)}
              </p>
            </div>
            <Building2 className="w-8 h-8 text-purple-500" />
          </div>
        </Card>
      </div>

      {/* Detailed Table */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Complete Commune Overview</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left py-3 px-4 text-gray-700 font-semibold">INSEE Code</th>
                <th className="text-left py-3 px-4 text-gray-700 font-semibold">Commune</th>
                <th className="text-center py-3 px-4 text-gray-700 font-semibold">Stations</th>
                <th className="text-right py-3 px-4 text-gray-700 font-semibold">Bikes Available</th>
                <th className="text-right py-3 px-4 text-gray-700 font-semibold">Docks</th>
                <th className="text-right py-3 px-4 text-gray-700 font-semibold">CV (%)</th>
                <th className="text-right py-3 px-4 text-gray-700 font-semibold">Utilization</th>
                <th className="text-right py-3 px-4 text-gray-700 font-semibold">Population</th>
              </tr>
            </thead>
            <tbody>
              {communes.map((commune, idx) => (
                <tr key={commune.code} className={`border-b border-gray-100 hover:bg-gray-50 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                  <td className="py-3 px-4">
                    <span className="font-mono font-semibold text-blue-600">{commune.code}</span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-900 font-medium">{commune.name}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-center text-gray-900">{commune.stations}</td>
                  <td className="py-3 px-4 text-right text-gray-900 font-semibold text-blue-600">{commune.bikes.toLocaleString()}</td>
                  <td className="py-3 px-4 text-right text-gray-900">{commune.docks.toLocaleString()}</td>
                  <td className="py-3 px-4 text-right">
                    <Badge className="bg-purple-100 text-purple-700 font-semibold">
                      {(commune.cv || 0).toFixed(2)}%
                    </Badge>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <Badge variant={commune.utilization > 50 ? 'default' : 'secondary'}>
                      {commune.utilization.toFixed(1)}%
                    </Badge>
                  </td>
                  <td className="py-3 px-4 text-right text-gray-700">{commune.population.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
