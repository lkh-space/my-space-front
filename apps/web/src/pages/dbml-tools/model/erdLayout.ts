import { RelationshipEdge, TableEntity } from './types';

export interface LayoutedTable extends TableEntity {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ConnectorPath {
  id: string;
  sourceTable: string;
  sourceColumn: string;
  targetTable: string;
  targetColumn: string;
  d: string;
  relationType: string;
}

const CARD_WIDTH = 256;
const CARD_GAP_X = 64;
const CARD_GAP_Y = 48;
const HEADER_HEIGHT = 41;
const ROW_HEIGHT = 37;

/**
 * 테이블 목록과 관계 목록을 바탕으로 각 테이블 카드의 절대 좌표 및 크기를 계산
 */
export function calculateErdLayout(
  tables: TableEntity[],
  relationships: RelationshipEdge[],
  layoutType: 'hierarchical' | 'grid' = 'hierarchical',
): { tables: LayoutedTable[]; connectors: ConnectorPath[] } {
  if (tables.length === 0) {
    return { tables: [], connectors: [] };
  }

  const tableMap = new Map<string, LayoutedTable>();

  // 1. 테이블 높이 사전 계산
  const baseTables: LayoutedTable[] = tables.map((table) => {
    const height = HEADER_HEIGHT + table.fields.length * ROW_HEIGHT + 8;
    return {
      ...table,
      x: 0,
      y: 0,
      width: CARD_WIDTH,
      height,
    };
  });

  // 2. 배치 좌표 할당
  if (layoutType === 'hierarchical') {
    // 의존성(FK) 기반 레벨링 계산
    // 참조되는 테이블(부모)을 왼쪽에, 참조하는 테이블(자식)을 오른쪽에 배치
    const inDegree = new Map<string, number>();
    tables.forEach((t) => inDegree.set(t.name, 0));

    relationships.forEach((rel) => {
      // sourceTable이 targetTable을 참조 (sourceTable -> targetTable)
      // 따라서 targetTable이 부모(Level 0), sourceTable이 자식(Level 1)
      const current = inDegree.get(rel.sourceTable) || 0;
      inDegree.set(rel.sourceTable, current + 1);
    });

    // 레벨별 그룹화
    const levels = new Map<number, LayoutedTable[]>();
    baseTables.forEach((table) => {
      const level = inDegree.get(table.name) || 0;
      const group = levels.get(level);
      if (group) {
        group.push(table);
      } else {
        levels.set(level, [table]);
      }
    });

    const sortedLevels = Array.from(levels.keys()).sort((a, b) => a - b);
    let currentX = 40;

    sortedLevels.forEach((level) => {
      const levelTables = levels.get(level) || [];
      let currentY = 40;

      levelTables.forEach((table) => {
        table.x = currentX;
        table.y = currentY;
        tableMap.set(table.name, table);
        currentY += table.height + CARD_GAP_Y;
      });

      currentX += CARD_WIDTH + CARD_GAP_X;
    });
  } else {
    // 3열 그리드 배치
    const columns = 3;
    baseTables.forEach((table, index) => {
      const col = index % columns;
      const row = Math.floor(index / columns);
      table.x = 40 + col * (CARD_WIDTH + CARD_GAP_X);
      table.y = 40 + row * (320 + CARD_GAP_Y);
      tableMap.set(table.name, table);
    });
  }

  const layoutedTables = Array.from(tableMap.values());

  // 3. 관계선(SVG Bezier Connector) 경로 계산
  const connectors: ConnectorPath[] = [];

  relationships.forEach((rel) => {
    const sourceTable = tableMap.get(rel.sourceTable);
    const targetTable = tableMap.get(rel.targetTable);

    if (!sourceTable || !targetTable) return;

    // sourceColumn의 Y 위치 계산
    const sourceFieldIndex = sourceTable.fields.findIndex(
      (f) => f.name.toLowerCase() === rel.sourceColumn.toLowerCase(),
    );
    const sourceY =
      sourceTable.y +
      HEADER_HEIGHT +
      (sourceFieldIndex >= 0 ? sourceFieldIndex * ROW_HEIGHT + ROW_HEIGHT / 2 : ROW_HEIGHT / 2);

    // targetColumn의 Y 위치 계산
    const targetFieldIndex = targetTable.fields.findIndex(
      (f) => f.name.toLowerCase() === rel.targetColumn.toLowerCase(),
    );
    const targetY =
      targetTable.y +
      HEADER_HEIGHT +
      (targetFieldIndex >= 0 ? targetFieldIndex * ROW_HEIGHT + ROW_HEIGHT / 2 : ROW_HEIGHT / 2);

    // 테이블의 좌우 위치에 따라 핸들 결정
    let startX = 0;
    let endX = 0;

    if (sourceTable.x < targetTable.x) {
      // source가 왼쪽, target이 오른쪽
      startX = sourceTable.x + sourceTable.width;
      endX = targetTable.x;
    } else {
      // target이 왼쪽, source가 오른쪽
      startX = sourceTable.x;
      endX = targetTable.x + targetTable.width;
    }

    // 3차 베지어 곡선 경로 생성: M x1 y1 C cp1x cp1y, cp2x cp2y, x2 y2
    const dx = Math.abs(endX - startX) * 0.5;
    const cp1x = startX < endX ? startX + dx : startX - dx;
    const cp2x = startX < endX ? endX - dx : endX + dx;
    const d = `M ${startX} ${sourceY} C ${cp1x} ${sourceY}, ${cp2x} ${targetY}, ${endX} ${targetY}`;

    connectors.push({
      id: rel.id,
      sourceTable: rel.sourceTable,
      sourceColumn: rel.sourceColumn,
      targetTable: rel.targetTable,
      targetColumn: rel.targetColumn,
      d,
      relationType: rel.relationType,
    });
  });

  return { tables: layoutedTables, connectors };
}
