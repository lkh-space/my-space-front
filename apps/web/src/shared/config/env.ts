/**
 * 전역 Window 객체에 주입되는 런타임 환경변수 인터페이스 선언
 */
declare global {
  interface Window {
    __ENV__?: Record<string, string | undefined>;
  }
}

/**
 * 인프라에서 주입한 런타임 환경변수(window.__ENV__)를 우선 조회하고,
 * 없으면 번들 타임 환경변수(import.meta.env) 또는 fallback 값을 반환합니다.
 *
 * @param key 환경변수 키 (예: 'VITE_API_BASE_URL')
 * @param fallback 값이 없을 경우 기본값
 */
export function getEnv(key: string, fallback = ''): string {
  if (
    typeof window !== 'undefined' &&
    window.__ENV__ &&
    window.__ENV__[key] !== undefined &&
    window.__ENV__[key] !== ''
  ) {
    return window.__ENV__[key] as string;
  }

  const buildTimeValue = import.meta.env[key] as string | undefined;
  if (buildTimeValue !== undefined && buildTimeValue !== '') {
    return buildTimeValue;
  }

  return fallback;
}
