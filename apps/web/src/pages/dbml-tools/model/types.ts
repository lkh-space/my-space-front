export type SqlDialect = 'postgres' | 'mysql' | 'sqlite' | 'mssql';

export interface ColumnField {
  name: string;
  type: string;
  pk?: boolean;
  unique?: boolean;
  notNull?: boolean;
  increment?: boolean;
  default?: string;
  note?: string;
  ref?: {
    type: '>' | '<' | '-' | '<>';
    targetTable: string;
    targetColumn: string;
  };
}

export interface TableEntity {
  name: string;
  alias?: string;
  note?: string;
  fields: ColumnField[];
  x?: number;
  y?: number;
  width?: number;
  height?: number;
}

export interface RelationshipEdge {
  id: string;
  sourceTable: string;
  sourceColumn: string;
  targetTable: string;
  targetColumn: string;
  relationType: '>' | '<' | '-' | '<>';
}

export interface ParsedSchema {
  tables: TableEntity[];
  relationships: RelationshipEdge[];
  isValid: boolean;
  errorMessage?: string;
  parseTimeMs: number;
}
