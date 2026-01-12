import { useState, lazy, Suspense, memo } from 'react';
import { Header } from './shared/components/Header';
import { VeloLandingPage } from './pages/LandingPage';
import { VeloLogin } from './features/auth/Login';
import { VeloSignup } from './features/auth/Signup';
import { VeloPreloader } from './shared/components/Preloader';
import { authAPI } from './api/auth';

// Lazy load dashboard components for better performance
const LiveDashboard = lazy(() => import('./features/dashboard/LiveDashboard').then(m => ({ default: m.LiveDashboard })));
const StationBehavior = lazy(() => import('./features/dashboard/StationBehavior').then(m => ({ default: m.StationBehavior })));
const ArrondissementAnalysis = lazy(() => import('./features/dashboard/ArrondissementAnalysis').then(m => ({ default: m.ArrondissementAnalysis })));
const MapAnalysis = lazy(() => import('./features/dashboard/MapAnalysis').then(m => ({ default: m.MapAnalysis })));

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
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('isAuthenticated') === 'true';
  });
  const [currentPage, setCurrentPage] = useState<'landing' | 'login' | 'register' | 'dashboard'>('landing');
  const [activeView, setActiveView] = useState('live');

  const handleLogin = () => {
    setIsAuthenticated(true);
    setCurrentPage('dashboard');
  };

  const handleRegister = () => {
    setIsAuthenticated(true);
    setCurrentPage('dashboard');
  };

  const handleLogout = async () => {
    try {
      // Call logout API to blacklist the refresh token
      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken) {
        await authAPI.logout(refreshToken);
      }
    } catch (err) {
      console.error('Logout API error:', err);
    } finally {
      // Clear all auth data from localStorage
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('isAuthenticated');
      localStorage.removeItem('user');
      
      // Reset authentication state
      setIsAuthenticated(false);
      setCurrentPage('landing');
    }
  };

  // Render landing, login, or register pages
  if (!isAuthenticated) {
    if (currentPage === 'login') {
      return (
        <Suspense fallback={<VeloPreloader />}>
          <VeloLogin onNavigate={setCurrentPage} onLogin={handleLogin} />
        </Suspense>
      );
    }
    if (currentPage === 'register') {
      return (
        <Suspense fallback={<VeloPreloader />}>
          <VeloSignup onNavigate={setCurrentPage} onRegister={handleRegister} />
        </Suspense>
      );
    }
    return (
      <Suspense fallback={<VeloPreloader />}>
        <VeloLandingPage onNavigate={setCurrentPage} />
      </Suspense>
    );
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
      <Header variant="dashboard" activeView={activeView} onViewChange={setActiveView} onLogout={handleLogout} />
      <main className="flex-1 overflow-auto">
        <Suspense fallback={<LoadingFallback />}>
          {renderView()}
        </Suspense>
      </main>
    </div>
  );
}
