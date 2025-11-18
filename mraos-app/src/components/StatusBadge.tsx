import React from 'react';
import type { Operator, Machine, WorkOrder } from '../types';

interface StatusBadgeProps {
  status: Operator['currentStatus'] | Machine['currentStatus'] | WorkOrder['status'];
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const getStatusColor = () => {
    switch (status) {
      case 'available': return 'var(--status-available)';
      case 'busy': return 'var(--status-busy)';
      case 'idle': return 'var(--status-idle)';
      case 'maintenance': return 'var(--status-maintenance)';
      case 'breakdown': return 'var(--status-breakdown)';
      case 'queued': return 'var(--neutral-gray)';
      case 'in-progress': return 'var(--primary-blue)';
      case 'completed': return 'var(--success-green)';
      case 'blocked': return 'var(--danger-red)';
      default: return 'var(--neutral-gray)';
    }
  };

  const fontSize = size === 'sm' ? 'var(--font-size-xs)' : 'var(--font-size-sm)';
  const padding = size === 'sm' ? '2px 8px' : '4px 12px';

  return (
    <span
      style={{
        display: 'inline-block',
        padding,
        borderRadius: '12px',
        backgroundColor: getStatusColor(),
        color: 'white',
        fontSize,
        fontWeight: 600,
        textTransform: 'capitalize'
      }}
    >
      {status}
    </span>
  );
};
