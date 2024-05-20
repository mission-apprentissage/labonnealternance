import Boom from "boom"
import { IJob, JOB_STATUS, zRoutes } from "shared"

import { getUserFromRequest } from "@/security/authenticationService"
import { Appellation } from "@/services/rome.service.types"
import { getUser2ByEmail } from "@/services/user2.service"

import { Recruiter } from "../../common/model/index"
import { getNearEtablissementsFromRomes } from "../../services/catalogue.service"
import { ACTIVE, ANNULEE, POURVUE } from "../../services/constant.service"
import dayjs from "../../services/dayjs.service"
import { entrepriseOnboardingWorkflow } from "../../services/etablissement.service"
import {
  addExpirationPeriod,
  cancelOffre,
  createJobDelegations,
  createOffre,
  extendOffre,
  getFormulaire,
  getFormulaires,
  getJob,
  getOffre,
  patchOffre,
  provideOffre,
} from "../../services/formulaire.service"
import { getFtJobFromId } from "../../services/ftjob.service"
import { getJobsQuery } from "../../services/jobOpportunity.service"
import { getCompanyFromSiret } from "../../services/lbacompany.service"
import { addOffreDetailView, getLbaJobById } from "../../services/lbajob.service"
import { getFicheMetierRomeV3FromDB } from "../../services/rome.service"
import { Server } from "../server"

const config = {
  rateLimit: {
    max: 5,
    timeWindow: "1s",
  },
}

export default (server: Server) => {
  server.get(
    "/v1/jobs/establishment",
    {
      schema: zRoutes.get["/v1/jobs/establishment"],
      config,
      onRequest: server.auth(zRoutes.get["/v1/jobs/establishment"]),
    },
    async (req, res) => {
      const { establishment_siret, email } = req.query

      const establishment = await Recruiter.findOne({ establishment_siret, email }).lean()

      if (!establishment) {
        return res.status(400).send({ error: true, message: "Establishment not found" })
      }

      return res.status(200).send(establishment.establishment_id)
    }
  )

  server.get(
    "/v1/jobs/bulk",
    {
      schema: zRoutes.get["/v1/jobs/bulk"],
      config,
      onRequest: server.auth(zRoutes.get["/v1/jobs/bulk"]),
      // TODO: AttachValidation Error ?
    },
    async (req, res) => {
      const { query, select, page, limit } = req.query

      const user = getUserFromRequest(req, zRoutes.get["/v1/jobs/bulk"]).value

      const qs = query ? JSON.parse(query) : {}
      const slt = select ? JSON.parse(select) : {}

      const jobs = await getFormulaires({ ...qs, opco: user.organisation }, slt, { page, limit })

      res.status(200)
      return res.send(jobs)
    }
  )

  server.post(
    "/v1/jobs/establishment",
    {
      schema: zRoutes.post["/v1/jobs/establishment"],
      onRequest: server.auth(zRoutes.post["/v1/jobs/establishment"]),
      config,
    },
    async (req, res) => {
      const { body } = req

      const { first_name, last_name, phone, email, origin, idcc, establishment_siret } = body
      const user = getUserFromRequest(req, zRoutes.post["/v1/jobs/establishment"]).value

      const result = await entrepriseOnboardingWorkflow.create(
        {
          email,
          first_name,
          last_name,
          phone,
          origin: `${user.scope}${origin ? `-${origin}` : ""}`,
          idcc,
          siret: establishment_siret,
          opco: user.organisation,
        },
        {
          isUserValidated: true,
        }
      )
      if ("error" in result) {
        const { message } = result
        return res.status(400).send({ error: true, message })
      }

      return res.status(201).send(result.formulaire)
    }
  )

  server.post(
    "/v1/jobs/:establishmentId",
    {
      schema: zRoutes.post["/v1/jobs/:establishmentId"],
      onRequest: server.auth(zRoutes.post["/v1/jobs/:establishmentId"]),
      config,
    },
    async (req, res) => {
      const { establishmentId } = req.params
      const { body } = req
      // Check if entity exists
      const establishmentExists = await getFormulaire({ establishment_id: establishmentId })

      if (!establishmentExists) {
        return res.status(400).send({ error: true, message: "Establishment does not exist" })
      }
      const user = await getUser2ByEmail(establishmentExists.email)
      if (!user) {
        return res.status(400).send({ error: true, message: "User does not exist" })
      }

      const romeDetails = await getFicheMetierRomeV3FromDB({
        query: {
          "fiche_metier.appellations.code": body.appellation_code,
        },
      }) //  fiche_metier.appellations[].code === body.appellation_code

      if (!romeDetails) {
        return res.send({ error: true, message: "ROME Code details could not be retrieved" })
      }

      const appellation = romeDetails.fiche_metier.appellations.find(({ code }) => code === body.appellation_code) as Appellation

      const job: Partial<IJob> = {
        rome_label: romeDetails.fiche_metier.libelle,
        rome_appellation_label: appellation.libelle,
        rome_code: [romeDetails.code],
        job_level_label: body.job_level_label,
        job_start_date: new Date(body.job_start_date),
        job_description: body.job_description,
        job_employer_description: body.job_employer_description,
        job_creation_date: dayjs().toDate(),
        job_expiration_date: addExpirationPeriod(dayjs()).toDate(),
        job_status: JOB_STATUS.ACTIVE,
        job_type: body.job_type,
        rome_detail: romeDetails.fiche_metier,
        is_disabled_elligible: body.is_disabled_elligible,
        job_count: body.job_count,
        job_duration: body.job_duration,
        job_rythm: body.job_rythm,
        custom_address: body.custom_address,
        custom_geo_coordinates: body.custom_geo_coordinates,
        custom_job_title: body.custom_job_title,
        is_multi_published: body.is_multi_published,
        managed_by: user._id,
      }

      const updatedRecruiter = await createOffre(establishmentId, job)

      return res.status(201).send(updatedRecruiter)
    }
  )

  server.patch(
    "/v1/jobs/:jobId",
    {
      schema: zRoutes.patch["/v1/jobs/:jobId"],
      onRequest: server.auth(zRoutes.patch["/v1/jobs/:jobId"]),
      config,
    },
    async (req, res) => {
      const { jobId } = req.params
      const jobExists = await getOffre(jobId.toString())

      if (!jobExists) {
        return res.status(400).send({ error: true, message: "Job does not exists" })
      }

      const updatedRecruiter = await patchOffre(jobId, req.body)

      return res.status(200).send(updatedRecruiter)
    }
  )

  server.get(
    "/v1/jobs/delegations/:jobId",
    {
      schema: zRoutes.get["/v1/jobs/delegations/:jobId"],
      onRequest: server.auth(zRoutes.get["/v1/jobs/delegations/:jobId"]),
      config,
    },
    async (req, res) => {
      const { jobId } = req.params
      const recruiter = await getOffre(jobId.toString())

      if (!recruiter) {
        throw Boom.badRequest("Job does not exists")
      }

      if (!recruiter.geo_coordinates) {
        throw Boom.internal("geo_coordinates is empty", { jobId: recruiter._id })
      }

      const [latitude = "", longitude = ""] = recruiter.geo_coordinates.split(",")
      const { rome_code } = recruiter.jobs.filter(({ _id }) => _id.toString() === jobId.toString())[0]

      // Get related establishment from a job offer
      const etablissements = await getNearEtablissementsFromRomes({
        rome: rome_code,
        origin: {
          latitude: parseFloat(latitude),
          longitude: parseFloat(longitude),
        },
      })

      if (!etablissements.length) {
        throw Boom.notFound("No delegations found")
      }

      const top10 = etablissements.slice(0, 10)

      return res.status(200).send(top10)
    }
  )

  server.post(
    "/v1/jobs/delegations/:jobId",
    {
      schema: zRoutes.post["/v1/jobs/delegations/:jobId"],
      onRequest: server.auth(zRoutes.post["/v1/jobs/delegations/:jobId"]),
    },
    async (req, res) => {
      const { jobId } = req.params
      const jobExists = await getOffre(jobId.toString())

      if (!jobExists) {
        throw Boom.badRequest("Job does not exists")
      }

      const updatedRecruiter = await createJobDelegations({ jobId: jobId.toString(), etablissementCatalogueIds: req.body.establishmentIds })

      return res.status(200).send(updatedRecruiter)
    }
  )

  server.post(
    "/v1/jobs/provided/:jobId",
    {
      schema: zRoutes.post["/v1/jobs/provided/:jobId"],
      onRequest: server.auth(zRoutes.post["/v1/jobs/provided/:jobId"]),
      config,
    },
    async (req, res) => {
      const { jobId } = req.params
      const job = await getJob(jobId.toString())

      if (!job) {
        throw Boom.badRequest("Job does not exists")
      }

      if (job.job_status === POURVUE) {
        throw Boom.badRequest("Job is already provided")
      }

      await provideOffre(jobId)

      return res.status(204).send()
    }
  )

  server.post(
    "/v1/jobs/canceled/:jobId",
    {
      schema: zRoutes.post["/v1/jobs/canceled/:jobId"],
      onRequest: server.auth(zRoutes.post["/v1/jobs/canceled/:jobId"]),
      config,
    },
    async (req, res) => {
      const { jobId } = req.params
      const job = await getJob(jobId.toString())

      if (!job) {
        throw Boom.badRequest("Job does not exists")
      }

      if (job.job_status === ANNULEE) {
        throw Boom.badRequest("Job is already canceled")
      }

      await cancelOffre(jobId)

      return res.status(204).send()
    }
  )

  server.post(
    "/v1/jobs/extend/:jobId",
    {
      schema: zRoutes.post["/v1/jobs/extend/:jobId"],
      onRequest: server.auth(zRoutes.post["/v1/jobs/extend/:jobId"]),
      config,
    },
    async (req, res) => {
      const { jobId } = req.params
      const job = await getJob(jobId.toString())

      if (!job) {
        throw Boom.badRequest("Job does not exists")
      }

      if (addExpirationPeriod(dayjs()).isSame(dayjs(job.job_expiration_date), "day")) {
        throw Boom.badRequest("Job is already extended up to a month")
      }

      if (job.job_status !== ACTIVE) {
        throw Boom.badRequest("Job cannot be extended as it is not active")
      }

      await extendOffre(jobId)

      return res.status(204).send()
    }
  )
  server.get(
    "/v1/jobs",
    {
      schema: zRoutes.get["/v1/jobs"],
      config,
    },
    async (req, res) => {
      const { referer } = req.headers
      const { romes, rncp, caller, latitude, longitude, radius, insee, sources, diploma, opco, opcoUrl } = req.query
      const result = await getJobsQuery({ romes, rncp, caller, referer, latitude, longitude, radius, insee, sources, diploma, opco, opcoUrl, isMinimalData: false })

      if ("error" in result) {
        return res.status(500).send(result)
      }
      return res.status(200).send(result)
    }
  )
  server.get(
    "/v1/jobs/min",
    {
      schema: zRoutes.get["/v1/jobs/min"],
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
    "/v1/jobs/company/:siret",
    {
      schema: zRoutes.get["/v1/jobs/company/:siret"],
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
    "/v1/jobs/matcha/:id",
    {
      schema: zRoutes.get["/v1/jobs/matcha/:id"],
      config,
    },
    async (req, res) => {
      const { id } = req.params
      const { caller } = req.query
      const result = await getLbaJobById({
        id,
        caller,
      })

      if ("error" in result) {
        switch (result.error) {
          case "wrong_parameters": {
            res.status(400)
            break
          }
          case "not_found": {
            res.status(404)
            break
          }
          case "expired_job": {
            res.status(419)
            break
          }
          default: {
            res.status(500)
            break
          }
        }
      }

      return res.send(result)
    }
  )

  server.post(
    "/v1/jobs/matcha/:id/stats/view-details",
    {
      schema: zRoutes.post["/v1/jobs/matcha/:id/stats/view-details"],
      config,
    },
    async (req, res) => {
      const { id } = req.params
      await addOffreDetailView(id)
      return res.send({})
    }
  )

  server.get(
    "/v1/jobs/job/:id",
    {
      schema: zRoutes.get["/v1/jobs/job/:id"],
      config,
    },
    async (req, res) => {
      const { id } = req.params
      const { caller } = req.query

      const result = await getFtJobFromId({
        id,
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
}
