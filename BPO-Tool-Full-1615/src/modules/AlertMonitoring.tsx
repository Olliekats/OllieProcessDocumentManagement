import { createEnhancedModule } from '../utils/enhancedModuleGenerator';

export const AlertMonitoring = createEnhancedModule({
  title: 'Alert Monitoring',
  description: 'Monitor and manage system alerts',
  tableName: 'alert_incidents',
  statusField: 'status',
  fields: [
    { name: 'triggered_at', label: 'Triggered At', type: 'text', required: true },
    { name: 'metric_value', label: 'Metric Value', type: 'number', required: true },
    {
      name: 'severity',
      label: 'Severity',
      type: 'select',
      required: true,
      options: [
        { value: 'info', label: 'Info' },
        { value: 'warning', label: 'Warning' },
        { value: 'critical', label: 'Critical' },
      ],
    },
    {
      name: 'status',
      label: 'Status',
      type: 'select',
      defaultValue: 'active',
      options: [
        { value: 'active', label: 'Active' },
        { value: 'acknowledged', label: 'Acknowledged' },
        { value: 'resolved', label: 'Resolved' },
      ],
    },
    { name: 'resolution_notes', label: 'Resolution Notes', type: 'textarea' },
  ],
  displayFields: ['triggered_at', 'severity', 'status', 'metric_value'],
  filters: [
    {
      name: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { value: 'active', label: 'Active' },
        { value: 'acknowledged', label: 'Acknowledged' },
        { value: 'resolved', label: 'Resolved' },
      ],
    },
    {
      name: 'severity',
      label: 'Severity',
      type: 'select',
      options: [
        { value: 'info', label: 'Info' },
        { value: 'warning', label: 'Warning' },
        { value: 'critical', label: 'Critical' },
      ],
    },
  ],
});
