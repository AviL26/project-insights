const db = require('./init');

const seedData = () => {
  // Add some sample compliance frameworks
  const complianceData = [
    {
      project_id: 1,
      name: 'EU Water Framework Directive',
      status: 'compliant',
      requirements: 8,
      completed: 8,
      risk_level: 'low'
    }
  ];

  // Add sample species data
  const speciesData = [
    {
      project_id: 1,
      species_name: 'Mediterranean Grouper',
      scientific_name: 'Epinephelus marginatus',
      status: 'thriving',
      trend_percentage: 18
    }
  ];

  // Insert seed data...
};

module.exports = seedData;