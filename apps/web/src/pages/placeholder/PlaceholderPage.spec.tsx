import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect } from 'vitest';
import { PlaceholderPage } from './PlaceholderPage';

const routerFutureConfig = {
  v7_startTransition: true,
  v7_relativeSplatPath: true,
} as const;

function renderWithRouter(ui: React.ReactElement) {
  return render(<BrowserRouter future={routerFutureConfig}>{ui}</BrowserRouter>);
}

describe('PlaceholderPage', () => {
  it('전달된 타이틀, 설명, 아이콘 및 예정 안내 뱃지를 렌더링해야 한다', () => {
    renderWithRouter(
      <PlaceholderPage
        title="PDF 처리 엔진"
        description="PDF 파일 최적화 및 분할 기능"
        icon="picture_as_pdf"
      />,
    );

    expect(screen.getByRole('heading', { name: 'PDF 처리 엔진' })).toBeTruthy();
    expect(screen.getByText('PDF 파일 최적화 및 분할 기능')).toBeTruthy();
    expect(screen.getByText('picture_as_pdf')).toBeTruthy();
    expect(
      screen.getByText(/다음 단계에서 구현 예정 \(Under Development\)/i),
    ).toBeTruthy();
  });

  it('대시보드로 돌아가기 링크가 올바른 루트(/) 경로를 가리켜야 한다', () => {
    renderWithRouter(
      <PlaceholderPage
        title="DBML 도구"
        description="DBML 변환기"
        icon="schema"
      />,
    );

    const backLink = screen.getByRole('link', {
      name: /대시보드로 돌아가기/i,
    });
    expect(backLink).toBeTruthy();
    expect(backLink.getAttribute('href')).toBe('/');
  });
});
