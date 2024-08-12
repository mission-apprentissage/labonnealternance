import Boom from "boom"
import { ILbaItemFtJob, ILbaItemLbaJob, assertUnreachable, zRoutes } from "shared"
import { LBA_ITEM_TYPE } from "shared/constants/lbaitem"
import { IJobOpportunityRncp, IJobOpportunityRome } from "shared/routes/jobOpportunity.routes"

import { getDbCollection } from "@/common/utils/mongodbUtils"
import { getUserFromRequest } from "@/security/authenticationService"

import { getFileSignedURL } from "../../common/utils/awsUtils"
import { trackApiCall } from "../../common/utils/sendTrackingEvent"
import { sentryCaptureException } from "../../common/utils/sentryUtils"
import { getNearEtablissementsFromRomes } from "../../services/catalogue.service"
import { getRomesFromRncp } from "../../services/certification.service"
import { ACTIVE, ANNULEE, POURVUE } from "../../services/constant.service"
import dayjs from "../../services/dayjs.service"
import { addExpirationPeriod, cancelOffre, createJobDelegations, extendOffre, getFormulaires, getJob, getOffre, patchOffre, provideOffre } from "../../services/formulaire.service"
import { getFtJobFromIdV2, getFtJobsV2 } from "../../services/ftjob.service"
import {
  formatFranceTravailToJobPartner,
  formatOffreEmploiLbaToJobPartner,
  formatOffresEmploiPartenaire,
  formatRecruteurLbaToJobPartner,
  getJobsPartnersFromDB,
  getJobsQuery,
} from "../../services/jobOpportunity.service"
import { addOffreDetailView, getJobs, getLbaJobByIdV2 } from "../../services/lbajob.service"
import { getCompanyFromSiret, getRecruteursLbaFromDB } from "../../services/recruteurLba.service"
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

  // POST job in jobs_partners
  server.post("/jobs", {}, async () => {})
  // PATCH job in jobs_partners
  server.post("/jobs/:id", {}, async () => {})
  // PROVIDED job in jobs_partners
  server.post("/jobs/provided/:id", {}, async () => {})
  // CANCELED job in jobs_partners
  server.post("/jobs/canceled/:id", {}, async () => {})
  // EXTEND job in jobs_partners
  server.post("/jobs/extend/:id", {}, async () => {})

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

  server.get("/jobs/rome", { schema: zRoutes.get["/jobs/rome"], onRequest: server.auth(zRoutes.get["/jobs/rome"]) }, async (req, res) => {
    const payload: IJobOpportunityRome = req.query

    const [recruterLba, offreEmploiLba, offreEmploiPartenaire, franceTravail] = await Promise.all([
      getRecruteursLbaFromDB(payload),
      getJobs({
        romes: payload.romes,
        distance: payload.radius,
        niveau: payload.diploma,
        lat: payload.latitude,
        lon: payload.longitude,
        isMinimalData: false,
      }),
      getJobsPartnersFromDB(payload),
      getFtJobsV2({ jobLimit: 150, caller: "api-apprentissage", api: zRoutes.get["/jobs/rome"].path, ...payload, insee: payload.insee ?? undefined }),
    ])

    return res.send({
      jobs: [
        ...formatOffreEmploiLbaToJobPartner(offreEmploiLba),
        ...formatFranceTravailToJobPartner(franceTravail.resultats),
        ...formatOffresEmploiPartenaire(offreEmploiPartenaire),
      ],
      recruiters: formatRecruteurLbaToJobPartner(recruterLba),
    })
  })

  server.get("/jobs/rncp", { schema: zRoutes.get["/jobs/rncp"], onRequest: server.auth(zRoutes.get["/jobs/rncp"]) }, async (req, res) => {
    const payload: IJobOpportunityRncp = req.query
    const romes = await getRomesFromRncp(payload.rncp)
    if (!romes) {
      throw Boom.internal(`Aucun code ROME n'a été trouvé à partir du code RNCP ${payload.rncp}`)
    }

    const [recruterLba, offreEmploiLba, offreEmploiPartenaire, franceTravail] = await Promise.all([
      getRecruteursLbaFromDB({ ...payload, romes }),
      getJobs({
        romes,
        distance: payload.radius,
        niveau: payload.diploma,
        lat: payload.latitude,
        lon: payload.longitude,
        isMinimalData: false,
      }),
      getJobsPartnersFromDB({ ...payload, romes }),
      getFtJobsV2({ romes, jobLimit: 150, caller: "api-apprentissage", api: zRoutes.get["/jobs/rncp"].path, ...payload, insee: payload.insee ?? undefined }),
    ])

    return res.send({
      jobs: [
        ...formatOffreEmploiLbaToJobPartner(offreEmploiLba),
        ...formatFranceTravailToJobPartner(franceTravail.resultats),
        ...formatOffresEmploiPartenaire(offreEmploiPartenaire),
      ],
      recruiters: formatRecruteurLbaToJobPartner(recruterLba),
    })
  })
}
