import Boom from "boom"
import { zRoutes } from "shared/index"

// import { Recruiter } from "../../common/model/index"
import { getApplication } from "../../services/application.service"
import { entrepriseOnboardingWorkflow } from "../../services/etablissement.service"
import {
  archiveDelegatedFormulaire,
  archiveFormulaire,
  cancelOffre,
  cancelOffreFromAdminInterface,
  checkOffreExists,
  createJob,
  createJobDelegations,
  extendOffre,
  getFormulaire,
  getJob,
  patchOffre,
  provideOffre,
  updateFormulaire,
} from "../../services/formulaire.service"
import { getUser } from "../../services/userRecruteur.service"
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
      const result = await getFormulaire({ establishment_id: req.params.establishment_id })

      if (!result) {
        return res.status(401).send({})
      }

      result.jobs = await Promise.all(
        result.jobs.map(async (job) => {
          const candidatures = await getApplication(job._id.toString())
          return { ...job, candidatures: candidatures && candidatures.length > 0 ? candidatures.length : undefined }
        })
      )

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
      const { establishment_siret, email, last_name, first_name, phone, opco, idcc } = req.body
      const userRecruteurOpt = await getUser({ _id: userRecruteurId })
      if (!userRecruteurOpt) {
        throw Boom.badRequest("Nous n'avons pas trouvé votre compte utilisateur")
      }
      if (!userRecruteurOpt.establishment_siret) {
        throw Boom.internal("unexpected: userRecruteur without establishment_siret")
      }
      const response = await entrepriseOnboardingWorkflow.createFromCFA({
        email,
        last_name,
        first_name,
        phone,
        siret: establishment_siret,
        cfa_delegated_siret: userRecruteurOpt.establishment_siret,
        origin: userRecruteurOpt.scope,
        opco,
        idcc,
      })
      if ("error" in response) {
        const { message } = response
        throw Boom.badRequest(message)
      }
      return res.status(200).send(response)
    }
  )

  /**
   * Put form
   */
  server.put(
    "/formulaire/:establishment_id",
    {
      schema: zRoutes.put["/formulaire/:establishment_id"],
      onRequest: [server.auth(zRoutes.put["/formulaire/:establishment_id"])],
    },
    async (req, res) => {
      const result = await updateFormulaire(req.params.establishment_id, req.body)
      return res.status(200).send(result)
    }
  )

  server.delete(
    "/formulaire/:establishment_id",
    {
      schema: zRoutes.delete["/formulaire/:establishment_id"],
      onRequest: [server.auth(zRoutes.delete["/formulaire/:establishment_id"])],
    },
    async (req, res) => {
      await archiveFormulaire(req.params.establishment_id)
      return res.status(200).send({})
    }
  )

  server.delete(
    "/formulaire/delegated/:establishment_siret",
    {
      schema: zRoutes.delete["/formulaire/delegated/:establishment_siret"],
    },
    async (req, res) => {
      await archiveDelegatedFormulaire(req.params.establishment_siret)
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
    },
    async (req, res) => {
      const offre = await getJob(req.params.jobId.toString())
      if (!offre) {
        throw Boom.badRequest("L'offre n'existe pas")
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
        },
        id: req.params.establishment_id,
      })
      return res.status(200).send(updatedFormulaire)
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

  /**
   * Update an existing offer from id
   */
  server.put(
    "/formulaire/offre/:jobId",
    {
      schema: zRoutes.put["/formulaire/offre/:jobId"],
      // TODO no security ?
    },
    async (req, res) => {
      const result = await patchOffre(req.params.jobId, req.body)
      return res.status(200).send(result)
    }
  )

  /**
   * Permet de passer une offre en statut ANNULER (mail transactionnel)
   */
  server.patch(
    "/formulaire/offre/:jobId",
    {
      schema: zRoutes.patch["/formulaire/offre/:jobId"],
    },
    async (req, res) => {
      const { jobId } = req.params
      const exists = await checkOffreExists(jobId)

      if (!exists) {
        throw Boom.badRequest("L'offre n'existe pas.")
      }

      const offre = await getJob(jobId.toString())

      const delegations = offre?.delegations

      if (!delegations) {
        throw Boom.badRequest("Le siret formateur n'a pas été proposé à l'offre.")
      }

      const delegationFound = delegations.find((delegation) => delegation.siret_code == req.query.siret_formateur)

      if (!delegationFound) {
        throw Boom.badRequest("Le siret formateur n'a pas été proposé à l'offre.")
      }

      await patchOffre(jobId, {
        delegations: delegations.map((delegation) => {
          // Save the date of the first read of the company detail
          if (delegation.siret_code === delegationFound.siret_code && !delegation.cfa_read_company_detail_at) {
            return {
              ...delegation,
              cfa_read_company_detail_at: new Date(),
            }
          }
          return delegation
        }),
      })

      const jobUpdated = await getJob(jobId.toString())
      return res.send(jobUpdated)
    }
  )

  /**
   * Permet de passer une offre en statut ANNULER (mail transactionnel)
   */
  server.put(
    "/formulaire/offre/:jobId/cancel",
    {
      schema: zRoutes.put["/formulaire/offre/:jobId/cancel"],
    },
    async (req, res) => {
      const exists = await checkOffreExists(req.params.jobId)
      if (!exists) {
        return res.status(400).send({ status: "INVALID_RESSOURCE", message: "L'offre n'existe pas" })
      }
      await cancelOffre(req.params.jobId)
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
    },
    async (req, res) => {
      const exists = await checkOffreExists(req.params.jobId)
      if (!exists) {
        return res.status(400).send({ status: "INVALID_RESSOURCE", message: "L'offre n'existe pas" })
      }
      await provideOffre(req.params.jobId)
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
