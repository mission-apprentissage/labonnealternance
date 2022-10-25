const { ParcoursupEtablissementStat } = require("../../common/model");

module.exports = () => ({
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
});
