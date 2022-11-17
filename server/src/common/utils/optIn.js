import { validate } from "email-validator"
import { WidgetParameter, Etablissement } from "../model/index.js"
import { optMode } from "../model/constants/etablissement.js"
import { logger } from "../logger.js"
import { dayjs } from "../utils/dayjs.js"

/**
 * @description Activate all "etablissement's formations".
 * @param {string} siret Siret formateur
 * @param {number[]} referrers Referrer ids
 * @returns {Promise<Etablissement>}
 */
const enableAllEtablissementFormations = async (siret, referrers = []) => {
  const parameters = await WidgetParameter.find({ etablissement_siret: siret, email_rdv: { $exists: true, $ne: "" } })

  const promises = parameters.map(async (parameter) => {
    if (validate(parameter.email_rdv)) {
      await WidgetParameter.updateOne({ id_rco_formation: parameter.id_rco_formation }, { referrers })
    } else {
      logger.warn(`Email "${parameter.email_rdv}" not valid (id_rco_formation: ${parameter.id_rco_formation}).`)
    }
  })

  await Promise.all(promises)

  const etablissement = await Etablissement.updateOne({ siret_formateur: siret }, { opt_mode: optMode.OPT_IN, opt_in_activated_at: dayjs().format() })

  logger.info(`Opt-in mode enabled for etablissement "${siret}".`)

  return etablissement
}

export { enableAllEtablissementFormations }
