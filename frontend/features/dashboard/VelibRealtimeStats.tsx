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
import LoadingSpinner from '../../shared/components/LoadingSpinner';
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
  const [stations, setStations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortColumn, setSortColumn] = useState<string>('bikes_available');
  const [sortDir, setSortDir] = useState<'desc' | 'asc'>('desc');

  const fetchStations = async () => {
    try {
      setError(null);
      const result = await api.get(`${API_ENDPOINTS.stations}?limit=500`);
      const stationsList = result.results || result;
      
      if (Array.isArray(stationsList)) {
        const transformed = stationsList.map((s: any) => ({
          id: s.id,
          name: s.name || s.stationcode,
          commune: s.commune_name || s.commune || 'Unknown',
          bikes: (s.mechanical || 0) + (s.ebike || 0),
          capacity: s.capacity || 0,
          bikes_available: (s.mechanical || 0) + (s.ebike || 0),
          docks_available: (s.capacity || 0) - ((s.mechanical || 0) + (s.ebike || 0)),
          mechanical: s.mechanical || 0,
          ebike: s.ebike || 0,
        }));
        setStations(transformed);
      }
    } catch (e: any) {
      setError(e?.message || 'Error loading stations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStations();
    const id = window.setInterval(fetchStations, 30_000);
    return () => window.clearInterval(id);
  }, []);

  const sortedStations = useMemo(() => {
    const sorted = [...stations];
    sorted.sort((a, b) => {
      const av = (a as any)[sortColumn] as number;
      const bv = (b as any)[sortColumn] as number;
      const diff = (bv ?? 0) - (av ?? 0);
      return sortDir === 'desc' ? diff : -diff;
    });
    return sorted.slice(0, 20); // Top 20 only
  }, [stations, sortColumn, sortDir]);

  const handleDownloadCSV = () => {
    const rows = sortedStations.map((s) => ({
      name: s.name,
      commune: s.commune,
      bikes_available: s.bikes_available,
      docks_available: s.docks_available,
      mechanical: s.mechanical,
      ebike: s.ebike,
      capacity: s.capacity,
      utilization: `${Math.round((s.bikes_available / s.capacity) * 100)}%`,
    }));
    downloadText(
      `velib-top20-stations-${new Date().toISOString().slice(0, 10)}.csv`,
      toCsv(rows),
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-cyan-600 to-blue-600 text-white px-8 pt-8 pb-12">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between max-w-7xl mx-auto">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-white/20 rounded-xl border border-white/30">
              <Bike className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold mb-2">Top 20 Stations — Temps Réel</h1>
              <p className="text-cyan-100 text-sm">Affichage des 20 meilleures stations basé sur la disponibilité des vélos</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="outline"
              className="gap-2 bg-white text-cyan-600 hover:bg-cyan-50 font-semibold"
              onClick={fetchStations}
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Actualiser
            </Button>

            <Button
              variant="outline"
              className="gap-2 bg-white text-cyan-600 hover:bg-cyan-50 font-semibold"
              onClick={handleDownloadCSV}
              disabled={!sortedStations.length}
            >
              <Download className="w-4 h-4" />
              Télécharger CSV
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

          {loading && !sortedStations.length && (
                    <div className="text-center py-12">
                      <LoadingSpinner size={56} message="Chargement des données..." />
                    </div>
          )}

          {sortedStations.length > 0 && (
            <Card className="border-0 shadow-lg overflow-hidden">
              <div className="bg-gradient-to-r from-cyan-50 to-blue-50 px-6 py-4 border-b border-cyan-200">
                <h2 className="text-xl font-bold text-gray-900">Top 20 Stations</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-100 border-b border-gray-300">
                    <tr>
                      <th className="text-left py-3 px-4 font-semibold text-gray-900 cursor-pointer hover:bg-gray-200" onClick={() => { setSortColumn('name'); setSortDir(sortDir === 'desc' ? 'asc' : 'desc'); }}>
                        📍 Station {sortColumn === 'name' && (sortDir === 'desc' ? '↓' : '↑')}
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-900">Commune</th>
                      <th className="text-center py-3 px-4 font-semibold text-gray-900 cursor-pointer hover:bg-gray-200" onClick={() => { setSortColumn('bikes_available'); setSortDir(sortDir === 'desc' ? 'asc' : 'desc'); }}>
                        🚲 Vélos {sortColumn === 'bikes_available' && (sortDir === 'desc' ? '↓' : '↑')}
                      </th>
                      <th className="text-center py-3 px-4 font-semibold text-gray-900 cursor-pointer hover:bg-gray-200" onClick={() => { setSortColumn('mechanical'); setSortDir(sortDir === 'desc' ? 'asc' : 'desc'); }}>
                        ⚙️ Méca {sortColumn === 'mechanical' && (sortDir === 'desc' ? '↓' : '↑')}
                      </th>
                      <th className="text-center py-3 px-4 font-semibold text-gray-900 cursor-pointer hover:bg-gray-200" onClick={() => { setSortColumn('ebike'); setSortDir(sortDir === 'desc' ? 'asc' : 'desc'); }}>
                        ⚡ Élec {sortColumn === 'ebike' && (sortDir === 'desc' ? '↓' : '↑')}
                      </th>
                      <th className="text-center py-3 px-4 font-semibold text-gray-900 cursor-pointer hover:bg-gray-200" onClick={() => { setSortColumn('docks_available'); setSortDir(sortDir === 'desc' ? 'asc' : 'desc'); }}>
                        📍 Places {sortColumn === 'docks_available' && (sortDir === 'desc' ? '↓' : '↑')}
                      </th>
                      <th className="text-center py-3 px-4 font-semibold text-gray-900">Capacité</th>
                      <th className="text-center py-3 px-4 font-semibold text-gray-900">Utilisation</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedStations.map((station, idx) => {
                      const utilization = station.capacity > 0 ? (station.bikes_available / station.capacity) * 100 : 0;
                      const statusColor = utilization >= 70 ? 'bg-green-50' : utilization >= 40 ? 'bg-yellow-50' : 'bg-red-50';
                      
                      return (
                        <tr key={station.id} className={`border-b border-gray-200 hover:bg-blue-50 transition ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                          <td className="py-3 px-4 text-gray-900 font-semibold">{station.name}</td>
                          <td className="py-3 px-4 text-gray-700">{station.commune}</td>
                          <td className="py-3 px-4 text-center">
                            <span className="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-bold">
                              {formatNumber(station.bikes_available)}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center text-gray-700 font-semibold">{formatNumber(station.mechanical)}</td>
                          <td className="py-3 px-4 text-center text-gray-700 font-semibold">{formatNumber(station.ebike)}</td>
                          <td className="py-3 px-4 text-center text-gray-700 font-semibold">{formatNumber(station.docks_available)}</td>
                          <td className="py-3 px-4 text-center text-gray-700 font-semibold">{formatNumber(station.capacity)}</td>
                          <td className="py-3 px-4 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                  className={`h-full ${utilization >= 70 ? 'bg-green-500' : utilization >= 40 ? 'bg-yellow-500' : 'bg-red-500'}`}
                                  style={{ width: `${Math.min(utilization, 100)}%` }}
                                />
                              </div>
                              <span className="text-xs font-bold text-gray-700 w-10">{Math.round(utilization)}%</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {!loading && sortedStations.length === 0 && !error && (
            <Card className="border-0 shadow-lg text-center py-12">
              <p className="text-gray-600 font-medium">Aucune donnée disponible</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );

}
