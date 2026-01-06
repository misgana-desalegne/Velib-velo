import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { FileText, Download, Eye, Calendar, TrendingUp } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const reports = [
  {
    id: 1,
    title: 'Monthly Sales Analysis',
    description: 'Comprehensive breakdown of sales metrics for January 2026',
    type: 'Sales',
    date: 'Jan 5, 2026',
    size: '2.4 MB',
    format: 'PDF',
  },
  {
    id: 2,
    title: 'Customer Segmentation Report',
    description: 'Detailed customer behavior and segmentation insights',
    type: 'Marketing',
    date: 'Jan 4, 2026',
    size: '1.8 MB',
    format: 'Excel',
  },
  {
    id: 3,
    title: 'Quarterly Performance Dashboard',
    description: 'Q4 2025 performance metrics and KPI tracking',
    type: 'Performance',
    date: 'Jan 2, 2026',
    size: '3.1 MB',
    format: 'PDF',
  },
  {
    id: 4,
    title: 'Data Quality Assessment',
    description: 'Analysis of data integrity and quality metrics',
    type: 'Quality',
    date: 'Dec 30, 2025',
    size: '1.2 MB',
    format: 'PDF',
  },
  {
    id: 5,
    title: 'Predictive Analytics Summary',
    description: 'Machine learning model performance and predictions',
    type: 'Analytics',
    date: 'Dec 28, 2025',
    size: '2.9 MB',
    format: 'PDF',
  },
];

const recentData = [
  { date: 'Dec 25', reports: 12 },
  { date: 'Dec 27', reports: 18 },
  { date: 'Dec 29', reports: 15 },
  { date: 'Dec 31', reports: 22 },
  { date: 'Jan 2', reports: 28 },
  { date: 'Jan 4', reports: 24 },
];

export function Reports() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h2 className="text-3xl text-gray-900 mb-2">Reports</h2>
        <p className="text-gray-600">Generate and manage your data analysis reports</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card className="p-6">
          <div className="flex items-center gap-3">
            <FileText className="w-8 h-8 text-blue-600" />
            <div>
              <p className="text-sm text-gray-600">Total Reports</p>
              <p className="text-2xl text-gray-900">142</p>
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center gap-3">
            <Calendar className="w-8 h-8 text-green-600" />
            <div>
              <p className="text-sm text-gray-600">This Month</p>
              <p className="text-2xl text-gray-900">24</p>
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center gap-3">
            <TrendingUp className="w-8 h-8 text-purple-600" />
            <div>
              <p className="text-sm text-gray-600">Growth</p>
              <p className="text-2xl text-gray-900">+18%</p>
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center gap-3">
            <Download className="w-8 h-8 text-orange-600" />
            <div>
              <p className="text-sm text-gray-600">Downloads</p>
              <p className="text-2xl text-gray-900">856</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Report Generation Trend */}
      <Card className="p-6 mb-8">
        <h3 className="text-lg text-gray-900 mb-4">Report Generation Trend</h3>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={recentData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="reports" stroke="#3b82f6" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-4 mb-6">
        <Button>
          <FileText className="w-4 h-4 mr-2" />
          Generate New Report
        </Button>
        <Button variant="outline">
          Schedule Report
        </Button>
        <Button variant="outline">
          Export All
        </Button>
      </div>

      {/* Reports List */}
      <div className="grid gap-4">
        {reports.map((report) => (
          <Card key={report.id} className="p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div className="flex gap-4 flex-1">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <FileText className="w-6 h-6 text-blue-600" />
                </div>
                <div className="flex-1">
                  <div className="flex items-start gap-3 mb-2">
                    <h3 className="text-lg text-gray-900">{report.title}</h3>
                    <Badge variant="secondary">{report.type}</Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{report.description}</p>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {report.date}
                    </span>
                    <span>{report.size}</span>
                    <span>{report.format}</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2 ml-4">
                <Button variant="outline" size="sm">
                  <Eye className="w-4 h-4 mr-2" />
                  View
                </Button>
                <Button variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
