import React from 'react';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import '../../shared/i18n';
import { WORKSPACE_NAV_ENTRIES } from '../../shared/constants/navigation';

export const BottomNavBar: React.FC = () => {
  const { t } = useTranslation();
  return (
    <nav className="bottom-navbar" aria-label={t('sidebar.bottomNavAria')}>
      {WORKSPACE_NAV_ENTRIES.map((item) => (
        <NavLink
          key={item.id}
          to={item.path}
          end={item.end}
          className={({ isActive }) =>
            `bottom-tab-item ${isActive ? 'active' : ''}`
          }
        >
          <span className="material-symbols-outlined bottom-tab-icon">
            {item.icon}
          </span>
          <span className="bottom-tab-label">
            {t(`nav.entries.${item.id}.shortLabel`)}
          </span>
        </NavLink>
      ))}
    </nav>
  );
};
