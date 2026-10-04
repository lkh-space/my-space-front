import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  generateVersionInfo,
  resolveGitBranch,
  resolveGitCommit,
  loadPackageVersion,
} from './version';

describe('version utility', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('resolveGitBranch', () => {
    it('GIT_BRANCH 환경변수가 설정되어 있으면 해당 값을 우선 반환해야 한다', () => {
      process.env.GIT_BRANCH = 'feature/auth-v2';
      expect(resolveGitBranch()).toBe('feature/auth-v2');
    });

    it('환경변수가 없을 때 로컬 git 브랜치 또는 unknown을 반환해야 한다', () => {
      delete process.env.GIT_BRANCH;
      const branch = resolveGitBranch();
      expect(typeof branch).toBe('string');
      expect(branch.length).toBeGreaterThan(0);
    });
  });

  describe('resolveGitCommit', () => {
    it('GIT_COMMIT이 40자리 긴 해시일 경우 앞 7자리로 단축해야 한다', () => {
      process.env.GIT_COMMIT = '586e4d3abcdef1234567890abcdef1234567890';
      expect(resolveGitCommit()).toBe('586e4d3');
    });

    it('GIT_COMMIT이 7자리 이하일 경우 그대로 반환해야 한다', () => {
      process.env.GIT_COMMIT = '586e4d3';
      expect(resolveGitCommit()).toBe('586e4d3');
    });
  });

  describe('loadPackageVersion', () => {
    it('package.json이 없거나 실패 시 기본값을 반환해야 한다', () => {
      const result = loadPackageVersion('/non-existent-dir');
      expect(result).toEqual({
        name: 'my-space-frontend',
        version: '0.0.1',
      });
    });
  });

  describe('generateVersionInfo', () => {
    it('백엔드와 일관된 포맷의 VersionInfo 객체를 반환해야 한다', () => {
      process.env.APP_NAME = 'my-space-frontend';
      process.env.APP_VERSION = '0.0.1';
      process.env.GIT_BRANCH = 'main';
      process.env.GIT_COMMIT = '586e4d3';
      process.env.BUILD_TIME = '2026-10-04T08:02:37Z';
      process.env.APP_ENV = 'production';

      const versionInfo = generateVersionInfo();

      expect(versionInfo).toEqual({
        name: 'my-space-frontend',
        version: '0.0.1',
        gitBranch: 'main',
        gitCommit: '586e4d3',
        buildTime: '2026-10-04T08:02:37Z',
        env: 'production',
      });
    });
  });
});
