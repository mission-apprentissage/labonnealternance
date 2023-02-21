import { mapping } from "./onisep/mapping.js"

/**
 * @description Returns idRcoFormation through its idActionFormation.
 * @param {string} idActionFormation
 * @returns {string|undefined}
 */
const getCleMinistereEducatifFromIdActionFormation = (idActionFormation) => mapping[idActionFormation.toUpperCase()]

export { getCleMinistereEducatifFromIdActionFormation }
