import React from 'react';
import type { Operator } from '../types';
import { StatusBadge } from './StatusBadge';
import { User, Clock, MapPin } from 'lucide-react';

interface OperatorCardProps {
  operator: Operator;
  onClick?: () => void;
  showDetails?: boolean;
}

export const OperatorCard: React.FC<OperatorCardProps> = ({ operator, onClick, showDetails = true }) => {
  const isIdle = operator.currentStatus === 'idle';
  
  return (
    <div
      onClick={onClick}
      style={{
        backgroundColor: 'var(--background-white)',
        borderRadius: '8px',
        padding: 'var(--space-md)',
        boxShadow: 'var(--shadow-sm)',
        border: isIdle ? '2px solid var(--status-idle)' : '1px solid var(--border-color)',
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
          <User size={20} color="var(--primary-blue)" />
          <span style={{ fontWeight: 600, fontSize: 'var(--font-size-md)' }}>{operator.id}</span>
        </div>
        <StatusBadge status={operator.currentStatus} size="sm" />
      </div>
      
      <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 600, marginBottom: 'var(--space-sm)', color: 'var(--text-primary)' }}>
        {operator.name}
      </h3>
      
      {showDetails && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: 'var(--space-xs)', color: 'var(--text-secondary)', fontSize: 'var(--font-size-sm)' }}>
            <MapPin size={14} />
            <span>{operator.location}</span>
          </div>
          
          {operator.currentStatus === 'idle' && operator.idleDurationMinutes > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: 'var(--space-sm)', color: 'var(--warning-yellow)', fontSize: 'var(--font-size-sm)' }}>
              <Clock size={14} />
              <span>Idle for {operator.idleDurationMinutes} min</span>
            </div>
          )}
          
          <div style={{ marginTop: 'var(--space-md)' }}>
            <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)', marginBottom: 'var(--space-xs)' }}>
              Skills
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-xs)' }}>
              {operator.skills.slice(0, 3).map((skill) => (
                <span
                  key={skill.id}
                  style={{
                    padding: '2px 8px',
                    backgroundColor: 'var(--background-light)',
                    borderRadius: '4px',
                    fontSize: 'var(--font-size-xs)',
                    color: 'var(--text-secondary)'
                  }}
                >
                  {skill.name}
                </span>
              ))}
            </div>
          </div>
          
          <div style={{ marginTop: 'var(--space-md)', display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-size-sm)' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Efficiency</span>
            <span style={{ fontWeight: 600, color: 'var(--primary-blue)' }}>
              {operator.efficiencyRating.toFixed(1)} / 5.0
            </span>
          </div>
        </>
      )}
    </div>
  );
};
