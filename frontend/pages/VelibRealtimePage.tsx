import { VeloHeader } from '../shared/components/Header';
import { VelibRealtimeStats } from '../features/dashboard/VelibRealtimeStats';

interface VelibRealtimePageProps {
  onNavigate: (page: 'landing' | 'login' | 'register' | 'dashboard' | 'farial' | 'velib') => void;
}

export function VelibRealtimePage({ onNavigate }: VelibRealtimePageProps) {
  return (
    <div className="min-h-screen bg-transparent">
      <VeloHeader onNavigate={onNavigate} isAuthenticated={false} onLogout={() => {}} />
      <VelibRealtimeStats />
    </div>
  );
}
