import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';

const meta: Meta = {
  title: 'Components/Form & Textures',
  parameters: {
    docs: {
      description: {
        component:
          '인풋 필드, 단축키 캡슐(<kbd>), 24px 도트 그리드 캔버스 및 6px 마이크로 스크롤바 컴포넌트입니다.',
      },
    },
  },
};

export default meta;

export const InputsAndShortcuts: StoryObj = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '400px' }}>
      {/* 1. Default Input */}
      <div>
        <label
          style={{
            display: 'block',
            fontSize: '12px',
            color: 'var(--text-muted)',
            marginBottom: '6px',
            fontFamily: 'var(--font-mono)',
          }}
        >
          기본 텍스트 인풋
        </label>
        <input
          type="text"
          placeholder="데이터 입력..."
          style={{
            width: '100%',
            padding: '8px 12px',
            backgroundColor: 'var(--surface-container-lowest)',
            border: '1px solid var(--outline-variant)',
            borderRadius: 'var(--radius-md)',
            fontSize: '13px',
            color: 'var(--on-surface)',
            outline: 'none',
          }}
        />
      </div>

      {/* 2. Error State Input */}
      <div>
        <label
          style={{
            display: 'block',
            fontSize: '12px',
            color: 'var(--error)',
            marginBottom: '6px',
            fontFamily: 'var(--font-mono)',
          }}
        >
          유효성 에러 인풋
        </label>
        <input
          type="text"
          defaultValue="invalid-port:99999"
          style={{
            width: '100%',
            padding: '8px 12px',
            backgroundColor: 'var(--surface-container-lowest)',
            border: '1px solid var(--error)',
            borderRadius: 'var(--radius-md)',
            fontSize: '13px',
            color: 'var(--error)',
            outline: 'none',
          }}
        />
      </div>

      {/* 3. Keyboard Shortcut Badges */}
      <div>
        <span
          style={{
            display: 'block',
            fontSize: '12px',
            color: 'var(--text-muted)',
            marginBottom: '8px',
            fontFamily: 'var(--font-mono)',
          }}
        >
          단축키 캡슐 (&lt;kbd&gt;)
        </span>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <kbd className="command-kbd">⌘K</kbd>
          <kbd className="command-kbd">ESC</kbd>
          <kbd className="command-kbd">↵</kbd>
          <kbd className="command-kbd">Ctrl+C</kbd>
        </div>
      </div>
    </div>
  ),
};

export const DotGridCanvas: StoryObj = {
  render: () => (
    <div
      className="bg-grid-dots"
      style={{
        height: '140px',
        maxWidth: '600px',
        border: '1px solid var(--outline-variant)',
        borderRadius: 'var(--radius-lg)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--text-muted)',
        fontSize: '12px',
        fontFamily: 'var(--font-mono)',
        backgroundColor: 'var(--surface-container-lowest)',
      }}
    >
      .bg-grid-dots (24px × 24px Canvas Grid Pattern)
    </div>
  ),
};

export const MicroScrollbarPreview: StoryObj = {
  render: () => (
    <div
      style={{
        width: '320px',
        height: '120px',
        overflowY: 'scroll',
        padding: '12px',
        backgroundColor: 'var(--surface-container-lowest)',
        border: '1px solid var(--outline-variant)',
        borderRadius: 'var(--radius-md)',
        fontSize: '12px',
        lineHeight: 1.6,
        color: 'var(--on-surface-variant)',
      }}
    >
      <div style={{ height: '300px' }}>
        <strong>6px Micro-Scrollbar 미리보기</strong>
        <p>스크롤바 너비 6px, 트랙 --surface-container-lowest, 썸 #27272a, 호버 시 --outline-variant.</p>
        <p>아래로 스크롤하여 커스텀 마이크로 스크롤바의 시각적 형태를 확인하세요.</p>
        <p style={{ marginTop: '40px' }}>... (스크롤 다운) ...</p>
        <p style={{ marginTop: '40px' }}>바닥에 도달했습니다.</p>
      </div>
    </div>
  ),
};
