import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta = {
  title: 'Design Tokens/Spacing & Radius',
  parameters: {
    docs: {
      description: {
        component:
          'DESIGN.md 5절에 명시된 4px 배수 그리드 스페이싱 및 5단계 Border Radius 스케일입니다.',
      },
    },
  },
};

export default meta;

export const SpacingScale: StoryObj = {
  render: () => (
    <div
      style={{
        backgroundColor: 'var(--surface-container)',
        border: '1px solid var(--outline-variant)',
        borderRadius: 'var(--radius-lg)',
        padding: '20px',
        maxWidth: '700px',
      }}
    >
      <h3
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '13px',
          fontWeight: 600,
          color: 'var(--text-muted)',
          textTransform: 'uppercase',
          marginBottom: '16px',
        }}
      >
        4px Grid Multiples (Spacing Scale)
      </h3>
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          gap: '16px',
          padding: '16px',
          backgroundColor: 'var(--surface-container-lowest)',
          border: '1px solid var(--outline-variant)',
          borderRadius: 'var(--radius-md)',
        }}
      >
        {[
          { name: '--space-xs', val: '4px' },
          { name: '--space-sm', val: '8px' },
          { name: '--space-md', val: '12px' },
          { name: '--space-lg', val: '16px' },
          { name: '--space-xl', val: '24px' },
          { name: '--space-2xl', val: '32px' },
        ].map((s) => (
          <div
            key={s.name}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}
          >
            <div
              style={{
                width: s.val,
                height: s.val,
                backgroundColor: 'var(--primary)',
                borderRadius: 'var(--radius-sm)',
              }}
              title={`${s.name}: ${s.val}`}
            />
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--on-surface)' }}>
              {s.val}
            </span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--text-muted)' }}>
              {s.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  ),
};

export const BorderRadiusScale: StoryObj = {
  render: () => (
    <div
      style={{
        backgroundColor: 'var(--surface-container)',
        border: '1px solid var(--outline-variant)',
        borderRadius: 'var(--radius-lg)',
        padding: '20px',
        maxWidth: '700px',
      }}
    >
      <h3
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '13px',
          fontWeight: 600,
          color: 'var(--text-muted)',
          textTransform: 'uppercase',
          marginBottom: '16px',
        }}
      >
        Border Radius Scale
      </h3>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          padding: '16px',
          backgroundColor: 'var(--surface-container-lowest)',
          border: '1px solid var(--outline-variant)',
          borderRadius: 'var(--radius-md)',
          flexWrap: 'wrap',
        }}
      >
        {[
          { name: '--radius-sm', val: '2px', label: '2px' },
          { name: '--radius-md', val: '4px', label: '4px' },
          { name: '--radius-lg', val: '8px', label: '8px' },
          { name: '--radius-xl', val: '12px', label: '12px' },
          { name: '--radius-full', val: '9999px', label: 'Full' },
        ].map((r) => (
          <div
            key={r.name}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}
          >
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: r.val,
                backgroundColor: 'var(--surface-container-highest)',
                border: '1px solid var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                color: 'var(--primary)',
              }}
              title={`${r.name}: ${r.val}`}
            >
              {r.label}
            </div>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--text-muted)' }}>
              {r.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  ),
};
