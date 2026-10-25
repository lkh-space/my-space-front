import { describe, expect, it } from 'vitest';
import { convertSqlToDbml } from './sqlToDbmlParser';

describe('sqlToDbmlParser', () => {
  it('CREATE DATABASE 및 USE 구문은 에러 없이 무시(필터링)하고 순수 CREATE TABLE 구문만 파싱해야 한다', () => {
    const sqlWithDb = `
      -- 데이터베이스 생성 및 환경 설정
      CREATE DATABASE IF NOT EXISTS e_commerce_db;
      USE e_commerce_db;
      SET NAMES 'utf8mb4';
      DROP DATABASE IF EXISTS old_db;

      /* 사용자 테이블 */
      CREATE TABLE users (
        id INT PRIMARY KEY AUTO_INCREMENT,
        username VARCHAR(50) NOT NULL UNIQUE,
        email VARCHAR(100) NOT NULL
      );
    `;

    const result = convertSqlToDbml(sqlWithDb);

    expect(result.tableCount).toBe(1);
    expect(result.dbml).not.toContain('e_commerce_db');
    expect(result.dbml).not.toContain('CREATE DATABASE');
    expect(result.dbml).toContain('Table users {');
    expect(result.dbml).toContain('id int [pk, increment]');
    expect(result.dbml).toContain('username varchar(50) [unique, not null]');
    expect(result.dbml).toContain('email varchar(100) [not null]');
  });

  it('테이블 레벨 PRIMARY KEY 및 FOREIGN KEY 제약 조건을 파싱해야 한다', () => {
    const sql = `
      CREATE TABLE posts (
        id INT,
        author_id INT,
        title VARCHAR(200) NOT NULL,
        PRIMARY KEY (id),
        CONSTRAINT fk_posts_author FOREIGN KEY (author_id) REFERENCES users(id)
      );
    `;

    const result = convertSqlToDbml(sql);

    expect(result.tableCount).toBe(1);
    expect(result.dbml).toContain('Table posts {');
    expect(result.dbml).toContain('id int [pk]');
    expect(result.dbml).toContain('author_id int');
    expect(result.dbml).toContain('title varchar(200) [not null]');
    expect(result.dbml).toContain('Ref: posts.author_id > users.id');
  });

  it('독립된 ALTER TABLE ... ADD FOREIGN KEY 구문도 Ref 관계로 올바르게 연결해야 한다', () => {
    const sql = `
      CREATE TABLE orders (
        order_id INT PRIMARY KEY,
        customer_id INT
      );

      CREATE TABLE customers (
        id INT PRIMARY KEY,
        name VARCHAR(100)
      );

      ALTER TABLE orders ADD CONSTRAINT fk_orders_customer
        FOREIGN KEY (customer_id) REFERENCES customers(id);
    `;

    const result = convertSqlToDbml(sql);

    expect(result.tableCount).toBe(2);
    expect(result.dbml).toContain('Table orders {');
    expect(result.dbml).toContain('Table customers {');
    expect(result.dbml).toContain('Ref: orders.customer_id > customers.id');
  });

  it('CREATE TABLE이 없는 빈 쿼리나 단순 SELECT 문인 경우 안내 메시지를 반환해야 한다', () => {
    const result = convertSqlToDbml('SELECT * FROM users;');
    expect(result.tableCount).toBe(0);
    expect(result.dbml).toContain('// 변환 가능한 CREATE TABLE 구문을 찾지 못했습니다.');
  });
});
