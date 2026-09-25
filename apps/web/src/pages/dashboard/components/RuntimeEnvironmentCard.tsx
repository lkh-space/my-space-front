import React from 'react';

export const RuntimeEnvironmentCard: React.FC = () => {
  // 로컬 런타임 상태 메트릭 (초기 정적/시뮬레이션 값)
  const cacheUsed = 128;
  const cacheMax = 512;
  const cachePercent = Math.round((cacheUsed / cacheMax) * 100);

  const memoryUsed = 412;
  const memoryMax = 2048;
  const memoryPercent = Math.round((memoryUsed / memoryMax) * 100);

  return (
    <div className="monitoring-card" aria-label="로컬 런타임 환경 상태 패널">
      <div className="monitoring-card-header">
        <h2>
          <span className="material-symbols-outlined" style={{ fontSize: 18, color: 'var(--text-muted)' }}>
            memory
          </span>
          <span>로컬 런타임 환경 상태</span>
        </h2>
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '10px',
            color: 'var(--secondary)',
            display: 'flex',
            alignItems: 'center',
            gap: 4,
          }}
        >
          <span className="sidebar-status-dot" style={{ width: 5, height: 5 }} />
          ACTIVE
        </span>
      </div>

      <div className="runtime-content">
        {/* Metric 1: Cache */}
        <div className="metric-group">
          <div className="metric-header">
            <span className="metric-label">로컬 캐시 메모리</span>
            <span className="metric-value">
              {cacheUsed} MB / {cacheMax} MB ({cachePercent}%)
            </span>
          </div>
          <div className="progress-track" role="progressbar" aria-valuenow={cachePercent} aria-valuemin={0} aria-valuemax={100}>
            <div className="progress-fill" style={{ width: `${cachePercent}%` }} />
          </div>
        </div>

        {/* Metric 2: Memory */}
        <div className="metric-group">
          <div className="metric-header">
            <span className="metric-label">프로세스 힙 메모리</span>
            <span className="metric-value">
              {memoryUsed} MB / {memoryMax} MB ({memoryPercent}%)
            </span>
          </div>
          <div className="progress-track" role="progressbar" aria-valuenow={memoryPercent} aria-valuemin={0} aria-valuemax={100}>
            <div className="progress-fill secondary" style={{ width: `${memoryPercent}%` }} />
          </div>
        </div>

        {/* Security & Isolation Box */}
        <div className="runtime-security-box">
          <div className="security-box-row">
            <span className="label">프로세스 격리</span>
            <span className="val">Wasm & Native Sandbox</span>
          </div>
          <div className="security-box-row">
            <span className="label">로컬 IPC 채널</span>
            <span className="val green">127.0.0.1:4200 (Connected)</span>
          </div>
          <div className="security-box-row">
            <span className="label">원격 텔레메트리</span>
            <span className="val green">비활성화 (100% Isolated)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
