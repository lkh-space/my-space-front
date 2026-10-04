import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { VersionBadge } from './VersionBadge';

describe('VersionBadge Component', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('모든 서버가 정상일 때 대표 버전 텍스트와 online 상태 점이 노출되어야 한다', async () => {
    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes('/version')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({
            name: url.includes('/api/v1') ? 'my-space-backend' : 'my-space-frontend',
            version: '0.0.1',
            gitBranch: 'main',
            gitCommit: '586e4d3',
            buildTime: '2026-10-04T08:02:37Z',
            env: 'production',
          }),
        });
      }
      return Promise.reject(new Error('Unknown url'));
    });

    render(<VersionBadge />);

    // 초기 혹은 완료 후 v0.0.1 표시 확인
    await waitFor(() => {
      expect(screen.getByText('v0.0.1')).toBeTruthy();
    });

    const chip = screen.getByRole('button', { name: /시스템 버전 확인/ });
    expect(chip.className).toContain('status-online');
  });

  it('백엔드 서버 응답 실패 시 헤더 칩에 "error"와 error 상태가 노출되어야 한다', async () => {
    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url === '/version') {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({
            name: 'my-space-frontend',
            version: '0.0.1',
            gitBranch: 'main',
            gitCommit: '586e4d3',
          }),
        });
      }
      // 백엔드는 502 에러
      return Promise.resolve({
        ok: false,
        status: 502,
        statusText: 'Bad Gateway',
      });
    });

    render(<VersionBadge />);

    await waitFor(() => {
      expect(screen.getByText('error')).toBeTruthy();
    });

    const chip = screen.getByRole('button', { name: /시스템 버전 확인/ });
    expect(chip.className).toContain('status-error');
  });

  it('칩 클릭 시 상세 드롭다운 팝오버가 열리고 닫기 버튼으로 닫혀야 한다', async () => {
    global.fetch = vi.fn().mockImplementation(() =>
      Promise.resolve({
        ok: true,
        status: 200,
        json: async () => ({
          name: 'my-space-frontend',
          version: '0.0.1',
          gitBranch: 'feat/version',
          gitCommit: 'abc1234',
        }),
      }),
    );

    render(<VersionBadge />);

    await waitFor(() => {
      expect(screen.getByText('v0.0.1')).toBeTruthy();
    });

    const chip = screen.getByRole('button', { name: /시스템 버전 확인/ });
    fireEvent.click(chip);

    // 팝오버 다이얼로그 열림
    const dialog = screen.getByRole('dialog', { name: '시스템 버전 및 서버 상태' });
    expect(dialog).toBeTruthy();
    expect(screen.getByText('System Version & Health')).toBeTruthy();
    expect(screen.getAllByText('feat/version').length).toBeGreaterThanOrEqual(1);

    // 닫기 버튼 클릭
    const closeBtn = screen.getByRole('button', { name: '팝오버 닫기' });
    fireEvent.click(closeBtn);

    expect(screen.queryByRole('dialog')).toBeNull();
  });
});
