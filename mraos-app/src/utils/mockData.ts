import { format, addHours, subDays } from 'date-fns';
import type { Operator, Machine, WorkOrder, Material, Alert, AuditLogEntry } from '../types';

// Helper functions
const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomFloat = (min: number, max: number) => Math.random() * (max - min) + min;
const randomChoice = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

// Mock data seeds
const firstNames = ['John', 'Sarah', 'Michael', 'Emily', 'David', 'Lisa', 'James', 'Maria', 'Robert', 'Jennifer', 'William', 'Patricia', 'Richard', 'Linda', 'Thomas'];
const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Wilson', 'Anderson'];

const skills = [
  'Assembly',
  'Welding',
  'Quality Control',
  'Machine Operation',
  'Electrical Work',
  'Painting',
  'Packaging',
  'Forklift Operation',
  'CNC Programming',
  'Maintenance'
];

const productionLines = ['Line 1', 'Line 2', 'Line 3', 'Line 4', 'Line 5', 'Line 6'];
const zones = ['Zone A', 'Zone B', 'Zone C', 'Zone D'];

const products = [
  'Refrigerator Model A',
  'Refrigerator Model B',
  'Washing Machine Standard',
  'Washing Machine Deluxe',
  'Dishwasher Compact',
  'Dishwasher Full-Size',
  'Microwave Oven',
  'Range Hood'
];

const machineTypes = ['Assembly Station', 'Welding Robot', 'Paint Booth', 'Testing Station', 'Packaging Line', 'CNC Machine'];

// Generate operators
export function generateOperators(count: number = 25): Operator[] {
  const operators: Operator[] = [];
  const now = new Date();
  
  for (let i = 0; i < count; i++) {
    const firstName = randomChoice(firstNames);
    const lastName = randomChoice(lastNames);
    const operatorSkills = Array.from(
      { length: randomInt(2, 4) },
      () => ({
        id: `skill-${randomInt(1, 10)}`,
        name: randomChoice(skills),
        certificationDate: format(subDays(now, randomInt(30, 365)), 'yyyy-MM-dd')
      })
    );
    
    const statuses: Array<Operator['currentStatus']> = ['available', 'busy', 'busy', 'busy', 'idle', 'maintenance'];
    const status = randomChoice(statuses);
    
    operators.push({
      id: `O-${String(i + 100).padStart(3, '0')}`,
      name: `${firstName} ${lastName}`,
      currentStatus: status,
      skills: operatorSkills,
      efficiencyRating: randomFloat(3.5, 5),
      location: `${randomChoice(productionLines)}, ${randomChoice(zones)}`,
      shiftStart: '08:00',
      shiftEnd: '16:00',
      idleDurationMinutes: status === 'idle' ? randomInt(5, 30) : 0,
      statusUpdatedAt: format(now, "yyyy-MM-dd'T'HH:mm:ss'Z'"),
      currentWorkOrderId: status === 'busy' ? `WO-${randomInt(4000, 5000)}` : undefined
    });
  }
  
  return operators;
}

// Generate machines
export function generateMachines(count: number = 20): Machine[] {
  const machines: Machine[] = [];
  const now = new Date();
  
  for (let i = 0; i < count; i++) {
    const type = randomChoice(machineTypes);
    const statuses: Array<Machine['currentStatus']> = ['available', 'busy', 'busy', 'busy', 'idle', 'maintenance', 'breakdown'];
    const status = randomChoice(statuses);
    
    machines.push({
      id: `M-${String(i + 200).padStart(3, '0')}`,
      name: `${type} ${String(i + 1).padStart(2, '0')}`,
      type,
      currentStatus: status,
      productionLine: randomChoice(productionLines),
      utilizationPercentage: status === 'busy' ? randomInt(70, 95) : status === 'idle' ? randomInt(10, 30) : 0,
      oeePercentage: randomInt(75, 92),
      idleDurationMinutes: status === 'idle' ? randomInt(10, 45) : 0,
      statusUpdatedAt: format(now, "yyyy-MM-dd'T'HH:mm:ss'Z'"),
      lastMaintenanceDate: format(subDays(now, randomInt(1, 30)), 'yyyy-MM-dd'),
      currentWorkOrderId: status === 'busy' ? `WO-${randomInt(4000, 5000)}` : undefined
    });
  }
  
  return machines;
}

// Generate work orders
export function generateWorkOrders(count: number = 30): WorkOrder[] {
  const workOrders: WorkOrder[] = [];
  const now = new Date();
  
  for (let i = 0; i < count; i++) {
    const statuses: Array<WorkOrder['status']> = ['queued', 'queued', 'in-progress', 'in-progress', 'in-progress', 'completed', 'blocked'];
    const status = randomChoice(statuses);
    const priorities: Array<WorkOrder['priority']> = ['low', 'medium', 'medium', 'high', 'critical'];
    const priority = randomChoice(priorities);
    
    const targetQuantity = randomInt(10, 100);
    const completedQuantity = status === 'completed' ? targetQuantity : 
                             status === 'in-progress' ? randomInt(0, targetQuantity) : 0;
    const progressPercentage = Math.round((completedQuantity / targetQuantity) * 100);
    
    const requiredSkills = Array.from(
      { length: randomInt(1, 3) },
      () => randomChoice(skills)
    );
    
    workOrders.push({
      id: `WO-${String(i + 4500).padStart(4, '0')}`,
      productName: randomChoice(products),
      targetQuantity,
      completedQuantity,
      status,
      priority,
      dueDate: format(addHours(now, randomInt(4, 72)), 'yyyy-MM-dd HH:mm'),
      estimatedDurationMinutes: randomInt(60, 480),
      progressPercentage,
      requiredSkills,
      requiredMachineType: Math.random() > 0.3 ? randomChoice(machineTypes) : undefined,
      requiredMaterials: [
        { materialId: `MAT-${randomInt(1, 20)}`, quantity: randomInt(5, 50) }
      ],
      assignedOperatorIds: status === 'in-progress' ? [`O-${randomInt(100, 124)}`] : [],
      assignedMachineId: status === 'in-progress' ? `M-${randomInt(200, 219)}` : undefined,
      productionLine: randomChoice(productionLines)
    });
  }
  
  return workOrders;
}

// Generate materials
export function generateMaterials(count: number = 20): Material[] {
  const materials: Material[] = [];
  const materialNames = [
    'Steel Sheet', 'Aluminum Panel', 'Plastic Housing', 'Electronic Control Board',
    'Motor Assembly', 'Compressor Unit', 'Glass Panel', 'Rubber Seal',
    'Power Cable', 'Insulation Foam', 'Screws Set', 'Paint (White)',
    'Paint (Black)', 'LED Display', 'Temperature Sensor', 'Door Hinge',
    'Wire Harness', 'Pump Assembly', 'Fan Blade', 'Gasket Kit'
  ];
  
  materialNames.forEach((name, i) => {
    const available = randomInt(50, 500);
    const allocated = randomInt(0, Math.min(50, available));
    
    materials.push({
      id: `MAT-${String(i + 1).padStart(3, '0')}`,
      name,
      partNumber: `PN-${randomInt(10000, 99999)}`,
      quantityAvailable: available,
      quantityAllocated: allocated,
      unit: randomChoice(['pcs', 'kg', 'liters', 'sets']),
      location: `Warehouse ${randomChoice(['A', 'B', 'C'])}, Aisle ${randomInt(1, 10)}`
    });
  });
  
  return materials;
}

// Generate alerts
export function generateAlerts(operators: Operator[], machines: Machine[]): Alert[] {
  const alerts: Alert[] = [];
  const now = new Date();
  
  // Idle operator alerts
  operators
    .filter(op => op.currentStatus === 'idle' && op.idleDurationMinutes > 10)
    .forEach((op, index) => {
      alerts.push({
        id: `ALERT-${String(index + 1).padStart(4, '0')}`,
        timestamp: format(now, "yyyy-MM-dd'T'HH:mm:ss'Z'"),
        severity: op.idleDurationMinutes > 20 ? 'critical' : 'warning',
        resourceType: 'operator',
        resourceId: op.id,
        resourceName: op.name,
        message: `Operator ${op.name} has been idle for ${op.idleDurationMinutes} minutes`,
        idleDurationMinutes: op.idleDurationMinutes,
        suggestedActions: [
          {
            action: 'assign_to_work_order',
            workOrderId: `WO-${randomInt(4500, 4530)}`,
            workOrderName: randomChoice(products),
            confidenceScore: randomFloat(0.85, 0.95),
            expectedIdleTimeSavedMinutes: randomInt(30, 90),
            reason: 'High skill match and proximity to work order location'
          }
        ],
        acknowledged: false
      });
    });
  
  // Idle machine alerts
  machines
    .filter(m => m.currentStatus === 'idle' && m.idleDurationMinutes > 15)
    .forEach((m, index) => {
      alerts.push({
        id: `ALERT-${String(alerts.length + index + 1).padStart(4, '0')}`,
        timestamp: format(now, "yyyy-MM-dd'T'HH:mm:ss'Z'"),
        severity: m.idleDurationMinutes > 30 ? 'critical' : 'warning',
        resourceType: 'machine',
        resourceId: m.id,
        resourceName: m.name,
        message: `Machine ${m.name} has been idle for ${m.idleDurationMinutes} minutes`,
        idleDurationMinutes: m.idleDurationMinutes,
        suggestedActions: [
          {
            action: 'assign_to_work_order',
            workOrderId: `WO-${randomInt(4500, 4530)}`,
            workOrderName: randomChoice(products),
            confidenceScore: randomFloat(0.80, 0.92),
            expectedIdleTimeSavedMinutes: randomInt(45, 120),
            reason: 'Machine type matches work order requirements'
          }
        ],
        acknowledged: false
      });
    });
  
  // Machine breakdown alerts
  machines
    .filter(m => m.currentStatus === 'breakdown')
    .forEach((m, index) => {
      alerts.push({
        id: `ALERT-${String(alerts.length + index + 1).padStart(4, '0')}`,
        timestamp: format(now, "yyyy-MM-dd'T'HH:mm:ss'Z'"),
        severity: 'critical',
        resourceType: 'machine',
        resourceId: m.id,
        resourceName: m.name,
        message: `Machine ${m.name} is experiencing a breakdown`,
        acknowledged: false
      });
    });
  
  return alerts;
}

// Generate audit log
export function generateAuditLog(count: number = 50): AuditLogEntry[] {
  const entries: AuditLogEntry[] = [];
  const now = new Date();
  const supervisors = ['John Smith', 'Sarah Johnson', 'Mike Williams'];
  
  const actions = [
    { action: 'Assigned operator', entityType: 'Allocation', changes: { status: { old: 'unassigned', new: 'assigned' } } },
    { action: 'Updated work order status', entityType: 'WorkOrder', changes: { status: { old: 'queued', new: 'in-progress' } } },
    { action: 'Completed work order', entityType: 'WorkOrder', changes: { status: { old: 'in-progress', new: 'completed' } } },
    { action: 'Changed operator status', entityType: 'Operator', changes: { status: { old: 'available', new: 'busy' } } },
    { action: 'Applied AI suggestion', entityType: 'Allocation', changes: { method: { old: 'manual', new: 'ai-assisted' } } }
  ];
  
  for (let i = 0; i < count; i++) {
    const action = randomChoice(actions);
    const supervisor = randomChoice(supervisors);
    const timestamp = subDays(now, randomInt(0, 7));
    
    entries.push({
      id: `AUDIT-${String(i + 1).padStart(5, '0')}`,
      timestamp: format(timestamp, "yyyy-MM-dd'T'HH:mm:ss'Z'"),
      userId: `U-${randomInt(1, 10)}`,
      userName: supervisor,
      action: action.action,
      entityType: action.entityType,
      entityId: `${action.entityType.toUpperCase()}-${randomInt(1000, 9999)}`,
      changes: action.changes,
      reason: Math.random() > 0.5 ? 'Optimizing resource allocation' : undefined
    });
  }
  
  return entries.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}
