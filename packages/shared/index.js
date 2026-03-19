const schemas = require('./schemas/project');
const materialSchemas = require('./schemas/material');
const complianceSchemas = require('./schemas/compliance');
const ecologicalSchemas = require('./schemas/ecological');
const structureTypes = require('./constants/structure-types');
const jurisdictions = require('./constants/jurisdictions');

module.exports = {
  ...schemas,
  ...materialSchemas,
  ...complianceSchemas,
  ...ecologicalSchemas,
  ...structureTypes,
  ...jurisdictions,
};
