import { zRoutes } from "shared/index"

import { Recruiter } from "../../common/model/index"
import { getApplication } from "../../services/application.service"
import { entrepriseOnboardingWorkflow } from "../../services/etablissement.service"
import {
  archiveDelegatedFormulaire,
  archiveFormulaire,
  cancelOffre,
  checkOffreExists,
  createJob,
  createJobDelegations,
  getFormulaire,
  getJob,
  getOffre,
  patchOffre,
  provideOffre,
  updateFormulaire,
  updateOffre,
} from "../../services/formulaire.service"
import { getUser } from "../../services/userRecruteur.service"
import { authMiddleware, authenticationMiddleware } from "../middlewares/authMiddleware"
import { Server } from "../server"

export default (server: Server) => {
  /**
   * Query search endpoint
   */
  server.get(
    "/api/formulaire",
    {
      schema: zRoutes.get["/api/formulaire"],
      preHandler: [authenticationMiddleware("jwt-bearer")],
    },
    async (req, res) => {
      // TODO_AB ??????
      const query = req.query.query
      const results = await Recruiter.find(query).limit(50).lean()
      return res.status(200).send(results)
    }
  )

  /**
   * Get form from id
   */
  server.get(
    "/api/formulaire/:establishment_id",
    {
      schema: zRoutes.get["/api/formulaire/:establishment_id"],
    },
    async (req, res) => {
      const result = await getFormulaire({ establishment_id: req.params.establishment_id })

      if (!result) {
        return res.status(401).send()
      }

      await Promise.all(
        result.jobs.map(async (job) => {
          const candidatures = await getApplication(job._id)
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
    "/api/formulaire",
    {
      schema: zRoutes.post["/api/formulaire"],
    },
    async (req, res) => {
      const { userRecruteurId, establishment_siret, email, last_name, first_name, phone, opco, idcc } = req.body
      const userRecruteurOpt = await getUser({ _id: userRecruteurId })
      if (!userRecruteurOpt) {
        return res.status(400).json({ error: true, message: "Nous n'avons pas trouvé votre compte utilisateur" })
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
        return res.status(400).json({ error: true, message })
      }
      return res.status(200).send(response)
    }
  )

  /**
   * Put form
   */
  server.put(
    "/api/formulaire/:establishment_id",
    {
      schema: zRoutes.put["/api/formulaire/:establishment_id"],
    },
    async (req, res) => {
      const result = await updateFormulaire(req.params.establishment_id, req.body)
      return res.status(200).send(result)
    }
  )

  server.delete(
    "/api/formulaire/:establishment_id",
    {
      schema: zRoutes.delete["/api/formulaire/:establishment_id"],
    },
    async (req, res) => {
      await archiveFormulaire(req.params.establishment_id)
      return res.status(200).send()
    }
  )

  server.delete(
    "/api/formulaire/delegated/:establishment_siret",
    {
      schema: zRoutes.delete["/api/formulaire/delegated/:establishment_siret"],
    },
    async (req, res) => {
      await archiveDelegatedFormulaire(req.params.establishment_siret)
      return res.status(200).send()
    }
  )

  /**
   * TEMP : get offer from id for front
   * TO BE REPLACE
   *
   */
  server.get(
    "/api/formulaire/offre/f/:jobId",
    {
      schema: zRoutes.get["/api/formulaire/offre/f/:jobId"],
    },
    async (req, res) => {
      // Note pour PR quel traitement de getJobById empêche de l'utiliser ici ?
      const result = await getOffre(req.params.jobId)
      const offre = result.jobs.filter((job) => job._id == req.params.jobId)

      res.status(200).send(offre)
    }
  )

  /**
   * Create new offer
   */
  server.post(
    "/api/formulaire/:establishment_id/offre",
    {
      schema: zRoutes.post["/api/formulaire/:establishment_id/offre"],
    },
    async (req, res) => {
      const updatedFormulaire = await createJob({ job: req.body, id: req.params.establishment_id })
      return res.status(200).send(updatedFormulaire)
    }
  )

  /**
   * Create offer delegations
   */
  server.post(
    "/api/formulaire/offre/:jobId/delegation",
    {
      schema: zRoutes.post["/api/formulaire/offre/:jobId/delegation"],
    },
    async (req, res) => {
      const { etablissementCatalogueIds } = req.body
      const { jobId } = req.params
      const job = await createJobDelegations({ jobId, etablissementCatalogueIds })
      return res.status(200).send(job)
    }
  )

  /**
   * Put existing offer from id
   */
  server.put(
    "/api/formulaire/offre/:jobId",
    {
      schema: zRoutes.put["/api/formulaire/offre/:jobId"],
    },
    async (req, res) => {
      const result = await updateOffre(req.params.jobId, req.body)
      return res.status(200).send(result)
    }
  )

  /**
   * Permet de passer une offre en statut ANNULER (mail transactionnel)
   */
  server.patch(
    "/api/formulaire/offre/:jobId",
    {
      schema: zRoutes.patch["/api/formulaire/offre/:jobId"],
    },
    async (req, res) => {
      const { jobId } = req.params
      const exists = await checkOffreExists(jobId)

      if (!exists) {
        return res.status(400).json({ status: "INVALID_RESOURCE", message: "L'offre n'existe pas." })
      }

      const offre = await getJob(jobId)

      const delegationFound = offre.delegations.find((delegation) => delegation.siret_code == req.query.siret_formateur)

      if (!delegationFound) {
        return res.status(400).json({ status: "INVALID_RESOURCE", message: `Le siret formateur n'a pas été proposé à l'offre.` })
      }

      await patchOffre(jobId, {
        delegations: offre.delegations.map((delegation) => {
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

      const jobUpdated = await getJob(jobId)
      return res.send(jobUpdated)
    }
  )

  /**
   * Permet de passer une offre en statut ANNULER (mail transactionnel)
   */
  server.put(
    "/api/formulaire/offre/:jobId/cancel",
    {
      schema: zRoutes.put["/api/formulaire/offre/:jobId/cancel"],
    },
    async (req, res) => {
      const exists = await checkOffreExists(req.params.jobId)
      if (!exists) {
        return res.status(400).json({ status: "INVALID_RESSOURCE", message: "L'offre n'existe pas" })
      }
      await cancelOffre(req.params.jobId)
      return res.status(200).send()
    }
  )

  /**
   * Permet de passer une offre en statut POURVUE (mail transactionnel)
   */
  server.put(
    "/api/formulaire/offre/:jobId/provided",
    {
      schema: zRoutes.put["/api/formulaire/offre/:jobId/provided"],
    },
    async (req, res) => {
      const exists = await checkOffreExists(req.params.jobId)
      if (!exists) {
        return res.status(400).json({ status: "INVALID_RESSOURCE", message: "L'offre n'existe pas" })
      }
      await provideOffre(req.params.jobId)
      return res.status(200).send()
    }
  )
}
