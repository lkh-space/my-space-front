import React from 'react';
import { NavLink } from 'react-router-dom';
import { WORKSPACE_NAV_ENTRIES } from '../../constants/navigation';

interface SideNavBarProps {
  onOpenCommandPalette: () => void;
}

export const SideNavBar: React.FC<SideNavBarProps> = ({ onOpenCommandPalette }) => {
  const standardNavItems = WORKSPACE_NAV_ENTRIES.filter(
    (item) => item.id !== 'ai-workspace'
  );
  const aiNavItem = WORKSPACE_NAV_ENTRIES.find(
    (item) => item.id === 'ai-workspace'
  );

  return (
    <aside className="side-navbar" aria-label="메인 사이드바 네비게이션">
      {/* 1. Header with Brand & Version */}
      <div className="sidebar-header">
        <div className="brand-wrapper">
          <div className="brand-avatar" title="my-space developer workspace">
            μ
          </div>
          <div className="brand-title-group">
            <span className="brand-title">my-space</span>
          </div>
        </div>
        <div className="sidebar-version-badge" title="시스템 활성 버전">
          <span className="version-status-dot" />
          <span className="version-text">v0.1.0</span>
        </div>
      </div>

      {/* 2. Quick Command Palette Trigger Button (Jump to... ⌘K) */}
      <div className="sidebar-command-trigger-wrap">
        <button
          type="button"
          className="sidebar-command-trigger"
          onClick={onOpenCommandPalette}
          aria-label="명령어 검색 팔레트 열기 (단축키 ⌘K)"
        >
          <div className="command-trigger-left">
            <span className="material-symbols-outlined">search</span>
            <span>Jump to...</span>
          </div>
          <kbd className="command-kbd">⌘K</kbd>
        </button>
      </div>

      {/* 3. Standard Navigation Links */}
      <nav className="sidebar-nav-section">
        {standardNavItems.map((item) => (
          <NavLink
            key={item.id}
            to={item.path}
            end={item.end}
            title={item.title}
            className={({ isActive }) =>
              `nav-tab-item ${isActive ? 'active' : ''}`
            }
          >
            <span className="material-symbols-outlined nav-tab-icon">
              {item.icon}
            </span>
            <span className="nav-tab-label">{item.title}</span>
          </NavLink>
        ))}

        {/* AI STUDIO Section */}
        {aiNavItem && (
          <div className="sidebar-ai-section">
            <div className="ai-section-title">AI STUDIO</div>
            <NavLink
              to={aiNavItem.path}
              title={aiNavItem.title}
              className={({ isActive }) =>
                `nav-tab-item ai-tab-item ${isActive ? 'active' : ''}`
              }
            >
              <span className="material-symbols-outlined nav-tab-icon">
                {aiNavItem.icon}
              </span>
              <span className="nav-tab-label">{aiNavItem.title}</span>
              <span className="ai-active-indicator-dot" />
            </NavLink>
          </div>
        )}
      </nav>

      {/* 4. Engine Instance & Bottom Utilities Footer */}
      <div className="sidebar-footer">
        <div className="engine-instance-card">
          <div className="engine-instance-header">
            <span className="engine-instance-label">Engine Instance</span>
            <span className="engine-status-tag">
              <span className="engine-status-dot" />
              <span>ACTIVE</span>
            </span>
          </div>
          <div className="engine-instance-body">
            <span className="engine-host">localhost:8080</span>
            <span className="engine-type">WASM</span>
          </div>
        </div>

        <div className="sidebar-bottom-actions">
          <button
            type="button"
            className="sidebar-action-btn"
            title="Terminal"
            onClick={onOpenCommandPalette}
          >
            <span className="material-symbols-outlined">terminal</span>
            <span>Terminal</span>
          </button>
          <button
            type="button"
            className="sidebar-action-btn"
            title="Settings"
            onClick={onOpenCommandPalette}
          >
            <span className="material-symbols-outlined">settings</span>
            <span>Settings</span>
          </button>
        </div>
      </div>
    </aside>
  );
};
