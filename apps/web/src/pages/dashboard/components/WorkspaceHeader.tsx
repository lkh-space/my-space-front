import React from 'react';
import { useTranslation } from 'react-i18next';
import '../../../shared/i18n';

export const WorkspaceHeader: React.FC = () => {
  const { t } = useTranslation();

  return (
    <section className="workspace-header" aria-labelledby="workspace-heading">
      <div className="workspace-title-group">
        <h1 id="workspace-heading">{t('dashboard.headerTitle')}</h1>
        <p>{t('dashboard.headerSubtitle')}</p>
      </div>

      <div
        className="isolation-status-chip"
        title={t('dashboard.isolationChipTitle')}
      >
        <span className="status-dot" />
        <span>{t('dashboard.isolationChipLabel')}</span>
        <span className="status-code">Zero Telemetry</span>
      </div>
    </section>
  );
};
