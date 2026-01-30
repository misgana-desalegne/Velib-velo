import React from 'react';
import { VeloHeader } from '../shared/components/Header';
import { useLandingStyles } from '../shared/hooks/useLandingStyles';
import styles from './LandingPage.module.css';
import partnerLogo from '../assets/images/Logo-Greta.png';
import type { AppPage } from '../shared/types/navigation';

interface VeloLandingPageProps {
  onNavigate: (page: AppPage) => void;
}

export const VeloLandingPage: React.FC<VeloLandingPageProps> = ({ onNavigate }) => {
  // Dynamically load landing page styles only when this component mounts
  useLandingStyles();

  // Use a public asset URL (served from frontend/public)
  const heroImageUrl = '/Data-Analysis-Dashboard/assets/img/hero/hero-5/velo1.png';

  const teamMembers = [
    { name: 'Kiros Misgana', role: 'Data Scientist', image: heroImageUrl, link: 'https://www.kirosit.fr/portfolio' },
    { name: 'Farial Huda', role: 'Développeur Full-Stack', image: '/Data-Analysis-Dashboard/assets/img/farial.png' },
    { name: 'Rabbeg Roua', role: 'Analyste Mobilité', image: '/Data-Analysis-Dashboard/assets/img/hero/hero-5/hero-bg.svg' },
  ];

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <VeloHeader onNavigate={onNavigate} isAuthenticated={false} onLogout={() => {}} />
      </div>

      {/* Main Content */}
      <div className={styles.mainContent}>
        <div className={styles.contentWrapper}>
          <h1 className={styles.title} style={{ background: 'none', WebkitTextFillColor: 'initial' }}>
            <span style={{ color: '#2f80ed' }}>Paris</span>
            <span style={{ color: '#FFFFFF' }}>Cycle</span>
            <span style={{ color: '#d61512e2' }}> Analytics</span>
          </h1>

          <p className={styles.description}>
            Explorez les données de mobilité urbaine de Paris en temps réel. 
            Des insights puissants pour comprendre la ville de demain.
          </p>

          <div className={styles.buttonContainer}>
            {/* Connexion Button - Modern */}
            <button
              onClick={() => onNavigate('login')}
              className={styles.buttonPrimary}
            >
              Connexion
            </button>

            {/* Inscription Button - Modern glass effect */}
            <button
              onClick={() => onNavigate('register')}
              className={styles.buttonSecondary}
            >
              Inscription
            </button>

            {/* Public realtime stats */}
            <button
              onClick={() => onNavigate('velib')}
              className={styles.buttonSecondary}
            >
              Statistiques Vélib (Live)
            </button>
          </div>
        </div>
      </div>

      

      {/* Footer */}
      <div className={styles.footer}>
        <p className={styles.footerText}>
          © 2026 ParisCycle Analytics. Tous droits réservés.
        </p>
      </div>
    </div>
  );
};
