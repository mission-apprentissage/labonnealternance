import Boom, { badRequest, internal, notFound } from "@hapi/boom"
import { IApiAlternanceTokenData } from "api-alternance-sdk"
import dayjs from "dayjs"
import { DateTime } from "luxon"
import { Document, Filter, ObjectId } from "mongodb"
import { IGeoPoint, IJob, IJobCollectionName, ILbaItemPartnerJob, JOB_STATUS_ENGLISH, JobCollectionName, assertUnreachable, parseEnum, translateJobStatus } from "shared"
import { BusinessErrorCodes } from "shared/constants/errorCodes"
import { LBA_ITEM_TYPE, allLbaItemType } from "shared/constants/lbaitem"
import { NIVEAUX_POUR_LBA, NIVEAU_DIPLOME_LABEL, TRAINING_CONTRACT_TYPE } from "shared/constants/recruteur"
import { IJobsPartnersOfferApi, IJobsPartnersOfferPrivate, IJobsPartnersOfferPrivateWithDistance, JOBPARTNERS_LABEL } from "shared/models/jobsPartners.model"
import { IComputedJobsPartners, IComputedJobsPartnersWrite, JOB_PARTNER_BUSINESS_ERROR } from "shared/models/jobsPartnersComputed.model"
import {
  IJobOfferApiReadV3,
  IJobOfferPublishingV3,
  JOB_PUBLISHING_STATUS,
  jobsRouteApiv3Converters,
  zJobOfferApiReadV3,
  zJobRecruiterApiReadV3,
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
import { getSomeFtJobs } from "../../ftjob.service"
import { FTJob } from "../../ftjob.service.types"
import { TJobSearchQuery, TLbaItemResult } from "../../jobOpportunity.service.types"
import { ILbaItemFtJob, ILbaItemLbaCompany, ILbaItemLbaJob } from "../../lbaitem.shared.service.types"
import { IJobResult, getLbaJobByIdV2AsJobResult, getLbaJobs, getLbaJobsV2, incrementLbaJobsViewCount } from "../../lbajob.service"
import { jobsQueryValidator, jobsQueryValidatorPrivate } from "../../queryValidator.service"
import { getRecruteursLbaFromDB, getSomeCompanies } from "../../recruteurLba.service"

import { JobOpportunityRequestContext } from "./JobOpportunityRequestContext"

// TODO : QUICK FIX & TO REFACTO WITH JOBS PARTNER RETURN MODEL
export const getJobsFromApiPrivate = async ({
  romes,
  referer,
  caller,
  latitude,
  longitude,
  radius,
  diploma,
  opco,
  api = "jobV1/jobs",
  isMinimalData,
}: {
  romes?: string
  referer?: string
  caller?: string | null
  latitude?: number
  longitude?: number
  radius?: number
  diploma?: string
  opco?: string
  api?: string
  isMinimalData: boolean
}): Promise<
  | IApiError
  | {
      lbaJobs: TLbaItemResult<ILbaItemPartnerJob> | null
      lbaCompanies: TLbaItemResult<ILbaItemLbaCompany> | null
      partnerJobs: TLbaItemResult<ILbaItemPartnerJob> | null
    }
> => {
  try {
    const finalRadius = radius ?? 0

    const [lbaCompanies, lbaJobs, partnerJobs] = await Promise.all([
      getSomeCompanies({
        romes,
        latitude,
        longitude,
        radius: finalRadius,
        referer,
        caller,
        api,
        opco,
        isMinimalData,
      }),
      getPartnerJobs({
        romes,
        latitude,
        longitude,
        radius: finalRadius,
        api,
        caller,
        diploma,
        opco,
        isMinimalData,
        force_partner_label: JOBPARTNERS_LABEL.OFFRES_EMPLOI_LBA,
      }),
      getPartnerJobs({
        romes,
        latitude,
        longitude,
        radius: finalRadius,
        api,
        caller,
        diploma,
        opco,
        isMinimalData,
      }),
    ])

    return { lbaJobs, lbaCompanies, partnerJobs }
  } catch (err) {
    if (caller) {
      trackApiCall({ caller, api_path: api, response: "Error" })
    }
    throw err
  }
}

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
          case "peJob":
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
 * TODO : REFACTO AVEC VALIDATION ZOD & SCHEMA DE RETOUR JOBS PARTNERS
 */
export const getJobsQueryPrivate = async (
  query: TJobSearchQuery
): Promise<
  | IApiError
  | {
      lbaJobs: TLbaItemResult<ILbaItemPartnerJob> | null
      lbaCompanies: TLbaItemResult<ILbaItemLbaCompany> | null
      partnerJobs: TLbaItemResult<ILbaItemPartnerJob> | null
    }
> => {
  const parameterControl = await jobsQueryValidatorPrivate(query)

  if ("error" in parameterControl) {
    return parameterControl
  }

  const result = await getJobsFromApiPrivate({ romes: parameterControl.romes, ...query })

  if ("error" in result) {
    return result
  }

  let job_count = 0

  if ("lbaCompanies" in result && result.lbaCompanies && "results" in result.lbaCompanies) {
    job_count += result.lbaCompanies.results.length
  }

  if ("lbaJobs" in result && result.lbaJobs && "results" in result.lbaJobs) {
    job_count += result.lbaJobs.results.length
    await incrementLbaJobsViewCount(result.lbaJobs.results.flatMap((job) => (job?.id ? [job.id] : [])))
  }

  if ("partnerJobs" in result && result.partnerJobs && "results" in result.partnerJobs) {
    job_count += result.partnerJobs.results.length
  }

  if (query.caller) {
    trackApiCall({ caller: query.caller, job_count, result_count: job_count, api_path: "jobV1/jobs", response: "OK" })
  }

  return result
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
  opco,
  partner_label,
}: IJobSearchApiV3QueryResolved & { partner_label?: string }): Promise<IJobsPartnersOfferPrivate[]> => {
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

  if (partner_label) {
    query.partner_label = partner_label
  }

  if (target_diploma_level) {
    query["offer_target_diploma.european"] = { $in: [target_diploma_level, null] }
  }

  if (departements?.length) {
    const departmentsRegex = departements.flatMap((code) => normalizeDepartementToRegex(code))
    query.workplace_address_zipcode = { $in: departmentsRegex }
  }

  if (opco) {
    query.workplace_opco = opco
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

export const getJobsPartnersFromDBForUI = async ({
  romes,
  geo,
  target_diploma_level,
  force_partner_label,
}: IJobSearchApiV3QueryResolved): Promise<IJobsPartnersOfferPrivateWithDistance[]> => {
  const query: Filter<IJobsPartnersOfferPrivate> = {
    offer_status: JOB_STATUS_ENGLISH.ACTIVE,
    offer_expiration: { $gt: new Date() },
    partner_label: force_partner_label ? force_partner_label : { $not: { $in: [JOBPARTNERS_LABEL.RECRUTEURS_LBA, JOBPARTNERS_LABEL.OFFRES_EMPLOI_LBA] } }, // until offers are not merged together from the endpoint, lba companies are fetched into another service.
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
  opco,
}: IJobSearchApiV3QueryResolved): Promise<IJobOfferApiReadV3[]> => {
  // recruteurs_lba are available in a different array from the API returned payload
  const partnersToExclude = partners_to_exclude
    ? [...partners_to_exclude, JOBPARTNERS_LABEL.RECRUTEURS_LBA, JOBPARTNERS_LABEL.OFFRES_EMPLOI_LBA]
    : [JOBPARTNERS_LABEL.RECRUTEURS_LBA, JOBPARTNERS_LABEL.OFFRES_EMPLOI_LBA]
  const jobsPartners = await getJobsPartnersFromDB({ romes, geo, target_diploma_level, partners_to_exclude: partnersToExclude, opco, departements })

  return jobsPartners.map((j) =>
    jobsRouteApiv3Converters.convertToJobOfferApiReadV3({
      ...j,
      contract_type: j.contract_type ?? [TRAINING_CONTRACT_TYPE.APPRENTISSAGE, TRAINING_CONTRACT_TYPE.PROFESSIONNALISATION],
      apply_url: getApplyUrl(j),
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
        url: buildApplyUrl(recruteurLba.workplace_siret!, recruteurLba.workplace_legal_name!, LBA_ITEM_TYPE.RECRUTEURS_LBA),
        phone: recruteurLba.apply_phone,
        recipient_id: recruteurLba.apply_email ? getRecipientID(JobCollectionName.recruteur, recruteurLba.workplace_siret!) : null,
      },
    })
  )
}

export function getDiplomaEuropeanLevel(job: IJob): IJobsPartnersOfferApi["offer_target_diploma"] {
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
            url: buildApplyUrl(job._id.toString(), job.offer_title_custom ?? job.rome_appellation_label!, LBA_ITEM_TYPE.OFFRES_EMPLOI_LBA),
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

export const findFranceTravailOpportunitiesFromDB = async (resolvedQuery: IJobSearchApiV3QueryResolved): Promise<IJobOfferApiReadV3[]> => {
  const jobsPartners = await getJobsPartnersFromDB({ ...resolvedQuery, partner_label: JOBPARTNERS_LABEL.FRANCE_TRAVAIL })

  return jobsPartners.map((j) =>
    jobsRouteApiv3Converters.convertToJobOfferApiReadV3({
      ...j,
      apply_url: j.apply_url!,
    })
  )
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

  if (query.opco) {
    payload.opco = query.opco
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
    findFranceTravailOpportunitiesFromDB(resolvedQuery),
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
    const promises = await Promise.allSettled([getLbaJobByIdV2AsJobOfferApi(id, context), getJobsPartnersByIdAsJobOfferApi(id)])
    const [foundJob] = promises.flatMap((promise) => (promise.status === "fulfilled" && promise.value !== null ? [promise.value] : []))

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

export async function findOfferPublishing(id: ObjectId, context: JobOpportunityRequestContext): Promise<IJobOfferPublishingV3> {
  const offerV2 = await getLbaJobByIdV2AsJobOfferApi(id, context)
  if (offerV2) {
    return {
      publishing: {
        status: JOB_PUBLISHING_STATUS.PUBLISHED,
      },
    }
  }
  const publishing = await getJobsPartnersPublishing(id)

  if (!publishing) {
    logger.warn(`Aucune offre d'emploi trouvée pour l'ID: ${id.toString()}`, { context })
    throw notFound(`Aucune offre d'emploi trouvée pour l'ID: ${id.toString()}`)
  }

  return publishing
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
  const job = await getLbaJobByIdV2AsJobResult({ id: id.toString() })

  if (!job) {
    context.addWarning("JOB_NOT_FOUND")
    return null
  }

  const transformedJob = convertLbaRecruiterToJobOfferApi([job])[0]
  return transformedJob
}

export async function getJobsPartnersByIdAsJobOfferApi(id: ObjectId): Promise<IJobOfferApiReadV3 | null> {
  const job = await getDbCollection("jobs_partners").findOne({ _id: id })
  if (!job) {
    return null
  }
  return jobsPartnersToApiV3Read(job)
}

export async function getJobsPartnersPublishing(id: ObjectId): Promise<IJobOfferPublishingV3 | null> {
  const job = await getDbCollection("jobs_partners").findOne({ _id: id })
  const computedJob = await getDbCollection("computed_jobs_partners").findOne({ _id: id })
  if (job) {
    if (computedJob) {
      if (dayjs(job.updated_at).isAfter(computedJob.updated_at)) {
        return jobsPartnersToPublishing()
      } else {
        return computedJobsPartnersToPublishing(computedJob)
      }
    } else {
      return jobsPartnersToPublishing()
    }
  } else {
    if (computedJob) {
      return computedJobsPartnersToPublishing(computedJob)
    } else {
      return null
    }
  }
}

export const jobsPartnersToApiV3Read = (job: IJobsPartnersOfferPrivate): IJobOfferApiReadV3 =>
  jobsRouteApiv3Converters.convertToJobOfferApiReadV3({
    ...job,
    contract_type: job.contract_type ?? [TRAINING_CONTRACT_TYPE.APPRENTISSAGE, TRAINING_CONTRACT_TYPE.PROFESSIONNALISATION],
    apply_url: getApplyUrl(job),
    apply_recipient_id: job.apply_email ? `partners_${job._id}` : null,
  })

const jobsPartnersToPublishing = (): IJobOfferPublishingV3 => ({
  publishing: {
    status: JOB_PUBLISHING_STATUS.PUBLISHED,
  },
})

const otherErrorsLabels: Record<string, string> = {
  [BusinessErrorCodes.NON_DIFFUSIBLE]: "The company's contact informations are not publishable",
}

const jobPartnerBusinessErrorLabels: Record<JOB_PARTNER_BUSINESS_ERROR, string> = {
  [JOB_PARTNER_BUSINESS_ERROR.CFA]: "The offer is published by a training entity",
  [JOB_PARTNER_BUSINESS_ERROR.CLOSED_COMPANY]: "The company is closed",
  [JOB_PARTNER_BUSINESS_ERROR.DUPLICATE]: "The offer is considered as a duplicate of another published offer",
  [JOB_PARTNER_BUSINESS_ERROR.EXPIRED]: "The offer has expired",
  [JOB_PARTNER_BUSINESS_ERROR.ROME_BLACKLISTED]: "The offer's profession is not published",
  [JOB_PARTNER_BUSINESS_ERROR.STAGE]: "The offer is considered an internship",
  [JOB_PARTNER_BUSINESS_ERROR.WRONG_DATA]: "The offer contains bad data",
  [JOB_PARTNER_BUSINESS_ERROR.GEOLOCATION_NOT_FOUND]: "We were unable to geolocate the offer's address",
}

const computedJobsPartnersToPublishing = (job: IComputedJobsPartners): IJobOfferPublishingV3 => {
  const { business_error } = job
  if (business_error) {
    const allLabels = { ...jobPartnerBusinessErrorLabels, ...otherErrorsLabels }
    return {
      publishing: {
        status: JOB_PUBLISHING_STATUS.WILL_NOT_BE_PUBLISHED,
        error: {
          code: business_error,
          label: allLabels[business_error] ?? business_error,
        },
      },
    }
  }
  return {
    publishing: {
      status: JOB_PUBLISHING_STATUS.WILL_BE_PUBLISHED,
    },
  }
}

export const getJobTypeFromPartnerLabel = (jobType: JOBPARTNERS_LABEL): LBA_ITEM_TYPE => {
  if (jobType === JOBPARTNERS_LABEL.OFFRES_EMPLOI_LBA) {
    return LBA_ITEM_TYPE.OFFRES_EMPLOI_LBA
  } else if (jobType === JOBPARTNERS_LABEL.RECRUTEURS_LBA) {
    return LBA_ITEM_TYPE.RECRUTEURS_LBA
  } else {
    return LBA_ITEM_TYPE.OFFRES_EMPLOI_PARTENAIRES
  }
}

export const buildApplyUrl = (jobId: string, jobTitle: string, jobType: LBA_ITEM_TYPE): string => {
  return `${config.publicUrl}/emploi/${jobType}/${jobId}/${encodeURIComponent(jobTitle)}`
}

export const getApplyUrl = (job: IJobsPartnersOfferPrivate): string => {
  if (job.apply_url) {
    return job.apply_url
  }
  const jobType = getJobTypeFromPartnerLabel(job.partner_label as JOBPARTNERS_LABEL)

  return `${config.publicUrl}/emploi/${jobType}/${job._id}/${encodeURIComponent(job.offer_title)}`
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

const incrementJobCounter = (fieldName: keyof IJobsPartnersOfferPrivate) => async (ids: ObjectId[]) => {
  try {
    await getDbCollection("jobs_partners").updateMany(
      { _id: { $in: ids } },
      {
        $inc: {
          [fieldName]: 1,
        },
      }
    )
  } catch (err) {
    logger.error(err)
    sentryCaptureException(err)
  }
}

export const incrementSearchViewCount = incrementJobCounter("stats_search_view")
export const incrementDetailViewCount = (id: ObjectId) => incrementJobCounter("stats_detail_view")([id])
export const incrementPostulerClickCount = (id: ObjectId) => incrementJobCounter("stats_postuler")([id])

export async function upsertJobsPartnersMulti({
  data,
  requestedByEmail,
}: {
  data: IComputedJobsPartnersWrite
  requestedByEmail: string
}): Promise<{ id: ObjectId; modified: boolean }> {
  const now = new Date()
  const { partner_label, partner_job_id } = data

  let current = await getDbCollection("jobs_partners").findOne<IJobsPartnersOfferPrivate>({ partner_label, partner_job_id })
  if (!current) {
    current = await getDbCollection("computed_jobs_partners").findOne<IJobsPartnersOfferPrivate>({ partner_label, partner_job_id })
  }

  const { created_at, _id } = {
    _id: current?._id ?? new ObjectId(),
    created_at: current?.created_at ?? now,
  } satisfies Partial<IJobsPartnersOfferPrivate>

  const offerCreation = current?.offer_creation ?? new Date(data.offer_creation)
  const offerExpiration = current?.offer_expiration ?? DateTime.fromJSDate(created_at, { zone: "Europe/Paris" }).plus({ months: 2 }).startOf("day").toJSDate()
  const offerStatus = current?.offer_status ?? JOB_STATUS_ENGLISH.ACTIVE

  const userWrittenFields = {
    ...data,
    offer_creation: offerCreation,
    offer_expiration: offerExpiration,
    offer_status: offerStatus,
  }

  const technicalFields = {
    updated_at: now,
    business_error: null,
    errors: [],
    validated: false,
    jobs_in_success: [],
    currently_processed_id: null,
  }
  const writtenFields: Omit<IComputedJobsPartners, InvariantFields> = { ...userWrittenFields, ...technicalFields }
  let modified: boolean
  if (current) {
    const updateResult = await getDbCollection("computed_jobs_partners").updateOne({ _id }, { $set: userWrittenFields })
    modified = Boolean(updateResult.modifiedCount)
    if (modified) {
      await getDbCollection("computed_jobs_partners").updateOne({ _id }, { $set: technicalFields })
    }
  } else {
    modified = true
    await getDbCollection("computed_jobs_partners").insertOne({ ...writtenFields, created_at, _id, offer_status_history: [], partner_label, partner_job_id })
  }
  if (current && current.offer_status !== offerStatus) {
    await getDbCollection("computed_jobs_partners").updateOne(
      { _id },
      {
        $push: {
          offer_status_history: {
            date: now,
            status: offerStatus,
            reason: "créée / modifiée par API",
            granted_by: requestedByEmail,
          },
        },
      }
    )
  }

  return { id: _id, modified }
}
