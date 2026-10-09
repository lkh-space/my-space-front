import React from 'react';
import { AiEngineState } from '../../../entities/ai';

interface JarvisHoloCoreProps {
  engineState: AiEngineState;
}

export const JarvisHoloCore: React.FC<JarvisHoloCoreProps> = ({ engineState }) => {
  const getStatusLabel = () => {
    switch (engineState) {
      case 'LISTENING':
        return 'CORE: LISTENING';
      case 'THINKING':
        return 'CORE: PROCESSING';
      case 'SPEAKING':
        return 'CORE: ACTIVE';
      case 'IDLE':
      default:
        return 'CORE: STANDBY';
    }
  };

  const isSpeaking = engineState === 'SPEAKING';
  const isListening = engineState === 'LISTENING';

  return (
    <div
      className="jarvis-core-stage"
      aria-label="JARVIS Holographic Neural Core"
      role="region"
    >
      {/* Outer Telemetry Reticle Rings */}
      <div className={`holo-ring outer-ring holo-spin ${isSpeaking ? 'active-pulse' : ''}`}>
        <div className="reticle-mark mark-top" />
        <div className="reticle-mark mark-bottom" />
        <div className="reticle-mark mark-left" />
        <div className="reticle-mark mark-right" />
      </div>

      {/* Secondary Counter-Rotating Ring (Amber Synapse Filament) */}
      <div className="holo-ring filament-ring holo-spin-rev">
        <span className="orbital-node node-amber" />
        <span className="orbital-node node-primary" />
      </div>

      {/* Middle Holographic Frequency Ring */}
      <div className="holo-ring freq-ring holo-spin-fast">
        <div className="freq-inner-arc" />
      </div>

      {/* Glowing Synaptic Energy Sphere Backdrop */}
      <div
        className={`holo-glow-sphere holo-pulse ${
          isListening ? 'listening-glow' : isSpeaking ? 'speaking-glow' : ''
        }`}
      />

      {/* Dynamic SVG Holographic Core (Consciousness & Synapses) */}
      <div className="svg-core-wrap">
        <svg
          className="holo-core-svg"
          fill="none"
          viewBox="0 0 200 200"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          {/* Inner Orbitals */}
          <ellipse
            className="orbital-ellipse rotate-45 holo-spin"
            cx="100"
            cy="100"
            rx="76"
            ry="24"
            stroke="#adc6ff"
            strokeDasharray="2 4"
            strokeWidth="0.8"
          />
          <ellipse
            className="orbital-ellipse -rotate-45 holo-spin-rev"
            cx="100"
            cy="100"
            rx="76"
            ry="24"
            stroke="#ca8100"
            strokeDasharray="3 3"
            strokeWidth="0.8"
          />
          <ellipse
            cx="100"
            cy="100"
            rx="60"
            ry="60"
            stroke="#3b82f6"
            strokeOpacity="0.5"
            strokeWidth="1"
          />

          {/* Synaptic node paths */}
          <path
            d="M 60 100 Q 100 60 140 100"
            opacity="0.8"
            stroke="#adc6ff"
            strokeDasharray="4 6"
            strokeLinecap="round"
            strokeWidth="1.2"
          />
          <path
            d="M 100 60 Q 140 100 100 140"
            opacity="0.8"
            stroke="#ca8100"
            strokeDasharray="4 6"
            strokeLinecap="round"
            strokeWidth="1.2"
          />
          <path
            d="M 68 76 L 132 124"
            opacity="0.6"
            stroke="#ffddb8"
            strokeWidth="0.75"
          />
          <path
            d="M 132 76 L 68 124"
            opacity="0.6"
            stroke="#adc6ff"
            strokeWidth="0.75"
          />

          {/* Constellation Synaptic Nodes */}
          <circle
            cx="100"
            cy="100"
            fill="#adc6ff"
            fillOpacity="0.25"
            r="14"
            stroke="#adc6ff"
            strokeWidth="1.5"
          />
          <circle cx="100" cy="100" fill="#ffffff" r="6" />
          <circle cx="68" cy="76" fill="#f59e0b" r="3.5" />
          <circle cx="132" cy="76" fill="#adc6ff" r="3" />
          <circle cx="140" cy="100" fill="#4edea3" r="3" />
          <circle cx="60" cy="100" fill="#ffb95f" r="3" />
          <circle cx="68" cy="124" fill="#adc6ff" r="3" />
          <circle cx="132" cy="124" fill="#f59e0b" r="4" />
          <circle cx="100" cy="60" fill="#adc6ff" r="3" />
          <circle cx="100" cy="140" fill="#ca8100" r="3" />
        </svg>

        {/* Holographic Center Readout HUD */}
        <div className="holo-hud-overlay">
          <span className="hud-label-status">{getStatusLabel()}</span>
          <span className="hud-title-core">J.A.R.V.I.S.</span>
          <span className="hud-synapse-rate">98.4% SYNAPSE</span>
        </div>
      </div>
    </div>
  );
};
