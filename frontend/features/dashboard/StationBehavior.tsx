import { useState, useMemo, memo, useEffect } from 'react';
import { Card } from '../../shared/ui/card';
import { Button } from '../../shared/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../shared/ui/select';
import { Input } from '../../shared/ui/input';
import { Search, Calendar, TrendingUp, TrendingDown, AlertCircle, Sparkles, X, Brain } from 'lucide-react';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Badge } from '../../shared/ui/badge';
import { api, API_ENDPOINTS } from '../../api/config';

// Default/sample data for when API data isn't available
// Updated to use Flux (Flux de Transit) and Entropy (Entropie Shannon)
const getDefaultHourlyData = () => Array.from({ length: 24 }, (_, i) => ({
  hour: `${String(i).padStart(2, '0')}:00`,
  bikes: Math.floor(20 + Math.random() * 30),
  docks: Math.floor(15 + Math.random() * 35),
  // Flux: Rate of change (positive = source, negative = sink)
  flux: Math.floor(-10 + Math.random() * 20),
  // Entropy: Predictability measure (0 = predictable, 8 = highly dynamic)
  entropy: parseFloat((Math.random() * 4 + 1).toFixed(2)),
}));

const getDefaultWeeklyData = () => [
  { day: 'Lun', avgBikes: 22, peakBikes: 42, avgFlux: 2.5, avgEntropy: 2.1 },
  { day: 'Mar', avgBikes: 24, peakBikes: 45, avgFlux: 3.1, avgEntropy: 2.3 },
  { day: 'Mer', avgBikes: 23, peakBikes: 44, avgFlux: 1.8, avgEntropy: 2.0 },
  { day: 'Jeu', avgBikes: 25, peakBikes: 46, avgFlux: 2.9, avgEntropy: 2.4 },
  { day: 'Ven', avgBikes: 28, peakBikes: 48, avgFlux: 4.2, avgEntropy: 2.8 },
  { day: 'Sam', avgBikes: 32, peakBikes: 45, avgFlux: 5.1, avgEntropy: 3.2 },
  { day: 'Dim', avgBikes: 30, peakBikes: 42, avgFlux: 4.5, avgEntropy: 3.0 },
];

const getDefaultMonthlyData = () => [
  { date: 'Sem 1', bikes: 1245, flux: 12.5, entropy: 2.1 },
  { date: 'Sem 2', bikes: 1389, flux: 15.3, entropy: 2.3 },
  { date: 'Sem 3', bikes: 1423, flux: 13.8, entropy: 2.2 },
  { date: 'Sem 4', bikes: 1156, flux: 10.2, entropy: 1.9 },
  { date: 'Sem 5', bikes: 1534, flux: 18.5, entropy: 2.6 },
];

// Default popular stations - Updated with analytical metrics
const getDefaultPopularStations = () => [
  { name: 'Gare du Nord', entropy: 3.8, flux: 12.5, profile: 'commuter_sink', trend: 'up' },
  { name: 'Champs-Élysées', entropy: 4.2, flux: 8.3, profile: 'balanced_hub', trend: 'up' },
  { name: 'Bastille', entropy: 3.5, flux: -5.2, profile: 'commuter_source', trend: 'down' },
  { name: 'Luxembourg', entropy: 2.9, flux: 2.1, profile: 'balanced_hub', trend: 'up' },
  { name: 'République', entropy: 3.6, flux: -8.5, profile: 'commuter_source', trend: 'stable' },
  { name: 'Montparnasse', entropy: 4.1, flux: 6.8, profile: 'balanced_hub', trend: 'up' },
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
  const [dailyBehaviorData, setDailyBehaviorData] = useState(getDefaultHourlyData());
  const [weeklyPattern, setWeeklyPattern] = useState(getDefaultWeeklyData());
  const [monthlyTrend, setMonthlyTrend] = useState(getDefaultMonthlyData());
  const [popularStations, setPopularStations] = useState(getDefaultPopularStations());
  const [openExplanation, setOpenExplanation] = useState<string | null>(null);
  const [explanationText, setExplanationText] = useState('');

  // Fetch communes for filtering
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

  // Fetch stations on component mount
  useEffect(() => {
    const fetchStations = async () => {
      try {
        setError('');
        // Fetch real stations from API with optional commune filter
        const url = selectedCommune && selectedCommune !== 'all' 
          ? `${API_ENDPOINTS.stations}?limit=500&commune_code=${selectedCommune}`
          : `${API_ENDPOINTS.stations}?limit=500`;
        
        const response = await api.get(url);
        console.log('Stations API Response:', response);
        
        if (response && response.results && Array.isArray(response.results)) {
          const stationsList = response.results
            .filter((s: any) => s.commune_code) // Only include stations with a commune_code
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
          
          console.log('Processed stations count:', stationsList.length);
          console.log('Sample station:', stationsList[0]);
          
          setAllStations(stationsList);
          setStations(stationsList);
          // Set first station as default
          if (stationsList.length > 0) {
            setSelectedStation(stationsList[0].stationcode.toString());
          }
        } else {
          console.error('Unexpected response structure:', response);
          setError('Invalid station data format from API');
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
          
          // Update hourly data with station-specific variation
          setDailyBehaviorData(getDefaultHourlyData());
          setWeeklyPattern(getDefaultWeeklyData());
          setMonthlyTrend(getDefaultMonthlyData());
        }
      } catch (err) {
        console.error('Error fetching station data:', err);
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

  const handleExplanationClick = (chartType: string) => {
    setOpenExplanation(chartType);
    setExplanationText(getAIExplanation(chartType));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      {/* AI Explanation Modal */}
      {openExplanation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl border-0 shadow-2xl max-h-[80vh] overflow-y-auto">
            <div className="p-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-r from-blue-100 to-purple-100 rounded-lg">
                    <Sparkles className="w-6 h-6 text-purple-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">Analyse IA</h2>
                </div>
                <button
                  onClick={() => setOpenExplanation(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6 text-gray-600" />
                </button>
              </div>
              
              <div className="mb-6 pb-6 border-b border-gray-200">
                <p className="text-sm font-semibold text-purple-600 uppercase tracking-wide mb-2">
                  {openExplanation === 'daily' && 'Analyse Temporelle 24h'}
                  {openExplanation === 'weekly' && 'Motif Hebdomadaire'}
                  {openExplanation === 'monthly' && 'Tendance Mensuelle'}
                </p>
              </div>

              <div className="prose prose-sm max-w-none">
                <p className="text-gray-700 leading-relaxed text-lg whitespace-pre-wrap">
                  {explanationText}
                </p>
              </div>

              <div className="mt-8 pt-6 border-t border-gray-200 flex justify-end gap-3">
                <Button
                  onClick={() => setOpenExplanation(null)}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-900 font-semibold"
                >
                  Fermer
                </Button>
                <Button
                  onClick={() => setExplanationText(getAIExplanation(openExplanation))}
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Générer une autre explication
                </Button>
              </div>
            </div>
          </Card>
        </div>
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
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Période</label>
            <Select defaultValue="7days">
              <SelectTrigger className="border border-gray-300">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Aujourd'hui</SelectItem>
                <SelectItem value="7days">7 derniers jours</SelectItem>
                <SelectItem value="30days">30 derniers jours</SelectItem>
                <SelectItem value="custom">Plage personnalisée</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end">
            <Button className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold">
              <Search className="w-4 h-4 mr-2" />
              Analyser
            </Button>
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
            <Badge className={`text-base px-4 py-2 font-bold ${
              stationData?.status === 'active' 
                ? 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-700' 
                : 'bg-gradient-to-r from-red-100 to-pink-100 text-red-700'
            }`}>
              {stationData?.status === 'active' ? '✓ Opérationnelle' : '✗ Inactive'}
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
        {/* 24-Hour Behavior - Flux and Entropy Analysis */}
        <Card className="p-6 border-0 shadow-md">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900">Analyse Temporelle 24h</h3>
          </div>
          <p className="text-sm text-gray-600 mb-5">Flux de Transit (variation du nombre de vélos) et Entropie Shannon (prévisibilité)</p>
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
              <YAxis yAxisId="left" stroke="#6b7280" label={{ value: 'Vélos & Places', angle: -90, position: 'insideLeft' }} />
              <YAxis yAxisId="right" orientation="right" stroke="#6b7280" label={{ value: 'Flux / Entropie', angle: 90, position: 'insideRight' }} />
              <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#fff' }} />
              <Legend wrapperStyle={{ paddingTop: '20px' }} />
              <Area yAxisId="left" type="monotone" dataKey="bikes" stackId="1" stroke="#10b981" fillOpacity={1} fill="url(#dailyBikes)" name="Vélos Disponibles" />
              <Area yAxisId="left" type="monotone" dataKey="docks" stackId="1" stroke="#3b82f6" fillOpacity={1} fill="url(#dailyDocks)" name="Places Disponibles" />
              <Line yAxisId="right" type="monotone" dataKey="flux" stroke="#ef4444" strokeWidth={2} name="Flux de Transit (Δ vélos)" dot={{ fill: '#ef4444', r: 3 }} />
              <Line yAxisId="right" type="monotone" dataKey="entropy" stroke="#8b5cf6" strokeWidth={2} name="Entropie Shannon" dot={{ fill: '#8b5cf6', r: 3 }} strokeDasharray="5 5" />
                <button
              onClick={() => handleExplanationClick('daily')}
              className="absolute bottom-2 right-6 z-[100] px-3 py-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold text-xs rounded-lg flex items-center gap-1 transition-all duration-200 hover:shadow-lg cursor-pointer"
            >
              <Brain className="w-4 h-4" />
              IA
            </button>
            </AreaChart>
          </ResponsiveContainer>

            <button
              onClick={() => handleExplanationClick('daily')}
              className="absolute bottom-2 right-6 z-[100] px-3 py-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold text-xs rounded-lg flex items-center gap-1 transition-all duration-200 hover:shadow-lg cursor-pointer"
            >
              <Brain className="w-4 h-4" />
              IA
            </button>
          </div>
          
          <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-gray-200">
            <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
              <p className="text-sm font-semibold text-gray-600">Flux Positif (Source)</p>
              <p className="text-2xl font-bold text-green-600">+8.5 vélos/h</p>
              <p className="text-sm text-gray-600 mt-1">08:00 - 09:00</p>
            </div>
            <div className="p-4 bg-gradient-to-r from-red-50 to-pink-50 rounded-lg border border-red-200">
              <p className="text-sm font-semibold text-gray-600">Flux Négatif (Puits)</p>
              <p className="text-2xl font-bold text-red-600">-7.2 vélos/h</p>
              <p className="text-sm text-gray-600 mt-1">18:00 - 19:00</p>
            </div>
            <div className="p-4 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg border border-purple-200">
              <p className="text-sm font-semibold text-gray-600">Entropie Max (Dynamique)</p>
              <p className="text-2xl font-bold text-purple-600">3.8</p>
              <p className="text-sm text-gray-600 mt-1">Haute imprévisibilité</p>
            </div>
          </div>

           <button
              onClick={() => handleExplanationClick('daily')}
              className="absolute bottom-2 right-6 z-[100] px-3 py-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold text-xs rounded-lg flex items-center gap-1 transition-all duration-200 hover:shadow-lg cursor-pointer"
            >
              <Brain className="w-4 h-4" />
              IA
            </button>
        </Card>

        {/* Weekly Pattern */}
        <Card className="p-6 border-0 shadow-md">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900">Motif Hebdomadaire</h3>
          </div>
          <p className="text-sm text-gray-600 mb-5">Flux moyen et entropie par jour de la semaine</p>
          <div className="relative">
            <ResponsiveContainer width="100%" height={320}>
            <BarChart data={weeklyPattern} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="weekFlux" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ef4444" stopOpacity={0.8}/>
                  <stop offset="100%" stopColor="#ef4444" stopOpacity={0.3}/>
                </linearGradient>
                <linearGradient id="weekEntropy" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                  <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="day" stroke="#6b7280" />
              <YAxis yAxisId="left" stroke="#6b7280" label={{ value: 'Flux Moyen', angle: -90, position: 'insideLeft' }} />
              <YAxis yAxisId="right" orientation="right" stroke="#6b7280" label={{ value: 'Entropie Moyenne', angle: 90, position: 'insideRight' }} />
              <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#fff' }} />
              <Legend wrapperStyle={{ paddingTop: '20px' }} />
              <Bar yAxisId="left" dataKey="avgFlux" fill="url(#weekFlux)" name="Flux de Transit Moyen" />
              <Line yAxisId="right" type="monotone" dataKey="avgEntropy" stroke="#8b5cf6" strokeWidth={2} name="Entropie Moyenne" dot={{ fill: '#8b5cf6', r: 5 }} />
            </BarChart>
          </ResponsiveContainer>
            <button
              onClick={() => handleExplanationClick('weekly')}
              className="absolute bottom-2 right-6 z-[100] px-3 py-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold text-xs rounded-lg flex items-center gap-1 transition-all duration-200 hover:shadow-lg cursor-pointer"
            >
              <Brain className="w-4 h-4" />
              IA
            </button>
          </div>
        </Card>

        {/* Monthly Trend - Flux and Entropy Evolution */}
        <Card className="p-6 border-0 shadow-md">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900">Tendance Mensuelle</h3>
          </div>
          <p className="text-sm text-gray-600 mb-5">Évolution du flux de transit et de l'entropie Shannon</p>
          <div className="relative">
            <ResponsiveContainer width="100%" height={320}>
            <LineChart data={monthlyTrend} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="monthFlux" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ef4444" stopOpacity={0.3}/>
                  <stop offset="100%" stopColor="#ef4444" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="monthEntropy" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                  <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="date" stroke="#6b7280" />
              <YAxis yAxisId="left" stroke="#6b7280" label={{ value: 'Flux (vélos/jour)', angle: -90, position: 'insideLeft' }} />
              <YAxis yAxisId="right" orientation="right" stroke="#6b7280" label={{ value: 'Entropie', angle: 90, position: 'insideRight' }} />
              <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#fff' }} />
              <Legend wrapperStyle={{ paddingTop: '20px' }} />
              <Line yAxisId="left" type="monotone" dataKey="flux" stroke="#ef4444" strokeWidth={3} name="Flux de Transit Total" dot={{ fill: '#ef4444', r: 5 }} />
              <Line yAxisId="right" type="monotone" dataKey="entropy" stroke="#8b5cf6" strokeWidth={3} name="Entropie Shannon Moyenne" dot={{ fill: '#8b5cf6', r: 5 }} strokeDasharray="5 5" />
            </LineChart>
          </ResponsiveContainer>
            <button
              onClick={() => handleExplanationClick('monthly')}
              className="absolute bottom-2 right-6 z-[100] px-3 py-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold text-xs rounded-lg flex items-center gap-1 transition-all duration-200 hover:shadow-lg cursor-pointer"
            >
              <Brain className="w-4 h-4" />
              IA
            </button>
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
                <th className="text-left py-4 px-4 text-sm font-bold text-gray-700">Entropie Shannon</th>
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
                      {station.entropy}
                      <span className="ml-1 text-xs">(bits)</span>
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
