# MRAOS Visualization App - Quick Start Guide

## Prerequisites

Before running the MRAOS visualization application, you need to have Node.js installed.

### Install Node.js

1. **Download Node.js**:
   - Visit: https://nodejs.org/
   - Download the **LTS (Long Term Support)** version (recommended: Node.js 18 or higher)
   - Choose the Windows installer (.msi file)

2. **Run the installer**:
   - Double-click the downloaded .msi file
   - Follow the installation wizard
   - **Important**: Check the box that says "Automatically install the necessary tools"
   - Complete the installation

3. **Verify installation**:
   Open PowerShell or Command Prompt and run:
   \`\`\`bash
   node --version
   npm --version
   \`\`\`
   
   You should see version numbers for both commands (e.g., v18.17.0 and 9.8.1)

## Running the Application

### Option 1: Using the Batch Script (Easiest)

1. Navigate to the app directory:
   \`\`\`
   c:\\Git\\GIT_CoPilot\\MVP\\mraos-app\\
   \`\`\`

2. Double-click the **START.bat** file

   The script will:
   - Check if Node.js is installed
   - Install dependencies automatically (first run only)
   - Start the development server
   - Open your browser to http://localhost:3000

### Option 2: Using Command Line

1. Open PowerShell or Command Prompt

2. Navigate to the app directory:
   \`\`\`bash
   cd c:\\Git\\GIT_CoPilot\\MVP\\mraos-app
   \`\`\`

3. Install dependencies (first time only):
   \`\`\`bash
   npm install
   \`\`\`

4. Start the development server:
   \`\`\`bash
   npm run dev
   \`\`\`

5. Open your browser to: **http://localhost:3000**

## What You'll See

The MRAOS application will display:

1. **Top Navigation Bar**
   - MRAOS logo and title
   - Live update indicator (green pulsing dot)
   - Refresh data button

2. **Metrics Dashboard**
   - 6 metric cards showing:
     - Operators (active/total)
     - Machines (running/total)
     - Work Orders (in progress/total)
     - Utilization percentage
     - Average idle time
     - Active alerts count

3. **Main Content Area** (60/40 split)
   - **Left side**: 
     - Idle Resources section (operators and machines currently idle)
     - High Priority Work Orders
   
   - **Right side**: 
     - Alert Center with real-time alerts
     - AI-powered suggestions for resource allocation

4. **Real-Time Updates**
   - The dashboard updates automatically every 5 seconds
   - Watch as:
     - Resource statuses change
     - Work orders progress
     - Idle times accumulate
     - New alerts appear

## Features to Explore

### Idle Time Detection
- Look for resources with a **yellow pulsing border** - these are idle
- The idle duration is shown in yellow text with a clock icon
- Idle operators show when they've been idle for >5 minutes
- Idle machines show when they've been idle for >10 minutes

### Alert System
- Alerts appear in the right-side Alert Center
- **Color coding**:
  - Red border = Critical alert
  - Yellow border = Warning alert
  - Blue border = Info alert
- Each alert shows:
  - Severity level
  - Resource name and message
  - AI suggestion with confidence score
  - Estimated idle time savings
- Click "Acknowledge" to dismiss an alert

### Work Orders
- Work order cards show:
  - Priority (color-coded left border)
  - Progress bar and percentage
  - Quantity completed vs target
  - Due date and time
  - Required skills

### Resource Cards
- **Operator cards** display:
  - Name and ID
  - Current status (badge)
  - Location
  - Skills (up to 3)
  - Efficiency rating (out of 5.0)

- **Machine cards** display:
  - Name and ID
  - Type and production line
  - Current status (badge)
  - Utilization bar chart
  - OEE (Overall Equipment Effectiveness) percentage

## Stopping the Application

- Press **Ctrl+C** in the terminal/command prompt where the server is running
- Or simply close the terminal window

## Troubleshooting

### Issue: "npm is not recognized"
**Solution**: Node.js is not installed or not in your PATH
- Install Node.js from https://nodejs.org/
- Restart your terminal after installation

### Issue: Port 3000 is already in use
**Solution**: Another application is using port 3000
- Stop the other application, or
- Edit vite.config.ts to change the port:
  \`\`\`typescript
  server: {
    port: 3001,  // Change to different port
    open: true
  }
  \`\`\`

### Issue: Dependencies fail to install
**Solution**: Network or npm registry issues
- Try running: \`npm install --legacy-peer-deps\`
- Or clear npm cache: \`npm cache clean --force\` then retry

### Issue: Browser doesn't open automatically
**Solution**: Manually open your browser
- Navigate to: http://localhost:3000
- Check the terminal for the correct URL

## Next Steps

After exploring the demo:

1. **Read the documentation**:
   - Review the 7 MRAOS specification documents in the parent directory
   - Understand the system architecture and design decisions

2. **Customize the application**:
   - Modify mock data in \`src/utils/mockData.ts\`
   - Adjust UI components in \`src/components/\`
   - Change update frequency in \`src/App.tsx\` (currently 5 seconds)

3. **Build for production**:
   \`\`\`bash
   npm run build
   \`\`\`
   - Output will be in the \`dist/\` folder
   - Deploy to any static hosting service

## Support

For questions or issues:
- Check the README.md for detailed documentation
- Review the MRAOS specification documents
- Ensure Node.js 18+ is properly installed

---

**Happy exploring!** 🚀
