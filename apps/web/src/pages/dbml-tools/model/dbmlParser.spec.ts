import { describe, expect, it } from 'vitest';
import { parseDbml } from './dbmlParser';
import { DEFAULT_DBML_SCHEMA } from './defaultSchema';

describe('dbmlParser', () => {
  it('기본 예제 스키마를 올바르게 파싱해야 한다', () => {
    const result = parseDbml(DEFAULT_DBML_SCHEMA);

    expect(result.isValid).toBe(true);
    expect(result.tables).toHaveLength(3);

    const userTable = result.tables.find((t) => t.name === 'users');
    expect(userTable).toBeDefined();
    expect(userTable?.fields).toHaveLength(3);

    const idField = userTable?.fields.find((f) => f.name === 'id');
    expect(idField?.pk).toBe(true);
    expect(idField?.increment).toBe(true);

    const emailField = userTable?.fields.find((f) => f.name === 'email');
    expect(emailField?.unique).toBe(true);
    expect(emailField?.notNull).toBe(true);

    // 외래키 관계선 확인
    expect(result.relationships).toHaveLength(2);
    expect(
      result.relationships.some(
        (r) => r.sourceTable === 'projects' && r.targetTable === 'users' && r.sourceColumn === 'user_id',
      ),
    ).toBe(true);
  });

  it('독립된 Ref 구문도 올바르게 파싱해야 한다', () => {
    const dbml = `
      Table orders {
        id int [pk]
        customer_id int
      }
      Table customers {
        id int [pk]
      }
      Ref: orders.customer_id > customers.id
    `;
    const result = parseDbml(dbml);

    expect(result.isValid).toBe(true);
    expect(result.tables).toHaveLength(2);
    expect(result.relationships).toHaveLength(1);
    expect(result.relationships[0].sourceTable).toBe('orders');
    expect(result.relationships[0].targetTable).toBe('customers');
  });

  it('주석 및 빈 줄을 무시해야 한다', () => {
    const dbml = `
      // 단일 주석
      /* 블록 주석 */
      Table items {
        id int [pk] // 인라인 주석
      }
    `;
    const result = parseDbml(dbml);
    expect(result.isValid).toBe(true);
    expect(result.tables).toHaveLength(1);
    expect(result.tables[0].name).toBe('items');
    expect(result.tables[0].fields).toHaveLength(1);
  });

  describe('엣지 케이스 및 오류 처리 (P0)', () => {
    it('중괄호가 닫히지 않은 경우 isValid: false와 에러 메시지를 반환해야 한다', () => {
      const invalidDbml = `
        Table users {
          id integer [pk]
          name varchar
      `;
      const result = parseDbml(invalidDbml);

      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toBe('중괄호({ }) 쌍이 일치하지 않습니다.');
    });

    it('Table 키워드는 있지만 파싱 가능한 테이블 블록이 없는 경우 isValid: false를 반환해야 한다', () => {
      const invalidDbml = 'Table broken_table_definition without braces';
      const result = parseDbml(invalidDbml);

      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toBe('올바른 형식의 Table 정의를 찾을 수 없습니다.');
    });

    it('Ref 키워드는 있지만 올바른 관계선 형식이 아닌 경우 isValid: false를 반환해야 한다', () => {
      const invalidDbml = `
        Table users {
          id int [pk]
        }
        Ref: invalid_relation_syntax
      `;
      const result = parseDbml(invalidDbml);

      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toBe('올바른 형식의 Ref 관계 정의를 찾을 수 없습니다.');
    });

    it('필드가 없는 빈 테이블 블록도 오류 없이 파싱되어야 한다', () => {
      const dbml = 'Table empty_table {}';
      const result = parseDbml(dbml);

      expect(result.isValid).toBe(true);
      expect(result.tables).toHaveLength(1);
      expect(result.tables[0].name).toBe('empty_table');
      expect(result.tables[0].fields).toHaveLength(0);
    });

    it('빈 스키마나 공백 문자열 입력 시 크래시 없이 빈 유효 결과를 반환해야 한다', () => {
      const result = parseDbml('   \n\t  ');

      expect(result.isValid).toBe(true);
      expect(result.tables).toHaveLength(0);
      expect(result.relationships).toHaveLength(0);
    });

    it('테이블명과 컬럼명에 따옴표와 하이픈이 포함되어도 정상적으로 식별자를 추출해야 한다', () => {
      const dbml = `
        Table "user-profiles" {
          "user-id" int [pk]
          "display-name" varchar [not null]
        }
      `;
      const result = parseDbml(dbml);

      expect(result.isValid).toBe(true);
      expect(result.tables).toHaveLength(1);
      expect(result.tables[0].name).toBe('user-profiles');
      expect(result.tables[0].fields[0].name).toBe('user-id');
      expect(result.tables[0].fields[0].pk).toBe(true);
      expect(result.tables[0].fields[1].name).toBe('display-name');
      expect(result.tables[0].fields[1].notNull).toBe(true);
    });
  });
});

