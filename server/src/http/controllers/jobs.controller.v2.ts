import Boom from "boom"
import { ObjectId } from "mongodb"
import { IGeoPoint, ILbaItemFtJob, ILbaItemLbaJob, JOB_STATUS, assertUnreachable, zRoutes } from "shared"
import { BusinessErrorCodes } from "shared/constants/errorCodes"
import { LBA_ITEM_TYPE } from "shared/constants/lbaitem"
import { IJobsPartners, IJobsPartnersPatchApiBody, JOBPARTNERS_LABEL } from "shared/models/jobsPartners.model"
import { IJobOpportunityRncp, IJobOpportunityRome } from "shared/routes/jobOpportunity.routes"

import { getDbCollection } from "@/common/utils/mongodbUtils"
import { getUserFromRequest } from "@/security/authenticationService"

import { getFileSignedURL } from "../../common/utils/awsUtils"
import { trackApiCall } from "../../common/utils/sendTrackingEvent"
import { sentryCaptureException } from "../../common/utils/sentryUtils"
import { getRomeoInfos } from "../../services/cache.service"
import { getRomesFromRncp } from "../../services/certification.service"
import { ACTIVE, ANNULEE, POURVUE } from "../../services/constant.service"
import dayjs from "../../services/dayjs.service"
import { getEntrepriseDataFromSiret, getGeoCoordinates, getOpcoData } from "../../services/etablissement.service"
import { addExpirationPeriod, getFormulaires } from "../../services/formulaire.service"
import { getFtJobFromIdV2, getFtJobsV2 } from "../../services/ftjob.service"
import {
  formatFranceTravailToJobPartner,
  formatOffreEmploiLbaToJobPartner,
  formatOffresEmploiPartenaire,
  formatRecruteurLbaToJobPartner,
  getJobsPartnersFromDB,
  getJobsQuery,
  mergePatchWithDb,
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

  server.post(
    "/jobs",
    {
      schema: zRoutes.post["/jobs"],
      onRequest: server.auth(zRoutes.post["/jobs"]),
      config,
    },
    async (req, res) => {
      const { workplace_siret, workplace_address, offer_title, offer_rome_code, ...rest } = req.body
      let geopoint: IGeoPoint | null = null
      let romeCode = offer_rome_code ?? null

      const siretInformation = await getEntrepriseDataFromSiret({ siret: workplace_siret, type: "ENTREPRISE" })

      if ("error" in siretInformation) {
        return res.status(400).send(siretInformation)
      }
      if (workplace_address) {
        const { latitude, longitude } = await getGeoCoordinates(workplace_address)
        if (latitude && longitude) {
          geopoint = { type: "Point", coordinates: [longitude, latitude] }
        }
      } else {
        geopoint = siretInformation.geopoint
      }
      if (!geopoint) {
        return res.status(400).send({
          error: true,
          errorCode: BusinessErrorCodes.GEOLOCATION_NOT_FOUND,
          message: "",
        })
      }
      if (!romeCode) {
        const romeoResponse = await getRomeoInfos({ intitule: offer_title, contexte: siretInformation.naf_label ?? undefined })
        if (!romeoResponse) {
          return res.status(400).send({
            error: true,
            errorCode: BusinessErrorCodes.ROMEO_NOT_FOUND,
            message: "",
          })
        }
        romeCode = [romeoResponse]
      }
      const opcoData = await getOpcoData(workplace_siret)
      const now = new Date()
      const job: IJobsPartners = {
        ...rest,
        _id: new ObjectId(),
        created_at: now,
        partner_label: JOBPARTNERS_LABEL.OFFRES_EMPLOI_LBA,
        partner_id: rest.partner_id ?? null,
        offer_title,
        offer_rome_code: romeCode,
        offer_status: JOB_STATUS.ACTIVE,
        offer_creation_date: rest.offer_creation_date ?? now,
        offer_expiration_date: rest.offer_expiration_date ?? addExpirationPeriod(now).toDate(),
        offer_desired_skills: rest.offer_desired_skills ?? null,
        offer_acquired_skills: rest.offer_acquired_skills ?? null,
        offer_access_condition: rest.offer_access_condition ?? null,
        offer_count: rest.offer_count ?? 1,
        offer_multicast: rest.offer_multicast ?? true,
        offer_origin: rest.offer_origin ?? null,
        workplace_siret,
        workplace_geopoint: geopoint,
        workplace_address: workplace_address ?? siretInformation.address!,
        workplace_raison_sociale: siretInformation.establishment_raison_sociale ?? null,
        workplace_enseigne: siretInformation.establishment_enseigne ?? null,
        workplace_website: rest.workplace_website ?? null,
        workplace_description: rest.workplace_description ?? null,
        workplace_name: null,
        workplace_naf_label: siretInformation.naf_label ?? null,
        workplace_naf_code: siretInformation.naf_code ?? null,
        workplace_opco: opcoData?.opco ?? null,
        workplace_idcc: opcoData?.idcc ?? null,
        workplace_size: siretInformation.establishment_size ?? null,
        contract_remote: rest.contract_remote ?? null,
        apply_url: rest.apply_url ?? null,
        apply_email: rest.apply_email ?? null,
        apply_phone: rest.apply_phone ?? null,
      }

      await getDbCollection("jobs_partners").insertOne(job)

      return res.status(201).send({ id: job._id })
    }
  )

  server.patch(
    "/jobs/:id",
    {
      schema: zRoutes.patch["/jobs/:id"],
      onRequest: server.auth(zRoutes.patch["/jobs/:id"]),
      config,
    },
    async (req, res) => {
      const { id } = req.params
      const patchBody = req.body
      const job = await getDbCollection("jobs_partners").findOne({ _id: id })
      if (!job) {
        throw Boom.badRequest("Job does not exist")
      }
      const update: IJobsPartnersPatchApiBody = mergePatchWithDb(patchBody, job)
      const updatedJob = await getDbCollection("jobs_partners").findOneAndUpdate({ _id: id }, { $set: update }, { returnDocument: "after" })
      if (!updatedJob) {
        throw Boom.internal(`Job partner updated did not return ${id}`)
      }
      return res.status(200).send(updatedJob)
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
        throw Boom.badRequest("Job does not exist")
      }
      if (job.offer_status === POURVUE) {
        throw Boom.badRequest("Job is already provided")
      }
      await getDbCollection("jobs_partners").findOneAndUpdate({ _id: id }, { $set: { offer_status: JOB_STATUS.POURVUE } })
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
        throw Boom.badRequest("Job does not exists")
      }
      if (job.offer_status === ANNULEE) {
        throw Boom.badRequest("Job is already canceled")
      }
      await getDbCollection("jobs_partners").findOneAndUpdate({ _id: id }, { $set: { offer_status: JOB_STATUS.ANNULEE } })
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
        throw Boom.badRequest("Job does not exists")
      }
      if (addExpirationPeriod(dayjs()).isSame(dayjs(job.offer_expiration_date), "day")) {
        throw Boom.badRequest("Job is already extended up to two month")
      }
      if (job.offer_status !== ACTIVE) {
        throw Boom.badRequest("Job cannot be extended as it is not active")
      }
      await getDbCollection("jobs_partners").findOneAndUpdate({ _id: id }, { $set: { offer_expiration_date: addExpirationPeriod(dayjs()).toDate() } })
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
