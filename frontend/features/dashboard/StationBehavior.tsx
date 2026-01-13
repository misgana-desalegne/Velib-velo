import { useState, useMemo, memo, useEffect } from 'react';
import { Card } from '../../shared/ui/card';
import { Button } from '../../shared/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../shared/ui/select';
import { Input } from '../../shared/ui/input';
import { Search, Calendar, TrendingUp, TrendingDown } from 'lucide-react';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Badge } from '../../shared/ui/badge';
import { api } from '../../api/auth';

// Daily behavior data for a specific station
const dailyBehaviorData = [
  { hour: '00:00', bikes: 12, docks: 38, trips: 2 },
  { hour: '01:00', bikes: 14, docks: 36, trips: 1 },
  { hour: '02:00', bikes: 15, docks: 35, trips: 1 },
  { hour: '03:00', bikes: 16, docks: 34, trips: 0 },
  { hour: '04:00', bikes: 17, docks: 33, trips: 1 },
  { hour: '05:00', bikes: 18, docks: 32, trips: 3 },
  { hour: '06:00', bikes: 15, docks: 35, trips: 12 },
  { hour: '07:00', bikes: 8, docks: 42, trips: 28 },
  { hour: '08:00', bikes: 3, docks: 47, trips: 45 },
  { hour: '09:00', bikes: 5, docks: 45, trips: 35 },
  { hour: '10:00', bikes: 8, docks: 42, trips: 22 },
  { hour: '11:00', bikes: 12, docks: 38, trips: 18 },
  { hour: '12:00', bikes: 10, docks: 40, trips: 25 },
  { hour: '13:00', bikes: 14, docks: 36, trips: 20 },
  { hour: '14:00', bikes: 16, docks: 34, trips: 15 },
  { hour: '15:00', bikes: 18, docks: 32, trips: 12 },
  { hour: '16:00', bikes: 20, docks: 30, trips: 18 },
  { hour: '17:00', bikes: 25, docks: 25, trips: 32 },
  { hour: '18:00', bikes: 35, docks: 15, trips: 48 },
  { hour: '19:00', bikes: 38, docks: 12, trips: 42 },
  { hour: '20:00', bikes: 32, docks: 18, trips: 28 },
  { hour: '21:00', bikes: 28, docks: 22, trips: 18 },
  { hour: '22:00', bikes: 22, docks: 28, trips: 12 },
  { hour: '23:00', bikes: 18, docks: 32, trips: 8 },
];

const weeklyPattern = [
  { day: 'Mon', avgBikes: 22, peakBikes: 42, avgTrips: 245 },
  { day: 'Tue', avgBikes: 24, peakBikes: 45, avgTrips: 268 },
  { day: 'Wed', avgBikes: 23, peakBikes: 44, avgTrips: 256 },
  { day: 'Thu', avgBikes: 25, peakBikes: 46, avgTrips: 272 },
  { day: 'Fri', avgBikes: 28, peakBikes: 48, avgTrips: 298 },
  { day: 'Sat', avgBikes: 32, peakBikes: 45, avgTrips: 312 },
  { day: 'Sun', avgBikes: 30, peakBikes: 42, avgTrips: 285 },
];

const monthlyTrend = [
  { date: 'Dec 5', bikes: 1245, trips: 2340 },
  { date: 'Dec 12', bikes: 1389, trips: 2567 },
  { date: 'Dec 19', bikes: 1423, trips: 2689 },
  { date: 'Dec 26', bikes: 1156, trips: 2123 },
  { date: 'Jan 2', bikes: 1534, trips: 2845 },
];

const popularStations = [
  { name: 'Gare du Nord', avgDaily: 487, peakTime: '08:00-09:00', trend: 'up' },
  { name: 'Champs-Élysées', avgDaily: 456, peakTime: '18:00-19:00', trend: 'up' },
  { name: 'Bastille', avgDaily: 423, peakTime: '17:30-18:30', trend: 'down' },
  { name: 'Luxembourg', avgDaily: 398, peakTime: '12:00-14:00', trend: 'up' },
  { name: 'République', avgDaily: 376, peakTime: '08:30-09:30', trend: 'stable' },
  { name: 'Montparnasse', avgDaily: 365, peakTime: '07:45-08:45', trend: 'up' },
];

export function StationBehavior() {
  const [selectedStation, setSelectedStation] = useState('gare-du-nord');
  const [stations, setStations] = useState<any[]>([]);
  const [stationData, setStationData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Fetch stations on component mount
  useEffect(() => {
    const fetchStations = async () => {
      try {
        const response = await api.get('/stations/');
        setStations(response.data?.results || response.data || []);
      } catch (err) {
        console.error('Error fetching stations:', err);
        setError('Failed to load stations');
      }
    };
    fetchStations();
  }, []);

  // Fetch station data when selected station changes
  useEffect(() => {
    const fetchStationData = async () => {
      if (!selectedStation) return;
      
      setLoading(true);
      setError('');
      try {
        const response = await api.get(`/stations/${selectedStation}/`);
        setStationData(response.data);
      } catch (err) {
        console.error('Error fetching station data:', err);
        setError('Failed to load station data');
        // Use default data on error
      } finally {
        setLoading(false);
      }
    };
    fetchStationData();
  }, [selectedStation]);

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-3xl text-gray-900 mb-2">Daily Station Behavior</h2>
        <p className="text-gray-600">Analyze usage patterns and trends for individual stations</p>
      </div>

      {/* Filters */}
      <Card className="p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm text-gray-700 mb-2">Search Station</label>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <Input placeholder="Search by name..." className="pl-9" />
            </div>
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-2">Station</label>
            <Select value={selectedStation} onValueChange={setSelectedStation}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {stations.length > 0 ? (
                  stations.map((station: any) => (
                    <SelectItem key={station.id} value={station.station_id}>
                      {station.name}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="loading" disabled>Loading stations...</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-2">Date Range</label>
            <Select defaultValue="7days">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="7days">Last 7 Days</SelectItem>
                <SelectItem value="30days">Last 30 Days</SelectItem>
                <SelectItem value="custom">Custom Range</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end">
            <Button className="w-full">Analyze</Button>
          </div>
        </div>
      </Card>

      {/* Station Info Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card className="p-6">
          <p className="text-sm text-gray-600 mb-1">Average Daily Bikes</p>
          <p className="text-3xl text-gray-900">{stationData?.statuses?.[0]?.available_bikes || 24.5}</p>
          <div className="flex items-center gap-1 mt-2">
            <TrendingUp className="w-4 h-4 text-green-600" />
            <span className="text-sm text-green-600">+8.3%</span>
          </div>
        </Card>
        <Card className="p-6">
          <p className="text-sm text-gray-600 mb-1">Peak Usage Time</p>
          <p className="text-3xl text-gray-900">18:00</p>
          <p className="text-sm text-gray-600 mt-2">Evening rush hour</p>
        </Card>
        <Card className="p-6">
          <p className="text-sm text-gray-600 mb-1">Daily Trips</p>
          <p className="text-3xl text-gray-900">487</p>
          <div className="flex items-center gap-1 mt-2">
            <TrendingUp className="w-4 h-4 text-green-600" />
            <span className="text-sm text-green-600">+12.5%</span>
          </div>
        </Card>
        <Card className="p-6">
          <p className="text-sm text-gray-600 mb-1">Turnover Rate</p>
          <p className="text-3xl text-gray-900">9.7x</p>
          <p className="text-sm text-gray-600 mt-2">Per day</p>
        </Card>
      </div>

      {/* Main Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* 24-Hour Behavior */}
        <Card className="p-6 lg:col-span-2">
          <h3 className="text-lg text-gray-900 mb-4">24-Hour Usage Pattern</h3>
          <ResponsiveContainer width="100%" height={350}>
            <AreaChart data={dailyBehaviorData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="hour" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Legend />
              <Area yAxisId="left" type="monotone" dataKey="bikes" stackId="1" stroke="#10b981" fill="#86efac" name="Available Bikes" />
              <Area yAxisId="left" type="monotone" dataKey="docks" stackId="1" stroke="#3b82f6" fill="#93c5fd" name="Available Docks" />
              <Line yAxisId="right" type="monotone" dataKey="trips" stroke="#f59e0b" strokeWidth={2} name="Trips/Hour" />
            </AreaChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-gray-200">
            <div>
              <p className="text-sm text-gray-600">Morning Peak</p>
              <p className="text-lg text-gray-900">08:00 - 09:00</p>
              <p className="text-sm text-green-600">45 trips</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Evening Peak</p>
              <p className="text-lg text-gray-900">18:00 - 19:00</p>
              <p className="text-sm text-green-600">48 trips</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Lowest Activity</p>
              <p className="text-lg text-gray-900">03:00 - 04:00</p>
              <p className="text-sm text-gray-600">0-1 trips</p>
            </div>
          </div>
        </Card>

        {/* Weekly Pattern */}
        <Card className="p-6">
          <h3 className="text-lg text-gray-900 mb-4">Weekly Usage Pattern</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={weeklyPattern}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Legend />
              <Bar yAxisId="left" dataKey="avgBikes" fill="#3b82f6" name="Avg Bikes" />
              <Bar yAxisId="right" dataKey="avgTrips" fill="#10b981" name="Avg Trips" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Monthly Trend */}
        <Card className="p-6">
          <h3 className="text-lg text-gray-900 mb-4">Monthly Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="bikes" stroke="#3b82f6" strokeWidth={2} name="Total Bikes" />
              <Line type="monotone" dataKey="trips" stroke="#10b981" strokeWidth={2} name="Total Trips" />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Popular Stations Table */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg text-gray-900">Top Performing Stations</h3>
          <Button variant="outline" size="sm">
            <Calendar className="w-4 h-4 mr-2" />
            Export Report
          </Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm text-gray-600">Station Name</th>
                <th className="text-left py-3 px-4 text-sm text-gray-600">Avg Daily Trips</th>
                <th className="text-left py-3 px-4 text-sm text-gray-600">Peak Time</th>
                <th className="text-left py-3 px-4 text-sm text-gray-600">Trend</th>
                <th className="text-left py-3 px-4 text-sm text-gray-600">Action</th>
              </tr>
            </thead>
            <tbody>
              {popularStations.map((station, idx) => (
                <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 text-gray-900">{station.name}</td>
                  <td className="py-3 px-4 text-gray-900">{station.avgDaily}</td>
                  <td className="py-3 px-4 text-gray-700">{station.peakTime}</td>
                  <td className="py-3 px-4">
                    {station.trend === 'up' && (
                      <Badge className="bg-green-100 text-green-700">
                        <TrendingUp className="w-3 h-3 mr-1" />
                        Growing
                      </Badge>
                    )}
                    {station.trend === 'down' && (
                      <Badge className="bg-red-100 text-red-700">
                        <TrendingDown className="w-3 h-3 mr-1" />
                        Declining
                      </Badge>
                    )}
                    {station.trend === 'stable' && (
                      <Badge variant="secondary">Stable</Badge>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <Button variant="ghost" size="sm">View Details</Button>
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
