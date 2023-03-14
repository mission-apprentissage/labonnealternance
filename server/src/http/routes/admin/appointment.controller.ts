import express from "express"
import { logger } from "../../../common/logger.js"
import { Appointment, User } from "../../../common/model/index.js"
import { getFormationsByCleMinistereEducatif } from "../../../services/catalogue.service.js"
import { tryCatch } from "../../middlewares/tryCatchMiddleware.js"

/**
 * Sample entity route module for GET
 */
export default () => {
  const router = express.Router()

  /**
   * Get all formations getRequests /requests GET
   * */
  router.get(
    "/appointments",
    tryCatch(async (req, res) => {
      const qs = req.query
      const query = qs && qs.query ? JSON.parse(qs.query) : {}
      const page = qs && qs.page ? qs.page : 1
      const limit = qs && qs.limit ? parseInt(qs.limit, 50) : 50

      const allData = await Appointment.paginate({ query, page, limit })
      return res.send({
        appointments: allData.docs,
        pagination: {
          page: allData.page,
          resultats_par_page: limit,
          nombre_de_page: allData.totalPages,
          total: allData.totalDocs,
        },
      })
    })
  )

  /**
   * Get all formations getRequests /requests GET
   * */
  router.get(
    "/appointments/details",
    tryCatch(async (req, res) => {
      const qs = req.query
      const query = qs && qs.query ? JSON.parse(qs.query) : {}
      const page = qs && qs.page ? qs.page : 1
      const limit = qs && qs.limit ? parseInt(qs.limit, 10) : 50

      const allAppointments = await Appointment.paginate({ query, page, limit, sort: { created_at: -1 } })

      const cleMinistereEducatifs = [...new Set(allAppointments.docs.map((document) => document.cle_ministere_educatif))]

      const formations = await getFormationsByCleMinistereEducatif({ cleMinistereEducatifs })

      const appointmentsPromises = allAppointments.docs.map(async (document) => {
        const user = await User.findById(document.applicant_id)
        const formation = formations.find((item) => item.cle_ministere_educatif === document.cle_ministere_educatif)

        return {
          ...document,
          appointment_origin: document.appointment_origin,
          formation,
          candidat: {
            _id: user._id,
            firstname: user.firstname,
            lastname: user.lastname,
            email: user.email,
            phone: user.phone,
          },
        }
      })

      const appointments = await Promise.all(appointmentsPromises)

      return res.send({
        appointments,
        pagination: {
          page: allAppointments.page,
          resultats_par_page: limit,
          nombre_de_page: allAppointments.totalPages,
          total: allAppointments.totalDocs,
        },
      })
    })
  )

  /**
   * Get countRequests requests/count GET
   */
  router.get(
    "/appointments/count",
    tryCatch(async (req, res) => {
      const qs = req.query
      const query = qs && qs.query ? JSON.parse(qs.query) : {}
      const total = await Appointment.countDocuments(query)

      res.send({ total })
    })
  )

  /**
   * Get request getRequest /request GET
   */
  router.get(
    "/",
    tryCatch(async (req, res) => {
      const qs = req.query
      const query = qs && qs.query ? JSON.parse(qs.query) : {}
      const retrievedData = await Appointment.findOne(query)
      if (retrievedData) {
        res.send(retrievedData)
      } else {
        res.send({ message: `Item doesn't exist` })
      }
    })
  )

  /**
   * Get request by id getRequestById /request/{id} GET
   */
  router.get(
    "/:id",
    tryCatch(async (req, res) => {
      const itemId = req.params.id
      const retrievedData = await Appointment.findById(itemId)
      if (retrievedData) {
        res.send(retrievedData)
      } else {
        res.send({ message: `Item ${itemId} doesn't exist` })
      }
    })
  )

  /**
   * Add/Post an item validated by schema createRequest /request POST
   */
  router.post(
    "/",
    tryCatch(async ({ body }, res) => {
      const item = body
      logger.info("Adding new request: ", item)
      const request = new Appointment(body)
      await request.save()
      res.send(request)
    })
  )

  /**
   * Update an item validated by schema updateRequest request/{id} PUT
   */
  router.put(
    "/:id",
    tryCatch(async ({ body, params }, res) => {
      const itemId = params.id
      logger.info("Updating item: ", body)
      const result = await Appointment.findOneAndUpdate({ _id: itemId }, body, { new: true })
      res.send(result)
    })
  )

  /**
   * Delete an item by id deleteRequest request/{id} DELETE
   */
  router.delete(
    "/:id",
    tryCatch(async ({ params }, res) => {
      const itemId = params.id
      await Appointment.findByIdAndDelete(itemId)
      res.send({ message: `Item ${itemId} deleted !` })
    })
  )

  return router
}
