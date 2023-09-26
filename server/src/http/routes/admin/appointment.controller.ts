import { IFormationCatalogue, zRoutes } from "shared/index"

import { Appointment, User } from "../../../common/model/index"
import { getFormationsByCleMinistereEducatif } from "../../../services/catalogue.service"
import { Server } from "../../server"
import Boom from "boom"

/**
 * Sample entity route module for GET
 */
export default (server: Server) => {
  /**
   * Get all formations getRequests /requests GET
   * */
  server.get(
    "/api/admin/appointments",
    {
      schema: zRoutes.get["/api/admin/appointments"],
      preHandler: [server.auth(zRoutes.get["/api/admin/appointments"].securityScheme)],
    },
    async (req, res) => {
      const appointments = await Appointment.find().limit(2).sort({ _id: -1 }).lean();

      return res.status(200).send({ appointments });
    }
  )

  /**
   * Get all formations getRequests /requests GET (with details)
   * */
  server.get(
    "/api/admin/appointments/details",
    {
      schema: zRoutes.get["/api/admin/appointments/details"],
      preHandler: [server.auth(zRoutes.get["/api/admin/appointments"].securityScheme)],
    },
    async (req, res) => {
      const allAppointments = await Appointment.find().limit(2).sort({ _id: -1 }).lean();

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

        if(!user) {
          throw Boom.internal("Candidat non trouvé.")
        }

        const formation = formations.find((item) => item.cle_ministere_educatif === appointment.cle_ministere_educatif)

        if(!formation) {
          throw Boom.internal("Formation non trouvée.")
        }


        return {
            created_at: appointment.created_at,
            applicant_message_to_cfa: appointment.applicant_message_to_cfa,
            appointment_origin: appointment.appointment_origin,
            cfa_recipient_email: appointment.cfa_recipient_email,
            formation: {
              etablissement_gestionnaire_entreprise_raison_sociale: formation?.etablissement_gestionnaire_entreprise_raison_sociale || null,
              etablissement_formateur_siret: formation?.etablissement_formateur_siret || null,
            },
            candidat: {
              firstname: user.firstname,
              lastname: user.lastname,
              email: user.email,
              phone: user.phone,
            },
        }
      })

      const appointments = await Promise.all(appointmentsPromises || [])

      return res.status(200).send({
        appointments,
      })
    }
  )
}
