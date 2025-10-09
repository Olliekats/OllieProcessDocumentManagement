import { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AuthForm } from './components/AuthForm';
import { Layout } from './components/Layout';
import * as Modules from './modules';
import AISupportAssistant from './modules/AISupportAssistant';

const AppContent = () => {
  const { user, loading } = useAuth();
  const [currentModule, setCurrentModule] = useState('dashboard');

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return <AuthForm />;
  }

  const moduleComponents: Record<string, React.ComponentType> = {
    dashboard: Modules.EnhancedDashboard,
    'realtime-ops': Modules.RealTimeOps,
    'unified-inbox': Modules.UnifiedInbox,
    'live-chat': Modules.LiveChat,
    'contact-center-ai': Modules.EnhancedContactCenter,
    'interaction-log': Modules.InteractionLog,
    'complaints': Modules.EnhancedComplaintsManagement,
    'approvals-queue': Modules.ApprovalsQueue,
    'erlang-c': Modules.ErlangCCalculator,
    'workforce-forecast': Modules.WorkforceForecast,
    'ai-routing': Modules.AIComplaintRouting,
    'workforce-mgmt': Modules.WorkforceManagement,
    'attendance': Modules.AttendanceTracking,
    'time-off': Modules.TimeOffRequests,
    'quality-assurance': Modules.QualityAssurance,
    'performance-mgmt': Modules.PerformanceManagement,
    'coaching-plans': Modules.CoachingPlans,
    'csat-surveys': Modules.CSATSurveys,
    'knowledge-base': Modules.KnowledgeBase,
    'client-mgmt': Modules.ClientManagement,
    'alert-monitoring': Modules.AlertMonitoring,
    'access-control': Modules.AccessControl,
    'bpmn': Modules.VisualBPMN,
    'process-execution': Modules.ProcessExecution,
    'my-tasks': Modules.MyProcessTasks,
    'process-analytics': Modules.ProcessAnalytics,
    'bottleneck-detection': Modules.BottleneckDetection,
    'process-performance': Modules.ProcessPerformance,
    'ai-recommendations': Modules.AIRecommendations,
    'smart-task-assignment': Modules.SmartTaskAssignment,
    'knowledge-management': Modules.KnowledgeManagement,
    'compliance-dashboard': Modules.ComplianceDashboard,
    'integration-hub': Modules.IntegrationHub,
    'process-mapping': Modules.EnhancedProcessMapping,
    'workflow-automation': Modules.WorkflowAutomation,
    'smart-automation': Modules.SmartAutomation,
    'attrition-prediction': Modules.AttritionPrediction,
    'profitability': Modules.ProfitabilityDashboard,
    'auto-resolution': Modules.AutoResolutionEngine,
    'nl-query': Modules.NLQueryModule,
    'predictive-analytics': Modules.PredictiveAnalyticsModule,
    'sop': Modules.SOPBuilder,
    'kpi': Modules.KPIManager,
    'analytics': Modules.Analytics,
    'dashboards': Modules.ExecutiveDashboards,
    'reporting': Modules.Reporting,
    'projects': Modules.ProjectManager,
    'gantt-charts': Modules.ProjectGantt,
    'change-initiatives': Modules.ChangeInitiatives,
    'stakeholders': Modules.StakeholderManagement,
    'communications': Modules.CommunicationPlans,
    'training': Modules.TrainingPrograms,
    'resistance': Modules.ResistanceManagement,
    'readiness': Modules.ReadinessAssessment,
    'impact': Modules.ImpactAnalysis,
    'hr-transition': Modules.TransitionProjects,
    'digital-transition': Modules.TransitionProjects,
    'culture-transition': Modules.TransitionProjects,
    'billing-transition': Modules.TransitionProjects,
    'it-transition': Modules.TransitionProjects,
    'bi-transition': Modules.TransitionProjects,
    'training-transition': Modules.TransitionProjects,
    'policies': Modules.PolicyManagement,
    'compliance': Modules.ComplianceTracking,
    'audit': Modules.AuditTrails,
    'raci': Modules.RACIMatrix,
    'risks': Modules.RiskAnalysis,
    'finance': Modules.Finance,
    'teams': Modules.TeamManagement,
    'capacity': Modules.CapacityPlanning,
    'budget': Modules.BudgetTracking,
    'time-tracking': Modules.TimeTracking,
    'improvements': Modules.ContinuousImprovement,
    'ai-processor': Modules.AIDocumentProcessor,
    'tech-specs': Modules.TechnicalSpecs,
    'ai-config': Modules.AIConfiguration,
    'process-discovery': Modules.ProcessDiscoveryMining,
    'process-simulation': Modules.ProcessSimulationEngine,
    'process-optimization': Modules.ProcessOptimizationAI,
    'compliance-hub': Modules.ProcessComplianceHub,
    'orchestrator': Modules.DynamicProcessOrchestrator,
    'workforce-intelligence': Modules.PredictiveWorkforceIntelligence,
    'client-portals': Modules.ClientSuccessPlatform,
    'smart-kb': Modules.SmartKnowledgeManagement,
    'analytics-bi': Modules.AdvancedAnalyticsBI,
    'custom-reports': Modules.CustomReportBuilder,
    'advanced-predictions': Modules.AdvancedPredictiveAnalytics,
    'ai-ops-dashboard': Modules.AIOperationsDashboard,
    'integrated-contact-center': Modules.IntegratedContactCenter,
    'integrated-complaints': Modules.IntegratedComplaints,
  };

  const CurrentModuleComponent = moduleComponents[currentModule] || Modules.EnhancedDashboard;

  return (
    <Layout currentModule={currentModule} onModuleChange={setCurrentModule}>
      <CurrentModuleComponent />
      <AISupportAssistant />
    </Layout>
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
