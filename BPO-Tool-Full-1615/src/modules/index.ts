import { createModule } from '../utils/moduleGenerator';
import { createEnhancedModule } from '../utils/enhancedModuleGenerator';

export { Dashboard } from './Dashboard';
export { EnhancedDashboard } from './EnhancedDashboard';
export { ProcessMapping } from './ProcessMapping';
export { EnhancedProcessMapping } from './EnhancedProcessMapping';
export { VisualBPMN } from './VisualBPMN';
export { ProjectGantt } from './ProjectGantt';
export { TechnicalSpecs } from './TechnicalSpecs';
export { SmartAutomation } from './SmartAutomation';
export { NLQueryModule } from './NLQueryModule';
export { PredictiveAnalyticsModule } from './PredictiveAnalyticsModule';

export { RealTimeOps } from './RealTimeOps';
export { WorkforceManagement } from './WorkforceManagement';
export { AttendanceTracking } from './AttendanceTracking';
export { TimeOffRequests } from './TimeOffRequests';
export { QualityAssurance } from './QualityAssurance';
export { PerformanceManagement } from './PerformanceManagement';
export { ContactCenter } from './ContactCenter';
export { EnhancedContactCenter } from './EnhancedContactCenter';
export { InteractionLog } from './InteractionLog';
export { KnowledgeBase } from './KnowledgeBase';
export { ClientManagement } from './ClientManagement';
export { AlertMonitoring } from './AlertMonitoring';
export { CoachingPlans } from './CoachingPlans';
export { CSATSurveys } from './CSATSurveys';
export { AccessControl } from './AccessControl';
export { ComplaintsManagement } from './ComplaintsManagement';
export { EnhancedComplaintsManagement } from './EnhancedComplaintsManagement';
export { ApprovalsQueue } from './ApprovalsQueue';
export { AIConfiguration } from './AIConfiguration';
export { default as AttritionPrediction } from './AttritionPrediction';
export { default as ProfitabilityDashboard } from './ProfitabilityDashboard';
export { default as AutoResolutionEngine } from './AutoResolutionEngine';
export { default as ProcessExecution } from './ProcessExecution';
export { default as MyProcessTasks } from './MyProcessTasks';
export { default as ProcessAnalytics } from './ProcessAnalytics';
export { default as BottleneckDetection } from './BottleneckDetection';
export { default as ProcessPerformance } from './ProcessPerformance';
export { default as AIRecommendations } from './AIRecommendations';
export { default as SmartTaskAssignment } from './SmartTaskAssignment';
export { default as KnowledgeManagement } from './KnowledgeManagement';
export { default as ComplianceDashboard } from './ComplianceDashboard';
export { default as IntegrationHub } from './IntegrationHub';
export { default as EnhancedProcessManagement } from './EnhancedProcessManagement';

export const BPMNBuilder = createEnhancedModule({
  title: 'BPMN Builder',
  description: 'Build and manage BPMN process diagrams',
  tableName: 'processes',
  ownerField: 'owner_id',
  statusField: 'status',
  fields: [
    { name: 'name', label: 'Process Name', type: 'text', required: true, searchable: true },
    { name: 'description', label: 'Description', type: 'textarea', searchable: true },
    { name: 'category', label: 'Category', type: 'text', searchable: true },
    {
      name: 'status',
      label: 'Status',
      type: 'select',
      defaultValue: 'draft',
      options: [
        { value: 'draft', label: 'Draft' },
        { value: 'active', label: 'Active' },
        { value: 'archived', label: 'Archived' },
      ],
    },
  ],
  displayFields: ['name', 'category'],
  filters: [
    {
      name: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { value: 'draft', label: 'Draft' },
        { value: 'active', label: 'Active' },
        { value: 'archived', label: 'Archived' },
      ],
    },
  ],
});

export const SOPBuilder = createEnhancedModule({
  title: 'SOP Builder',
  description: 'Create and manage Standard Operating Procedures',
  tableName: 'sops',
  ownerField: 'created_by',
  statusField: 'status',
  fields: [
    { name: 'title', label: 'SOP Title', type: 'text', required: true, searchable: true },
    { name: 'content', label: 'Content', type: 'textarea', required: true, searchable: true },
    { name: 'version', label: 'Version', type: 'text', defaultValue: '1.0' },
    {
      name: 'status',
      label: 'Status',
      type: 'select',
      defaultValue: 'draft',
      options: [
        { value: 'draft', label: 'Draft' },
        { value: 'published', label: 'Published' },
        { value: 'archived', label: 'Archived' },
      ],
    },
  ],
  displayFields: ['title', 'version'],
  filters: [
    {
      name: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { value: 'draft', label: 'Draft' },
        { value: 'published', label: 'Published' },
        { value: 'archived', label: 'Archived' },
      ],
    },
  ],
});

export const KPIManager = createEnhancedModule({
  title: 'KPI Manager',
  description: 'Track and manage Key Performance Indicators',
  tableName: 'kpis',
  statusField: 'status',
  fields: [
    { name: 'name', label: 'KPI Name', type: 'text', required: true, searchable: true },
    { name: 'description', label: 'Description', type: 'textarea', searchable: true },
    { name: 'target_value', label: 'Target Value', type: 'number', required: true },
    { name: 'current_value', label: 'Current Value', type: 'number', defaultValue: 0 },
    { name: 'unit', label: 'Unit', type: 'text' },
    {
      name: 'frequency',
      label: 'Frequency',
      type: 'select',
      defaultValue: 'monthly',
      options: [
        { value: 'daily', label: 'Daily' },
        { value: 'weekly', label: 'Weekly' },
        { value: 'monthly', label: 'Monthly' },
        { value: 'quarterly', label: 'Quarterly' },
      ],
    },
    {
      name: 'status',
      label: 'Status',
      type: 'select',
      defaultValue: 'on_track',
      options: [
        { value: 'on_track', label: 'On Track' },
        { value: 'at_risk', label: 'At Risk' },
        { value: 'off_track', label: 'Off Track' },
      ],
    },
  ],
  displayFields: ['name', 'current_value', 'target_value'],
  filters: [
    {
      name: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { value: 'on_track', label: 'On Track' },
        { value: 'at_risk', label: 'At Risk' },
        { value: 'off_track', label: 'Off Track' },
      ],
    },
    {
      name: 'frequency',
      label: 'Frequency',
      type: 'select',
      options: [
        { value: 'daily', label: 'Daily' },
        { value: 'weekly', label: 'Weekly' },
        { value: 'monthly', label: 'Monthly' },
        { value: 'quarterly', label: 'Quarterly' },
      ],
    },
  ],
});

export const ProjectManager = createEnhancedModule({
  title: 'Project Manager',
  description: 'Plan and track projects',
  tableName: 'projects',
  ownerField: 'owner_id',
  statusField: 'status',
  fields: [
    { name: 'name', label: 'Project Name', type: 'text', required: true },
    { name: 'description', label: 'Description', type: 'textarea' },
    {
      name: 'status',
      label: 'Status',
      type: 'select',
      defaultValue: 'planning',
      options: [
        { value: 'planning', label: 'Planning' },
        { value: 'active', label: 'Active' },
        { value: 'on_hold', label: 'On Hold' },
        { value: 'completed', label: 'Completed' },
      ],
    },
    {
      name: 'priority',
      label: 'Priority',
      type: 'select',
      defaultValue: 'medium',
      options: [
        { value: 'low', label: 'Low' },
        { value: 'medium', label: 'Medium' },
        { value: 'high', label: 'High' },
        { value: 'critical', label: 'Critical' },
      ],
    },
    { name: 'start_date', label: 'Start Date', type: 'date' },
    { name: 'end_date', label: 'End Date', type: 'date' },
    { name: 'budget', label: 'Budget', type: 'number' },
  ],
  displayFields: ['name', 'priority'],
});

export const ChangeInitiatives = createEnhancedModule({
  title: 'Change Initiatives',
  description: 'Manage organizational change initiatives',
  tableName: 'change_initiatives',
  ownerField: 'owner_id',
  statusField: 'status',
  fields: [
    { name: 'title', label: 'Title', type: 'text', required: true },
    { name: 'description', label: 'Description', type: 'textarea' },
    { name: 'type', label: 'Type', type: 'text', required: true },
    {
      name: 'status',
      label: 'Status',
      type: 'select',
      defaultValue: 'planning',
      options: [
        { value: 'planning', label: 'Planning' },
        { value: 'in_progress', label: 'In Progress' },
        { value: 'completed', label: 'Completed' },
      ],
    },
    {
      name: 'priority',
      label: 'Priority',
      type: 'select',
      defaultValue: 'medium',
      options: [
        { value: 'low', label: 'Low' },
        { value: 'medium', label: 'Medium' },
        { value: 'high', label: 'High' },
      ],
    },
    { name: 'start_date', label: 'Start Date', type: 'date' },
    { name: 'end_date', label: 'End Date', type: 'date' },
  ],
  displayFields: ['title', 'type'],
});

export const StakeholderManagement = createEnhancedModule({
  title: 'Stakeholder Management',
  description: 'Track and engage with stakeholders',
  tableName: 'stakeholders',
  fields: [
    { name: 'name', label: 'Name', type: 'text', required: true },
    { name: 'role', label: 'Role', type: 'text' },
    { name: 'department', label: 'Department', type: 'text' },
    {
      name: 'influence',
      label: 'Influence',
      type: 'select',
      required: true,
      options: [
        { value: 'high', label: 'High' },
        { value: 'medium', label: 'Medium' },
        { value: 'low', label: 'Low' },
      ],
    },
    {
      name: 'support_level',
      label: 'Support Level',
      type: 'select',
      required: true,
      options: [
        { value: 'champion', label: 'Champion' },
        { value: 'supporter', label: 'Supporter' },
        { value: 'neutral', label: 'Neutral' },
        { value: 'resistant', label: 'Resistant' },
      ],
    },
    { name: 'engagement_strategy', label: 'Engagement Strategy', type: 'textarea' },
    { name: 'contact_email', label: 'Email', type: 'email' },
    { name: 'contact_phone', label: 'Phone', type: 'text' },
  ],
  displayFields: ['name', 'role', 'influence'],
});

export const CommunicationPlans = createEnhancedModule({
  title: 'Communication Plans',
  description: 'Plan and schedule communications',
  tableName: 'communication_plans',
  statusField: 'status',
  fields: [
    { name: 'title', label: 'Title', type: 'text', required: true },
    { name: 'audience', label: 'Audience', type: 'text', required: true },
    { name: 'message', label: 'Message', type: 'textarea', required: true },
    {
      name: 'channel',
      label: 'Channel',
      type: 'select',
      required: true,
      options: [
        { value: 'email', label: 'Email' },
        { value: 'meeting', label: 'Meeting' },
        { value: 'newsletter', label: 'Newsletter' },
        { value: 'presentation', label: 'Presentation' },
        { value: 'intranet', label: 'Intranet' },
      ],
    },
    {
      name: 'frequency',
      label: 'Frequency',
      type: 'select',
      required: true,
      options: [
        { value: 'once', label: 'One-time' },
        { value: 'daily', label: 'Daily' },
        { value: 'weekly', label: 'Weekly' },
        { value: 'monthly', label: 'Monthly' },
      ],
    },
    { name: 'responsible_party', label: 'Responsible Party', type: 'text' },
    { name: 'scheduled_date', label: 'Scheduled Date', type: 'date' },
    {
      name: 'status',
      label: 'Status',
      type: 'select',
      defaultValue: 'planned',
      options: [
        { value: 'planned', label: 'Planned' },
        { value: 'sent', label: 'Sent' },
        { value: 'completed', label: 'Completed' },
      ],
    },
  ],
  displayFields: ['title', 'audience', 'channel'],
});

export const TrainingPrograms = createEnhancedModule({
  title: 'Training & Adoption',
  description: 'Manage training programs and adoption initiatives',
  tableName: 'training_programs',
  statusField: 'status',
  fields: [
    { name: 'title', label: 'Title', type: 'text', required: true },
    { name: 'description', label: 'Description', type: 'textarea' },
    { name: 'target_audience', label: 'Target Audience', type: 'text', required: true },
    {
      name: 'delivery_method',
      label: 'Delivery Method',
      type: 'select',
      required: true,
      options: [
        { value: 'in_person', label: 'In-Person' },
        { value: 'virtual', label: 'Virtual' },
        { value: 'hybrid', label: 'Hybrid' },
        { value: 'self_paced', label: 'Self-Paced' },
      ],
    },
    { name: 'duration_hours', label: 'Duration (hours)', type: 'number' },
    { name: 'scheduled_date', label: 'Scheduled Date', type: 'date' },
    { name: 'trainer', label: 'Trainer', type: 'text' },
    {
      name: 'status',
      label: 'Status',
      type: 'select',
      defaultValue: 'planned',
      options: [
        { value: 'planned', label: 'Planned' },
        { value: 'in_progress', label: 'In Progress' },
        { value: 'completed', label: 'Completed' },
      ],
    },
  ],
  displayFields: ['title', 'target_audience', 'delivery_method'],
});

export const ResistanceManagement = createEnhancedModule({
  title: 'Resistance Management',
  description: 'Track and address resistance to change',
  tableName: 'resistance_items',
  statusField: 'status',
  fields: [
    { name: 'title', label: 'Title', type: 'text', required: true },
    { name: 'description', label: 'Description', type: 'textarea' },
    { name: 'source', label: 'Source', type: 'text', required: true },
    {
      name: 'severity',
      label: 'Severity',
      type: 'select',
      required: true,
      options: [
        { value: 'low', label: 'Low' },
        { value: 'medium', label: 'Medium' },
        { value: 'high', label: 'High' },
        { value: 'critical', label: 'Critical' },
      ],
    },
    { name: 'mitigation_strategy', label: 'Mitigation Strategy', type: 'textarea' },
    {
      name: 'status',
      label: 'Status',
      type: 'select',
      defaultValue: 'identified',
      options: [
        { value: 'identified', label: 'Identified' },
        { value: 'addressing', label: 'Addressing' },
        { value: 'resolved', label: 'Resolved' },
      ],
    },
  ],
  displayFields: ['title', 'source', 'severity'],
});

export const ReadinessAssessment = createEnhancedModule({
  title: 'Readiness Assessment',
  description: 'Assess organizational readiness for change',
  tableName: 'readiness_assessments',
  fields: [
    { name: 'assessment_name', label: 'Assessment Name', type: 'text', required: true },
    { name: 'assessment_date', label: 'Assessment Date', type: 'date', required: true },
    { name: 'area', label: 'Area', type: 'text', required: true },
    { name: 'score', label: 'Score', type: 'number', required: true },
    { name: 'max_score', label: 'Max Score', type: 'number', defaultValue: 100 },
    { name: 'findings', label: 'Findings', type: 'textarea' },
    { name: 'recommendations', label: 'Recommendations', type: 'textarea' },
  ],
  displayFields: ['assessment_name', 'area', 'score'],
});

export const ImpactAnalysis = createEnhancedModule({
  title: 'Impact Analysis',
  description: 'Analyze impact of changes',
  tableName: 'impact_analyses',
  statusField: 'status',
  fields: [
    { name: 'area', label: 'Area', type: 'text', required: true },
    { name: 'description', label: 'Description', type: 'textarea', required: true },
    {
      name: 'impact_level',
      label: 'Impact Level',
      type: 'select',
      required: true,
      options: [
        { value: 'low', label: 'Low' },
        { value: 'medium', label: 'Medium' },
        { value: 'high', label: 'High' },
        { value: 'critical', label: 'Critical' },
      ],
    },
    { name: 'affected_stakeholders', label: 'Affected Stakeholders', type: 'textarea' },
    { name: 'mitigation_actions', label: 'Mitigation Actions', type: 'textarea' },
    { name: 'timeline', label: 'Timeline', type: 'text' },
    {
      name: 'status',
      label: 'Status',
      type: 'select',
      defaultValue: 'draft',
      options: [
        { value: 'draft', label: 'Draft' },
        { value: 'reviewed', label: 'Reviewed' },
        { value: 'approved', label: 'Approved' },
      ],
    },
  ],
  displayFields: ['area', 'impact_level'],
});

export const WorkflowAutomation = createEnhancedModule({
  title: 'Workflow Automation',
  description: 'Automate business workflows',
  tableName: 'workflow_automations',
  ownerField: 'created_by',
  statusField: 'status',
  fields: [
    { name: 'name', label: 'Workflow Name', type: 'text', required: true },
    { name: 'description', label: 'Description', type: 'textarea' },
    {
      name: 'trigger_type',
      label: 'Trigger Type',
      type: 'select',
      required: true,
      options: [
        { value: 'manual', label: 'Manual' },
        { value: 'scheduled', label: 'Scheduled' },
        { value: 'event', label: 'Event-based' },
      ],
    },
    {
      name: 'status',
      label: 'Status',
      type: 'select',
      defaultValue: 'draft',
      options: [
        { value: 'draft', label: 'Draft' },
        { value: 'active', label: 'Active' },
        { value: 'paused', label: 'Paused' },
      ],
    },
  ],
  displayFields: ['name', 'trigger_type'],
});

export const Analytics = createEnhancedModule({
  title: 'Analytics',
  description: 'Advanced analytics and insights',
  tableName: 'analytics_reports',
  ownerField: 'created_by',
  fields: [
    { name: 'name', label: 'Report Name', type: 'text', required: true },
    { name: 'description', label: 'Description', type: 'textarea' },
    {
      name: 'report_type',
      label: 'Report Type',
      type: 'select',
      required: true,
      options: [
        { value: 'performance', label: 'Performance' },
        { value: 'financial', label: 'Financial' },
        { value: 'operational', label: 'Operational' },
        { value: 'custom', label: 'Custom' },
      ],
    },
    {
      name: 'schedule',
      label: 'Schedule',
      type: 'select',
      options: [
        { value: 'daily', label: 'Daily' },
        { value: 'weekly', label: 'Weekly' },
        { value: 'monthly', label: 'Monthly' },
      ],
    },
  ],
  displayFields: ['name', 'report_type'],
});

export const ExecutiveDashboards = createEnhancedModule({
  title: 'Executive Dashboards',
  description: 'Custom dashboard builder',
  tableName: 'dashboards',
  ownerField: 'created_by',
  fields: [
    { name: 'name', label: 'Dashboard Name', type: 'text', required: true },
    { name: 'description', label: 'Description', type: 'textarea' },
  ],
  displayFields: ['name'],
});

export const Reporting = createEnhancedModule({
  title: 'Reporting',
  description: 'Custom report generator',
  tableName: 'analytics_reports',
  ownerField: 'created_by',
  fields: [
    { name: 'name', label: 'Report Name', type: 'text', required: true },
    { name: 'description', label: 'Description', type: 'textarea' },
    {
      name: 'report_type',
      label: 'Type',
      type: 'select',
      required: true,
      options: [
        { value: 'summary', label: 'Summary' },
        { value: 'detailed', label: 'Detailed' },
        { value: 'comparison', label: 'Comparison' },
      ],
    },
  ],
  displayFields: ['name', 'report_type'],
});

export const TransitionProjects = createEnhancedModule({
  title: 'Transition Projects',
  description: 'Manage organizational transitions',
  tableName: 'transition_projects',
  ownerField: 'owner_id',
  statusField: 'status',
  fields: [
    { name: 'name', label: 'Project Name', type: 'text', required: true },
    {
      name: 'project_type',
      label: 'Type',
      type: 'select',
      required: true,
      options: [
        { value: 'hr_transformation', label: 'HR Transformation' },
        { value: 'digital_transformation', label: 'Digital Transformation' },
        { value: 'culture_change', label: 'Culture Change' },
        { value: 'billing_transition', label: 'Billing Transition' },
        { value: 'it_support_transition', label: 'IT Support Transition' },
        { value: 'bi_reporting_transition', label: 'BI & Reporting Transition' },
        { value: 'training_development', label: 'Training & Development' },
      ],
    },
    { name: 'description', label: 'Description', type: 'textarea' },
    {
      name: 'status',
      label: 'Status',
      type: 'select',
      defaultValue: 'planning',
      options: [
        { value: 'planning', label: 'Planning' },
        { value: 'in_progress', label: 'In Progress' },
        { value: 'completed', label: 'Completed' },
      ],
    },
    { name: 'start_date', label: 'Start Date', type: 'date' },
    { name: 'end_date', label: 'End Date', type: 'date' },
    { name: 'current_state', label: 'Current State', type: 'textarea' },
    { name: 'target_state', label: 'Target State', type: 'textarea' },
  ],
  displayFields: ['name', 'project_type'],
});

export const PolicyManagement = createEnhancedModule({
  title: 'Policy Management',
  description: 'Manage organizational policies',
  tableName: 'policies',
  ownerField: 'owner_id',
  statusField: 'status',
  fields: [
    { name: 'title', label: 'Policy Title', type: 'text', required: true },
    { name: 'description', label: 'Description', type: 'textarea' },
    { name: 'category', label: 'Category', type: 'text', required: true },
    { name: 'content', label: 'Policy Content', type: 'textarea', required: true },
    { name: 'version', label: 'Version', type: 'text', defaultValue: '1.0' },
    {
      name: 'status',
      label: 'Status',
      type: 'select',
      defaultValue: 'draft',
      options: [
        { value: 'draft', label: 'Draft' },
        { value: 'active', label: 'Active' },
        { value: 'archived', label: 'Archived' },
      ],
    },
    { name: 'effective_date', label: 'Effective Date', type: 'date' },
    { name: 'review_date', label: 'Review Date', type: 'date' },
  ],
  displayFields: ['title', 'category', 'version'],
});

export const ComplianceTracking = createEnhancedModule({
  title: 'Compliance Tracking',
  description: 'Track compliance requirements',
  tableName: 'compliance_requirements',
  statusField: 'status',
  fields: [
    { name: 'title', label: 'Requirement Title', type: 'text', required: true },
    { name: 'description', label: 'Description', type: 'textarea' },
    { name: 'regulation', label: 'Regulation', type: 'text', required: true },
    {
      name: 'requirement_level',
      label: 'Requirement Level',
      type: 'select',
      required: true,
      options: [
        { value: 'mandatory', label: 'Mandatory' },
        { value: 'recommended', label: 'Recommended' },
        { value: 'optional', label: 'Optional' },
      ],
    },
    {
      name: 'status',
      label: 'Status',
      type: 'select',
      defaultValue: 'pending',
      options: [
        { value: 'pending', label: 'Pending' },
        { value: 'in_progress', label: 'In Progress' },
        { value: 'compliant', label: 'Compliant' },
        { value: 'non_compliant', label: 'Non-Compliant' },
      ],
    },
    { name: 'due_date', label: 'Due Date', type: 'date' },
    { name: 'evidence_url', label: 'Evidence URL', type: 'text' },
  ],
  displayFields: ['title', 'regulation', 'requirement_level'],
});

export const AuditTrails = createEnhancedModule({
  title: 'Audit Trails',
  description: 'System audit history',
  tableName: 'audit_logs',
  fields: [
    { name: 'action', label: 'Action', type: 'text', required: true },
    { name: 'resource_type', label: 'Resource Type', type: 'text', required: true },
    { name: 'resource_id', label: 'Resource ID', type: 'text' },
  ],
  displayFields: ['action', 'resource_type'],
});

export const RACIMatrix = createEnhancedModule({
  title: 'RACI Matrix',
  description: 'Responsibility assignment matrix',
  tableName: 'raci_matrix',
  fields: [
    { name: 'task_name', label: 'Task Name', type: 'text', required: true },
    { name: 'responsible', label: 'Responsible', type: 'text' },
    { name: 'accountable', label: 'Accountable', type: 'text' },
    { name: 'consulted', label: 'Consulted', type: 'text' },
    { name: 'informed', label: 'Informed', type: 'text' },
    { name: 'notes', label: 'Notes', type: 'textarea' },
  ],
  displayFields: ['task_name', 'responsible', 'accountable'],
});

export const RiskAnalysis = createEnhancedModule({
  title: 'Risk Analysis',
  description: 'Identify and mitigate risks',
  tableName: 'risks',
  ownerField: 'owner_id',
  statusField: 'status',
  fields: [
    { name: 'title', label: 'Risk Title', type: 'text', required: true },
    { name: 'description', label: 'Description', type: 'textarea' },
    { name: 'category', label: 'Category', type: 'text', required: true },
    {
      name: 'probability',
      label: 'Probability',
      type: 'select',
      required: true,
      options: [
        { value: 'low', label: 'Low' },
        { value: 'medium', label: 'Medium' },
        { value: 'high', label: 'High' },
      ],
    },
    {
      name: 'impact',
      label: 'Impact',
      type: 'select',
      required: true,
      options: [
        { value: 'low', label: 'Low' },
        { value: 'medium', label: 'Medium' },
        { value: 'high', label: 'High' },
      ],
    },
    { name: 'mitigation_plan', label: 'Mitigation Plan', type: 'textarea' },
    {
      name: 'status',
      label: 'Status',
      type: 'select',
      defaultValue: 'identified',
      options: [
        { value: 'identified', label: 'Identified' },
        { value: 'mitigating', label: 'Mitigating' },
        { value: 'closed', label: 'Closed' },
      ],
    },
  ],
  displayFields: ['title', 'category', 'probability', 'impact'],
});

export const Finance = createEnhancedModule({
  title: 'Finance',
  description: 'Financial management and budgeting',
  tableName: 'budgets',
  fields: [
    { name: 'category', label: 'Category', type: 'text', required: true },
    { name: 'allocated_amount', label: 'Allocated Amount', type: 'number', required: true },
    { name: 'spent_amount', label: 'Spent Amount', type: 'number', defaultValue: 0 },
    { name: 'fiscal_year', label: 'Fiscal Year', type: 'text', required: true },
    { name: 'notes', label: 'Notes', type: 'textarea' },
  ],
  displayFields: ['category', 'allocated_amount', 'spent_amount'],
});

export const TeamManagement = createEnhancedModule({
  title: 'Team Management',
  description: 'Manage teams and team members',
  tableName: 'teams',
  fields: [
    { name: 'name', label: 'Team Name', type: 'text', required: true },
    { name: 'description', label: 'Description', type: 'textarea' },
    { name: 'department', label: 'Department', type: 'text' },
  ],
  displayFields: ['name', 'department'],
});

export const CapacityPlanning = createEnhancedModule({
  title: 'Capacity Planning',
  description: 'Plan and manage resource capacity',
  tableName: 'capacity_plans',
  fields: [
    { name: 'period_start', label: 'Period Start', type: 'date', required: true },
    { name: 'period_end', label: 'Period End', type: 'date', required: true },
    {
      name: 'total_capacity_hours',
      label: 'Total Capacity (hours)',
      type: 'number',
      required: true,
    },
    { name: 'allocated_hours', label: 'Allocated Hours', type: 'number', defaultValue: 0 },
    { name: 'notes', label: 'Notes', type: 'textarea' },
  ],
  displayFields: ['period_start', 'period_end', 'total_capacity_hours'],
});

export const BudgetTracking = createEnhancedModule({
  title: 'Budget Tracking',
  description: 'Track budget allocation and spending',
  tableName: 'budgets',
  fields: [
    { name: 'category', label: 'Budget Category', type: 'text', required: true },
    { name: 'allocated_amount', label: 'Allocated Amount', type: 'number', required: true },
    { name: 'spent_amount', label: 'Spent Amount', type: 'number', defaultValue: 0 },
    { name: 'fiscal_year', label: 'Fiscal Year', type: 'text', required: true },
    { name: 'notes', label: 'Notes', type: 'textarea' },
  ],
  displayFields: ['category', 'fiscal_year', 'allocated_amount'],
});

export const TimeTracking = createEnhancedModule({
  title: 'Time Tracking',
  description: 'Track time and effort',
  tableName: 'time_entries',
  ownerField: 'user_id',
  statusField: 'status',
  fields: [
    { name: 'task_description', label: 'Task Description', type: 'text', required: true },
    { name: 'hours', label: 'Hours', type: 'number', required: true },
    { name: 'entry_date', label: 'Date', type: 'date', required: true },
    { name: 'notes', label: 'Notes', type: 'textarea' },
    {
      name: 'status',
      label: 'Status',
      type: 'select',
      defaultValue: 'pending',
      options: [
        { value: 'pending', label: 'Pending' },
        { value: 'approved', label: 'Approved' },
        { value: 'rejected', label: 'Rejected' },
      ],
    },
  ],
  displayFields: ['task_description', 'hours', 'entry_date'],
});

export const ContinuousImprovement = createEnhancedModule({
  title: 'Continuous Improvement',
  description: 'Kaizen and improvement initiatives',
  tableName: 'improvements',
  ownerField: 'submitted_by',
  statusField: 'status',
  fields: [
    { name: 'title', label: 'Title', type: 'text', required: true },
    { name: 'description', label: 'Description', type: 'textarea' },
    {
      name: 'type',
      label: 'Type',
      type: 'select',
      required: true,
      options: [
        { value: 'process', label: 'Process Improvement' },
        { value: 'cost', label: 'Cost Reduction' },
        { value: 'quality', label: 'Quality Enhancement' },
        { value: 'efficiency', label: 'Efficiency Gain' },
      ],
    },
    {
      name: 'status',
      label: 'Status',
      type: 'select',
      defaultValue: 'proposed',
      options: [
        { value: 'proposed', label: 'Proposed' },
        { value: 'approved', label: 'Approved' },
        { value: 'implementing', label: 'Implementing' },
        { value: 'completed', label: 'Completed' },
      ],
    },
    {
      name: 'priority',
      label: 'Priority',
      type: 'select',
      defaultValue: 'medium',
      options: [
        { value: 'low', label: 'Low' },
        { value: 'medium', label: 'Medium' },
        { value: 'high', label: 'High' },
      ],
    },
    { name: 'estimated_savings', label: 'Estimated Savings', type: 'number' },
  ],
  displayFields: ['title', 'type', 'priority'],
});

export const AIDocumentProcessor = createEnhancedModule({
  title: 'AI Document Processor',
  description: 'Process documents with AI',
  tableName: 'processes',
  fields: [
    { name: 'name', label: 'Document Name', type: 'text', required: true },
    { name: 'description', label: 'Description', type: 'textarea' },
    { name: 'category', label: 'Category', type: 'text' },
  ],
  displayFields: ['name', 'category'],
});

export { default as ErlangCCalculator } from './ErlangCCalculator';
export { default as LiveChat } from './LiveChat';
export { default as UnifiedInbox } from './UnifiedInbox';
export { default as WorkforceForecast } from './WorkforceForecast';
export { default as AIComplaintRouting } from './AIComplaintRouting';
export { AISupportAssistant } from './AISupportAssistant';
export { CustomReportBuilder } from './CustomReportBuilder';
export { AdvancedPredictiveAnalytics } from './AdvancedPredictiveAnalytics';
export { default as AIOperationsDashboard } from './AIOperationsDashboard';
export { default as IntegratedContactCenter } from './IntegratedContactCenter';
export { default as IntegratedComplaints } from './IntegratedComplaints';

export { ProcessDiscoveryMining } from './ProcessDiscoveryMining';
export { ProcessSimulationEngine } from './ProcessSimulationEngine';
export { ProcessOptimizationAI } from './ProcessOptimizationAI';
export { ProcessComplianceHub } from './ProcessComplianceHub';
export { DynamicProcessOrchestrator } from './DynamicProcessOrchestrator';
export { PredictiveWorkforceIntelligence } from './PredictiveWorkforceIntelligence';
export { ClientSuccessPlatform } from './ClientSuccessPlatform';
export { SmartKnowledgeManagement } from './SmartKnowledgeManagement';
export { AdvancedAnalyticsBI } from './AdvancedAnalyticsBI';
