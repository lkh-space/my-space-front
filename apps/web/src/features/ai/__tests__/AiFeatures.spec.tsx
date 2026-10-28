import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import {
  JarvisHoloCore,
  VoiceVisualizer,
  TacticalAudioBar,
  PttInputBar,
  AudioPlayerPill,
  BenchmarkDeltaCard,
  SpokenMessageCard,
  FollowUpInputBar,
  NeuralStreamList,
} from '../index';
import { AudioSettings, SpokenTranscriptMessage } from '../../../entities/ai';

const mockAudioSettings: AudioSettings = {
  isMicMuted: false,
  speechSpeed: 1.0,
  selectedVoice: 'JARVIS British AI',
  volumeDb: -14.2,
  pitchHz: 118,
  synthBufferMs: 384,
};

describe('AI Feature Components', () => {
  describe('JarvisHoloCore', () => {
    it('초기 STANDBY 상태에서 정상 렌더링되어야 한다', () => {
      render(<JarvisHoloCore engineState="IDLE" />);
      expect(screen.getByText('CORE: STANDBY')).toBeTruthy();
      expect(screen.getByText('J.A.R.V.I.S.')).toBeTruthy();
      expect(screen.getByText('98.4% SYNAPSE')).toBeTruthy();
    });

    it('SPEAKING 상태에서 ACTIVE 라벨이 표시되어야 한다', () => {
      render(<JarvisHoloCore engineState="SPEAKING" />);
      expect(screen.getByText('CORE: ACTIVE')).toBeTruthy();
    });

    it('LISTENING 상태에서 LISTENING 라벨이 표시되어야 한다', () => {
      render(<JarvisHoloCore engineState="LISTENING" />);
      expect(screen.getByText('CORE: LISTENING')).toBeTruthy();
    });
  });

  describe('VoiceVisualizer', () => {
    it('볼륨, 피치, 버퍼 텔레메트리 값이 정상 표출되어야 한다', () => {
      render(
        <VoiceVisualizer
          engineState="IDLE"
          audioSettings={mockAudioSettings}
        />
      );

      expect(screen.getByText('-14.2 dBFS')).toBeTruthy();
      expect(screen.getByText('118 Hz')).toBeTruthy();
      expect(screen.getByText('384 ms')).toBeTruthy();
    });
  });

  describe('TacticalAudioBar', () => {
    it('Mute 버튼 클릭 시 토글 핸들러가 호출되어야 한다', () => {
      const onToggleMicMute = vi.fn();
      render(
        <TacticalAudioBar
          audioSettings={mockAudioSettings}
          isSpeaking={false}
          onToggleMicMute={onToggleMicMute}
          onInterruptSpeech={vi.fn()}
          onSpeedChange={vi.fn()}
          onVoiceChange={vi.fn()}
        />
      );

      fireEvent.click(screen.getByText('Mute Mic'));
      expect(onToggleMicMute).toHaveBeenCalledTimes(1);
    });

    it('배속 버튼 클릭 시 onSpeedChange가 호출되어야 한다', () => {
      const onSpeedChange = vi.fn();
      render(
        <TacticalAudioBar
          audioSettings={mockAudioSettings}
          isSpeaking={false}
          onToggleMicMute={vi.fn()}
          onInterruptSpeech={vi.fn()}
          onSpeedChange={onSpeedChange}
          onVoiceChange={vi.fn()}
        />
      );

      fireEvent.click(screen.getByText('1.0x'));
      expect(onSpeedChange).toHaveBeenCalledWith(1.25);
    });
  });

  describe('PttInputBar', () => {
    it('텍스트 입력 후 Send 클릭 시 onSendQuery가 호출되어야 한다', () => {
      const onSendQuery = vi.fn();
      render(
        <PttInputBar
          engineState="IDLE"
          onStartListening={vi.fn()}
          onStopListeningAndSend={vi.fn()}
          onSendQuery={onSendQuery}
        />
      );

      const input = screen.getByLabelText('음성 또는 텍스트 쿼리 입력');
      fireEvent.change(input, { target: { value: 'Analyze OPFS locks' } });
      fireEvent.click(screen.getByRole('button', { name: '쿼리 전송' }));

      expect(onSendQuery).toHaveBeenCalledWith('Analyze OPFS locks');
    });

    it('PTT 버튼 마우스 다운/업 시 이벤트가 트리거되어야 한다', () => {
      const onStart = vi.fn();
      const onStop = vi.fn();
      render(
        <PttInputBar
          engineState="IDLE"
          onStartListening={onStart}
          onStopListeningAndSend={onStop}
          onSendQuery={vi.fn()}
        />
      );

      const pttBtn = screen.getByText('PTT: Hold Space');
      fireEvent.mouseDown(pttBtn);
      expect(onStart).toHaveBeenCalledTimes(1);

      fireEvent.mouseUp(pttBtn);
      expect(onStop).toHaveBeenCalledTimes(1);
    });
  });

  describe('Transcript Panel Components', () => {
    it('AudioPlayerPill 클릭 시 토글 콜백이 호출되어야 한다', () => {
      const onToggle = vi.fn();
      render(
        <AudioPlayerPill
          isPlaying={false}
          currentTime="0:14"
          duration="0:38"
          onTogglePlay={onToggle}
        />
      );

      expect(screen.getByText('0:14 / 0:38')).toBeTruthy();
      fireEvent.click(screen.getByRole('button', { name: '재생' }));
      expect(onToggle).toHaveBeenCalledTimes(1);
    });

    it('BenchmarkDeltaCard에 벤치마크 지표가 렌더링되어야 한다', () => {
      render(
        <BenchmarkDeltaCard
          metrics={{
            workerName: 'local-worker',
            opfsStream: '~1.8ms lat',
            remoteSse: '~8.4ms lat',
          }}
        />
      );

      expect(screen.getByText('BENCHMARK DELTA')).toBeTruthy();
      expect(screen.getByText('local-worker')).toBeTruthy();
      expect(screen.getByText('~1.8ms lat')).toBeTruthy();
      expect(screen.getByText('~8.4ms lat')).toBeTruthy();
    });

    it('SpokenMessageCard에서 복사 및 마크다운 저장 버튼이 동작해야 한다', () => {
      const onSave = vi.fn();
      const mockMsg: SpokenTranscriptMessage = {
        id: 'msg-1',
        role: 'assistant',
        content: 'Test content message',
        timestamp: '10:00 AM',
        audioDuration: '0:30',
        currentTime: '0:10',
        benchmarkDelta: {
          workerName: 'worker',
          opfsStream: '1ms',
          remoteSse: '5ms',
        },
      };

      render(
        <SpokenMessageCard
          message={mockMsg}
          isPlayingAudio={false}
          onTogglePlayAudio={vi.fn()}
          onSaveToMarkdown={onSave}
        />
      );

      expect(screen.getByText('Test content message')).toBeTruthy();
      fireEvent.click(screen.getByText('Save to Markdown'));
      expect(onSave).toHaveBeenCalledWith('Test content message');
    });

    it('SpokenMessageCard에 latencyMs가 있으면 응답 소요 시간 뱃지가 표출되어야 한다', () => {
      const mockMsgWithLatency: SpokenTranscriptMessage = {
        id: 'msg-latency',
        role: 'assistant',
        content: 'Latency measured response',
        timestamp: '11:00 AM',
        latencyMs: 850,
      };

      render(
        <SpokenMessageCard
          message={mockMsgWithLatency}
          isPlayingAudio={false}
          onTogglePlayAudio={vi.fn()}
        />
      );

      expect(screen.getByText('850ms')).toBeTruthy();
    });

    it('어시스턴트 답변 생성 대기 중(content가 빈 문자열)일 때 로딩 인디케이터가 렌더링되어야 한다', () => {
      const pendingMsg: SpokenTranscriptMessage = {
        id: 'msg-pending',
        role: 'assistant',
        content: '',
        timestamp: '11:01 AM',
      };

      render(
        <SpokenMessageCard
          message={pendingMsg}
          isPlayingAudio={false}
          onTogglePlayAudio={vi.fn()}
        />
      );

      expect(screen.getByText('J.A.R.V.I.S.가 답변을 생성하고 있습니다...')).toBeTruthy();
    });

    it('FollowUpInputBar 엔터 입력 시 onSend가 호출되어야 한다', () => {
      const onSend = vi.fn();
      render(<FollowUpInputBar onSend={onSend} />);

      const input = screen.getByLabelText('후속 질문 입력');
      fireEvent.change(input, { target: { value: 'Follow up question' } });
      fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

      expect(onSend).toHaveBeenCalledWith('Follow up question');
    });
  });

  describe('NeuralStreamList', () => {
    it('세션 목록 및 항목 클릭이 동작해야 한다', () => {
      const onSelect = vi.fn();
      const onNew = vi.fn();
      const sessions = [
        {
          id: 's-1',
          title: 'Session 1',
          status: 'LIVE' as const,
          createdAt: '',
          updatedAt: '',
        },
        {
          id: 's-2',
          title: 'Session 2',
          status: 'idle' as const,
          createdAt: '',
          updatedAt: '',
        },
      ];

      render(
        <NeuralStreamList
          sessions={sessions}
          activeSessionId="s-1"
          onSelectSession={onSelect}
          onNewSession={onNew}
        />
      );

      expect(screen.getByText('Session 1')).toBeTruthy();
      expect(screen.getByText('Session 2')).toBeTruthy();

      fireEvent.click(screen.getByText('Session 2'));
      expect(onSelect).toHaveBeenCalledWith('s-2');

      fireEvent.click(screen.getByRole('button', { name: '새 신경망 세션 시작' }));
      expect(onNew).toHaveBeenCalledTimes(1);
    });
  });
});
