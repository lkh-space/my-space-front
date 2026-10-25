import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import '../../../shared/i18n';
import { PdfOperationMode, PDF_OPERATION_METAS } from '../types';

interface PdfOperationConfigProps {
  mode: PdfOperationMode;
  splitRangeInput: string;
  onSplitRangeChange: (value: string) => void;
  unlockPassword?: string;
  onUnlockPasswordChange?: (value: string) => void;
  fileCount: number;
}

export const PdfOperationConfig: React.FC<PdfOperationConfigProps> = ({
  mode,
  splitRangeInput,
  onSplitRangeChange,
  unlockPassword = '',
  onUnlockPasswordChange,
  fileCount,
}) => {
  const { t } = useTranslation();
  const [showPassword, setShowPassword] = useState(false);
  const meta = PDF_OPERATION_METAS[mode];
  const modeLabel = t(`pdfTools.modes.${mode}.label`);
  const modeDesc = t(`pdfTools.modes.${mode}.description`);

  return (
    <div className="pdf-config-card">
      <div className="pdf-config-header">
        <h3>
          <span className="material-symbols-outlined">{meta.icon}</span>
          <span>
            {t('pdfTools.config.headerSuffix', { label: modeLabel })}
          </span>
        </h3>
      </div>

      <p className="pdf-title-desc">{modeDesc}</p>

      {mode === 'split-range' && (
        <div className="pdf-input-group">
          <label htmlFor="split-range-input" className="pdf-input-label">
            <span>{t('pdfTools.config.splitRangeLabel')}</span>
            <span className="pdf-input-hint">
              {t('pdfTools.config.splitRangeHint')}
            </span>
          </label>
          <input
            id="split-range-input"
            type="text"
            className="pdf-text-input"
            placeholder={t('pdfTools.config.splitRangePlaceholder')}
            value={splitRangeInput}
            onChange={(e) => onSplitRangeChange(e.target.value)}
          />
        </div>
      )}

      {mode === 'unlock' && (
        <div className="pdf-input-group">
          <label htmlFor="unlock-password-input" className="pdf-input-label">
            <span>{t('pdfTools.config.unlockPasswordLabel')}</span>
            <span className="pdf-input-hint">
              {t('pdfTools.config.unlockPasswordHint')}
            </span>
          </label>
          <div className="pdf-password-config-wrapper">
            <input
              id="unlock-password-input"
              type={showPassword ? 'text' : 'password'}
              className="pdf-text-input pdf-unlock-password-input"
              placeholder={t('pdfTools.config.unlockPasswordPlaceholder')}
              value={unlockPassword}
              onChange={(e) => onUnlockPasswordChange?.(e.target.value)}
            />
            <button
              type="button"
              className="pdf-password-toggle-btn"
              onClick={() => setShowPassword((prev) => !prev)}
              aria-label={
                showPassword
                  ? t('pdfTools.config.hidePassword')
                  : t('pdfTools.config.showPassword')
              }
              title={
                showPassword
                  ? t('pdfTools.config.hidePassword')
                  : t('pdfTools.config.showPassword')
              }
            >
              <span className="material-symbols-outlined">
                {showPassword ? 'visibility_off' : 'visibility'}
              </span>
            </button>
          </div>
        </div>
      )}

      {mode === 'merge' && fileCount < 2 && (
        <p className="pdf-input-hint">
          {t('pdfTools.config.mergeMinFilesHint')}
        </p>
      )}
    </div>
  );
};

export default PdfOperationConfig;
