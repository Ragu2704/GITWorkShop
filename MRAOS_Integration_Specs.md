# Manufacturing Resource Allocation and Optimization System (MRAOS)
## Integration Specifications

**Version:** 1.0  
**Date:** November 18, 2025  
**Document Owner:** Senior Management - Home Appliance Manufacturing

---

## 1. Executive Summary

This document specifies the integration architecture for MRAOS with external enterprise systems including ERP, MES, HR, and Inventory Management. The integration design prioritizes real-time data synchronization, fault tolerance, and bidirectional communication while maintaining data consistency across all systems.

### Integration Objectives
- **Real-Time Synchronization**: Work orders, resource status, and inventory data updated within seconds
- **Bidirectional Communication**: Support both push and pull data flows
- **Fault Tolerance**: Graceful degradation and automatic recovery
- **Data Consistency**: Ensure all systems reflect accurate, synchronized state
- **Scalability**: Handle increasing data volumes and transaction rates

---

## 2. Integration Architecture Overview

### 2.1 Integration Patterns

```
┌─────────────────────────────────────────────────────────────────────┐
│                         MRAOS Core System                            │
├─────────────────────────────────────────────────────────────────────┤
│                    Integration Gateway Layer                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐             │
│  │  API Adapter │  │Event Consumer│  │ File Transfer│             │
│  │  (REST/SOAP) │  │  (Webhooks)  │  │   (SFTP)     │             │
│  └──────────────┘  └──────────────┘  └──────────────┘             │
├─────────────────────────────────────────────────────────────────────┤
│                    Message Broker (Kafka)                            │
│  Topics: work-orders | resource-status | inventory | hr-updates     │
└─────────────────────────────────────────────────────────────────────┘
          │                  │                  │                  │
          ▼                  ▼                  ▼                  ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│   ERP System    │  │   MES System    │  │   HR System     │  │   Inventory     │
│  (SAP/Oracle/   │  │  (Siemens/      │  │  (Workday/      │  │   Management    │
│   Dynamics)     │  │   Rockwell)     │  │   ADP)          │  │   (WMS)         │
└─────────────────┘  └─────────────────┘  └─────────────────┘  └─────────────────┘
```

### 2.2 Integration Methods by System

| External System | Integration Method | Data Direction | Frequency | Protocol |
|----------------|-------------------|----------------|-----------|----------|
| **ERP** | REST API + Webhook | Bidirectional | Real-time + Hourly batch | HTTPS/JSON |
| **MES** | OPC-UA + Message Queue | MES → MRAOS (primary) | Real-time (30 sec) | OPC-UA/MQTT |
| **HR** | REST API | HR → MRAOS | Daily + On-demand | HTTPS/JSON |
| **Inventory** | REST API + Database Link | Bidirectional | Real-time (5 min) | HTTPS/JSON |

---

## 3. ERP System Integration

### 3.1 Overview

**Purpose**: Exchange work orders, bill of materials (BOM), customer orders, and production completion data

**Systems Supported**: SAP S/4HANA, Oracle EBS, Microsoft Dynamics 365, Infor CloudSuite

**Integration Pattern**: Hybrid (API for real-time + scheduled batch for reconciliation)

### 3.2 Data Flows

#### 3.2.1 Inbound: ERP → MRAOS

##### Work Order Creation/Update
**Trigger**: New work order created or updated in ERP

**Data Payload** (JSON):
```json
{
  "event_type": "work_order.created",
  "timestamp": "2025-11-18T14:23:45.678Z",
  "work_order": {
    "erp_work_order_id": "WO-ERP-452100",
    "work_order_number": "452100",
    "product_id": "PROD-WD-100",
    "product_name": "Washer Door Assembly",
    "product_variant": "Standard - White",
    "quantity_ordered": 200,
    "unit_of_measure": "EA",
    "priority": "high",
    "due_date": "2025-11-18T14:30:00Z",
    "customer_order_id": "CO-12345",
    "production_line_preference": "Line 2",
    "bill_of_materials": [
      {
        "material_id": "MAT-A-1234",
        "part_number": "A-1234",
        "part_name": "Door Panel",
        "quantity_required": 400,
        "unit_of_measure": "EA"
      },
      {
        "material_id": "MAT-B-5678",
        "part_number": "B-5678",
        "part_name": "Hinge Assembly",
        "quantity_required": 200,
        "unit_of_measure": "EA"
      }
    ],
    "special_instructions": "Quality inspection required before packaging"
  }
}
```

**API Endpoint** (MRAOS receives):
```
POST /api/v1/integrations/erp/work-orders
Authorization: Bearer {jwt_token}
Content-Type: application/json
```

**Processing Logic**:
1. Validate incoming payload against schema
2. Check for duplicate work order (by `erp_work_order_id`)
3. Map ERP fields to MRAOS data model
4. Validate material availability
5. Insert into `work_orders` and `work_order_bom` tables
6. Publish `work_order.received` event to internal message bus
7. Return acknowledgment with MRAOS work order ID

**Response**:
```json
{
  "status": "success",
  "mraos_work_order_id": "WO-4600",
  "erp_work_order_id": "WO-ERP-452100",
  "message": "Work order created successfully",
  "validation_warnings": [
    "Part B-5678 has only 50 units available (200 required). Shortage of 150 units."
  ]
}
```

**Error Handling**:
- **Duplicate Work Order**: Return 409 Conflict with existing work order ID
- **Invalid Material**: Return 400 Bad Request with missing material details
- **ERP System Down**: Queue in dead-letter queue, retry with exponential backoff (5, 15, 30 min)

##### Material Master Data Sync
**Frequency**: Daily at 2:00 AM + on-demand when new materials added

**Data Payload** (CSV/JSON):
```json
{
  "materials": [
    {
      "material_id": "MAT-A-1234",
      "part_number": "A-1234",
      "part_name": "Door Panel",
      "description": "Front door panel for standard washers",
      "category": "Fabricated Parts",
      "unit_of_measure": "EA",
      "standard_cost": 12.50,
      "currency": "USD",
      "is_active": true
    }
  ]
}
```

**Processing Logic**:
- Upsert (insert or update) into `materials` table
- Compare with existing data, log changes in audit table
- If material becomes inactive, prevent new reservations

#### 3.2.2 Outbound: MRAOS → ERP

##### Production Completion Report
**Trigger**: Work order status changes to "completed" in MRAOS

**API Endpoint** (MRAOS calls ERP):
```
POST https://erp.company.com/api/production/work-order-completion
Authorization: Bearer {erp_api_token}
Content-Type: application/json
```

**Data Payload**:
```json
{
  "erp_work_order_id": "WO-ERP-452100",
  "mraos_work_order_id": "WO-4600",
  "completion_timestamp": "2025-11-18T15:45:30Z",
  "quantity_produced": 200,
  "quantity_scrapped": 3,
  "quantity_good": 197,
  "actual_start_time": "2025-11-18T14:30:00Z",
  "actual_end_time": "2025-11-18T15:45:30Z",
  "actual_duration_minutes": 75,
  "resources_used": [
    {
      "resource_type": "operator",
      "resource_id": "O-156",
      "employee_id": "EMP-2024-0156",
      "hours_worked": 1.25
    },
    {
      "resource_type": "machine",
      "resource_id": "M-203",
      "machine_hours": 1.25
    }
  ],
  "materials_consumed": [
    {
      "material_id": "MAT-A-1234",
      "part_number": "A-1234",
      "quantity_consumed": 405,
      "unit_of_measure": "EA"
    }
  ],
  "quality_results": {
    "inspection_passed": true,
    "defect_count": 3,
    "defect_types": ["cosmetic damage"]
  }
}
```

**Response Handling**:
- Success (200 OK): Mark work order as synchronized in MRAOS
- Failure (4xx/5xx): Retry up to 3 times, then escalate to manual review queue

##### Material Consumption Report (Hourly Batch)
**Frequency**: Every hour at :05 (e.g., 8:05, 9:05, 10:05)

**Processing**:
1. Query all material transactions in past hour
2. Aggregate by material_id and work_order_id
3. Generate batch file (JSON or CSV)
4. Submit to ERP via API or SFTP
5. Mark transactions as synchronized

### 3.3 API Specifications

#### ERP → MRAOS: Work Order Webhook

**Endpoint**: `POST /api/v1/integrations/erp/work-orders`

**Authentication**: OAuth 2.0 Client Credentials flow
```
Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Rate Limiting**: 100 requests per minute per client

**Request Schema** (JSON Schema):
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "required": ["event_type", "timestamp", "work_order"],
  "properties": {
    "event_type": {"type": "string", "enum": ["work_order.created", "work_order.updated", "work_order.cancelled"]},
    "timestamp": {"type": "string", "format": "date-time"},
    "work_order": {
      "type": "object",
      "required": ["erp_work_order_id", "product_id", "quantity_ordered", "due_date"],
      "properties": {
        "erp_work_order_id": {"type": "string"},
        "product_id": {"type": "string"},
        "quantity_ordered": {"type": "number", "minimum": 1},
        "due_date": {"type": "string", "format": "date-time"}
      }
    }
  }
}
```

**Response Codes**:
- `200 OK`: Successfully processed
- `400 Bad Request`: Invalid payload
- `401 Unauthorized`: Invalid or missing authentication
- `409 Conflict`: Duplicate work order
- `500 Internal Server Error`: System error (retry after 5 minutes)

### 3.4 Reconciliation Process

**Frequency**: Daily at 11:00 PM

**Process**:
1. MRAOS queries ERP for all work orders updated in last 24 hours
2. Compare against MRAOS database
3. Identify discrepancies (missing, conflicting status)
4. Generate reconciliation report
5. Automatically sync low-risk discrepancies (e.g., description updates)
6. Flag high-risk discrepancies (e.g., quantity mismatches) for manual review

**Reconciliation Report** (sent to operations manager):
```
Date: 2025-11-18
Total Work Orders in ERP: 523
Total Work Orders in MRAOS: 521

Discrepancies Found: 2

1. Work Order WO-ERP-450123
   - Status in ERP: Completed
   - Status in MRAOS: In Progress
   - Action: Manual review required

2. Work Order WO-ERP-450456
   - Exists in ERP: Yes
   - Exists in MRAOS: No
   - Action: Auto-sync scheduled
```

---

## 4. MES (Manufacturing Execution System) Integration

### 4.1 Overview

**Purpose**: Receive real-time machine status, production counts, quality metrics, and downtime events

**Systems Supported**: Siemens Opcenter, Rockwell FactoryTalk, Wonderware MES

**Integration Pattern**: Real-time data streaming (OPC-UA + MQTT)

### 4.2 Data Flows

#### 4.2.1 Inbound: MES → MRAOS

##### Machine Status Updates
**Frequency**: Every 30 seconds (configurable)

**Protocol**: OPC-UA (OPC Unified Architecture)

**Data Points**:
```
Node: MES.Machines.M-203.Status
  - CurrentStatus: "Running" | "Idle" | "Stopped" | "Faulted"
  - UtilizationPercentage: 85.2
  - CurrentWorkOrderId: "WO-4600"
  - UnitsProducedThisCycle: 12
  - CycleTimeSeconds: 45.3
  - DowntimeSeconds: 0
  - LastUpdateTimestamp: "2025-11-18T14:25:30.123Z"
```

**MRAOS Processing**:
1. OPC-UA client subscribes to machine status nodes
2. On value change, receive notification
3. Validate machine_id exists in MRAOS database
4. Update `machines` table (status, utilization)
5. Insert record in `machine_status_history`
6. If status changed to "Faulted", trigger alert
7. Broadcast update via WebSocket to connected supervisors

**OPC-UA Configuration**:
```xml
<OPCUAConnection>
  <EndpointUrl>opc.tcp://mes-server.company.com:4840</EndpointUrl>
  <SecurityMode>SignAndEncrypt</SecurityMode>
  <AuthenticationMode>UsernamePassword</AuthenticationMode>
  <SubscriptionInterval>30000</SubscriptionInterval> <!-- 30 seconds -->
  <KeepAliveInterval>10000</KeepAliveInterval>
</OPCUAConnection>
```

##### Production Count Updates
**Frequency**: Real-time (event-driven on each unit produced)

**Protocol**: MQTT (Message Queuing Telemetry Transport)

**MQTT Topic**: `mes/production/line2/machine/M-203/count`

**Message Payload**:
```json
{
  "machine_id": "M-203",
  "work_order_id": "WO-4600",
  "timestamp": "2025-11-18T14:26:15.456Z",
  "units_produced": 1,
  "cumulative_units": 85,
  "quality_status": "pass",
  "cycle_time_seconds": 44.8
}
```

**MRAOS Processing**:
1. Subscribe to MQTT topic `mes/production/+/machine/+/count`
2. On message received, parse payload
3. Update `work_orders` table: increment `quantity_produced`, recalculate `progress_percentage`
4. Insert into `production_logs` table
5. If work order reaches 100%, trigger completion workflow
6. Broadcast progress update to UI

**MQTT Broker Configuration**:
```yaml
mqtt:
  broker_url: mqtt://mes-broker.company.com:1883
  client_id: mraos_production_listener
  username: mraos_integration
  password: ${MQTT_PASSWORD}
  qos: 1  # At least once delivery
  topics:
    - mes/production/+/machine/+/count
    - mes/quality/+/machine/+/inspection
    - mes/downtime/+/machine/+/event
```

##### Quality Inspection Results
**MQTT Topic**: `mes/quality/line2/machine/M-203/inspection`

**Message Payload**:
```json
{
  "machine_id": "M-203",
  "work_order_id": "WO-4600",
  "timestamp": "2025-11-18T14:27:00.000Z",
  "inspection_id": "INS-20251118-0042",
  "inspection_type": "inline_automated",
  "result": "pass",
  "defect_detected": false,
  "defect_type": null,
  "inspector": "AutoInspect_System"
}
```

**Processing**:
- Update work order quality metrics
- If defect detected, notify supervisor via alert
- Log inspection result

##### Downtime Events
**MQTT Topic**: `mes/downtime/line2/machine/M-203/event`

**Message Payload**:
```json
{
  "event_type": "downtime.started",
  "machine_id": "M-203",
  "timestamp": "2025-11-18T14:28:00.000Z",
  "downtime_reason_code": "MECH_FAULT",
  "downtime_reason_description": "Hydraulic system pressure drop",
  "severity": "high",
  "estimated_repair_time_minutes": 45,
  "work_order_affected": "WO-4600"
}
```

**Processing**:
1. Update machine status to "breakdown"
2. Log downtime event in `machine_status_history`
3. Trigger high-priority alert to supervisor
4. Activate idle time optimizer to suggest resource reallocation
5. Notify affected work order

#### 4.2.2 Outbound: MRAOS → MES

##### Work Order Start Signal
**Trigger**: Supervisor clicks "Start Work Order" in MRAOS

**Protocol**: REST API (MES exposes endpoint)

**API Endpoint**:
```
POST https://mes-api.company.com/api/v1/work-orders/start
Authorization: Basic {base64_credentials}
Content-Type: application/json
```

**Payload**:
```json
{
  "work_order_id": "WO-4600",
  "erp_work_order_id": "WO-ERP-452100",
  "machine_id": "M-203",
  "operator_id": "O-156",
  "start_time": "2025-11-18T14:30:00Z",
  "quantity_to_produce": 200,
  "product_id": "PROD-WD-100",
  "product_name": "Washer Door Assembly"
}
```

**Response**:
```json
{
  "status": "success",
  "mes_job_id": "JOB-MES-78945",
  "message": "Work order started on machine M-203"
}
```

### 4.3 Data Transformation & Mapping

**MES Field → MRAOS Field Mapping**:

| MES System Field | MRAOS Field | Transformation |
|------------------|-------------|----------------|
| JobNumber | erp_work_order_id | Direct mapping |
| PartNumber | product_id | Direct mapping |
| Quantity | quantity_ordered | Direct mapping |
| MachineStatus | current_status | Map: "Producing" → "running", "Down" → "breakdown" |
| OEE | overall_equipment_effectiveness | Direct mapping (percentage) |

### 4.4 Error Handling & Resilience

**Connection Loss**:
- Automatic reconnection with exponential backoff (5s, 15s, 30s, 1min, 5min)
- Buffer last 1000 messages in local queue during outage
- Replay buffered messages when connection restored

**Data Quality Issues**:
- Reject messages with invalid machine_id (log error, send to dead-letter queue)
- Handle missing fields with default values (e.g., cycle_time_seconds = 0 if null)
- Validate timestamp is within 5 minutes of current time (reject stale data)

---

## 5. HR System Integration

### 5.1 Overview

**Purpose**: Synchronize employee master data, shift schedules, attendance, and skill certifications

**Systems Supported**: Workday, ADP, SAP SuccessFactors, BambooHR

**Integration Pattern**: Scheduled API calls (daily sync) + real-time attendance webhooks

### 5.2 Data Flows

#### 5.2.1 Inbound: HR → MRAOS

##### Employee Master Data Sync
**Frequency**: Daily at 1:00 AM

**API Call** (MRAOS pulls from HR):
```
GET https://hr-api.company.com/api/v1/employees?department=Manufacturing&status=active
Authorization: Bearer {hr_api_token}
```

**Response**:
```json
{
  "employees": [
    {
      "employee_id": "EMP-2024-0156",
      "first_name": "John",
      "last_name": "Doe",
      "email": "john.doe@company.com",
      "phone": "+1-555-0123",
      "department": "Manufacturing",
      "job_title": "Production Operator",
      "hire_date": "2020-03-15",
      "is_active": true,
      "location": "Plant 1 - Zone A",
      "skills": [
        {
          "skill_code": "WELD-L3",
          "skill_name": "Welding Level 3",
          "proficiency_level": 3,
          "certification_date": "2023-06-15",
          "certification_expiry": "2026-06-30"
        }
      ]
    }
  ],
  "total_count": 247,
  "page": 1,
  "page_size": 100
}
```

**Processing**:
1. Query HR API for all manufacturing employees
2. Upsert into `operators` table (insert new, update existing)
3. Sync `operator_skills` table
4. Identify terminated employees (no longer in HR system) → Mark `is_active = FALSE`
5. Log sync summary (X added, Y updated, Z deactivated)

##### Shift Schedule Sync
**Frequency**: Daily at 5:00 AM (before shift start)

**API Call**:
```
GET https://hr-api.company.com/api/v1/schedules?date=2025-11-18&department=Manufacturing
```

**Response**:
```json
{
  "schedules": [
    {
      "employee_id": "EMP-2024-0156",
      "shift_date": "2025-11-18",
      "shift_name": "Shift A",
      "start_time": "06:00:00",
      "end_time": "14:00:00",
      "break_start": "09:30:00",
      "break_end": "10:00:00",
      "is_overtime": false
    }
  ]
}
```

**Processing**:
- Insert into `operator_shifts` table
- If operator not in MRAOS, log warning (requires master data sync)

##### Real-Time Attendance Webhook
**Trigger**: Employee clocks in/out via time clock or badge swipe

**Endpoint** (MRAOS receives):
```
POST /api/v1/integrations/hr/attendance
```

**Payload**:
```json
{
  "event_type": "clock_in",
  "timestamp": "2025-11-18T06:02:15Z",
  "employee_id": "EMP-2024-0156",
  "location": "Plant 1 - Entrance A",
  "shift_id": "SH-20251118-A"
}
```

**Processing**:
1. Update `operator_shifts` table: set `actual_clock_in`
2. Update `operators` table: set `current_status = 'available'`
3. Broadcast operator availability change to UI

#### 5.2.2 Outbound: MRAOS → HR

##### Actual Hours Worked Report
**Frequency**: Daily at 11:00 PM

**Purpose**: Report actual time spent on work orders for payroll and labor tracking

**API Call** (MRAOS pushes to HR):
```
POST https://hr-api.company.com/api/v1/time-entries
```

**Payload**:
```json
{
  "date": "2025-11-18",
  "time_entries": [
    {
      "employee_id": "EMP-2024-0156",
      "clock_in": "2025-11-18T06:02:15Z",
      "clock_out": "2025-11-18T14:05:30Z",
      "total_hours": 8.05,
      "break_hours": 0.5,
      "work_hours": 7.55,
      "overtime_hours": 0.0,
      "work_orders_assigned": ["WO-4600", "WO-4612", "WO-4623"]
    }
  ]
}
```

### 5.3 API Specifications

#### MRAOS → HR: Attendance API

**Endpoint**: `POST /api/v1/integrations/hr/attendance`

**Authentication**: API Key (X-API-Key header)

**Rate Limiting**: 1000 requests per minute

**Idempotency**: Supports idempotency key header for duplicate prevention
```
Idempotency-Key: clk_in_EMP-2024-0156_20251118_060215
```

---

## 6. Inventory Management Integration

### 6.1 Overview

**Purpose**: Real-time material availability, reservations, and consumption tracking

**Systems Supported**: SAP WM, Oracle WMS, Manhattan Associates, custom WMS

**Integration Pattern**: REST API (bidirectional) + database replication (read-only)

### 6.2 Data Flows

#### 6.2.1 Inbound: Inventory → MRAOS

##### Stock Level Updates
**Frequency**: Every 5 minutes + on-demand after transactions

**API Call** (MRAOS pulls):
```
GET https://inventory-api.company.com/api/v1/materials/stock-levels?location=Plant1
```

**Response**:
```json
{
  "materials": [
    {
      "material_id": "MAT-A-1234",
      "part_number": "A-1234",
      "warehouse": "Plant1-WH",
      "location": "Aisle 12, Bin 3A",
      "on_hand_quantity": 500,
      "allocated_quantity": 200,
      "available_quantity": 300,
      "unit_of_measure": "EA",
      "batch_details": [
        {
          "batch_number": "BATCH-20251115-01",
          "quantity": 250,
          "expiration_date": "2026-11-15"
        },
        {
          "batch_number": "BATCH-20251116-02",
          "quantity": 250,
          "expiration_date": "2026-11-16"
        }
      ],
      "last_updated": "2025-11-18T14:20:00Z"
    }
  ]
}
```

**Processing**:
- Update `materials` table (on_hand_quantity, allocated_quantity)
- Check if any materials dropped below safety stock → Trigger reorder alert
- Broadcast material availability change to UI

#### 6.2.2 Outbound: MRAOS → Inventory

##### Material Reservation Request
**Trigger**: Supervisor assigns work order with required materials

**API Call** (MRAOS calls Inventory):
```
POST https://inventory-api.company.com/api/v1/reservations
```

**Payload**:
```json
{
  "reservation_id": "RES-MRAOS-20251118-0042",
  "work_order_id": "WO-4600",
  "reserved_by": "MRAOS_System",
  "reservation_date": "2025-11-18T14:30:00Z",
  "expected_consumption_date": "2025-11-18T15:30:00Z",
  "materials": [
    {
      "material_id": "MAT-A-1234",
      "part_number": "A-1234",
      "quantity": 400,
      "unit_of_measure": "EA",
      "prefer_batch": "FEFO"
    }
  ]
}
```

**Response**:
```json
{
  "status": "success",
  "reservation_id": "RES-MRAOS-20251118-0042",
  "inventory_reservation_id": "INV-RES-78945",
  "materials_reserved": [
    {
      "material_id": "MAT-A-1234",
      "quantity_reserved": 400,
      "batches_allocated": [
        {
          "batch_number": "BATCH-20251115-01",
          "quantity": 250,
          "location": "Aisle 12, Bin 3A"
        },
        {
          "batch_number": "BATCH-20251116-02",
          "quantity": 150,
          "location": "Aisle 12, Bin 3B"
        }
      ]
    }
  ]
}
```

##### Material Consumption Report
**Trigger**: Work order completed or material issued from inventory

**API Call**:
```
POST https://inventory-api.company.com/api/v1/transactions/consumption
```

**Payload**:
```json
{
  "transaction_id": "TXN-MRAOS-20251118-0156",
  "work_order_id": "WO-4600",
  "transaction_date": "2025-11-18T15:45:30Z",
  "materials_consumed": [
    {
      "material_id": "MAT-A-1234",
      "quantity_consumed": 405,
      "batch_number": "BATCH-20251115-01",
      "reason_code": "PRODUCTION",
      "cost_center": "CC-Manufacturing-Line2"
    }
  ]
}
```

### 6.3 Database Replication (Alternative Approach)

For high-frequency reads, MRAOS can replicate inventory data to local read-only database:

**Setup**:
1. Inventory system publishes Change Data Capture (CDC) events to Kafka
2. MRAOS consumes events and updates local `materials` table
3. Queries run against local replica (sub-millisecond response time)
4. Write operations (reservations, consumption) still go through Inventory API

**CDC Event Example**:
```json
{
  "event_type": "material.stock_updated",
  "timestamp": "2025-11-18T14:25:30.123Z",
  "material_id": "MAT-A-1234",
  "field_changed": "on_hand_quantity",
  "old_value": 500,
  "new_value": 450,
  "change_reason": "consumption",
  "transaction_id": "INV-TXN-78956"
}
```

---

## 7. Integration Error Handling

### 7.1 Error Categories & Responses

| Error Type | HTTP Code | Retry Strategy | Escalation |
|-----------|-----------|---------------|-----------|
| **Authentication Failure** | 401 | Refresh token, retry once | Alert integration admin after 3 failures |
| **Rate Limit Exceeded** | 429 | Exponential backoff (start 30s) | None (normal throttling) |
| **Validation Error** | 400 | No retry (fix payload) | Log to error queue for manual review |
| **Resource Not Found** | 404 | Retry once (may be timing issue) | Alert if critical resource |
| **Server Error** | 500-503 | Retry 3 times (5min, 15min, 30min) | Escalate after 3 failures |
| **Timeout** | 504 | Retry 2 times (1min, 5min) | Alert if repeated timeouts |
| **Network Error** | N/A | Retry 3 times (immediate, 1min, 5min) | Check connectivity |

### 7.2 Dead-Letter Queue (DLQ)

**Purpose**: Store failed integration messages for manual review and retry

**Implementation**: Kafka topic `integration-failures`

**Message Structure**:
```json
{
  "failure_id": "FAIL-20251118-0042",
  "timestamp": "2025-11-18T14:30:00Z",
  "integration_type": "erp_work_order_inbound",
  "original_message": {
    "event_type": "work_order.created",
    "work_order": { ... }
  },
  "error_details": {
    "error_code": "VALIDATION_ERROR",
    "error_message": "Material MAT-INVALID-999 not found in MRAOS database",
    "stack_trace": "..."
  },
  "retry_count": 3,
  "last_retry_at": "2025-11-18T14:45:00Z",
  "status": "pending_manual_review"
}
```

**DLQ Dashboard**:
- Web UI for integration admins to view failed messages
- Actions: Retry, Edit & Retry, Mark as Resolved, Discard
- Metrics: Failure rate by integration type, avg resolution time

### 7.3 Circuit Breaker Pattern

**Purpose**: Prevent cascading failures when external system is down

**Implementation**:
```javascript
class CircuitBreaker {
  constructor(threshold = 5, timeout = 60000) {
    this.failureCount = 0;
    this.threshold = threshold;  // Open circuit after 5 failures
    this.timeout = timeout;      // 60 seconds
    this.state = 'CLOSED';       // CLOSED, OPEN, HALF_OPEN
    this.nextAttempt = Date.now();
  }

  async call(fn) {
    if (this.state === 'OPEN') {
      if (Date.now() < this.nextAttempt) {
        throw new Error('Circuit breaker is OPEN');
      }
      this.state = 'HALF_OPEN';
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  onSuccess() {
    this.failureCount = 0;
    this.state = 'CLOSED';
  }

  onFailure() {
    this.failureCount++;
    if (this.failureCount >= this.threshold) {
      this.state = 'OPEN';
      this.nextAttempt = Date.now() + this.timeout;
    }
  }
}

// Usage
const erpCircuitBreaker = new CircuitBreaker(5, 60000);

async function callERPApi(payload) {
  return await erpCircuitBreaker.call(async () => {
    return await axios.post('https://erp.company.com/api/work-orders', payload);
  });
}
```

---

## 8. Integration Monitoring & Observability

### 8.1 Key Metrics

| Metric | Target | Alert Threshold |
|--------|--------|----------------|
| **API Latency** (p95) | <500ms | >2 seconds |
| **Message Processing Rate** | 1000/min | <500/min (sustained) |
| **Error Rate** | <1% | >5% (15-min window) |
| **Integration Lag** | <30 seconds | >5 minutes |
| **Circuit Breaker Open** | 0 | >0 (immediate alert) |

### 8.2 Monitoring Dashboard

**Grafana Dashboard Panels**:
1. **Integration Health Overview**: Green/Yellow/Red status per external system
2. **Message Throughput**: Line chart showing messages/minute (inbound vs. outbound)
3. **API Latency**: Histogram showing p50, p95, p99 latencies
4. **Error Rate**: Stacked area chart by error type
5. **Dead-Letter Queue Depth**: Gauge showing pending failed messages
6. **Data Lag**: Time difference between source system update and MRAOS reflection

### 8.3 Alerting Rules

**Critical Alerts** (PagerDuty/Opsgenie):
- ERP integration down for >5 minutes
- MES data lag >10 minutes (production impacted)
- Circuit breaker open on any integration
- Dead-letter queue depth >100 messages

**Warning Alerts** (Email/Slack):
- API latency p95 >2 seconds
- Error rate >2% over 30 minutes
- Material stock sync delayed >15 minutes

---

## 9. Security & Compliance

### 9.1 Authentication & Authorization

#### API Key Management
- Rotate API keys every 90 days
- Store in secrets manager (Azure Key Vault, AWS Secrets Manager)
- Separate keys for prod, staging, dev environments

#### OAuth 2.0 Configuration
```yaml
oauth:
  authorization_server: https://auth.company.com
  client_id: mraos_integration_client
  client_secret: ${OAUTH_CLIENT_SECRET}
  scope: erp.read erp.write mes.read hr.read inventory.readwrite
  token_endpoint: https://auth.company.com/oauth/token
  token_refresh_before_expiry_seconds: 300
```

### 9.2 Data Encryption

- **In Transit**: TLS 1.3 for all HTTPS communication
- **At Rest**: AES-256 for stored integration credentials
- **Message Broker**: SASL/SCRAM for Kafka authentication

### 9.3 Audit Logging

Log all integration transactions:
```sql
CREATE TABLE integration_audit_log (
  log_id BIGSERIAL PRIMARY KEY,
  timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
  integration_type VARCHAR(50) NOT NULL,
  direction VARCHAR(10) NOT NULL, -- 'inbound' or 'outbound'
  external_system VARCHAR(50) NOT NULL,
  
  request_payload JSONB,
  response_payload JSONB,
  http_status_code INT,
  
  processing_time_ms INT,
  success BOOLEAN NOT NULL,
  error_message TEXT,
  
  user_id VARCHAR(50),
  correlation_id VARCHAR(100)
);
```

---

## 10. Integration Testing Strategy

### 10.1 Test Environments

| Environment | Purpose | External System Connectivity |
|------------|---------|------------------------------|
| **Dev** | Developer testing | Mock APIs (WireMock) |
| **Integration** | Integration testing | Sandbox/test instances of external systems |
| **Staging** | Pre-production validation | Near-production data, test instances |
| **Production** | Live operations | Production external systems |

### 10.2 Test Scenarios

#### ERP Integration Tests
1. **Happy Path**: Create work order in ERP → Verify received in MRAOS
2. **Duplicate Handling**: Send same work order twice → Verify 409 Conflict
3. **Invalid Material**: Work order with unknown material → Verify error logged, DLQ entry created
4. **Completion Report**: Complete work order in MRAOS → Verify ERP updated
5. **Network Failure**: Simulate ERP downtime → Verify retry logic, circuit breaker

#### MES Integration Tests
1. **Real-Time Status**: Simulate machine status change → Verify MRAOS updated within 1 second
2. **Production Count**: Simulate 100 units produced → Verify work order progress updated
3. **Downtime Event**: Simulate machine breakdown → Verify alert triggered
4. **Connection Loss**: Disconnect OPC-UA → Verify reconnection and message buffering

### 10.3 Mock Services

**WireMock Configuration** (for dev environment):
```json
{
  "request": {
    "method": "POST",
    "urlPath": "/api/v1/work-orders"
  },
  "response": {
    "status": 200,
    "jsonBody": {
      "status": "success",
      "mraos_work_order_id": "WO-MOCK-001",
      "erp_work_order_id": "WO-ERP-MOCK-001"
    },
    "headers": {
      "Content-Type": "application/json"
    },
    "fixedDelayMilliseconds": 200
  }
}
```

---

## 11. Integration Roadmap

### Phase 1: Foundation (Months 1-3)
- ✅ ERP integration (work orders, material master)
- ✅ MES integration (machine status, production counts)
- ✅ Basic error handling and retry logic
- ✅ Integration monitoring dashboard

### Phase 2: Enhanced Features (Months 4-6)
- HR integration (shift schedules, attendance)
- Inventory integration (real-time reservations)
- Dead-letter queue and manual review UI
- Circuit breaker implementation

### Phase 3: Advanced Integration (Months 7-9)
- Predictive data quality checks (ML-based anomaly detection)
- Event-driven architecture (full Kafka implementation)
- Multi-region data replication
- Advanced analytics (integration performance insights)

---

## 12. Appendices

### Appendix A: API Endpoint Catalog

| External System | Endpoint | Method | Purpose |
|----------------|----------|--------|---------|
| ERP (SAP) | `/api/v1/work-orders` | POST | Create/update work order |
| ERP (SAP) | `/api/v1/materials` | GET | Retrieve material master data |
| MES (Siemens) | `/api/v1/work-orders/start` | POST | Signal work order start |
| HR (Workday) | `/api/v1/employees` | GET | Retrieve employee data |
| HR (Workday) | `/api/v1/schedules` | GET | Retrieve shift schedules |
| Inventory (WMS) | `/api/v1/reservations` | POST | Reserve materials |
| Inventory (WMS) | `/api/v1/stock-levels` | GET | Query stock levels |

### Appendix B: Message Formats

**Standard Message Envelope**:
```json
{
  "version": "1.0",
  "message_id": "msg_20251118_142345_abc123",
  "timestamp": "2025-11-18T14:23:45.678Z",
  "source_system": "MRAOS",
  "destination_system": "ERP",
  "correlation_id": "corr_xyz789",
  "payload": { ... }
}
```

### Appendix C: Error Codes

| Code | Description | Recommended Action |
|------|-------------|-------------------|
| `INT-001` | Authentication failure | Check credentials |
| `INT-002` | Rate limit exceeded | Implement backoff |
| `INT-003` | Validation error | Fix payload schema |
| `INT-004` | Resource not found | Verify IDs |
| `INT-005` | Timeout | Check network/service health |
| `INT-006` | Circuit breaker open | Wait for recovery |

---

**Document Approval**:
- Integration Architect: ___________________
- IT Director: ___________________
- Manufacturing Operations Manager: ___________________

**Next Steps**:
1. Review and approve integration specifications
2. Coordinate with external system owners for API access
3. Set up integration test environment
4. Begin Phase 1 implementation
5. Establish integration monitoring and alerting
