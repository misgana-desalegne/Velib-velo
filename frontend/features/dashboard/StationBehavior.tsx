import { useState, useMemo, memo, useEffect } from 'react';
import { Card } from '../../shared/ui/card';
import { Button } from '../../shared/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../shared/ui/select';
import { Input } from '../../shared/ui/input';
import { Search, Calendar, TrendingUp, TrendingDown, AlertCircle, Sparkles, X, Brain, Loader } from 'lucide-react';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Badge } from '../../shared/ui/badge';
import { api, API_ENDPOINTS } from '../../api/config';
import { generateStationAnalysisPrompt, getExplanationWithCache } from '../../api/gemini';

// Default/sample data for when API data isn't available
// Updated to use Flux (Flux de Transit) and CV (Coefficient de Variation)
const getDefaultHourlyData = () => Array.from({ length: 24 }, (_, i) => ({
  hour: `${String(i).padStart(2, '0')}:00`,
  bikes: Math.floor(20 + Math.random() * 30),
  docks: Math.floor(15 + Math.random() * 35),
  // Flux: Rate of change (positive = source, negative = sink)
  flux: Math.floor(-10 + Math.random() * 20),
  // CV: Activity Variability (0% = no activity, 0-20% = stale, 20-40% = moderate, >40% = highly active)
  cv: parseFloat((Math.random() * 40 + 10).toFixed(2)),
}));

const getDefaultWeeklyData = () => [
  { day: 'Lun', avgBikes: 22, peakBikes: 42, avgFlux: 2.5, avgCV: 21.0 },
  { day: 'Mar', avgBikes: 24, peakBikes: 45, avgFlux: 3.1, avgCV: 23.0 },
  { day: 'Mer', avgBikes: 23, peakBikes: 44, avgFlux: 1.8, avgCV: 20.0 },
  { day: 'Jeu', avgBikes: 25, peakBikes: 46, avgFlux: 2.9, avgCV: 24.0 },
  { day: 'Ven', avgBikes: 28, peakBikes: 48, avgFlux: 4.2, avgCV: 28.0 },
  { day: 'Sam', avgBikes: 32, peakBikes: 45, avgFlux: 5.1, avgCV: 32.0 },
  { day: 'Dim', avgBikes: 30, peakBikes: 42, avgFlux: 4.5, avgCV: 30.0 },
];

const getDefaultMonthlyData = () => [
  { date: 'Sem 1', bikes: 1245, flux: 12.5, cv: 21.0 },
  { date: 'Sem 2', bikes: 1389, flux: 15.3, cv: 23.0 },
  { date: 'Sem 3', bikes: 1423, flux: 13.8, cv: 22.0 },
  { date: 'Sem 4', bikes: 1156, flux: 10.2, cv: 19.0 },
  { date: 'Sem 5', bikes: 1534, flux: 18.5, cv: 26.0 },
];

// Default popular stations - Updated with analytical metrics
const getDefaultPopularStations = () => [
  { name: 'Gare du Nord', cv: 38.0, flux: 12.5, profile: 'commuter_sink', trend: 'up' },
  { name: 'Champs-Élysées', cv: 42.0, flux: 8.3, profile: 'balanced_hub', trend: 'up' },
  { name: 'Bastille', cv: 35.0, flux: -5.2, profile: 'commuter_source', trend: 'down' },
  { name: 'Luxembourg', cv: 29.0, flux: 2.1, profile: 'balanced_hub', trend: 'up' },
  { name: 'République', cv: 36.0, flux: -8.5, profile: 'commuter_source', trend: 'stable' },
  { name: 'Montparnasse', cv: 41.0, flux: 6.8, profile: 'balanced_hub', trend: 'up' },
];

export function StationBehavior() {
  const [selectedStation, setSelectedStation] = useState<string | null>(null);
  const [stations, setStations] = useState<any[]>([]);
  const [allStations, setAllStations] = useState<any[]>([]);
  const [communes, setCommunes] = useState<any[]>([]);
  const [selectedCommune, setSelectedCommune] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [stationData, setStationData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dailyBehaviorData, setDailyBehaviorData] = useState<any[]>([]);
  const [weeklyPattern, setWeeklyPattern] = useState<any[]>([]);
  const [monthlyTrend, setMonthlyTrend] = useState<any[]>([]);
  const [popularStations, setPopularStations] = useState(getDefaultPopularStations());
  const [openExplanation, setOpenExplanation] = useState<string | null>(null);
  const [explanationText, setExplanationText] = useState('');
  const [explanationLoading, setExplanationLoading] = useState(false);

  /**
   * Fetch AI explanation from Gemini API
   */
  const fetchAIExplanation = async (chartType: 'daily' | 'weekly' | 'monthly') => {
    try {
      setExplanationLoading(true);
      const stationName = stationData?.name || 'Station';
      
      // Pass actual chart data to prompts
      let chartData: any[] = [];
      if (chartType === 'daily') {
        chartData = dailyBehaviorData;
      } else if (chartType === 'weekly') {
        chartData = weeklyPattern;
      } else if (chartType === 'monthly') {
        chartData = monthlyTrend;
      }
      
      const prompt = generateStationAnalysisPrompt(chartType, stationName, chartData);
      const cacheKey = `station_${selectedStation}_${chartType}_${new Date().toDateString()}`;
      
      console.log(`🤖 Fetching AI explanation for: ${chartType}`);
      console.log(`📊 Chart data points: ${chartData.length}`);
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

  const handleExplanationClick = async (chartType: 'daily' | 'weekly' | 'monthly') => {
    if (openExplanation === chartType) {
      setOpenExplanation(null);
    } else {
      await fetchAIExplanation(chartType);
    }
  };
  useEffect(() => {
    const fetchCommunes = async () => {
      try {
        const communeList = await api.get(API_ENDPOINTS.communeList);
        if (Array.isArray(communeList)) {
          setCommunes(communeList);
        }
      } catch (err) {
        console.error('Error fetching communes:', err);
      }
    };
    fetchCommunes();
  }, []);

  // Fetch stations on component mount & commune change
  useEffect(() => {
    const fetchStations = async () => {
      try {
        setError('');
        // Fetch all stations with optional commune filter (paginated)
        const baseUrl = selectedCommune && selectedCommune !== 'all'
          ? `${API_ENDPOINTS.stationsAll}?commune_code=${selectedCommune}`
          : API_ENDPOINTS.stationsAll;

        const response = await api.get(baseUrl);
        const allResults: any[] = Array.isArray(response) ? response : [];

        const stationsList = allResults
          .filter((s: any) => s.commune_code)
          .map((s: any) => ({
            id: s.id,
            stationcode: s.stationcode,
            name: s.name,
            commune_code: s.commune_code,
            commune: s.commune_name || `Zone ${s.commune_code}` || 'Non classé',
            status: s.is_installed ? 'active' : 'inactive',
            available_bikes: s.numbikesavailable || 0,
            available_docks: s.numdocksavailable || 0,
            capacity: s.capacity || 0,
          }));

        console.log('✅ Processed stations count:', stationsList.length);
        console.log('📋 Sample station:', stationsList[0]);

        setAllStations(stationsList);
        setStations(stationsList);
        if (stationsList.length > 0) {
          setSelectedStation(stationsList[0].stationcode.toString());
        }
      } catch (err) {
        console.error('Error fetching stations:', err);
        setError('Failed to load stations');
      } finally {
        setLoading(false);
      }
    };
    fetchStations();
  }, [selectedCommune]);

  // Fetch popular stations (sources/sinks/ghost) from analytics
  useEffect(() => {
    const fetchPopularStations = async () => {
      try {
        const [sourcesRes, sinksRes, ghostsRes] = await Promise.all([
          api.get(`${API_ENDPOINTS.advancedAnalytics}sources/?days=15&limit=6`),
          api.get(`${API_ENDPOINTS.advancedAnalytics}sinks/?days=15&limit=6`),
          api.get(`${API_ENDPOINTS.advancedAnalytics}ghost_stations/?days=15&limit=6`),
        ]);

        const sources = sourcesRes?.sources || [];
        const sinks = sinksRes?.sinks || [];
        const ghosts = ghostsRes?.ghost_stations || [];

        const stationToCommune = new Map<number, string>();
        allStations.forEach((s: any) => stationToCommune.set(s.stationcode, s.commune_code));

        const inSelectedCommune = (stationcode: number) => {
          if (selectedCommune === 'all') return true;
          return stationToCommune.get(stationcode)?.toString() === selectedCommune.toString();
        };

        const mappedSources = sources
          .filter((s: any) => inSelectedCommune(s.station__stationcode))
          .map((s: any) => ({
            name: s.station__name,
            cv: Number(s.avg_cv || 0).toFixed(1),
            flux: Number(s.avg_net_flux || 0).toFixed(1),
            profile: 'commuter_source',
            trend: 'up',
          }));

        const mappedSinks = sinks
          .filter((s: any) => inSelectedCommune(s.station__stationcode))
          .map((s: any) => ({
            name: s.station__name,
            cv: Number(s.avg_cv || 0).toFixed(1),
            flux: Number(s.avg_net_flux || 0).toFixed(1),
            profile: 'commuter_sink',
            trend: 'down',
          }));

        const mappedGhosts = ghosts
          .filter((s: any) => inSelectedCommune(s.station__stationcode))
          .map((s: any) => ({
            name: s.station__name,
            cv: Number(s.avg_cv || 0).toFixed(1),
            flux: Number(s.avg_daily_turnover || 0).toFixed(1),
            profile: 'ghost_station',
            trend: 'stable',
          }));

        const combined = [...mappedSources, ...mappedSinks, ...mappedGhosts].slice(0, 10);
        setPopularStations(combined);
      } catch (err) {
        console.error('Error fetching popular stations:', err);
        setPopularStations([]);
      }
    };

    fetchPopularStations();
  }, [selectedCommune, allStations]);

  // Filter stations by commune and search query
  useEffect(() => {
    let filtered = allStations;
    
    console.log('Filter effect triggered - allStations:', allStations.length, 'selectedCommune:', selectedCommune, 'searchQuery:', searchQuery);
    
    // Filter by commune
    if (selectedCommune !== 'all') {
      filtered = filtered.filter(s => 
        s.commune_code?.toString() === selectedCommune.toString()
      );
      console.log('After commune filter:', filtered.length);
    }
    
    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(s => 
        s.name.toLowerCase().includes(query) ||
        s.commune.toLowerCase().includes(query)
      );
      console.log('After search filter:', filtered.length);
    }
    
    console.log('Setting stations to:', filtered.length);
    setStations(filtered);
    
    // Reset selected station if it's not in filtered list
    if (selectedStation && !filtered.some(s => s.stationcode.toString() === selectedStation)) {
      if (filtered.length > 0) {
        setSelectedStation(filtered[0].stationcode.toString());
      } else {
        setSelectedStation(null);
      }
    }
  }, [selectedCommune, searchQuery, allStations, selectedStation]);

  // Fetch station data when selected station changes
  useEffect(() => {
    const fetchStationData = async () => {
      if (!selectedStation) return;
      
      setLoading(true);
      setError('');
      try {
        // Find selected station from local data
        const station = stations.find(s => s.stationcode.toString() === selectedStation);
        if (station) {
          setStationData(station);
          
          try {
            console.log('📊 Fetching daily analytics for station ID:', station.id);
            const stationCapacity = station?.capacity || 50;

            const dailyUrl = `${API_ENDPOINTS.analytics}?days=30&station_ids=${station.id}`;
            const dailyResponse = await api.get(dailyUrl);
            const dailyResults = dailyResponse?.results || dailyResponse || [];

            const latestDaily = Array.isArray(dailyResults) && dailyResults.length > 0
              ? dailyResults.slice().sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]
              : null;
            const dailyCv = latestDaily ? Number(latestDaily.shannon_entropy || 0) : 0;

            console.log('🔍 Fetching hourly analytics for station ID:', station.id);
            const hourlyUrl = `${API_ENDPOINTS.hourlyAnalytics}?station_id=${station.id}&days=1`;
            const hourlyResponse = await api.get(hourlyUrl);
            const hourlyResults = hourlyResponse?.results || hourlyResponse || [];

            if (Array.isArray(hourlyResults) && hourlyResults.length > 0) {
              const hourlySorted = hourlyResults
                .sort((a: any, b: any) => (a.hour ?? 0) - (b.hour ?? 0));

              const dailyData = hourlySorted.map((record: any) => ({
                hour: `${String(record.hour ?? 0).padStart(2, '0')}:00`,
                bikes: Number(record.bikes_available_avg || 0),
                docks: Number(record.docks_available_avg || 0),
                flux: Number(record.hourly_delta || 0),
                cv: dailyCv,
              }));

              setDailyBehaviorData(dailyData);
            } else {
              // ensure UI always has 24-hour data for charts
              setDailyBehaviorData(getDefaultHourlyData());
            }

            if (Array.isArray(dailyResults) && dailyResults.length > 0) {
              const dayNames = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
              const weeklyByDay = new Map<string, any[]>();
              dayNames.forEach(d => weeklyByDay.set(d, []));

              dailyResults.forEach((record: any) => {
                const dateObj = new Date(record.date);
                const dayName = dayNames[dateObj.getDay()];
                weeklyByDay.get(dayName)?.push(record);
              });

              const weeklyData = dayNames.map(day => {
                const dayRecords = weeklyByDay.get(day) || [];
                if (dayRecords.length === 0) {
                  return { day, avgBikes: 0, peakBikes: 0, avgFlux: 0, avgCV: 0 };
                }

                const avgUtil = dayRecords.reduce((sum: number, r: any) => sum + parseFloat(r.average_utilization || 0), 0) / dayRecords.length;
                const avgFlux = dayRecords.reduce((sum: number, r: any) => sum + parseFloat(r.net_flux || 0), 0) / dayRecords.length;
                const avgEntropy = dayRecords.reduce((sum: number, r: any) => sum + parseFloat(r.shannon_entropy || 0), 0) / dayRecords.length;
                const maxUtil = Math.max(...dayRecords.map(r => parseFloat(r.average_utilization || 0)));

                return {
                  day,
                  avgBikes: Math.round((avgUtil / 100) * stationCapacity),
                  peakBikes: Math.round((maxUtil / 100) * stationCapacity),
                  avgFlux: Math.round(avgFlux * 100) / 100,
                  avgCV: Math.round(avgEntropy * 100) / 100,
                };
              });

              setWeeklyPattern(weeklyData);
            } else {
              setWeeklyPattern([]);
            }

            console.log('📆 Fetching weekly analytics for station ID:', station.id);
            const weeklyUrl = `${API_ENDPOINTS.weeklyAnalytics}?weeks=5&station_id=${station.id}`;
            const weeklyResponse = await api.get(weeklyUrl);
            const weeklyResults = weeklyResponse?.results || weeklyResponse || [];

            if (Array.isArray(weeklyResults) && weeklyResults.length > 0) {
              const sortedWeekly = weeklyResults
                .sort((a: any, b: any) => new Date(a.week_start_date).getTime() - new Date(b.week_start_date).getTime());

              const monthlyData = sortedWeekly.slice(-5).map((record: any, idx: number) => ({
                date: `Sem ${idx + 1}`,
                bikes: Math.round((parseFloat(record.average_utilization || 0) / 100) * stationCapacity),
                flux: Math.round(parseFloat(record.net_flux || 0) * 100) / 100,
                cv: Math.round(parseFloat(record.shannon_entropy || 0) * 100) / 100,
              }));

              setMonthlyTrend(monthlyData);
            } else {
              setMonthlyTrend([]);
            }
          } catch (analyticsErr) {
            console.error('❌ Error fetching analytics:', analyticsErr);
            setDailyBehaviorData([]);
            setWeeklyPattern([]);
            setMonthlyTrend([]);
          }
        }
      } catch (err) {
        console.error('❌ Error fetching station data:', err);
        setError('Failed to load station data');
      } finally {
        setLoading(false);
      }
    };

    fetchStationData();
  }, [selectedStation, stations]);

  // Generate random AI explanation
  const getAIExplanation = (chartType: string) => {
    const explanations = {
      daily: [
        "L'analyse temporelle 24h montre une forte corrélation entre les heures de pointe et la variation du flux de transit. Le pic d'entropie observé en fin d'après-midi indique une prévisibilité réduite due à la congestion. Les vélos disparaissent principalement entre 8-10h (heure de pointe matinale) et 17-19h (heure de pointe du soir), ce qui correspond aux patterns de navette domicile-travail typiques de Paris.",
        "Notre analyse révèle un flux de transit hautement dynamique avec une variation moyenne de ±8.5 vélos/heure. L'entropie Shannon augmente progressivement au cours de la journée, atteignant son maximum en fin d'après-midi (3.8 bits). Cela suggère une augmentation de l'imprévisibilité liée au comportement des utilisateurs pendant les heures de pointe.",
        "Les données montrent clairement que cette station fonctionne selon un pattern de 'commuter hub'. Les heures 7-9h et 17-19h présentent les variations les plus importantes avec une perte nette de vélos. Le taux d'entropie stable le matin (2.1 bits) mais volatile l'après-midi (3.9 bits) indique un changement significatif de prévisibilité.",
        "L'analyse révèle que le flux de transit suit une sinusoïde inverse par rapport aux heures de travail. Les creux d'occupation en fin d'après-midi (17h-19h) correspondent à un flux fortement négatif, indiquant un mouvement massif vers d'autres stations. L'entropie augmente lors des transitions d'activité.",
      ],
      weekly: [
        "Le pattern hebdomadaire montre une augmentation progressive du flux du lundi au vendredi, avec des pics en fin de semaine. Le mercredi affiche l'entropie la plus basse (2.0 bits), suggérant une plus grande prévisibilité. Le week-end révèle un comportement radicalement différent avec un flux positif accru (+4.5 à +5.1 vélos/jour).",
        "L'analyse hebdomadaire met en évidence une variation de flux de 3.1 vélos/jour en semaine à 5.1 vélos/jour le samedi. Cela correspond à un changement de pattern d'utilisation entre les jours de travail et le week-end. L'entropie augmente de 2.1 le lundi à 3.2 le samedi.",
        "Les données montrent clairement un effet 'semaine-week-end' marqué. La variation de flux augmente de 80% entre le mercredi et le samedi, indiquant une forte augmentation du tourisme ou des loisirs en fin de semaine. L'entropie parallèle passe de 2.0 à 3.2 bits.",
        "Le pattern hebdomadaire révèle une station fortement liée aux patterns de travail. Le flux augmente régulièrement du lundi au mercredi avant de plafonner. Le saut vendredi-samedi est particulièrement notable (+52%), suggesting un changement radical de comportement d'utilisation.",
      ],
      monthly: [
        "La tendance mensuelle sur 5 semaines montre une augmentation globale du flux de transit, avec un pic à la semaine 2 (15.3 vélos/jour) suivi d'une baisse à la semaine 4 (10.2 vélos/jour). L'entropie Shannon reste relativement stable (1.9 à 2.6 bits), suggérant une cohérence dans les patterns d'utilisation. Le rebond semaine 5 indique une reprise d'activité.",
        "L'analyse mensuelle révèle une volatilité modérée avec un coefficient de variation de ±25%. Le flux de transit fluctue entre 10.2 et 18.5 vélos/jour, tandis que l'entropie varie entre 1.9 et 2.6 bits. Cela suggest des factors externes (météo, événements) influençant l'utilisation.",
        "Les données mensuelles montrent un pattern cyclique cohérent avec une période de 4-5 semaines. L'augmentation remarquable à la semaine 5 (+22% vs semaine 4) pourrait indiquer une récupération après les vacances scolaires ou un événement spécial. L'entropie stable confirme une utilisation prévisible.",
        "L'analyse long-terme révèle une croissance générale du flux de 12.5 à 18.5 vélos/jour sur 5 semaines, soit une augmentation de 48%. L'entropie Shannon reste contrôlée (max 2.6), indiquant une augmentation prévisible plutôt que chaotique. Cela suggest une augmentation réelle de la demande de vélos.",
      ],
    };

    const chartExplanations = explanations[chartType as keyof typeof explanations] || explanations.daily;
    return chartExplanations[Math.floor(Math.random() * chartExplanations.length)];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">

        

      {/* AI Explanation Floating Popup - appears over the specific chart */}
      {openExplanation && (
        <div className="fixed inset-0 z-40 bg-black bg-opacity-50" onClick={() => setOpenExplanation(null)} />
      )}

      {/* Header with gradient */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-8 pt-8 pb-12">
        <h2 className="text-4xl font-bold mb-2">Comportement des Stations</h2>
        <p className="text-green-100 text-lg">Analysez les motifs d'utilisation et les tendances pour chaque station</p>
      </div>

      <div className="px-8 py-8">
      {/* Filters */}
      <Card className="p-6 mb-8 border-0 shadow-md">
        <h3 className="text-lg font-bold text-gray-900 mb-5">Filtres et Sélection</h3>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Rechercher Station</label>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <Input 
                placeholder="Par nom..." 
                className="pl-9 border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Commune</label>
            <Select value={selectedCommune} onValueChange={setSelectedCommune}>
              <SelectTrigger className="border border-gray-300">
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
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Station</label>
            <Select value={selectedStation || ''} onValueChange={setSelectedStation}>
              <SelectTrigger className="border border-gray-300">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {stations.length > 0 ? (
                  stations.map((station: any) => (
                    <SelectItem key={station.id} value={station.stationcode.toString()}>
                      {station.name} ({station.commune})
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="empty" disabled>Aucune station trouvée</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
        
        </div>
      </Card>

      {/* Station Info Summary */}
      {selectedStation && stationData && (
        <div className="mb-8 p-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-4xl font-bold text-gray-900">{stationData?.name || 'Sélectionnez une station'}</h2>
              <p className="text-lg text-gray-600 mt-2">📍 {stationData?.commune || 'Commune Inconnue'}</p>
            </div>
            <Badge className={`text-base px-4 py-2 font-bold flex items-center gap-2 ${
              // Check if station is critical (CV = 0, meaning no activity/variation)
              dailyBehaviorData.length > 0 && Math.max(...dailyBehaviorData.map(d => d.cv)) === 0
                ? 'bg-gradient-to-r from-red-500 to-orange-500 text-white animate-pulse' 
                : stationData?.status === 'active' 
                ? 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-700' 
                : 'bg-gradient-to-r from-red-100 to-pink-100 text-red-700'
            }`}>
              {dailyBehaviorData.length > 0 && Math.max(...dailyBehaviorData.map(d => d.cv)) === 0 
                ? <>
                    <AlertCircle className="w-5 h-5" />
                    ⚠️ CRITIQUE - Pas d'Activité
                  </>
                : stationData?.status === 'active' 
                ? '✓ Opérationnelle' 
                : '✗ Inactive'
              }
            </Badge>
          </div>
        </div>
      )}

      {/* Station Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card className="p-6 border-0 shadow-md transition-all duration-300 hover:shadow-lg hover:-translate-y-1 bg-white">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Vélos Disponibles</p>
          <p className="text-4xl font-bold text-gray-900">{stationData?.available_bikes || 0}</p>
          <p className="text-sm text-gray-600 mt-2">Capacité totale: {stationData?.capacity || 0}</p>
        </Card>
        <Card className="p-6 border-0 shadow-md transition-all duration-300 hover:shadow-lg hover:-translate-y-1 bg-white">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Places Disponibles</p>
          <p className="text-4xl font-bold text-gray-900">{stationData?.available_docks || 0}</p>
          <p className="text-sm text-gray-600 mt-2">Stationnements libres</p>
        </Card>
        <Card className="p-6 border-0 shadow-md transition-all duration-300 hover:shadow-lg hover:-translate-y-1 bg-white">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">État</p>
          <p className={`text-3xl font-bold ${stationData?.status === 'active' ? 'text-green-600' : 'text-red-600'}`}>
            {stationData?.status === 'active' ? 'Actif' : 'Inactif'}
          </p>
          <p className="text-sm text-gray-600 mt-2">{stationData?.commune || 'Non assignée'}</p>
        </Card>
        <Card className="p-6 border-0 shadow-md transition-all duration-300 hover:shadow-lg hover:-translate-y-1 bg-white">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Taux d'Utilisation</p>
          <p className="text-4xl font-bold text-green-600">
            {stationData && stationData.capacity > 0 
              ? Math.round((stationData.available_bikes / stationData.capacity) * 100) 
              : 0}%
          </p>
          <p className="text-sm text-gray-600 mt-2">Vélos / Capacité</p>
        </Card>
      </div>

      {/* Main Charts */}
      <div className="grid grid-cols-1 gap-6 mb-8">
        {/* 24-Hour Behavior - Flux and CV Analysis */}
        <Card className="p-6 border-0 shadow-md relative overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900">Analyse Quotidienne 24h</h3>
            <button
              onClick={() => handleExplanationClick('daily')}
              disabled={explanationLoading}
              className="px-4 py-2 bg-white border-2 border-gray-300 hover:border-green-600 hover:bg-green-50 disabled:opacity-50 text-black font-bold text-sm rounded-lg flex items-center gap-2 transition-all duration-200 hover:shadow-md cursor-pointer"
            >
              <Brain className="w-4 h-4" />
              IA
            </button>
          </div>
          
          {/* Floating Explanation Popup for Daily Chart */}
          {openExplanation === 'daily' && (
            <div className="absolute top-14 right-6 z-50 w-96 h-96 bg-white border-2 border-purple-300 rounded-xl shadow-2xl p-6 overflow-y-auto flex flex-col">
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
                    onClick={() => fetchAIExplanation('daily')}
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

          <p className="text-sm text-gray-600 mb-5">Nombre de vélos disponibles, Flux horaire (vélos/heure) et CV (%) sur les 24 dernières heures</p>
          <div className="relative">
            <ResponsiveContainer width="100%" height={350}>
            <AreaChart data={dailyBehaviorData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="dailyBikes" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="dailyDocks" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="hour" stroke="#6b7280" />
              <YAxis yAxisId="left" stroke="#6b7280" label={{ value: 'Vélos Disponibles', angle: -90, position: 'insideLeft' }} />
              <YAxis yAxisId="right" orientation="right" stroke="#6b7280" label={{ value: 'Flux / CV (%)', angle: 90, position: 'insideRight' }} />
              <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#fff' }} />
              <Legend wrapperStyle={{ paddingTop: '20px' }} />
              <Area yAxisId="left" type="monotone" dataKey="bikes" stackId="1" stroke="#10b981" fillOpacity={1} fill="url(#dailyBikes)" name="Vélos Disponibles" />
              <Area yAxisId="left" type="monotone" dataKey="docks" stackId="1" stroke="#3b82f6" fillOpacity={1} fill="url(#dailyDocks)" name="Places Disponibles" />
              <Line yAxisId="right" type="monotone" dataKey="flux" stroke="#ef4444" strokeWidth={2} name="Flux Horaire (vélos/h)" dot={{ fill: '#ef4444', r: 3 }} />
              <Line yAxisId="right" type="monotone" dataKey="cv" stroke="#8b5cf6" strokeWidth={2} name="CV (%)" dot={{ fill: '#8b5cf6', r: 3 }} strokeDasharray="5 5" />

            </AreaChart>
          </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-gray-200">
            <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
              <p className="text-sm font-semibold text-gray-600">Flux Positif Max</p>
              <p className="text-2xl font-bold text-green-600">
                {dailyBehaviorData.length > 0 
                  ? Math.max(...dailyBehaviorData.map(d => d.flux), 0).toFixed(2)
                  : '0'} v/h
              </p>
              <p className="text-sm text-gray-600 mt-1">Approvisionne d'autres</p>
            </div>
            <div className="p-4 bg-gradient-to-r from-red-50 to-pink-50 rounded-lg border border-red-200">
              <p className="text-sm font-semibold text-gray-600">Flux Négatif Min</p>
              <p className="text-2xl font-bold text-red-600">
                {dailyBehaviorData.length > 0 
                  ? Math.min(...dailyBehaviorData.map(d => d.flux), 0).toFixed(2)
                  : '0'} v/h
              </p>
              <p className="text-sm text-gray-600 mt-1">Demande d'autres</p>
            </div>
            <div className="p-4 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg border border-purple-200">
              <p className="text-sm font-semibold text-gray-600">CV Max</p>
              <p className="text-2xl font-bold text-purple-600">
                {dailyBehaviorData.length > 0 
                  ? Math.max(...dailyBehaviorData.map(d => d.cv)).toFixed(2)
                  : '0'}
              </p>
              <p className="text-sm text-gray-600 mt-1">Imprévisibilité (0-8)</p>
            </div>
          </div>
        </Card>

        {/* Weekly Pattern */}
        <Card className="p-6 border-0 shadow-md relative overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900">Motif Hebdomadaire</h3>
            <button
              onClick={() => handleExplanationClick('weekly')}
              disabled={explanationLoading}
              className="px-4 py-2 bg-white border-2 border-gray-300 hover:border-green-600 hover:bg-green-50 disabled:opacity-50 text-black font-bold text-sm rounded-lg flex items-center gap-2 transition-all duration-200 hover:shadow-md cursor-pointer"
            >
              <Brain className="w-4 h-4" />
              IA
            </button>
          </div>
          
          {/* Floating Explanation Popup for Weekly Chart */}
          {openExplanation === 'weekly' && (
            <div className="absolute top-14 right-6 z-50 w-96 h-96 bg-white border-2 border-purple-300 rounded-xl shadow-2xl p-6 overflow-y-auto flex flex-col">
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
                    onClick={() => fetchAIExplanation('weekly')}
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

          <p className="text-sm text-gray-600 mb-5">Flux moyen et CV par jour de la semaine</p>
          <div className="relative">
            <ResponsiveContainer width="100%" height={320}>
            <BarChart data={weeklyPattern} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="weekFlux" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ef4444" stopOpacity={0.8}/>
                  <stop offset="100%" stopColor="#ef4444" stopOpacity={0.3}/>
                </linearGradient>
                <linearGradient id="weekCV" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                  <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="day" stroke="#6b7280" />
              <YAxis yAxisId="left" stroke="#6b7280" label={{ value: 'Flux Moyen', angle: -90, position: 'insideLeft' }} />
              <YAxis yAxisId="right" orientation="right" stroke="#6b7280" label={{ value: 'CV Moyen (%)', angle: 90, position: 'insideRight' }} />
              <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#fff' }} />
              <Legend wrapperStyle={{ paddingTop: '20px' }} />
              <Bar yAxisId="left" dataKey="avgFlux" fill="url(#weekFlux)" name="Flux de Transit Moyen" />
              <Line yAxisId="right" type="monotone" dataKey="avgCV" stroke="#8b5cf6" strokeWidth={2} name="CV Moyen (%)" dot={{ fill: '#8b5cf6', r: 5 }} />
            </BarChart>
          </ResponsiveContainer>
          </div>
        </Card>

        {/* Monthly Trend - Flux and CV Evolution */}
        <Card className="p-6 border-0 shadow-md relative overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900">Tendance Mensuelle</h3>
            <button
              onClick={() => handleExplanationClick('monthly')}
              disabled={explanationLoading}
              className="px-4 py-2 bg-white border-2 border-gray-300 hover:border-green-600 hover:bg-green-50 disabled:opacity-50 text-black font-bold text-sm rounded-lg flex items-center gap-2 transition-all duration-200 hover:shadow-md cursor-pointer"
            >
              <Brain className="w-4 h-4" />
              IA
            </button>
          </div>
          
          {/* Floating Explanation Popup for Monthly Chart */}
          {openExplanation === 'monthly' && (
            <div className="absolute top-14 right-6 z-50 w-96 h-96 bg-white border-2 border-purple-300 rounded-xl shadow-2xl p-6 overflow-y-auto flex flex-col">
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
                    onClick={() => fetchAIExplanation('monthly')}
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

          <p className="text-sm text-gray-600 mb-5">Évolution du flux de transit et du CV</p>
          <div className="relative">
            <ResponsiveContainer width="100%" height={320}>
            <LineChart data={monthlyTrend} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="monthFlux" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ef4444" stopOpacity={0.3}/>
                  <stop offset="100%" stopColor="#ef4444" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="monthCV" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                  <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="date" stroke="#6b7280" />
              <YAxis yAxisId="left" stroke="#6b7280" label={{ value: 'Flux (vélos/jour)', angle: -90, position: 'insideLeft' }} />
              <YAxis yAxisId="right" orientation="right" stroke="#6b7280" label={{ value: 'CV (%)', angle: 90, position: 'insideRight' }} />
              <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#fff' }} />
              <Legend wrapperStyle={{ paddingTop: '20px' }} />
              <Line yAxisId="left" type="monotone" dataKey="flux" stroke="#ef4444" strokeWidth={3} name="Flux de Transit Total" dot={{ fill: '#ef4444', r: 5 }} />
              <Line yAxisId="right" type="monotone" dataKey="cv" stroke="#8b5cf6" strokeWidth={3} name="CV Moyen (%)" dot={{ fill: '#8b5cf6', r: 5 }} strokeDasharray="5 5" />
            </LineChart>
          </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Advanced Analytics Table */}
      <Card className="p-6 border-0 shadow-md">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold text-gray-900">Analyse Avancée des Stations</h3>
          <Button className="bg-green-600 hover:bg-green-700 text-white font-semibold">
            <Calendar className="w-4 h-4 mr-2" />
            Exporter Rapport
          </Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-gray-200 bg-gray-50">
                <th className="text-left py-4 px-4 text-sm font-bold text-gray-700">Station</th>
                <th className="text-left py-4 px-4 text-sm font-bold text-gray-700">Coeficient de Variation (CV)</th>
                <th className="text-left py-4 px-4 text-sm font-bold text-gray-700">Flux de Transit</th>
                <th className="text-left py-4 px-4 text-sm font-bold text-gray-700">Profil</th>
                <th className="text-left py-4 px-4 text-sm font-bold text-gray-700">Tendance</th>
                <th className="text-left py-4 px-4 text-sm font-bold text-gray-700">Action</th>
              </tr>
            </thead>
            <tbody>
              {popularStations.map((station, idx) => (
                <tr key={idx} className="border-b border-gray-100 hover:bg-gradient-to-r hover:from-gray-50 hover:to-transparent transition">
                  <td className="py-4 px-4 text-gray-900 font-semibold">{station.name}</td>
                  <td className="py-4 px-4">
                    <span className="inline-flex items-center px-3 py-1 rounded-full bg-purple-100 text-purple-700 font-bold text-sm">
                      {station.cv}
                      <span className="ml-1 text-xs">%</span>
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full font-bold text-sm ${
                      station.flux > 0 
                        ? 'bg-red-100 text-red-700' 
                        : 'bg-blue-100 text-blue-700'
                    }`}>
                      {station.flux > 0 ? '+' : ''}{station.flux} v/j
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    {station.profile === 'commuter_sink' && (
                      <Badge className="bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-700 font-bold">
                        Puits (Attracteur)
                      </Badge>
                    )}
                    {station.profile === 'commuter_source' && (
                      <Badge className="bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 font-bold">
                        Source (Distributeur)
                      </Badge>
                    )}
                    {station.profile === 'balanced_hub' && (
                      <Badge className="bg-gradient-to-r from-orange-100 to-yellow-100 text-orange-700 font-bold">
                        Hub Équilibré
                      </Badge>
                    )}
                    {station.profile === 'ghost_station' && (
                      <Badge className="bg-gradient-to-r from-purple-100 to-indigo-100 text-purple-700 font-bold">
                        Station Fantôme
                      </Badge>
                    )}
                  </td>
                  <td className="py-4 px-4">
                    {station.trend === 'up' && (
                      <Badge className="bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 font-bold">
                        <TrendingUp className="w-4 h-4 mr-1" />
                        Croissance
                      </Badge>
                    )}
                    {station.trend === 'down' && (
                      <Badge className="bg-gradient-to-r from-red-100 to-pink-100 text-red-700 font-bold">
                        <TrendingDown className="w-4 h-4 mr-1" />
                        Baisse
                      </Badge>
                    )}
                    {station.trend === 'stable' && (
                      <Badge className="bg-gradient-to-r from-gray-100 to-slate-100 text-gray-700 font-bold">
                        Stable
                      </Badge>
                    )}
                  </td>
                  <td className="py-4 px-4">
                    <Button variant="ghost" size="sm" className="text-green-600 hover:text-green-700 hover:bg-green-50 font-semibold">
                      Détails
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      </div>
    </div>
  );
}
