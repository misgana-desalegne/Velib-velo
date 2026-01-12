import React, { useState } from 'react';
import { VeloHeader } from '../../shared/components/Header';
import { useLandingStyles } from '../../shared/hooks/useLandingStyles';
import { authAPI } from '../../api/auth';

interface VeloLoginProps {
  onNavigate: (page: 'landing' | 'login' | 'register' | 'dashboard') => void;
  onLogin: () => void;
}

export const VeloLogin: React.FC<VeloLoginProps> = ({ onNavigate, onLogin }) => {
  // Dynamically load landing page styles
  useLandingStyles();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    if (!email || !password) {
      setError('Veuillez remplir tous les champs');
      setLoading(false);
      return;
    }

    try {
      const data = await authAPI.login({ email, password });
      
      // Store tokens and user data
      localStorage.setItem('access_token', data.access);
      localStorage.setItem('refresh_token', data.refresh);
      localStorage.setItem('isAuthenticated', 'true');
      localStorage.setItem('user', JSON.stringify(data.user));
      
      onLogin();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Email ou mot de passe incorrect. Veuillez vous inscrire d\'abord.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      backgroundImage: 'url(/assets/img/hero/hero-5/velo1.png)',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      position: 'relative'
    }}>
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.5)',
        zIndex: 0
      }}></div>

      <div style={{ position: 'relative', zIndex: 2 }}>
        <VeloHeader onNavigate={onNavigate} isAuthenticated={false} onLogout={() => {}} />
      </div>
      
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 20px',
        position: 'relative',
        zIndex: 1
      }}>
        <div style={{
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(20px)',
          padding: '60px 50px',
          borderRadius: '30px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          maxWidth: '480px',
          width: '100%',
          border: '1px solid rgba(255, 255, 255, 0.3)'
        }}>
          <h2 style={{
            fontSize: '2.5rem',
            fontWeight: '800',
            background: 'linear-gradient(135deg, #2F80ED 0%, #1e5bb8 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            marginBottom: '10px',
            textAlign: 'center'
          }}>
            Bon retour !
          </h2>
          <p style={{
            color: '#666',
            textAlign: 'center',
            marginBottom: '40px',
            fontSize: '1.05rem'
          }}>
            Connectez-vous pour accéder à votre tableau de bord
          </p>

          <form onSubmit={handleSubmit}>
            {error && (
              <div style={{
                padding: '15px 20px',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                color: '#dc2626',
                borderRadius: '12px',
                marginBottom: '25px',
                fontSize: '0.95rem',
                border: '1px solid rgba(239, 68, 68, 0.2)'
              }}>
                {error}
              </div>
            )}
            
            <div style={{ marginBottom: '24px' }}>
              <label style={{
                display: 'block',
                marginBottom: '10px',
                color: '#1a1a1a',
                fontWeight: '600',
                fontSize: '0.95rem'
              }}>
                Adresse email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="vous@exemple.com"
                style={{
                  width: '100%',
                  padding: '16px 18px',
                  border: '2px solid #e5e7eb',
                  borderRadius: '12px',
                  fontSize: '1rem',
                  transition: 'all 0.3s',
                  outline: 'none',
                  backgroundColor: 'white'
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = '#2F80ED';
                  e.currentTarget.style.boxShadow = '0 0 0 4px rgba(47, 128, 237, 0.1)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = '#e5e7eb';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              />
            </div>

            <div style={{ marginBottom: '30px' }}>
              <label style={{
                display: 'block',
                marginBottom: '10px',
                color: '#1a1a1a',
                fontWeight: '600',
                fontSize: '0.95rem'
              }}>
                Mot de passe
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  style={{
                    width: '100%',
                    padding: '16px 50px 16px 18px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '12px',
                    fontSize: '1rem',
                    transition: 'all 0.3s',
                    outline: 'none',
                    backgroundColor: 'white'
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#2F80ED';
                    e.currentTarget.style.boxShadow = '0 0 0 4px rgba(47, 128, 237, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = '#e5e7eb';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '15px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#9ca3af',
                    fontSize: '1.2rem',
                    padding: '5px'
                  }}
                >
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '18px',
                background: loading ? '#9ca3af' : 'linear-gradient(135deg, #2F80ED 0%, #1e5bb8 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                fontSize: '1.15rem',
                fontWeight: '700',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.3s',
                marginBottom: '25px',
                boxShadow: loading ? 'none' : '0 4px 15px rgba(47, 128, 237, 0.3)'
              }}
              onMouseOver={(e) => {
                if (!loading) {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 8px 25px rgba(47, 128, 237, 0.4)';
                }
              }}
              onMouseOut={(e) => {
                if (!loading) {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 15px rgba(47, 128, 237, 0.3)';
                }
              }}
            >
              {loading ? 'Connexion en cours...' : 'Se connecter'}
            </button>
          </form>

          <div style={{
            textAlign: 'center',
            paddingTop: '20px',
            borderTop: '1px solid #e5e7eb'
          }}>
            <span style={{ color: '#6b7280', fontSize: '0.95rem' }}>Pas encore de compte ? </span>
            <button
              onClick={() => onNavigate('register')}
              style={{
                background: 'none',
                border: 'none',
                color: '#2F80ED',
                fontWeight: '700',
                cursor: 'pointer',
                fontSize: '0.95rem'
              }}
              onMouseOver={(e) => e.currentTarget.style.textDecoration = 'underline'}
              onMouseOut={(e) => e.currentTarget.style.textDecoration = 'none'}
            >
              Créer un compte
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
