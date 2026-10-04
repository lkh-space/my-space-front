import React from 'react';
import { ConnectorPath } from '../model/erdLayout';

interface SvgRelationsProps {
  connectors: ConnectorPath[];
  width: number;
  height: number;
}

export const SvgRelations: React.FC<SvgRelationsProps> = ({ connectors, width, height }) => {
  return (
    <svg
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        width: Math.max(1200, width),
        height: Math.max(800, height),
        pointerEvents: 'none',
        zIndex: 0,
      }}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <marker
          id="erd-arrow"
          markerHeight="6"
          markerWidth="6"
          orient="auto-start-reverse"
          refX="6"
          refY="5"
          viewBox="0 0 10 10"
        >
          <path d="M 0 1 L 10 5 L 0 9 z" fill="#adc6ff" />
        </marker>
        <linearGradient id="erd-line-grad" x1="0%" x2="100%" y1="0%" y2="0%">
          <stop offset="0%" stopColor="#4edea3" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#adc6ff" stopOpacity="0.85" />
        </linearGradient>
      </defs>

      {connectors.map((conn) => (
        <path
          key={conn.id}
          d={conn.d}
          fill="none"
          stroke="url(#erd-line-grad)"
          strokeWidth="1.5"
          strokeDasharray="4,4"
          markerEnd="url(#erd-arrow)"
        />
      ))}
    </svg>
  );
};
