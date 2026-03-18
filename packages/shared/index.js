const schemas = require('./schemas/project');
const structureTypes = require('./constants/structure-types');
const jurisdictions = require('./constants/jurisdictions');

module.exports = {
  ...schemas,
  ...structureTypes,
  ...jurisdictions,
};
