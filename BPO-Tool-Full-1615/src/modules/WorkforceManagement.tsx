import { createEnhancedModule } from '../utils/enhancedModuleGenerator';

export const WorkforceManagement = createEnhancedModule({
  title: 'Workforce Management',
  description: 'Manage shifts, schedules, and workforce planning',
  tableName: 'shifts',
  fields: [
    { name: 'name', label: 'Shift Name', type: 'text', required: true, searchable: true },
    { name: 'start_time', label: 'Start Time', type: 'text', required: true },
    { name: 'end_time', label: 'End Time', type: 'text', required: true },
    { name: 'capacity', label: 'Capacity', type: 'number', defaultValue: 1 },
  ],
  displayFields: ['name', 'start_time', 'end_time', 'capacity'],
});
