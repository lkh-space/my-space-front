import React, { useEffect } from 'react';
import { Command } from 'cmdk';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import '../../shared/i18n';
import { clearRecentTasks } from '../../shared/utils/storage';
import { WORKSPACE_NAV_ENTRIES } from '../../shared/constants/navigation';

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
  const { t } = useTranslation();

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
        label={t('commandPalette.dialogLabel')}
      >
        <div className="cmdk-input-wrapper">
          <span className="material-symbols-outlined">
            search
          </span>
          <Command.Input
            className="cmdk-input"
            placeholder={t('commandPalette.inputPlaceholder')}
            autoFocus
          />
          <kbd className="command-kbd">ESC</kbd>
        </div>

        <Command.List className="cmdk-list">
          <Command.Empty className="cmdk-empty">
            {t('commandPalette.emptyText')}
          </Command.Empty>

          <Command.Group heading={t('commandPalette.shortcutsHeading')}>
            {WORKSPACE_NAV_ENTRIES.map((entry) => (
              <Command.Item
                key={entry.id}
                className="cmdk-item"
                onSelect={() => handleSelectRoute(entry.path)}
              >
                <span className="material-symbols-outlined">
                  {entry.icon}
                </span>
                <span>{t(`nav.entries.${entry.id}.commandDescription`)}</span>
                <span className="cmdk-item-badge">{entry.path}</span>
              </Command.Item>
            ))}
          </Command.Group>

          <Command.Group heading={t('commandPalette.systemHeading')}>
            <Command.Item
              className="cmdk-item"
              onSelect={handleClearHistory}
            >
              <span className="material-symbols-outlined cmdk-item-danger-icon">
                delete_sweep
              </span>
              <span>{t('commandPalette.clearHistoryItem')}</span>
              <span className="cmdk-item-badge">Storage</span>
            </Command.Item>
          </Command.Group>
        </Command.List>

        <div className="cmdk-footer">
          <span>{t('commandPalette.footerNavigate')}</span>
          <span>{t('commandPalette.footerSelect')}</span>
          <span>{t('commandPalette.footerClose')}</span>
        </div>
      </Command.Dialog>
    </div>
  );
};
