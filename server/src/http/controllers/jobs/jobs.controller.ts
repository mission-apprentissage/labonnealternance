import Boom from "boom"
import { FastifyRequest } from "fastify"
import { ICredential, zRoutes, IJob, IUserRecruteur } from "shared"
import { IRouteSchema } from "shared/routes/common.routes"

import { IUser } from "@/common/model/schema/user/user.types"

import { Recruiter } from "../../../common/model/index"
import { delay } from "../../../common/utils/asyncUtils"
import { getNearEtablissementsFromRomes } from "../../../services/catalogue.service"
import { ACTIVE, ANNULEE, JOB_STATUS, POURVUE } from "../../../services/constant.service"
import dayjs from "../../../services/dayjs.service"
import { entrepriseOnboardingWorkflow } from "../../../services/etablissement.service"
import {
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
} from "../../../services/formulaire.service"
import { getJobsQuery } from "../../../services/jobOpportunity.service"
import { getCompanyFromSiret } from "../../../services/lbacompany.service"
import { addOffreDetailView, addOffreSearchView, getLbaJobById } from "../../../services/lbajob.service"
import { getPeJobFromId } from "../../../services/pejob.service"
import { getAppellationDetailsFromAPI, getRomeDetailsFromAPI } from "../../../services/rome.service"
import { Server } from "../../server"

import { createDelegationSchema, createEstablishmentSchema, createJobSchema, getEstablishmentEntitySchema, updateJobSchema } from "./jobs.validators"

const config = {
  rateLimit: {
    max: 5,
    timeWindow: "1s",
  },
}

type AuthenticatedUser<AuthScheme extends IRouteSchema["securityScheme"]["auth"]> = AuthScheme extends "jwt-bearer" | "basic" | "jwt-password" | "jwt-rdv-admin"
  ? IUser
  : AuthScheme extends "jwt-bearer"
  ? IUserRecruteur
  : AuthScheme extends "api-key"
  ? ICredential
  : null

const getUser = <S extends IRouteSchema>(req: FastifyRequest, _schema: S): AuthenticatedUser<S["securityScheme"]["auth"]> => {
  return req.user as AuthenticatedUser<S["securityScheme"]["auth"]>
}

export default (server: Server) => {
  // @Tags("Jobs")
  server.get(
    "/api/v1/jobs/establishment",
    {
      schema: zRoutes.get["/api/v1/jobs/establishment"],
      config,
      onRequest: server.auth(zRoutes.get["/api/v1/jobs/establishment"].securityScheme),
      // TODO: AttachValidation Error ?
    },
    async (req, res) => {
      const { establishment_siret, email } = req.query
      await getEstablishmentEntitySchema.validateAsync({ establishment_siret, email }, { abortEarly: false })

      const establishment = await Recruiter.findOne({ establishment_siret, email })

      if (!establishment) {
        res.status(400)
        return res.send({ error: true, message: "Establishment not found" })
      }

      res.status(200)
      return res.send(establishment.establishment_id)
    }
  )

  // @OperationId("getJobs")
  server.get(
    "/api/v1/jobs/bulk",
    {
      schema: zRoutes.get["/api/v1/jobs/bulk"],
      config,
      onRequest: server.auth(zRoutes.get["/api/v1/jobs/bulk"].securityScheme),
      // TODO: AttachValidation Error ?
    },
    async (req, res) => {
      const { query, select, page, limit } = req.query

      const user = getUser(req, zRoutes.get["/api/v1/jobs/bulk"])

      const qs = query ? JSON.parse(query) : {}
      const slt = select ? JSON.parse(select) : {}

      const jobs = await getFormulaires({ ...qs, opco: user.organisation }, slt, { page, limit })

      res.status(200)
      return res.send(jobs)
    }
  )

  // @OperationId("createEstablishment")
  server.post(
    "/api/v1/jobs/establishment",
    {
      schema: zRoutes.post["/api/v1/jobs/establishment"],
      config,
      onRequest: server.auth(zRoutes.post["/api/v1/jobs/establishment"].securityScheme),
      attachValidation: true,
      // TODO: AttachValidation Error ?
    },
    async (req, res) => {
      const { body } = req
      // Validate establishment parameters
      await createEstablishmentSchema.validateAsync(body, { abortEarly: false })

      const { first_name, last_name, phone, email, origin, idcc, establishment_siret } = body
      const user = getUser(req, zRoutes.post["/api/v1/jobs/establishment"])

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

  // @OperationId("createJob")
  server.post(
    "/api/v1/jobs/:establishmentId",
    {
      schema: zRoutes.post["/api/v1/jobs/:establishmentId"],
      config,
      onRequest: server.auth(zRoutes.post["/api/v1/jobs/:establishmentId"].securityScheme),
      attachValidation: true,
    },
    async (req, res) => {
      const { establishmentId } = req.params
      const { body } = req
      // Check if entity exists
      const establishmentExists = await getFormulaire({ establishment_id: establishmentId })

      if (!establishmentExists) {
        return res.status(400).send({ error: true, message: "Establishment does not exist" })
      }

      // Validate job parameters
      await createJobSchema.validateAsync(body, { abortEarly: false })

      // Get Appellation detail from Pole Emploi API
      const appelationDetails = await getAppellationDetailsFromAPI(body.appellation_code)

      if (!appelationDetails) {
        return res.status(400).send({ error: true, message: "ROME Appelation details could not be retrieved" })
      }

      await delay(1000)

      // Get Rome details from Pole Emploi API
      const romeDetails = await getRomeDetailsFromAPI(appelationDetails.metier.code)

      if (!romeDetails) {
        return res.send({ error: true, message: "ROME Code details could not be retrieved" })
      }
      // Initialize job object with collected data

      const job: Partial<IJob> = {
        rome_label: romeDetails.libelle,
        rome_appellation_label: appelationDetails.libelle,
        rome_code: [appelationDetails.metier.code],
        job_level_label: body.job_level_label,
        job_start_date: body.job_start_date,
        job_description: body.job_description,
        job_creation_date: dayjs().toDate(),
        job_expiration_date: dayjs().add(1, "month").toDate(),
        job_status: JOB_STATUS.ACTIVE,
        job_type: body.job_type,
        rome_detail: romeDetails,
        is_disabled_elligible: body.is_disabled_elligible,
        job_count: body.job_count,
        job_duration: body.job_duration,
        job_rythm: body.job_rythm,
        custom_address: body.custom_address,
        custom_geo_coordinates: body.custom_geo_coordinates,
      }

      const updatedRecruiter = await createOffre(establishmentId, job)

      return res.status(201).send(updatedRecruiter)
    }
  )

  // @OperationId("updateJob")
  server.patch(
    "/api/v1/jobs/:jobId",
    {
      schema: zRoutes.patch["/api/v1/jobs/:jobId"],
      config,
      onRequest: server.auth(zRoutes.patch["/api/v1/jobs/:jobId"].securityScheme),
      attachValidation: true,
    },
    async (req, res) => {
      const { jobId } = req.params
      const jobExists = await getOffre(jobId.toString())

      if (!jobExists) {
        return res.status(400).send({ error: true, message: "Job does not exists" })
      }

      await updateJobSchema.validateAsync(req.body, { abortEarly: false })

      const updatedRecruiter = await patchOffre(jobId, req.body)

      return res.status(200).send(updatedRecruiter)
    }
  )

  // @OperationId("getDelegation")
  server.get(
    "/api/v1/jobs/delegations/:jobId",
    {
      schema: zRoutes.get["/api/v1/jobs/delegations/:jobId"],
      config,
      onRequest: server.auth(zRoutes.get["/api/v1/jobs/delegations/:jobId"].securityScheme),
      attachValidation: true,
      // TODO: AttachValidation Error ?
    },
    async (req, res) => {
      const { jobId } = req.params
      const jobExists = await getOffre(jobId.toString())

      if (!jobExists) {
        return res.status(400).send({ error: true, message: "Job does not exists" })
      }

      if (!jobExists.geo_coordinates) {
        throw Boom.internal("geo_coordinates is empty", { jobId: jobExists._id })
      }

      const [latitude = "", longitude = ""] = jobExists.geo_coordinates.split(",")
      const { rome_code } = jobExists.jobs.filter(({ _id }) => _id == jobId)[0]

      // Get related establishment from a job offer
      const etablissements = await getNearEtablissementsFromRomes({
        rome: rome_code,
        origin: {
          latitude: parseFloat(latitude),
          longitude: parseFloat(longitude),
        },
      })

      const top10 = etablissements.slice(0, 10)

      return res.status(200).send(top10)
    }
  )

  // @OperationId("createDelegation")
  server.post(
    "/api/v1/jobs/delegations/:jobId",
    {
      schema: zRoutes.post["/api/v1/jobs/delegations/:jobId"],
      config,
      onRequest: server.auth(zRoutes.post["/api/v1/jobs/delegations/:jobId"].securityScheme),
      attachValidation: true,
      // TODO: AttachValidation Error ?
    },
    async (req, res) => {
      const { jobId } = req.params
      const jobExists = await getOffre(jobId.toString())

      if (!jobExists) {
        return res.status(400).send({ error: true, message: "Job does not exists" })
      }

      await createDelegationSchema.validateAsync(req.body)

      const updatedRecruiter = await createJobDelegations({ jobId: jobId.toString(), etablissementCatalogueIds: req.body.establishmentIds })

      res.status(200)
      return res.send(updatedRecruiter)
    }
  )

  // @OperationId("setJobAsProvided")
  server.post(
    "/api/v1/jobs/provided/:jobId",
    {
      schema: zRoutes.post["/api/v1/jobs/provided/:jobId"],
      config,
      onRequest: server.auth(zRoutes.post["/api/v1/jobs/provided/:jobId"].securityScheme),
      // TODO: AttachValidation Error ?
    },
    async (req, res) => {
      const { jobId } = req.params
      const job = await getJob(jobId.toString())

      if (!job) {
        return res.status(400).send({ error: true, message: "Job does not exists" })
      }

      if (job.job_status === POURVUE) {
        return res.status(400).send({ error: true, message: "Job is already provided" })
      }

      await provideOffre(jobId)

      res.status(200)
      return res.send()
    }
  )

  // @OperationId("setJobAsCanceled")
  server.post(
    "/api/v1/jobs/canceled/:jobId",
    {
      schema: zRoutes.post["/api/v1/jobs/canceled/:jobId"],
      config,
      onRequest: server.auth(zRoutes.post["/api/v1/jobs/canceled/:jobId"].securityScheme),
      // TODO: AttachValidation Error ?
    },
    async (req, res) => {
      const { jobId } = req.params
      const job = await getJob(jobId.toString())

      if (!job) {
        res.status(400)
        return res.send({ error: true, message: "Job does not exists" })
      }

      if (job.job_status === ANNULEE) {
        res.status(400)
        return res.send({ error: true, message: "Job is already canceled" })
      }

      await cancelOffre(jobId)

      res.status(200)
      return res.send()
    }
  )

  // @OperationId("extendJobExpiration")
  server.post(
    "/api/v1/jobs/extend/:jobId",
    {
      schema: zRoutes.post["/api/v1/jobs/extend/:jobId"],
      config,
      onRequest: server.auth(zRoutes.post["/api/v1/jobs/extend/:jobId"].securityScheme),
      // TODO: AttachValidation Error ?
    },
    async (req, res) => {
      const { jobId } = req.params
      const job = await getJob(jobId.toString())

      if (!job) {
        res.status(400)
        return res.send({ error: true, message: "Job does not exists" })
      }

      if (dayjs().add(1, "month").isSame(dayjs(job.job_expiration_date), "day")) {
        res.status(400)
        return res.send({ error: true, message: "Job is already extended up to a month" })
      }

      if (job.job_status !== ACTIVE) {
        res.status(400)
        return res.send({ error: true, message: "Job cannot be extended as it is not enabled" })
      }

      await extendOffre(jobId)

      res.status(200)
      return res.send()
    }
  )
  // @OperationId("getJobOpportunities")
  server.get(
    "/api/v1/jobs",
    {
      schema: zRoutes.get["/api/v1/jobs"],
      config,
      // TODO: AttachValidation Error ?
    },
    async (req, res) => {
      const { referer } = req.headers
      const { romes, rncp, caller, latitude, longitude, radius, insee, sources, diploma, opco, opcoUrl } = req.query
      const result = await getJobsQuery({ romes, rncp, caller, referer, latitude, longitude, radius, insee, sources, diploma, opco, opcoUrl })

      if ("error" in result) {
        return res.status(500).send(result)
      }
      if ("matchas" in result) {
        const { matchas } = result
        if (matchas && "results" in matchas) {
          matchas.results.map((matchaOffre) => matchaOffre?.job?.id && addOffreSearchView(matchaOffre.job.id))
        }
      }
      return res.status(200).send(result)
    }
  )

  // @OperationId("getCompany")
  server.get(
    "/api/v1/jobs/company/:siret",
    {
      schema: zRoutes.get["/api/v1/jobs/company/:siret"],
      config,
      // TODO: AttachValidation Error ?
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
          res.status(result.status || 500)
        }
      }

      return res.send(result)
    }
  )

  // @OperationId("getLbaJob")
  server.get(
    "/api/v1/jobs/matcha/:id",
    {
      schema: zRoutes.get["/api/v1/jobs/matcha/:id"],
      config,
      // TODO: AttachValidation Error ?
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
            res.status(result.status || 500)
            break
          }
        }
      }

      return res.send(result)
    }
  )

  // @OperationId("statsViewLbaJob")
  server.post(
    "/api/v1/jobs/matcha/:id/stats/view-details",
    {
      schema: zRoutes.post["/api/v1/jobs/matcha/:id/stats/view-details"],
      config,
      // TODO: AttachValidation Error ?
    },
    async (req, res) => {
      const { id } = req.params
      await addOffreDetailView(id)
      return res.send()
    }
  )

  // @OperationId("getPeJob")
  server.get(
    "/api/v1/jobs/job/:id",
    {
      schema: zRoutes.get["/api/v1/jobs/job/:id"],
      config,
      // TODO: AttachValidation Error ?
    },
    async (req, res) => {
      const { id } = req.params
      const { caller } = req.query
      const result = await getPeJobFromId({
        id,
        caller,
      })

      if ("error" in result) {
        if (result.error === "wrong_parameters") {
          res.status(400)
        } else if (result.error === "not_found") {
          res.status(404)
        } else {
          res.status(result.status || 500)
        }
      }

      return res.send(result)
    }
  )
}
