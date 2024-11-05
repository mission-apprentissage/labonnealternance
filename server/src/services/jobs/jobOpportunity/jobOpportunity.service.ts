import { badRequest, conflict, internal, notFound } from "@hapi/boom"
import { IApiAlternanceTokenData } from "api-alternance-sdk"
import { DateTime } from "luxon"
import { Document, Filter, ObjectId } from "mongodb"
import { IGeoPoint, IJob, ILbaCompany, IRecruiter, JOB_STATUS_ENGLISH, assertUnreachable, joinNonNullStrings, parseEnum, translateJobStatus } from "shared"
import { NIVEAUX_POUR_LBA, NIVEAUX_POUR_OFFRES_PE, NIVEAU_DIPLOME_LABEL, TRAINING_CONTRACT_TYPE } from "shared/constants"
import { LBA_ITEM_TYPE, allLbaItemType } from "shared/constants/lbaitem"
import {
  IJobsPartnersOfferApi,
  IJobsPartnersOfferPrivate,
  IJobsPartnersRecruiterApi,
  IJobsPartnersWritableApi,
  INiveauDiplomeEuropeen,
  JOBPARTNERS_LABEL,
  ZJobsPartnersRecruiterApi,
} from "shared/models/jobsPartners.model"
import { zOpcoLabel } from "shared/models/opco.model"
import { IJobOpportunityGetQuery, IJobOpportunityGetQueryResolved, IJobsOpportunityResponse } from "shared/routes/jobOpportunity.routes"
import { ZodError } from "zod"

import { sentryCaptureException } from "@/common/utils/sentryUtils"
import { getRomeFromRomeo } from "@/services/cache.service"
import { getEntrepriseDataFromSiret, getGeoPoint, getOpcoData } from "@/services/etablissement.service"

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
  | { peJobs: TLbaItemResult<ILbaItemFtJob> | null; matchas: TLbaItemResult<ILbaItemLbaJob> | null; lbaCompanies: TLbaItemResult<ILbaItemLbaCompany> | null; lbbCompanies: null }
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

    const [peJobs, lbaCompanies, matchas] = await Promise.all([
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
    ])

    return { peJobs, matchas, lbaCompanies, lbbCompanies: null }
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
  | { peJobs: TLbaItemResult<ILbaItemFtJob> | null; matchas: TLbaItemResult<ILbaItemLbaJob> | null; lbaCompanies: TLbaItemResult<ILbaItemLbaCompany> | null; lbbCompanies: null }
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

  if (query.caller) {
    trackApiCall({ caller: query.caller, job_count, result_count: job_count, api_path: "jobV1/jobs", response: "OK" })
  }

  return result
}

export const getJobsPartnersFromDB = async ({ romes, geo, target_diploma_level }: IJobOpportunityGetQueryResolved): Promise<IJobsPartnersOfferApi[]> => {
  const query: Filter<IJobsPartnersOfferPrivate> = {
    offer_multicast: true,
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
              maxDistance: geo.radius * 1000,
              query,
            },
          },
          { $sort: { distance: 1, offer_creation: -1 } },
        ]

  const jobsPartners = await getDbCollection("jobs_partners")
    .aggregate<IJobsPartnersOfferPrivate>([
      ...filterStages,
      {
        $limit: 150,
      },
    ])
    .toArray()

  return jobsPartners.map((j) => ({
    ...j,
    contract_type: j.contract_type ?? [TRAINING_CONTRACT_TYPE.APPRENTISSAGE, TRAINING_CONTRACT_TYPE.PROFESSIONNALISATION],
    apply_url: j.apply_url ?? `${config.publicUrl}/recherche-apprentissage?type=partner&itemId=${j._id}`,
  }))
}

const convertToGeopoint = ({ longitude, latitude }: { longitude: number; latitude: number }): IGeoPoint => ({ type: "Point", coordinates: [longitude, latitude] })

function convertOpco(recruteurLba: Pick<ILbaCompany | IRecruiter, "opco">): IJobsPartnersRecruiterApi["workplace_opco"] {
  const r = ZJobsPartnersRecruiterApi.shape.workplace_opco.safeParse(recruteurLba.opco)
  if (r.success) {
    return r.data
  }

  return null
}

export const convertLbaCompanyToJobPartnerRecruiterApi = (recruteursLba: ILbaCompany[]): IJobsPartnersRecruiterApi[] => {
  return recruteursLba.map(
    (recruteurLba): IJobsPartnersRecruiterApi => ({
      _id: recruteurLba._id,
      workplace_siret: recruteurLba.siret,
      workplace_website: recruteurLba.website,
      workplace_name: recruteurLba.enseigne ?? recruteurLba.raison_sociale,
      workplace_brand: recruteurLba.enseigne,
      workplace_legal_name: recruteurLba.raison_sociale,
      workplace_description: null,
      workplace_size: recruteurLba.company_size,
      workplace_address_label: joinNonNullStrings([recruteurLba.street_number, recruteurLba.street_name, recruteurLba.zip_code, recruteurLba.city]),
      workplace_address_street_label: joinNonNullStrings([recruteurLba.street_number, recruteurLba.street_name]),
      workplace_address_zipcode: recruteurLba.zip_code,
      workplace_address_city: recruteurLba.city,
      workplace_address_country: "France",
      workplace_geopoint: recruteurLba.geopoint!,
      workplace_idcc: null,
      workplace_opco: convertOpco(recruteurLba),
      workplace_naf_code: recruteurLba.naf_code,
      workplace_naf_label: recruteurLba.naf_label,
      apply_url: `${config.publicUrl}/recherche-apprentissage?type=lba&itemId=${recruteurLba.siret}`,
      apply_phone: recruteurLba.phone,
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

export const convertLbaRecruiterToJobPartnerOfferApi = (offresEmploiLba: IJobResult[]): IJobsPartnersOfferApi[] => {
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
        ({ recruiter, job }: IJobResult): IJobsPartnersOfferApi => ({
          _id: job._id.toString(),
          partner_label: JOBPARTNERS_LABEL.OFFRES_EMPLOI_LBA,
          partner_job_id: null,
          contract_start: job.job_start_date,
          contract_duration: job.job_duration ?? null,
          contract_type: job.job_type,
          contract_remote: null,
          offer_title: job.rome_label!,
          offer_rome_codes: job.rome_code,
          offer_description: job.rome_detail.definition,
          offer_target_diploma: getDiplomaEuropeanLevel(job),
          offer_desired_skills: job.rome_detail.competences.savoir_etre_professionnel?.map((x) => x.libelle) ?? [],
          offer_to_be_acquired_skills: job.rome_detail.competences.savoir_faire?.flatMap((x) => x.items.map((y) => `${x.libelle}: ${y.libelle}`)) ?? [],
          offer_access_conditions: job.rome_detail.acces_metier.split("\n"),
          offer_creation: job.job_creation_date ?? null,
          offer_expiration: job.job_expiration_date ?? null,
          offer_opening_count: job.job_count ?? 1,
          offer_status: translateJobStatus(job.job_status),

          workplace_siret: recruiter.establishment_siret,
          workplace_website: null,
          workplace_name: recruiter.establishment_enseigne ?? recruiter.establishment_raison_sociale ?? null,
          workplace_brand: recruiter.establishment_enseigne ?? null,
          workplace_legal_name: recruiter.establishment_raison_sociale ?? null,
          workplace_description: null,
          workplace_size: recruiter.establishment_size ?? null,
          workplace_address_city: recruiter.address_detail.localite, //TODO, différents f,ormats possible, voir à utiliser helper construisant address
          workplace_address_zipcode: recruiter.address_detail.code_postal,
          workplace_address_label: recruiter.address!,
          workplace_address_street_label: joinNonNullStrings([recruiter.address_detail.numero_voie, recruiter.address_detail.type_voie, recruiter.address_detail.nom_voie]),
          workplace_address_country: "France",
          workplace_geopoint: recruiter.geopoint!,
          workplace_idcc: recruiter.idcc ? (Number.isNaN(parseInt(recruiter.idcc, 10)) ? null : parseInt(recruiter.idcc, 10)) : null,
          workplace_opco: convertOpco(recruiter),
          workplace_naf_code: recruiter.naf_code ?? null,
          workplace_naf_label: recruiter.naf_label ?? null,

          apply_url: `${config.publicUrl}/recherche-apprentissage?type=matcha&itemId=${job._id}`,
          apply_phone: recruiter.phone ?? null,
        })
      )
  )
}

export const convertFranceTravailJobToJobPartnerOfferApi = (offresEmploiFranceTravail: FTJob[]): IJobsPartnersOfferApi[] => {
  return offresEmploiFranceTravail
    .filter((j) => {
      // TODO: Temporary fix for missing geopoint
      return j.lieuTravail.latitude != null && j.lieuTravail.longitude != null
    })
    .map((offreFT): IJobsPartnersOfferApi => {
      const contractDuration = parseInt(offreFT.typeContratLibelle, 10)
      const contractType = parseEnum(TRAINING_CONTRACT_TYPE, offreFT.natureContrat)
      return {
        _id: null,
        partner_job_id: offreFT.id,
        partner_label: JOBPARTNERS_LABEL.OFFRES_EMPLOI_FRANCE_TRAVAIL,

        contract_start: null,
        contract_duration: isNaN(contractDuration) ? null : contractDuration,
        contract_type: contractType ? [contractType] : [],
        contract_remote: null,

        offer_title: offreFT.intitule,
        offer_rome_codes: [offreFT.romeCode],
        offer_description: offreFT.description,
        offer_target_diploma: null,
        offer_desired_skills: [],
        offer_to_be_acquired_skills: [],
        offer_access_conditions: offreFT.formations ? offreFT.formations?.map((formation) => `${formation.domaineLibelle} - ${formation.niveauLibelle}`) : [],
        offer_creation: new Date(offreFT.dateCreation),
        offer_expiration: null,
        offer_opening_count: offreFT.nombrePostes,
        offer_status: JOB_STATUS_ENGLISH.ACTIVE,

        // Try to find entreprise SIRET from  offreFT.entreprise.siret ?
        workplace_siret: null,
        workplace_brand: null,
        workplace_legal_name: null,
        workplace_website: null,
        workplace_name: offreFT.entreprise.nom,
        workplace_description: offreFT.entreprise.description,
        workplace_size: null,
        workplace_address_city: offreFT.lieuTravail.commune || null,
        workplace_address_label: offreFT.lieuTravail.libelle,
        workplace_address_street_label: offreFT.lieuTravail.libelle,
        workplace_address_zipcode: offreFT.lieuTravail.codePostal || null,
        workplace_address_country: "France",
        workplace_geopoint: convertToGeopoint({
          longitude: parseFloat(offreFT.lieuTravail.longitude!),
          latitude: parseFloat(offreFT.lieuTravail.latitude!),
        }),
        workplace_idcc: null,
        // TODO: try to map opco from FT formation requirement
        workplace_opco: null,
        workplace_naf_code: offreFT.codeNAF ? offreFT.codeNAF : null,
        workplace_naf_label: offreFT.secteurActiviteLibelle ? offreFT.secteurActiviteLibelle : null,

        apply_url: offreFT.origineOffre.partenaires?.[0]?.url ?? offreFT.origineOffre.urlOrigine,
        apply_phone: null,
      }
    })
}

async function findFranceTravailOpportunities(query: IJobOpportunityGetQueryResolved, context: JobOpportunityRequestContext): Promise<IJobsPartnersOfferApi[]> {
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

  return convertFranceTravailJobToJobPartnerOfferApi(ftJobs.resultats)
}

async function findLbaJobOpportunities(query: IJobOpportunityGetQueryResolved): Promise<IJobsPartnersOfferApi[]> {
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

  return convertLbaRecruiterToJobPartnerOfferApi(lbaJobs)
}

async function resolveQuery(query: IJobOpportunityGetQuery): Promise<IJobOpportunityGetQueryResolved> {
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

export async function findJobsOpportunities(payload: IJobOpportunityGetQuery, context: JobOpportunityRequestContext): Promise<IJobsOpportunityResponse> {
  const resolvedQuery = await resolveQuery(payload)

  const [recruterLba, offreEmploiLba, offreEmploiPartenaire, franceTravail] = await Promise.all([
    getRecruteursLbaFromDB(resolvedQuery),
    findLbaJobOpportunities(resolvedQuery),
    getJobsPartnersFromDB(resolvedQuery),
    findFranceTravailOpportunities(resolvedQuery, context),
  ])

  return {
    jobs: [...offreEmploiLba, ...franceTravail, ...offreEmploiPartenaire],
    recruiters: convertLbaCompanyToJobPartnerRecruiterApi(recruterLba),
    warnings: context.getWarnings(),
  }
}

type WorkplaceAddressData = Pick<IJobsPartnersOfferApi, "workplace_geopoint" | "workplace_address_country">

async function resolveWorkplaceGeoLocationFromAddress(
  workplace_address_label: string | null,
  workplace_address_street_label: string | null,
  workplace_address_city: string | null,
  workplace_address_zipcode: string | null,
  zodError: ZodError
): Promise<WorkplaceAddressData | null> {
  const consolidatedAddress = joinNonNullStrings([workplace_address_street_label, workplace_address_zipcode, workplace_address_city])
  if (workplace_address_label === null && consolidatedAddress === null) {
    return null
  }

  const geopoint = await getGeoPoint((consolidatedAddress || workplace_address_label)!)

  if (!geopoint) {
    zodError.addIssue({ code: "custom", path: ["workplace_geopoint"], message: "Cannot resolve geo-coordinates for the given address" })
    return null
  }

  return {
    workplace_geopoint: geopoint,
    workplace_address_country: "France",
  }
}

// List of fields impacted by change of the siret
type WorkplaceSiretData = Pick<
  IJobsPartnersOfferApi,
  | "workplace_geopoint"
  | "workplace_address_label"
  | "workplace_address_street_label"
  | "workplace_address_country"
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
    workplace_address_city: entrepriseData.address_detail.commune,
    workplace_address_label: entrepriseData.address!,
    workplace_address_street_label: entrepriseData.address_detail.l4,
    workplace_address_zipcode: entrepriseData.address_detail.code_postal,
    workplace_address_country: entrepriseData.address_detail.libelle_pays_etranger ?? "France",
    workplace_brand: entrepriseData.establishment_enseigne ?? null,
    workplace_legal_name: entrepriseData.establishment_raison_sociale ?? null,
    workplace_naf_label: entrepriseData.naf_label ?? null,
    workplace_naf_code: entrepriseData.naf_code ?? null,
    workplace_opco: zOpcoLabel.safeParse(opcoData?.opco).data ?? null,
    // En cas d'OPCO multiple on met une string invalide dans le champs idcc (getOpcoFromCfaDock)
    workplace_idcc: opcoData?.idcc == null || Number.isNaN(parseInt(opcoData.idcc, 10)) ? null : parseInt(opcoData.idcc, 10),
    workplace_size: entrepriseData.establishment_size ?? null,
  }
}

async function resolveRomeCodes(data: IJobsPartnersWritableApi, siretData: WorkplaceSiretData | null, zodError: ZodError): Promise<string[] | null> {
  if (data.offer_rome_codes && data.offer_rome_codes.length > 0) {
    return data.offer_rome_codes
  }

  if (siretData === null) {
    return null
  }

  const romeoResponse = await getRomeFromRomeo({ intitule: data.offer_title, contexte: siretData.workplace_naf_label ?? undefined })
  if (!romeoResponse) {
    zodError.addIssue({ code: "custom", path: ["offer_rome_codes"], message: "ROME is not provided and we are unable to retrieve ROME code for the given job title" })
    return null
  }

  return [romeoResponse]
}

type InvariantFields = "_id" | "created_at" | "partner_label"

async function upsertJobOffer(data: IJobsPartnersWritableApi, identity: IApiAlternanceTokenData, current: IJobsPartnersOfferPrivate | null): Promise<ObjectId> {
  const zodError = new ZodError([])

  const {
    offer_creation,
    offer_expiration,
    offer_rome_codes,
    offer_status,
    offer_target_diploma_european,
    workplace_address_label,
    workplace_address_street_label,
    workplace_address_city,
    workplace_address_zipcode,
    workplace_address_country,
    ...rest
  } = data

  const [siretData, addressData] = await Promise.all([
    resolveWorkplaceDataFromSiret(data.workplace_siret as string, zodError),
    resolveWorkplaceGeoLocationFromAddress(workplace_address_label, workplace_address_street_label, workplace_address_city, workplace_address_zipcode, zodError),
  ])

  const romeCode = await resolveRomeCodes(data, siretData, zodError)

  if (!zodError.isEmpty) {
    throw zodError
  }

  if (!romeCode || !siretData) {
    throw internal("unexpected: cannot resolve all required data for the job offer")
  }

  const now = new Date()

  const invariantData: Pick<IJobsPartnersOfferPrivate, InvariantFields> = {
    _id: current?._id ?? new ObjectId(),
    created_at: current?.created_at ?? now,
    partner_label: identity.organisation!,
  }

  const defaultOfferExpiration = current?.offer_expiration
    ? current.offer_expiration
    : DateTime.fromJSDate(invariantData.created_at, { zone: "Europe/Paris" }).plus({ months: 2 }).startOf("day").toJSDate()

  const writableData: Omit<IJobsPartnersOfferPrivate, InvariantFields> = {
    offer_rome_codes: romeCode,
    offer_status: offer_status ?? JOB_STATUS_ENGLISH.ACTIVE,
    offer_creation: offer_creation ?? invariantData.created_at,
    offer_expiration: offer_expiration || defaultOfferExpiration,
    offer_target_diploma:
      offer_target_diploma_european == null
        ? null
        : {
            european: offer_target_diploma_european,
            label: NIVEAU_DIPLOME_LABEL[offer_target_diploma_european],
          },
    updated_at: now,
    ...rest,
    // Data derived from workplace_address take priority over workplace_siret
    ...siretData,
    workplace_address_label: workplace_address_label ?? siretData?.workplace_address_label,
    workplace_address_city: workplace_address_city ?? siretData?.workplace_address_city,
    workplace_address_street_label: workplace_address_street_label ?? siretData?.workplace_address_street_label,
    workplace_address_zipcode: workplace_address_zipcode ?? siretData?.workplace_address_zipcode,
    workplace_address_country: workplace_address_country ?? siretData?.workplace_address_country,
    ...addressData,
  }

  await getDbCollection("jobs_partners").updateOne({ _id: invariantData._id }, { $set: writableData, $setOnInsert: invariantData }, { upsert: true })

  return invariantData._id
}

export async function createJobOffer(identity: IApiAlternanceTokenData, data: IJobsPartnersWritableApi): Promise<ObjectId> {
  const { partner_job_id } = data
  const { organisation } = identity
  const exist = await getDbCollection("jobs_partners").findOne<IJobsPartnersOfferPrivate>({ partner_label: organisation!, partner_job_id })
  if (exist) {
    throw conflict("Job already exist")
  }
  return upsertJobOffer(data, identity, null)
}

export async function updateJobOffer(id: ObjectId, identity: IApiAlternanceTokenData, data: IJobsPartnersWritableApi): Promise<void> {
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
