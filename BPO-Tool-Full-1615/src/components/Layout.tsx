import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { NotificationCenter } from './NotificationCenter';
import GlobalAIAssistant from './GlobalAIAssistant';
import {
  LayoutDashboard,
  Activity,
  Phone,
  FileText,
  AlertTriangle,
  CheckSquare,
  Users,
  Clock,
  Target,
  UserCheck,
  TrendingUp,
  BookOpen,
  Briefcase,
  Lock,
  GitBranch,
  Settings,
  FolderKanban,
  Shield,
  DollarSign,
  LogOut,
  ChevronDown,
  ChevronRight,
  User,
  Sparkles,
  Brain,
  Zap,
  Search,
  Play,
  Volume2,
  VolumeX,
  Plug,
  Calculator,
  MessageSquare,
  Inbox,
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  currentModule: string;
  onModuleChange: (module: string) => void;
}

interface MenuItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  children?: MenuItem[];
}

const dailyOpsMenuItems: MenuItem[] = [
  {
    id: 'bpo-daily-ops',
    label: 'Daily Operations',
    icon: <Activity size={18} />,
    children: [
      { id: 'realtime-ops', label: 'Real-Time Operations', icon: <Activity size={16} /> },
      { id: 'unified-inbox', label: 'Unified Inbox', icon: <Inbox size={16} /> },
      { id: 'live-chat', label: 'Live Chat', icon: <MessageSquare size={16} /> },
      { id: 'contact-center-ai', label: 'Contact Center (AI)', icon: <Phone size={16} /> },
      { id: 'interaction-log', label: 'Interaction Log', icon: <FileText size={16} /> },
      { id: 'complaints', label: 'Complaints Management', icon: <AlertTriangle size={16} /> },
      { id: 'approvals-queue', label: 'Approvals Queue', icon: <CheckSquare size={16} /> },
    ],
  },
  {
    id: 'workforce',
    label: 'Workforce',
    icon: <Users size={18} />,
    children: [
      { id: 'erlang-c', label: 'Erlang C Calculator', icon: <Calculator size={16} /> },
      { id: 'workforce-forecast', label: 'Workforce Forecasting', icon: <TrendingUp size={16} /> },
      { id: 'workforce-mgmt', label: 'Workforce Management', icon: <Users size={16} /> },
      { id: 'attendance', label: 'Attendance Tracking', icon: <Clock size={16} /> },
      { id: 'time-off', label: 'Time Off Requests', icon: <Clock size={16} /> },
      { id: 'coaching-plans', label: 'Coaching Plans', icon: <UserCheck size={16} /> },
    ],
  },
  {
    id: 'quality',
    label: 'Quality & Performance',
    icon: <Target size={18} />,
    children: [
      { id: 'quality-assurance', label: 'Quality Assurance', icon: <CheckSquare size={16} /> },
      { id: 'performance-mgmt', label: 'Performance Management', icon: <Target size={16} /> },
      { id: 'csat-surveys', label: 'CSAT Surveys', icon: <TrendingUp size={16} /> },
    ],
  },
  {
    id: 'knowledge',
    label: 'Knowledge & Clients',
    icon: <BookOpen size={18} />,
    children: [
      { id: 'knowledge-base', label: 'Knowledge Base', icon: <BookOpen size={16} /> },
      { id: 'client-mgmt', label: 'Client Management', icon: <Briefcase size={16} /> },
      { id: 'alert-monitoring', label: 'Alert Monitoring', icon: <AlertTriangle size={16} /> },
      { id: 'access-control', label: 'Access Control', icon: <Lock size={16} /> },
      { id: 'ai-routing', label: 'AI Complaint Routing', icon: <Brain size={16} /> },
      { id: 'ai-config', label: 'AI Configuration', icon: <Settings size={16} /> },
    ],
  },
];

const managementMenuItems: MenuItem[] = [
  {
    id: 'smart',
    label: 'Smart Features',
    icon: <Sparkles size={18} />,
    children: [
      { id: 'attrition-prediction', label: 'Attrition Prediction', icon: <TrendingUp size={16} /> },
      { id: 'profitability', label: 'Profitability Intelligence', icon: <DollarSign size={16} /> },
      { id: 'auto-resolution', label: 'Auto-Resolution Engine', icon: <Zap size={16} /> },
      { id: 'nl-query', label: 'Natural Language Query', icon: <Search size={16} /> },
      { id: 'predictive-analytics', label: 'Predictive Analytics', icon: <Brain size={16} /> },
      { id: 'smart-automation', label: 'Workflow Builder', icon: <Zap size={16} /> },
    ],
  },
  {
    id: 'process',
    label: 'Process Management',
    icon: <GitBranch size={18} />,
    children: [
      { id: 'bpmn', label: 'BPMN Builder', icon: <GitBranch size={16} /> },
      { id: 'process-execution', label: 'Live Process Execution', icon: <Play size={16} /> },
      { id: 'my-tasks', label: 'My Process Tasks', icon: <CheckSquare size={16} /> },
      { id: 'process-analytics', label: 'Process Analytics & Mining', icon: <TrendingUp size={16} /> },
      { id: 'bottleneck-detection', label: 'Bottleneck Detection', icon: <AlertTriangle size={16} /> },
      { id: 'process-performance', label: 'Resource Performance', icon: <Target size={16} /> },
      { id: 'ai-recommendations', label: 'AI Recommendations', icon: <Sparkles size={16} /> },
      { id: 'smart-task-assignment', label: 'Smart Task Assignment', icon: <Users size={16} /> },
      { id: 'knowledge-management', label: 'Knowledge Management', icon: <BookOpen size={16} /> },
      { id: 'compliance-dashboard', label: 'Compliance & Governance', icon: <Shield size={16} /> },
      { id: 'integration-hub', label: 'Integration Hub', icon: <Plug size={16} /> },
      { id: 'process-mapping', label: 'Process Mapping', icon: <GitBranch size={16} /> },
      { id: 'workflow-automation', label: 'Workflow Automation', icon: <Settings size={16} /> },
      { id: 'sop', label: 'SOP Builder', icon: <FileText size={16} /> },
    ],
  },
  {
    id: 'projects',
    label: 'Project Management',
    icon: <FolderKanban size={18} />,
    children: [
      { id: 'projects', label: 'Projects', icon: <FolderKanban size={16} /> },
      { id: 'gantt-charts', label: 'Gantt Charts', icon: <GitBranch size={16} /> },
    ],
  },
  {
    id: 'change',
    label: 'Change Management',
    icon: <Users size={18} />,
    children: [
      { id: 'change-initiatives', label: 'Change Initiatives', icon: <Users size={16} /> },
      { id: 'stakeholders', label: 'Stakeholder Management', icon: <Users size={16} /> },
      { id: 'communications', label: 'Communication Plans', icon: <FileText size={16} /> },
      { id: 'training', label: 'Training Programs', icon: <FileText size={16} /> },
      { id: 'resistance', label: 'Resistance Management', icon: <Shield size={16} /> },
      { id: 'readiness', label: 'Readiness Assessment', icon: <Target size={16} /> },
      { id: 'impact', label: 'Impact Analysis', icon: <TrendingUp size={16} /> },
    ],
  },
  {
    id: 'transitions',
    label: 'Transition Projects',
    icon: <Briefcase size={18} />,
    children: [
      { id: 'hr-transition', label: 'HR Transformation', icon: <Users size={16} /> },
      { id: 'digital-transition', label: 'Digital Transformation', icon: <Settings size={16} /> },
      { id: 'culture-transition', label: 'Culture Change', icon: <Users size={16} /> },
      { id: 'billing-transition', label: 'Billing Transition', icon: <DollarSign size={16} /> },
      { id: 'it-transition', label: 'IT Support Transition', icon: <Settings size={16} /> },
      { id: 'bi-transition', label: 'BI & Reporting Transition', icon: <TrendingUp size={16} /> },
      { id: 'training-transition', label: 'Training & Development', icon: <FileText size={16} /> },
    ],
  },
  {
    id: 'governance',
    label: 'Governance & Compliance',
    icon: <Shield size={18} />,
    children: [
      { id: 'policies', label: 'Policy Management', icon: <FileText size={16} /> },
      { id: 'compliance', label: 'Compliance Tracking', icon: <Shield size={16} /> },
      { id: 'audit', label: 'Audit Trails', icon: <FileText size={16} /> },
      { id: 'raci', label: 'RACI Matrix', icon: <Users size={16} /> },
      { id: 'risks', label: 'Risk Analysis', icon: <Shield size={16} /> },
    ],
  },
  {
    id: 'performance',
    label: 'Analytics & Reporting',
    icon: <Target size={18} />,
    children: [
      { id: 'advanced-predictions', label: 'Predictive Analytics', icon: <Brain size={16} /> },
      { id: 'custom-reports', label: 'Custom Report Builder', icon: <FileText size={16} /> },
      { id: 'kpi', label: 'KPI Manager', icon: <Target size={16} /> },
      { id: 'analytics', label: 'Analytics', icon: <TrendingUp size={16} /> },
      { id: 'dashboards', label: 'Executive Dashboards', icon: <LayoutDashboard size={16} /> },
      { id: 'reporting', label: 'Reporting', icon: <FileText size={16} /> },
    ],
  },
  {
    id: 'finance',
    label: 'Finance',
    icon: <DollarSign size={18} />,
    children: [
      { id: 'financial-overview', label: 'Financial Overview', icon: <DollarSign size={16} /> },
      { id: 'budgeting', label: 'Budgeting', icon: <DollarSign size={16} /> },
      { id: 'cost-analysis', label: 'Cost Analysis', icon: <TrendingUp size={16} /> },
      { id: 'invoicing', label: 'Invoicing', icon: <FileText size={16} /> },
    ],
  },
  {
    id: 'resources',
    label: 'Resource Management',
    icon: <Users size={18} />,
    children: [
      { id: 'teams', label: 'Team Management', icon: <Users size={16} /> },
      { id: 'capacity', label: 'Capacity Planning', icon: <Target size={16} /> },
      { id: 'budget', label: 'Budget Tracking', icon: <DollarSign size={16} /> },
    ],
  },
];

const standaloneItems: MenuItem[] = [
  { id: 'improvements', label: 'Continuous Improvement', icon: <TrendingUp size={18} /> },
  { id: 'ai-processor', label: 'AI Document Processor', icon: <FileText size={18} /> },
  { id: 'tech-specs', label: 'Technical Specifications', icon: <FileText size={18} /> },
];

export const Layout: React.FC<LayoutProps> = ({ children, currentModule, onModuleChange }) => {
  const { user, signOut } = useAuth();
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [screenReaderEnabled, setScreenReaderEnabled] = useState(false);

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  const handleModuleChange = (moduleId: string) => {
    onModuleChange(moduleId);
  };

  const renderMenuSection = (
    items: MenuItem[],
    sectionColor: string,
    borderColor: string,
    bgColor: string
  ) => (
    <div className="space-y-1">
      {items.map((item) => {
        const isActive = item.children
          ? item.children.some((child) => child.id === currentModule)
          : currentModule === item.id;
        const isExpanded = expandedSections.has(item.id);

        return (
          <div key={item.id}>
            {item.children ? (
              <button
                onClick={() => toggleSection(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  isActive ? `${bgColor} ${sectionColor}` : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  {item.icon}
                  <span>{item.label}</span>
                </div>
                {isExpanded ? (
                  <ChevronDown size={16} className="text-slate-400" />
                ) : (
                  <ChevronRight size={16} className="text-slate-400" />
                )}
              </button>
            ) : (
              <button
                onClick={() => handleModuleChange(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  isActive ? `${bgColor} ${sectionColor}` : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            )}

            {item.children && isExpanded && (
              <div className="ml-4 mt-1 space-y-1">
                {item.children.map((child) => (
                  <button
                    key={child.id}
                    onClick={() => handleModuleChange(child.id)}
                    className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors ${
                      currentModule === child.id
                        ? `${bgColor} ${sectionColor} font-medium`
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {child.icon}
                    <span>{child.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col h-screen sticky top-0">
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <LayoutDashboard size={24} className="text-blue-600" />
            <div>
              <h1 className="text-lg font-bold text-slate-800">BPO Platform</h1>
              <p className="text-xs text-slate-500">Operations Management</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto p-4">
          <button
            onClick={() => handleModuleChange('dashboard')}
            className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors mb-4 ${
              currentModule === 'dashboard'
                ? 'bg-blue-50 text-blue-700'
                : 'text-slate-700 hover:bg-slate-50'
            }`}
          >
            <LayoutDashboard size={18} />
            <span>Dashboard</span>
          </button>

          <div className="bg-slate-50 border border-slate-300 rounded-lg p-3 mb-4">
            <div className="flex items-center gap-2 mb-2">
              <Activity size={16} className="text-slate-700" />
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                BPO Daily Operations
              </h3>
            </div>
            {renderMenuSection(dailyOpsMenuItems, 'text-blue-700', 'border-slate-300', 'bg-blue-50')}
          </div>

          <div className="bg-slate-50 border border-slate-300 rounded-lg p-3 mb-4">
            <div className="flex items-center gap-2 mb-2">
              <Target size={16} className="text-slate-700" />
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                BPO Management
              </h3>
            </div>
            {renderMenuSection(
              managementMenuItems,
              'text-green-700',
              'border-slate-300',
              'bg-green-50'
            )}
          </div>

          <div className="border-t border-slate-200 pt-3 mt-3">
            {renderMenuSection(standaloneItems, 'text-slate-700', 'border-slate-300', 'bg-slate-50')}
          </div>
        </nav>
      </aside>

      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="bg-white border-b border-slate-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-800">
                {[...dailyOpsMenuItems, ...managementMenuItems, ...standaloneItems]
                  .flatMap((item) => [item, ...(item.children || [])])
                  .find((item) => item.id === currentModule)?.label || 'Dashboard'}
              </h2>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setScreenReaderEnabled(!screenReaderEnabled)}
                className={`p-2 rounded-lg transition-colors ${
                  screenReaderEnabled
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
                title="Toggle Screen Reader"
              >
                {screenReaderEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
              </button>

              <NotificationCenter />

              <button
                onClick={() => onModuleChange('settings')}
                className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <Settings size={20} />
              </button>

              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 p-2 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <User size={18} className="text-blue-600" />
                  </div>
                  <ChevronDown size={16} />
                </button>

                {showUserMenu && (
                  <div className="absolute top-full right-0 mt-2 bg-white border border-slate-200 rounded-lg shadow-lg py-2 w-56 z-50">
                    <div className="px-4 py-2 border-b border-slate-200">
                      <p className="text-sm font-medium text-slate-800">{user?.email}</p>
                      <p className="text-xs text-slate-500">Administrator</p>
                    </div>
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        onModuleChange('settings');
                      }}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                    >
                      <Settings size={16} />
                      <span>Settings</span>
                    </button>
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        signOut();
                      }}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      <LogOut size={16} />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>

      <GlobalAIAssistant
        currentModule={currentModule}
        currentModuleName={getModuleName(currentModule)}
      />
    </div>
  );
};

function getModuleName(moduleId: string): string {
  const moduleNames: Record<string, string> = {
    'dashboard': 'Dashboard',
    'enhanced-dashboard': 'Enhanced Dashboard',
    'realtime-ops': 'Real-Time Operations',
    'unified-inbox': 'Unified Inbox',
    'live-chat': 'Live Chat',
    'contact-center-ai': 'Contact Center',
    'integrated-contact-center': 'Contact Center',
    'interaction-log': 'Interaction Log',
    'complaints': 'Complaints Management',
    'integrated-complaints': 'Complaints Management',
    'approvals-queue': 'Approvals Queue',
    'erlang-c': 'Erlang C Calculator',
    'workforce-forecast': 'Workforce Forecasting',
    'workforce-mgmt': 'Workforce Management',
    'attendance': 'Attendance Tracking',
    'time-off': 'Time Off Requests',
    'coaching-plans': 'Coaching Plans',
    'quality-assurance': 'Quality Assurance',
    'performance-mgmt': 'Performance Management',
    'csat-surveys': 'CSAT Surveys',
    'knowledge-base': 'Knowledge Base',
    'client-mgmt': 'Client Management',
    'alert-monitoring': 'Alert Monitoring',
    'access-control': 'Access Control',
    'process-mapping': 'Process Mapping',
    'visual-bpmn': 'Visual BPMN Editor',
    'process-execution': 'Process Execution',
    'my-tasks': 'My Process Tasks',
    'process-performance': 'Process Performance',
    'process-analytics': 'Process Analytics',
    'ai-operations': 'AI Operations',
    'ai-config': 'AI Configuration',
    'ai-ops-dashboard': 'AI Operations Dashboard',
    'smart-automation': 'Smart Automation',
    'smart-task-assignment': 'Smart Task Assignment',
    'predictive-analytics': 'Predictive Analytics',
    'advanced-predictions': 'Advanced Predictions',
    'bottleneck-detection': 'Bottleneck Detection',
    'attrition-prediction': 'Attrition Prediction',
    'project-gantt': 'Project Gantt Chart',
    'compliance-dashboard': 'Compliance Dashboard',
    'integration-hub': 'Integration Hub',
    'profitability': 'Profitability Dashboard',
    'custom-reports': 'Custom Reports',
  };

  return moduleNames[moduleId] || 'Platform';
}
