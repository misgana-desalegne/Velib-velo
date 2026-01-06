import { Card } from './ui/card';
import { Users, TrendingUp, Database, Activity } from 'lucide-react';
import { AreaChart, Area, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const statsData = [
  { label: 'Total Records', value: '1,234,567', change: '+12.5%', icon: Database, color: 'blue' },
  { label: 'Active Users', value: '8,432', change: '+5.2%', icon: Users, color: 'green' },
  { label: 'Processing Rate', value: '94.2%', change: '+2.1%', icon: Activity, color: 'purple' },
  { label: 'Data Growth', value: '23.8%', change: '+8.3%', icon: TrendingUp, color: 'orange' },
];

const lineData = [
  { month: 'Jan', value: 4000 },
  { month: 'Feb', value: 3000 },
  { month: 'Mar', value: 5000 },
  { month: 'Apr', value: 4500 },
  { month: 'May', value: 6000 },
  { month: 'Jun', value: 5500 },
  { month: 'Jul', value: 7000 },
];

const barData = [
  { category: 'Category A', count: 245 },
  { category: 'Category B', count: 189 },
  { category: 'Category C', count: 312 },
  { category: 'Category D', count: 156 },
  { category: 'Category E', count: 289 },
];

const pieData = [
  { name: 'Processed', value: 65 },
  { name: 'Pending', value: 20 },
  { name: 'Failed', value: 10 },
  { name: 'Archived', value: 5 },
];

const COLORS = ['#3b82f6', '#f59e0b', '#ef4444', '#6b7280'];

const recentActivity = [
  { id: 1, action: 'Data Upload Completed', dataset: 'sales_2024.csv', time: '2 minutes ago' },
  { id: 2, action: 'Analysis Generated', dataset: 'customer_behavior', time: '15 minutes ago' },
  { id: 3, action: 'Report Exported', dataset: 'quarterly_summary', time: '1 hour ago' },
  { id: 4, action: 'Model Training Started', dataset: 'prediction_model_v2', time: '2 hours ago' },
];

export function Dashboard() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h2 className="text-3xl text-gray-900 mb-2">Dashboard Overview</h2>
        <p className="text-gray-600">Monitor your data analysis metrics and insights</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statsData.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
                  <p className="text-2xl text-gray-900">{stat.value}</p>
                  <p className="text-sm text-green-600 mt-2">{stat.change}</p>
                </div>
                <div className={`p-3 rounded-lg bg-${stat.color}-100`}>
                  <Icon className={`w-6 h-6 text-${stat.color}-600`} />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Line Chart */}
        <Card className="p-6">
          <h3 className="text-lg text-gray-900 mb-4">Data Trends</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={lineData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Area type="monotone" dataKey="value" stroke="#3b82f6" fill="#93c5fd" />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        {/* Bar Chart */}
        <Card className="p-6">
          <h3 className="text-lg text-gray-900 mb-4">Category Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={barData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="category" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pie Chart */}
        <Card className="p-6">
          <h3 className="text-lg text-gray-900 mb-4">Status Overview</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        {/* Recent Activity */}
        <Card className="p-6 lg:col-span-2">
          <h3 className="text-lg text-gray-900 mb-4">Recent Activity</h3>
          <div className="space-y-4">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-start gap-4 pb-4 border-b border-gray-100 last:border-0">
                <div className="w-2 h-2 bg-blue-600 rounded-full mt-2" />
                <div className="flex-1">
                  <p className="text-gray-900">{activity.action}</p>
                  <p className="text-sm text-gray-600">{activity.dataset}</p>
                </div>
                <span className="text-sm text-gray-500">{activity.time}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
