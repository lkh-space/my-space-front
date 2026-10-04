import React from 'react';

interface MobileFloatingControlsProps {
  activeTab: 'erd' | 'editor';
  onTabChange: (tab: 'erd' | 'editor') => void;
  tableCount: number;
  isValid: boolean;
  onExecuteConvert: () => void;
}

export const MobileFloatingControls: React.FC<MobileFloatingControlsProps> = ({
  activeTab,
  onTabChange,
  tableCount,
  isValid,
  onExecuteConvert,
}) => {
  return (
    <>
      {/* Mobile Top Viewport Switcher */}
      <div className="mobile-tab-bar">
        <div className="mobile-tab-group">
          <button
            onClick={() => onTabChange('erd')}
            className={`mobile-tab-btn ${activeTab === 'erd' ? 'active' : ''}`}
          >
            ERD Canvas
          </button>
          <button
            onClick={() => onTabChange('editor')}
            className={`mobile-tab-btn ${activeTab === 'editor' ? 'active' : ''}`}
          >
            Code Editor
          </button>
        </div>

        <button
          onClick={onExecuteConvert}
          className="dbml-btn dbml-btn-primary"
          style={{ padding: '3px 8px', fontSize: '11px' }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>play_arrow</span>
          <span>Convert</span>
        </button>
      </div>

      {/* Mobile Bottom Floating Status Bar */}
      <div
        className="mobile-status-bar"
        style={{
          display: 'none', // 모바일 미디어 쿼리에서 노출 가능
          position: 'fixed',
          bottom: '56px',
          left: '12px',
          right: '12px',
          zIndex: 30,
          backgroundColor: 'rgba(26, 27, 34, 0.95)',
          backdropFilter: 'blur(8px)',
          border: '1px solid var(--outline-variant)',
          padding: '8px 12px',
          borderRadius: 'var(--radius-lg)',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            style={{
              width: '8px',
              height: '8px',
              borderRadius: 'var(--radius-full)',
              backgroundColor: isValid ? 'var(--secondary)' : 'var(--tertiary)',
            }}
          />
          <span style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--on-surface)' }}>
            {isValid ? 'Schema Valid' : 'Check Syntax'}
          </span>
          <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
            ({tableCount} tables)
          </span>
        </div>

        <button
          onClick={onExecuteConvert}
          className="dbml-btn dbml-btn-primary"
          style={{ padding: '4px 10px', fontSize: '11px' }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>database</span>
          <span>Export SQL</span>
        </button>
      </div>
    </>
  );
};
