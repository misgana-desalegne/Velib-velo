import { Activity, TrendingUp, Building2, Map, Bike, LogOut } from 'lucide-react';
import { Button } from './ui/button';

interface HeaderProps {
  activeView: string;
  onViewChange: (view: string) => void;
  onLogout?: () => void;
}

export function Header({ activeView, onViewChange, onLogout }: HeaderProps) {
  const menuItems = [
    { id: 'live', label: 'Analyse en Direct', icon: Activity },
    { id: 'behavior', label: 'Comportement des Stations', icon: TrendingUp },
    { id: 'arrondissement', label: 'Par Arrondissement', icon: Building2 },
    { id: 'map', label: 'Vue Cartographique', icon: Map },
  ];

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <div className="flex items-center justify-between px-4 py-2">
        {/* Logo and Title */}
        <div className="flex items-center gap-2">
          <Bike className="w-6 h-6" style={{color: '#2F80ED'}} />
          <div>
            <h1 className="text-lg font-bold" style={{color: '#2F80ED'}}>ParisCycle</h1>
            <p className="text-xs text-gray-500 hidden sm:block">Tableau de Bord d'Analyse</p>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex items-center gap-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <Button
                key={item.id}
                variant={activeView === item.id ? 'default' : 'ghost'}
                size="sm"
                className="gap-2"
                style={activeView === item.id ? {backgroundColor: '#2F80ED', color: 'white'} : {}}
                onClick={() => onViewChange(item.id)}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{item.label}</span>
              </Button>
            );
          })}
        </nav>

        {/* Status Indicator and Logout */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-sm text-gray-600 hidden md:inline">En Direct</span>
          </div>
          
          {onLogout && (
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              style={{borderColor: '#2F80ED', color: '#2F80ED'}}
              onClick={onLogout}
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Déconnexion</span>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
