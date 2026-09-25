import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import App from './app';

describe('App', () => {
  it('성공적으로 셸 레이아웃 및 대시보드를 렌더링해야 한다', () => {
    const { baseElement } = render(
      <BrowserRouter>
        <App />
      </BrowserRouter>,
    );
    expect(baseElement).toBeTruthy();
  });

  it('사이드바 브랜드명과 워크스페이스 개요 헤딩이 표시되어야 한다', () => {
    render(
      <BrowserRouter>
        <App />
      </BrowserRouter>,
    );

    // 브랜드 로고명 (사이드바 및 상단 브레드크럼)
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
});
