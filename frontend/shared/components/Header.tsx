import React, { useState, useEffect } from 'react';
import { Activity, TrendingUp, Building2, Map, Bike, LogOut, Menu, X, Users } from 'lucide-react';
import { Button } from '../ui/button';
import logo from '@/assets/images/img/logo/LOGO velo.png';
import '../styles/responsive.css';
import type { AppPage } from '../types/navigation';

// Contact modal component
function ContactModal({ open, onClose, onSubmit }: { open: boolean; onClose: () => void; onSubmit?: () => void }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus('');
    try {
      const res = await fetch('/api/contact-messages/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(localStorage.getItem('access_token') ? { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` } : {})
        },
        body: JSON.stringify({ name, email, phone, message })
      });
      if (res.ok) {
        setStatus('Message envoyé!');
        setName(''); setEmail(''); setPhone(''); setMessage('');
        if (onSubmit) onSubmit();
      } else {
        setStatus('Erreur lors de l\'envoi.');
      }
    } catch {
      setStatus('Erreur réseau.');
    }
  };

  if (!open) return null;
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.35)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: 'white', borderRadius: 16, padding: 32, width: 'min(92vw, 760px)', maxWidth: 900, boxShadow: '0 12px 48px rgba(0,0,0,0.18)', maxHeight: '90vh', overflowY: 'auto' }}>
        <h2 style={{ fontWeight: 700, fontSize: '1.5rem', marginBottom: 12 }}>Nous Contactons</h2>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input required placeholder="Nom" value={name} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)} style={{ padding: 10, borderRadius: 8, border: '1px solid #ccc' }} />
          <input required type="email" placeholder="Email" value={email} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)} style={{ padding: 10, borderRadius: 8, border: '1px solid #ccc' }} />
          <input placeholder="Téléphone" value={phone} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPhone(e.target.value)} style={{ padding: 10, borderRadius: 8, border: '1px solid #ccc' }} />
          <textarea required placeholder="Votre message" value={message} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setMessage(e.target.value)} style={{ padding: 12, borderRadius: 8, border: '1px solid #ccc', minHeight: 200, resize: 'vertical' }} />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            <button type="button" onClick={onClose} style={{ background: '#eee', border: 'none', borderRadius: 8, padding: '8px 16px', cursor: 'pointer' }}>Annuler</button>
            <button type="submit" style={{ background: '#2F80ED', color: 'white', border: 'none', borderRadius: 8, padding: '8px 16px', cursor: 'pointer' }}>Envoyer</button>
          </div>
          {status && <div style={{ color: status.includes('Erreur') ? 'red' : 'green', marginTop: 8 }}>{status}</div>}
        </form>
      </div>
    </div>
  );
}
// ...existing code...

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
  // Contact modal state (moved up so both header variants can use it)
  const [contactOpen, setContactOpen] = useState(false);

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

                    {/* Contact Modal placeholder removed (rendered once below) */}
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
            
          </nav>

          {/* Status Indicator and Logout - Desktop */}
          <div className="hidden md:flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-sm text-gray-600">En Direct</span>
            </div>
            
            {/* Nous Contactons button - visible on desktop when authenticated */}
            <button
              onClick={() => setContactOpen(true)}
              className="hidden md:inline-flex"
              style={{ background: 'none', border: 'none', color: '#2F80ED', fontWeight: 600, cursor: 'pointer' }}
            >
              contactez-nous
            </button>

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
              <button
                onClick={() => { setContactOpen(true); setIsMenuOpen(false); }}
                className="flex items-center gap-3 px-4 py-3 text-blue-600 hover:bg-blue-50 w-full text-left"
                style={{ background: 'none', border: 'none' }}
              >
                contactez-nous
              </button>
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
        {/* Contact Modal (rendered for dashboard too) */}
        <ContactModal open={contactOpen} onClose={() => setContactOpen(false)} onSubmit={() => setContactOpen(false)} />
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

  // Contact modal state (declared above)
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
              onMouseOver={(e: React.MouseEvent<HTMLButtonElement>) => e.currentTarget.style.color = '#0055a4'}
              onMouseOut={(e: React.MouseEvent<HTMLButtonElement>) => e.currentTarget.style.color = '#333'}
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
              onMouseOver={(e: React.MouseEvent<HTMLButtonElement>) => e.currentTarget.style.color = '#0055a4'}
              onMouseOut={(e: React.MouseEvent<HTMLButtonElement>) => e.currentTarget.style.color = '#333'}
            >
              Équipe
            </button>
            
            {isAuthenticated && (
              <>
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
                  onMouseOver={(e: React.MouseEvent<HTMLButtonElement>) => e.currentTarget.style.color = '#0055a4'}
                  onMouseOut={(e: React.MouseEvent<HTMLButtonElement>) => e.currentTarget.style.color = '#333'}
                >
                  Tableau de bord
                </button>
                <button
                  onClick={() => setContactOpen(true)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#2F80ED',
                    fontFamily: 'Arial, sans-serif',
                    fontSize: '1rem',
                    fontWeight: '500',
                    padding: '8px 10px',
                    cursor: 'pointer',
                    transition: 'color 0.3s',
                    textDecoration: 'underline'
                  }}
                  onMouseOver={(e: React.MouseEvent<HTMLButtonElement>) => e.currentTarget.style.color = '#0055a4'}
                  onMouseOut={(e: React.MouseEvent<HTMLButtonElement>) => e.currentTarget.style.color = '#2F80ED'}
                >
                  Nous Contactons
                </button>
              </>
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
                  onMouseOver={(e: React.MouseEvent<HTMLButtonElement>) => {
                    e.currentTarget.style.backgroundColor = '#e6f0f7';
                    e.currentTarget.style.boxShadow = '0 4px 10px rgba(0, 85, 164, 0.2)';
                  }}
                  onMouseOut={(e: React.MouseEvent<HTMLButtonElement>) => {
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
                  onMouseOver={(e: React.MouseEvent<HTMLButtonElement>) => {
                    e.currentTarget.style.backgroundColor = 'rgb(26, 216, 16)';
                    e.currentTarget.style.boxShadow = '0 5px 15px rgba(239, 65, 53, 0.4)';
                  }}
                  onMouseOut={(e: React.MouseEvent<HTMLButtonElement>) => {
                    e.currentTarget.style.backgroundColor = '#70ef35';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  S'inscrire
                </button>
              </>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button
                  onClick={() => setContactOpen(true)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#2F80ED',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  Contactez-nous
                </button>
              
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
                onMouseOver={(e: React.MouseEvent<HTMLButtonElement>) => {
                  e.currentTarget.style.backgroundColor = '#dc3545';
                  e.currentTarget.style.color = 'white';
                }}
                onMouseOut={(e: React.MouseEvent<HTMLButtonElement>) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = '#dc3545';
                }}
              >
                <LogOut style={{ width: '16px', height: '16px', display: 'inline', marginRight: '5px' }} />
                Déconnexion
              </button>
              </div>
            )}
          </nav>

          {/* Contact Modal */}
          <ContactModal open={contactOpen} onClose={() => setContactOpen(false)} onSubmit={() => setContactOpen(false)} />
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
              onMouseOver={(e: React.MouseEvent<HTMLButtonElement>) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
              onMouseOut={(e: React.MouseEvent<HTMLButtonElement>) => e.currentTarget.style.backgroundColor = 'transparent'}
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
              onMouseOver={(e: React.MouseEvent<HTMLButtonElement>) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
              onMouseOut={(e: React.MouseEvent<HTMLButtonElement>) => e.currentTarget.style.backgroundColor = 'transparent'}
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
                onMouseOver={(e: React.MouseEvent<HTMLButtonElement>) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                onMouseOut={(e: React.MouseEvent<HTMLButtonElement>) => e.currentTarget.style.backgroundColor = 'transparent'}
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
                    onMouseOver={(e: React.MouseEvent<HTMLButtonElement>) => {
                      e.currentTarget.style.backgroundColor = '#e6f0f7';
                    }}
                    onMouseOut={(e: React.MouseEvent<HTMLButtonElement>) => {
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
                    onMouseOver={(e: React.MouseEvent<HTMLButtonElement>) => {
                      e.currentTarget.style.backgroundColor = 'rgb(26, 216, 16)';
                    }}
                    onMouseOut={(e: React.MouseEvent<HTMLButtonElement>) => {
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
                  onMouseOver={(e: React.MouseEvent<HTMLButtonElement>) => {
                    e.currentTarget.style.backgroundColor = '#dc3545';
                    e.currentTarget.style.color = 'white';
                  }}
                  onMouseOut={(e: React.MouseEvent<HTMLButtonElement>) => {
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
