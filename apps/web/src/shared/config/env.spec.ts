import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getEnv } from './env';

interface CustomWindow extends Window {
  __ENV__?: Record<string, string | undefined>;
}

describe('getEnv', () => {
  const customWindow = window as unknown as CustomWindow;
  const originalEnv = customWindow.__ENV__;

  beforeEach(() => {
    customWindow.__ENV__ = {};
  });

  afterEach(() => {
    customWindow.__ENV__ = originalEnv;
  });

  it('window.__ENV__에 값이 있으면 해당 값을 우선 반환해야 한다', () => {
    customWindow.__ENV__ = {
      VITE_API_BASE_URL: '/custom-api',
    };

    expect(getEnv('VITE_API_BASE_URL', '/default')).toBe('/custom-api');
  });

  it('window.__ENV__에 값이 없으면 fallback 값을 반환해야 한다', () => {
    customWindow.__ENV__ = {};

    expect(getEnv('NON_EXISTENT_KEY', 'default-value')).toBe('default-value');
  });

  it('window.__ENV__가 undefined여도 에러 없이 fallback을 반환해야 한다', () => {
    delete (window as { __ENV__?: Record<string, string | undefined> }).__ENV__;

    expect(getEnv('ANY_KEY', 'safe-fallback')).toBe('safe-fallback');
  });
});
