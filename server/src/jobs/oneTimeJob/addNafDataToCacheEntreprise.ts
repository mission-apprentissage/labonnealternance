import { logger } from "../../common/logger"
import { asyncForEach } from "../../common/utils/asyncUtils"
import { getDbCollection } from "../../common/utils/mongodbUtils"
import { getEntrepriseDataFromSiret } from "../../services/etablissement.service"

/**
 *
 * KBA 20241028 : Job already executed in recette & prod.
 * Could be updated & used to check entreprise collection stock to check if companies are still eligible (some of them are closed)
 */

const OneTimeJob_AddNAFDataToEntrepriseCacheDB = async () => {
  let ok = 0
  let needApiCall = 0
  logger.info("OneTimeJob_AddNAFDataToEntrepriseCacheDB - START")
  const entreprises = await getDbCollection("entreprises")
    .find({ naf_label: { $exists: false } }, { projection: { siret: 1 } })
    .toArray()
  if (!entreprises.length) {
    logger.info("Aucune entreprise à traiter - fin de job")
    return
  }
  logger.info(`${entreprises.length} entreprise à traiter`)
  await asyncForEach(entreprises, async ({ siret }) => {
    ok % 500 === 0 && logger.info(`${ok} entreprises traité`)
    const recruiter = await getDbCollection("recruiters").findOne({ establishment_siret: siret }, { projection: { naf_code: 1, naf_label: 1 } })
    if (!recruiter) {
      needApiCall++
      return
    }
    ok++
    await getDbCollection("entreprises").updateOne({ siret }, { $set: { naf_code: recruiter?.naf_code, naf_label: recruiter?.naf_label } })
  })
  logger.info("OneTimeJob_AddNAFDataToEntrepriseCacheDB - END")
  console.info({ total: entreprises.length, ok, needApiCall })
}

const OneTimeJob_AddNAFDataToEntrepriseCacheAPI = async () => {
  let ok = 0
  let fail = 0
  logger.info("OneTimeJob_AddNAFDataToEntrepriseCacheAPI - START")
  const entreprises = await getDbCollection("entreprises")
    .find({ naf_label: { $exists: false } }, { projection: { siret: 1 } })
    .toArray()
  if (!entreprises.length) {
    logger.info("Aucune entreprise à traiter - fin de job")
    return
  }
  logger.info(`${entreprises.length} entreprise à traiter`)
  await asyncForEach(entreprises, async (etp) => {
    const { siret } = etp
    ok % 100 === 0 && logger.info(`${ok} entreprises traité`)

    const siretResponse = await getEntrepriseDataFromSiret({ siret, type: "ENTREPRISE" })
    if ("error" in siretResponse) {
      logger.info(`erreur API SIRET : ${siretResponse.message}`)
      fail++
      return
    }
    await getDbCollection("entreprises").updateOne({ siret }, { $set: { naf_code: siretResponse.naf_code, naf_label: siretResponse.naf_label } })
    ok++
  })
  logger.info("OneTimeJob_AddNAFDataToEntrepriseCacheAPI - END")
  console.info({ total: entreprises.length, ok, fail })
}

export const OneTimeJob_AddNAFDataToEntrepriseCache = async () => {
  await OneTimeJob_AddNAFDataToEntrepriseCacheDB()
  await OneTimeJob_AddNAFDataToEntrepriseCacheAPI()
}
