// @ts-nocheck
import express from "express"
import { Formulaire } from "../../common/model/index.js"
import { getApplication } from "../../services/application.service.js"
import {
  archiveDelegatedFormulaire,
  archiveFormulaire,
  cancelOffre,
  checkOffreExists,
  createFormulaire,
  createJob,
  createJobDelegations,
  getFormulaire,
  getJobsFromElasticSearch,
  getOffre,
  provideOffre,
  updateFormulaire,
  updateOffre,
} from "../../services/formulaire.service.js"
import { tryCatch } from "../middlewares/tryCatchMiddleware.js"

export default ({ mailer, usersRecruteur }) => {
  const router = express.Router()

  /**
   * Query search endpoint
   */
  router.get(
    "/",
    tryCatch(async (req, res) => {
      const query = JSON.parse(req.query.query)
      const results = await Formulaire.find(query).lean()

      return res.json(results)
    })
  )

  /**
   * Get form from id
   */
  router.get(
    "/:id_form",
    tryCatch(async (req, res) => {
      const result = await getFormulaire({ id_form: req.params.id_form })

      if (!result) {
        return res.sendStatus(401)
      }

      await Promise.all(
        result.offres.map(async (offre) => {
          const candidatures = await getApplication(offre._id)

          if (candidatures) {
            offre.candidatures = candidatures.length > 0 ? candidatures.length : undefined
          }

          return offre
        })
      )

      return res.json(result)
    })
  )

  /**
   * Post form
   */
  router.post(
    "/",
    tryCatch(async (req, res) => {
      const response = await createFormulaire(req.body)

      if (req.body.origine === "akto") {
        const exist = await usersRecruteur.getUser({ email: payload.email })

        if (!exist) {
          await usersRecruteur.createUser({
            ...req.body,
            type: "ENTREPRISE",
            id_form: response.id_form,
            email_valide: true,
          })
        }
      }
      return res.json(response)
    })
  )

  /**
   * Put form
   */
  router.put(
    "/:id_form",
    tryCatch(async (req, res) => {
      const result = await updateFormulaire(req.params.id_form, req.body)
      return res.json(result)
    })
  )

  router.delete(
    "/:id_form",
    tryCatch(async (req, res) => {
      await archiveFormulaire(req.params.id_form)
      return res.sendStatus(200)
    })
  )

  router.delete(
    "/delegated/:siret",
    tryCatch(async (req, res) => {
      await archiveDelegatedFormulaire(req.params.siret)
      return res.sendStatus(200)
    })
  )

  /**
   * TEMP : get offer from id for front
   * TO BE REPLACE
   *
   */
  router.get(
    "/offre/f/:id_offre",
    tryCatch(async (req, res) => {
      // Note pour PR quel traitement de getJobById empêche de l'utiliser ici ?

      const result = await getOffre(req.params.id_offre)
      const offre = result.offres.filter((x) => x._id == req.params.id_offre)

      res.json(offre)
    })
  )

  /**
   * Create new offer
   */
  router.post(
    "/:id_form/offre",
    tryCatch(async (req, res) => {
      const offre = req.body
      const id_form = req.params.id_form
      const updatedFormulaire = await createJob({ offre, id_form })
      return res.json(updatedFormulaire)
    })
  )

  /**
   * Create offer delegations
   */
  router.post(
    "/offre/:idOffre/delegation",
    tryCatch(async (req, res) => {
      const { etablissementCatalogueIds } = req.body
      const { idOffre } = req.params
      const offre = await createJobDelegations({ jobId: idOffre, etablissementCatalogueIds, mailer })
      return res.json(offre)
    })
  )

  /**
   * Put existing offer from id
   */
  router.put(
    "/offre/:id_offre",
    tryCatch(async (req, res) => {
      const result = await updateOffre(req.params.id_offre, req.body)
      return res.json(result)
    })
  )

  /**
   * Permet de passer une offre en statut ANNULER (mail transactionnel)
   */
  router.put(
    "/offre/:offreId/cancel",
    tryCatch(async (req, res) => {
      const exists = await checkOffreExists(req.params.offreId)

      if (!exists) {
        return res.status(400).json({ status: "INVALID_RESSOURCE", message: "Offre does not exist" })
      }

      await cancelOffre(req.params.offreId)

      return res.sendStatus(200)
    })
  )

  /**
   * Permet de passer une offre en statut POURVUE (mail transactionnel)
   */
  router.put(
    "/offre/:offreId/provided",
    tryCatch(async (req, res) => {
      const exists = await checkOffreExists(req.params.offreId)

      if (!exists) {
        return res.status(400).json({ status: "INVALID_RESSOURCE", message: "Offre does not exist" })
      }

      await provideOffre(req.params.offreId)

      return res.sendStatus(200)
    })
  )

  /**
   * LBA ENDPOINT
   */
  router.post(
    "/search",
    tryCatch(async (req, res) => {
      const { distance, lat, lon, romes, niveau } = req.body

      if (!distance || !lat || !lon || !romes) {
        return res.status(400).json({ error: "Argument is missing (distance, lat, lon, romes)" })
      }

      const jobs = await getJobsFromElasticSearch({ distance, lat, lon, romes, niveau })

      return res.json(jobs)
    })
  )

  return router
}
