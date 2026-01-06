import { Activity, TrendingUp, Building2, Map, Bike } from 'lucide-react';
import { Button } from './ui/button';

interface SidebarProps {
  activeView: string;
  onViewChange: (view: string) => void;
}

export function Sidebar({ activeView, onViewChange }: SidebarProps) {
  const menuItems = [
    { id: 'live', label: 'Live Analysis', icon: Activity },
    { id: 'behavior', label: 'Station Behavior', icon: TrendingUp },
    { id: 'arrondissement', label: 'By Arrondissement', icon: Building2 },
    { id: 'map', label: 'Map View', icon: Map },
  ];

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <Bike className="w-8 h-8 text-blue-600" />
          <div>
            <h1 className="text-xl text-gray-900">VéloStation</h1>
            <p className="text-sm text-gray-500">France Network</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.id}>
                <Button
                  variant={activeView === item.id ? 'secondary' : 'ghost'}
                  className="w-full justify-start"
                  onClick={() => onViewChange(item.id)}
                >
                  <Icon className="w-5 h-5 mr-3" />
                  {item.label}
                </Button>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="p-4 border-t border-gray-200">
        <div className="bg-green-50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <p className="text-sm text-green-900">Live Connection</p>
          </div>
          <p className="text-xs text-green-700">1,500 Stations Active</p>
          <p className="text-xs text-green-700 mt-1">Updated: Just now</p>
        </div>
      </div>
    </aside>
  );
}
