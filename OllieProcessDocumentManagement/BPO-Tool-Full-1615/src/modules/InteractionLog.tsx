import { createEnhancedModule } from '../utils/enhancedModuleGenerator';

export const InteractionLog = createEnhancedModule({
  title: 'Interaction Log',
  description: 'View and manage customer interactions',
  tableName: 'interactions',
  ownerField: 'agent_id',
  statusField: 'status',
  fields: [
    { name: 'customer_name', label: 'Customer Name', type: 'text', searchable: true },
    { name: 'customer_email', label: 'Customer Email', type: 'email', searchable: true },
    { name: 'customer_phone', label: 'Customer Phone', type: 'text' },
    {
      name: 'interaction_type',
      label: 'Type',
      type: 'select',
      required: true,
      options: [
        { value: 'inbound', label: 'Inbound' },
        { value: 'outbound', label: 'Outbound' },
      ],
    },
    { name: 'start_time', label: 'Start Time', type: 'text', required: true },
    { name: 'end_time', label: 'End Time', type: 'text' },
    { name: 'duration_seconds', label: 'Duration (seconds)', type: 'number' },
    {
      name: 'status',
      label: 'Status',
      type: 'select',
      defaultValue: 'active',
      options: [
        { value: 'active', label: 'Active' },
        { value: 'completed', label: 'Completed' },
        { value: 'abandoned', label: 'Abandoned' },
        { value: 'transferred', label: 'Transferred' },
      ],
    },
    { name: 'disposition', label: 'Disposition', type: 'text' },
    { name: 'wrap_up_notes', label: 'Wrap-up Notes', type: 'textarea', searchable: true },
  ],
  displayFields: ['customer_name', 'interaction_type', 'start_time', 'status'],
  filters: [
    {
      name: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { value: 'active', label: 'Active' },
        { value: 'completed', label: 'Completed' },
        { value: 'abandoned', label: 'Abandoned' },
        { value: 'transferred', label: 'Transferred' },
      ],
    },
    {
      name: 'interaction_type',
      label: 'Type',
      type: 'select',
      options: [
        { value: 'inbound', label: 'Inbound' },
        { value: 'outbound', label: 'Outbound' },
      ],
    },
  ],
});
