import React from 'react';
import { NavLink } from 'react-router-dom';
import { WORKSPACE_NAV_ENTRIES } from '../../constants/navigation';

export const BottomNavBar: React.FC = () => {
  return (
    <nav className="bottom-navbar" aria-label="모바일 하단 네비게이션">
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
          <span className="bottom-tab-label">{item.shortLabel}</span>
        </NavLink>
      ))}
    </nav>
  );
};
