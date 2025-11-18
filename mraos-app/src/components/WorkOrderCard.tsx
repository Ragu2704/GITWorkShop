import React from 'react';
import type { WorkOrder } from '../types';
import { StatusBadge } from './StatusBadge';
import { Package, Clock, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';

interface WorkOrderCardProps {
  workOrder: WorkOrder;
  onClick?: () => void;
  compact?: boolean;
}

export const WorkOrderCard: React.FC<WorkOrderCardProps> = ({ workOrder, onClick, compact = false }) => {
  const getPriorityColor = () => {
    switch (workOrder.priority) {
      case 'critical': return 'var(--danger-red)';
      case 'high': return 'var(--warning-yellow)';
      case 'medium': return 'var(--primary-blue)';
      case 'low': return 'var(--neutral-gray)';
      default: return 'var(--neutral-gray)';
    }
  };
  
  return (
    <div
      onClick={onClick}
      style={{
        backgroundColor: 'var(--background-white)',
        borderRadius: '8px',
        padding: compact ? 'var(--space-sm)' : 'var(--space-md)',
        boxShadow: 'var(--shadow-sm)',
        border: `1px solid var(--border-color)`,
        borderLeft: `4px solid ${getPriorityColor()}`,
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.2s ease',
        minWidth: compact ? '240px' : '280px'
      }}
      onMouseEnter={(e) => {
        if (onClick) {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = 'var(--shadow-md)';
        }
      }}
      onMouseLeave={(e) => {
        if (onClick) {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
        }
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-sm)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
          <Package size={18} color="var(--primary-blue)" />
          <span style={{ fontWeight: 600, fontSize: 'var(--font-size-sm)' }}>{workOrder.id}</span>
        </div>
        <StatusBadge status={workOrder.status} size="sm" />
      </div>
      
      <h3 style={{ fontSize: compact ? 'var(--font-size-md)' : 'var(--font-size-lg)', fontWeight: 600, marginBottom: 'var(--space-sm)', color: 'var(--text-primary)' }}>
        {workOrder.productName}
      </h3>
      
      <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)', marginBottom: 'var(--space-md)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-xs)' }}>
          <span>Quantity:</span>
          <span style={{ fontWeight: 600 }}>{workOrder.completedQuantity} / {workOrder.targetQuantity}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Progress:</span>
          <span style={{ fontWeight: 600 }}>{workOrder.progressPercentage}%</span>
        </div>
      </div>
      
      {!compact && (
        <>
          <div style={{ marginBottom: 'var(--space-md)' }}>
            <div style={{ width: '100%', height: '8px', backgroundColor: 'var(--background-light)', borderRadius: '4px', overflow: 'hidden' }}>
              <div
                style={{
                  width: `${workOrder.progressPercentage}%`,
                  height: '100%',
                  backgroundColor: 'var(--primary-blue)',
                  transition: 'width 0.3s ease'
                }}
              />
            </div>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)', marginBottom: 'var(--space-sm)' }}>
            <Clock size={14} />
            <span>Due: {format(new Date(workOrder.dueDate), 'MMM dd, HH:mm')}</span>
          </div>
          
          {workOrder.priority === 'critical' || workOrder.priority === 'high' ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', padding: 'var(--space-sm)', backgroundColor: workOrder.priority === 'critical' ? '#FEE' : '#FFF3CD', borderRadius: '4px' }}>
              <AlertCircle size={16} color={workOrder.priority === 'critical' ? 'var(--danger-red)' : 'var(--warning-yellow)'} />
              <span style={{ fontSize: 'var(--font-size-sm)', color: workOrder.priority === 'critical' ? 'var(--danger-red)' : 'var(--text-primary)', fontWeight: 600, textTransform: 'uppercase' }}>
                {workOrder.priority} Priority
              </span>
            </div>
          ) : null}
          
          {workOrder.requiredSkills.length > 0 && (
            <div style={{ marginTop: 'var(--space-md)' }}>
              <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)', marginBottom: 'var(--space-xs)' }}>
                Required Skills
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-xs)' }}>
                {workOrder.requiredSkills.slice(0, 3).map((skill, idx) => (
                  <span
                    key={idx}
                    style={{
                      padding: '2px 8px',
                      backgroundColor: 'var(--background-light)',
                      borderRadius: '4px',
                      fontSize: 'var(--font-size-xs)',
                      color: 'var(--text-secondary)'
                    }}
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
