import React from 'react';
import { useTranslation } from 'react-i18next';
import '../../../shared/i18n';
import { SelectedPdfFile } from '../types';

interface PdfFileCardProps {
  file: SelectedPdfFile;
  onRemove: (id: string) => void;
  onPasswordChange?: (id: string, password: string) => void;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export const PdfFileCard: React.FC<PdfFileCardProps> = ({
  file,
  onRemove,
  onPasswordChange,
}) => {
  const { t } = useTranslation();

  return (
    <div className="pdf-file-item">
      <div className="pdf-file-row">
        <div className="pdf-file-info">
          <span className="material-symbols-outlined pdf-file-icon">
            picture_as_pdf
          </span>
          <div className="pdf-file-texts">
            <span className="pdf-file-name" title={file.name}>
              {file.name}
            </span>
            <div className="pdf-file-meta-row">
              <span>{formatFileSize(file.size)}</span>
              {file.isInspecting && (
                <span style={{ color: 'var(--on-surface-variant)' }}>
                  {t('pdfTools.fileList.inspecting')}
                </span>
              )}
              {!file.isInspecting && file.pageCount !== undefined && (
                <span>
                  {t('pdfTools.fileList.pageCount', {
                    count: file.pageCount,
                  })}
                </span>
              )}
              {!file.isInspecting && file.isEncrypted && (
                <span style={{ color: 'var(--tertiary)' }}>
                  {t('pdfTools.fileList.encrypted')}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="pdf-file-actions">
          <button
            type="button"
            className="pdf-file-delete-btn"
            onClick={() => onRemove(file.id)}
            title={t('pdfTools.fileList.removeTitle')}
            aria-label={t('pdfTools.fileList.removeAria', {
              name: file.name,
            })}
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
      </div>

      {file.isEncrypted && onPasswordChange && (
        <div className="pdf-password-field">
          <span className="material-symbols-outlined">lock</span>
          <input
            type="password"
            className="pdf-password-input"
            placeholder={t('pdfTools.fileList.passwordPlaceholder')}
            value={file.password || ''}
            onChange={(e) => onPasswordChange(file.id, e.target.value)}
            aria-label={t('pdfTools.fileList.passwordAria', {
              name: file.name,
            })}
          />
        </div>
      )}
    </div>
  );
};

export default PdfFileCard;
