import React from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getBreadcrumbByPath } from '../../../shared/constants/navigation';
import { setAppLanguage } from '../../../shared/i18n';
import { UserProfileBadge } from './UserProfileBadge';
import { VersionBadge } from './VersionBadge';
import './header.css';

export interface HeaderProps {
  onOpenCommandPalette: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenCommandPalette }) => {
  const location = useLocation();
  const { t, i18n } = useTranslation();

  const currentLang = i18n.resolvedLanguage === 'en' ? 'EN' : 'KR';
  const { category, page } = getBreadcrumbByPath(location.pathname, t);

  return (
    <header className="top-navbar" aria-label={t('header.ariaLabel')}>
      {/* 1-A. Desktop & Tablet Breadcrumbs */}
      <div className="top-breadcrumbs">
        <span className="breadcrumb-root">my-space</span>
        <span className="breadcrumb-separator">/</span>
        <span className="breadcrumb-category">{category}</span>
        <span className="breadcrumb-separator">/</span>
        <span className="breadcrumb-current">{page}</span>
      </div>

      {/* 1-B. Mobile Brand & Terminal Trigger Header (Shown on < 768px) */}
      <div className="top-mobile-brand">
        <button
          type="button"
          className="mobile-terminal-btn"
          onClick={onOpenCommandPalette}
          title={t('header.mobileTerminalTitle')}
          aria-label={t('header.mobileTerminalAria')}
        >
          <span className="material-symbols-outlined">terminal</span>
        </button>
        <span className="mobile-brand-title">my-space</span>
        <span className="mobile-brand-version">v0.1</span>
      </div>

      {/* 2. Right Action Cluster */}
      <div className="top-actions-cluster">
        {/* Language Switcher (Desktop & Tablet) */}
        <div
          className="lang-toggle-segment"
          role="group"
          aria-label={t('header.langSwitchAria')}
        >
          <button
            type="button"
            className={`lang-btn ${currentLang === 'KR' ? 'active' : ''}`}
            onClick={() => void setAppLanguage('ko')}
            aria-pressed={currentLang === 'KR'}
          >
            KR
          </button>
          <button
            type="button"
            className={`lang-btn ${currentLang === 'EN' ? 'active' : ''}`}
            onClick={() => void setAppLanguage('en')}
            aria-pressed={currentLang === 'EN'}
          >
            EN
          </button>
        </div>

        {/* 시스템 버전 및 서버 연결 상태 칩 (다중 서버 헬스체크 지원) */}
        <VersionBadge />

        {/* Desktop Terminal Command Button */}
        <button
          type="button"
          className="header-icon-btn desktop-only-action"
          onClick={onOpenCommandPalette}
          title={t('header.desktopTerminalTitle')}
          aria-label={t('header.desktopTerminalAria')}
        >
          <span className="material-symbols-outlined">terminal</span>
        </button>

        {/* 현재 로그인 사용자 프로필 및 배지 (Authelia SSO 연동) */}
        <UserProfileBadge />

        {/* Notifications Button */}
        <button
          type="button"
          className="header-icon-btn"
          title={t('header.notificationsTitle')}
          aria-label={t('header.notificationsAria')}
        >
          <span className="material-symbols-outlined">notifications</span>
          <span className="header-notification-dot" />
        </button>

        {/* Dark Mode Icon */}
        <button
          type="button"
          className="header-icon-btn desktop-only-action"
          title={t('header.themeTitle')}
          aria-label={t('header.themeAria')}
        >
          <span className="material-symbols-outlined">dark_mode</span>
        </button>

        {/* Primary Action Button (Desktop Only) */}
        <button
          type="button"
          className="header-cta-btn desktop-only-action"
          onClick={onOpenCommandPalette}
          aria-label={t('header.runTask')}
        >
          <span className="material-symbols-outlined">play_arrow</span>
          <span>{t('header.runTask')}</span>
        </button>
      </div>
    </header>
  );
};

export default Header;
