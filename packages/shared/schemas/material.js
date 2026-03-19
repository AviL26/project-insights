const { z } = require('zod');

const MaterialAdd = z.object({
  material_id: z.number().int().positive('Material is required'),
  quantity: z.number().positive('Quantity must be greater than 0'),
  unit: z.string().min(1, 'Unit is required'),
  notes: z.string().optional().default(''),
});

const MaterialUpdate = z.object({
  quantity: z.number().positive('Quantity must be greater than 0').optional(),
  unit: z.string().min(1).optional(),
  notes: z.string().optional(),
});

module.exports = { MaterialAdd, MaterialUpdate };
