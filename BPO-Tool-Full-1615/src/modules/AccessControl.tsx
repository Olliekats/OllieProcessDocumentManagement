import { createEnhancedModule } from '../utils/enhancedModuleGenerator';

export const AccessControl = createEnhancedModule({
  title: 'Access Control',
  description: 'Manage user roles and permissions',
  tableName: 'user_roles',
  fields: [
    { name: 'assigned_at', label: 'Assigned At', type: 'text' },
  ],
  displayFields: ['assigned_at'],
});
