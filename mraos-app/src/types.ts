// Types for MRAOS system
export type ResourceStatus = 'available' | 'busy' | 'idle' | 'maintenance' | 'breakdown';
export type WorkOrderStatus = 'queued' | 'in-progress' | 'completed' | 'blocked';
export type WorkOrderPriority = 'low' | 'medium' | 'high' | 'critical';
export type AlertSeverity = 'info' | 'warning' | 'critical';

export interface Skill {
  id: string;
  name: string;
  certificationDate?: string;
}

export interface Operator {
  id: string;
  name: string;
  currentStatus: ResourceStatus;
  skills: Skill[];
  efficiencyRating: number; // 0-5
  currentWorkOrderId?: string;
  location: string;
  shiftStart: string;
  shiftEnd: string;
  idleDurationMinutes: number;
  statusUpdatedAt: string;
}

export interface Machine {
  id: string;
  name: string;
  type: string;
  currentStatus: ResourceStatus;
  productionLine: string;
  currentWorkOrderId?: string;
  utilizationPercentage: number;
  oeePercentage: number; // Overall Equipment Effectiveness
  idleDurationMinutes: number;
  statusUpdatedAt: string;
  lastMaintenanceDate: string;
}

export interface Material {
  id: string;
  name: string;
  partNumber: string;
  quantityAvailable: number;
  quantityAllocated: number;
  unit: string;
  location: string;
}

export interface WorkOrder {
  id: string;
  productName: string;
  targetQuantity: number;
  completedQuantity: number;
  status: WorkOrderStatus;
  priority: WorkOrderPriority;
  dueDate: string;
  estimatedDurationMinutes: number;
  progressPercentage: number;
  requiredSkills: string[];
  requiredMachineType?: string;
  requiredMaterials: { materialId: string; quantity: number }[];
  assignedOperatorIds: string[];
  assignedMachineId?: string;
  productionLine: string;
}

export interface Allocation {
  id: string;
  workOrderId: string;
  operatorId?: string;
  machineId?: string;
  allocatedAt: string;
  allocationMethod: 'manual' | 'ai-assisted' | 'automated';
  status: 'active' | 'completed' | 'cancelled';
}

export interface Alert {
  id: string;
  timestamp: string;
  severity: AlertSeverity;
  resourceType: 'operator' | 'machine';
  resourceId: string;
  resourceName: string;
  message: string;
  idleDurationMinutes?: number;
  suggestedActions?: SuggestedAction[];
  acknowledged: boolean;
}

export interface SuggestedAction {
  action: string;
  workOrderId: string;
  workOrderName: string;
  confidenceScore: number;
  expectedIdleTimeSavedMinutes: number;
  reason: string;
}

export interface IdlePrediction {
  resourceId: string;
  resourceType: 'operator' | 'machine';
  idleProbability: number;
  horizonMinutes: number;
  expectedIdleDurationMinutes: number;
  confidence: 'high' | 'medium' | 'low';
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  action: string;
  entityType: string;
  entityId: string;
  changes: Record<string, { old: any; new: any }>;
  reason?: string;
}

export interface FactoryMetrics {
  totalOperators: number;
  availableOperators: number;
  busyOperators: number;
  idleOperators: number;
  totalMachines: number;
  availableMachines: number;
  busyMachines: number;
  idleMachines: number;
  totalWorkOrders: number;
  queuedWorkOrders: number;
  inProgressWorkOrders: number;
  completedWorkOrders: number;
  averageIdleTimeMinutes: number;
  utilizationPercentage: number;
  activeAlerts: number;
}
