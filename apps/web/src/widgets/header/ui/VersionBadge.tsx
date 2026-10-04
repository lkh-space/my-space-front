import React, { useState } from 'react';
import { useSystemVersion } from '../../../entities/version';
import { VersionPopover } from './VersionPopover';

export const VersionBadge: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const {
    frontend,
    backendServices,
    displayBadgeText,
    displayStatus,
    refetch,
    isLoading,
  } = useSystemVersion();

  const isError = displayStatus === 'error';
  const isOnline = displayStatus === 'online';

  return (
    <div className="version-badge-container">
      {/* Header Inline Chip Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`version-badge-chip ${
          isError ? 'status-error' : isOnline ? 'status-online' : 'status-loading'
        }`}
        title={`시스템 버전 확인 (${
          isError ? '서버 연결 오류' : isOnline ? '서버 정상 연결' : '확인 중'
        })`}
        aria-label={`시스템 버전 확인 (${
          isError ? '서버 연결 오류' : isOnline ? '서버 정상 연결' : '확인 중'
        })`}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
      >
        <span
          className={`version-chip-dot ${
            isError ? 'error' : isOnline ? 'online' : 'loading'
          }`}
        />
        <span className="version-chip-text">{displayBadgeText}</span>
        <span
          className="material-symbols-outlined version-chip-chevron"
          style={{
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
          }}
        >
          expand_more
        </span>
      </button>

      {/* Dropdown Popover */}
      <VersionPopover
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        frontend={frontend}
        backendServices={backendServices}
        onRefresh={refetch}
        isLoading={isLoading}
      />
    </div>
  );
};
