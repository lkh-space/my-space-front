import { beforeEach, describe, expect, it, vi } from 'vitest';
import { exportDbmlToSql, formatDbmlCode, importSqlToDbml } from './dbmlApi';

describe('dbmlApi', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('exportDbmlToSql', () => {
    const sampleDbml = `
      Table users {
        id integer [pk, increment]
        email varchar [unique, not null]
      }
      Table posts {
        id integer [pk]
        user_id integer
      }
      Ref: posts.user_id > users.id
    `;

    it('백엔드 API가 성공하면 백엔드에서 반환한 SQL을 반환해야 한다', async () => {
      const mockResponse = { sql: 'CREATE TABLE users_api ();', dialect: 'postgres' };
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await exportDbmlToSql(sampleDbml, 'postgres');

      expect(fetch).toHaveBeenCalledWith('/api/v1/dbml/export-sql', expect.objectContaining({
        method: 'POST',
      }));
      expect(result.sql).toBe('CREATE TABLE users_api ();');
      expect(result.dialect).toBe('postgres');
      expect(result.fromFallback).toBeUndefined();
    });

    it('네트워크 오류 발생 시 클라이언트 PostgreSQL fallback SQL을 생성하고 fromFallback 플래그를 세팅해야 한다', async () => {
      vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(new Error('Network error'));

      const result = await exportDbmlToSql(sampleDbml, 'postgres');

      expect(result.fromFallback).toBe(true);
      expect(result.dialect).toBe('postgres');
      expect(result.sql).toContain('CREATE TABLE "users" (');
      expect(result.sql).toContain('"id" INTEGER PRIMARY KEY');
      expect(result.sql).toContain('"email" VARCHAR UNIQUE NOT NULL');
      expect(result.sql).toContain('ALTER TABLE "posts" ADD CONSTRAINT "fk_posts_user_id" FOREIGN KEY ("user_id") REFERENCES "users" ("id");');
    });

    it('MySQL dialect 선택 시 백틱 식별자와 AUTO_INCREMENT가 적용되어야 한다', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: false,
        status: 503,
      } as Response);

      const result = await exportDbmlToSql(sampleDbml, 'mysql');

      expect(result.fromFallback).toBe(true);
      expect(result.dialect).toBe('mysql');
      expect(result.sql).toContain('CREATE TABLE `users` (');
      expect(result.sql).toContain('`id` INTEGER PRIMARY KEY AUTO_INCREMENT');
      expect(result.sql).toContain('`email` VARCHAR UNIQUE NOT NULL');
      expect(result.sql).toContain('ALTER TABLE `posts` ADD CONSTRAINT `fk_posts_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);');
    });

    it('SQLite dialect 선택 시 AUTOINCREMENT가 적용되어야 한다', async () => {
      vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(new Error('Backend offline'));

      const result = await exportDbmlToSql(sampleDbml, 'sqlite');

      expect(result.fromFallback).toBe(true);
      expect(result.dialect).toBe('sqlite');
      expect(result.sql).toContain('CREATE TABLE "users" (');
      expect(result.sql).toContain('"id" INTEGER PRIMARY KEY AUTOINCREMENT');
    });

    it('파싱할 수 없는 잘못된 DBML인 경우 안내 주석을 반환해야 한다', async () => {
      vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(new Error('Offline'));

      const result = await exportDbmlToSql('Invalid syntax @@##!!', 'postgres');

      expect(result.fromFallback).toBe(true);
      expect(result.sql).toContain('-- [Notice] 스키마를 올바르게 파싱할 수 없습니다.');
    });
  });

  describe('importSqlToDbml', () => {
    const sampleSql = `
      CREATE TABLE users (
        id INT PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL
      );
    `;

    it('백엔드 API 성공 시 백엔드의 DBML 결과를 반환해야 한다', async () => {
      const mockResponse = { dbml: 'Table users { id int [pk] }' };
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await importSqlToDbml(sampleSql, 'postgres');

      expect(result.dbml).toBe('Table users { id int [pk] }');
      expect(result.fromFallback).toBeUndefined();
    });

    it('백엔드 실패 시 CREATE TABLE SQL을 파싱하여 클라이언트 DBML을 생성해야 한다', async () => {
      vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(new Error('Network error'));

      const result = await importSqlToDbml(sampleSql, 'postgres');

      expect(result.fromFallback).toBe(true);
      expect(result.dbml).toContain('Table users {');
      expect(result.dbml).toContain('id int [pk]');
      expect(result.dbml).toContain('email varchar(255) [unique, not null]');
    });

    it('변환 가능한 CREATE TABLE 구문이 없는 경우 안내 주석을 반환해야 한다', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: false,
        status: 400,
      } as Response);

      const result = await importSqlToDbml('SELECT * FROM users;', 'postgres');

      expect(result.fromFallback).toBe(true);
      expect(result.dbml).toContain('// 변환 가능한 CREATE TABLE 구문을 찾지 못했습니다.');
    });
  });

  describe('formatDbmlCode', () => {
    it('백엔드 포맷터 성공 시 결과 포맷팅 문자열을 반환해야 한다', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => ({ formattedDbml: 'Table users {\n  id int\n}' }),
      } as Response);

      const formatted = await formatDbmlCode('Table users { id int }');
      expect(formatted).toBe('Table users {\n  id int\n}');
    });

    it('백엔드 오류 시 클라이언트 fallback으로 각 라인의 후행 공백(trimEnd)을 정리해야 한다', async () => {
      vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(new Error('Failed to fetch'));

      const input = 'Table users {   \n  id int    \n}  ';
      const formatted = await formatDbmlCode(input);

      expect(formatted).toBe('Table users {\n  id int\n}');
    });
  });
});
