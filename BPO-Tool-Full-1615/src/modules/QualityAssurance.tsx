import { createEnhancedModule } from '../utils/enhancedModuleGenerator';

export const QualityAssurance = createEnhancedModule({
  title: 'Quality Assurance',
  description: 'Manage QA evaluations and quality monitoring',
  tableName: 'qa_evaluations',
  ownerField: 'evaluator_id',
  statusField: 'status',
  fields: [
    { name: 'evaluation_date', label: 'Evaluation Date', type: 'date', required: true },
    { name: 'total_score', label: 'Total Score', type: 'number', required: true },
    {
      name: 'passed',
      label: 'Passed',
      type: 'select',
      required: true,
      options: [
        { value: 'true', label: 'Yes' },
        { value: 'false', label: 'No' },
      ],
    },
    { name: 'comments', label: 'Comments', type: 'textarea', searchable: true },
    {
      name: 'status',
      label: 'Status',
      type: 'select',
      defaultValue: 'completed',
      options: [
        { value: 'draft', label: 'Draft' },
        { value: 'completed', label: 'Completed' },
        { value: 'disputed', label: 'Disputed' },
        { value: 'calibrated', label: 'Calibrated' },
      ],
    },
  ],
  displayFields: ['evaluation_date', 'total_score', 'passed', 'status'],
  filters: [
    {
      name: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { value: 'draft', label: 'Draft' },
        { value: 'completed', label: 'Completed' },
        { value: 'disputed', label: 'Disputed' },
        { value: 'calibrated', label: 'Calibrated' },
      ],
    },
    {
      name: 'passed',
      label: 'Result',
      type: 'select',
      options: [
        { value: 'true', label: 'Passed' },
        { value: 'false', label: 'Failed' },
      ],
    },
  ],
});
