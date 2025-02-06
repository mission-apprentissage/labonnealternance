import { badRequest, internal } from "@hapi/boom"
import { ILbaItemFtJob, ILbaItemLbaJob, JOB_STATUS_ENGLISH, assertUnreachable, zRoutes } from "shared"
import { LBA_ITEM_TYPE } from "shared/constants/lbaitem"

import { getDbCollection } from "@/common/utils/mongodbUtils"
import { getUserFromRequest } from "@/security/authenticationService"

import { s3SignedUrl } from "../../../common/utils/awsUtils"
import { trackApiCall } from "../../../common/utils/sendTrackingEvent"
import { sentryCaptureException } from "../../../common/utils/sentryUtils"
import dayjs from "../../../services/dayjs.service"
import { addExpirationPeriod, getFormulaires } from "../../../services/formulaire.service"
import { getFtJobFromIdV2 } from "../../../services/ftjob.service"
import { getLbaJobByIdV2 } from "../../../services/lbajob.service"
import { Server } from "../../server"

const config = {
  rateLimit: {
    max: 5,
    timeWindow: "1s",
  },
}

export default (server: Server) => {
  server.get(
    "/v2/jobs/establishment",
    {
      schema: zRoutes.get["/v2/jobs/establishment"],
      config,
      onRequest: server.auth(zRoutes.get["/v2/jobs/establishment"]),
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
    "/v2/jobs/bulk",
    {
      schema: zRoutes.get["/v2/jobs/bulk"],
      config,
      onRequest: server.auth(zRoutes.get["/v2/jobs/bulk"]),
    },
    async (req, res) => {
      const { query, select, page, limit } = req.query

      const user = getUserFromRequest(req, zRoutes.get["/v2/jobs/bulk"]).value

      const qs = query ? JSON.parse(query) : {}
      const slt = select ? JSON.parse(select) : {}

      const jobs = await getFormulaires({ ...qs, opco: user.organisation }, slt, { page, limit })

      res.status(200)
      return res.send(jobs)
    }
  )

  server.post(
    "/v2/jobs/provided/:id",
    {
      schema: zRoutes.post["/v2/jobs/provided/:id"],
      onRequest: server.auth(zRoutes.post["/v2/jobs/provided/:id"]),
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
    "/v2/jobs/canceled/:id",
    {
      schema: zRoutes.post["/v2/jobs/canceled/:id"],
      onRequest: server.auth(zRoutes.post["/v2/jobs/canceled/:id"]),
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
    "/v2/_private/jobs/provided/:id",
    {
      schema: zRoutes.post["/v2/_private/jobs/provided/:id"],
      onRequest: server.auth(zRoutes.post["/v2/_private/jobs/provided/:id"]),
      config,
    },
    async (req, res) => {
      const { id } = req.params
      console.log(typeof id, id)
      const job = await getDbCollection("jobs_partners").findOne({ _id: id })
      if (!job) {
        throw badRequest("Job does not exist")
      }

      if (job.offer_status === JOB_STATUS_ENGLISH.POURVUE) {
        throw badRequest("Job is already provided")
      }
      await getDbCollection("jobs_partners").findOneAndUpdate({ _id: id }, { $set: { offer_status: JOB_STATUS_ENGLISH.POURVUE } })
      return res.status(200).send({})
    }
  )

  server.post(
    "/v2/_private/jobs/canceled/:id",
    {
      schema: zRoutes.post["/v2/_private/jobs/canceled/:id"],
      onRequest: server.auth(zRoutes.post["/v2/_private/jobs/canceled/:id"]),
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
      return res.status(200).send({})
    }
  )

  server.post(
    "/v2/jobs/extend/:id",
    {
      schema: zRoutes.post["/v2/jobs/extend/:id"],
      onRequest: server.auth(zRoutes.post["/v2/jobs/extend/:id"]),
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
    "/v2/jobs/:source/:id",
    {
      schema: zRoutes.get["/v2/jobs/:source/:id"],
      onRequest: server.auth(zRoutes.get["/v2/jobs/:source/:id"]),
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

  server.get(
    "/v2/jobs/export",
    {
      schema: zRoutes.get["/v2/jobs/export"],
      onRequest: server.auth(zRoutes.get["/v2/jobs/export"]),
      config: {
        rateLimit: {
          max: 1,
          timeWindow: "1s",
        },
      },
    },
    async (req, res) => {
      const user = getUserFromRequest(req, zRoutes.get["/v2/jobs/export"]).value
      const { source } = req.query
      if (source === LBA_ITEM_TYPE.OFFRES_EMPLOI_LBA) {
        try {
          const key = `${LBA_ITEM_TYPE.OFFRES_EMPLOI_LBA}.json`
          const url = await s3SignedUrl("storage", key, { expiresIn: 120 })
          trackApiCall({ caller: user._id.toString(), api_path: `${zRoutes.get["/v2/jobs/export"].path}/${source}`, response: "OK" })
          return res.send(url)
        } catch (error) {
          sentryCaptureException(error)
          throw internal("Une erreur est survenue lors de la génération du lien de téléchargement.")
        }
      } else {
        try {
          const key = `${LBA_ITEM_TYPE.RECRUTEURS_LBA}.json`
          const url = await s3SignedUrl("storage", key, { expiresIn: 120 })
          trackApiCall({ caller: user._id.toString(), api_path: `${zRoutes.get["/v2/jobs/export"].path}/${source}`, response: "OK" })
          return res.send(url)
        } catch (error) {
          sentryCaptureException(error)
          throw internal("Une erreur est survenue lors de la génération du lien de téléchargement.")
        }
      }
    }
  )
}
