import { useCallback, useEffect, useState } from 'react';
import {
  ServiceEndpointConfig,
  ServiceVersionInfo,
  SystemVersionState,
  VersionPayload,
} from '../model/types';
import { DEFAULT_SERVICE_REGISTRY } from './registry';

const TIMEOUT_MS = 3000;

/**
 * 단일 엔드포인트의 버전 정보를 비동기로 조회 (타임아웃 3초 적용)
 */
export async function fetchEndpointVersion(
  id: string,
  name: string,
  endpoint: string,
  isCritical = false,
  timeoutMs = TIMEOUT_MS,
): Promise<ServiceVersionInfo> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(endpoint, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });

    clearTimeout(timer);

    if (!res.ok) {
      return {
        id,
        name,
        endpoint,
        status: 'error',
        errorMessage: `HTTP ${res.status} ${res.statusText}`,
        isCritical,
      };
    }

    const data: VersionPayload = await res.json();
    return {
      id,
      name,
      endpoint,
      status: 'online',
      version: data.version,
      gitBranch: data.gitBranch,
      gitCommit: data.gitCommit,
      buildTime: data.buildTime,
      env: data.env,
      isCritical,
    };
  } catch (err: unknown) {
    clearTimeout(timer);
    const isTimeout = err instanceof Error && err.name === 'AbortError';
    const message = isTimeout ? 'Connection Timeout' : '서버 연결 실패';

    return {
      id,
      name,
      endpoint,
      status: 'error',
      errorMessage: message,
      isCritical,
    };
  }
}

/**
 * 프론트엔드 및 백엔드 다중 서비스의 버전과 헬스 상태를 조회하는 훅
 */
export function useSystemVersion(
  services: ServiceEndpointConfig[] = DEFAULT_SERVICE_REGISTRY,
): SystemVersionState {
  const [frontend, setFrontend] = useState<ServiceVersionInfo>({
    id: 'frontend',
    name: 'Frontend (Web)',
    endpoint: '/version',
    status: 'loading',
  });

  const [backendServices, setBackendServices] = useState<ServiceVersionInfo[]>(() =>
    services.map((s) => ({
      id: s.id,
      name: s.name,
      endpoint: s.endpoint,
      status: 'loading',
      isCritical: s.isCritical,
    })),
  );

  const [isLoading, setIsLoading] = useState(true);

  const loadAllVersions = useCallback(async () => {
    setIsLoading(true);

    // 1. 프론트엔드와 백엔드 서비스들 병렬 요청
    const frontendPromise = fetchEndpointVersion(
      'frontend',
      'Frontend (Web)',
      '/version',
      true,
    );

    const backendPromises = services.map((s) =>
      fetchEndpointVersion(s.id, s.name, s.endpoint, s.isCritical),
    );

    const [frontendRes, ...backendResults] = await Promise.all([
      frontendPromise,
      ...backendPromises,
    ]);

    setFrontend(frontendRes);
    setBackendServices(backendResults);
    setIsLoading(false);
  }, [services]);

  useEffect(() => {
    let isMounted = true;

    const run = async () => {
      setIsLoading(true);

      const frontendPromise = fetchEndpointVersion(
        'frontend',
        'Frontend (Web)',
        '/version',
        true,
      );

      const backendPromises = services.map((s) =>
        fetchEndpointVersion(s.id, s.name, s.endpoint, s.isCritical),
      );

      const [frontendRes, ...backendResults] = await Promise.all([
        frontendPromise,
        ...backendPromises,
      ]);

      if (isMounted) {
        setFrontend(frontendRes);
        setBackendServices(backendResults);
        setIsLoading(false);
      }
    };

    run();

    return () => {
      isMounted = false;
    };
  }, [services]);

  // 시스템 종합 상태 판정
  const hasError =
    frontend.status === 'error' ||
    backendServices.some((s) => s.status === 'error');

  const allOnline =
    frontend.status === 'online' &&
    backendServices.every((s) => s.status === 'online');

  // 헤더 뱃지에 표시할 텍스트 결정
  let displayBadgeText = 'checking...';
  if (!isLoading) {
    if (hasError) {
      displayBadgeText = 'error';
    } else if (allOnline) {
      // 주 백엔드 버전 우선, 없으면 프론트엔드 버전
      const primaryVersion =
        backendServices[0]?.version || frontend.version || '0.0.1';
      displayBadgeText = `v${primaryVersion.replace(/^v/, '')}`;
    }
  }

  const displayStatus = hasError
    ? 'error'
    : allOnline
    ? 'online'
    : 'loading';

  return {
    frontend,
    backendServices,
    allOnline,
    hasError,
    displayBadgeText,
    displayStatus,
    refetch: loadAllVersions,
    isLoading,
  };
}
