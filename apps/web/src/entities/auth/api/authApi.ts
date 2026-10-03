import { getJson } from '../../../shared/api';
import { CurrentUser } from '../model/types';

export const AUTH_ME_ENDPOINT = '/api/v1/auth/me';
export const DEFAULT_LOGOUT_URL = 'https://auth.homelab.local/logout';

/**
 * 백엔드 GET /api/v1/auth/me를 호출하여 현재 세션의 인증 유저 정보를 가져옵니다.
 * 동일 Origin 요청으로 Authelia 세션 쿠키가 자동 포함됩니다.
 */
export async function fetchCurrentUser(): Promise<CurrentUser> {
  return getJson<CurrentUser>(AUTH_ME_ENDPOINT);
}

/**
 * Authelia SSO 세션을 종료하고 로그아웃 포털로 브라우저를 이동시킵니다.
 */
export function performLogout(logoutUrl: string = DEFAULT_LOGOUT_URL): void {
  if (typeof window !== 'undefined') {
    window.location.href = logoutUrl;
  }
}
