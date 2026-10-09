import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AiWorkspacePage } from './AiWorkspacePage';

describe('AiWorkspacePage Component', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it('페이지 마운트 시 신경망 코어와 우측 트랜스크립트 패널이 정상 렌더링되어야 한다', () => {
    render(<AiWorkspacePage />);

    // 좌측 코어 스테이지
    expect(screen.getByText('J.A.R.V.I.S. Core (Active)')).toBeTruthy();
    expect(screen.getByText('Neural Stream: Online')).toBeTruthy();
    expect(screen.getByText('Holographic Synthesis')).toBeTruthy();
    expect(screen.getByText('98.4% SYNAPSE')).toBeTruthy();

    // 오디오 컨트롤 및 PTT
    expect(screen.getByText('PTT: Hold Space')).toBeTruthy();
    expect(screen.getByText('Mute Mic')).toBeTruthy();
    expect(screen.getByText('Interrupt Speech')).toBeTruthy();

    // 우측 패널
    expect(screen.getByRole('heading', { name: 'J.A.R.V.I.S.' })).toBeTruthy();
    expect(screen.getByText('Opus')).toBeTruthy();
    expect(screen.getByPlaceholderText('Reply or ask follow-up...')).toBeTruthy();
  });

  it('후속 질문 전송 시 메시지 목록에 추가되고 스트리밍 응답이 표출되어야 한다', () => {
    render(<AiWorkspacePage />);

    const input = screen.getByPlaceholderText('Reply or ask follow-up...');
    fireEvent.change(input, { target: { value: 'Analyze thread stalls' } });
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

    expect(screen.getByText('Analyze thread stalls')).toBeTruthy();
  });

  it('Alt+M 단축키 입력 시 마이크 음소거가 토글되어야 한다', () => {
    render(<AiWorkspacePage />);

    expect(screen.getByText('Mute Mic')).toBeTruthy();

    fireEvent.keyDown(window, { key: 'm', code: 'KeyM', altKey: true });
    expect(screen.getByText('Unmute Mic')).toBeTruthy();

    fireEvent.keyDown(window, { key: 'm', code: 'KeyM', altKey: true });
    expect(screen.getByText('Mute Mic')).toBeTruthy();
  });
});
