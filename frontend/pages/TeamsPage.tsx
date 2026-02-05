import React from 'react';
import { TeamsView } from '../features/teams/TeamsView';
import { VeloHeader } from '../shared/components/Header';
import type { AppPage } from '../shared/types/navigation';

export function TeamsPage({
  isAuthenticated,
  onNavigate,
}: {
  isAuthenticated: boolean;
  onNavigate: (page: AppPage) => void;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <VeloHeader
        variant="landing"
        isAuthenticated={isAuthenticated}
        onNavigate={onNavigate}
      />
      <main>
        <TeamsView onNavigate={onNavigate} canEdit={isAuthenticated} />
      </main>
    </div>
  );
}
