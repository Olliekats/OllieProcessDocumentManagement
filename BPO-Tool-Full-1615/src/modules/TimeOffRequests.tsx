import { createEnhancedModule } from '../utils/enhancedModuleGenerator';

export const TimeOffRequests = createEnhancedModule({
  title: 'Time Off Requests',
  description: 'Manage PTO and leave requests',
  tableName: 'time_off_requests',
  ownerField: 'user_id',
  statusField: 'status',
  fields: [
    { name: 'start_date', label: 'Start Date', type: 'date', required: true },
    { name: 'end_date', label: 'End Date', type: 'date', required: true },
    {
      name: 'request_type',
      label: 'Request Type',
      type: 'select',
      required: true,
      options: [
        { value: 'pto', label: 'PTO' },
        { value: 'sick', label: 'Sick Leave' },
        { value: 'unpaid', label: 'Unpaid Leave' },
        { value: 'other', label: 'Other' },
      ],
    },
    { name: 'reason', label: 'Reason', type: 'textarea' },
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
  displayFields: ['start_date', 'end_date', 'request_type', 'status'],
  filters: [
    {
      name: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { value: 'pending', label: 'Pending' },
        { value: 'approved', label: 'Approved' },
        { value: 'rejected', label: 'Rejected' },
      ],
    },
    {
      name: 'request_type',
      label: 'Type',
      type: 'select',
      options: [
        { value: 'pto', label: 'PTO' },
        { value: 'sick', label: 'Sick Leave' },
        { value: 'unpaid', label: 'Unpaid Leave' },
        { value: 'other', label: 'Other' },
      ],
    },
  ],
});
