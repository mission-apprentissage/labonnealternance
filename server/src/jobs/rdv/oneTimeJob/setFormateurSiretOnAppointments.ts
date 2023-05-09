import { oleoduc, writeData } from "oleoduc"
import { logger } from "../../../common/logger.js"
import { Appointment } from "../../../common/model/index.js"
import { getFormationsFromCatalogueMe } from "../../../services/catalogue.service.js"

/**
 * @description Updates all appointments.cfa_formateur_siret fields.
 * @returns {Promise<void>}
 */
export const setFormateurSiretOnAppointments = async ({ appointments }) => {
  logger.info("Job #setFormateurSiretOnAppointments started.")

  const catalogueMinistereEducatif = await getFormationsFromCatalogueMe({
    limit: 500,
    query: {},
    select: { cle_ministere_educatif: 1, etablissement_formateur_siret: 1 },
  })

  await oleoduc(
    appointments.find({ cle_ministere_educatif: { $nin: [null, ""] } }).cursor(),
    writeData(
      async (appointment) => {
        const formation = catalogueMinistereEducatif.find((item) => item.cle_ministere_educatif === appointment.cle_ministere_educatif)

        if (formation) {
          await appointments.updateMany(
            { cle_ministere_educatif: formation.cle_ministere_educatif },
            {
              cfa_formateur_siret: formation.etablissement_formateur_siret,
            }
          )
        }
      },
      { parallel: 500 }
    )
  )

  logger.info("Job #setFormateurSiretOnAppointments done.")
}
