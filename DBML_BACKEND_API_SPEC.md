# DBML 백엔드 API 사양서 (my-space-backend 참고용)

이 문서는 프론트엔드 `my-space-frontend`의 DBML 스키마 변환기(`DBML Utility`)와 연동하기 위해 `my-space-backend`에서 구현해야 하는 백엔드 API 규격과 NestJS 권장 구현 코드입니다.
복사하여 백엔드 저장소에 반영하신 후, 이 파일은 삭제하셔도 무방합니다.

---

## 1. 백엔드 의존성 설치
백엔드(`my-space-backend`) 루트에서 `@dbml/core` 패키지를 설치합니다:
```bash
pnpm add @dbml/core
```

---

## 2. API 엔드포인트 목록

| Method | Endpoint | 설명 |
| :--- | :--- | :--- |
| `POST` | `/api/v1/dbml/export-sql` | DBML 스키마를 지정한 SQL 다이얼렉트(PostgreSQL, MySQL 등) DDL로 변환 |
| `POST` | `/api/v1/dbml/import-sql` | SQL DDL 문자열을 DBML 스키마 문자열로 역변환 |
| `POST` | `/api/v1/dbml/format` | DBML 구문 유효성 검증 및 포맷팅/정규화 |

---

## 3. 요청 및 응답 규격

### 3.1. DBML -> SQL 변환 (`POST /api/v1/dbml/export-sql`)
* **Request Body**:
  ```json
  {
    "dbml": "Table users {\n  id int [pk, increment]\n  email varchar [unique, not null]\n}\n",
    "dialect": "postgres" // 'postgres' | 'mysql' | 'sqlite' | 'mssql' (기본값: 'postgres')
  }
  ```
* **Response Body** (HTTP 200 OK):
  ```json
  {
    "sql": "CREATE TABLE \"users\" (\n  \"id\" int PRIMARY KEY,\n  \"email\" varchar UNIQUE NOT NULL\n);\n",
    "dialect": "postgres"
  }
  ```

### 3.2. SQL -> DBML 역변환 (`POST /api/v1/dbml/import-sql`)
* **Request Body**:
  ```json
  {
    "sql": "CREATE TABLE users (id integer PRIMARY KEY, email text NOT NULL);",
    "dialect": "postgres" // 'postgres' | 'mysql' (기본값: 'postgres')
  }
  ```
* **Response Body** (HTTP 200 OK):
  ```json
  {
    "dbml": "Table \"users\" {\n  \"id\" integer [pk]\n  \"email\" text [not null]\n}\n"
  }
  ```

### 3.3. DBML 포맷팅/정규화 (`POST /api/v1/dbml/format`)
* **Request Body**:
  ```json
  {
    "dbml": "Table users { id int [pk] email varchar }"
  }
  ```
* **Response Body** (HTTP 200 OK):
  ```json
  {
    "formattedDbml": "Table \"users\" {\n  \"id\" int [pk]\n  \"email\" varchar\n}\n"
  }
  ```

---

## 4. NestJS 권장 구현 코드 예시

### 4.1. DTO (`src/dbml/dto/dbml.dto.ts`)
```typescript
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export enum SqlDialect {
  POSTGRES = 'postgres',
  MYSQL = 'mysql',
  SQLITE = 'sqlite',
  MSSQL = 'mssql',
}

export class ExportSqlDto {
  @IsString()
  @IsNotEmpty()
  dbml: string;

  @IsEnum(SqlDialect)
  @IsOptional()
  dialect?: SqlDialect = SqlDialect.POSTGRES;
}

export class ImportSqlDto {
  @IsString()
  @IsNotEmpty()
  sql: string;

  @IsEnum(SqlDialect)
  @IsOptional()
  dialect?: SqlDialect = SqlDialect.POSTGRES;
}

export class FormatDbmlDto {
  @IsString()
  @IsNotEmpty()
  dbml: string;
}
```

### 4.2. 서비스 (`src/dbml/dbml.service.ts`)
```typescript
import { BadRequestException, Injectable } from '@nestjs/common';
import { Parser, ModelExporter } from '@dbml/core';
import { ExportSqlDto, ImportSqlDto } from './dto/dbml.dto';

@Injectable()
export class DbmlService {
  exportToSql(dto: ExportSqlDto) {
    try {
      const database = Parser.parse(dto.dbml, 'dbml');
      const dialect = dto.dialect || 'postgres';
      const sql = ModelExporter.export(database, dialect as any);
      return { sql, dialect };
    } catch (err: any) {
      const message = err?.diags?.[0]?.message || err?.message || 'DBML 파싱 또는 SQL 변환 실패';
      throw new BadRequestException({ message, details: err });
    }
  }

  importFromSql(dto: ImportSqlDto) {
    try {
      const dialect = dto.dialect === 'mysql' ? 'mysql' : 'postgres';
      const database = Parser.parse(dto.sql, dialect as any);
      const dbml = ModelExporter.export(database, 'dbml');
      return { dbml };
    } catch (err: any) {
      const message = err?.diags?.[0]?.message || err?.message || 'SQL DDL 파싱 실패';
      throw new BadRequestException({ message, details: err });
    }
  }

  formatDbml(dbml: string) {
    try {
      const database = Parser.parse(dbml, 'dbml');
      const formattedDbml = ModelExporter.export(database, 'dbml');
      return { formattedDbml };
    } catch (err: any) {
      throw new BadRequestException({ message: err?.message || '유효하지 않은 DBML 스키마입니다.' });
    }
  }
}
```

### 4.3. 컨트롤러 (`src/dbml/dbml.controller.ts`)
```typescript
import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { DbmlService } from './dbml.service';
import { ExportSqlDto, FormatDbmlDto, ImportSqlDto } from './dto/dbml.dto';

@Controller('api/v1/dbml')
export class DbmlController {
  constructor(private readonly dbmlService: DbmlService) {}

  @Post('export-sql')
  @HttpCode(HttpStatus.OK)
  exportSql(@Body() dto: ExportSqlDto) {
    return this.dbmlService.exportToSql(dto);
  }

  @Post('import-sql')
  @HttpCode(HttpStatus.OK)
  importSql(@Body() dto: ImportSqlDto) {
    return this.dbmlService.importFromSql(dto);
  }

  @Post('format')
  @HttpCode(HttpStatus.OK)
  format(@Body() dto: FormatDbmlDto) {
    return this.dbmlService.formatDbml(dto.dbml);
  }
}
```
