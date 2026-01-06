import { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { LiveDashboard } from './components/LiveDashboard';
import { StationBehavior } from './components/StationBehavior';
import { ArrondissementAnalysis } from './components/ArrondissementAnalysis';
import { MapAnalysis } from './components/MapAnalysis';

export default function App() {
  const [activeView, setActiveView] = useState('live');

  const renderView = () => {
    switch (activeView) {
      case 'live':
        return <LiveDashboard />;
      case 'behavior':
        return <StationBehavior />;
      case 'arrondissement':
        return <ArrondissementAnalysis />;
      case 'map':
        return <MapAnalysis />;
      default:
        return <LiveDashboard />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar activeView={activeView} onViewChange={setActiveView} />
      <main className="flex-1 overflow-auto">
        {renderView()}
      </main>
    </div>
  );
}
