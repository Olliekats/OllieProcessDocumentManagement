# OllieProcess - Standalone Process Management Application

## Overview

OllieProcess is a comprehensive AI-powered process management application extracted from the BPO Tool Full platform. It focuses exclusively on business process management, optimization, and automation.

## Features

### Core Process Management
- **Process Management Hub** - Central location for managing all business processes
- **Process Mapping** - Visual process design and documentation
- **Visual BPMN Editor** - Industry-standard BPMN 2.0 workflow designer
- **My Process Tasks** - Personal task management and workflow assignments

### Process Execution & Orchestration
- **Process Execution Engine** - Run and monitor process instances
- **Dynamic Process Orchestrator** - Advanced workflow orchestration with AI
- **Approvals Queue** - Manage pending approvals across all processes

### Analytics & Performance
- **Process Analytics** - Comprehensive analytics and insights
- **Process Performance** - Track KPIs and performance metrics
- **Bottleneck Detection** - Automatically identify process bottlenecks

### AI-Powered Intelligence
- **Process Discovery & Mining** - AI-powered process discovery from data
- **AI Optimization** - Intelligent process improvement recommendations
- **AI Recommendations** - Automated suggestions for process enhancement
- **Process Simulation Engine** - What-if analysis and process simulation

### Compliance & Governance
- **Compliance Hub** - Ensure processes meet regulatory requirements

## Technology Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Icons**: Lucide React

## Project Structure

```
OllieProcess/
├── src/
│   ├── modules/          # All process management modules
│   ├── components/       # Reusable UI components
│   ├── contexts/         # React contexts (Auth, etc.)
│   ├── hooks/           # Custom React hooks
│   ├── lib/             # Libraries (Supabase client)
│   ├── utils/           # Utility functions
│   ├── services/        # Service layer
│   ├── App.tsx          # Main application component
│   └── main.tsx         # Application entry point
├── supabase/
│   ├── migrations/      # Database migrations
│   └── functions/       # Edge functions
└── package.json
```

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
Create a `.env` file with your Supabase credentials:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

3. Run the development server:
```bash
npm run dev
```

4. Build for production:
```bash
npm run build
```

## Module Categories

### Overview
- Process Management Dashboard

### Core
- Process Management
- Process Mapping
- Visual BPMN Editor
- My Process Tasks

### Execution
- Process Execution
- Process Orchestrator
- Approvals Queue

### Analytics
- Process Analytics
- Process Performance
- Bottleneck Detection

### AI & Intelligence
- Process Discovery & Mining
- AI Optimization
- AI Recommendations

### Advanced
- Process Simulation
- Compliance Hub

## Database

OllieProcess uses Supabase (PostgreSQL) with comprehensive migrations already set up:
- Core process tables
- Change management
- Operations and governance
- AI configuration and routing
- Process analytics and mining
- Compliance system
- Integration hub
- Document management
- And much more...

## Original Source

This application was extracted from the BPO Tool Full-1615 project, keeping only the process management functionality while maintaining all existing features, database structure, and UI/UX design.

## License

Private - All rights reserved
