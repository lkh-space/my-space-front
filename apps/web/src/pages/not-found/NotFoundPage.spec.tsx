import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect } from 'vitest';
import { NotFoundPage } from './NotFoundPage';

const routerFutureConfig = {
  v7_startTransition: true,
  v7_relativeSplatPath: true,
} as const;

function renderWithRouter(ui: React.ReactElement) {
  return render(<BrowserRouter future={routerFutureConfig}>{ui}</BrowserRouter>);
}

describe('NotFoundPage', () => {
  it('404 코드와 안내 문구가 올바르게 렌더링되어야 한다', () => {
    renderWithRouter(<NotFoundPage />);

    expect(screen.getByText('404')).toBeTruthy();
    expect(
      screen.getByRole('heading', {
        name: '요청하신 페이지를 찾을 수 없습니다',
      }),
    ).toBeTruthy();
    expect(
      screen.getByText('존재하지 않거나 이동된 경로입니다.'),
    ).toBeTruthy();
  });

  it('대시보드로 이동하는 링크가 루트(/) 경로를 가리켜야 한다', () => {
    renderWithRouter(<NotFoundPage />);

    const dashboardLink = screen.getByRole('link', {
      name: /대시보드로 이동/i,
    });
    expect(dashboardLink).toBeTruthy();
    expect(dashboardLink.getAttribute('href')).toBe('/');
  });
});
