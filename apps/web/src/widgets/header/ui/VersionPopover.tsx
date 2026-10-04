import React, { useEffect, useRef, useState } from 'react';
import { ServiceVersionInfo } from '../../../entities/version';

interface VersionPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  frontend: ServiceVersionInfo;
  backendServices: ServiceVersionInfo[];
  onRefresh: () => Promise<void>;
  isLoading: boolean;
}

export const VersionPopover: React.FC<VersionPopoverProps> = ({
  isOpen,
  onClose,
  frontend,
  backendServices,
  onRefresh,
  isLoading,
}) => {
  const popoverRef = useRef<HTMLDivElement>(null);
  const [copiedCommit, setCopiedCommit] = useState<string | null>(null);

  // 외부 클릭 및 ESC 키 감지 시 닫기
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  const handleCopyCommit = async (commit?: string) => {
    if (!commit) return;
    try {
      await navigator.clipboard.writeText(commit);
      setCopiedCommit(commit);
      setTimeout(() => setCopiedCommit(null), 1500);
    } catch {
      // ignore
    }
  };

  if (!isOpen) return null;

  return (
    <div
      ref={popoverRef}
      className="version-popover"
      role="dialog"
      aria-label="시스템 버전 및 서버 상태"
    >
      {/* Popover Header */}
      <div className="version-popover-header">
        <div className="version-popover-title">
          <span className="material-symbols-outlined" style={{ fontSize: '16px', color: 'var(--primary)' }}>
            dns
          </span>
          <span>System Version & Health</span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="version-icon-close"
          aria-label="팝오버 닫기"
        >
          <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>close</span>
        </button>
      </div>

      {/* Popover Body */}
      <div className="version-popover-body">
        {/* Section 1: Frontend (Web Client) */}
        <div className="version-service-card">
          <div className="version-service-header">
            <div className="version-service-name-group">
              <span className="version-status-dot online" />
              <span className="version-service-title">{frontend.name}</span>
            </div>
            <span className="version-badge-tag online">
              v{frontend.version || '0.0.1'}
            </span>
          </div>

          <div className="version-meta-grid">
            <div className="version-meta-item">
              <span className="version-meta-label">Branch</span>
              <span className="version-meta-value">{frontend.gitBranch || 'main'}</span>
            </div>

            <div className="version-meta-item">
              <span className="version-meta-label">Commit</span>
              <button
                type="button"
                onClick={() => handleCopyCommit(frontend.gitCommit)}
                className="version-commit-btn"
                title="클립보드에 커밋 해시 복사"
              >
                <span>{frontend.gitCommit || 'unknown'}</span>
                <span className="material-symbols-outlined" style={{ fontSize: '12px' }}>
                  {copiedCommit === frontend.gitCommit ? 'check' : 'content_copy'}
                </span>
              </button>
            </div>

            {frontend.buildTime && (
              <div className="version-meta-item">
                <span className="version-meta-label">Built</span>
                <span className="version-meta-value">{new Date(frontend.buildTime).toLocaleString()}</span>
              </div>
            )}

            {frontend.env && (
              <div className="version-meta-item">
                <span className="version-meta-label">Env</span>
                <span className="version-meta-value">{frontend.env}</span>
              </div>
            )}
          </div>
        </div>

        {/* Section 2: Backend Services (Multi-Server) */}
        <div className="version-section-divider">
          <span>Backend Services ({backendServices.length})</span>
        </div>

        {backendServices.map((service) => {
          const isOnline = service.status === 'online';
          const isError = service.status === 'error';

          return (
            <div
              key={service.id}
              className={`version-service-card ${isError ? 'has-error' : ''}`}
            >
              <div className="version-service-header">
                <div className="version-service-name-group">
                  <span
                    className={`version-status-dot ${
                      isOnline ? 'online' : isError ? 'error' : 'loading'
                    }`}
                  />
                  <span className="version-service-title">{service.name}</span>
                </div>

                <span
                  className={`version-badge-tag ${
                    isOnline ? 'online' : isError ? 'error' : 'loading'
                  }`}
                >
                  {isOnline
                    ? `v${service.version || '0.0.1'}`
                    : isError
                    ? 'error'
                    : 'checking...'}
                </span>
              </div>

              {isOnline ? (
                <div className="version-meta-grid">
                  <div className="version-meta-item">
                    <span className="version-meta-label">Branch</span>
                    <span className="version-meta-value">{service.gitBranch || 'main'}</span>
                  </div>

                  <div className="version-meta-item">
                    <span className="version-meta-label">Commit</span>
                    <button
                      type="button"
                      onClick={() => handleCopyCommit(service.gitCommit)}
                      className="version-commit-btn"
                      title="클립보드에 커밋 해시 복사"
                    >
                      <span>{service.gitCommit || 'unknown'}</span>
                      <span className="material-symbols-outlined" style={{ fontSize: '12px' }}>
                        {copiedCommit === service.gitCommit ? 'check' : 'content_copy'}
                      </span>
                    </button>
                  </div>

                  {service.buildTime && (
                    <div className="version-meta-item">
                      <span className="version-meta-label">Built</span>
                      <span className="version-meta-value">{new Date(service.buildTime).toLocaleString()}</span>
                    </div>
                  )}

                  {service.env && (
                    <div className="version-meta-item">
                      <span className="version-meta-label">Env</span>
                      <span className="version-meta-value">{service.env}</span>
                    </div>
                  )}
                </div>
              ) : isError ? (
                <div className="version-error-box">
                  <span className="material-symbols-outlined" style={{ fontSize: '14px', color: 'var(--error)' }}>
                    error
                  </span>
                  <span>{service.errorMessage || '서버 연결 실패 (Offline)'}</span>
                </div>
              ) : (
                <div className="version-loading-box">
                  <span>상태 확인 중...</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Popover Footer */}
      <div className="version-popover-footer">
        <span className="version-footer-note">
          API Endpoint: {backendServices[0]?.endpoint || '/api/v1/version'}
        </span>

        <button
          type="button"
          onClick={onRefresh}
          disabled={isLoading}
          className="version-refresh-btn"
          title="모든 서버 상태 새로고침"
        >
          <span
            className={`material-symbols-outlined ${isLoading ? 'animate-spin' : ''}`}
            style={{ fontSize: '14px' }}
          >
            refresh
          </span>
          <span>{isLoading ? 'Checking...' : 'Refresh'}</span>
        </button>
      </div>
    </div>
  );
};
