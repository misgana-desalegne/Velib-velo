import React from 'react';
import { VeloHeader } from './VeloHeader';

interface VeloLandingPageProps {
  onNavigate: (page: 'landing' | 'login' | 'register' | 'dashboard') => void;
}

export const VeloLandingPage: React.FC<VeloLandingPageProps> = ({ onNavigate }) => {
  return (
    <div>
      <section id="home" className="hero-section-wrapper-5">
        <VeloHeader onNavigate={onNavigate} isAuthenticated={false} onLogout={() => {}} />

        <div className="hero-section hero-style-5 img-bg" style={{backgroundImage: "url('/assets/img/hero/hero-5/hero-bg.svg')"}}>
          <div className="container">
            <div className="row">
              <div className="col-lg-6">
                <div className="hero-content-wrapper">
                  <h2 className="mb-30 wow fadeInUp" data-wow-delay=".2s">
                    Les données du vélo à Paris, en temps réel.
                  </h2>
                  <button 
                    onClick={() => onNavigate('login')} 
                    className="button button-lg radius-50 wow fadeInUp" 
                    data-wow-delay=".6s"
                  >
                    Commencer <i className="lni lni-chevron-right"></i>
                  </button>
                </div>
              </div>
              <div className="col-lg-6 align-self-end">
                <div className="hero-image wow fadeInUp" data-wow-delay=".5s">
                  <img src="/assets/img/hero/hero-5/velo1.png" alt="Bike" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="feature" className="feature-section feature-style-5">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-xxl-5 col-xl-5 col-lg-7 col-md-8">
              <div className="section-title text-center mb-60">
                <h3 className="mb-15 wow fadeInUp" data-wow-delay=".2s">
                  Analyse de la mobilité urbaine en 4 dimensions
                </h3>
              </div>
            </div>
          </div>

          <div className="row">
            <div className="col-lg-4 col-md-6">
              <div className="single-feature wow fadeInUp" data-wow-delay=".2s">
                <div className="icon">
                  <i className="lni lni-vector"></i>
                  <svg width="110" height="72" viewBox="0 0 110 72" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M110 54.7589C110 85.0014 85.3757 66.2583 55 66.2583C24.6243 66.2583 0 85.0014 0 54.7589C0 24.5164 24.6243 0 55 0C85.3757 0 110 24.5164 110 54.7589Z" fill="#EBF4FF"/>
                  </svg>                  
                </div>
                <div className="content">
                  <h5>Stations & Vélos</h5>
                  <p>Afficher le nombre de vélos disponible par station, en temps réel.</p>
                </div>
              </div>
            </div>
            <div className="col-lg-4 col-md-6">
              <div className="single-feature wow fadeInUp" data-wow-delay=".4s">
                <div className="icon">
                  <i className="lni lni-pallet"></i>
                  <svg width="110" height="72" viewBox="0 0 110 72" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M110 54.7589C110 85.0014 85.3757 66.2583 55 66.2583C24.6243 66.2583 0 85.0014 0 54.7589C0 24.5164 24.6243 0 55 0C85.3757 0 110 24.5164 110 54.7589Z" fill="#EBF4FF"/>
                  </svg> 
                </div>
                <div className="content">
                  <h5>Analyse par arrondissement</h5>
                  <p>Visualiser le nombre total de vélos utilisés par jour</p>
                </div>
              </div>
            </div>
            <div className="col-lg-4 col-md-6">
              <div className="single-feature wow fadeInUp" data-wow-delay=".6s">
                <div className="icon">
                  <i className="lni lni-stats-up"></i>
                  <svg width="110" height="72" viewBox="0 0 110 72" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M110 54.7589C110 85.0014 85.3757 66.2583 55 66.2583C24.6243 66.2583 0 85.0014 0 54.7589C0 24.5164 24.6243 0 55 0C85.3757 0 110 24.5164 110 54.7589Z" fill="#EBF4FF"/>
                  </svg> 
                </div>
                <div className="content">
                  <h5>Géolocalisation & flux</h5>
                  <p>Montrer les zones plus ou moins utilisées</p>
                </div>
              </div>
            </div>
            <div className="col-lg-4 col-md-6">
              <div className="single-feature wow fadeInUp" data-wow-delay=".2s">
                <div className="icon">
                  <i className="lni lni-code-alt"></i>
                  <svg width="110" height="72" viewBox="0 0 110 72" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M110 54.7589C110 85.0014 85.3757 66.2583 55 66.2583C24.6243 66.2583 0 85.0014 0 54.7589C0 24.5164 24.6243 0 55 0C85.3757 0 110 24.5164 110 54.7589Z" fill="#EBF4FF"/>
                  </svg> 
                </div>
                <div className="content">
                  <h5>API temps réel</h5>
                  <p>Donner accès aux données pour développeurs.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="contact" className="contact-section contact-style-3">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-xxl-5 col-xl-5 col-lg-7 col-md-10">
              <div className="section-title text-center mb-50">
                <h3 className="mb-15">Se connecter</h3>
              </div>
            </div>
          </div>
          <div className="row">
            <div className="col-lg-6">
              <div className="contact-form-wrapper">
                <form>
                  <div className="row">
                    <div className="col-md-10">
                      <div className="single-input">
                        <input type="email" id="email" name="email" className="form-input" placeholder="Email" />
                        <i className="lni lni-envelope"></i>
                      </div>
                    </div>
                    <div className="col-md-10">
                      <div className="single-input">
                        <input type="password" name="your_pass" id="your_pass" placeholder="Password"/>
                        <i className="lni lni-text-format"></i>
                      </div>
                    </div>
                    <p className="text-center">
                      <span>vous etes nouvelle ?</span>
                      <button 
                        type="button" 
                        onClick={() => onNavigate('register')} 
                        style={{background: 'none', border: 'none', color: 'inherit', textDecoration: 'underline', cursor: 'pointer'}}
                      >
                        <span>creer nouvelle compte</span>
                      </button>
                    </p>
                    <div className="col-md-12">
                      <div className="form-button">
                        <button type="submit" className="button"> <i className="lni lni-telegram-original"></i>Connecter</button>
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
