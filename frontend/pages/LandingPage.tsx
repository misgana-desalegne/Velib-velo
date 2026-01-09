import React from 'react';
import { VeloHeader } from '../shared/components/Header';
import { useLandingStyles } from '../shared/hooks/useLandingStyles';
import styles from './LandingPage.module.css';

interface VeloLandingPageProps {
  onNavigate: (page: 'landing' | 'login' | 'register' | 'dashboard') => void;
}

export const VeloLandingPage: React.FC<VeloLandingPageProps> = ({ onNavigate }) => {
  // Dynamically load landing page styles only when this component mounts
  useLandingStyles();

  // Use a public asset URL (served from frontend/public)
  const heroImageUrl = '/Data-Analysis-Dashboard/assets/img/hero/hero-5/velo1.png';

  const teamMembers = [
    { name: 'Sophie Moreau', role: 'Data Scientist', image: heroImageUrl },
    { name: 'Antoine Dubois', role: 'Développeur Full-Stack', image: '/Data-Analysis-Dashboard/assets/img/hero/hero-5/hero-img.svg' },
    { name: 'Claire Martin', role: 'Analyste Mobilité', image: '/Data-Analysis-Dashboard/assets/img/hero/hero-5/hero-bg.svg' },
  ];

  return (
    <div className={styles.container}>
      {/* Background Image Layer - Zoomed and positioned */}
      <div 
        className={styles.backgroundImage}
        style={{ backgroundImage: `url(${heroImageUrl})` }}
      />

      {/* Modern gradient overlay */}
      <div className={styles.gradientOverlay} />

      {/* Header */}
      <div className={styles.header}>
        <VeloHeader onNavigate={onNavigate} isAuthenticated={false} onLogout={() => {}} />
      </div>

      {/* Main Content */}
      <div className={styles.mainContent}>
        <div className={styles.contentWrapper}>
          {/* Modern badge */}
          <div className={styles.badge}>
            <span className={styles.badgeText}>
              🚴 Mobilité Urbaine Intelligente
            </span>
          </div>

          <h1 className={styles.title}>
            ParisCycle
            <br />
            <span className={styles.titleAccent}>
              Analytics
            </span>
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
              <div key={index} className={styles.teamCard}>
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
                src="/Data-Analysis-Dashboard/assets/img/logo/logo.svg"
                alt="Organisation Logo"
                className={styles.logo}
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
