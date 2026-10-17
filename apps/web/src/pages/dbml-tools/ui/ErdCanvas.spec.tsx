import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ConnectorPath, LayoutedTable } from '../model/erdLayout';
import { ErdCanvas } from './ErdCanvas';

describe('ErdCanvas Component (P1)', () => {
  const mockTables: LayoutedTable[] = [
    {
      name: 'users',
      alias: 'u',
      x: 100,
      y: 100,
      width: 260,
      height: 180,
      fields: [
        { name: 'id', type: 'integer', pk: true },
        { name: 'email', type: 'varchar', unique: true, notNull: true },
      ],
    },
    {
      name: 'posts',
      x: 450,
      y: 100,
      width: 260,
      height: 180,
      fields: [
        { name: 'id', type: 'integer', pk: true },
        { name: 'user_id', type: 'integer' },
      ],
    },
  ];

  const mockConnectors: ConnectorPath[] = [
    {
      id: 'posts.user_id-users.id',
      d: 'M 450 140 C 350 140, 400 140, 360 140',
      sourceTable: 'posts',
      sourceColumn: 'user_id',
      targetTable: 'users',
      targetColumn: 'id',
      relationType: '>',
    },
  ];

  let onSearchChangeMock: (q: string) => void;
  let onLayoutChangeMock: (type: 'hierarchical' | 'grid') => void;

  beforeEach(() => {
    onSearchChangeMock = vi.fn();
    onLayoutChangeMock = vi.fn();
  });

  it('테이블 카드와 SVG 커넥터 및 범례(Legend)가 기본 렌더링되어야 한다', () => {
    const { container } = render(
      <ErdCanvas
        tables={mockTables}
        connectors={mockConnectors}
        searchQuery=""
        onSearchChange={onSearchChangeMock}
        layoutType="hierarchical"
        onLayoutChange={onLayoutChangeMock}
      />
    );

    // 테이블 헤더 확인
    expect(screen.getByText('users')).toBeTruthy();
    expect(screen.getByText('posts')).toBeTruthy();

    // 컬럼명 확인
    expect(screen.getByText('email')).toBeTruthy();
    expect(screen.getByText('user_id')).toBeTruthy();

    // SVG 커넥터 라인 확인
    const svgPath = container.querySelector('svg path');
    expect(svgPath).toBeTruthy();

    // 하단 범례 및 PK 뱃지 확인
    expect(screen.getAllByText('PK').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('FK Reference')).toBeTruthy();
  });

  it('줌 인(+) 버튼을 클릭하면 줌 레벨이 증가하고 최대 150%를 초과하지 않아야 한다', () => {
    render(
      <ErdCanvas
        tables={mockTables}
        connectors={mockConnectors}
        searchQuery=""
        onSearchChange={onSearchChangeMock}
        layoutType="hierarchical"
        onLayoutChange={onLayoutChangeMock}
      />
    );

    const zoomInBtn = screen.getByTitle('Zoom In');
    const zoomVal = screen.getByText('100%');
    expect(zoomVal).toBeTruthy();

    // 1회 클릭 -> 110%
    fireEvent.click(zoomInBtn);
    expect(screen.getByText('110%')).toBeTruthy();

    // 최대 150%까지 반복 클릭
    for (let i = 0; i < 10; i++) {
      fireEvent.click(zoomInBtn);
    }
    expect(screen.getByText('150%')).toBeTruthy();
  });

  it('줌 아웃(-) 버튼을 클릭하면 줌 레벨이 감소하고 최소 50% 미만으로 내려가지 않아야 한다', () => {
    render(
      <ErdCanvas
        tables={mockTables}
        connectors={mockConnectors}
        searchQuery=""
        onSearchChange={onSearchChangeMock}
        layoutType="hierarchical"
        onLayoutChange={onLayoutChangeMock}
      />
    );

    const zoomOutBtn = screen.getByTitle('Zoom Out');

    // 1회 클릭 -> 90%
    fireEvent.click(zoomOutBtn);
    expect(screen.getByText('90%')).toBeTruthy();

    // 최소 50%까지 반복 클릭
    for (let i = 0; i < 10; i++) {
      fireEvent.click(zoomOutBtn);
    }
    expect(screen.getByText('50%')).toBeTruthy();
  });

  it('리셋(Fit View) 버튼을 클릭하면 100%로 복귀해야 한다', () => {
    render(
      <ErdCanvas
        tables={mockTables}
        connectors={mockConnectors}
        searchQuery=""
        onSearchChange={onSearchChangeMock}
        layoutType="hierarchical"
        onLayoutChange={onLayoutChangeMock}
      />
    );

    const zoomInBtn = screen.getByTitle('Zoom In');
    fireEvent.click(zoomInBtn);
    fireEvent.click(zoomInBtn);
    expect(screen.getByText('120%')).toBeTruthy();

    const resetBtn = screen.getByTitle('Reset / Fit View');
    fireEvent.click(resetBtn);

    expect(screen.getByText('100%')).toBeTruthy();
  });

  it('레이아웃 전환 버튼(Grid / Hierarchical) 클릭 시 onLayoutChange가 호출되어야 한다', () => {
    render(
      <ErdCanvas
        tables={mockTables}
        connectors={mockConnectors}
        searchQuery=""
        onSearchChange={onSearchChangeMock}
        layoutType="hierarchical"
        onLayoutChange={onLayoutChangeMock}
      />
    );

    const gridBtn = screen.getByRole('button', { name: 'Grid' });
    fireEvent.click(gridBtn);
    expect(onLayoutChangeMock).toHaveBeenCalledWith('grid');

    const hierBtn = screen.getByRole('button', { name: 'Hierarchical' });
    fireEvent.click(hierBtn);
    expect(onLayoutChangeMock).toHaveBeenCalledWith('hierarchical');
  });

  it('검색창에 입력 시 onSearchChange 콜백이 호출되어야 한다', () => {
    render(
      <ErdCanvas
        tables={mockTables}
        connectors={mockConnectors}
        searchQuery=""
        onSearchChange={onSearchChangeMock}
        layoutType="hierarchical"
        onLayoutChange={onLayoutChangeMock}
      />
    );

    const searchInput = screen.getByPlaceholderText(/Search tables/i);
    fireEvent.change(searchInput, { target: { value: 'user' } });

    expect(onSearchChangeMock).toHaveBeenCalledWith('user');
  });

  it('검색어가 주어졌을 때 일치하는 테이블은 하이라이트되고 일치하지 않는 테이블은 dimmed 처리되어야 한다', () => {
    const { container } = render(
      <ErdCanvas
        tables={mockTables}
        connectors={mockConnectors}
        searchQuery="users"
        onSearchChange={onSearchChangeMock}
        layoutType="hierarchical"
        onLayoutChange={onLayoutChangeMock}
      />
    );

    const cards = container.querySelectorAll('.erd-card');
    expect(cards).toHaveLength(2);

    // users 카드는 highlighted
    const usersCard = Array.from(cards).find((c) => c.textContent?.includes('users'));
    expect(usersCard?.className).toContain('highlighted');
    expect(usersCard?.className).not.toContain('dimmed');

    // posts 카드는 dimmed
    const postsCard = Array.from(cards).find((c) => c.textContent?.includes('posts'));
    expect(postsCard?.className).toContain('dimmed');
    expect(postsCard?.className).not.toContain('highlighted');
  });
});
