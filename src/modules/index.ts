import { createEnhancedModule } from '../utils/enhancedModuleGenerator';

export { ProcessDashboard } from './ProcessDashboard';
export { ProcessMapping } from './ProcessMapping';
export { EnhancedProcessMapping } from './EnhancedProcessMapping';
export { default as EnhancedProcessManagement } from './EnhancedProcessManagement';
export { VisualBPMN } from './VisualBPMN';
export { default as ProcessExecution } from './ProcessExecution';
export { default as ProcessAnalytics } from './ProcessAnalytics';
export { default as ProcessPerformance } from './ProcessPerformance';
export { default as MyProcessTasks } from './MyProcessTasks';
export { ProcessDiscoveryMining } from './ProcessDiscoveryMining';
export { ProcessOptimizationAI } from './ProcessOptimizationAI';
export { ProcessSimulationEngine } from './ProcessSimulationEngine';
export { ProcessComplianceHub } from './ProcessComplianceHub';
export { DynamicProcessOrchestrator } from './DynamicProcessOrchestrator';
export { default as BottleneckDetection } from './BottleneckDetection';
export { default as AIRecommendations } from './AIRecommendations';
export { ApprovalsQueue } from './ApprovalsQueue';
export { default as KnowledgeManagement } from './KnowledgeManagement';
export { SmartKnowledgeManagement } from './SmartKnowledgeManagement';
export { TechnicalSpecs } from './TechnicalSpecs';
export { default as EnhancedSOPBuilder } from './EnhancedSOPBuilder';
export { UserSettings } from './UserSettings';

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
