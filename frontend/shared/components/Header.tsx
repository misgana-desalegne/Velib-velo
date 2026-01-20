import React, { useState, useEffect } from 'react';
import { Activity, TrendingUp, Building2, Map, Bike, LogOut, Menu, X, Users } from 'lucide-react';
import { Button } from '../ui/button';
import logo from '@/assets/images/img/logo/LOGO velo.png';
import '../styles/responsive.css';
import type { AppPage } from '../types/navigation';

// Dashboard Header Props
interface DashboardHeaderProps {
  variant: 'dashboard';
  activeView: string;
  onViewChange: (view: string) => void;
  onLogout?: () => void;
}

// Landing/Auth Header Props
interface LandingHeaderProps {
  variant: 'landing';
  onNavigate: (page: AppPage) => void;
  isAuthenticated: boolean;
  onLogout: () => void;
}

type HeaderProps = DashboardHeaderProps | LandingHeaderProps;

export function Header(props: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  // Dashboard Header
  if (props.variant === 'dashboard') {
    const { activeView, onViewChange, onLogout } = props;
    
    const menuItems = [
      { id: 'live', label: 'Analyse en Direct', icon: Activity },
      { id: 'behavior', label: 'Comportement des Stations', icon: TrendingUp },
      { id: 'arrondissement', label: 'Par Commune', icon: Building2 },
      { id: 'map', label: 'Vue Cartographique', icon: Map },
      { id: 'velib', label: 'Vélib Temps Réel', icon: Bike },
      { id: 'teams', label: 'Équipe', icon: Users },
    ];

    return (
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="flex items-center justify-between px-2 sm:px-4 py-2 h-16">
          {/* Logo and Title */}
          <button
            onClick={() => {
              onViewChange('live');
              setIsMenuOpen(false);
            }}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity cursor-pointer flex-shrink-0"
            style={{ background: 'none', border: 'none', padding: 0 }}
            title="Go to Dashboard"
          >
            <img src={logo} alt="ParisCycle - Innovative Urban Mobility Logo" style={{ height: '40px', width: 'auto' }} />
          </button>

          {/* Desktop Navigation - Hidden on mobile */}
          <nav className="hidden md:flex items-center gap-2 flex-1 mx-4">
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
                  <span>{item.label}</span>
                </Button>
              );
            })}
          </nav>

          {/* Status Indicator and Logout - Desktop */}
          <div className="hidden md:flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-sm text-gray-600">En Direct</span>
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
                <span>Déconnexion</span>
              </Button>
            )}
          </div>

          {/* Mobile Hamburger Menu Button */}
          <button
            onClick={toggleMenu}
            className="md:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors ml-auto"
          >
            {isMenuOpen ? (
              <X className="w-6 h-6 text-gray-700" />
            ) : (
              <Menu className="w-6 h-6 text-gray-700" />
            )}
          </button>
        </div>

        {/* Mobile Menu - Collapsible */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-gray-200 bg-gray-50">
            <nav className="flex flex-col divide-y">
              {menuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    className={`flex items-center gap-3 px-4 py-3 transition-colors ${
                      activeView === item.id 
                        ? 'bg-blue-50 text-blue-600' 
                        : 'hover:bg-gray-100 text-gray-700'
                    }`}
                    onClick={() => {
                      onViewChange(item.id);
                      setIsMenuOpen(false);
                    }}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{item.label}</span>
                  </button>
                );
              })}
              <div className="px-4 py-3 flex items-center gap-2 bg-white">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-sm text-gray-600">En Direct</span>
              </div>
              {onLogout && (
                <button
                  onClick={() => {
                    onLogout();
                    setIsMenuOpen(false);
                  }}
                  className="flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 transition-colors w-full text-left"
                >
                  <LogOut className="w-5 h-5" />
                  <span className="font-medium">Déconnexion</span>
                </button>
              )}
            </nav>
          </div>
        )}
      </header>
    );
  }

  // Landing/Auth Header - Modern Design
  const { onNavigate, isAuthenticated, onLogout } = props;

  const handleLogout = () => {
    // Clear all auth data
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('user');
    closeMenu();
    onLogout();
  };

  return (
    <header style={{
      backgroundColor: 'white',
      boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
      position: 'sticky',
      top: 0,
      zIndex: 1000,
      borderBottom: '1px solid #e5e7eb'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 16px' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: '70px'
        }}>
          {/* Logo */}
          <button 
            onClick={() => {
              onNavigate('landing');
              closeMenu();
            }}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: 0,
              flexShrink: 0
            }}
          >
            <img src={logo} alt="ParisCycle - Innovative Urban Mobility Logo" style={{ height: '50px', width: 'auto' }} />
          </button>
          
          {/* Desktop Navigation - Hidden on mobile */}
          <nav style={{
            display: 'flex',
            gap: '15px',
            alignItems: 'center',
            padding: '10px 20px'
          }} className="hidden md:flex">
            <button 
              onClick={() => onNavigate('landing')}
              style={{
                background: 'none',
                border: 'none',
                color: '#333',
                fontFamily: 'Arial, sans-serif',
                fontSize: '1rem',
                fontWeight: '500',
                padding: '8px 10px',
                cursor: 'pointer',
                transition: 'color 0.3s'
              }}
              onMouseOver={(e) => e.currentTarget.style.color = '#0055a4'}
              onMouseOut={(e) => e.currentTarget.style.color = '#333'}
            >
              Accueil
            </button>

            <button 
              onClick={() => onNavigate('teams')}
              style={{
                background: 'none',
                border: 'none',
                color: '#333',
                fontFamily: 'Arial, sans-serif',
                fontSize: '1rem',
                fontWeight: '500',
                padding: '8px 10px',
                cursor: 'pointer',
                transition: 'color 0.3s'
              }}
              onMouseOver={(e) => e.currentTarget.style.color = '#0055a4'}
              onMouseOut={(e) => e.currentTarget.style.color = '#333'}
            >
              Équipe
            </button>
            
            {isAuthenticated && (
              <button 
                onClick={() => onNavigate('dashboard')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#333',
                  fontFamily: 'Arial, sans-serif',
                  fontSize: '1rem',
                  fontWeight: '500',
                  padding: '8px 10px',
                  cursor: 'pointer',
                  transition: 'color 0.3s'
                }}
                onMouseOver={(e) => e.currentTarget.style.color = '#0055a4'}
                onMouseOut={(e) => e.currentTarget.style.color = '#333'}
              >
                Tableau de bord
              </button>
            )}
            
            {!isAuthenticated ? (
              <>
                <button 
                  onClick={() => onNavigate('login')}
                  style={{
                    color: '#0055a4',
                    backgroundColor: '#fff',
                    border: '2px solid #0055a4',
                    fontWeight: '600',
                    fontFamily: 'Arial, sans-serif',
                    padding: '10px 18px',
                    borderRadius: '50px',
                    transition: 'all 0.3s ease',
                    textAlign: 'center',
                    cursor: 'pointer',
                    fontSize: '14px',
                    lineHeight: '1',
                    boxShadow: 'none'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor = '#e6f0f7';
                    e.currentTarget.style.boxShadow = '0 4px 10px rgba(0, 85, 164, 0.2)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = '#fff';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  Connexion
                </button>
                <button 
                  onClick={() => onNavigate('register')}
                  style={{
                    color: '#fff',
                    backgroundColor: '#159205',
                    border: '2px solid #ef9b35',
                    fontWeight: '600',
                    fontFamily: 'Arial, sans-serif',
                    padding: '10px 18px',
                    borderRadius: '50px',
                    transition: 'all 0.3s ease',
                    textAlign: 'center',
                    cursor: 'pointer',
                    fontSize: '14px',
                    lineHeight: '1'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgb(26, 216, 16)';
                    e.currentTarget.style.boxShadow = '0 5px 15px rgba(239, 65, 53, 0.4)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = '#70ef35';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  S'inscrire
                </button>
              </>
            ) : (
              <button 
                onClick={handleLogout}
                style={{
                  background: 'none',
                  border: '2px solid #dc3545',
                  color: '#dc3545',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  padding: '10px 25px',
                  borderRadius: '50px',
                  transition: 'all 0.3s ease'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = '#dc3545';
                  e.currentTarget.style.color = 'white';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = '#dc3545';
                }}
              >
                <LogOut style={{ width: '16px', height: '16px', display: 'inline', marginRight: '5px' }} />
                Déconnexion
              </button>
            )}
          </nav>

          {/* Mobile Menu Button */}
          <button 
            onClick={toggleMenu}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '8px',
              color: '#333',
              marginLeft: 'auto'
            }}
            className="md:hidden"
          >
            {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>

        {/* Mobile Navigation - Collapsible */}
        {isMenuOpen && (
          <nav style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0',
            padding: '0',
            borderTop: '1px solid #e5e7eb',
            backgroundColor: '#f9fafb'
          }} className="md:hidden">
            <button 
              onClick={() => { onNavigate('landing'); closeMenu(); }}
              style={{
                background: 'none',
                border: 'none',
                color: '#333',
                fontSize: '1rem',
                fontWeight: '500',
                cursor: 'pointer',
                padding: '12px 16px',
                textAlign: 'left',
                borderBottom: '1px solid #e5e7eb',
                transition: 'background-color 0.2s'
              }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              Accueil
            </button>

            <button 
              onClick={() => { onNavigate('teams'); closeMenu(); }}
              style={{
                background: 'none',
                border: 'none',
                color: '#333',
                fontSize: '1rem',
                fontWeight: '500',
                cursor: 'pointer',
                padding: '12px 16px',
                textAlign: 'left',
                borderBottom: '1px solid #e5e7eb',
                transition: 'background-color 0.2s'
              }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              Équipe
            </button>
            
            {isAuthenticated && (
              <button 
                onClick={() => { onNavigate('dashboard'); closeMenu(); }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#333',
                  fontSize: '1rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  padding: '12px 16px',
                  textAlign: 'left',
                  borderBottom: '1px solid #e5e7eb',
                  transition: 'background-color 0.2s'
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                Tableau de bord
              </button>
            )}
            
            <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {!isAuthenticated ? (
                <>
                  <button 
                    onClick={() => { onNavigate('login'); closeMenu(); }}
                    style={{
                      backgroundColor: 'transparent',
                      border: '2px solid #0055a4',
                      color: '#0055a4',
                      fontSize: '1rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                      padding: '10px 16px',
                      borderRadius: '50px',
                      width: '100%',
                      transition: 'all 0.2s'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.backgroundColor = '#e6f0f7';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    Connexion
                  </button>
                  <button 
                    onClick={() => { onNavigate('register'); closeMenu(); }}
                    style={{
                      color: '#fff',
                      backgroundColor: '#159205',
                      border: '2px solid #ef9b35',
                      fontWeight: '600',
                      fontSize: '1rem',
                      cursor: 'pointer',
                      padding: '10px 16px',
                      borderRadius: '50px',
                      width: '100%',
                      transition: 'all 0.2s'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgb(26, 216, 16)';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.backgroundColor = '#159205';
                    }}
                  >
                    S'inscrire
                  </button>
                </>
              ) : (
                <button 
                  onClick={handleLogout}
                  style={{
                    background: 'none',
                    border: '2px solid #dc3545',
                    color: '#dc3545',
                    fontSize: '1rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    padding: '10px 16px',
                    borderRadius: '50px',
                    width: '100%',
                    transition: 'all 0.2s'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor = '#dc3545';
                    e.currentTarget.style.color = 'white';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = '#dc3545';
                  }}
                >
                  <LogOut style={{ width: '16px', height: '16px', display: 'inline', marginRight: '5px' }} />
                  Déconnexion
                </button>
              )}
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}

// Legacy export for backwards compatibility
export const VeloHeader = (props: Omit<LandingHeaderProps, 'variant'>) => (
  <Header {...props} variant="landing" />
);
