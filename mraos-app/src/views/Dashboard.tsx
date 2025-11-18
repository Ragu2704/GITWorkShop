import React from 'react';
import { useMRAOSStore } from '../store/store';
import { OperatorCard } from '../components/OperatorCard';
import { MachineCard } from '../components/MachineCard';
import { WorkOrderCard } from '../components/WorkOrderCard';
import { AlertTriangle, TrendingUp, Users, Cog, Package, Activity } from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { operators, machines, workOrders, alerts, metrics } = useMRAOSStore();
  
  const idleOperators = operators.filter(o => o.currentStatus === 'idle');
  const idleMachines = machines.filter(m => m.currentStatus === 'idle');
  const highPriorityWorkOrders = workOrders.filter(wo => wo.status === 'queued' && (wo.priority === 'high' || wo.priority === 'critical'));
  const activeAlerts = alerts.filter(a => !a.acknowledged).slice(0, 5);
  
  return (
    <div style={{ padding: 'var(--space-lg)', maxWidth: '1800px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 'var(--space-xl)' }}>
        <h1 style={{ fontSize: 'var(--font-size-xxl)', fontWeight: 600, marginBottom: 'var(--space-sm)', color: 'var(--text-primary)' }}>
          Manufacturing Resource Allocation Dashboard
        </h1>
        <p style={{ fontSize: 'var(--font-size-md)', color: 'var(--text-secondary)' }}>
          Real-time visibility into factory operations
        </p>
      </div>
      
      {/* Metrics Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-md)', marginBottom: 'var(--space-xl)' }}>
        <MetricCard
          icon={<Users size={24} color="var(--primary-blue)" />}
          label="Operators"
          value={`${metrics.busyOperators} / ${metrics.totalOperators}`}
          subtitle="Active"
          trend={`${metrics.idleOperators} idle`}
          trendColor={metrics.idleOperators > 3 ? 'var(--danger-red)' : 'var(--text-secondary)'}
        />
        <MetricCard
          icon={<Cog size={24} color="var(--primary-blue)" />}
          label="Machines"
          value={`${metrics.busyMachines} / ${metrics.totalMachines}`}
          subtitle="Running"
          trend={`${metrics.idleMachines} idle`}
          trendColor={metrics.idleMachines > 5 ? 'var(--danger-red)' : 'var(--text-secondary)'}
        />
        <MetricCard
          icon={<Package size={24} color="var(--primary-blue)" />}
          label="Work Orders"
          value={`${metrics.inProgressWorkOrders}`}
          subtitle="In Progress"
          trend={`${metrics.queuedWorkOrders} queued`}
          trendColor="var(--text-secondary)"
        />
        <MetricCard
          icon={<TrendingUp size={24} color="var(--success-green)" />}
          label="Utilization"
          value={`${metrics.utilizationPercentage}%`}
          subtitle="Current"
          trend={metrics.utilizationPercentage > 80 ? '↑ Excellent' : metrics.utilizationPercentage > 60 ? '→ Good' : '↓ Low'}
          trendColor={metrics.utilizationPercentage > 80 ? 'var(--success-green)' : metrics.utilizationPercentage > 60 ? 'var(--primary-blue)' : 'var(--danger-red)'}
        />
        <MetricCard
          icon={<Activity size={24} color="var(--warning-yellow)" />}
          label="Avg Idle Time"
          value={`${metrics.averageIdleTimeMinutes} min`}
          subtitle="Per Resource"
          trend={metrics.averageIdleTimeMinutes < 15 ? '↓ Improving' : '↑ Needs attention'}
          trendColor={metrics.averageIdleTimeMinutes < 15 ? 'var(--success-green)' : 'var(--danger-red)'}
        />
        <MetricCard
          icon={<AlertTriangle size={24} color="var(--danger-red)" />}
          label="Active Alerts"
          value={`${metrics.activeAlerts}`}
          subtitle="Unacknowledged"
          trend={metrics.activeAlerts > 10 ? 'Critical' : metrics.activeAlerts > 5 ? 'Warning' : 'Normal'}
          trendColor={metrics.activeAlerts > 10 ? 'var(--danger-red)' : metrics.activeAlerts > 5 ? 'var(--warning-yellow)' : 'var(--success-green)'}
        />
      </div>
      
      {/* Main Content Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '60% 40%', gap: 'var(--space-lg)', marginBottom: 'var(--space-xl)' }}>
        {/* Left Column - Resources */}
        <div>
          {/* Idle Resources Section */}
          {(idleOperators.length > 0 || idleMachines.length > 0) && (
            <section style={{ marginBottom: 'var(--space-xl)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: 'var(--space-md)' }}>
                <AlertTriangle size={20} color="var(--warning-yellow)" />
                <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 600, color: 'var(--text-primary)' }}>
                  Idle Resources ({idleOperators.length + idleMachines.length})
                </h2>
              </div>
              
              {idleOperators.length > 0 && (
                <>
                  <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 600, marginBottom: 'var(--space-md)', color: 'var(--text-secondary)' }}>
                    Operators
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 'var(--space-md)', marginBottom: 'var(--space-lg)' }}>
                    {idleOperators.map(operator => (
                      <OperatorCard key={operator.id} operator={operator} />
                    ))}
                  </div>
                </>
              )}
              
              {idleMachines.length > 0 && (
                <>
                  <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 600, marginBottom: 'var(--space-md)', color: 'var(--text-secondary)' }}>
                    Machines
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 'var(--space-md)' }}>
                    {idleMachines.map(machine => (
                      <MachineCard key={machine.id} machine={machine} />
                    ))}
                  </div>
                </>
              )}
            </section>
          )}
          
          {/* High Priority Work Orders */}
          {highPriorityWorkOrders.length > 0 && (
            <section>
              <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 600, marginBottom: 'var(--space-md)', color: 'var(--text-primary)' }}>
                High Priority Work Orders ({highPriorityWorkOrders.length})
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 'var(--space-md)' }}>
                {highPriorityWorkOrders.slice(0, 6).map(workOrder => (
                  <WorkOrderCard key={workOrder.id} workOrder={workOrder} />
                ))}
              </div>
            </section>
          )}
        </div>
        
        {/* Right Column - Alerts */}
        <div>
          <section style={{ backgroundColor: 'var(--background-white)', borderRadius: '8px', padding: 'var(--space-lg)', boxShadow: 'var(--shadow-md)', position: 'sticky', top: 'var(--space-lg)' }}>
            <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 600, marginBottom: 'var(--space-md)', color: 'var(--text-primary)' }}>
              Alert Center ({activeAlerts.length})
            </h2>
            
            {activeAlerts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 'var(--space-xl)', color: 'var(--text-secondary)' }}>
                <Activity size={48} style={{ marginBottom: 'var(--space-md)', opacity: 0.3 }} />
                <p>No active alerts</p>
                <p style={{ fontSize: 'var(--font-size-sm)' }}>All resources are operating normally</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                {activeAlerts.map(alert => (
                  <AlertCard key={alert.id} alert={alert} />
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};

// Helper Components
interface MetricCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  subtitle: string;
  trend: string;
  trendColor: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ icon, label, value, subtitle, trend, trendColor }) => (
  <div style={{ backgroundColor: 'var(--background-white)', borderRadius: '8px', padding: 'var(--space-md)', boxShadow: 'var(--shadow-sm)' }}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-sm)' }}>
      <div>{icon}</div>
      <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)' }}>{label}</span>
    </div>
    <div style={{ fontSize: 'var(--font-size-xxl)', fontWeight: 600, marginBottom: 'var(--space-xs)', color: 'var(--text-primary)' }}>
      {value}
    </div>
    <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)', marginBottom: 'var(--space-xs)' }}>
      {subtitle}
    </div>
    <div style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600, color: trendColor }}>
      {trend}
    </div>
  </div>
);

interface AlertCardProps {
  alert: any;
}

const AlertCard: React.FC<AlertCardProps> = ({ alert }) => {
  const { acknowledgeAlert } = useMRAOSStore();
  
  const getSeverityColor = () => {
    switch (alert.severity) {
      case 'critical': return 'var(--danger-red)';
      case 'warning': return 'var(--warning-yellow)';
      default: return 'var(--primary-blue)';
    }
  };
  
  return (
    <div
      style={{
        padding: 'var(--space-md)',
        borderRadius: '8px',
        border: `2px solid ${getSeverityColor()}`,
        backgroundColor: alert.severity === 'critical' ? '#FEE' : 'var(--background-light)',
        animation: 'slideIn 0.3s ease-out'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 'var(--space-sm)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
          <AlertTriangle size={16} color={getSeverityColor()} />
          <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600, color: getSeverityColor(), textTransform: 'uppercase' }}>
            {alert.severity}
          </span>
        </div>
        <button
          onClick={() => acknowledgeAlert(alert.id)}
          style={{
            padding: '4px 12px',
            backgroundColor: 'var(--primary-blue)',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            fontSize: 'var(--font-size-xs)',
            cursor: 'pointer',
            fontWeight: 600
          }}
        >
          Acknowledge
        </button>
      </div>
      
      <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-primary)', marginBottom: 'var(--space-sm)' }}>
        <strong>{alert.resourceName}</strong>: {alert.message}
      </div>
      
      {alert.suggestedActions && alert.suggestedActions.length > 0 && (
        <div style={{ marginTop: 'var(--space-sm)', padding: 'var(--space-sm)', backgroundColor: 'var(--background-white)', borderRadius: '4px' }}>
          <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)', marginBottom: 'var(--space-xs)' }}>
            AI Suggestion ({Math.round(alert.suggestedActions[0].confidenceScore * 100)}% confidence)
          </div>
          <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-primary)' }}>
            Assign to {alert.suggestedActions[0].workOrderName}
          </div>
          <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--success-green)', marginTop: 'var(--space-xs)' }}>
            Save ~{alert.suggestedActions[0].expectedIdleTimeSavedMinutes} min idle time
          </div>
        </div>
      )}
    </div>
  );
};
