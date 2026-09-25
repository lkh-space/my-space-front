import React from 'react';

export const PdfViewHeader: React.FC = () => {
  return (
    <div className="pdf-header">
      <div className="pdf-title-group">
        <div className="pdf-title-row">
          <h1>PDF 처리 엔진</h1>
          <span className="pdf-badge">v1.2</span>
          <span className="pdf-badge">LOCAL-ISOLATED</span>
        </div>
        <p className="pdf-title-desc">
          외부 클라우드 전송 없이 안전하게 PDF를 병합, 분할, 암호 해제합니다.
        </p>
      </div>

      <div
        className="pdf-telemetry-chip"
        title="네트워크 유출 없는 100% 로컬 환경"
      >
        <span className="status-dot" />
        <span className="status-code">ZERO-TELEMETRY</span>
      </div>
    </div>
  );
};

export default PdfViewHeader;
