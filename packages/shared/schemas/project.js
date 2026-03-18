const { z } = require('zod');

const ProjectBase = z.object({
  name: z.string().min(1, 'Project name is required').max(200),
  description: z.string().max(2000).optional().default(''),
});

const ProjectLocation = z.object({
  country: z.string().min(1, 'Country is required'),
  region: z.string().optional().default(''),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});

const ProjectStructure = z.object({
  structure_type: z.string().min(1, 'Structure type is required'),
  wave_exposure: z.enum(['sheltered', 'moderate', 'exposed', 'very_exposed']),
  seabed_type: z.enum(['rock', 'sand', 'mud', 'gravel', 'mixed']),
  depth_range: z.string().optional().default(''),
});

const ProjectGoals = z.object({
  primary_goal: z.string().min(1, 'Primary goal is required'),
  ecological_goals: z.array(z.string()).default([]),
  target_species: z.array(z.string()).default([]),
});

const ProjectCreate = ProjectBase
  .merge(ProjectLocation)
  .merge(ProjectStructure)
  .merge(ProjectGoals)
  .extend({
    jurisdiction: z.string().optional().default(''),
  });

const ProjectUpdate = ProjectCreate.partial();

module.exports = {
  ProjectBase,
  ProjectLocation,
  ProjectStructure,
  ProjectGoals,
  ProjectCreate,
  ProjectUpdate,
};
