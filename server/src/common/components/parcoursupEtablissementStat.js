import { ParcoursupEtablissementStat } from "../model/index.js"

export default () => ({
  /**
   * @description Bulk insert ParcoursupEtablissementStat.
   * @param {ParcoursupEtablissementStat[]} parcoursupEtablissementStats
   * @returns {Promise<void>}
   */
  bulkInsert: (parcoursupEtablissementStats) => ParcoursupEtablissementStat.insertMany(parcoursupEtablissementStats),

  /**
   * @description Deletes all documents.
   * @returns {Promise<void>}
   */
  deleteAll: () => ParcoursupEtablissementStat.deleteMany({}),
})
