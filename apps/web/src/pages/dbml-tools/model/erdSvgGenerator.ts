import { ConnectorPath, LayoutedTable } from './erdLayout';

export interface SvgExportOptions {
  title?: string;
  transparent?: boolean;
}

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function getHeaderDotColor(name: string): string {
  const lower = name.toLowerCase();
  if (lower.includes('user') || lower.includes('auth') || lower.includes('account')) {
    return '#adc6ff'; // primary blue
  }
  if (lower.includes('project') || lower.includes('workspace') || lower.includes('org')) {
    return '#4edea3'; // secondary green
  }
  return '#f59e0b'; // tertiary amber
}

const CARD_WIDTH = 256;
const HEADER_HEIGHT = 41;
const ROW_HEIGHT = 37;

/**
 * 테이블 엔티티들과 관계선 목록을 단독으로 완전하게 렌더링 가능한 순수 SVG XML 문자열로 변환합니다.
 * 배경 사각형이나 도트 패턴 없이 완전한 투명 배경(누끼) 상태의 벡터 그래픽을 생성합니다.
 */
export function generateErdSvg(
  tables: LayoutedTable[],
  connectors: ConnectorPath[],
  _options: SvgExportOptions = {}
): string {
  if (tables.length === 0) {
    return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="400" height="200" viewBox="0 0 400 200">
  <text x="200" y="100" font-family="system-ui, -apple-system, sans-serif" font-size="14" fill="#8b949e" text-anchor="middle">No tables defined</text>
</svg>`;
  }

  // 1. ViewBox 계산 (테이블들의 실제 바운딩 박스에 맞춘 컴팩트한 여백)
  const padding = 32;
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  tables.forEach((table) => {
    const tableRight = table.x + (table.width || CARD_WIDTH);
    const tableBottom =
      table.y + (table.height || HEADER_HEIGHT + table.fields.length * ROW_HEIGHT + 8);

    if (table.x < minX) minX = table.x;
    if (table.y < minY) minY = table.y;
    if (tableRight > maxX) maxX = tableRight;
    if (tableBottom > maxY) maxY = tableBottom;
  });

  const viewX = Math.max(0, minX - padding);
  const viewY = Math.max(0, minY - padding);
  const viewWidth = Math.max(100, maxX - viewX + padding);
  const viewHeight = Math.max(100, maxY - viewY + padding);

  // 2. 테이블 카드 마크업 생성
  const tableElements = tables
    .map((table) => {
      const cardHeight =
        table.height || HEADER_HEIGHT + table.fields.length * ROW_HEIGHT + 8;
      const dotColor = getHeaderDotColor(table.name);

      const fieldRows = table.fields
        .map((field, idx) => {
          const rowY = HEADER_HEIGHT + idx * ROW_HEIGHT;
          const isPk = Boolean(field.pk);
          const isFk = Boolean(field.ref);
          const isUnique = Boolean(field.unique);

          let badgeElement = '';
          if (isPk) {
            badgeElement = `
              <rect x="12" y="${rowY + 9}" width="22" height="18" rx="3" fill="#382810" stroke="#f59e0b" stroke-width="0.8"/>
              <text x="23" y="${rowY + 22}" font-family="system-ui, sans-serif" font-size="9" font-weight="700" fill="#f59e0b" text-anchor="middle">PK</text>
            `;
          } else if (isFk) {
            badgeElement = `
              <rect x="12" y="${rowY + 9}" width="22" height="18" rx="3" fill="#0d2b1f" stroke="#4edea3" stroke-width="0.8"/>
              <text x="23" y="${rowY + 22}" font-family="system-ui, sans-serif" font-size="9" font-weight="700" fill="#4edea3" text-anchor="middle">FK</text>
            `;
          } else if (isUnique) {
            badgeElement = `
              <rect x="12" y="${rowY + 9}" width="22" height="18" rx="3" fill="#14243b" stroke="#adc6ff" stroke-width="0.8"/>
              <text x="23" y="${rowY + 22}" font-family="system-ui, sans-serif" font-size="9" font-weight="700" fill="#adc6ff" text-anchor="middle">UQ</text>
            `;
          } else {
            badgeElement = `<circle cx="23" cy="${rowY + 18}" r="2" fill="#545d6e"/>`;
          }

          const fieldNameColor = isPk ? '#fbbf24' : isFk ? '#4edea3' : '#e6edf3';
          const typeColor = '#8b949e';
          const isLast = idx === table.fields.length - 1;

          return `
            <!-- Row: ${escapeXml(field.name)} -->
            <g class="field-row">
              ${badgeElement}
              <text x="42" y="${rowY + 23}" font-family="'Fira Code', ui-monospace, Menlo, Consolas, monospace" font-size="12" font-weight="500" fill="${fieldNameColor}">${escapeXml(field.name)}</text>
              <text x="${CARD_WIDTH - 14}" y="${rowY + 23}" font-family="'Fira Code', ui-monospace, Menlo, Consolas, monospace" font-size="11" fill="${typeColor}" text-anchor="end">${escapeXml(field.type)}</text>
              ${!isLast ? `<line x1="12" y1="${rowY + ROW_HEIGHT}" x2="${CARD_WIDTH - 12}" y2="${rowY + ROW_HEIGHT}" stroke="#232938" stroke-width="0.8"/>` : ''}
            </g>
          `;
        })
        .join('');

      return `
        <!-- Table: ${escapeXml(table.name)} -->
        <g id="table-${escapeXml(table.name)}" transform="translate(${table.x}, ${table.y})">
          <!-- Card Container -->
          <rect width="${CARD_WIDTH}" height="${cardHeight}" rx="8" fill="#131720" stroke="#2b3446" stroke-width="1.2" />
          
          <!-- Card Header Background (Top rounded corners) -->
          <path d="M 0 8 Q 0 0 8 0 L ${CARD_WIDTH - 8} 0 Q ${CARD_WIDTH} 0 ${CARD_WIDTH} 8 L ${CARD_WIDTH} 41 L 0 41 Z" fill="#181e2b" />
          <line x1="0" y1="41" x2="${CARD_WIDTH}" y2="41" stroke="#2b3446" stroke-width="1" />
          
          <!-- Header Content -->
          <circle cx="18" cy="21" r="4.5" fill="${dotColor}" />
          <text x="30" y="25" font-family="system-ui, -apple-system, sans-serif" font-size="13" font-weight="600" fill="#f0f6fc">${escapeXml(table.name)}</text>
          
          <!-- Fields Count Badge -->
          <rect x="${CARD_WIDTH - 66}" y="12" width="54" height="18" rx="4" fill="#20283a" stroke="#2b3446" stroke-width="0.8" />
          <text x="${CARD_WIDTH - 39}" y="24" font-family="'Fira Code', monospace" font-size="10" fill="#8b949e" text-anchor="middle">${table.fields.length} fields</text>
          
          <!-- Fields List -->
          ${fieldRows}
        </g>
      `;
    })
    .join('\n');

  // 3. 관계선(Connectors) 마크업 생성
  const connectorElements = connectors
    .map((conn) => {
      return `
        <path
          id="rel-${escapeXml(conn.id)}"
          d="${conn.d}"
          fill="none"
          stroke="url(#erd-svg-line-grad)"
          stroke-width="1.8"
          stroke-dasharray="4,4"
          marker-end="url(#erd-svg-arrow)"
        />
      `;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${viewWidth}" height="${viewHeight}" viewBox="${viewX} ${viewY} ${viewWidth} ${viewHeight}">
  <defs>
    <!-- Relation Arrow Marker -->
    <marker
      id="erd-svg-arrow"
      markerHeight="6"
      markerWidth="6"
      orient="auto-start-reverse"
      refX="6"
      refY="5"
      viewBox="0 0 10 10"
    >
      <path d="M 0 1 L 10 5 L 0 9 z" fill="#adc6ff" />
    </marker>

    <!-- Connector Gradient -->
    <linearGradient id="erd-svg-line-grad" x1="0%" x2="100%" y1="0%" y2="0%">
      <stop offset="0%" stopColor="#4edea3" stopOpacity="0.9" />
      <stop offset="100%" stopColor="#adc6ff" stopOpacity="0.9" />
    </linearGradient>
  </defs>

  <!-- Connectors Layer -->
  <g id="erd-connectors">
    ${connectorElements}
  </g>

  <!-- Tables Layer -->
  <g id="erd-tables">
    ${tableElements}
  </g>
</svg>`;
}
