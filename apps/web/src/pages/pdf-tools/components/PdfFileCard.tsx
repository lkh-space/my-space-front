import React from 'react';
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
              {file.pageCount !== undefined && (
                <span>• {file.pageCount} 페이지</span>
              )}
              {file.isEncrypted && (
                <span style={{ color: 'var(--tertiary)' }}>• 암호화됨</span>
              )}
            </div>
          </div>
        </div>

        <div className="pdf-file-actions">
          <button
            type="button"
            className="pdf-file-delete-btn"
            onClick={() => onRemove(file.id)}
            title="파일 목록에서 제거"
            aria-label={`${file.name} 파일 제거`}
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
            placeholder="암호화된 PDF 비밀번호 입력..."
            value={file.password || ''}
            onChange={(e) => onPasswordChange(file.id, e.target.value)}
            aria-label={`${file.name} 파일 비밀번호`}
          />
        </div>
      )}
    </div>
  );
};

export default PdfFileCard;
