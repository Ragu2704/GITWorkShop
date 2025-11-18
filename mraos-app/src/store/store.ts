import { create } from 'zustand';
import type { Operator, Machine, WorkOrder, Material, Alert, AuditLogEntry, FactoryMetrics } from '../types';
import { generateOperators, generateMachines, generateWorkOrders, generateMaterials, generateAlerts, generateAuditLog } from '../utils/mockData';

interface MRAOSState {
  operators: Operator[];
  machines: Machine[];
  workOrders: WorkOrder[];
  materials: Material[];
  alerts: Alert[];
  auditLog: AuditLogEntry[];
  metrics: FactoryMetrics;
  currentView: 'dashboard' | 'assignment' | 'optimizer' | 'analytics';
  
  // Actions
  setView: (view: MRAOSState['currentView']) => void;
  assignOperatorToWorkOrder: (operatorId: string, workOrderId: string) => void;
  assignMachineToWorkOrder: (machineId: string, workOrderId: string) => void;
  acknowledgeAlert: (alertId: string) => void;
  updateOperatorStatus: (operatorId: string, status: Operator['currentStatus']) => void;
  updateWorkOrderStatus: (workOrderId: string, status: WorkOrder['status']) => void;
  simulateRealTimeUpdates: () => void;
  refreshData: () => void;
  calculateMetrics: () => void;
}

const initialOperators = generateOperators(25);
const initialMachines = generateMachines(20);
const initialWorkOrders = generateWorkOrders(30);
const initialMaterials = generateMaterials(20);

const calculateMetrics = (
  operators: Operator[],
  machines: Machine[],
  workOrders: WorkOrder[],
  alerts: Alert[]
): FactoryMetrics => {
  const availableOperators = operators.filter(o => o.currentStatus === 'available').length;
  const busyOperators = operators.filter(o => o.currentStatus === 'busy').length;
  const idleOperators = operators.filter(o => o.currentStatus === 'idle').length;
  
  const availableMachines = machines.filter(m => m.currentStatus === 'available').length;
  const busyMachines = machines.filter(m => m.currentStatus === 'busy').length;
  const idleMachines = machines.filter(m => m.currentStatus === 'idle').length;
  
  const queuedWorkOrders = workOrders.filter(wo => wo.status === 'queued').length;
  const inProgressWorkOrders = workOrders.filter(wo => wo.status === 'in-progress').length;
  const completedWorkOrders = workOrders.filter(wo => wo.status === 'completed').length;
  
  const totalIdleTime = [...operators, ...machines].reduce((sum, r) => sum + r.idleDurationMinutes, 0);
  const averageIdleTime = totalIdleTime / (operators.length + machines.length);
  
  const totalBusy = busyOperators + busyMachines;
  const totalResources = operators.length + machines.length;
  const utilization = (totalBusy / totalResources) * 100;
  
  return {
    totalOperators: operators.length,
    availableOperators,
    busyOperators,
    idleOperators,
    totalMachines: machines.length,
    availableMachines,
    busyMachines,
    idleMachines,
    totalWorkOrders: workOrders.length,
    queuedWorkOrders,
    inProgressWorkOrders,
    completedWorkOrders,
    averageIdleTimeMinutes: Math.round(averageIdleTime * 10) / 10,
    utilizationPercentage: Math.round(utilization * 10) / 10,
    activeAlerts: alerts.filter(a => !a.acknowledged).length
  };
};

export const useMRAOSStore = create<MRAOSState>((set, get) => ({
  operators: initialOperators,
  machines: initialMachines,
  workOrders: initialWorkOrders,
  materials: initialMaterials,
  alerts: generateAlerts(initialOperators, initialMachines),
  auditLog: generateAuditLog(50),
  metrics: calculateMetrics(initialOperators, initialMachines, initialWorkOrders, generateAlerts(initialOperators, initialMachines)),
  currentView: 'dashboard',
  
  setView: (view) => set({ currentView: view }),
  
  assignOperatorToWorkOrder: (operatorId, workOrderId) => {
    set((state) => {
      const operators = state.operators.map(op =>
        op.id === operatorId
          ? { ...op, currentStatus: 'busy' as const, currentWorkOrderId: workOrderId, idleDurationMinutes: 0 }
          : op
      );
      
      const workOrders = state.workOrders.map(wo =>
        wo.id === workOrderId
          ? { ...wo, status: 'in-progress' as const, assignedOperatorIds: [...wo.assignedOperatorIds, operatorId] }
          : wo
      );
      
      const auditLog = [
        {
          id: `AUDIT-${String(state.auditLog.length + 1).padStart(5, '0')}`,
          timestamp: new Date().toISOString(),
          userId: 'U-001',
          userName: 'Supervisor',
          action: 'Assigned operator to work order',
          entityType: 'Allocation',
          entityId: `${operatorId}-${workOrderId}`,
          changes: { operatorId: { old: null, new: operatorId } }
        },
        ...state.auditLog
      ];
      
      const alerts = generateAlerts(operators, state.machines);
      
      return {
        operators,
        workOrders,
        auditLog,
        alerts,
        metrics: calculateMetrics(operators, state.machines, workOrders, alerts)
      };
    });
  },
  
  assignMachineToWorkOrder: (machineId, workOrderId) => {
    set((state) => {
      const machines = state.machines.map(m =>
        m.id === machineId
          ? { ...m, currentStatus: 'busy' as const, currentWorkOrderId: workOrderId, idleDurationMinutes: 0 }
          : m
      );
      
      const workOrders = state.workOrders.map(wo =>
        wo.id === workOrderId
          ? { ...wo, status: 'in-progress' as const, assignedMachineId: machineId }
          : wo
      );
      
      const auditLog = [
        {
          id: `AUDIT-${String(state.auditLog.length + 1).padStart(5, '0')}`,
          timestamp: new Date().toISOString(),
          userId: 'U-001',
          userName: 'Supervisor',
          action: 'Assigned machine to work order',
          entityType: 'Allocation',
          entityId: `${machineId}-${workOrderId}`,
          changes: { machineId: { old: null, new: machineId } }
        },
        ...state.auditLog
      ];
      
      const alerts = generateAlerts(state.operators, machines);
      
      return {
        machines,
        workOrders,
        auditLog,
        alerts,
        metrics: calculateMetrics(state.operators, machines, workOrders, alerts)
      };
    });
  },
  
  acknowledgeAlert: (alertId) => {
    set((state) => ({
      alerts: state.alerts.map(alert =>
        alert.id === alertId ? { ...alert, acknowledged: true } : alert
      )
    }));
    get().calculateMetrics();
  },
  
  updateOperatorStatus: (operatorId, status) => {
    set((state) => {
      const operators = state.operators.map(op =>
        op.id === operatorId
          ? { ...op, currentStatus: status, idleDurationMinutes: status === 'idle' ? 0 : op.idleDurationMinutes }
          : op
      );
      
      const alerts = generateAlerts(operators, state.machines);
      
      return {
        operators,
        alerts,
        metrics: calculateMetrics(operators, state.machines, state.workOrders, alerts)
      };
    });
  },
  
  updateWorkOrderStatus: (workOrderId, status) => {
    set((state) => {
      const workOrders = state.workOrders.map(wo =>
        wo.id === workOrderId ? { ...wo, status } : wo
      );
      
      return {
        workOrders,
        metrics: calculateMetrics(state.operators, state.machines, workOrders, state.alerts)
      };
    });
  },
  
  simulateRealTimeUpdates: () => {
    set((state) => {
      // Randomly update some operator/machine status
      const operators = state.operators.map(op => {
        if (Math.random() < 0.1) { // 10% chance of status change
          if (op.currentStatus === 'busy' && Math.random() < 0.3) {
            return { ...op, currentStatus: 'available' as const, currentWorkOrderId: undefined };
          }
          if (op.currentStatus === 'available' && Math.random() < 0.2) {
            return { ...op, currentStatus: 'idle' as const, idleDurationMinutes: 5 };
          }
        }
        
        // Increment idle time
        if (op.currentStatus === 'idle') {
          return { ...op, idleDurationMinutes: op.idleDurationMinutes + 1 };
        }
        
        return op;
      });
      
      const machines = state.machines.map(m => {
        if (Math.random() < 0.1) {
          if (m.currentStatus === 'busy' && Math.random() < 0.3) {
            return { ...m, currentStatus: 'available' as const, currentWorkOrderId: undefined };
          }
          if (m.currentStatus === 'available' && Math.random() < 0.2) {
            return { ...m, currentStatus: 'idle' as const, idleDurationMinutes: 10 };
          }
        }
        
        if (m.currentStatus === 'idle') {
          return { ...m, idleDurationMinutes: m.idleDurationMinutes + 2 };
        }
        
        return m;
      });
      
      // Update work order progress
      const workOrders = state.workOrders.map(wo => {
        if (wo.status === 'in-progress' && Math.random() < 0.3) {
          const progressIncrease = Math.floor(Math.random() * 10);
          const newProgress = Math.min(100, wo.progressPercentage + progressIncrease);
          const newCompleted = Math.floor((newProgress / 100) * wo.targetQuantity);
          
          return {
            ...wo,
            progressPercentage: newProgress,
            completedQuantity: newCompleted,
            status: newProgress === 100 ? 'completed' as const : wo.status
          };
        }
        return wo;
      });
      
      const alerts = generateAlerts(operators, machines);
      
      return {
        operators,
        machines,
        workOrders,
        alerts,
        metrics: calculateMetrics(operators, machines, workOrders, alerts)
      };
    });
  },
  
  refreshData: () => {
    const operators = generateOperators(25);
    const machines = generateMachines(20);
    const workOrders = generateWorkOrders(30);
    const materials = generateMaterials(20);
    const alerts = generateAlerts(operators, machines);
    const auditLog = generateAuditLog(50);
    
    set({
      operators,
      machines,
      workOrders,
      materials,
      alerts,
      auditLog,
      metrics: calculateMetrics(operators, machines, workOrders, alerts)
    });
  },
  
  calculateMetrics: () => {
    const state = get();
    set({
      metrics: calculateMetrics(state.operators, state.machines, state.workOrders, state.alerts)
    });
  }
}));
