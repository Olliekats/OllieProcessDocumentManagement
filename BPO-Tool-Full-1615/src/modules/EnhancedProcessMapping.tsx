import { createEnhancedModule } from '../utils/enhancedModuleGenerator';

export const EnhancedProcessMapping = createEnhancedModule({
  title: 'Process Mapping',
  description: 'Document and manage business processes',
  tableName: 'process_mapping',
  ownerField: 'owner_id',
  statusField: 'status',
  fields: [
    { name: 'process_name', label: 'Process Name', type: 'text', required: true, searchable: true },
    { name: 'description', label: 'Description', type: 'textarea', searchable: true },
    { name: 'department', label: 'Department', type: 'text', required: true, searchable: true },
    {
      name: 'category',
      label: 'Category',
      type: 'select',
      required: true,
      options: [
        { value: 'core', label: 'Core' },
        { value: 'support', label: 'Support' },
        { value: 'management', label: 'Management' },
      ],
    },
    {
      name: 'complexity',
      label: 'Complexity',
      type: 'select',
      required: true,
      options: [
        { value: 'low', label: 'Low' },
        { value: 'medium', label: 'Medium' },
        { value: 'high', label: 'High' },
      ],
    },
    {
      name: 'status',
      label: 'Status',
      type: 'select',
      defaultValue: 'draft',
      options: [
        { value: 'draft', label: 'Draft' },
        { value: 'review', label: 'Under Review' },
        { value: 'approved', label: 'Approved' },
        { value: 'active', label: 'Active' },
        { value: 'archived', label: 'Archived' },
      ],
    },
    { name: 'cycle_time', label: 'Cycle Time (hours)', type: 'number' },
    { name: 'last_review_date', label: 'Last Review Date', type: 'date' },
  ],
  displayFields: ['process_name', 'department', 'category'],
  filters: [
    {
      name: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { value: 'draft', label: 'Draft' },
        { value: 'review', label: 'Under Review' },
        { value: 'approved', label: 'Approved' },
        { value: 'active', label: 'Active' },
        { value: 'archived', label: 'Archived' },
      ],
    },
    {
      name: 'category',
      label: 'Category',
      type: 'select',
      options: [
        { value: 'core', label: 'Core' },
        { value: 'support', label: 'Support' },
        { value: 'management', label: 'Management' },
      ],
    },
    {
      name: 'complexity',
      label: 'Complexity',
      type: 'select',
      options: [
        { value: 'low', label: 'Low' },
        { value: 'medium', label: 'Medium' },
        { value: 'high', label: 'High' },
      ],
    },
  ],
});
