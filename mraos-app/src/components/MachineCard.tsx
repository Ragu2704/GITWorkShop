import React from 'react';
import type { Machine } from '../types';
import { StatusBadge } from './StatusBadge';
import { Cog, Clock, TrendingUp } from 'lucide-react';

interface MachineCardProps {
  machine: Machine;
  onClick?: () => void;
  showDetails?: boolean;
}

export const MachineCard: React.FC<MachineCardProps> = ({ machine, onClick, showDetails = true }) => {
  const isIdle = machine.currentStatus === 'idle';
  const isCritical = machine.currentStatus === 'breakdown';
  
  return (
    <div
      onClick={onClick}
      style={{
        backgroundColor: 'var(--background-white)',
        borderRadius: '8px',
        padding: 'var(--space-md)',
        boxShadow: 'var(--shadow-sm)',
        border: isIdle ? '2px solid var(--status-idle)' : isCritical ? '2px solid var(--status-breakdown)' : '1px solid var(--border-color)',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.2s ease',
        minWidth: '280px',
        animation: isIdle ? 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' : 'none'
      }}
      onMouseEnter={(e) => {
        if (onClick) e.currentTarget.style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={(e) => {
        if (onClick) e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-sm)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
          <Cog size={20} color="var(--primary-blue)" />
          <span style={{ fontWeight: 600, fontSize: 'var(--font-size-md)' }}>{machine.id}</span>
        </div>
        <StatusBadge status={machine.currentStatus} size="sm" />
      </div>
      
      <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 600, marginBottom: 'var(--space-sm)', color: 'var(--text-primary)' }}>
        {machine.name}
      </h3>
      
      {showDetails && (
        <>
          <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)', marginBottom: 'var(--space-sm)' }}>
            {machine.productionLine} • {machine.type}
          </div>
          
          {machine.currentStatus === 'idle' && machine.idleDurationMinutes > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: 'var(--space-sm)', color: 'var(--warning-yellow)', fontSize: 'var(--font-size-sm)' }}>
              <Clock size={14} />
              <span>Idle for {machine.idleDurationMinutes} min</span>
            </div>
          )}
          
          <div style={{ marginTop: 'var(--space-md)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-sm)' }}>
              <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)' }}>Utilization</span>
              <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600 }}>{machine.utilizationPercentage}%</span>
            </div>
            <div style={{ width: '100%', height: '6px', backgroundColor: 'var(--background-light)', borderRadius: '3px', overflow: 'hidden' }}>
              <div
                style={{
                  width: `${machine.utilizationPercentage}%`,
                  height: '100%',
                  backgroundColor: machine.utilizationPercentage > 80 ? 'var(--success-green)' : machine.utilizationPercentage > 50 ? 'var(--primary-blue)' : 'var(--warning-yellow)',
                  transition: 'width 0.3s ease'
                }}
              />
            </div>
          </div>
          
          <div style={{ marginTop: 'var(--space-md)', display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-size-sm)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xs)', color: 'var(--text-secondary)' }}>
              <TrendingUp size={14} />
              <span>OEE</span>
            </div>
            <span style={{ fontWeight: 600, color: 'var(--primary-blue)' }}>
              {machine.oeePercentage}%
            </span>
          </div>
        </>
      )}
    </div>
  );
};
