import { render, screen, within } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import App from './app';

const routerFutureConfig = {
  v7_startTransition: true,
  v7_relativeSplatPath: true,
} as const;

function renderWithRouter(ui: React.ReactElement) {
  return render(<BrowserRouter future={routerFutureConfig}>{ui}</BrowserRouter>);
}

describe('App', () => {
  it('성공적으로 셸 레이아웃 및 대시보드를 렌더링해야 한다', () => {
    const { baseElement } = renderWithRouter(<App />);
    expect(baseElement).toBeTruthy();
  });

  it('사이드바 브랜드명과 워크스페이스 개요 헤딩이 표시되어야 한다', () => {
    renderWithRouter(<App />);

    // 브랜드 로고명 (사이드바, 상단 브레드크럼, 모바일 헤더)
    const brandElements = screen.getAllByText('my-space');
    expect(brandElements.length).toBeGreaterThanOrEqual(1);

    // 메인 대시보드 H1 헤딩
    expect(screen.getByRole('heading', { name: '워크스페이스 개요' })).toBeTruthy();

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
    renderWithRouter(<App />);

    // BottomNavBar 요소 검증
    const bottomNav = screen.getByRole('navigation', { name: '모바일 하단 네비게이션' });
    expect(bottomNav).toBeTruthy();

    // 모바일 바텀바 내부 탭 라벨 검증
    expect(within(bottomNav).getByText('대시보드')).toBeTruthy();
    expect(within(bottomNav).getByText('PDF 도구')).toBeTruthy();
    expect(within(bottomNav).getByText('DBML')).toBeTruthy();
    expect(within(bottomNav).getByText('문서')).toBeTruthy();
  });
});
