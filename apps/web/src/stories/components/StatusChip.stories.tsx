import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';

interface StatusChipProps {
  status?: 'active' | 'warning' | 'error' | 'idle';
  label?: string;
  pulse?: boolean;
}

const StatusChip: React.FC<StatusChipProps> = ({
  status = 'active',
  label,
  pulse = true,
}) => {
  const statusColors: Record<string, { text: string; bg: string; dot: string; border: string }> = {
    active: {
      text: 'var(--secondary)',
      bg: 'var(--surface-container-lowest)',
      dot: 'var(--secondary)',
      border: 'rgba(78, 222, 163, 0.3)',
    },
    warning: {
      text: 'var(--tertiary)',
      bg: 'var(--surface-container-lowest)',
      dot: 'var(--tertiary)',
      border: 'rgba(255, 185, 95, 0.3)',
    },
    error: {
      text: 'var(--error)',
      bg: 'var(--surface-container-lowest)',
      dot: 'var(--error)',
      border: 'rgba(255, 180, 171, 0.3)',
    },
    idle: {
      text: 'var(--text-muted)',
      bg: 'var(--surface-container-lowest)',
      dot: 'var(--text-muted)',
      border: 'var(--outline-variant)',
    },
  };

  const defaultLabels: Record<string, string> = {
    active: 'ACTIVE',
    warning: 'WARNING',
    error: 'ERROR',
    idle: 'IDLE',
  };

  const config = statusColors[status] || statusColors.idle;
  const displayLabel = label || defaultLabels[status];

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '3px 8px',
        borderRadius: 'var(--radius-sm)',
        fontFamily: 'var(--font-mono)',
        fontSize: '11px',
        fontWeight: 500,
        backgroundColor: config.bg,
        color: config.text,
        border: `1px solid ${config.border}`,
      }}
    >
      <span
        style={{
          width: '6px',
          height: '6px',
          borderRadius: 'var(--radius-full)',
          backgroundColor: config.dot,
          animation: status === 'active' && pulse ? 'pulse 2s infinite ease-in-out' : 'none',
        }}
      />
      {displayLabel}
    </span>
  );
};

const meta: Meta<typeof StatusChip> = {
  title: 'Components/StatusChip',
  component: StatusChip,
  tags: ['autodocs'],
  argTypes: {
    status: {
      control: 'select',
      options: ['active', 'warning', 'error', 'idle'],
      description: '시스템/프로세스 동작 상태',
    },
    label: {
      control: 'text',
      description: '커스텀 라벨 텍스트',
    },
    pulse: {
      control: 'boolean',
      description: 'Active 상태 펄스 애니메이션 활성화 여부',
    },
  },
};

export default meta;
type Story = StoryObj<typeof StatusChip>;

export const Active: Story = {
  args: {
    status: 'active',
    label: 'ACTIVE',
    pulse: true,
  },
};

export const Warning: Story = {
  args: {
    status: 'warning',
    label: 'STALLED',
  },
};

export const ErrorState: Story = {
  args: {
    status: 'error',
    label: 'DISCONNECTED',
  },
};

export const Idle: Story = {
  args: {
    status: 'idle',
    label: 'STANDBY',
  },
};

export const AllStatuses: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
      <StatusChip status="active" />
      <StatusChip status="warning" />
      <StatusChip status="error" />
      <StatusChip status="idle" />
    </div>
  ),
};
