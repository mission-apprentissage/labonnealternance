import express from "express"
import { chunk } from "lodash-es"
import { logger } from "../../../common/logger.js"
import { getReferrerById, referrers } from "../../../common/model/constants/referrers.js"
import { Appointment, User } from "../../../common/model/index.js"
import { getFormationsByIdRcoFormations } from "../../../services/catalogue.service.js"
import { tryCatch } from "../../middlewares/tryCatchMiddleware.js"

/**
 * Sample entity route module for GET
 */
export default ({ etablissements, appointments, users }) => {
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

      const allData = await Appointment.paginate({ query, page, limit, sort: { created_at: -1 } })

      const idRcoFormations = [...new Set(allData.docs.map((document) => document.id_rco_formation))]

      // Split array by chunk to avoid sending unit calls to the catalogue
      const idRcoFormationsChunks = chunk(idRcoFormations, 40)

      // Get formations from catalogue by block of 40 id_rco_formations
      let formations = await Promise.all(
        idRcoFormationsChunks.map(async (idRcoFormations) => {
          const formations = await getFormationsByIdRcoFormations({ idRcoFormations })
          return formations
        })
      )

      formations = formations.flat()

      const appointmentsPromises = allData.docs.map(async (document) => {
        const user = await User.findById(document.applicant_id)

        // Get right formation from dataset
        const catalogueFormation = formations.find((item) => item.id_rco_formation === document.id_rco_formation)

        const etablissement = await etablissements.findOne({ siret_formateur: document.cfa_gestionnaire_siret })

        let formation = {}
        if (catalogueFormation) {
          formation = {
            etablissement_formateur_entreprise_raison_sociale: catalogueFormation.etablissement_formateur_entreprise_raison_sociale,
            intitule_long: catalogueFormation.intitule_long,
            etablissement_formateur_adresse: catalogueFormation.etablissement_formateur_adresse,
            etablissement_formateur_code_postal: catalogueFormation.etablissement_formateur_code_postal,
            etablissement_formateur_nom_departement: catalogueFormation.etablissement_formateur_nom_departement,
          }
        }

        return {
          ...document,
          appointment_origin: getReferrerById(document.appointment_origin),
          formation,
          etablissement,
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
          page: allData.page,
          resultats_par_page: limit,
          nombre_de_page: allData.totalPages,
          total: allData.totalDocs,
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
