import React, { useMemo, useState } from 'react';
import { Github, Globe, Linkedin, Mail, Pencil, Save, X } from 'lucide-react';

import type { AppPage } from '../../shared/types/navigation';
import gretaLogo from '../../assets/images/Logo-Greta.png';
import kirosImage from '../../assets/images/img/clients/kiros.JPG';
import ruaImage from '../../assets/images/img/clients/rua.jpg';

export interface TeamMember {
  id: string;
  name: string;
  role?: string;
  imageUrl?: string;
  githubUrl?: string;
  linkedinUrl?: string;
  email?: string;
  websiteUrl?: string;
}

const STORAGE_KEY = 'parisCycle.teamMembers.v1';

const defaultMembers: TeamMember[] = [
  {
    id: 'kiros',
    name: 'Kiros',
    role: 'Data Scientist',
    imageUrl: kirosImage,
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
    imageUrl: '/Data-Analysis-Dashboard/assets/img/farial.png',
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

  const activeMember = useMemo(
    () => (editingId ? members.find((m) => m.id === editingId) ?? null : null),
    [editingId, members]
  );

  const startEdit = (member: TeamMember) => {
    setEditingId(member.id);
    setDraft({ ...member });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setDraft(null);
  };

  const commitEdit = () => {
    if (!draft) return;
    const updated = members.map(m => (m.id === draft.id ? { ...draft } : m));
    setMembers(updated);
    saveMembers(updated);
    cancelEdit();
  };

  return (
    <div className="w-full bg-gradient-to-b from-slate-50 via-white to-slate-50">
      <div className="mx-auto w-full max-w-6xl px-6 py-10">
        <div className="mb-8 grid gap-6 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-8">
            <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700">
              <span className="h-2 w-2 rounded-full bg-blue-600" />
              ParisCycle • Équipe
            </div>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-gray-900 sm:text-4xl">
              L’équipe derrière les analyses
            </h1>
            <p className="mt-3 max-w-2xl text-base text-gray-600">
              Découvrez les profils, contacts et liens. En mode connecté, vous pouvez mettre à jour les informations.
            </p>
          </div>

          <div className="lg:col-span-4 lg:justify-self-end">
            {isAuthenticated ? (
              <div className="flex items-center gap-3 rounded-2xl bg-white px-4 py-3 shadow-sm ring-1 ring-gray-200">
                <div className="h-2 w-2 rounded-full bg-green-500" />
                <div className="text-sm">
                  <div className="font-medium text-gray-900">Mode édition</div>
                  <div className="text-gray-600">Sauvegarde locale</div>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3 rounded-2xl bg-white px-4 py-3 shadow-sm ring-1 ring-gray-200">
                <div className="h-2 w-2 rounded-full bg-gray-400" />
                <div className="text-sm">
                  <div className="font-medium text-gray-900">Lecture seule</div>
                  <div className="text-gray-600">Connexion requise pour éditer</div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {members.map((member) => {
            const githubUrl = normalizeUrl(member.githubUrl);
            const linkedinUrl = normalizeUrl(member.linkedinUrl);
            const websiteUrl = normalizeUrl(member.websiteUrl);
            const mailUrl = member.email ? `mailto:${member.email}` : undefined;

            return (
              <div
                key={member.id}
                className="group relative overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-gray-200 transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-600 via-sky-500 to-red-500 opacity-70" />

                <div className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-4">
                      {member.imageUrl ? (
                        <img
                          src={member.imageUrl}
                          alt={member.name}
                          className="h-20 w-20 rounded-full object-cover ring-2 ring-gray-200 flex-shrink-0"
                        />
                      ) : (
                        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-blue-100 to-sky-100 text-lg font-bold text-gray-700 ring-2 ring-gray-200 flex-shrink-0">
                          {initials(member.name)}
                        </div>
                      )}

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h2 className="truncate text-lg font-semibold text-gray-900">{member.name}</h2>
                          {member.id === 'farial' && onNavigate && (
                            <button
                              type="button"
                              className="rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 hover:bg-blue-100"
                              onClick={() => onNavigate('farial')}
                              title="Ouvrir le profil détaillé"
                            >
                              Voir profil
                            </button>
                          )}
                        </div>
                        {member.role ? (
                          <p className="mt-1 text-sm text-gray-600">{member.role}</p>
                        ) : (
                          <p className="mt-1 text-sm text-gray-500">Rôle à définir</p>
                        )}
                      </div>
                    </div>

                    {isAuthenticated && (
                      <button
                        type="button"
                        className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-900 shadow-sm transition hover:bg-gray-50"
                        onClick={() => startEdit(member)}
                        title="Modifier"
                      >
                        <Pencil className="h-4 w-4" />
                        Éditer
                      </button>
                    )}
                  </div>

                  <div className="mt-5 flex flex-wrap gap-2">
                    {githubUrl && (
                      <a
                        href={githubUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        title="GitHub"
                      >
                        <Github className="h-4 w-4" />
                        GitHub
                      </a>
                    )}
                    {linkedinUrl && (
                      <a
                        href={linkedinUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        title="LinkedIn"
                      >
                        <Linkedin className="h-4 w-4" />
                        LinkedIn
                      </a>
                    )}
                    {websiteUrl && (
                      <a
                        href={websiteUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        title="Site web"
                      >
                        <Globe className="h-4 w-4" />
                        Site
                      </a>
                    )}
                    {mailUrl && (
                      <a
                        href={mailUrl}
                        className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        title="Email"
                      >
                        <Mail className="h-4 w-4" />
                        Email
                      </a>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {isAuthenticated && (
          <div className="mt-6 text-xs text-gray-500">
            Les modifications sont sauvegardées dans votre navigateur (localStorage).
          </div>
        )}
      </div>

      {isAuthenticated && editingId && draft && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={cancelEdit}
            aria-hidden="true"
          />

          <div
            role="dialog"
            aria-modal="true"
            className="relative w-full max-w-2xl overflow-hidden rounded-3xl bg-white shadow-xl ring-1 ring-gray-200"
          >
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <div>
                <div className="text-sm font-medium text-gray-500">Édition profil</div>
                <div className="text-lg font-semibold text-gray-900">{activeMember?.name ?? draft.name}</div>
              </div>
              <button
                type="button"
                className="rounded-xl p-2 text-gray-600 hover:bg-gray-100"
                onClick={cancelEdit}
                title="Fermer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid gap-4 px-6 py-5 sm:grid-cols-2">
              <label className="grid gap-1 text-sm">
                <span className="font-medium text-gray-700">Nom</span>
                <input
                  className="rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  value={draft.name}
                  onChange={(e) => setDraft((d) => (d ? { ...d, name: e.target.value } : d))}
                  placeholder="Nom"
                />
              </label>

              <label className="grid gap-1 text-sm">
                <span className="font-medium text-gray-700">Rôle</span>
                <input
                  className="rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  value={draft.role ?? ''}
                  onChange={(e) => setDraft((d) => (d ? { ...d, role: e.target.value } : d))}
                  placeholder="Ex: Data Scientist"
                />
              </label>

              <label className="grid gap-1 text-sm sm:col-span-2">
                <span className="font-medium text-gray-700">Image URL</span>
                <input
                  className="rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  value={draft.imageUrl ?? ''}
                  onChange={(e) => setDraft((d) => (d ? { ...d, imageUrl: e.target.value } : d))}
                  placeholder="https://..."
                />
                <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <label className="inline-flex cursor-pointer items-center gap-2 text-sm font-medium text-blue-700 hover:text-blue-800">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.currentTarget.files?.[0];
                        e.currentTarget.value = '';
                        if (!file) return;

                        try {
                          const dataUrl = await fileToDataUrl(file);
                          setDraft((d) => (d ? { ...d, imageUrl: dataUrl } : d));
                        } catch {
                          // Ignore and keep current imageUrl
                        }
                      }}
                    />
                    <span className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-gray-900">
                      <span className="text-blue-700">Importer une image</span>
                      <span className="text-xs font-normal text-gray-600">(PNG/JPG/WebP)</span>
                    </span>
                  </label>

                  <button
                    type="button"
                    className="rounded-xl border border-gray-200 px-3 py-2 text-sm font-medium text-gray-900 hover:bg-gray-50"
                    onClick={() => setDraft((d) => (d ? { ...d, imageUrl: undefined } : d))}
                    disabled={!draft.imageUrl}
                    title={!draft.imageUrl ? 'Aucune image à supprimer' : 'Supprimer l\'image'}
                  >
                    Supprimer l'image
                  </button>
                </div>

                {draft.imageUrl && (
                  <div className="mt-3 flex items-center gap-3 rounded-2xl bg-slate-50 p-3 ring-1 ring-gray-200">
                    <img
                      src={draft.imageUrl}
                      alt="Aperçu"
                      className="h-14 w-14 rounded-2xl object-cover ring-1 ring-gray-200"
                    />
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-gray-900">Aperçu</div>
                      <div className="truncate text-xs text-gray-600">
                        {draft.imageUrl.startsWith('data:') ? 'Image importée (stockée localement)' : draft.imageUrl}
                      </div>
                    </div>
                  </div>
                )}
              </label>

              <label className="grid gap-1 text-sm">
                <span className="font-medium text-gray-700">GitHub</span>
                <input
                  className="rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  value={draft.githubUrl ?? ''}
                  onChange={(e) => setDraft((d) => (d ? { ...d, githubUrl: e.target.value } : d))}
                  placeholder="https://github.com/..."
                />
              </label>

              <label className="grid gap-1 text-sm">
                <span className="font-medium text-gray-700">LinkedIn</span>
                <input
                  className="rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  value={draft.linkedinUrl ?? ''}
                  onChange={(e) => setDraft((d) => (d ? { ...d, linkedinUrl: e.target.value } : d))}
                  placeholder="https://linkedin.com/in/..."
                />
              </label>

              <label className="grid gap-1 text-sm">
                <span className="font-medium text-gray-700">Email</span>
                <input
                  className="rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  value={draft.email ?? ''}
                  onChange={(e) => setDraft((d) => (d ? { ...d, email: e.target.value } : d))}
                  placeholder="nom@domaine.com"
                />
              </label>

              <label className="grid gap-1 text-sm">
                <span className="font-medium text-gray-700">Site web</span>
                <input
                  className="rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  value={draft.websiteUrl ?? ''}
                  onChange={(e) => setDraft((d) => (d ? { ...d, websiteUrl: e.target.value } : d))}
                  placeholder="https://..."
                />
              </label>
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-gray-100 px-6 py-4 sm:flex-row sm:items-center sm:justify-end">
              <button
                type="button"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-900 hover:bg-gray-50"
                onClick={cancelEdit}
              >
                Annuler
              </button>
              <button
                type="button"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                onClick={commitEdit}
                disabled={!draft?.name?.trim()}
                title={!draft?.name?.trim() ? 'Le nom est requis' : 'Enregistrer'}
              >
                <Save className="h-4 w-4" />
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
