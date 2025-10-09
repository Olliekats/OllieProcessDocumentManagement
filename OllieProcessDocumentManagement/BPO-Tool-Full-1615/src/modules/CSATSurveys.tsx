import { createEnhancedModule } from '../utils/enhancedModuleGenerator';

export const CSATSurveys = createEnhancedModule({
  title: 'CSAT Surveys',
  description: 'Customer satisfaction survey responses',
  tableName: 'csat_surveys',
  fields: [
    { name: 'survey_date', label: 'Survey Date', type: 'text' },
    {
      name: 'rating',
      label: 'Rating',
      type: 'select',
      required: true,
      options: [
        { value: '1', label: '1 - Very Dissatisfied' },
        { value: '2', label: '2 - Dissatisfied' },
        { value: '3', label: '3 - Neutral' },
        { value: '4', label: '4 - Satisfied' },
        { value: '5', label: '5 - Very Satisfied' },
      ],
    },
    { name: 'feedback', label: 'Customer Feedback', type: 'textarea', searchable: true },
    {
      name: 'survey_type',
      label: 'Survey Type',
      type: 'select',
      defaultValue: 'csat',
      options: [
        { value: 'csat', label: 'CSAT' },
        { value: 'nps', label: 'NPS' },
        { value: 'ces', label: 'CES' },
      ],
    },
  ],
  displayFields: ['survey_date', 'rating', 'survey_type', 'feedback'],
  filters: [
    {
      name: 'rating',
      label: 'Rating',
      type: 'select',
      options: [
        { value: '1', label: '1 Star' },
        { value: '2', label: '2 Stars' },
        { value: '3', label: '3 Stars' },
        { value: '4', label: '4 Stars' },
        { value: '5', label: '5 Stars' },
      ],
    },
    {
      name: 'survey_type',
      label: 'Type',
      type: 'select',
      options: [
        { value: 'csat', label: 'CSAT' },
        { value: 'nps', label: 'NPS' },
        { value: 'ces', label: 'CES' },
      ],
    },
  ],
});
