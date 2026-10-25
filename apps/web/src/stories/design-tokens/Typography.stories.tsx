import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta = {
  title: 'Design Tokens/Typography',
  parameters: {
    docs: {
      description: {
        component:
          'DESIGN.md 3절에 명시된 Geist(영문 UI), Pretendard(한글 가독성), JetBrains Mono(모노스페이스) 서체 체계 및 10단계 Type Scale입니다.',
      },
    },
  },
};

export default meta;

const TYPE_SCALES = [
  { name: 'headline-lg', size: '24px', weight: '600', line: '32px', font: 'Geist / Pretendard', usage: '메인 페이지 타이틀 (H1)' },
  { name: 'headline-md', size: '18px', weight: '600', line: '26px', font: 'Geist / Pretendard', usage: '유틸리티 메인 뷰 타이틀 (H2)' },
  { name: 'headline-sm', size: '15px', weight: '500', line: '22px', font: 'Geist / Pretendard', usage: '브랜드 로고명, 섹션 카드 헤더 (H3)' },
  { name: 'body-lg', size: '14px', weight: '400', line: '20px', font: 'Geist / Pretendard', usage: '상세 모달, 리드 문단 본문' },
  { name: 'body-md', size: '13px', weight: '400', line: '18px', font: 'Geist / Pretendard', usage: '데스크톱 표준 본문 텍스트' },
  { name: 'body-sm', size: '12px', weight: '400', line: '16px', font: 'Geist / Pretendard', usage: '카드 설명, 폼 가이드, 보조 텍스트' },
  { name: 'code-md', size: '13px', weight: '400', line: '18px', font: 'JetBrains Mono', usage: '코드 에디터 스니펫, 파일 경로' },
  { name: 'code-sm', size: '11px', weight: '500', line: '16px', font: 'JetBrains Mono', usage: '단축키, 타임스탬프, 런타임 지표' },
  { name: 'label-md', size: '12px', weight: '500', line: '16px', font: 'JetBrains Mono / Geist', usage: '탭 네비게이션 라벨, 아바타' },
  { name: 'label-sm', size: '10px', weight: '500', line: '14px', font: 'JetBrains Mono / Geist', usage: '상태 뱃지 태그, 소형 캡슐 라벨' },
];

export const FontFamilies: StoryObj = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '800px' }}>
      <div
        style={{
          backgroundColor: 'var(--surface-container)',
          border: '1px solid var(--outline-variant)',
          borderRadius: 'var(--radius-lg)',
          padding: '16px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
          <strong style={{ color: 'var(--on-surface)' }}>Primary Sans: Geist + Pretendard</strong>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--primary)' }}>
            UI & Body Typography
          </span>
        </div>
        <p style={{ fontSize: '18px', fontWeight: 600, color: 'var(--on-surface)', marginBottom: '4px' }}>
          My-Space Developer Workspace
        </p>
        <p style={{ fontSize: '14px', color: 'var(--on-surface-variant)', lineHeight: 1.5 }}>
          다람쥐 헌 쳇바퀴에 타고파. 높은 정보 밀도와 무중력 워크플로우를 제공하는 개발자 중심의 개인 워크스페이스입니다.
        </p>
      </div>

      <div
        style={{
          backgroundColor: 'var(--surface-container)',
          border: '1px solid var(--outline-variant)',
          borderRadius: 'var(--radius-lg)',
          padding: '16px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
          <strong style={{ color: 'var(--on-surface)' }}>Monospace: JetBrains Mono</strong>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--secondary)' }}>
            Code & Telemetry
          </span>
        </div>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'var(--primary)', marginBottom: '4px' }}>
          const runtime = 'LOCAL_SANDBOX'; // ZERO_TELEMETRY
        </p>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-muted)' }}>
          127.0.0.1:4200 · SHA-256: 7f83b165... · 24ms
        </p>
      </div>
    </div>
  ),
};

export const TypeScaleTable: StoryObj = {
  render: () => (
    <div
      style={{
        backgroundColor: 'var(--surface-container)',
        border: '1px solid var(--outline-variant)',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
        maxWidth: '1000px',
      }}
    >
      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
        <thead>
          <tr style={{ backgroundColor: 'var(--surface-container-low)', borderBottom: '1px solid var(--outline-variant)' }}>
            <th style={{ padding: '10px 14px', fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-muted)' }}>
              스타일 명칭
            </th>
            <th style={{ padding: '10px 14px', fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-muted)' }}>
              크기 / 행간
            </th>
            <th style={{ padding: '10px 14px', fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-muted)' }}>
              굵기
            </th>
            <th style={{ padding: '10px 14px', fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-muted)' }}>
              주요 용도
            </th>
            <th style={{ padding: '10px 14px', fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-muted)' }}>
              렌더링 미리보기
            </th>
          </tr>
        </thead>
        <tbody>
          {TYPE_SCALES.map((item) => (
            <tr
              key={item.name}
              style={{ borderBottom: '1px solid var(--outline-variant)', color: 'var(--on-surface)' }}
            >
              <td style={{ padding: '10px 14px' }}>
                <code style={{ fontFamily: 'var(--font-mono)', color: 'var(--primary)', fontSize: '12px' }}>
                  {item.name}
                </code>
              </td>
              <td style={{ padding: '10px 14px', color: 'var(--text-muted)' }}>
                {item.size} / {item.line}
              </td>
              <td style={{ padding: '10px 14px' }}>{item.weight}</td>
              <td style={{ padding: '10px 14px', color: 'var(--on-surface-variant)' }}>{item.usage}</td>
              <td style={{ padding: '10px 14px' }}>
                <span
                  style={{
                    fontSize: item.size,
                    lineHeight: item.line,
                    fontWeight: Number(item.weight),
                    fontFamily: item.font.includes('JetBrains') ? 'var(--font-mono)' : 'var(--font-sans)',
                  }}
                >
                  텍스트 123 (Preview)
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  ),
};
