# Manufacturing Resource Allocation and Optimization System (MRAOS)
## Idle Time Optimization - Algorithms & Strategies

**Version:** 1.0  
**Date:** November 18, 2025  
**Document Owner:** Senior Management - Home Appliance Manufacturing

---

## 1. Executive Summary

This document specifies the algorithms, predictive models, and strategies used by MRAOS to minimize idle time across operators, machines, and materials. The system combines real-time detection, machine learning-based prediction, constraint-based optimization, and proactive reallocation to achieve a target 30% reduction in resource idle time within 6 months.

### Key Objectives
- **Predict idle time** 5-30 minutes in advance with >85% accuracy
- **Recommend optimal reallocations** that minimize total system idle time
- **Automate low-risk assignments** while maintaining supervisor oversight
- **Provide actionable insights** through visualizations and alerts
- **Continuously learn** from historical patterns to improve predictions

---

## 2. Idle Time Definition & Measurement

### 2.1 Idle Time Categories

| Resource Type | Idle Definition | Measurement Start | Exclusions |
|--------------|----------------|-------------------|-----------|
| **Operator** | No active work order assignment | 5 minutes after previous work order completion | Scheduled breaks, meetings, training |
| **Machine** | Status = "idle" and no queued work order | 10 minutes after previous work order completion | Scheduled maintenance, changeover/setup time |
| **Material** | Allocated but not consumed | 30 minutes after allocation | Transit time, staged for upcoming work orders |

### 2.2 Idle Time Metrics

#### Primary KPI: Total Idle Time
```
Total Idle Time (per shift) = Σ (Idle Duration per Resource)

For Operators:
Idle Time = (Shift End - Shift Start) - Work Time - Break Time - Unavailable Time

For Machines:
Idle Time = (Available Time) - Running Time - Maintenance Time - Setup Time
```

#### Secondary Metrics
- **Idle Time Percentage**: Idle Time / Total Available Time × 100
- **Average Idle Duration**: Total Idle Time / Number of Idle Incidents
- **Idle Frequency**: Number of times a resource became idle
- **Cost of Idle Time**: Idle Hours × Hourly Rate (for operators) or Opportunity Cost (for machines)

### 2.3 Acceptable vs. Problematic Idle Time

**Acceptable Idle Time** (not targeted for reduction):
- < 5 minutes between work orders (changeover buffer)
- End-of-shift wind-down (last 10 minutes)
- Scheduled breaks and meals
- Training and safety briefings

**Problematic Idle Time** (optimization target):
- > 15 minutes continuous idle without cause
- Repeated short idle periods (>5 per shift)
- Idle during peak production hours
- Idle while high-priority work orders are queued

---

## 3. Real-Time Idle Detection

### 3.1 Detection Algorithm

**Pseudocode**:
```python
def detect_idle_resources():
    current_time = get_current_time()
    idle_resources = []
    
    # Check all operators
    for operator in get_active_operators():
        if operator.current_status == 'available':
            idle_duration = current_time - operator.status_updated_at
            
            if idle_duration > IDLE_THRESHOLD_OPERATOR (5 minutes):
                # Exclude if on scheduled break
                if not is_on_scheduled_break(operator, current_time):
                    idle_resources.append({
                        'type': 'operator',
                        'resource_id': operator.operator_id,
                        'idle_duration_minutes': idle_duration.total_seconds() / 60,
                        'last_assignment': operator.last_work_order_id,
                        'location': operator.home_location
                    })
    
    # Check all machines
    for machine in get_active_machines():
        if machine.current_status == 'idle':
            idle_duration = current_time - machine.status_updated_at
            
            if idle_duration > IDLE_THRESHOLD_MACHINE (10 minutes):
                # Exclude if scheduled maintenance imminent
                if not has_upcoming_maintenance(machine, within_minutes=30):
                    idle_resources.append({
                        'type': 'machine',
                        'resource_id': machine.machine_id,
                        'idle_duration_minutes': idle_duration.total_seconds() / 60,
                        'last_work_order': machine.last_work_order_id,
                        'production_line': machine.production_line
                    })
    
    return idle_resources

# Run every 2 minutes
schedule.every(2).minutes.do(detect_idle_resources)
```

### 3.2 Idle Alert Triggers

**Trigger Conditions**:
1. **Immediate Alert** (Orange): Resource idle for >10 minutes
2. **Critical Alert** (Red): Resource idle for >30 minutes
3. **Pattern Alert** (Yellow): Resource has been idle >3 times in current shift

**Alert Content**:
```json
{
  "alert_id": "IDLE-20251118-0042",
  "timestamp": "2025-11-18T14:25:00Z",
  "severity": "high",
  "resource_type": "operator",
  "resource_id": "O-156",
  "resource_name": "John Doe",
  "idle_duration_minutes": 12,
  "idle_start_time": "2025-11-18T14:13:00Z",
  "last_assignment": "WO-4521",
  "location": "Line 2, Zone A",
  "suggested_actions": [
    {
      "action": "assign_to_work_order",
      "work_order_id": "WO-4600",
      "confidence_score": 0.92,
      "expected_idle_time_saved_minutes": 45
    }
  ]
}
```

---

## 4. Predictive Idle Time Model

### 4.1 Machine Learning Approach

#### Model Type: Gradient Boosting (XGBoost)

**Prediction Target**: Binary classification + regression
- **Classification**: Will resource be idle in next X minutes? (Yes/No)
- **Regression**: Expected idle duration in minutes

**Prediction Horizons**:
- 5 minutes ahead (high confidence, immediate action)
- 10 minutes ahead (medium confidence, proactive planning)
- 20 minutes ahead (lower confidence, strategic planning)
- 30 minutes ahead (trend identification)

### 4.2 Feature Engineering

#### Input Features (40+ features)

**Resource-Specific Features**:
```python
operator_features = [
    'current_work_order_progress_pct',       # 0-100%
    'estimated_time_to_completion_min',      # Minutes remaining
    'average_task_duration_this_operator',   # Historical avg (minutes)
    'variance_task_duration',                # Consistency metric
    'operator_efficiency_rating',            # 0-5 scale
    'num_work_orders_completed_today',       # Count
    'total_work_time_today_hours',           # Hours
    'num_idle_incidents_today',              # Count
    'avg_idle_duration_today_min',           # Average minutes
    'skill_match_current_task',              # 0-1 (perfect match = 1)
    'operator_experience_years',             # Tenure
    'shift_hours_remaining',                 # Time left in shift
]

machine_features = [
    'current_work_order_progress_pct',
    'estimated_time_to_completion_min',
    'machine_utilization_last_hour_pct',    # Rolling utilization
    'machine_oee_today_pct',                 # Overall Equipment Effectiveness
    'num_breakdowns_last_7_days',            # Reliability metric
    'avg_cycle_time_seconds',                # Performance metric
    'time_since_last_maintenance_hours',     # Wear indicator
    'next_maintenance_hours_away',           # Future availability
    'machine_type',                          # Categorical: one-hot encoded
    'production_line',                       # Categorical
]

work_order_features = [
    'num_queued_work_orders_matching_skills',  # Work available
    'num_queued_work_orders_high_priority',    # Urgency
    'avg_setup_time_for_queued_work_min',      # Changeover time
    'material_availability_score',             # 0-1 (all available = 1)
]

temporal_features = [
    'hour_of_day',                           # 0-23
    'day_of_week',                           # 1-7 (Monday=1)
    'is_shift_start',                        # Boolean (first hour)
    'is_shift_end',                          # Boolean (last hour)
    'time_into_shift_minutes',               # Minutes since shift start
    'is_high_demand_period',                 # Boolean (historical peak hours)
]

contextual_features = [
    'num_operators_available_same_line',     # Resource pool depth
    'num_machines_idle_same_line',           # Parallel idle risk
    'shift_target_vs_actual_progress_pct',   # Behind/ahead of schedule
    'avg_idle_time_same_hour_historical',    # Seasonal pattern
]
```

### 4.3 Training Data Preparation

#### Historical Data Collection (6 months minimum)
```sql
SELECT 
    -- Target variable
    CASE 
        WHEN LEAD(o.current_status, 1) OVER (PARTITION BY o.operator_id ORDER BY osh.timestamp) = 'available'
             AND LEAD(osh.timestamp, 1) OVER (PARTITION BY o.operator_id ORDER BY osh.timestamp) - osh.timestamp > INTERVAL '5 minutes'
        THEN 1
        ELSE 0
    END AS will_be_idle_in_5min,
    
    -- Features
    wo.progress_percentage,
    wo.estimated_duration_minutes - EXTRACT(EPOCH FROM (NOW() - a.actual_start_time))/60 AS est_time_remaining,
    o.efficiency_rating,
    COUNT(a2.allocation_id) FILTER (WHERE a2.allocated_at::DATE = CURRENT_DATE) AS work_orders_today,
    -- ... (40+ features)
    
FROM operators o
JOIN operator_status_history osh ON o.operator_id = osh.operator_id
LEFT JOIN allocations a ON o.operator_id = a.operator_id AND a.status = 'active'
LEFT JOIN work_orders wo ON a.work_order_id = wo.work_order_id
WHERE osh.timestamp >= NOW() - INTERVAL '6 months'
ORDER BY o.operator_id, osh.timestamp;
```

#### Label Generation
- Positive class (1): Resource became idle within prediction horizon
- Negative class (0): Resource remained busy or completed task and immediately reassigned
- Class balancing: Use SMOTE (Synthetic Minority Over-sampling) if idle events <10%

### 4.4 Model Training

#### Training Pipeline
```python
import xgboost as xgb
from sklearn.model_selection import TimeSeriesSplit
from sklearn.metrics import precision_score, recall_score, f1_score

# Load training data
X_train, y_train = load_training_data(start_date='2024-05-18', end_date='2024-11-18')

# Hyperparameters (tuned via grid search)
params = {
    'objective': 'binary:logistic',
    'eval_metric': 'logloss',
    'max_depth': 6,
    'learning_rate': 0.05,
    'n_estimators': 500,
    'subsample': 0.8,
    'colsample_bytree': 0.8,
    'scale_pos_weight': 5,  # Handle class imbalance
    'min_child_weight': 3,
    'gamma': 0.1,
}

# Time-series cross-validation (5 folds)
tscv = TimeSeriesSplit(n_splits=5)
cv_scores = []

for train_idx, val_idx in tscv.split(X_train):
    X_tr, X_val = X_train.iloc[train_idx], X_train.iloc[val_idx]
    y_tr, y_val = y_train.iloc[train_idx], y_train.iloc[val_idx]
    
    model = xgb.XGBClassifier(**params)
    model.fit(X_tr, y_tr, 
              eval_set=[(X_val, y_val)],
              early_stopping_rounds=20,
              verbose=False)
    
    y_pred = model.predict(X_val)
    cv_scores.append({
        'precision': precision_score(y_val, y_pred),
        'recall': recall_score(y_val, y_pred),
        'f1': f1_score(y_val, y_pred)
    })

print(f"Average CV F1 Score: {np.mean([s['f1'] for s in cv_scores]):.3f}")

# Train final model on all data
final_model = xgb.XGBClassifier(**params)
final_model.fit(X_train, y_train)

# Save model
final_model.save_model('models/idle_time_predictor_v1.json')
```

### 4.5 Model Performance Targets

| Metric | Target | Rationale |
|--------|--------|-----------|
| **Precision** (5-min horizon) | >80% | Minimize false alerts (alert fatigue) |
| **Recall** (5-min horizon) | >85% | Catch most idle events |
| **F1 Score** | >82% | Balanced performance |
| **Inference Time** | <500ms | Real-time prediction requirement |
| **Model Re-training** | Weekly | Adapt to changing patterns |

### 4.6 Online Prediction

#### Real-Time Scoring Service
```python
import redis
import json

# Initialize model and cache
model = xgb.XGBClassifier()
model.load_model('models/idle_time_predictor_v1.json')
redis_client = redis.Redis(host='localhost', port=6379)

def predict_idle_time(resource_id, resource_type, horizon_minutes=5):
    """
    Predict probability of resource becoming idle within specified horizon.
    
    Returns:
        {
            'resource_id': str,
            'prediction_time': timestamp,
            'horizon_minutes': int,
            'idle_probability': float (0-1),
            'will_be_idle': bool,
            'expected_idle_duration_min': float,
            'confidence': str ('high'|'medium'|'low')
        }
    """
    # Check cache first (TTL 60 seconds)
    cache_key = f"prediction:{resource_type}:{resource_id}:{horizon_minutes}"
    cached = redis_client.get(cache_key)
    if cached:
        return json.loads(cached)
    
    # Extract features
    features = extract_features(resource_id, resource_type)
    
    # Predict
    X = pd.DataFrame([features])
    idle_probability = model.predict_proba(X)[0][1]
    will_be_idle = idle_probability > 0.7  # Threshold tuned for precision/recall balance
    
    # Estimate idle duration (separate regression model)
    expected_idle_duration = predict_idle_duration(features) if will_be_idle else 0
    
    # Confidence level
    confidence = (
        'high' if idle_probability > 0.85 else
        'medium' if idle_probability > 0.7 else
        'low'
    )
    
    result = {
        'resource_id': resource_id,
        'prediction_time': datetime.now().isoformat(),
        'horizon_minutes': horizon_minutes,
        'idle_probability': round(idle_probability, 3),
        'will_be_idle': will_be_idle,
        'expected_idle_duration_min': round(expected_idle_duration, 1),
        'confidence': confidence
    }
    
    # Cache result
    redis_client.setex(cache_key, 60, json.dumps(result))
    
    return result

# Run predictions every 2 minutes for all active resources
def batch_predict():
    operators = get_active_operators()
    machines = get_active_machines()
    
    predictions = []
    for op in operators:
        predictions.append(predict_idle_time(op.operator_id, 'operator', horizon_minutes=5))
        predictions.append(predict_idle_time(op.operator_id, 'operator', horizon_minutes=10))
    
    for machine in machines:
        predictions.append(predict_idle_time(machine.machine_id, 'machine', horizon_minutes=10))
    
    # Trigger alerts for high-probability idle predictions
    high_risk_predictions = [p for p in predictions if p['idle_probability'] > 0.8]
    for pred in high_risk_predictions:
        generate_proactive_alert(pred)
    
    return predictions

schedule.every(2).minutes.do(batch_predict)
```

---

## 5. Constraint-Based Optimization

### 5.1 Optimization Problem Formulation

**Objective**: Minimize total idle time across all resources while satisfying constraints

**Decision Variables**:
- $x_{ijt}$ = 1 if operator $i$ is assigned to work order $j$ at time $t$, 0 otherwise
- $y_{kjt}$ = 1 if machine $k$ is assigned to work order $j$ at time $t$, 0 otherwise

**Objective Function**:
$$
\text{Minimize} \quad Z = \sum_{i \in Operators} \sum_{t \in Time} IdleTime_{it} + \sum_{k \in Machines} \sum_{t \in Time} IdleTime_{kt}
$$

**Constraints**:

1. **Operator Capacity**: Each operator can work on at most one work order at a time
$$
\sum_{j \in WorkOrders} x_{ijt} \leq 1 \quad \forall i, t
$$

2. **Machine Capacity**: Each machine can process at most one work order at a time
$$
\sum_{j \in WorkOrders} y_{kjt} \leq 1 \quad \forall k, t
$$

3. **Skill Requirements**: Operator must have required skills for work order
$$
x_{ijt} \leq SkillMatch_{ij} \quad \forall i, j, t
$$

4. **Work Order Completion**: Each work order must be assigned required resources
$$
\sum_{i \in Operators} x_{ijt} \geq OperatorsRequired_j \quad \forall j, t
$$

5. **Shift Constraints**: Assignments must be within operator's shift
$$
x_{ijt} = 0 \quad \text{if } t \notin ShiftTime_i
$$

6. **Material Availability**: Work order can only start if materials are available
$$
\sum_{i} x_{ijt} \leq MaterialAvailable_j \quad \forall j, t
$$

### 5.2 Optimization Solver

#### Using Google OR-Tools
```python
from ortools.sat.python import cp_model

def optimize_resource_allocation(operators, machines, work_orders, time_horizon_minutes=60):
    """
    Find optimal resource allocation to minimize idle time over next hour.
    """
    model = cp_model.CpModel()
    
    # Decision variables
    assignments = {}
    for op in operators:
        for wo in work_orders:
            assignments[(op.id, wo.id)] = model.NewBoolVar(f'assign_op{op.id}_wo{wo.id}')
    
    for machine in machines:
        for wo in work_orders:
            assignments[(machine.id, wo.id)] = model.NewBoolVar(f'assign_m{machine.id}_wo{wo.id}')
    
    # Constraint: Each operator assigned to at most one work order
    for op in operators:
        model.Add(sum(assignments[(op.id, wo.id)] for wo in work_orders) <= 1)
    
    # Constraint: Each machine assigned to at most one work order
    for machine in machines:
        model.Add(sum(assignments[(machine.id, wo.id)] for wo in work_orders) <= 1)
    
    # Constraint: Work order must have required resources
    for wo in work_orders:
        if wo.requires_operator:
            model.Add(sum(assignments[(op.id, wo.id)] for op in operators if has_required_skills(op, wo)) >= 1)
        if wo.requires_machine:
            model.Add(sum(assignments[(machine.id, wo.id)] for machine in machines if can_produce(machine, wo)) >= 1)
    
    # Objective: Minimize idle time (maximize assignments)
    model.Maximize(sum(assignments.values()))
    
    # Solve
    solver = cp_model.CpSolver()
    solver.parameters.max_time_in_seconds = 5.0  # 5-second timeout
    status = solver.Solve(model)
    
    if status == cp_model.OPTIMAL or status == cp_model.FEASIBLE:
        # Extract solution
        recommended_assignments = []
        for (resource_id, wo_id), var in assignments.items():
            if solver.Value(var) == 1:
                recommended_assignments.append({
                    'resource_id': resource_id,
                    'work_order_id': wo_id,
                    'assignment_type': 'operator' if resource_id.startswith('O') else 'machine'
                })
        return recommended_assignments
    else:
        return []  # No feasible solution found

# Generate recommendations every 5 minutes
def generate_reallocation_suggestions():
    operators = get_available_operators()
    machines = get_idle_machines()
    work_orders = get_queued_work_orders()
    
    recommendations = optimize_resource_allocation(operators, machines, work_orders)
    
    for rec in recommendations:
        create_suggestion_alert(rec)
```

### 5.3 Heuristic Approaches (Fallback)

If optimization solver times out or is unavailable, use greedy heuristic:

**Greedy Assignment Algorithm**:
```python
def greedy_assign_resources():
    """
    Simple greedy algorithm: Assign highest-priority work order to best-matching available resource.
    """
    work_orders = get_queued_work_orders(order_by='priority DESC, due_date ASC')
    
    for wo in work_orders:
        # Find best operator
        if wo.requires_operator:
            available_operators = get_available_operators_with_skills(wo.required_skills)
            if available_operators:
                # Score operators by skill match, proximity, performance
                best_operator = max(available_operators, key=lambda op: score_operator(op, wo))
                suggest_assignment(best_operator, wo)
        
        # Find best machine
        if wo.requires_machine:
            available_machines = get_idle_machines_by_type(wo.required_machine_type)
            if available_machines:
                best_machine = min(available_machines, key=lambda m: m.utilization_percentage)
                suggest_assignment(best_machine, wo)

def score_operator(operator, work_order):
    """Score operator for work order (0-100)."""
    skill_match_score = calculate_skill_match(operator.skills, work_order.required_skills) * 50
    proximity_score = (1 - distance(operator.location, work_order.location) / MAX_DISTANCE) * 20
    performance_score = operator.efficiency_rating / 5.0 * 20
    availability_score = (8 - operator.hours_worked_today) / 8 * 10
    
    return skill_match_score + proximity_score + performance_score + availability_score
```

---

## 6. Proactive Reallocation Strategies

### 6.1 Pre-Allocation

**Concept**: Assign next work order before current work order completes

**Trigger**: Current work order reaches 80% completion

**Algorithm**:
```python
def pre_allocate_next_work_order(operator_id):
    """
    Pre-assign operator to next work order when current task is 80% complete.
    """
    current_allocation = get_current_allocation(operator_id)
    if not current_allocation:
        return
    
    wo = get_work_order(current_allocation.work_order_id)
    if wo.progress_percentage >= 80:
        # Find best matching queued work order
        queued_work_orders = get_queued_work_orders_matching_skills(operator_id)
        
        if queued_work_orders:
            next_wo = queued_work_orders[0]  # Highest priority
            
            # Create pre-allocation (status = 'pre_assigned')
            create_pre_allocation(
                operator_id=operator_id,
                work_order_id=next_wo.work_order_id,
                expected_start_time=current_allocation.expected_end_time,
                allocation_method='automated_pre_allocation'
            )
            
            notify_supervisor(f"Operator {operator_id} pre-assigned to WO {next_wo.work_order_id}")
```

**Benefits**:
- Eliminates transition idle time (reduces 5-15 min idle per operator per shift)
- Supervisor can override if needed (maintains control)

### 6.2 Dynamic Work Order Prioritization

**Adjust work order priority based on idle time risk**:

```python
def adjust_work_order_priorities():
    """
    Boost priority of work orders that can utilize soon-to-be-idle resources.
    """
    idle_predictions = get_idle_predictions(horizon_minutes=15, probability_threshold=0.7)
    
    for prediction in idle_predictions:
        # Find work orders matching this resource's capabilities
        matching_work_orders = get_matching_work_orders(
            resource_id=prediction['resource_id'],
            resource_type=prediction['resource_type']
        )
        
        for wo in matching_work_orders:
            # Boost priority if this work order can prevent idle time
            if wo.priority < 'high':
                boost_priority(wo.work_order_id, reason='idle_time_prevention')
                log_priority_change(wo.work_order_id, 'Boosted to prevent idle time')
```

### 6.3 Skill-Based Workload Balancing

**Prevent clustering of work orders requiring rare skills**:

```python
def balance_skill_based_workload():
    """
    Distribute work orders requiring specialized skills across shifts to prevent skill bottlenecks.
    """
    specialized_skills = get_specialized_skills(required_by_min_work_orders=5)
    
    for skill in specialized_skills:
        operators_with_skill = get_operators_by_skill(skill)
        work_orders_requiring_skill = get_work_orders_by_skill(skill)
        
        if len(work_orders_requiring_skill) > len(operators_with_skill) * 3:
            # Too many work orders for available skilled operators
            alert = {
                'type': 'skill_bottleneck',
                'skill': skill,
                'num_operators': len(operators_with_skill),
                'num_work_orders': len(work_orders_requiring_skill),
                'recommendation': 'Reschedule some work orders to next shift or cross-train operators'
            }
            send_alert_to_manager(alert)
```

---

## 7. Idle Time Visualization & Reporting

### 7.1 Idle Time Heat Map

**Visual Representation**:
- Factory floor layout divided into zones
- Each zone color-coded by idle time risk
- Updated every 2 minutes

**Calculation**:
```python
def generate_idle_time_heatmap():
    """
    Create heat map showing idle time risk by factory zone.
    """
    zones = get_factory_zones()
    heatmap_data = []
    
    for zone in zones:
        operators_in_zone = get_operators_by_location(zone.id)
        machines_in_zone = get_machines_by_location(zone.id)
        
        # Get idle predictions for this zone
        idle_predictions = [
            predict_idle_time(op.operator_id, 'operator', horizon_minutes=10)
            for op in operators_in_zone
        ] + [
            predict_idle_time(m.machine_id, 'machine', horizon_minutes=10)
            for m in machines_in_zone
        ]
        
        # Calculate zone-level idle risk (weighted average)
        avg_idle_probability = sum(p['idle_probability'] for p in idle_predictions) / len(idle_predictions)
        
        heatmap_data.append({
            'zone_id': zone.id,
            'zone_name': zone.name,
            'idle_risk_percentage': round(avg_idle_probability * 100, 1),
            'color': get_color_by_risk(avg_idle_probability),  # Green/Yellow/Red
            'num_resources': len(operators_in_zone) + len(machines_in_zone),
            'high_risk_resources': len([p for p in idle_predictions if p['idle_probability'] > 0.8])
        })
    
    return heatmap_data

def get_color_by_risk(probability):
    """Map idle probability to color."""
    if probability < 0.05:
        return '#00A86B'  # Green
    elif probability < 0.15:
        return '#FFA500'  # Orange
    else:
        return '#DC3545'  # Red
```

### 7.2 Idle Time Trend Analysis

**Daily Report** (sent to managers at 11 PM):
```sql
-- Daily idle time summary
SELECT 
    DATE(shift_date) AS report_date,
    production_line,
    
    -- Operator metrics
    COUNT(DISTINCT operator_id) AS total_operators,
    SUM(idle_time_minutes) AS total_operator_idle_minutes,
    AVG(idle_time_minutes) AS avg_operator_idle_minutes,
    
    -- Machine metrics
    COUNT(DISTINCT machine_id) AS total_machines,
    SUM(machine_idle_minutes) AS total_machine_idle_minutes,
    AVG(machine_idle_minutes) AS avg_machine_idle_minutes,
    
    -- Overall metrics
    SUM(idle_time_minutes + machine_idle_minutes) AS total_idle_minutes,
    ROUND(SUM(idle_time_minutes + machine_idle_minutes) / (COUNT(DISTINCT operator_id) + COUNT(DISTINCT machine_id)) / 480 * 100, 2) AS idle_percentage,
    
    -- Comparison to baseline (6 months ago)
    ROUND((SUM(idle_time_minutes) - LAG(SUM(idle_time_minutes), 180) OVER (ORDER BY DATE(shift_date))) / LAG(SUM(idle_time_minutes), 180) OVER (ORDER BY DATE(shift_date)) * 100, 1) AS pct_change_vs_baseline

FROM (
    SELECT 
        o.operator_id,
        NULL AS machine_id,
        os.shift_date,
        o.production_line,
        EXTRACT(EPOCH FROM (os.actual_clock_out - os.actual_clock_in))/60 - 
        COALESCE((SELECT SUM(actual_duration_minutes) FROM allocations WHERE operator_id = o.operator_id AND DATE(allocated_at) = os.shift_date), 0) AS idle_time_minutes,
        0 AS machine_idle_minutes
    FROM operators o
    JOIN operator_shifts os ON o.operator_id = os.operator_id
    WHERE os.shift_date >= CURRENT_DATE - INTERVAL '7 days'
    
    UNION ALL
    
    SELECT 
        NULL AS operator_id,
        m.machine_id,
        CURRENT_DATE AS shift_date,
        m.production_line,
        0 AS idle_time_minutes,
        SUM(CASE WHEN msh.status = 'idle' THEN msh.duration_minutes ELSE 0 END) AS machine_idle_minutes
    FROM machines m
    JOIN machine_status_history msh ON m.machine_id = msh.machine_id
    WHERE msh.started_at >= CURRENT_DATE - INTERVAL '7 days'
    GROUP BY m.machine_id, m.production_line
) AS idle_data
GROUP BY DATE(shift_date), production_line
ORDER BY report_date DESC, production_line;
```

### 7.3 Idle Time Root Cause Analysis

**Automated RCA Algorithm**:
```python
def analyze_idle_time_root_causes(date_range):
    """
    Identify primary causes of idle time during specified period.
    """
    idle_events = get_idle_events(date_range)
    
    root_causes = {
        'material_shortage': 0,
        'machine_breakdown': 0,
        'skill_mismatch': 0,
        'scheduling_gap': 0,
        'quality_issue': 0,
        'other': 0
    }
    
    for event in idle_events:
        # Check if material shortage occurred around same time
        if check_material_shortage(event.resource_id, event.timestamp, within_minutes=30):
            root_causes['material_shortage'] += event.duration_minutes
        
        # Check if machine breakdown affected this resource
        elif check_machine_breakdown(event.location, event.timestamp, within_minutes=30):
            root_causes['machine_breakdown'] += event.duration_minutes
        
        # Check if no queued work orders matched skills
        elif check_skill_mismatch(event.resource_id, event.timestamp):
            root_causes['skill_mismatch'] += event.duration_minutes
        
        # Check if work order queue was empty
        elif check_empty_queue(event.location, event.timestamp):
            root_causes['scheduling_gap'] += event.duration_minutes
        
        # Check if quality hold affected production
        elif check_quality_hold(event.timestamp, within_minutes=30):
            root_causes['quality_issue'] += event.duration_minutes
        
        else:
            root_causes['other'] += event.duration_minutes
    
    # Calculate percentages
    total_idle_time = sum(root_causes.values())
    root_cause_percentages = {
        cause: round(minutes / total_idle_time * 100, 1)
        for cause, minutes in root_causes.items()
    }
    
    return {
        'total_idle_minutes': total_idle_time,
        'root_causes_breakdown': root_cause_percentages,
        'top_cause': max(root_cause_percentages, key=root_cause_percentages.get)
    }
```

---

## 8. Continuous Improvement

### 8.1 Model Retraining Pipeline

**Frequency**: Weekly (every Sunday at 2 AM)

**Process**:
```python
def retrain_idle_time_model():
    """
    Weekly retraining using latest 6 months of data.
    """
    # Extract fresh training data
    X_train, y_train = extract_training_data(
        start_date=date.today() - timedelta(days=180),
        end_date=date.today()
    )
    
    # Retrain model
    new_model = xgb.XGBClassifier(**params)
    new_model.fit(X_train, y_train)
    
    # Evaluate on holdout set (last 2 weeks)
    X_test, y_test = extract_training_data(
        start_date=date.today() - timedelta(days=14),
        end_date=date.today()
    )
    y_pred = new_model.predict(X_test)
    
    new_f1_score = f1_score(y_test, y_pred)
    
    # Compare to current production model
    current_model = load_production_model()
    y_pred_current = current_model.predict(X_test)
    current_f1_score = f1_score(y_test, y_pred_current)
    
    # Deploy new model if it performs better
    if new_f1_score > current_f1_score:
        deploy_model(new_model, version=get_next_version())
        log_model_deployment(new_f1_score, current_f1_score)
    else:
        log_model_retraining_skipped(new_f1_score, current_f1_score)
```

### 8.2 A/B Testing

**Test new allocation strategies against baseline**:

```python
def ab_test_allocation_strategy(new_strategy_func, test_duration_days=14):
    """
    Run A/B test: 50% of supervisors use new strategy, 50% use current strategy.
    """
    supervisors = get_all_supervisors()
    
    # Random assignment to control/test groups
    random.shuffle(supervisors)
    control_group = supervisors[:len(supervisors)//2]
    test_group = supervisors[len(supervisors)//2:]
    
    # Enable new strategy for test group
    for supervisor in test_group:
        enable_feature_flag(supervisor.id, 'new_allocation_strategy', enabled=True)
    
    # Monitor metrics over test period
    sleep_days(test_duration_days)
    
    # Collect results
    control_metrics = calculate_idle_time_metrics(control_group, last_n_days=test_duration_days)
    test_metrics = calculate_idle_time_metrics(test_group, last_n_days=test_duration_days)
    
    # Statistical significance test (t-test)
    t_stat, p_value = scipy.stats.ttest_ind(control_metrics, test_metrics)
    
    if p_value < 0.05 and test_metrics.mean() < control_metrics.mean():
        # New strategy is significantly better
        rollout_to_all_supervisors('new_allocation_strategy')
        log_ab_test_result('success', test_metrics.mean(), control_metrics.mean())
    else:
        # No significant improvement
        disable_feature_flag('new_allocation_strategy')
        log_ab_test_result('no_improvement', test_metrics.mean(), control_metrics.mean())
```

### 8.3 Feedback Loop

**Collect supervisor feedback on AI suggestions**:

```python
def log_suggestion_feedback(suggestion_id, accepted, feedback_text=None):
    """
    Log whether supervisor accepted/rejected AI suggestion and why.
    """
    INSERT INTO suggestion_feedback (
        suggestion_id,
        timestamp,
        accepted,
        feedback_text,
        supervisor_id
    ) VALUES (
        suggestion_id,
        NOW(),
        accepted,
        feedback_text,
        get_current_supervisor_id()
    );
    
    # If rejected, analyze reason and adjust model
    if not accepted and feedback_text:
        analyze_rejection_reason(feedback_text)

def analyze_rejection_reason(feedback_text):
    """
    Use NLP to categorize rejection reasons and adjust model.
    """
    rejection_categories = {
        'skill_mismatch': ['skill', 'certification', 'not qualified'],
        'workload_concern': ['overworked', 'too busy', 'overtime'],
        'proximity': ['too far', 'different area', 'location'],
        'other': []
    }
    
    # Simple keyword matching (could use NLP model)
    for category, keywords in rejection_categories.items():
        if any(kw in feedback_text.lower() for kw in keywords):
            log_rejection_category(category)
            
            # Adjust model weights based on category
            if category == 'skill_mismatch':
                increase_skill_match_weight()
            elif category == 'proximity':
                increase_proximity_weight()
```

---

## 9. Success Metrics & KPIs

### 9.1 Primary KPIs

| Metric | Baseline (Month 0) | Target (Month 6) | Measurement Frequency |
|--------|-------------------|------------------|----------------------|
| **Total Idle Time (hrs/shift)** | 120 | 84 (30% reduction) | Daily |
| **Idle Time per Operator (min/shift)** | 25 | 17.5 | Daily |
| **Idle Time per Machine (min/shift)** | 45 | 31.5 | Daily |
| **Prediction Accuracy (F1 Score)** | N/A | >82% | Weekly |
| **Suggestion Acceptance Rate** | N/A | >60% | Weekly |
| **Time to Reallocate (avg)** | 8 min | 3 min | Daily |

### 9.2 Secondary KPIs

- **Work Order On-Time Completion Rate**: Target >90%
- **Resource Utilization %**: Target >85%
- **Cost Savings from Idle Reduction**: Calculate monthly
- **Supervisor Productivity**: Work orders managed per supervisor (target +40%)

### 9.3 Dashboard

**Real-Time KPI Dashboard** (Grafana/Power BI):
```
┌─────────────────────────────────────────────────────────────┐
│  Idle Time Optimization - Live Dashboard                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Current Shift Idle Time:  32.5 hrs  [▼ 28% vs baseline]  │
│  Predicted Idle (next hour): 8.3 hrs                        │
│  Active Alerts: 5          Resolved Today: 12              │
│                                                             │
│  ┌────────────────────────────────────────────────────┐   │
│  │  Idle Time Trend (Last 7 Days)                     │   │
│  │  [Line chart showing daily idle hours]             │   │
│  └────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌────────────────────────────────────────────────────┐   │
│  │  Root Causes Breakdown (This Week)                 │   │
│  │  [Pie chart: Material Shortage 35%, Machine        │   │
│  │   Breakdown 25%, Scheduling Gap 20%, Other 20%]    │   │
│  └────────────────────────────────────────────────────┘   │
│                                                             │
│  Model Performance:                                         │
│  Prediction Accuracy (F1): 84.2%  [✓ Above target]        │
│  Suggestion Acceptance:    67%    [✓ Above target]        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 10. Implementation Checklist

### Phase 1: Foundation (Weeks 1-4)
- [ ] Implement real-time idle detection (5-min threshold)
- [ ] Set up alert system (in-app + email)
- [ ] Create idle time tracking database tables
- [ ] Build basic idle time dashboard

### Phase 2: Predictive Model (Weeks 5-12)
- [ ] Collect 6 months historical data
- [ ] Feature engineering and data preprocessing
- [ ] Train initial XGBoost model
- [ ] Deploy prediction service (API + scheduled batch)
- [ ] Integrate predictions into UI

### Phase 3: Optimization Engine (Weeks 13-18)
- [ ] Implement constraint-based optimizer (OR-Tools)
- [ ] Build greedy heuristic fallback
- [ ] Create suggestion generation pipeline
- [ ] Add "Apply Suggestion" one-click action

### Phase 4: Proactive Strategies (Weeks 19-24)
- [ ] Implement pre-allocation logic
- [ ] Build dynamic work order prioritization
- [ ] Add skill-based workload balancing
- [ ] Create idle time heat map visualization

### Phase 5: Continuous Improvement (Ongoing)
- [ ] Set up weekly model retraining pipeline
- [ ] Implement A/B testing framework
- [ ] Build supervisor feedback collection
- [ ] Create monthly optimization reports

---

**Document Approval**:
- Data Science Lead: ___________________
- Manufacturing Operations Manager: ___________________
- IT Director: ___________________

**Next Steps**:
1. Review and approve idle time optimization strategy
2. Allocate resources for ML model development
3. Begin historical data collection and feature engineering
4. Set up initial idle detection and alerting
5. Define success metrics and establish baseline measurements
