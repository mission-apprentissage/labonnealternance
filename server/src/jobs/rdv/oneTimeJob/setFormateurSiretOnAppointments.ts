import { oleoduc, writeData } from "oleoduc"

import { logger } from "../../../common/logger"
import * as appointmentService from "../../../services/appointment.service"
import { getFormationsFromCatalogueMe } from "../../../services/catalogue.service"

/**
 * @description Updates all appointments and set "cfa_formateur_siret" value.
 */
export const setFormateurSiretOnAppointments = async (): Promise<void> => {
  logger.info("Job #setFormateurSiretOnAppointments started.")

  const catalogueMinistereEducatif = await getFormationsFromCatalogueMe({
    limit: 500,
    query: {},
    select: { cle_ministere_educatif: 1, etablissement_formateur_siret: 1 },
  })

  await oleoduc(
    appointmentService.find({ cle_ministere_educatif: { $nin: [null, ""] } }).cursor(),
    writeData(
      async (appointment) => {
        const formation = catalogueMinistereEducatif.find((item) => item.cle_ministere_educatif === appointment.cle_ministere_educatif)

        if (formation) {
          await appointmentService.updateMany(
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
