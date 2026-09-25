import React from 'react';

export const WorkspaceHeader: React.FC = () => {
  return (
    <section className="workspace-header" aria-labelledby="workspace-heading">
      <div className="workspace-title-group">
        <h1 id="workspace-heading">워크스페이스 개요</h1>
        <p>로컬 개발 환경 및 분산 유틸리티 실시간 모니터링</p>
      </div>

      <div className="isolation-status-chip" title="모든 작업은 브라우저 내부 및 로컬 호스트에서만 처리됩니다">
        <span className="status-dot" />
        <span>로컬 격리 환경</span>
        <span className="status-code">Zero Telemetry</span>
      </div>
    </section>
  );
};
