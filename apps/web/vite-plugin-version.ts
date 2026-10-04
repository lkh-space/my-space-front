import type { Plugin } from 'vite';
import { generateVersionInfo } from './src/shared/utils/version';

/**
 * 프론트엔드 버전 메타데이터를 서빙 및 생성하는 Vite 플러그인
 * - 개발 서버: /version 및 /version.json 요청을 가로채 실시간 JSON 응답
 * - 프로덕션 빌드: dist/version.json 정적 파일 자동 방출
 */
export function versionPlugin(): Plugin {
  return {
    name: 'vite-plugin-version',

    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = req.url?.split('?')[0];
        if (url === '/version' || url === '/version.json') {
          const versionInfo = generateVersionInfo(
            'development',
            import.meta.dirname,
          );
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
          res.end(JSON.stringify(versionInfo, null, 2));
          return;
        }
        next();
      });
    },

    generateBundle() {
      const versionInfo = generateVersionInfo(
        'production',
        import.meta.dirname,
      );
      this.emitFile({
        type: 'asset',
        fileName: 'version.json',
        source: JSON.stringify(versionInfo, null, 2),
      });
    },
  };
}

export default versionPlugin;
