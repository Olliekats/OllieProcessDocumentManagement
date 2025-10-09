import { createEnhancedModule } from '../utils/enhancedModuleGenerator';

export const ClientManagement = createEnhancedModule({
  title: 'Client Management',
  description: 'Manage client profiles and relationships',
  tableName: 'clients',
  statusField: 'status',
  fields: [
    { name: 'client_name', label: 'Client Name', type: 'text', required: true, searchable: true },
    { name: 'industry', label: 'Industry', type: 'text', searchable: true },
    {
      name: 'status',
      label: 'Status',
      type: 'select',
      defaultValue: 'active',
      options: [
        { value: 'prospect', label: 'Prospect' },
        { value: 'active', label: 'Active' },
        { value: 'inactive', label: 'Inactive' },
        { value: 'churned', label: 'Churned' },
      ],
    },
    { name: 'address', label: 'Address', type: 'text' },
    { name: 'city', label: 'City', type: 'text' },
    { name: 'state', label: 'State', type: 'text' },
    { name: 'country', label: 'Country', type: 'text' },
    { name: 'timezone', label: 'Timezone', type: 'text' },
    { name: 'notes', label: 'Notes', type: 'textarea' },
  ],
  displayFields: ['client_name', 'industry', 'status', 'city'],
  filters: [
    {
      name: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { value: 'prospect', label: 'Prospect' },
        { value: 'active', label: 'Active' },
        { value: 'inactive', label: 'Inactive' },
        { value: 'churned', label: 'Churned' },
      ],
    },
  ],
});
