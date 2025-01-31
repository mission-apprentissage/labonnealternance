import { badRequest, internal, notFound } from "@hapi/boom"
import { IApiAlternanceTokenData } from "api-alternance-sdk"
import { DateTime } from "luxon"
import { Document, Filter, ObjectId } from "mongodb"
import {
  IGeoPoint,
  IJob,
  ILbaCompany,
  ILbaItemPartnerJob,
  IRecruiter,
  JOB_STATUS_ENGLISH,
  ZPointGeometry,
  assertUnreachable,
  joinNonNullStrings,
  parseEnum,
  translateJobStatus,
} from "shared"
import { NIVEAUX_POUR_LBA, NIVEAUX_POUR_OFFRES_PE, NIVEAU_DIPLOME_LABEL, TRAINING_CONTRACT_TYPE } from "shared/constants"
import { LBA_ITEM_TYPE, allLbaItemType } from "shared/constants/lbaitem"
import {
  IJobsPartnersOfferApi,
  IJobsPartnersOfferPrivate,
  IJobsPartnersOfferPrivateWithDistance,
  IJobsPartnersRecruiterApi,
  INiveauDiplomeEuropeen,
  JOBPARTNERS_LABEL,
  ZJobsPartnersRecruiterApi,
} from "shared/models/jobsPartners.model"
import { zOpcoLabel } from "shared/models/opco.model"
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
import { ZodError } from "zod"

import { sentryCaptureException } from "@/common/utils/sentryUtils"
import { getRomeInfoSafe } from "@/services/cacheRomeo.service"
import { getEntrepriseDataFromSiret, getOpcoData } from "@/services/etablissement.service"
import { getCityFromProperties, getGeolocation, getStreetFromProperties } from "@/services/geolocation.service"
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
import { IJobResult, getLbaJobs, getLbaJobsV2, incrementLbaJobsViewCount } from "../../lbajob.service"
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
          case "matcha":
            return LBA_ITEM_TYPE.OFFRES_EMPLOI_LBA
          case "lba":
          case "lbb":
            return LBA_ITEM_TYPE.RECRUTEURS_LBA

          case "offres":
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

export const getJobsPartnersFromDB = async ({ romes, geo, target_diploma_level, partners_to_exclude }: IJobSearchApiV3QueryResolved): Promise<IJobsPartnersOfferPrivate[]> => {
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

export const getJobsPartnersForApi = async ({ romes, geo, target_diploma_level, partners_to_exclude }: IJobSearchApiV3QueryResolved): Promise<IJobOfferApiReadV3[]> => {
  const jobsPartners = await getJobsPartnersFromDB({ romes, geo, target_diploma_level, partners_to_exclude })

  return jobsPartners.map((j) =>
    jobsRouteApiv3Converters.convertToJobOfferApiReadV3({
      ...j,
      contract_type: j.contract_type ?? [TRAINING_CONTRACT_TYPE.APPRENTISSAGE, TRAINING_CONTRACT_TYPE.PROFESSIONNALISATION],
      apply_url: j.apply_url ?? `${config.publicUrl}/recherche?type=partner&itemId=${j._id}`,
      apply_recipient_id: `jobs_partners_${j._id}`,
    })
  )
}

const convertToGeopoint = ({ longitude, latitude }: { longitude: number; latitude: number }): IGeoPoint => ({ type: "Point", coordinates: [longitude, latitude] })

function convertOpco(recruteurLba: Pick<ILbaCompany | IRecruiter, "opco">): IJobsPartnersRecruiterApi["workplace_opco"] {
  const r = ZJobsPartnersRecruiterApi.shape.workplace_opco.safeParse(recruteurLba.opco)
  if (r.success) {
    return r.data
  }

  return null
}

export const convertLbaCompanyToJobRecruiterApi = (recruteursLba: ILbaCompany[]): IJobRecruiterApiReadV3[] => {
  return recruteursLba.map(
    (recruteurLba): IJobRecruiterApiReadV3 => ({
      identifier: { id: recruteurLba._id },
      workplace: {
        siret: recruteurLba.siret,
        website: recruteurLba.website,
        name: recruteurLba.enseigne ?? recruteurLba.raison_sociale,
        brand: recruteurLba.enseigne,
        legal_name: recruteurLba.raison_sociale,
        description: null,
        size: recruteurLba.company_size,
        location: {
          address: joinNonNullStrings([recruteurLba.street_number, recruteurLba.street_name, recruteurLba.zip_code, recruteurLba.city])!,
          geopoint: recruteurLba.geopoint!,
        },
        domain: {
          idcc: null,
          opco: convertOpco(recruteurLba),
          naf: recruteurLba.naf_code == null ? null : { code: recruteurLba.naf_code, label: recruteurLba.naf_label },
        },
      },
      apply: {
        url: `${config.publicUrl}/recherche?type=lba&itemId=${recruteurLba.siret}`,
        phone: recruteurLba.phone,
        recipient_id: recruteurLba.email ? `recruteurslba_${recruteurLba._id}` : null,
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
              opco: convertOpco(recruiter),
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
            recipient_id: `recruiters_${job._id}`,
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
          partner_label: JOBPARTNERS_LABEL.OFFRES_EMPLOI_FRANCE_TRAVAIL,
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

type WorkplaceAddressData = Pick<IJobsPartnersOfferPrivate, "workplace_geopoint" | "workplace_address_city" | "workplace_address_zipcode" | "workplace_address_street_label">

async function resolveWorkplaceGeoLocationFromAddress(workplace_address_label: string | null, zodError: ZodError): Promise<WorkplaceAddressData | null> {
  if (workplace_address_label === null) {
    return null
  }

  const geoFeature = await getGeolocation(workplace_address_label)

  if (!geoFeature) {
    zodError.addIssue({ code: "custom", path: ["workplace_geopoint"], message: "Cannot resolve geo-coordinates for the given address" })
    return null
  }

  return {
    workplace_geopoint: ZPointGeometry.parse(geoFeature.geometry),
    workplace_address_city: getCityFromProperties(geoFeature),
    workplace_address_zipcode: geoFeature?.properties.postcode ?? null,
    workplace_address_street_label: getStreetFromProperties(geoFeature),
  }
}

// List of fields impacted by change of the siret
type WorkplaceSiretData = Pick<
  IJobsPartnersOfferPrivate,
  | "workplace_geopoint"
  | "workplace_address_label"
  | "workplace_address_street_label"
  | "workplace_address_city"
  | "workplace_address_zipcode"
  | "workplace_legal_name"
  | "workplace_brand"
  | "workplace_naf_label"
  | "workplace_naf_code"
  | "workplace_opco"
  | "workplace_idcc"
  | "workplace_size"
>

async function resolveWorkplaceDataFromSiret(workplace_siret: string, zodError: ZodError): Promise<WorkplaceSiretData | null> {
  const [entrepriseData, opcoData] = await Promise.all([
    getEntrepriseDataFromSiret({ siret: workplace_siret, type: "ENTREPRISE", isApiApprentissage: true }),
    getOpcoData(workplace_siret),
  ])

  if ("error" in entrepriseData) {
    zodError.addIssue({ code: "custom", path: ["workplace_siret"], message: entrepriseData.message })
    return null
  }

  return {
    workplace_geopoint: entrepriseData.geopoint,
    workplace_address_city: entrepriseData.address_detail.commune ?? entrepriseData.address_detail.libelle_commune,
    workplace_address_label: entrepriseData.address!,
    workplace_address_street_label: entrepriseData.address_detail.acheminement_postal.l4,
    workplace_address_zipcode: entrepriseData.address_detail.code_postal,
    workplace_brand: entrepriseData.establishment_enseigne ?? null,
    workplace_legal_name: entrepriseData.establishment_raison_sociale ?? null,
    workplace_naf_label: entrepriseData.naf_label ?? null,
    workplace_naf_code: entrepriseData.naf_code ?? null,
    workplace_opco: zOpcoLabel.safeParse(opcoData?.opco).data ?? null,
    workplace_idcc: opcoData?.idcc ?? null,
    workplace_size: entrepriseData.establishment_size ?? null,
  }
}

async function resolveRomeCodes(data: IJobOfferApiWriteV3, siretData: WorkplaceSiretData | null, zodError: ZodError): Promise<string[] | null> {
  if (data.offer.rome_codes && data.offer.rome_codes.length > 0) {
    return data.offer.rome_codes
  }

  if (siretData === null) {
    return null
  }

  const romeoResponse = await getRomeInfoSafe({ intitule: data.offer.title, contexte: siretData.workplace_naf_label ?? undefined })
  if (!romeoResponse) {
    zodError.addIssue({ code: "custom", path: ["offer_rome_codes"], message: "ROME is not provided and we are unable to retrieve ROME code for the given job title" })
    return null
  }

  return [romeoResponse]
}

type InvariantFields = "_id" | "created_at" | "partner_label" | "partner_job_id"

async function upsertJobOffer(data: IJobOfferApiWriteV3, identity: IApiAlternanceTokenData, current: IJobsPartnersOfferPrivate | null): Promise<ObjectId> {
  const zodError = new ZodError([])

  const [siretData, addressData] = await Promise.all([
    resolveWorkplaceDataFromSiret(data.workplace.siret, zodError),
    resolveWorkplaceGeoLocationFromAddress(data.workplace.location?.address ?? null, zodError),
  ])

  const offer_rome_codes = await resolveRomeCodes(data, siretData, zodError)

  if (!zodError.isEmpty) {
    throw zodError
  }

  if (!offer_rome_codes || !siretData) {
    throw internal("unexpected: cannot resolve all required data for the job offer")
  }

  const now = new Date()

  const _id = current?._id ?? new ObjectId()
  const invariantData: Pick<IJobsPartnersOfferPrivate, InvariantFields> = {
    _id,
    created_at: current?.created_at ?? now,
    partner_label: identity.organisation!,
    partner_job_id: _id.toString(),
  }

  const defaultOfferExpiration = current?.offer_expiration
    ? current.offer_expiration
    : DateTime.fromJSDate(invariantData.created_at, { zone: "Europe/Paris" }).plus({ months: 2 }).startOf("day").toJSDate()

  const offer_target_diploma_european = data.offer.target_diploma?.european ?? null

  const writableData: Omit<IJobsPartnersOfferPrivate, InvariantFields> = {
    contract_start: data.contract.start,
    contract_duration: data.contract.duration,
    contract_type: data.contract.type,
    contract_remote: data.contract.remote,

    offer_title: data.offer.title,
    offer_rome_codes,
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

    apply_email: data.apply.email,
    apply_url: data.apply.url,
    apply_phone: data.apply.phone,

    updated_at: now,

    // Data derived from workplace_address_label take priority over workplace_siret
    ...siretData,
    workplace_address_label: data.workplace?.location?.address ?? siretData?.workplace_address_label,
    workplace_address_city: siretData?.workplace_address_city,
    workplace_address_street_label: siretData?.workplace_address_street_label,
    workplace_address_zipcode: siretData?.workplace_address_zipcode,
    ...addressData,
  }

  await getDbCollection("jobs_partners").updateOne({ _id: invariantData._id }, { $set: writableData, $setOnInsert: invariantData }, { upsert: true })

  return invariantData._id
}

export async function createJobOffer(identity: IApiAlternanceTokenData, data: IJobOfferApiWriteV3): Promise<ObjectId> {
  return upsertJobOffer(data, identity, null)
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

  await upsertJobOffer(data, identity, current)
}
