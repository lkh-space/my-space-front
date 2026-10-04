import React, { useState } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { sql } from '@codemirror/lang-sql';
import { SqlDialect } from '../model/types';

interface SqlPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  sqlContent: string;
  dialect: SqlDialect;
  fromFallback?: boolean;
}

export const SqlPreviewModal: React.FC<SqlPreviewModalProps> = ({
  isOpen,
  onClose,
  sqlContent,
  dialect,
  fromFallback,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(sqlContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  const handleDownload = () => {
    const blob = new Blob([sqlContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `schema-${dialect}.sql`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="dbml-modal-overlay">
      <div className="dbml-modal-card">
        {/* Modal Header */}
        <div className="dbml-modal-header">
          <div className="dbml-modal-title">
            <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--primary)' }}>
              database
            </span>
            <span>Generated SQL DDL ({dialect.toUpperCase()})</span>
            {fromFallback && (
              <span
                style={{
                  fontSize: '10px',
                  fontFamily: 'var(--font-mono)',
                  padding: '2px 6px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--surface-container-high)',
                  color: 'var(--tertiary)',
                  border: '1px solid var(--outline-variant)',
                }}
              >
                Local Engine
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="dbml-icon-btn"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>close</span>
          </button>
        </div>

        {/* Modal Editor View */}
        <div className="dbml-modal-body">
          <CodeMirror
            value={sqlContent}
            height="360px"
            theme="dark"
            extensions={[sql()]}
            editable={false}
            basicSetup={{
              lineNumbers: true,
              foldGutter: true,
            }}
            style={{
              fontSize: '12px',
              fontFamily: 'JetBrains Mono, monospace',
            }}
          />
        </div>

        {/* Modal Footer */}
        <div className="dbml-modal-footer">
          <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
            {sqlContent.split('\n').length} lines, {sqlContent.length} characters
          </span>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={handleCopy}
              className="dbml-btn dbml-btn-secondary"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>
                {copied ? 'check' : 'content_copy'}
              </span>
              <span>{copied ? 'Copied!' : 'Copy SQL'}</span>
            </button>

            <button
              onClick={handleDownload}
              className="dbml-btn dbml-btn-primary"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>download</span>
              <span>Download .sql</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
