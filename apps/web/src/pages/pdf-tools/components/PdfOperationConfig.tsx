import React, { useState } from 'react';
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
  const [showPassword, setShowPassword] = useState(false);
  const meta = PDF_OPERATION_METAS[mode];

  return (
    <div className="pdf-config-card">
      <div className="pdf-config-header">
        <h3>
          <span className="material-symbols-outlined">{meta.icon}</span>
          <span>{meta.label} 설정</span>
        </h3>
      </div>

      <p className="pdf-title-desc">{meta.description}</p>

      {mode === 'split-range' && (
        <div className="pdf-input-group">
          <label htmlFor="split-range-input" className="pdf-input-label">
            <span>추출할 페이지 범위</span>
            <span className="pdf-input-hint">쉼표(,) 및 하이픈(-) 구분</span>
          </label>
          <input
            id="split-range-input"
            type="text"
            className="pdf-text-input"
            placeholder="예: 1-3, 5, 8-12"
            value={splitRangeInput}
            onChange={(e) => onSplitRangeChange(e.target.value)}
          />
        </div>
      )}

      {mode === 'unlock' && (
        <div className="pdf-input-group">
          <label htmlFor="unlock-password-input" className="pdf-input-label">
            <span>잠금 해제 비밀번호</span>
            <span className="pdf-input-hint">문서 열기/권한 암호 입력</span>
          </label>
          <div className="pdf-password-config-wrapper">
            <input
              id="unlock-password-input"
              type={showPassword ? 'text' : 'password'}
              className="pdf-text-input pdf-unlock-password-input"
              placeholder="잠금 해제할 PDF의 비밀번호를 입력하세요"
              value={unlockPassword}
              onChange={(e) => onUnlockPasswordChange?.(e.target.value)}
            />
            <button
              type="button"
              className="pdf-password-toggle-btn"
              onClick={() => setShowPassword((prev) => !prev)}
              aria-label={showPassword ? '비밀번호 숨기기' : '비밀번호 표시'}
              title={showPassword ? '비밀번호 숨기기' : '비밀번호 표시'}
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
          * 문서를 병합하려면 최소 2개 이상의 PDF 파일을 추가해주세요.
        </p>
      )}
    </div>
  );
};

export default PdfOperationConfig;
