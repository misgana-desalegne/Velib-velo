import { useEffect, useMemo, useState, type ButtonHTMLAttributes } from 'react';
import {
  Bike,
  Download,
  MapPin,
  RefreshCw,
  Search,
  TrendingUp,
  Zap,
} from 'lucide-react';
import { api, API_ENDPOINTS } from '../../api/config';
import { Card, CardContent } from '../../shared/ui/card';
import { Input } from '../../shared/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../shared/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../shared/ui/tabs';
import {
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

type VelibTotals = {
  stations: number;
  capacity: number;
  bikes_available: number;
  docks_available: number;
  mechanical_available: number;
  ebike_available: number;
};

type VelibArea = {
  name: string;
  stations: number;
  capacity: number;
  bikes_available: number;
  docks_available: number;
  mechanical_available: number;
  ebike_available: number;
};

type VelibRealtimeResponse = {
  source: string;
  updated_at: string | null;
  totals: VelibTotals;
  by_area: VelibArea[];
  warning?: string;
};

type MetricKey = keyof VelibTotals;

type HistoryPoint = {
  t: number;
  bikes_available: number;
  docks_available: number;
  mechanical_available: number;
  ebike_available: number;
};

function formatNumber(value: number) {
  return new Intl.NumberFormat('fr-FR').format(value);
}

function formatPercent(value: number) {
  return new Intl.NumberFormat('fr-FR', {
    style: 'percent',
    maximumFractionDigits: 0,
  }).format(value);
}

function safeDateMs(value: string | null | undefined): number {
  if (!value) return Date.now();
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : Date.now();
}

function toCsv(rows: Record<string, unknown>[]) {
  const keys = Array.from(
    rows.reduce((acc, row) => {
      Object.keys(row).forEach((k) => acc.add(k));
      return acc;
    }, new Set<string>()),
  );

  const escapeCell = (cell: unknown) => {
    const str = cell === null || cell === undefined ? '' : String(cell);
    if (/[\n\r",;]/.test(str)) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const lines = [
    keys.join(';'),
    ...rows.map((row) => keys.map((k) => escapeCell(row[k])).join(';')),
  ];
  return lines.join('\n');
}

function downloadText(filename: string, content: string) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

type ButtonVariant = 'default' | 'outline';
type ButtonSize = 'default' | 'sm';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

function Button({
  variant = 'default',
  size = 'default',
  className,
  type = 'button',
  ...props
}: ButtonProps) {
  const base =
    'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50';

  const variants: Record<ButtonVariant, string> = {
    default: 'bg-primary text-primary-foreground hover:bg-primary/90',
    outline:
      'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
  };

  const sizes: Record<ButtonSize, string> = {
    default: 'h-10 px-4 py-2',
    sm: 'h-9 px-3',
  };

  return (
    <button
      type={type}
      className={cx(base, variants[variant], sizes[size], className)}
      {...props}
    />
  );
}

export function VelibRealtimeStats() {
  const [data, setData] = useState<VelibRealtimeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<'overview' | 'zones' | 'explore'>(
    'overview',
  );
  const [search, setSearch] = useState('');
  const [metric, setMetric] = useState<MetricKey>('bikes_available');
  const [sortDir, setSortDir] = useState<'desc' | 'asc'>('desc');
  const [topN, setTopN] = useState<number>(15);
  const [stackBikesDocks, setStackBikesDocks] = useState(true);
  const [history, setHistory] = useState<HistoryPoint[]>([]);

  const fetchData = async () => {
    try {
      setError(null);
      const result = await api.get(API_ENDPOINTS.velibRealtime);
      setData(result);

      const t = safeDateMs(result?.updated_at);
      setHistory((prev) => {
        const last = prev[prev.length - 1];
        if (last && Math.abs(last.t - t) < 1000) return prev;
        const next: HistoryPoint[] = [
          ...prev,
          {
            t,
            bikes_available: result.totals.bikes_available,
            docks_available: result.totals.docks_available,
            mechanical_available: result.totals.mechanical_available,
            ebike_available: result.totals.ebike_available,
          },
        ];
        return next.slice(-120);
      });
    } catch (e: any) {
      setError(e?.message || 'Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const id = window.setInterval(fetchData, 30_000);
    return () => window.clearInterval(id);
  }, []);

  const filteredAreas = useMemo(() => {
    const areas = data?.by_area ?? [];
    const q = search.trim().toLowerCase();
    if (!q) return areas;
    return areas.filter((a) => a.name.toLowerCase().includes(q));
  }, [data, search]);

  const sortedAreas = useMemo(() => {
    const areas = [...filteredAreas];
    areas.sort((a, b) => {
      const av = (a as any)[metric] as number;
      const bv = (b as any)[metric] as number;
      const diff = (bv ?? 0) - (av ?? 0);
      return sortDir === 'desc' ? diff : -diff;
    });
    return areas;
  }, [filteredAreas, metric, sortDir]);

  const visibleAreas = useMemo(() => {
    if (topN <= 0) return sortedAreas;
    return sortedAreas.slice(0, topN);
  }, [sortedAreas, topN]);

  const pieData = useMemo(() => {
    const mech = data?.totals.mechanical_available ?? 0;
    const elec = data?.totals.ebike_available ?? 0;
    return [
      { name: 'Méca', key: 'mechanical_available', value: mech },
      { name: 'Élec', key: 'ebike_available', value: elec },
    ];
  }, [data]);

  const lastUpdatedLabel = useMemo(() => {
    const ms = safeDateMs(data?.updated_at);
    const seconds = Math.max(0, Math.round((Date.now() - ms) / 1000));
    if (seconds < 60) return `il y a ${seconds}s`;
    const minutes = Math.round(seconds / 60);
    if (minutes < 60) return `il y a ${minutes}min`;
    const hours = Math.round(minutes / 60);
    return `il y a ${hours}h`;
  }, [data?.updated_at]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      {/* Header with gradient */}
      <div className="bg-gradient-to-r from-cyan-600 to-blue-600 text-white px-8 pt-8 pb-12">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between max-w-7xl mx-auto">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-white/20 rounded-xl border border-white/30">
              <Bike className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold mb-2">Vélib — Temps Réel</h1>
              <p className="text-cyan-100 text-sm">Source: opendata.paris.fr • Mise à jour: {data?.updated_at ?? '—'} ({data ? lastUpdatedLabel : '—'})</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="outline"
              className="gap-2 bg-white text-cyan-600 hover:bg-cyan-50 font-semibold"
              onClick={fetchData}
              disabled={loading}
            >
              <RefreshCw
                className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`}
              />
              Actualiser
            </Button>

            <Button
              variant="outline"
              className="gap-2 bg-white text-cyan-600 hover:bg-cyan-50 font-semibold"
              onClick={() => {
                const rows = (data?.by_area ?? []).map((a) => ({
                  zone: a.name,
                  stations: a.stations,
                  capacity: a.capacity,
                  bikes_available: a.bikes_available,
                  docks_available: a.docks_available,
                  mechanical_available: a.mechanical_available,
                  ebike_available: a.ebike_available,
                }));
                downloadText(
                  `velib-realtime-zones-${new Date()
                    .toISOString()
                    .slice(0, 10)}.csv`,
                  toCsv(rows),
                );
              }}
              disabled={!data?.by_area?.length}
            >
              <Download className="w-4 h-4" />
              Export CSV
            </Button>
          </div>
        </div>
      </div>

      <div className="px-8 py-8">
        <div className="mx-auto max-w-7xl">
          {error && (
            <Card className="mb-6 border-red-300 bg-red-50 shadow-md">
              <CardContent className="pt-6 text-red-800 text-sm font-medium flex items-start gap-3">
                <span className="text-lg">⚠️</span>
                <span>{error}</span>
              </CardContent>
            </Card>
          )}

          {loading && !data && (
            <div className="text-center py-12">
              <div className="w-12 h-12 border-4 border-cyan-200 border-t-cyan-600 rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600 font-medium">Chargement des données en temps réel...</p>
            </div>
          )}

          {data && (
            <Tabs
              value={activeTab}
              onValueChange={(v: string) => setActiveTab(v as 'overview' | 'zones' | 'explore')}
            >
              <TabsList className="mb-8 bg-gray-200/50 p-1 rounded-lg">
                <TabsTrigger value="overview" className="data-[state=active]:bg-white data-[state=active]:shadow-md">
                  📊 Aperçu
                </TabsTrigger>
                <TabsTrigger value="zones" className="data-[state=active]:bg-white data-[state=active]:shadow-md">
                  🗺️ Zones
                </TabsTrigger>
                <TabsTrigger value="explore" className="data-[state=active]:bg-white data-[state=active]:shadow-md">
                  🔍 Explorer
                </TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl border border-blue-200 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-gray-700 font-semibold text-sm">Stations</p>
                      <MapPin className="w-5 h-5 text-blue-600" />
                    </div>
                    <p className="text-4xl font-bold text-blue-600">
                      {data ? formatNumber(data.totals.stations) : '—'}
                    </p>
                  </div>
                  <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl border border-green-200 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-gray-700 font-semibold text-sm">Capacité Totale</p>
                      <Zap className="w-5 h-5 text-green-600" />
                    </div>
                    <p className="text-4xl font-bold text-green-600">
                      {data ? formatNumber(data.totals.capacity) : '—'}
                    </p>
                  </div>
                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-xl border border-purple-200 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-gray-700 font-semibold text-sm">Vélos Disponibles</p>
                      <Bike className="w-5 h-5 text-purple-600" />
                    </div>
                    <p className="text-4xl font-bold text-purple-600">
                      {data ? formatNumber(data.totals.bikes_available) : '—'}
                    </p>
                  </div>
                  <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-6 rounded-xl border border-orange-200 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-gray-700 font-semibold text-sm">Emplacements Libres</p>
                      <TrendingUp className="w-5 h-5 text-orange-600" />
                    </div>
                    <p className="text-4xl font-bold text-orange-600">
                      {data ? formatNumber(data.totals.docks_available) : '—'}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Distribution des Types</h3>
                    {data && pieData.some((p) => p.value > 0) ? (
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={pieData}
                            cx="50%"
                            cy="50%"
                            innerRadius={80}
                            outerRadius={120}
                            paddingAngle={2}
                            dataKey="value"
                            nameKey="name"
                            label={{ fill: '#666', fontSize: 12 }}
                          >
                            {pieData.map((entry, index) => (
                              <Cell
                                key={`cell-${entry.key}`}
                                fill={['#0f766e', '#f59e0b'][index % 2]}
                              />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value) => `${value} vélos`} />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <p className="text-gray-500 text-center py-8">Données non disponibles</p>
                    )}
                  </div>

                  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Historique (24h)</h3>
                    {history && history.length > 0 ? (
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={history}>
                          <defs>
                            <linearGradient id="colorBikes" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                          <XAxis dataKey="t" stroke="#9ca3af" tickFormatter={(t) => new Date(t).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })} />
                          <YAxis stroke="#9ca3af" />
                          <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb' }} labelFormatter={(t) => new Date(t as number).toLocaleTimeString('fr-FR')} />
                          <Line type="monotone" dataKey="bikes_available" stroke="#3b82f6" strokeWidth={2} dot={false} />
                        </LineChart>
                      </ResponsiveContainer>
                    ) : (
                      <p className="text-gray-500 text-center py-8">Historique non disponible</p>
                    )}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="zones" className="space-y-6">
                <div className="flex flex-col md:flex-row gap-4 items-end">
                  <div className="flex-1">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Rechercher une zone</label>
                    <Input
                      placeholder="Entrez le nom d'une zone..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Métrique</label>
                    <Select value={metric} onValueChange={(v: string) => setMetric(v as MetricKey)}>
                      <SelectTrigger className="w-full md:w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bikes_available">Vélos disponibles</SelectItem>
                        <SelectItem value="docks_available">Emplacements libres</SelectItem>
                        <SelectItem value="capacity">Capacité</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="text-left py-3 px-4 font-semibold text-gray-900">Zone</th>
                          <th className="text-center py-3 px-4 font-semibold text-gray-900">Stations</th>
                          <th className="text-center py-3 px-4 font-semibold text-gray-900">Vélos</th>
                          <th className="text-center py-3 px-4 font-semibold text-gray-900">Emplacements</th>
                          <th className="text-center py-3 px-4 font-semibold text-gray-900">Utilisation</th>
                        </tr>
                      </thead>
                      <tbody>
                        {visibleAreas.map((area, idx) => {
                          const ratio =
                            area.capacity > 0 ? area.bikes_available / area.capacity : 0;
                          return (
                            <tr key={area.name} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                              <td className="py-3 px-4 text-gray-900 font-semibold">{area.name}</td>
                              <td className="py-3 px-4 text-center text-gray-700">{formatNumber(area.stations)}</td>
                              <td className="py-3 px-4 text-center text-gray-700">{formatNumber(area.bikes_available)}</td>
                              <td className="py-3 px-4 text-center text-gray-700">{formatNumber(area.docks_available)}</td>
                              <td className="py-3 px-4 text-center">
                                <span className="inline-flex items-center gap-2">
                                  <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                                    <div
                                      className="h-full bg-gradient-to-r from-green-500 to-blue-500"
                                      style={{ width: `${Math.min(ratio * 100, 100)}%` }}
                                    />
                                  </div>
                                  <span className="text-xs font-semibold text-gray-600 w-10">
                                    {formatPercent(ratio)}
                                  </span>
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="explore" className="space-y-6">
                <div className="bg-gradient-to-br from-indigo-50 to-blue-50 p-8 rounded-xl border border-indigo-200 shadow-sm">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-indigo-100 rounded-lg">
                      <Search className="w-6 h-6 text-indigo-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-indigo-900 mb-2">Explorer les Données</h3>
                      <p className="text-indigo-700 text-sm">
                        Explorez les stations Vélib'est en détail avec accès à des analyses avancées, des prévisions et des tendances. 
                        Disponible prochainement.
                      </p>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          )}
        </div>
      </div>
    </div>
  );
}
