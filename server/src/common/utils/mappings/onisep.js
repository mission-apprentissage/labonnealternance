const { mapping } = require("./onisep/mapping");

/**
 * @description Returns idRcoFormation through its idActionFormation.
 * @param {string} idActionFormation
 * @returns {string|undefined}
 */
const getCleMinistereEducatifFromIdActionFormation = (idActionFormation) => mapping[idActionFormation.toUpperCase()];

module.exports = {
  getCleMinistereEducatifFromIdActionFormation,
};
