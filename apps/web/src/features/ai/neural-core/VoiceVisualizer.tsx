import React from 'react';
import { AiEngineState, AudioSettings } from '../../../entities/ai';

interface VoiceVisualizerProps {
  engineState: AiEngineState;
  audioSettings: AudioSettings;
}

export const VoiceVisualizer: React.FC<VoiceVisualizerProps> = ({
  engineState,
  audioSettings,
}) => {
  const isSpeaking = engineState === 'SPEAKING';
  const isListening = engineState === 'LISTENING';
  const isActive = isSpeaking || isListening;

  const getPillText = () => {
    if (isListening) return 'LISTENING (MIC INPUT)';
    if (isSpeaking) return 'SPEAKING (TTS STREAMING)';
    if (engineState === 'THINKING') return 'PROCESSING (SYNAPSE)';
    return 'STANDBY (READY)';
  };

  const getSubText = () => {
    if (isListening) return 'WebAudio Mic: 48kHz';
    if (isSpeaking) return 'Piper Fast-WASM: 24kHz';
    return 'ONNX-WASM: 24kHz';
  };

  // 10개 사운드바의 개별 설정 (색상 및 딜레이)
  const soundBars = [
    { color: 'var(--color-primary, #adc6ff)', delay: '0.1s', baseHeight: 18 },
    { color: 'var(--color-primary, #adc6ff)', delay: '0.4s', baseHeight: 26 },
    { color: 'var(--color-tertiary, #ffb95f)', delay: '0.2s', baseHeight: 12 },
    { color: 'var(--color-primary, #adc6ff)', delay: '0.6s', baseHeight: 22 },
    { color: 'var(--color-secondary, #4edea3)', delay: '0.3s', baseHeight: 16 },
    { color: 'var(--color-primary, #adc6ff)', delay: '0.5s', baseHeight: 28 },
    { color: 'var(--color-tertiary, #ffb95f)', delay: '0.15s', baseHeight: 20 },
    { color: 'var(--color-primary, #adc6ff)', delay: '0.35s', baseHeight: 14 },
    { color: 'var(--color-primary, #adc6ff)', delay: '0.7s', baseHeight: 24 },
    { color: 'var(--color-secondary, #4edea3)', delay: '0.25s', baseHeight: 10 },
  ];

  return (
    <div className="voice-visualizer-container" aria-label="오디오 비주얼라이저 및 음성 텔레메트리">
      {/* Speaking Indicator Pill */}
      <div className={`voice-status-pill ${isActive ? 'pill-active' : ''}`}>
        <span className={`status-lamp ${isActive ? 'lamp-pulse' : ''}`} />
        <span className="status-label">{getPillText()}</span>
        <span className="status-divider">|</span>
        <span className="status-subtext">{getSubText()}</span>
      </div>

      {/* Equalizer Soundwave Bars */}
      <div className="soundwave-bars-wrap">
        {soundBars.map((bar, idx) => (
          <div
            key={idx}
            className={`sound-bar-item ${isActive ? 'sound-bar-animated' : ''}`}
            style={{
              backgroundColor: bar.color,
              animationDelay: bar.delay,
              height: isActive ? `${bar.baseHeight}px` : '6px',
            }}
          />
        ))}
      </div>

      {/* Voice Telemetry Gauge values */}
      <div className="voice-gauge-metrics">
        <span>
          VOL: <strong>{audioSettings.volumeDb.toFixed(1)} dBFS</strong>
        </span>
        <span className="gauge-dot">•</span>
        <span>
          PITCH: <strong className="text-tertiary">{audioSettings.pitchHz} Hz</strong>
        </span>
        <span className="gauge-dot">•</span>
        <span>
          SYNTH BUFFER: <strong className="text-secondary">{audioSettings.synthBufferMs} ms</strong>
        </span>
      </div>
    </div>
  );
};
