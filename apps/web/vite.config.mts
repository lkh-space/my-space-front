/// <reference types='vitest' />
import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';
import { versionPlugin } from './vite-plugin-version';

export default defineConfig(({ mode }) => {
  const envDir = '../../';
  const env = loadEnv(mode, envDir, '');
  const backendUrl =
    env.VITE_BACKEND_URL ||
    process.env.VITE_BACKEND_URL ||
    'https://api.homelab.local';

  return {
    root: import.meta.dirname,
    envDir,
    cacheDir: '../../node_modules/.vite/apps/web',
    server: {
      port: 4200,
      host: '0.0.0.0',
      proxy: {
        '/api': {
          target: backendUrl,
          changeOrigin: true,
          secure: false, // 홈랩 사설 인증서(homelab-ca-issuer) 허용
        },
      },
    },
  preview: {
    port: 4300,
    host: 'localhost',
  },
  plugins: [react(), versionPlugin()],
  // Uncomment this if you are using workers.
  // worker: {
  //  plugins: [],
  // },
  build: {
    outDir: './dist',
    emptyOutDir: true,
    reportCompressedSize: true,
    commonjsOptions: {
      transformMixedEsModules: true,
    },
  },
    test: {
      name: '@my-space-front/web',
      watch: false,
      globals: true,
      environment: 'jsdom',
      include: ['{src,tests}/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
      reporters: ['default'],
      coverage: {
        reportsDirectory: './test-output/vitest/coverage',
        provider: 'v8' as const,
      },
    },
  };
});
