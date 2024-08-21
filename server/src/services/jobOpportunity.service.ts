import Boom from "boom"
import { assertUnreachable, IGeoPoint, IJob, ILbaCompany, IRecruiter, parseEnum } from "shared"
import { NIVEAUX_POUR_LBA, TRAINING_CONTRACT_TYPE } from "shared/constants"
import { LBA_ITEM_TYPE, allLbaItemType } from "shared/constants/lbaitem"
import {
  IJobsPartnersRecruiterApi,
  IJobsPartnersOfferPrivate,
  JOBPARTNERS_LABEL,
  IJobsPartnersOfferApi,
  IJobsOpportunityResponse,
  ZJobsPartnersRecruiterApi,
} from "shared/models/jobsPartners.model"
import { IRouteSchema } from "shared/routes/common.routes"
import { IJobOpportunityRncp, IJobOpportunityRome } from "shared/routes/jobOpportunity.routes"

import { IApiError } from "../common/utils/errorManager"
import { getDbCollection } from "../common/utils/mongodbUtils"
import { trackApiCall } from "../common/utils/sendTrackingEvent"
import config from "../config"

import { getRomesFromRncp } from "./certification.service"
import { getFtJobsV2, getSomeFtJobs } from "./ftjob.service"
import { FTJob } from "./ftjob.service.types"
import { TJobSearchQuery, TLbaItemResult } from "./jobOpportunity.service.types"
import { ILbaItemFtJob, ILbaItemLbaCompany, ILbaItemLbaJob } from "./lbaitem.shared.service.types"
import { getJobs, getLbaJobs, incrementLbaJobsViewCount } from "./lbajob.service"
import { jobsQueryValidator } from "./queryValidator.service"
import { getRecruteursLbaFromDB, getSomeCompanies } from "./recruteurLba.service"

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

type IRecruteursLbaSearchParams = {
  romes: string[]
  latitude: number
  longitude: number
  radius: number
  opco?: string
  opcoUrl?: string
}

export const getJobsPartnersFromDB = async ({ radius = 10, romes, opco, latitude, longitude }: IRecruteursLbaSearchParams): Promise<IJobsPartnersOfferPrivate[]> => {
  const query: { offer_rome_code: object; workplace_opco?: string } = {
    offer_rome_code: { $in: romes },
  }

  if (opco) {
    query["workplace.domaine.opco"] = opco
  }

  return await getDbCollection("jobs_partners")
    .aggregate<IJobsPartnersOfferPrivate>([
      {
        $geoNear: {
          near: { type: "Point", coordinates: [longitude, latitude] },
          distanceField: "distance",
          maxDistance: radius * 1000,
          query,
        },
      },
      {
        $limit: 150,
      },
    ])
    .toArray()
}

const convertToGeopoint = ({ longitude, latitude }: { longitude: number; latitude: number }): IGeoPoint => ({ type: "Point", coordinates: [longitude, latitude] })

function convertOpco(recruteurLba: ILbaCompany | IRecruiter): IJobsPartnersRecruiterApi["workplace_opco"] {
  const r = ZJobsPartnersRecruiterApi.shape.workplace_opco.safeParse(recruteurLba.opco)
  if (r.success) {
    return r.data
  }

  // Currently in database we have things such as "Sélectionnez un OPCO" or "Opco multiple"
  return null
}

export const convertLbaCompanyToJobPartnerRecruiterApi = (recruteursLba: ILbaCompany[]): IJobsPartnersRecruiterApi[] => {
  return recruteursLba.map(
    (recruteurLba): IJobsPartnersRecruiterApi => ({
      _id: recruteurLba._id,
      workplace_siret: recruteurLba.siret,
      workplace_website: recruteurLba.website,
      workplace_name: null,
      workplace_description: null,
      workplace_size: recruteurLba.company_size,
      workplace_address: {
        label: `${recruteurLba.street_number} ${recruteurLba.street_name} ${recruteurLba.zip_code} ${recruteurLba.city}`,
      },
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

function getDiplomaEuropeanLevel(job: IJob): IJobsPartnersOfferApi["offer_diploma_level"] {
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

export const convertLbaRecruiterToJobPartnerOfferApi = (offresEmploiLba: IRecruiter[]): IJobsPartnersOfferApi[] => {
  return offresEmploiLba.flatMap((offreEmploiLba): IJobsPartnersOfferApi[] =>
    offreEmploiLba.jobs.map(
      (job): IJobsPartnersOfferApi => ({
        _id: job._id.toString(),
        partner: JOBPARTNERS_LABEL.OFFRES_EMPLOI_LBA,
        partner_job_id: null,
        contract_start: job.job_start_date,
        contract_duration: job.job_duration!,
        contract_type: job.job_type,
        contract_remote: null,
        offer_title: job.rome_appellation_label!,
        offer_rome_code: job.rome_code,
        offer_description: job.rome_detail!.definition!,
        offer_diploma_level: getDiplomaEuropeanLevel(job),
        offer_desired_skills: job.rome_detail!.competences.savoir_etre_professionnel!.map((x) => x.libelle),
        offer_to_be_acquired_skills: job.rome_detail!.competences.savoir_faire!.flatMap((x) => x.items.map((y) => `${x.libelle}: ${y.libelle}`)),
        offer_access_conditions: job.rome_detail!.acces_metier.split("\n"),
        offer_creation: job.job_creation_date!,
        offer_expiration: job.job_expiration_date!,
        offer_opening_count: job.job_count!,

        workplace_siret: offreEmploiLba.establishment_siret,
        workplace_website: null,
        workplace_name: offreEmploiLba.establishment_enseigne ?? offreEmploiLba.establishment_raison_sociale!,
        workplace_description: null,
        workplace_size: offreEmploiLba.establishment_size!,
        workplace_address: {
          label: offreEmploiLba.address!,
        },
        workplace_geopoint: offreEmploiLba.geopoint!,
        workplace_idcc: Number(offreEmploiLba.idcc) ?? null,
        workplace_opco: convertOpco(offreEmploiLba),
        workplace_naf_code: offreEmploiLba.naf_code!,
        workplace_naf_label: offreEmploiLba.naf_label!,

        apply_url: `${config.publicUrl}/recherche-apprentissage?type=matcha&itemId=${job._id}`,
        apply_phone: offreEmploiLba.phone!,
      })
    )
  )
}

export const convertFranceTravailJobToJobPartnerOfferApi = (offresEmploiFranceTravail: FTJob[]): IJobsPartnersOfferApi[] => {
  return offresEmploiFranceTravail.map((offreFT): IJobsPartnersOfferApi => {
    const contractDuration = parseInt(offreFT.typeContratLibelle, 10)
    const contractType = parseEnum(TRAINING_CONTRACT_TYPE, offreFT.natureContrat)
    return {
      _id: null,
      partner_job_id: offreFT.id,
      partner: JOBPARTNERS_LABEL.OFFRES_EMPLOI_FRANCE_TRAVAIL,

      contract_start: null,
      contract_duration: isNaN(contractDuration) ? null : contractDuration,
      contract_type: contractType ? [contractType] : [],
      contract_remote: null,

      offer_title: offreFT.intitule,
      offer_rome_code: [offreFT.romeCode],
      offer_description: offreFT.description,
      offer_diploma_level: null,
      offer_desired_skills: null,
      offer_to_be_acquired_skills: null,
      offer_access_conditions: offreFT.formations ? offreFT.formations?.map((formation) => `${formation.domaineLibelle} - ${formation.niveauLibelle}`) : null,
      offer_creation: new Date(offreFT.dateCreation),
      offer_expiration: null,
      offer_opening_count: offreFT.nombrePostes,

      workplace_siret: null,
      workplace_website: null,
      workplace_name: offreFT.entreprise.nom,
      workplace_description: offreFT.entreprise.description,
      workplace_size: null,
      workplace_address: { label: offreFT.lieuTravail.libelle },
      workplace_geopoint: convertToGeopoint({ longitude: parseFloat(offreFT.lieuTravail.longitude), latitude: parseFloat(offreFT.lieuTravail.latitude) }),
      workplace_idcc: null,
      workplace_opco: null,
      workplace_naf_code: offreFT.codeNAF ? offreFT.codeNAF : null,
      workplace_naf_label: offreFT.secteurActiviteLibelle ? offreFT.secteurActiviteLibelle : null,

      apply_url: offreFT.origineOffre.partenaires[0].url ?? offreFT.origineOffre.urlOrigine,
      apply_phone: null,
    }
  })
}

export async function findJobsOpportunityResponseFromRome(payload: IJobOpportunityRome, context: { route: IRouteSchema; caller: string }): Promise<IJobsOpportunityResponse> {
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
    getFtJobsV2({ jobLimit: 150, caller: context.caller, api: context.route.path, ...payload, insee: payload.insee ?? undefined }),
  ])

  return {
    jobs: [...convertLbaRecruiterToJobPartnerOfferApi(offreEmploiLba), ...convertFranceTravailJobToJobPartnerOfferApi(franceTravail.resultats), ...offreEmploiPartenaire],
    recruiters: convertLbaCompanyToJobPartnerRecruiterApi(recruterLba),
  }
}

export async function findJobsOpportunityResponseFromRncp(payload: IJobOpportunityRncp, context: { route: IRouteSchema; caller: string }): Promise<IJobsOpportunityResponse> {
  const { rncp, ...rest } = payload
  const romes = await getRomesFromRncp(rncp)
  if (!romes) {
    throw Boom.internal(`Aucun code ROME n'a été trouvé à partir du code RNCP ${payload.rncp}`)
  }

  return findJobsOpportunityResponseFromRome({ romes, ...rest }, context)
}
