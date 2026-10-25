export interface SqlToDbmlResult {
  dbml: string;
  tableCount: number;
}

/**
 * SQL DDL 스크립트를 DBML 스키마로 변환합니다.
 * - CREATE DATABASE, USE, DROP DATABASE, CREATE SCHEMA 등 데이터베이스/환경 쿼리는 에러 없이 무시(필터링)합니다.
 * - CREATE TABLE 구문 및 ALTER TABLE 외래키 제약조건을 DBML Table 및 Ref 구문으로 변환합니다.
 */
export function convertSqlToDbml(sql: string): SqlToDbmlResult {
  if (!sql || !sql.trim()) {
    return { dbml: '', tableCount: 0 };
  }

  // 1. 주석 제거
  // 블록 주석 제거 (/* ... */)
  let cleanSql = sql.replace(/\/\*[\s\S]*?\*\//g, '');
  // 한 줄 주석 제거 (-- ... or # ...)
  cleanSql = cleanSql.replace(/(--|#)[^\n]*/g, '');

  // 2. CREATE DATABASE, USE, DROP DATABASE, CREATE SCHEMA, SET 등 비-테이블 쿼리 필터링/무시
  cleanSql = cleanSql.replace(/\bCREATE\s+(?:DATABASE|SCHEMA)\s+[^;]+;/gi, '');
  cleanSql = cleanSql.replace(/\bDROP\s+(?:DATABASE|SCHEMA)\s+[^;]+;/gi, '');
  cleanSql = cleanSql.replace(/\bALTER\s+(?:DATABASE|SCHEMA)\s+[^;]+;/gi, '');
  cleanSql = cleanSql.replace(/\bUSE\s+[^;]+;/gi, '');
  cleanSql = cleanSql.replace(/\bSET\s+[^;]+;/gi, '');

  // 3. CREATE TABLE 구문 추출
  // 형식: CREATE TABLE [IF NOT EXISTS] [schema.]table_name ( body ) [table_options];
  const tableRegex =
    /\bCREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(?:["`]?([a-zA-Z0-9_]+)["`]?\.)?["`]?([a-zA-Z0-9_]+)["`]?\s*\(([\s\S]*?)\)(?:\s*ENGINE\s*=\s*[^;]+|\s*DEFAULT\s+CHARSET\s*=\s*[^;]+|\s*COLLATE\s*=\s*[^;]+)*;/gi;

  const dbmlTables: string[] = [];
  const relationships: string[] = [];
  let match: RegExpExecArray | null;

  while ((match = tableRegex.exec(cleanSql)) !== null) {
    const tableName = match[2];
    const body = match[3];

    const lines = body.split('\n');
    const fieldLines: string[] = [];
    const tableLevelPks = new Set<string>();

    // 3-1. 테이블 레벨 제약 조건 먼저 수집 (PRIMARY KEY, FOREIGN KEY)
    for (const rawLine of lines) {
      const line = rawLine.trim().replace(/,$/, '');
      if (!line) continue;

      // PRIMARY KEY (col1, col2)
      const pkMatch = line.match(/^PRIMARY\s+KEY\s*\(([^)]+)\)/i);
      if (pkMatch) {
        pkMatch[1]
          .split(',')
          .map((c) => c.trim().replace(/["`]/g, ''))
          .forEach((col) => tableLevelPks.add(col.toLowerCase()));
        continue;
      }

      // [CONSTRAINT name] FOREIGN KEY (col) REFERENCES target(col)
      const fkMatch = line.match(
        /(?:CONSTRAINT\s+["`]?\w+["`]?\s+)?FOREIGN\s+KEY\s*\(\s*["`]?(\w+)["`]?\s*\)\s*REFERENCES\s+(?:["`]?\w+["`]?\.)?["`]?(\w+)["`]?\s*\(\s*["`]?(\w+)["`]?\s*\)/i
      );
      if (fkMatch) {
        const sourceCol = fkMatch[1];
        const targetTable = fkMatch[2];
        const targetCol = fkMatch[3];
        relationships.push(`Ref: ${tableName}.${sourceCol} > ${targetTable}.${targetCol}`);
      }
    }

    // 3-2. 컬럼 정의 파싱
    for (const rawLine of lines) {
      const line = rawLine.trim().replace(/,$/, '');
      if (
        !line ||
        /^PRIMARY\s+KEY/i.test(line) ||
        /^KEY\s+/i.test(line) ||
        /^INDEX\s+/i.test(line) ||
        /^UNIQUE\s+KEY/i.test(line) ||
        /^UNIQUE\s+INDEX/i.test(line) ||
        /^CONSTRAINT\s+/i.test(line) ||
        /^FOREIGN\s+KEY/i.test(line) ||
        /^CHECK\s+/i.test(line)
      ) {
        continue;
      }

      // 컬럼명, 타입, 나머지 속성 추출
      // 예: "id" INT(11) PRIMARY KEY AUTO_INCREMENT
      const colMatch = line.match(/^["`]?([a-zA-Z0-9_]+)["`]?\s+([a-zA-Z0-9_]+(?:\([^)]*\))?)(.*)/i);
      if (colMatch) {
        const colName = colMatch[1];
        const colType = colMatch[2].toLowerCase();
        const rest = colMatch[3] || '';
        const tags: string[] = [];

        // PK 검사 (인라인 또는 테이블 레벨)
        if (/PRIMARY\s+KEY/i.test(rest) || tableLevelPks.has(colName.toLowerCase())) {
          tags.push('pk');
        }

        // AUTO_INCREMENT / IDENTITY / SERIAL
        if (
          /AUTO_INCREMENT/i.test(rest) ||
          /AUTOINCREMENT/i.test(rest) ||
          /IDENTITY/i.test(rest) ||
          /SERIAL/i.test(colType)
        ) {
          tags.push('increment');
        }

        // UNIQUE
        if (/UNIQUE/i.test(rest)) {
          tags.push('unique');
        }

        // NOT NULL
        if (/NOT\s+NULL/i.test(rest)) {
          tags.push('not null');
        }

        // DEFAULT val
        const defaultMatch = rest.match(/DEFAULT\s+([^,\s]+)/i);
        if (defaultMatch && !/NULL/i.test(defaultMatch[1])) {
          tags.push(`default: \`${defaultMatch[1].replace(/['"]/g, '')}\``);
        }

        // 인라인 REFERENCES target(col)
        const inlineRefMatch = rest.match(/REFERENCES\s+(?:["`]?\w+["`]?\.)?["`]?(\w+)["`]?\s*\(\s*["`]?(\w+)["`]?\s*\)/i);
        if (inlineRefMatch) {
          const targetTable = inlineRefMatch[1];
          const targetCol = inlineRefMatch[2];
          relationships.push(`Ref: ${tableName}.${colName} > ${targetTable}.${targetCol}`);
        }

        const tagStr = tags.length > 0 ? ` [${tags.join(', ')}]` : '';
        fieldLines.push(`  ${colName} ${colType}${tagStr}`);
      }
    }

    if (fieldLines.length > 0) {
      dbmlTables.push(`Table ${tableName} {\n${fieldLines.join('\n')}\n}`);
    }
  }

  // 4. 독립된 ALTER TABLE ... ADD [CONSTRAINT] FOREIGN KEY 구문 파싱
  const alterFkRegex =
    /\bALTER\s+TABLE\s+(?:["`]?\w+["`]?\.)?["`]?(\w+)["`]?\s+ADD\s+(?:CONSTRAINT\s+["`]?\w+["`]?\s+)?FOREIGN\s+KEY\s*\(\s*["`]?(\w+)["`]?\s*\)\s*REFERENCES\s+(?:["`]?\w+["`]?\.)?["`]?(\w+)["`]?\s*\(\s*["`]?(\w+)["`]?\s*\)[^;]*;/gi;

  let alterMatch: RegExpExecArray | null;
  while ((alterMatch = alterFkRegex.exec(cleanSql)) !== null) {
    const sourceTable = alterMatch[1];
    const sourceCol = alterMatch[2];
    const targetTable = alterMatch[3];
    const targetCol = alterMatch[4];
    relationships.push(`Ref: ${sourceTable}.${sourceCol} > ${targetTable}.${targetCol}`);
  }

  const tableCount = dbmlTables.length;
  if (tableCount === 0) {
    return {
      dbml: '// 변환 가능한 CREATE TABLE 구문을 찾지 못했습니다.\n',
      tableCount: 0,
    };
  }

  const resultParts = [...dbmlTables];
  if (relationships.length > 0) {
    // 중복 관계 제거
    const uniqueRels = Array.from(new Set(relationships));
    resultParts.push(uniqueRels.join('\n'));
  }

  return {
    dbml: resultParts.join('\n\n') + '\n',
    tableCount,
  };
}
