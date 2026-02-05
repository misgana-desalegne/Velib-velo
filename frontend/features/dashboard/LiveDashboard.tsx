import { useState, useEffect, useMemo, memo } from 'react';
import { Card } from '../../shared/ui/card';
import { Badge } from '../../shared/ui/badge';
import { Button } from '../../shared/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../shared/ui/select';
import { Bike, MapPin, AlertCircle, TrendingUp, RefreshCw, Activity, Zap, Menu, X } from 'lucide-react';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Progress } from '../../shared/ui/progress';
import { api, API_ENDPOINTS } from '../../api/config';
import LoadingSpinner from '../../shared/components/LoadingSpinner';

interface LiveDashboardStats {
  total_stations?: number;
  active_stations?: number;
  total_bikes?: number;
  total_docks?: number;
  avg_utilization?: number;
}

// Memoized metric cards with modern styling
const MetricCard = memo(({ title, value, icon: Icon, badge, extra, iconColor, gradient }: any) => (
  <Card className={`p-6 border-0 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${gradient || 'bg-white'}`}>
    <div className="flex items-start justify-between mb-4">
      <div className="flex-1">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">{title}</p>
        <p className={`text-4xl font-bold ${gradient ? 'text-white' : 'text-gray-900'}`}>{value}</p>
      </div>
      <div className={`p-3 rounded-xl ${
        iconColor === 'blue' ? 'bg-blue-100' :
        iconColor === 'green' ? 'bg-green-100' :
        iconColor === 'purple' ? 'bg-purple-100' :
        iconColor === 'orange' ? 'bg-orange-100' :
        'bg-gray-100'
      }`}>
        <Icon className={`w-6 h-6 ${
          iconColor === 'blue' ? 'text-blue-600' :
          iconColor === 'green' ? 'text-green-600' :
          iconColor === 'purple' ? 'text-purple-600' :
          iconColor === 'orange' ? 'text-orange-600' :
          'text-gray-600'
        }`} />
      </div>
    </div>
    {badge && <Badge variant="secondary" className="text-xs font-semibold">{badge}</Badge>}
    {extra}
  </Card>
));

MetricCard.displayName = 'MetricCard';

export function LiveDashboard() {
  const [stats, setStats] = useState<LiveDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [hourlyData, setHourlyData] = useState<any[]>([]);
  const [topStations, setTopStations] = useState<any[]>([]);
  const [communes, setCommunes] = useState<any[]>([]);
  const [selectedCommune, setSelectedCommune] = useState<string>('all');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const fetchDashboardData = async () => {
    try {
      setError(null);
      setRefreshing(true);
      // Add commune filter to API call if selected
      const url = selectedCommune && selectedCommune !== 'all' 
        ? `${API_ENDPOINTS.liveDashboard}?commune_code=${selectedCommune}`
        : API_ENDPOINTS.liveDashboard;
      
      const dashboardData = await api.get(url);
      setStats(dashboardData);
      setLastUpdate(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load live data');
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchHourlySummary = async () => {
    try {
      const summaryUrl = selectedCommune && selectedCommune !== 'all'
        ? `${API_ENDPOINTS.hourlyAnalytics}summary/?commune_code=${selectedCommune}&days=1`
        : `${API_ENDPOINTS.hourlyAnalytics}summary/?days=1`;

      const summary = await api.get(summaryUrl);
      const rawSummary = summary && (summary.results || summary) ? (summary.results || summary) : [];

      // Normalize to 24-hour array so charts always show all hours
      const normalizeHourlySummary = (raw: any[]): any[] => {
        const byHour = new Map<number, any>();
        if (Array.isArray(raw)) {
          raw.forEach(r => {
            let h: number | null = null;
            if (r == null) return;
            if (typeof r.hour === 'number') h = r.hour;
            else if (typeof r.hour === 'string') {
              const m = r.hour.match(/(\d{1,2})/);
              if (m) h = parseInt(m[1], 10);
            } else if (r.hour_ts) {
              try { h = new Date(r.hour_ts).getHours(); } catch(e) { h = null; }
            }
            if (h == null || !Number.isFinite(h)) return;
            h = ((h % 24) + 24) % 24;
            byHour.set(h, r);
          });
        }

        return Array.from({ length: 24 }, (_, hour) => {
          const src = byHour.get(hour) || {};
          const toNum = (v: any) => (v == null || Number.isNaN(Number(v)) ? 0 : Number(v));
          return {
            hour: `${String(hour).padStart(2, '0')}:00`,
            bikes: toNum(src.bikes ?? src.bikes_available_avg ?? src.bikes_available ?? src.available_bikes),
            docks: toNum(src.docks ?? src.docks_available_avg ?? src.docks_available ?? src.available_docks),
            flux: toNum(src.net_flux ?? src.hourly_delta ?? src.flux ?? 0),
            cv: toNum(src.cv ?? src.shannon_entropy ?? 0),
          };
        });
      };

      if (Array.isArray(rawSummary)) {
        setHourlyData(normalizeHourlySummary(rawSummary));
      } else {
        setHourlyData(normalizeHourlySummary([]));
      }
    } catch (err) {
      console.error('Error fetching hourly analytics summary:', err);
      // fallback to empty 24-hour series so the chart renders
      setHourlyData(Array.from({ length: 24 }, (_, hour) => ({
        hour: `${String(hour).padStart(2, '0')}:00`,
        bikes: 0,
        docks: 0,
        flux: 0,
        cv: 0,
      })));
    }
  };

  useEffect(() => {
    fetchDashboardData();
    fetchHourlySummary();
    const interval = setInterval(fetchDashboardData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [selectedCommune]);

  const getStatusColor = useMemo(() => (status: string) => {
    switch (status) {
      case 'high': return 'bg-green-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  }, []);

  // Fetch top stations with highest availability
  useEffect(() => {
    const fetchTopStations = async () => {
      try {
        const response = await api.get(API_ENDPOINTS.stations);
        const stations = response.results || response;
        if (stations && Array.isArray(stations)) {
          const topStationsList = stations
            .map((s: any) => {
              // Use mechanical + ebike since numbikesavailable is always 0
              const bikes = (s.mechanical || 0) + (s.ebike || 0);
              const capacity = s.capacity || 1;
              const utilization = (bikes / capacity) * 100;
              
              return {
                id: s.id,
                name: s.name || s.stationcode || `Station ${s.id}`,
                commune: s.commune_name || `Zone ${s.id}`,
                bikes: bikes,
                docks: capacity - bikes, // Remaining capacity
                capacity: capacity,
                utilization: Math.round(utilization),
                status: utilization >= 70 ? 'high' : (utilization >= 40 ? 'medium' : 'low'),
              };
            })
            .sort((a: any, b: any) => b.bikes - a.bikes) // Sort by most bikes available
            .slice(0, 10); // Top 10 stations
          
          setTopStations(topStationsList);
        }
      } catch (err) {
        console.error('Error fetching top stations:', err);
      }
    };
    fetchTopStations();
  }, []);

  const refreshData = () => {
    fetchDashboardData();
  };

  const formattedTime = useMemo(() => lastUpdate.toLocaleTimeString(), [lastUpdate]);

  const [arrondissementSummary, setArrondissementSummary] = useState<any[]>([]);
  const [criticalStations, setCriticalStations] = useState<any[]>([]);

  // Fetch communes for filtering
  useEffect(() => {
    const fetchCommunes = async () => {
      try {
        const communesList = await api.get(API_ENDPOINTS.communeList);
        if (Array.isArray(communesList)) {
          setCommunes(communesList);
        }
      } catch (err) {
        console.error('Error fetching communes:', err);
      }
    };
    fetchCommunes();
  }, []);

  // Fetch real commune data for arrondissementSummary
  useEffect(() => {
    const fetchCommuneData = async () => {
      try {
        const communes = await api.get(API_ENDPOINTS.communeSummary);
        if (Array.isArray(communes)) {
          setArrondissementSummary(communes.map((c: any) => ({
            arr: c.name || c.commune,
            utilization: Math.round(((c.available_bikes || 0) / (c.capacity || 1)) * 100),
          })));
        }
      } catch (err) {
        console.error('Error fetching commune data:', err);
      }
    };
    fetchCommuneData();
  }, []);

  // Calculate alert severity based on multiple metrics
  const calculateAlertSeverity = (utilization: number, cv: number, flux: number, isGhost: boolean) => {
    // Ghost stations are always critical
    if (isGhost) {
      return { severity: 'critical', issue: '👻 La station phantom, pas de activity - Comportement Anormal' };
    }
    
    // CRITICAL: Zero activity (CV = 0, shannon_entropy = 0) - completely stagnant
    if (cv === 0) {
      return { severity: 'critical', issue: '🚫 Pas d\'Activité - Station Stagnante (CV=0)' };
    }
    
    // CRITICAL: No bikes at all (completely empty)
    if (utilization < 0.01) {
      return { severity: 'critical', issue: '🚨 Aucun Vélo Disponible - Station Vide' };
    }
    
    // CRITICAL: Predictably empty (no bikes AND low CV - consistently unavailable)
    if (utilization < 0.05 && cv < 20) {
      return { severity: 'critical', issue: `📍 Constamment Vide (CV: ${cv.toFixed(1)}%) - Non Fiable` };
    }
    
    // HIGH: Very low availability with low activity (problematic station)
    if (utilization < 0.1 && cv < 30) {
      return { severity: 'high', issue: `📍 Stock Faible & Activité Basse (CV: ${cv.toFixed(1)}%)` };
    }
    
    // HIGH: Very low availability but high activity (in demand)
    if (utilization < 0.1 && cv >= 30) {
      return { severity: 'high', issue: `🔥 Station Populaire - Faible Disponibilité (CV: ${cv.toFixed(1)}%)` };
    }
    
    // POSITIVE: High CV (> 40%) = High activity & variability = Good usage
    // This is NOT an alert - it's healthy station activity
    if (cv > 40) {
      return { severity: null, issue: null }; // No alert - high activity is good!
    }
    
    // POSITIVE: High flux (> 10 vélos/hour) = High turnover = Active station
    // This is NOT an alert - it indicates busy station
    if (Math.abs(flux) > 10) {
      return { severity: null, issue: null }; // No alert - high turnover is healthy
    }
    
    // WARNING: Low availability (< 20%) with stable/low activity
    if (utilization < 0.2 && cv < 30) {
      return { severity: 'warning', issue: '📍 Stock Faible - Disponibilité Limitée' };
    }
    
    // WARNING: High utilization/occupancy (> 85%)
    if (utilization > 0.85) {
      return { severity: 'warning', issue: '📈 Presque Plein - Utilisation Élevée' };
    }
    
    // No alert - station is functioning normally
    return { severity: null, issue: null };
  };

  // Fetch real station data for critical stations with analytics metrics
  useEffect(() => {
    const fetchCriticalStations = async () => {
      try {
        console.log('🔄 Starting critical stations fetch...');
        
        // Fetch stations - just use first page with 50 items (ghost stations should be on first page)
        console.log('\n🏢 Fetching stations data...');
        const response = await api.get(API_ENDPOINTS.stations);
        const allStations = response.results || response || [];
        console.log(`✅ Stations fetched: ${allStations.length} records`);
        
        // Filter stations by profile to find critical ones
        const criticalStationList = allStations.filter((s: any) => {
          // Include ghost stations and stations with CV=0 (no variation)
          return s.profile === 'ghost_station' || s.profile === 'ERREUR' || s.profile === 'ghost';
        });

        const stationIds = criticalStationList.map((s: any) => s.id).join(',');
        const dailyAnalyticsMap = new Map<number, any>();
        const weeklyAnalyticsMap = new Map<number, any>();

        if (stationIds) {
          const dailyUrl = `${API_ENDPOINTS.analytics}?days=1&station_ids=${stationIds}`;
          const dailyResponse = await api.get(dailyUrl);
          const dailyResults = dailyResponse.results || dailyResponse || [];
          dailyResults.forEach((a: any) => dailyAnalyticsMap.set(a.station, a));

          const weeklyUrl = `${API_ENDPOINTS.weeklyAnalytics}?weeks=1&station_ids=${stationIds}`;
          const weeklyResponse = await api.get(weeklyUrl);
          const weeklyResults = weeklyResponse.results || weeklyResponse || [];
          weeklyResults.forEach((a: any) => weeklyAnalyticsMap.set(a.station, a));
        }

        const criticalStations = criticalStationList.map((s: any) => {
          // Transform raw station data to match component expectations
          const bikes = (s.mechanical || 0) + (s.ebike || 0);
          const capacity = s.capacity || 1;
          const utilization = (bikes / capacity) * 100;

          const daily = dailyAnalyticsMap.get(s.id);
          const weekly = weeklyAnalyticsMap.get(s.id);

          return {
            id: s.id,
            name: s.name || s.stationcode || `Station ${s.id}`,
            commune: s.commune_name || `Zone ${s.id}`,
            bikes: bikes,
            docks: capacity - bikes,
            capacity: capacity,
            utilization: Math.round(utilization),
            profile: s.profile,
            cv: daily ? Number(daily.shannon_entropy || 0) : 0,
            flux: daily ? Number(daily.net_flux || 0) : 0,
            weeklyFlux: weekly ? Number(weekly.net_flux || 0) : 0,
            severity: 'critical',
            isGhost: s.profile === 'ghost_station' || s.profile === 'ghost',
            issue: s.profile === 'ghost_station' || s.profile === 'ghost' ? '👻 Ghost Station' : 'Station Error',
          };
        });
        
        console.log(`🔍 Critical stations found (by profile): ${criticalStations.length}`);
        console.log('Critical stations (transformed):', criticalStations.slice(0, 3));
        
        setCriticalStations(criticalStations);
      } catch (err) {
        console.error('Error fetching critical stations:', err);
      }
    };
    fetchCriticalStations();
  }, []);

  if (loading) {
    return (
      <div className="p-8 bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen flex items-center justify-center">
        <LoadingSpinner size={64} message="Chargement des données en direct..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
        <Card className="p-6 border border-red-300 bg-gradient-to-r from-red-50 to-red-100 shadow-lg">
          <div className="flex items-start gap-4">
            <AlertCircle className="w-6 h-6 text-red-600 mt-1 flex-shrink-0" />
            <div>
              <h3 className="font-bold text-red-900 mb-2 text-lg">Erreur de Chargement</h3>
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      {/* Header with gradient background - Responsive */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 sm:px-8 pt-4 sm:pt-8 pb-8 sm:pb-12">
        {/* Desktop Header */}
        <div className="hidden md:flex items-center justify-between mb-4">
          <div>
            <h2 className="text-4xl font-bold mb-2 flex items-center gap-3 text-blue-200">
              <Activity className="w-8 h-8" />
              Analyse des Stations en Direct
            </h2>
            <p className="text-blue-100 text-lg">Surveillance en temps réel de 1 500+ stations de vélos à Paris</p>
          </div>
          <div className="flex items-center gap-4 bg-white/20 backdrop-blur px-4 py-3 rounded-xl flex-shrink-0">
            <div className="text-right">
              <p className="text-sm text-blue-100">Dernière mise à jour</p>
              <p className="text-sm font-semibold">{formattedTime}</p>
            </div>
            <Button onClick={refreshData} disabled={refreshing} className="bg-white text-blue-600 hover:bg-blue-50 font-semibold disabled:opacity-50">
              <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Actualisation...' : 'Actualiser'}
            </Button>
          </div>
        </div>

        {/* Mobile Header */}
        <div className="md:hidden">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 flex-1">
              <Activity className="w-6 h-6 text-blue-200" />
              <h2 className="text-lg sm:text-xl font-bold text-blue-200">Stations en Direct</h2>
            </div>
            <Button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              variant="ghost"
              size="sm"
              className="text-white hover:bg-blue-500 ml-2"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </Button>
          </div>
          
          {/* Mobile Menu - Collapsible */}
          {mobileMenuOpen && (
            <div className="bg-blue-500/30 backdrop-blur rounded-lg p-4 space-y-3">
              <div className="text-sm">
                <p className="text-blue-100">Dernière mise à jour</p>
                <p className="text-sm font-semibold text-white">{formattedTime}</p>
              </div>
              <Button 
                onClick={() => {
                  refreshData();
                  setMobileMenuOpen(false);
                }} 
                disabled={refreshing} 
                className="w-full bg-white text-blue-600 hover:bg-blue-50 font-semibold disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                {refreshing ? 'Actualisation...' : 'Actualiser'}
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="px-2 sm:px-4 py-4 space-y-4">

      {/* Commune Filter */}
      <Card className="p-3 sm:p-4 border-0 shadow-md">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="flex-1 w-full">
            <label className="block text-xs font-semibold text-gray-100 mb-1">Filtrer par Commune</label>
            <Select value={selectedCommune} onValueChange={setSelectedCommune}>
              <SelectTrigger className="border border-gray-100 h-5 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les Communes</SelectItem>
                {communes.map((commune: any) => (
                  <SelectItem key={commune.code} value={commune.code}>
                    {commune.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={refreshData} disabled={refreshing} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold h-9 disabled:opacity-50 w-full sm:w-auto">
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Actualisation...' : 'Actualiser'}
          </Button>
        </div>
      </Card>

      {/* Live Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        <Card className="p-2 sm:p-4 border-0 shadow-md transition-all duration-300 hover:shadow-lg hover:-translate-y-1 bg-white">
          <div className="flex items-start justify-between mb-2 sm:mb-3">
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1">Total Stations</p>
              <p className="text-2xl sm:text-3xl font-bold text-gray-900">{(stats?.total_stations || 0).toLocaleString()}</p>
            </div>
            <div className="p-2 rounded-lg bg-blue-100 flex-shrink-0">
              <MapPin className="w-4 sm:w-5 h-4 sm:h-5 text-blue-600" />
            </div>
          </div>
          <Badge className="bg-blue-100 text-blue-700 text-xs font-semibold">Opérationnelles</Badge>
        </Card>

        <Card className="p-2 sm:p-4 border-0 shadow-md transition-all duration-300 hover:shadow-lg hover:-translate-y-1 bg-white">
          <div className="flex items-start justify-between mb-2 sm:mb-3">
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Vélos Disponibles</p>
              <p className="text-2xl sm:text-3xl font-bold text-gray-900">{(stats?.total_bikes || 0).toLocaleString()}</p>
            </div>
            <div className="p-2 rounded-lg bg-green-100 flex-shrink-0">
              <Bike className="w-4 sm:w-5 h-4 sm:h-5 text-green-600" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-green-600" />
            <span className="text-xs font-semibold text-green-600">Temps réel</span>
          </div>
        </Card>

        <Card className="p-2 sm:p-4 border-0 shadow-md transition-all duration-300 hover:shadow-lg hover:-translate-y-1 bg-white">
          <div className="flex items-start justify-between mb-2 sm:mb-3">
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Places Disponibles</p>
              <p className="text-2xl sm:text-3xl font-bold text-gray-900">{(stats?.total_docks || 0).toLocaleString()}</p>
            </div>
            <div className="p-2 rounded-lg bg-purple-100 flex-shrink-0">
              <Zap className="w-4 sm:w-5 h-4 sm:h-5 text-purple-600" />
            </div>
          </div>
          <p className="text-xs font-semibold text-gray-600">Capacité restante</p>
        </Card>

        <Card className="p-2 sm:p-4 border-0 shadow-md transition-all duration-300 hover:shadow-lg hover:-translate-y-1 bg-white">
          <div className="flex items-start justify-between mb-2 sm:mb-3">
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Utilisation Moyenne</p>
              <p className="text-2xl sm:text-3xl font-bold text-gray-900">{((stats?.avg_utilization || 0) * 100).toFixed(1)}%</p>
            </div>
            <div className="p-2 rounded-lg bg-orange-100 flex-shrink-0">
              <TrendingUp className="w-4 sm:w-5 h-4 sm:h-5 text-orange-600" />
            </div>
          </div>
          <Progress value={(stats?.avg_utilization || 0) * 100} className="h-2" />
        </Card>

        <Card className="p-2 sm:p-4 border-0 shadow-md transition-all duration-300 hover:shadow-lg hover:-translate-y-1 bg-white">
          <div className="flex items-start justify-between mb-2 sm:mb-3">
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Stations Actives</p>
              <p className="text-2xl sm:text-3xl font-bold text-gray-900">{(stats?.active_stations || 0).toLocaleString()}</p>
            </div>
            <div className="p-2 rounded-lg bg-emerald-100 flex-shrink-0">
              <Activity className="w-4 sm:w-5 h-4 sm:h-5 text-emerald-600" />
            </div>
          </div>
          <p className="text-xs font-semibold text-gray-600">En service</p>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-8">
        {/* Hourly Availability */}
        <Card className="p-3 sm:p-6 border-0 shadow-md">
          <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-4 sm:mb-5">Tendance 24h</h3>
          <ResponsiveContainer width="100%" height={320}>
            <AreaChart data={hourlyData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorBikes" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorDocks" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="hour" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip contentStyle={{ backgroundColor: '#0366f0', border: 'none', borderRadius: '8px', color: '#fff' }} />
              <Legend wrapperStyle={{ paddingTop: '20px' }} />
              <Area type="monotone" dataKey="bikes" stackId="1" stroke="#10b981" fillOpacity={1} fill="url(#colorBikes)" name="Vélos" />
              <Area type="monotone" dataKey="docks" stackId="2" stroke="#3b82f6" fillOpacity={1} fill="url(#colorDocks)" name="Places" />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        {/* Top Stations by Availability */}
        <Card className="p-3 sm:p-6 border-0 shadow-md">
          <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-4 sm:mb-5">Top 10 Stations</h3>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {topStations.length === 0 ? (
              <div className="text-center py-12 text-gray-600">
                <Bike className="w-8 h-8 mx-auto mb-3 text-gray-400" />
                <p className="font-medium">Chargement des données...</p>
              </div>
            ) : (
              topStations.map((station, idx) => (
                <div key={station.id} className="flex items-center gap-4 p-4 bg-gradient-to-r from-gray-50 to-white rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all">
                  <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    #{idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-bold text-gray-900 truncate">{station.name}</p>
                      <Badge className="text-xs flex-shrink-0 bg-blue-100 text-blue-700">{station.commune}</Badge>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-600 font-medium">
                      <span className="flex items-center gap-1">🚲 {station.bikes}</span>
                      <span className="text-gray-400">•</span>
                      <span className="flex items-center gap-1">📍 {station.docks}</span>
                    </div>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <div className={`text-sm font-bold px-3 py-2 rounded-lg ${
                      station.utilization >= 70 ? 'bg-gradient-to-r from-green-100 to-green-50 text-green-700' :
                      station.utilization >= 40 ? 'bg-gradient-to-r from-yellow-100 to-yellow-50 text-yellow-700' :
                      'bg-gradient-to-r from-red-100 to-red-50 text-red-700'
                    }`}>
                      {station.utilization}%
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      {/* Critical Alerts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-8">
        {/* Critical Alerts Column */}
        <Card className="p-3 sm:p-6 border-0 shadow-md">
          <div className="flex items-center justify-between mb-4 sm:mb-5">
            <h3 className="text-base sm:text-lg font-bold text-gray-900 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              Alertes Critiques
            </h3>
            <Badge className={`text-xs font-bold px-2 sm:px-3 py-1 ${
              criticalStations.length > 0 
                ? 'bg-red-100 text-red-700' 
                : 'bg-green-100 text-green-700'
            }`}>
              {criticalStations.length}
            </Badge>
          </div>
          <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
            {criticalStations.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-12 h-12 mx-auto mb-3 bg-green-100 rounded-full flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-green-600" />
                </div>
                <p className="text-sm font-semibold text-gray-600">Aucune alerte</p>
                <p className="text-xs text-gray-500 mt-1">Toutes les stations fonctionnent correctement</p>
              </div>
            ) : (
              criticalStations.map((station, idx) => (
                <div 
                  key={idx} 
                  className={`p-4 rounded-lg border-l-4 transition-all hover:shadow-md ${
                    station.isGhost
                      ? 'bg-purple-50 border-purple-500 hover:bg-purple-100'
                      : station.severity === 'critical' 
                      ? 'bg-red-50 border-red-500 hover:bg-red-100' 
                      : station.severity === 'high'
                      ? 'bg-orange-50 border-orange-500 hover:bg-orange-100'
                      : 'bg-yellow-50 border-yellow-500 hover:bg-yellow-100'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                      station.isGhost ? 'bg-purple-600' : station.severity === 'critical' ? 'bg-red-600' : station.severity === 'high' ? 'bg-orange-600' : 'bg-yellow-600'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold text-gray-900">{station.name}</p>
                        {station.isGhost && <span className="text-xs bg-purple-200 text-purple-900 px-2 py-0.5 rounded font-bold">👻 PHANTOM</span>}
                      </div>
                      <p className="text-xs text-gray-600">{station.commune}</p>
                      <p className={`text-xs font-semibold mt-2 ${
                        station.isGhost ? 'text-purple-700' : station.severity === 'critical' ? 'text-red-700' : station.severity === 'high' ? 'text-orange-700' : 'text-yellow-700'
                      }`}>{station.issue}</p>
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <span className="text-xs bg-white/50 px-2 py-1 rounded font-medium">🚲 {station.bikes || 0}</span>
                        <span className="text-xs bg-white/50 px-2 py-1 rounded font-medium">📍 {station.docks || 0}</span>
                        <span className="text-xs bg-white/50 px-2 py-1 rounded font-bold">{station.utilization || 0}%</span>
                        {station.cv !== undefined && station.cv > 0 && <span className="text-xs bg-white/50 px-2 py-1 rounded font-medium">📊 CV: {station.cv.toFixed(1)}%</span>}
                        {station.flux !== undefined && station.flux !== 0 && <span className="text-xs bg-white/50 px-2 py-1 rounded font-medium">⚡ {station.flux > 0 ? '+' : ''}{station.flux.toFixed(1)} v/h</span>}
                        {station.weeklyFlux !== undefined && station.weeklyFlux !== 0 && <span className="text-xs bg-white/50 px-2 py-1 rounded font-medium">🗓️ {station.weeklyFlux > 0 ? '+' : ''}{station.weeklyFlux.toFixed(1)} v/sem</span>}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Right Column: Status Overview (2 cols) */}
        <Card className="p-3 sm:p-6 border-0 shadow-md lg:col-span-2">
          <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-4 sm:mb-5">État des Top Stations</h3>
          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
            {topStations.map((station) => (
              <div key={station.id} className="flex items-center gap-4 p-4 bg-gradient-to-r from-gray-50 to-white rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all">
                <div className={`w-3 h-3 rounded-full flex-shrink-0 ${
                  station.utilization >= 70 ? 'bg-gradient-to-r from-green-400 to-green-600 shadow-lg shadow-green-400/50' :
                  station.utilization >= 40 ? 'bg-gradient-to-r from-yellow-400 to-yellow-600 shadow-lg shadow-yellow-400/50' :
                  'bg-gradient-to-r from-red-400 to-red-600 shadow-lg shadow-red-400/50'
                }`} />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <p className="text-sm font-bold text-gray-900">{station.name}</p>
                    <Badge className="text-xs bg-blue-100 text-blue-700">{station.commune}</Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-600 font-medium mb-2">
                    <span className="flex items-center gap-1">🚲 {station.bikes} vélos</span>
                    <span className="flex items-center gap-1">📍 {station.docks} places</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Progress value={(station.bikes / station.capacity) * 100} className="flex-1 h-2" />
                    <span className="text-xs font-bold text-gray-700 w-12 text-right">{Math.round((station.bikes / station.capacity) * 100)}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
      </div>
    </div>
  );
}
