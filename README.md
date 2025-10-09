# OllieProcess - AI-Powered BPO Management Platform

A comprehensive Business Process Outsourcing (BPO) management platform with AI-powered document analysis, BPMN generation, and intelligent process optimization.

## 🚀 Features

### AI-Powered Document Intelligence
- **Automatic Process Analysis**: Upload any process document (PDF, DOCX, PPTX, VSDX) and AI extracts structured process information
- **BPMN Diagram Generation**: AI automatically creates BPMN 2.0 diagrams with swimlanes for each role
- **Smart Artifact Generation**:
  - Standard Operating Procedures (SOPs)
  - RACI Matrices with role assignments
  - Risk & Control Matrices with mitigation strategies
  - Confidence scoring for all AI-generated content

### Process Management
- Visual process mapping with BPMN editor
- Process version control and change tracking
- Real-time collaboration with comments and presence indicators
- Process execution engine with workflow automation
- Process performance analytics and bottleneck detection

### Advanced Analytics
- Process mining and discovery from execution logs
- Predictive analytics for process optimization
- Real-time performance dashboards
- What-if scenario simulation

### BPO Operations
- Contact center management with interaction logging
- Complaint routing and management
- Workforce forecasting and scheduling
- Quality assurance and performance tracking
- Client success platform with CSAT tracking

### Enterprise Integration
- RESTful API for external system integration
- Webhook support for real-time notifications
- Email service integration
- Document storage with Supabase Storage

## 🛠️ Technology Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **AI**: OpenAI GPT-4o-mini for intelligent analysis
- **Icons**: Lucide React
- **Process Notation**: BPMN 2.0

## 📋 Prerequisites

- Node.js 18+ and npm
- Supabase account
- OpenAI API key

## 🔧 Installation

1. **Clone the repository**
```bash
git clone https://github.com/Olliekats/OllieProcess.git
cd OllieProcess
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment variables**

Create a `.env` file in the root directory:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_OPENAI_API_KEY=your_openai_api_key
```

4. **Set up the database**

The project includes comprehensive database migrations in the `supabase/migrations` directory. Apply them to your Supabase project:

- Core tables (processes, users, departments)
- Change management (versions, approvals)
- Operations and governance
- AI configuration and routing
- Process execution engine
- Analytics and mining
- Compliance and integration systems

5. **Run the development server**
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

## 📦 Building for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## 📊 Project Structure

```
OllieProcess/
├── src/
│   ├── modules/          # All process management modules
│   ├── components/       # Reusable UI components
│   ├── contexts/         # React contexts (Auth, etc.)
│   ├── hooks/            # Custom React hooks
│   ├── lib/              # Libraries (Supabase client)
│   ├── services/         # OpenAI and integration services
│   ├── utils/            # Utility functions
│   ├── App.tsx           # Main application component
│   └── main.tsx          # Application entry point
├── supabase/
│   ├── migrations/       # Database migrations (120+ tables)
│   └── functions/        # Edge functions
├── public/               # Static assets
└── package.json
```

## 🗄️ Database Schema

The platform uses a comprehensive database schema with 120+ tables including:

- **Core Tables**: processes, process_steps, users_profile, departments, teams
- **Document Management**: process_documents, generated_artifacts, document_versions
- **Process Execution**: process_instances, task_instances, workflow_definitions
- **Analytics**: process_metrics, performance_data, audit_trails
- **BPO Operations**: interaction_log, complaints, workforce_schedules
- **AI Systems**: ai_models, routing_rules, prediction_models

All tables include Row Level Security (RLS) policies for data protection.

## 🔐 Security

- Email/password authentication via Supabase Auth
- Row Level Security (RLS) on all database tables
- Secure API key management
- Role-based access control
- Audit trails for compliance

## 🤖 AI Features

### Document Analysis
The AI analyzes uploaded documents to extract:
- Process name and description
- Sequential process steps
- Roles and responsibilities
- Decision points and gateways
- Inputs and outputs
- Risk factors

### BPMN Generation
Creates valid BPMN 2.0 XML diagrams featuring:
- Swimlanes for each identified role
- Start and end events
- Task activities
- Exclusive gateways for decisions
- Sequence flows connecting all elements

### Artifact Generation
Automatically creates professional documentation:
- **SOPs**: 7-section format with purpose, scope, definitions, responsibilities, procedures, references, and revision history
- **RACI Matrices**: Complete role assignment tables with explanatory notes
- **Risk Matrices**: Comprehensive risk assessment with controls, mitigation strategies, and escalation procedures

## 📊 Key Modules

1. **Enhanced Process Management**: Central hub for document upload and AI artifact generation
2. **Process Dashboard**: Real-time analytics and performance metrics
3. **Visual BPMN Editor**: Interactive process diagram editor
4. **Process Execution**: Workflow automation and task management
5. **Process Analytics**: Deep insights into process performance
6. **Compliance Hub**: Regulatory compliance tracking and reporting
7. **Dynamic Orchestrator**: AI-driven process optimization
8. **Discovery & Mining**: Automatic process discovery from logs

## 🎯 Use Cases

- **BPO Operations**: Manage contact center operations, complaints, and customer interactions
- **Process Optimization**: Identify bottlenecks and optimize workflows
- **Compliance Management**: Track regulatory compliance and audit trails
- **Knowledge Management**: Build and maintain organizational process knowledge
- **Workforce Planning**: Forecast staffing needs and optimize schedules
- **Quality Assurance**: Monitor and improve service quality

## 📈 Performance

- Processes in 2-4 minutes for complete AI analysis of uploaded documents
- Supports documents up to 25MB
- Real-time collaboration with instant presence updates
- Scalable architecture with Supabase backend

## 🆘 Troubleshooting

### AI Generation Getting Stuck
- Check browser console (F12) for error messages
- Verify OpenAI API key is valid
- Each AI step takes 30-60 seconds - be patient
- Check your OpenAI API quota

### Database Issues
- Verify Supabase credentials in `.env`
- Check RLS policies are properly configured
- Review Supabase logs for errors

### Build Errors
- Clear `node_modules` and reinstall: `rm -rf node_modules && npm install`
- Clear build cache: `rm -rf dist`
- Check TypeScript errors: `npm run typecheck`

## 🔮 Roadmap

- [ ] Advanced BPMN editing capabilities
- [ ] Multi-language support
- [ ] Mobile app for task management
- [ ] Advanced AI models for predictive analytics
- [ ] Integration marketplace
- [ ] Custom report builder
- [ ] Real-time collaboration enhancements
- [ ] Voice-to-process conversion

## 📄 License

Copyright © 2025 OllieProcess. All rights reserved.

## 🤝 Support

For questions or issues, check:
- Browser console logs (F12)
- Supabase dashboard for database status
- OpenAI API status and quota

---

**Built with ❤️ for modern BPO operations**

**GitHub**: https://github.com/Olliekats/OllieProcess
