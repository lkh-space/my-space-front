import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { fetchEndpointVersion, useSystemVersion } from './useSystemVersion';
import { ServiceEndpointConfig } from '../model/types';

describe('useSystemVersion & fetchEndpointVersion', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('정상적인 응답일 경우 online 상태와 버전 정보를 반환해야 한다', async () => {
    const mockPayload = {
      name: 'my-space-backend',
      version: '0.0.1',
      gitBranch: 'main',
      gitCommit: '586e4d3',
      buildTime: '2026-10-04T08:02:37Z',
      env: 'production',
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockPayload,
    } as Response);

    const res = await fetchEndpointVersion('test', 'Test API', '/api/test');
    expect(res.status).toBe('online');
    expect(res.version).toBe('0.0.1');
    expect(res.gitCommit).toBe('586e4d3');
    expect(res.gitBranch).toBe('main');
  });

  it('HTTP 오류 응답일 경우 error 상태를 반환해야 한다', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 502,
      statusText: 'Bad Gateway',
    } as Response);

    const res = await fetchEndpointVersion('test', 'Test API', '/api/test');
    expect(res.status).toBe('error');
    expect(res.errorMessage).toBe('HTTP 502 Bad Gateway');
  });

  it('네트워크 예외 발생 시 error 상태와 실패 메시지를 반환해야 한다', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Network Failed'));

    const res = await fetchEndpointVersion('test', 'Test API', '/api/test');
    expect(res.status).toBe('error');
    expect(res.errorMessage).toBe('서버 연결 실패');
  });

  it('useSystemVersion 훅에서 모든 서버 정상 시 v0.0.1 및 online을 계산해야 한다', async () => {
    global.fetch = vi.fn().mockImplementation((url: string) => {
      const isFrontend = url === '/version';
      return Promise.resolve({
        ok: true,
        json: async () => ({
          name: isFrontend ? 'my-space-frontend' : 'my-space-backend',
          version: '0.0.1',
          gitBranch: 'main',
          gitCommit: '586e4d3',
          env: 'production',
        }),
      } as Response);
    });

    const testServices: ServiceEndpointConfig[] = [
      { id: 'backend-core', name: 'Backend API', endpoint: '/api/v1/version' },
    ];

    const { result } = renderHook(() => useSystemVersion(testServices));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.allOnline).toBe(true);
    expect(result.current.hasError).toBe(false);
    expect(result.current.displayBadgeText).toBe('v0.0.1');
    expect(result.current.displayStatus).toBe('online');
  });

  it('백엔드 서버 연결 실패 시 displayBadgeText가 error여야 한다', async () => {
    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url === '/version') {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            name: 'my-space-frontend',
            version: '0.0.1',
          }),
        } as Response);
      }
      // 백엔드는 실패
      return Promise.reject(new Error('Connection refused'));
    });

    const testServices: ServiceEndpointConfig[] = [
      { id: 'backend-core', name: 'Backend API', endpoint: '/api/v1/version' },
    ];

    const { result } = renderHook(() => useSystemVersion(testServices));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.allOnline).toBe(false);
    expect(result.current.hasError).toBe(true);
    expect(result.current.displayBadgeText).toBe('error');
    expect(result.current.displayStatus).toBe('error');
    expect(result.current.backendServices[0].status).toBe('error');
  });
});
