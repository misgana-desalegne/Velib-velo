import { useEffect, useMemo, useState } from 'react';
import {
  ArrowDownAZ,
  ArrowDownUp,
  ArrowUpAZ,
  Bike,
  Download,
  RefreshCw,
  Search,
} from 'lucide-react';
import { api, API_ENDPOINTS } from '@/api/config';
import { Button } from '@/shared/ui/button';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/shared/ui/card';
import { Input } from '@/shared/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/tabs';
import { Progress } from '@/shared/ui/progress';
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from '@/shared/ui/chart';
import * as RechartsPrimitive from 'recharts@2.15.2';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/ui/table';

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
  return new Intl.NumberFormat('fr-FR', { style: 'percent', maximumFractionDigits: 0 }).format(
    value,
  );
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

  const lines = [keys.join(';'), ...rows.map((row) => keys.map((k) => escapeCell(row[k])).join(';'))];
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

export function VelibRealtimeStats() {
  const [data, setData] = useState<VelibRealtimeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<'overview' | 'zones' | 'explore'>('overview');
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const occupancy = useMemo(() => {
    const capacity = data?.totals.capacity ?? 0;
    const bikes = data?.totals.bikes_available ?? 0;
    const docks = data?.totals.docks_available ?? 0;
    return {
      bikesRatio: capacity > 0 ? bikes / capacity : 0,
      docksRatio: capacity > 0 ? docks / capacity : 0,
    };
  }, [data]);

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

  const chartConfig = useMemo(
    () => ({
      bikes_available: { label: 'Vélos', color: '#2563eb' },
      docks_available: { label: 'Bornes', color: '#7c3aed' },
      mechanical_available: { label: 'Méca', color: '#0f766e' },
      ebike_available: { label: 'Élec', color: '#f59e0b' },
      capacity: { label: 'Capacité', color: '#111827' },
      stations: { label: 'Stations', color: '#6b7280' },
    }),
    [],
  );

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
    <div className="p-4 md:p-8">
      <div className="mx-auto max-w-6xl">
        <Card className="border-white/10 bg-card/70 backdrop-blur-md text-red-600 [&_*]:!text-red-600">
          <CardHeader className="border-b border-white/10">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 h-11 w-11 rounded-xl bg-primary/15 flex items-center justify-center border border-white/10">
                  <Bike className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-xl md:text-2xl font-semibold tracking-tight !text-foreground">
                    Vélib — Temps réel
                  </CardTitle>
                  <CardDescription className="text-sm text-red-600">
                    Source: opendata.paris.fr • Mise à jour: {data?.updated_at ?? '—'} ({data ? lastUpdatedLabel : '—'})
                  </CardDescription>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button variant="outline" className="gap-2" onClick={fetchData} disabled={loading}>
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                  Actualiser
                </Button>

                <Button
                  variant="outline"
                  className="gap-2"
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
                    downloadText(`velib-realtime-zones-${new Date().toISOString().slice(0, 10)}.csv`, toCsv(rows));
                  }}
                  disabled={!data?.by_area?.length}
                >
                  <Download className="w-4 h-4" />
                  Export CSV
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="pt-6">
            {data?.warning && (
              <Card className="mb-6 border-amber-200/50 bg-amber-50/80">
                <CardContent className="pt-6 text-amber-900 text-sm">{data.warning}</CardContent>
              </Card>
            )}

            {error && (
              <Card className="mb-6 border-red-200/50 bg-red-50/80">
                <CardContent className="pt-6 text-red-800 text-sm">{error}</CardContent>
              </Card>
            )}

            {loading && !data ? <div className="text-muted-foreground">Chargement…</div> : null}

            {data && (
              <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
                <TabsList className="mb-6">
                  <TabsTrigger value="overview">Aperçu</TabsTrigger>
                  <TabsTrigger value="zones">Zones</TabsTrigger>
                  <TabsTrigger value="explore">Explorer</TabsTrigger>
                </TabsList>

                <TabsContent value="overview">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <Card className="bg-card/60 backdrop-blur">
                      <CardHeader className="pb-2">
                        <CardDescription>Stations (installées)</CardDescription>
                        <CardTitle className="text-2xl">{formatNumber(data.totals.stations)}</CardTitle>
                      </CardHeader>
                      <CardContent className="pb-6">
                        <div className="text-xs text-muted-foreground">Zones: {formatNumber(data.by_area.length)}</div>
                      </CardContent>
                    </Card>

                    <Card className="bg-card/60 backdrop-blur">
                      <CardHeader className="pb-2">
                        <CardDescription>Capacité totale</CardDescription>
                        <CardTitle className="text-2xl">{formatNumber(data.totals.capacity)}</CardTitle>
                      </CardHeader>
                      <CardContent className="pb-6">
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>Vélos</span>
                          <span>{formatPercent(occupancy.bikesRatio)}</span>
                        </div>
                        <Progress value={Math.round(occupancy.bikesRatio * 100)} className="mt-2" />
                      </CardContent>
                    </Card>

                    <Card className="bg-card/60 backdrop-blur">
                      <CardHeader className="pb-2">
                        <CardDescription>Vélos disponibles</CardDescription>
                        <CardTitle className="text-2xl">{formatNumber(data.totals.bikes_available)}</CardTitle>
                      </CardHeader>
                      <CardContent className="pb-6">
                        <div className="text-xs text-muted-foreground">
                          Méca: {formatNumber(data.totals.mechanical_available)} • Élec: {formatNumber(data.totals.ebike_available)}
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-card/60 backdrop-blur">
                      <CardHeader className="pb-2">
                        <CardDescription>Bornes libres</CardDescription>
                        <CardTitle className="text-2xl">{formatNumber(data.totals.docks_available)}</CardTitle>
                      </CardHeader>
                      <CardContent className="pb-6">
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>Bornes</span>
                          <span>{formatPercent(occupancy.docksRatio)}</span>
                        </div>
                        <Progress value={Math.round(occupancy.docksRatio * 100)} className="mt-2" />
                      </CardContent>
                    </Card>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <Card className="lg:col-span-2 bg-card/60 backdrop-blur">
                      <CardHeader className="border-b border-white/10">
                        <CardTitle className="text-base">Top zones</CardTitle>
                        <CardDescription>Classement par vélos disponibles (bikes_available).</CardDescription>
                        <CardAction className="flex items-center gap-2">
                          <Button
                            variant={stackBikesDocks ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setStackBikesDocks((v) => !v)}
                          >
                            {stackBikesDocks ? 'Bikes+Bornes' : 'Bikes seul'}
                          </Button>
                        </CardAction>
                      </CardHeader>
                      <CardContent className="pt-6">
                        <ChartContainer
                          className="aspect-[16/7]"
                          config={{
                            bikes_available: chartConfig.bikes_available,
                            docks_available: chartConfig.docks_available,
                          }}
                        >
                          <RechartsPrimitive.BarChart data={visibleAreas} margin={{ left: 10, right: 10 }}>
                            <RechartsPrimitive.CartesianGrid vertical={false} />
                            <RechartsPrimitive.XAxis
                              dataKey="name"
                              tickLine={false}
                              axisLine={false}
                              interval={0}
                              angle={-18}
                              textAnchor="end"
                              height={60}
                              tickFormatter={(v: string) => (v.length > 16 ? `${v.slice(0, 16)}…` : v)}
                            />
                            <RechartsPrimitive.YAxis tickLine={false} axisLine={false} />
                            <ChartTooltip content={<ChartTooltipContent />} />
                            <ChartLegend content={<ChartLegendContent />} />
                            <RechartsPrimitive.Bar
                              dataKey="bikes_available"
                              fill="var(--color-bikes_available)"
                              radius={[6, 6, 0, 0]}
                              maxBarSize={42}
                            />
                            {stackBikesDocks && (
                              <RechartsPrimitive.Bar
                                dataKey="docks_available"
                                fill="var(--color-docks_available)"
                                radius={[6, 6, 0, 0]}
                                maxBarSize={42}
                              />
                            )}
                          </RechartsPrimitive.BarChart>
                        </ChartContainer>
                      </CardContent>
                    </Card>

                    <Card className="bg-card/60 backdrop-blur">
                      <CardHeader className="border-b border-white/10">
                        <CardTitle className="text-base">Répartition</CardTitle>
                        <CardDescription>Mécanique vs Électrique</CardDescription>
                      </CardHeader>
                      <CardContent className="pt-6">
                        <ChartContainer
                          className="aspect-square"
                          config={{
                            mechanical_available: chartConfig.mechanical_available,
                            ebike_available: chartConfig.ebike_available,
                          }}
                        >
                          <RechartsPrimitive.PieChart>
                            <ChartTooltip
                              content={
                                <ChartTooltipContent
                                  formatter={(value, name) => (
                                    <div className="flex flex-1 justify-between gap-8">
                                      <span className="text-muted-foreground">{name}</span>
                                      <span className="font-mono tabular-nums">{formatNumber(Number(value) || 0)}</span>
                                    </div>
                                  )}
                                />
                              }
                            />
                            <RechartsPrimitive.Pie
                              data={pieData}
                              dataKey="value"
                              nameKey="name"
                              innerRadius={55}
                              outerRadius={85}
                              paddingAngle={2}
                            >
                              {pieData.map((entry) => (
                                <RechartsPrimitive.Cell
                                  key={entry.key}
                                  fill={`var(--color-${entry.key})`}
                                />
                              ))}
                            </RechartsPrimitive.Pie>
                            <RechartsPrimitive.Legend />
                          </RechartsPrimitive.PieChart>
                        </ChartContainer>

                        <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                          <div className="rounded-lg border border-white/10 bg-background/40 p-3">
                            <div className="text-muted-foreground text-xs">Méca</div>
                            <div className="font-semibold">{formatNumber(data.totals.mechanical_available)}</div>
                          </div>
                          <div className="rounded-lg border border-white/10 bg-background/40 p-3">
                            <div className="text-muted-foreground text-xs">Élec</div>
                            <div className="font-semibold">{formatNumber(data.totals.ebike_available)}</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <Card className="mt-4 bg-card/60 backdrop-blur">
                    <CardHeader className="border-b border-white/10">
                      <CardTitle className="text-base">Tendance (auto-refresh)</CardTitle>
                      <CardDescription>Historique local depuis l’ouverture de la page.</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6">
                      <ChartContainer
                        className="aspect-[16/6]"
                        config={{
                          bikes_available: chartConfig.bikes_available,
                          docks_available: chartConfig.docks_available,
                        }}
                      >
                        <RechartsPrimitive.LineChart data={history} margin={{ left: 10, right: 10 }}>
                          <RechartsPrimitive.CartesianGrid vertical={false} />
                          <RechartsPrimitive.XAxis
                            dataKey="t"
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(v: number) =>
                              new Date(v).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
                            }
                          />
                          <RechartsPrimitive.YAxis tickLine={false} axisLine={false} />
                          <ChartTooltip
                            content={
                              <ChartTooltipContent
                                labelFormatter={(label) =>
                                  new Date(Number(label)).toLocaleTimeString('fr-FR', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                    second: '2-digit',
                                  })
                                }
                              />
                            }
                          />
                          <ChartLegend content={<ChartLegendContent />} />
                          <RechartsPrimitive.Line
                            type="monotone"
                            dataKey="bikes_available"
                            stroke="var(--color-bikes_available)"
                            strokeWidth={2}
                            dot={false}
                          />
                          <RechartsPrimitive.Line
                            type="monotone"
                            dataKey="docks_available"
                            stroke="var(--color-docks_available)"
                            strokeWidth={2}
                            dot={false}
                          />
                        </RechartsPrimitive.LineChart>
                      </ChartContainer>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="zones">
                  <Card className="bg-card/60 backdrop-blur">
                    <CardHeader className="border-b border-white/10">
                      <CardTitle className="text-base">Top zones (table)</CardTitle>
                      <CardDescription>Vue tabulaire rapide et lisible.</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Zone</TableHead>
                            <TableHead>Stations</TableHead>
                            <TableHead>Vélos</TableHead>
                            <TableHead>Bornes</TableHead>
                            <TableHead>Méca</TableHead>
                            <TableHead>Élec</TableHead>
                            <TableHead>Capacité</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {visibleAreas.map((a) => (
                            <TableRow key={a.name}>
                              <TableCell className="font-medium">{a.name}</TableCell>
                              <TableCell>{formatNumber(a.stations)}</TableCell>
                              <TableCell>{formatNumber(a.bikes_available)}</TableCell>
                              <TableCell>{formatNumber(a.docks_available)}</TableCell>
                              <TableCell>{formatNumber(a.mechanical_available)}</TableCell>
                              <TableCell>{formatNumber(a.ebike_available)}</TableCell>
                              <TableCell>{formatNumber(a.capacity)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="explore">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <Card className="lg:col-span-1 bg-card/60 backdrop-blur">
                      <CardHeader className="border-b border-white/10">
                        <CardTitle className="text-base">Contrôles</CardTitle>
                        <CardDescription>Filtrer / trier / explorer les zones.</CardDescription>
                      </CardHeader>
                      <CardContent className="pt-6 space-y-4">
                        <div className="space-y-2">
                          <div className="text-sm font-medium">Recherche</div>
                          <div className="relative">
                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                              value={search}
                              onChange={(e) => setSearch(e.target.value)}
                              placeholder="Paris, Boulogne…"
                              className="pl-9"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-2">
                            <div className="text-sm font-medium">Métrique</div>
                            <Select value={metric} onValueChange={(v) => setMetric(v as MetricKey)}>
                              <SelectTrigger>
                                <SelectValue placeholder="Choisir" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="bikes_available">Vélos</SelectItem>
                                <SelectItem value="docks_available">Bornes</SelectItem>
                                <SelectItem value="mechanical_available">Méca</SelectItem>
                                <SelectItem value="ebike_available">Élec</SelectItem>
                                <SelectItem value="capacity">Capacité</SelectItem>
                                <SelectItem value="stations">Stations</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <div className="text-sm font-medium">Top N</div>
                            <Select
                              value={String(topN)}
                              onValueChange={(v) => setTopN(Number(v))}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="10">10</SelectItem>
                                <SelectItem value="15">15</SelectItem>
                                <SelectItem value="25">25</SelectItem>
                                <SelectItem value="50">50</SelectItem>
                                <SelectItem value="0">Tout</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            className="gap-2"
                            onClick={() => setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'))}
                          >
                            <ArrowDownUp className="h-4 w-4" />
                            {sortDir === 'desc' ? (
                              <span className="inline-flex items-center gap-1">
                                <ArrowDownAZ className="h-4 w-4" /> Desc
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1">
                                <ArrowUpAZ className="h-4 w-4" /> Asc
                              </span>
                            )}
                          </Button>
                          <Button variant="outline" onClick={() => setSearch('')} disabled={!search}>
                            Reset
                          </Button>
                        </div>

                        <div className="text-xs text-muted-foreground">
                          Résultats: {formatNumber(sortedAreas.length)} zone(s)
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="lg:col-span-2 bg-card/60 backdrop-blur">
                      <CardHeader className="border-b border-white/10">
                        <CardTitle className="text-base">Graphique exploratoire</CardTitle>
                        <CardDescription>
                          Classement par « {metric.replaceAll('_', ' ')} » sur la sélection.
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="pt-6">
                        <ChartContainer
                          className="aspect-[16/7]"
                          config={{ [metric]: chartConfig[metric] }}
                        >
                          <RechartsPrimitive.BarChart data={visibleAreas} margin={{ left: 10, right: 10 }}>
                            <RechartsPrimitive.CartesianGrid vertical={false} />
                            <RechartsPrimitive.XAxis
                              dataKey="name"
                              tickLine={false}
                              axisLine={false}
                              interval={0}
                              angle={-18}
                              textAnchor="end"
                              height={60}
                              tickFormatter={(v: string) => (v.length > 16 ? `${v.slice(0, 16)}…` : v)}
                            />
                            <RechartsPrimitive.YAxis tickLine={false} axisLine={false} />
                            <ChartTooltip content={<ChartTooltipContent />} />
                            <RechartsPrimitive.Bar
                              dataKey={metric}
                              fill={`var(--color-${metric})`}
                              radius={[6, 6, 0, 0]}
                              maxBarSize={42}
                            />
                          </RechartsPrimitive.BarChart>
                        </ChartContainer>

                        <div className="mt-6">
                          <div className="text-sm font-medium mb-2">Table (tri + filtre)</div>
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Zone</TableHead>
                                <TableHead>Stations</TableHead>
                                <TableHead>Vélos</TableHead>
                                <TableHead>Bornes</TableHead>
                                <TableHead>Méca</TableHead>
                                <TableHead>Élec</TableHead>
                                <TableHead>Capacité</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {visibleAreas.map((a) => (
                                <TableRow key={a.name}>
                                  <TableCell className="font-medium">{a.name}</TableCell>
                                  <TableCell>{formatNumber(a.stations)}</TableCell>
                                  <TableCell>{formatNumber(a.bikes_available)}</TableCell>
                                  <TableCell>{formatNumber(a.docks_available)}</TableCell>
                                  <TableCell>{formatNumber(a.mechanical_available)}</TableCell>
                                  <TableCell>{formatNumber(a.ebike_available)}</TableCell>
                                  <TableCell>{formatNumber(a.capacity)}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
              </Tabs>
            )}
          </CardContent>
        </Card>
      </div>

    </div>
  );
}
