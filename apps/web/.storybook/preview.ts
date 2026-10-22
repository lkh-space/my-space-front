import type { Preview } from '@storybook/react';
import '../src/styles.css';

// Storybook 렌더링 시 다크 모드 및 웹폰트 동적 주입
if (typeof document !== 'undefined') {
  document.documentElement.classList.add('dark');

  // Google Fonts preconnect
  if (!document.getElementById('sb-google-font-preconnect')) {
    const preconnectGoogle = document.createElement('link');
    preconnectGoogle.id = 'sb-google-font-preconnect';
    preconnectGoogle.rel = 'preconnect';
    preconnectGoogle.href = 'https://fonts.googleapis.com';
    document.head.appendChild(preconnectGoogle);

    const preconnectGstatic = document.createElement('link');
    preconnectGstatic.rel = 'preconnect';
    preconnectGstatic.href = 'https://fonts.gstatic.com';
    preconnectGstatic.crossOrigin = 'anonymous';
    document.head.appendChild(preconnectGstatic);

    // Geist & JetBrains Mono
    const fontGeist = document.createElement('link');
    fontGeist.rel = 'stylesheet';
    fontGeist.href =
      'https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap';
    document.head.appendChild(fontGeist);

    // Pretendard for Korean glyphs
    const fontPretendard = document.createElement('link');
    fontPretendard.rel = 'stylesheet';
    fontPretendard.href =
      'https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css';
    document.head.appendChild(fontPretendard);

    // Material Symbols Outlined
    const fontIcons = document.createElement('link');
    fontIcons.rel = 'stylesheet';
    fontIcons.href =
      'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap';
    document.head.appendChild(fontIcons);
  }
}

const preview: Preview = {
  parameters: {
    backgrounds: {
      default: 'dark',
      values: [
        { name: 'dark', value: '#12131a' },
        { name: 'surface-dim', value: '#09090b' },
        { name: 'container', value: '#1e1f26' },
      ],
    },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
};

export default preview;
