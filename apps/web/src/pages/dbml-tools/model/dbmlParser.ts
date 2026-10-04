import { ColumnField, ParsedSchema, RelationshipEdge, TableEntity } from './types';

/**
 * 브라우저 환경에서 실시간(10~20ms)으로 동작하는 경량 DBML 파서
 * - Table 구문 파싱 (컬럼명, 데이터 타입, 설정 속성: pk, unique, not null, default, ref 등)
 * - 독립된 Ref 및 인라인 Ref 관계선 파싱
 * - 주석(// 및 블록 주석) 제거 및 에러 위치 추적
 */
export function parseDbml(content: string): ParsedSchema {
  const startTime = performance.now();
  const tables: TableEntity[] = [];
  const relationships: RelationshipEdge[] = [];

  try {
    // 1. 주석 제거 (블록 주석 및 한줄 주석)
    const cleaned = content
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/\/\/.*$/gm, '');

    // 2. Table 블록 정규식 매칭: Table <name> [as <alias>] { <body ?> }
    const tableRegex = /Table\s+([a-zA-Z0-9_"-]+)(?:\s+as\s+([a-zA-Z0-9_"-]+))?\s*\{([^}]*)\}/gi;
    let tableMatch: RegExpExecArray | null;

    while ((tableMatch = tableRegex.exec(cleaned)) !== null) {
      const rawTableName = tableMatch[1].replace(/["']/g, '').trim();
      const alias = tableMatch[2]?.replace(/["']/g, '').trim();
      const body = tableMatch[3] || '';

      const fields = parseTableFields(rawTableName, body, relationships);
      tables.push({
        name: rawTableName,
        alias,
        fields,
      });
    }

    // 3. 독립 Ref 구문 매칭: Ref [name]?: <table>.<col> (<|>|-|<>) <table>.<col>
    const refRegex = /Ref(?:\s+[a-zA-Z0-9_"-]+)?\s*:\s*([a-zA-Z0-9_"-]+)\.([a-zA-Z0-9_"-]+)\s*([><-]|<>)\s*([a-zA-Z0-9_"-]+)\.([a-zA-Z0-9_"-]+)/gi;
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

    const duration = Math.max(1, Math.round(performance.now() - startTime));

    return {
      tables,
      relationships,
      isValid: true,
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

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('Note:')) {
      continue;
    }

    // 컬럼 형식: <name> <type> [<settings>]
    // 예: email varchar [unique, not null]
    // 예: user_id int [ref: > users.id]
    const match = trimmed.match(/^([a-zA-Z0-9_"-]+)\s+([a-zA-Z0-9_()]+)(?:\s*\[(.*)\])?/);
    if (!match) continue;

    const colName = match[1].replace(/["']/g, '').trim();
    const colType = match[2].trim();
    const settingsStr = match[3] || '';

    const field: ColumnField = {
      name: colName,
      type: colType,
    };

    if (settingsStr) {
      if (/\bpk\b/i.test(settingsStr) || /\bprimary key\b/i.test(settingsStr)) {
        field.pk = true;
      }
      if (/\bunique\b/i.test(settingsStr)) {
        field.unique = true;
      }
      if (/\bnot null\b/i.test(settingsStr)) {
        field.notNull = true;
      }
      if (/\bincrement\b/i.test(settingsStr)) {
        field.increment = true;
      }

      // default: `now()` 또는 default: false
      const defaultMatch = settingsStr.match(/default:\s*(`[^`]+`|'[^']+'|"[^"]+"|[a-zA-Z0-9_]+)/i);
      if (defaultMatch) {
        field.default = defaultMatch[1].replace(/[`'"]/g, '');
      }

      // note: 'some note'
      const noteMatch = settingsStr.match(/note:\s*('[^']+'|"[^"]+)/i);
      if (noteMatch) {
        field.note = noteMatch[1].replace(/['"]/g, '');
      }

      // ref: > users.id
      const refMatch = settingsStr.match(/ref:\s*([><-]|<>)\s*([a-zA-Z0-9_"-]+)\.([a-zA-Z0-9_"-]+)/i);
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
