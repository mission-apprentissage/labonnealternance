import { zRoutes } from "shared/index"

import { authenticationMiddleware } from "@/http/middlewares/authMiddleware"
import { administratorOnly } from "@/http/middlewares/permissionsMiddleware"

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
      preHandler: [authenticationMiddleware("jwt-rdv-admin"), administratorOnly],
    },
    async (req, res) => {
      const qs = req.query
      const query = qs && qs.query ? JSON.parse(qs.query) : {}
      const page = qs && qs.page ? qs.page : 1
      const limit = qs && qs.limit ? parseInt(qs.limit, 50) : 50

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
      preHandler: [authenticationMiddleware("jwt-rdv-admin"), administratorOnly],
    },
    async (req, res) => {
      const qs = req.query
      const query = qs && qs.query ? JSON.parse(qs.query) : {}
      const page = qs && qs.page ? qs.page : 1
      const limit = qs && qs.limit ? parseInt(qs.limit, 10) : 50

      const allAppointments = await Appointment.paginate({ query, page, limit, sort: { created_at: -1 } })

      const cleMinistereEducatifs = [...new Set(allAppointments?.docs.map((document) => document.cle_ministere_educatif))]

      const formations = await getFormationsByCleMinistereEducatif({ cleMinistereEducatifs })

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
