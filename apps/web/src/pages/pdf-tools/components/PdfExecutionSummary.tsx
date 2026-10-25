import React from 'react';
import { useTranslation } from 'react-i18next';
import '../../../shared/i18n';
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
  const { t } = useTranslation();
  const meta = PDF_OPERATION_METAS[mode];
  const totalBytes = files.reduce((acc, f) => acc + f.size, 0);

  // 실행 유효성 검증
  let canExecute = false;
  let validationMessage = '';

  if (files.length === 0) {
    validationMessage = t('pdfTools.summary.validation.noFiles');
  } else if (mode === 'merge') {
    if (files.length < 2) {
      validationMessage = t('pdfTools.summary.validation.mergeMinFiles');
    } else {
      canExecute = true;
    }
  } else if (mode === 'split-range') {
    if (files.length !== 1) {
      validationMessage = t(
        'pdfTools.summary.validation.splitRangeSingleOnly',
      );
    } else if (!splitRangeInput.trim()) {
      validationMessage = t('pdfTools.summary.validation.splitRangeRequired');
    } else {
      canExecute = true;
    }
  } else if (mode === 'split-all' || mode === 'unlock') {
    if (files.length !== 1) {
      validationMessage = t('pdfTools.summary.validation.singleFileOnly');
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
          <span>{t('pdfTools.summary.title')}</span>
        </h3>
      </div>

      <div className="pdf-summary-body">
        <div className="pdf-summary-row">
          <span className="label">{t('pdfTools.summary.modeLabel')}</span>
          <span className="val">{t(`pdfTools.modes.${mode}.label`)}</span>
        </div>

        <div className="pdf-summary-row">
          <span className="label">
            {t('pdfTools.summary.expectedOutputLabel')}
          </span>
          <span className="val">{meta.expectedOutput}</span>
        </div>

        <div className="pdf-summary-row">
          <span className="label">{t('pdfTools.summary.fileCountLabel')}</span>
          <span className="val">
            {t('pdfTools.summary.fileCountValue', { count: files.length })}
          </span>
        </div>

        <div className="pdf-summary-row">
          <span className="label">{t('pdfTools.summary.totalSizeLabel')}</span>
          <span className="val">{formatBytes(totalBytes)}</span>
        </div>

        <div className="pdf-summary-divider" />

        {/* 로컬 격리 보안 안내 박스 */}
        <div className="pdf-security-card">
          <div className="pdf-security-title">
            <span className="material-symbols-outlined">shield</span>
            <span>{t('pdfTools.summary.securityTitle')}</span>
          </div>
          <p className="pdf-security-desc">
            {t('pdfTools.summary.securityDesc')}
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
            {t('pdfTools.summary.resetBtn')}
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
            <span>
              {isProcessing
                ? t('pdfTools.summary.processingBtn')
                : t('pdfTools.summary.executeBtn')}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default PdfExecutionSummary;
