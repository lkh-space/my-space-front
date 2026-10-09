import React from 'react';

interface AudioPlayerPillProps {
  isPlaying: boolean;
  currentTime?: string;
  duration?: string;
  onTogglePlay: () => void;
}

export const AudioPlayerPill: React.FC<AudioPlayerPillProps> = ({
  isPlaying,
  currentTime = '0:14',
  duration = '0:38',
  onTogglePlay,
}) => {
  return (
    <div className="audio-player-pill" aria-label="음성 재생 캡슐 컨트롤러">
      <button
        type="button"
        className="pill-play-btn"
        onClick={onTogglePlay}
        title={isPlaying ? '일시정지' : '재생'}
        aria-label={isPlaying ? '일시정지' : '재생'}
      >
        <span className="material-symbols-outlined text-[13px]">
          {isPlaying ? 'pause' : 'play_arrow'}
        </span>
      </button>

      {/* Mini Waveform Bars */}
      <div className="pill-waveform-group" aria-hidden="true">
        <div className={`mini-wave-bar h-2 ${isPlaying ? 'wave-active' : ''}`} />
        <div className={`mini-wave-bar h-3 ${isPlaying ? 'wave-active' : ''}`} />
        <div className={`mini-wave-bar h-1.5 ${isPlaying ? 'wave-active' : ''}`} />
        <div className={`mini-wave-bar h-2.5 ${isPlaying ? 'wave-idle' : ''}`} />
        <div className={`mini-wave-bar h-1.5 ${isPlaying ? 'wave-idle' : ''}`} />
        <div className={`mini-wave-bar h-2 ${isPlaying ? 'wave-idle' : ''}`} />
      </div>

      <span className="pill-timestamp">
        {currentTime} / {duration}
      </span>
    </div>
  );
};
