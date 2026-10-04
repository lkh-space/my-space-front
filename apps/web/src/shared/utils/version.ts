import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

export interface VersionInfo {
  name: string;
  version: string;
  gitBranch: string;
  gitCommit: string;
  buildTime: string;
  env: string;
}

/**
 * Git 브랜치명 확인 (환경변수 -> 로컬 Git CLI -> fallback)
 */
export function resolveGitBranch(): string {
  if (process.env.GIT_BRANCH) {
    return process.env.GIT_BRANCH;
  }

  try {
    const branch = execSync('git rev-parse --abbrev-ref HEAD', {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'ignore'],
    }).trim();
    if (branch) {
      return branch;
    }
  } catch {
    // Git 미설치 또는 .git 누락 환경
  }

  return 'unknown';
}

/**
 * Git 커밋 단축 해시 확인 (환경변수 -> 로컬 Git CLI -> fallback)
 */
export function resolveGitCommit(): string {
  if (process.env.GIT_COMMIT) {
    const commit = process.env.GIT_COMMIT.trim();
    return commit.length > 7 ? commit.slice(0, 7) : commit;
  }

  try {
    const commit = execSync('git rev-parse --short HEAD', {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'ignore'],
    }).trim();
    if (commit) {
      return commit;
    }
  } catch {
    // Git 미설치 또는 .git 누락 환경
  }

  return 'unknown';
}

/**
 * package.json의 name 및 version 로드
 */
export function loadPackageVersion(baseDir?: string): {
  name: string;
  version: string;
} {
  try {
    const searchDir = baseDir || process.cwd();
    const pkgPath = resolve(searchDir, 'package.json');
    const content = readFileSync(pkgPath, 'utf-8');
    const parsed = JSON.parse(content) as {
      name?: string;
      version?: string;
    };
    return {
      name: parsed.name || 'my-space-frontend',
      version: parsed.version || '0.0.1',
    };
  } catch {
    return {
      name: 'my-space-frontend',
      version: '0.0.1',
    };
  }
}

/**
 * 애플리케이션 버전 메타데이터 객체 생성
 */
export function generateVersionInfo(
  defaultEnv = 'development',
  baseDir?: string,
): VersionInfo {
  const pkg = loadPackageVersion(baseDir);
  const name = process.env.APP_NAME || 'my-space-frontend';
  const version = process.env.APP_VERSION || pkg.version || '0.0.1';
  const gitBranch = resolveGitBranch();
  const gitCommit = resolveGitCommit();
  const buildTime = process.env.BUILD_TIME || new Date().toISOString();
  const env = process.env.APP_ENV || process.env.NODE_ENV || defaultEnv;

  return {
    name,
    version,
    gitBranch,
    gitCommit,
    buildTime,
    env,
  };
}
