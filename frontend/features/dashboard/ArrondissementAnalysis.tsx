import { useState, useMemo, memo } from 'react';
import { Card } from '../../shared/ui/card';
import { Button } from '../../shared/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../shared/ui/select';
import { Badge } from '../../shared/ui/badge';
import { Building2, Bike, TrendingUp, Users, MapPin } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from 'recharts';

const arrondissementData = [
  { arr: '1er', stations: 45, bikes: 456, docks: 344, trips: 3421, utilization: 57, population: 16888 },
  { arr: '2e', stations: 38, bikes: 378, docks: 422, trips: 2876, utilization: 47, population: 21510 },
  { arr: '3e', stations: 52, bikes: 512, docks: 288, trips: 4234, utilization: 64, population: 34248 },
  { arr: '4e', stations: 48, bikes: 445, docks: 355, trips: 3789, utilization: 56, population: 27887 },
  { arr: '5e', stations: 55, bikes: 523, docks: 277, trips: 4567, utilization: 65, population: 58850 },
  { arr: '6e', stations: 50, bikes: 489, docks: 311, trips: 4123, utilization: 61, population: 41100 },
  { arr: '7e', stations: 58, bikes: 567, docks: 433, trips: 4789, utilization: 57, population: 51400 },
  { arr: '8e', stations: 62, bikes: 612, docks: 388, trips: 5234, utilization: 61, population: 37380 },
  { arr: '9e', stations: 54, bikes: 534, docks: 366, trips: 4456, utilization: 59, population: 59555 },
  { arr: '10e', stations: 68, bikes: 678, docks: 422, trips: 5678, utilization: 62, population: 83459 },
  { arr: '11e', stations: 72, bikes: 712, docks: 388, trips: 6123, utilization: 65, population: 144292 },
  { arr: '12e', stations: 65, bikes: 645, docks: 455, trips: 5456, utilization: 59, population: 139801 },
];

const comparisonData = [
  { metric: 'Bikes/Station', '1er': 10.1, '8e': 9.9, '11e': 9.9, '10e': 10.0 },
  { metric: 'Daily Trips', '1er': 76, '8e': 84, '11e': 85, '10e': 84 },
  { metric: 'Utilization %', '1er': 57, '8e': 61, '11e': 65, '10e': 62 },
  { metric: 'Peak Usage', '1er': 82, '8e': 88, '11e': 92, '10e': 89 },
];

const radarData = [
  { metric: 'Station Density', value: 75 },
  { metric: 'Bike Availability', value: 68 },
  { metric: 'Usage Rate', value: 82 },
  { metric: 'Turnover', value: 71 },
  { metric: 'Coverage', value: 79 },
  { metric: 'Satisfaction', value: 85 },
];

const timeDistribution = [
  { time: 'Morning (6-9)', value: 28, fill: '#3b82f6' },
  { time: 'Midday (9-17)', value: 35, fill: '#10b981' },
  { time: 'Evening (17-21)', value: 30, fill: '#f59e0b' },
  { time: 'Night (21-6)', value: 7, fill: '#6b7280' },
];

export function ArrondissementAnalysis() {
  const [selectedArr, setSelectedArr] = useState('all');

  const topArrondissements = arrondissementData
    .sort((a, b) => b.utilization - a.utilization)
    .slice(0, 5);

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-3xl text-gray-900 mb-2">Analysis by Arrondissement</h2>
        <p className="text-gray-600">Compare station performance across Paris arrondissements</p>
      </div>

      {/* Filter */}
      <Card className="p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div>
            <label className="block text-sm text-gray-700 mb-2">Select Arrondissement</label>
            <Select value={selectedArr} onValueChange={setSelectedArr}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Arrondissements</SelectItem>
                <SelectItem value="1">1er Arrondissement</SelectItem>
                <SelectItem value="2">2e Arrondissement</SelectItem>
                <SelectItem value="3">3e Arrondissement</SelectItem>
                <SelectItem value="8">8e Arrondissement</SelectItem>
                <SelectItem value="11">11e Arrondissement</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-2">Time Period</label>
            <Select defaultValue="week">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-2">Metric</label>
            <Select defaultValue="utilization">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="utilization">Utilization</SelectItem>
                <SelectItem value="trips">Total Trips</SelectItem>
                <SelectItem value="availability">Availability</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button>Apply Filters</Button>
        </div>
      </Card>

      {/* Top Performers */}
      <div className="mb-8">
        <h3 className="text-lg text-gray-900 mb-4">Top 5 Arrondissements by Utilization</h3>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {topArrondissements.map((arr, idx) => (
            <Card key={arr.arr} className="p-6 relative overflow-hidden">
              <div className="absolute top-2 right-2">
                <Badge variant="secondary">#{idx + 1}</Badge>
              </div>
              <Building2 className="w-8 h-8 text-blue-600 mb-3" />
              <p className="text-2xl text-gray-900 mb-1">{arr.arr}</p>
              <p className="text-sm text-gray-600 mb-3">{arr.stations} stations</p>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Utilization</span>
                  <span className="text-gray-900">{arr.utilization}%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Daily trips</span>
                  <span className="text-gray-900">{arr.trips.toLocaleString()}</span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Main Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Utilization by Arrondissement */}
        <Card className="p-6">
          <h3 className="text-lg text-gray-900 mb-4">Utilization Rate Comparison</h3>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={arrondissementData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="arr" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="utilization" fill="#3b82f6" name="Utilization %" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Trips by Arrondissement */}
        <Card className="p-6">
          <h3 className="text-lg text-gray-900 mb-4">Daily Trips Distribution</h3>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={arrondissementData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="arr" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="trips" fill="#10b981" name="Daily Trips" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Performance Radar */}
        <Card className="p-6">
          <h3 className="text-lg text-gray-900 mb-4">Performance Metrics (Selected Area)</h3>
          <ResponsiveContainer width="100%" height={350}>
            <RadarChart data={radarData}>
              <PolarGrid />
              <PolarAngleAxis dataKey="metric" />
              <PolarRadiusAxis angle={90} domain={[0, 100]} />
              <Radar name="Performance" dataKey="value" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} />
              <Tooltip />
            </RadarChart>
          </ResponsiveContainer>
        </Card>

        {/* Time Distribution */}
        <Card className="p-6">
          <h3 className="text-lg text-gray-900 mb-4">Usage by Time of Day</h3>
          <ResponsiveContainer width="100%" height={350}>
            <PieChart>
              <Pie
                data={timeDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ time, value }) => `${time}: ${value}%`}
                outerRadius={120}
                dataKey="value"
              >
                {timeDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Detailed Comparison */}
      <Card className="p-6 mb-8">
        <h3 className="text-lg text-gray-900 mb-4">Multi-Metric Comparison</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={comparisonData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="metric" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="1er" fill="#3b82f6" name="1er" />
            <Bar dataKey="8e" fill="#10b981" name="8e" />
            <Bar dataKey="11e" fill="#f59e0b" name="11e" />
            <Bar dataKey="10e" fill="#8b5cf6" name="10e" />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* Detailed Table */}
      <Card className="p-6">
        <h3 className="text-lg text-gray-900 mb-4">Complete Arrondissement Overview</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm text-gray-600">Arrondissement</th>
                <th className="text-right py-3 px-4 text-sm text-gray-600">Stations</th>
                <th className="text-right py-3 px-4 text-sm text-gray-600">Bikes</th>
                <th className="text-right py-3 px-4 text-sm text-gray-600">Docks</th>
                <th className="text-right py-3 px-4 text-sm text-gray-600">Daily Trips</th>
                <th className="text-right py-3 px-4 text-sm text-gray-600">Utilization</th>
                <th className="text-right py-3 px-4 text-sm text-gray-600">Population</th>
                <th className="text-right py-3 px-4 text-sm text-gray-600">Bikes/1000 ppl</th>
              </tr>
            </thead>
            <tbody>
              {arrondissementData.map((arr) => (
                <tr key={arr.arr} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-900">{arr.arr}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-right text-gray-900">{arr.stations}</td>
                  <td className="py-3 px-4 text-right text-gray-900">{arr.bikes}</td>
                  <td className="py-3 px-4 text-right text-gray-900">{arr.docks}</td>
                  <td className="py-3 px-4 text-right text-gray-900">{arr.trips.toLocaleString()}</td>
                  <td className="py-3 px-4 text-right">
                    <Badge variant={arr.utilization > 60 ? 'default' : 'secondary'}>
                      {arr.utilization}%
                    </Badge>
                  </td>
                  <td className="py-3 px-4 text-right text-gray-700">{arr.population.toLocaleString()}</td>
                  <td className="py-3 px-4 text-right text-gray-700">
                    {((arr.bikes / arr.population) * 1000).toFixed(1)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
