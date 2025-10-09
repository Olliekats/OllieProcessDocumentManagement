import { createEnhancedModule } from '../utils/enhancedModuleGenerator';

export const AttendanceTracking = createEnhancedModule({
  title: 'Attendance Tracking',
  description: 'Track daily employee attendance and time management',
  tableName: 'attendance',
  ownerField: 'user_id',
  statusField: 'status',
  fields: [
    { name: 'date', label: 'Date', type: 'date', required: true },
    { name: 'clock_in', label: 'Clock In', type: 'text' },
    { name: 'clock_out', label: 'Clock Out', type: 'text' },
    {
      name: 'status',
      label: 'Status',
      type: 'select',
      defaultValue: 'present',
      options: [
        { value: 'present', label: 'Present' },
        { value: 'absent', label: 'Absent' },
        { value: 'late', label: 'Late' },
        { value: 'half_day', label: 'Half Day' },
        { value: 'pto', label: 'PTO' },
      ],
    },
    { name: 'notes', label: 'Notes', type: 'textarea' },
  ],
  displayFields: ['date', 'clock_in', 'clock_out', 'status'],
  filters: [
    {
      name: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { value: 'present', label: 'Present' },
        { value: 'absent', label: 'Absent' },
        { value: 'late', label: 'Late' },
        { value: 'half_day', label: 'Half Day' },
        { value: 'pto', label: 'PTO' },
      ],
    },
  ],
});
