import { useAuth, AuthContextValue } from '../model/AuthContext';
import {
  CurrentUser,
  isGuestUser,
  isAdminUser,
  isLocalAdminUser,
} from '../model/types';

export interface UseCurrentUserReturn extends AuthContextValue {
  isGuest: boolean;
  isAdmin: boolean;
  isLocalAdmin: boolean;
}

/**
 * 현재 로그인한 사용자 정보, 로딩/에러 상태, 권한 플래그 및 로그아웃 함수를 제공하는 훅
 */
export function useCurrentUser(): UseCurrentUserReturn {
  const auth = useAuth();
  const { user } = auth;

  return {
    ...auth,
    isLocalAdmin: isLocalAdminUser(user),
    isGuest: isGuestUser(user),
    isAdmin: isAdminUser(user),
  };
}

export type { CurrentUser };
