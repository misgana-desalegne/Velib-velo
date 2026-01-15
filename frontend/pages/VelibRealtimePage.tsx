import { VeloHeader } from '../shared/components/Header';
import { VelibRealtimeStats } from '../features/dashboard/VelibRealtimeStats';
import type { AppPage } from '../shared/types/navigation';

interface VelibRealtimePageProps {
  onNavigate: (page: AppPage) => void;
}

export function VelibRealtimePage({ onNavigate }: VelibRealtimePageProps) {
  return (
    <div className="min-h-screen bg-transparent">
      <VeloHeader onNavigate={onNavigate} isAuthenticated={false} onLogout={() => {}} />
      <VelibRealtimeStats />
    </div>
  );
}
