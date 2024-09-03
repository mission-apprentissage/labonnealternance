import { badRequest, internal } from "@hapi/boom"
import { ILbaItemFtJob, ILbaItemLbaJob, JOB_STATUS_ENGLISH, assertUnreachable, zRoutes } from "shared"
import { LBA_ITEM_TYPE } from "shared/constants/lbaitem"

import { getDbCollection } from "@/common/utils/mongodbUtils"
import { getUserFromRequest } from "@/security/authenticationService"
import { JobOpportunityRequestContext } from "@/services/jobs/jobOpportunity/JobOpportunityRequestContext"

import { getFileSignedURL } from "../../../common/utils/awsUtils"
import { trackApiCall } from "../../../common/utils/sendTrackingEvent"
import { sentryCaptureException } from "../../../common/utils/sentryUtils"
import dayjs from "../../../services/dayjs.service"
import { addExpirationPeriod, getFormulaires } from "../../../services/formulaire.service"
import { getFtJobFromIdV2 } from "../../../services/ftjob.service"
import { getJobsQuery, findJobsOpportunities, createJobOffer, updateJobOffer } from "../../../services/jobs/jobOpportunity/jobOpportunity.service"
import { addOffreDetailView, getLbaJobByIdV2 } from "../../../services/lbajob.service"
import { getCompanyFromSiret } from "../../../services/recruteurLba.service"
import { Server } from "../../server"

const config = {
  rateLimit: {
    max: 5,
    timeWindow: "1s",
  },
}

export default (server: Server) => {
  server.get(
    "/jobs/establishment",
    {
      schema: zRoutes.get["/jobs/establishment"],
      config,
      onRequest: server.auth(zRoutes.get["/jobs/establishment"]),
    },
    async (req, res) => {
      const { establishment_siret, email } = req.query

      const establishment = await getDbCollection("recruiters").findOne({ establishment_siret, email })

      if (!establishment) {
        return res.status(400).send({ error: true, message: "Establishment not found" })
      }

      return res.status(200).send(establishment.establishment_id)
    }
  )

  server.get(
    "/jobs/bulk",
    {
      schema: zRoutes.get["/jobs/bulk"],
      config,
      onRequest: server.auth(zRoutes.get["/jobs/bulk"]),
    },
    async (req, res) => {
      const { query, select, page, limit } = req.query

      const user = getUserFromRequest(req, zRoutes.get["/jobs/bulk"]).value

      const qs = query ? JSON.parse(query) : {}
      const slt = select ? JSON.parse(select) : {}

      const jobs = await getFormulaires({ ...qs, opco: user.organisation }, slt, { page, limit })

      res.status(200)
      return res.send(jobs)
    }
  )

  server.post(
    "/jobs",
    {
      schema: zRoutes.post["/jobs"],
      onRequest: server.auth(zRoutes.post["/jobs"]),
      config,
    },
    async (req, res) => {
      const user = getUserFromRequest(req, zRoutes.post["/jobs"]).value
      const id = await createJobOffer(user, req.body)
      return res.status(201).send({ id })
    }
  )

  server.put(
    "/jobs/:id",
    {
      schema: zRoutes.put["/jobs/:id"],
      onRequest: server.auth(zRoutes.put["/jobs/:id"]),
      config,
    },
    async (req, res) => {
      const user = getUserFromRequest(req, zRoutes.put["/jobs/:id"]).value
      await updateJobOffer(req.params.id, user, req.body)
      return res.status(204).send()
    }
  )

  server.post(
    "/jobs/provided/:id",
    {
      schema: zRoutes.post["/jobs/provided/:id"],
      onRequest: server.auth(zRoutes.post["/jobs/provided/:id"]),
      config,
    },
    async (req, res) => {
      const { id } = req.params
      const job = await getDbCollection("jobs_partners").findOne({ _id: id })
      if (!job) {
        throw badRequest("Job does not exist")
      }

      if (job.offer_status === JOB_STATUS_ENGLISH.POURVUE) {
        throw badRequest("Job is already provided")
      }
      await getDbCollection("jobs_partners").findOneAndUpdate({ _id: id }, { $set: { offer_status: JOB_STATUS_ENGLISH.POURVUE } })
      return res.status(204).send()
    }
  )

  server.post(
    "/jobs/canceled/:id",
    {
      schema: zRoutes.post["/jobs/canceled/:id"],
      onRequest: server.auth(zRoutes.post["/jobs/canceled/:id"]),
      config,
    },
    async (req, res) => {
      const { id } = req.params
      const job = await getDbCollection("jobs_partners").findOne({ _id: id })
      if (!job) {
        throw badRequest("Job does not exists")
      }

      if (job.offer_status === JOB_STATUS_ENGLISH.ANNULEE) {
        throw badRequest("Job is already canceled")
      }
      await getDbCollection("jobs_partners").findOneAndUpdate({ _id: id }, { $set: { offer_status: JOB_STATUS_ENGLISH.ANNULEE } })
      return res.status(204).send()
    }
  )

  server.post(
    "/jobs/extend/:id",
    {
      schema: zRoutes.post["/jobs/extend/:id"],
      onRequest: server.auth(zRoutes.post["/jobs/extend/:id"]),
      config,
    },
    async (req, res) => {
      const { id } = req.params
      const job = await getDbCollection("jobs_partners").findOne({ _id: id })
      if (!job) {
        throw badRequest("Job does not exists")
      }
      if (addExpirationPeriod(dayjs()).isSame(dayjs(job.offer_expiration), "day")) {
        throw badRequest("Job is already extended up to two month")
      }

      if (job.offer_status !== JOB_STATUS_ENGLISH.ACTIVE) {
        throw badRequest("Job cannot be extended as it is not active")
      }
      await getDbCollection("jobs_partners").findOneAndUpdate({ _id: id }, { $set: { offer_expiration_date: addExpirationPeriod(dayjs()).toDate() } })
      return res.status(204).send()
    }
  )

  server.get(
    "/jobs/min",
    {
      schema: zRoutes.get["/jobs/min"],
      config,
    },
    async (req, res) => {
      const { referer } = req.headers
      const { romes, rncp, caller, latitude, longitude, radius, insee, sources, diploma, opco, opcoUrl } = req.query
      const result = await getJobsQuery({ romes, rncp, caller, referer, latitude, longitude, radius, insee, sources, diploma, opco, opcoUrl, isMinimalData: true })

      if ("error" in result) {
        return res.status(500).send(result)
      }
      return res.status(200).send(result)
    }
  )

  server.get(
    "/jobs/entreprise_lba/:siret",
    {
      schema: zRoutes.get["/jobs/entreprise_lba/:siret"],
      onRequest: server.auth(zRoutes.get["/jobs/entreprise_lba/:siret"]),
      config,
    },
    async (req, res) => {
      const { siret } = req.params
      const { referer } = req.headers
      const { caller } = req.query
      const result = await getCompanyFromSiret({
        siret,
        referer,
        caller,
      })

      if ("error" in result) {
        if (result.error === "wrong_parameters") {
          res.status(400)
        } else if (result.error === "not_found") {
          res.status(404)
        } else {
          res.status(500)
        }
      }

      return res.send(result)
    }
  )

  server.get(
    "/jobs/:source/:id",
    {
      schema: zRoutes.get["/jobs/:source/:id"],
      onRequest: server.auth(zRoutes.get["/jobs/:source/:id"]),
      config,
    },
    async (req, res) => {
      const { source, id } = req.params
      const { caller } = req.query
      let result: { job: ILbaItemLbaJob[] | ILbaItemFtJob } | null

      switch (source) {
        case LBA_ITEM_TYPE.OFFRES_EMPLOI_LBA:
          result = await getLbaJobByIdV2({
            id,
            caller,
          })
          break

        case LBA_ITEM_TYPE.OFFRES_EMPLOI_PARTENAIRES:
          result = await getFtJobFromIdV2({
            id,
            caller,
          })
          break

        default:
          assertUnreachable(source as never)
      }
      return res.send(result)
    }
  )

  server.post(
    "/jobs/matcha/:id/stats/view-details",
    {
      schema: zRoutes.post["/jobs/matcha/:id/stats/view-details"],
      config,
    },
    async (req, res) => {
      const { id } = req.params
      await addOffreDetailView(id)
      return res.send({})
    }
  )

  server.get(
    "/jobs/export",
    {
      schema: zRoutes.get["/jobs/export"],
      onRequest: server.auth(zRoutes.get["/jobs/export"]),
      config: {
        rateLimit: {
          max: 1,
          timeWindow: "1s",
        },
      },
    },
    async (req, res) => {
      const user = getUserFromRequest(req, zRoutes.get["/jobs/export"]).value
      const { source } = req.query
      if (source === LBA_ITEM_TYPE.OFFRES_EMPLOI_LBA) {
        try {
          const url = await getFileSignedURL({ key: `${LBA_ITEM_TYPE.OFFRES_EMPLOI_LBA}.json` })
          trackApiCall({ caller: user._id.toString(), api_path: `${zRoutes.get["/jobs/export"].path}/${source}`, response: "OK" })
          return res.send(url)
        } catch (error) {
          sentryCaptureException(error)
          throw internal("Une erreur est survenue lors de la génération du lien de téléchargement.")
        }
      } else {
        try {
          const url = await getFileSignedURL({ key: `${LBA_ITEM_TYPE.RECRUTEURS_LBA}.json` })
          trackApiCall({ caller: user._id.toString(), api_path: `${zRoutes.get["/jobs/export"].path}/${source}`, response: "OK" })
          return res.send(url)
        } catch (error) {
          sentryCaptureException(error)
          throw internal("Une erreur est survenue lors de la génération du lien de téléchargement.")
        }
      }
    }
  )

  server.get("/jobs", { schema: zRoutes.get["/jobs"], onRequest: server.auth(zRoutes.get["/jobs"]) }, async (req, res) => {
    const result = await findJobsOpportunities(req.query, new JobOpportunityRequestContext(zRoutes.get["/jobs"], "api-apprentissage"))
    return res.send(result)
  })
}
