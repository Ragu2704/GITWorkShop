# Manufacturing Resource Allocation and Optimization System (MRAOS)
## Data Architecture Specification

**Version:** 1.0  
**Date:** November 18, 2025  
**Document Owner:** Senior Management - Home Appliance Manufacturing

---

## 1. Executive Summary

This document defines the comprehensive data architecture for MRAOS, including data models, real-time data requirements, database schemas, caching strategies, and data flow patterns. The architecture is designed to support <500ms real-time updates while maintaining data integrity and audit compliance.

### Key Design Principles
- **Real-Time First**: Stream-based data propagation with <500ms latency
- **Event Sourcing**: Immutable event log as source of truth for all state changes
- **Polyglot Persistence**: Right database for each use case (relational, time-series, cache)
- **ACID Compliance**: Strong consistency for critical transactions (allocations)
- **Data Sovereignty**: Complete audit trail for regulatory compliance

---

## 2. Data Model Overview

### 2.1 Core Entities

The MRAOS system manages four primary entity types with complex relationships:

```
┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│             │         │             │         │             │
│  Operator   │────────▶│  Allocation │◀────────│ Work Order  │
│             │         │             │         │             │
└─────────────┘         └─────────────┘         └─────────────┘
       │                       │                        │
       │                       ▼                        │
       │                ┌─────────────┐                │
       │                │             │                │
       └───────────────▶│   Machine   │◀───────────────┘
                        │             │
                        └─────────────┘
                               │
                               ▼
                        ┌─────────────┐
                        │             │
                        │  Material   │
                        │             │
                        └─────────────┘
```

### 2.2 Entity Relationship Diagram (ERD)

```
┌─────────────────────────────────────────────────────────────────────┐
│                         MRAOS Data Model                             │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Operator (1) ───────< Allocation (M) >─────── WorkOrder (1)       │
│      │                      │                       │               │
│      │                      │                       │               │
│      │                      └───< Machine (1)       │               │
│      │                                              │               │
│      │                                              └───< Material (M)│
│      │                                                              │
│      └────< Skill (M)                                               │
│      └────< Shift (M)                                               │
│      └────< Attendance (M)                                          │
│                                                                     │
│  Machine (1) ───< MachineStatus (M)                                 │
│      └────< MaintenanceSchedule (M)                                 │
│      └────< PerformanceMetric (M)                                   │
│                                                                     │
│  Material (1) ───< InventoryTransaction (M)                         │
│      └────< Reservation (M)                                         │
│                                                                     │
│  WorkOrder (1) ───< BillOfMaterials (M)                            │
│      └────< WorkOrderDependency (M)                                 │
│      └────< ProductionLog (M)                                       │
│                                                                     │
│  Allocation (1) ───< AllocationChangeEvent (M)                      │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 3. Detailed Data Models

### 3.1 Operator Entity

#### Relational Schema (PostgreSQL)

```sql
CREATE TABLE operators (
    operator_id VARCHAR(20) PRIMARY KEY,
    employee_id VARCHAR(20) UNIQUE NOT NULL,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(100),
    phone VARCHAR(20),
    photo_url VARCHAR(255),
    hire_date DATE,
    department VARCHAR(50),
    home_location VARCHAR(100), -- Factory zone/area
    
    -- Status fields
    current_status VARCHAR(20) NOT NULL DEFAULT 'available',
        -- Values: available, busy, break, absent, sick, vacation
    status_updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    
    -- Performance tracking
    efficiency_rating DECIMAL(3,2), -- 0.00 to 5.00
    on_time_completion_rate DECIMAL(5,2), -- Percentage
    
    -- Metadata
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_by VARCHAR(50),
    updated_by VARCHAR(50),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    
    CONSTRAINT chk_status CHECK (current_status IN ('available', 'busy', 'break', 'absent', 'sick', 'vacation', 'offline')),
    CONSTRAINT chk_efficiency CHECK (efficiency_rating >= 0 AND efficiency_rating <= 5)
);

CREATE INDEX idx_operators_status ON operators(current_status, is_active);
CREATE INDEX idx_operators_dept ON operators(department);
CREATE INDEX idx_operators_location ON operators(home_location);

-- Operator Skills (Many-to-Many)
CREATE TABLE operator_skills (
    operator_skill_id SERIAL PRIMARY KEY,
    operator_id VARCHAR(20) NOT NULL REFERENCES operators(operator_id) ON DELETE CASCADE,
    skill_code VARCHAR(50) NOT NULL,
    skill_name VARCHAR(100) NOT NULL,
    proficiency_level INT NOT NULL, -- 1=Basic, 2=Intermediate, 3=Advanced, 4=Expert
    certification_date DATE,
    certification_expiry DATE,
    certified_by VARCHAR(100),
    
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    
    CONSTRAINT chk_proficiency CHECK (proficiency_level BETWEEN 1 AND 4),
    UNIQUE(operator_id, skill_code)
);

CREATE INDEX idx_operator_skills_code ON operator_skills(skill_code);
CREATE INDEX idx_operator_skills_expiry ON operator_skills(certification_expiry);

-- Operator Shifts
CREATE TABLE operator_shifts (
    shift_id SERIAL PRIMARY KEY,
    operator_id VARCHAR(20) NOT NULL REFERENCES operators(operator_id) ON DELETE CASCADE,
    shift_name VARCHAR(20) NOT NULL, -- e.g., "Shift A", "Shift B"
    shift_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    break_start TIME,
    break_end TIME,
    
    actual_clock_in TIMESTAMP,
    actual_clock_out TIMESTAMP,
    
    status VARCHAR(20) DEFAULT 'scheduled',
        -- Values: scheduled, in_progress, completed, absent, late
    
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    
    CONSTRAINT chk_shift_status CHECK (status IN ('scheduled', 'in_progress', 'completed', 'absent', 'late'))
);

CREATE INDEX idx_operator_shifts_date ON operator_shifts(shift_date, operator_id);
CREATE INDEX idx_operator_shifts_status ON operator_shifts(status);
```

#### JSON Document (Cached in Redis)

```json
{
  "operator_id": "O-156",
  "employee_id": "EMP-2024-0156",
  "name": "John Doe",
  "photo_url": "https://cdn.mraos.com/operators/O-156.jpg",
  
  "current_status": "available",
  "status_updated_at": "2025-11-18T14:23:45.678Z",
  "location": "Line 2, Zone A",
  
  "current_assignment": null,
  
  "skills": [
    {
      "skill_code": "WELD-L3",
      "skill_name": "Welding Level 3",
      "proficiency_level": 3,
      "certification_expiry": "2026-06-30"
    },
    {
      "skill_code": "ASMBLY-L2",
      "skill_name": "Assembly Level 2",
      "proficiency_level": 2,
      "certification_expiry": "2026-12-31"
    }
  ],
  
  "current_shift": {
    "shift_name": "Shift A",
    "start_time": "06:00:00",
    "end_time": "14:00:00",
    "clock_in": "2025-11-18T06:02:15Z",
    "break_start": "09:30:00",
    "break_end": "10:00:00"
  },
  
  "performance": {
    "efficiency_rating": 4.2,
    "on_time_completion_rate": 92.5,
    "assignments_today": 3,
    "idle_time_today_minutes": 18
  },
  
  "metadata": {
    "last_sync": "2025-11-18T14:25:00.000Z",
    "cache_ttl": 300
  }
}
```

---

### 3.2 Machine Entity

#### Relational Schema

```sql
CREATE TABLE machines (
    machine_id VARCHAR(20) PRIMARY KEY,
    machine_name VARCHAR(100) NOT NULL,
    machine_type VARCHAR(50) NOT NULL, -- e.g., "Welding Robot", "CNC Mill", "Assembly Line"
    manufacturer VARCHAR(100),
    model_number VARCHAR(50),
    serial_number VARCHAR(50) UNIQUE,
    
    -- Location
    production_line VARCHAR(50) NOT NULL,
    zone VARCHAR(50),
    physical_location VARCHAR(100),
    
    -- Capabilities
    product_types TEXT[], -- Array of product types this machine can produce
    max_capacity_per_hour INT,
    
    -- Status
    current_status VARCHAR(20) NOT NULL DEFAULT 'idle',
        -- Values: running, idle, maintenance, breakdown, offline
    status_updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    
    -- Performance
    overall_equipment_effectiveness DECIMAL(5,2), -- OEE percentage
    uptime_percentage DECIMAL(5,2),
    
    -- Maintenance
    last_maintenance_date DATE,
    next_maintenance_date DATE,
    maintenance_hours_remaining INT,
    
    -- Metadata
    installation_date DATE,
    warranty_expiry DATE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    
    CONSTRAINT chk_machine_status CHECK (current_status IN ('running', 'idle', 'maintenance', 'breakdown', 'offline')),
    CONSTRAINT chk_oee CHECK (overall_equipment_effectiveness >= 0 AND overall_equipment_effectiveness <= 100)
);

CREATE INDEX idx_machines_status ON machines(current_status, is_active);
CREATE INDEX idx_machines_line ON machines(production_line);
CREATE INDEX idx_machines_type ON machines(machine_type);
CREATE INDEX idx_machines_maintenance ON machines(next_maintenance_date);

-- Machine Status History (Time-Series)
CREATE TABLE machine_status_history (
    status_id BIGSERIAL PRIMARY KEY,
    machine_id VARCHAR(20) NOT NULL REFERENCES machines(machine_id),
    status VARCHAR(20) NOT NULL,
    previous_status VARCHAR(20),
    
    started_at TIMESTAMP NOT NULL DEFAULT NOW(),
    ended_at TIMESTAMP,
    duration_minutes INT,
    
    reason_code VARCHAR(50),
    reason_description TEXT,
    reported_by VARCHAR(50),
    
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_machine_status_history_machine ON machine_status_history(machine_id, started_at DESC);
CREATE INDEX idx_machine_status_history_status ON machine_status_history(status, started_at DESC);

-- Machine Performance Metrics (Time-Series - InfluxDB preferred)
CREATE TABLE machine_performance_metrics (
    metric_id BIGSERIAL PRIMARY KEY,
    machine_id VARCHAR(20) NOT NULL,
    timestamp TIMESTAMP NOT NULL,
    
    -- Production metrics
    units_produced INT,
    cycle_time_seconds DECIMAL(10,2),
    downtime_seconds INT,
    
    -- Quality metrics
    quality_pass_count INT,
    quality_fail_count INT,
    
    -- Utilization
    utilization_percentage DECIMAL(5,2),
    
    -- Technical metrics (sensor data)
    temperature_celsius DECIMAL(5,2),
    vibration_level DECIMAL(8,4),
    power_consumption_kwh DECIMAL(10,4),
    
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Note: In production, this would be in InfluxDB with appropriate retention policies
CREATE INDEX idx_machine_perf_metrics_machine_time ON machine_performance_metrics(machine_id, timestamp DESC);
```

---

### 3.3 Material Entity

#### Relational Schema

```sql
CREATE TABLE materials (
    material_id VARCHAR(20) PRIMARY KEY,
    part_number VARCHAR(50) UNIQUE NOT NULL,
    part_name VARCHAR(200) NOT NULL,
    description TEXT,
    category VARCHAR(50),
    
    -- Inventory
    unit_of_measure VARCHAR(20) NOT NULL, -- EA (Each), KG, LB, FT, etc.
    standard_cost DECIMAL(12,4),
    currency VARCHAR(3) DEFAULT 'USD',
    
    -- Stock levels
    on_hand_quantity DECIMAL(15,3) NOT NULL DEFAULT 0,
    allocated_quantity DECIMAL(15,3) NOT NULL DEFAULT 0,
    available_quantity DECIMAL(15,3) GENERATED ALWAYS AS (on_hand_quantity - allocated_quantity) STORED,
    
    safety_stock_level DECIMAL(15,3),
    reorder_point DECIMAL(15,3),
    economic_order_quantity DECIMAL(15,3),
    
    -- Quality
    shelf_life_days INT,
    requires_fifo BOOLEAN DEFAULT FALSE,
    requires_fefo BOOLEAN DEFAULT TRUE, -- First Expired, First Out
    
    -- Location
    primary_warehouse VARCHAR(50),
    primary_location VARCHAR(100),
    
    -- Status
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    is_hazardous BOOLEAN DEFAULT FALSE,
    
    -- Metadata
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    
    CONSTRAINT chk_quantities CHECK (on_hand_quantity >= 0 AND allocated_quantity >= 0)
);

CREATE INDEX idx_materials_part_number ON materials(part_number);
CREATE INDEX idx_materials_category ON materials(category);
CREATE INDEX idx_materials_available ON materials(available_quantity);

-- Inventory Transactions
CREATE TABLE inventory_transactions (
    transaction_id BIGSERIAL PRIMARY KEY,
    material_id VARCHAR(20) NOT NULL REFERENCES materials(material_id),
    
    transaction_type VARCHAR(20) NOT NULL,
        -- Values: receipt, issue, adjustment, transfer, reservation, release
    transaction_date TIMESTAMP NOT NULL DEFAULT NOW(),
    
    quantity DECIMAL(15,3) NOT NULL,
    unit_cost DECIMAL(12,4),
    
    -- References
    reference_type VARCHAR(50), -- e.g., "WorkOrder", "PurchaseOrder", "Adjustment"
    reference_id VARCHAR(50),
    
    -- Location
    from_location VARCHAR(100),
    to_location VARCHAR(100),
    
    -- Batch/Lot tracking
    batch_number VARCHAR(50),
    lot_number VARCHAR(50),
    expiration_date DATE,
    
    -- Audit
    performed_by VARCHAR(50) NOT NULL,
    notes TEXT,
    
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_inventory_txn_material ON inventory_transactions(material_id, transaction_date DESC);
CREATE INDEX idx_inventory_txn_type ON inventory_transactions(transaction_type, transaction_date DESC);
CREATE INDEX idx_inventory_txn_reference ON inventory_transactions(reference_type, reference_id);

-- Material Reservations
CREATE TABLE material_reservations (
    reservation_id BIGSERIAL PRIMARY KEY,
    material_id VARCHAR(20) NOT NULL REFERENCES materials(material_id),
    work_order_id VARCHAR(20) NOT NULL,
    
    quantity_reserved DECIMAL(15,3) NOT NULL,
    reservation_date TIMESTAMP NOT NULL DEFAULT NOW(),
    expected_consumption_date TIMESTAMP,
    
    status VARCHAR(20) NOT NULL DEFAULT 'active',
        -- Values: active, consumed, released, expired
    
    batch_number VARCHAR(50),
    lot_number VARCHAR(50),
    
    reserved_by VARCHAR(50) NOT NULL,
    released_at TIMESTAMP,
    released_by VARCHAR(50),
    
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    
    CONSTRAINT chk_reservation_status CHECK (status IN ('active', 'consumed', 'released', 'expired'))
);

CREATE INDEX idx_material_reservations_material ON material_reservations(material_id, status);
CREATE INDEX idx_material_reservations_wo ON material_reservations(work_order_id);
```

---

### 3.4 Work Order Entity

#### Relational Schema

```sql
CREATE TABLE work_orders (
    work_order_id VARCHAR(20) PRIMARY KEY,
    work_order_number VARCHAR(50) UNIQUE NOT NULL,
    
    -- Product information
    product_id VARCHAR(20) NOT NULL,
    product_name VARCHAR(200) NOT NULL,
    product_variant VARCHAR(100),
    
    -- Quantities
    quantity_ordered DECIMAL(15,3) NOT NULL,
    quantity_produced DECIMAL(15,3) NOT NULL DEFAULT 0,
    quantity_remaining DECIMAL(15,3) GENERATED ALWAYS AS (quantity_ordered - quantity_produced) STORED,
    unit_of_measure VARCHAR(20) NOT NULL,
    
    -- Scheduling
    priority VARCHAR(10) NOT NULL DEFAULT 'medium',
        -- Values: low, medium, high, urgent
    status VARCHAR(20) NOT NULL DEFAULT 'queued',
        -- Values: queued, assigned, in_progress, paused, completed, cancelled
    
    planned_start_date TIMESTAMP,
    planned_end_date TIMESTAMP,
    due_date TIMESTAMP NOT NULL,
    
    actual_start_date TIMESTAMP,
    actual_end_date TIMESTAMP,
    
    estimated_duration_minutes INT,
    actual_duration_minutes INT,
    
    -- Assignment
    production_line VARCHAR(50),
    assigned_shift VARCHAR(20),
    
    -- References
    customer_order_id VARCHAR(50),
    erp_work_order_id VARCHAR(50),
    
    -- Progress
    progress_percentage DECIMAL(5,2) DEFAULT 0,
    current_operation VARCHAR(100),
    
    -- Quality
    quality_inspection_required BOOLEAN DEFAULT TRUE,
    quality_status VARCHAR(20),
        -- Values: pending, passed, failed, waived
    
    -- Metadata
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_by VARCHAR(50),
    
    CONSTRAINT chk_wo_priority CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    CONSTRAINT chk_wo_status CHECK (status IN ('queued', 'assigned', 'in_progress', 'paused', 'completed', 'cancelled')),
    CONSTRAINT chk_wo_quality CHECK (quality_status IS NULL OR quality_status IN ('pending', 'passed', 'failed', 'waived'))
);

CREATE INDEX idx_work_orders_status ON work_orders(status, priority);
CREATE INDEX idx_work_orders_due_date ON work_orders(due_date);
CREATE INDEX idx_work_orders_line ON work_orders(production_line, status);
CREATE INDEX idx_work_orders_erp ON work_orders(erp_work_order_id);

-- Bill of Materials (BOM)
CREATE TABLE work_order_bom (
    bom_id BIGSERIAL PRIMARY KEY,
    work_order_id VARCHAR(20) NOT NULL REFERENCES work_orders(work_order_id) ON DELETE CASCADE,
    material_id VARCHAR(20) NOT NULL REFERENCES materials(material_id),
    
    quantity_required DECIMAL(15,3) NOT NULL,
    quantity_allocated DECIMAL(15,3) DEFAULT 0,
    quantity_consumed DECIMAL(15,3) DEFAULT 0,
    
    unit_of_measure VARCHAR(20) NOT NULL,
    
    is_critical BOOLEAN DEFAULT FALSE, -- Blocks production if unavailable
    
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    
    UNIQUE(work_order_id, material_id)
);

CREATE INDEX idx_work_order_bom_wo ON work_order_bom(work_order_id);
CREATE INDEX idx_work_order_bom_material ON work_order_bom(material_id);

-- Work Order Dependencies
CREATE TABLE work_order_dependencies (
    dependency_id BIGSERIAL PRIMARY KEY,
    work_order_id VARCHAR(20) NOT NULL REFERENCES work_orders(work_order_id) ON DELETE CASCADE,
    predecessor_work_order_id VARCHAR(20) NOT NULL REFERENCES work_orders(work_order_id),
    
    dependency_type VARCHAR(20) NOT NULL DEFAULT 'finish_to_start',
        -- Values: finish_to_start, start_to_start, finish_to_finish
    
    lag_minutes INT DEFAULT 0, -- Delay between predecessor and successor
    
    is_mandatory BOOLEAN DEFAULT TRUE,
    
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    
    CONSTRAINT chk_dep_type CHECK (dependency_type IN ('finish_to_start', 'start_to_start', 'finish_to_finish')),
    CONSTRAINT chk_no_self_dependency CHECK (work_order_id != predecessor_work_order_id)
);

CREATE INDEX idx_work_order_dependencies_wo ON work_order_dependencies(work_order_id);
CREATE INDEX idx_work_order_dependencies_pred ON work_order_dependencies(predecessor_work_order_id);

-- Production Logs (Time-Series)
CREATE TABLE production_logs (
    log_id BIGSERIAL PRIMARY KEY,
    work_order_id VARCHAR(20) NOT NULL REFERENCES work_orders(work_order_id),
    timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
    
    event_type VARCHAR(50) NOT NULL,
        -- Values: started, paused, resumed, completed, milestone, issue, note
    
    quantity_produced INT,
    cumulative_quantity INT,
    
    operator_id VARCHAR(20),
    machine_id VARCHAR(20),
    
    notes TEXT,
    logged_by VARCHAR(50),
    
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_production_logs_wo ON production_logs(work_order_id, timestamp DESC);
CREATE INDEX idx_production_logs_event ON production_logs(event_type, timestamp DESC);
```

---

### 3.5 Allocation Entity (Core Transaction)

#### Relational Schema

```sql
CREATE TABLE allocations (
    allocation_id BIGSERIAL PRIMARY KEY,
    
    -- Core references
    work_order_id VARCHAR(20) NOT NULL REFERENCES work_orders(work_order_id),
    
    -- Resource assignments (optional individually, but at least one required)
    operator_id VARCHAR(20) REFERENCES operators(operator_id),
    machine_id VARCHAR(20) REFERENCES machines(machine_id),
    
    -- Allocation details
    allocation_type VARCHAR(20) NOT NULL,
        -- Values: operator, machine, operator_machine (combined)
    
    status VARCHAR(20) NOT NULL DEFAULT 'active',
        -- Values: active, completed, released, cancelled
    
    -- Timing
    allocated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    expected_start_time TIMESTAMP,
    expected_end_time TIMESTAMP,
    expected_duration_minutes INT,
    
    actual_start_time TIMESTAMP,
    actual_end_time TIMESTAMP,
    actual_duration_minutes INT,
    
    -- Allocation metadata
    allocation_method VARCHAR(20) NOT NULL,
        -- Values: manual, ai_suggested, automated
    suggestion_score DECIMAL(5,2), -- Confidence score if AI-suggested (0-100)
    
    -- Audit
    allocated_by VARCHAR(50) NOT NULL, -- Supervisor ID
    released_by VARCHAR(50),
    released_at TIMESTAMP,
    release_reason VARCHAR(100),
    
    -- Metadata
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    
    CONSTRAINT chk_allocation_type CHECK (allocation_type IN ('operator', 'machine', 'operator_machine')),
    CONSTRAINT chk_allocation_status CHECK (status IN ('active', 'completed', 'released', 'cancelled')),
    CONSTRAINT chk_allocation_method CHECK (allocation_method IN ('manual', 'ai_suggested', 'automated')),
    CONSTRAINT chk_has_resource CHECK (operator_id IS NOT NULL OR machine_id IS NOT NULL)
);

CREATE INDEX idx_allocations_wo ON allocations(work_order_id, status);
CREATE INDEX idx_allocations_operator ON allocations(operator_id, status);
CREATE INDEX idx_allocations_machine ON allocations(machine_id, status);
CREATE INDEX idx_allocations_time ON allocations(allocated_at DESC);

-- Allocation Change Events (Event Sourcing)
CREATE TABLE allocation_change_events (
    event_id BIGSERIAL PRIMARY KEY,
    allocation_id BIGINT REFERENCES allocations(allocation_id),
    
    event_type VARCHAR(50) NOT NULL,
        -- Values: created, reassigned, released, completed, paused, resumed
    event_timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
    
    -- State before change (JSON)
    previous_state JSONB,
    
    -- State after change (JSON)
    new_state JSONB,
    
    -- Change details
    change_reason_code VARCHAR(50),
    change_reason_description TEXT,
    
    -- Impact analysis (calculated at event time)
    idle_time_prevented_minutes INT,
    work_order_delay_minutes INT,
    
    -- Audit
    changed_by VARCHAR(50) NOT NULL,
    change_source VARCHAR(20) NOT NULL,
        -- Values: supervisor_ui, api, automated_system, integration
    
    -- Metadata
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    
    CONSTRAINT chk_event_type CHECK (event_type IN ('created', 'reassigned', 'released', 'completed', 'paused', 'resumed'))
);

CREATE INDEX idx_allocation_events_allocation ON allocation_change_events(allocation_id, event_timestamp DESC);
CREATE INDEX idx_allocation_events_timestamp ON allocation_change_events(event_timestamp DESC);
CREATE INDEX idx_allocation_events_type ON allocation_change_events(event_type, event_timestamp DESC);
CREATE INDEX idx_allocation_events_changed_by ON allocation_change_events(changed_by);
```

---

## 4. Real-Time Data Architecture

### 4.1 Data Flow Patterns

#### Pattern 1: Real-Time Status Updates
```
[Source System: MES/Sensor] 
    │
    ▼
[Integration Gateway] 
    │
    ▼
[Message Broker: Kafka Topic "resource-status-updates"]
    │
    ├──▶ [Stream Processor] ──▶ [PostgreSQL: Update Status]
    │
    ├──▶ [Cache Updater] ──▶ [Redis: Update Cached Entity]
    │
    └──▶ [WebSocket Server] ──▶ [Broadcast to Connected Clients]
```

**Latency Target**: <500ms end-to-end

#### Pattern 2: Allocation Transaction
```
[Supervisor UI] 
    │
    ▼
[API Gateway] 
    │
    ▼
[Allocation Service]
    │
    ├──▶ [Validation Engine] ──▶ [Check Constraints]
    │        │
    │        ├─ Operator availability
    │        ├─ Machine capacity
    │        ├─ Material sufficiency
    │        └─ Skill requirements
    │
    ├──▶ [PostgreSQL Transaction]
    │        │
    │        ├─ INSERT INTO allocations
    │        ├─ UPDATE operators SET current_status
    │        ├─ UPDATE machines SET current_status
    │        ├─ INSERT INTO allocation_change_events
    │        └─ COMMIT or ROLLBACK
    │
    ├──▶ [Publish Event] ──▶ [Kafka: "allocation-events" topic]
    │
    └──▶ [Update Cache] ──▶ [Redis: Invalidate affected entities]
         │
         └──▶ [Broadcast Update] ──▶ [WebSocket clients]
```

**Latency Target**: <2 seconds for confirmation

### 4.2 Caching Strategy

#### Redis Cache Structure

```
# Resource Status (Fast Lookup)
Key: resource:operator:{operator_id}
TTL: 300 seconds (5 minutes)
Value: JSON document (see Operator JSON example above)

Key: resource:machine:{machine_id}
TTL: 300 seconds
Value: JSON document with current status, utilization, assigned work order

Key: resource:material:{material_id}
TTL: 120 seconds (more frequent updates due to consumption)
Value: JSON with on-hand, allocated, available quantities

# Work Order Status
Key: workorder:{work_order_id}
TTL: 300 seconds
Value: JSON with status, progress, assigned resources, due date

# Active Allocations (Inverted Index)
Key: allocation:operator:{operator_id}:active
TTL: None (removed when allocation released)
Value: Set of allocation_ids

Key: allocation:machine:{machine_id}:active
TTL: None
Value: Set of allocation_ids

Key: allocation:workorder:{work_order_id}:active
TTL: None
Value: Set of allocation_ids

# Real-Time Counters
Key: stats:shift:{shift_id}:operators_available
TTL: Expire at shift end
Value: Integer count

Key: stats:line:{line_id}:machines_running
TTL: 3600 seconds
Value: Integer count

# Session Data
Key: session:{user_id}
TTL: 28800 seconds (8 hours)
Value: User session, preferences, active filters
```

#### Cache Invalidation Strategy

**Invalidation Triggers**:
1. **Status Change**: When resource status changes, invalidate that resource's cache key
2. **Allocation Change**: Invalidate operator, machine, and work order cache keys
3. **Material Consumption**: Invalidate material cache key
4. **Time-Based**: Auto-expire after TTL, refresh on next read

**Write-Through vs. Write-Behind**:
- **Write-Through**: For critical data (allocations, status changes) - write to DB first, then cache
- **Write-Behind**: For metrics (performance data) - write to cache immediately, batch to DB

### 4.3 Real-Time Data Requirements

| Data Type | Update Frequency | Acceptable Latency | Source System |
|-----------|------------------|-------------------|---------------|
| Machine Status | Every 30 seconds | <500ms | MES |
| Machine Performance Metrics | Every 1 minute | <2 seconds | Sensors/MES |
| Operator Status | On change (event-driven) | <500ms | Time & Attendance / Manual |
| Material Inventory | Every 5 minutes + on transaction | <1 second | Inventory System |
| Work Order Progress | Every 30 seconds | <1 second | MES |
| Allocations | On change (event-driven) | <500ms | MRAOS Internal |
| Idle Time Predictions | Every 2 minutes | <3 seconds | MRAOS ML Engine |

### 4.4 WebSocket Event Types

```javascript
// Client subscribes to specific channels
const subscriptions = [
  "resource-status",          // All resource status changes
  "allocation-changes",       // All allocation events
  "alerts",                   // System alerts and notifications
  "work-order-progress",      // Work order updates
  "idle-time-predictions",    // ML prediction updates
  "line:Line-2:*"            // Filter: Only Line 2 events
];

// Event message structure
{
  "event_type": "resource_status_changed",
  "event_id": "evt_20251118_142345_1234",
  "timestamp": "2025-11-18T14:23:45.678Z",
  "entity_type": "operator",
  "entity_id": "O-156",
  "data": {
    "operator_id": "O-156",
    "name": "John Doe",
    "previous_status": "busy",
    "current_status": "available",
    "location": "Line 2, Zone A"
  },
  "metadata": {
    "source": "time_and_attendance",
    "triggered_by": "system"
  }
}
```

---

## 5. Time-Series Data Management

### 5.1 InfluxDB Schema (Machine Metrics)

```
Measurement: machine_performance
Tags:
  - machine_id
  - machine_type
  - production_line
  - zone
  
Fields:
  - units_produced (integer)
  - cycle_time_seconds (float)
  - downtime_seconds (integer)
  - utilization_percentage (float)
  - temperature_celsius (float)
  - vibration_level (float)
  - power_consumption_kwh (float)
  - quality_pass_count (integer)
  - quality_fail_count (integer)

Timestamp: Nanosecond precision

Retention Policies:
  - autogen: 7 days (raw data, 30-second intervals)
  - downsampled_1hour: 90 days (hourly aggregates)
  - downsampled_1day: 2 years (daily aggregates)
```

#### Example Query (Last 10 Minutes of Utilization)
```sql
SELECT mean("utilization_percentage") 
FROM "machine_performance" 
WHERE "machine_id" = 'M-203' 
  AND time > now() - 10m 
GROUP BY time(1m)
```

### 5.2 Time-Series Data Aggregation

**Real-Time Aggregation** (in-memory, Redis):
```
Key: metrics:machine:M-203:current_hour
Value: Sorted Set (timestamp, utilization_percentage)
TTL: 3600 seconds

# Calculate average utilization
ZREVRANGE metrics:machine:M-203:current_hour 0 -1 WITHSCORES
# Compute avg in application layer
```

**Batch Aggregation** (scheduled job, hourly):
```sql
-- Aggregate to 1-hour resolution
INSERT INTO machine_performance_aggregates (
  machine_id, hour_start, avg_utilization, max_utilization, 
  min_utilization, total_units_produced, total_downtime_minutes
)
SELECT 
  machine_id,
  date_trunc('hour', timestamp) AS hour_start,
  AVG(utilization_percentage) AS avg_utilization,
  MAX(utilization_percentage) AS max_utilization,
  MIN(utilization_percentage) AS min_utilization,
  SUM(units_produced) AS total_units_produced,
  SUM(downtime_seconds) / 60 AS total_downtime_minutes
FROM machine_performance_metrics
WHERE timestamp >= (NOW() - INTERVAL '1 hour')
  AND timestamp < (NOW())
GROUP BY machine_id, hour_start;
```

---

## 6. Data Consistency & Transactions

### 6.1 ACID Transactions

**Critical Operations Requiring ACID**:
1. **Resource Allocation**: Operator + Machine + Work Order assignment (all-or-nothing)
2. **Material Reservation**: Check availability + reserve quantity (atomic)
3. **Allocation Release**: Update allocation + release resources + update work order (consistent)

#### Example Transaction (PostgreSQL)

```sql
BEGIN TRANSACTION ISOLATION LEVEL READ COMMITTED;

-- Step 1: Validate operator availability
SELECT operator_id, current_status 
FROM operators 
WHERE operator_id = 'O-156' 
  AND current_status = 'available'
FOR UPDATE; -- Lock row

-- Step 2: Validate machine availability
SELECT machine_id, current_status 
FROM machines 
WHERE machine_id = 'M-203' 
  AND current_status = 'idle'
FOR UPDATE;

-- Step 3: Create allocation
INSERT INTO allocations (
  work_order_id, operator_id, machine_id, 
  allocation_type, allocated_by, allocation_method
) VALUES (
  'WO-4600', 'O-156', 'M-203', 
  'operator_machine', 'S-042', 'manual'
) RETURNING allocation_id;

-- Step 4: Update operator status
UPDATE operators 
SET current_status = 'busy', 
    status_updated_at = NOW(),
    updated_at = NOW()
WHERE operator_id = 'O-156';

-- Step 5: Update machine status
UPDATE machines 
SET current_status = 'running', 
    status_updated_at = NOW(),
    updated_at = NOW()
WHERE machine_id = 'M-203';

-- Step 6: Update work order status
UPDATE work_orders 
SET status = 'assigned',
    updated_at = NOW()
WHERE work_order_id = 'WO-4600';

-- Step 7: Log event
INSERT INTO allocation_change_events (
  allocation_id, event_type, changed_by, change_source, new_state
) VALUES (
  {allocation_id}, 'created', 'S-042', 'supervisor_ui',
  '{"operator": "O-156", "machine": "M-203", "work_order": "WO-4600"}'::jsonb
);

COMMIT;
-- If any step fails, ROLLBACK automatically
```

### 6.2 Optimistic Concurrency Control

For non-critical updates (e.g., work order progress), use optimistic locking:

```sql
UPDATE work_orders
SET progress_percentage = 45,
    quantity_produced = 90,
    updated_at = NOW(),
    version = version + 1  -- Increment version
WHERE work_order_id = 'WO-4600'
  AND version = 12;  -- Check version matches expected

-- If affected rows = 0, conflict detected → retry with latest version
```

---

## 7. Data Migration & Seeding

### 7.1 Initial Data Load

#### Operators (from HR System)
```sql
INSERT INTO operators (
  operator_id, employee_id, first_name, last_name, email, 
  department, home_location, current_status
)
SELECT 
  'O-' || LPAD(employee_id::text, 3, '0'),
  employee_id,
  first_name,
  last_name,
  email,
  department,
  location_code,
  CASE 
    WHEN is_active = TRUE AND on_shift = TRUE THEN 'available'
    ELSE 'offline'
  END
FROM hr_integration.employees
WHERE job_role IN ('Operator', 'Technician', 'Assembler');
```

#### Machines (from Equipment Registry)
```sql
INSERT INTO machines (
  machine_id, machine_name, machine_type, manufacturer, 
  serial_number, production_line, current_status
)
SELECT 
  equipment_id,
  equipment_name,
  equipment_type,
  manufacturer,
  serial_number,
  production_line,
  CASE 
    WHEN operational_status = 'ONLINE' THEN 'idle'
    WHEN operational_status = 'MAINTENANCE' THEN 'maintenance'
    ELSE 'offline'
  END
FROM equipment_registry.machines
WHERE is_production_equipment = TRUE;
```

### 7.2 Daily Synchronization Jobs

```sql
-- Sync operator shifts (daily at 5 AM)
INSERT INTO operator_shifts (
  operator_id, shift_name, shift_date, start_time, end_time, status
)
SELECT 
  o.operator_id,
  s.shift_name,
  s.shift_date,
  s.start_time,
  s.end_time,
  'scheduled'
FROM hr_integration.shift_schedule s
JOIN operators o ON s.employee_id = o.employee_id
WHERE s.shift_date = CURRENT_DATE
ON CONFLICT (operator_id, shift_date) DO NOTHING;
```

---

## 8. Data Backup & Recovery

### 8.1 Backup Strategy

| Database | Backup Type | Frequency | Retention | RTO | RPO |
|----------|------------|-----------|-----------|-----|-----|
| PostgreSQL (Primary) | Full + Incremental | Full: Daily, Incremental: Every 4 hours | 30 days | <1 hour | <15 min |
| Redis (Cache) | Snapshot (RDB) + AOF | Snapshot: Hourly, AOF: Continuous | 7 days | <5 min | <1 min |
| InfluxDB (Time-Series) | Full | Daily | 90 days | <2 hours | <1 hour |
| Object Storage (Audit Logs) | Replication | Continuous (geo-redundant) | 7 years | <30 min | <5 min |

### 8.2 Point-in-Time Recovery (PostgreSQL)

```bash
# Enable continuous archiving
# In postgresql.conf:
wal_level = replica
archive_mode = on
archive_command = 'cp %p /backup/archive/%f'

# Restore to specific point in time
pg_restore --dbname=mraos_production \
           --target-time="2025-11-18 14:00:00" \
           /backup/mraos_full_backup.dump
```

---

## 9. Data Quality & Validation

### 9.1 Data Validation Rules

| Entity | Field | Validation Rule |
|--------|-------|----------------|
| Operator | current_status | Must be in predefined enum |
| Operator | efficiency_rating | Range: 0.0 to 5.0 |
| Machine | current_status | Must be in predefined enum |
| Machine | oee_percentage | Range: 0 to 100 |
| Material | available_quantity | Cannot be negative |
| WorkOrder | quantity_produced | Cannot exceed quantity_ordered |
| Allocation | operator_id OR machine_id | At least one must be NOT NULL |

### 9.2 Data Quality Monitoring

```sql
-- Daily data quality report
CREATE OR REPLACE VIEW data_quality_report AS
SELECT 
  'Operators with invalid status' AS check_name,
  COUNT(*) AS violation_count
FROM operators
WHERE current_status NOT IN ('available', 'busy', 'break', 'absent', 'sick', 'vacation', 'offline')

UNION ALL

SELECT 
  'Machines with future maintenance date in past',
  COUNT(*)
FROM machines
WHERE next_maintenance_date < CURRENT_DATE AND current_status != 'maintenance'

UNION ALL

SELECT 
  'Materials with negative available quantity',
  COUNT(*)
FROM materials
WHERE available_quantity < 0

UNION ALL

SELECT 
  'Work orders with progress > 100%',
  COUNT(*)
FROM work_orders
WHERE progress_percentage > 100;
```

---

## 10. Data Archival & Purging

### 10.1 Archival Policy

| Data Type | Archive After | Purge After | Archive Location |
|-----------|---------------|-------------|------------------|
| Allocation Change Events | 2 years | Never (retain indefinitely) | Object Storage (cold tier) |
| Machine Performance Metrics | 90 days (raw) | 2 years (aggregates) | InfluxDB → Object Storage |
| Production Logs | 1 year | 7 years | PostgreSQL → Object Storage |
| Audit Logs | Immediate | 7 years | Object Storage (immutable) |

### 10.2 Archival Process

```sql
-- Archive old allocation change events (monthly job)
WITH archived AS (
  DELETE FROM allocation_change_events
  WHERE event_timestamp < (NOW() - INTERVAL '2 years')
  RETURNING *
)
COPY archived TO '/archive/allocation_events_202301.csv' CSV HEADER;

-- Compress and upload to object storage
-- gzip /archive/allocation_events_202301.csv
-- aws s3 cp /archive/allocation_events_202301.csv.gz s3://mraos-archive/allocation_events/
```

---

## 11. Performance Optimization

### 11.1 Database Indexing Strategy

**High-Priority Indexes** (created in schema above):
- Composite index on `(status, priority)` for work order querying
- Index on `current_status` for resource availability queries
- Index on foreign keys for join performance
- Index on timestamp fields for time-range queries

**Query Optimization Example**:

```sql
-- Before optimization (slow - sequential scan)
SELECT * FROM operators WHERE current_status = 'available' AND home_location LIKE '%Line 2%';

-- After optimization (fast - index scan)
CREATE INDEX idx_operators_location_gin ON operators USING GIN (to_tsvector('english', home_location));

SELECT * FROM operators 
WHERE current_status = 'available' 
  AND to_tsvector('english', home_location) @@ to_tsquery('Line & 2');
```

### 11.2 Query Performance Targets

| Query Type | Target Response Time |
|------------|---------------------|
| Single resource lookup (by ID) | <10ms |
| List available resources (filtered) | <50ms |
| Work order assignment validation | <100ms |
| Complex analytics query (aggregates) | <2 seconds |
| Full-text search (operators, work orders) | <200ms |

### 11.3 Connection Pooling

```javascript
// Node.js example (pg-pool)
const { Pool } = require('pg');

const pool = new Pool({
  host: 'mraos-db-primary.internal',
  database: 'mraos_production',
  user: 'mraos_app_user',
  password: process.env.DB_PASSWORD,
  port: 5432,
  max: 50,                // Max connections in pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
  application_name: 'mraos_allocation_service'
});
```

---

## 12. Data Governance & Compliance

### 12.1 Data Classification

| Data Type | Classification | Encryption Required | Access Level |
|-----------|---------------|-------------------|--------------|
| Operator Personal Info (Name, Email) | PII - Confidential | Yes (at rest) | Role-Based |
| Work Order Details | Business Confidential | Yes (in transit) | Role-Based |
| Machine Performance Metrics | Internal Use | Optional | All Authenticated |
| Allocation Change Events | Audit - Highly Restricted | Yes (at rest + transit) | Audit Roles Only |
| Material Costs | Financial - Confidential | Yes (at rest) | Manager+ Only |

### 12.2 Data Retention Compliance

**Regulatory Requirements**:
- **SOX (Sarbanes-Oxley)**: Financial-impact decisions → 7 years
- **GDPR**: Personal data → Right to erasure (with exceptions for legal obligations)
- **ISO 9001**: Quality records → Minimum 3 years
- **OSHA**: Safety-related records → 5 years

**Implementation**:
```sql
-- GDPR: Anonymize operator data after termination + retention period
UPDATE operators
SET first_name = 'REDACTED',
    last_name = 'REDACTED',
    email = 'deleted@example.com',
    phone = NULL,
    photo_url = NULL
WHERE is_active = FALSE
  AND updated_at < (NOW() - INTERVAL '3 years');
```

### 12.3 Data Access Audit

```sql
CREATE TABLE data_access_audit (
  audit_id BIGSERIAL PRIMARY KEY,
  user_id VARCHAR(50) NOT NULL,
  accessed_at TIMESTAMP NOT NULL DEFAULT NOW(),
  
  entity_type VARCHAR(50) NOT NULL, -- e.g., "operator", "work_order"
  entity_id VARCHAR(50) NOT NULL,
  action VARCHAR(20) NOT NULL, -- e.g., "read", "update", "delete"
  
  ip_address INET,
  user_agent TEXT,
  
  query_executed TEXT, -- SQL query or API endpoint
  
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_data_access_audit_user ON data_access_audit(user_id, accessed_at DESC);
CREATE INDEX idx_data_access_audit_entity ON data_access_audit(entity_type, entity_id);
```

---

## 13. Data Architecture Decision Log

| Date | Decision | Rationale | Alternatives Considered |
|------|----------|-----------|------------------------|
| 2025-11-18 | Use PostgreSQL for primary database | ACID compliance, mature ecosystem, JSON support | MongoDB (rejected due to ACID requirements) |
| 2025-11-18 | Use Redis for caching | Sub-millisecond read latency, pub/sub support | Memcached (rejected - no pub/sub) |
| 2025-11-18 | Use InfluxDB for time-series metrics | Optimized for time-series, retention policies | Prometheus (rejected - query language complexity) |
| 2025-11-18 | Event Sourcing for allocations | Complete audit trail, replay capability | State-only storage (rejected - insufficient audit) |
| 2025-11-18 | WebSocket for real-time updates | Bi-directional, low latency, wide browser support | Server-Sent Events (rejected - uni-directional only) |

---

**Document Approval**:
- Data Architect: ___________________
- Database Administrator: ___________________
- Security Officer: ___________________

**Next Steps**:
1. Review and approve data architecture
2. Set up development database environment
3. Implement database migration scripts
4. Configure real-time data pipeline
5. Establish backup and monitoring procedures
