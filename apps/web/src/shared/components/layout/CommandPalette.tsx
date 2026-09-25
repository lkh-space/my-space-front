import React, { useEffect } from 'react';
import { Command } from 'cmdk';
import { useNavigate } from 'react-router-dom';
import { clearRecentTasks } from '../../utils/storage';
import { WORKSPACE_NAV_ENTRIES } from '../../constants/navigation';

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTasksCleared?: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  open,
  onOpenChange,
  onTasksCleared,
}) => {
  const navigate = useNavigate();

  // 전역 ⌘K / Ctrl+K 단축키 처리
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        onOpenChange(!open);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onOpenChange]);

  const handleSelectRoute = (path: string) => {
    onOpenChange(false);
    navigate(path);
  };

  const handleClearHistory = () => {
    clearRecentTasks();
    if (onTasksCleared) {
      onTasksCleared();
    }
    onOpenChange(false);
  };

  if (!open) return null;

  return (
    <div
      className="cmdk-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onOpenChange(false);
        }
      }}
      role="presentation"
    >
      <Command.Dialog
        open={open}
        onOpenChange={onOpenChange}
        className="cmdk-dialog"
        label="my-space 커맨드 메뉴"
      >
        <div className="cmdk-input-wrapper">
          <span className="material-symbols-outlined" style={{ fontSize: 18, color: 'var(--text-muted)' }}>
            search
          </span>
          <Command.Input
            className="cmdk-input"
            placeholder="도구 이동 또는 명령어 입력..."
            autoFocus
          />
          <kbd className="command-kbd">ESC</kbd>
        </div>

        <Command.List className="cmdk-list">
          <Command.Empty className="cmdk-empty">
            일치하는 도구 또는 명령어가 없습니다.
          </Command.Empty>

          <Command.Group heading="도구 및 워크스페이스 바로가기">
            {WORKSPACE_NAV_ENTRIES.map((entry) => (
              <Command.Item
                key={entry.id}
                className="cmdk-item"
                onSelect={() => handleSelectRoute(entry.path)}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                  {entry.icon}
                </span>
                <span>{entry.commandDescription}</span>
                <span className="cmdk-item-badge">{entry.path}</span>
              </Command.Item>
            ))}
          </Command.Group>

          <Command.Group heading="시스템 및 데이터 관리">
            <Command.Item
              className="cmdk-item"
              onSelect={handleClearHistory}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 18, color: 'var(--error)' }}>
                delete_sweep
              </span>
              <span>최근 작업 이력 모두 비우기 (Clear Local Storage)</span>
              <span className="cmdk-item-badge">Storage</span>
            </Command.Item>
          </Command.Group>
        </Command.List>

        <div className="cmdk-footer">
          <span>↑↓ 탐색</span>
          <span>↵ 선택</span>
          <span>ESC 닫기</span>
        </div>
      </Command.Dialog>
    </div>
  );
};
