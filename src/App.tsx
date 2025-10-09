import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AuthForm } from './components/AuthForm';
import { keyboardNavigation } from './utils/keyboardNavigation';
import { screenReaderService } from './utils/screenReaderService';
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
  BookOpen,
  FileText,
  Bell,
  Volume2,
  VolumeX,
  Link,
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
  KnowledgeManagement,
  SmartKnowledgeManagement,
  TechnicalSpecs,
  EnhancedSOPBuilder,
  UserSettings,
  IntegrationManagement,
} from './modules';
import GlobalAIAssistant from './components/GlobalAIAssistant';
import { NotificationCenter } from './components/NotificationCenter';

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
  {
    id: 'knowledge-management',
    label: 'Knowledge Base',
    icon: <BookOpen size={20} />,
    component: <KnowledgeManagement />,
    category: 'Knowledge',
  },
  {
    id: 'smart-knowledge',
    label: 'Smart Knowledge AI',
    icon: <Sparkles size={20} />,
    component: <SmartKnowledgeManagement />,
    category: 'Knowledge',
  },
  {
    id: 'technical-specs',
    label: 'Technical Specs & SOPs',
    icon: <FileText size={20} />,
    component: <TechnicalSpecs />,
    category: 'Knowledge',
  },
  {
    id: 'sop-builder',
    label: 'SOP Builder',
    icon: <FileText size={20} />,
    component: <EnhancedSOPBuilder />,
    category: 'Knowledge',
  },
  {
    id: 'integrations',
    label: 'Integration Management',
    icon: <Link size={20} />,
    component: <IntegrationManagement />,
    category: 'Configuration',
  },
];

const AppContent: React.FC = () => {
  const { user, signOut, loading } = useAuth();
  const [activeView, setActiveView] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [screenReaderEnabled, setScreenReaderEnabled] = useState(screenReaderService.isEnabled());

  useEffect(() => {
    keyboardNavigation.init();
    document.body.classList.remove('no-keyboard-nav');

    const handleMouseDown = () => {
      document.body.classList.add('no-keyboard-nav');
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        document.body.classList.remove('no-keyboard-nav');
        document.body.classList.add('keyboard-navigating');
      }
    };

    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      keyboardNavigation.destroy();
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  useEffect(() => {
    if (activeView && screenReaderService.isEnabled()) {
      const moduleName = activeView === 'settings' ? 'Settings' :
                        navItems.find(item => item.id === activeView)?.label || 'Dashboard';
      screenReaderService.announceNavigation(moduleName);
    }
  }, [activeView]);

  const toggleScreenReader = () => {
    const newState = !screenReaderEnabled;
    setScreenReaderEnabled(newState);
    screenReaderService.setEnabled(newState);
  };

  const handleSignOut = async () => {
    console.log('Sign out clicked');
    try {
      await signOut();
      console.log('Sign out successful');
    } catch (error) {
      console.error('Sign out failed:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthForm />;
  }

  const activeItem = navItems.find((item) => item.id === activeView);

  const settingsView = activeView === 'settings' ? <UserSettings /> : null;

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
    <>
      <a href="#main-content" className="skip-to-main">
        Skip to main content
      </a>
      <div id="screen-reader-announcer" className="sr-only" aria-live="polite" aria-atomic="true"></div>

      <div className="flex h-screen bg-slate-50">
        <aside
          role="navigation"
          aria-label="Main navigation"
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
              aria-label={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
              aria-expanded={sidebarOpen}
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
                type="search"
                placeholder="Search modules..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                aria-label="Search modules"
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
                        data-module-id={item.id}
                        aria-label={`Navigate to ${item.label}`}
                        aria-current={activeView === item.id ? 'page' : undefined}
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
                  data-module-id={item.id}
                  aria-label={`Navigate to ${item.label}`}
                  aria-current={activeView === item.id ? 'page' : undefined}
                >
                  {item.icon}
                </button>
              ))}
            </div>
          )}
        </nav>

        <div className="p-4 border-t border-slate-200">
          {sidebarOpen ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                  {user.email?.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">{user.email}</p>
                  <p className="text-xs text-slate-500">Process Manager</p>
                </div>
                <button
                  onClick={() => setActiveView('settings')}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-600 hover:text-blue-600"
                  title="Settings"
                >
                  <Settings size={18} />
                </button>
              </div>
              <button
                onClick={handleSignOut}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors font-medium text-sm"
              >
                <LogOut size={16} />
                Sign Out
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <button
                onClick={() => setActiveView('settings')}
                className="w-full p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-600 hover:text-blue-600"
                title="Settings"
              >
                <Settings size={18} />
              </button>
              <button
                onClick={handleSignOut}
                className="w-full p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-600 hover:text-red-600"
                title="Sign out"
              >
                <LogOut size={18} />
              </button>
            </div>
          )}
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-800">
              {activeView === 'settings' ? 'Settings' : activeItem?.label || 'Dashboard'}
            </h2>
            <p className="text-sm text-slate-500 mt-0.5">
              {activeView === 'settings' ? 'Manage your account and preferences' : 'Welcome to your workspace'}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={toggleScreenReader}
              className={`p-2 rounded-lg transition-colors ${
                screenReaderEnabled
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
              title={screenReaderEnabled ? 'Disable screen reader' : 'Enable screen reader'}
              aria-label={screenReaderEnabled ? 'Disable screen reader' : 'Enable screen reader'}
              aria-pressed={screenReaderEnabled}
            >
              {screenReaderEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
            </button>

            <NotificationCenter />

            <button
              onClick={() => setActiveView('settings')}
              className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              title="Settings"
              aria-label="Open settings"
            >
              <Settings size={20} />
            </button>
          </div>
        </header>

        <main id="main-content" role="main" aria-label="Main content" className="flex-1 overflow-auto">
          <div className="p-8">
            {settingsView || activeItem?.component}
          </div>
        </main>
      </div>

      <GlobalAIAssistant
        currentModule={activeView}
        currentModuleName={activeView === 'settings' ? 'Settings' : activeItem?.label}
      />
      </div>
    </>
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
