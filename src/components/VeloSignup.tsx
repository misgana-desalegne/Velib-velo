import React, { useState } from 'react';
import { VeloHeader } from './VeloHeader';

interface VeloSignupProps {
  onNavigate: (page: 'landing' | 'login' | 'register' | 'dashboard') => void;
  onRegister: () => void;
}

export const VeloSignup: React.FC<VeloSignupProps> = ({ onNavigate, onRegister }) => {
  const [nom, setNom] = useState('');
  const [prenom, setPrenom] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!nom || !prenom || !email || !password) {
      setError('Veuillez remplir tous les champs');
      return;
    }

    // Simple registration - in production, this would save to a backend
    if (nom && prenom && email && password) {
      localStorage.setItem('isAuthenticated', 'true');
      onRegister();
    } else {
      setError('Erreur lors de l\'inscription');
    }
  };

  return (
    <div>
      <section id="home" className="hero-section-wrapper-5">
        <VeloHeader onNavigate={onNavigate} isAuthenticated={false} onLogout={() => {}} />
      </section>

      <section id="contact" className="contact-section contact-style-3">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-xxl-5 col-xl-5 col-lg-7 col-md-10">
              <div className="section-title text-center mb-50">
                <h3 className="mb-15">Creer un compte</h3>
              </div>
            </div>
          </div>
          <div className="row">
            <div className="col-lg-6">
              <div className="contact-form-wrapper">
                <form onSubmit={handleSubmit}>
                  <div className="row">
                    {error && (
                      <div className="col-md-10">
                        <div className="alert alert-danger" role="alert">
                          {error}
                        </div>
                      </div>
                    )}
                    <div className="col-md-10">
                      <div className="single-input">
                        <input 
                          type="text" 
                          id="nom" 
                          name="nom" 
                          className="form-input" 
                          placeholder="Entrer votre nom"
                          value={nom}
                          onChange={(e) => setNom(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="col-md-10">
                      <div className="single-input">
                        <input 
                          type="text" 
                          id="prenom" 
                          name="prenom" 
                          className="form-input" 
                          placeholder="Entrer votre prénom"
                          value={prenom}
                          onChange={(e) => setPrenom(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="col-md-10">
                      <div className="single-input">
                        <input 
                          type="email" 
                          id="email" 
                          name="email" 
                          className="form-input" 
                          placeholder="Email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                        />
                        <i className="lni lni-envelope"></i>
                      </div>
                    </div>
                    <div className="col-md-10">
                      <div className="single-input">
                        <input 
                          type="password" 
                          name="your_pass" 
                          id="your_pass" 
                          placeholder="Mot de passe"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                        />
                        <i className="lni lni-text-format"></i>
                      </div>
                    </div>
                    <p className="text-center">
                      <span>Vous avez déjà un compte ? </span>
                      <button 
                        type="button" 
                        onClick={() => onNavigate('login')}
                        style={{background: 'none', border: 'none', color: 'inherit', textDecoration: 'underline', cursor: 'pointer'}}
                      >
                        <span>Connectez-vous.</span>
                      </button>
                    </p>
                    <div className="col-md-12">
                      <div className="form-button">
                        <button type="submit" className="button"> <i className="lni lni-telegram-original"></i>Inscription</button>
                      </div>
                    </div>
                  </div>
                </form>
              </div>
            </div>

            <div className="col-lg-6">
              <div className="left-wrapper">
                <div className="row">
                  <img src="/assets/img/about/about-4/velo3.png" alt="" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
