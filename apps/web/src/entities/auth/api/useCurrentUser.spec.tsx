import type { ReactNode } from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { AuthProvider } from '../model/AuthContext';
import { useCurrentUser } from './useCurrentUser';
import * as authApi from './authApi';
import { CurrentUser } from '../model/types';

describe('useCurrentUser hook', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('로컬 관리자(local-admin) 정보를 올바르게 식별해야 한다', async () => {
    const mockUser: CurrentUser = {
      username: 'local-admin',
      displayName: 'Local Developer',
      email: 'dev@homelab.local',
      groups: ['admins', 'dev'],
    };

    vi.spyOn(authApi, 'fetchCurrentUser').mockResolvedValue(mockUser);

    const wrapper = ({ children }: { children: ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    );

    const { result } = renderHook(() => useCurrentUser(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.user).toEqual(mockUser);
    expect(result.current.isLocalAdmin).toBe(true);
    expect(result.current.isAdmin).toBe(false); // username === 'admin' 체크
    expect(result.current.isGuest).toBe(false);
  });

  it('체험 모드(guest) 사용자를 올바르게 식별해야 한다', async () => {
    const mockUser: CurrentUser = {
      username: 'guest',
      displayName: 'Guest Reviewer',
      email: 'guest@homelab.local',
      groups: ['guests'],
    };

    vi.spyOn(authApi, 'fetchCurrentUser').mockResolvedValue(mockUser);

    const wrapper = ({ children }: { children: ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    );

    const { result } = renderHook(() => useCurrentUser(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.user).toEqual(mockUser);
    expect(result.current.isGuest).toBe(true);
    expect(result.current.isAdmin).toBe(false);
    expect(result.current.isLocalAdmin).toBe(false);
  });

  it('관리자(admin) 사용자를 올바르게 식별해야 한다', async () => {
    const mockUser: CurrentUser = {
      username: 'admin',
      displayName: 'Administrator',
      email: 'admin@homelab.local',
      groups: ['admins'],
    };

    vi.spyOn(authApi, 'fetchCurrentUser').mockResolvedValue(mockUser);

    const wrapper = ({ children }: { children: ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    );

    const { result } = renderHook(() => useCurrentUser(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.user).toEqual(mockUser);
    expect(result.current.isAdmin).toBe(true);
    expect(result.current.isGuest).toBe(false);
    expect(result.current.isLocalAdmin).toBe(false);
  });

  it('API 실패 시 에러 상태를 반영해야 한다', async () => {
    vi.spyOn(authApi, 'fetchCurrentUser').mockRejectedValue(
      new Error('401 Unauthorized'),
    );

    const wrapper = ({ children }: { children: ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    );

    const { result } = renderHook(() => useCurrentUser(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.user).toBeNull();
    expect(result.current.error).toBeDefined();
    expect(result.current.error?.message).toBe('401 Unauthorized');
  });

  it('logout 호출 시 performLogout을 실행해야 한다', async () => {
    const logoutSpy = vi.spyOn(authApi, 'performLogout').mockImplementation(() => undefined);

    const wrapper = ({ children }: { children: ReactNode }) => (
      <AuthProvider initialUser={null} initialLoading={false}>
        {children}
      </AuthProvider>
    );

    const { result } = renderHook(() => useCurrentUser(), { wrapper });

    act(() => {
      result.current.logout();
    });

    expect(logoutSpy).toHaveBeenCalledTimes(1);
  });
});
