import React from 'react';
import { AudioSettings } from '../../../entities/ai';

interface TacticalAudioBarProps {
  audioSettings: AudioSettings;
  isSpeaking: boolean;
  onToggleMicMute: () => void;
  onInterruptSpeech: () => void;
  onSpeedChange: (speed: number) => void;
  onVoiceChange: (voice: string) => void;
}

export const TacticalAudioBar: React.FC<TacticalAudioBarProps> = ({
  audioSettings,
  isSpeaking,
  onToggleMicMute,
  onInterruptSpeech,
  onSpeedChange,
  onVoiceChange,
}) => {
  const speeds = [1.0, 1.25, 1.5];
  const nextSpeedIndex = (speeds.indexOf(audioSettings.speechSpeed) + 1) % speeds.length;

  const handleCycleSpeed = () => {
    onSpeedChange(speeds[nextSpeedIndex]);
  };

  return (
    <div className="tactical-audio-bar" aria-label="전술 오디오 제어 툴바">
      {/* 1. Mute Mic */}
      <button
        type="button"
        className={`tactical-btn ${audioSettings.isMicMuted ? 'btn-active-danger' : ''}`}
        onClick={onToggleMicMute}
        title="마이크 음소거 토글 (Alt+M)"
      >
        <span
          className={`material-symbols-outlined ${
            audioSettings.isMicMuted ? 'text-error' : 'text-on-surface'
          }`}
        >
          {audioSettings.isMicMuted ? 'mic_off' : 'mic'}
        </span>
        <span>{audioSettings.isMicMuted ? 'Unmute Mic' : 'Mute Mic'}</span>
        <kbd className="tactical-kbd">Alt+M</kbd>
      </button>

      {/* 2. Interrupt Speech */}
      <button
        type="button"
        className={`tactical-btn ${isSpeaking ? 'btn-highlight-warn' : ''}`}
        onClick={onInterruptSpeech}
        title="현재 발화 즉시 중단 (Space)"
      >
        <span className="material-symbols-outlined text-tertiary">stop_circle</span>
        <span>Interrupt Speech</span>
        <kbd className="tactical-kbd">Space</kbd>
      </button>

      {/* 3. Persona / Voice Switcher */}
      <div className="tactical-select-wrap">
        <span className="material-symbols-outlined text-primary">record_voice_over</span>
        <select
          aria-label="음성 합성 모델 선택"
          className="tactical-select"
          value={audioSettings.selectedVoice}
          onChange={(e) => onVoiceChange(e.target.value)}
        >
          <option value="JARVIS British AI">JARVIS British AI</option>
          <option value="JARVIS Fast Neural">JARVIS Fast Neural</option>
          <option value="JARVIS Deep Resonant">JARVIS Deep Resonant</option>
        </select>
        <span className="select-arrow">▾</span>
      </div>

      {/* 4. Speed Multiplier */}
      <button
        type="button"
        className="tactical-speed-btn"
        onClick={handleCycleSpeed}
        title="음성 배속 변경"
      >
        <span>{audioSettings.speechSpeed.toFixed(1)}x</span>
      </button>
    </div>
  );
};
