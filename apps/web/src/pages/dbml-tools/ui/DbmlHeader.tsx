import React from 'react';
import { SqlDialect } from '../model/types';

interface DbmlHeaderProps {
  dialect: SqlDialect;
  onDialectChange: (dialect: SqlDialect) => void;
  onLoadExample: () => void;
  onCopySchema: () => void;
  onExportSvg: () => void;
  onFormatCode: () => void;
  onExecuteConvert: () => void;
  isConverting?: boolean;
}

export const DbmlHeader: React.FC<DbmlHeaderProps> = ({
  dialect,
  onDialectChange,
  onLoadExample,
  onCopySchema,
  onExportSvg,
  onFormatCode,
  onExecuteConvert,
  isConverting,
}) => {
  return (
    <div className="dbml-toolbar">
      {/* Left: Breadcrumbs & Dialect Selector */}
      <div className="dbml-toolbar-left">
        <div className="dbml-breadcrumb">
          <span>Workspace</span>
          <span className="dbml-divider" style={{ width: '1px', height: '12px' }} />
          <span className="dbml-breadcrumb-active">DBML Utility</span>
        </div>
        <span className="dbml-divider" />
        <div>
          <select
            value={dialect}
            onChange={(e) => onDialectChange(e.target.value as SqlDialect)}
            className="dbml-dialect-select"
            aria-label="Target SQL Dialect"
          >
            <option value="postgres">postgres::v16</option>
            <option value="mysql">mysql::v8.0</option>
            <option value="sqlite">sqlite::v3.42</option>
            <option value="mssql">mssql::v2022</option>
          </select>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="dbml-toolbar-right">
        <button
          onClick={onLoadExample}
          className="dbml-btn"
          title="기본 샘플 스키마 불러오기"
        >
          <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>auto_stories</span>
          <span>Load Example</span>
        </button>

        <button
          onClick={onCopySchema}
          className="dbml-btn"
          title="스키마 코드 복사"
        >
          <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>content_copy</span>
          <span>Copy Schema</span>
        </button>

        <button
          onClick={onExportSvg}
          className="dbml-btn"
          title="ERD SVG 이미지 다운로드"
        >
          <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>download</span>
          <span>Export SVG</span>
        </button>

        <button
          onClick={onFormatCode}
          className="dbml-btn dbml-btn-secondary"
          title="코드 포맷팅"
        >
          <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>reorder</span>
          <span>Format</span>
        </button>

        <span className="dbml-divider" />

        <button
          onClick={onExecuteConvert}
          disabled={isConverting}
          className="dbml-btn dbml-btn-primary"
          title="선택한 Dialect의 SQL DDL로 변환"
        >
          <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>
            {isConverting ? 'sync' : 'play_arrow'}
          </span>
          <span>{isConverting ? 'Converting...' : 'Execute Task'}</span>
        </button>
      </div>
    </div>
  );
};
