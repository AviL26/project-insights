const { z } = require('zod');

const COMPLIANCE_STATUSES = ['pending', 'compliant', 'non_compliant', 'waived'];
const COMPLIANCE_PRIORITIES = ['low', 'medium', 'high', 'critical'];
const COMPLIANCE_CATEGORIES = ['environmental', 'structural', 'permits', 'monitoring', 'safety'];

const ComplianceUpdate = z.object({
  status: z.enum(COMPLIANCE_STATUSES, { message: 'Invalid status' }),
  notes: z.string().optional().default(''),
});

const ComplianceGenerate = z.object({
  project_id: z.number().int().positive('Project ID is required'),
});

module.exports = {
  ComplianceUpdate,
  ComplianceGenerate,
  COMPLIANCE_STATUSES,
  COMPLIANCE_PRIORITIES,
  COMPLIANCE_CATEGORIES,
};
