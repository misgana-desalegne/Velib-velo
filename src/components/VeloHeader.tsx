import React, { useState, useEffect } from 'react';

interface VeloHeaderProps {
  onNavigate: (page: 'landing' | 'login' | 'register' | 'dashboard') => void;
  isAuthenticated: boolean;
  onLogout: () => void;
}

export const VeloHeader: React.FC<VeloHeaderProps> = ({ onNavigate, isAuthenticated, onLogout }) => {
  const [isSticky, setIsSticky] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const header = document.querySelector('.hero-section-wrapper-5 .header') as HTMLElement;
      if (header) {
        const sticky = header.offsetTop;
        setIsSticky(window.pageYOffset > sticky);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated');
    closeMenu();
    onLogout();
  };

  return (
    <header className={`header header-6 ${isSticky ? 'sticky' : ''}`}>
      <div className="navbar-area">
        <div className="container">
          <div className="row align-items-center">
            <div className="col-lg-12">
              <nav className="navbar navbar-expand-lg">
                <button 
                  onClick={() => onNavigate('landing')} 
                  className="navbar-brand"
                  style={{background: 'none', border: 'none', color: 'inherit', cursor: 'pointer'}}
                >
                  ParisCycle
                </button>
                
                <button 
                  className={`navbar-toggler ${isMenuOpen ? 'active' : ''}`}
                  type="button" 
                  onClick={toggleMenu}
                  aria-label="Toggle navigation"
                >
                  <span className="toggler-icon"></span>
                  <span className="toggler-icon"></span>
                  <span className="toggler-icon"></span>
                </button>

                <div className={`collapse navbar-collapse sub-menu-bar ${isMenuOpen ? 'show' : ''}`}>
                  <ul id="nav6" className="navbar-nav ms-auto">
                    <li className="nav-item">
                      <button 
                        className="page-scroll" 
                        onClick={() => { onNavigate('landing'); closeMenu(); }}
                        style={{background: 'none', border: 'none', color: 'inherit', cursor: 'pointer'}}
                      >
                        Home
                      </button>
                    </li>
                    
                    {isAuthenticated && (
                      <>
                        <li className="nav-item">
                          <button 
                            className="page-scroll" 
                            onClick={() => { onNavigate('dashboard'); closeMenu(); }}
                            style={{background: 'none', border: 'none', color: 'inherit', cursor: 'pointer'}}
                          >
                            Dashboard
                          </button>
                        </li>
                      </>
                    )}
                    
                    {!isAuthenticated ? (
                      <>
                        <li className="nav-item">
                          <button 
                            className="page-scroll" 
                            onClick={() => { onNavigate('register'); closeMenu(); }}
                            style={{background: 'none', border: 'none', color: 'inherit', cursor: 'pointer'}}
                          >
                            S'inscrire
                          </button>
                        </li>
                        <li className="nav-item">
                          <button 
                            className="page-scroll" 
                            onClick={() => { onNavigate('login'); closeMenu(); }}
                            style={{background: 'none', border: 'none', color: 'inherit', cursor: 'pointer'}}
                          >
                            Se Connecter
                          </button>
                        </li>
                      </>
                    ) : (
                      <li className="nav-item">
                        <button 
                          className="page-scroll btn btn-link"
                          onClick={handleLogout}
                          style={{textDecoration: 'none', color: 'inherit', border: 'none', background: 'none', cursor: 'pointer'}}
                        >
                          Se Déconnecter
                        </button>
                      </li>
                    )}
                  </ul>
                </div>
              </nav>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
