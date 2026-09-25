import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from './app';

const routerFutureConfig = {
  v7_startTransition: true,
  v7_relativeSplatPath: true,
} as const;

function renderApp(initialEntries: string[] = ['/']) {
  return render(
    <MemoryRouter initialEntries={initialEntries} future={routerFutureConfig}>
      <App />
    </MemoryRouter>,
  );
}

describe('App', () => {
  describe('대시보드 루트 (/) 라우팅', () => {
    it('성공적으로 셸 레이아웃 및 대시보드를 렌더링해야 한다', () => {
      const { baseElement } = renderApp(['/']);
      expect(baseElement).toBeTruthy();
    });

    it('사이드바 브랜드명과 워크스페이스 개요 헤딩이 표시되어야 한다', () => {
      renderApp(['/']);

      // 브랜드 로고명 (사이드바, 상단 브레드크럼, 모바일 헤더)
      const brandElements = screen.getAllByText('my-space');
      expect(brandElements.length).toBeGreaterThanOrEqual(1);

      // 메인 대시보드 H1 헤딩
      expect(
        screen.getByRole('heading', { name: '워크스페이스 개요' }),
      ).toBeTruthy();

      // 설치된 유틸리티 카드 확인
      expect(screen.getByText('PDF 처리 엔진')).toBeTruthy();
      expect(screen.getByText('DBML 스키마 변환기')).toBeTruthy();
      expect(screen.getByText('마크다운 문서 뷰어')).toBeTruthy();

      // 최근 작업 이력 섹션 확인
      expect(screen.getByText('최근 로컬 작업 이력')).toBeTruthy();

      // 런타임 환경 상태 섹션 확인
      expect(screen.getByText('로컬 런타임 환경 상태')).toBeTruthy();
    });

    it('모바일 하단 바텀 네비게이션이 렌더링되어야 한다', () => {
      renderApp(['/']);

      // BottomNavBar 요소 검증
      const bottomNav = screen.getByRole('navigation', {
        name: '모바일 하단 네비게이션',
      });
      expect(bottomNav).toBeTruthy();

      // 모바일 바텀바 내부 탭 라벨 검증
      expect(within(bottomNav).getByText('대시보드')).toBeTruthy();
      expect(within(bottomNav).getByText('PDF 도구')).toBeTruthy();
      expect(within(bottomNav).getByText('DBML')).toBeTruthy();
      expect(within(bottomNav).getByText('문서')).toBeTruthy();
    });
  });

  describe('플레이스홀더 및 404 라우팅', () => {
    it('/pdf-tools 경로 접속 시 PDF 처리 엔진 페이지를 렌더링해야 한다', () => {
      renderApp(['/pdf-tools']);

      expect(
        screen.getByRole('heading', { name: 'PDF 처리 엔진' }),
      ).toBeTruthy();
      expect(
        screen.getByText(/외부 클라우드 전송 없이 안전하게 PDF를 병합, 분할, 암호 해제합니다/),
      ).toBeTruthy();
    });

    it('/dbml-tools 경로 접속 시 DBML 스키마 변환기 플레이스홀더를 렌더링해야 한다', () => {
      renderApp(['/dbml-tools']);

      expect(
        screen.getByRole('heading', { name: 'DBML 스키마 변환기' }),
      ).toBeTruthy();
      expect(
        screen.getByText(/DBML 기반 ERD 시각화 및 PostgreSQL\/MySQL DDL 생성 도구/),
      ).toBeTruthy();
    });

    it('/docs 경로 접속 시 마크다운 문서 뷰어 플레이스홀더를 렌더링해야 한다', () => {
      renderApp(['/docs']);

      expect(
        screen.getByRole('heading', { name: '마크다운 문서 뷰어' }),
      ).toBeTruthy();
      expect(
        screen.getByText(/로컬 프로젝트 사양\(Spec\) 및 아키텍처 결정\(ADR\) 뷰어/),
      ).toBeTruthy();
    });

    it('존재하지 않는 잘못된 경로(/unknown-page) 접속 시 404 NotFoundPage를 렌더링해야 한다', () => {
      renderApp(['/unknown-page']);

      expect(screen.getByText('404')).toBeTruthy();
      expect(
        screen.getByRole('heading', {
          name: '요청하신 페이지를 찾을 수 없습니다',
        }),
      ).toBeTruthy();
    });
  });
});
