import React from 'react';
import { PdfOperationMode, PDF_OPERATION_METAS, SelectedPdfFile } from '../types';

interface PdfExecutionSummaryProps {
  mode: PdfOperationMode;
  files: SelectedPdfFile[];
  splitRangeInput: string;
  isProcessing: boolean;
  onExecute: () => void;
  onReset: () => void;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export const PdfExecutionSummary: React.FC<PdfExecutionSummaryProps> = ({
  mode,
  files,
  splitRangeInput,
  isProcessing,
  onExecute,
  onReset,
}) => {
  const meta = PDF_OPERATION_METAS[mode];
  const totalBytes = files.reduce((acc, f) => acc + f.size, 0);

  // 실행 유효성 검증
  let canExecute = false;
  let validationMessage = '';

  if (files.length === 0) {
    validationMessage = '처리할 PDF 파일을 먼저 추가해주세요.';
  } else if (mode === 'merge') {
    if (files.length < 2) {
      validationMessage = '병합하려면 2개 이상의 파일이 필요합니다.';
    } else {
      canExecute = true;
    }
  } else if (mode === 'split-range') {
    if (files.length !== 1) {
      validationMessage = '범위 분할은 1개의 파일만 처리 가능합니다.';
    } else if (!splitRangeInput.trim()) {
      validationMessage = '페이지 범위를 입력해주세요 (예: 1-3).';
    } else {
      canExecute = true;
    }
  } else if (mode === 'split-all' || mode === 'unlock') {
    if (files.length !== 1) {
      validationMessage = '단일 파일(1개)만 처리 가능합니다.';
    } else {
      canExecute = true;
    }
  }

  return (
    <div className="pdf-summary-card">
      <div className="pdf-summary-header">
        <h3>
          <span className="material-symbols-outlined" aria-hidden="true">
            receipt_long
          </span>
          <span>작업 실행 요약</span>
        </h3>
      </div>

      <div className="pdf-summary-body">
        <div className="pdf-summary-row">
          <span className="label">작업 모드</span>
          <span className="val">{meta.label}</span>
        </div>

        <div className="pdf-summary-row">
          <span className="label">예상 산출물</span>
          <span className="val">{meta.expectedOutput}</span>
        </div>

        <div className="pdf-summary-row">
          <span className="label">대상 파일 수</span>
          <span className="val">{files.length}개</span>
        </div>

        <div className="pdf-summary-row">
          <span className="label">총 파일 용량</span>
          <span className="val">{formatBytes(totalBytes)}</span>
        </div>

        <div className="pdf-summary-divider" />

        {/* 로컬 격리 보안 안내 박스 */}
        <div className="pdf-security-card">
          <div className="pdf-security-title">
            <span className="material-symbols-outlined">shield</span>
            <span>100% 로컬 보안 격리</span>
          </div>
          <p className="pdf-security-desc">
            업로드된 문서는 외부 클라우드 서버로 유출되지 않으며, 로컬 워크스페이스 환경 내에서만 안전하게 처리됩니다.
          </p>
        </div>

        {validationMessage && !canExecute && (
          <p className="pdf-input-hint" style={{ color: 'var(--text-muted)' }}>
            * {validationMessage}
          </p>
        )}

        {/* 액션 툴바 */}
        <div className="pdf-action-toolbar">
          <button
            type="button"
            className="pdf-reset-btn"
            onClick={onReset}
            disabled={files.length === 0 && !splitRangeInput}
          >
            초기화
          </button>

          <button
            type="button"
            className="pdf-execute-btn"
            onClick={onExecute}
            disabled={!canExecute || isProcessing}
          >
            <span className="material-symbols-outlined">
              {isProcessing ? 'progress_activity' : 'play_arrow'}
            </span>
            <span>{isProcessing ? '처리 중...' : '작업 실행'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default PdfExecutionSummary;
