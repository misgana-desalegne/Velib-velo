import React from 'react';
import { VeloHeader } from '../shared/components/Header';
import { useLandingStyles } from '../shared/hooks/useLandingStyles';
import styles from './LandingPage.module.css';
import partnerLogo from '../assets/images/Logo-Greta.png';
// import farialImg from '../assets/images/img/farial.png';
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
            <span style={{ color: '#EF4135' }}> Analytics</span>
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

      {/* Team Section */}
      <div className={styles.teamSection}>
        <div className={styles.teamContainer}>
          {/* Section Header */}
          <div className={styles.teamHeader}>
            <h2 className={styles.teamTitle}>
              Notre Équipe
            </h2>
            <p className={styles.teamSubtitle}>
              Des experts passionnés par la mobilité urbaine et l'analyse de données
            </p>
          </div>

          {/* Team Grid */}
          <div className={styles.teamGrid}>
            {teamMembers.map((member, index) => (
              <div 
                key={index} 
                className={styles.teamCard}
                onClick={() => {
                  if (member.name === 'Farial Huda') {
                    onNavigate('farial');
                  } else if (member.link) {
                    window.open(member.link, '_blank');
                  }
                }}
                style={{ cursor: (member.link || member.name === 'Farial Huda') ? 'pointer' : 'default' }}
                title={member.link || member.name === 'Farial Huda' ? `Voir le profil de ${member.name}` : ''}
              >
                {/* Avatar */}
                <div className={styles.avatarWrapper}>
                  <div
                    className={styles.avatar}
                    style={{ backgroundImage: `url(${member.image})` }}
                  />
                </div>

                {/* Name */}
                <h3 className={styles.memberName}>
                  {member.name}
                </h3>

                {/* Role */}
                <p className={styles.memberRole}>
                  {member.role}
                </p>
              </div>
            ))}
          </div>

          {/* Organization Logo Section */}
          <div className={styles.organizationSection}>
            <p className={styles.organizationLabel}>
              En partenariat avec
            </p>
            <div className={styles.logoContainer}>
              <img
                src={partnerLogo}
                alt="Partenaire - Greta Nord-Isère"
                className={styles.logo}
                style={{ 
                  maxWidth: '250px', 
                  height: 'auto', 
                  filter: 'none', 
                  opacity: 1,
                  backgroundColor: 'white', /* Adding white bg just in case it's transparent text */
                  padding: '10px',
                  borderRadius: '8px'
                }}
              />
            </div>
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
