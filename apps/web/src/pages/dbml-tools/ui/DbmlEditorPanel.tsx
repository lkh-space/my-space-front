import React, { useState } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { sql } from '@codemirror/lang-sql';
import { ParsedSchema } from '../model/types';

interface DbmlEditorPanelProps {
  value: string;
  onChange: (val: string) => void;
  parsedSchema: ParsedSchema;
  isSqlMode?: boolean;
  onToggleMode?: () => void;
}

export const DbmlEditorPanel: React.FC<DbmlEditorPanelProps> = ({
  value,
  onChange,
  parsedSchema,
  isSqlMode,
  onToggleMode,
}) => {
  const [lineWrap, setLineWrap] = useState(false);

  return (
    <section className="dbml-editor-section">
      {/* Editor Header / Tab */}
      <div className="dbml-pane-header">
        <div className="dbml-pane-title">
          <span className="material-symbols-outlined icon">code</span>
          <span>{isSqlMode ? 'schema.sql' : 'schema.dbml'}</span>
          <span className="dbml-pane-subtitle">(read/write)</span>
        </div>

        <div className="dbml-pane-actions">
          {onToggleMode && (
            <button
              onClick={onToggleMode}
              className="dbml-btn"
              style={{ padding: '2px 6px', fontSize: '10px' }}
              title="DBML / SQL 모드 전환"
            >
              {isSqlMode ? 'Switch to DBML' : 'Switch to SQL'}
            </button>
          )}

          <button
            onClick={() => setLineWrap(!lineWrap)}
            className={`dbml-icon-btn ${lineWrap ? 'active' : ''}`}
            title="줄 바꿈(Wrap) 토글"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>wrap_text</span>
          </button>
        </div>
      </div>

      {/* CodeMirror Editor Area */}
      <div className="dbml-editor-body">
        <CodeMirror
          value={value}
          height="100%"
          theme="dark"
          extensions={[sql()]}
          onChange={(val) => onChange(val)}
          basicSetup={{
            lineNumbers: true,
            highlightActiveLineGutter: true,
            highlightActiveLine: true,
            foldGutter: true,
            autocompletion: true,
          }}
          style={{
            height: '100%',
            fontSize: '12px',
            fontFamily: 'JetBrains Mono, monospace',
          }}
        />
      </div>

      {/* Editor Status Footer */}
      <div className="dbml-editor-footer">
        <div className="dbml-status-group">
          {parsedSchema.isValid ? (
            <span className="status-valid">
              <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>check_circle</span>
              <span>Schema Valid</span>
            </span>
          ) : (
            <span className="status-warning" title={parsedSchema.errorMessage}>
              <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>warning</span>
              <span>Parsing Warning</span>
            </span>
          )}
          <span style={{ color: 'var(--outline-variant)' }}>|</span>
          <span style={{ color: 'var(--on-surface-variant)', fontSize: '11px' }}>
            {parsedSchema.tables.length} tables, {parsedSchema.relationships.length} foreign keys detected
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span>{value.length} chars</span>
          <span className="dbml-perf-indicator">
            <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>bolt</span>
            <span>{parsedSchema.parseTimeMs}ms</span>
          </span>
        </div>
      </div>
    </section>
  );
};
