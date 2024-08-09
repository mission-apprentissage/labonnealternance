import { IGeoPoint, ILbaCompany, IRecruiter } from "shared"
import { LBA_ITEM_TYPE, allLbaItemType } from "shared/constants/lbaitem"
import { IJobOffer, IJobOfferFranceTravail, IJobsPartners, JOBPARTNERS_LABEL } from "shared/models/jobsPartners.model"

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
  const query: { "job_offer.rome_code": object; "workplace.domaine.opco"?: string } = {
    "job_offer.rome_code": { $in: romes },
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

export const formatRecruteurLbaToJobPartner = (recruteursLba: ILbaCompany[]): IJobOffer[] | [] => {
  if (!recruteursLba.length) return []
  return recruteursLba.map((recruteurLba) => ({
    created_at: recruteurLba.created_at,
    _id: recruteurLba._id,
    raw_id: recruteurLba._id.toString(),
    partner_label: JOBPARTNERS_LABEL.RECRUTEURS_LBA,
    contract: null,
    job_offer: null,
    workplace: {
      siret: recruteurLba.siret,
      website: recruteurLba.website,
      raison_sociale: recruteurLba.raison_sociale,
      enseigne: recruteurLba.enseigne,
      name: null,
      description: null,
      size: recruteurLba.company_size,
      location: {
        address: `${recruteurLba.street_number} ${recruteurLba.street_name} ${recruteurLba.zip_code} ${recruteurLba.city}`,
        geopoint: recruteurLba.geopoint!,
      },
      domaine: {
        idcc: null,
        opco: recruteurLba.opco,
        naf: {
          code: recruteurLba.naf_code,
          label: recruteurLba.naf_label,
          origin: null,
        },
      },
    },
    apply: {
      url: `${config.publicUrl}/recherche-apprentissage?type=lba&itemId=${recruteurLba.siret}`,
      email: recruteurLba.email,
      phone: recruteurLba.phone,
    },
  }))
}

export const formatOffreEmploiLbaToJobPartner = (offresEmploiLba: IRecruiter[]): IJobOffer[] | [] => {
  if (!offresEmploiLba.length) return []
  return offresEmploiLba.flatMap((offreEmploiLba) =>
    offreEmploiLba.jobs.map((job) => ({
      created_at: job.job_creation_date!,
      _id: job._id,
      raw_id: job._id.toString(),
      partner_label: JOBPARTNERS_LABEL.OFFRES_EMPLOI_LBA,
      contract: {
        start: job.job_start_date,
        duration: job.job_duration!.toString(),
        type: job.job_type,
        remote: null,
      },
      job_offer: {
        title: job.rome_appellation_label!,
        rome_code: job.rome_code,
        description: job.rome_detail!.definition!,
        diploma_level_label: job.job_level_label!,
        desired_skills: job.rome_detail!.competences.savoir_etre_professionnel!.map((x) => x.libelle),
        acquired_skills: job.rome_detail!.competences.savoir_faire!.map((x) => ({ libelle: x.libelle, items: x.items.map((y) => y.libelle) })),
        access_condition: job.rome_detail!.acces_metier,
        publication: {
          creation_date: job.job_creation_date!,
          expiration_date: job.job_expiration_date!,
        },
        meta: {
          count: job.job_count!,
          multicast: job.is_multi_published,
          origin: null,
        },
      },
      workplace: {
        siret: offreEmploiLba.establishment_siret,
        website: null,
        raison_sociale: offreEmploiLba.establishment_raison_sociale!,
        enseigne: offreEmploiLba.establishment_enseigne!,
        name: null,
        description: null,
        size: offreEmploiLba.establishment_size!,
        location: {
          address: offreEmploiLba.address!,
          geopoint: offreEmploiLba.geopoint!,
        },
        domaine: {
          idcc: Number(offreEmploiLba.idcc) ?? null,
          opco: offreEmploiLba.opco!,
          naf: {
            code: offreEmploiLba.naf_code!,
            label: offreEmploiLba.naf_label!,
          },
        },
      },
      apply: {
        url: `${config.publicUrl}/recherche-apprentissage?type=matcha&itemId=${job._id}`,
        email: offreEmploiLba.email,
        phone: offreEmploiLba.phone!,
      },
    }))
  )
}

export const formatFranceTravailToJobPartner = (offresEmploiFranceTravail: FTJob[]): IJobOfferFranceTravail[] | [] => {
  if (!offresEmploiFranceTravail.length) return []
  return offresEmploiFranceTravail.map((offreFT) => ({
    created_at: new Date(offreFT.dateCreation),
    _id: null,
    raw_id: offreFT.id,
    partner_label: JOBPARTNERS_LABEL.OFFRES_EMPLOI_FRANCE_TRAVAIL,
    contract: {
      start: null,
      duration: offreFT.typeContratLibelle,
      type: [offreFT.natureContrat],
      remote: null,
    },
    job_offer: {
      title: offreFT.intitule,
      rome_code: [offreFT.romeCode],
      description: offreFT.description,
      diploma_level_label: null,
      desired_skills: null,
      acquired_skills: null,
      access_condition: offreFT.formations ? offreFT.formations?.map((formation) => `${formation.domaineLibelle} - ${formation.niveauLibelle}`) : null,
      publication: {
        creation_date: new Date(offreFT.dateCreation),
        expiration_date: null,
      },
      meta: {
        count: offreFT.nombrePostes,
        multicast: true,
        origin: null,
      },
    },
    workplace: {
      siret: null,
      website: null,
      raison_sociale: offreFT.entreprise.nom,
      enseigne: offreFT.entreprise.nom,
      name: offreFT.entreprise.nom,
      description: offreFT.entreprise.description,
      size: null,
      location: {
        address: offreFT.lieuTravail.libelle,
        geopoint: convertToGeopoint(parseFloat(offreFT.lieuTravail.longitude), parseFloat(offreFT.lieuTravail.latitude)),
      },
      domaine: {
        idcc: null,
        opco: null,
        naf: {
          code: offreFT.codeNAF ? offreFT.codeNAF : null,
          label: offreFT.secteurActiviteLibelle ? offreFT.secteurActiviteLibelle : null,
        },
      },
    },
    apply: {
      url: offreFT.origineOffre.partenaires[0].url ?? offreFT.origineOffre.urlOrigine,
      email: null,
      phone: null,
    },
  }))
}
