import type { Meta, StoryObj } from '@storybook/react';
import React, { useState } from 'react';

const meta: Meta = {
  title: 'Design Tokens/Colors',
  parameters: {
    docs: {
      description: {
        component:
          'DESIGN.md에 정의된 Material 3 + Zinc 스펙트럼 기반의 시맨틱 색상 토큰 카탈로그입니다. 카드를 클릭하면 CSS 변수명(`var(...)`)이 클립보드에 복사됩니다.',
      },
    },
  },
};

export default meta;

interface ColorToken {
  name: string;
  variable: string;
  hex: string;
  role: string;
}

const TONAL_SURFACES: ColorToken[] = [
  {
    name: 'Lowest Container',
    variable: '--surface-container-lowest',
    hex: '#0d0e15',
    role: '코드 에디터 배경, 드롭존, 스크롤바 트랙, 바텀바',
  },
  {
    name: 'App Background / Surface',
    variable: '--background',
    hex: '#12131a',
    role: '전체 애플리케이션 루트 바탕 캔버스',
  },
  {
    name: 'Low Container',
    variable: '--surface-container-low',
    hex: '#1a1b22',
    role: '사이드바(240px), 카드 리스트 컨테이너, 모바일 탑바',
  },
  {
    name: 'Default Container',
    variable: '--surface-container',
    hex: '#1e1f26',
    role: '카드 본체, 탑 네비 헤더, 인풋 기본 배경',
  },
  {
    name: 'High Container',
    variable: '--surface-container-high',
    hex: '#292931',
    role: '활성 파일 프리뷰 카드, 호버 하이라이트',
  },
  {
    name: 'Highest Container',
    variable: '--surface-container-highest',
    hex: '#33343c',
    role: '활성 탭 배경, <kbd> 단축키 캡슐, 툴팁',
  },
  {
    name: 'Bright Surface',
    variable: '--surface-bright',
    hex: '#383941',
    role: '버튼 호버 및 상호작용 하이라이트',
  },
];

const ACCENT_SIGNALS: ColorToken[] = [
  {
    name: 'Primary (Stark Blue)',
    variable: '--primary',
    hex: '#adc6ff',
    role: '포커스 링, 활성 탭 아이콘/라벨, 시스템 강조 요소',
  },
  {
    name: 'Primary Container',
    variable: '--primary-container',
    hex: '#4d8eff',
    role: '주요 실행 CTA 버튼, 브랜드 로고 뱃지',
  },
  {
    name: 'Secondary (Emerald Active)',
    variable: '--secondary',
    hex: '#4edea3',
    role: '정상 가동(ACTIVE), Zero Telemetry, 유효 상태 점',
  },
  {
    name: 'Tertiary (Amber Warning)',
    variable: '--tertiary',
    hex: '#ffb95f',
    role: '주의/진행 뱃지, 마크다운/문서 상태 태그',
  },
  {
    name: 'Error (Coral Danger)',
    variable: '--error',
    hex: '#ffb4ab',
    role: '오프라인 상태, 삭제/초기화 위험 액션, PDF 포맷',
  },
];

const BORDER_AND_TEXT: ColorToken[] = [
  {
    name: 'Primary Outline',
    variable: '--outline-variant',
    hex: '#424754',
    role: '모든 카드/패널 1px 테두리, 구분선, 테이블 경계',
  },
  {
    name: 'Muted Outline',
    variable: '--outline',
    hex: '#8c909f',
    role: '비활성 보더, 인풋 포커스 전 상태, 메타 구분선',
  },
  {
    name: 'Primary Text (On-Surface)',
    variable: '--on-surface',
    hex: '#e3e1ec',
    role: 'H1~H3 제목, 주요 라벨, 활성 탭 텍스트',
  },
  {
    name: 'Secondary Text',
    variable: '--on-surface-variant',
    hex: '#c2c6d6',
    role: '본문 설명, 서브라벨, 비활성 탭 텍스트',
  },
  {
    name: 'Muted Text',
    variable: '--text-muted',
    hex: '#8c909f',
    role: '타임스탬프, 파일 크기, 불릿 기호, 비활성 라벨',
  },
];

function ColorPaletteGroup({ title, tokens }: { title: string; tokens: ColorToken[] }) {
  const [copied, setCopied] = useState<string | null>(null);

  const handleCopy = (variable: string) => {
    const text = `var(${variable})`;
    if (typeof navigator !== 'undefined' && 'clipboard' in navigator) {
      navigator.clipboard.writeText(text);
    }
    setCopied(text);
    setTimeout(() => setCopied(null), 1500);
  };

  return (
    <div style={{ marginBottom: '28px' }}>
      <h3
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '13px',
          fontWeight: 600,
          color: 'var(--text-muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          marginBottom: '12px',
        }}
      >
        {title}
      </h3>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: '12px',
        }}
      >
        {tokens.map((token) => (
          <div
            key={token.variable}
            onClick={() => handleCopy(token.variable)}
            title="클릭하여 CSS 변수명 복사"
            style={{
              backgroundColor: 'var(--surface-container)',
              border: '1px solid var(--outline-variant)',
              borderRadius: 'var(--radius-lg)',
              overflow: 'hidden',
              cursor: 'pointer',
              transition: 'transform 0.15s ease, border-color 0.15s ease',
            }}
          >
            <div
              style={{
                height: '60px',
                width: '100%',
                backgroundColor: `var(${token.variable})`,
                borderBottom: '1px solid var(--outline-variant)',
                position: 'relative',
                display: 'flex',
                alignItems: 'flex-end',
                justifyContent: 'flex-end',
                padding: '6px',
              }}
            >
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '10px',
                  backgroundColor: 'rgba(0,0,0,0.6)',
                  color: 'var(--on-surface)',
                  padding: '2px 6px',
                  borderRadius: 'var(--radius-sm)',
                }}
              >
                Copy
              </span>
            </div>
            <div style={{ padding: '10px' }}>
              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: 'var(--on-surface)',
                }}
              >
                {token.name}
              </div>
              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '11px',
                  color: 'var(--text-muted)',
                  marginTop: '2px',
                }}
              >
                {token.hex} · {token.variable}
              </div>
              <div
                style={{
                  fontSize: '11px',
                  color: 'var(--on-surface-variant)',
                  marginTop: '4px',
                  lineHeight: 1.3,
                }}
              >
                {token.role}
              </div>
            </div>
          </div>
        ))}
      </div>
      {copied && (
        <div
          style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            backgroundColor: 'var(--surface-container-highest)',
            border: '1px solid var(--outline-variant)',
            color: 'var(--on-surface)',
            padding: '8px 16px',
            borderRadius: 'var(--radius-lg)',
            fontSize: '12px',
            fontFamily: 'var(--font-mono)',
            zIndex: 9999,
          }}
        >
          ✔ 복사됨: <strong>{copied}</strong>
        </div>
      )}
    </div>
  );
}

export const TonalSurfaces: StoryObj = {
  render: () => (
    <ColorPaletteGroup
      title="Tonal Surfaces (깊이감 표면 7단계)"
      tokens={TONAL_SURFACES}
    />
  ),
};

export const AccentsAndSignals: StoryObj = {
  render: () => (
    <ColorPaletteGroup
      title="Accents & Status Signals (액센트 및 피드백)"
      tokens={ACCENT_SIGNALS}
    />
  ),
};

export const OutlinesAndText: StoryObj = {
  render: () => (
    <ColorPaletteGroup
      title="Outlines & Typography Colors (경계선 및 서체 색상)"
      tokens={BORDER_AND_TEXT}
    />
  ),
};

export const AllColorTokens: StoryObj = {
  render: () => (
    <div>
      <ColorPaletteGroup
        title="1. Tonal Surfaces (깊이감 표면 7단계)"
        tokens={TONAL_SURFACES}
      />
      <ColorPaletteGroup
        title="2. Accents & Status Signals (액센트 및 피드백)"
        tokens={ACCENT_SIGNALS}
      />
      <ColorPaletteGroup
        title="3. Outlines & Typography Colors (경계선 및 서체 색상)"
        tokens={BORDER_AND_TEXT}
      />
    </div>
  ),
};
