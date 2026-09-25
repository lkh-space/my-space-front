import React from 'react';
import { NavLink } from 'react-router-dom';

interface SideNavBarProps {
  onOpenCommandPalette: () => void;
}

interface NavItem {
  to: string;
  label: string;
  icon: string;
  badge?: string;
  end?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { to: '/', label: '대시보드', icon: 'dashboard', badge: 'Home', end: true },
  { to: '/pdf-tools', label: 'PDF 유틸리티', icon: 'picture_as_pdf', badge: 'v1.2' },
  { to: '/dbml-tools', label: 'DBML 유틸리티', icon: 'schema', badge: 'v0.9' },
  { to: '/docs', label: '마크다운 문서', icon: 'description', badge: 'Docs' },
];

export const SideNavBar: React.FC<SideNavBarProps> = ({ onOpenCommandPalette }) => {
  return (
    <aside className="side-navbar" aria-label="메인 사이드바 네비게이션">
      {/* 1. Header with Brand & Engine State */}
      <div className="sidebar-header">
        <div className="brand-wrapper">
          <div className="brand-avatar" title="my-space developer workspace">
            MS
          </div>
          <div className="brand-title-group">
            <span className="brand-title">my-space</span>
            <span className="brand-version">v0.1.0-local</span>
          </div>
        </div>
        <div className="sidebar-status-tag" title="엔진 대기 상태">
          <span className="sidebar-status-dot" />
          <span>IDLE</span>
        </div>
      </div>

      {/* 2. Quick Command Palette Trigger Button (Desktop Only) */}
      <div className="sidebar-command-trigger-wrap">
        <button
          type="button"
          className="sidebar-command-trigger"
          onClick={onOpenCommandPalette}
          aria-label="명령어 검색 팔레트 열기 (단축키 ⌘K)"
        >
          <div className="command-trigger-left">
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
              search
            </span>
            <span>도구 및 명령어 검색...</span>
          </div>
          <kbd className="command-kbd">⌘K</kbd>
        </button>
      </div>

      {/* 3. Navigation Links */}
      <nav className="sidebar-nav-section">
        <span className="nav-section-title">Utilities & Navigation</span>
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            title={item.label}
            className={({ isActive }) =>
              `nav-tab-item ${isActive ? 'active' : ''}`
            }
          >
            <span className="material-symbols-outlined nav-tab-icon">
              {item.icon}
            </span>
            <span className="nav-tab-label">{item.label}</span>
            {item.badge && <span className="nav-tab-badge">{item.badge}</span>}
          </NavLink>
        ))}
      </nav>

      {/* 4. Engine & Local Telemetry Footer */}
      <div className="sidebar-footer">
        <div className="telemetry-badge" title="Zero Telemetry Local Process">
          <span className="telemetry-badge-dot" />
          <span className="telemetry-badge-text">Zero Telemetry</span>
        </div>
        <div className="engine-runtime-meta">
          Local Process Engine<br />
          127.0.0.1:4200 (Strictly Local)
        </div>
      </div>
    </aside>
  );
};
