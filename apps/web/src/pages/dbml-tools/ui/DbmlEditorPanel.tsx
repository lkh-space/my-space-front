import React, { useState, useMemo } from 'react';
import CodeMirror, { basicSetup, keymap, Prec, EditorView, Extension } from '@uiw/react-codemirror';
import { sql, SQLDialect, PostgreSQL } from '@codemirror/lang-sql';
import { ParsedSchema } from '../model/types';

// CodeMirror의 기본 자동완성 keymap에서 acceptCompletion 커맨드 추출
interface CompletionKeymapEntry {
  key?: string;
  run?: (view: unknown) => boolean;
}

interface CompletionContextLike {
  matchBefore: (regex: RegExp) => { from: number; to: number; text: string } | null;
  explicit: boolean;
}

const completionKeymaps = basicSetup({
  defaultKeymap: false,
  searchKeymap: false,
  historyKeymap: false,
  foldKeymap: false,
  lintKeymap: false,
  closeBracketsKeymap: false,
  completionKeymap: true,
}) as unknown[];

const completionFacet = completionKeymaps.find(
  (ext): ext is { value: CompletionKeymapEntry[] } =>
    typeof ext === 'object' &&
    ext !== null &&
    'value' in ext &&
    Array.isArray((ext as { value: unknown }).value)
);

const acceptCompletion = completionFacet?.value?.find((b) => b.key === 'Enter')?.run;

// DBML 고유 키워드 및 타입 정의
const DBML_KEYWORDS =
  'Table Ref Enum Project TableGroup Note indexes as pk primary key unique not null increment default note ref cascade restrict';
const DBML_TYPES =
  'int integer bigint smallint tinyint serial bigserial varchar char text uuid bool boolean timestamp timestamptz datetime date time decimal numeric float double real json jsonb';

const dbmlDialect = SQLDialect.define({
  keywords: (PostgreSQL.spec.keywords || '') + ' ' + DBML_KEYWORDS,
  types: (PostgreSQL.spec.types || '') + ' ' + DBML_TYPES,
  slashComments: true,
});

// DBML 구조 템플릿/스니펫 자동완성 소스
const dbmlSnippetsCompletion = (context: CompletionContextLike) => {
  const word = context.matchBefore(/\[?[\w:]*/);
  if (!word || (word.from === word.to && !context.explicit)) return null;
  return {
    from: word.from,
    options: [
      { label: 'Table', type: 'keyword', apply: 'Table table_name {\n  id integer [pk, increment]\n  \n}' },
      { label: 'Ref:', type: 'keyword', apply: 'Ref: table1.col_id > table2.id' },
      { label: 'Enum', type: 'keyword', apply: 'Enum status_type {\n  active\n  inactive\n}' },
      { label: '[pk]', type: 'property', apply: '[pk]' },
      { label: '[pk, increment]', type: 'property', apply: '[pk, increment]' },
      { label: '[not null]', type: 'property', apply: '[not null]' },
      { label: '[unique]', type: 'property', apply: '[unique]' },
      { label: '[default: ]', type: 'property', apply: '[default: ]' },
      { label: '[note: ""]', type: 'property', apply: '[note: ""]' },
      { label: 'indexes', type: 'keyword', apply: 'indexes {\n  id [pk]\n}' },
    ],
  };
};

const dbmlSnippetsExtension = dbmlDialect.language.data.of({
  autocomplete: dbmlSnippetsCompletion,
});

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

  // Tab 키로 추천 팝업 선택 항목 즉시 자동완성 (최고 우선순위 바인딩)
  const tabCompletionExtension = useMemo(() => {
    if (!acceptCompletion) return [];
    return Prec.highest(
      keymap.of([
        {
          key: 'Tab',
          run: acceptCompletion,
        },
      ])
    );
  }, []);

  // 현재 파싱된 스키마 기반 테이블 및 컬럼명 자동완성 소스
  const schemaMap = useMemo(() => {
    const map: Record<string, string[]> = {};
    parsedSchema.tables.forEach((table) => {
      map[table.name] = table.fields.map((f) => f.name);
    });
    return map;
  }, [parsedSchema.tables]);

  const extensions = useMemo(() => {
    const exts: Extension[] = [tabCompletionExtension];
    if (lineWrap) {
      exts.push(EditorView.lineWrapping);
    }
    if (isSqlMode) {
      exts.push(sql());
    } else {
      exts.push(dbmlSnippetsExtension);
      exts.push(
        sql({
          dialect: dbmlDialect,
          schema: schemaMap,
        })
      );
    }
    return exts;
  }, [tabCompletionExtension, lineWrap, isSqlMode, schemaMap]);

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
          extensions={extensions}
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
