import { createEnhancedModule } from '../utils/enhancedModuleGenerator';

export const CoachingPlans = createEnhancedModule({
  title: 'Coaching Plans',
  description: 'Create and track agent coaching plans',
  tableName: 'coaching_plans',
  ownerField: 'coach_id',
  statusField: 'status',
  fields: [
    { name: 'title', label: 'Plan Title', type: 'text', required: true, searchable: true },
    { name: 'description', label: 'Description', type: 'textarea', searchable: true },
    { name: 'start_date', label: 'Start Date', type: 'date', required: true },
    { name: 'target_completion_date', label: 'Target Completion', type: 'date' },
    {
      name: 'status',
      label: 'Status',
      type: 'select',
      defaultValue: 'active',
      options: [
        { value: 'active', label: 'Active' },
        { value: 'completed', label: 'Completed' },
        { value: 'cancelled', label: 'Cancelled' },
      ],
    },
    { name: 'progress_notes', label: 'Progress Notes', type: 'textarea' },
  ],
  displayFields: ['title', 'start_date', 'target_completion_date', 'status'],
  filters: [
    {
      name: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { value: 'active', label: 'Active' },
        { value: 'completed', label: 'Completed' },
        { value: 'cancelled', label: 'Cancelled' },
      ],
    },
  ],
});
