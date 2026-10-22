import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';

interface ButtonProps {
  variant?: 'primary' | 'outline' | 'ghost';
  size?: 'compact' | 'default';
  disabled?: boolean;
  children: React.ReactNode;
  icon?: string;
  onClick?: () => void;
}

const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'default',
  disabled = false,
  children,
  icon,
  onClick,
}) => {
  const baseStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    borderRadius: 'var(--radius-md)',
    fontFamily: 'var(--font-sans)',
    fontWeight: 500,
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.4 : 1,
    transition: 'all 0.15s ease',
    padding: size === 'compact' ? '4px 10px' : '6px 14px',
    fontSize: size === 'compact' ? '12px' : '13px',
    height: size === 'compact' ? '28px' : '32px',
  };

  const variantStyles: Record<string, React.CSSProperties> = {
    primary: {
      backgroundColor: 'var(--on-surface)',
      color: 'var(--surface-container-lowest)',
      border: 'none',
    },
    outline: {
      backgroundColor: 'transparent',
      color: 'var(--on-surface)',
      border: '1px solid var(--outline-variant)',
    },
    ghost: {
      backgroundColor: 'transparent',
      color: 'var(--on-surface-variant)',
      border: 'none',
    },
  };

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      style={{ ...baseStyle, ...variantStyles[variant] }}
    >
      {icon && (
        <span
          className="material-symbols-outlined"
          style={{ fontSize: size === 'compact' ? '14px' : '16px' }}
        >
          {icon}
        </span>
      )}
      {children}
    </button>
  );
};

const meta: Meta<typeof Button> = {
  title: 'Components/Button',
  component: Button,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'outline', 'ghost'],
      description: '버튼의 시각적 테마 변형',
    },
    size: {
      control: 'radio',
      options: ['compact', 'default'],
      description: '버튼 크기 (compact: 28px, default: 32px)',
    },
    disabled: {
      control: 'boolean',
      description: '버튼 비활성화 여부',
    },
    icon: {
      control: 'text',
      description: 'Material Symbols 아이콘 이름 (예: play_arrow, add, download)',
    },
    children: {
      control: 'text',
      description: '버튼 라벨 텍스트',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Button>;

export const Primary: Story = {
  args: {
    variant: 'primary',
    size: 'default',
    children: '실행하기 (Primary CTA)',
    icon: 'play_arrow',
  },
};

export const Outline: Story = {
  args: {
    variant: 'outline',
    size: 'default',
    children: '보조 작업 (Secondary)',
  },
};

export const Ghost: Story = {
  args: {
    variant: 'ghost',
    size: 'default',
    children: '취소 (Ghost)',
  },
};

export const Disabled: Story = {
  args: {
    variant: 'outline',
    disabled: true,
    children: '비활성화 상태',
    icon: 'block',
  },
};

export const CompactSize: Story = {
  args: {
    variant: 'outline',
    size: 'compact',
    children: '28px Compact',
    icon: 'terminal',
  },
};

export const AllVariants: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
      <Button variant="primary" icon="play_arrow">
        Primary CTA
      </Button>
      <Button variant="outline">Secondary</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="outline" disabled>
        Disabled
      </Button>
      <Button variant="outline" size="compact" icon="refresh">
        Compact
      </Button>
    </div>
  ),
};
