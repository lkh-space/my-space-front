import React, { useState, useRef, useId } from 'react';
import { convertSqlToDbml } from '../model/sqlToDbmlParser';

interface ImportSchemaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (importedDbml: string, filename?: string) => void;
}

export const ImportSchemaModal: React.FC<ImportSchemaModalProps> = ({
  isOpen,
  onClose,
  onImport,
}) => {
  const [activeTab, setActiveTab] = useState<'file' | 'text'>('file');
  const [rawText, setRawText] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [parsedPreview, setParsedPreview] = useState<{
    dbml: string;
    tableCount: number;
    detectedType: 'sql' | 'dbml' | 'empty';
  }>({ dbml: '', tableCount: 0, detectedType: 'empty' });
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const fileInputId = useId();

  if (!isOpen) return null;

  // 텍스트/파일 내용을 감지하고 파싱 미리보기 생성
  const processContent = (content: string, fileName?: string) => {
    setErrorMsg(null);
    const trimmed = content.trim();
    if (!trimmed) {
      setParsedPreview({ dbml: '', tableCount: 0, detectedType: 'empty' });
      return;
    }

    const isSqlFile = fileName?.toLowerCase().endsWith('.sql');
    const isDbmlFile = fileName?.toLowerCase().endsWith('.dbml');

    const looksLikeSql =
      isSqlFile ||
      (!isDbmlFile &&
        (/CREATE\s+(?:TABLE|DATABASE|SCHEMA)/i.test(trimmed) ||
          /ALTER\s+TABLE/i.test(trimmed) ||
          /SELECT\s+/i.test(trimmed)));

    if (looksLikeSql) {
      const { dbml, tableCount } = convertSqlToDbml(trimmed);
      if (tableCount === 0) {
        setErrorMsg('변환 가능한 CREATE TABLE 구문을 찾지 못했습니다.');
      }
      setParsedPreview({
        dbml,
        tableCount,
        detectedType: 'sql',
      });
    } else {
      // DBML 파싱 시도 (Table 블록 감지)
      const tableMatches = trimmed.match(/Table\s+["`]?([a-zA-Z0-9_]+)["`]?/g) || [];
      const tableCount = tableMatches.length;
      if (tableCount === 0) {
        setErrorMsg('DBML Table 정의를 찾지 못했습니다.');
      }
      setParsedPreview({
        dbml: trimmed,
        tableCount,
        detectedType: 'dbml',
      });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = (event.target?.result as string) || '';
      setRawText(text);
      processContent(text, file.name);
    };
    reader.readAsText(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      setSelectedFileName(file.name);
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = (event.target?.result as string) || '';
        setRawText(text);
        processContent(text, file.name);
      };
      reader.readAsText(file);
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setRawText(text);
    processContent(text);
  };

  const handleConfirm = () => {
    if (!parsedPreview.dbml || parsedPreview.tableCount === 0) {
      setErrorMsg('가져올 유효한 스키마 또는 테이블이 없습니다.');
      return;
    }

    onImport(parsedPreview.dbml, selectedFileName || undefined);
    onClose();
  };

  return (
    <div
      className="dbml-modal-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="import-modal-title"
    >
      <div
        className="dbml-modal-card import-modal"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="dbml-modal-header">
          <div className="dbml-modal-title">
            <span className="material-symbols-outlined" style={{ color: 'var(--primary)', fontSize: '20px' }}>
              file_upload
            </span>
            <span id="import-modal-title">스키마 가져오기 (DBML / SQL)</span>
          </div>
          <button
            onClick={onClose}
            className="dbml-icon-btn"
            title="닫기"
            aria-label="닫기"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>close</span>
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="import-tab-bar">
          <button
            type="button"
            className={`import-tab-btn ${activeTab === 'file' ? 'active' : ''}`}
            onClick={() => setActiveTab('file')}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>attach_file</span>
            <span>파일 업로드 (.dbml, .sql)</span>
          </button>
          <button
            type="button"
            className={`import-tab-btn ${activeTab === 'text' ? 'active' : ''}`}
            onClick={() => setActiveTab('text')}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>edit_note</span>
            <span>직접 텍스트 붙여넣기</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="dbml-modal-body import-modal-body">
          {activeTab === 'file' ? (
            <div
              className={`import-dropzone ${dragActive ? 'drag-active' : ''} ${selectedFileName ? 'has-file' : ''}`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <input
                id={fileInputId}
                ref={fileInputRef}
                type="file"
                accept=".dbml,.sql,text/plain"
                style={{ display: 'none' }}
                onChange={handleFileChange}
              />

              <span className="material-symbols-outlined dropzone-icon">
                {selectedFileName ? 'check_circle' : 'cloud_upload'}
              </span>

              {selectedFileName ? (
                <div className="dropzone-file-info">
                  <span className="file-name">{selectedFileName}</span>
                  <button
                    type="button"
                    className="change-file-btn"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    다른 파일 선택
                  </button>
                </div>
              ) : (
                <div className="dropzone-instruction">
                  <p className="primary-text">
                    .dbml 또는 .sql 파일을 여기로 드래그하세요
                  </p>
                  <p className="secondary-text">
                    또는{' '}
                    <label
                      htmlFor={fileInputId}
                      className="browse-label"
                    >
                      컴퓨터에서 파일 찾기
                    </label>
                  </p>
                  <p className="notice-text">
                    * SQL 파일 내의 CREATE DATABASE, USE 쿼리는 자동으로 무시(필터링)됩니다.
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="import-text-container">
              <label htmlFor="import-raw-textarea" className="import-textarea-label">
                DBML 스키마 또는 SQL DDL (CREATE TABLE) 스크립트를 입력하세요:
              </label>
              <textarea
                id="import-raw-textarea"
                className="import-textarea"
                rows={10}
                placeholder={`-- 예: SQL DDL 스크립트\nCREATE DATABASE IF NOT EXISTS shop; -- 자동 무시\nUSE shop; -- 자동 무시\n\nCREATE TABLE users (\n  id INT PRIMARY KEY,\n  email VARCHAR(255) NOT NULL UNIQUE\n);`}
                value={rawText}
                onChange={handleTextChange}
              />
            </div>
          )}

          {/* Error Message */}
          {errorMsg && (
            <div className="import-error-banner" role="alert">
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>warning</span>
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Parsing Result Summary Box */}
          {parsedPreview.detectedType !== 'empty' && (
            <div className="import-summary-box">
              <div className="summary-row">
                <span className="summary-title">감지된 포맷:</span>
                <span className="summary-badge">
                  {parsedPreview.detectedType === 'sql'
                    ? 'SQL DDL (순수 CREATE TABLE 자동 변환)'
                    : 'DBML 스키마'}
                </span>
              </div>
              <div className="summary-row">
                <span className="summary-title">변환된 테이블 수:</span>
                <span className="summary-val">{parsedPreview.tableCount}개 테이블</span>
              </div>
              {parsedPreview.detectedType === 'sql' && (
                <p className="summary-note">
                  ✓ DB 생성(CREATE DATABASE) 및 환경 설정 쿼리는 안전하게 필터링되었습니다.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="dbml-modal-footer">
          <button
            type="button"
            onClick={onClose}
            className="dbml-btn"
          >
            취소
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="dbml-btn primary"
            disabled={parsedPreview.tableCount === 0}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
              file_upload
            </span>
            <span>스키마 가져오기</span>
          </button>
        </div>
      </div>
    </div>
  );
};
