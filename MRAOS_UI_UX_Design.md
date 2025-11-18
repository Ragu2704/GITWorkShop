# Manufacturing Resource Allocation and Optimization System (MRAOS)
## UI/UX Design Specification

**Version:** 1.0  
**Date:** November 18, 2025  
**Document Owner:** Senior Management - Home Appliance Manufacturing

---

## 1. Executive Summary

This document defines the user interface and user experience design for MRAOS, focusing on intuitive interaction patterns optimized for manufacturing supervisors on the factory floor. The design prioritizes speed, simplicity, and touch-friendly interactions suitable for tablet devices in industrial environments.

### Design Philosophy
- **Mobile-First**: Optimized for 10-12 inch rugged tablets
- **Touch-Optimized**: Large touch targets (minimum 44x44px), gesture support
- **Visual Clarity**: High contrast, color-coded status indicators
- **Minimal Navigation**: Maximum information with minimal clicks
- **Real-Time Feedback**: Immediate visual confirmation of all actions
- **Progressive Disclosure**: Show essentials first, details on demand

---

## 2. Design System

### 2.1 Color Palette

#### Primary Colors
- **Brand Primary**: #0066CC (Blue) - Primary actions, headers
- **Brand Secondary**: #00A86B (Jade Green) - Success states, available resources
- **Accent**: #FF6B35 (Vibrant Orange) - Alerts, call-to-action

#### Status Colors
- **Success/Available**: #00A86B (Green)
- **Warning/Caution**: #FFA500 (Orange)
- **Error/Critical**: #DC3545 (Red)
- **Info/Neutral**: #17A2B8 (Cyan)
- **Inactive/Disabled**: #6C757D (Gray)

#### Background Colors
- **Primary Background**: #F8F9FA (Light Gray)
- **Card Background**: #FFFFFF (White)
- **Header Background**: #2C3E50 (Dark Blue-Gray)
- **Hover State**: #E9ECEF (Slightly Darker Gray)
- **Selected State**: #CCE5FF (Light Blue)

#### Text Colors
- **Primary Text**: #212529 (Almost Black)
- **Secondary Text**: #6C757D (Medium Gray)
- **Inverted Text**: #FFFFFF (White) - on dark backgrounds
- **Link Text**: #0066CC (Blue)

### 2.2 Typography

#### Font Family
- **Primary**: "Inter", "Segoe UI", sans-serif (clean, highly legible)
- **Monospace**: "Roboto Mono", monospace (for IDs, codes)

#### Font Sizes
| Element | Size | Weight | Use Case |
|---------|------|--------|----------|
| H1 | 32px | Bold (700) | Page titles |
| H2 | 24px | Semi-Bold (600) | Section headers |
| H3 | 20px | Semi-Bold (600) | Card titles |
| Body | 16px | Regular (400) | Standard text |
| Small | 14px | Regular (400) | Secondary info |
| Caption | 12px | Regular (400) | Timestamps, metadata |
| Button | 16px | Medium (500) | Interactive elements |

### 2.3 Spacing System
- **Base Unit**: 8px (all spacing multiples of 8)
- **XS**: 4px (tight spacing, inline elements)
- **SM**: 8px (compact spacing)
- **MD**: 16px (standard spacing)
- **LG**: 24px (generous spacing)
- **XL**: 32px (section separation)
- **XXL**: 48px (major layout divisions)

### 2.4 Component Library

#### Buttons
- **Primary Button**: Blue background, white text, 48px height
- **Secondary Button**: White background, blue border/text, 48px height
- **Danger Button**: Red background, white text (destructive actions)
- **Icon Button**: Square 48x48px, icon centered, no text
- **Floating Action Button (FAB)**: 64x64px circle, elevated shadow

#### Cards
- **Standard Card**: White background, 4px border-radius, subtle shadow
- **Resource Card**: 200x120px, includes image/icon, name, status badge
- **Work Order Card**: 280x180px, detailed info, progress bar

#### Badges
- **Status Badge**: 24px height, rounded corners, color-coded
- **Count Badge**: Circular, red background (notifications), white text
- **Priority Badge**: Star icon + text (High/Medium/Low)

#### Form Elements
- **Input Field**: 48px height, 4px border-radius, clear focus state
- **Dropdown**: 48px height, chevron icon, searchable for >10 items
- **Checkbox/Radio**: 24x24px touch target, visible check/dot
- **Toggle Switch**: 48x24px, animated slide transition

---

## 3. Screen Layouts

### 3.1 Main Dashboard (Home Screen)

#### Layout Structure
```
┌─────────────────────────────────────────────────────────────────────┐
│  [Logo] MRAOS          [Quick Stats Bar]          [User] [Alerts]  │ 
├─────────────────────────────────────────────────────────────────────┤
│  [Tab: Dashboard] [Tab: Assignments] [Tab: Reports]                 │
├────────────────────────────────────┬────────────────────────────────┤
│                                    │                                │
│  Resource Status Grid (60%)        │  Alert Panel (40%)             │
│  ┌────────────────────────────┐   │  ┌──────────────────────────┐ │
│  │ [Operators]                │   │  │ 🔴 Machine M-205 Down    │ │
│  │  - John Doe [BUSY]         │   │  │ 🟡 Op. Jane Idle in 8min │ │
│  │  - Jane Smith [AVAILABLE]  │   │  │ 🟢 WO-4521 Complete      │ │
│  │  - ...                     │   │  └──────────────────────────┘ │
│  │                            │   │                                │
│  │ [Machines]                 │   │  Work Order Queue              │
│  │  - M-201 [RUNNING 85%]     │   │  ┌──────────────────────────┐ │
│  │  - M-205 [BREAKDOWN]       │   │  │ WO-4600 [HIGH PRIORITY]  │ │
│  │  - ...                     │   │  │ Product: Washer Door     │ │
│  │                            │   │  │ Due: 2:30 PM             │ │
│  │ [Materials]                │   │  │ Status: Queued           │ │
│  │  - Part #A-1234 [50 units] │   │  │ [Assign Resources] ───>  │ │
│  │  - Part #B-5678 [LOW]      │   │  └──────────────────────────┘ │
│  └────────────────────────────┘   │                                │
│                                    │                                │
├────────────────────────────────────┴────────────────────────────────┤
│  Capacity Utilization Chart (Live)                                  │
│  [███████████████░░░░░] 75% - Current Shift                        │
└─────────────────────────────────────────────────────────────────────┘
      [Floating Action Button: Quick Actions]
```

#### Key Features
1. **Quick Stats Bar** (Top of screen, always visible):
   - Active Work Orders: **12**
   - Operators Available: **8/25**
   - Machines Running: **18/22** (82%)
   - Idle Time Today: **2.3 hrs**
   - All-color-coded (green/yellow/red based on thresholds)

2. **Resource Status Grid** (Left 60% of screen):
   - **Three Collapsible Sections**: Operators, Machines, Materials
   - Each resource shown as a **card** with:
     - Name/ID
     - Photo (operators) or icon (machines/materials)
     - Status badge (color-coded, large font)
     - Current assignment (if any)
     - Quick action button (…) menu
   - **Filtering**: Dropdown filters at top (By Line, By Shift, By Status)
   - **Search Bar**: Find resource by name/ID

3. **Alert Panel** (Right 40%):
   - **Prioritized Alert List**: Critical alerts at top
   - Each alert shows:
     - Icon indicating severity
     - Brief description
     - Timestamp (e.g., "2 min ago")
     - Action button (e.g., "Reassign", "View Details")
   - **Work Order Queue Below**: Next 3-5 queued work orders
   - Click on work order card → Expands to assignment view

4. **Capacity Utilization Chart** (Bottom strip):
   - Horizontal bar chart showing real-time utilization
   - Hover over bar segments: Tooltip shows resource details
   - Color gradient: Green (healthy) → Yellow (near capacity) → Red (overutilized)

5. **Floating Action Button** (Bottom-right corner):
   - Large circular button with "+" icon
   - Click opens Quick Action Panel (overlay menu)

#### Interaction Patterns
- **Drag-and-Drop**: Drag operator card to work order card to assign
- **Click Resource Card**: Open detailed resource view (modal)
- **Right-Click Resource**: Context menu (Assign, View History, Mark Unavailable)
- **Swipe Alert**: Swipe right to acknowledge, swipe left to snooze

#### Responsive Behavior
- **Tablet Portrait Mode**: Stack Alert Panel below Resource Grid
- **Large Display**: Expand to show more resources per section (grid layout)

---

### 3.2 Work Order Assignment View

#### Layout Structure
```
┌─────────────────────────────────────────────────────────────────────┐
│  ← Back to Dashboard                    Work Order: WO-4600         │
├─────────────────────────────────────────────────────────────────────┤
│  [Work Order Details Card]                                          │
│  Product: Washer Door Assembly                                      │
│  Quantity: 200 units | Due: Nov 18, 2:30 PM | Priority: HIGH       │
│  Progress: ████████░░░░░░░░░░ 40% (80/200 complete)                │
├────────────────────────────────────┬────────────────────────────────┤
│  Required Resources                │  Assigned Resources            │
│  ┌──────────────────────────────┐ │  ┌──────────────────────────┐ │
│  │ Operators (2 required)       │ │  │ ✅ John Doe              │ │
│  │  - Skill: Welding Level 3    │ │  │ ✅ Jane Smith            │ │
│  │  - Skill: Assembly Level 2   │ │  │                          │ │
│  │                              │ │  │ [+ Add Operator]         │ │
│  │ Machine (1 required)         │ │  └──────────────────────────┘ │
│  │  - Type: Welding Robot       │ │  ┌──────────────────────────┐ │
│  │                              │ │  │ ✅ Machine M-203         │ │
│  │ Materials                    │ │  │    (Welding Robot)       │ │
│  │  - Part #A-1234: 400 units   │ │  │                          │ │
│  │  - Part #B-5678: 200 units   │ │  │ [+ Add Machine]          │ │
│  │  - Welding Wire: 50kg        │ │  └──────────────────────────┘ │
│  └──────────────────────────────┘ │  ┌──────────────────────────┐ │
│                                    │  │ ⚠️ Part #B-5678          │ │
│                                    │  │    LOW STOCK (50 units)  │ │
│                                    │  │ ✅ Part #A-1234 (500)    │ │
│                                    │  │ ✅ Welding Wire (75kg)   │ │
│                                    │  │                          │ │
│                                    │  │ [+ Add Material]         │ │
│                                    │  └──────────────────────────┘ │
├────────────────────────────────────┴────────────────────────────────┤
│  AI Suggestions                                                     │
│  💡 Suggested Assignment: Operator Bob Wilson (Skill match: 95%,    │
│     Available now, 2-min travel time)  [Apply Suggestion] ───>     │
├─────────────────────────────────────────────────────────────────────┤
│  [Cancel]  [Save Draft]  [Start Work Order] ───────────────────>   │
└─────────────────────────────────────────────────────────────────────┘
```

#### Key Features
1. **Work Order Details Card** (Top):
   - Large, prominent display of work order info
   - Visual progress bar (real-time update)
   - Priority indicator (color-coded border)

2. **Two-Column Layout**:
   - **Left Column**: Required resources (from BOM and work order specs)
   - **Right Column**: Currently assigned resources

3. **Assignment Interface**:
   - **[+ Add Resource] Button**: Opens selection dialog
   - **Selection Dialog**:
     - Search bar at top
     - Filtered list of available resources
     - Each resource shows: Name, Status, Match % (for skills), Distance/Location
     - Click to assign
   - **Drag-and-Drop Support**: Drag resource card from dashboard to this view

4. **Validation Indicators**:
   - ✅ Green checkmark: Requirement satisfied
   - ⚠️ Yellow warning: Partial match or low stock
   - ❌ Red X: Missing required resource or validation error

5. **AI Suggestion Panel** (Bottom):
   - Intelligent recommendations based on skills, availability, proximity
   - One-click "Apply Suggestion" button

6. **Action Buttons** (Bottom-right):
   - **Cancel**: Return to dashboard without saving
   - **Save Draft**: Save assignments but don't start production
   - **Start Work Order**: Validate all assignments, notify operators, signal MES

#### Interaction Patterns
- **Reassign**: Click on assigned resource → Opens replacement selection dialog
- **Remove Assignment**: Swipe left on assigned resource card or click "X" icon
- **View Resource Details**: Click resource name → Opens modal with full details

---

### 3.3 Idle Time Optimizer View

#### Layout Structure
```
┌─────────────────────────────────────────────────────────────────────┐
│  Idle Time Optimizer                          [Filter: All Lines ▾] │
├─────────────────────────────────────────────────────────────────────┤
│  Idle Time Heat Map (Factory Floor View)                            │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │                    Line 1        Line 2        Line 3          │ │
│  │  Zone A            🟢 5%        🟡 12%       🟢 3%            │ │
│  │  Zone B            🟡 14%       🔴 22%       🟡 9%            │ │
│  │  Zone C            🟢 7%        🟢 6%        🔴 18%           │ │
│  │                                                                │ │
│  │  [Toggle: Current State] [Forecast: 10 min ahead]             │ │
│  └───────────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────────────┤
│  Active Alerts & Predictions                                        │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ 🔴 CRITICAL: Operator Jane Smith will be idle in 5 minutes    │  │
│  │    Current WO: WO-4521 (95% complete, 4 min remaining)        │  │
│  │                                                                │  │
│  │    💡 Smart Suggestions:                                       │  │
│  │    1. ⭐ Assign to WO-4600 (High Priority)                    │  │
│  │       - Skill match: 100%                                      │  │
│  │       - Travel time: 2 min                                     │  │
│  │       - Impact: Prevents 45 min idle, completes WO 30 min early│  │
│  │       [Apply Now] [Simulate Impact]                            │  │
│  │                                                                │  │
│  │    2. Assign to WO-4598 (Medium Priority)                      │  │
│  │       - Skill match: 85%                                       │  │
│  │       - Impact: Prevents 30 min idle                           │  │
│  │       [Apply Now]                                              │  │
│  └──────────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ 🟡 WARNING: Machine M-205 predicted idle in 12 minutes        │  │
│  │    No queued work orders for this machine type                 │  │
│  │    [View Queue] [Add Work Order]                               │  │
│  └──────────────────────────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────────────────────┤
│  Idle Time Trends (Last 7 Days)                                    │
│  [Line Chart showing daily idle hours]                              │
└─────────────────────────────────────────────────────────────────────┘
```

#### Key Features
1. **Idle Time Heat Map**:
   - Visual representation of factory floor layout
   - Color-coded zones based on idle time risk
   - Interactive: Click zone to see detailed resource list
   - Toggle between current state and forecasted state (10/20/30 min ahead)

2. **Active Alerts & Predictions**:
   - **Prioritized List**: Critical alerts at top
   - Each alert card includes:
     - Severity indicator (color + icon)
     - Affected resource name and current assignment
     - Time until idle condition
     - Root cause (if detected)
     - AI-generated suggestions with impact analysis
     - Action buttons (Apply Now, Simulate, Dismiss)
   
3. **Smart Suggestion Cards**:
   - **Ranked Suggestions** (⭐ indicates top recommendation)
   - **Detailed Rationale**: Skill match %, travel time, business impact
   - **One-Click Actions**: 
     - "Apply Now": Immediate assignment
     - "Simulate Impact": Opens what-if analysis (see below)
   
4. **Idle Time Trends**:
   - Line chart showing historical idle time (last 7 days)
   - Hover on data points: See daily breakdown
   - Identifies patterns (e.g., "Idle time peaks on Mondays")

#### Interaction Patterns
- **Acknowledge Alert**: Click checkmark icon → Alert moves to "Acknowledged" section
- **Snooze Alert**: Click clock icon → Select snooze duration (5/10/30 min)
- **Drill-Down**: Click alert → Opens detailed view with full resource history

---

### 3.4 What-If Scenario Simulation (Modal)

#### Layout Structure
```
┌─────────────────────────────────────────────────────────────────────┐
│  Simulate Impact: Reassign Jane Smith to WO-4600         [✕ Close] │
├─────────────────────────────────────────────────────────────────────┤
│  Proposed Change:                                                   │
│  • Jane Smith: WO-4521 → WO-4600                                   │
│  • Start Time: 2:15 PM (immediate)                                  │
├─────────────────────────────────────────────────────────────────────┤
│  Impact Analysis (Next 4 Hours)                                     │
│  ┌────────────────────────────────┬─────────────────────────────┐  │
│  │         BEFORE                 │         AFTER               │  │
│  ├────────────────────────────────┼─────────────────────────────┤  │
│  │ Jane Smith Idle Time: 45 min   │ 5 min (-89%) ✅            │  │
│  │ Machine M-203 Utilization: 78% │ 82% (+4%) ✅               │  │
│  │ WO-4600 Completion: 3:30 PM    │ 2:45 PM (45 min early) ✅   │  │
│  │ WO-4521 Completion: 2:30 PM    │ Delay to 2:45 PM ⚠️        │  │
│  └────────────────────────────────┴─────────────────────────────┘  │
│                                                                     │
│  ⚠️ Warnings:                                                       │
│  • WO-4521 will miss target by 15 minutes (Low impact - Priority: │
│    Medium)                                                          │
│                                                                     │
│  ✅ Benefits:                                                       │
│  • Overall idle time reduced by 40 minutes                          │
│  • High-priority work order (WO-4600) completed earlier             │
│  • Machine utilization improved                                     │
├─────────────────────────────────────────────────────────────────────┤
│  Timeline Visualization                                             │
│  [Gantt chart showing before/after resource schedules]              │
├─────────────────────────────────────────────────────────────────────┤
│           [Cancel]  [Confirm Reallocation] ────────────────>        │
└─────────────────────────────────────────────────────────────────────┘
```

#### Key Features
1. **Clear Proposal Summary**: Shows exactly what will change
2. **Before/After Comparison**: Side-by-side metrics
3. **Impact Indicators**: ✅ Positive, ⚠️ Warning, ❌ Negative
4. **Visual Timeline**: Gantt chart showing resource schedules
5. **Decision Support**: Clearly stated benefits and warnings

#### Interaction Patterns
- **Modify Proposal**: Click resource name → Select different resource
- **Expand Details**: Click metric → Show calculation methodology
- **Export Analysis**: Button to save as PDF (for record-keeping)

---

### 3.5 Quick Action Panel (Floating Overlay)

#### Layout Structure
```
     ┌────────────────────────────────┐
     │  Quick Actions           [✕]   │
     ├────────────────────────────────┤
     │  🚨 Emergency Reallocation     │
     ├────────────────────────────────┤
     │  ▶️ Quick Start Work Order      │
     ├────────────────────────────────┤
     │  🔄 Update Resource Status     │
     ├────────────────────────────────┤
     │  📢 Broadcast Message          │
     ├────────────────────────────────┤
     │  📊 One-Tap Reports            │
     ├────────────────────────────────┤
     │  ⚙️ Settings                   │
     └────────────────────────────────┘
```

#### Key Features
- **Floating Overlay**: Appears above other content (z-index high)
- **Large Touch Targets**: Each button 56px height
- **Icon + Text**: Clear indication of each action
- **Contextual Relevance**: Some actions only appear when relevant

#### Action Details

##### 🚨 Emergency Reallocation
Opens modal:
```
┌─────────────────────────────────────────────────────────────────────┐
│  Emergency Reallocation                                [✕ Close]    │
├─────────────────────────────────────────────────────────────────────┤
│  Reason: [Dropdown: Machine Breakdown / Operator Absence /          │
│           Quality Issue / Material Shortage / Other]                │
│                                                                     │
│  Affected Resource: [Search and select]                             │
│  Current Assignment: WO-4521                                        │
│                                                                     │
│  Reassign to:                                                       │
│  [List of available alternatives with quick stats]                  │
│  • Machine M-206 (Utilization: 65%, Available now) [Select]        │
│  • Machine M-210 (Utilization: 70%, Available in 10 min) [Select]  │
│                                                                     │
│           [Cancel]  [Confirm Emergency Reallocation] ───>           │
└─────────────────────────────────────────────────────────────────────┘
```

##### ▶️ Quick Start Work Order
Opens streamlined assignment flow:
```
┌─────────────────────────────────────────────────────────────────────┐
│  Quick Start Work Order                                [✕ Close]    │
├─────────────────────────────────────────────────────────────────────┤
│  Select Work Order: [Dropdown with top 10 queued work orders]       │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ ✓ WO-4600 - Washer Door Assembly (200 units) - Due: 2:30 PM │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  💡 Recommended Resources:                                          │
│  Operators: Jane Smith, Bob Wilson                                  │
│  Machine: M-203                                                     │
│  Materials: All available ✅                                        │
│                                                                     │
│  [Customize Resources]  [Start Immediately] ───────────────>        │
└─────────────────────────────────────────────────────────────────────┘
```

---

### 3.6 Audit Log & Analytics View

#### Layout Structure
```
┌─────────────────────────────────────────────────────────────────────┐
│  Audit Log & Analytics                                              │
├─────────────────────────────────────────────────────────────────────┤
│  [Tab: Audit Log] [Tab: Analytics Dashboard] [Tab: Reports]         │
├─────────────────────────────────────────────────────────────────────┤
│  Filters:                                                           │
│  Date Range: [Nov 11 - Nov 18] ▾  Supervisor: [All] ▾              │
│  Action Type: [All] ▾  Resource Type: [All] ▾  [Apply Filters]     │
├─────────────────────────────────────────────────────────────────────┤
│  Audit Log Entries (Chronological)                                  │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ 🕒 Nov 18, 2:23 PM - Maria Garcia                            │  │
│  │ Action: Reassigned Operator                                   │  │
│  │ • Operator: John Doe                                          │  │
│  │ • From: WO-4521 → To: WO-4600                                │  │
│  │ • Reason: Machine breakdown on original line                  │  │
│  │ [View Full Details] [View Impact Analysis]                    │  │
│  └──────────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ 🕒 Nov 18, 2:15 PM - System (Automated)                      │  │
│  │ Action: Pre-allocated Operator                                │  │
│  │ • Operator: Jane Smith                                        │  │
│  │ • Pre-assigned to: WO-4612                                    │  │
│  │ • Reason: Idle time prevention (ML prediction)                │  │
│  │ [View Full Details]                                           │  │
│  └──────────────────────────────────────────────────────────────┘  │
│  [Load More] (Pagination: Showing 1-20 of 543)                      │
├─────────────────────────────────────────────────────────────────────┤
│  Quick Stats (Today):                                               │
│  • Total Reallocations: 24                                          │
│  • Manual: 18 | Automated: 6                                        │
│  • Idle Time Prevented: 3.2 hours                                   │
└─────────────────────────────────────────────────────────────────────┘
```

#### Key Features
1. **Advanced Filtering**: Multi-criteria filters with date range picker
2. **Detailed Log Entries**: Expandable cards with full context
3. **Visual Indicators**: Icons for action types, color-coding for automated vs. manual
4. **Impact Tracking**: Link to impact analysis for each change
5. **Export Functionality**: Export filtered results to CSV/Excel/PDF

---

## 4. Interaction Design Patterns

### 4.1 Drag-and-Drop

#### Operator/Machine to Work Order Assignment
```
User Action:
1. Click and hold on operator card (John Doe)
2. Card lifts up (elevation shadow increases)
3. Drag card over work order card (WO-4600)
4. Work order card highlights (blue border)
5. Release (drop)

System Response:
1. Validation animation (spinner on work order card, 500ms)
2. If valid: ✅ Checkmark animation, both cards update
3. If invalid: ❌ Shake animation, error message tooltip
4. Rollback on error: Card returns to original position
```

#### Visual Feedback
- **Dragging**: Card follows cursor/finger with slight offset
- **Drop Zone Highlighting**: Target card gets blue border + background tint
- **Invalid Drop Zone**: Red dashed border, "no entry" cursor icon

### 4.2 Tap/Click Actions

#### Single Tap
- **Resource Card**: Open detailed view (modal)
- **Status Badge**: Open status update dropdown
- **Alert**: Expand alert details
- **Button**: Execute primary action

#### Double Tap
- **Work Order Card**: Quick start (bypass assignment screen if resources auto-assigned)

#### Long Press (>500ms)
- **Resource Card**: Show context menu (Assign, View History, Mark Unavailable, Call/Message)
- **Work Order Card**: Pin to top of queue

### 4.3 Swipe Gestures

#### Swipe Right on Alert
- Action: Acknowledge alert (remove from active list)
- Visual: Card slides right with fade-out

#### Swipe Left on Alert
- Action: Show snooze options (5 min / 10 min / 30 min)
- Visual: Card slides left slightly, reveals snooze buttons

#### Pull-to-Refresh
- On dashboard: Pull down from top → Refresh all data
- Visual: Circular loading indicator appears

### 4.4 Real-Time Update Animations

#### Resource Status Change
```
Animation Sequence:
1. Status badge pulses (scale 1.0 → 1.2 → 1.0 over 300ms)
2. Color transition (e.g., green → yellow over 200ms)
3. Optional: Brief glow effect around entire card
4. Sound effect (optional, configurable): Soft beep for warnings, urgent tone for critical
```

#### New Alert Arrival
```
Animation Sequence:
1. Alert badge on header increments (number scales up)
2. Alert panel: New alert slides in from top
3. Brief highlight (yellow background, fades over 1 second)
4. Desktop notification (if user granted permission)
```

#### Work Order Progress Update
```
Animation Sequence:
1. Progress bar animates to new value (smooth transition over 500ms)
2. Percentage text updates with count-up animation
3. If milestone reached (25%, 50%, 75%, 100%): Confetti animation (optional)
```

---

## 5. Responsive Design

### 5.1 Breakpoints

| Device | Screen Width | Layout Adjustments |
|--------|-------------|-------------------|
| **Tablet Portrait** | 768px - 1024px | Stack Alert Panel below Resource Grid; Single-column work order cards |
| **Tablet Landscape** | 1024px - 1366px | Standard two-column layout (60/40 split) |
| **Desktop** | >1366px | Expanded three-column layout; Show more resources per grid |
| **Large Display** | >1920px | Multi-zone dashboard; Side-by-side comparison views |

### 5.2 Touch Optimization

- **Minimum Touch Target**: 44x44 pixels (WCAG 2.1 AAA standard)
- **Spacing Between Targets**: Minimum 8px to prevent accidental taps
- **Gesture Support**: Pinch-to-zoom on charts, two-finger scroll on lists
- **Haptic Feedback**: Vibration on successful drag-drop, button press (if device supports)

### 5.3 Accessibility

#### Screen Reader Support
- All interactive elements have `aria-label` attributes
- Status changes announced via `aria-live` regions
- Keyboard navigation: Tab order follows visual flow

#### High Contrast Mode
- Alternative color palette with higher contrast ratios
- Border emphasis on clickable elements
- Text size minimum: 14px (scalable to 200%)

#### Keyboard Shortcuts
| Shortcut | Action |
|----------|--------|
| `Ctrl + /` | Open search |
| `Ctrl + Q` | Open Quick Action Panel |
| `Ctrl + R` | Refresh dashboard |
| `Escape` | Close modal/panel |
| `Tab` | Navigate forward |
| `Shift + Tab` | Navigate backward |
| `Enter` | Activate focused element |

---

## 6. Visual Design Examples

### 6.1 Resource Status Card (Operator)

```
┌──────────────────────────────┐
│  [Photo]   John Doe          │
│            Operator ID: O-156 │
│                              │
│  [🟢 AVAILABLE]              │
│                              │
│  Skills: Welding L3, Assembly│
│  Location: Line 2, Zone A    │
│  Shift: 6 AM - 2 PM          │
│                              │
│  Current: No Assignment      │
│                              │
│  [Assign] [View History] [⋯] │
└──────────────────────────────┘
```

#### Design Specifications
- **Card Size**: 280px × 200px
- **Photo**: 64px × 64px circle, left-aligned
- **Status Badge**: Full-width, 36px height, bold text
- **Text Hierarchy**: Name (18px bold), ID (14px gray), Details (14px regular)
- **Buttons**: Ghost buttons (transparent with border), 36px height

### 6.2 Work Order Card (Kanban)

```
┌──────────────────────────────┐
│  WO-4600                     │
│  [⭐ HIGH PRIORITY]          │
│                              │
│  Washer Door Assembly        │
│  Quantity: 200 units         │
│                              │
│  Progress: ████████░░ 40%    │
│  (80/200 complete)           │
│                              │
│  Assigned:                   │
│  • John Doe (Operator)       │
│  • Machine M-203             │
│                              │
│  Due: Nov 18, 2:30 PM        │
│  Status: In Progress         │
│                              │
│  [⚠️ Material Low]           │
└──────────────────────────────┘
```

#### Design Specifications
- **Card Size**: 280px × 260px
- **Priority Badge**: Top-right corner, colored (red/yellow/blue)
- **Progress Bar**: Full-width, 12px height, animated
- **Alert Badges**: Bottom of card, amber background, icon + text
- **Border**: 2px solid, color matches priority level

### 6.3 Alert Notification

```
┌───────────────────────────────────────────────────────┐
│  🔴 CRITICAL                          [⏰ Snooze] [✓]  │
│  Operator Jane Smith will be idle in 5 minutes        │
│  Current WO: WO-4521 (95% complete)                   │
│                                                       │
│  💡 Suggested: Assign to WO-4600 (High Priority)      │
│     [Apply Suggestion]                                │
│                                                       │
│  2 minutes ago                                        │
└───────────────────────────────────────────────────────┘
```

#### Design Specifications
- **Width**: Full panel width (responsive)
- **Height**: Auto (expands with content), minimum 100px
- **Icon**: 32px, left-aligned
- **Severity Color Bar**: 4px left border (red/yellow/blue)
- **Action Buttons**: Primary button style, right-aligned

---

## 7. Loading States & Error Handling

### 7.1 Loading States

#### Initial Page Load
```
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│                     [Spinner Animation]                             │
│                                                                     │
│                   Loading Dashboard...                              │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```
- **Spinner**: Circular, rotating, brand colors
- **Text**: "Loading [Module Name]..."
- **Progress**: Optional progress bar for longer operations (>3 seconds)

#### Skeleton Screens
For partial page updates, show skeleton placeholders:
```
┌──────────────────────────────┐
│  ░░░░░░   ░░░░░░░░░░░░      │
│            ░░░░░░░░░░        │
│                              │
│  [░░░░░░░░░░░░]              │
│                              │
│  ░░░░░: ░░░░░░░░░░░░░        │
│  ░░░░░░░░: ░░░░ ░, ░░░░ ░   │
└──────────────────────────────┘
```

### 7.2 Error States

#### API Error (Transient)
```
┌─────────────────────────────────────────────────────────────────────┐
│  ⚠️ Unable to load dashboard data                                   │
│  Please check your connection and try again.                        │
│                                                                     │
│  [Retry]  [View Cached Data]                                        │
└─────────────────────────────────────────────────────────────────────┘
```

#### Validation Error (User Action)
```
Toast Notification (Bottom-right):
┌────────────────────────────────────┐
│  ❌ Cannot assign operator          │
│  John Doe is not certified for     │
│  this work order.                  │
│  [View Requirements]          [✕]  │
└────────────────────────────────────┘
```
- **Auto-Dismiss**: After 5 seconds (unless user interacts)
- **Position**: Bottom-right corner (doesn't block main content)

#### System Error (Critical)
```
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│                     [Error Icon]                                    │
│                                                                     │
│          System Unavailable                                         │
│                                                                     │
│  We're experiencing technical difficulties.                         │
│  Your IT team has been notified.                                    │
│                                                                     │
│  Reference ID: ERR-2025-1118-0245                                   │
│                                                                     │
│  [Try Again]  [Contact Support]                                     │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 8. Onboarding & Help

### 8.1 First-Time User Experience

#### Welcome Tour (Optional)
When a new supervisor logs in for the first time:
```
Step 1 of 5: Dashboard Overview
┌─────────────────────────────────────────────────────────────────────┐
│  [Spotlight on Resource Grid]                                       │
│                                                                     │
│  This is your Resource Status Grid                                  │
│  Here you can see all operators, machines, and materials            │
│  in real-time. Click on any resource to see more details.           │
│                                                                     │
│  [Skip Tour]  [Next →]                                              │
└─────────────────────────────────────────────────────────────────────┘
```

- **Progressive Disclosure**: 5-step tour highlighting key features
- **Skippable**: Users can skip tour and access later via Help menu
- **Interactive**: Encourages users to try actions (e.g., "Try dragging an operator to a work order")

### 8.2 Contextual Help

#### Tooltips
- **Hover/Tap-and-Hold**: Shows tooltip with brief explanation
- **Example**: Hover over "Idle Time" metric → "Time when resources are available but not actively working"

#### Help Icon (?)
- **Positioned**: Next to complex features (e.g., What-If Simulation)
- **Click**: Opens help panel or video tutorial

### 8.3 Embedded Guidance

#### Empty States
When no data is available:
```
┌─────────────────────────────────────────────────────────────────────┐
│                     [Illustration]                                   │
│                                                                     │
│              No Active Work Orders                                  │
│                                                                     │
│  Get started by creating a new work order or                        │
│  importing from your ERP system.                                    │
│                                                                     │
│  [Create Work Order]  [Learn More]                                  │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 9. Performance Optimization

### 9.1 Lazy Loading
- **Initial Load**: Load only critical dashboard components
- **Deferred**: Load charts, analytics, historical data after initial render
- **On-Demand**: Load detailed resource history only when user clicks "View History"

### 9.2 Virtual Scrolling
- **Large Lists**: Render only visible items (e.g., audit log with 10,000+ entries)
- **Buffer**: Render 5 items above/below viewport for smooth scrolling

### 9.3 Optimistic UI Updates
- **Immediate Feedback**: Show UI changes before server confirms
- **Rollback**: If server rejects, revert UI and show error message
- **Example**: Drag-drop assignment shows success immediately, reverts if validation fails

### 9.4 Debouncing & Throttling
- **Search**: Debounce search input (300ms delay before API call)
- **Scroll Events**: Throttle scroll-based updates (max 60 FPS)

---

## 10. Design Deliverables Checklist

### Phase 1: Foundation
- [ ] Complete design system (colors, typography, spacing)
- [ ] Component library (buttons, cards, form elements)
- [ ] Icon set (status indicators, actions, navigation)
- [ ] Responsive grid system

### Phase 2: Core Screens
- [ ] Main dashboard (high-fidelity mockup + interactive prototype)
- [ ] Work order assignment view (with validation flows)
- [ ] Idle time optimizer view (with AI suggestion cards)
- [ ] Quick action panel (floating overlay)

### Phase 3: Interactions
- [ ] Drag-and-drop interaction specification
- [ ] Real-time update animations
- [ ] Loading and error state designs
- [ ] Toast notification system

### Phase 4: Documentation
- [ ] UI design specifications (measurements, colors, fonts)
- [ ] Interaction design documentation
- [ ] Accessibility compliance checklist
- [ ] Usability testing plan

---

## 11. Usability Testing Plan

### 11.1 Test Objectives
1. Validate that supervisors can assign resources to work orders in <30 seconds
2. Confirm real-time updates are perceived as fast (<1 second)
3. Verify drag-and-drop is intuitive for users with varying technical skills
4. Assess comprehension of idle time alerts and AI suggestions

### 11.2 Test Participants
- 5-8 manufacturing supervisors (diverse experience levels)
- 2-3 floor managers (secondary user persona)

### 11.3 Test Scenarios
1. **Task 1**: Assign an operator and machine to a specific work order
2. **Task 2**: Respond to an idle time alert using a system suggestion
3. **Task 3**: Perform an emergency reallocation due to machine breakdown
4. **Task 4**: View and interpret the idle time heat map
5. **Task 5**: Generate a shift summary report

### 11.4 Success Metrics
- **Task Completion Rate**: >90%
- **Time on Task**: Within target times (e.g., Task 1 in <30 seconds)
- **Error Rate**: <10%
- **User Satisfaction**: SUS score >75 (System Usability Scale)

### 11.5 Iteration Plan
- Conduct 2 rounds of usability testing: Prototype phase and post-development
- Incorporate feedback between rounds
- Document design changes and rationale

---

## 12. Future Enhancements (UI/UX Roadmap)

### Phase 2 Features
- **Voice Commands**: Hands-free operation ("Assign John Doe to Work Order 4600")
- **AR Overlay**: Augmented reality view showing resource locations on factory floor
- **Predictive Typing**: AI-powered autocomplete for search and data entry
- **Customizable Dashboards**: Drag-and-drop widget arrangement, save layouts

### Phase 3 Features
- **Mobile Native Apps**: iOS and Android apps with offline mode
- **Smartwatch Integration**: Quick alerts and status updates on wearables
- **Collaborative Mode**: Multi-supervisor view with real-time cursor indicators
- **Gamification**: Achievement badges for idle time reduction, on-time completions

---

**Document Approval**:
- UX Lead: ___________________
- Product Manager: ___________________
- Manufacturing Operations Manager: ___________________

**Next Steps**:
1. Review and approve UI/UX specifications
2. Create high-fidelity mockups and interactive prototype
3. Conduct usability testing with target users
4. Refine designs based on feedback
5. Handoff to development team with design specifications
