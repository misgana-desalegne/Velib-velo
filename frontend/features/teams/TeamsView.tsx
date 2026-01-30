import React, { useMemo, useState, useEffect } from 'react';
import { Github, Globe, Linkedin, Mail, Pencil, Trash2, Plus, Save, X, AlertCircle, FileText } from 'lucide-react';

import type { AppPage } from '../../shared/types/navigation';
import { API_ENDPOINTS } from '../../api/config';
import gretaLogo from '../../assets/images/Logo-Greta.png';
import kirosImage from '../../assets/images/img/clients/kiros.JPG';
import ruaImage from '../../assets/images/img/clients/rua.jpg';
import farialImage from '../../assets/images/img/clients/Farial.png';
import styles from './TeamsView.module.css';

export interface TeamMember {
  id: string;
  name: string;
  role?: string;
  imageUrl?: string;
  githubUrl?: string;
  linkedinUrl?: string;
  email?: string;
  websiteUrl?: string;
  cvUrl?: string;
}

const STORAGE_KEY = 'parisCycle.teamMembers.v1';

const defaultMembers: TeamMember[] = [
  {
    id: 'kiros',
    name: 'Kiros',
    role: 'Data Scientist',
    imageUrl: kirosImage,
    githubUrl: 'https://github.com/misgana-desalegne',
    linkedinUrl: 'https://www.linkedin.com/in/misgana-desalegne/',
    websiteUrl: 'https://www.kirosit.fr/portfolio',
  },
  {
    id: 'roua',
    name: 'Rabbeg Roua',
    role: 'Analyste Mobilité',
    imageUrl: ruaImage,
    githubUrl: 'https://github.com/rabbegdev',
    linkedinUrl: 'https://www.linkedin.com/in/rabbeg-roua-120114259/',
  },
  {
    id: 'farial',
    name: 'Farial',
    role: 'Professional Prompter',
    imageUrl: farialImage,
    githubUrl: 'https://github.com/farialhuda-Bapon'
  },
  {
    id: 'greta',
    name: 'Greta',
    role: 'Partenaire',
    imageUrl: gretaLogo,
  },
];

function loadMembers(): TeamMember[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultMembers;
    const parsed = JSON.parse(raw) as TeamMember[];
    if (!Array.isArray(parsed)) return defaultMembers;
    return parsed;
  } catch {
    return defaultMembers;
  }
}

function saveMembers(members: TeamMember[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(members));
}

// Fetch members from backend on mount; fall back to localStorage if unavailable

function toApiPayload(d: TeamMember) {
  return {
    name: d.name,
    role: d.role ?? '',
    image_url: d.imageUrl ?? null,
    github_url: d.githubUrl ?? null,
    linkedin_url: d.linkedinUrl ?? null,
    email: d.email ?? null,
    website_url: d.websiteUrl ?? null,
    cv_url: d.cvUrl ?? null,
  };
}

function fromApiMember(api: any): TeamMember {
  return {
    id: String(api.id),
    name: api.name || '',
    role: api.role || '',
    imageUrl: api.image_url || undefined,
    githubUrl: api.github_url || undefined,
    linkedinUrl: api.linkedin_url || undefined,
    email: api.email || undefined,
    websiteUrl: api.website_url || undefined,
    cvUrl: api.cv_url || undefined,
  };
}

function isUuid(id?: string) {
  if (!id) return false;
  // simple hyphenated UUID v4-ish check
  return /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(id);
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/g).filter(Boolean);
  return parts.slice(0, 2).map(p => p[0]?.toUpperCase()).join('') || '?';
}

function normalizeUrl(url?: string): string | undefined {
  if (!url) return undefined;
  const trimmed = url.trim();
  if (!trimmed) return undefined;
  if (/^https?:\/\//i.test(trimmed) || /^mailto:/i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.onload = () => resolve(String(reader.result));
    reader.readAsDataURL(file);
  });
}

export function TeamsView({
  onNavigate,
  canEdit,
}: {
  onNavigate?: (page: AppPage) => void;
  canEdit?: boolean;
}) {
  const isAuthenticated = canEdit ?? (localStorage.getItem('isAuthenticated') === 'true');
  const [members, setMembers] = useState<TeamMember[]>(() => loadMembers());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<TeamMember | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  const activeMember = useMemo(
    () => (editingId ? members.find((m) => m.id === editingId) ?? null : null),
    [editingId, members]
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
          const res = await fetch(API_ENDPOINTS.teamMembers || '/api/team-members/');
        if (!res.ok) return;
        const data = await res.json();
        if (cancelled) return;
        if (Array.isArray(data)) {
          const mapped = data.map(fromApiMember);
          setMembers(mapped);
          saveMembers(mapped);
        }
      } catch (e) {
        // ignore, keep local
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const startEdit = (member: TeamMember) => {
    setEditingId(member.id);
    setDraft({ ...member });
    setIsAdding(false);
  };

  const startAdd = () => {
    const newId = `member-${Date.now()}`;
    const newMember: TeamMember = {
      id: newId,
      name: '',
      role: '',
    };
    setDraft(newMember);
    setEditingId(newId);
    setIsAdding(true);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setDraft(null);
    setIsAdding(false);
  };

  const commitEdit = async () => {
    if (!draft || !draft.name?.trim()) return;

    try {
      if (isAdding) {
        // Try to persist to backend
        const res = await fetch(API_ENDPOINTS.teamMembers || '/api/team-members/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(toApiPayload(draft)),
        });
        if (res.ok) {
          const created = await res.json();
          const createdMember = fromApiMember(created);
          const newMembers = [...members, createdMember];
          setMembers(newMembers);
          saveMembers(newMembers);
        } else {
          const newMembers = [...members, draft];
          setMembers(newMembers);
          saveMembers(newMembers);
        }
        } else {
        // Update
        if (draft.id && isUuid(draft.id)) {
          const res = await fetch(`${(API_ENDPOINTS.teamMembers || '/api/team-members/').replace(/\/$/, '')}/${draft.id}/`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(toApiPayload(draft)),
          });
          if (res.ok) {
            const updatedApi = await res.json();
            const updatedMember = fromApiMember(updatedApi);
            const updated = members.map(m => (m.id === updatedMember.id ? updatedMember : m));
            setMembers(updated);
            saveMembers(updated);
          } else {
            const updated = members.map(m => (m.id === draft.id ? { ...draft } : m));
            setMembers(updated);
            saveMembers(updated);
          }
        } else {
          const updated = members.map(m => (m.id === draft.id ? { ...draft } : m));
          setMembers(updated);
          saveMembers(updated);
        }
      }
    } catch (err) {
      // fallback to local change
      if (isAdding) {
        const newMembers = [...members, draft];
        setMembers(newMembers);
        saveMembers(newMembers);
      } else {
        const updated = members.map(m => (m.id === draft.id ? { ...draft } : m));
        setMembers(updated);
        saveMembers(updated);
      }
    }

    cancelEdit();
  };

  const handleDelete = async (id: string) => {
    try {
      if (isUuid(id)) {
        await fetch(`${(API_ENDPOINTS.teamMembers || '/api/team-members/').replace(/\/$/, '')}/${id}/`, { method: 'DELETE' });
      }
    } catch (e) {
      // ignore
    }
    const updated = members.filter(m => m.id !== id);
    setMembers(updated);
    saveMembers(updated);
    setDeleteConfirm(null);
  };

  return (
    <div className={styles.container}>
      {/* Header Section */}
      <div className={styles.headerSection}>
        <div className={styles.headerContent}>
          <div className={styles.headerBadge}>
            <div className={styles.badgeDot} />
            <span>ParisCycle • Équipe</span>
          </div>
          <h1 className={styles.headerTitle}>L'équipe qui pilote les analyses</h1>
          <p className={styles.headerDescription}>
            Experts en mobilité urbaine et analyse de données. Nous transformons les données de Vélib' en insights 
            actionnables pour une meilleure compréhension de la mobilité parisienne.
          </p>
        </div>

        {isAuthenticated && (
          <button
            onClick={startAdd}
            className={styles.addButton}
            title="Ajouter un membre"
          >
            <Plus className={styles.addButtonIcon} />
            <span>Ajouter un membre</span>
          </button>
        )}
      </div>

      {/* Team Grid */}
      <div className={styles.gridContainer}>
        {members.map((member) => {
          const githubUrl = normalizeUrl(member.githubUrl);
          const linkedinUrl = normalizeUrl(member.linkedinUrl);
          const websiteUrl = normalizeUrl(member.websiteUrl);
          const mailUrl = member.email ? `mailto:${member.email}` : undefined;

          return (
            <div key={member.id} className={styles.teamCard}>
              {/* Gradient Bar */}
              <div className={styles.cardGradientBar} />

              {/* Content */}
              <div className={styles.cardContent}>
                {/* Avatar Section */}
                <div className={styles.avatarWrapper}>
                  {member.imageUrl ? (
                    <img
                      src={member.imageUrl}
                      alt={member.name}
                      className={styles.avatar}
                    />
                  ) : (
                    <div className={styles.avatarPlaceholder}>
                      {initials(member.name)}
                    </div>
                  )}
                </div>

                {/* Info Section */}
                <div className={styles.infoSection}>
                  <div className={styles.nameRow}>
                    <h2 className={styles.memberName}>{member.name}</h2>
                    {member.id === 'farial' && onNavigate && (
                      <button
                        type="button"
                        className={styles.profileButton}
                        onClick={() => onNavigate('farial')}
                        title="Ouvrir le profil détaillé"
                      >
                        Profil
                      </button>
                    )}
                  </div>

                  {member.role ? (
                    <p className={styles.memberRole}>{member.role}</p>
                  ) : (
                    <p className={styles.memberRoleEmpty}>Rôle à définir</p>
                  )}
                </div>

                {/* Actions */}
                {isAuthenticated && (
                  <div className={styles.cardActions}>
                    <button
                      type="button"
                      className={styles.editButton}
                      onClick={() => startEdit(member)}
                      title="Modifier"
                    >
                      <Pencil className={styles.editIcon} />
                    </button>
                    <button
                      type="button"
                      className={styles.deleteButton}
                      onClick={() => setDeleteConfirm(member.id)}
                      title="Supprimer"
                    >
                      <Trash2 className={styles.deleteIcon} />
                    </button>
                  </div>
                )}
              </div>

              {/* Social Links */}
              <div className={styles.socialLinks}>
                {githubUrl && (
                  <a
                    href={githubUrl}
                    target="_blank"
                    rel="noreferrer"
                    className={styles.socialLink}
                    title="GitHub"
                  >
                    <Github className={styles.socialIcon} />
                  </a>
                )}
                {linkedinUrl && (
                  <a
                    href={linkedinUrl}
                    target="_blank"
                    rel="noreferrer"
                    className={styles.socialLink}
                    title="LinkedIn"
                  >
                    <Linkedin className={styles.socialIcon} />
                  </a>
                )}
                {websiteUrl && (
                  <a
                    href={websiteUrl}
                    target="_blank"
                    rel="noreferrer"
                    className={styles.socialLink}
                    title="Site web"
                  >
                    <Globe className={styles.socialIcon} />
                  </a>
                )}
                {mailUrl && (
                  <a
                    href={mailUrl}
                    className={styles.socialLink}
                    title="Email"
                  >
                    <Mail className={styles.socialIcon} />
                  </a>
                )}
                {member.cvUrl && (
                  <a href={member.cvUrl} target="_blank" rel="noreferrer" className={styles.socialLink} title="CV">
                    <FileText className={styles.socialIcon} />
                  </a>
                )}
              </div>

              {/* Delete Confirmation */}
              {deleteConfirm === member.id && isAuthenticated && (
                <div className={styles.deleteConfirmation}>
                  <AlertCircle className={styles.confirmIcon} />
                  <div>
                    <p className={styles.confirmText}>Supprimer ce membre ?</p>
                    <p className={styles.confirmSubtext}>{member.name}</p>
                  </div>
                  <div className={styles.confirmActions}>
                    <button
                      onClick={() => setDeleteConfirm(null)}
                      className={styles.confirmCancel}
                    >
                      Annuler
                    </button>
                    <button
                      onClick={() => handleDelete(member.id)}
                      className={styles.confirmDelete}
                    >
                      Supprimer
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Info Footer */}
   

      {/* Edit Modal */}
      {isAuthenticated && editingId && draft && (
        <div className={styles.modalOverlay} onClick={cancelEdit}>
          <div
            className={styles.modalDialog}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            {/* Modal Header */}
            <div className={styles.modalHeader}>
              <div>
                <p className={styles.modalLabel}>
                  {isAdding ? 'Ajouter un nouveau membre' : 'Éditer le profil'}
                </p>
                <h2 className={styles.modalTitle}>
                  {isAdding ? 'Nouveau membre' : draft.name}
                </h2>
              </div>
              <button
                type="button"
                className={styles.modalCloseButton}
                onClick={cancelEdit}
                title="Fermer"
              >
                <X className={styles.modalCloseIcon} />
              </button>
            </div>

            {/* Modal Form */}
            <div className={styles.modalForm}>
              {/* Row 1: Name and Role */}
              <div className={styles.formRow}>
                <label className={styles.formGroup}>
                  <span className={styles.formLabel}>Nom *</span>
                  <input
                    type="text"
                    className={styles.formInput}
                    value={draft.name}
                    onChange={(e) => setDraft((d) => (d ? { ...d, name: e.target.value } : d))}
                    placeholder="Nom complet"
                    autoFocus
                  />
                </label>

                <label className={styles.formGroup}>
                  <span className={styles.formLabel}>Rôle</span>
                  <input
                    type="text"
                    className={styles.formInput}
                    value={draft.role ?? ''}
                    onChange={(e) => setDraft((d) => (d ? { ...d, role: e.target.value } : d))}
                    placeholder="Ex: Data Scientist"
                  />
                </label>
              </div>

              {/* Row 2: Image URL */}
              <label className={styles.formGroup}>
                <span className={styles.formLabel}>Image</span>
                <div className={styles.imageInputContainer}>
                  <input
                    type="text"
                    className={styles.formInput}
                    value={draft.imageUrl ?? ''}
                    onChange={(e) => setDraft((d) => (d ? { ...d, imageUrl: e.target.value } : d))}
                    placeholder="https://..."
                  />
                  <label className={styles.imageUploadButton}>
                    <input
                      type="file"
                      accept="image/*"
                      className={styles.fileInput}
                      onChange={async (e) => {
                        const file = e.currentTarget.files?.[0];
                        e.currentTarget.value = '';
                        if (!file) return;
                        try {
                          const dataUrl = await fileToDataUrl(file);
                          setDraft((d) => (d ? { ...d, imageUrl: dataUrl } : d));
                        } catch {
                          // Ignore error
                        }
                      }}
                    />
                    <span>Importer</span>
                  </label>
                </div>

                {/* Image Preview */}
                {draft.imageUrl && (
                  <div className={styles.imagePreview}>
                    <img
                      src={draft.imageUrl}
                      alt="Aperçu"
                      className={styles.previewImage}
                    />
                    <div>
                      <p className={styles.previewTitle}>Aperçu</p>
                      <p className={styles.previewUrl}>
                        {draft.imageUrl.startsWith('data:')
                          ? 'Image importée (stockée localement)'
                          : draft.imageUrl}
                      </p>
                    </div>
                    <button
                      type="button"
                      className={styles.clearImageButton}
                      onClick={() => setDraft((d) => (d ? { ...d, imageUrl: undefined } : d))}
                      title="Supprimer l'image"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}

                {/* CV Importer */}
                <label className={styles.formGroup}>
                  <span className={styles.formLabel}>CV (PDF/DOC)</span>
                  <div className={styles.imageInputContainer}>
                    <input
                      type="text"
                      className={styles.formInput}
                      value={draft.cvUrl ?? ''}
                      onChange={(e) => setDraft((d) => (d ? { ...d, cvUrl: e.target.value } : d))}
                      placeholder="Lien vers CV ou importer un fichier"
                    />
                    <label className={styles.imageUploadButton}>
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx"
                        className={styles.fileInput}
                        onChange={async (e) => {
                          const file = e.currentTarget.files?.[0];
                          e.currentTarget.value = '';
                          if (!file) return;
                          try {
                            const dataUrl = await fileToDataUrl(file);
                            setDraft((d) => (d ? { ...d, cvUrl: dataUrl } : d));
                          } catch {
                            // Ignore error
                          }
                        }}
                      />
                      <span>Importer CV</span>
                    </label>
                  </div>

                  {/* CV Preview */}
                  {draft.cvUrl && (
                    <div className={styles.imagePreview}>
                      <div className={styles.cvPreviewInfo}>
                        <FileText className={styles.previewIcon} />
                        <div>
                          <p className={styles.previewTitle}>CV importé</p>
                          <p className={styles.previewUrl}>{draft.cvUrl.startsWith('data:') ? 'Fichier importé (stocké localement)' : draft.cvUrl}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <a href={draft.cvUrl} target="_blank" rel="noreferrer" className={styles.openCvLink}>Ouvrir</a>
                        <button
                          type="button"
                          className={styles.clearImageButton}
                          onClick={() => setDraft((d) => (d ? { ...d, cvUrl: undefined } : d))}
                          title="Supprimer le CV"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </label>
              </label>

              {/* Row 3: Links */}
              <div className={styles.formRow}>
                <label className={styles.formGroup}>
                  <span className={styles.formLabel}>GitHub</span>
                  <input
                    type="text"
                    className={styles.formInput}
                    value={draft.githubUrl ?? ''}
                    onChange={(e) => setDraft((d) => (d ? { ...d, githubUrl: e.target.value } : d))}
                    placeholder="https://github.com/..."
                  />
                </label>

                <label className={styles.formGroup}>
                  <span className={styles.formLabel}>LinkedIn</span>
                  <input
                    type="text"
                    className={styles.formInput}
                    value={draft.linkedinUrl ?? ''}
                    onChange={(e) => setDraft((d) => (d ? { ...d, linkedinUrl: e.target.value } : d))}
                    placeholder="https://linkedin.com/in/..."
                  />
                </label>
              </div>

              {/* Row 4: Site and Email */}
              <div className={styles.formRow}>
                <label className={styles.formGroup}>
                  <span className={styles.formLabel}>Site web</span>
                  <input
                    type="text"
                    className={styles.formInput}
                    value={draft.websiteUrl ?? ''}
                    onChange={(e) => setDraft((d) => (d ? { ...d, websiteUrl: e.target.value } : d))}
                    placeholder="https://..."
                  />
                </label>

                <label className={styles.formGroup}>
                  <span className={styles.formLabel}>Email</span>
                  <input
                    type="email"
                    className={styles.formInput}
                    value={draft.email ?? ''}
                    onChange={(e) => setDraft((d) => (d ? { ...d, email: e.target.value } : d))}
                    placeholder="nom@domaine.com"
                  />
                </label>
              </div>
            </div>

            {/* Modal Footer */}
            <div className={styles.modalFooter}>
              <button
                type="button"
                className={styles.cancelButton}
                onClick={cancelEdit}
              >
                Annuler
              </button>
              <button
                type="button"
                className={styles.saveButton}
                onClick={commitEdit}
                disabled={!draft?.name?.trim()}
                title={!draft?.name?.trim() ? 'Le nom est requis' : 'Enregistrer'}
              >
                <Save className={styles.saveIcon} />
                <span>Enregistrer</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
