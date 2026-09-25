export interface WorkspaceNavEntry {
  id: string;
  path: string;
  title: string;
  shortLabel: string;
  icon: string;
  category: '워크스페이스' | '유틸리티' | '시스템' | '탐색';
  breadcrumbPage: string;
  badge?: string;
  end?: boolean;
  commandDescription: string;
  // 벤토 그리드(설치된 유틸리티) 전용 메타데이터
  isInstalledUtility: boolean;
  utilityTitle?: string;
  description?: string;
  statusTag?: string;
  lastUsed?: string;
}

export const WORKSPACE_NAV_ENTRIES: WorkspaceNavEntry[] = [
  {
    id: 'dashboard',
    path: '/',
    title: '대시보드',
    shortLabel: '대시보드',
    icon: 'dashboard',
    category: '워크스페이스',
    breadcrumbPage: '대시보드',
    badge: 'Home',
    end: true,
    commandDescription: '대시보드 (Workspace Overview)',
    isInstalledUtility: false,
  },
  {
    id: 'pdf-tools',
    path: '/pdf-tools',
    title: 'PDF 유틸리티',
    shortLabel: 'PDF 도구',
    icon: 'picture_as_pdf',
    category: '유틸리티',
    breadcrumbPage: 'PDF 처리 엔진',
    badge: 'v1.2',
    commandDescription: 'PDF 처리 엔진 (Merge, Split, Compress)',
    isInstalledUtility: true,
    utilityTitle: 'PDF 처리 엔진',
    description: 'PDF 문서 병합, 페이지 분할, 메타데이터 제거 및 로컬 최적화 처리',
    statusTag: 'ACTIVE',
    lastUsed: '12분 전 사용',
  },
  {
    id: 'dbml-tools',
    path: '/dbml-tools',
    title: 'DBML 유틸리티',
    shortLabel: 'DBML',
    icon: 'schema',
    category: '유틸리티',
    breadcrumbPage: 'DBML 스키마',
    badge: 'v0.9',
    commandDescription: 'DBML 스키마 변환기 (PostgreSQL, MySQL, DDL)',
    isInstalledUtility: true,
    utilityTitle: 'DBML 스키마 변환기',
    description: 'DBML 기반 ERD 시각화 및 PostgreSQL/MySQL DDL 스키마 양방향 코드 생성',
    statusTag: 'READY',
    lastUsed: '1시간 전 사용',
  },
  {
    id: 'docs',
    path: '/docs',
    title: '마크다운 문서',
    shortLabel: '문서',
    icon: 'description',
    category: '워크스페이스',
    breadcrumbPage: '마크다운 문서',
    badge: 'Docs',
    commandDescription: '마크다운 문서 뷰어',
    isInstalledUtility: true,
    utilityTitle: '마크다운 문서 뷰어',
    description: '로컬 개발 명세(Spec) 및 아키텍처 결정(ADR) 실시간 GFM 렌더링',
    statusTag: 'READY',
    lastUsed: '3시간 전 사용',
  },
];

/**
 * 대시보드 벤토 그리드에 노출되는 설치된 유틸리티 목록
 */
export const INSTALLED_UTILITIES = WORKSPACE_NAV_ENTRIES.filter(
  (entry) => entry.isInstalledUtility
);

/**
 * URL 경로(pathname)에 대응하는 브레드크럼 정보 반환
 */
export function getBreadcrumbByPath(pathname: string): {
  category: string;
  page: string;
} {
  const match = WORKSPACE_NAV_ENTRIES.find((entry) => entry.path === pathname);
  if (match) {
    return {
      category: match.category,
      page: match.breadcrumbPage,
    };
  }
  return {
    category: '탐색',
    page: '페이지',
  };
}
