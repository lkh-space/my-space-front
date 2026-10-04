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
});
