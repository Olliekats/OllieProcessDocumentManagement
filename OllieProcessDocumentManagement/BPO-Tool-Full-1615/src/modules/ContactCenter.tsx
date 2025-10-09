import { createEnhancedModule } from '../utils/enhancedModuleGenerator';

export const ContactCenter = createEnhancedModule({
  title: 'Contact Center',
  description: 'Manage customer interactions and tickets',
  tableName: 'tickets',
  ownerField: 'assigned_to',
  statusField: 'status',
  fields: [
    { name: 'ticket_number', label: 'Ticket Number', type: 'text', required: true },
    { name: 'customer_name', label: 'Customer Name', type: 'text', required: true },
    { name: 'customer_email', label: 'Customer Email', type: 'email' },
    { name: 'customer_phone', label: 'Customer Phone', type: 'text' },
    { name: 'subject', label: 'Subject', type: 'text', required: true, searchable: true },
    { name: 'description', label: 'Description', type: 'textarea', required: true, searchable: true },
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
    {
      name: 'status',
      label: 'Status',
      type: 'select',
      defaultValue: 'open',
      options: [
        { value: 'open', label: 'Open' },
        { value: 'in_progress', label: 'In Progress' },
        { value: 'pending', label: 'Pending' },
        { value: 'resolved', label: 'Resolved' },
        { value: 'closed', label: 'Closed' },
      ],
    },
    { name: 'category', label: 'Category', type: 'text' },
  ],
  displayFields: ['ticket_number', 'customer_name', 'subject', 'priority', 'status'],
  filters: [
    {
      name: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { value: 'open', label: 'Open' },
        { value: 'in_progress', label: 'In Progress' },
        { value: 'pending', label: 'Pending' },
        { value: 'resolved', label: 'Resolved' },
        { value: 'closed', label: 'Closed' },
      ],
    },
    {
      name: 'priority',
      label: 'Priority',
      type: 'select',
      options: [
        { value: 'low', label: 'Low' },
        { value: 'medium', label: 'Medium' },
        { value: 'high', label: 'High' },
        { value: 'critical', label: 'Critical' },
      ],
    },
  ],
});
