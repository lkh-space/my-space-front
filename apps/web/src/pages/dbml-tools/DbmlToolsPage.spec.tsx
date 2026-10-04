import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { DbmlToolsPage } from './DbmlToolsPage';

describe('DbmlToolsPage', () => {
  it('헤더, 서브헤더, 코드 에디터, ERD 테이블 카드가 기본 렌더링되어야 한다', () => {
    render(<DbmlToolsPage />);

    // 헤더 및 서브헤더
    expect(screen.getByText('DBML Editor & ERD Visualizer')).toBeTruthy();
    expect(screen.getByText('Live Synced')).toBeTruthy();
    expect(screen.getByText('Load Example')).toBeTruthy();
    expect(screen.getByText('Execute Task')).toBeTruthy();

    // ERD 캔버스 내 기본 테이블 카드 확인 (users, projects, tasks)
    expect(screen.getAllByText('users').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('projects').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('tasks').length).toBeGreaterThanOrEqual(1);
  });

  it('Execute Task 클릭 시 SQL 모달이 열려야 한다', async () => {
    render(<DbmlToolsPage />);

    const executeBtn = screen.getByText('Execute Task');
    fireEvent.click(executeBtn);

    // 모달 타이틀 확인
    expect(await screen.findByText(/Generated SQL DDL/i)).toBeTruthy();
    expect(screen.getByText('Copy SQL')).toBeTruthy();
    expect(screen.getByText('Download .sql')).toBeTruthy();
  });

  it('테이블 검색어 입력 시 필터링이 동작해야 한다', () => {
    render(<DbmlToolsPage />);

    const searchInput = screen.getByPlaceholderText('Search tables (users, tasks)...');
    fireEvent.change(searchInput, { target: { value: 'users' } });

    expect(screen.getAllByText('users').length).toBeGreaterThanOrEqual(1);
  });
});
