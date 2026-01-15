import React, { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { VeloHeader } from '../../shared/components/Header';
import { useLandingStyles } from '../../shared/hooks/useLandingStyles';
import { authAPI } from '../../api/auth';
import type { AppPage } from '../../shared/types/navigation';

interface VeloSignupProps {
  onNavigate: (page: AppPage) => void;
  onRegister: () => void;
}

export const VeloSignup: React.FC<VeloSignupProps> = ({ onNavigate, onRegister }) => {
  // Dynamically load landing page styles
  useLandingStyles();
  
  const [nom, setNom] = useState('');
  const [prenom, setPrenom] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    if (!nom || !prenom || !email || !password || !confirmPassword) {
      setError('Veuillez remplir tous les champs');
      setLoading(false);
      return;
    }
    
    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      setLoading(false);
      return;
    }
    
    if (password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères');
      setLoading(false);
      return;
    }

    try {
      // Create username from email
      const username = email.split('@')[0];
      
      const data = await authAPI.register({
        username,
        email,
        password,
        password2: confirmPassword,
        first_name: prenom,
        last_name: nom,
        phone
      } as any);
      
      // Store tokens and user data
      localStorage.setItem('access_token', data.access);
      localStorage.setItem('refresh_token', data.refresh);
      localStorage.setItem('isAuthenticated', 'true');
      localStorage.setItem('user', JSON.stringify(data.user));
      
      onRegister();
    } catch (err: any) {
      const errorMsg = err.response?.data;
      if (typeof errorMsg === 'object') {
        const errors = Object.values(errorMsg).flat();
        setError(errors.join(' '));
      } else {
        setError('Erreur lors de l\'inscription. Veuillez réessayer.');
      }
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
          padding: '50px 45px',
          borderRadius: '30px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          maxWidth: '550px',
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
              marginBottom: '20px',
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
            Créer un compte
          </h2>
          <p style={{
            color: '#666',
            textAlign: 'center',
            marginBottom: '35px',
            fontSize: '1.05rem'
          }}>
            Rejoignez-nous pour explorer les données
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
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  color: '#1a1a1a',
                  fontWeight: '600',
                  fontSize: '0.9rem'
                }}>
                  Prénom
                </label>
                <input
                  type="text"
                  value={prenom}
                  onChange={(e) => setPrenom(e.target.value)}
                  required
                  placeholder="Jean"
                  style={{
                    width: '100%',
                    padding: '14px 16px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '12px',
                    fontSize: '1rem',
                    transition: 'all 0.3s',
                    outline: 'none',
                    backgroundColor: 'white'
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#2F80ED';
                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(47, 128, 237, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = '#e5e7eb';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                />
              </div>

              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  color: '#1a1a1a',
                  fontWeight: '600',
                  fontSize: '0.9rem'
                }}>
                  Nom
                </label>
                <input
                  type="text"
                  value={nom}
                  onChange={(e) => setNom(e.target.value)}
                  required
                  placeholder="Dupont"
                  style={{
                    width: '100%',
                    padding: '14px 16px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '12px',
                    fontSize: '1rem',
                    transition: 'all 0.3s',
                    outline: 'none',
                    backgroundColor: 'white'
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#2F80ED';
                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(47, 128, 237, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = '#e5e7eb';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                />
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                color: '#1a1a1a',
                fontWeight: '600',
                fontSize: '0.9rem'
              }}>
                Téléphone (optionnel)
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+33 6 12 34 56 78"
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  border: '2px solid #e5e7eb',
                  borderRadius: '12px',
                  fontSize: '1rem',
                  transition: 'all 0.3s',
                  outline: 'none',
                  backgroundColor: 'white'
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = '#2F80ED';
                  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(47, 128, 237, 0.1)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = '#e5e7eb';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                color: '#1a1a1a',
                fontWeight: '600',
                fontSize: '0.9rem'
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
                  padding: '14px 16px',
                  border: '2px solid #e5e7eb',
                  borderRadius: '12px',
                  fontSize: '1rem',
                  transition: 'all 0.3s',
                  outline: 'none',
                  backgroundColor: 'white'
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = '#2F80ED';
                  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(47, 128, 237, 0.1)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = '#e5e7eb';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                color: '#1a1a1a',
                fontWeight: '600',
                fontSize: '0.9rem'
              }}>
                Mot de passe
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Minimum 8 caractères"
                  style={{
                    width: '100%',
                    padding: '14px 45px 14px 16px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '12px',
                    fontSize: '1rem',
                    transition: 'all 0.3s',
                    outline: 'none',
                    backgroundColor: 'white'
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#2F80ED';
                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(47, 128, 237, 0.1)';
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
                    fontSize: '1.1rem',
                    padding: '5px'
                  }}
                >
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
            </div>

            <div style={{ marginBottom: '28px' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                color: '#1a1a1a',
                fontWeight: '600',
                fontSize: '0.9rem'
              }}>
                Confirmer le mot de passe
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  placeholder="Confirmez votre mot de passe"
                  style={{
                    width: '100%',
                    padding: '14px 45px 14px 16px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '12px',
                    fontSize: '1rem',
                    transition: 'all 0.3s',
                    outline: 'none',
                    backgroundColor: 'white'
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#2F80ED';
                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(47, 128, 237, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = '#e5e7eb';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={{
                    position: 'absolute',
                    right: '15px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#9ca3af',
                    fontSize: '1.1rem',
                    padding: '5px'
                  }}
                >
                  {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '17px',
                background: loading ? '#9ca3af' : 'linear-gradient(135deg, #2F80ED 0%, #1e5bb8 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                fontSize: '1.15rem',
                fontWeight: '700',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.3s',
                marginBottom: '22px',
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
              {loading ? 'Inscription en cours...' : 'Créer mon compte'}
            </button>
          </form>

          <div style={{
            textAlign: 'center',
            paddingTop: '18px',
            borderTop: '1px solid #e5e7eb'
          }}>
            <span style={{ color: '#6b7280', fontSize: '0.95rem' }}>Déjà un compte ? </span>
            <button
              onClick={() => onNavigate('login')}
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
              Se connecter
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
