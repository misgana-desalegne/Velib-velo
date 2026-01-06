import { useState, lazy, Suspense, memo } from 'react';
import { Header } from './components/Header';
import { LandingPage } from './components/LandingPage';
import { LoginPage } from './components/LoginPage';
import { RegisterPage } from './components/RegisterPage';

// Lazy load dashboard components for better performance
const LiveDashboard = lazy(() => import('./components/LiveDashboard').then(m => ({ default: m.LiveDashboard })));
const StationBehavior = lazy(() => import('./components/StationBehavior').then(m => ({ default: m.StationBehavior })));
const ArrondissementAnalysis = lazy(() => import('./components/ArrondissementAnalysis').then(m => ({ default: m.ArrondissementAnalysis })));
const MapAnalysis = lazy(() => import('./components/MapAnalysis').then(m => ({ default: m.MapAnalysis })));

// Loading fallback component
const LoadingFallback = memo(() => (
  <div className="flex items-center justify-center h-full">
    <div className="text-center">
      <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
      <p className="text-gray-600">Chargement...</p>
    </div>
  </div>
));

LoadingFallback.displayName = 'LoadingFallback';

export default function App() {
  const [currentPage, setCurrentPage] = useState<'landing' | 'login' | 'register' | 'dashboard'>('landing');
  const [activeView, setActiveView] = useState('live');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const handleLogin = () => {
    setIsAuthenticated(true);
    setCurrentPage('dashboard');
  };

  const handleRegister = () => {
    setIsAuthenticated(true);
    setCurrentPage('dashboard');
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentPage('landing');
  };

  // Render landing, login, or register pages
  if (!isAuthenticated) {
    if (currentPage === 'login') {
      return <LoginPage onNavigate={setCurrentPage} onLogin={handleLogin} />;
    }
    if (currentPage === 'register') {
      return <RegisterPage onNavigate={setCurrentPage} onRegister={handleRegister} />;
    }
    return <LandingPage onNavigate={setCurrentPage} />;
  }

  // Render dashboard after authentication
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
    <div className="flex flex-col h-screen bg-gray-50">
      <Header activeView={activeView} onViewChange={setActiveView} />
      <main className="flex-1 overflow-auto">
        <Suspense fallback={<LoadingFallback />}>
          {renderView()}
        </Suspense>
      </main>
    </div>
  );
}
