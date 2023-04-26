import { oleoduc, writeData } from "oleoduc"
import { logger } from "../../common/logger.js"
import { EligibleTrainingsForAppointment, eligibleTrainingsForAppointmentHistoric, FormationCatalogue } from "../../common/model/index.js"
import { affelnetSelectedFields, getFormationsFromCatalogueMe } from "../../services/catalogue.service.js"
import dayjs from "../../common/dayjs.js"
import { pick } from "lodash-es"

/**
 * @description Check if an Affelnet training is still available for appointments again it's presence in the ministere educatif catalogue
 * @return {void}
 */
export const controlAvailableAffelnetTrainingsWithCatalogueME = async () => {
  logger.info("Cron #controlAvailableAffelnetFormationWithCatalogueME started.")

  const catalogueMinistereEducatif = await getFormationsFromCatalogueMe({
    limit: 500,
    query: {
      affelnet_perimetre: true,
      affelnet_statut: { $in: ["publié", "en attente de publication"] },
    },
    select: pick(affelnetSelectedFields, ["cle_ministere_educatif"]),
  })

  if (!catalogueMinistereEducatif.length) {
    return
  }

  const stats = {
    AncientElligibleTrainingCount: 0,
    NewElligibleTrainingCount: 0,
  }

  stats.AncientElligibleTrainingCount = await EligibleTrainingsForAppointment.countDocuments()

  await oleoduc(
    EligibleTrainingsForAppointment.find({}).lean().cursor(),
    writeData(
      async (formation) => {
        const exist = await catalogueMinistereEducatif.find(({ cle_ministere_educatif }) => cle_ministere_educatif === formation.cle_ministere_educatif)

        if (!exist) {
          logger.info(`training historized: ${formation.cle_ministere_educatif}`)
          await eligibleTrainingsForAppointmentHistoric.create({ ...formation, email_rdv: undefined, historization_date: dayjs().format() })
          await EligibleTrainingsForAppointment.findOneAndRemove({ cle_ministere_educatif: formation.cle_ministere_educatif })
        }
      },
      { parallel: 500 }
    )
  )

  stats.NewElligibleTrainingCount = await EligibleTrainingsForAppointment.countDocuments()

  logger.info("Cron #controlAvailableAffelnetFormationWithCatalogueME done.")

  return stats
}
