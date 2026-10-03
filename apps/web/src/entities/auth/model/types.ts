/**
 * Authelia SSO 게이트웨이를 거쳐 백엔드에서 반환하는 현재 인증 유저 인터페이스
 */
export interface CurrentUser {
  username: string;
  displayName: string;
  email: string;
  groups: string[];
}

/**
 * 사용자 권한 등급을 분류하는 헬퍼 함수들
 * local-admin은 로컬 개발 환경용 특수 계정이므로 일반 admin 그룹과 명확히 구분합니다.
 */
export function isLocalAdminUser(user: CurrentUser | null): boolean {
  return user?.username === 'local-admin';
}

export function isGuestUser(user: CurrentUser | null): boolean {
  if (!user || isLocalAdminUser(user)) return false;
  return user.username === 'guest' || Boolean(user.groups?.includes('guests'));
}

export function isAdminUser(user: CurrentUser | null): boolean {
  if (!user || isLocalAdminUser(user)) return false;
  return user.username === 'admin' || Boolean(user.groups?.includes('admins'));
}
