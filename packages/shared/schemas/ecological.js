const { z } = require('zod');

const EcologicalReading = z.object({
  metric_id: z.number().int().positive('Metric is required'),
  value: z.number({ message: 'Value is required' }),
  notes: z.string().optional().default(''),
});

const SurveyCreate = z.object({
  project_id: z.number().int().positive('Project is required'),
  survey_date: z.string().min(1, 'Survey date is required'),
  surveyor: z.string().optional().default(''),
  notes: z.string().optional().default(''),
  readings: z.array(EcologicalReading).min(1, 'At least one reading is required'),
});

const SurveyUpdate = z.object({
  surveyor: z.string().optional(),
  notes: z.string().optional(),
});

module.exports = {
  EcologicalReading,
  SurveyCreate,
  SurveyUpdate,
};
