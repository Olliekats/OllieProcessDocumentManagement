import React, { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AuthForm } from './components/AuthForm';
import {
  LayoutDashboard,
  GitBranch,
  Workflow,
  PlayCircle,
  BarChart3,
  Target,
  Lightbulb,
  Settings,
  Search,
  LogOut,
  Sparkles,
  TrendingUp,
  CheckCircle,
  AlertTriangle,
  Database,
  Zap,
} from 'lucide-react';
import {
  ProcessDashboard,
  ProcessMapping,
  EnhancedProcessMapping,
  EnhancedProcessManagement,
  VisualBPMN,
  ProcessExecution,
  ProcessAnalytics,
  ProcessPerformance,
  MyProcessTasks,
  ProcessDiscoveryMining,
  ProcessOptimizationAI,
  ProcessSimulationEngine,
  ProcessComplianceHub,
  DynamicProcessOrchestrator,
  BottleneckDetection,
  AIRecommendations,
  ApprovalsQueue,
} from './modules';

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  component: React.ReactNode;
  category: string;
}

const navItems: NavItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: <LayoutDashboard size={20} />,
    component: <ProcessDashboard />,
    category: 'Overview',
  },
  {
    id: 'process-management',
    label: 'Process Management',
    icon: <GitBranch size={20} />,
    component: <EnhancedProcessManagement />,
    category: 'Core',
  },
  {
    id: 'process-mapping',
    label: 'Process Mapping',
    icon: <Workflow size={20} />,
    component: <EnhancedProcessMapping />,
    category: 'Core',
  },
  {
    id: 'visual-bpmn',
    label: 'Visual BPMN Editor',
    icon: <GitBranch size={20} />,
    component: <VisualBPMN />,
    category: 'Core',
  },
  {
    id: 'my-tasks',
    label: 'My Process Tasks',
    icon: <CheckCircle size={20} />,
    component: <MyProcessTasks />,
    category: 'Core',
  },
  {
    id: 'process-execution',
    label: 'Process Execution',
    icon: <PlayCircle size={20} />,
    component: <ProcessExecution />,
    category: 'Execution',
  },
  {
    id: 'dynamic-orchestrator',
    label: 'Process Orchestrator',
    icon: <Zap size={20} />,
    component: <DynamicProcessOrchestrator />,
    category: 'Execution',
  },
  {
    id: 'approvals',
    label: 'Approvals Queue',
    icon: <CheckCircle size={20} />,
    component: <ApprovalsQueue />,
    category: 'Execution',
  },
  {
    id: 'process-analytics',
    label: 'Process Analytics',
    icon: <BarChart3 size={20} />,
    component: <ProcessAnalytics />,
    category: 'Analytics',
  },
  {
    id: 'process-performance',
    label: 'Process Performance',
    icon: <Target size={20} />,
    component: <ProcessPerformance />,
    category: 'Analytics',
  },
  {
    id: 'bottleneck-detection',
    label: 'Bottleneck Detection',
    icon: <AlertTriangle size={20} />,
    component: <BottleneckDetection />,
    category: 'Analytics',
  },
  {
    id: 'process-discovery',
    label: 'Process Discovery & Mining',
    icon: <Database size={20} />,
    component: <ProcessDiscoveryMining />,
    category: 'AI & Intelligence',
  },
  {
    id: 'ai-optimization',
    label: 'AI Optimization',
    icon: <Sparkles size={20} />,
    component: <ProcessOptimizationAI />,
    category: 'AI & Intelligence',
  },
  {
    id: 'ai-recommendations',
    label: 'AI Recommendations',
    icon: <Lightbulb size={20} />,
    component: <AIRecommendations />,
    category: 'AI & Intelligence',
  },
  {
    id: 'process-simulation',
    label: 'Process Simulation',
    icon: <TrendingUp size={20} />,
    component: <ProcessSimulationEngine />,
    category: 'Advanced',
  },
  {
    id: 'compliance',
    label: 'Compliance Hub',
    icon: <Settings size={20} />,
    component: <ProcessComplianceHub />,
    category: 'Advanced',
  },
];

const AppContent: React.FC = () => {
  const { user, signOut } = useAuth();
  const [activeView, setActiveView] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  if (!user) {
    return <AuthForm />;
  }

  const activeItem = navItems.find((item) => item.id === activeView);

  const filteredNavItems = navItems.filter((item) =>
    item.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const groupedNavItems = filteredNavItems.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, NavItem[]>);

  return (
    <div className="flex h-screen bg-slate-50">
      <aside
        className={`${
          sidebarOpen ? 'w-72' : 'w-20'
        } bg-white border-r border-slate-200 transition-all duration-300 flex flex-col`}
      >
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-2.5 rounded-xl">
                <Workflow size={24} className="text-white" />
              </div>
              {sidebarOpen && (
                <div>
                  <h1 className="text-xl font-bold text-slate-800">OllieProcess</h1>
                  <p className="text-xs text-slate-500">Process Management</p>
                </div>
              )}
            </div>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <GitBranch size={18} className="text-slate-600" />
            </button>
          </div>
        </div>

        {sidebarOpen && (
          <div className="px-4 py-3 border-b border-slate-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                placeholder="Search modules..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        )}

        <nav className="flex-1 overflow-y-auto py-4">
          {sidebarOpen ? (
            <div className="space-y-6">
              {Object.entries(groupedNavItems).map(([category, items]) => (
                <div key={category}>
                  <h3 className="px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    {category}
                  </h3>
                  <div className="space-y-1 px-3">
                    {items.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => setActiveView(item.id)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all ${
                          activeView === item.id
                            ? 'bg-blue-50 text-blue-600 font-medium shadow-sm'
                            : 'text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {item.icon}
                        <span className="text-sm">{item.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-2 px-3">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveView(item.id)}
                  className={`w-full flex items-center justify-center p-3 rounded-lg transition-all ${
                    activeView === item.id
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                  title={item.label}
                >
                  {item.icon}
                </button>
              ))}
            </div>
          )}
        </nav>

        <div className="p-4 border-t border-slate-200">
          <div className={`flex items-center ${sidebarOpen ? 'justify-between' : 'justify-center'}`}>
            {sidebarOpen && (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                  {user.email?.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">{user.email}</p>
                  <p className="text-xs text-slate-500">Process Manager</p>
                </div>
              </div>
            )}
            <button
              onClick={signOut}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-600"
              title="Sign out"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        <div className="p-8">
          {activeItem?.component}
        </div>
      </main>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
