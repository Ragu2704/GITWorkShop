# MRAOS Visualization Application

Manufacturing Resource Allocation and Optimization System - Interactive Dashboard Demo

## Overview

This is an interactive web application that visualizes the MRAOS (Manufacturing Resource Allocation and Optimization System) described in the functional requirements document. It demonstrates real-time resource monitoring, idle time detection, and AI-powered allocation suggestions for manufacturing operations.

## Features

### ✨ Implemented Features

1. **Real-Time Dashboard**
   - Live metrics for operators, machines, and work orders
   - Resource utilization tracking
   - Idle time monitoring
   - Active alert center

2. **Resource Monitoring**
   - Operator status cards with skills and efficiency ratings
   - Machine status cards with OEE and utilization metrics
   - Work order cards with progress tracking

3. **Idle Time Detection**
   - Automatic detection of idle operators (>5 min) and machines (>10 min)
   - Visual indicators with pulsing animations
   - Idle duration tracking

4. **Alert System**
   - Severity-based alerts (info, warning, critical)
   - AI-powered allocation suggestions
   - One-click acknowledgement
   - Estimated idle time savings

5. **Real-Time Simulation**
   - Automatic status updates every 5 seconds
   - Work order progress simulation
   - Dynamic idle time accumulation
   - Realistic data generation

## Tech Stack

- **Frontend Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **State Management**: Zustand
- **UI Components**: Custom components with Lucide React icons
- **Styling**: CSS-in-JS (inline styles matching MRAOS design system)
- **Data Generation**: Mock data utilities with realistic scenarios

## Getting Started

### Prerequisites

- Node.js 18+ and npm (or yarn/pnpm)

### Installation

1. Navigate to the project directory:
   \`\`\`bash
   cd c:\\Git\\GIT_CoPilot\\MVP\\mraos-app
   \`\`\`

2. Install dependencies:
   \`\`\`bash
   npm install
   \`\`\`

3. Start the development server:
   \`\`\`bash
   npm run dev
   \`\`\`

4. Open your browser to [http://localhost:3000](http://localhost:3000)

### Build for Production

\`\`\`bash
npm run build
npm run preview
\`\`\`

## Project Structure

\`\`\`
mraos-app/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── StatusBadge.tsx
│   │   ├── OperatorCard.tsx
│   │   ├── MachineCard.tsx
│   │   └── WorkOrderCard.tsx
│   ├── views/              # Main application views
│   │   └── Dashboard.tsx
│   ├── store/              # Zustand state management
│   │   └── store.ts
│   ├── utils/              # Utility functions
│   │   └── mockData.ts     # Data generation
│   ├── types.ts            # TypeScript type definitions
│   ├── App.tsx             # Main application component
│   ├── main.tsx            # Application entry point
│   └── index.css           # Global styles
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
\`\`\`

## Key Components

### Dashboard View
The main dashboard displays:
- **Metric Cards**: Key performance indicators (KPIs)
  - Operator availability (busy/idle)
  - Machine utilization
  - Work order status (queued/in-progress/completed)
  - Average idle time
  - Active alerts count

- **Idle Resources Section**: 
  - Highlighted cards for operators and machines that are idle
  - Pulsing animation for visibility
  - Idle duration display

- **High Priority Work Orders**: 
  - Work orders marked as "high" or "critical" priority
  - Progress bars and completion tracking

- **Alert Center**: 
  - Real-time alerts with severity levels
  - AI-powered suggestions with confidence scores
  - Estimated idle time savings

### Resource Cards
- **Operator Card**: Shows operator ID, name, status, location, skills, and efficiency rating
- **Machine Card**: Displays machine ID, type, status, production line, utilization, and OEE
- **Work Order Card**: Shows work order details, priority, progress, due date, and required skills

### Real-Time Features
- Status updates every 5 seconds
- Automatic work order progress simulation
- Dynamic idle time accumulation
- Live alert generation

## Design System

The application follows the MRAOS design system specified in the functional requirements:

- **Color Palette**:
  - Primary Blue: #0066CC
  - Success Green: #00A86B
  - Warning Yellow: #FFB800
  - Danger Red: #DC3545

- **Status Colors**:
  - Available: Green (#00A86B)
  - Busy: Blue (#0066CC)
  - Idle: Yellow (#FFB800)
  - Maintenance: Gray (#6C757D)
  - Breakdown: Red (#DC3545)

- **Typography**: Inter font family
- **Spacing**: 8px base grid (4px, 8px, 16px, 24px, 32px)

## Data Model

The application uses the following data structures:

- **Operators**: 25 simulated operators with skills, status, and location
- **Machines**: 20 simulated machines with type, utilization, and OEE metrics
- **Work Orders**: 30 simulated work orders with priority, progress, and requirements
- **Materials**: 20 material types with stock levels
- **Alerts**: Dynamically generated based on idle resources
- **Audit Log**: Historical record of all actions

## Future Enhancements

Potential additions to match full MRAOS specifications:

- [ ] Drag-and-drop resource assignment
- [ ] What-if scenario simulation
- [ ] Idle time heat map visualization
- [ ] Historical analytics and reporting
- [ ] Audit log viewer
- [ ] Multi-line production view
- [ ] Mobile responsive design
- [ ] Real-time charting (utilization trends)
- [ ] Advanced filtering and search
- [ ] Export capabilities

## Development

### Running Tests
\`\`\`bash
npm run test
\`\`\`

### Linting
\`\`\`bash
npm run lint
\`\`\`

## Documentation Reference

This visualization is based on the comprehensive MRAOS documentation:

1. **MRAOS_System_Architecture.md** - System design and technology stack
2. **MRAOS_Functional_Requirements.md** - Detailed feature specifications
3. **MRAOS_UI_UX_Design.md** - Design system and interaction patterns
4. **MRAOS_Data_Architecture.md** - Data models and schemas
5. **MRAOS_Integration_Specs.md** - External system interfaces
6. **MRAOS_Idle_Time_Optimization.md** - ML algorithms and optimization strategies
7. **MRAOS_Implementation_Roadmap.md** - Phased delivery plan

## License

© 2025 MRAOS Demo Application

## Support

For questions or issues, please refer to the complete MRAOS documentation in the parent directory.

---

**Note**: This is a demonstration application with simulated data. In a production environment, this would connect to real ERP, MES, HR, and inventory management systems via the integration layer described in MRAOS_Integration_Specs.md.
