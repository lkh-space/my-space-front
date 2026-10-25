import { describe, expect, it } from 'vitest';
import { ConnectorPath, LayoutedTable } from './erdLayout';
import { generateErdSvg } from './erdSvgGenerator';

describe('erdSvgGenerator', () => {
  const sampleTables: LayoutedTable[] = [
    {
      name: 'users',
      x: 40,
      y: 40,
      width: 256,
      height: 152,
      fields: [
        { name: 'id', type: 'integer', pk: true },
        { name: 'email', type: 'varchar', unique: true },
        { name: 'status', type: 'varchar' },
      ],
    },
    {
      name: 'posts',
      x: 360,
      y: 40,
      width: 256,
      height: 152,
      fields: [
        { name: 'id', type: 'integer', pk: true },
        { name: 'user_id', type: 'integer', ref: { type: '>', targetTable: 'users', targetColumn: 'id' } },
        { name: 'title', type: 'text' },
      ],
    },
  ];

  const sampleConnectors: ConnectorPath[] = [
    {
      id: 'posts.user_id-users.id',
      sourceTable: 'posts',
      sourceColumn: 'user_id',
      targetTable: 'users',
      targetColumn: 'id',
      d: 'M 360 100 C 300 100, 310 60, 296 60',
      relationType: '>',
    },
  ];

  it('테이블이 비어 있을 때 유효한 빈 SVG XML을 생성해야 한다', () => {
    const svg = generateErdSvg([], []);
    expect(svg).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(svg).toContain('<svg');
    expect(svg).toContain('No tables defined');
    expect(svg).toContain('</svg>');
  });

  it('캔버스 전체 배경 박스나 도트 그리드 없이 완전한 투명 배경(누끼) 상태여야 한다', () => {
    const svg = generateErdSvg(sampleTables, sampleConnectors);
    // 캔버스 전체 배경 사각형 및 도트 패턴이 존재하지 않아야 함
    expect(svg).not.toContain('fill="#0b0f17"');
    expect(svg).not.toContain('id="erd-svg-dot-grid"');
    expect(svg).not.toContain('id="erd-title"');
  });

  it('테이블 카드(헤더, 필드, 타입, PK/FK 뱃지)와 관계선이 모두 포함된 SVG를 생성해야 한다', () => {
    const svg = generateErdSvg(sampleTables, sampleConnectors);

    // 기본 SVG 구조 및 헤더
    expect(svg).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(svg).toContain('<svg');
    expect(svg).toContain('id="erd-svg-arrow"');
    expect(svg).toContain('id="erd-svg-line-grad"');

    // 테이블 헤더 및 필드 수 뱃지
    expect(svg).toContain('id="table-users"');
    expect(svg).toContain('id="table-posts"');
    expect(svg).toContain('>users<');
    expect(svg).toContain('>posts<');
    expect(svg).toContain('>3 fields<');

    // 필드 및 타입
    expect(svg).toContain('>email<');
    expect(svg).toContain('>varchar<');
    expect(svg).toContain('>user_id<');
    expect(svg).toContain('>title<');

    // 뱃지 (PK, FK, UQ)
    expect(svg).toContain('>PK<');
    expect(svg).toContain('>FK<');
    expect(svg).toContain('>UQ<');

    // 관계선 커넥터
    expect(svg).toContain('id="rel-posts.user_id-users.id"');
    expect(svg).toContain('M 360 100 C 300 100, 310 60, 296 60');
  });

  it('테이블 이름 또는 필드 이름의 XML 특수문자를 안전하게 이스케이프해야 한다', () => {
    const dangerousTables: LayoutedTable[] = [
      {
        name: 'user<>&"\'info',
        x: 40,
        y: 40,
        width: 256,
        height: 120,
        fields: [
          { name: 'col<1>', type: 'varchar&num' },
        ],
      },
    ];

    const svg = generateErdSvg(dangerousTables, []);
    expect(svg).toContain('user&lt;&gt;&amp;&quot;&apos;info');
    expect(svg).toContain('col&lt;1&gt;');
    expect(svg).toContain('varchar&amp;num');
    expect(svg).not.toContain('<1>');
  });
});
