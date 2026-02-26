import { useState, useEffect, useMemo } from 'react';
import { Card } from '../../shared/ui/card';
import { Badge } from '../../shared/ui/badge';
import { Building2, Bike, TrendingUp, MapPin, AlertCircle, Zap, Brain, X, Sparkles, Loader } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { api, API_ENDPOINTS } from '../../api/config';
import { generateCommuneAnalysisPrompt, getExplanationWithCache } from '../../api/gemini';
import LoadingSpinner from '../../shared/components/LoadingSpinner';

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
  const [hourlySeries, setHourlySeries] = useState<any[]>([]);
  const [hourlyLoading, setHourlyLoading] = useState(false);
  const [hourlyError, setHourlyError] = useState<string | null>(null);
  const [weeklySeries, setWeeklySeries] = useState<any[]>([]);
  const [monthlySeries, setMonthlySeries] = useState<any[]>([]);
  const [openExplanation, setOpenExplanation] = useState<string | null>(null);
  const [explanationText, setExplanationText] = useState('');
  const [explanationLoading, setExplanationLoading] = useState(false);

  /**
   * Fetch AI explanation from Gemini API
   */
  const fetchAIExplanation = async (chartType: 'cv' | 'bikes' | 'comparison') => {
    try {
      setExplanationLoading(true);
      const prompt = generateCommuneAnalysisPrompt(chartType, communes);
      const cacheKey = `commune_${chartType}_${new Date().toDateString()}`;
      
      console.log(`🤖 Fetching AI explanation for: ${chartType}`);
      const text = await getExplanationWithCache(cacheKey, prompt);
      
      setExplanationText(text);
      setOpenExplanation(chartType);
    } catch (err) {
      console.error('❌ Error fetching AI explanation:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setExplanationText(`⚠️ Failed to generate AI explanation.\n\nError: ${errorMessage}\n\nPlease check the browser console (F12) for more details. The API key or network may be experiencing issues.`);
      setOpenExplanation(chartType);
    } finally {
      setExplanationLoading(false);
    }
  };

  const handleExplanationClick = async (chartType: 'cv' | 'bikes' | 'comparison') => {
    if (openExplanation === chartType) {
      setOpenExplanation(null);
    } else {
      await fetchAIExplanation(chartType);
    }
  };

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

  // Fetch hourly series when a commune is selected
  useEffect(() => {
    const fetchHourly = async (code: string) => {
      if (!code || code === 'all') return;
      setHourlyLoading(true);
      setHourlyError(null);
      try {
        const resp = await api.get(API_ENDPOINTS.arrondissementAnalytics(code) + '?hours=24');
        const hourly = Array.isArray(resp.hourly) ? resp.hourly : [];

        const points = hourly.map((h: any) => ({
          timestamp: h.timestamp || h.date || h.hour || '',
          bikes: Number(h.bikes_available_avg ?? h.bikes_available ?? h.bikes ?? 0),
          docks: Number(h.docks_available_avg ?? h.docks_available ?? h.docks ?? 0),
        }));

        const totals = points.map(p => p.bikes + p.docks).filter(Boolean);
        const median = (() => {
          if (!totals.length) return 0;
          const sorted = totals.slice().sort((a, b) => a - b);
          const mid = Math.floor(sorted.length / 2);
          return sorted.length % 2 === 0 ? Math.round((sorted[mid - 1] + sorted[mid]) / 2) : Math.round(sorted[mid]);
        })();

        const normalized = points.map(p => ({
          timestamp: p.timestamp,
          bikes: Math.round(p.bikes),
          docks: Math.max(0, median ? median - Math.round(p.bikes) : Math.round(p.docks)),
        }));

        setHourlySeries(normalized);
      } catch (err) {
        setHourlyError(err instanceof Error ? err.message : 'Failed to load hourly series');
        setHourlySeries([]);
      } finally {
        setHourlyLoading(false);
      }
    };

    fetchHourly(selectedCommune as string);
  }, [selectedCommune]);

  // Build example weekly and monthly series (deterministic) when selection or hourlySeries changes
  useEffect(() => {
    if (!selectedCommune || selectedCommune === 'all') {
      setWeeklySeries([]);
      setMonthlySeries([]);
      return;
    }

    // Find commune object to infer total docks
    const communeObj = communes.find(c => c.code === selectedCommune);
    const fallbackTotal = communeObj ? (communeObj.bikes + communeObj.docks) : 100;

    const inferTotal = (() => {
      if (hourlySeries && hourlySeries.length) {
        const totals = hourlySeries.map(p => (p.bikes || 0) + (p.docks || 0)).filter(Boolean);
        if (totals.length) {
          const sorted = totals.slice().sort((a, b) => a - b);
          const mid = Math.floor(sorted.length / 2);
          return sorted.length % 2 === 0 ? Math.round((sorted[mid - 1] + sorted[mid]) / 2) : Math.round(sorted[mid]);
        }
      }
      return fallbackTotal || 100;
    })();

    // Weekly motif: deterministic pattern (Lun..Dim)
    const days = ['Lun','Mar','Mer','Jeu','Ven','Sam','Dim'];
    const pattern = [0.35, 0.45, 0.5, 0.55, 0.6, 0.75, 0.5];
    const weekly = days.map((d, i) => {
      const bikes = Math.max(0, Math.round(inferTotal * pattern[i]));
      return { day: d, bikes, docks: Math.max(0, inferTotal - bikes) };
    });

    // Monthly trend: 30-day smooth wave (deterministic)
    const monthly = Array.from({ length: 30 }).map((_, i) => {
      // base between 0.4 and 0.7 plus a small weekly modulation
      const base = 0.55 + 0.12 * Math.sin((i / 30) * Math.PI * 2) + 0.05 * Math.sin((i / 7) * Math.PI);
      const bikes = Math.max(0, Math.round(inferTotal * Math.min(0.95, Math.max(0.1, base))));
      const date = new Date();
      date.setDate(date.getDate() - (29 - i));
      return { date: date.toISOString(), bikes, docks: Math.max(0, inferTotal - bikes) };
    });

    setWeeklySeries(weekly);
    setMonthlySeries(monthly);
  }, [selectedCommune, hourlySeries, communes]);

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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size={64} message="Chargement des communes..." />
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
      {/* AI Explanation Floating Popup - appears over the specific chart */}
      {openExplanation && (
        <div className="fixed inset-0 z-40" onClick={() => setOpenExplanation(null)} />
      )}

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
        <Card className="p-6 relative overflow-hidden">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Coefficient de Variation (%) par Commune</h3>
            <button
              onClick={() => handleExplanationClick('cv')}
              disabled={explanationLoading}
              className="px-4 py-2 bg-white border-2 border-gray-300 hover:border-green-600 hover:bg-green-50 disabled:opacity-50 text-black font-bold text-sm rounded-lg flex items-center gap-2 transition-all duration-200 hover:shadow-md cursor-pointer"
            >
              <Brain className="w-4 h-4" />
              IA
            </button>
          </div>

          {/* Floating Explanation Popup for CV Chart */}
          {openExplanation === 'cv' && (
            <div className="absolute top-20 right-6 z-50 w-96 h-96 bg-white border-2 border-purple-300 rounded-xl shadow-2xl p-6 overflow-y-auto flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-600" />
                  <p className="text-sm font-bold text-purple-600 uppercase">Analyse IA</p>
                </div>
                <button
                  onClick={() => setOpenExplanation(null)}
                  className="p-1 hover:bg-gray-100 rounded transition-colors"
                >
                  <X className="w-4 h-4 text-gray-600" />
                </button>
              </div>
              {explanationLoading ? (
                <div className="flex-grow flex items-center justify-center">
                  <div className="text-center">
                    <div className="relative w-16 h-16 mx-auto mb-4">
                      <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-300 to-blue-300 animate-pulse"></div>
                      <div className="absolute inset-2 rounded-full bg-white"></div>
                      <Loader className="absolute inset-0 m-auto w-8 h-8 text-purple-600 animate-spin" />
                    </div>
                    <p className="text-sm font-semibold text-gray-900">Generating analysis...</p>
                    <p className="text-xs text-gray-500 mt-1">🤖 AI is thinking...</p>
                  </div>
                </div>
              ) : (
                <>
                  <p className="text-sm text-gray-700 leading-relaxed mb-4 flex-grow">{explanationText}</p>
                  <button
                    onClick={() => fetchAIExplanation('cv')}
                    disabled={explanationLoading}
                    className="mt-auto w-full px-3 py-2 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 disabled:opacity-50 text-white text-xs font-semibold rounded transition-all"
                  >
                    <Sparkles className="w-3 h-3 inline mr-1" />
                    Générer une autre explication
                  </button>
                </>
              )}
            </div>
          )}

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
        <Card className="p-6 relative overflow-hidden">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Available Bikes by Commune</h3>
            <button
              onClick={() => handleExplanationClick('bikes')}
              disabled={explanationLoading}
              className="px-4 py-2 bg-white border-2 border-gray-300 hover:border-green-600 hover:bg-green-50 disabled:opacity-50 text-black font-bold text-sm rounded-lg flex items-center gap-2 transition-all duration-200 hover:shadow-md cursor-pointer"
            >
              <Brain className="w-4 h-4" />
              IA
            </button>
          </div>

          {/* Floating Explanation Popup for Bikes Chart */}
          {openExplanation === 'bikes' && (
            <div className="absolute top-20 right-6 z-50 w-96 h-96 bg-white border-2 border-purple-300 rounded-xl shadow-2xl p-6 overflow-y-auto flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-600" />
                  <p className="text-sm font-bold text-purple-600 uppercase">Analyse IA</p>
                </div>
                <button
                  onClick={() => setOpenExplanation(null)}
                  className="p-1 hover:bg-gray-100 rounded transition-colors"
                >
                  <X className="w-4 h-4 text-gray-600" />
                </button>
              </div>
              {explanationLoading ? (
                <div className="flex-grow flex items-center justify-center">
                  <div className="text-center">
                    <div className="relative w-16 h-16 mx-auto mb-4">
                      <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-300 to-blue-300 animate-pulse"></div>
                      <div className="absolute inset-2 rounded-full bg-white"></div>
                      <Loader className="absolute inset-0 m-auto w-8 h-8 text-purple-600 animate-spin" />
                    </div>
                    <p className="text-sm font-semibold text-gray-900">Generating analysis...</p>
                    <p className="text-xs text-gray-500 mt-1">🤖 AI is thinking...</p>
                  </div>
                </div>
              ) : (
                <>
                  <p className="text-sm text-gray-700 leading-relaxed mb-4 flex-grow">{explanationText}</p>
                  <button
                    onClick={() => fetchAIExplanation('bikes')}
                    disabled={explanationLoading}
                    className="mt-auto w-full px-3 py-2 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 disabled:opacity-50 text-white text-xs font-semibold rounded transition-all"
                  >
                    <Sparkles className="w-3 h-3 inline mr-1" />
                    Générer une autre explication
                  </button>
                </>
              )}
            </div>
          )}

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
          <Card className="p-6 lg:col-span-2 relative overflow-hidden">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Metrics Comparison - Top 4 Communes</h3>
              <button
                onClick={() => handleExplanationClick('comparison')}
                disabled={explanationLoading}
                className="px-4 py-2 bg-white border-2 border-gray-300 hover:border-green-600 hover:bg-green-50 disabled:opacity-50 text-black font-bold text-sm rounded-lg flex items-center gap-2 transition-all duration-200 hover:shadow-md cursor-pointer"
              >
                <Brain className="w-4 h-4" />
                IA
              </button>
            </div>

            {/* Floating Explanation Popup for Comparison Chart */}
            {openExplanation === 'comparison' && (
              <div className="absolute top-20 right-6 z-50 w-96 h-96 bg-white border-2 border-purple-300 rounded-xl shadow-2xl p-6 overflow-y-auto flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-purple-600" />
                    <p className="text-sm font-bold text-purple-600 uppercase">Analyse IA</p>
                  </div>
                  <button
                    onClick={() => setOpenExplanation(null)}
                    className="p-1 hover:bg-gray-100 rounded transition-colors"
                  >
                    <X className="w-4 h-4 text-gray-600" />
                  </button>
                </div>
                {explanationLoading ? (
                  <div className="flex-grow flex items-center justify-center">
                    <div className="text-center">
                      <Loader className="w-8 h-8 text-purple-600 animate-spin mx-auto mb-2" />
                      <p className="text-sm text-gray-600">Generating AI explanation...</p>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="text-sm text-gray-700 leading-relaxed mb-4 flex-grow">{explanationText}</p>
                    <button
                      onClick={() => fetchAIExplanation('comparison')}
                      disabled={explanationLoading}
                      className="mt-auto w-full px-3 py-2 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 disabled:opacity-50 text-white text-xs font-semibold rounded transition-all"
                    >
                      <Sparkles className="w-3 h-3 inline mr-1" />
                      Générer une autre explication
                    </button>
                  </>
                )}
              </div>
            )}

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
      
        {/* Weekly + Monthly example charts */}
        {selectedCommune !== 'all' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8 lg:col-span-2">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Motif Hebdomadaire</h3>
                <p className="text-sm text-gray-600">Exemple: moyenne par jour (24h)</p>
              </div>
              {weeklySeries.length === 0 ? (
                <div className="text-gray-600">No weekly data available.</div>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={weeklySeries} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="bikes" fill="#10b981" name="Bikes (avg)" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Tendance Mensuelle</h3>
                <p className="text-sm text-gray-600">Exemple: dernier mois (30 jours)</p>
              </div>
              {monthlySeries.length === 0 ? (
                <div className="text-gray-600">No monthly data available.</div>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={monthlySeries} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tickFormatter={(t) => new Date(t).toLocaleDateString()} />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="bikes" stroke="#3b82f6" strokeWidth={2} name="Bikes" />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </Card>
          </div>
        )}

        {/* Hourly timeseries for selected commune */}
        {selectedCommune !== 'all' && (
          <Card className="p-6 lg:col-span-2 relative overflow-hidden">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">24h Hourly Trend (Bikes & Docks)</h3>
              <p className="text-sm text-gray-600">Available bikes + docks are inferred to be constant</p>
            </div>

            {hourlyLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader className="w-8 h-8 text-purple-600 animate-spin mr-2" />
                <span>Loading hourly series...</span>
              </div>
            ) : hourlyError ? (
              <div className="text-red-600">{hourlyError}</div>
            ) : hourlySeries.length === 0 ? (
              <div className="text-gray-600">No hourly data available for this commune.</div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={hourlySeries} margin={{ top: 20, right: 30, left: 0, bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="timestamp" tickFormatter={(t) => new Date(t).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} />
                  <YAxis />
                  <Tooltip content={({ active, payload }) => {
                    if (active && payload && payload[0]) {
                      const d = payload[0].payload as any;
                      return (
                        <div className="bg-white p-3 border border-gray-200 rounded shadow-lg">
                          <p className="font-semibold text-gray-900">{new Date(d.timestamp).toLocaleString()}</p>
                          <p className="text-sm text-gray-600">Bikes: {d.bikes}</p>
                          <p className="text-sm text-gray-600">Docks: {d.docks}</p>
                        </div>
                      );
                    }
                    return null;
                  }} />
                  <Legend />
                  <Line type="monotone" dataKey="bikes" stroke="#10b981" strokeWidth={2} name="Bikes" />
                  <Line type="monotone" dataKey="docks" stroke="#f59e0b" strokeWidth={2} name="Docks" />
                </LineChart>
              </ResponsiveContainer>
            )}
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
