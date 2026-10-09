import React from 'react';
import { BenchmarkMetrics } from '../../../entities/ai';

interface BenchmarkDeltaCardProps {
  metrics: BenchmarkMetrics;
}

export const BenchmarkDeltaCard: React.FC<BenchmarkDeltaCardProps> = ({ metrics }) => {
  return (
    <div className="benchmark-delta-card" aria-label="벤치마크 텔레메트리 메트릭">
      <div className="benchmark-card-header">
        <span className="benchmark-header-title">BENCHMARK DELTA</span>
        <span className="benchmark-worker-tag">{metrics.workerName}</span>
      </div>
      <div className="benchmark-card-body">
        <div className="benchmark-metric-row">
          <span className="metric-label">OPFS Stream:</span>
          <span className="metric-value-good">{metrics.opfsStream}</span>
        </div>
        <div className="benchmark-metric-row">
          <span className="metric-label">Remote SSE:</span>
          <span className="metric-value-warn">{metrics.remoteSse}</span>
        </div>
      </div>
    </div>
  );
};
