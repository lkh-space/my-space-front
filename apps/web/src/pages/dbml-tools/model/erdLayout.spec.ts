import { describe, expect, it } from 'vitest';
import { calculateErdLayout } from './erdLayout';
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

  it('빈 테이블 목록을 넘겼을 때 빈 배열을 반환해야 한다', () => {
    const layout = calculateErdLayout([], []);
    expect(layout.tables).toHaveLength(0);
    expect(layout.connectors).toHaveLength(0);
  });
});
