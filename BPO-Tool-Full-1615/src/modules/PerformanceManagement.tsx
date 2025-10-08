import { createEnhancedModule } from '../utils/enhancedModuleGenerator';

export const PerformanceManagement = createEnhancedModule({
  title: 'Performance Management',
  description: 'Track agent performance and scorecards',
  tableName: 'agent_scorecards',
  ownerField: 'user_id',
  fields: [
    { name: 'period_start', label: 'Period Start', type: 'date', required: true },
    { name: 'period_end', label: 'Period End', type: 'date', required: true },
    { name: 'calls_handled', label: 'Calls Handled', type: 'number', defaultValue: 0 },
    {
      name: 'average_handle_time',
      label: 'Avg Handle Time (sec)',
      type: 'number',
      defaultValue: 0,
    },
    { name: 'occupancy_rate', label: 'Occupancy Rate (%)', type: 'number', defaultValue: 0 },
    { name: 'adherence_rate', label: 'Adherence Rate (%)', type: 'number', defaultValue: 0 },
    { name: 'csat_score', label: 'CSAT Score', type: 'number', defaultValue: 0 },
    { name: 'qa_score', label: 'QA Score', type: 'number', defaultValue: 0 },
    { name: 'fcr_rate', label: 'FCR Rate (%)', type: 'number', defaultValue: 0 },
    { name: 'overall_score', label: 'Overall Score', type: 'number', defaultValue: 0 },
  ],
  displayFields: [
    'period_start',
    'period_end',
    'calls_handled',
    'csat_score',
    'overall_score',
  ],
});
