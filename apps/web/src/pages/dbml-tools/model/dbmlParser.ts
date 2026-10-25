import { ColumnField, ParsedSchema, RelationshipEdge, TableEntity } from './types';

/**
 * 브라우저 환경에서 실시간(10~20ms)으로 동작하는 고성능 DBML 파서
 * - Table 구문 파싱 (중첩 중괄호 indexes/Note 완벽 지원, 스키마/헤더속성 지원)
 * - 컬럼명, 복합 데이터타입(decimal(10, 2), timestamp with time zone, text[] 등), 실시간 타이핑 중 필드 파싱
 * - 독립된 Ref 및 인라인 Ref 관계선 파싱
 * - 주석(//, --, 블록 주석) 및 끝 쉼표/세미콜론 자동 보정
 */
export function parseDbml(content: string): ParsedSchema {
  const startTime = performance.now();
  const tables: TableEntity[] = [];
  const relationships: RelationshipEdge[] = [];

  try {
    // 1. 주석 제거 (블록 주석 /* */ 및 한줄 주석 //, --)
    const cleaned = content
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/(?:\/\/|--).*$/gm, '');

    // 2. Table 블록 중괄호 매칭 파싱
    // Table <name> [as <alias>] [<settings>] {
    const tableHeaderRegex = /(?:^|\s)Table\s+([a-zA-Z0-9_".-]+)(?:\s+as\s+([a-zA-Z0-9_".-]+))?(?:\s*\[[^\]]*\])?\s*\{/gi;
    let match: RegExpExecArray | null;

    while ((match = tableHeaderRegex.exec(cleaned)) !== null) {
      const rawTableName = match[1].replace(/["']/g, '').trim();
      const alias = match[2]?.replace(/["']/g, '').trim();
      const braceStartIndex = match.index + match[0].length - 1; // '{' 위치

      // 짝이 맞는 닫는 중괄호 '}' 탐색 (중첩 depth 및 문자열 리터럴 보호)
      let depth = 0;
      let inString: string | null = null;
      let bodyEndIndex = -1;

      for (let i = braceStartIndex; i < cleaned.length; i++) {
        const char = cleaned[i];
        const prevChar = i > 0 ? cleaned[i - 1] : '';

        // 문자열 리터럴 토글 (따옴표 탈출문자 제외)
        if ((char === '"' || char === "'" || char === '`') && prevChar !== '\\') {
          if (inString === char) {
            inString = null;
          } else if (!inString) {
            inString = char;
          }
        }

        if (!inString) {
          if (char === '{') {
            depth++;
          } else if (char === '}') {
            depth--;
            if (depth === 0) {
              bodyEndIndex = i;
              break;
            }
          }
        }
      }

      // 닫는 괄호를 찾지 못한 경우(타이핑 중) 파일 끝까지를 body로 간주
      const body =
        bodyEndIndex !== -1
          ? cleaned.slice(braceStartIndex + 1, bodyEndIndex)
          : cleaned.slice(braceStartIndex + 1);

      const fields = parseTableFields(rawTableName, body, relationships);
      tables.push({
        name: rawTableName,
        alias,
        fields,
      });

      if (bodyEndIndex !== -1) {
        tableHeaderRegex.lastIndex = bodyEndIndex + 1;
      } else {
        break;
      }
    }

    // 3. 독립 Ref 구문 매칭: Ref [name]?: <table>.<col> (<|>|-|<>) <table>.<col>
    const refRegex =
      /Ref(?:\s+[a-zA-Z0-9_".-]+)?\s*:\s*([a-zA-Z0-9_".-]+)\.([a-zA-Z0-9_".-]+)\s*([><-]|<>)\s*([a-zA-Z0-9_".-]+)\.([a-zA-Z0-9_".-]+)/gi;
    let refMatch: RegExpExecArray | null;

    while ((refMatch = refRegex.exec(cleaned)) !== null) {
      const [, sourceTable, sourceCol, relType, targetTable, targetCol] = refMatch;
      const cleanSourceTable = sourceTable.replace(/["']/g, '').trim();
      const cleanSourceCol = sourceCol.replace(/["']/g, '').trim();
      const cleanTargetTable = targetTable.replace(/["']/g, '').trim();
      const cleanTargetCol = targetCol.replace(/["']/g, '').trim();

      const id = `${cleanSourceTable}.${cleanSourceCol}-${cleanTargetTable}.${cleanTargetCol}`;
      if (!relationships.some((r) => r.id === id)) {
        relationships.push({
          id,
          sourceTable: cleanSourceTable,
          sourceColumn: cleanSourceCol,
          targetTable: cleanTargetTable,
          targetColumn: cleanTargetCol,
          relationType: relType as '>' | '<' | '-' | '<>',
        });
      }
    }

    // 4. 구문 유효성 검증
    const openBraces = (cleaned.match(/\{/g) || []).length;
    const closeBraces = (cleaned.match(/\}/g) || []).length;
    let isValid = true;
    let errorMessage: string | undefined;

    if (openBraces !== closeBraces) {
      isValid = false;
      errorMessage = '중괄호({ }) 쌍이 일치하지 않습니다.';
    } else if (/\bTable\b/i.test(cleaned) && tables.length === 0) {
      isValid = false;
      errorMessage = '올바른 형식의 Table 정의를 찾을 수 없습니다.';
    } else if (/\bRef\s*:/i.test(cleaned) && relationships.length === 0) {
      isValid = false;
      errorMessage = '올바른 형식의 Ref 관계 정의를 찾을 수 없습니다.';
    }

    const duration = Math.max(1, Math.round(performance.now() - startTime));

    return {
      tables,
      relationships,
      isValid,
      errorMessage,
      parseTimeMs: duration,
    };
  } catch (err: unknown) {
    const duration = Math.max(1, Math.round(performance.now() - startTime));
    const errorMessage = err instanceof Error ? err.message : 'DBML 구문 분석 오류';
    return {
      tables: [],
      relationships: [],
      isValid: false,
      errorMessage,
      parseTimeMs: duration,
    };
  }
}

const RESERVED_KEYWORDS = new Set([
  'table',
  'ref',
  'enum',
  'tablegroup',
  'project',
  'indexes',
  'note',
]);

/**
 * 테이블 내부의 컬럼 정의 라인들을 분석
 */
function parseTableFields(
  tableName: string,
  body: string,
  relationships: RelationshipEdge[],
): ColumnField[] {
  const fields: ColumnField[] = [];
  const lines = body.split('\n');

  let inNestedBlock = false;

  for (const line of lines) {
    let trimmed = line.trim();
    if (!trimmed) continue;

    // indexes { ... } 또는 Note { ... } 같은 중첩 블록 스킵 처리
    if (inNestedBlock) {
      if (trimmed.includes('}')) {
        inNestedBlock = false;
      }
      continue;
    }

    if (/^(?:indexes|note)\s*\{/i.test(trimmed)) {
      if (!trimmed.includes('}')) {
        inNestedBlock = true;
      }
      continue;
    }

    // 단일 Note: 라인 스킵
    if (/^note\s*:/i.test(trimmed)) {
      continue;
    }

    // 인라인 주석 제거 및 후행 쉼표(,), 세미콜론(;) 정리
    trimmed = trimmed.replace(/(?:\/\/|--).*$/, '').trim();
    trimmed = trimmed.replace(/[,;]+$/, '').trim();
    if (!trimmed) continue;

    // 컬럼 설정 분리: column_def [settings]
    let colDef = trimmed;
    let settingsStr = '';

    const bracketMatch = trimmed.match(/^(.*?)\s*\[(.*)\]\s*$/);
    if (bracketMatch && bracketMatch[2].trim()) {
      colDef = bracketMatch[1].trim();
      settingsStr = bracketMatch[2].trim();
    }

    if (!colDef) continue;

    // 컬럼명과 타입 분리
    // 1) 따옴표로 감싸진 식별자: "column name" type
    // 2) 일반 식별자: column_name type
    let colName = '';
    let colType = '';

    const quotedNameMatch = colDef.match(/^(?:"([^"]+)"|'([^']+)'|`([^`]+)`)\s*(.*)$/);
    if (quotedNameMatch) {
      colName = quotedNameMatch[1] || quotedNameMatch[2] || quotedNameMatch[3] || '';
      colType = (quotedNameMatch[4] || '').trim();
    } else {
      const spaceIdx = colDef.search(/\s/);
      if (spaceIdx === -1) {
        // 공백 없이 컬럼명만 있는 경우 (타이핑 중이거나 타입 미지정)
        colName = colDef.replace(/:$/, '').trim();
        colType = '';
      } else {
        colName = colDef.slice(0, spaceIdx).replace(/:$/, '').trim();
        colType = colDef.slice(spaceIdx).trim();
      }
    }

    // 예약어인 경우 필드로 추가하지 않음
    if (RESERVED_KEYWORDS.has(colName.toLowerCase())) {
      continue;
    }

    const field: ColumnField = {
      name: colName,
      type: colType,
    };

    if (settingsStr) {
      if (/\bpk\b/i.test(settingsStr) || /\bprimary key\b/i.test(settingsStr)) {
        field.pk = true;
      }
      if (/\bunique\b/i.test(settingsStr) || /\buniq\b/i.test(settingsStr)) {
        field.unique = true;
      }
      if (/\bnot null\b/i.test(settingsStr)) {
        field.notNull = true;
      }
      if (/\bincrement\b/i.test(settingsStr) || /\bauto_increment\b/i.test(settingsStr)) {
        field.increment = true;
      }

      // default: `now()` 또는 default: false 또는 default: 'active'
      const defaultMatch = settingsStr.match(
        /default:\s*(`[^`]+`|'[^']+'|"[^"]+"|[a-zA-Z0-9_.-]+)/i
      );
      if (defaultMatch) {
        field.default = defaultMatch[1].replace(/[`'"]/g, '');
      }

      // note: 'some note'
      const noteMatch = settingsStr.match(/note:\s*('[^']+'|"[^"]+)/i);
      if (noteMatch) {
        field.note = noteMatch[1].replace(/['"]/g, '');
      }

      // ref: > users.id
      const refMatch = settingsStr.match(
        /ref:\s*([><-]|<>)\s*([a-zA-Z0-9_".-]+)\.([a-zA-Z0-9_".-]+)/i
      );
      if (refMatch) {
        const relType = refMatch[1] as '>' | '<' | '-' | '<>';
        const targetTable = refMatch[2].replace(/["']/g, '').trim();
        const targetCol = refMatch[3].replace(/["']/g, '').trim();

        field.ref = {
          type: relType,
          targetTable,
          targetColumn: targetCol,
        };

        const relId = `${tableName}.${colName}-${targetTable}.${targetCol}`;
        if (!relationships.some((r) => r.id === relId)) {
          relationships.push({
            id: relId,
            sourceTable: tableName,
            sourceColumn: colName,
            targetTable,
            targetColumn: targetCol,
            relationType: relType,
          });
        }
      }
    }

    fields.push(field);
  }

  return fields;
}
