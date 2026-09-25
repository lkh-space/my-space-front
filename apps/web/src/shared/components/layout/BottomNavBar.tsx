import React from 'react';
import { NavLink } from 'react-router-dom';

interface BottomNavItem {
  to: string;
  label: string;
  icon: string;
  end?: boolean;
}

const BOTTOM_NAV_ITEMS: BottomNavItem[] = [
  { to: '/', label: '대시보드', icon: 'dashboard', end: true },
  { to: '/pdf-tools', label: 'PDF 도구', icon: 'picture_as_pdf' },
  { to: '/dbml-tools', label: 'DBML', icon: 'schema' },
  { to: '/docs', label: '문서', icon: 'description' },
];

export const BottomNavBar: React.FC = () => {
  return (
    <nav className="bottom-navbar" aria-label="모바일 하단 네비게이션">
      {BOTTOM_NAV_ITEMS.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          className={({ isActive }) =>
            `bottom-tab-item ${isActive ? 'active' : ''}`
          }
        >
          {({ isActive }) => (
            <>
              <span
                className="material-symbols-outlined bottom-tab-icon"
                style={{
                  fontVariationSettings: isActive ? "'FILL' 1, 'wght' 400" : "'FILL' 0, 'wght' 400",
                }}
              >
                {item.icon}
              </span>
              <span className="bottom-tab-label">{item.label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
};
