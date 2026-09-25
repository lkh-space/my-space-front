import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';

interface TopNavBarProps {
  onOpenCommandPalette: () => void;
}

export const TopNavBar: React.FC<TopNavBarProps> = ({ onOpenCommandPalette }) => {
  const location = useLocation();
  const [lang, setLang] = useState<'KR' | 'EN'>('KR');

  const getBreadcrumbLabel = (pathname: string): { category: string; page: string } => {
    switch (pathname) {
      case '/':
        return { category: '워크스페이스', page: '대시보드' };
      case '/pdf-tools':
        return { category: '유틸리티', page: 'PDF 처리 엔진' };
      case '/dbml-tools':
        return { category: '유틸리티', page: 'DBML 스키마' };
      case '/docs':
        return { category: '워크스페이스', page: '마크다운 문서' };
      default:
        return { category: '탐색', page: '페이지' };
    }
  };

  const { category, page } = getBreadcrumbLabel(location.pathname);

  return (
    <header className="top-navbar" aria-label="상단 네비게이션 헤더">
      {/* 1. Breadcrumbs */}
      <div className="top-breadcrumbs">
        <span className="breadcrumb-root">my-space</span>
        <span className="breadcrumb-separator">/</span>
        <span>{category}</span>
        <span className="breadcrumb-separator">/</span>
        <span className="breadcrumb-current">{page}</span>
      </div>

      {/* 2. Right Action Cluster */}
      <div className="top-actions-cluster">
        {/* Language Switcher */}
        <div className="lang-toggle-segment" role="group" aria-label="언어 선택">
          <button
            type="button"
            className={`lang-btn ${lang === 'KR' ? 'active' : ''}`}
            onClick={() => setLang('KR')}
            aria-pressed={lang === 'KR'}
          >
            KR
          </button>
          <button
            type="button"
            className={`lang-btn ${lang === 'EN' ? 'active' : ''}`}
            onClick={() => setLang('EN')}
            aria-pressed={lang === 'EN'}
          >
            EN
          </button>
        </div>

        {/* Utility Action Buttons */}
        <button
          type="button"
          className="header-icon-btn"
          onClick={onOpenCommandPalette}
          title="터미널 / 명령어 실행 (⌘K)"
          aria-label="명령어 실행창 열기"
        >
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
            terminal
          </span>
        </button>

        <button
          type="button"
          className="header-icon-btn"
          title="시스템 알림"
          aria-label="시스템 알림"
        >
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
            notifications
          </span>
          <span className="header-notification-dot" />
        </button>

        <button
          type="button"
          className="header-icon-btn"
          title="테마 (Deep Dark 모드 적용 중)"
          aria-label="테마 설정"
        >
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
            dark_mode
          </span>
        </button>

        {/* Primary Action Button */}
        <button
          type="button"
          className="header-cta-btn"
          onClick={onOpenCommandPalette}
          aria-label="작업 실행"
        >
          <span className="material-symbols-outlined">play_arrow</span>
          <span>작업 실행</span>
        </button>
      </div>
    </header>
  );
};
