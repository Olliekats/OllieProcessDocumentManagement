import { createEnhancedModule } from '../utils/enhancedModuleGenerator';

export const KnowledgeBase = createEnhancedModule({
  title: 'Knowledge Base',
  description: 'Create and manage knowledge articles',
  tableName: 'kb_articles',
  ownerField: 'author_id',
  statusField: 'status',
  fields: [
    { name: 'title', label: 'Article Title', type: 'text', required: true, searchable: true },
    { name: 'content', label: 'Content', type: 'textarea', required: true, searchable: true },
    { name: 'summary', label: 'Summary', type: 'textarea', searchable: true },
    { name: 'version', label: 'Version', type: 'number', defaultValue: 1 },
    {
      name: 'status',
      label: 'Status',
      type: 'select',
      defaultValue: 'draft',
      options: [
        { value: 'draft', label: 'Draft' },
        { value: 'published', label: 'Published' },
        { value: 'archived', label: 'Archived' },
      ],
    },
    { name: 'view_count', label: 'View Count', type: 'number', defaultValue: 0 },
    { name: 'helpful_count', label: 'Helpful Count', type: 'number', defaultValue: 0 },
  ],
  displayFields: ['title', 'version', 'status', 'view_count'],
  filters: [
    {
      name: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { value: 'draft', label: 'Draft' },
        { value: 'published', label: 'Published' },
        { value: 'archived', label: 'Archived' },
      ],
    },
  ],
});
