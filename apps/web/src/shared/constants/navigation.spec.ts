import { describe, it, expect } from 'vitest';
import {
  WORKSPACE_NAV_ENTRIES,
  INSTALLED_UTILITIES,
  getBreadcrumbByPath,
} from './navigation';

describe('navigation constants & utilities', () => {
  describe('WORKSPACE_NAV_ENTRIES', () => {
    it('필수 네비게이션 항목(대시보드, PDF, DBML, 문서)이 모두 정의되어 있어야 한다', () => {
      const ids = WORKSPACE_NAV_ENTRIES.map((entry) => entry.id);
      expect(ids).toContain('dashboard');
      expect(ids).toContain('pdf-tools');
      expect(ids).toContain('dbml-tools');
      expect(ids).toContain('docs');
    });

    it('각 네비게이션 항목은 필수 프로퍼티(id, path, title, icon 등)를 유효하게 포함해야 한다', () => {
      WORKSPACE_NAV_ENTRIES.forEach((entry) => {
        expect(entry.id).toBeTruthy();
        expect(entry.path).toMatch(/^\//);
        expect(entry.title).toBeTruthy();
        expect(entry.shortLabel).toBeTruthy();
        expect(entry.icon).toBeTruthy();
        expect(entry.breadcrumbPage).toBeTruthy();
      });
    });
  });

  describe('INSTALLED_UTILITIES', () => {
    it('isInstalledUtility가 true인 항목만 필터링되어야 한다', () => {
      expect(INSTALLED_UTILITIES.length).toBeGreaterThan(0);
      INSTALLED_UTILITIES.forEach((utility) => {
        expect(utility.isInstalledUtility).toBe(true);
        expect(utility.utilityTitle).toBeTruthy();
        expect(utility.description).toBeTruthy();
      });

      // 대시보드는 설치된 유틸리티가 아님
      const dashboardInUtils = INSTALLED_UTILITIES.find((u) => u.id === 'dashboard');
      expect(dashboardInUtils).toBeUndefined();
    });
  });

  describe('getBreadcrumbByPath', () => {
    it('등록된 경로에 맞는 브레드크럼 정보를 올바르게 반환해야 한다', () => {
      expect(getBreadcrumbByPath('/')).toEqual({
        category: '워크스페이스',
        page: '대시보드',
      });

      expect(getBreadcrumbByPath('/pdf-tools')).toEqual({
        category: '유틸리티',
        page: 'PDF 처리 엔진',
      });

      expect(getBreadcrumbByPath('/dbml-tools')).toEqual({
        category: '유틸리티',
        page: 'DBML 스키마',
      });

      expect(getBreadcrumbByPath('/docs')).toEqual({
        category: '워크스페이스',
        page: '마크다운 문서',
      });
    });

    it('등록되지 않은 알 수 없는 경로에 대해서는 기본 fallback을 반환해야 한다', () => {
      const fallback = getBreadcrumbByPath('/unknown-random-route');
      expect(fallback).toEqual({
        category: '탐색',
        page: '페이지',
      });
    });
  });
});
