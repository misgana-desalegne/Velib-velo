import React, { useState } from 'react';
import { ArrowLeft, Facebook } from 'lucide-react';
import { VeloHeader } from '../../shared/components/Header';
import { useLandingStyles } from '../../shared/hooks/useLandingStyles';
import { authAPI } from '../../api/auth';
import type { AppPage } from '../../shared/types/navigation';

declare global {
  interface Window {
    FB: any;
  }
}

interface VeloLoginProps {
  onNavigate: (page: AppPage) => void;
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

  const facebookAppId = import.meta.env.VITE_FACEBOOK_APP_ID as string | undefined;

  const ensureFacebookSdk = async () => {
    if (window.FB) return;
    await new Promise<void>((resolve, reject) => {
      const existing = document.getElementById('facebook-jssdk');
      if (existing) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.id = 'facebook-jssdk';
      script.src = 'https://connect.facebook.net/en_US/sdk.js';
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Facebook SDK'));
      document.body.appendChild(script);
    });

    if (!facebookAppId) {
      throw new Error('VITE_FACEBOOK_APP_ID is not set');
    }

    window.FB?.init({
      appId: facebookAppId,
      cookie: true,
      xfbml: false,
      version: 'v19.0',
    });
  };

  const handleGoogleSuccess = async (credential?: string) => {
    if (!credential) {
      setError('Connexion Google: credential manquant');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const data = await authAPI.googleLogin(credential);
      localStorage.setItem('access_token', data.access);
      localStorage.setItem('refresh_token', data.refresh);
      localStorage.setItem('isAuthenticated', 'true');
      localStorage.setItem('user', JSON.stringify(data.user));
      onLogin();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Connexion Google impossible');
    } finally {
      setLoading(false);
    }
  };

  const handleFacebookLogin = async () => {
    setError('');
    setLoading(true);
    try {
      await ensureFacebookSdk();
      const response = await new Promise<any>((resolve) => {
        window.FB.login((res: any) => resolve(res), { scope: 'email,public_profile' });
      });

      const accessToken = response?.authResponse?.accessToken;
      if (!accessToken) {
        throw new Error('Facebook login cancelled or no access token');
      }

      const data = await authAPI.facebookLogin(accessToken);
      localStorage.setItem('access_token', data.access);
      localStorage.setItem('refresh_token', data.refresh);
      localStorage.setItem('isAuthenticated', 'true');
      localStorage.setItem('user', JSON.stringify(data.user));
      onLogin();
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Connexion Facebook impossible');
    } finally {
      setLoading(false);
    }
  };

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
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>

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
          <button 
            onClick={() => onNavigate('landing')}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#666',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '0',
              marginBottom: '30px',
              fontSize: '0.95rem',
              fontWeight: 600,
              transition: 'color 0.2s',
            }}
            onMouseOver={(e) => e.currentTarget.style.color = '#2F80ED'}
            onMouseOut={(e) => e.currentTarget.style.color = '#666'}
          >
            <ArrowLeft size={20} />
            Retour
          </button>

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
            Connectez-vous pour accéder à votre tableau de bord Vélo.<br />
            Test email:- admin@example.com <br />
            Test password:- admin

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
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
                <button
                  type="button"
                  onClick={() => alert('Fonctionnalité de réinitialisation du mot de passe à venir')}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#2F80ED',
                    fontSize: '0.9rem',
                    cursor: 'pointer',
                    fontWeight: 500,
                    padding: 0
                  }}
                  onMouseOver={(e) => e.currentTarget.style.textDecoration = 'underline'}
                  onMouseOut={(e) => e.currentTarget.style.textDecoration = 'none'}
                >
                  Mot de passe oublié ?
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
            
            <div style={{
              display: 'flex',
              alignItems: 'center',
              margin: '20px 0',
              color: '#9ca3af'
            }}>
              <div style={{ flex: 1, height: '1px', backgroundColor: '#e5e7eb' }}></div>
              <span style={{ padding: '0 10px', fontSize: '0.9rem' }}>OU</span>
              <div style={{ flex: 1, height: '1px', backgroundColor: '#e5e7eb' }}></div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '25px' }}>
              <button
                type="button"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '12px',
                  backgroundColor: 'white',
                  border: '2px solid #e5e7eb',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  color: '#1877F2' // Facebook Blue
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.borderColor = '#1877F2';
                  e.currentTarget.style.backgroundColor = '#f8fafc';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.borderColor = '#e5e7eb';
                  e.currentTarget.style.backgroundColor = 'white';
                }}
                title="Se connecter avec Facebook"
              >
                <Facebook size={24} />
              </button>

              <button
                type="button"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '12px',
                  backgroundColor: 'white',
                  border: '2px solid #e5e7eb',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  color: '#DB4437' // Google Red
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.borderColor = '#DB4437';
                  e.currentTarget.style.backgroundColor = '#f8fafc';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.borderColor = '#e5e7eb';
                  e.currentTarget.style.backgroundColor = 'white';
                }}
                title="Se connecter avec Google"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.84z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
              </button>
            </div>
          </form>

          <div style={{ marginTop: '25px' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              margin: '18px 0'
            }}>
              <div style={{ height: 1, background: 'rgba(0,0,0,0.12)', flex: 1 }} />
              <span style={{ color: '#666', fontWeight: 700, fontSize: '0.85rem' }}>OU</span>
              <div style={{ height: 1, background: 'rgba(0,0,0,0.12)', flex: 1 }} />
            </div>

            <div style={{ display: 'grid', gap: '12px' }}>
              <button
                type="button"
                onClick={handleFacebookLogin}
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  borderRadius: '14px',
                  border: '1px solid rgba(0,0,0,0.08)',
                  background: '#1877F2',
                  color: 'white',
                  fontWeight: 700,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px'
                }}
              >
                <Facebook size={18} />
                Continuer avec Facebook
              </button>
            </div>
          </div>

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
