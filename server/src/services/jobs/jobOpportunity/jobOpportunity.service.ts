import Boom, { badRequest, internal, notFound } from "@hapi/boom"
import { IApiAlternanceTokenData } from "api-alternance-sdk"
import { DateTime } from "luxon"
import { Document, Filter, ObjectId } from "mongodb"
import { IGeoPoint, IJob, IJobCollectionName, ILbaItemPartnerJob, JOB_STATUS_ENGLISH, JobCollectionName, assertUnreachable, parseEnum, translateJobStatus } from "shared"
import { LBA_ITEM_TYPE, allLbaItemType } from "shared/constants/lbaitem"
import { NIVEAUX_POUR_LBA, NIVEAUX_POUR_OFFRES_PE, NIVEAU_DIPLOME_LABEL, TRAINING_CONTRACT_TYPE } from "shared/constants/recruteur"
import {
  IJobsPartnersOfferApi,
  IJobsPartnersOfferPrivate,
  IJobsPartnersOfferPrivateWithDistance,
  INiveauDiplomeEuropeen,
  JOBPARTNERS_LABEL,
} from "shared/models/jobsPartners.model"
import { IComputedJobsPartners } from "shared/models/jobsPartnersComputed.model"
import {
  jobsRouteApiv3Converters,
  zJobOfferApiReadV3,
  zJobRecruiterApiReadV3,
  type IJobOfferApiReadV3,
  type IJobOfferApiWriteV3,
  type IJobRecruiterApiReadV3,
  type IJobSearchApiV3Query,
  type IJobSearchApiV3QueryResolved,
  type IJobSearchApiV3Response,
} from "shared/routes/v3/jobs/jobs.routes.v3.model"

import { normalizeDepartementToRegex } from "@/common/utils/geolib"
import { sentryCaptureException } from "@/common/utils/sentryUtils"
import { getPartnerJobs } from "@/services/partnerJob.service"

import { logger } from "../../../common/logger"
import { IApiError } from "../../../common/utils/errorManager"
import { getDbCollection } from "../../../common/utils/mongodbUtils"
import { trackApiCall } from "../../../common/utils/sendTrackingEvent"
import config from "../../../config"
import { getRomesFromRncp } from "../../external/api-alternance/certification.service"
import { getFtJobsV2, getSomeFtJobs } from "../../ftjob.service"
import { FTJob } from "../../ftjob.service.types"
import { TJobSearchQuery, TLbaItemResult } from "../../jobOpportunity.service.types"
import { ILbaItemFtJob, ILbaItemLbaCompany, ILbaItemLbaJob } from "../../lbaitem.shared.service.types"
import { IJobResult, getLbaJobByIdV2AsJobResult, getLbaJobs, getLbaJobsV2, incrementLbaJobsViewCount } from "../../lbajob.service"
import { jobsQueryValidator } from "../../queryValidator.service"
import { getRecruteursLbaFromDB, getSomeCompanies } from "../../recruteurLba.service"
import { getNearestCommuneByGeoPoint } from "../../referentiel/commune/commune.referentiel.service"

import { JobOpportunityRequestContext } from "./JobOpportunityRequestContext"

/**
 * @description Retourn la compilation d'opportunités d'emploi au format unifié
 * chaque type d'opportunités d'emploi peut être émis en succès même si d'autres groupes sont en erreur
 */
export const getJobsFromApi = async ({
  romes,
  referer,
  caller,
  latitude,
  longitude,
  radius,
  insee,
  sources,
  diploma,
  opco,
  opcoUrl,
  api = "jobV1/jobs",
  isMinimalData,
}: {
  romes?: string
  referer?: string
  caller?: string | null
  latitude?: number
  longitude?: number
  radius?: number
  insee?: string
  sources?: string
  // sources?: LBA_ITEM_TYPE
  diploma?: string
  opco?: string
  opcoUrl?: string
  api?: string
  isMinimalData: boolean
}): Promise<
  | IApiError
  | {
      peJobs: TLbaItemResult<ILbaItemFtJob> | null
      matchas: TLbaItemResult<ILbaItemLbaJob> | null
      lbaCompanies: TLbaItemResult<ILbaItemLbaCompany> | null
      lbbCompanies: null
      partnerJobs: TLbaItemResult<ILbaItemPartnerJob> | null
    }
> => {
  try {
    const convertedSource = sources
      ?.split(",")
      .map((source) => {
        switch (source) {
          case "partnerJob": // once API consumer shifted to v3, remove case "offres" as it fetches from FT API
          case "matcha":
            return LBA_ITEM_TYPE.OFFRES_EMPLOI_LBA
          case "lba":
            return LBA_ITEM_TYPE.RECRUTEURS_LBA
          case "offres": // compatibility V1 to retreive FT jobs
            return LBA_ITEM_TYPE.OFFRES_EMPLOI_PARTENAIRES

          default:
            return
        }
      })
      .join(",")

    const jobSources = !convertedSource ? allLbaItemType : convertedSource.split(",")
    const finalRadius = radius ?? 0

    const [peJobs, lbaCompanies, matchas, partnerJobs] = await Promise.all([
      jobSources.includes(LBA_ITEM_TYPE.OFFRES_EMPLOI_PARTENAIRES)
        ? getSomeFtJobs({
            romes: romes?.split(","),
            insee: insee,
            radius: finalRadius,
            latitude,
            longitude,
            caller,
            diploma,
            api,
            opco,
            opcoUrl,
            isMinimalData,
          })
        : null,
      jobSources.includes(LBA_ITEM_TYPE.RECRUTEURS_LBA)
        ? getSomeCompanies({
            romes,
            latitude,
            longitude,
            radius: finalRadius,
            referer,
            caller,
            api,
            opco,
            opcoUrl,
            isMinimalData,
          })
        : null,
      jobSources.includes(LBA_ITEM_TYPE.OFFRES_EMPLOI_LBA)
        ? getLbaJobs({
            romes,
            latitude,
            longitude,
            radius: finalRadius,
            api,
            caller,
            diploma,
            opco,
            opcoUrl,
            isMinimalData,
          })
        : null,
      jobSources.includes(LBA_ITEM_TYPE.OFFRES_EMPLOI_LBA)
        ? getPartnerJobs({
            romes,
            latitude,
            longitude,
            radius: finalRadius,
            api,
            caller,
            diploma,
            opco,
            opcoUrl,
            isMinimalData,
          })
        : null,
    ])

    return { peJobs, matchas, lbaCompanies, lbbCompanies: null, partnerJobs }
  } catch (err) {
    if (caller) {
      trackApiCall({ caller, api_path: api, response: "Error" })
    }
    throw err
  }
}

/**
 * Retourne la compilation d'offres partenaires, d'offres LBA et de sociétés issues de l'algo
 * ou une liste d'erreurs si les paramètres de la requête sont invalides
 */
export const getJobsQuery = async (
  query: TJobSearchQuery
): Promise<
  | IApiError
  | {
      peJobs: TLbaItemResult<ILbaItemFtJob> | null
      matchas: TLbaItemResult<ILbaItemLbaJob> | null
      lbaCompanies: TLbaItemResult<ILbaItemLbaCompany> | null
      partnerJobs: TLbaItemResult<ILbaItemPartnerJob> | null
      lbbCompanies: null
    }
> => {
  const parameterControl = await jobsQueryValidator(query)

  if ("error" in parameterControl) {
    return parameterControl
  }

  const result = await getJobsFromApi({ romes: parameterControl.romes, ...query })

  if ("error" in result) {
    return result
  }

  let job_count = 0

  if ("lbaCompanies" in result && result.lbaCompanies && "results" in result.lbaCompanies) {
    job_count += result.lbaCompanies.results.length
  }

  if ("peJobs" in result && result.peJobs && "results" in result.peJobs) {
    job_count += result.peJobs.results.length
  }

  if ("matchas" in result && result.matchas && "results" in result.matchas) {
    job_count += result.matchas.results.length
    await incrementLbaJobsViewCount(result.matchas.results.flatMap((job) => (job?.id ? [job.id] : [])))
  }

  if ("partnerJobs" in result && result.partnerJobs && "results" in result.partnerJobs) {
    job_count += result.partnerJobs.results.length
  }

  if (query.caller) {
    trackApiCall({ caller: query.caller, job_count, result_count: job_count, api_path: "jobV1/jobs", response: "OK" })
  }

  return result
}

export const getJobsPartnersFromDB = async ({
  romes,
  geo,
  target_diploma_level,
  partners_to_exclude,
  departements,
}: IJobSearchApiV3QueryResolved): Promise<IJobsPartnersOfferPrivate[]> => {
  const query: Filter<IJobsPartnersOfferPrivate> = {
    offer_multicast: true,
    offer_status: JOB_STATUS_ENGLISH.ACTIVE,
    offer_expiration: { $gt: new Date() },
  }

  if (partners_to_exclude?.length) {
    query.partner_label = { $not: { $in: partners_to_exclude } }
  }

  if (romes) {
    query.offer_rome_codes = { $in: romes }
  }

  if (target_diploma_level) {
    query["offer_target_diploma.european"] = { $in: [target_diploma_level, null] }
  }

  if (departements?.length) {
    const departmentsRegex = departements.flatMap((code) => normalizeDepartementToRegex(code))
    query.workplace_address_zipcode = { $in: departmentsRegex }
  }

  const filterStages: Document[] =
    geo === null
      ? [{ $match: query }, { $sort: { offer_creation: -1 } }]
      : [
          {
            $geoNear: {
              near: { type: "Point", coordinates: [geo.longitude, geo.latitude] },
              distanceField: "distance",
              key: "workplace_geopoint",
              maxDistance: geo.radius * 1000,
              query,
            },
          },
          { $sort: { distance: 1, offer_creation: -1 } },
        ]

  return await getDbCollection("jobs_partners")
    .aggregate<IJobsPartnersOfferPrivate>([
      ...filterStages,
      {
        $project: {
          workplace_address_city: 0,
          workplace_address_zipcode: 0,
          workplace_address_street_label: 0,
        },
      },
      {
        $limit: 150,
      },
    ])
    .toArray()
}

export const getJobsPartnersFromDBForUI = async ({ romes, geo, target_diploma_level }: IJobSearchApiV3QueryResolved): Promise<IJobsPartnersOfferPrivateWithDistance[]> => {
  const query: Filter<IJobsPartnersOfferPrivate> = {
    offer_status: JOB_STATUS_ENGLISH.ACTIVE,
    offer_expiration: { $gt: new Date() },
    partner_label: { $ne: JOBPARTNERS_LABEL.RECRUTEURS_LBA }, // until offers are not merged together from the endpoint, lba companies are fetched into another service.
  }

  if (romes) {
    query.offer_rome_codes = { $in: romes }
  }

  if (target_diploma_level) {
    query["offer_target_diploma.european"] = { $in: [target_diploma_level, null] }
  }

  const filterStages: Document[] =
    geo === null
      ? [{ $match: query }, { $sort: { offer_creation: -1 } }]
      : [
          {
            $geoNear: {
              near: { type: "Point", coordinates: [geo.longitude, geo.latitude] },
              distanceField: "distance",
              key: "workplace_geopoint",
              maxDistance: geo.radius * 1000,
              query,
            },
          },
          { $sort: { distance: 1, offer_creation: -1 } },
        ]

  return await getDbCollection("jobs_partners")
    .aggregate<IJobsPartnersOfferPrivateWithDistance>([
      ...filterStages,
      {
        $limit: 150,
      },
    ])
    .toArray()
}

export const getJobsPartnersForApi = async ({
  romes,
  geo,
  target_diploma_level,
  partners_to_exclude,
  departements,
}: IJobSearchApiV3QueryResolved): Promise<IJobOfferApiReadV3[]> => {
  // recruteurs_lba are available in a different array from the API returned payload
  const partnersToExclude = partners_to_exclude ? [...partners_to_exclude, JOBPARTNERS_LABEL.RECRUTEURS_LBA] : [JOBPARTNERS_LABEL.RECRUTEURS_LBA]
  const jobsPartners = await getJobsPartnersFromDB({ romes, geo, target_diploma_level, partners_to_exclude: partnersToExclude, departements })

  return jobsPartners.map((j) =>
    jobsRouteApiv3Converters.convertToJobOfferApiReadV3({
      ...j,
      contract_type: j.contract_type ?? [TRAINING_CONTRACT_TYPE.APPRENTISSAGE, TRAINING_CONTRACT_TYPE.PROFESSIONNALISATION],
      apply_url: j.apply_url ?? `${config.publicUrl}/recherche?type=partner&itemId=${j._id}`,
      apply_recipient_id: j.apply_email ? getRecipientID(JobCollectionName.partners, j._id.toString()) : null,
    })
  )
}

const convertToGeopoint = ({ longitude, latitude }: { longitude: number; latitude: number }): IGeoPoint => ({ type: "Point", coordinates: [longitude, latitude] })

export const convertLbaCompanyToJobRecruiterApi = (recruteursLba: IJobsPartnersOfferPrivate[]): IJobRecruiterApiReadV3[] => {
  return recruteursLba.map(
    (recruteurLba): IJobRecruiterApiReadV3 => ({
      identifier: { id: recruteurLba._id },
      workplace: {
        siret: recruteurLba.workplace_siret,
        website: recruteurLba.workplace_website,
        name: recruteurLba.workplace_legal_name,
        brand: recruteurLba.workplace_brand,
        legal_name: recruteurLba.workplace_legal_name,
        description: null,
        size: recruteurLba.workplace_size,
        location: {
          address: recruteurLba.workplace_address_label,
          geopoint: recruteurLba.workplace_geopoint,
        },
        domain: {
          idcc: recruteurLba.workplace_idcc,
          opco: recruteurLba.workplace_opco,
          naf: recruteurLba.workplace_naf_code == null ? null : { code: recruteurLba.workplace_naf_code, label: recruteurLba.workplace_naf_label },
        },
      },
      apply: {
        url: `${config.publicUrl}/recherche?type=lba&itemId=${recruteurLba.workplace_siret}`,
        phone: recruteurLba.apply_phone,
        recipient_id: recruteurLba.apply_email ? getRecipientID(JobCollectionName.recruteur, recruteurLba.workplace_siret!) : null,
      },
    })
  )
}

function getDiplomaEuropeanLevel(job: IJob): IJobsPartnersOfferApi["offer_target_diploma"] {
  const label = parseEnum(NIVEAUX_POUR_LBA, job.job_level_label)

  switch (label) {
    case NIVEAUX_POUR_LBA["3 (CAP...)"]:
      return {
        european: "3",
        label,
      }
    case NIVEAUX_POUR_LBA["4 (BAC...)"]:
      return {
        european: "4",
        label,
      }
    case NIVEAUX_POUR_LBA["5 (BTS, DEUST...)"]:
      return {
        european: "5",
        label,
      }
    case NIVEAUX_POUR_LBA["6 (Licence, BUT...)"]:
      return {
        european: "4",
        label,
      }
    case NIVEAUX_POUR_LBA["7 (Master, titre ingénieur...)"]:
      return {
        european: "7",
        label,
      }
    case NIVEAUX_POUR_LBA.INDIFFERENT:
    case null:
      return null
    default:
      assertUnreachable(label)
  }
}

export const convertLbaRecruiterToJobOfferApi = (offresEmploiLba: IJobResult[]): IJobOfferApiReadV3[] => {
  return (
    offresEmploiLba
      // TODO: Temporary fix for missing geopoint & address
      .filter(({ recruiter, job }: IJobResult) => {
        if (!recruiter.address || !recruiter.geopoint) {
          const jobDataError = new Error("Lba job has no geopoint or no address")
          jobDataError.message = `job with id ${job._id.toString()}. geopoint=${recruiter?.geopoint} address=${recruiter?.address}`
          sentryCaptureException(jobDataError)
        }
        return recruiter.address && recruiter.geopoint && job.rome_label
      })
      .map(
        ({ recruiter, job }: IJobResult): IJobOfferApiReadV3 => ({
          identifier: { id: job._id, partner_label: JOBPARTNERS_LABEL.OFFRES_EMPLOI_LBA, partner_job_id: job._id.toString() },
          contract: {
            start: job.job_start_date,
            duration: job.job_duration ?? null,
            type: job.job_type,
            remote: null,
          },
          offer: {
            title: job.rome_label!,
            rome_codes: job.rome_code,
            description: job.rome_detail.definition,
            target_diploma: getDiplomaEuropeanLevel(job),
            desired_skills: job.rome_detail.competences.savoir_etre_professionnel?.map((x) => x.libelle) ?? [],
            to_be_acquired_skills: job.rome_detail.competences.savoir_faire?.flatMap((x) => x.items.map((y) => `${x.libelle}: ${y.libelle}`)) ?? [],
            access_conditions: job.rome_detail.acces_metier.split("\n"),
            publication: {
              creation: job.job_creation_date ?? null,
              expiration: job.job_expiration_date ?? null,
            },
            opening_count: job.job_count ?? 1,
            status: translateJobStatus(job.job_status)!,
          },

          workplace: {
            siret: recruiter.establishment_siret,
            website: null,
            name: recruiter.establishment_enseigne ?? recruiter.establishment_raison_sociale ?? null,
            brand: recruiter.establishment_enseigne ?? null,
            legal_name: recruiter.establishment_raison_sociale ?? null,
            description: null,
            size: recruiter.establishment_size ?? null,
            location: {
              address: recruiter.address!,
              geopoint: recruiter.geopoint!,
            },
            domain: {
              idcc: recruiter.idcc,
              opco: recruiter.opco,
              naf:
                recruiter.naf_code == null
                  ? null
                  : {
                      code: recruiter.naf_code ?? null,
                      label: recruiter.naf_label ?? null,
                    },
            },
          },

          apply: {
            url: `${config.publicUrl}/recherche?type=matcha&itemId=${job._id}`,
            phone: recruiter.phone ?? null,
            recipient_id: getRecipientID(JobCollectionName.recruiters, job._id.toString()),
          },
        })
      )
  )
}

export const convertFranceTravailJobToJobOfferApi = (offresEmploiFranceTravail: FTJob[]): IJobOfferApiReadV3[] => {
  return offresEmploiFranceTravail
    .filter((j) => {
      // TODO: Temporary fix for missing geopoint
      return j.lieuTravail.latitude != null && j.lieuTravail.longitude != null
    })
    .map((offreFT): IJobOfferApiReadV3 => {
      const contractDuration = parseInt(offreFT.typeContratLibelle, 10)
      const contractType = parseEnum(TRAINING_CONTRACT_TYPE, offreFT.natureContrat)
      return {
        identifier: {
          id: null,
          partner_job_id: offreFT.id,
          partner_label: JOBPARTNERS_LABEL.FRANCE_TRAVAIL,
        },

        contract: {
          start: null,
          duration: isNaN(contractDuration) ? null : contractDuration,
          type: contractType ? [contractType] : [],
          remote: null,
        },

        offer: {
          title: offreFT.intitule,
          rome_codes: [offreFT.romeCode],
          description: offreFT.description,
          target_diploma: null,
          desired_skills: [],
          to_be_acquired_skills: [],
          access_conditions: offreFT.formations ? offreFT.formations?.map((formation) => `${formation.domaineLibelle} - ${formation.niveauLibelle}`) : [],
          publication: {
            creation: new Date(offreFT.dateCreation),
            expiration: null,
          },
          opening_count: offreFT.nombrePostes,
          status: JOB_STATUS_ENGLISH.ACTIVE,
        },

        // Try to find entreprise SIRET from  offreFT.entreprise.siret ?
        workplace: {
          siret: null,
          brand: null,
          legal_name: null,
          website: null,
          name: offreFT.entreprise.nom ?? null,
          description: offreFT.entreprise.description ?? null,
          size: null,
          location: {
            address: offreFT.lieuTravail.libelle,
            geopoint: convertToGeopoint({
              longitude: parseFloat(offreFT.lieuTravail.longitude!),
              latitude: parseFloat(offreFT.lieuTravail.latitude!),
            }),
          },
          domain: {
            idcc: null,
            // TODO: try to map opco from FT formation requirement
            opco: null,
            naf: offreFT.codeNAF ? { code: offreFT.codeNAF, label: offreFT.secteurActiviteLibelle || null } : null,
          },
        },

        apply: {
          url: offreFT.origineOffre.partenaires?.[0]?.url ?? offreFT.origineOffre.urlOrigine,
          phone: null,
          recipient_id: null,
        },
      }
    })
}

async function findFranceTravailOpportunities(query: IJobSearchApiV3QueryResolved, context: JobOpportunityRequestContext): Promise<IJobOfferApiReadV3[]> {
  const getFtDiploma = (target_diploma_level: INiveauDiplomeEuropeen | null): keyof typeof NIVEAUX_POUR_OFFRES_PE | null => {
    switch (target_diploma_level) {
      case "3":
        return "3 (CAP...)"
      case "4":
        return "4 (BAC...)"
      case "5":
        return "5 (BTS, DEUST...)"
      case "6":
        return "6 (Licence, BUT...)"
      case "7":
        return "7 (Master, titre ingénieur...)"
      case null:
        return null
      default:
        assertUnreachable(target_diploma_level)
    }
  }

  const params: Parameters<typeof getFtJobsV2>[0] = {
    jobLimit: 150,
    romes: query.romes ?? null,
    insee: null,
    radius: query.geo?.radius ?? 0,
    diploma: getFtDiploma(query.target_diploma_level ?? null),
  }

  if (query.geo !== null) {
    const commune = await getNearestCommuneByGeoPoint({ type: "Point", coordinates: [query.geo.longitude, query.geo.latitude] })
    params.insee = commune.code
  }

  const ftJobs = await getFtJobsV2(params).catch((error) => {
    sentryCaptureException(error)
    context.addWarning("FRANCE_TRAVAIL_API_ERROR")

    return { resultats: [] }
  })

  return convertFranceTravailJobToJobOfferApi(ftJobs.resultats)
}

async function findLbaJobOpportunities(query: IJobSearchApiV3QueryResolved): Promise<IJobOfferApiReadV3[]> {
  const payload: Parameters<typeof getLbaJobsV2>[0] = {
    geo: query.geo,
    romes: query.romes ?? null,
    niveau: null,
    limit: 150,
    departements: query.departements ?? null,
  }

  if (query.target_diploma_level) {
    payload.niveau = NIVEAU_DIPLOME_LABEL[query.target_diploma_level]
  }

  const lbaJobs = await getLbaJobsV2(payload)

  return convertLbaRecruiterToJobOfferApi(lbaJobs)
}

export async function resolveQuery(query: IJobSearchApiV3Query): Promise<IJobSearchApiV3QueryResolved> {
  const { romes, rncp, latitude, longitude, radius, ...rest } = query

  const geo = latitude === null || longitude === null ? null : { latitude, longitude, radius }

  if (!romes && !rncp) {
    return { geo, romes: null, ...rest }
  }

  const romeCriteria: string[] = []

  if (romes) {
    romeCriteria.push(...romes)
  }

  if (query.rncp) {
    const rncpRomes = await getRomesFromRncp(query.rncp, true)

    if (rncpRomes == null) {
      throw badRequest("Cannot find an active Certification for the given RNCP", { rncp: query.rncp })
    }

    romeCriteria.push(...rncpRomes)
  }

  return {
    ...rest,
    geo,
    romes: romeCriteria,
  }
}

export async function findJobsOpportunities(payload: IJobSearchApiV3Query, context: JobOpportunityRequestContext): Promise<IJobSearchApiV3Response> {
  const resolvedQuery = await resolveQuery(payload)

  const [recruteurLba, offreEmploiLba, offreEmploiPartenaire, franceTravail] = await Promise.all([
    getRecruteursLbaFromDB(resolvedQuery),
    findLbaJobOpportunities(resolvedQuery),
    getJobsPartnersForApi(resolvedQuery),
    findFranceTravailOpportunities(resolvedQuery, context),
  ])

  const jobs = [...offreEmploiLba, ...franceTravail, ...offreEmploiPartenaire].filter((job) => {
    const parsedJob = zJobOfferApiReadV3.safeParse(job)
    if (!parsedJob.success) {
      const error = internal("jobOpportunity.service.ts-findJobsOpportunities: invalid job offer", { job, error: parsedJob.error.format() })
      logger.error(error)
      context.addWarning("JOB_OFFER_FORMATING_ERROR")
      sentryCaptureException(error)
    }
    return parsedJob.success
  })
  const recruiters = convertLbaCompanyToJobRecruiterApi(recruteurLba).filter((recruteur) => {
    const parsedRecruiter = zJobRecruiterApiReadV3.safeParse(recruteur)
    if (!parsedRecruiter.success) {
      const error = internal("jobOpportunity.service.ts-findJobsOpportunities: invalid recruiter", { recruteur, error: parsedRecruiter.error.format() })
      logger.error(error)
      context.addWarning("RECRUITERS_FORMATING_ERROR")
      sentryCaptureException(error)
    }
    return parsedRecruiter.success
  })

  return {
    jobs,
    recruiters,
    warnings: context.getWarnings(),
  }
}

type InvariantFields = "_id" | "created_at" | "partner_label" | "partner_job_id"

async function upsertJobOfferPrivate({
  data,
  partner_label,
  partnerJobIdIfNew,
  requestedByEmail,
  current,
}: {
  data: IJobOfferApiWriteV3
  partner_label: string
  partnerJobIdIfNew?: string
  requestedByEmail: string
  current: IJobsPartnersOfferPrivate | null
}): Promise<ObjectId> {
  const now = new Date()

  const _id = current?._id ?? new ObjectId()
  const invariantData: Pick<IJobsPartnersOfferPrivate, InvariantFields> = {
    _id,
    created_at: current?.created_at ?? now,
    partner_label,
    partner_job_id: current?.partner_job_id ?? partnerJobIdIfNew ?? _id.toString(),
  }

  const defaultOfferExpiration = current?.offer_expiration
    ? current.offer_expiration
    : DateTime.fromJSDate(invariantData.created_at, { zone: "Europe/Paris" }).plus({ months: 2 }).startOf("day").toJSDate()

  const offer_target_diploma_european = data.offer.target_diploma?.european ?? null

  const writableData: Omit<IComputedJobsPartners, InvariantFields> = {
    contract_start: data.contract.start,
    contract_duration: data.contract.duration,
    contract_type: data.contract.type,
    contract_remote: data.contract.remote,

    offer_title: data.offer.title,
    offer_description: data.offer.description,
    offer_target_diploma:
      offer_target_diploma_european === null
        ? null
        : {
            european: offer_target_diploma_european,
            label: NIVEAU_DIPLOME_LABEL[offer_target_diploma_european],
          },
    offer_desired_skills: data.offer.desired_skills,
    offer_to_be_acquired_skills: data.offer.to_be_acquired_skills,
    offer_access_conditions: data.offer.access_conditions,
    offer_creation: data.offer.publication.creation ?? invariantData.created_at,
    offer_expiration: data.offer.publication.expiration || defaultOfferExpiration,
    offer_opening_count: data.offer.opening_count,
    offer_origin: data.offer.origin,
    offer_status: data.offer.status,
    offer_multicast: data.offer.multicast,

    workplace_siret: data.workplace.siret,
    workplace_description: data.workplace.description,
    workplace_website: data.workplace.website,
    workplace_name: data.workplace.name,
    workplace_address_label: data.workplace.location?.address,

    apply_email: data.apply.email,
    apply_url: data.apply.url,
    apply_phone: data.apply.phone,

    updated_at: now,
    business_error: null,
    errors: [],
    validated: false,
    jobs_in_success: [],
  }

  await getDbCollection("computed_jobs_partners").updateOne(
    { _id: invariantData._id },
    { $set: writableData, $setOnInsert: { ...invariantData, offer_status_history: [] } },
    { upsert: true }
  )
  if (current && current.offer_status !== data.offer.status) {
    await getDbCollection("computed_jobs_partners").updateOne(
      { _id: invariantData._id },
      {
        $push: {
          offer_status_history: {
            date: now,
            status: data.offer.status,
            reason: "créée / modifiée par API",
            granted_by: requestedByEmail,
          },
        },
      }
    )
  }

  return invariantData._id
}

export async function createJobOffer(identity: IApiAlternanceTokenData, data: IJobOfferApiWriteV3): Promise<ObjectId> {
  return upsertJobOfferPrivate({
    data,
    partner_label: identity.organisation!,
    requestedByEmail: identity.email,
    current: null,
  })
}

export async function updateJobOffer(id: ObjectId, identity: IApiAlternanceTokenData, data: IJobOfferApiWriteV3): Promise<void> {
  const current = await getDbCollection("jobs_partners").findOne<IJobsPartnersOfferPrivate>({ _id: id })

  // TODO: Move to authorisation service
  if (!current) {
    throw notFound("Job offer not found")
  }

  if (current.offer_status !== JOB_STATUS_ENGLISH.ACTIVE) {
    throw badRequest("Job must be active in order to be modified")
  }

  await upsertJobOfferPrivate({
    data,
    partner_label: identity.organisation!,
    requestedByEmail: identity.email,
    current,
  })
}

export async function upsertJobOffer(data: IJobOfferApiWriteV3, partner_label: string, partner_job_id: string, requestedByEmail: string) {
  let current = await getDbCollection("jobs_partners").findOne<IJobsPartnersOfferPrivate>({ partner_label, partner_job_id })
  if (!current) {
    current = await getDbCollection("computed_jobs_partners").findOne<IJobsPartnersOfferPrivate>({ partner_label, partner_job_id })
  }
  return upsertJobOfferPrivate({ data, partner_label, partnerJobIdIfNew: partner_job_id, requestedByEmail, current })
}

export async function findJobOpportunityById(id: ObjectId, context: JobOpportunityRequestContext): Promise<IJobOfferApiReadV3> {
  try {
    // Exécuter les requêtes en parallèle puis récupérer la première offre trouvée
    const results = await Promise.allSettled([getLbaJobByIdV2AsJobOfferApi(id, context), getJobsPartnersByIdAsJobOfferApi(id, context)])

    const validResults = results.filter((res): res is PromiseFulfilledResult<IJobOfferApiReadV3> => res.status === "fulfilled" && res.value !== null)

    const foundJob = validResults.length > 0 ? validResults[0].value : null

    if (!foundJob) {
      logger.warn(`Aucune offre d'emploi trouvée pour l'ID: ${id.toString()}`, { context })
      throw notFound(`Aucune offre d'emploi trouvée pour l'ID: ${id.toString()}`)
    }

    return validateJobOffer(foundJob, id, context)
  } catch (error) {
    if (Boom.isBoom(error)) {
      throw error
    }

    const err = internal("Erreur inattendue dans findJobOpportunityById", { id, error })
    logger.error(err)
    sentryCaptureException(err)
    throw new Error("Erreur inattendue dans findJobOpportunityById")
  }
}

function validateJobOffer(job: IJobOfferApiReadV3, id: ObjectId, context: JobOpportunityRequestContext): IJobOfferApiReadV3 {
  const parsedJob = zJobOfferApiReadV3.safeParse(job)

  if (!parsedJob.success) {
    const error = internal("jobOpportunity.service.ts-validateJobOffer: invalid job offer", {
      job,
      error: parsedJob.error.format(),
      id: id.toString(),
    })

    logger.error(error)
    context.addWarning("JOB_OFFER_FORMATING_ERROR")
    sentryCaptureException(error)
    throw new Error("Invalid job offer data")
  }

  return parsedJob.data
}

export async function getLbaJobByIdV2AsJobOfferApi(id: ObjectId, context: JobOpportunityRequestContext): Promise<IJobOfferApiReadV3 | null> {
  const job = await getLbaJobByIdV2AsJobResult({ id: id.toString(), caller: context?.caller })

  if (!job) {
    const error = internal("jobOpportunity.service.ts-getLbaJobByIdV2AsJobOfferApi: job not found", { id })
    logger.error(error)
    context.addWarning("JOB_NOT_FOUND")
    sentryCaptureException(error)
    throw new Error("Job not found")
  }

  const transformedJob = convertLbaRecruiterToJobOfferApi([job])[0]
  return transformedJob
}

export async function getJobsPartnersByIdAsJobOfferApi(id: ObjectId, context: JobOpportunityRequestContext): Promise<IJobOfferApiReadV3 | null> {
  const job = await getDbCollection("jobs_partners").findOne({ _id: id })

  if (!job) {
    const error = internal("jobOpportunity.service.ts-getJobsPartnersByIdAsJobOfferApi: job not found", { id })
    logger.error(error)
    context.addWarning("JOB_NOT_FOUND")
    sentryCaptureException(error)
    throw new Error("Job not found")
  }

  const transformedJob = jobsRouteApiv3Converters.convertToJobOfferApiReadV3({
    ...job,
    contract_type: job.contract_type ?? [TRAINING_CONTRACT_TYPE.APPRENTISSAGE, TRAINING_CONTRACT_TYPE.PROFESSIONNALISATION],
    apply_url: job.apply_url ?? `${config.publicUrl}/recherche?type=partner&itemId=${job._id}`,
    apply_recipient_id: job.apply_email ? `partners_${job._id}` : null,
  })

  return transformedJob
}

export const getRecipientID = (type: IJobCollectionName, id: string) => {
  if (type === JobCollectionName.recruiters) {
    return `recruiters_${id}`
  }
  if (type === JobCollectionName.partners) {
    return `partners_${id}`
  }
  if (type === JobCollectionName.recruteur) {
    return `recruteur_${id}`
  }
  assertUnreachable(type)
}
