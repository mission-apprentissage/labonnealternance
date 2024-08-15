import { IGeoPoint, ILbaCompany, IRecruiter, parseEnum } from "shared"
import { NIVEAUX_POUR_LBA, TRAINING_CONTRACT_TYPE } from "shared/constants"
import { LBA_ITEM_TYPE, allLbaItemType } from "shared/constants/lbaitem"
import { IJobOffer, IJobRecruiterApiFormat, IJobsPartners, JOBPARTNERS_LABEL } from "shared/models/jobsPartners.model"

import { IApiError } from "../common/utils/errorManager"
import { getDbCollection } from "../common/utils/mongodbUtils"
import { trackApiCall } from "../common/utils/sendTrackingEvent"
import config from "../config"

import { getSomeFtJobs } from "./ftjob.service"
import { FTJob } from "./ftjob.service.types"
import { TJobSearchQuery, TLbaItemResult } from "./jobOpportunity.service.types"
import { ILbaItemFtJob, ILbaItemLbaCompany, ILbaItemLbaJob } from "./lbaitem.shared.service.types"
import { getLbaJobs, incrementLbaJobsViewCount } from "./lbajob.service"
import { jobsQueryValidator } from "./queryValidator.service"
import { getSomeCompanies } from "./recruteurLba.service"

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

export const getJobsPartnersFromDB = async ({ radius = 10, romes, opco, latitude, longitude }: IRecruteursLbaSearchParams): Promise<IJobsPartners[] | []> => {
  const query: { offer_rome_code: object; workplace_opco?: string } = {
    offer_rome_code: { $in: romes },
  }

  if (opco) {
    query["workplace.domaine.opco"] = opco
  }

  return (await getDbCollection("jobs_partners")
    .aggregate([
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
    .toArray()) as IJobsPartners[]
}

const convertToGeopoint = (longitude: number, latitude: number): IGeoPoint => ({ type: "Point", coordinates: [longitude, latitude] })

export const formatRecruteurLbaToJobPartner = (recruteursLba: ILbaCompany[]): IJobRecruiterApiFormat[] | [] => {
  if (!recruteursLba.length) return []
  return recruteursLba.map((recruteurLba) => ({
    created_at: recruteurLba.created_at,
    _id: recruteurLba._id,
    workplace: {
      workplace_siret: recruteurLba.siret,
      workplace_website: recruteurLba.website,
      workplace_raison_sociale: recruteurLba.raison_sociale,
      workplace_enseigne: recruteurLba.enseigne,
      workplace_name: null,
      workplace_description: null,
      workplace_size: recruteurLba.company_size,
      workplace_address: `${recruteurLba.street_number} ${recruteurLba.street_name} ${recruteurLba.zip_code} ${recruteurLba.city}`,
      workplace_geopoint: recruteurLba.geopoint!,
      workplace_idcc: null,
      workplace_opco: recruteurLba.opco,
      workplace_naf_code: recruteurLba.naf_code,
      workplace_naf_label: recruteurLba.naf_label,
    },
    apply: {
      apply_url: `${config.publicUrl}/recherche-apprentissage?type=lba&itemId=${recruteurLba.siret}`,
      apply_email: recruteurLba.email,
      apply_phone: recruteurLba.phone,
    },
  }))
}

export const formatOffreEmploiLbaToJobPartner = (offresEmploiLba: IRecruiter[]): IJobOffer[] | [] => {
  if (!offresEmploiLba.length) return []
  return offresEmploiLba.flatMap((offreEmploiLba) =>
    offreEmploiLba.jobs.map((job) => ({
      created_at: job.job_creation_date!,
      _id: job._id.toString(),
      partner_id: null,
      partner_label: JOBPARTNERS_LABEL.OFFRES_EMPLOI_LBA,
      contract: {
        contract_start: job.job_start_date,
        contract_duration: job.job_duration!,
        contract_type: job.job_type,
        contract_remote: null,
      },
      job_offer: {
        offer_title: job.rome_appellation_label!,
        offer_rome_code: job.rome_code,
        offer_description: job.rome_detail!.definition!,
        offer_diploma_level_label: parseEnum(NIVEAUX_POUR_LBA, job.job_level_label),
        offer_desired_skills: job.rome_detail!.competences.savoir_etre_professionnel!.map((x) => x.libelle),
        offer_acquired_skills: job.rome_detail!.competences.savoir_faire!.map((x) => ({ libelle: x.libelle, items: x.items.map((y) => y.libelle) })),
        offer_access_condition: job.rome_detail!.acces_metier,
        offer_creation_date: job.job_creation_date!,
        offer_expiration_date: job.job_expiration_date!,
        offer_count: job.job_count!,
        offer_multicast: job.is_multi_published,
        offer_origin: null,
        offer_status: null,
      },
      workplace: {
        workplace_siret: offreEmploiLba.establishment_siret,
        workplace_website: null,
        workplace_raison_sociale: offreEmploiLba.establishment_raison_sociale!,
        workplace_enseigne: offreEmploiLba.establishment_enseigne!,
        workplace_name: null,
        workplace_description: null,
        workplace_size: offreEmploiLba.establishment_size!,
        workplace_address: offreEmploiLba.address!,
        workplace_geopoint: offreEmploiLba.geopoint!,
        workplace_idcc: offreEmploiLba.idcc ?? null,
        workplace_opco: offreEmploiLba.opco!,
        workplace_naf_code: offreEmploiLba.naf_code!,
        workplace_naf_label: offreEmploiLba.naf_label!,
      },
      apply: {
        apply_url: `${config.publicUrl}/recherche-apprentissage?type=matcha&itemId=${job._id}`,
        apply_email: offreEmploiLba.email,
        apply_phone: offreEmploiLba.phone!,
      },
    }))
  )
}

export const formatOffresEmploiPartenaire = (offresEmploiPartenaire: IJobsPartners[]): IJobOffer[] | [] => {
  if (!offresEmploiPartenaire.length) return []
  return offresEmploiPartenaire.map((offreEmploiPartenaire) => ({
    created_at: offreEmploiPartenaire.created_at,
    _id: offreEmploiPartenaire._id.toString(),
    partner_id: offreEmploiPartenaire.partner_id,
    partner_label: offreEmploiPartenaire.partner_label,
    contract: {
      contract_start: offreEmploiPartenaire.contract_start,
      contract_duration: offreEmploiPartenaire.contract_duration,
      contract_type: offreEmploiPartenaire.contract_type,
      contract_remote: offreEmploiPartenaire.contract_remote,
    },
    job_offer: {
      offer_title: offreEmploiPartenaire.offer_title,
      offer_rome_code: offreEmploiPartenaire.offer_rome_code,
      offer_description: offreEmploiPartenaire.offer_description,
      offer_diploma_level_label: offreEmploiPartenaire.offer_diploma_level_label,
      offer_desired_skills: offreEmploiPartenaire.offer_desired_skills,
      offer_acquired_skills: offreEmploiPartenaire.offer_acquired_skills,
      offer_access_condition: offreEmploiPartenaire.offer_access_condition,
      offer_creation_date: offreEmploiPartenaire.offer_creation_date,
      offer_expiration_date: offreEmploiPartenaire.offer_expiration_date,
      offer_count: offreEmploiPartenaire.offer_count,
      offer_multicast: offreEmploiPartenaire.offer_multicast,
      offer_origin: offreEmploiPartenaire.offer_origin,
      offer_status: offreEmploiPartenaire.offer_status,
    },
    workplace: {
      workplace_siret: offreEmploiPartenaire.workplace_siret,
      workplace_website: offreEmploiPartenaire.workplace_website,
      workplace_raison_sociale: offreEmploiPartenaire.workplace_raison_sociale,
      workplace_enseigne: offreEmploiPartenaire.workplace_enseigne,
      workplace_name: offreEmploiPartenaire.workplace_name,
      workplace_description: offreEmploiPartenaire.workplace_description,
      workplace_size: offreEmploiPartenaire.workplace_size,
      workplace_address: offreEmploiPartenaire.workplace_address,
      workplace_geopoint: offreEmploiPartenaire.workplace_geopoint,
      workplace_idcc: offreEmploiPartenaire.workplace_idcc,
      workplace_opco: offreEmploiPartenaire.workplace_opco,
      workplace_naf_code: offreEmploiPartenaire.workplace_naf_code,
      workplace_naf_label: offreEmploiPartenaire.workplace_naf_label,
    },
    apply: {
      apply_url: `${config.publicUrl}/recherche-apprentissage?type=matcha&itemId=${offreEmploiPartenaire._id}`,
      apply_email: offreEmploiPartenaire.apply_email,
      apply_phone: offreEmploiPartenaire.apply_phone,
    },
  }))
}

export const formatFranceTravailToJobPartner = (offresEmploiFranceTravail: FTJob[]): IJobOffer[] | [] => {
  if (!offresEmploiFranceTravail.length) return []
  return offresEmploiFranceTravail.map((offreFT) => {
    const contractDuration = parseInt(offreFT.typeContratLibelle, 10)
    const contractType = parseEnum(TRAINING_CONTRACT_TYPE, offreFT.natureContrat)
    return {
      created_at: new Date(offreFT.dateCreation),
      _id: offreFT.id.toString(),
      partner_id: null,
      partner_label: JOBPARTNERS_LABEL.OFFRES_EMPLOI_FRANCE_TRAVAIL,
      contract: {
        contract_start: null,
        contract_duration: isNaN(contractDuration) ? null : contractDuration,
        contract_type: contractType ? [contractType] : [],
        contract_remote: null,
      },
      job_offer: {
        offer_title: offreFT.intitule,
        offer_rome_code: [offreFT.romeCode],
        offer_description: offreFT.description,
        offer_diploma_level_label: null,
        offer_desired_skills: null,
        offer_acquired_skills: null,
        offer_access_condition: offreFT.formations ? offreFT.formations?.map((formation) => `${formation.domaineLibelle} - ${formation.niveauLibelle}`) : null,
        offer_creation_date: new Date(offreFT.dateCreation),
        offer_expiration_date: null,
        offer_count: offreFT.nombrePostes,
        offer_multicast: true,
        offer_origin: null,
        offer_status: null,
      },
      workplace: {
        workplace_siret: null,
        workplace_website: null,
        workplace_raison_sociale: offreFT.entreprise.nom,
        workplace_enseigne: offreFT.entreprise.nom,
        workplace_name: offreFT.entreprise.nom,
        workplace_description: offreFT.entreprise.description,
        workplace_size: null,
        workplace_address: offreFT.lieuTravail.libelle,
        workplace_geopoint: convertToGeopoint(parseFloat(offreFT.lieuTravail.longitude), parseFloat(offreFT.lieuTravail.latitude)),
        workplace_idcc: null,
        workplace_opco: null,
        workplace_naf_code: offreFT.codeNAF ? offreFT.codeNAF : null,
        workplace_naf_label: offreFT.secteurActiviteLibelle ? offreFT.secteurActiviteLibelle : null,
      },
      apply: {
        apply_url: offreFT.origineOffre.partenaires[0].url ?? offreFT.origineOffre.urlOrigine,
        apply_email: null,
        apply_phone: null,
      },
    }
  })
}
