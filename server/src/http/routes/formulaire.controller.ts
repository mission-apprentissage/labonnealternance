// @ts-nocheck
import express from "express"
import { Recruiter } from "../../common/model/index.js"
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
      const results = await Recruiter.find(query).lean()

      return res.json(results)
    })
  )

  /**
   * Get form from id
   */
  router.get(
    "/:establishment_id",
    tryCatch(async (req, res) => {
      const result = await getFormulaire({ establishment_id: req.params.establishment_id })

      if (!result) {
        return res.sendStatus(401)
      }

      await Promise.all(
        result.jobs.map(async (job) => {
          const candidatures = await getApplication(job._id)

          if (candidatures) {
            job.candidatures = candidatures.length > 0 ? candidatures.length : undefined
          }

          return job
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
            establishment_id: response.establishment_id,
            is_email_checked: true,
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
    "/:establishment_id",
    tryCatch(async (req, res) => {
      const result = await updateFormulaire(req.params.establishment_id, req.body)
      return res.json(result)
    })
  )

  router.delete(
    "/:establishment_id",
    tryCatch(async (req, res) => {
      await archiveFormulaire(req.params.establishment_id)
      return res.sendStatus(200)
    })
  )

  router.delete(
    "/delegated/:establishment_siret",
    tryCatch(async (req, res) => {
      await archiveDelegatedFormulaire(req.params.establishment_siret)
      return res.sendStatus(200)
    })
  )

  /**
   * TEMP : get offer from id for front
   * TO BE REPLACE
   *
   */
  router.get(
    "/offre/f/:jobId",
    tryCatch(async (req, res) => {
      // Note pour PR quel traitement de getJobById empêche de l'utiliser ici ?
      const result = await getOffre(req.params.jobId)
      const offre = result.jobs.filter((job) => job._id == req.params.jobId)

      res.json(offre)
    })
  )

  /**
   * Create new offer
   */
  router.post(
    "/:establishment_id/offre",
    tryCatch(async (req, res) => {
      const updatedFormulaire = await createJob({ job: req.body, id: req.params.establishment_id })
      return res.json(updatedFormulaire)
    })
  )

  /**
   * Create offer delegations
   */
  router.post(
    "/offre/:jobId/delegation",
    tryCatch(async (req, res) => {
      const { etablissementCatalogueIds } = req.body
      const { jobId } = req.params
      const job = await createJobDelegations({ jobId, etablissementCatalogueIds })
      return res.json(job)
    })
  )

  /**
   * Put existing offer from id
   */
  router.put(
    "/offre/:jobId",
    tryCatch(async (req, res) => {
      const result = await updateOffre(req.params.jobId, req.body)
      return res.json(result)
    })
  )

  /**
   * Permet de passer une offre en statut ANNULER (mail transactionnel)
   */
  router.put(
    "/offre/:jobId/cancel",
    tryCatch(async (req, res) => {
      const exists = await checkOffreExists(req.params.jobId)

      if (!exists) {
        return res.status(400).json({ status: "INVALID_RESSOURCE", message: "L'offre n'existe pas" })
      }

      await cancelOffre(req.params.jobId)
      return res.sendStatus(200)
    })
  )

  /**
   * Permet de passer une offre en statut POURVUE (mail transactionnel)
   */
  router.put(
    "/offre/:jobId/provided",
    tryCatch(async (req, res) => {
      const exists = await checkOffreExists(req.params.jobId)

      if (!exists) {
        return res.status(400).json({ status: "INVALID_RESSOURCE", message: "L'offre n'existe pas" })
      }

      await provideOffre(req.params.jobId)
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
