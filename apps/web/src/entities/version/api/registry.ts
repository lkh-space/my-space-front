import { ServiceEndpointConfig } from '../model/types';

/**
 * 모니터링 대상 백엔드 서비스 레지스트리
 * - 향후 마이크로서비스 확장이 필요한 경우 이 배열에 엔드포인트를 추가하면 자동으로 헬스체크 및 버전을 조회합니다.
 */
export const DEFAULT_SERVICE_REGISTRY: ServiceEndpointConfig[] = [
  {
    id: 'backend-core',
    name: 'Backend Core API',
    endpoint: '/api/v1/version',
    isCritical: true,
  },
];
