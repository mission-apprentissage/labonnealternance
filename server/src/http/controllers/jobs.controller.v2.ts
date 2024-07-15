import Boom from "boom"
import { IJob, ILbaItemFtJob, ILbaItemLbaJob, JOB_STATUS, assertUnreachable, zRoutes } from "shared"
import { JOB_OPPORTUNITY_TYPE, LBA_ITEM_TYPE } from "shared/constants/lbaitem"
import { IJobOpportunityRomeRncp } from "shared/routes/jobOpportunity.routes"

import { getDbCollection } from "@/common/utils/mongodbUtils"
import { getUserFromRequest } from "@/security/authenticationService"
import { Appellation } from "@/services/rome.service.types"

import { getFileSignedURL } from "../../common/utils/awsUtils"
import { trackApiCall } from "../../common/utils/sendTrackingEvent"
import { sentryCaptureException } from "../../common/utils/sentryUtils"
import { getNearEtablissementsFromRomes } from "../../services/catalogue.service"
import { getRomesFromRncp } from "../../services/certification.service"
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
import { getFtJobFromIdV2 } from "../../services/ftjob.service"
import { formatRecruteurLbaToJobOpportunity, getJobsQuery } from "../../services/jobOpportunity.service"
import { getCompanyFromSiret, getRecruteursLbaFromDB } from "../../services/lbacompany.service"
import { addOffreDetailView, getLbaJobByIdV2 } from "../../services/lbajob.service"
import { getFicheMetierFromDB } from "../../services/rome.service"
import { Server } from "../server"

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
    "/jobs/establishment",
    {
      schema: zRoutes.post["/jobs/establishment"],
      onRequest: server.auth(zRoutes.post["/jobs/establishment"]),
      config,
    },
    async (req, res) => {
      const { body } = req

      const { first_name, last_name, phone, email, origin, idcc, establishment_siret } = body
      const user = getUserFromRequest(req, zRoutes.post["/jobs/establishment"]).value

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
    "/jobs/:establishmentId",
    {
      schema: zRoutes.post["/jobs/:establishmentId"],
      onRequest: server.auth(zRoutes.post["/jobs/:establishmentId"]),
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

      const romeDetails = await getFicheMetierFromDB({
        query: {
          "appellations.code_ogr": body.appellation_code,
        },
      })

      if (!romeDetails) {
        return res.send({ error: true, message: "ROME Code details could not be retrieved" })
      }

      const appellation = romeDetails?.appellations ? (romeDetails.appellations.find(({ code_ogr }) => code_ogr === body.appellation_code) as Appellation) : null

      const job: Partial<IJob> = {
        rome_label: romeDetails.rome.intitule,
        rome_appellation_label: appellation && appellation.libelle,
        rome_code: [romeDetails.rome.code_rome],
        job_level_label: body.job_level_label,
        job_start_date: new Date(body.job_start_date),
        job_description: body.job_description,
        job_employer_description: body.job_employer_description,
        job_creation_date: dayjs().toDate(),
        job_expiration_date: addExpirationPeriod(dayjs()).toDate(),
        job_status: JOB_STATUS.ACTIVE,
        job_type: body.job_type,
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

  server.patch(
    "/jobs/:jobId",
    {
      schema: zRoutes.patch["/jobs/:jobId"],
      onRequest: server.auth(zRoutes.patch["/jobs/:jobId"]),
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
    "/jobs/delegations/:jobId",
    {
      schema: zRoutes.get["/jobs/delegations/:jobId"],
      onRequest: server.auth(zRoutes.get["/jobs/delegations/:jobId"]),
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
    "/jobs/delegations/:jobId",
    {
      schema: zRoutes.post["/jobs/delegations/:jobId"],
      onRequest: server.auth(zRoutes.post["/jobs/delegations/:jobId"]),
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
    "/jobs/provided/:jobId",
    {
      schema: zRoutes.post["/jobs/provided/:jobId"],
      onRequest: server.auth(zRoutes.post["/jobs/provided/:jobId"]),
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
    "/jobs/canceled/:jobId",
    {
      schema: zRoutes.post["/jobs/canceled/:jobId"],
      onRequest: server.auth(zRoutes.post["/jobs/canceled/:jobId"]),
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
    "/jobs/extend/:jobId",
    {
      schema: zRoutes.post["/jobs/extend/:jobId"],
      onRequest: server.auth(zRoutes.post["/jobs/extend/:jobId"]),
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
    "/jobs",
    {
      schema: zRoutes.get["/jobs"],
      onRequest: server.auth(zRoutes.get["/jobs"]),
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
          throw Boom.internal("Une erreur est survenue lors de la génération du lien de téléchargement.")
        }
      } else {
        try {
          const url = await getFileSignedURL({ key: `${LBA_ITEM_TYPE.RECRUTEURS_LBA}.json` })
          trackApiCall({ caller: user._id.toString(), api_path: `${zRoutes.get["/jobs/export"].path}/${source}`, response: "OK" })
          return res.send(url)
        } catch (error) {
          sentryCaptureException(error)
          throw Boom.internal("Une erreur est survenue lors de la génération du lien de téléchargement.")
        }
      }
    }
  )

  server.get(
    `/jobs/${JOB_OPPORTUNITY_TYPE.RECRUTEURS_LBA}`,
    { schema: zRoutes.get["/jobs/recruteurs_lba"], onRequest: server.auth(zRoutes.get["/jobs/recruteurs_lba"]) },
    async (req, res) => {
      const payload: IJobOpportunityRomeRncp = { ...req.query }
      if ("rncp" in payload) {
        payload.romes = await getRomesFromRncp(payload.rncp)
        if (!payload.romes) {
          throw Boom.internal(`Aucun code ROME n'a été trouvé à partir du code RNCP ${payload.rncp}`)
        }
      }
      const result = await getRecruteursLbaFromDB({ ...payload, romes: payload.romes as string[] })
      return res.send(formatRecruteurLbaToJobOpportunity(result))
    }
  )
  server.get(
    `/jobs/${JOB_OPPORTUNITY_TYPE.OFFRES_EMPLOI_LBA}`,
    { schema: zRoutes.get["/jobs/offres_emploi_lba"], onRequest: server.auth(zRoutes.get["/jobs/offres_emploi_lba"]) },
    async () => {}
  )
  server.get(
    `/jobs/${JOB_OPPORTUNITY_TYPE.OFFRES_EMPLOI_PARTENAIRES}`,
    { schema: zRoutes.get["/jobs/offres_emploi_partenaires"], onRequest: server.auth(zRoutes.get["/jobs/offres_emploi_partenaires"]) },
    async () => {}
  )
  server.get(
    `/jobs/${JOB_OPPORTUNITY_TYPE.OFFRES_EMPLOI_FRANCE_TRAVAIL}`,
    { schema: zRoutes.get["/jobs/offres_emploi_france_travail"], onRequest: server.auth(zRoutes.get["/jobs/offres_emploi_france_travail"]) },
    async () => {}
  )
}
