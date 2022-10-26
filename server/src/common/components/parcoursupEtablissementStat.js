import { ParcoursupEtablissementStat } from "../../common/model";

export default async () => ({
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
