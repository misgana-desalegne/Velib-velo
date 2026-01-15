import React, { useState } from 'react';
import { VeloHeader } from '../shared/components/Header';
import { useLandingStyles } from '../shared/hooks/useLandingStyles';
import { BackgroundShell } from '../shared/components/BackgroundShell';
import styles from './LandingPage.module.css';

interface TeamMember {
  name: string;
  role: string;
  image: string;
}

interface VeloLandingPageProps {
  onNavigate: (page: 'landing' | 'login' | 'register' | 'dashboard') => void;
}

export const VeloLandingPage: React.FC<VeloLandingPageProps> = ({ onNavigate }) => {
  // Dynamically load landing page styles only when this component mounts
  useLandingStyles();

  // Use a public asset URL (served from frontend/public)
  const heroImageUrl = '/Data-Analysis-Dashboard/assets/img/hero/hero-5/velo1.png';

  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([
    { name: 'Sophie Moreau', role: 'Data Scientist', image: heroImageUrl },
    { name: 'Antoine Dubois', role: 'Développeur Full-Stack', image: '/Data-Analysis-Dashboard/assets/img/hero/hero-5/hero-img.svg' },
    { name: 'Claire Martin', role: 'Analyste Mobilité', image: '/Data-Analysis-Dashboard/assets/img/hero/hero-5/hero-bg.svg' },
  ]);

  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<TeamMember>({ name: '', role: '', image: '' });
  const [isAddingMember, setIsAddingMember] = useState(false);

  const handleEditClick = (index: number) => {
    setEditingIndex(index);
    setEditForm(teamMembers[index]);
    setIsAddingMember(false);
  };

  const handleAddClick = () => {
    setEditingIndex(null);
    setEditForm({ name: '', role: '', image: heroImageUrl });
    setIsAddingMember(true);
  };

  const handleSave = () => {
    if (!editForm.name.trim() || !editForm.role.trim()) {
      alert('Veuillez remplir tous les champs');
      return;
    }

    if (isAddingMember) {
      setTeamMembers([...teamMembers, editForm]);
    } else if (editingIndex !== null) {
      const updatedMembers = [...teamMembers];
      updatedMembers[editingIndex] = editForm;
      setTeamMembers(updatedMembers);
    }

    setEditingIndex(null);
    setIsAddingMember(false);
    setEditForm({ name: '', role: '', image: '' });
  };

  const handleCancel = () => {
    setEditingIndex(null);
    setIsAddingMember(false);
    setEditForm({ name: '', role: '', image: '' });
  };

  const handleDelete = (index: number) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce membre?')) {
      setTeamMembers(teamMembers.filter((_, i) => i !== index));
    }
  };

  return (
    <BackgroundShell>
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
              <div className={styles.teamTitleWrapper}>
                <h2 className={styles.teamTitle}>
                  Notre Équipe
                </h2>
                <button 
                  onClick={handleAddClick}
                  className={styles.addMemberButton}
                  title="Ajouter un membre"
                >
                  + Ajouter
                </button>
              </div>
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

                  {/* Edit/Delete Buttons */}
                  <div className={styles.memberActions}>
                    <button
                      onClick={() => handleEditClick(index)}
                      className={styles.editButton}
                      title="Éditer"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => handleDelete(index)}
                      className={styles.deleteButton}
                      title="Supprimer"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Edit Form Modal */}
            {(editingIndex !== null || isAddingMember) && (
              <div className={styles.editModalOverlay} onClick={handleCancel}>
                <div className={styles.editModal} onClick={(e) => e.stopPropagation()}>
                  <h3 className={styles.editModalTitle}>
                    {isAddingMember ? 'Ajouter un nouveau membre' : 'Éditer le membre'}
                  </h3>
                  
                  <div className={styles.formGroup}>
                    <label>Nom:</label>
                    <input
                      type="text"
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      placeholder="Nom du membre"
                      className={styles.formInput}
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label>Rôle:</label>
                    <input
                      type="text"
                      value={editForm.role}
                      onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                      placeholder="Rôle du membre"
                      className={styles.formInput}
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label>URL de l'image:</label>
                    <input
                      type="text"
                      value={editForm.image}
                      onChange={(e) => setEditForm({ ...editForm, image: e.target.value })}
                      placeholder="URL de l'image"
                      className={styles.formInput}
                    />
                  </div>

                  <div className={styles.formActions}>
                    <button onClick={handleSave} className={styles.saveButton}>
                      Enregistrer
                    </button>
                    <button onClick={handleCancel} className={styles.cancelButton}>
                      Annuler
                    </button>
                  </div>
                </div>
              </div>
            )}

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
    </BackgroundShell>
  );
};
