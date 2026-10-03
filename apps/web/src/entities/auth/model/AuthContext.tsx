import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  ReactNode,
} from 'react';
import { CurrentUser } from './types';
import { fetchCurrentUser, performLogout } from '../api/authApi';

export interface AuthContextValue {
  user: CurrentUser | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export interface AuthProviderProps {
  children: ReactNode;
  initialUser?: CurrentUser | null;
  initialLoading?: boolean;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({
  children,
  initialUser = null,
  initialLoading,
}) => {
  const [user, setUser] = useState<CurrentUser | null>(initialUser);
  const [isLoading, setIsLoading] = useState<boolean>(
    initialLoading !== undefined ? initialLoading : initialUser === null,
  );
  const [error, setError] = useState<Error | null>(null);

  const loadUser = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchCurrentUser();
      setUser(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // initialUser가 제공되지 않았을 때만 마운트 시 API 조회
    if (initialUser === null && initialLoading === undefined) {
      loadUser();
    }
  }, [initialUser, initialLoading, loadUser]);

  const logout = useCallback(() => {
    performLogout();
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isLoading,
      error,
      refetch: loadUser,
      logout,
    }),
    [user, isLoading, error, loadUser, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth는 AuthProvider 내부에서만 사용할 수 있습니다.');
  }
  return context;
}
