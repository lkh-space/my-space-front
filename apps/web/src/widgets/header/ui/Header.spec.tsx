import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Header } from './Header';
import { AuthProvider, CurrentUser } from '../../../entities/auth';
import * as authApi from '../../../entities/auth/api/authApi';

describe('Header & UserProfileBadge Component', () => {
  const mockOnOpenCommandPalette = vi.fn();

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  const renderWithProviders = (user: CurrentUser | null) => {
    return render(
      <MemoryRouter initialEntries={['/']}>
        <AuthProvider initialUser={user} initialLoading={false}>
          <Header onOpenCommandPalette={mockOnOpenCommandPalette} />
        </AuthProvider>
      </MemoryRouter>,
    );
  };

  it('게스트 유저(guest)일 때 "[체험 모드] Guest Reviewer" 배지가 노출되어야 한다', () => {
    const guestUser: CurrentUser = {
      username: 'guest',
      displayName: 'Guest Reviewer',
      email: 'guest@homelab.local',
      groups: ['guests'],
    };

    renderWithProviders(guestUser);

    expect(screen.getByText('[체험 모드] Guest Reviewer')).toBeTruthy();
  });

  it('관리자 유저(admin)일 때 "[관리자] Administrator" 배지가 노출되어야 한다', () => {
    const adminUser: CurrentUser = {
      username: 'admin',
      displayName: 'Administrator',
      email: 'admin@homelab.local',
      groups: ['admins'],
    };

    renderWithProviders(adminUser);

    expect(screen.getByText('[관리자] Administrator')).toBeTruthy();
  });

  it('로컬 개발 유저(local-admin)일 때 "[로컬 개발]" 배지가 노출되어야 한다', () => {
    const localUser: CurrentUser = {
      username: 'local-admin',
      displayName: 'Local Developer',
      email: 'dev@homelab.local',
      groups: ['admins', 'dev'],
    };

    renderWithProviders(localUser);

    expect(screen.getByText('[로컬 개발]')).toBeTruthy();
  });

  it('로그아웃 버튼 클릭 시 performLogout을 호출해야 한다', () => {
    const logoutSpy = vi
      .spyOn(authApi, 'performLogout')
      .mockImplementation(() => undefined);

    const localUser: CurrentUser = {
      username: 'local-admin',
      displayName: 'Local Developer',
      email: 'dev@homelab.local',
      groups: ['admins', 'dev'],
    };

    renderWithProviders(localUser);

    // 인라인 빠른 로그아웃 버튼 클릭
    const logoutBtn = screen.getByRole('button', { name: '로그아웃' });
    fireEvent.click(logoutBtn);

    expect(logoutSpy).toHaveBeenCalledTimes(1);
  });

  it('프로필 칩 클릭 시 상세 드롭다운 메뉴가 열리고 이메일 및 소속 그룹이 표시되어야 한다', () => {
    const localUser: CurrentUser = {
      username: 'local-admin',
      displayName: 'Local Developer',
      email: 'dev@homelab.local',
      groups: ['admins', 'dev'],
    };

    renderWithProviders(localUser);

    const profileChip = screen.getByRole('button', {
      name: /로컬 개발/,
    });
    fireEvent.click(profileChip);

    // 드롭다운 내부 정보 확인
    expect(screen.getByText('@local-admin')).toBeTruthy();
    expect(screen.getByText('dev@homelab.local')).toBeTruthy();
    expect(screen.getByText('admins')).toBeTruthy();
    expect(screen.getByText('dev')).toBeTruthy();
  });
});
