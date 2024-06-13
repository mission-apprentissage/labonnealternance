import { IFormationCatalogue, zRoutes } from "shared/index"

import { logger } from "@/common/logger"

import { Appointment, User } from "../../../common/model/index"
import { getFormationsByCleMinistereEducatif } from "../../../services/catalogue.service"
import { Server } from "../../server"

/**
 * Sample entity route module for GET
 */
export default (server: Server) => {
  /**
   * Get all formations getRequests /requests GET (with details)
   * */
  server.get(
    "/admin/appointments/details",
    {
      schema: zRoutes.get["/admin/appointments/details"],
      onRequest: [server.auth(zRoutes.get["/admin/appointments/details"])],
    },
    async (_req, res) => {
      const allAppointments = await Appointment.find().limit(100).sort({ _id: -1 }).lean()

      const cleMinistereEducatifs: Set<string> = new Set()
      if (allAppointments) {
        for (const doc of allAppointments) {
          if (doc.cle_ministere_educatif) {
            cleMinistereEducatifs.add(doc.cle_ministere_educatif)
          }
        }
      }

      const formations: IFormationCatalogue[] = await getFormationsByCleMinistereEducatif({ cleMinistereEducatifs: Array.from(cleMinistereEducatifs) })

      const appointmentsPromises = allAppointments.map(async (appointment) => {
        const user = await User.findById(appointment.applicant_id).lean()

        if (!user) {
          logger.error(`Candidat non trouvé pour rendez-vous. user_id=${appointment.applicant_id}`)
          return null
        }

        const formation = formations.find((item) => item.cle_ministere_educatif === appointment.cle_ministere_educatif)

        if (!formation) {
          logger.error(`Formation non trouvé pour rendez-vous. user_id=${appointment.applicant_id}. cle_ministere_educatif=${appointment.cle_ministere_educatif}`)
          return null
        }

        return {
          created_at: appointment.created_at,
          applicant_message_to_cfa: appointment?.applicant_message_to_cfa || null,
          appointment_origin: appointment.appointment_origin,
          cfa_recipient_email: appointment.cfa_recipient_email,
          formation: {
            etablissement_gestionnaire_entreprise_raison_sociale: formation?.etablissement_gestionnaire_entreprise_raison_sociale || null,
            etablissement_formateur_siret: formation?.etablissement_formateur_siret || null,
            intitule_long: formation?.intitule_long || null,
          },
          candidat: {
            firstname: user.firstname,
            lastname: user.lastname,
            email: user.email,
            phone: user.phone,
          },
        }
      })

      const appointments = (await Promise.all(appointmentsPromises || [])).filter((appointment) => !!appointment)

      return res.status(200).send({
        appointments,
      })
    }
  )
}
