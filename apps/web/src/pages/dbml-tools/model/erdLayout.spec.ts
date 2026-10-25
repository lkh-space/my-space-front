import { describe, expect, it } from 'vitest';
import { calculateConnectors, calculateErdLayout } from './erdLayout';
import { RelationshipEdge, TableEntity } from './types';

describe('erdLayout', () => {
  it('테이블과 관계를 기반으로 좌표 및 커넥터를 정상 계산해야 한다', () => {
    const tables: TableEntity[] = [
      {
        name: 'users',
        fields: [{ name: 'id', type: 'int', pk: true }],
      },
      {
        name: 'posts',
        fields: [
          { name: 'id', type: 'int', pk: true },
          { name: 'user_id', type: 'int' },
        ],
      },
    ];

    const relationships: RelationshipEdge[] = [
      {
        id: 'posts.user_id-users.id',
        sourceTable: 'posts',
        sourceColumn: 'user_id',
        targetTable: 'users',
        targetColumn: 'id',
        relationType: '>',
      },
    ];

    const layout = calculateErdLayout(tables, relationships, 'hierarchical');

    expect(layout.tables).toHaveLength(2);
    expect(layout.connectors).toHaveLength(1);

    // users(참조 대상)가 posts(참조 주체)보다 왼쪽에 위치해야 함
    const usersTable = layout.tables.find((t) => t.name === 'users');
    const postsTable = layout.tables.find((t) => t.name === 'posts');
    expect(usersTable?.x).toBeLessThan(postsTable?.x || 0);

    // 커넥터 패스 d 속성이 유효한 베지어 곡선(M ... C ...)이어야 함
    expect(layout.connectors[0].d).toMatch(/^M \d+(\.\d+)? \d+(\.\d+)? C /);
  });

  it('customPositions가 주어졌을 때 해당 테이블 좌표가 오버라이드되고 커넥터가 재계산되어야 한다', () => {
    const tables: TableEntity[] = [
      {
        name: 'users',
        fields: [{ name: 'id', type: 'int', pk: true }],
      },
      {
        name: 'posts',
        fields: [
          { name: 'id', type: 'int', pk: true },
          { name: 'user_id', type: 'int' },
        ],
      },
    ];

    const relationships: RelationshipEdge[] = [
      {
        id: 'posts.user_id-users.id',
        sourceTable: 'posts',
        sourceColumn: 'user_id',
        targetTable: 'users',
        targetColumn: 'id',
        relationType: '>',
      },
    ];

    const customPositions = {
      users: { x: 500, y: 600 },
    };

    const layout = calculateErdLayout(tables, relationships, 'hierarchical', customPositions);
    const usersTable = layout.tables.find((t) => t.name === 'users');
    expect(usersTable?.x).toBe(500);
    expect(usersTable?.y).toBe(600);

    // posts는 원래 위치 유지
    const postsTable = layout.tables.find((t) => t.name === 'posts');
    expect(postsTable?.x).not.toBe(500);

    // 커넥터도 갱신된 users 위치(x: 500, y: 600)를 기반으로 계산됨
    expect(layout.connectors[0].d).toBeTruthy();
  });

  it('calculateConnectors 함수는 레이아웃 테이블을 바탕으로 커넥터 베지어 패스를 반환해야 한다', () => {
    const layoutedTables = [
      {
        name: 'users',
        x: 100,
        y: 100,
        width: 260,
        height: 120,
        fields: [{ name: 'id', type: 'int', pk: true }],
      },
      {
        name: 'posts',
        x: 500,
        y: 200,
        width: 260,
        height: 160,
        fields: [{ name: 'user_id', type: 'int' }],
      },
    ];

    const relationships: RelationshipEdge[] = [
      {
        id: 'posts.user_id-users.id',
        sourceTable: 'posts',
        sourceColumn: 'user_id',
        targetTable: 'users',
        targetColumn: 'id',
        relationType: '>',
      },
    ];

    const connectors = calculateConnectors(layoutedTables, relationships);
    expect(connectors).toHaveLength(1);
    expect(connectors[0].sourceTable).toBe('posts');
    expect(connectors[0].targetTable).toBe('users');
    expect(connectors[0].d).toContain('M ');
  });

  it('빈 테이블 목록을 넘겼을 때 빈 배열을 반환해야 한다', () => {
    const layout = calculateErdLayout([], []);
    expect(layout.tables).toHaveLength(0);
    expect(layout.connectors).toHaveLength(0);
  });
});
