import { zRoutes } from "shared/index"

import { Appointment, User } from "../../../common/model/index"
import { getFormationsByCleMinistereEducatif } from "../../../services/catalogue.service"
import { Server } from "../../server"

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
      preHandler: server.auth(zRoutes.get["/api/admin/appointments"].securityScheme),
    },
    async (req, res) => {
      const query = req.query.query ? JSON.parse(req.query.query) : {}
      const { page, limit } = req.query

      const allData = await Appointment.paginate({ query, page, limit })

      return res.status(200).send({
        appointments: allData?.docs,
        pagination: {
          page: allData?.page,
          resultats_par_page: limit,
          nombre_de_page: allData?.totalPages,
          total: allData?.totalDocs,
        },
      })
    }
  )

  /**
   * Get all formations getRequests /requests GET (with details)
   * */
  server.get(
    "/api/admin/appointments/details",
    {
      schema: zRoutes.get["/api/admin/appointments/details"],
      preHandler: server.auth(zRoutes.get["/api/admin/appointments"].securityScheme),
    },
    async (req, res) => {
      const query = req.query.query ? JSON.parse(req.query.query) : {}
      const { page, limit } = req.query

      const allAppointments = await Appointment.paginate({ query, page, limit, sort: { created_at: -1 } })

      const cleMinistereEducatifs: Set<string> = new Set()
      if (allAppointments) {
        for (const doc of allAppointments.docs) {
          if (doc.cle_ministere_educatif) {
            cleMinistereEducatifs.add(doc.cle_ministere_educatif)
          }
        }
      }

      const formations = await getFormationsByCleMinistereEducatif({ cleMinistereEducatifs: Array.from(cleMinistereEducatifs) })

      const appointmentsPromises = allAppointments?.docs.map(async (document) => {
        const user = await User.findById(document.applicant_id)
        const formation = formations.find((item) => item.cle_ministere_educatif === document.cle_ministere_educatif)

        return {
          ...document,
          appointment_origin: document.appointment_origin,
          formation,
          candidat: {
            _id: user?._id,
            firstname: user?.firstname,
            lastname: user?.lastname,
            email: user?.email,
            phone: user?.phone,
          },
        }
      })

      const appointments = await Promise.all(appointmentsPromises || [])

      return res.status(200).send({
        appointments,
        pagination: {
          page: allAppointments?.page,
          resultats_par_page: limit,
          nombre_de_page: allAppointments?.totalPages,
          total: allAppointments?.totalDocs,
        },
      })
    }
  )
}
