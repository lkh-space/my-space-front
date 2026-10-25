import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import '../../../shared/i18n';
import { INSTALLED_UTILITIES } from '../../../shared/constants/navigation';

export const InstalledUtilitiesGrid: React.FC = () => {
  const { t } = useTranslation();

  return (
    <section aria-label={t('dashboard.gridAriaLabel')}>
      <div className="bento-grid">
        {INSTALLED_UTILITIES.map((util) => {
          const iconThemeClass = util.id.startsWith('pdf')
            ? 'pdf'
            : util.id.startsWith('dbml')
            ? 'dbml'
            : 'markdown';

          const cardTitle = t(`nav.entries.${util.id}.utilityTitle`, {
            defaultValue: util.utilityTitle ?? util.title,
          });
          const cardDescription = t(`nav.entries.${util.id}.description`, {
            defaultValue: util.description ?? '',
          });
          const cardLastUsed = t(`nav.entries.${util.id}.lastUsed`, {
            defaultValue: util.lastUsed ?? '',
          });

          return (
            <Link
              key={util.id}
              to={util.path}
              className="utility-card"
              aria-label={t('dashboard.openUtilityAria', { title: cardTitle })}
            >
              <div className="utility-card-top">
                <div className={`utility-icon-box ${iconThemeClass}`}>
                  <span className="material-symbols-outlined">
                    {util.icon}
                  </span>
                </div>
                {util.badge && <span className="utility-badge">{util.badge}</span>}
              </div>

              <h2 className="utility-title">{cardTitle}</h2>
              {cardDescription && <p className="utility-desc">{cardDescription}</p>}

              <div className="utility-footer">
                <span>{cardLastUsed}</span>
                <span className="utility-action-link">
                  <span>{t('dashboard.openToolLink')}</span>
                  <span className="material-symbols-outlined">
                    arrow_forward
                  </span>
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
};
