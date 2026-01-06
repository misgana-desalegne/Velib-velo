import { Card } from './ui/card';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Input } from './ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Badge } from './ui/badge';
import { LineChart, Line, BarChart, Bar, ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Search, Download, Filter } from 'lucide-react';

const scatterData = [
  { x: 10, y: 30 },
  { x: 30, y: 50 },
  { x: 45, y: 75 },
  { x: 60, y: 60 },
  { x: 75, y: 85 },
  { x: 90, y: 95 },
];

const correlationData = [
  { metric: 'Revenue', sales: 95, traffic: 78, conversion: 82 },
  { metric: 'Engagement', sales: 65, traffic: 88, conversion: 72 },
  { metric: 'Retention', sales: 72, traffic: 55, conversion: 90 },
  { metric: 'Growth', sales: 88, traffic: 92, conversion: 68 },
];

const tableData = [
  { id: 1, dataset: 'Customer Behavior', records: 45672, accuracy: 94.2, status: 'active' },
  { id: 2, dataset: 'Sales Predictions', records: 12890, accuracy: 87.5, status: 'active' },
  { id: 3, dataset: 'Market Trends', records: 34521, accuracy: 91.8, status: 'processing' },
  { id: 4, dataset: 'User Segmentation', records: 28934, accuracy: 89.3, status: 'active' },
  { id: 5, dataset: 'Churn Analysis', records: 19823, accuracy: 92.7, status: 'completed' },
];

export function Analytics() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h2 className="text-3xl text-gray-900 mb-2">Analytics Engine</h2>
        <p className="text-gray-600">Perform advanced data analysis and visualizations</p>
      </div>

      {/* Controls */}
      <Card className="p-6 mb-8">
        <div className="flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm text-gray-700 mb-2">Dataset</label>
            <Select defaultValue="customer">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="customer">Customer Behavior</SelectItem>
                <SelectItem value="sales">Sales Data</SelectItem>
                <SelectItem value="marketing">Marketing Metrics</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm text-gray-700 mb-2">Analysis Type</label>
            <Select defaultValue="correlation">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="correlation">Correlation Analysis</SelectItem>
                <SelectItem value="regression">Regression</SelectItem>
                <SelectItem value="clustering">Clustering</SelectItem>
                <SelectItem value="timeseries">Time Series</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm text-gray-700 mb-2">Time Period</label>
            <Select defaultValue="30days">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7days">Last 7 Days</SelectItem>
                <SelectItem value="30days">Last 30 Days</SelectItem>
                <SelectItem value="90days">Last 90 Days</SelectItem>
                <SelectItem value="1year">Last Year</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button>Run Analysis</Button>
        </div>
      </Card>

      {/* Visualizations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card className="p-6">
          <h3 className="text-lg text-gray-900 mb-4">Scatter Plot Analysis</h3>
          <ResponsiveContainer width="100%" height={300}>
            <ScatterChart>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="x" name="Variable X" />
              <YAxis dataKey="y" name="Variable Y" />
              <Tooltip cursor={{ strokeDasharray: '3 3' }} />
              <Scatter name="Data Points" data={scatterData} fill="#3b82f6" />
            </ScatterChart>
          </ResponsiveContainer>
          <div className="mt-4 flex gap-4 text-sm">
            <div>
              <span className="text-gray-600">Correlation: </span>
              <span className="text-gray-900">0.87</span>
            </div>
            <div>
              <span className="text-gray-600">R²: </span>
              <span className="text-gray-900">0.76</span>
            </div>
            <div>
              <span className="text-gray-600">P-value: </span>
              <span className="text-gray-900">0.003</span>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg text-gray-900 mb-4">Multi-Metric Correlation</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={correlationData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="metric" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="sales" fill="#3b82f6" name="Sales" />
              <Bar dataKey="traffic" fill="#f59e0b" name="Traffic" />
              <Bar dataKey="conversion" fill="#10b981" name="Conversion" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Statistical Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card className="p-6">
          <p className="text-sm text-gray-600 mb-1">Mean</p>
          <p className="text-2xl text-gray-900">56.72</p>
        </Card>
        <Card className="p-6">
          <p className="text-sm text-gray-600 mb-1">Median</p>
          <p className="text-2xl text-gray-900">54.30</p>
        </Card>
        <Card className="p-6">
          <p className="text-sm text-gray-600 mb-1">Std. Deviation</p>
          <p className="text-2xl text-gray-900">12.45</p>
        </Card>
        <Card className="p-6">
          <p className="text-sm text-gray-600 mb-1">Variance</p>
          <p className="text-2xl text-gray-900">155.00</p>
        </Card>
      </div>

      {/* Analysis Results Table */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg text-gray-900">Analysis Results</h3>
          <div className="flex gap-2">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <Input placeholder="Search..." className="pl-9 w-64" />
            </div>
            <Button variant="outline" size="sm">
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </Button>
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Dataset Name</TableHead>
              <TableHead>Records</TableHead>
              <TableHead>Accuracy</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tableData.map((row) => (
              <TableRow key={row.id}>
                <TableCell>{row.dataset}</TableCell>
                <TableCell>{row.records.toLocaleString()}</TableCell>
                <TableCell>{row.accuracy}%</TableCell>
                <TableCell>
                  <Badge
                    variant={row.status === 'active' ? 'default' : row.status === 'processing' ? 'secondary' : 'outline'}
                  >
                    {row.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Button variant="ghost" size="sm">
                    View Details
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
