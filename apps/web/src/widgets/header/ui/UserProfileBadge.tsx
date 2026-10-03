import React, { useState, useRef, useEffect } from 'react';
import { useCurrentUser } from '../../../entities/auth';

export const UserProfileBadge: React.FC = () => {
  const { user, isLoading, error, isGuest, isAdmin, isLocalAdmin, logout } =
    useCurrentUser();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // 외부 클릭 시 드롭다운 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false);
      }
    };

    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownOpen]);

  // 로딩 상태 스켈레톤
  if (isLoading) {
    return (
      <div
        className="user-profile-skeleton"
        title="사용자 정보 확인 중..."
        aria-label="사용자 정보 로딩 중"
      >
        <span className="user-skeleton-avatar" />
        <span className="user-skeleton-text" />
      </div>
    );
  }

  // 에러 또는 미인증 상태
  if (error || !user) {
    return (
      <div className="user-profile-error" title="인증 세션이 확인되지 않았습니다">
        <span className="material-symbols-outlined error-icon">person_off</span>
        <span className="user-error-text">미인증</span>
        <button
          type="button"
          className="user-logout-btn compact"
          onClick={logout}
          title="로그인 / 재인증 포털로 이동"
          aria-label="로그인 포털로 이동"
        >
          로그인
        </button>
      </div>
    );
  }

  // 사용자 권한별 배지 스타일 및 라벨 결정
  let badgeClass = 'user-badge-default';
  let badgeLabel = user.displayName || user.username;
  let badgeIcon = 'person';

  if (isLocalAdmin) {
    badgeClass = 'user-badge-local';
    badgeLabel = '[로컬 개발]';
    badgeIcon = 'terminal';
  } else if (isAdmin) {
    badgeClass = 'user-badge-admin';
    badgeLabel = '[관리자] Administrator';
    badgeIcon = 'shield_person';
  } else if (isGuest) {
    badgeClass = 'user-badge-guest';
    badgeLabel = '[체험 모드] Guest Reviewer';
    badgeIcon = 'visibility';
  }

  return (
    <div className="user-profile-container" ref={containerRef}>
      {/* 1. 상단 인라인 프로필 칩 */}
      <button
        type="button"
        className={`user-profile-chip ${badgeClass}`}
        onClick={() => setDropdownOpen((prev) => !prev)}
        aria-expanded={dropdownOpen}
        aria-haspopup="true"
        title={`${user.displayName} (@${user.username}) - 클릭하여 프로필 정보 및 로그아웃`}
      >
        <span className="material-symbols-outlined user-badge-icon">
          {badgeIcon}
        </span>
        <span className="user-badge-label">{badgeLabel}</span>
        <span className="material-symbols-outlined user-chevron-icon">
          {dropdownOpen ? 'expand_less' : 'expand_more'}
        </span>
      </button>

      {/* 2. 빠른 로그아웃 버튼 (데스크톱 인라인) */}
      <button
        type="button"
        className="user-quick-logout-btn desktop-only-action"
        onClick={logout}
        title="세션 종료 및 로그아웃"
        aria-label="로그아웃"
      >
        <span className="material-symbols-outlined">logout</span>
      </button>

      {/* 3. 상세 프로필 & 로그아웃 팝오버 드롭다운 */}
      {dropdownOpen && (
        <div
          className="user-profile-dropdown"
          role="menu"
          aria-label="사용자 계정 메뉴"
        >
          <div className="user-dropdown-header">
            <div className="user-dropdown-avatar">
              <span className="material-symbols-outlined">{badgeIcon}</span>
            </div>
            <div className="user-dropdown-meta">
              <div className="user-dropdown-name">{user.displayName}</div>
              <div className="user-dropdown-sub">@{user.username}</div>
              {user.email && (
                <div className="user-dropdown-email">{user.email}</div>
              )}
            </div>
          </div>

          {/* 소속 그룹 태그 */}
          {user.groups && user.groups.length > 0 && (
            <div className="user-dropdown-groups">
              <span className="groups-title">소속 그룹:</span>
              <div className="groups-chip-list">
                {user.groups.map((group) => (
                  <span key={group} className="group-chip">
                    {group}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="user-dropdown-divider" />

          {/* 로그아웃 액션 버튼 */}
          <button
            type="button"
            className="user-dropdown-logout-btn"
            onClick={() => {
              setDropdownOpen(false);
              logout();
            }}
            role="menuitem"
          >
            <span className="material-symbols-outlined">logout</span>
            <span>로그아웃</span>
          </button>
        </div>
      )}
    </div>
  );
};
