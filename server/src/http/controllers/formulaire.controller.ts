import { badRequest, conflict, internal, notFound } from "@hapi/boom"
import { RECRUITER_STATUS } from "shared/constants"
import { JOB_STATUS, zRoutes } from "shared/index"

import { getUserFromRequest } from "@/security/authenticationService"
import { generateOffreToken } from "@/services/appLinks.service"
import { getUserRecruteurById } from "@/services/userRecruteur.service"
import { getUserWithAccountByEmail } from "@/services/userWithAccount.service"

import { entrepriseOnboardingWorkflow } from "../../services/etablissement.service"
import {
  archiveFormulaireByEstablishmentId,
  cancelOffre,
  cancelOffreFromAdminInterface,
  checkOffreExists,
  createJob,
  createJobDelegations,
  extendOffre,
  getFormulaireWithRomeDetail,
  getFormulaireWithRomeDetailAndApplicationCount,
  getJob,
  getJobWithRomeDetail,
  getOffre,
  updateJobDelegation,
  patchOffre,
  provideOffre,
  validateUserEmailFromJobId,
} from "../../services/formulaire.service"
import { Server } from "../server"

export default (server: Server) => {
  /**
   * Get form from id
   */
  server.get(
    "/formulaire/:establishment_id",
    {
      schema: zRoutes.get["/formulaire/:establishment_id"],
      onRequest: [server.auth(zRoutes.get["/formulaire/:establishment_id"])],
    },
    async (req, res) => {
      const { establishment_id } = req.params
      const recruiterOpt = await getFormulaireWithRomeDetailAndApplicationCount({ establishment_id })
      if (!recruiterOpt) {
        throw notFound(`pas de formulaire avec establishment_id=${establishment_id}`)
      }
      return res.status(200).send(recruiterOpt)
    }
  )
  server.get(
    "/formulaire/:establishment_id/by-token",
    {
      schema: zRoutes.get["/formulaire/:establishment_id/by-token"],
      onRequest: [server.auth(zRoutes.get["/formulaire/:establishment_id/by-token"])],
    },
    async (req, res) => {
      const { establishment_id } = req.params
      const recruiterOpt = await getFormulaireWithRomeDetailAndApplicationCount({ establishment_id })
      if (!recruiterOpt) {
        throw notFound(`pas de formulaire avec establishment_id=${establishment_id}`)
      }
      return res.status(200).send(recruiterOpt)
    }
  )

  /**
   * Get form from id
   */
  server.get(
    "/formulaire/delegation/:establishment_id",
    {
      schema: zRoutes.get["/formulaire/delegation/:establishment_id"],
      onRequest: [server.auth(zRoutes.get["/formulaire/delegation/:establishment_id"])],
    },
    async (req, res) => {
      const result = await getFormulaireWithRomeDetail({ establishment_id: req.params.establishment_id })

      if (!result) {
        throw badRequest()
      }

      return res.status(200).send(result)
    }
  )

  /**
   * Post form
   */
  server.post(
    "/user/:userId/formulaire",
    {
      schema: zRoutes.post["/user/:userId/formulaire"],
      onRequest: [server.auth(zRoutes.post["/user/:userId/formulaire"])],
    },
    async (req, res) => {
      const { userId: userRecruteurId } = req.params
      const { establishment_siret, email, last_name, first_name, phone } = req.body
      const userRecruteurOpt = await getUserRecruteurById(userRecruteurId)
      if (!userRecruteurOpt) {
        throw badRequest("Nous n'avons pas trouvé votre compte utilisateur")
      }
      if (!userRecruteurOpt.establishment_siret) {
        throw internal("unexpected: userRecruteur without establishment_siret")
      }
      const response = await entrepriseOnboardingWorkflow.createFromCFA({
        email,
        last_name,
        first_name,
        phone,
        siret: establishment_siret,
        cfa_delegated_siret: userRecruteurOpt.establishment_siret,
        origin: userRecruteurOpt.scope ?? "",
        managedBy: userRecruteurOpt._id.toString(),
      })
      if ("error" in response) {
        const { message } = response
        throw badRequest(message)
      }
      return res.status(200).send(response)
    }
  )

  server.delete(
    "/formulaire/:establishment_id",
    {
      schema: zRoutes.delete["/formulaire/:establishment_id"],
      onRequest: [server.auth(zRoutes.delete["/formulaire/:establishment_id"])],
    },
    async (req, res) => {
      await archiveFormulaireByEstablishmentId(req.params.establishment_id)
      return res.status(200).send({})
    }
  )

  /**
   * TEMP : get offer from id for front
   * TO BE REPLACE
   *
   */
  server.get(
    "/formulaire/offre/f/:jobId",
    {
      schema: zRoutes.get["/formulaire/offre/f/:jobId"],
      onRequest: [server.auth(zRoutes.get["/formulaire/offre/f/:jobId"])],
    },
    async (req, res) => {
      const offre = await getJobWithRomeDetail(req.params.jobId.toString())
      if (!offre) {
        throw badRequest("L'offre n'existe pas")
      }
      res.status(200).send(offre)
    }
  )

  /**
   * Create new offer
   */
  server.post(
    "/formulaire/:establishment_id/offre",
    {
      schema: zRoutes.post["/formulaire/:establishment_id/offre"],
      onRequest: [server.auth(zRoutes.post["/formulaire/:establishment_id/offre"])],
      bodyLimit: 5 * 1024 ** 2, // 5MB
    },
    async (req, res) => {
      const { establishment_id } = req.params
      const user = getUserFromRequest(req, zRoutes.post["/formulaire/:establishment_id/offre"]).value
      const {
        is_disabled_elligible,
        job_type,
        delegations,
        job_count,
        job_duration,
        job_level_label,
        job_rythm,
        job_start_date,
        rome_appellation_label,
        rome_code,
        rome_label,
        competences_rome,
        offer_title_custom,
      } = req.body
      const updatedFormulaire = await createJob({
        job: {
          is_disabled_elligible,
          job_type,
          delegations,
          job_count,
          job_duration,
          job_level_label,
          job_rythm,
          job_start_date,
          rome_appellation_label,
          rome_code,
          rome_label,
          competences_rome,
          offer_title_custom,
        },
        user,
        establishment_id,
      })
      const job = updatedFormulaire.jobs.at(0)
      if (!job) {
        throw new Error("unexpected")
      }
      const token = generateOffreToken(user, job)
      return res.status(200).send({ recruiter: updatedFormulaire, token })
    }
  )

  /**
   * Create new offer
   */
  server.post(
    "/formulaire/:establishment_id/offre/by-token",
    {
      schema: zRoutes.post["/formulaire/:establishment_id/offre/by-token"],
      onRequest: [server.auth(zRoutes.post["/formulaire/:establishment_id/offre/by-token"])],
      bodyLimit: 5 * 1024 ** 2, // 5MB
    },
    async (req, res) => {
      const { establishment_id } = req.params
      const tokenUser = getUserFromRequest(req, zRoutes.post["/formulaire/:establishment_id/offre/by-token"]).value
      const { email } = tokenUser.identity
      const user = await getUserWithAccountByEmail(email)
      if (!user) {
        throw internal(`inattendu : impossible de récupérer l'utilisateur de type token ayant pour email=${email}`)
      }
      const {
        is_disabled_elligible,
        job_type,
        delegations,
        job_count,
        job_description,
        job_duration,
        job_level_label,
        job_rythm,
        job_start_date,
        rome_appellation_label,
        rome_code,
        rome_label,
        competences_rome,
        offer_title_custom,
      } = req.body
      const updatedFormulaire = await createJob({
        job: {
          is_disabled_elligible,
          job_type,
          delegations,
          job_count,
          job_description,
          job_duration,
          job_level_label,
          job_rythm,
          job_start_date,
          rome_appellation_label,
          rome_code,
          rome_label,
          competences_rome,
          offer_title_custom,
        },
        establishment_id,
        user,
      })
      const job = updatedFormulaire.jobs.at(0)
      if (!job) {
        throw new Error("unexpected")
      }
      const token = generateOffreToken(user, job)
      return res.status(200).send({ recruiter: updatedFormulaire, token })
    }
  )

  /**
   * Create offer delegations
   */
  server.post(
    "/formulaire/offre/:jobId/delegation",
    {
      schema: zRoutes.post["/formulaire/offre/:jobId/delegation"],
      onRequest: [server.auth(zRoutes.post["/formulaire/offre/:jobId/delegation"])],
    },
    async (req, res) => {
      const { etablissementCatalogueIds } = req.body
      const { jobId } = req.params
      const job = await createJobDelegations({ jobId, etablissementCatalogueIds })
      return res.status(200).send(job)
    }
  )

  server.post(
    "/formulaire/offre/:jobId/delegation/by-token",
    {
      schema: zRoutes.post["/formulaire/offre/:jobId/delegation/by-token"],
      onRequest: [server.auth(zRoutes.post["/formulaire/offre/:jobId/delegation/by-token"])],
    },
    async (req, res) => {
      const { etablissementCatalogueIds } = req.body
      const { jobId } = req.params
      const job = await createJobDelegations({ jobId, etablissementCatalogueIds })
      return res.status(200).send(job)
    }
  )

  /**
   * Update an existing offer from id
   */
  server.put(
    "/formulaire/offre/:jobId",
    {
      schema: zRoutes.put["/formulaire/offre/:jobId"],
      onRequest: [server.auth(zRoutes.put["/formulaire/offre/:jobId"])],
    },
    async (req, res) => {
      const { jobId } = req.params
      const recruiterOpt = await getOffre(jobId)
      const offreOpt = recruiterOpt?.jobs.find((job) => job._id.toString() === jobId.toString())
      if (!recruiterOpt || !offreOpt) {
        throw notFound("offer not found")
      }

      if (recruiterOpt.status !== RECRUITER_STATUS.ACTIF || offreOpt.job_status !== JOB_STATUS.ACTIVE) {
        throw conflict("Offer is not active")
      }
      await patchOffre(jobId, req.body)
      return res.status(200).send({})
    }
  )

  /**
   * Met à jour la date de lecture de la delegation d'une offre
   */
  server.patch(
    "/formulaire/offre/:jobId/delegation/view",
    {
      schema: zRoutes.patch["/formulaire/offre/:jobId/delegation/view"],
      onRequest: [server.auth(zRoutes.patch["/formulaire/offre/:jobId/delegation/view"])],
    },
    async (req, res) => {
      const { jobId } = req.params
      const { siret_formateur } = req.query

      const offre = await getJob(jobId.toString())
      if (!offre) {
        throw badRequest("L'offre n'existe pas.")
      }
      const delegation = offre.delegations?.find((delegation) => delegation.siret_code === siret_formateur)
      if (!delegation) {
        throw badRequest("Le siret formateur n'a pas été proposé à l'offre.")
      }
      if (!delegation.cfa_read_company_detail_at) {
        delegation.cfa_read_company_detail_at = new Date()
      }

      await updateJobDelegation(jobId, delegation)

      return res.send({})
    }
  )

  /**
   * Permet de passer une offre en statut ANNULER (mail transactionnel)
   */
  server.put(
    "/formulaire/offre/:jobId/cancel",
    {
      schema: zRoutes.put["/formulaire/offre/:jobId/cancel"],
      onRequest: [server.auth(zRoutes.put["/formulaire/offre/:jobId/cancel"])],
    },
    async (req, res) => {
      const { jobId } = req.params
      const exists = await checkOffreExists(jobId)
      if (!exists) {
        return res.status(400).send({ status: "INVALID_RESSOURCE", message: "L'offre n'existe pas" })
      }
      await cancelOffre(jobId)
      await validateUserEmailFromJobId(jobId)
      return res.status(200).send({})
    }
  )

  /**
   * Permet de passer une offre en statut ANNULER (depuis l'interface d'admin)
   */
  server.put(
    "/formulaire/offre/f/:jobId/cancel",
    {
      schema: zRoutes.put["/formulaire/offre/f/:jobId/cancel"],
      onRequest: server.auth(zRoutes.put["/formulaire/offre/f/:jobId/cancel"]),
    },
    async (req, res) => {
      const exists = await checkOffreExists(req.params.jobId)
      if (!exists) {
        return res.status(400).send({ status: "INVALID_RESSOURCE", message: "L'offre n'existe pas" })
      }
      await cancelOffreFromAdminInterface(req.params.jobId, req.body)
      return res.status(200).send({})
    }
  )

  /**
   * Permet de passer une offre en statut POURVUE (mail transactionnel)
   */
  server.put(
    "/formulaire/offre/:jobId/provided",
    {
      schema: zRoutes.put["/formulaire/offre/:jobId/provided"],
      onRequest: [server.auth(zRoutes.put["/formulaire/offre/:jobId/provided"])],
    },
    async (req, res) => {
      const { jobId } = req.params
      const exists = await checkOffreExists(jobId)
      if (!exists) {
        return res.status(400).send({ status: "INVALID_RESSOURCE", message: "L'offre n'existe pas" })
      }
      await provideOffre(jobId)
      await validateUserEmailFromJobId(jobId)
      return res.status(200).send({})
    }
  )

  server.put(
    "/formulaire/offre/:jobId/extend",
    {
      schema: zRoutes.put["/formulaire/offre/:jobId/extend"],
      onRequest: [server.auth(zRoutes.put["/formulaire/offre/:jobId/extend"])],
    },
    async (req, res) => {
      const job = await extendOffre(req.params.jobId)
      return res.status(200).send(job)
    }
  )
}
